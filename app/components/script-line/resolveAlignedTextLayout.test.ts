import assert from "node:assert/strict";
import test from "node:test";
import type { MappingPresentationItem, MappingPresentationResult } from "../../types/viewer/mappingPresentation";
import { resolveMappedTextLayout } from "./resolveMappedTextLayout";

function item(id: string, start: number, end: number, placement: "above" | "below" = "above", sourceKind: "selector" | "wholeLine" = "selector", presentation: "alignedText" | "ruby" = "alignedText"): MappingPresentationItem {
  return { ruleId: id, mappingId: id, mappingType: "reading", mappedText: { text: id, formId: "pinyin", languageId: "zh" },
    source: sourceKind === "selector" ? { kind: "selector", selectorId: id } : { kind: "wholeLine" },
    range: { start, end }, presentation, placement, order: 10, inputOrder: 0 };
}
function layout(text: string, above: MappingPresentationItem[] = [], below: MappingPresentationItem[] = []) {
  const resolved: MappingPresentationResult = { above, below, fallbacks: [] };
  return resolveMappedTextLayout(text, resolved);
}

test("plain text, adjacent ranges, and simultaneous placements preserve source exactly once", () => {
  const result = layout("我看到了", [item("kan", 1, 2), item("dao", 2, 3)], [item("gloss", 1, 2, "below")]);
  assert.deepEqual(result.chunks.map(({ text }) => text), ["我", "看", "到", "了"]);
  assert.equal(result.chunks.map(({ text }) => text).join(""), "我看到了");
  assert.deepEqual(result.chunks[1].alignedAbove.map(({ mappingId }) => mappingId), ["kan"]);
  assert.deepEqual(result.chunks[1].alignedBelow.map(({ mappingId }) => mappingId), ["gloss"]);
});

test("identical spans stack in stable above and below order", () => {
  const result = layout("abc", [item("first", 1, 2), item("second", 1, 2)], [item("lower-1", 1, 2, "below"), item("lower-2", 1, 2, "below")]);
  assert.deepEqual(result.chunks[1].alignedAbove.map(({ mappingId }) => mappingId), ["first", "second"]);
  assert.deepEqual(result.chunks[1].alignedBelow.map(({ mappingId }) => mappingId), ["lower-1", "lower-2"]);
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
    assert.equal(result.chunks.some(({ alignedAbove }) => alignedAbove.length > 0), false);
    assert.deepEqual(result.fallbacks.map(({ reason }) => reason), ["overlapping-ranges", "overlapping-ranges"]);
  }
});

test("partial ruby and aligned-text overlap falls back for both presentations", () => {
  const result = layout("abcd", [
    item("ruby", 0, 3, "above", "selector", "ruby"),
    item("aligned", 2, 4),
  ]);
  assert.equal(result.chunks.map(({ text }) => text).join(""), "abcd");
  assert.equal(result.chunks.some(({ ruby }) => ruby !== undefined), false);
  assert.equal(result.chunks.some(({ alignedAbove }) => alignedAbove.length > 0), false);
  assert.deepEqual(result.fallbacks.map(({ mappingId, reason }) => ({ mappingId, reason })), [
    { mappingId: "ruby", reason: "overlapping-ranges" },
    { mappingId: "aligned", reason: "overlapping-ranges" },
  ]);
});

test("ruby and aligned text share exact ranges without mutating inputs", () => {
  const above = [item("ruby", 0, 2, "above", "selector", "ruby"), item("reading", 2, 3)];
  const below = [item("gloss", 0, 2, "below")];
  const before = structuredClone(above);
  const result = layout("abcd", above, below);
  assert.deepEqual(above, before);
  assert.equal(result.chunks.map(({ text }) => text).join(""), "abcd");
  assert.equal(result.chunks[0].ruby?.mappingId, "ruby");
  assert.deepEqual(result.chunks[0].alignedBelow.map(({ mappingId }) => mappingId), ["gloss"]);
  assert.deepEqual(result.chunks.flatMap(({ alignedAbove }) => alignedAbove.map(({ mappingId }) => mappingId)), ["reading"]);
});

test("multiple ruby annotations on one range fall back while aligned text remains", () => {
  const result = layout("abc", [
    item("ruby-a", 1, 2, "above", "selector", "ruby"),
    item("ruby-b", 1, 2, "above", "selector", "ruby"),
    item("aligned", 1, 2),
  ]);
  assert.equal(result.chunks[1].ruby, undefined);
  assert.deepEqual(result.chunks[1].alignedAbove.map(({ mappingId }) => mappingId), ["aligned"]);
  assert.deepEqual(result.fallbacks.map(({ reason }) => reason), [
    "multiple-ruby-annotations",
    "multiple-ruby-annotations",
  ]);
});

test("whole-line ruby participates in the canonical partition", () => {
  const result = layout("我看到了", [item("whole", 0, 4, "above", "wholeLine", "ruby")]);
  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0].text, "我看到了");
  assert.equal(result.chunks[0].ruby?.mappingId, "whole");
});
