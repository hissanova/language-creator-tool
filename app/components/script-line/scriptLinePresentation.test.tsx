import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Speaker } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import { viewerStyle } from "../../styles/viewerStyle";
import { resolveSpeakerLinePresentation } from "../../styles/speakerLinePresentation";
import {
  SCRIPT_LINE_RAIL_WIDTH,
  resolveScriptLinePresentation,
} from "../../styles/scriptLinePresentation";
import { ScriptLine } from "../ScriptLine";
import { ConversationScriptLine } from "./ConversationScriptLine";
import { DeveloperScriptLine } from "./DeveloperScriptLine";

const speakers: Speaker[] = Array.from({ length: 10 }, (_, index) => ({
  id: `speaker-${String.fromCharCode(97 + index)}`,
  name: `Speaker ${String.fromCharCode(65 + index)}`,
}));

function resolve(speakerId?: string, speakerList: readonly Speaker[] = speakers) {
  return resolveSpeakerLinePresentation({ speakerId, speakers: speakerList });
}

function frameTag(html: string) {
  const match = html.match(/<div[^>]*class="[^"]*w-full[^"]*"[^>]*>/);
  assert.ok(match);
  return match[0];
}

function frameStyle(html: string) {
  const match = frameTag(html).match(/style="([^"]+)"/);
  assert.ok(match);
  return match[1];
}

const textNode: TextLine = {
  id: "line-1",
  content: { text: "Body text", languageId: "en", formId: "written" },
  textLineRefs: [
    { id: "speaker-ref", body: { type: "speaker", speakerId: "speaker-a" } },
  ],
};

const sharedCompositionProps = {
  textNode,
  speakers,
  formId: "written",
  translationLanguageId: "none",
  style: viewerStyle,
};

test("the fixed line treatment keeps geometry stable and emphasizes only the current line", () => {
  const speakerPresentation = resolve("speaker-a");
  const inactive = resolveScriptLinePresentation(speakerPresentation, false);
  const active = resolveScriptLinePresentation(speakerPresentation, true);

  assert.equal(inactive.frameClassName, "script-line-rail-left");
  assert.equal(inactive.frameClassName, active.frameClassName);
  assert.equal(inactive.frameStyle?.paddingLeft, active.frameStyle?.paddingLeft);
  assert.equal(
    inactive.frameStyle?.paddingLeft,
    `calc(0.5rem + ${SCRIPT_LINE_RAIL_WIDTH})`,
  );
  assert.equal(inactive.frameStyle?.["--script-line-rail-width"], SCRIPT_LINE_RAIL_WIDTH);
  assert.equal(active.frameStyle?.["--script-line-rail-width"], SCRIPT_LINE_RAIL_WIDTH);
  assert.equal(
    inactive.frameStyle?.["--script-line-rail-outline"],
    active.frameStyle?.["--script-line-rail-outline"],
  );
  assert.match(
    String(inactive.frameStyle?.["--script-line-rail-outline"]),
    /var\(--foreground\).*var\(--background\)/,
  );
  assert.equal(
    inactive.frameStyle?.["--script-line-rail-fill"],
    speakerPresentation.backgroundColor,
  );
  assert.equal(
    active.frameStyle?.["--script-line-rail-fill"],
    speakerPresentation.labelColor,
  );
  assert.equal(inactive.backgroundColor, speakerPresentation.backgroundColor);
  assert.equal(
    active.backgroundColor,
    `color-mix(in srgb, ${speakerPresentation.backgroundColor} 84%, ${speakerPresentation.accentColor} 16%)`,
  );
  assert.equal(inactive.frameStyle?.boxShadow, undefined);
  assert.equal(inactive.frameStyle?.transform, undefined);
  assert.equal(active.frameStyle?.boxShadow, "var(--script-line-elevation-shadow)");
  assert.equal(active.frameStyle?.transform, "translateY(-1px)");
  assert.equal(active.frameStyle?.zIndex, 1);
});

test("the fixed left rail is a full-height reversed-D pseudo-element", () => {
  const globalsSource = readFileSync("app/globals.css", "utf8");
  const railRules = globalsSource.match(/\.script-line-rail-left::before\s*\{/g);

  assert.equal(railRules?.length, 1);
  assert.match(
    globalsSource,
    /\.script-line-rail-left::before[\s\S]*top: -1px[\s\S]*bottom: -1px[\s\S]*left: -1px[\s\S]*width: var\(--script-line-rail-width\)[\s\S]*border: 1px solid var\(--script-line-rail-outline\)[\s\S]*border-radius: var\(--script-line-radius\) 0 0 var\(--script-line-radius\)/,
  );
  assert.match(globalsSource, /pointer-events: none/);
  assert.doesNotMatch(globalsSource, /script-line-rail-(?:right|both|none)/);
});

test("current-line emphasis preserves the resolved speaker presentation fields", () => {
  const speakerPresentation = resolve("speaker-a");
  const resolved = resolveScriptLinePresentation(speakerPresentation, true);

  assert.equal(resolved.accentColor, speakerPresentation.accentColor);
  assert.equal(resolved.labelColor, speakerPresentation.labelColor);
  assert.equal(resolved.labelClassName, speakerPresentation.labelClassName);
  assert.equal(resolved.labelStyle, speakerPresentation.labelStyle);
});

test("elevation uses the selected light and dark recipes", () => {
  const globalsSource = readFileSync("app/globals.css", "utf8");
  const elevated = resolveScriptLinePresentation(resolve("speaker-a"), true);
  const recipes = [...globalsSource.matchAll(
    /--script-line-elevation-shadow:\s*([\s\S]*?);/g,
  )].map((match) => match[1].replace(/\s+/g, " ").trim());
  const lightRecipe =
    "0 2px 4px rgba(15, 23, 42, 0.24), 0 8px 18px rgba(15, 23, 42, 0.3)";
  const darkRecipe =
    "0 2px 6px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.3), 0 5px 10px 5px rgba(255, 255, 255, 0.6)";

  assert.match(String(elevated.frameStyle?.boxShadow), /var\(--script-line-elevation-shadow\)/);
  assert.deepEqual(recipes, [lightRecipe, darkRecipe, darkRecipe, lightRecipe]);
  assert.notEqual(lightRecipe, darkRecipe);
  const systemDarkIndex = globalsSource.indexOf("@media (prefers-color-scheme: dark)");
  const explicitDarkIndex = globalsSource.indexOf("html.dark");
  const explicitLightIndex = globalsSource.indexOf("html.light");

  assert.ok(systemDarkIndex >= 0);
  assert.ok(explicitDarkIndex > systemDarkIndex);
  assert.ok(explicitLightIndex > explicitDarkIndex);
});

test("every composed line uses the same fixed treatment in Conversation and Developer modes", () => {
  for (const isCurrentPlaybackLine of [false, true]) {
    const currentProps = {
      ...sharedCompositionProps,
      isCurrentPlaybackLine,
    };
    const conversationHtml = renderToStaticMarkup(
      <ConversationScriptLine {...currentProps} />,
    );
    const developerHtml = renderToStaticMarkup(
      <DeveloperScriptLine {...currentProps} />,
    );

    assert.equal(frameStyle(conversationHtml), frameStyle(developerHtml));
    for (const html of [conversationHtml, developerHtml]) {
      const frame = frameTag(html);
      assert.match(frame, /class="[^"]*script-line-rail-left[^"]*"/);
      assert.match(frame, /--script-line-rail-outline:color-mix\(in srgb, var\(--foreground\) 48%, var\(--background\)\)/);
      if (isCurrentPlaybackLine) {
        assert.match(frame, /background-color:color-mix\(in srgb, #eff6ff 84%, #2563eb 16%\)/);
        assert.match(frame, /--script-line-rail-fill:#1e40af/);
        assert.match(frame, /box-shadow:var\(--script-line-elevation-shadow\)/);
        assert.match(frame, /transform:translateY\(-1px\)/);
        assert.match(frame, /aria-current="true"/);
      } else {
        assert.match(frame, /background-color:#eff6ff/);
        assert.match(frame, /--script-line-rail-fill:#eff6ff/);
        assert.doesNotMatch(frame, /box-shadow|transform|aria-current/);
      }
      assert.doesNotMatch(frame, /(?:^|;)outline(?:-|:)/);
    }
  }
});

test("ordinary Viewer rendering has no highlight experiment query API", () => {
  const switcherSource = readFileSync("app/components/ViewerSwitcher.tsx", "utf8");
  assert.doesNotMatch(
    switcherSource,
    /useSearchParams|activeLineRail|activeLineBackground|activeLineElevation|lineHighlightExperiment/,
  );
});

test("current-line semantics and visual state remain independent from Play/Pause", () => {
  const currentPresentation = resolveScriptLinePresentation(
    resolve("speaker-a"),
    true,
  );
  const pausedCurrentHtml = renderToStaticMarkup(
    <ScriptLine
      speaker={speakers[0]}
      linePresentation={currentPresentation}
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Current"
      hasPlaybackTiming
      playbackRange={{
        type: "line",
        lineId: "line-1",
        mediaResourceId: "audio-1",
        mediaSource: "/one.mp3",
        start: 10,
        end: 15,
      }}
      isCurrentPlaybackLine
      isLinePlaying={false}
    />,
  );
  const nonCurrentHtml = renderToStaticMarkup(
    <ScriptLine
      linePresentation={resolveScriptLinePresentation(resolve("speaker-b"), false)}
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Other"
    />,
  );

  assert.match(frameTag(pausedCurrentHtml), /aria-current="true"/);
  assert.match(pausedCurrentHtml, /data-playback-icon="play"/);
  assert.doesNotMatch(pausedCurrentHtml, /data-playback-icon="pause"/);
  assert.doesNotMatch(nonCurrentHtml, /aria-current/);
  assert.match(nonCurrentHtml, /--script-line-rail-fill:#ecfdf5/);
  assert.match(frameTag(pausedCurrentHtml), /--script-line-rail-fill:#1e40af/);
  assert.match(nonCurrentHtml, /background-color:#ecfdf5/);
  assert.doesNotMatch(nonCurrentHtml, /box-shadow|transform/);
  assert.doesNotMatch(`${pausedCurrentHtml}${nonCurrentHtml}`, /aria-live/);
});

test("line-highlight resolution has no content-specific branching", () => {
  const resolverSource = readFileSync(
    "app/styles/scriptLinePresentation.ts",
    "utf8",
  );

  assert.doesNotMatch(
    resolverSource,
    /speakerId|languageId|textNode|documentType|Simon|Lan|Kanaa/,
  );
});

test("annotation slots remain inside a stable full-width outer frame", () => {
  const presentation = resolve("speaker-a");
  const withoutPanel = renderToStaticMarkup(
    <ScriptLine
      linePresentation={presentation}
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Body text"
    />,
  );
  const withPanel = renderToStaticMarkup(
    <ScriptLine
      linePresentation={presentation}
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Body text"
      bottomSlot={<div data-test-panel>Panel</div>}
    />,
  );
  assert.match(frameTag(withoutPanel), /w-full/);
  assert.match(frameTag(withPanel), /w-full/);
  assert.equal(frameStyle(withoutPanel), frameStyle(withPanel));
  assert.match(withPanel, /data-test-panel="true"/);
});

test("shared Viewer and frame layers contain no speaker presentation resolution API", () => {
  const viewerShellSource = readFileSync("app/components/ViewerShell.tsx", "utf8");
  const frameSource = readFileSync(
    "app/components/script-line/ScriptLineFrame.tsx",
    "utf8",
  );

  assert.doesNotMatch(viewerShellSource, /getSpeakerRef|resolveSpeakerLinePresentation/);
  assert.doesNotMatch(frameSource, /speakerId|data-speaker-id/);
});
