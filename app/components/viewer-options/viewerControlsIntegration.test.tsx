import assert from "node:assert/strict";
import test from "node:test";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Document } from "../../types/core/document";
import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import { viewerStyle } from "../../styles/viewerStyle";
import { ConversationViewer } from "../ConversationViewer";
import { DeveloperViewer } from "../DeveloperViewer";
import { ConversationScriptLine } from "../script-line/ConversationScriptLine";
import { DeveloperScriptLine } from "../script-line/DeveloperScriptLine";
import { ViewerOptionControls, type ViewerOptionControlsProps } from "./ViewerOptionControls";
import { ViewerSettingsPanel, getVisibleViewerSettingIds, resolveViewerSettingsOpen, restoreViewerSettingsLauncherFocus, shouldCloseViewerSettingsForClick } from "./ViewerSettings";
import type { ViewerSettingsOwnerProps } from "./viewerSettingsTypes";

const settingsOwner: ViewerSettingsOwnerProps = {
  theme: "system",
  onThemeChange: () => {},
  viewerId: "conversation",
  viewerOptions: [
    { id: "conversation", label: "Conversation viewer" },
    { id: "text", label: "Text viewer" },
    { id: "developer", label: "Developer viewer" },
  ],
  onViewerChange: () => {},
};

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
  const html = renderToStaticMarkup(<ViewerSettingsPanel
    {...settingsOwner}
    formOptions={[]}
    readingOptions={[{ id: "pinyin", label: "Pinyin" }, { id: "zhuyin", label: "Zhuyin" }]}
    translationLanguageOptions={[{ id: "none", label: "None" }]}
    formId="surface"
    readingFormId={null}
    translationLanguageId="none"
    onFormChange={() => {}}
    onReadingChange={() => {}}
    onTranslationLanguageChange={() => {}}
    autoFollowAvailable={false}
    autoFollowEnabled
    autoFollowMode="unpinned"
    onAutoFollowEnabledChange={() => {}}
    onAutoFollowModeChange={() => {}}
  />);
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
    <ViewerOptionControls
      formOptions={[{ id: "surface", label: "Surface" }, { id: "simplified", label: "Simplified" }]}
      readingOptions={[{ id: "pinyin", label: "Pinyin" }]}
      translationLanguageOptions={[{ id: "none", label: "None" }]}
      formId="surface"
      readingFormId={null}
      translationLanguageId="none"
      onFormChange={() => {}}
      onReadingChange={() => {}}
      onTranslationLanguageChange={() => {}}
    />,
  );
  assert.match(html, />Form</);
  assert.match(html, />Surface<\/option>/);
  assert.match(html, />Simplified<\/option>/);
  assert.match(html, />Reading</);
  assert.match(html, />None<\/option>/);
});

test("a document without reading mappings does not render Reading", () => {
  const html = renderToStaticMarkup(
    <ViewerOptionControls
      formOptions={[]}
      readingOptions={[]}
      translationLanguageOptions={[{ id: "none", label: "None" }]}
      formId="surface"
      readingFormId={null}
      translationLanguageId="none"
      onFormChange={() => {}}
      onReadingChange={() => {}}
      onTranslationLanguageChange={() => {}}
    />,
  );
  assert.doesNotMatch(html, />Reading</);
});

test("Settings order is exact and conditional controls stay omitted", () => {
  assert.deepEqual(getVisibleViewerSettingIds({
    hasForm: true,
    hasReading: true,
    hasTranslation: true,
    hasAutoFollow: true,
  }), ["form", "reading", "translation", "auto-follow", "follow-mode", "theme", "viewer"]);
  assert.deepEqual(getVisibleViewerSettingIds({
    hasForm: false,
    hasReading: false,
    hasTranslation: true,
    hasAutoFollow: false,
  }), ["translation", "theme", "viewer"]);

  const html = renderToStaticMarkup(<ViewerSettingsPanel
    {...settingsOwner}
    formOptions={[{ id: "surface" }, { id: "simplified" }]}
    readingOptions={[{ id: "pinyin" }]}
    translationLanguageOptions={[{ id: "none" }]}
    formId="surface"
    readingFormId={null}
    translationLanguageId="none"
    onFormChange={() => {}}
    onReadingChange={() => {}}
    onTranslationLanguageChange={() => {}}
    autoFollowAvailable
    autoFollowEnabled
    autoFollowMode="unpinned"
    onAutoFollowEnabledChange={() => {}}
    onAutoFollowModeChange={() => {}}
  />);
  assert.deepEqual(
    [...html.matchAll(/data-viewer-setting="([^"]+)"/g)].map((match) => match[1]),
    ["form", "reading", "translation", "auto-follow", "follow-mode", "theme", "viewer"],
  );
});

test("Settings disclosure toggles and closes deterministically", () => {
  assert.equal(resolveViewerSettingsOpen(false, "toggle"), true);
  assert.equal(resolveViewerSettingsOpen(true, "toggle"), false);
  assert.equal(resolveViewerSettingsOpen(true, "close"), false);

  const insidePanel = {} as Node;
  const outside = {} as Node;
  const panel = { contains: (target: Node | null) => target === insidePanel };
  const launcher = { contains: () => false };
  assert.equal(shouldCloseViewerSettingsForClick(insidePanel, panel, launcher), false);
  assert.equal(shouldCloseViewerSettingsForClick(outside, panel, launcher), true);

  let focusCount = 0;
  restoreViewerSettingsLauncherFocus({ focus: () => { focusCount += 1; } });
  assert.equal(focusCount, 1);
});

test("Conversation and Developer render the same Settings launcher relationship", () => {
  const document = viewerDocument({ simplified: true });
  const conversation = renderToStaticMarkup(<ConversationViewer document={document} {...settingsOwner} />);
  const developer = renderToStaticMarkup(<DeveloperViewer document={document} {...settingsOwner} />);
  for (const html of [conversation, developer]) {
    assert.match(html, /aria-label="Settings" aria-expanded="false" aria-controls="[^"]+" title="Settings"/);
    assert.match(html, /data-viewer-icon="menu"/);
    assert.match(html, /class="[^"]*h-11[^"]*w-11[^"]*"/);
    assert.doesNotMatch(html, />Settings<\/button>/);
    assert.doesNotMatch(html, /aria-label="Settings" role="menu"/);
  }
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
