import assert from "node:assert/strict";
import test from "node:test";
import { firstRange, withMedia } from "./playbackTestFixtures";
import { planPlaybackStart, planGlobalPlay, planLinePlay, planPendingPlayback, planTimeUpdate, planPlayingChange, planLoadedMetadata, planDuration, planMediaEnded } from "./playbackMediaPlan";

const lineAction = { type: "playLine" as const, range: firstRange };
const sourceAction = { type: "setSource" as const, mediaResourceId: "audio", mediaSource: "audio.mp3", currentTime: 4, playing: true };
const pendingLine = { time: firstRange.start, end: firstRange.end };

for (const [name, action, pending] of [
  ["line", lineAction, pendingLine], ["global", sourceAction, { time: 4 }],
] as const) {
  test(`${name} source transition registers pending before commit and pause`, () => {
    assert.deepEqual(planPlaybackStart({ sourceChanged: true, action, pending, playbackRate: 1.25 }), [
      { type: "setPending", pending }, { type: "dispatch", action }, { type: "pauseMedia" },
    ]);
  });
  test(`${name} same-source start commits before media operations`, () => {
    assert.deepEqual(planPlaybackStart({ sourceChanged: false, action, pending, playbackRate: 1.25 }), [
      { type: "dispatch", action }, { type: "seekMedia", time: pending.time },
      { type: "setMediaPlaybackRate", playbackRate: 1.25 }, { type: "playMedia" },
    ]);
  });
}

test("pending playback seeks and synchronizes before clearing pending", () => {
  assert.deepEqual(planPendingPlayback(pendingLine, 0.75), [
    { type: "seekMedia", time: 10 }, { type: "dispatch", action: { type: "setCurrentTime", currentTime: 10 } },
    { type: "setMediaPlaybackRate", playbackRate: 0.75 }, { type: "setPending", pending: null }, { type: "playMedia" },
  ]);
});

test("pending timeupdate and transition pause are ignored", () => {
  assert.deepEqual(planTimeUpdate(withMedia(), pendingLine, 0), []);
  assert.deepEqual(planPlayingChange(false, pendingLine), []);
  assert.deepEqual(planPlayingChange(true, pendingLine), [{ type: "dispatch", action: { type: "setPlaying", playing: true } }]);
  assert.deepEqual(planPlayingChange(false, null), [{ type: "dispatch", action: { type: "setPlaying", playing: false } }]);
});

test("natural range entry engages before applying the selected boundary", () => {
  const state = withMedia({ currentTime: 9, selectedLineRange: firstRange, rangeEngaged: false });
  assert.deepEqual(planTimeUpdate(state, null, 11), [
    { type: "dispatch", action: { type: "setRangeEngaged", engaged: true } },
    { type: "dispatch", action: { type: "setCurrentTime", currentTime: 11 } },
  ]);
  assert.deepEqual(planTimeUpdate(state, null, 16), [
    { type: "dispatch", action: { type: "setRangeEngaged", engaged: true } },
    { type: "seekMedia", time: 15 }, { type: "pauseMedia" },
    { type: "dispatch", action: { type: "selectedRangeBoundaryReached", currentTime: 15 } },
  ]);
});

for (const loopEnabled of [false, true]) {
  test(`selected boundary with Loop ${loopEnabled ? "On" : "Off"}`, () => {
    const time = loopEnabled ? 10 : 15;
    assert.deepEqual(planTimeUpdate(withMedia({ selectedLineRange: firstRange, rangeEngaged: true, loopEnabled }), null, 16),
      loopEnabled
        ? [{ type: "seekMedia", time }, { type: "dispatch", action: { type: "setCurrentTime", currentTime: time } }]
        : [{ type: "seekMedia", time }, { type: "pauseMedia" }, { type: "dispatch", action: { type: "selectedRangeBoundaryReached", currentTime: time } }]);
  });
}

for (const [name, state, expected] of [
  ["whole source Loop Off", withMedia({ playing: true }), [{ type: "dispatch", action: { type: "mediaEnded" } }]],
  ["whole source Loop On", withMedia({ playing: true, loopEnabled: true }), [{ type: "seekMedia", time: 0 }, { type: "dispatch", action: { type: "setCurrentTime", currentTime: 0 } }, { type: "playMedia" }]],
  ["engaged range Loop Off", withMedia({ playing: true, selectedLineRange: firstRange, rangeEngaged: true }), [{ type: "seekMedia", time: 15 }, { type: "dispatch", action: { type: "selectedRangeBoundaryReached", currentTime: 15 } }]],
  ["engaged range Loop On", withMedia({ playing: true, selectedLineRange: firstRange, rangeEngaged: true, loopEnabled: true }), [{ type: "seekMedia", time: 10 }, { type: "dispatch", action: { type: "setCurrentTime", currentTime: 10 } }, { type: "playMedia" }]],
  ["unengaged range", withMedia({ playing: true, selectedLineRange: firstRange, loopEnabled: true }), [{ type: "dispatch", action: { type: "mediaEnded" } }]],
] as const) {
  test(`media end: ${name}`, () => assert.deepEqual(planMediaEnded(state, true), expected));
}

test("metadata rejects an invalid pending range in order", () => {
  assert.deepEqual(planLoadedMetadata(12, pendingLine, 1), [
    { type: "dispatch", action: { type: "setDuration", duration: 12 } },
    { type: "warn", message: "Playback disabled: line timestamp exceeds the media duration." },
    { type: "setPending", pending: null }, { type: "pauseMedia" },
    { type: "dispatch", action: { type: "setPlaying", playing: false } },
  ]);
});

test("duration normalizes finite and non-finite values", () => {
  assert.deepEqual(planDuration(30), [{ type: "dispatch", action: { type: "setDuration", duration: 30 } }]);
  assert.deepEqual(planDuration(Infinity), [{ type: "dispatch", action: { type: "setDuration", duration: null } }]);
  assert.deepEqual(planLoadedMetadata(Infinity, pendingLine, 1).slice(0, 1), planDuration(Infinity));
});

test("global Play selects a locked later line and preserves its pending seek", () => {
  const state = withMedia({ mediaResourceId: null, mediaSource: null, selectedLineRange: firstRange });
  assert.deepEqual(planGlobalPlay(state), planLinePlay(state, firstRange));
});

test("global Play chooses the fallback source and restarts at source end", () => {
  const fallback = { mediaResourceId: "fallback", mediaSource: "fallback.mp3" };
  assert.deepEqual(planGlobalPlay(withMedia({ mediaResourceId: null, mediaSource: null }), fallback),
    planPlaybackStart({ sourceChanged: true, action: { type: "setSource", ...fallback, currentTime: 0, playing: true }, pending: { time: 0 }, playbackRate: 1 }));
  const atEnd = withMedia({ mediaResourceId: "audio", mediaSource: "audio.mp3", currentTime: 30, duration: 30 });
  assert.deepEqual(planGlobalPlay(atEnd), planPlaybackStart({ sourceChanged: false,
    action: { type: "setSource", mediaResourceId: "audio", mediaSource: "audio.mp3", currentTime: 0, playing: true },
    pending: { time: 0 }, playbackRate: 1 }));
});
