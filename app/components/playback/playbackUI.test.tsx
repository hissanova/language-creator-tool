import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScriptLine } from "../ScriptLine";
import { NEUTRAL_SCRIPT_LINE_PRESENTATION } from "../../styles/scriptLinePresentation";
import { viewerStyle } from "../../styles/viewerStyle";
import { PlaybackBar } from "./PlaybackBar";
import { releasePlaybackButtonFocusOnPointerUp } from "./playbackButtonFocus";
import type { PlaybackController } from "./usePlaybackController";
import type { PlaybackState } from "./playbackState";
import { firstRange, withMedia, noop } from "./playbackTestFixtures";

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


test("Space and mouse global Play share the same atomic controller action", () => {
  const bar = readFileSync("app/components/playback/PlaybackBar.tsx", "utf8");
  const keyboard = readFileSync("app/components/playback/playbackKeyboardShortcuts.ts", "utf8");
  const controller = readFileSync("app/components/playback/usePlaybackController.ts", "utf8");
  assert.match(bar, /onClick=\{state\.playing \? actions\.pause : actions\.play\}/);
  assert.match(keyboard, /play: actions\.play/);
  assert.match(controller, /execute\(planGlobalPlay\(stateRef\.current/);
  assert.match(controller, /execute\(planLinePlay\(stateRef\.current, range\)\)/);
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
  assert.match(viewer, /onToggleLineLock=\{context\.toggleLineLock\}/);
  assert.match(conversation, /isRangeLocked=\{isRangeLocked\}/);
  assert.match(developer, /isRangeLocked=\{isRangeLocked\}/);
});
