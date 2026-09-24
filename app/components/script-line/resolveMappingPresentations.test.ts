import assert from "node:assert/strict";
import test from "node:test";
import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import type {
  MappingPresentationContext,
  MappingPresentationRule,
} from "../../types/viewer/mappingPresentation";
import {
  collectMappingPresentationCandidates,
  matchingMappingPresentationRules as matchRules,
  resolveMappingPresentations as resolvePresentations,
} from "./resolveMappingPresentations";

const context: MappingPresentationContext = {
  selectedFormId: "hanzi",
  selectedReadingFormId: "pinyin",
};

function matchingMappingPresentationRules(
  mappingValue: TextMappingPayload,
  rules: readonly MappingPresentationRule[],
  sourceKind?: "wholeLine" | "selector",
) {
  return matchRules(mappingValue, rules, context, sourceKind);
}

function resolveMappingPresentations(
  textLine: TextLine,
  rules: readonly MappingPresentationRule[],
  current: MappingPresentationContext = context,
) {
  return resolvePresentations(textLine, rules, current);
}

const reading: MappingPresentationRule = {
  id: "reading", match: { mappingTypes: ["reading"], formIds: ["pinyin"] },
  presentation: "alignedText", placement: "above", order: 10,
};
const gloss: MappingPresentationRule = {
  id: "gloss", match: { mappingTypes: ["gloss"] },
  presentation: "ruby", placement: "below", order: 20,
};

function mapping(id: string, mappingType = "reading", formId = "pinyin", languageId = "zh"): TextMappingPayload {
  return { id, mappingType, image: {
    id: `${id}-image`, content: { text: `${id} text`, formId, languageId },
  } };
}

function line(overrides: Partial<TextLine> = {}): TextLine {
  return { id: "source", content: { text: "A😀中D", formId: "hanzi", languageId: "zh" },
    selectorRecord: {
      emoji: { selectorType: "range", range: { start: 1, end: 3 } },
      end: { selectorType: "range", range: { start: 3, end: 4 } },
    }, ...overrides };
}

test("selected mappings use canonical UTF-16 selector offsets and retain renderer choices", () => {
  const result = resolveMappingPresentations(line({ selectedTextMappings: [
    { id: "bundle", source: "emoji", mappings: [mapping("read"), mapping("gl", "gloss")] },
  ] }), [reading, gloss]);
  assert.deepEqual(result.above.map(({ mappingId, range, presentation, source, mappedText }) =>
    ({ mappingId, range, presentation, source, mappedText })), [{
      mappingId: "read", range: { start: 1, end: 3 }, presentation: "alignedText",
      source: { kind: "selector", selectorId: "emoji" },
      mappedText: { text: "read text", formId: "pinyin", languageId: "zh" },
    }]);
  assert.equal(result.below[0].presentation, "ruby");
  assert.equal(result.below[0].placement, "below");
  assert.deepEqual(result.fallbacks, []);
});

test("whole-line mappings use the canonical range without a fabricated selector", () => {
  const result = resolveMappingPresentations(line({ textLineMappings: [mapping("whole")] }), [reading]);
  assert.deepEqual(result.above[0].source, { kind: "wholeLine" });
  assert.deepEqual(result.above[0].range, { start: 0, end: 5 });
  assert.equal(result.above[0].ruleId, "reading");
  assert.equal(result.above[0].order, 10);
});

test("local and single-selector selection mappings resolve through the same selector record", () => {
  const result = resolveMappingPresentations(line({ selections: [{
    id: "selection", selectorIds: ["emoji"], selectionType: "custom",
    localSelectedTextMappings: [{ id: "local-bundle", source: "end", mappings: [mapping("local")] }],
    selectionMappings: [mapping("selection")],
  }] }), [reading]);
  assert.deepEqual(result.above.map((item) => [item.mappingId, item.range.start, item.range.end]),
    [["selection", 1, 3], ["local", 3, 4]]);
});

test("multiple or discontinuous selection selectors remain unsupported", () => {
  const result = resolveMappingPresentations(line({ selections: [{
    id: "selection", selectorIds: ["emoji", "end"], selectionType: "discontinuousExpression",
    selectionMappings: [mapping("multi")],
  }] }), [reading]);
  assert.deepEqual(result.above, []);
  assert.equal(result.fallbacks[0].reason, "unsupported-selection-source");
  assert.deepEqual(result.fallbacks[0].source, { kind: "selection", selectionId: "selection" });
});

test("missing, non-range, and invalid selectors have distinct fallbacks", () => {
  const source = line({ selectorRecord: {
    positions: { selectorType: "positions", positions: [1, 3] },
    negative: { selectorType: "range", range: { start: -1, end: 2 } },
    reversed: { selectorType: "range", range: { start: 3, end: 2 } },
    empty: { selectorType: "range", range: { start: 2, end: 2 } },
    pastEnd: { selectorType: "range", range: { start: 2, end: 6 } },
  }, selectedTextMappings: ["missing", "positions", "negative", "reversed", "empty", "pastEnd"]
    .map((source) => ({ id: source, source, mappings: [mapping(source)] })) });
  const result = resolveMappingPresentations(source, [reading]);
  assert.deepEqual(result.fallbacks.map(({ reason }) => reason), [
    "missing-selector", "unsupported-selector", "invalid-range", "invalid-range",
    "invalid-range", "invalid-range",
  ]);
  assert.deepEqual(result.above, []);
});

test("rule filters are exact, independent, and empty lists match nothing", () => {
  const value = mapping("m");
  const rules: MappingPresentationRule[] = [
    reading,
    { ...reading, id: "type-only", match: { mappingTypes: ["reading"] } },
    { ...reading, id: "form-only", match: { formIds: ["pinyin"] } },
    { ...reading, id: "language-only", match: { languageIds: ["zh"] } },
    { ...reading, id: "any", match: {} },
    { ...reading, id: "empty", match: { formIds: [] } },
    { ...reading, id: "case", match: { mappingTypes: ["Reading"] } },
    { ...reading, id: "wrong-language", match: { languageIds: ["ZH"] } },
  ];
  assert.deepEqual(matchingMappingPresentationRules(value, rules).map((rule) => rule.id),
    ["reading", "type-only", "form-only", "language-only", "any"]);
  assert.deepEqual(matchingMappingPresentationRules(mapping("legacy", "romanization"), [reading]), []);
  assert.deepEqual(matchingMappingPresentationRules(mapping("wrong-form", "reading", "kana"), [reading]), []);
});

test("symbolic form filters keep base Form and Reading selections independent", () => {
  const value = mapping("m");
  const rules: MappingPresentationRule[] = [
    { ...reading, id: "current-form", match: { formIds: "currentForm" } },
    { ...reading, id: "current-reading", match: { formIds: "currentReading" } },
    { ...reading, id: "all-forms", match: { formIds: "any" } },
  ];

  assert.deepEqual(matchRules(value, rules, {
    selectedFormId: "pinyin",
    selectedReadingFormId: null,
  }).map((rule) => rule.id), ["current-form", "all-forms"]);
  assert.deepEqual(matchRules(value, rules, {
    selectedFormId: "hanzi",
    selectedReadingFormId: "pinyin",
  }).map((rule) => rule.id), ["current-reading", "all-forms"]);
  assert.deepEqual(matchRules(value, rules, {
    selectedFormId: "hanzi",
    selectedReadingFormId: "Pinyin",
  }).map((rule) => rule.id), ["all-forms"]);
});

test("the default reading rule selects exactly one reading form and None selects none", () => {
  const rules: MappingPresentationRule[] = [{
    id: "reading-current",
    match: { mappingTypes: ["reading"], formIds: "currentReading" },
    presentation: "alignedText",
    placement: "above",
  }];
  const source = line({ selectedTextMappings: [{
    id: "readings",
    source: "emoji",
    mappings: [mapping("pinyin"), mapping("zhuyin", "reading", "zhuyin")],
  }] });

  assert.deepEqual(resolveMappingPresentations(source, rules, {
    selectedFormId: "hanzi", selectedReadingFormId: null,
  }).above, []);
  assert.deepEqual(resolveMappingPresentations(source, rules, {
    selectedFormId: "hanzi", selectedReadingFormId: "pinyin",
  }).above.map((item) => item.mappingId), ["pinyin"]);
  assert.deepEqual(resolveMappingPresentations(source, rules, {
    selectedFormId: "hanzi", selectedReadingFormId: "zhuyin",
  }).above.map((item) => item.mappingId), ["zhuyin"]);
});

test("sourceKinds distinguishes selector and whole-line rules", () => {
  const source = line({
    selectedTextMappings: [{ id: "bundle", source: "emoji", mappings: [mapping("selected")] }],
    textLineMappings: [mapping("whole")],
  });
  const selectorRule: MappingPresentationRule = { ...reading, id: "selector", match: { mappingTypes: ["reading"], sourceKinds: ["selector"] } };
  const wholeRule: MappingPresentationRule = { ...reading, id: "whole", match: { mappingTypes: ["reading"], sourceKinds: ["wholeLine"] } };
  const result = resolveMappingPresentations(source, [selectorRule, wholeRule]);
  assert.deepEqual(result.above.map(({ ruleId }) => ruleId), ["whole", "selector"]);
  assert.deepEqual(resolveMappingPresentations(source, [{ ...reading, match: { sourceKinds: [] } }]).above, []);
});

test("unmatched and conflicting rules create fallbacks without duplicate items", () => {
  const source = line({ textLineMappings: [mapping("read"), mapping("unknown", "translation")] });
  const result = resolveMappingPresentations(source, [reading, { ...reading, id: "other" }]);
  assert.deepEqual(result.above, []);
  assert.deepEqual(result.fallbacks.map(({ mappingId, reason, matchingRuleIds }) =>
    ({ mappingId, reason, matchingRuleIds })), [
      { mappingId: "read", reason: "conflicting-rules", matchingRuleIds: ["reading", "other"] },
      { mappingId: "unknown", reason: "unmatched", matchingRuleIds: undefined },
    ]);
});

test("items sort by source range, rule order, then candidate order", () => {
  const source = line({
    selectedTextMappings: [
      { id: "end", source: "end", mappings: [mapping("end")] },
      { id: "emoji", source: "emoji", mappings: [mapping("late", "gloss"), mapping("first"), mapping("second")] },
    ],
  });
  const result = resolveMappingPresentations(source, [reading, { ...gloss, placement: "above", order: 5 }]);
  assert.deepEqual(result.above.map(({ mappingId }) => mappingId), ["late", "first", "second", "end"]);
  assert.deepEqual(result.above.map(({ inputOrder }) => inputOrder), [1, 2, 3, 0]);
});

test("candidate collection deduplicates mappings and does not descend into image mappings", () => {
  const reused = mapping("shared");
  reused.image.textLineMappings = [mapping("nested")];
  const source = line({
    selectedTextMappings: [{ id: "bundle", source: "emoji", mappings: [reused] }],
    selections: [{ id: "selection", selectorIds: ["emoji"], selectionType: "custom",
      localSelectedTextMappings: [{ id: "local", source: "emoji", mappings: [reused] }] }],
  });
  assert.deepEqual(collectMappingPresentationCandidates(source).map(({ mapping }) => mapping.id), ["shared"]);
  assert.deepEqual(resolveMappingPresentations(source, [reading]).above.map(({ mappingId }) => mappingId), ["shared"]);
});

test("resolution does not mutate Core input and keeps presentation selections out of its result", () => {
  const source = line({ textLineMappings: [mapping("m")] });
  const before = structuredClone(source);
  const result = resolveMappingPresentations(source, [reading]);
  assert.deepEqual(source, before);
  assert.deepEqual(Object.keys(result), ["above", "below", "fallbacks"]);
  assert.deepEqual(Object.keys(result.above[0]).sort(), [
    "inputOrder", "mappedText", "mappingId", "mappingType", "order", "placement",
    "presentation", "range", "ruleId", "source",
  ]);
  assert.deepEqual(result.above[0].range, { start: 0, end: source.content.text.length });
  source.content.text = "different displayed form";
  assert.deepEqual(result.above[0].range, { start: 0, end: 5 });
});
