import assert from "node:assert/strict";
import test from "node:test";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Document } from "../../types/core/document";
import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import { viewerStyle } from "../../styles/viewerStyle";
import { ConversationViewer } from "../ConversationViewer";
import { ConversationScriptLine } from "../script-line/ConversationScriptLine";
import { DeveloperScriptLine } from "../script-line/DeveloperScriptLine";
import { ViewerOptionControls, type ViewerOptionControlsProps } from "./ViewerOptionControls";

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

function viewerLine({ readings = true, simplified = false } = {}): TextLine {
  return {
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
}

function viewerDocument(options: Parameters<typeof viewerLine>[0] = {}): Document {
  return {
    metadata: {
      specVersion: "1",
      title: "Controls",
      defaultLanguageId: "zh",
      defaultFormId: "surface",
      languages: [{ id: "zh", label: "Chinese" }],
      forms: [
        { id: "surface", label: "Surface" },
        { id: "simplified", label: "Simplified" },
        { id: "pinyin", label: "Pinyin" },
        { id: "zhuyin", label: "Zhuyin" },
      ],
    },
    sections: [{ id: "section", blocks: [{ type: "text", text: viewerLine(options) }] }],
  };
}

function descendants(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{ children?: ReactNode }>;
  return [element, ...Children.toArray(element.props.children).flatMap(descendants)];
}

test("reading-only forms hide Form and Reading starts at None", () => {
  const html = renderToStaticMarkup(<ConversationViewer document={viewerDocument()} />);
  assert.doesNotMatch(html, />Form</);
  assert.match(html, />Reading</);
  assert.match(html, /<option value=""[^>]*selected="">None<\/option>/);
  assert.match(html, />Pinyin<\/option>/);
  assert.match(html, />Zhuyin<\/option>/);
  assert.doesNotMatch(html, />Simplified<\/option>/);
  assert.doesNotMatch(html, /<ruby|<rt/);
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

test("control callbacks preserve independent values and change both line compositions", () => {
  const selected = {
    formId: "surface",
    readingFormId: null as string | null,
    translationLanguageId: "none",
  };
  const props: ViewerOptionControlsProps = {
    formOptions: [{ id: "surface" }, { id: "simplified" }],
    readingOptions: [{ id: "pinyin" }, { id: "zhuyin" }],
    translationLanguageOptions: [{ id: "none" }, { id: "zh" }],
    ...selected,
    onFormChange: (formId) => { selected.formId = formId; },
    onReadingChange: (readingFormId) => { selected.readingFormId = readingFormId; },
    onTranslationLanguageChange: (translationLanguageId) => {
      selected.translationLanguageId = translationLanguageId;
    },
  };
  const selects = descendants(ViewerOptionControls(props)).filter(({ type }) => type === "select");
  const change = (index: number, value: string) => {
    const onChange = (selects[index].props as {
      onChange: (event: { target: { value: string } }) => void;
    }).onChange;
    onChange({ target: { value } });
  };

  change(1, "pinyin");
  change(2, "zh");
  assert.deepEqual(selected, {
    formId: "surface",
    readingFormId: "pinyin",
    translationLanguageId: "zh",
  });

  const lineProps = {
    textNode: viewerLine({ simplified: true }),
    speakers: [],
    formId: selected.formId,
    selectedReadingFormId: selected.readingFormId,
    translationLanguageId: selected.translationLanguageId,
    style: viewerStyle,
  };
  const conversation = renderToStaticMarkup(<ConversationScriptLine {...lineProps} />);
  const developer = renderToStaticMarkup(<DeveloperScriptLine {...lineProps} />);
  for (const html of [conversation, developer]) {
    const presentedText = html.split("<details")[0].replace(/<[^>]*>/g, "");
    assert.match(presentedText, /kàn/);
    assert.doesNotMatch(presentedText, /ㄎㄢˋ/);
    assert.match(html, /<ruby>[\s\S]*<rt>kàn<\/rt>/);
  }

  change(0, "simplified");
  assert.equal(selected.formId, "simplified");
  assert.equal(selected.readingFormId, "pinyin");
});
