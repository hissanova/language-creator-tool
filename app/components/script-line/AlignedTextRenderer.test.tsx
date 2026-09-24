import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MappingPresentationItem } from "../../types/viewer/mappingPresentation";
import { AlignedTextRenderer } from "./AlignedTextRenderer";
import { resolveAlignedTextLayout } from "./resolveAlignedTextLayout";

function reading(id: string, text: string, placement: "above" | "below"): MappingPresentationItem {
  return {
    ruleId: id, mappingId: id, mappingType: "reading",
    mappedText: { text, languageId: "zh", formId: id },
    source: { kind: "selector", selectorId: "kan" },
    range: { start: 1, end: 2 }, presentation: "alignedText", placement,
    order: 10, inputOrder: 0,
  };
}

test("rendered source row bears the baseline between plain chunks and stacked captions", () => {
  const source = "我看到了";
  const layout = resolveAlignedTextLayout(source, {
    above: [reading("pinyin", "kàn", "above"), reading("zhuyin", "ㄎㄢˋ", "above")],
    below: [reading("gloss", "see", "below")], fallbacks: [],
  });
  const html = renderToStaticMarkup(<AlignedTextRenderer layout={layout} renderSourceRange={(start, end) => source.slice(start, end)} />);

  assert.match(html, /^<span>我<\/span><span class="inline-table align-baseline whitespace-nowrap">/);
  assert.match(html, /<span class="table-row"><span class="table-cell text-left leading-normal">看<\/span><\/span>/);
  assert.match(html, /<span class="table-caption caption-top[^>]*"><span class="block">kàn<\/span><span class="block">ㄎㄢˋ<\/span><\/span>/);
  assert.match(html, /<span class="table-caption caption-bottom[^>]*"><span class="block">see<\/span><\/span>/);
  assert.match(html, /<\/span><span>到了<\/span>$/);
  assert.equal((html.match(/看/g) ?? []).length, 1);
  assert.equal((html.match(/我/g) ?? []).length, 1);
  assert.equal((html.match(/到/g) ?? []).length, 1);
  assert.equal((html.match(/了/g) ?? []).length, 1);
  assert.doesNotMatch(html, /inline-grid|row-start|absolute|transform|translate/);
});

test("a below-only mapping leaves the canonical source in the baseline row", () => {
  const source = "我看到了";
  const layout = resolveAlignedTextLayout(source, {
    above: [], below: [reading("gloss", "see", "below")], fallbacks: [],
  });
  const html = renderToStaticMarkup(<AlignedTextRenderer layout={layout} renderSourceRange={(start, end) => source.slice(start, end)} />);

  assert.match(html, /<span class="inline-table[^>]*"><span class="table-row"><span class="table-cell[^>]*">看<\/span><\/span><span class="table-caption caption-bottom/);
  assert.doesNotMatch(html, /caption-top|absolute|transform|translate/);
  assert.equal((html.match(/看/g) ?? []).length, 1);
});
