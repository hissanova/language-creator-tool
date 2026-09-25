import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MappingPresentationItem, MappingPresentationResult } from "../../types/viewer/mappingPresentation";
import { MappedTextRenderer } from "./MappedTextRenderer";
import { resolveMappedTextLayout } from "./resolveMappedTextLayout";

function item(
  id: string,
  text: string,
  start: number,
  end: number,
  presentation: "alignedText" | "ruby",
  placement: "above" | "below",
): MappingPresentationItem {
  return {
    ruleId: id,
    mappingId: id,
    mappingType: presentation === "ruby" ? "reading" : "gloss",
    mappedText: { text, languageId: "zh", formId: id },
    source: { kind: "selector", selectorId: id },
    range: { start, end },
    presentation,
    placement,
    order: 10,
    inputOrder: 0,
  };
}

function render(source: string, resolved: MappingPresentationResult) {
  const layout = resolveMappedTextLayout(source, resolved);
  return renderToStaticMarkup(
    <MappedTextRenderer
      layout={layout}
      renderSourceRange={(start, end) => source.slice(start, end)}
    />,
  );
}

test("renders semantic ruby around one source occurrence", () => {
  const html = render("我看到了", {
    above: [item("pinyin", "kàn", 1, 2, "ruby", "above")],
    below: [],
    fallbacks: [],
  });
  assert.match(html, /<ruby>看<rp>\(<\/rp><rt>kàn<\/rt><rp>\)<\/rp><\/ruby>/);
  assert.equal((html.match(/看/g) ?? []).length, 1);
  assert.equal(html.replace(/<rt>[\s\S]*?<\/rt>/g, "").replace(/<[^>]*>/g, ""), "我看()到了");
});

test("ruby composes inside aligned text above and below on the same range", () => {
  const html = render("我看到了", {
    above: [
      item("pinyin", "kàn", 1, 2, "ruby", "above"),
      item("gloss-above", "SEE", 1, 2, "alignedText", "above"),
    ],
    below: [item("gloss-below", "see", 1, 2, "alignedText", "below")],
    fallbacks: [],
  });
  assert.match(html, /table-cell[^>]*><ruby>看/);
  assert.match(html, /caption-top[^>]*>[\s\S]*SEE/);
  assert.match(html, /caption-bottom[^>]*>[\s\S]*see/);
  assert.equal((html.match(/看/g) ?? []).length, 1);
});

test("below ruby uses under placement and UTF-16 ranges", () => {
  const html = render("A😀B", {
    above: [],
    below: [item("kana", "えもじ", 1, 3, "ruby", "below")],
    fallbacks: [],
  });
  assert.match(html, /<ruby style="ruby-position:under">😀<rp>/);
  assert.match(html, /<rt>えもじ<\/rt>/);
  assert.equal((html.match(/😀/g) ?? []).length, 1);
});

test("multiple disjoint ruby ranges remain in source order", () => {
  const html = render("日本語", {
    above: [
      item("nihon", "にほん", 0, 2, "ruby", "above"),
      item("go", "ご", 2, 3, "ruby", "above"),
    ],
    below: [],
    fallbacks: [],
  });
  assert.match(html, /^<span><ruby>日本[\s\S]*<\/ruby><\/span><span><ruby>語/);
  assert.equal((html.match(/日本語/g) ?? []).length, 0);
  assert.equal((html.match(/<ruby/g) ?? []).length, 2);
});
