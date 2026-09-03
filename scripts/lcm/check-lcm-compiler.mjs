import assert from "node:assert/strict";
import { compileLcmToDocument } from "./compile-lcm.mjs";
import { lcmFixtures } from "./fixtures.mjs";

function textLines(document) {
  return document.sections.flatMap((section) =>
    section.blocks.filter((block) => block.type === "text").map((block) => block.text),
  );
}

function mappingText(mapping) {
  return mapping.image.content.text;
}

function selectedText(textLine, selectorId) {
  const selector = textLine.selectorRecord?.[selectorId];
  assert.equal(selector?.selectorType, "range", `Expected range selector ${selectorId}`);
  return textLine.content.text.slice(selector.range.start, selector.range.end);
}

function selectionParts(textLine, selection) {
  return selection.selectorIds.map((selectorId) => selectedText(textLine, selectorId));
}

function tags(refs) {
  return refs?.filter((ref) => ref.body.type === "tag").flatMap((ref) => ref.body.tags) ?? [];
}

function localMappings(selection) {
  return selection.localSelectedTextMappings?.flatMap((bundle) => bundle.mappings) ?? [];
}

function checkConversation(document) {
  assert.equal(document.metadata.title, "Conversation viewer smoke test");
  assert.equal(document.sections.length, 1);
  const lines = textLines(document);
  assert.equal(lines.length, 4);
  assert.equal(
    lines[0].textLineRefs?.find((ref) => ref.body.type === "speaker")?.body.speakerId,
    "chichi",
  );
  assert.ok(lines[0].textLineRefs?.some((ref) => ref.body.type === "alignment"));
  assert.ok(
    lines[0].textLineMappings?.some(
      (mapping) =>
        mapping.mappingType === "translation" &&
        mapping.image.content.languageId === "ja" &&
        mappingText(mapping) === "はじめていいよ",
    ),
  );
  assert.ok(
    lines[1].textLineRefs?.some(
      (ref) => ref.body.type === "tag" && ref.body.tags.includes("unnatural"),
    ),
  );
  assert.ok(lines[2].textLineRefs?.some((ref) => ref.body.type === "note"));
  assert.ok(
    lines[3].selectedTextMappings?.some((bundle) =>
      bundle.mappings.some(
        (mapping) => mapping.mappingType === "gloss" && mappingText(mapping) === "遅い",
      ),
    ),
  );
}

function checkCheatSheet(document) {
  assert.equal(document.metadata.title, "LCM creator cheat sheet");
  assert.equal(document.sections.length, 2);
  const lines = textLines(document);
  assert.equal(lines.length, 7);
  assert.ok(
    lines[0].textLineMappings?.some(
      (mapping) =>
        mapping.mappingType === "translation" &&
        mapping.image.content.languageId === "en" &&
        mappingText(mapping) === "Hello everyone",
    ),
  );
  assert.ok(tags(lines[1].textLineRefs).includes("keyphrase"));
  assert.ok(lines[2].textLineRefs?.some((ref) => ref.body.type === "note"));
  assert.ok(
    lines[2].selectedTextMappings?.some((bundle) =>
      bundle.mappings.some(
        (mapping) => mapping.mappingType === "gloss" && mappingText(mapping) === "can hear",
      ),
    ),
  );
}

function checkMinimum(document) {
  const [line] = textLines(document);
  assert.equal(line.content.text, "喫到飽");
  assert.equal(line.selections?.length, 1);
  const selection = line.selections[0];
  assert.equal(selection.selectionType, "decomposition");
  assert.deepEqual(selectionParts(line, selection), ["喫", "到", "飽"]);
  assert.ok(tags(selection.selectionRefs).includes("decomposition"));
  assert.ok(tags(selection.selectionRefs).includes("morphology"));
  assert.ok(
    selection.selectionMappings?.some(
      (mapping) =>
        mapping.mappingType === "translation" && mappingText(mapping) === "all-you-can-eat",
    ),
  );
  assert.deepEqual(
    localMappings(selection)
      .filter((mapping) => mapping.mappingType === "gloss")
      .map(mappingText)
      .sort(),
    ["arrive", "eat", "full"],
  );
}

function checkNested(document) {
  const [line] = textLines(document);
  assert.equal(line.content.text, "看不懂");
  const topSelection = line.selections?.[0];
  assert.ok(topSelection);
  assert.deepEqual(selectionParts(line, topSelection), ["看", "不懂"]);
  assert.ok(
    topSelection.selectionMappings?.some(
      (mapping) => mappingText(mapping) === "cannot understand",
    ),
  );

  const budongSelectorId = topSelection.selectorIds.find(
    (selectorId) => selectedText(line, selectorId) === "不懂",
  );
  assert.ok(budongSelectorId);
  const budongBundle = topSelection.localSelectedTextMappings?.find(
    (bundle) => bundle.source === budongSelectorId,
  );
  assert.ok(budongBundle);

  const gloss = budongBundle.mappings.find(
    (mapping) => mapping.mappingType === "gloss" && mappingText(mapping) === "not understand",
  );
  assert.ok(gloss);
  const glossSelection = gloss.image.selections?.[0];
  assert.ok(glossSelection);
  assert.deepEqual(selectionParts(gloss.image, glossSelection), ["not", "understand"]);

  const localSource = budongBundle.mappings.find(
    (mapping) => mapping.mappingType === "localSource" && mappingText(mapping) === "不懂",
  );
  assert.ok(localSource);
  const localSelection = localSource.image.selections?.[0];
  assert.ok(localSelection);
  assert.deepEqual(selectionParts(localSource.image, localSelection), ["不", "懂"]);
  assert.deepEqual(
    localMappings(localSelection)
      .filter((mapping) => mapping.mappingType === "gloss")
      .map(mappingText)
      .sort(),
    ["not", "understand"],
  );
}

const checks = {
  "viewer-conversation-smoke": checkConversation,
  "lcm-cheat-sheet": checkCheatSheet,
  "decomposition-minimum": checkMinimum,
  "decomposition-nested-minimum": checkNested,
};

for (const fixture of lcmFixtures) {
  const document = await compileLcmToDocument(fixture.sourcePath);
  assert.deepEqual(await compileLcmToDocument(fixture.sourcePath), document);
  assert.ok(!JSON.stringify(document).includes('"formId":"gloss"'));
  checks[fixture.name](document);
  console.log(`Checked ${fixture.name}`);
}
