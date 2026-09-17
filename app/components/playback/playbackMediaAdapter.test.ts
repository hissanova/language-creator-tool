import assert from "node:assert/strict";
import test from "node:test";
import { executePlaybackInstructions } from "./playbackMediaAdapter";
import { initialPlaybackState, playbackReducer, type PlaybackState } from "./playbackState";
import type { PendingPlayback, PlaybackInstruction } from "./playbackMediaPlan";

test("adapter executes the ordered protocol and synchronizes every dispatch", () => {
  const operations: string[] = [];
  const pendingPlaybackRef: { current: PendingPlayback | null } = { current: null };
  let state: PlaybackState = initialPlaybackState;
  const element = {
    set currentTime(time: number) { operations.push(`seek:${time}`); },
    set playbackRate(rate: number) { operations.push(`rate:${rate}`); },
    pause() { operations.push("pause"); },
    play() { operations.push("play"); return Promise.resolve(); },
  } as HTMLMediaElement;
  const instructions: PlaybackInstruction[] = [
    { type: "setPending", pending: { time: 12 } },
    { type: "dispatch", action: { type: "setCurrentTime", currentTime: 12 } },
    { type: "pauseMedia" }, { type: "seekMedia", time: 12 },
    { type: "setMediaPlaybackRate", playbackRate: 1.25 },
    { type: "setPending", pending: null }, { type: "playMedia" },
  ];
  executePlaybackInstructions(instructions, {
    element, pendingPlaybackRef,
    dispatchAndSync(action) {
      operations.push(`dispatch:${action.type}:pending=${pendingPlaybackRef.current?.time ?? "none"}`);
      state = playbackReducer(state, action);
    },
  });
  assert.deepEqual(operations, ["dispatch:setCurrentTime:pending=12", "pause", "seek:12", "rate:1.25", "play"]);
  assert.equal(pendingPlaybackRef.current, null);
  assert.equal(state.currentTime, 12);
});

test("adapter skips media operations when the element is absent", () => {
  const pendingPlaybackRef: { current: PendingPlayback | null } = { current: null };
  const actions: string[] = [];
  executePlaybackInstructions([
    { type: "setPending", pending: { time: 5 } }, { type: "seekMedia", time: 5 },
    { type: "pauseMedia" }, { type: "playMedia" },
    { type: "dispatch", action: { type: "setPlaying", playing: true } },
  ], { element: null, pendingPlaybackRef, dispatchAndSync: (action) => { actions.push(action.type); } });
  assert.deepEqual(pendingPlaybackRef.current, { time: 5 });
  assert.deepEqual(actions, ["setPlaying"]);
});

test("failed Play synchronously recovers logical playing state after rejection", async () => {
  const actions: string[] = [];
  executePlaybackInstructions([{ type: "playMedia" }], {
    element: { play: () => Promise.reject(new Error("blocked")) } as HTMLMediaElement,
    pendingPlaybackRef: { current: null },
    dispatchAndSync: (action) => { actions.push(`${action.type}:${action.type === "setPlaying" ? action.playing : ""}`); },
  });
  await Promise.resolve();
  assert.deepEqual(actions, ["setPlaying:false"]);
});
