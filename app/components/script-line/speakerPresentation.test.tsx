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
import { NEUTRAL_SCRIPT_LINE_PRESENTATION } from "../../styles/scriptLinePresentation";
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
  assert.match(outerFrame, /border-left-color:#2563eb/);
  assert.match(outerFrame, /border-left-width:3px/);
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
