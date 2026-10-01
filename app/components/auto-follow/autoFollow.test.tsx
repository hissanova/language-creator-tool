import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AutoFollowControls } from "./AutoFollowControls";
import { AutoFollowResume } from "./AutoFollowResume";
import { AUTO_FOLLOW_DEFAULT_ENABLED, AUTO_FOLLOW_DEFAULT_MODE, getAutoFollowSafeRegion, getAutoFollowScrollBehavior, getCenteredScrollTarget, getUsableViewport, isLineWithinRegion, isManualAutoFollowKey, resolveAutoFollowScrollTarget, resolveResumePlacement, shouldIgnoreProgrammaticScroll, type AutoFollowMode } from "./autoFollow";
import { noop, targetMatching } from "../playback/playbackTestFixtures";

function renderAutoFollowControls(mode: AutoFollowMode, enabled = true) {
  return renderToStaticMarkup(
    <AutoFollowControls
      enabled={enabled}
      mode={mode}
      onEnabledChange={noop}
      onModeChange={noop}
    />,
  );
}


test("Settings auto-follow controls preserve On, Off, Unpinned, and Pinned states", () => {
  assert.equal(AUTO_FOLLOW_DEFAULT_ENABLED, true);
  assert.equal(AUTO_FOLLOW_DEFAULT_MODE, "unpinned");
  const unpinned = renderAutoFollowControls("unpinned");
  const pinned = renderAutoFollowControls("pinned");
  const offPinned = renderAutoFollowControls("pinned", false);
  assert.match(unpinned, /aria-pressed="true"[^>]*>On<\/button>/);
  assert.match(unpinned, /aria-pressed="true"[^>]*>Unpinned<\/button>/);
  assert.match(pinned, /aria-pressed="true"[^>]*>Pinned<\/button>/);
  assert.match(offPinned, /aria-pressed="true"[^>]*>Off<\/button>/);
  assert.doesNotMatch(offPinned, /Resume follow/);
});


test("auto-follow geometry retains the established safe-region and pinned policies", () => {
  const usableViewport = getUsableViewport(1_000, {
    top: { top: 0, bottom: 100 },
    bottom: { top: 800, bottom: 1_000 },
  });
  assert.deepEqual(usableViewport, { top: 100, bottom: 800 });
  assert.deepEqual(getAutoFollowSafeRegion(usableViewport), { top: 275, bottom: 625 });
  assert.equal(isLineWithinRegion({ top: 275, bottom: 625 }, { top: 275, bottom: 625 }), true);
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
  }), 500);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect: { top: 500, bottom: 600 },
    usableViewport,
    currentScrollY: 100,
  }), 200);
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

test("bottom panel bounds reduce usable viewport for Unpinned and Pinned policies", () => {
  const usableViewport = getUsableViewport(700, {
    bottom: { top: 520, bottom: 720 },
  });
  assert.deepEqual(usableViewport, { top: 0, bottom: 520 });
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: { top: 180, bottom: 260 },
    usableViewport,
    currentScrollY: 100,
  }), null);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect: { top: 180, bottom: 260 },
    usableViewport,
    currentScrollY: 100,
  }), 60);
});

test("Resume placement follows the resolved target above, below, or within the usable viewport", () => {
  const viewport = { top: 50, bottom: 500 };
  assert.equal(resolveResumePlacement({ top: -40, bottom: 20 }, viewport), "top");
  assert.equal(resolveResumePlacement({ top: 520, bottom: 600 }, viewport), "bottom");
  assert.equal(resolveResumePlacement({ top: 200, bottom: 260 }, viewport), "neutral");
  assert.equal(resolveResumePlacement(null, viewport), "neutral");

  for (const placement of ["top", "bottom", "neutral"] as const) {
    const html = renderToStaticMarkup(
      <AutoFollowResume placement={placement} bottomObstruction={180} onResume={noop} />,
    );
    assert.match(html, new RegExp(`data-resume-placement="${placement}"`));
    assert.match(html, /class="pointer-events-none fixed/);
  }
});


test("programmatic-scroll timeout and reduced-motion policy", () => {
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

test("manual-scroll keys classify valid scrolling intent", () => {
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


});
