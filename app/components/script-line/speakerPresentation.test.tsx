import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Speaker } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import { viewerStyle } from "../../styles/viewerStyle";
import {
  SPEAKER_LINE_FALLBACK_PALETTE,
  resolveSpeakerLinePresentation,
} from "../../styles/speakerLinePresentation";
import {
  NEUTRAL_SCRIPT_LINE_PRESENTATION,
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

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g);
  assert.ok(channels);
  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
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

test("assigns deterministic fallback styles from metadata order", () => {
  speakers.slice(0, SPEAKER_LINE_FALLBACK_PALETTE.length).forEach((speaker, index) => {
    const presentation = resolve(speaker.id);
    assert.deepEqual(
      {
        backgroundColor: presentation.backgroundColor,
        accentColor: presentation.accentColor,
        labelColor: presentation.labelColor,
      },
      SPEAKER_LINE_FALLBACK_PALETTE[index],
    );
  });
  assert.deepEqual(resolve("speaker-d"), resolve("speaker-d"));
});

test("application defaults contain no speaker-specific overrides", () => {
  assert.equal(viewerStyle.speakers, undefined);
});

test("appending metadata speakers preserves existing assignments", () => {
  const original = speakers.slice(0, 2);
  const before = original.map((speaker) => resolve(speaker.id, original));
  const extended = [...original, { id: "added", name: "Added" }];
  const after = original.map((speaker) => resolve(speaker.id, extended));
  assert.deepEqual(after, before);
});

test("cycles the eight-entry palette deterministically", () => {
  assert.equal(SPEAKER_LINE_FALLBACK_PALETTE.length, 8);
  assert.deepEqual(resolve("speaker-i"), resolve("speaker-a"));
  assert.deepEqual(resolve("speaker-j"), resolve("speaker-b"));
});

test("explicit and partial Viewer overrides take precedence over fallback fields", () => {
  const full = resolveSpeakerLinePresentation({
    speakerId: "speaker-a",
    speakers,
    overrides: {
      "speaker-a": {
        backgroundColor: "#ffffff",
        accentColor: "#111111",
        nameColor: "#222222",
      },
    },
  });
  assert.deepEqual(full, {
    backgroundColor: "#ffffff",
    accentColor: "#111111",
    labelColor: "#222222",
    labelClassName: undefined,
    labelStyle: undefined,
  });

  const partial = resolveSpeakerLinePresentation({
    speakerId: "speaker-b",
    speakers,
    overrides: { "speaker-b": { nameColor: "#123456" } },
  });
  assert.equal(partial.labelColor, "#123456");
  assert.equal(partial.backgroundColor, SPEAKER_LINE_FALLBACK_PALETTE[1].backgroundColor);
  assert.equal(partial.accentColor, SPEAKER_LINE_FALLBACK_PALETTE[1].accentColor);
});

test("an explicit override is scoped to the ViewerStyle that supplies it", () => {
  const overridden = resolveSpeakerLinePresentation({
    speakerId: "speaker-a",
    speakers,
    overrides: { "speaker-a": { backgroundColor: "#ffffff" } },
  });
  const withoutOverrides = resolveSpeakerLinePresentation({
    speakerId: "speaker-a",
    speakers,
  });

  assert.equal(overridden.backgroundColor, "#ffffff");
  assert.deepEqual(withoutOverrides, {
    ...SPEAKER_LINE_FALLBACK_PALETTE[0],
    labelClassName: undefined,
    labelStyle: undefined,
  });
});

test("unknown and missing speaker IDs use the neutral fallback", () => {
  assert.deepEqual(resolve("not-in-metadata"), {
    ...NEUTRAL_SCRIPT_LINE_PRESENTATION,
    labelClassName: undefined,
    labelStyle: undefined,
  });
  assert.deepEqual(resolve(), {
    ...NEUTRAL_SCRIPT_LINE_PRESENTATION,
    labelClassName: undefined,
    labelStyle: undefined,
  });
});

test("resolution does not mutate Core speaker metadata or Viewer overrides", () => {
  const speakerInput = structuredClone(speakers);
  const overrides = { "speaker-a": { nameColor: "#123456" } };
  const overridesInput = structuredClone(overrides);
  resolveSpeakerLinePresentation({ speakerId: "speaker-a", speakers, overrides });
  assert.deepEqual(speakers, speakerInput);
  assert.deepEqual(overrides, overridesInput);
});

test("palette label colors meet WCAG AA contrast against their backgrounds", () => {
  for (const presentation of [
    ...SPEAKER_LINE_FALLBACK_PALETTE,
    NEUTRAL_SCRIPT_LINE_PRESENTATION,
  ]) {
    assert.ok(contrastRatio(presentation.labelColor, presentation.backgroundColor) >= 4.5);
  }
});

test("ScriptLine applies presentation only to the outer frame and speaker label", () => {
  const presentation = resolve("speaker-a");
  const html = renderToStaticMarkup(
    <ScriptLine
      speaker={speakers[0]}
      linePresentation={presentation}
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Body text"
      hasPlaybackTiming
      playbackRange={null}
    />,
  );

  const outerFrame = frameTag(html);
  assert.doesNotMatch(outerFrame, /data-speaker-id/);
  assert.match(outerFrame, /background-color:#eff6ff/);
  assert.doesNotMatch(outerFrame, /border-left-color|border-left-width/);
  assert.doesNotMatch(outerFrame, /(?:^|;)color:/);
  assert.match(html, /<span[^>]*style="color:#1e40af"[^>]*>Speaker A:/);
  assert.match(html, /<span>Body text<\/span>/);
  assert.doesNotMatch(html, /<button[^>]*style="[^"]*color:/);
});

test("ScriptLine keeps the generic speaker.default frame and name classes", () => {
  const html = renderToStaticMarkup(
    <ScriptLine
      speaker={speakers[0]}
      linePresentation={resolve("speaker-a")}
      style={viewerStyle}
      layoutVariant="grid"
      textContent="Body text"
    />,
  );

  assert.match(frameTag(html), /rounded-xl border border-gray-200 p-2/);
  assert.match(html, /class="mb-2 font-bold"/);
});

test("Conversation and Developer compositions use the same speaker frame presentation", () => {
  const conversationHtml = renderToStaticMarkup(
    <ConversationScriptLine {...sharedCompositionProps} />,
  );
  const developerHtml = renderToStaticMarkup(
    <DeveloperScriptLine {...sharedCompositionProps} />,
  );
  assert.equal(frameStyle(conversationHtml), frameStyle(developerHtml));
  assert.match(conversationHtml, /style="color:#1e40af"/);
  assert.match(developerHtml, /style="color:#1e40af"/);
});

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

  assert.match(
    globalsSource,
    /\.script-line-rail-left::before[\s\S]*top: -1px[\s\S]*bottom: -1px[\s\S]*width: var\(--script-line-rail-width\)[\s\S]*border: 1px solid var\(--script-line-rail-outline\)[\s\S]*left: -1px[\s\S]*border-radius: var\(--script-line-radius\) 0 0 var\(--script-line-radius\)/,
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
