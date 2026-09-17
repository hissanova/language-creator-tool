import assert from "node:assert/strict";
import test from "node:test";
import {
  initialAutoFollowState,
  reduceAutoFollow,
  type AutoFollowEvent,
  type AutoFollowObservation,
  type AutoFollowState,
} from "./autoFollowState";

const documentToken = {};
const sourceToken = "/one.mp3";

function observation(overrides: Partial<AutoFollowObservation> = {}): AutoFollowObservation {
  return {
    documentToken,
    sourceToken,
    playing: true,
    currentLineId: "line-1",
    playbackPosition: 10,
    ...overrides,
  };
}

function step(state: AutoFollowState, ...events: AutoFollowEvent[]): AutoFollowState {
  return events.reduce(reduceAutoFollow, state);
}

function activeState() {
  return step(initialAutoFollowState, { type: "playbackObserved", observation: observation() });
}

test("defaults to enabled, Unpinned, and following", () => {
  assert.equal(initialAutoFollowState.enabled, true);
  assert.equal(initialAutoFollowState.mode, "unpinned");
  assert.deepEqual(initialAutoFollowState.suspension, { type: "following" });
  assert.equal(initialAutoFollowState.followRevision, 0);
});

test("first active observation follows, while forward progress does not", () => {
  const first = activeState();
  assert.equal(first.followRevision, 1);
  const forward = step(first, {
    type: "playbackObserved", observation: observation({ playbackPosition: 10.5 }),
  });
  assert.equal(forward.followRevision, 1);
});

test("line, document, and source changes each request following", () => {
  const line = step(activeState(), {
    type: "playbackObserved", observation: observation({ currentLineId: "line-2" }),
  });
  const document = step(line, {
    type: "playbackObserved", observation: observation({ documentToken: {}, currentLineId: "line-2" }),
  });
  const source = step(document, {
    type: "playbackObserved", observation: observation({ documentToken: document.playback?.documentToken, sourceToken: "/two.mp3", currentLineId: "line-2" }),
  });
  assert.deepEqual([line.followRevision, document.followRevision, source.followRevision], [2, 3, 4]);
});

test("rewind past tolerance follows; smaller backward movement does not", () => {
  const small = step(activeState(), {
    type: "playbackObserved", observation: observation({ playbackPosition: 9.96 }),
  });
  const rewind = step(small, {
    type: "playbackObserved", observation: observation({ playbackPosition: 9.8 }),
  });
  assert.equal(small.followRevision, 1);
  assert.equal(rewind.followRevision, 2);
});

test("playback start clears manual suspension and follows", () => {
  const paused = step(activeState(),
    { type: "manualScrollIntent" },
    { type: "manualScrollObserved", lineWithinSafeRegion: false },
    { type: "playbackObserved", observation: observation({ playing: false }) },
  );
  assert.deepEqual(paused.suspension, { type: "manual", hasLeftSafeRegion: true });
  const restarted = step(paused, { type: "playbackObserved", observation: observation() });
  assert.deepEqual(restarted.suspension, { type: "following" });
  assert.equal(restarted.followRevision, paused.followRevision + 1);
});

test("Off prevents following and enabling during playback follows", () => {
  const off = step(activeState(), { type: "manualScrollIntent" }, { type: "enabledChanged", enabled: false });
  assert.deepEqual(off.suspension, { type: "following" });
  const inactive = step(off,
    { type: "playbackObserved", observation: observation({ currentLineId: "line-2" }) },
    { type: "followRequested" },
  );
  assert.equal(inactive.followRevision, off.followRevision);
  const enabled = step(inactive, { type: "enabledChanged", enabled: true });
  assert.equal(enabled.followRevision, off.followRevision + 1);
});

test("mode changes follow while active, but not while disabled or suspended", () => {
  const active = step(activeState(), { type: "modeChanged", mode: "pinned" });
  assert.equal(active.followRevision, 2);
  const suspended = step(active, { type: "manualScrollIntent" }, { type: "modeChanged", mode: "unpinned" });
  assert.equal(suspended.followRevision, 2);
  const off = step(suspended, { type: "enabledChanged", enabled: false }, { type: "modeChanged", mode: "pinned" });
  assert.equal(off.followRevision, 2);
});

test("manual intent and scrolling suspend until departure and return", () => {
  const active = activeState();
  const intent = step(active, { type: "manualScrollIntent" });
  assert.deepEqual(intent.suspension, { type: "manual", hasLeftSafeRegion: false });
  const stillInside = step(intent, { type: "manualScrollObserved", lineWithinSafeRegion: true });
  assert.deepEqual(stillInside.suspension, intent.suspension);
  assert.equal(stillInside.followRevision, active.followRevision);
  const outside = step(stillInside, { type: "manualScrollObserved", lineWithinSafeRegion: false });
  assert.deepEqual(outside.suspension, { type: "manual", hasLeftSafeRegion: true });
  const returned = step(outside, { type: "manualScrollObserved", lineWithinSafeRegion: true });
  assert.deepEqual(returned.suspension, { type: "following" });
  assert.equal(returned.followRevision, active.followRevision + 1);
});

test("a scroll first observed outside requires a later return", () => {
  const outside = step(activeState(), { type: "manualScrollObserved", lineWithinSafeRegion: false });
  assert.deepEqual(outside.suspension, { type: "manual", hasLeftSafeRegion: true });
  const returned = step(outside, { type: "manualScrollObserved", lineWithinSafeRegion: true });
  assert.equal(returned.followRevision, outside.followRevision + 1);
});

test("Resume and seek both clear suspension and request following", () => {
  const suspended = step(activeState(), { type: "manualScrollIntent" });
  const resumed = step(suspended, { type: "followRequested" });
  assert.deepEqual(resumed.suspension, { type: "following" });
  assert.equal(resumed.followRevision, suspended.followRevision + 1);

  // Both public callbacks dispatch followRequested, including after a later manual intent.
  const sought = step(resumed, { type: "manualScrollIntent" }, { type: "followRequested" });
  assert.deepEqual(sought.suspension, { type: "following" });
  assert.equal(sought.followRevision, resumed.followRevision + 1);
});

test("paused playback and missing lines cannot request a visible follow", () => {
  for (const override of [{ playing: false }, { currentLineId: null }]) {
    const state = step(initialAutoFollowState,
      { type: "playbackObserved", observation: observation(override) },
      { type: "followRequested" },
      { type: "modeChanged", mode: "pinned" },
      { type: "manualScrollIntent" },
      { type: "manualScrollObserved", lineWithinSafeRegion: false },
    );
    assert.equal(state.followRevision, 0);
    assert.deepEqual(state.suspension, { type: "following" });
  }
});
