import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Document } from "../types/core/document";
import type { TextLine, TextMappingPayload } from "../types/core/textLine";
import { ConversationViewer } from "./ConversationViewer";

function mapping(
  id: string,
  mappingType: string,
  formId: string,
  text: string,
): TextMappingPayload {
  return {
    id,
    mappingType,
    image: { id: `${id}-image`, content: { text, languageId: "zh", formId } },
  };
}

function viewerDocument({
  readings = true,
  simplified = false,
}: {
  readings?: boolean;
  simplified?: boolean;
} = {}): Document {
  const source: TextLine = {
    id: "line",
    content: { text: "我看到了", languageId: "zh", formId: "surface" },
    selectorRecord: { word: { selectorType: "range", range: { start: 1, end: 2 } } },
    selectedTextMappings: readings ? [{
      id: "readings",
      source: "word",
      mappings: [
        mapping("pinyin", "reading", "pinyin", "kàn"),
        mapping("zhuyin", "reading", "zhuyin", "ㄎㄢˋ"),
      ],
    }] : undefined,
    textLineMappings: simplified
      ? [mapping("simplified", "form", "simplified", "我看到了")]
      : undefined,
  };

  return {
    metadata: {
      specVersion: "1",
      title: "Controls",
      defaultLanguageId: "zh",
      defaultFormId: "surface",
      forms: [
        { id: "surface", label: "Surface" },
        { id: "simplified", label: "Simplified" },
        { id: "pinyin", label: "Pinyin" },
        { id: "zhuyin", label: "Zhuyin" },
      ],
    },
    sections: [{ id: "section", blocks: [{ type: "text", text: source }] }],
  };
}

test("reading-only forms hide Form and Reading starts at None", () => {
  const html = renderToStaticMarkup(<ConversationViewer document={viewerDocument()} />);
  assert.doesNotMatch(html, />Form</);
  assert.match(html, />Reading</);
  assert.match(html, /<option value=""[^>]*selected="">None<\/option>/);
  assert.match(html, />Pinyin<\/option>/);
  assert.match(html, />Zhuyin<\/option>/);
  assert.doesNotMatch(html, />Simplified<\/option>/);
  assert.doesNotMatch(html, /inline-table/);
});

test("a whole-line alternative shows Form independently from Reading", () => {
  const html = renderToStaticMarkup(
    <ConversationViewer document={viewerDocument({ simplified: true })} />,
  );
  assert.match(html, />Form</);
  assert.match(html, />Surface<\/option>/);
  assert.match(html, />Simplified<\/option>/);
  assert.match(html, />Reading</);
  assert.match(html, />None<\/option>/);
});

test("a document without reading mappings does not render Reading", () => {
  const html = renderToStaticMarkup(
    <ConversationViewer document={viewerDocument({ readings: false })} />,
  );
  assert.doesNotMatch(html, />Reading</);
});
