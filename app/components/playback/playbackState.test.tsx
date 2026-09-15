import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MediaResource } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import { PlaybackBar } from "./PlaybackBar";
import { ScriptLine } from "../ScriptLine";
import { viewerStyle } from "../../styles/viewerStyle";
import { NEUTRAL_SCRIPT_LINE_PRESENTATION } from "../../styles/scriptLinePresentation";
import { resolveLinePlaybackRange } from "./linePlayback";
import {
  formatPlaybackTime,
  getLoopRangePercentages,
  getLoopRangeVisualStyle,
  getPlaybackProgressPercentage,
  isLineCurrentlyPlaying,
  resolveCurrentPlaybackLineId,
} from "./playbackDisplay";
import {
  PLAYBACK_RATES,
  getClampedSkipTime,
  getSelectedLoopRangeToStart,
  hasPlaybackEnteredRange,
  getTimeUpdateDecision,
  initialPlaybackState,
  parseStoredContinuous,
  parseStoredPlaybackRate,
  playbackReducer,
  type LinePlaybackRange,
  type PlaybackState,
} from "./playbackState";
import type { PlaybackController } from "./usePlaybackController";
import { dispatchLineLoopSelection } from "./usePlaybackController";
import { activateLinePlaybackControl } from "./linePlaybackControl";
import { releasePlaybackButtonFocusOnPointerUp } from "./playbackButtonFocus";
import {
  handlePlaybackKeyboardShortcut,
  isEditablePlaybackShortcutTarget,
  resolvePlaybackKeyboardCommand,
} from "./playbackKeyboardShortcuts";
import { normalizeMediaSrc } from "../media/normalizeMediaSrc";
import { conversationSampleChinese1 } from "../../../samples/core-json/generated/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON";
import { AutoFollowControls } from "../auto-follow/AutoFollowControls";
import {
  AUTO_FOLLOW_DEFAULT_ENABLED,
  AUTO_FOLLOW_DEFAULT_MODE,
  getAutoFollowSafeRegion,
  getAutoFollowScrollBehavior,
  getCenteredScrollTarget,
  getUsableViewport,
  isLineWithinRegion,
  isManualAutoFollowKey,
  resolveAutoFollowScrollTarget,
  resolveManualScrollSuspension,
  shouldEvaluateAutoFollow,
  shouldIgnoreProgrammaticScroll,
  shouldRunAutoFollow,
  type AutoFollowSnapshot,
  type AutoFollowMode,
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

function reduce(state: PlaybackState, ...actions: Parameters<typeof playbackReducer>[1][]) {
  return actions.reduce(playbackReducer, state);
}

function keyboardEvent(
  overrides: Partial<Parameters<typeof handlePlaybackKeyboardShortcut>[0]> = {},
) {
  let prevented = false;
  return {
    event: {
      key: " ",
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      repeat: false,
      defaultPrevented: false,
      target: null,
      preventDefault: () => { prevented = true; },
      ...overrides,
    },
    wasPrevented: () => prevented,
  };
}

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

test("pointer activation releases focus from a Playback button", () => {
  let blurCount = 0;

  releasePlaybackButtonFocusOnPointerUp({
    currentTarget: {
      blur: () => { blurCount += 1; },
    } as HTMLButtonElement,
  });

  assert.equal(blurCount, 1);
});

test("keyboard activation retains Playback button focus", () => {
  let focused = true;
  let activationCount = 0;
  const activateFromKeyboard = () => { activationCount += 1; };

  // Native Space/Enter activation dispatches click without dispatching pointerup.
  activateFromKeyboard();

  assert.equal(activationCount, 1);
  assert.equal(focused, true);

  releasePlaybackButtonFocusOnPointerUp({
    currentTarget: {
      blur: () => { focused = false; },
    } as HTMLButtonElement,
  });
  assert.equal(focused, false);
});

test("all Playback buttons share pointer focus release while seek retains focus", () => {
  const playbackBarSource = readFileSync(
    "app/components/playback/PlaybackBar.tsx",
    "utf8",
  );
  const scriptLineSource = readFileSync("app/components/ScriptLine.tsx", "utf8");
  const viewerShellSource = readFileSync("app/components/ViewerShell.tsx", "utf8");
  const handlerProp = /onPointerUp=\{releasePlaybackButtonFocusOnPointerUp\}/g;

  // SkipButton represents all four Skip controls. The other five occurrences
  // cover global Play/Pause, Continuous, Loop, speed, and clear-loop controls.
  assert.equal(playbackBarSource.match(handlerProp)?.length, 6);
  assert.equal(scriptLineSource.match(handlerProp)?.length, 2);
  assert.equal(viewerShellSource.match(handlerProp)?.length, 1);

  const seekInput = playbackBarSource.match(/<input\s+[\s\S]*?type="range"[\s\S]*?\/>/)?.[0];
  assert.ok(seekInput);
  assert.doesNotMatch(seekInput, /onPointerUp/);
});

const autoFollowDocument = {};

function autoFollowSnapshot(
  overrides: Partial<AutoFollowSnapshot> = {},
): AutoFollowSnapshot {
  return {
    documentToken: autoFollowDocument,
    sourceToken: "/one.mp3",
    enabled: true,
    playing: true,
    currentLineId: "line-1",
    playbackPosition: 10,
    mode: "unpinned",
    followRequest: 0,
    ...overrides,
  };
}

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
      onEnabledChange={() => undefined}
      onModeChange={() => undefined}
      onResume={() => undefined}
    />,
  );
}

test("auto-follow defaults to On and Unpinned and exposes both preferences", () => {
  assert.equal(AUTO_FOLLOW_DEFAULT_ENABLED, true);
  assert.equal(AUTO_FOLLOW_DEFAULT_MODE, "unpinned");
  const unpinned = renderAutoFollowControls("unpinned");
  const pinned = renderAutoFollowControls("pinned");
  assert.match(unpinned, /aria-label="Auto-follow"/);
  assert.match(unpinned, /aria-pressed="true"[^>]*>On<\/button>/);
  assert.match(unpinned, /aria-label="Auto-follow scroll mode"/);
  assert.match(unpinned, /aria-pressed="true"[^>]*>Unpinned<\/button>/);
  assert.match(pinned, /aria-pressed="true"[^>]*>Pinned<\/button>/);
});

test("auto-follow feature labels keep explicit contrast on the white playback panel", () => {
  const html = renderAutoFollowControls("unpinned");
  assert.match(html, /<span class="font-medium text-gray-800">Auto-follow:<\/span>/);
  assert.match(html, /<span class="ml-2 font-medium text-gray-800">Scroll mode:<\/span>/);
});

test("auto-follow can be switched On and Off independently of mode", () => {
  const on = renderAutoFollowControls("unpinned", false, true);
  const off = renderAutoFollowControls("unpinned", false, false);
  assert.match(on, /aria-pressed="true"[^>]*>On<\/button>/);
  assert.match(off, /aria-pressed="true"[^>]*>Off<\/button>/);
});

test("Off prevents every source of programmatic follow evaluation", () => {
  const previous = autoFollowSnapshot({ enabled: false });
  for (const next of [
    autoFollowSnapshot({ enabled: false, currentLineId: "line-2" }),
    autoFollowSnapshot({ enabled: false, followRequest: 1 }),
    autoFollowSnapshot({ enabled: false, mode: "pinned" }),
    autoFollowSnapshot({ enabled: false, playbackPosition: 0 }),
    autoFollowSnapshot({ enabled: false, sourceToken: "/two.mp3" }),
  ]) {
    assert.equal(shouldEvaluateAutoFollow(previous, next), false);
  }
});

test("Off preserves current-line highlight derivation", () => {
  const viewerShellSource = readFileSync("app/components/ViewerShell.tsx", "utf8");
  assert.match(
    viewerShellSource,
    /isCurrentPlaybackLine=\{currentPlaybackLineId === block\.text\.id\}/,
  );
  assert.doesNotMatch(
    viewerShellSource,
    /isCurrentPlaybackLine=\{autoFollowEnabled/,
  );
});

test("Off hides Resume follow and disables but preserves the selected mode", () => {
  const offPinned = renderAutoFollowControls("pinned", true, false);
  assert.doesNotMatch(offPinned, /Resume follow/);
  assert.match(offPinned, /aria-pressed="true" disabled=""[^>]*>Pinned<\/button>/);
  assert.match(offPinned, /disabled=""[^>]*>Unpinned<\/button>/);
});

test("turning On during playback immediately evaluates the selected mode", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ enabled: false }),
    autoFollowSnapshot({ enabled: true }),
  ), true);
});

test("turning On while paused waits for playback", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ enabled: false, playing: false }),
    autoFollowSnapshot({ enabled: true, playing: false }),
  ), false);
});

test("usable viewport starts below the measured sticky controls", () => {
  assert.deepEqual(getUsableViewport(1_000, { top: 0, bottom: 200 }), {
    top: 200,
    bottom: 1_000,
  });
  assert.deepEqual(getUsableViewport(1_000, { top: 100, bottom: 260 }), {
    top: 260,
    bottom: 1_000,
  });
  assert.deepEqual(getUsableViewport(1_000, { top: -300, bottom: -100 }), {
    top: 0,
    bottom: 1_000,
  });
});

test("Unpinned safe region is the central 50% of the usable viewport", () => {
  assert.deepEqual(getAutoFollowSafeRegion({ top: 200, bottom: 1_000 }), {
    top: 400,
    bottom: 800,
  });
  assert.equal(isLineWithinRegion({ top: 400, bottom: 800 }, { top: 400, bottom: 800 }), true);
  assert.equal(isLineWithinRegion({ top: 399, bottom: 800 }, { top: 400, bottom: 800 }), false);
  assert.equal(isLineWithinRegion({ top: 400, bottom: 801 }, { top: 400, bottom: 800 }), false);
});

test("Unpinned does not scroll a line inside the safe region", () => {
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: { top: 500, bottom: 600 },
    usableViewport: { top: 200, bottom: 1_000 },
    currentScrollY: 100,
  }), null);
});

test("Unpinned centers a line outside the safe region", () => {
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect: { top: 800, bottom: 900 },
    usableViewport: { top: 200, bottom: 1_000 },
    currentScrollY: 100,
  }), 350);
});

test("Pinned always produces a usable-viewport-centered target", () => {
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect: { top: 500, bottom: 600 },
    usableViewport: { top: 200, bottom: 1_000 },
    currentScrollY: 100,
  }), 50);
  assert.equal(getCenteredScrollTarget(
    { top: -200, bottom: -100 },
    { top: 200, bottom: 1_000 },
    0,
  ), 0);
});

test("auto-follow uses the compact panel's measured height without a fixed offset", () => {
  const lineRect = { top: 500, bottom: 600 };
  const compactViewport = getUsableViewport(1_000, { top: 0, bottom: 180 });
  const tallerViewport = getUsableViewport(1_000, { top: 0, bottom: 260 });

  assert.equal(resolveAutoFollowScrollTarget({
    mode: "unpinned",
    lineRect,
    usableViewport: compactViewport,
    currentScrollY: 100,
  }), null);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect,
    usableViewport: compactViewport,
    currentScrollY: 100,
  }), 60);
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect,
    usableViewport: tallerViewport,
    currentScrollY: 100,
  }), 20);
});

test("a current-line change requests one auto-follow evaluation", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ currentLineId: "line-2" }),
  ), true);
});

test("same-line time updates do not repeat auto-follow", () => {
  const snapshot = autoFollowSnapshot();
  assert.equal(shouldEvaluateAutoFollow(
    snapshot,
    { ...snapshot, playbackPosition: 10.5 },
  ), false);
});

test("a same-line Loop rewind reevaluates auto-follow once", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ playbackPosition: 15 }),
    autoFollowSnapshot({ playbackPosition: 10 }),
  ), true);
});

test("paused playback never evaluates auto-follow, including seek requests", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ playing: false }),
    autoFollowSnapshot({ playing: false, followRequest: 1 }),
  ), false);
});

test("resuming playback evaluates the current line", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ playing: false }),
    autoFollowSnapshot(),
  ), true);
});

test("an explicit playing seek evaluates even when the current line is unchanged", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ followRequest: 1 }),
  ), true);
});

test("changing to Pinned while playing reevaluates the current line", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ mode: "pinned" }),
  ), true);
});

test("changing mode while manually suspended does not resume following", () => {
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
});

test("wheel, touch, and non-interactive scroll keys suspend auto-follow", () => {
  const hookSource = readFileSync(
    "app/components/auto-follow/useActiveLineAutoFollow.ts",
    "utf8",
  );
  assert.match(hookSource, /addEventListener\("wheel", suspendForManualIntent/);
  assert.match(hookSource, /addEventListener\("touchmove", suspendForManualIntent/);
  assert.equal(isManualAutoFollowKey({
    key: "PageDown",
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    target: null,
  }), true);
});

test("interactive Arrow keys and playback Space are not manual-scroll suspension", () => {
  const baseKey = {
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    target: null,
  };
  assert.equal(isManualAutoFollowKey({ ...baseKey, key: " " }), false);
  assert.equal(isManualAutoFollowKey({
    ...baseKey,
    key: "ArrowDown",
    target: targetMatching("button"),
  }), false);
  assert.equal(isManualAutoFollowKey({ ...baseKey, key: "ArrowDown", defaultPrevented: true }), false);
});

test("programmatic scroll events are ignored only for the bounded scroll window", () => {
  const programmaticScroll = { targetY: 500, expiresAt: 2_000 };
  assert.equal(shouldIgnoreProgrammaticScroll(programmaticScroll, 1_999), true);
  assert.equal(shouldIgnoreProgrammaticScroll(programmaticScroll, 2_001), false);
  assert.equal(shouldIgnoreProgrammaticScroll(null, 1_000), false);
});

test("scrollbar movement suspends and returning from outside the safe region resumes", () => {
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
});

test("manual movement that remains safe stays suspended until the line leaves and returns", () => {
  assert.deepEqual(resolveManualScrollSuspension({
    suspended: false,
    outsideSafeRegion: false,
    lineWithinSafeRegion: true,
  }), { suspended: true, outsideSafeRegion: false, shouldResume: false });
  assert.deepEqual(resolveManualScrollSuspension({
    suspended: true,
    outsideSafeRegion: false,
    lineWithinSafeRegion: true,
  }), { suspended: true, outsideSafeRegion: false, shouldResume: false });
});

test("manual suspension remains runtime state and does not turn the preference Off", () => {
  const hookSource = readFileSync(
    "app/components/auto-follow/useActiveLineAutoFollow.ts",
    "utf8",
  );
  const manualEffect = hookSource.slice(hookSource.indexOf("const suspendForManualIntent"));
  assert.match(manualEffect, /setSuspended\(true\)/);
  assert.doesNotMatch(manualEffect, /setEnabledState\(false\)/);
});

test("turning Off clears temporary suspension without changing mode", () => {
  const hookSource = readFileSync(
    "app/components/auto-follow/useActiveLineAutoFollow.ts",
    "utf8",
  );
  const enabledSetter = hookSource.slice(
    hookSource.indexOf("const setEnabled"),
    hookSource.indexOf("const requestFollow"),
  );
  assert.match(enabledSetter, /setSuspended\(false\)/);
  assert.doesNotMatch(enabledSetter, /setMode/);
});

test("Resume follow is exposed only while manual suspension is active", () => {
  assert.doesNotMatch(renderAutoFollowControls("unpinned"), /Resume follow/);
  const suspended = renderAutoFollowControls("unpinned", true);
  assert.match(suspended, /Auto-follow paused after manual scrolling/);
  assert.match(suspended, /aria-label="Resume auto-follow after manual scrolling"[^>]*>Resume follow<\/button>/);
});

test("Resume follow immediately requests reevaluation without changing line identity", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot({ followRequest: 4 }),
    autoFollowSnapshot({ followRequest: 5 }),
  ), true);
});

test("reduced motion selects immediate scrolling", () => {
  assert.equal(getAutoFollowScrollBehavior(true), "auto");
  assert.equal(getAutoFollowScrollBehavior(false), "smooth");
});

test("missing current-line geometry safely produces no scroll target", () => {
  assert.equal(resolveAutoFollowScrollTarget({
    mode: "pinned",
    lineRect: null,
    usableViewport: { top: 200, bottom: 1_000 },
    currentScrollY: 100,
  }), null);
});

test("document changes reevaluate with a fresh line registry", () => {
  assert.equal(shouldEvaluateAutoFollow(
    autoFollowSnapshot(),
    autoFollowSnapshot({ documentToken: {} }),
  ), true);
  const hookSource = readFileSync(
    "app/components/auto-follow/useActiveLineAutoFollow.ts",
    "utf8",
  );
  assert.match(hookSource, /return createLineElementRegistry\(\);/);
  assert.match(hookSource, /\[documentToken, sourceToken\]/);
});

test("Conversation and Developer viewers share ViewerShell auto-follow", () => {
  const conversationSource = readFileSync("app/components/ConversationViewer.tsx", "utf8");
  const developerSource = readFileSync("app/components/DeveloperViewer.tsx", "utf8");
  const viewerShellSource = readFileSync("app/components/ViewerShell.tsx", "utf8");
  assert.match(conversationSource, /<ViewerShell/);
  assert.match(developerSource, /<ViewerShell/);
  assert.match(viewerShellSource, /useActiveLineAutoFollow/);
});

test("auto-follow preferences remain local to the Viewer session", () => {
  const autoFollowSource = [
    readFileSync("app/components/auto-follow/autoFollow.ts", "utf8"),
    readFileSync("app/components/auto-follow/useActiveLineAutoFollow.ts", "utf8"),
    readFileSync("app/components/auto-follow/AutoFollowControls.tsx", "utf8"),
  ].join("\n");
  assert.doesNotMatch(autoFollowSource, /localStorage|URLSearchParams|searchParams/);
});

test("auto-follow scrolls without moving keyboard focus and keeps #52 handlers", () => {
  const hookSource = readFileSync(
    "app/components/auto-follow/useActiveLineAutoFollow.ts",
    "utf8",
  );
  const controlsSource = readFileSync(
    "app/components/auto-follow/AutoFollowControls.tsx",
    "utf8",
  );
  assert.doesNotMatch(hookSource, /\.focus\(|activeElement/);
  assert.equal(
    controlsSource.match(/onPointerUp=\{releasePlaybackButtonFocusOnPointerUp\}/g)?.length,
    3,
  );
});

test("media sources use only generic public-path normalization", () => {
  const unchangedSources = [
    "/media/example.mp3",
    "/open-content/resources/example.mp3",
    "https://example.org/example.mp3",
    "blob:https://example.org/resource-id",
    "data:audio/mpeg;base64,AAAA",
  ];

  assert.equal(normalizeMediaSrc("/public/media/example.mp3"), "/media/example.mp3");
  assert.equal(normalizeMediaSrc("@/public/media/example.mp3"), "/media/example.mp3");
  for (const src of unchangedSources) {
    assert.equal(normalizeMediaSrc(src), src);
  }
});

test("historical and similarly-prefixed paths receive no content-specific redirect", () => {
  const historicalPath =
    "@/public/sample-media/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON";
  const similarPath = `${historicalPath}-archive/example.mp3`;

  assert.equal(
    normalizeMediaSrc(historicalPath),
    "/sample-media/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON",
  );
  assert.equal(
    normalizeMediaSrc(similarPath),
    "/sample-media/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON-archive/example.mp3",
  );
});

test("the generated HYQ sample keeps and uses its canonical media source", () => {
  const audio = conversationSampleChinese1.resources?.find(
    (resource): resource is MediaResource =>
      resource.type === "media" && resource.mediaType === "audio",
  );

  assert.equal(audio?.src, "/media/audio/hyq_2026-04-16_xindeyanjing.mp3");
  assert.equal(audio && normalizeMediaSrc(audio.src), audio?.src);
});

test("playback keyboard shortcuts resolve Space and Arrow mappings", () => {
  assert.deepEqual(resolvePlaybackKeyboardCommand(keyboardEvent().event), { type: "toggle" });
  assert.deepEqual(resolvePlaybackKeyboardCommand(keyboardEvent({ key: "ArrowLeft" }).event), { type: "skip", seconds: -5 });
  assert.deepEqual(resolvePlaybackKeyboardCommand(keyboardEvent({ key: "ArrowRight" }).event), { type: "skip", seconds: 5 });
  assert.deepEqual(resolvePlaybackKeyboardCommand(keyboardEvent({ key: "ArrowLeft", shiftKey: true }).event), { type: "skip", seconds: -1 });
  assert.deepEqual(resolvePlaybackKeyboardCommand(keyboardEvent({ key: "ArrowRight", shiftKey: true }).event), { type: "skip", seconds: 1 });
});

test("playback keyboard shortcuts ignore modifiers, prevented events, and repeated Space", () => {
  for (const override of [
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { defaultPrevented: true },
    { repeat: true },
  ]) {
    assert.equal(resolvePlaybackKeyboardCommand(keyboardEvent(override).event), null);
  }
});

test("playback keyboard shortcuts ignore form controls, editable content, and textbox editors", () => {
  for (const selector of [
    "input",
    "textarea",
    "select",
    "button",
    "[contenteditable]:not([contenteditable=\"false\"])",
    "[role=\"textbox\"]",
    ".monaco-editor",
  ]) {
    const target = targetMatching(selector);
    assert.equal(isEditablePlaybackShortcutTarget(target), true);
    assert.equal(handlePlaybackKeyboardShortcut(keyboardEvent({ target }).event, {
      playing: false,
      canToggle: true,
      canSkip: true,
      play: () => assert.fail("editable targets must not play"),
      pause: () => assert.fail("editable targets must not pause"),
      skip: () => assert.fail("editable targets must not skip"),
    }), false);
  }
});

test("playback keyboard handler uses shared actions and prevents defaults only when handled", () => {
  const calls: string[] = [];
  const playback = {
    playing: false,
    canToggle: true,
    canSkip: true,
    play: () => { calls.push("play"); },
    pause: () => { calls.push("pause"); },
    skip: (seconds: number) => { calls.push(`skip ${seconds}`); },
  };
  const playEvent = keyboardEvent();
  assert.equal(handlePlaybackKeyboardShortcut(playEvent.event, playback), true);
  assert.equal(playEvent.wasPrevented(), true);

  const pauseEvent = keyboardEvent();
  assert.equal(handlePlaybackKeyboardShortcut(pauseEvent.event, { ...playback, playing: true }), true);
  assert.equal(pauseEvent.wasPrevented(), true);

  const skipEvent = keyboardEvent({ key: "ArrowLeft", shiftKey: true });
  assert.equal(handlePlaybackKeyboardShortcut(skipEvent.event, playback), true);
  assert.equal(skipEvent.wasPrevented(), true);
  assert.deepEqual(calls, ["play", "pause", "skip -1"]);

  const ignoredEvent = keyboardEvent({ key: "Escape" });
  assert.equal(handlePlaybackKeyboardShortcut(ignoredEvent.event, playback), false);
  assert.equal(ignoredEvent.wasPrevented(), false);
});

test("playback keyboard handler preserves safe no-op behavior before media is available", () => {
  let actionCount = 0;
  const playback = {
    playing: false,
    canToggle: false,
    canSkip: false,
    play: () => { actionCount += 1; },
    pause: () => { actionCount += 1; },
    skip: () => { actionCount += 1; },
  };

  for (const event of [keyboardEvent(), keyboardEvent({ key: "ArrowRight" })]) {
    assert.equal(handlePlaybackKeyboardShortcut(event.event, playback), false);
    assert.equal(event.wasPrevented(), false);
  }
  assert.equal(actionCount, 0);
});

test("starts paused with reset, non-persistent playback state", () => {
  assert.deepEqual(initialPlaybackState, {
    mediaResourceId: null,
    mediaSource: null,
    playing: false,
    currentTime: 0,
    duration: null,
    playbackRate: 1,
    continuous: false,
    loopEnabled: false,
    selectedLoopRange: null,
    linePlaybackRange: null,
    loopRangeEngaged: false,
    playbackEnded: false,
  });
});

test("global play, pause, and resume retain the current position", () => {
  const playing = reduce(
    initialPlaybackState,
    { type: "setSource", mediaResourceId: "audio-1", mediaSource: "/one.mp3", playing: true },
    { type: "setCurrentTime", currentTime: 7 },
  );
  const paused = playbackReducer(playing, { type: "setPlaying", playing: false });
  const resumed = playbackReducer(paused, { type: "setPlaying", playing: true });
  assert.equal(resumed.currentTime, 7);
  assert.equal(resumed.playing, true);
});

test("line play restarts at the line start", () => {
  const state = playbackReducer(
    { ...initialPlaybackState, currentTime: 13 },
    { type: "playLine", range: firstRange },
  );
  assert.equal(state.currentTime, 10);
  assert.equal(state.playing, true);
  assert.equal(state.linePlaybackRange?.lineId, "line-1");
});

test("continuous OFF stops at line end while ON continues", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  assert.deepEqual(getTimeUpdateDecision(linePlaying, 15), { type: "pause", time: 15 });
  const continuous = playbackReducer(linePlaying, { type: "setContinuous", continuous: true });
  assert.deepEqual(getTimeUpdateDecision(continuous, 15), { type: "continue" });
});

test("reaching a line boundary releases it so global Play can continue from that time", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  const stopped = playbackReducer(linePlaying, { type: "lineBoundaryReached", currentTime: 15 });
  const resumed = playbackReducer(stopped, { type: "setPlaying", playing: true });
  assert.equal(stopped.linePlaybackRange, null);
  assert.equal(stopped.currentTime, 15);
  assert.equal(getTimeUpdateDecision(resumed, 15).type, "continue");
});

test("continuous changes immediately affect a line playback range boundary", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  const on = playbackReducer(linePlaying, { type: "setContinuous", continuous: true });
  const off = playbackReducer(on, { type: "setContinuous", continuous: false });
  assert.equal(getTimeUpdateDecision(on, 16).type, "continue");
  assert.equal(getTimeUpdateDecision(off, 16).type, "pause");
});

test("Loop without a selected range overrides the line end and loops at media end", () => {
  const state = reduce(
    initialPlaybackState,
    { type: "playLine", range: firstRange },
    { type: "toggleLoop" },
  );
  assert.equal(getTimeUpdateDecision(state, 15).type, "continue");
  assert.equal(state.loopEnabled, true);
  assert.equal(state.selectedLoopRange, null);
});

test("line Loop selection enables Loop without starting playback", () => {
  const state = playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange });
  assert.equal(state.loopEnabled, true);
  assert.equal(state.playing, false);
  assert.equal(state.currentTime, 0);
  assert.equal(state.selectedLoopRange, firstRange);
});

test("selecting an out-of-range line Loop keeps current playback and media untouched", () => {
  const currentLine = { ...firstRange, lineId: "current", start: 0, end: 8 };
  const playing = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    playing: true,
    currentTime: 5,
    linePlaybackRange: currentLine,
  };
  const selected = playbackReducer(playing, { type: "toggleLineLoop", range: firstRange });
  assert.equal(selected.selectedLoopRange, firstRange);
  assert.equal(selected.loopEnabled, true);
  assert.equal(selected.playing, true);
  assert.equal(selected.currentTime, 5);
  assert.equal(selected.mediaSource, "/one.mp3");
  assert.equal(selected.linePlaybackRange, currentLine);
  assert.equal(selected.loopRangeEngaged, false);
});

test("selecting a Loop while already inside engages without pausing or seeking", () => {
  const playing = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    playing: true,
    currentTime: 12,
  };
  const selected = playbackReducer(playing, { type: "toggleLineLoop", range: firstRange });
  assert.equal(selected.playing, true);
  assert.equal(selected.currentTime, 12);
  assert.equal(selected.loopEnabled, true);
  assert.equal(selected.loopRangeEngaged, true);
  assert.equal(selected.linePlaybackRange, firstRange);
});

test("selecting a Loop on another media does not stop or switch current playback", () => {
  const otherMediaRange = {
    ...firstRange,
    lineId: "other-media-line",
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
  };
  const playing = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    playing: true,
    currentTime: 5,
  };
  const selected = playbackReducer(playing, { type: "toggleLineLoop", range: otherMediaRange });
  assert.equal(selected.playing, true);
  assert.equal(selected.mediaSource, "/one.mp3");
  assert.equal(selected.currentTime, 5);
  assert.equal(selected.selectedLoopRange, otherMediaRange);
  assert.equal(selected.loopRangeEngaged, false);
});

test("Controller line Loop selection dispatches only state selection with no media command", () => {
  const actions: Parameters<typeof playbackReducer>[1][] = [];
  dispatchLineLoopSelection(firstRange, (action) => actions.push(action));
  assert.deepEqual(actions, [{ type: "toggleLineLoop", range: firstRange }]);
});

test("an unengaged selected Loop starts at its range on the next global Play", () => {
  const waiting = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 5,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: false,
  };
  assert.equal(getSelectedLoopRangeToStart(waiting), firstRange);
  const started = playbackReducer(waiting, { type: "playLine", range: firstRange });
  assert.equal(started.currentTime, firstRange.start);
  assert.equal(started.playing, true);
  assert.equal(started.loopRangeEngaged, true);
});

test("an engaged selected Loop resumes its paused in-range position", () => {
  const pausedInLoop = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 12,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: true,
  };
  assert.equal(getSelectedLoopRangeToStart(pausedInLoop), null);
  const resumed = playbackReducer(pausedInLoop, { type: "setPlaying", playing: true });
  assert.equal(resumed.currentTime, 12);
  assert.equal(resumed.loopRangeEngaged, true);
});

test("a waiting Loop naturally engages on entering its range without pausing", () => {
  const waiting = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 9.9,
    playing: true,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: false,
  };
  const engaged = playbackReducer(waiting, { type: "setLoopRangeEngaged", engaged: true });
  assert.equal(engaged.playing, true);
  assert.equal(engaged.loopRangeEngaged, true);
  assert.equal(engaged.linePlaybackRange, firstRange);
});

test("natural playback crossing a short Loop range still engages before boundary handling", () => {
  assert.equal(hasPlaybackEnteredRange(9.9, 10.1, firstRange), true);
  assert.equal(hasPlaybackEnteredRange(9.9, 15.0001, firstRange), true);
  assert.equal(hasPlaybackEnteredRange(16, 16.1, firstRange), false);
});

test("stopping before an unengaged range keeps it as the next global Play target", () => {
  const waiting = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 5,
    playing: true,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: false,
  };
  const paused = playbackReducer(waiting, { type: "setPlaying", playing: false });
  const lineStopped = playbackReducer(waiting, { type: "lineBoundaryReached", currentTime: 8 });
  const mediaStopped = playbackReducer(waiting, { type: "mediaEnded" });
  assert.equal(paused.currentTime, 5);
  assert.equal(getSelectedLoopRangeToStart(paused), firstRange);
  assert.equal(getSelectedLoopRangeToStart(lineStopped), firstRange);
  assert.equal(getSelectedLoopRangeToStart(mediaStopped), firstRange);
});

test("stopped playback starts an unengaged Loop on its selected media source", () => {
  const otherMediaRange = {
    ...firstRange,
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
  };
  const stopped = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 5,
    loopEnabled: true,
    selectedLoopRange: otherMediaRange,
    loopRangeEngaged: false,
  };
  assert.equal(getSelectedLoopRangeToStart(stopped), otherMediaRange);
  const started = playbackReducer(stopped, { type: "playLine", range: otherMediaRange });
  assert.equal(started.mediaSource, "/two.mp3");
  assert.equal(started.currentTime, otherMediaRange.start);
  assert.equal(started.loopRangeEngaged, true);
});

test("line Loop repeats once playback enters the selected range", () => {
  const state = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "playLine", range: firstRange },
  );
  assert.deepEqual(getTimeUpdateDecision(state, 15), { type: "loop", time: 10 });
});

test("selecting another line changes the retained range without playing", () => {
  const state = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "toggleLineLoop", range: secondRange },
  );
  assert.equal(state.selectedLoopRange?.lineId, "line-2");
  assert.equal(state.playing, false);
});

test("global Loop OFF retains the range and ON reuses it", () => {
  const selected = playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange });
  const off = playbackReducer(selected, { type: "toggleLoop" });
  const on = playbackReducer(off, { type: "toggleLoop" });
  assert.equal(off.loopEnabled, false);
  assert.equal(off.selectedLoopRange, firstRange);
  assert.equal(on.loopEnabled, true);
  assert.equal(on.selectedLoopRange, firstRange);
});

test("pressing the selected line Loop clears selection and Loop only", () => {
  const selected = {
    ...playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange }),
    playing: true,
    currentTime: 12,
  };
  const cleared = playbackReducer(selected, { type: "toggleLineLoop", range: firstRange });
  assert.equal(cleared.selectedLoopRange, null);
  assert.equal(cleared.loopEnabled, false);
  assert.equal(cleared.playing, true);
  assert.equal(cleared.currentTime, 12);
});

test("Clear loop range preserves playback position and playing state", () => {
  const selected = {
    ...playbackReducer(initialPlaybackState, { type: "toggleLineLoop", range: firstRange }),
    playing: true,
    currentTime: 12,
  };
  const cleared = playbackReducer(selected, { type: "clearLoopRange" });
  assert.equal(cleared.selectedLoopRange, null);
  assert.equal(cleared.loopEnabled, false);
  assert.equal(cleared.playing, true);
  assert.equal(cleared.currentTime, 12);
});

test("pausing and resuming does not alter Loop state", () => {
  const looping = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "playLine", range: firstRange },
  );
  const resumed = reduce(
    looping,
    { type: "setPlaying", playing: false },
    { type: "setPlaying", playing: true },
  );
  assert.equal(resumed.loopEnabled, true);
  assert.equal(resumed.selectedLoopRange, firstRange);
  assert.equal(resumed.currentTime, 10);
});

test("seeking inside retains Loop while seeking outside disables Loop but retains range", () => {
  const looping = reduce(
    initialPlaybackState,
    { type: "toggleLineLoop", range: firstRange },
    { type: "setSource", mediaResourceId: "audio-1", mediaSource: "/one.mp3" },
  );
  const inside = playbackReducer(looping, { type: "seek", currentTime: 12 });
  const outside = playbackReducer(inside, { type: "seek", currentTime: 18 });
  assert.equal(inside.loopEnabled, true);
  assert.equal(inside.loopRangeEngaged, true);
  assert.equal(outside.loopEnabled, false);
  assert.equal(outside.selectedLoopRange, firstRange);
});

test("switching media resets the old source timing and line playback range", () => {
  const linePlaying = playbackReducer(initialPlaybackState, { type: "playLine", range: firstRange });
  const switched = playbackReducer(linePlaying, {
    type: "setSource",
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
    playing: true,
  });
  assert.equal(switched.mediaSource, "/two.mp3");
  assert.equal(switched.currentTime, 0);
  assert.equal(switched.duration, null);
  assert.equal(switched.linePlaybackRange, null);
});

test("media end stops normally and preserves full-source Loop for the controller to restart", () => {
  const stopped = playbackReducer(
    { ...initialPlaybackState, playing: true },
    { type: "mediaEnded" },
  );
  const looping = playbackReducer(
    { ...initialPlaybackState, playing: true, loopEnabled: true },
    { type: "mediaEnded" },
  );
  assert.equal(stopped.playing, false);
  assert.equal(looping.loopEnabled, true);
});

test("playback rate and stored preference parsing accept only supported values", () => {
  assert.equal(playbackReducer(initialPlaybackState, { type: "setPlaybackRate", playbackRate: 1.5 }).playbackRate, 1.5);
  assert.equal(parseStoredPlaybackRate("0.75"), 0.75);
  assert.equal(parseStoredPlaybackRate("3"), 1);
  assert.equal(parseStoredPlaybackRate("garbage"), 1);
  assert.equal(parseStoredContinuous("true"), true);
  assert.equal(parseStoredContinuous("false"), false);
});

test("Skip preserves Play/Pause, Continuous, rate, and full-source Loop state", () => {
  const base = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 10,
    continuous: true,
    playbackRate: 1.5 as const,
    loopEnabled: true,
  };
  const playing = playbackReducer({ ...base, playing: true }, { type: "skip", seconds: 2 });
  const paused = playbackReducer({ ...base, playing: false }, { type: "skip", seconds: -2 });
  assert.equal(playing.currentTime, 12);
  assert.equal(playing.playing, true);
  assert.equal(paused.currentTime, 8);
  assert.equal(paused.playing, false);
  assert.equal(playing.continuous, true);
  assert.equal(playing.playbackRate, 1.5);
  assert.equal(playing.loopEnabled, true);
});

test("Skip clamps at media start and end", () => {
  assert.equal(getClampedSkipTime(1, -10, 30), 0);
  assert.equal(getClampedSkipTime(29, 10, 30), 30);
  const atEnd = playbackReducer({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 29,
    playing: false,
  }, { type: "skip", seconds: 10 });
  assert.equal(atEnd.currentTime, 30);
  assert.equal(atEnd.playing, false);
});

test("Skip inside a selected Loop retains Loop; outside disables it and retains the range", () => {
  const looping = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 11,
    loopEnabled: true,
    selectedLoopRange: firstRange,
    loopRangeEngaged: true,
  };
  const inside = playbackReducer(looping, { type: "skip", seconds: 2 });
  const outside = playbackReducer(inside, { type: "skip", seconds: 10 });
  assert.equal(inside.currentTime, 13);
  assert.equal(inside.loopEnabled, true);
  assert.equal(outside.loopEnabled, false);
  assert.equal(outside.selectedLoopRange, firstRange);
});

test("Skip safely does nothing before media and duration are available", () => {
  assert.equal(playbackReducer(initialPlaybackState, { type: "skip", seconds: 2 }), initialPlaybackState);
  const noDuration = { ...initialPlaybackState, mediaSource: "/one.mp3", currentTime: 4 };
  assert.equal(playbackReducer(noDuration, { type: "skip", seconds: 2 }), noDuration);
});

test("time formatter includes milliseconds, hours, and safe invalid fallback", () => {
  assert.equal(formatPlaybackTime(0), "0:00.000");
  assert.equal(formatPlaybackTime(18.237), "0:18.237");
  assert.equal(formatPlaybackTime(337), "5:37.000");
  assert.equal(formatPlaybackTime(3661.004), "1:01:01.004");
  assert.equal(formatPlaybackTime(Number.NaN), "--:--.---");
  assert.equal(formatPlaybackTime(-1), "--:--.---");
  assert.equal(formatPlaybackTime(null), "--:--.---");
});

test("Loop overlay percentages are clamped to duration", () => {
  const percentages = getLoopRangePercentages({ start: 10, end: 15 }, 30);
  assert.ok(percentages);
  assert.ok(Math.abs(percentages.start - 100 / 3) < 0.000001);
  assert.ok(Math.abs(percentages.width - 100 / 6) < 0.000001);
  assert.deepEqual(getLoopRangePercentages({ start: -2, end: 40 }, 30), {
    start: 0,
    width: 100,
  });
  assert.equal(getLoopRangePercentages({ start: 1, end: 2 }, null), null);
});

test("full-source progress percentage is clamped and safe for invalid durations", () => {
  assert.equal(getPlaybackProgressPercentage(12, 30), 40);
  assert.equal(getPlaybackProgressPercentage(-2, 30), 0);
  assert.equal(getPlaybackProgressPercentage(40, 30), 100);
  assert.equal(getPlaybackProgressPercentage(1, null), 0);
  assert.equal(getPlaybackProgressPercentage(1, 0), 0);
  assert.equal(getPlaybackProgressPercentage(1, Number.NaN), 0);
  assert.equal(getPlaybackProgressPercentage(Number.NaN, 30), 0);
});

test("short Loop ranges gain only a five-pixel visual minimum", () => {
  const semanticRange = { start: 18.351, end: 19.486 };
  const percentages = getLoopRangePercentages(semanticRange, 337.971);
  assert.ok(percentages);
  assert.ok(percentages.width > 0.33 && percentages.width < 0.34);

  const style = getLoopRangeVisualStyle(percentages);
  assert.equal(style.width, `max(${percentages.width}%, 5px)`);
  assert.equal(
    style.left,
    `min(${percentages.start}%, calc(100% - max(${percentages.width}%, 5px)))`,
  );
  assert.deepEqual(semanticRange, { start: 18.351, end: 19.486 });
});

test("short Loop visual geometry stays inside both source edges", () => {
  const nearStart = getLoopRangePercentages({ start: 0, end: 0.1 }, 1000);
  const nearEnd = getLoopRangePercentages({ start: 999.9, end: 1000 }, 1000);
  assert.ok(nearStart);
  assert.ok(nearEnd);
  assert.equal(
    getLoopRangeVisualStyle(nearStart).left,
    `min(${nearStart.start}%, calc(100% - max(${nearStart.width}%, 5px)))`,
  );
  assert.equal(
    getLoopRangeVisualStyle(nearEnd).left,
    `min(${nearEnd.start}%, calc(100% - max(${nearEnd.width}%, 5px)))`,
  );
});

test("line Play becomes Pause only while shared playback is in its media range", () => {
  const inRange = {
    ...initialPlaybackState,
    playing: true,
    mediaSource: "/one.mp3",
    currentTime: 12,
  };
  assert.equal(isLineCurrentlyPlaying(inRange, firstRange), true);
  assert.equal(isLineCurrentlyPlaying({ ...inRange, playing: false }, firstRange), false);
  assert.equal(isLineCurrentlyPlaying({ ...inRange, currentTime: 15 }, firstRange), false);
  assert.equal(isLineCurrentlyPlaying({ ...inRange, mediaSource: "/two.mp3" }, firstRange), false);
});

test("current playback line follows position independently of Play/Pause state", () => {
  const playing = {
    ...initialPlaybackState,
    playing: true,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 12,
  };
  const paused = { ...playing, playing: false };

  assert.equal(resolveCurrentPlaybackLineId(playing, [firstRange, secondRange]), "line-1");
  assert.equal(
    resolveCurrentPlaybackLineId(paused, [firstRange, secondRange]),
    "line-1",
  );
  assert.equal(
    resolveCurrentPlaybackLineId({ ...playing, currentTime: 22 }, [firstRange, secondRange]),
    "line-2",
  );
});

test("line playback switches source, start position, and current line atomically", () => {
  const lineAState = playbackReducer(initialPlaybackState, {
    type: "playLine",
    range: firstRange,
  });
  const lineBRange = {
    ...secondRange,
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
  };
  const lineBState = playbackReducer(lineAState, {
    type: "playLine",
    range: lineBRange,
  });

  assert.equal(lineBState.mediaResourceId, lineBRange.mediaResourceId);
  assert.equal(lineBState.mediaSource, lineBRange.mediaSource);
  assert.equal(lineBState.currentTime, lineBRange.start);
  assert.equal(resolveCurrentPlaybackLineId(lineBState, [firstRange, lineBRange]), "line-2");
  assert.notEqual(resolveCurrentPlaybackLineId(lineBState, [firstRange, lineBRange]), "line-1");
});

test("current playback line requires matching selected media and valid alignment", () => {
  const state = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 12,
  };

  assert.equal(resolveCurrentPlaybackLineId(state, [null, undefined]), null);
  assert.equal(resolveCurrentPlaybackLineId({ ...state, mediaSource: null }, [firstRange]), null);
  assert.equal(resolveCurrentPlaybackLineId({ ...state, mediaSource: "/two.mp3" }, [firstRange]), null);
  assert.equal(resolveCurrentPlaybackLineId({ ...state, mediaResourceId: "audio-2" }, [firstRange]), null);
});

test("current playback line uses start-inclusive and end-exclusive boundaries", () => {
  const adjacentRange = { ...firstRange, lineId: "line-adjacent", start: 15, end: 20 };
  const state = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
  };

  assert.equal(
    resolveCurrentPlaybackLineId({ ...state, currentTime: 10 }, [firstRange, adjacentRange]),
    "line-1",
  );
  assert.equal(
    resolveCurrentPlaybackLineId({ ...state, currentTime: 15 }, [firstRange, adjacentRange]),
    "line-adjacent",
  );
  assert.equal(
    resolveCurrentPlaybackLineId({ ...state, currentTime: 20 }, [firstRange, adjacentRange]),
    null,
  );
});

test("current playback resolution returns at most one line and ignores Loop selection", () => {
  const overlappingRange = { ...firstRange, lineId: "line-overlap", start: 11, end: 14 };
  const state = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 12,
    loopEnabled: true,
    selectedLoopRange: secondRange,
  };

  assert.equal(
    resolveCurrentPlaybackLineId(state, [firstRange, overlappingRange, secondRange]),
    "line-1",
  );
});

test("playback end clears the current line and replay restores position matching", () => {
  const inLine = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    currentTime: 12,
  };
  const ended = playbackReducer(inLine, { type: "mediaEnded" });
  const replayed = playbackReducer(ended, { type: "setPlaying", playing: true });

  assert.equal(resolveCurrentPlaybackLineId(ended, [firstRange]), null);
  assert.equal(resolveCurrentPlaybackLineId(replayed, [firstRange]), "line-1");
});

test("engaged Loop keeps only its selected line active at and beyond the end boundary", () => {
  const nextRange = { ...firstRange, lineId: "line-2", start: 15, end: 20 };
  for (const currentTime of [15, 15.0001]) {
    const boundaryState = {
      ...initialPlaybackState,
      playing: true,
      mediaSource: "/one.mp3",
      currentTime,
      loopEnabled: true,
      selectedLoopRange: firstRange,
      loopRangeEngaged: true,
    };
    assert.equal(isLineCurrentlyPlaying(boundaryState, firstRange), true);
    assert.equal(isLineCurrentlyPlaying(boundaryState, nextRange), false);
    assert.deepEqual(getTimeUpdateDecision(boundaryState, currentTime), {
      type: "loop",
      time: 10,
    });
  }
});

test("Loop OFF keeps ordinary adjacent-line time matching", () => {
  const nextRange = { ...firstRange, lineId: "line-2", start: 15, end: 20 };
  const boundaryState = {
    ...initialPlaybackState,
    playing: true,
    mediaSource: "/one.mp3",
    currentTime: 15,
  };
  assert.equal(isLineCurrentlyPlaying(boundaryState, firstRange), false);
  assert.equal(isLineCurrentlyPlaying(boundaryState, nextRange), true);
});

test("line Pause delegates to the shared pause action without restarting the line", () => {
  let pauses = 0;
  let plays = 0;
  activateLinePlaybackControl({
    isLinePlaying: true,
    range: firstRange,
    pause: () => { pauses += 1; },
    playLine: () => { plays += 1; },
  });
  assert.equal(pauses, 1);
  assert.equal(plays, 0);

  activateLinePlaybackControl({
    isLinePlaying: false,
    range: firstRange,
    pause: () => { pauses += 1; },
    playLine: () => { plays += 1; },
  });
  assert.equal(pauses, 1);
  assert.equal(plays, 1);
});

const audio: MediaResource = {
  id: "audio-1",
  type: "media",
  mediaType: "audio",
  src: "/one.mp3",
};

function textLine(interval?: { start: number; end?: number }, resourceId = "audio-1"): TextLine {
  return {
    id: "line-1",
    content: { text: "hello", languageId: "en", formId: "surface" },
    textLineRefs: interval ? [{
      id: "alignment-1",
      body: { type: "alignment", mediaRef: { resourceId }, interval },
    }] : undefined,
  };
}

function renderPlaybackBarForTest(state: PlaybackState) {
  const noop = () => undefined;
  return renderToStaticMarkup(<PlaybackBar controller={{
    state,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
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
  } as unknown as PlaybackController} />);
}

test("line playback resolves the alignment mediaRef rather than guessing a source", () => {
  assert.deepEqual(resolveLinePlaybackRange(textLine({ start: 1, end: 2 }), [audio], String), {
    type: "line",
    lineId: "line-1",
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    start: 1,
    end: 2,
  });
});

test("missing and invalid timestamps are not playable", () => {
  assert.equal(resolveLinePlaybackRange(textLine(), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: -1, end: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 2, end: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 1, end: 2 }, "missing"), [audio], String), null);
});

test("a timestamp known to exceed media duration is not playable", () => {
  assert.equal(resolveLinePlaybackRange(
    textLine({ start: 1, end: 12 }),
    [audio],
    String,
    { mediaSource: "/one.mp3", duration: 10 },
  ), null);
});

test("playback bar exposes accessible controls and active Loop range", () => {
  const state: PlaybackState = {
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 12,
    loopEnabled: true,
    selectedLoopRange: firstRange,
  };
  const noop = () => undefined;
  const controller = {
    state,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: "/one.mp3",
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController;
  const html = renderToStaticMarkup(<PlaybackBar controller={controller} />);
  assert.match(html, /aria-label="Play media"/);
  assert.match(html, /aria-label="Seek"/);
  assert.match(html, /aria-label="Playback speed"/);
  assert.match(html, /aria-label="Clear loop range"/);
  assert.match(html, /data-loop-range="active"/);
  assert.match(html, /data-playback-timeline="full-source"/);
  assert.match(html, /data-track="base"/);
  assert.match(html, /data-track="progress"[^>]*style="width:40%"/);
  assert.match(html, /data-loop-range="active"[^>]*data-loop-scope="selection"[^>]*data-loop-start="10"[^>]*data-loop-end="15"/);
  assert.match(html, /data-loop-range="active"[^>]*class="[^"]*pointer-events-none[^"]*z-20/);
  assert.match(html, /aria-label="Seek"[^>]*class="[^"]*playback-seek-input[^"]*z-30[^"]*focus-visible:outline/);
  assert.match(html, /data-playback-time="current"[^>]*>0:12\.000/);
  assert.match(html, /data-loop-selection="active"[^>]*aria-label="Loop range from 0:10\.000 to 0:15\.000"[^>]*>Loop 0:10\.000–0:15\.000/);
  assert.match(html, /data-playback-time="duration"[^>]*>0:30\.000/);
  assert.match(html, /<button type="button" aria-label="Skip forward 2 seconds"/);
});

test("playback bar omits absent Loop status without reserving a placeholder row", () => {
  const html = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    currentTime: 12.345,
  });

  assert.doesNotMatch(html, /No loop range selected|Whole audio/);
  assert.doesNotMatch(html, /data-loop-selection=|aria-label="Clear loop range"/);
  assert.match(html, /data-playback-time="current"[^>]*>0:12\.345/);
  assert.match(html, /data-playback-time="duration"[^>]*>0:30\.000/);
});

test("selected Loop summary follows current time and precedes total duration", () => {
  const html = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 40,
    currentTime: 30.782,
    loopEnabled: true,
    selectedLoopRange: {
      ...firstRange,
      start: 25,
      end: 40,
    },
  });

  assert.match(
    html,
    /data-playback-time="current"[^>]*>0:30\.782[\s\S]*aria-hidden="true">·<\/span>[\s\S]*>Loop 0:25\.000–0:40\.000<\/span>[\s\S]*data-playback-time="duration"[^>]*>0:40\.000/,
  );
});

test("playback bar renders a short Loop selection with semantic boundaries and visual minimum", () => {
  const shortRange = {
    ...firstRange,
    start: 18.351,
    end: 19.486,
  };
  const html = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 337.971,
    selectedLoopRange: shortRange,
    loopEnabled: true,
  });
  assert.match(html, /data-loop-start="18\.351"/);
  assert.match(html, /data-loop-end="19\.486"/);
  assert.match(html, /width:max\([^;]+%, 5px\)/);
  assert.match(html, /data-loop-boundary="start"[^>]*style="left:[^;]+%"/);
  assert.match(html, /data-loop-boundary="end"[^>]*style="left:[^;]+%"/);
});

test("playback bar distinguishes a retained but inactive Loop range", () => {
  const noop = () => undefined;
  const controller = {
    state: {
      ...initialPlaybackState,
      mediaResourceId: "audio-1",
      mediaSource: "/one.mp3",
      duration: 30,
      selectedLoopRange: firstRange,
    },
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: "/one.mp3",
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController;
  const html = renderToStaticMarkup(<PlaybackBar controller={controller} />);
  assert.match(html, /data-loop-range="inactive"/);
  assert.match(html, /data-loop-selection="inactive"/);
  assert.match(html, /\(inactive\)/);
});

test("playback bar shows whole-source Loop and hides a different source selection", () => {
  const wholeSourceHtml = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    duration: 30,
    loopEnabled: true,
  });
  assert.match(wholeSourceHtml, /data-loop-range="active"[^>]*data-loop-scope="full-source"[^>]*data-loop-start="0"[^>]*data-loop-end="30"/);
  assert.match(wholeSourceHtml, /style="left:0%;width:100%"/);

  const mismatchedHtml = renderPlaybackBarForTest({
    ...initialPlaybackState,
    mediaResourceId: "audio-2",
    mediaSource: "/two.mp3",
    duration: 30,
    loopEnabled: true,
    selectedLoopRange: firstRange,
  });
  assert.doesNotMatch(mismatchedHtml, /data-loop-range=/);
});

test("playback bar safely disables seek and Loop overlay for invalid durations", () => {
  for (const duration of [null, 0, Number.NaN]) {
    const html = renderPlaybackBarForTest({
      ...initialPlaybackState,
      mediaResourceId: "audio-1",
      mediaSource: "/one.mp3",
      duration,
      loopEnabled: true,
      selectedLoopRange: firstRange,
    });
    assert.match(html, /aria-label="Seek"[^>]*max="0"[^>]*disabled=""/);
    assert.doesNotMatch(html, /data-loop-range=/);
    assert.doesNotMatch(html, /NaN/);
  }
});

test("line controls have accessible names and expose invalid and selected states", () => {
  const invalidHtml = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
      layoutVariant="grid"
      textContent="Invalid"
      hasPlaybackTiming
      playbackRange={null}
    />,
  );
  assert.match(invalidHtml, /<button[^>]*disabled=""[^>]*aria-label="Play this line"/);
  assert.match(invalidHtml, /<button[^>]*disabled=""[^>]*aria-label="Loop this line"/);

  const selectedHtml = renderToStaticMarkup(
    <ScriptLine
      style={viewerStyle}
      linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
      layoutVariant="grid"
      textContent="Selected"
      hasPlaybackTiming
      playbackRange={firstRange}
      isLoopSelected
      loopEnabled
    />,
  );
  assert.match(selectedHtml, /aria-label="Clear loop range"/);
  assert.match(selectedHtml, /aria-pressed="true"/);
  assert.match(selectedHtml, /data-loop-selected="active"/);
});

test("global controls keep Continuous text fixed and expose state through semantics and styling", () => {
  const noop = () => undefined;
  const render = (continuous: boolean, loopEnabled: boolean) => renderToStaticMarkup(
    <PlaybackBar controller={{
      state: { ...initialPlaybackState, continuous, loopEnabled },
      actions: {
        play: noop,
        pause: noop,
        seek: noop,
        skip: noop,
        playLine: noop,
        setContinuous: noop,
        toggleLoop: noop,
        toggleLineLoop: noop,
        clearLoopRange: noop,
        setPlaybackRate: noop,
      },
      mediaProps: {
        ref: noop,
        src: undefined,
        onLoadedMetadata: noop,
        onDurationChange: noop,
        onTimeUpdate: noop,
        onPlay: noop,
        onPause: noop,
        onEnded: noop,
      },
    } as unknown as PlaybackController} />,
  );
  const offHtml = render(false, false);
  const onHtml = render(true, true);
  assert.match(offHtml, /aria-label="Enable continuous playback"[^>]*data-playback-toggle="continuous"[^>]*data-state="off"[^>]*>Continuous<\/button>/);
  assert.match(offHtml, /data-playback-toggle="continuous"[^>]*data-state="off"[^>]*class="[^"]*border-gray-400[^"]*text-gray-500/);
  assert.match(onHtml, /aria-pressed="true"[^>]*aria-label="Disable continuous playback"[^>]*data-playback-toggle="continuous"[^>]*data-state="on"[^>]*>Continuous<\/button>/);
  assert.doesNotMatch(offHtml, /Continuous: (?:ON|OFF)/);
  assert.doesNotMatch(onHtml, /Continuous: (?:ON|OFF)/);
  assert.match(offHtml, /aria-label="Enable loop"/);
  assert.match(onHtml, /aria-label="Disable loop"/);
  assert.match(onHtml, /aria-pressed="true" aria-label="Disable loop"/);
  assert.doesNotMatch(offHtml, /Loop: (?:ON|OFF)/);
  assert.match(offHtml, /focus-visible:outline/);
  assert.match(offHtml, /aria-pressed="true" aria-label="Set playback speed to 1×"/);
  const controlsLayout = offHtml.match(
    /<div class="([^"]*)" data-playback-controls-layout="transport-stack">/,
  );
  assert.ok(controlsLayout);
  assert.match(controlsLayout[1], /flex/);
  assert.match(controlsLayout[1], /flex-wrap/);
  assert.match(controlsLayout[1], /justify-start/);
  assert.doesNotMatch(controlsLayout[1], /grid-cols|justify-between/);
  assert.match(
    offHtml,
    /data-playback-cluster="transport"[\s\S]*data-playback-cluster="speed"[\s\S]*data-playback-cluster="state"/,
  );
  assert.match(offHtml, /aria-label="Seek"[^>]*class="[^"]*w-full/);
});

test("Skip is part of the shared Playback Controller public actions", () => {
  const actionName: keyof PlaybackController["actions"] = "skip";
  assert.equal(actionName, "skip");
});

test("global controls render four Skip buttons and disable them without selected media", () => {
  const noop = () => undefined;
  const html = renderToStaticMarkup(<PlaybackBar controller={{
    state: initialPlaybackState,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: undefined,
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController} />);
  for (const [seconds, label, visibleAmount, chevronCount] of [
    [-10, "Skip backward 10 seconds", "10s", 2],
    [-2, "Skip backward 2 seconds", "2s", 1],
    [2, "Skip forward 2 seconds", "2s", 1],
    [10, "Skip forward 10 seconds", "10s", 2],
  ] as const) {
    assert.match(
      html,
      new RegExp(`<button[^>]*disabled=""[^>]*aria-label="${label}"[^>]*data-skip-seconds="${seconds}"[^>]*>[\\s\\S]*?data-playback-icon="skip-(?:backward|forward)"[\\s\\S]*?>${visibleAmount}</span>`),
    );
    const buttonMarkup = html.match(
      new RegExp(`<button[^>]*data-skip-seconds="${seconds}"[^>]*>[\\s\\S]*?</button>`),
    )?.[0];
    assert.ok(buttonMarkup);
    assert.equal((buttonMarkup.match(/<path/g) ?? []).length, chevronCount);
  }
  for (const rate of PLAYBACK_RATES) {
    assert.match(html, new RegExp(`>${rate}×</button>`));
  }
});

test("transport, speed, and state controls follow their visual and focus order", () => {
  const html = renderPlaybackBarForTest(initialPlaybackState);
  const labels = [...html.matchAll(/<button[^>]*aria-label="([^"]+)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(labels, [
    "Skip backward 10 seconds",
    "Skip backward 2 seconds",
    "Play media",
    "Skip forward 2 seconds",
    "Skip forward 10 seconds",
    ...PLAYBACK_RATES.map((rate) => `Set playback speed to ${rate}×`),
    "Enable continuous playback",
    "Enable loop",
  ]);
});

test("global and row Loop controls share the same SVG icon without visible Loop state text", () => {
  const noop = () => undefined;
  const globalHtml = renderToStaticMarkup(<PlaybackBar controller={{
    state: initialPlaybackState,
    actions: {
      play: noop,
      pause: noop,
      seek: noop,
      skip: noop,
      playLine: noop,
      setContinuous: noop,
      toggleLoop: noop,
      toggleLineLoop: noop,
      clearLoopRange: noop,
      setPlaybackRate: noop,
    },
    mediaProps: {
      ref: noop,
      src: undefined,
      onLoadedMetadata: noop,
      onDurationChange: noop,
      onTimeUpdate: noop,
      onPlay: noop,
      onPause: noop,
      onEnded: noop,
    },
  } as unknown as PlaybackController} />);
  const rowHtml = renderToStaticMarkup(<ScriptLine
    style={viewerStyle}
    linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
    layoutVariant="grid"
    textContent="Line"
    hasPlaybackTiming
    playbackRange={firstRange}
  />);
  assert.match(globalHtml, /data-playback-icon="loop"/);
  assert.match(rowHtml, /data-playback-icon="loop"/);
  assert.match(globalHtml, /class="[^"]*border-gray-400[^"]*text-gray-500[^"]*"[^>]*>[\s\S]*data-playback-icon="loop"/);
  assert.match(rowHtml, /class="[^"]*border-gray-400[^"]*text-gray-500[^"]*"[^>]*>[\s\S]*data-playback-icon="loop"/);
  assert.match(globalHtml, /aria-label="Enable loop"/);
  assert.match(rowHtml, /aria-label="Loop this line"/);
  assert.doesNotMatch(globalHtml, />Loop(?::| ON| OFF)/);
  assert.doesNotMatch(rowHtml, />Loop(?::| ON| OFF)/);
});

test("row control renders shared Pause icon when playback reaches the line", () => {
  const html = renderToStaticMarkup(<ScriptLine
    style={viewerStyle}
    linePresentation={NEUTRAL_SCRIPT_LINE_PRESENTATION}
    layoutVariant="grid"
    textContent="Playing"
    hasPlaybackTiming
    playbackRange={firstRange}
    isLinePlaying
  />);
  assert.match(html, /aria-label="Pause this line"/);
  assert.match(html, /data-playback-icon="pause"/);
  assert.doesNotMatch(html, /data-playback-icon="play"/);
});
