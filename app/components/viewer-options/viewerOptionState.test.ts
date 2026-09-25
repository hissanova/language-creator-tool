import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialViewerOptionSelections,
  reconcileViewerOptionSelections,
  viewerOptionReducer,
  type ViewerOptionAvailability,
  type ViewerOptionSelections,
} from "./viewerOptionState";

const availability: ViewerOptionAvailability = {
  formOptions: [{ id: "surface" }, { id: "simplified" }],
  readingOptions: [{ id: "pinyin" }, { id: "zhuyin" }],
  translationLanguageOptions: [{ id: "none" }, { id: "en" }],
};

test("initial selections use a valid default Form, None, and Off", () => {
  assert.deepEqual(createInitialViewerOptionSelections(availability, "simplified"), {
    formId: "simplified",
    readingFormId: null,
    translationLanguageId: "none",
  });
  assert.equal(createInitialViewerOptionSelections(availability, "missing").formId, "surface");
  assert.equal(createInitialViewerOptionSelections({ ...availability, formOptions: [] }).formId, "none");
});

test("Form selection changes only the Form", () => {
  const initial = createInitialViewerOptionSelections(availability, "surface");
  const withForm = viewerOptionReducer(initial, {
    type: "select-form",
    formId: "simplified",
    options: availability.formOptions,
  });

  assert.deepEqual(withForm, { ...initial, formId: "simplified" });
});

test("Reading selection changes only the Reading", () => {
  const initial = createInitialViewerOptionSelections(availability, "surface");
  const withReading = viewerOptionReducer(initial, {
    type: "select-reading",
    readingFormId: "pinyin",
    options: availability.readingOptions,
  });

  assert.deepEqual(withReading, { ...initial, readingFormId: "pinyin" });
});

test("Translation selection changes only the Translation", () => {
  const initial = createInitialViewerOptionSelections(availability, "surface");
  const withTranslation = viewerOptionReducer(initial, {
    type: "select-translation",
    languageId: "en",
    options: availability.translationLanguageOptions,
  });

  assert.deepEqual(withTranslation, { ...initial, translationLanguageId: "en" });
});

test("Form and Reading selections remain independent", () => {
  const initial = createInitialViewerOptionSelections(availability, "surface");
  const withForm = viewerOptionReducer(initial, {
    type: "select-form",
    formId: "simplified",
    options: availability.formOptions,
  });
  const withReading = viewerOptionReducer(withForm, {
    type: "select-reading",
    readingFormId: "pinyin",
    options: availability.readingOptions,
  });

  assert.deepEqual(withReading, { ...withForm, readingFormId: "pinyin" });
});

test("Reading resets to None whenever the document changes", () => {
  const current: ViewerOptionSelections = {
    formId: "surface",
    readingFormId: "pinyin",
    translationLanguageId: "en",
  };
  assert.deepEqual(reconcileViewerOptionSelections(current, availability, "surface", true), {
    formId: "surface",
    readingFormId: null,
    translationLanguageId: "en",
  });
});

test("a document change falls back from an invalid Form", () => {
  const current: ViewerOptionSelections = {
    formId: "simplified",
    readingFormId: "zhuyin",
    translationLanguageId: "en",
  };
  const next: ViewerOptionAvailability = {
    formOptions: [{ id: "formal" }, { id: "plain" }],
    readingOptions: [{ id: "zhuyin" }],
    translationLanguageOptions: availability.translationLanguageOptions,
  };
  assert.equal(reconcileViewerOptionSelections(current, next, "plain", true).formId, "plain");
});

test("a document change falls back from an invalid Translation", () => {
  const current: ViewerOptionSelections = {
    formId: "surface",
    readingFormId: "zhuyin",
    translationLanguageId: "en",
  };
  const next: ViewerOptionAvailability = {
    ...availability,
    translationLanguageOptions: [{ id: "none" }, { id: "ja" }],
  };
  assert.equal(
    reconcileViewerOptionSelections(current, next, "surface", true).translationLanguageId,
    "none",
  );
});

test("valid selections remain stable within the same document", () => {
  const current: ViewerOptionSelections = {
    formId: "simplified",
    readingFormId: "zhuyin",
    translationLanguageId: "en",
  };
  assert.deepEqual(
    reconcileViewerOptionSelections(current, availability, "surface", false),
    current,
  );
});

test("unavailable direct selections are rejected", () => {
  const initial = createInitialViewerOptionSelections(availability, "surface");
  assert.equal(viewerOptionReducer(initial, {
    type: "select-form", formId: "missing", options: availability.formOptions,
  }), initial);
  assert.equal(viewerOptionReducer(initial, {
    type: "select-reading", readingFormId: "missing", options: availability.readingOptions,
  }), initial);
  assert.equal(viewerOptionReducer(initial, {
    type: "select-translation", languageId: "missing", options: availability.translationLanguageOptions,
  }), initial);
});
