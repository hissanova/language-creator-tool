import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScriptLine } from "../ScriptLine";
import { NEUTRAL_SCRIPT_LINE_PRESENTATION } from "../../styles/scriptLinePresentation";
import { viewerStyle } from "../../styles/viewerStyle";
import { PlaybackBar } from "./PlaybackBar";
import {
  formatPlaybackTime,
  getPlaybackProgressPercentage,
  getPlaybackRangePercentages,
  getPlaybackRangeVisualStyle,
  isLineCurrentlyPlaying,
  resolveCurrentPlaybackLineId,
} from "./playbackDisplay";
import {
  PLAYBACK_RATES,
  getClampedSkipTime,
  getSelectedRangeToStart,
  getTimeUpdateDecision,
  hasPlaybackEnteredRange,
  initialPlaybackState,
  parseStoredPlaybackRate,
  playbackReducer,
  type LinePlaybackRange,
  type PlaybackState,
} from "./playbackState";
import type { PlaybackController } from "./usePlaybackController";
import { dispatchLineLockSelection } from "./usePlaybackController";
import {
  applyPendingPlayback,
  beginPendingSourceTransition,
  handlePlaybackPlayingChange,
  handlePlaybackTimeUpdate,
  type MutablePlaybackRef,
  type PendingPlayback,
} from "./playbackMediaTransition";
import { activateLinePlaybackControl } from "./linePlaybackControl";
import { releasePlaybackButtonFocusOnPointerUp } from "./playbackButtonFocus";
import {
  handlePlaybackKeyboardShortcut,
  isEditablePlaybackShortcutTarget,
  resolvePlaybackKeyboardCommand,
} from "./playbackKeyboardShortcuts";
import {
  resolveAutoFollowScrollTarget,
  shouldEvaluateAutoFollow,
  type AutoFollowSnapshot,
} from "../auto-follow/autoFollow";

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

const otherSourceRange: LinePlaybackRange = {
  ...firstRange,
  lineId: "line-other",
  mediaResourceId: "audio-2",
  mediaSource: "/two.mp3",
};

function withMedia(overrides: Partial<PlaybackState> = {}): PlaybackState {
  return {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    ...overrides,
  };
}

const noop = () => undefined;

function targetMatching(editableSelector: string): EventTarget {
  const target = {
    closest: (selectors: string) => selectors
      .split(", ")
      .includes(editableSelector)
      ? target as unknown as Element
      : null,
  };
  return target as unknown as EventTarget;
}

function renderPlaybackBar(state: PlaybackState) {
  const controller = {
    state,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      toggleLoop: noop,
      toggleLineLock: noop,
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
  } as unknown as PlaybackController;
  return renderToStaticMarkup(<PlaybackBar controller={controller} />);
}

test("initial state keeps selection, Loop, and engagement independent", () => {
  assert.deepEqual(initialPlaybackState, {
    mediaResourceId: null,
    mediaSource: null,
    playing: false,
    currentTime: 0,
    duration: null,
    playbackRate: 1,
    selectedLineRange: null,
    loopEnabled: false,
    rangeEngaged: false,
    playbackEnded: false,
  });
});

test("Lock selects a line without seeking, playing, or changing Loop", () => {
  const initial = withMedia({ currentTime: 4, playing: false, loopEnabled: true });
  const selected = playbackReducer(initial, { type: "toggleLineLock", range: firstRange });
  assert.equal(selected.selectedLineRange, firstRange);
  assert.equal(selected.currentTime, 4);
  assert.equal(selected.playing, false);
  assert.equal(selected.loopEnabled, true);
  assert.equal(selected.rangeEngaged, false);
});

test("locking another line moves selection and the selected Lock clears it", () => {
  const first = playbackReducer(withMedia(), { type: "toggleLineLock", range: firstRange });
  const second = playbackReducer(first, { type: "toggleLineLock", range: secondRange });
  assert.equal(second.selectedLineRange, secondRange);
  assert.equal(second.rangeEngaged, false);
  const cleared = playbackReducer(second, { type: "toggleLineLock", range: secondRange });
  assert.equal(cleared.selectedLineRange, null);
  assert.equal(cleared.rangeEngaged, false);
});

test("locking the range containing the current position engages without moving playback", () => {
  const state = withMedia({ currentTime: 12, playing: true, loopEnabled: true });
  const selected = playbackReducer(state, { type: "toggleLineLock", range: firstRange });
  assert.equal(selected.currentTime, 12);
  assert.equal(selected.playing, true);
  assert.equal(selected.loopEnabled, true);
  assert.equal(selected.rangeEngaged, true);
});

test("the Lock dispatcher emits only a selection action", () => {
  const actions: Parameters<typeof playbackReducer>[1][] = [];
  dispatchLineLockSelection(firstRange, (action) => actions.push(action));
  assert.deepEqual(actions, [{ type: "toggleLineLock", range: firstRange }]);
});

test("Play on the selected line restarts it and engages the range", () => {
  const state = withMedia({ selectedLineRange: firstRange, currentTime: 13 });
  const playing = playbackReducer(state, { type: "playLine", range: firstRange });
  assert.equal(playing.currentTime, firstRange.start);
  assert.equal(playing.playing, true);
  assert.equal(playing.rangeEngaged, true);
  assert.equal(playing.selectedLineRange, firstRange);
});

test("Play on another line honours that line and retains a disengaged Lock", () => {
  const state = withMedia({ selectedLineRange: firstRange, rangeEngaged: true });
  const playing = playbackReducer(state, { type: "playLine", range: secondRange });
  assert.equal(playing.currentTime, secondRange.start);
  assert.equal(playing.selectedLineRange, firstRange);
  assert.equal(playing.rangeEngaged, false);
  assert.deepEqual(getTimeUpdateDecision(playing, secondRange.end), { type: "continue" });
});

test("playback outside a selected range is not interrupted", () => {
  const state = withMedia({
    playing: true,
    currentTime: 20,
    selectedLineRange: firstRange,
    rangeEngaged: false,
    loopEnabled: true,
  });
  assert.deepEqual(getTimeUpdateDecision(state, 25), { type: "continue" });
});

test("natural entry engages a selected range, including a short crossed range", () => {
  assert.equal(hasPlaybackEnteredRange(8, 11, firstRange), true);
  assert.equal(hasPlaybackEnteredRange(8, 16, firstRange), true);
  assert.equal(hasPlaybackEnteredRange(16, 18, firstRange), false);
  const engaged = playbackReducer(withMedia({ selectedLineRange: firstRange }), {
    type: "setRangeEngaged",
    engaged: true,
  });
  assert.equal(engaged.rangeEngaged, true);
  assert.deepEqual(getTimeUpdateDecision(engaged, 16), { type: "pause", time: 15 });
});

test("engaged selected range stops at its end with Loop off and stays locked", () => {
  const engaged = withMedia({
    playing: true,
    selectedLineRange: firstRange,
    rangeEngaged: true,
  });
  assert.deepEqual(getTimeUpdateDecision(engaged, 15), { type: "pause", time: 15 });
  const stopped = playbackReducer(engaged, {
    type: "selectedRangeBoundaryReached",
    currentTime: 15,
  });
  assert.equal(stopped.playing, false);
  assert.equal(stopped.currentTime, 15);
  assert.equal(stopped.selectedLineRange, firstRange);
  assert.equal(stopped.rangeEngaged, true);
});

test("global Play restarts a completed range and a pause outside the range", () => {
  assert.equal(getSelectedRangeToStart(withMedia({
    currentTime: 15,
    selectedLineRange: firstRange,
    rangeEngaged: true,
  })), firstRange);
  assert.equal(getSelectedRangeToStart(withMedia({
    currentTime: 22,
    selectedLineRange: firstRange,
    rangeEngaged: false,
  })), firstRange);
});

test("global Play resumes a manual pause inside an engaged range", () => {
  assert.equal(getSelectedRangeToStart(withMedia({
    currentTime: 12,
    selectedLineRange: firstRange,
    rangeEngaged: true,
  })), null);
});

test("initial Space playback exposes only the locked line as the first follow target", () => {
  const initialLine = { ...firstRange, lineId: "initial-line", start: 0, end: 5 };
  const locked = playbackReducer(initialPlaybackState, {
    type: "toggleLineLock",
    range: secondRange,
  });
  const started = playbackReducer(locked, { type: "playLine", range: secondRange });

  assert.equal(started.currentTime, secondRange.start);
  assert.equal(started.rangeEngaged, true);
  assert.equal(resolveCurrentPlaybackLineId(started, [initialLine, secondRange]), "line-2");

  const previous: AutoFollowSnapshot = {
    documentToken: "document",
    sourceToken: null,
    enabled: true,
    playing: false,
    currentLineId: null,
    playbackPosition: 0,
    mode: "unpinned",
    followRequest: 0,
  };
  for (const mode of ["unpinned", "pinned"] as const) {
    const next: AutoFollowSnapshot = {
      ...previous,
      sourceToken: started.mediaSource,
      playing: started.playing,
      currentLineId: resolveCurrentPlaybackLineId(started, [initialLine, secondRange]),
      playbackPosition: started.currentTime,
      mode,
    };
    assert.equal(next.currentLineId, "line-2");
    assert.equal(shouldEvaluateAutoFollow(previous, next), true);
  }

  assert.equal(shouldEvaluateAutoFollow(previous, {
    ...previous,
    enabled: false,
    sourceToken: started.mediaSource,
    playing: true,
    currentLineId: "line-2",
    playbackPosition: started.currentTime,
  }), false);
});

test("initial locked-line source transition rejects pre-metadata media events", () => {
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
  const dispatchAndSync = (action: Parameters<typeof playbackReducer>[1]) => {
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
      handlePlaybackPlayingChange({
        playing: false,
        pendingPlaybackRef,
        dispatchAndSync,
      });
    },
    play: () => {
      playCount += 1;
      handlePlaybackPlayingChange({
        playing: true,
        pendingPlaybackRef,
        dispatchAndSync,
      });
      return Promise.resolve();
    },
  } as unknown as HTMLMediaElement;

  const selectedLineRange = getSelectedRangeToStart(stateRef.current);
  assert.ok(selectedLineRange);
  assert.equal(selectedLineRange, secondRange);
  beginPendingSourceTransition({
    pendingPlaybackRef,
    pending: {
      time: selectedLineRange.start,
      play: true,
      end: selectedLineRange.end,
    },
    commitSourceChange: () => {
      assert.equal(pendingPlaybackRef.current?.time, secondRange.start);
      dispatchAndSync({ type: "playLine", range: selectedLineRange });
    },
    pauseElement: () => mediaElement.pause(),
  });

  assert.equal(sourcePauseCount, 1);
  assert.equal(stateRef.current.playing, true);
  assert.equal(stateRef.current.currentTime, secondRange.start);

  mediaElement.currentTime = 0;
  handlePlaybackTimeUpdate({
    element: mediaElement,
    pendingPlaybackRef,
    stateRef,
    dispatchAndSync,
  });
  assert.equal(stateRef.current.currentTime, secondRange.start);
  assert.equal(committedTimes.includes(0), false);
  assert.equal(
    resolveCurrentPlaybackLineId(stateRef.current, [initialLine, secondRange]),
    "line-2",
  );

  applyPendingPlayback({
    element: mediaElement,
    pendingPlaybackRef,
    playbackRate: stateRef.current.playbackRate,
    dispatchAndSync,
    safelyPlay: (element) => { void element.play(); },
  });
  assert.equal(pendingPlaybackRef.current, null);
  assert.equal(mediaElement.currentTime, secondRange.start);
  assert.equal(stateRef.current.currentTime, secondRange.start);
  assert.equal(playCount, 1);
  assert.equal(
    resolveCurrentPlaybackLineId(stateRef.current, [initialLine, secondRange]),
    "line-2",
  );
  assert.deepEqual([...new Set(followTargets)], ["line-2"]);

  mediaElement.currentTime = 21;
  handlePlaybackTimeUpdate({
    element: mediaElement,
    pendingPlaybackRef,
    stateRef,
    dispatchAndSync,
  });
  assert.equal(stateRef.current.currentTime, 21);

  mediaElement.pause();
  assert.equal(stateRef.current.playing, false);
});

test("playback-start follow preserves a selected line visible below sticky controls", () => {
  const usableViewport = { top: 220, bottom: 900 };
  const selectedLineRect = { top: 240, bottom: 290 };

  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: selectedLineRect,
    usableViewport,
    currentScrollY: 150,
    playbackStarted: true,
  }), null);

  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: selectedLineRect,
    usableViewport,
    currentScrollY: 150,
    playbackStarted: false,
  }), 0);

  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect: selectedLineRect,
    usableViewport,
    currentScrollY: 150,
    playbackStarted: true,
  }), 0);

  assert.notEqual(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: { top: 950, bottom: 1_000 },
    usableViewport,
    currentScrollY: 150,
    playbackStarted: true,
  }), null);

  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: { top: 190, bottom: 240 },
    usableViewport,
    currentScrollY: 150,
    playbackStarted: true,
  }), 0);
});

test("auto-follow hook passes playback-start context before requesting scroll", () => {
  const source = readFileSync(
    "app/components/auto-follow/useActiveLineAutoFollow.ts",
    "utf8",
  );
  assert.match(source, /resolveAutoFollowScrollTarget\(\{[\s\S]*?playbackStarted,[\s\S]*?\}\)/);
  assert.match(source, /followCurrentLine\(playbackStarted\)/);
  assert.match(source, /if \(targetY == null\) return;[\s\S]*?window\.scrollTo\(/);
});

test("engaged selected range loops from its beginning when global Loop is on", () => {
  const state = withMedia({
    selectedLineRange: firstRange,
    rangeEngaged: true,
    loopEnabled: true,
  });
  assert.deepEqual(getTimeUpdateDecision(state, 15), { type: "loop", time: 10 });
});

test("global Loop toggles without changing selection or engagement", () => {
  const selected = withMedia({ selectedLineRange: firstRange, rangeEngaged: true });
  const on = playbackReducer(selected, { type: "toggleLoop" });
  assert.equal(on.loopEnabled, true);
  assert.equal(on.selectedLineRange, firstRange);
  assert.equal(on.rangeEngaged, true);
  const off = playbackReducer(on, { type: "toggleLoop" });
  assert.equal(off.loopEnabled, false);
  assert.equal(off.selectedLineRange, firstRange);
});

test("locking and unlocking while Loop is on changes scope without transport changes", () => {
  const sourceLoop = withMedia({ loopEnabled: true, currentTime: 3, playing: true });
  const rangeLoop = playbackReducer(sourceLoop, { type: "toggleLineLock", range: firstRange });
  assert.equal(rangeLoop.loopEnabled, true);
  assert.equal(rangeLoop.selectedLineRange, firstRange);
  assert.equal(rangeLoop.currentTime, 3);
  assert.equal(rangeLoop.playing, true);
  const restored = playbackReducer(rangeLoop, { type: "toggleLineLock", range: firstRange });
  assert.equal(restored.loopEnabled, true);
  assert.equal(restored.selectedLineRange, null);
});

test("seek and skip engage inside and disengage outside without clearing the Lock", () => {
  const selected = withMedia({ currentTime: 5, selectedLineRange: firstRange });
  const inside = playbackReducer(selected, { type: "seek", currentTime: 12 });
  assert.equal(inside.rangeEngaged, true);
  assert.equal(inside.selectedLineRange, firstRange);
  const outside = playbackReducer(inside, { type: "seek", currentTime: 18 });
  assert.equal(outside.rangeEngaged, false);
  assert.equal(outside.selectedLineRange, firstRange);
  const skippedInside = playbackReducer(withMedia({
    currentTime: 9,
    selectedLineRange: firstRange,
  }), { type: "skip", seconds: 2 });
  assert.equal(skippedInside.currentTime, 11);
  assert.equal(skippedInside.rangeEngaged, true);
  const skippedOutside = playbackReducer(skippedInside, { type: "skip", seconds: 6 });
  assert.equal(skippedOutside.currentTime, 17);
  assert.equal(skippedOutside.rangeEngaged, false);
  assert.equal(skippedOutside.selectedLineRange, firstRange);
});

test("switching source and unrelated media end never pull playback to the Lock", () => {
  const selected = withMedia({ selectedLineRange: otherSourceRange, loopEnabled: true });
  const switched = playbackReducer(selected, {
    type: "setSource",
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 4,
    playing: true,
  });
  assert.equal(switched.currentTime, 4);
  assert.equal(switched.rangeEngaged, false);
  assert.equal(switched.selectedLineRange, otherSourceRange);
  const ended = playbackReducer(switched, { type: "mediaEnded" });
  assert.equal(ended.playing, false);
  assert.equal(ended.currentTime, 4);
  assert.equal(ended.selectedLineRange, otherSourceRange);
});

test("controller end handling derives whole-source and selected-range Loop scope", () => {
  const source = readFileSync("app/components/playback/usePlaybackController.ts", "utf8");
  assert.match(source, /selected && currentState\.rangeEngaged && currentState\.loopEnabled/);
  assert.match(source, /!selected && currentState\.loopEnabled/);
  assert.match(source, /element\.currentTime = selected\.start/);
  assert.match(source, /element\.currentTime = 0/);
});

test("Play and Lock controls have required names, pressed states, and distinct icons", () => {
  const unlocked = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
      layoutVariant="grid"
      textContent="Unlocked"
      hasPlaybackTiming
      playbackRange={firstRange}
    />,
  );
  const locked = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
      layoutVariant="grid"
      textContent="Locked"
      hasPlaybackTiming
      playbackRange={firstRange}
      isRangeLocked
    />,
  );
  assert.deepEqual(
    [...unlocked.matchAll(/<button[^>]*aria-label="([^"]+)"/g)].map((match) => match[1]),
    ["Play from this line", "Lock playback range to this line"],
  );
  assert.match(unlocked, /aria-pressed="false"[^>]*data-line-control="lock"/);
  assert.match(unlocked, /data-playback-icon="lock-open"/);
  assert.match(locked, /aria-pressed="true"[^>]*data-line-control="lock"/);
  assert.match(locked, /aria-label="Unlock playback range"/);
  assert.match(locked, /data-playback-icon="lock-closed"/);
  assert.equal((locked.match(/<button/g) ?? []).length, 2);
});

test("Play and Lock remain equal fixed circles without horizontal padding", () => {
  const html = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
      layoutVariant="grid"
      textContent="Compact controls"
      hasPlaybackTiming
      playbackRange={firstRange}
      isRangeLocked
    />,
  );
  const buttons = [...html.matchAll(/<button[^>]*aria-label="(?:Play from this line|Unlock playback range)"[^>]*>/g)];
  assert.equal(buttons.length, 2);
  for (const button of buttons) {
    const className = button[0].match(/class="([^"]+)"/)?.[1] ?? "";
    for (const expectedClass of [
      "h-10", "w-10", "min-h-10", "min-w-10", "aspect-square",
      "shrink-0", "items-center", "justify-center", "rounded-full", "p-0",
    ]) {
      assert.match(className, new RegExp(`(?:^| )${expectedClass}(?: |$)`));
    }
    assert.doesNotMatch(className, /(?:^| )p[xy]-/);
  }
});

test("invalid timed lines disable both controls", () => {
  const html = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
      layoutVariant="grid"
      textContent="Invalid"
      hasPlaybackTiming
      playbackRange={null}
    />,
  );
  assert.equal((html.match(/<button[^>]*disabled=""/g) ?? []).length, 2);
});

test("line Play always delegates a fresh start", () => {
  let started: LinePlaybackRange | null = null;
  activateLinePlaybackControl({ range: firstRange, playLine: (range) => { started = range; } });
  assert.equal(started, firstRange);
});

test("pointer focus release and native keyboard activation remain on both controls", () => {
  let blurCount = 0;
  releasePlaybackButtonFocusOnPointerUp({
    currentTarget: { blur: () => { blurCount += 1; } } as HTMLButtonElement,
  });
  assert.equal(blurCount, 1);
  const source = readFileSync("app/components/ScriptLine.tsx", "utf8");
  assert.equal(source.match(/onPointerUp=\{releasePlaybackButtonFocusOnPointerUp\}/g)?.length, 2);
  assert.equal(source.match(/type="button"/g)?.length, 2);
  assert.doesNotMatch(source, /onKeyDown/);
});

test("global Space and Arrow shortcuts retain shared transport behavior", () => {
  assert.deepEqual(resolvePlaybackKeyboardCommand({
    key: " ", shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
    repeat: false, defaultPrevented: false,
  }), { type: "toggle" });
  assert.deepEqual(resolvePlaybackKeyboardCommand({
    key: "ArrowRight", shiftKey: true, ctrlKey: false, metaKey: false, altKey: false,
    repeat: false, defaultPrevented: false,
  }), { type: "skip", seconds: 1 });
  let played = 0;
  let prevented = 0;
  assert.equal(handlePlaybackKeyboardShortcut({
    key: " ", shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
    repeat: false, defaultPrevented: false, target: null,
    preventDefault: () => { prevented += 1; },
  }, {
    playing: false, canToggle: true, canSkip: true,
    play: () => { played += 1; }, pause: noop, skip: noop,
  }), true);
  assert.equal(played, 1);
  assert.equal(prevented, 1);
});

test("Space ignores a focused Lock or editable field and leaves browser defaults untouched", () => {
  for (const selector of ["button", "input", "textarea", "[contenteditable]:not([contenteditable=\"false\"])"]) {
    let prevented = false;
    let played = false;
    const target = targetMatching(selector);
    assert.equal(isEditablePlaybackShortcutTarget(target), true);
    assert.equal(handlePlaybackKeyboardShortcut({
      key: " ", shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
      repeat: false, defaultPrevented: false, target,
      preventDefault: () => { prevented = true; },
    }, {
      playing: false, canToggle: true, canSkip: true,
      play: () => { played = true; }, pause: noop, skip: noop,
    }), false);
    assert.equal(prevented, false);
    assert.equal(played, false);
  }
});

test("Space and mouse global Play share the same atomic controller action", () => {
  const bar = readFileSync("app/components/playback/PlaybackBar.tsx", "utf8");
  const keyboard = readFileSync("app/components/playback/playbackKeyboardShortcuts.ts", "utf8");
  const controller = readFileSync("app/components/playback/usePlaybackController.ts", "utf8");
  assert.match(bar, /onClick=\{state\.playing \? actions\.pause : actions\.play\}/);
  assert.match(keyboard, /play: actions\.play/);
  assert.match(controller, /if \(selectedLineRange\) \{\s*startLine\(selectedLineRange\)/);
  assert.match(controller, /dispatchAndSync\(\{ type: "playLine", range \}\)/);
});

test("global Loop accessible name follows selection scope and enabled state", () => {
  const sourceOff = renderPlaybackBar(withMedia());
  const sourceOn = renderPlaybackBar(withMedia({ loopEnabled: true }));
  const rangeOff = renderPlaybackBar(withMedia({ selectedLineRange: firstRange }));
  const rangeOn = renderPlaybackBar(withMedia({ selectedLineRange: firstRange, loopEnabled: true }));
  assert.match(sourceOff, /aria-pressed="false" aria-label="Enable whole-source loop"/);
  assert.match(sourceOn, /aria-pressed="true" aria-label="Disable whole-source loop"/);
  assert.match(rangeOff, /aria-pressed="false" aria-label="Enable selected-line loop"/);
  assert.match(rangeOn, /aria-pressed="true" aria-label="Disable selected-line loop"/);
});

test("timeline distinguishes selected range, selected-range Loop, and whole-source Loop", () => {
  const selected = renderPlaybackBar(withMedia({ selectedLineRange: firstRange }));
  assert.match(selected, /data-playback-boundary="selected-range"[^>]*data-boundary-scope="line"/);
  assert.match(selected, /data-line-selection="locked"[^>]*data-loop-enabled="false"/);
  assert.match(selected, />Selected range 0:10\.000–0:15\.000</);

  const selectedLoop = renderPlaybackBar(withMedia({
    selectedLineRange: firstRange,
    loopEnabled: true,
  }));
  assert.match(selectedLoop, /data-playback-boundary="selected-range-loop"/);
  assert.match(selectedLoop, /data-loop-enabled="true"/);

  const sourceLoop = renderPlaybackBar(withMedia({ loopEnabled: true }));
  assert.match(sourceLoop, /data-playback-boundary="source-loop"[^>]*data-boundary-scope="full-source"/);
  assert.match(sourceLoop, /style="left:0%;width:100%"/);
});

test("Conversation and Developer compositions receive identical Lock presentation props", () => {
  const viewer = readFileSync("app/components/ViewerShell.tsx", "utf8");
  const conversation = readFileSync("app/components/script-line/ConversationScriptLine.tsx", "utf8");
  const developer = readFileSync("app/components/script-line/DeveloperScriptLine.tsx", "utf8");
  assert.match(viewer, /isRangeLocked=/);
  assert.match(viewer, /onToggleLineLock=\{playback\.actions\.toggleLineLock\}/);
  assert.match(conversation, /isRangeLocked=\{isRangeLocked\}/);
  assert.match(developer, /isRangeLocked=\{isRangeLocked\}/);
});

test("current-line highlighting and auto-follow remain independent of Lock selection", () => {
  const playing = withMedia({
    playing: true,
    currentTime: 12,
    selectedLineRange: secondRange,
  });
  assert.equal(isLineCurrentlyPlaying(playing, firstRange), true);
  assert.equal(resolveCurrentPlaybackLineId(playing, [firstRange, secondRange]), "line-1");
  const viewer = readFileSync("app/components/ViewerShell.tsx", "utf8");
  assert.match(viewer, /useActiveLineAutoFollow/);
  assert.match(viewer, /isCurrentPlaybackLine=\{currentPlaybackLineId === block\.text\.id\}/);
});

test("time, geometry, skip, and playback-rate helpers retain safe behavior", () => {
  assert.equal(formatPlaybackTime(65.123), "1:05.123");
  assert.equal(formatPlaybackTime(null), "--:--.---");
  assert.deepEqual(getPlaybackRangePercentages(firstRange, 20), { start: 50, width: 25 });
  assert.equal(getPlaybackRangePercentages(firstRange, null), null);
  assert.equal(getPlaybackProgressPercentage(40, 30), 100);
  assert.deepEqual(getPlaybackRangeVisualStyle({ start: 99, width: 0.1 }), {
    left: "min(99%, calc(100% - max(0.1%, 5px)))",
    width: "max(0.1%, 5px)",
  });
  assert.equal(getClampedSkipTime(2, -5, 30), 0);
  assert.equal(getClampedSkipTime(29, 5, 30), 30);
  assert.equal(parseStoredPlaybackRate("1.5"), 1.5);
  assert.equal(parseStoredPlaybackRate("3"), 1);
  assert.deepEqual(PLAYBACK_RATES, [0.5, 0.75, 1, 1.25, 1.5, 2]);
});
