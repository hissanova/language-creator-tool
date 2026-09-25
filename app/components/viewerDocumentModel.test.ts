import assert from "node:assert/strict";
import test from "node:test";
import type { Document, MediaResource, Section } from "../types/core/document";
import type { TextLine } from "../types/core/textLine";
import { normalizeMediaSrc } from "./media/normalizeMediaSrc";
import {
  buildLinePlaybackRangeIndex,
  classifyViewerMediaResources,
  collectDocumentTextLines,
  deriveViewerDocumentOptions,
  resolveSectionPlaybackRange,
  resolveViewerLinePlaybackPresentation,
  resolveViewerSpeakers,
} from "./viewerDocumentModel";

const audio: MediaResource = { id: "audio", type: "media", mediaType: "audio", src: "/public/one.mp3" };
const otherAudio: MediaResource = { id: "other", type: "media", mediaType: "audio", src: "/two.mp3" };

function document(
  metadata: Partial<Document["metadata"]> = {},
  resources: Document["resources"] = [],
  sections: Document["sections"] = [],
): Document {
  return { metadata: { specVersion: "1", title: "Test", ...metadata }, resources, sections };
}

function line(id: string, interval?: { start: number; end?: number }, resourceId = "audio"): TextLine {
  return {
    id,
    content: { text: id, languageId: "en", formId: "plain" },
    textLineRefs: interval ? [{
      id: `alignment-${id}`,
      body: { type: "alignment", mediaRef: { resourceId }, interval },
    }] : undefined,
  };
}

const block = (text: TextLine): Section["blocks"][number] => ({ type: "text", text });

test("the canonical source form is the fallback instead of an unavailable declared form", () => {
  const source = document(
    { forms: [{ id: "declared-only" }, { id: "surface", label: "Surface" }] },
    [],
    [{ id: "section", blocks: [block({ ...line("source"), content: { text: "source", languageId: "en", formId: "surface" } })] }],
  );
  assert.deepEqual(deriveViewerDocumentOptions(source).formOptions, [{ id: "surface", label: "Surface" }]);
});

test("translation options prepend Off without changing metadata options", () => {
  const source = document({ languages: [{ id: "en", label: "English" }], forms: [{ id: "plain" }] });
  const options = deriveViewerDocumentOptions(source);
  assert.deepEqual(options.translationLanguageOptions, [{ id: "none", label: "Off" }, { id: "en", label: "English" }]);
  assert.deepEqual(options.formOptions, []);
  assert.deepEqual(source.metadata.languages, [{ id: "en", label: "English" }]);
});

test("whole-line display mappings add base Form options but reading-only forms do not", () => {
  const sourceLine: TextLine = {
    id: "source",
    content: { text: "漢字", languageId: "zh", formId: "surface" },
    selectorRecord: { word: { selectorType: "range", range: { start: 0, end: 2 } } },
    selectedTextMappings: [{
      id: "readings",
      source: "word",
      mappings: [
        { id: "pinyin-reading", mappingType: "reading", image: { id: "pinyin", content: { text: "hànzì", languageId: "zh", formId: "pinyin" } } },
        { id: "zhuyin-reading", mappingType: "reading", image: { id: "zhuyin", content: { text: "ㄏㄢˋ ㄗˋ", languageId: "zh", formId: "zhuyin" } } },
      ],
    }],
    textLineMappings: [{
      id: "simplified-form",
      mappingType: "form",
      image: { id: "simplified", content: { text: "汉字", languageId: "zh", formId: "simplified" } },
    }],
  };
  const source = document({
    defaultFormId: "surface",
    forms: [
      { id: "surface", label: "Surface" },
      { id: "simplified", label: "Simplified" },
      { id: "pinyin", label: "Pinyin" },
      { id: "zhuyin", label: "Zhuyin" },
      { id: "unused", label: "Unused" },
    ],
  }, [], [{ id: "section", blocks: [block(sourceLine)] }]);

  const options = deriveViewerDocumentOptions(source);
  assert.deepEqual(options.formOptions, [
    { id: "surface", label: "Surface" },
    { id: "simplified", label: "Simplified" },
  ]);
  assert.deepEqual(options.readingOptions, [
    { id: "pinyin", label: "Pinyin" },
    { id: "zhuyin", label: "Zhuyin" },
  ]);
});

test("documents without readings have no Reading options", () => {
  const source = document({}, [], [{ id: "section", blocks: [block(line("plain"))] }]);
  assert.deepEqual(deriveViewerDocumentOptions(source).readingOptions, []);
});

test("a form used for display and reading appears independently in both option lists", () => {
  const sharedFormLine: TextLine = {
    id: "source",
    content: { text: "source", languageId: "en", formId: "surface" },
    textLineMappings: [
      { id: "display", mappingType: "form", image: { id: "display-image", content: { text: "shared", languageId: "en", formId: "shared" } } },
      { id: "reading", mappingType: "reading", image: { id: "reading-image", content: { text: "shared reading", languageId: "en", formId: "shared" } } },
    ],
  };
  const source = document({ forms: [{ id: "surface" }, { id: "shared", label: "Shared" }] }, [], [
    { id: "section", blocks: [block(sharedFormLine)] },
  ]);
  const options = deriveViewerDocumentOptions(source);
  assert.deepEqual(options.formOptions.map(({ id }) => id), ["surface", "shared"]);
  assert.deepEqual(options.readingOptions, [{ id: "shared", label: "Shared" }]);
});

test("an existing none option is not duplicated", () => {
  const languages = [{ id: "en" }, { id: "none", label: "Hidden" }];
  assert.equal(deriveViewerDocumentOptions(document({ languages })).translationLanguageOptions, languages);
  assert.deepEqual(deriveViewerDocumentOptions(document()).translationLanguageOptions, [{ id: "none", label: "Off" }]);
});

test("media classification preserves audio order and chooses the first video", () => {
  const video1: MediaResource = { id: "video-1", type: "media", mediaType: "video", src: "/one.mp4" };
  const video2: MediaResource = { id: "video-2", type: "media", mediaType: "video", src: "/two.mp4" };
  const resources: NonNullable<Document["resources"]> = [video1, otherAudio, { id: "image", type: "image", src: "/image.png" }, audio, video2];
  const result = classifyViewerMediaResources(document({}, resources));
  assert.deepEqual(result.audioResources, [otherAudio, audio]);
  assert.equal(result.audioResources[0], otherAudio);
  assert.equal(result.fallbackVideo, video1);
  assert.deepEqual(resources.map((resource) => resource.id), ["video-1", "other", "image", "audio", "video-2"]);
});

test("speaker lookup retains order and object identity", () => {
  const speakers = [{ id: "b", name: "B" }, { id: "a", name: "A" }];
  assert.equal(resolveViewerSpeakers(document({ speakers })), speakers);
  assert.equal(resolveViewerSpeakers(document({ speakers }))[0], speakers[0]);
});

test("recursive traversal includes text in order and skips other blocks without mutation", () => {
  const first = line("first");
  const middle = line("middle");
  const last = line("last");
  const sections: Section[] = [{ id: "top", blocks: [
    block(first),
    { type: "note", note: { id: "note", body: [{ text: "note", languageId: "en", formId: "plain" }] } },
    { type: "figure", figure: { id: "figure", resourceRef: { resourceId: "image" } } },
    { type: "table", table: { id: "table", columns: [], rows: [] } },
    { type: "section", section: { id: "nested", blocks: [block(middle), { type: "section", section: { id: "deep", blocks: [block(last)] } }] } },
  ] }];
  const snapshot = JSON.stringify(sections);
  assert.deepEqual(collectDocumentTextLines(sections), [first, middle, last]);
  assert.equal(collectDocumentTextLines(sections)[1], middle);
  assert.equal(JSON.stringify(sections), snapshot);
});

test("range index includes nested valid lines and excludes unresolved or invalid timing", () => {
  const valid = line("nested", { start: 1, end: 2 });
  const lines = collectDocumentTextLines([{ id: "top", blocks: [
    block(line("missing")),
    { type: "section", section: { id: "nested-section", blocks: [block(valid), block(line("bad", { start: 2, end: 2 })), block(line("unresolved", { start: 1, end: 2 }, "absent"))] } },
  ] }]);
  const original = JSON.stringify(lines);
  const ranges = buildLinePlaybackRangeIndex(lines, [audio], normalizeMediaSrc, { mediaSource: null, duration: null });
  assert.deepEqual([...ranges.keys()], ["nested"]);
  assert.equal(ranges.get("nested")?.mediaSource, "/one.mp3");
  assert.equal(JSON.stringify(lines), original);
});

test("known duration filters only ranges for its matching source", () => {
  const lines = [line("late", { start: 8, end: 12 })];
  assert.equal(buildLinePlaybackRangeIndex(lines, [audio], normalizeMediaSrc, { mediaSource: "/one.mp3", duration: 10 }).size, 0);
  assert.equal(buildLinePlaybackRangeIndex(lines, [audio], normalizeMediaSrc, { mediaSource: "/two.mp3", duration: 10 }).size, 1);
});

test("timing presence remains independent of range validity", () => {
  const invalid = line("invalid", { start: 2, end: 2 });
  const ranges = buildLinePlaybackRangeIndex([invalid], [audio], normalizeMediaSrc, { mediaSource: null, duration: null });
  const result = resolveViewerLinePlaybackPresentation(invalid, ranges, null, null);
  assert.equal(result.playbackRange, null);
  assert.equal(result.hasPlaybackTiming, true);
});

test("Lock needs both the line ID and media source; current line remains independent", () => {
  const target = line("target", { start: 1, end: 2 });
  const ranges = buildLinePlaybackRangeIndex([target], [audio], normalizeMediaSrc, { mediaSource: null, duration: null });
  const range = ranges.get("target")!;
  assert.deepEqual(resolveViewerLinePlaybackPresentation(target, ranges, range, null), {
    playbackRange: range, hasPlaybackTiming: true, isRangeLocked: true, isCurrentPlaybackLine: false,
  });
  assert.equal(resolveViewerLinePlaybackPresentation(target, ranges, { ...range, mediaSource: "/wrong.mp3" }, "target").isRangeLocked, false);
  assert.equal(resolveViewerLinePlaybackPresentation(target, ranges, { ...range, lineId: "other" }, "target").isRangeLocked, false);
  assert.equal(resolveViewerLinePlaybackPresentation(target, ranges, null, "target").isCurrentPlaybackLine, true);
});

test("section playback uses the first audio and requires end time", () => {
  const section: Section = { id: "section", time: { start: 3, end: 5 }, blocks: [] };
  assert.deepEqual(resolveSectionPlaybackRange(section, [audio, otherAudio], normalizeMediaSrc), {
    type: "line", lineId: "section", mediaResourceId: "audio", mediaSource: "/one.mp3", start: 3, end: 5,
  });
  assert.equal(resolveSectionPlaybackRange({ ...section, time: { start: 3 } }, [audio], normalizeMediaSrc), null);
  assert.equal(resolveSectionPlaybackRange(section, [], normalizeMediaSrc), null);
});
