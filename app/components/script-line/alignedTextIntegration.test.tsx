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
  selectedTextMappings: [{ id: "bundle", source: "word", mappings: [mapping("pin", "reading", "kàn"), mapping("zhu", "reading", "ㄎㄢˋ")] }],
  textLineMappings: [mapping("translation", "translation", "I saw it", "written"), mapping("alternative", "form", "I saw", "latin")],
};
const props = { textNode: line, speakers: [], formId: "surface", translationLanguageId: "zh", style: viewerStyle };
function render(mode: "conversation" | "developer", overrides: Partial<ScriptLineCompositionProps> = {}) {
  const Component = mode === "conversation" ? ConversationScriptLine : DeveloperScriptLine;
  return renderToStaticMarkup(<Component {...props} {...overrides} />);
}
function visibleText(html: string) { return html.replace(/<[^>]*>/g, ""); }

test("both modes render default readings in resolver order and preserve canonical source", () => {
  for (const mode of ["conversation", "developer"] as const) {
    const html = render(mode);
    assert.match(html, /inline-grid/);
    assert.ok(html.indexOf("kàn") < html.indexOf("ㄎㄢˋ"));
    assert.equal(visibleText(html).split("我看到了").length, 1); // Source is split by alignment markup.
    assert.match(visibleText(html), /我看kànㄎㄢˋ到了/);
  }
});

test("custom selector below and whole-line above use separate slots", () => {
  const rules: MappingPresentationRule[] = [
    { id: "reading-below", match: { mappingTypes: ["reading"], sourceKinds: ["selector"] }, presentation: "alignedText", placement: "below" },
    { id: "translation-above", match: { mappingTypes: ["translation"], sourceKinds: ["wholeLine"] }, presentation: "alignedText", placement: "above" },
  ];
  const html = render("conversation", { mappingPresentationRules: rules });
  assert.ok(html.indexOf("I saw it") < html.indexOf("我"));
  assert.match(html, /row-start-3[^>]*>[\s\S]*kàn/);
  assert.equal(visibleText(html).split("I saw it").length - 1, 1);
});

test("selector and whole-line mappings can both occupy the lower presentation", () => {
  const rules: MappingPresentationRule[] = [
    { id: "reading-below", match: { mappingTypes: ["reading"], sourceKinds: ["selector"] }, presentation: "alignedText", placement: "below" },
    { id: "translation-below", match: { mappingTypes: ["translation"], sourceKinds: ["wholeLine"] }, presentation: "alignedText", placement: "below" },
  ];
  const html = render("conversation", { mappingPresentationRules: rules });
  assert.match(html, /row-start-3/);
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
  assert.doesNotMatch(html, /inline-grid/);
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
});

test("alternative whole-line form disables canonical alignment in Conversation only", () => {
  const html = render("conversation", { formId: "latin" });
  assert.match(html, /I saw/);
  assert.doesNotMatch(html, /inline-grid/);
  assert.doesNotMatch(visibleText(html), /kàn|ㄎㄢˋ/);
  assert.match(html, /I saw it/);
  assert.match(render("developer", { formId: "latin" }), /kàn/);
});

test("ruby rules produce no aligned markup", () => {
  const rules: MappingPresentationRule[] = [{ id: "ruby", match: { mappingTypes: ["reading"] }, presentation: "ruby", placement: "above" }];
  for (const mode of ["conversation", "developer"] as const) {
    const html = render(mode, { mappingPresentationRules: rules });
    assert.doesNotMatch(html, /inline-grid/);
    assert.doesNotMatch(visibleText(html.split("<details")[0]), /kàn|ㄎㄢˋ/);
    assert.match(visibleText(html), /我看到了/);
  }
});
