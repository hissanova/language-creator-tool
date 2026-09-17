import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AutoFollowControls } from "./AutoFollowControls";
import { AUTO_FOLLOW_DEFAULT_ENABLED, AUTO_FOLLOW_DEFAULT_MODE, getAutoFollowSafeRegion, getAutoFollowScrollBehavior, getCenteredScrollTarget, getUsableViewport, isLineWithinRegion, isManualAutoFollowKey, resolveAutoFollowScrollTarget, resolveManualScrollSuspension, shouldEvaluateAutoFollow, shouldIgnoreProgrammaticScroll, shouldRunAutoFollow, type AutoFollowMode } from "./autoFollow";
import { autoFollowSnapshot, noop, targetMatching } from "../playback/playbackTestFixtures";

function renderAutoFollowControls(
  mode: AutoFollowMode,
  suspended = false,
  enabled = true,
) {
  return renderToStaticMarkup(
    <AutoFollowControls
      enabled={enabled}
      mode={mode}
      suspended={suspended}
      onEnabledChange={noop}
      onModeChange={noop}
      onResume={noop}
    />,
  );
}


test("auto-follow controls preserve On, Off, Unpinned, Pinned, and Resume states", () => {
  assert.equal(AUTO_FOLLOW_DEFAULT_ENABLED, true);
  assert.equal(AUTO_FOLLOW_DEFAULT_MODE, "unpinned");
  const unpinned = renderAutoFollowControls("unpinned");
  const pinned = renderAutoFollowControls("pinned");
  const offPinned = renderAutoFollowControls("pinned", true, false);
  const suspended = renderAutoFollowControls("unpinned", true);
  assert.match(unpinned, /aria-pressed="true"[^>]*>On<\/button>/);
  assert.match(unpinned, /aria-pressed="true"[^>]*>Unpinned<\/button>/);
  assert.match(pinned, /aria-pressed="true"[^>]*>Pinned<\/button>/);
  assert.match(offPinned, /aria-pressed="true"[^>]*>Off<\/button>/);
  assert.doesNotMatch(offPinned, /Resume follow/);
  assert.match(suspended, /Resume follow<\/button>/);
});


test("auto-follow geometry retains the established safe-region and pinned policies", () => {
  const usableViewport = getUsableViewport(1_000, { top: 0, bottom: 200 });
  assert.deepEqual(usableViewport, { top: 200, bottom: 1_000 });
  assert.deepEqual(getAutoFollowSafeRegion(usableViewport), { top: 400, bottom: 800 });
  assert.equal(isLineWithinRegion({ top: 400, bottom: 800 }, { top: 400, bottom: 800 }), true);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: { top: 500, bottom: 600 },
    usableViewport,
    currentScrollY: 100,
  }), null);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: { top: 800, bottom: 900 },
    usableViewport,
    currentScrollY: 100,
  }), 350);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect: { top: 500, bottom: 600 },
    usableViewport,
    currentScrollY: 100,
  }), 50);
  assert.equal(getCenteredScrollTarget(
    { top: -200, bottom: -100 },
    usableViewport,
    0,
  ), 0);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect: null,
    usableViewport,
    currentScrollY: 100,
  }), null);
});


test("auto-follow evaluation remains a read-only response to playback snapshots", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ currentLineId: "line-2" }),
  ), true);
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ playbackPosition: 10.5 }),
  ), false);
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ playbackPosition: 15 }),
    autoFollowSnapshot({ playbackPosition: 10 }),
  ), true);
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ playing: false }),
    autoFollowSnapshot(),
  ), true);
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ followRequest: 1 }),
  ), true);
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ mode: "pinned" }),
  ), true);
  for (const next of [
    autoFollowSnapshot({ enabled: false, currentLineId: "line-2" }),
    autoFollowSnapshot({ enabled: false, followRequest: 1 }),
    autoFollowSnapshot({ enabled: false, mode: "pinned" }),
  ]) {
    assert.equal(shouldEvaluateAutoFollow(autoFollowSnapshot({ enabled: false }), next), false);
  }
});


test("auto-follow suspension distinguishes manual and programmatic movement", () => {
  assert.equal(shouldRunAutoFollow({
    shouldEvaluate: true,
    suspended: true,
    playbackStarted: false,
  }), false);
  assert.equal(shouldRunAutoFollow({
    shouldEvaluate: true,
    suspended: true,
    playbackStarted: true,
  }), true);
  assert.deepEqual(resolveManualScrollSuspension({
    suspended: false,
    outsideSafeRegion: false,
    lineWithinSafeRegion: false,
  }), { suspended: true, outsideSafeRegion: true, shouldResume: false });
  assert.deepEqual(resolveManualScrollSuspension({
    suspended: true,
    outsideSafeRegion: true,
    lineWithinSafeRegion: true,
  }), { suspended: false, outsideSafeRegion: false, shouldResume: true });
  assert.equal(shouldIgnoreProgrammaticScroll({ targetY: 500, expiresAt: 2_000 }, 1_999), true);
  assert.equal(shouldIgnoreProgrammaticScroll({ targetY: 500, expiresAt: 2_000 }, 2_001), false);
  assert.equal(getAutoFollowScrollBehavior(true), "auto");
  assert.equal(getAutoFollowScrollBehavior(false), "smooth");
});


test("manual-scroll keys exclude playback Space and interactive Arrow keys", () => {
  const base = {
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    target: null,
  };
  assert.equal(isManualAutoFollowKey({ ...base, key: "PageDown" }), true);
  assert.equal(isManualAutoFollowKey({ ...base, key: " " }), false);
  assert.equal(isManualAutoFollowKey({
    ...base,
    key: "ArrowDown",
    target: targetMatching("button"),
  }), false);
});

test("manual scroll intent suspends until the line leaves and returns to the safe region", () => {
  const base = { defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false, target: null };
  for (const key of ["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
    assert.equal(isManualAutoFollowKey({ ...base, key }), true);
  }
  for (const selector of ["button", "input", "select", "textarea", "[contenteditable]:not([contenteditable=\"false\"])", ".monaco-editor"]) {
    assert.equal(isManualAutoFollowKey({ ...base, key: "ArrowDown", target: targetMatching(selector) }), false);
  }
  for (const override of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { defaultPrevented: true }]) {
    assert.equal(isManualAutoFollowKey({ ...base, key: "PageDown", ...override }), false);
  }

  const outside = resolveManualScrollSuspension({ suspended: false, outsideSafeRegion: false, lineWithinSafeRegion: false });
  assert.deepEqual(outside, { suspended: true, outsideSafeRegion: true, shouldResume: false });
  assert.equal(shouldRunAutoFollow({ shouldEvaluate: true, suspended: outside.suspended, playbackStarted: false }), false);
  const returned = resolveManualScrollSuspension({ suspended: outside.suspended, outsideSafeRegion: outside.outsideSafeRegion, lineWithinSafeRegion: true });
  assert.deepEqual(returned, { suspended: false, outsideSafeRegion: false, shouldResume: true });
  assert.equal(shouldRunAutoFollow({ shouldEvaluate: true, suspended: returned.suspended, playbackStarted: false }), true);
  assert.equal(shouldRunAutoFollow({ shouldEvaluate: true, suspended: true, playbackStarted: true }), true);
});
