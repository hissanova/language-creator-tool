import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AutoFollowControls } from "./AutoFollowControls";
import { AUTO_FOLLOW_DEFAULT_ENABLED, AUTO_FOLLOW_DEFAULT_MODE, createProgrammaticScroll, getAutoFollowSafeRegion, getAutoFollowScrollBehavior, getCenteredScrollTarget, getUsableViewport, isLineWithinRegion, isManualAutoFollowKey, reduceProgrammaticScroll, resolveAutoFollowScrollTarget, shouldIgnoreProgrammaticScroll, type AutoFollowMode, type ProgrammaticScroll, type ProgrammaticScrollEvent } from "./autoFollow";
import { noop, targetMatching } from "../playback/playbackTestFixtures";

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

function scrollStep(
  operation: ProgrammaticScroll | null,
  ...events: ProgrammaticScrollEvent[]
) {
  return events.reduce(reduceProgrammaticScroll, operation);
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


test("programmatic-scroll lifecycle covers guarding, scrolling, and settlement", () => {
  const guarding = createProgrammaticScroll(1);
  assert.deepEqual(guarding, { token: 1, targetY: null, phase: "guarding" });
  assert.equal(shouldIgnoreProgrammaticScroll(guarding), true);

  const scrolling = scrollStep(guarding, { type: "targetResolved", targetY: 500 });
  assert.deepEqual(scrolling, { token: 1, targetY: 500, phase: "scrolling" });
  const settling = scrollStep(scrolling, { type: "scrollObserved" });
  assert.deepEqual(settling, { token: 1, targetY: 500, phase: "settling" });
  assert.equal(shouldIgnoreProgrammaticScroll(settling), true);
  assert.equal(shouldIgnoreProgrammaticScroll(null), false);

  assert.equal(getAutoFollowScrollBehavior(true), "auto");
  assert.equal(getAutoFollowScrollBehavior(false), "smooth");
});

test("no-target Resume and repeated operations use independent guards", () => {
  const insideSafeRegion = createProgrammaticScroll(7);
  const layoutScroll = scrollStep(insideSafeRegion, { type: "scrollObserved" });
  assert.equal(layoutScroll?.phase, "settling");
  assert.equal(shouldIgnoreProgrammaticScroll(layoutScroll), true);

  const nextResume = createProgrammaticScroll(8);
  assert.equal(nextResume.token, 8);
  assert.notEqual(nextResume.token, layoutScroll?.token);
});

test("scrollend settlement still classifies a trailing scroll as programmatic", () => {
  const issued = createProgrammaticScroll(3, 900);
  const atScrollEnd = scrollStep(issued, { type: "scrollEnded" });
  const trailingScroll = scrollStep(atScrollEnd, { type: "scrollObserved" });
  assert.equal(atScrollEnd?.phase, "settling");
  assert.equal(shouldIgnoreProgrammaticScroll(trailingScroll), true);
});

test("explicit manual intent cancels active programmatic scrolling promptly", () => {
  for (const input of ["wheel", "touchmove", "scroll key"]) {
    const scrolling = createProgrammaticScroll(4, 700);
    assert.equal(
      scrollStep(scrolling, { type: "manualIntent" }),
      null,
      input,
    );
  }
});

test("quiet settlement and source changes clear only the applicable operation", () => {
  const current = createProgrammaticScroll(10, 400);
  assert.deepEqual(
    scrollStep(current, { type: "quietElapsed", token: 9 }),
    current,
    "a stale timer cannot clear a repeated Resume",
  );
  assert.equal(scrollStep(current, { type: "quietElapsed", token: 10 }), null);
  assert.equal(scrollStep(current, { type: "sourceChanged" }), null);
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
