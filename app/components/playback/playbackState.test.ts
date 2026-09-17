import assert from "node:assert/strict";
import test from "node:test";
import { PLAYBACK_RATES, getClampedSkipTime, getSelectedRangeToStart, getTimeUpdateDecision, hasPlaybackEnteredRange, initialPlaybackState, parseStoredPlaybackRate, playbackReducer } from "./playbackState";
import { firstRange, secondRange, otherSourceRange, withMedia } from "./playbackTestFixtures";

test("skip bounds and stored rates retain their limits", () => {
  assert.equal(getClampedSkipTime(2, -5, 30), 0);
  assert.equal(getClampedSkipTime(29, 5, 30), 30);
  assert.equal(parseStoredPlaybackRate("1.5"), 1.5);
  assert.equal(parseStoredPlaybackRate("3"), 1);
  assert.deepEqual(PLAYBACK_RATES, [0.5, 0.75, 1, 1.25, 1.5, 2]);
});

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
  const first = playbackReducer(withMedia({ currentTime: 12 }), { type: "toggleLineLock", range: firstRange });
  assert.equal(first.rangeEngaged, true);
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
  assert.equal(restored.rangeEngaged, false);
  assert.deepEqual(getTimeUpdateDecision(restored, firstRange.end), { type: "continue" });
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

test("a changed media source clears obsolete range engagement", () => {
  const engaged = withMedia({ currentTime: 12, selectedLineRange: firstRange, rangeEngaged: true });
  const switched = playbackReducer(engaged, {
    type: "setSource", mediaResourceId: "audio-2", mediaSource: "/two.mp3", currentTime: 3,
  });
  assert.equal(switched.rangeEngaged, false);
  assert.equal(switched.selectedLineRange, firstRange);
  assert.equal(switched.currentTime, 3);
});
