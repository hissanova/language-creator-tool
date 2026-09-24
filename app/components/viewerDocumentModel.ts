import type { Document, MediaResource, Resource, Section } from "../types/core/document";
import type { TextLine } from "../types/core/textLine";
import { resolveLinePlaybackRange } from "./playback/linePlayback";
import type { LinePlaybackRange } from "./playback/playbackState";
import { getAlignmentRef, isWholeLineDisplayFormMapping } from "./script-line/coreQueries";
import { collectMappingPresentationCandidates } from "./script-line/resolveMappingPresentations";

export type SelectOption = { id: string; label?: string };
export type ViewerPresentationSelections = {
  formId: string;
  selectedReadingFormId: string | null;
};

function collectViewerFormOptions(
  document: Document,
  lines: readonly TextLine[],
): SelectOption[] {
  const formRegistry = new Map(
    (document.metadata.forms ?? []).map((form) => [form.id, form]),
  );
  const options: SelectOption[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    options.push(formRegistry.get(id) ?? { id });
  };

  const canonicalFormId = document.metadata.defaultFormId &&
    (lines.length === 0 || lines.some((line) => line.content.formId === document.metadata.defaultFormId))
    ? document.metadata.defaultFormId
    : lines[0]?.content.formId;
  if (canonicalFormId) add(canonicalFormId);
  lines.forEach((line) => line.textLineMappings
    ?.filter(isWholeLineDisplayFormMapping)
    .forEach((mapping) => add(mapping.image.content.formId)));

  return options;
}

function collectViewerReadingOptions(
  document: Document,
  lines: readonly TextLine[],
): SelectOption[] {
  const formRegistry = new Map(
    (document.metadata.forms ?? []).map((form) => [form.id, form]),
  );
  const options: SelectOption[] = [];
  const seen = new Set<string>();

  lines.flatMap(collectMappingPresentationCandidates).forEach(({ mapping }) => {
    if (mapping.mappingType !== "reading") return;
    const id = mapping.image.content.formId;
    if (seen.has(id)) return;
    seen.add(id);
    options.push(formRegistry.get(id) ?? { id });
  });

  return options;
}

export function deriveViewerDocumentOptions(
  document: Document,
  lines = collectDocumentTextLines(document.sections),
) {
  const formOptions = collectViewerFormOptions(document, lines);
  const readingOptions = collectViewerReadingOptions(document, lines);
  const languages = document.metadata.languages ?? [];
  const translationLanguageOptions: SelectOption[] = languages.some((language) => language.id === "none")
    ? languages
    : [{ id: "none", label: "Off" }, ...languages];

  return { formOptions, readingOptions, translationLanguageOptions };
}

export function resolveInitialViewerFormId(
  document: Document,
  formOptions: readonly SelectOption[] = deriveViewerDocumentOptions(document).formOptions,
) {
  const defaultFormId = document.metadata.defaultFormId;
  if (defaultFormId && formOptions.some((option) => option.id === defaultFormId)) {
    return defaultFormId;
  }
  return formOptions[0]?.id ?? "none";
}

export function resolveInitialViewerTranslationLanguageId() {
  return "none";
}

export function resolveInitialViewerReadingFormId(): string | null {
  return null;
}

export function resolveAvailableViewerSelections(
  document: Document,
  formOptions: readonly SelectOption[],
  readingOptions: readonly SelectOption[],
  current?: ViewerPresentationSelections,
): ViewerPresentationSelections {
  const initialFormId = resolveInitialViewerFormId(document, formOptions);
  return {
    formId: current && formOptions.some((option) => option.id === current.formId)
      ? current.formId
      : initialFormId,
    selectedReadingFormId: current?.selectedReadingFormId != null &&
      readingOptions.some((option) => option.id === current.selectedReadingFormId)
      ? current.selectedReadingFormId
      : resolveInitialViewerReadingFormId(),
  };
}

export function classifyViewerMediaResources(document: Document) {
  const resources = document.resources ?? [];
  const audioResources = resources.filter(
    (resource): resource is MediaResource => resource.type === "media" && resource.mediaType === "audio",
  );
  const fallbackVideo = resources.find(
    (resource) => resource.type === "media" && resource.mediaType === "video",
  );
  return { audioResources, fallbackVideo };
}

export function resolveViewerSpeakers(document: Document) {
  return document.metadata.speakers ?? [];
}

export function collectDocumentTextLines(sections: readonly Section[]): TextLine[] {
  const lines: TextLine[] = [];
  const visit = (section: Section) => {
    for (const block of section.blocks) {
      if (block.type === "text") lines.push(block.text);
      else if (block.type === "section") visit(block.section);
    }
  };
  sections.forEach(visit);
  return lines;
}

export function buildLinePlaybackRangeIndex(
  lines: readonly TextLine[],
  resources: readonly Resource[],
  normalizeSource: (source: string) => string,
  knownMedia: { mediaSource: string | null; duration: number | null },
): ReadonlyMap<string, LinePlaybackRange> {
  const ranges = new Map<string, LinePlaybackRange>();
  for (const line of lines) {
    const range = resolveLinePlaybackRange(line, resources, normalizeSource, knownMedia);
    if (range) ranges.set(line.id, range);
  }
  return ranges;
}

export function resolveViewerLinePlaybackPresentation(
  line: TextLine,
  ranges: ReadonlyMap<string, LinePlaybackRange>,
  selectedLineRange: LinePlaybackRange | null,
  currentPlaybackLineId: string | null,
) {
  const playbackRange = ranges.get(line.id) ?? null;
  return {
    playbackRange,
    hasPlaybackTiming: Boolean(getAlignmentRef(line.textLineRefs)),
    isRangeLocked: selectedLineRange?.lineId === line.id &&
      selectedLineRange.mediaSource === playbackRange?.mediaSource,
    isCurrentPlaybackLine: currentPlaybackLineId === line.id,
  };
}

export function resolveSectionPlaybackRange(
  section: Section,
  audioResources: readonly MediaResource[],
  normalizeSource: (source: string) => string,
): LinePlaybackRange | null {
  const audio = audioResources[0];
  if (!audio || section.time?.end == null) return null;
  return {
    type: "line",
    lineId: section.id,
    mediaResourceId: audio.id,
    mediaSource: normalizeSource(audio.src),
    start: section.time.start,
    end: section.time.end,
  };
}
