import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MediaResource } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import { PlaybackBar } from "./PlaybackBar";
import { ScriptLine } from "../ScriptLine";
import { viewerStyle } from "../../styles/viewerStyle";
import { resolveLinePlaybackRange } from "./linePlayback";
import {
  formatPlaybackTime,
  getLoopRangePercentages,
  getLoopRangeVisualStyle,
  getPlaybackProgressPercentage,
  isLineCurrentlyPlaying,
} from "./playbackDisplay";
import {
  PLAYBACK_RATES,
  getClampedSkipTime,
  getSelectedLoopRangeToStart,
  hasPlaybackEnteredRange,
  getTimeUpdateDecision,
  initialPlaybackState,
  parseStoredContinuous,
  parseStoredPlaybackRate,
  playbackReducer,
  type LinePlaybackRange,
  type PlaybackState,
} from "./playbackState";
import type { PlaybackController } from "./usePlaybackController";
import { dispatchLineLoopSelection } from "./usePlaybackController";
import { activateLinePlaybackControl } from "./linePlaybackControl";

const firstRange: LinePlaybackRange = {
  type: "line",
  lineId: "line-1",
  mediaResourceId: "audio-1",
  mediaSource: "/one.mp3",
  start: 10,
  end: 15,
};

const secondRange: LinePlaybackRange = {
  ...firstRange,
  lineId: "line-2",
  start: 20,
  end: 25,
};

function reduce(state: PlaybackState, ...actions: Parameters<typeof playbackReducer>[1][]) {
  return actions.reduce(playbackReducer, state);
}

test("starts paused with reset, non-persistent playback state", () => {
  assert.deepEqual(initialPlaybackState, {
    mediaResourceId: null,
    mediaSource: null,
    playing: false,
    currentTime: 0,
    duration: null,
    playbackRate: 1,
    continuous: false,
    loopEnabled: false,
    selectedLoopRange: null,
    activeLine: null,
    loopRangeEngaged: false,
  });
});

test("global play, pause, and resume retain the current position", () => {
  const playing = reduce(
    initialPlaybackState,
    { type: "setSource", mediaResourceId: "audio-1", mediaSource: "/one.mp3", playing: true },
    { type: "setCurrentTime", currentTime: 7 },
  );
  const paused = playbackReducer(playing, { type: "setPlaying", playing: false });
  const resumed = playbackReducer(paused, { type: "setPlaying", playing: true });
  assert.equal(resumed.currentTime, 7);
  assert.equal(resumed.playing, true);
});

test("line play restarts at the line start", () => {
  const state = playbackReducer(
    { ...initialPlaybackState, currentTime: 13 },
    { type: "playLine", range: firstRange },
  );
  assert.equal(state.currentTime, 10);
  assert.equal(state.playing, true);
  assert.equal(state.activeLine?.lineId, "line-1");
});

test("continuous OFF stops at line end while ON continues", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  assert.deepEqual(getTimeUpdateDecision(linePlaying, 15), { type: "pause", time: 15 });
  const continuous = playbackReducer(linePlaying, { type: "setContinuous", continuous: true });
  assert.deepEqual(getTimeUpdateDecision(continuous, 15), { type: "continue" });
});

test("reaching a line boundary releases it so global Play can continue from that time", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  const stopped = playbackReducer(linePlaying, { type: "lineBoundaryReached", currentTime: 15 });
  const resumed = playbackReducer(stopped, { type: "setPlaying", playing: true });
  assert.equal(stopped.activeLine, null);
  assert.equal(stopped.currentTime, 15);
  assert.equal(getTimeUpdateDecision(resumed, 15).type, "continue");
});

test("continuous changes immediately affect an active line boundary", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  const on = playbackReducer(linePlaying, { type: "setContinuous", continuous: true });
  const off = playbackReducer(on, { type: "setContinuous", continuous: false });
  assert.equal(getTimeUpdateDecision(on, 16).type, "continue");
  assert.equal(getTimeUpdateDecision(off, 16).type, "pause");
});

test("Loop without a selected range overrides the line end and loops at media end", () => {
  const state = reduce(
    initialPlaybackState,
    { type: "playLine", range: firstRange },
    { type: "toggleLoop" },
  );
  assert.equal(getTimeUpdateDecision(state, 15).type, "continue");
  assert.equal(state.loopEnabled, true);
  assert.equal(state.selectedLoopRange, null);
});

test("line Loop selection enables Loop without starting playback", () => {
  const state = playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange });
  assert.equal(state.loopEnabled, true);
  assert.equal(state.playing, false);
  assert.equal(state.currentTime, 0);
  assert.equal(state.selectedLoopRange, firstRange);
});

test("selecting an out-of-range line Loop keeps current playback and media untouched", () => {
  const currentLine = { ...firstRange, lineId: "current", start: 0, end: 8 };
  const playing = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    playing: true,
    currentTime: 5,
    activeLine: currentLine,
  };
  const selected = playbackReducer(playing, { type: "toggleLineLoop", range: firstRange });
  assert.equal(selected.selectedLoopRange, firstRange);
  assert.equal(selected.loopEnabled, true);
  assert.equal(selected.playing, true);
  assert.equal(selected.currentTime, 5);
  assert.equal(selected.mediaSource, "/one.mp3");
  assert.equal(selected.activeLine, currentLine);
  assert.equal(selected.loopRangeEngaged, false);
});

test("selecting a Loop while already inside engages without pausing or seeking", () => {
  const playing = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    playing: true,
    currentTime: 12,
  };
  const selected = playbackReducer(playing, { type: "toggleLineLoop", range: firstRange });
  assert.equal(selected.playing, true);
  assert.equal(selected.currentTime, 12);
  assert.equal(selected.loopEnabled, true);
  assert.equal(selected.loopRangeEngaged, true);
  assert.equal(selected.activeLine, firstRange);
});

test("selecting a Loop on another media does not stop or switch current playback", () => {
  const otherMediaRange = {
    ...firstRange,
    lineId: "other-media-line",
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
  };
  const playing = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    playing: true,
    currentTime: 5,
  };
  const selected = playbackReducer(playing, { type: "toggleLineLoop", range: otherMediaRange });
  assert.equal(selected.playing, true);
  assert.equal(selected.mediaSource, "/one.mp3");
  assert.equal(selected.currentTime, 5);
  assert.equal(selected.selectedLoopRange, otherMediaRange);
  assert.equal(selected.loopRangeEngaged, false);
});

test("Controller line Loop selection dispatches only state selection with no media command", () => {
  const actions: Parameters<typeof playbackReducer>[1][] = [];
  dispatchLineLoopSelection(firstRange, (action) => actions.push(action));
  assert.deepEqual(actions, [{ type: "toggleLineLoop", range: firstRange }]);
});

test("an unengaged selected Loop starts at its range on the next global Play", () => {
  const waiting = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 5,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: false,
  };
  assert.equal(getSelectedLoopRangeToStart(waiting), firstRange);
  const started = playbackReducer(waiting, { type: "playLine", range: firstRange });
  assert.equal(started.currentTime, firstRange.start);
  assert.equal(started.playing, true);
  assert.equal(started.loopRangeEngaged, true);
});

test("an engaged selected Loop resumes its paused in-range position", () => {
  const pausedInLoop = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 12,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: true,
  };
  assert.equal(getSelectedLoopRangeToStart(pausedInLoop), null);
  const resumed = playbackReducer(pausedInLoop, { type: "setPlaying", playing: true });
  assert.equal(resumed.currentTime, 12);
  assert.equal(resumed.loopRangeEngaged, true);
});

test("a waiting Loop naturally engages on entering its range without pausing", () => {
  const waiting = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 9.9,
    playing: true,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: false,
  };
  const engaged = playbackReducer(waiting, { type: "setLoopRangeEngaged", engaged: true });
  assert.equal(engaged.playing, true);
  assert.equal(engaged.loopRangeEngaged, true);
  assert.equal(engaged.activeLine, firstRange);
});

test("natural playback crossing a short Loop range still engages before boundary handling", () => {
  assert.equal(hasPlaybackEnteredRange(9.9, 10.1, firstRange), true);
  assert.equal(hasPlaybackEnteredRange(9.9, 15.0001, firstRange), true);
  assert.equal(hasPlaybackEnteredRange(16, 16.1, firstRange), false);
});

test("stopping before an unengaged range keeps it as the next global Play target", () => {
  const waiting = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 5,
    playing: true,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: false,
  };
  const paused = playbackReducer(waiting, { type: "setPlaying", playing: false });
  const lineStopped = playbackReducer(waiting, { type: "lineBoundaryReached", currentTime: 8 });
  const mediaStopped = playbackReducer(waiting, { type: "mediaEnded" });
  assert.equal(paused.currentTime, 5);
  assert.equal(getSelectedLoopRangeToStart(paused), firstRange);
  assert.equal(getSelectedLoopRangeToStart(lineStopped), firstRange);
  assert.equal(getSelectedLoopRangeToStart(mediaStopped), firstRange);
});

test("stopped playback starts an unengaged Loop on its selected media source", () => {
  const otherMediaRange = {
    ...firstRange,
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
  };
  const stopped = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 5,
    loopEnabled: true,
    selectedLoopRange: otherMediaRange,
    loopRangeEngaged: false,
  };
  assert.equal(getSelectedLoopRangeToStart(stopped), otherMediaRange);
  const started = playbackReducer(stopped, { type: "playLine", range: otherMediaRange });
  assert.equal(started.mediaSource, "/two.mp3");
  assert.equal(started.currentTime, otherMediaRange.start);
  assert.equal(started.loopRangeEngaged, true);
});

test("line Loop repeats once playback enters the selected range", () => {
  const state = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "playLine", range: firstRange },
  );
  assert.deepEqual(getTimeUpdateDecision(state, 15), { type: "loop", time: 10 });
});

test("selecting another line changes the retained range without playing", () => {
  const state = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "toggleLineLoop", range: secondRange },
  );
  assert.equal(state.selectedLoopRange?.lineId, "line-2");
  assert.equal(state.playing, false);
});

test("global Loop OFF retains the range and ON reuses it", () => {
  const selected = playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange });
  const off = playbackReducer(selected, { type: "toggleLoop" });
  const on = playbackReducer(off, { type: "toggleLoop" });
  assert.equal(off.loopEnabled, false);
  assert.equal(off.selectedLoopRange, firstRange);
  assert.equal(on.loopEnabled, true);
  assert.equal(on.selectedLoopRange, firstRange);
});

test("pressing the selected line Loop clears selection and Loop only", () => {
  const selected = {
    ...playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange }),
    playing: true,
    currentTime: 12,
  };
  const cleared = playbackReducer(selected, { type: "toggleLineLoop", range: firstRange });
  assert.equal(cleared.selectedLoopRange, null);
  assert.equal(cleared.loopEnabled, false);
  assert.equal(cleared.playing, true);
  assert.equal(cleared.currentTime, 12);
});

test("Clear loop range preserves playback position and playing state", () => {
  const selected = {
    ...playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange }),
    playing: true,
    currentTime: 12,
  };
  const cleared = playbackReducer(selected, { type: "clearLoopRange" });
  assert.equal(cleared.selectedLoopRange, null);
  assert.equal(cleared.loopEnabled, false);
  assert.equal(cleared.playing, true);
  assert.equal(cleared.currentTime, 12);
});

test("pausing and resuming does not alter Loop state", () => {
  const looping = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "playLine", range: firstRange },
  );
  const resumed = reduce(
    looping,
    { type: "setPlaying", playing: false },
    { type: "setPlaying", playing: true },
  );
  assert.equal(resumed.loopEnabled, true);
  assert.equal(resumed.selectedLoopRange, firstRange);
  assert.equal(resumed.currentTime, 10);
});

test("seeking inside retains Loop while seeking outside disables Loop but retains range", () => {
  const looping = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "setSource", mediaResourceId: "audio-1", mediaSource: "/one.mp3" },
  );
  const inside = playbackReducer(looping, { type: "seek", currentTime: 12 });
  const outside = playbackReducer(inside, { type: "seek", currentTime: 18 });
  assert.equal(inside.loopEnabled, true);
  assert.equal(inside.loopRangeEngaged, true);
  assert.equal(outside.loopEnabled, false);
  assert.equal(outside.selectedLoopRange, firstRange);
});

test("switching media resets the old source timing and active line", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  const switched = playbackReducer(linePlaying, {
    type: "setSource",
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
    playing: true,
  });
  assert.equal(switched.mediaSource, "/two.mp3");
  assert.equal(switched.currentTime, 0);
  assert.equal(switched.duration, null);
  assert.equal(switched.activeLine, null);
});

test("media end stops normally and preserves full-source Loop for the controller to restart", () => {
  const stopped = playbackReducer(
    { ...initialPlaybackState, playing: true },
    { type: "mediaEnded" },
  );
  const looping = playbackReducer(
    { ...initialPlaybackState, playing: true, loopEnabled: true },
    { type: "mediaEnded" },
  );
  assert.equal(stopped.playing, false);
  assert.equal(looping.loopEnabled, true);
});

test("playback rate and stored preference parsing accept only supported values", () => {
  assert.equal(playbackReducer(initialPlaybackState, { type: "setPlaybackRate", playbackRate: 1.5 }).playbackRate, 1.5);
  assert.equal(parseStoredPlaybackRate("0.75"), 0.75);
  assert.equal(parseStoredPlaybackRate("3"), 1);
  assert.equal(parseStoredPlaybackRate("garbage"), 1);
  assert.equal(parseStoredContinuous("true"), true);
  assert.equal(parseStoredContinuous("false"), false);
});

test("Skip preserves Play/Pause, Continuous, rate, and full-source Loop state", () => {
  const base = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 10,
    continuous: true,
    playbackRate: 1.5 as const,
    loopEnabled: true,
  };
  const playing = playbackReducer({ ...base, playing: true }, { type: "skip", seconds: 2 });
  const paused = playbackReducer({ ...base, playing: false }, { type: "skip", seconds: -2 });
  assert.equal(playing.currentTime, 12);
  assert.equal(playing.playing, true);
  assert.equal(paused.currentTime, 8);
  assert.equal(paused.playing, false);
  assert.equal(playing.continuous, true);
  assert.equal(playing.playbackRate, 1.5);
  assert.equal(playing.loopEnabled, true);
});

test("Skip clamps at media start and end", () => {
  assert.equal(getClampedSkipTime(1, -10, 30), 0);
  assert.equal(getClampedSkipTime(29, 10, 30), 30);
  const atEnd = playbackReducer({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 29,
    playing: false,
  }, { type: "skip", seconds: 10 });
  assert.equal(atEnd.currentTime, 30);
  assert.equal(atEnd.playing, false);
});

test("Skip inside a selected Loop retains Loop; outside disables it and retains the range", () => {
  const looping = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 11,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: true,
  };
  const inside = playbackReducer(looping, { type: "skip", seconds: 2 });
  const outside = playbackReducer(inside, { type: "skip", seconds: 10 });
  assert.equal(inside.currentTime, 13);
  assert.equal(inside.loopEnabled, true);
  assert.equal(outside.loopEnabled, false);
  assert.equal(outside.selectedLoopRange, firstRange);
});

test("Skip safely does nothing before media and duration are available", () => {
  assert.equal(playbackReducer(initialPlaybackState, { type: "skip", seconds: 2 }), initialPlaybackState);
  const noDuration = { ...initialPlaybackState, mediaSource: "/one.mp3", currentTime: 4 };
  assert.equal(playbackReducer(noDuration, { type: "skip", seconds: 2 }), noDuration);
});

test("time formatter includes milliseconds, hours, and safe invalid fallback", () => {
  assert.equal(formatPlaybackTime(0), "0:00.000");
  assert.equal(formatPlaybackTime(18.237), "0:18.237");
  assert.equal(formatPlaybackTime(337), "5:37.000");
  assert.equal(formatPlaybackTime(3661.004), "1:01:01.004");
  assert.equal(formatPlaybackTime(Number.NaN), "--:--.---");
  assert.equal(formatPlaybackTime(-1), "--:--.---");
  assert.equal(formatPlaybackTime(null), "--:--.---");
});

test("Loop overlay percentages are clamped to duration", () => {
  const percentages = getLoopRangePercentages({ start: 10, end: 15 }, 30);
  assert.ok(percentages);
  assert.ok(Math.abs(percentages.start - 100 / 3) < 0.000001);
  assert.ok(Math.abs(percentages.width - 100 / 6) < 0.000001);
  assert.deepEqual(getLoopRangePercentages({ start: -2, end: 40 }, 30), {
    start: 0,
    width: 100,
  });
  assert.equal(getLoopRangePercentages({ start: 1, end: 2 }, null), null);
});

test("full-source progress percentage is clamped and safe for invalid durations", () => {
  assert.equal(getPlaybackProgressPercentage(12, 30), 40);
  assert.equal(getPlaybackProgressPercentage(-2, 30), 0);
  assert.equal(getPlaybackProgressPercentage(40, 30), 100);
  assert.equal(getPlaybackProgressPercentage(1, null), 0);
  assert.equal(getPlaybackProgressPercentage(1, 0), 0);
  assert.equal(getPlaybackProgressPercentage(1, Number.NaN), 0);
  assert.equal(getPlaybackProgressPercentage(Number.NaN, 30), 0);
});

test("short Loop ranges gain only a five-pixel visual minimum", () => {
  const semanticRange = { start: 18.351, end: 19.486 };
  const percentages = getLoopRangePercentages(semanticRange, 337.971);
  assert.ok(percentages);
  assert.ok(percentages.width > 0.33 && percentages.width < 0.34);

  const style = getLoopRangeVisualStyle(percentages);
  assert.equal(style.width, `max(${percentages.width}%, 5px)`);
  assert.equal(
    style.left,
    `min(${percentages.start}%, calc(100% - max(${percentages.width}%, 5px)))`,
  );
  assert.deepEqual(semanticRange, { start: 18.351, end: 19.486 });
});

test("short Loop visual geometry stays inside both source edges", () => {
  const nearStart = getLoopRangePercentages({ start: 0, end: 0.1 }, 1000);
  const nearEnd = getLoopRangePercentages({ start: 999.9, end: 1000 }, 1000);
  assert.ok(nearStart);
  assert.ok(nearEnd);
  assert.equal(
    getLoopRangeVisualStyle(nearStart).left,
    `min(${nearStart.start}%, calc(100% - max(${nearStart.width}%, 5px)))`,
  );
  assert.equal(
    getLoopRangeVisualStyle(nearEnd).left,
    `min(${nearEnd.start}%, calc(100% - max(${nearEnd.width}%, 5px)))`,
  );
});

test("line Play becomes Pause only while shared playback is in its media range", () => {
  const inRange = {
    ...initialPlaybackState,
    playing: true,
    mediaSource: "/one.mp3",
    currentTime: 12,
  };
  assert.equal(isLineCurrentlyPlaying(inRange, firstRange), true);
  assert.equal(isLineCurrentlyPlaying({ ...inRange, playing: false }, firstRange), false);
  assert.equal(isLineCurrentlyPlaying({ ...inRange, currentTime: 15 }, firstRange), false);
  assert.equal(isLineCurrentlyPlaying({ ...inRange, mediaSource: "/two.mp3" }, firstRange), false);
});

test("engaged Loop keeps only its selected line active at and beyond the end boundary", () => {
  const nextRange = { ...firstRange, lineId: "line-2", start: 15, end: 20 };
  for (const currentTime of [15, 15.0001]) {
    const boundaryState = {
      ...initialPlaybackState,
      playing: true,
      mediaSource: "/one.mp3",
      currentTime,
      loopEnabled: true,
      selectedLoopRange: firstRange,
      loopRangeEngaged: true,
    };
    assert.equal(isLineCurrentlyPlaying(boundaryState, firstRange), true);
    assert.equal(isLineCurrentlyPlaying(boundaryState, nextRange), false);
    assert.deepEqual(getTimeUpdateDecision(boundaryState, currentTime), {
      type: "loop",
      time: 10,
    });
  }
});

test("Loop OFF keeps ordinary adjacent-line time matching", () => {
  const nextRange = { ...firstRange, lineId: "line-2", start: 15, end: 20 };
  const boundaryState = {
    ...initialPlaybackState,
    playing: true,
    mediaSource: "/one.mp3",
    currentTime: 15,
  };
  assert.equal(isLineCurrentlyPlaying(boundaryState, firstRange), false);
  assert.equal(isLineCurrentlyPlaying(boundaryState, nextRange), true);
});

test("line Pause delegates to the shared pause action without restarting the line", () => {
  let pauses = 0;
  let plays = 0;
  activateLinePlaybackControl({
    isLinePlaying: true,
    range: firstRange,
    pause: () => { pauses += 1; },
    playLine: () => { plays += 1; },
  });
  assert.equal(pauses, 1);
  assert.equal(plays, 0);

  activateLinePlaybackControl({
    isLinePlaying: false,
    range: firstRange,
    pause: () => { pauses += 1; },
    playLine: () => { plays += 1; },
  });
  assert.equal(pauses, 1);
  assert.equal(plays, 1);
});

const audio: MediaResource = {
  id: "audio-1",
  type: "media",
  mediaType: "audio",
  src: "/one.mp3",
};

function textLine(interval?: { start: number; end?: number }, resourceId = "audio-1"): TextLine {
  return {
    id: "line-1",
    content: { text: "hello", languageId: "en", formId: "surface" },
    textLineRefs: interval ? [{
      id: "alignment-1",
      body: { type: "alignment", mediaRef: { resourceId }, interval },
    }] : undefined,
  };
}

function renderPlaybackBarForTest(state: PlaybackState) {
  const noop = () => undefined;
  return renderToStaticMarkup(<PlaybackBar controller={{
    state,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: state.mediaSource ?? undefined,
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController} />);
}

test("line playback resolves the alignment mediaRef rather than guessing a source", () => {
  assert.deepEqual(resolveLinePlaybackRange(textLine({ start: 1, end: 2 }), [audio], String), {
    type: "line",
    lineId: "line-1",
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    start: 1,
    end: 2,
  });
});

test("missing and invalid timestamps are not playable", () => {
  assert.equal(resolveLinePlaybackRange(textLine(), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: -1, end: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 2, end: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 1, end: 2 }, "missing"), [audio], String), null);
});

test("a timestamp known to exceed media duration is not playable", () => {
  assert.equal(resolveLinePlaybackRange(
    textLine({ start: 1, end: 12 }),
    [audio],
    String,
    { mediaSource: "/one.mp3", duration: 10 },
  ), null);
});

test("playback bar exposes accessible controls and active Loop range", () => {
  const state: PlaybackState = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 12,
    loopEnabled: true,
    selectedLoopRange: firstRange,
  };
  const noop = () => undefined;
  const controller = {
    state,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: "/one.mp3",
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController;
  const html = renderToStaticMarkup(<PlaybackBar controller={controller} />);
  assert.match(html, /aria-label="Play media"/);
  assert.match(html, /aria-label="Seek"/);
  assert.match(html, /aria-label="Playback speed"/);
  assert.match(html, /aria-label="Clear loop range"/);
  assert.match(html, /data-loop-range="active"/);
  assert.match(html, /data-playback-timeline="full-source"/);
  assert.match(html, /data-track="base"/);
  assert.match(html, /data-track="progress"[^>]*style="width:40%"/);
  assert.match(html, /data-loop-range="active"[^>]*data-loop-scope="selection"[^>]*data-loop-start="10"[^>]*data-loop-end="15"/);
  assert.match(html, /data-loop-range="active"[^>]*class="[^"]*pointer-events-none[^"]*z-20/);
  assert.match(html, /aria-label="Seek"[^>]*class="[^"]*playback-seek-input[^"]*z-30[^"]*focus-visible:outline/);
  assert.match(html, /line-1 — 0:10\.000–0:15\.000/);
  assert.match(html, /<button type="button" aria-label="Skip forward 2 seconds"/);
});

test("playback bar renders a short Loop selection with semantic boundaries and visual minimum", () => {
  const shortRange = {
    ...firstRange,
    start: 18.351,
    end: 19.486,
  };
  const html = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 337.971,
    selectedLoopRange: shortRange,
    loopEnabled: true,
  });
  assert.match(html, /data-loop-start="18\.351"/);
  assert.match(html, /data-loop-end="19\.486"/);
  assert.match(html, /width:max\([^;]+%, 5px\)/);
  assert.match(html, /data-loop-boundary="start"[^>]*style="left:[^;]+%"/);
  assert.match(html, /data-loop-boundary="end"[^>]*style="left:[^;]+%"/);
});

test("playback bar distinguishes a retained but inactive Loop range", () => {
  const noop = () => undefined;
  const controller = {
    state: {
      ...initialPlaybackState,
      mediaResourceId: "audio-1",
      mediaSource: "/one.mp3",
      duration: 30,
      selectedLoopRange: firstRange,
    },
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: "/one.mp3",
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController;
  const html = renderToStaticMarkup(<PlaybackBar controller={controller} />);
  assert.match(html, /data-loop-range="inactive"/);
  assert.match(html, /data-loop-selection="inactive"/);
  assert.match(html, /\(inactive\)/);
});

test("playback bar shows whole-source Loop and hides a different source selection", () => {
  const wholeSourceHtml = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    loopEnabled: true,
  });
  assert.match(wholeSourceHtml, /data-loop-range="active"[^>]*data-loop-scope="full-source"[^>]*data-loop-start="0"[^>]*data-loop-end="30"/);
  assert.match(wholeSourceHtml, /style="left:0%;width:100%"/);

  const mismatchedHtml = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
    duration: 30,
    loopEnabled: true,
    selectedLoopRange: firstRange,
  });
  assert.doesNotMatch(mismatchedHtml, /data-loop-range=/);
});

test("playback bar safely disables seek and Loop overlay for invalid durations", () => {
  for (const duration of [null, 0, Number.NaN]) {
    const html = renderPlaybackBarForTest({
      ...initialPlaybackState,
      mediaResourceId: "audio-1",
      mediaSource: "/one.mp3",
      duration,
      loopEnabled: true,
      selectedLoopRange: firstRange,
    });
    assert.match(html, /aria-label="Seek"[^>]*max="0"[^>]*disabled=""/);
    assert.doesNotMatch(html, /data-loop-range=/);
    assert.doesNotMatch(html, /NaN/);
  }
});

test("line controls have accessible names and expose invalid and selected states", () => {
  const invalidHtml = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Invalid"
      hasPlaybackTiming
      playbackRange={null}
    />,
  );
  assert.match(invalidHtml, /<button[^>]*disabled=""[^>]*aria-label="Play this line"/);
  assert.match(invalidHtml, /<button[^>]*disabled=""[^>]*aria-label="Loop this line"/);

  const selectedHtml = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Selected"
      hasPlaybackTiming
      playbackRange={firstRange}
      isLoopSelected
      loopEnabled
    />,
  );
  assert.match(selectedHtml, /aria-label="Clear loop range"/);
  assert.match(selectedHtml, /aria-pressed="true"/);
  assert.match(selectedHtml, /data-loop-selected="active"/);
});

test("global controls keep Continuous text fixed and expose state through semantics and styling", () => {
  const noop = () => undefined;
  const render = (continuous: boolean, loopEnabled: boolean) => renderToStaticMarkup(
    <PlaybackBar controller={{
      state: { ...initialPlaybackState, continuous, loopEnabled },
      actions: {
        play: noop,
        pause: noop,
        seek: noop,
        skip: noop,
        playLine: noop,
        setContinuous: noop,
        toggleLoop: noop,
        toggleLineLoop: noop,
        clearLoopRange: noop,
        setPlaybackRate: noop,
      },
      mediaProps: {
        ref: noop,
        src: undefined,
        onLoadedMetadata: noop,
        onDurationChange: noop,
        onTimeUpdate: noop,
        onPlay: noop,
        onPause: noop,
        onEnded: noop,
      },
    } as unknown as PlaybackController} />,
  );
  const offHtml = render(false, false);
  const onHtml = render(true, true);
  assert.match(offHtml, /aria-label="Enable continuous playback"[^>]*data-playback-toggle="continuous"[^>]*data-state="off"[^>]*>Continuous<\/button>/);
  assert.match(offHtml, /data-playback-toggle="continuous"[^>]*data-state="off"[^>]*class="[^"]*border-gray-400[^"]*text-gray-500/);
  assert.match(onHtml, /aria-pressed="true"[^>]*aria-label="Disable continuous playback"[^>]*data-playback-toggle="continuous"[^>]*data-state="on"[^>]*>Continuous<\/button>/);
  assert.doesNotMatch(offHtml, /Continuous: (?:ON|OFF)/);
  assert.doesNotMatch(onHtml, /Continuous: (?:ON|OFF)/);
  assert.match(offHtml, /aria-label="Enable loop"/);
  assert.match(onHtml, /aria-label="Disable loop"/);
  assert.match(onHtml, /aria-pressed="true" aria-label="Disable loop"/);
  assert.doesNotMatch(offHtml, /Loop: (?:ON|OFF)/);
  assert.match(offHtml, /focus-visible:outline/);
  assert.match(offHtml, /aria-pressed="true" aria-label="Set playback speed to 1×"/);
  const controlsLayout = offHtml.match(
    /<div class="([^"]*)" data-playback-controls-layout="left-flow">/,
  );
  assert.ok(controlsLayout);
  assert.match(controlsLayout[1], /flex/);
  assert.match(controlsLayout[1], /flex-wrap/);
  assert.match(controlsLayout[1], /justify-start/);
  assert.doesNotMatch(controlsLayout[1], /grid-cols|justify-between/);
  assert.match(
    offHtml,
    /data-playback-cluster="transport"[\s\S]*data-playback-cluster="state"/,
  );
  assert.match(offHtml, /aria-label="Seek"[^>]*class="[^"]*w-full/);
});

test("Skip is part of the shared Playback Controller public actions", () => {
  const actionName: keyof PlaybackController["actions"] = "skip";
  assert.equal(actionName, "skip");
});

test("global controls render four Skip buttons and disable them without selected media", () => {
  const noop = () => undefined;
  const html = renderToStaticMarkup(<PlaybackBar controller={{
    state: initialPlaybackState,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: undefined,
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController} />);
  for (const label of [
    "Skip backward 10 seconds",
    "Skip backward 2 seconds",
    "Skip forward 2 seconds",
    "Skip forward 10 seconds",
  ]) {
    assert.match(html, new RegExp(`<button[^>]*disabled=""[^>]*aria-label="${label}"`));
  }
  for (const rate of PLAYBACK_RATES) {
    assert.match(html, new RegExp(`>${rate}×</button>`));
  }
});

test("global and row Loop controls share the same SVG icon without visible Loop state text", () => {
  const noop = () => undefined;
  const globalHtml = renderToStaticMarkup(<PlaybackBar controller={{
    state: initialPlaybackState,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: undefined,
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController} />);
  const rowHtml = renderToStaticMarkup(<ScriptLine
    style={viewerStyle}
    layoutVariant="grid"
    textContent="Line"
    hasPlaybackTiming
    playbackRange={firstRange}
  />);
  assert.match(globalHtml, /data-playback-icon="loop"/);
  assert.match(rowHtml, /data-playback-icon="loop"/);
  assert.match(globalHtml, /class="[^"]*border-gray-400[^"]*text-gray-500[^"]*"[^>]*>[\s\S]*data-playback-icon="loop"/);
  assert.match(rowHtml, /class="[^"]*border-gray-400[^"]*text-gray-500[^"]*"[^>]*>[\s\S]*data-playback-icon="loop"/);
  assert.match(globalHtml, /aria-label="Enable loop"/);
  assert.match(rowHtml, /aria-label="Loop this line"/);
  assert.doesNotMatch(globalHtml, />Loop(?::| ON| OFF)/);
  assert.doesNotMatch(rowHtml, />Loop(?::| ON| OFF)/);
});

test("row control renders shared Pause icon when playback reaches the line", () => {
  const html = renderToStaticMarkup(<ScriptLine
    style={viewerStyle}
    layoutVariant="grid"
    textContent="Playing"
    hasPlaybackTiming
    playbackRange={firstRange}
    isLinePlaying
  />);
  assert.match(html, /aria-label="Pause this line"/);
  assert.match(html, /data-playback-icon="pause"/);
  assert.doesNotMatch(html, /data-playback-icon="play"/);
});
