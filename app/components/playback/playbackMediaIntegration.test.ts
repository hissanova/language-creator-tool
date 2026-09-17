import assert from "node:assert/strict";
import test from "node:test";
import { resolveCurrentPlaybackLineId } from "./playbackDisplay";
import { initialPlaybackState, playbackReducer, type PlaybackState } from "./playbackState";
import { planGlobalPlay, planPlayingChange, planTimeUpdate, planLoadedMetadata, planMediaEnded, type PendingPlayback } from "./playbackMediaPlan";
import { executePlaybackInstructions, type MutablePlaybackRef } from "./playbackMediaAdapter";
import { handlePlaybackKeyboardShortcut } from "./playbackKeyboardShortcuts";
import { initialAutoFollowState, reduceAutoFollow, type AutoFollowObservation } from "../auto-follow/autoFollowState";
import { firstRange, secondRange, withMedia, noop } from "./playbackTestFixtures";

test("initial locked-line Space playback rejects pre-metadata media events", () => {
  const initialLine = { ...firstRange, lineId: "initial-line", start: 0, end: 5 };
  const stateRef: MutablePlaybackRef<PlaybackState> = {
    current: playbackReducer(initialPlaybackState, {
      type: "toggleLineLock",
      range: secondRange,
    }),
  };
  const pendingPlaybackRef: MutablePlaybackRef<PendingPlayback | null> = {
    current: null,
  };
  const committedTimes: number[] = [];
  const followTargets: string[] = [];
  const events: string[] = ["lock:line-2"];
  const dispatchAndSync = (action: Parameters<typeof playbackReducer>[1]) => {
    events.push(`commit:${action.type}`);
    if (action.type === "playLine") assert.equal(pendingPlaybackRef.current?.time, secondRange.start);
    stateRef.current = playbackReducer(stateRef.current, action);
    committedTimes.push(stateRef.current.currentTime);
    if (stateRef.current.playing) {
      const currentLineId = resolveCurrentPlaybackLineId(
        stateRef.current,
        [initialLine, secondRange],
      );
      if (currentLineId) followTargets.push(currentLineId);
    }
  };
  let playCount = 0;
  let sourcePauseCount = 0;
  const mediaElement = {
    currentTime: 0,
    playbackRate: 1,
    pause: () => {
      sourcePauseCount += 1;
      events.push("media:pause");
      executePlaybackInstructions(planPlayingChange(false, pendingPlaybackRef.current), { element: mediaElement, pendingPlaybackRef, dispatchAndSync });
    },
    play: () => {
      playCount += 1;
      events.push("media:play");
      executePlaybackInstructions(planPlayingChange(true, pendingPlaybackRef.current), { element: mediaElement, pendingPlaybackRef, dispatchAndSync });
      return Promise.resolve();
    },
  } as unknown as HTMLMediaElement;

  const globalPlay = () => {
    executePlaybackInstructions(planGlobalPlay(stateRef.current), {
      element: mediaElement, pendingPlaybackRef, dispatchAndSync,
    });
  };
  let prevented = false;
  assert.equal(handlePlaybackKeyboardShortcut({
    key: " ", shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
    repeat: false, defaultPrevented: false, target: null,
    preventDefault: () => { prevented = true; },
  }, {
    playing: false,
    canToggle: true,
    canSkip: true,
    play: globalPlay,
    pause: noop,
    skip: noop,
  }), true);
  assert.equal(prevented, true);

  assert.equal(sourcePauseCount, 1);
  assert.equal(stateRef.current.playing, true);
  assert.equal(stateRef.current.currentTime, secondRange.start);
  assert.equal(stateRef.current.selectedLineRange, secondRange);
  assert.deepEqual(events, ["lock:line-2", "commit:playLine", "media:pause"]);

  mediaElement.currentTime = 0;
  events.push("media:timeupdate:0");
  executePlaybackInstructions(planTimeUpdate(stateRef.current, pendingPlaybackRef.current, mediaElement.currentTime), {
    element: mediaElement, pendingPlaybackRef, dispatchAndSync,
  });
  assert.equal(stateRef.current.currentTime, secondRange.start);
  assert.equal(committedTimes.includes(0), false);
  assert.equal(events.at(-1), "media:timeupdate:0");
  assert.equal(
    resolveCurrentPlaybackLineId(stateRef.current, [initialLine, secondRange]),
    "line-2",
  );

  const beforePlayback: AutoFollowObservation = {
    documentToken: "document",
    sourceToken: null,
    playing: false,
    currentLineId: null,
    playbackPosition: 0,
  };
  const firstCurrentLineId = resolveCurrentPlaybackLineId(
    stateRef.current,
    [initialLine, secondRange],
  );
  const firstActiveObservation: AutoFollowObservation = {
    ...beforePlayback,
    sourceToken: stateRef.current.mediaSource,
    playing: stateRef.current.playing,
    currentLineId: firstCurrentLineId,
    playbackPosition: stateRef.current.currentTime,
  };
  assert.equal(firstCurrentLineId, "line-2");
  assert.notEqual(firstActiveObservation.currentLineId, initialLine.lineId);
  for (const mode of ["unpinned", "pinned"] as const) {
    const before = reduceAutoFollow(initialAutoFollowState, {
      type: "playbackObserved", observation: beforePlayback,
    });
    const configured = reduceAutoFollow(before, { type: "modeChanged", mode });
    const active = reduceAutoFollow(configured, {
      type: "playbackObserved", observation: firstActiveObservation,
    });
    assert.equal(configured.followRevision, 0);
    assert.equal(active.playback?.currentLineId, "line-2");
    assert.equal(active.followRevision, 1);
  }
  const off = reduceAutoFollow(initialAutoFollowState, {
    type: "enabledChanged", enabled: false,
  });
  const offBeforePlayback = reduceAutoFollow(off, {
    type: "playbackObserved", observation: beforePlayback,
  });
  const offDuringPlayback = reduceAutoFollow(offBeforePlayback, {
    type: "playbackObserved", observation: firstActiveObservation,
  });
  assert.equal(offDuringPlayback.followRevision, 0);

  events.push("media:loadedmetadata");
  executePlaybackInstructions(planLoadedMetadata(30, pendingPlaybackRef.current, stateRef.current.playbackRate), {
    element: mediaElement, pendingPlaybackRef, dispatchAndSync,
  });
  assert.equal(pendingPlaybackRef.current, null);
  assert.equal(mediaElement.currentTime, secondRange.start);
  assert.equal(stateRef.current.currentTime, secondRange.start);
  assert.equal(playCount, 1);
  assert.deepEqual(events.slice(0, 8), [
    "lock:line-2", "commit:playLine", "media:pause", "media:timeupdate:0",
    "media:loadedmetadata", "commit:setDuration", "commit:setCurrentTime", "media:play",
  ]);
  assert.equal(
    resolveCurrentPlaybackLineId(stateRef.current, [initialLine, secondRange]),
    "line-2",
  );
  assert.deepEqual([...new Set(followTargets)], ["line-2"]);

  mediaElement.currentTime = 21;
  executePlaybackInstructions(planTimeUpdate(stateRef.current, pendingPlaybackRef.current, mediaElement.currentTime), {
    element: mediaElement, pendingPlaybackRef, dispatchAndSync,
  });
  assert.equal(stateRef.current.currentTime, 21);

  mediaElement.pause();
  assert.equal(stateRef.current.playing, false);
});


test("media end follows the active Loop scope and preserves a stopped Lock", () => {
  for (const scenario of [
    { state: withMedia({ playing: true, currentTime: 30 }), time: 30, expectedTime: 30, expectedPlaying: false, ended: true, plays: 0 },
    { state: withMedia({ playing: true, currentTime: 30, loopEnabled: true }), time: 30, expectedTime: 0, expectedPlaying: true, ended: false, plays: 1 },
    { state: withMedia({ playing: true, currentTime: 30, selectedLineRange: firstRange, rangeEngaged: true }), time: 30, expectedTime: 15, expectedPlaying: false, ended: false, plays: 0 },
    { state: withMedia({ playing: true, currentTime: 30, selectedLineRange: firstRange, rangeEngaged: true, loopEnabled: true }), time: 30, expectedTime: 10, expectedPlaying: true, ended: false, plays: 1 },
    { state: withMedia({ playing: true, currentTime: 30, selectedLineRange: firstRange, loopEnabled: true }), time: 30, expectedTime: 30, expectedPlaying: false, ended: true, plays: 0 },
  ]) {
    const stateRef = { current: scenario.state };
    let plays = 0;
    const element = { currentTime: scenario.time, play: () => { plays += 1; return Promise.resolve(); } } as HTMLMediaElement;
    executePlaybackInstructions(planMediaEnded(stateRef.current, true), {
      element,
      pendingPlaybackRef: { current: null },
      dispatchAndSync: (action) => { stateRef.current = playbackReducer(stateRef.current, action); },
    });
    assert.equal(element.currentTime, scenario.expectedTime);
    assert.equal(stateRef.current.currentTime, scenario.expectedTime);
    assert.equal(stateRef.current.playing, scenario.expectedPlaying);
    assert.equal(stateRef.current.playbackEnded, scenario.ended);
    assert.equal(plays, scenario.plays);
    assert.equal(stateRef.current.selectedLineRange, scenario.state.selectedLineRange);
  }
});
