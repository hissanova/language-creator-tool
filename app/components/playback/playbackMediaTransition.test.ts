import assert from "node:assert/strict";
import test from "node:test";
import { resolveCurrentPlaybackLineId } from "./playbackDisplay";
import { getSelectedRangeToStart, initialPlaybackState, playbackReducer, type PlaybackState } from "./playbackState";
import { applyPendingPlayback, beginPendingSourceTransition, handlePlaybackEnded, handlePlaybackPlayingChange, handlePlaybackTimeUpdate, type MutablePlaybackRef, type PendingPlayback } from "./playbackMediaTransition";
import { handlePlaybackKeyboardShortcut } from "./playbackKeyboardShortcuts";
import { shouldEvaluateAutoFollow, shouldRunAutoFollow, type AutoFollowSnapshot } from "../auto-follow/autoFollow";
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
      handlePlaybackPlayingChange({
        playing: false,
        pendingPlaybackRef,
        dispatchAndSync,
      });
    },
    play: () => {
      playCount += 1;
      events.push("media:play");
      handlePlaybackPlayingChange({
        playing: true,
        pendingPlaybackRef,
        dispatchAndSync,
      });
      return Promise.resolve();
    },
  } as unknown as HTMLMediaElement;

  const globalPlay = () => {
    const selectedLineRange = getSelectedRangeToStart(stateRef.current);
    assert.ok(selectedLineRange);
    assert.equal(selectedLineRange, secondRange);
    beginPendingSourceTransition({
      pendingPlaybackRef,
      pending: {
        time: selectedLineRange.start,
        end: selectedLineRange.end,
      },
      commitSourceChange: () => {
        assert.equal(pendingPlaybackRef.current?.time, secondRange.start);
        dispatchAndSync({ type: "playLine", range: selectedLineRange });
      },
      pauseElement: () => mediaElement.pause(),
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
  handlePlaybackTimeUpdate({
    element: mediaElement,
    pendingPlaybackRef,
    stateRef,
    dispatchAndSync,
  });
  assert.equal(stateRef.current.currentTime, secondRange.start);
  assert.equal(committedTimes.includes(0), false);
  assert.equal(events.at(-1), "media:timeupdate:0");
  assert.equal(
    resolveCurrentPlaybackLineId(stateRef.current, [initialLine, secondRange]),
    "line-2",
  );

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
      sourceToken: stateRef.current.mediaSource,
      playing: stateRef.current.playing,
      currentLineId: resolveCurrentPlaybackLineId(
        stateRef.current,
        [initialLine, secondRange],
      ),
      playbackPosition: stateRef.current.currentTime,
      mode,
    };
    assert.equal(next.currentLineId, "line-2");
    assert.equal(shouldEvaluateAutoFollow(previous, next), true);
  }
  const offShouldEvaluate = shouldEvaluateAutoFollow(previous, {
    ...previous,
    enabled: false,
    sourceToken: stateRef.current.mediaSource,
    playing: true,
    currentLineId: "line-2",
    playbackPosition: stateRef.current.currentTime,
  });
  assert.equal(offShouldEvaluate, false);
  assert.equal(shouldRunAutoFollow({
    shouldEvaluate: offShouldEvaluate,
    suspended: false,
    playbackStarted: true,
  }), false);

  events.push("media:loadedmetadata");
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
  assert.deepEqual(events.slice(0, 7), [
    "lock:line-2", "commit:playLine", "media:pause", "media:timeupdate:0",
    "media:loadedmetadata", "commit:setCurrentTime", "media:play",
  ]);
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


test("media end follows the active Loop scope and preserves a stopped Lock", () => {
  for (const scenario of [
    { state: withMedia({ playing: true, currentTime: 30 }), time: 30, expectedTime: 30, expectedPlaying: false, ended: true, plays: 0 },
    { state: withMedia({ playing: true, currentTime: 30, loopEnabled: true }), time: 30, expectedTime: 0, expectedPlaying: true, ended: false, plays: 1 },
    { state: withMedia({ playing: true, currentTime: 30, selectedLineRange: firstRange, rangeEngaged: true }), time: 30, expectedTime: 15, expectedPlaying: false, ended: false, plays: 0 },
    { state: withMedia({ playing: true, currentTime: 30, selectedLineRange: firstRange, rangeEngaged: true, loopEnabled: true }), time: 30, expectedTime: 10, expectedPlaying: true, ended: false, plays: 1 },
    { state: withMedia({ playing: true, currentTime: 30, selectedLineRange: firstRange, loopEnabled: true }), time: 30, expectedTime: 30, expectedPlaying: false, ended: true, plays: 0 },
  ]) {
    const stateRef = { current: scenario.state };
    const element = { currentTime: scenario.time } as HTMLMediaElement;
    let plays = 0;
    handlePlaybackEnded({
      element,
      stateRef,
      dispatchAndSync: (action) => { stateRef.current = playbackReducer(stateRef.current, action); },
      safelyPlay: () => { plays += 1; },
    });
    assert.equal(element.currentTime, scenario.expectedTime);
    assert.equal(stateRef.current.currentTime, scenario.expectedTime);
    assert.equal(stateRef.current.playing, scenario.expectedPlaying);
    assert.equal(stateRef.current.playbackEnded, scenario.ended);
    assert.equal(plays, scenario.plays);
    assert.equal(stateRef.current.selectedLineRange, scenario.state.selectedLineRange);
  }
});
