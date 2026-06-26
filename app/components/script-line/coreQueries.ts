import type { SelectorId, TimeSpan } from "../../types/core/common";
import type { Resource } from "../../types/core/document";
import type {
  RefAttachmentBundle,
  Selection,
  Selector,
  TextLine,
  TextMappingBundle,
  TextMappingPayload,
} from "../../types/core/textLine";
import type {
  DictionaryBody,
  ResourceRef,
  SelectionRef,
  TextLineRef,
} from "../../types/core/references";

export type LineRef = TextLineRef | SelectionRef;
export type SpeakerRef = TextLineRef & { body: { type: "speaker"; speakerId: string } };
export type AlignmentRef = TextLineRef & { body: { type: "alignment"; interval: TimeSpan } };
export type TagRef = LineRef & { body: { type: "tag"; tags: string[] } };
export type ResourceListRef = TextLineRef & { body: { type: "resourceRef"; refs: ResourceRef[] } };
export type SelectorAnnotation = {
  selectorId: SelectorId;
  selector: Selector;
  selectedText: string;
  mappings: TextMappingPayload[];
  refs: LineRef[];
  selection?: Selection;
};

export function getSpeakerRef(refs: TextLineRef[] | undefined) {
  return refs?.find((ref): ref is SpeakerRef => ref.body.type === "speaker");
}

export function getAlignmentRef(refs: TextLineRef[] | undefined) {
  return refs?.find((ref): ref is AlignmentRef => ref.body.type === "alignment");
}

export function isTagRef(ref: LineRef): ref is TagRef {
  return ref.body.type === "tag";
}

export function isResourceListRef(ref: TextLineRef): ref is ResourceListRef {
  return ref.body.type === "resourceRef";
}

export function isNonDefaultLanguage(languageId: string | undefined, defaultLanguageId: string | undefined) {
  return Boolean(languageId && defaultLanguageId && languageId !== defaultLanguageId);
}

export function getText(value: { text: string } | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "string" ? value : value.text;
}

export function formatFormedTextList(values: { text: string }[] | string[] | string | undefined) {
  if (values == null) return undefined;
  if (typeof values === "string") return values;
  return values.map((value) => getText(value)).filter(Boolean).join(", ");
}

export function dictionaryText(body: DictionaryBody, translationLanguageId: string) {
  const definition =
    translationLanguageId === "none"
      ? undefined
      : formatFormedTextList(body.definitions?.[translationLanguageId]);

  const parts = [
    body.ref ? `ref: ${body.ref.resourceId}` : undefined,
    getText(body.headword) ? `headword: ${getText(body.headword)}` : undefined,
    getText(body.lemma) ? `lemma: ${getText(body.lemma)}` : undefined,
    body.pos ? `pos: ${body.pos}` : undefined,
    definition ? `definition: ${definition}` : undefined,
    body.tags?.length ? `tags: ${body.tags.join(", ")}` : undefined,
  ];

  return parts.filter(Boolean).join(" | ");
}

export function refText(ref: LineRef, translationLanguageId: string) {
  switch (ref.body.type) {
    case "dictionary":
      return dictionaryText(ref.body, translationLanguageId);
    case "note":
      return ref.body.text;
    case "tag":
      return ref.body.tags.join(", ");
    case "resourceRef":
      return ref.body.refs.map((resourceRef) => resourceRef.resourceId).join(", ");
    case "custom":
      return ref.body.schema ?? "Custom";
    case "relation":
      return ref.body.label ?? ref.body.relationType;
    case "alignment":
    case "speaker":
      return undefined;
  }
}

export function lineTags(textLine: TextLine) {
  return textLine.textLineRefs
    ?.filter(isTagRef)
    .flatMap((ref) => ref.body.tags) ?? [];
}

export function selectionTags(selection: Selection | undefined) {
  return selection?.selectionRefs
    ?.filter(isTagRef)
    .flatMap((ref) => ref.body.tags) ?? [];
}

export function attachmentRefs(bundle: RefAttachmentBundle | undefined) {
  return bundle?.attachments.map((attachment) => attachment.ref) ?? [];
}

export function mappingText(mapping: TextMappingPayload) {
  return mapping.image.content.text;
}

export function shouldShowMapping(mapping: TextMappingPayload, translationLanguageId: string) {
  if (translationLanguageId === "none") return true;
  return mapping.image.content.languageId === translationLanguageId;
}

export function getDisplayMapping(textLine: TextLine, formId: string): TextMappingPayload | undefined {
  if (!formId || formId === "none" || formId === textLine.content.formId) return undefined;

  return textLine.textLineMappings?.find(
    (mapping) =>
      (mapping.mappingType === "form" ||
        mapping.mappingType === "transliteration" ||
        mapping.mappingType === "romanization" ||
        mapping.mappingType === "phonemization" ||
        mapping.mappingType === "representation") &&
      mapping.image.content.formId === formId
  );
}

export function getTranslations(textLine: TextLine, languageId: string) {
  return textLine.textLineMappings?.filter(
    (mapping) => mapping.mappingType === "translation" && shouldShowMapping(mapping, languageId)
  ) ?? [];
}

export function getSelectorRange(selector: Selector, text: string) {
  if (selector.selectorType !== "range") return undefined;

  const { range } = selector;
  if (range.start < 0 || range.end <= range.start || range.end > text.length) {
    return undefined;
  }

  return range;
}

export function formatRange(selector: Selector) {
  if (selector.selectorType === "range") {
    return `${selector.range.start}-${selector.range.end}`;
  }

  return selector.positions.join(", ");
}

export function findBundle(bundles: TextMappingBundle[] | undefined, selectorId: SelectorId) {
  return bundles?.find((bundle) => bundle.source === selectorId);
}

export function findRefBundle(bundles: RefAttachmentBundle[] | undefined, selectorId: SelectorId) {
  return bundles?.find((bundle) => bundle.source === selectorId);
}

export function collectSelectorAnnotations(textLine: TextLine, text: string): SelectorAnnotation[] {
  if (!textLine.selectorRecord) return [];

  const annotations = new Map<SelectorId, SelectorAnnotation>();

  const ensureAnnotation = (selectorId: SelectorId, selection?: Selection) => {
    const selector = textLine.selectorRecord?.[selectorId];
    if (!selector) return undefined;

    const range = getSelectorRange(selector, text);
    if (!range) return undefined;

    const existing = annotations.get(selectorId);
    if (existing) {
      if (selection && !existing.selection) existing.selection = selection;
      return existing;
    }

    const annotation: SelectorAnnotation = {
      selectorId,
      selector,
      selectedText: text.slice(range.start, range.end),
      mappings: [...(findBundle(textLine.selectedTextMappings, selectorId)?.mappings ?? [])],
      refs: [...attachmentRefs(findRefBundle(textLine.selectedTextRefs, selectorId))],
      selection,
    };
    annotations.set(selectorId, annotation);
    return annotation;
  };

  Object.keys(textLine.selectorRecord).forEach((selectorId) => {
    ensureAnnotation(selectorId);
  });

  textLine.selections?.forEach((selection) => {
    selection.selectorIds.forEach((selectorId) => {
      const annotation = ensureAnnotation(selectorId, selection);
      if (!annotation) return;

      annotation.mappings.push(...(findBundle(selection.localSelectedTextMappings, selectorId)?.mappings ?? []));
      annotation.refs.push(...attachmentRefs(findRefBundle(selection.localSelectedTextRefs, selectorId)));
    });
  });

  return Array.from(annotations.values());
}

export function annotationTitle(annotation: SelectorAnnotation, translationLanguageId: string) {
  const mappingLines = annotation.mappings
    .filter((mapping) => shouldShowMapping(mapping, translationLanguageId))
    .map((mapping) => `${mapping.mappingType}: ${mappingText(mapping)}`);
  const refLines = annotation.refs
    .map((ref) => refText(ref, translationLanguageId))
    .filter(Boolean);
  const selectionLines = annotation.selection?.selectionMappings
    ?.filter((mapping) => shouldShowMapping(mapping, translationLanguageId))
    .map((mapping) => `${mapping.mappingType}: ${mappingText(mapping)}`) ?? [];

  return [...mappingLines, ...selectionLines, ...refLines].join("\n") || undefined;
}

export function annotationTags(annotation: SelectorAnnotation) {
  const refTags = annotation.refs
    .filter(isTagRef)
    .flatMap((ref) => ref.body.tags);

  return [...refTags, ...selectionTags(annotation.selection)];
}

export function refsToResources(refs: ResourceRef[], resources: Resource[]) {
  return refs
    .map((resourceRef) => resources.find((resource) => resource.id === resourceRef.resourceId))
    .filter((resource): resource is Resource => Boolean(resource));
}

export function collectResourceRefs(refs: TextLineRef[] | undefined) {
  return refs
    ?.filter(isResourceListRef)
    .flatMap((ref) => ref.body.refs) ?? [];
}
