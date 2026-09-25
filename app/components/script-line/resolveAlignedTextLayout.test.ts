import assert from "node:assert/strict";
import test from "node:test";
import type { MappingPresentationItem, MappingPresentationResult } from "../../types/viewer/mappingPresentation";
import { resolveAlignedTextLayout } from "./resolveAlignedTextLayout";

function item(id: string, start: number, end: number, placement: "above" | "below" = "above", sourceKind: "selector" | "wholeLine" = "selector", presentation: "alignedText" | "ruby" = "alignedText"): MappingPresentationItem {
  return { ruleId: id, mappingId: id, mappingType: "reading", mappedText: { text: id, formId: "pinyin", languageId: "zh" },
    source: sourceKind === "selector" ? { kind: "selector", selectorId: id } : { kind: "wholeLine" },
    range: { start, end }, presentation, placement, order: 10, inputOrder: 0 };
}
function layout(text: string, above: MappingPresentationItem[] = [], below: MappingPresentationItem[] = []) {
  const resolved: MappingPresentationResult = { above, below, fallbacks: [] };
  return resolveAlignedTextLayout(text, resolved);
}

test("plain text, adjacent ranges, and simultaneous placements preserve source exactly once", () => {
  const result = layout("我看到了", [item("kan", 1, 2), item("dao", 2, 3)], [item("gloss", 1, 2, "below")]);
  assert.deepEqual(result.chunks.map(({ text }) => text), ["我", "看", "到", "了"]);
  assert.equal(result.chunks.map(({ text }) => text).join(""), "我看到了");
  assert.deepEqual(result.chunks[1].above.map(({ mappingId }) => mappingId), ["kan"]);
  assert.deepEqual(result.chunks[1].below.map(({ mappingId }) => mappingId), ["gloss"]);
});

test("identical spans stack in stable above and below order", () => {
  const result = layout("abc", [item("first", 1, 2), item("second", 1, 2)], [item("lower-1", 1, 2, "below"), item("lower-2", 1, 2, "below")]);
  assert.deepEqual(result.chunks[1].above.map(({ mappingId }) => mappingId), ["first", "second"]);
  assert.deepEqual(result.chunks[1].below.map(({ mappingId }) => mappingId), ["lower-1", "lower-2"]);
  assert.deepEqual(result.fallbacks, []);
});

test("UTF-16 emoji offsets and whole-line rows are independent domains", () => {
  const result = layout("A😀B", [item("emoji", 1, 3), item("line", 0, 4, "above", "wholeLine")], [item("line-below", 0, 4, "below", "wholeLine")]);
  assert.deepEqual(result.chunks.map(({ text }) => text), ["A", "😀", "B"]);
  assert.deepEqual(result.wholeLineAbove.map(({ mappingId }) => mappingId), ["line"]);
  assert.deepEqual(result.wholeLineBelow.map(({ mappingId }) => mappingId), ["line-below"]);
  assert.deepEqual(result.fallbacks, []);
});

test("partial and nested selector overlaps fall back for both ranges", () => {
  for (const [a, b] of [[item("a", 0, 3), item("b", 2, 4)], [item("a", 0, 4), item("b", 1, 2)]]) {
    const result = layout("abcd", [a, b]);
    assert.equal(result.chunks.map(({ text }) => text).join(""), "abcd");
    assert.equal(result.chunks.some(({ above }) => above.length > 0), false);
    assert.deepEqual(result.fallbacks.map(({ reason }) => reason), ["overlapping-ranges", "overlapping-ranges"]);
  }
});

test("ruby is excluded and inputs are not mutated", () => {
  const above = [item("ruby", 0, 2, "above", "selector", "ruby"), item("reading", 2, 3)];
  const before = structuredClone(above);
  const result = layout("abcd", above);
  assert.deepEqual(above, before);
  assert.equal(result.chunks.map(({ text }) => text).join(""), "abcd");
  assert.deepEqual(result.chunks.flatMap(({ above }) => above.map(({ mappingId }) => mappingId)), ["reading"]);
});
