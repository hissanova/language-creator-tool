import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import type { MappingPresentationRule } from "../../types/viewer/mappingPresentation";
import { viewerStyle } from "../../styles/viewerStyle";
import { ConversationScriptLine } from "./ConversationScriptLine";
import { DeveloperScriptLine } from "./DeveloperScriptLine";
import type { ScriptLineCompositionProps } from "./types";

function mapping(id: string, mappingType: string, text: string, formId = "pinyin"): TextMappingPayload {
  return { id, mappingType, image: { id: `${id}-image`, content: { text, formId, languageId: "zh" } } };
}
const line: TextLine = {
  id: "line", content: { text: "我看到了", formId: "surface", languageId: "zh" },
  selectorRecord: { word: { selectorType: "range", range: { start: 1, end: 2 } } },
  selectedTextMappings: [{ id: "bundle", source: "word", mappings: [
    mapping("pin", "reading", "kàn", "pinyin"),
    mapping("zhu", "reading", "ㄎㄢˋ", "zhuyin"),
  ] }],
  textLineMappings: [mapping("translation", "translation", "I saw it", "written"), mapping("alternative", "form", "I saw", "latin")],
};
const props = {
  textNode: line,
  speakers: [],
  formId: "surface",
  selectedReadingFormId: "pinyin",
  translationLanguageId: "zh",
  style: viewerStyle,
};
function render(mode: "conversation" | "developer", overrides: Partial<ScriptLineCompositionProps> = {}) {
  const Component = mode === "conversation" ? ConversationScriptLine : DeveloperScriptLine;
  return renderToStaticMarkup(<Component {...props} {...overrides} />);
}
function visibleText(html: string) { return html.replace(/<[^>]*>/g, ""); }
function presentedText(html: string) { return visibleText(html.split("<details")[0]); }

test("both modes use the same semantic ruby reading and preserve canonical source", () => {
  for (const mode of ["conversation", "developer"] as const) {
    const html = render(mode);
    assert.match(html, /<ruby>[\s\S]*看[\s\S]*<rp>\(<\/rp><rt>kàn<\/rt><rp>\)<\/rp><\/ruby>/);
    assert.doesNotMatch(html, /<rt>ㄎㄢˋ<\/rt>/);
  }
});

test("None, pinyin, and zhuyin resolve independently from the displayed Form", () => {
  for (const mode of ["conversation", "developer"] as const) {
    const none = presentedText(render(mode, { selectedReadingFormId: null }));
    const pinyinHtml = render(mode, { selectedReadingFormId: "pinyin" });
    const zhuyinHtml = render(mode, { selectedReadingFormId: "zhuyin" });
    const pinyin = presentedText(pinyinHtml);
    const zhuyin = presentedText(zhuyinHtml);
    assert.doesNotMatch(none, /kàn|ㄎㄢˋ/);
    assert.doesNotMatch(render(mode, { selectedReadingFormId: null }), /<ruby|<rt/);
    assert.match(pinyin, /kàn/);
    assert.doesNotMatch(pinyin, /ㄎㄢˋ/);
    assert.match(pinyinHtml, /<rt>kàn<\/rt>/);
    assert.match(zhuyin, /ㄎㄢˋ/);
    assert.doesNotMatch(zhuyin, /kàn/);
    assert.match(zhuyinHtml, /<rt>ㄎㄢˋ<\/rt>/);
  }

  for (const selectedReadingFormId of [null, "pinyin", "zhuyin"] as const) {
    assert.match(render("conversation", {
      formId: "latin",
      selectedReadingFormId,
    }), /I saw/);
  }
  for (const formId of ["surface", "latin"]) {
    const text = presentedText(render("developer", {
      formId,
      selectedReadingFormId: "zhuyin",
    }));
    assert.match(text, /ㄎㄢˋ/);
    assert.doesNotMatch(text, /kàn/);
  }
});

test("custom selector below and whole-line above use separate slots", () => {
  const rules: MappingPresentationRule[] = [
    { id: "reading-below", match: { mappingTypes: ["reading"], sourceKinds: ["selector"] }, presentation: "alignedText", placement: "below" },
    { id: "translation-above", match: { mappingTypes: ["translation"], sourceKinds: ["wholeLine"] }, presentation: "alignedText", placement: "above" },
  ];
  const html = render("conversation", { mappingPresentationRules: rules });
  assert.ok(html.indexOf("I saw it") < html.indexOf("我"));
  assert.match(html, /table-caption caption-bottom[^>]*>[\s\S]*kàn/);
  assert.equal(visibleText(html).split("I saw it").length - 1, 1);
});

test("selector and whole-line mappings can both occupy the lower presentation", () => {
  const rules: MappingPresentationRule[] = [
    { id: "reading-below", match: { mappingTypes: ["reading"], sourceKinds: ["selector"] }, presentation: "alignedText", placement: "below" },
    { id: "translation-below", match: { mappingTypes: ["translation"], sourceKinds: ["wholeLine"] }, presentation: "alignedText", placement: "below" },
  ];
  const html = render("conversation", { mappingPresentationRules: rules });
  assert.match(html, /table-caption caption-bottom/);
  assert.equal(visibleText(html).split("I saw it").length - 1, 1);
  assert.ok(html.indexOf("kàn") < html.indexOf("I saw it"));
});

test("conflicting selector spans keep source and diagnostics without aligned output", () => {
  const conflict: TextLine = {
    ...line,
    selectorRecord: { first: { selectorType: "range", range: { start: 0, end: 2 } }, second: { selectorType: "range", range: { start: 1, end: 3 } } },
    selectedTextMappings: [
      { id: "first-bundle", source: "first", mappings: [mapping("first-reading", "reading", "first")] },
      { id: "second-bundle", source: "second", mappings: [mapping("second-reading", "reading", "second")] },
    ],
  };
  const html = render("developer", { textNode: conflict });
  assert.doesNotMatch(html, /inline-table/);
  assert.match(visibleText(html), /^我看到了/);
  assert.match(html, /first-reading|first/);
});

test("annotation title, tags, translation, panel, and playback survive alignment", () => {
  const tagged: TextLine = { ...line, selectedTextRefs: [{ id: "refs", source: "word", attachments: [{ id: "tag", ref: { id: "tag-ref", body: { type: "tag", tags: ["focus"] } } }] }] };
  const styled = { ...viewerStyle, tags: { ...viewerStyle.tags, focus: { className: "focus-source" } } };
  const html = render("conversation", { textNode: tagged, style: styled, hasPlaybackTiming: true, isCurrentPlaybackLine: true });
  assert.match(html, /title="reading: kàn/);
  assert.match(html, /focus-source/);
  assert.match(html, /I saw it/);
  assert.match(html, /aria-label="Annotations"/);
  assert.match(html, /aria-current="true"/);
  assert.match(html, /aria-label="Play from this line"/);
  assert.match(html, /<ruby>[\s\S]*focus-source[\s\S]*<rt>kàn<\/rt>/);
});

test("alternative whole-line form disables canonical alignment in Conversation only", () => {
  const html = render("conversation", { formId: "latin" });
  assert.match(html, /I saw/);
  assert.doesNotMatch(html, /<ruby|<rt/);
  assert.doesNotMatch(visibleText(html), /kàn|ㄎㄢˋ/);
  assert.match(html, /I saw it/);
  assert.match(render("developer", { formId: "latin" }), /kàn/);
});

test("multiple ruby annotations for one range fall back instead of being combined", () => {
  const rules: MappingPresentationRule[] = [{ id: "ruby", match: { mappingTypes: ["reading"] }, presentation: "ruby", placement: "above" }];
  for (const mode of ["conversation", "developer"] as const) {
    const html = render(mode, { mappingPresentationRules: rules });
    assert.doesNotMatch(html, /inline-table/);
    assert.doesNotMatch(html, /<ruby|<rt/);
    assert.match(visibleText(html), /我看到了/);
  }
});

test("Japanese Kana reading renders as ruby", () => {
  const japanese: TextLine = {
    id: "ja-line",
    content: { text: "日本語", formId: "kanji", languageId: "ja" },
    selectorRecord: { word: { selectorType: "range", range: { start: 0, end: 3 } } },
    selectedTextMappings: [{
      id: "ja-readings",
      source: "word",
      mappings: [{
        id: "kana",
        mappingType: "reading",
        image: { id: "kana-image", content: { text: "にほんご", formId: "kana", languageId: "ja" } },
      }],
    }],
  };
  for (const mode of ["conversation", "developer"] as const) {
    const html = render(mode, { textNode: japanese, selectedReadingFormId: "kana" });
    assert.match(html, /<ruby>[\s\S]*日本語[\s\S]*<rp>\(<\/rp><rt>にほんご<\/rt>/);
  }
});

test("whole-line reading wraps the whole canonical source without becoming a translation row", () => {
  const wholeLineReading: TextLine = {
    ...line,
    selectedTextMappings: undefined,
    textLineMappings: [
      mapping("whole-reading", "reading", "wǒ kàn dào le", "pinyin"),
      mapping("translation", "translation", "I saw it", "written"),
    ],
  };
  const html = render("conversation", { textNode: wholeLineReading });
  assert.match(html, /<ruby>[\s\S]*我[\s\S]*看[\s\S]*到了[\s\S]*<rp>\(<\/rp><rt>wǒ kàn dào le<\/rt>/);
  assert.equal(visibleText(html).split("I saw it").length - 1, 1);
});
