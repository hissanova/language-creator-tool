import type { CSSProperties, ReactNode } from "react";
import type {
  Language,
  Resource,
  Speaker,
} from "../types/core/document";
import type { SelectorId, TimeSpan } from "../types/core/common";
import type {
  RefAttachmentBundle,
  Selection,
  Selector,
  TextLine,
  TextMappingBundle,
  TextMappingPayload,
} from "../types/core/textLine";
import type {
  DictionaryBody,
  ResourceRef,
  SelectionRef,
  TextLineRef,
} from "../types/core/references";
import type { TagTextDisplayStyle, ViewerStyle } from "../types/viewerStyle";
import { HoverWord } from "./HoverWord";

type Props = {
  textNode: TextLine;
  speakers: Speaker[];
  resources?: Resource[];
  defaultLanguageId?: string;
  languages?: Language[];
  formId: string;
  translationLanguageId: string;
  style: ViewerStyle;
  annotationMode?: "learner" | "developer";
  canPlay?: boolean;
  onPlay?: (interval: TimeSpan) => void;
};

type LineRef = TextLineRef | SelectionRef;
type SpeakerRef = TextLineRef & { body: { type: "speaker"; speakerId: string } };
type AlignmentRef = TextLineRef & { body: { type: "alignment"; interval: TimeSpan } };
type TagRef = LineRef & { body: { type: "tag"; tags: string[] } };
type ResourceListRef = TextLineRef & { body: { type: "resourceRef"; refs: ResourceRef[] } };
type SelectorAnnotation = {
  selectorId: SelectorId;
  selector: Selector;
  selectedText: string;
  mappings: TextMappingPayload[];
  refs: LineRef[];
  selection?: Selection;
};

function getSpeakerRef(refs: TextLineRef[] | undefined) {
  return refs?.find((ref): ref is SpeakerRef => ref.body.type === "speaker");
}

function getAlignmentRef(refs: TextLineRef[] | undefined) {
  return refs?.find((ref): ref is AlignmentRef => ref.body.type === "alignment");
}

function isTagRef(ref: LineRef): ref is TagRef {
  return ref.body.type === "tag";
}

function isResourceListRef(ref: TextLineRef): ref is ResourceListRef {
  return ref.body.type === "resourceRef";
}

function tagDisplayStyle(tag: string, style: ViewerStyle) {
  return style.tags?.[tag];
}

function tagLabel(tag: string, style: ViewerStyle) {
  return tagDisplayStyle(tag, style)?.label ?? tag;
}

function tagInlineStyle(tag: string, style: ViewerStyle): CSSProperties | undefined {
  const configuredStyle = tagDisplayStyle(tag, style)?.style;
  if (!configuredStyle) return undefined;

  return {
    color: configuredStyle.color,
    backgroundColor: configuredStyle.backgroundColor,
    borderColor: configuredStyle.borderColor,
  };
}

function mergeTagTextDisplayStyles(tags: string[], style: ViewerStyle) {
  const configuredStyles = tags
    .map((tag) => tagDisplayStyle(tag, style))
    .filter((tagStyle): tagStyle is TagTextDisplayStyle => Boolean(tagStyle));
  const className = configuredStyles
    .map((configuredStyle) => configuredStyle.className)
    .filter(Boolean)
    .join(" ");
  const inlineStyle = configuredStyles.reduce<CSSProperties>(
    (mergedStyle, configuredStyle) => ({
      ...mergedStyle,
      ...configuredStyle.style,
    }),
    {}
  );

  return {
    className: className || undefined,
    style: Object.keys(inlineStyle).length ? inlineStyle : undefined,
  };
}

function TagChip({ tag, style }: { tag: string; style: ViewerStyle }) {
  const configuredStyle = tagDisplayStyle(tag, style);
  const className =
    configuredStyle?.className ??
    "border-gray-300 bg-gray-100 text-gray-900";

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${className}`}
      style={tagInlineStyle(tag, style)}
    >
      {tagLabel(tag, style)}
    </span>
  );
}

function isNonDefaultLanguage(languageId: string | undefined, defaultLanguageId: string | undefined) {
  return Boolean(languageId && defaultLanguageId && languageId !== defaultLanguageId);
}

function languageLabel(languageId: string, languages: Language[] | undefined) {
  return languages?.find((language) => language.id === languageId)?.label ?? languageId;
}

function getText(value: { text: string } | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "string" ? value : value.text;
}

function formatFormedTextList(values: { text: string }[] | string[] | string | undefined) {
  if (values == null) return undefined;
  if (typeof values === "string") return values;
  return values.map((value) => getText(value)).filter(Boolean).join(", ");
}

function dictionaryText(body: DictionaryBody, translationLanguageId: string) {
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

function refText(ref: LineRef, translationLanguageId: string) {
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

function lineTags(textLine: TextLine) {
  return textLine.textLineRefs
    ?.filter(isTagRef)
    .flatMap((ref) => ref.body.tags) ?? [];
}

function selectionTags(selection: Selection | undefined) {
  return selection?.selectionRefs
    ?.filter(isTagRef)
    .flatMap((ref) => ref.body.tags) ?? [];
}

function attachmentRefs(bundle: RefAttachmentBundle | undefined) {
  return bundle?.attachments.map((attachment) => attachment.ref) ?? [];
}

function mappingText(mapping: TextMappingPayload) {
  return mapping.image.content.text;
}

function shouldShowMapping(mapping: TextMappingPayload, translationLanguageId: string) {
  if (translationLanguageId === "none") return true;
  return mapping.image.content.languageId === translationLanguageId;
}

function getDisplayMapping(textLine: TextLine, formId: string): TextMappingPayload | undefined {
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

function getTranslations(textLine: TextLine, languageId: string) {
  return textLine.textLineMappings?.filter(
    (mapping) => mapping.mappingType === "translation" && shouldShowMapping(mapping, languageId)
  ) ?? [];
}

function getSelectorRange(selector: Selector, text: string) {
  if (selector.selectorType !== "range") return undefined;

  const { range } = selector;
  if (range.start < 0 || range.end <= range.start || range.end > text.length) {
    return undefined;
  }

  return range;
}

function findBundle(bundles: TextMappingBundle[] | undefined, selectorId: SelectorId) {
  return bundles?.find((bundle) => bundle.source === selectorId);
}

function findRefBundle(bundles: RefAttachmentBundle[] | undefined, selectorId: SelectorId) {
  return bundles?.find((bundle) => bundle.source === selectorId);
}

function collectSelectorAnnotations(textLine: TextLine, text: string): SelectorAnnotation[] {
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

function annotationTitle(annotation: SelectorAnnotation, translationLanguageId: string) {
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

function annotationTags(annotation: SelectorAnnotation) {
  const refTags = annotation.refs
    .filter(isTagRef)
    .flatMap((ref) => ref.body.tags);

  return [...refTags, ...selectionTags(annotation.selection)];
}

function renderAnnotatedText({
  text,
  annotations,
  translationLanguageId,
  style,
}: {
  text: string;
  annotations: SelectorAnnotation[];
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  const selected = annotations
    .map((annotation) => ({
      annotation,
      range: getSelectorRange(annotation.selector, text),
    }))
    .filter((item): item is { annotation: SelectorAnnotation; range: { start: number; end: number } } => Boolean(item.range))
    .sort((a, b) => a.range.start - b.range.start || b.range.end - a.range.end);

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const { annotation, range } of selected) {
    if (range.start < cursor) continue;

    if (cursor < range.start) {
      nodes.push(<span key={`plain-${cursor}`}>{text.slice(cursor, range.start)}</span>);
    }

    const title = annotationTitle(annotation, translationLanguageId);
    const tagTextStyle = mergeTagTextDisplayStyles(annotationTags(annotation), style);
    const annotationClassName = title ? style.text.annotated : style.text.annotationWithoutPopup;

    nodes.push(
      <HoverWord
        key={`${annotation.selectorId}-${range.start}-${range.end}`}
        text={text.slice(range.start, range.end)}
        title={title}
        className={[annotationClassName, tagTextStyle.className].filter(Boolean).join(" ")}
        style={tagTextStyle.style}
      />
    );

    cursor = range.end;
  }

  if (cursor < text.length) {
    nodes.push(<span key={`plain-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return nodes;
}

function RefView({
  refValue,
  translationLanguageId,
  style,
}: {
  refValue: LineRef;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  const text = refText(refValue, translationLanguageId);
  if (!text) return null;

  return (
    <div className={style.text.annotationBox}>
      <div className={style.text.annotationTitle}>{refValue.body.type}</div>
      <div>{text}</div>
    </div>
  );
}

function MappingDetailView({ mapping }: { mapping: TextMappingPayload }) {
  return (
    <div className="rounded border border-emerald-200 bg-emerald-50/60 p-2 text-gray-950">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
          mapping
        </span>
        <span className="font-semibold text-gray-900">{mapping.mappingType}</span>
        <span className="text-xs text-gray-700">{mapping.id}</span>
      </div>
      <div className="rounded bg-white px-2 py-1">{mappingText(mapping)}</div>
    </div>
  );
}

function RefDetailView({
  refValue,
  translationLanguageId,
}: {
  refValue: LineRef;
  translationLanguageId: string;
}) {
  const text = refText(refValue, translationLanguageId);

  if (text) {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        <span className="font-semibold text-gray-900">{refValue.body.type}: </span>
        <span>{text}</span>
      </div>
    );
  }

  if (refValue.body.type === "alignment") {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        <span className="font-semibold text-gray-900">alignment: </span>
        <span>
          {refValue.body.interval.start}
          {refValue.body.interval.end != null ? `-${refValue.body.interval.end}` : ""}
        </span>
      </div>
    );
  }

  if (refValue.body.type === "speaker") {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        <span className="font-semibold text-gray-900">speaker: </span>
        <span>{refValue.body.speakerId}</span>
      </div>
    );
  }

  return null;
}

function formatRange(selector: Selector) {
  if (selector.selectorType === "range") {
    return `${selector.range.start}-${selector.range.end}`;
  }

  return selector.positions.join(", ");
}

function DeveloperAnnotationView({
  annotation,
  translationLanguageId,
}: {
  annotation: SelectorAnnotation;
  translationLanguageId: string;
}) {
  return (
    <div className="rounded border border-sky-200 bg-sky-50/70 p-3 text-gray-950">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-950">
          selector
        </span>
        <span className="font-semibold text-gray-950">{annotation.selectedText}</span>
        <span className="text-xs text-gray-700">{annotation.selectorId}</span>
        <span className="text-xs text-gray-700">range: {formatRange(annotation.selector)}</span>
      </div>

      {annotation.mappings.length ? (
        <div className="mb-2 space-y-2">
          {annotation.mappings.map((mapping) => (
            <MappingDetailView key={mapping.id} mapping={mapping} />
          ))}
        </div>
      ) : null}

      {annotation.refs.length ? (
        <div className="space-y-1">
          {annotation.refs.map((refValue) => (
            <RefDetailView
              key={refValue.id}
              refValue={refValue}
              translationLanguageId={translationLanguageId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LearnerAnnotationView({
  annotation,
  style,
  translationLanguageId,
}: {
  annotation: SelectorAnnotation;
  style: ViewerStyle;
  translationLanguageId: string;
}) {
  const tags = annotationTags(annotation);
  const mappings = annotation.mappings.filter((mapping) => shouldShowMapping(mapping, translationLanguageId));
  const selectionMappings = annotation.selection?.selectionMappings
    ?.filter((mapping) => shouldShowMapping(mapping, translationLanguageId)) ?? [];

  if (!tags.length && !mappings.length && !selectionMappings.length && !annotation.refs.length) return null;

  return (
    <div className="rounded border border-gray-200 bg-white p-3 text-gray-950 shadow-sm">
      <div className="mb-2 font-semibold text-gray-950">{annotation.selectedText}</div>

      {tags.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} style={style} />
          ))}
        </div>
      ) : null}

      {[...mappings, ...selectionMappings].length ? (
        <div className="space-y-1">
          {[...mappings, ...selectionMappings].map((mapping) => (
            <div
              key={mapping.id}
              className="grid gap-1 rounded bg-gray-50 px-2 py-1 sm:grid-cols-[minmax(4rem,auto)_1fr]"
            >
              <span className="text-xs font-semibold uppercase text-gray-700">
                {mapping.mappingType}
              </span>
              <span>{mappingText(mapping)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {annotation.refs.map((refValue) => (
        <RefView
          key={refValue.id}
          refValue={refValue}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ))}
    </div>
  );
}

function ResourceView({
  resource,
  translationLanguageId,
  style,
}: {
  resource: Resource;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  if (resource.type === "image") {
    const caption =
      translationLanguageId === "none"
        ? undefined
        : resource.caption?.[translationLanguageId]?.text;

    return (
      <figure className={style.resource.figure}>
        <img src={resource.src} alt={resource.alt ?? ""} className={style.resource.image} />
        {caption && <figcaption className={style.resource.caption}>{caption}</figcaption>}
      </figure>
    );
  }

  if (resource.type === "media" && resource.mediaType === "audio") {
    return <audio controls src={resource.src} className="mt-3 w-full" />;
  }

  if (resource.type === "media" && resource.mediaType === "video") {
    return <video controls src={resource.src} className="mt-3 max-h-64 w-full" />;
  }

  if (resource.type === "external" && resource.uri) {
    return (
      <a href={resource.uri} target="_blank" rel="noreferrer" className="underline">
        {resource.title ?? resource.uri}
      </a>
    );
  }

  return null;
}

function refsToResources(refs: ResourceRef[], resources: Resource[]) {
  return refs
    .map((resourceRef) => resources.find((resource) => resource.id === resourceRef.resourceId))
    .filter((resource): resource is Resource => Boolean(resource));
}

function collectResourceRefs(refs: TextLineRef[] | undefined) {
  return refs
    ?.filter(isResourceListRef)
    .flatMap((ref) => ref.body.refs) ?? [];
}

function SelectionSummary({
  selection,
  textLine,
  style,
  translationLanguageId,
}: {
  selection: Selection;
  textLine: TextLine;
  style: ViewerStyle;
  translationLanguageId: string;
}) {
  const selectorTexts = selection.selectorIds
    .map((selectorId) => {
      const selector = textLine.selectorRecord?.[selectorId];
      const range = selector ? getSelectorRange(selector, textLine.content.text) : undefined;
      return range ? textLine.content.text.slice(range.start, range.end) : undefined;
    })
    .filter(Boolean);
  const tags = selectionTags(selection);
  const mappings = selection.selectionMappings?.filter((mapping) => shouldShowMapping(mapping, translationLanguageId)) ?? [];

  if (!selectorTexts.length && !tags.length && !mappings.length) return null;

  return (
    <div className="rounded border border-gray-200 bg-white p-3 text-sm text-gray-950 shadow-sm">
      <div className="mb-2 font-semibold text-gray-950">
        {selection.label ?? selection.selectionType}: {selectorTexts.join(" / ")}
      </div>
      {tags.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} style={style} />
          ))}
        </div>
      ) : null}
      {mappings.map((mapping) => (
        <div key={mapping.id} className="grid gap-1 rounded bg-gray-50 px-2 py-1 sm:grid-cols-[minmax(4rem,auto)_1fr]">
          <span className="text-xs font-semibold uppercase text-gray-700">{mapping.mappingType}</span>
          <span>{mappingText(mapping)}</span>
        </div>
      ))}
    </div>
  );
}

export function ScriptLine({
  textNode,
  speakers,
  resources = [],
  defaultLanguageId,
  languages,
  formId,
  translationLanguageId,
  style,
  annotationMode = "learner",
  canPlay = false,
  onPlay,
}: Props) {
  const speakerId = getSpeakerRef(textNode.textLineRefs)?.body.speakerId;
  const speaker = speakers.find((s) => s.id === speakerId);
  const speakerStyle = style.speaker.default;
  const speakerDisplayStyle = speakerId ? style.speakers?.[speakerId] : undefined;
  const speakerNameStyle: CSSProperties | undefined = speakerDisplayStyle
    ? {
        ...speakerDisplayStyle.style,
        color: speakerDisplayStyle.nameColor ?? speakerDisplayStyle.style?.color,
      }
    : undefined;
  const displayMapping = getDisplayMapping(textNode, formId);
  const displayText = displayMapping?.image ?? textNode;
  const text = displayText.content.text;
  const isLineNonDefaultLanguage = isNonDefaultLanguage(displayText.content.languageId, defaultLanguageId);
  const lineLanguageLabel = isLineNonDefaultLanguage
    ? languageLabel(displayText.content.languageId, languages)
    : undefined;
  const translations = getTranslations(textNode, translationLanguageId);
  const alignment = getAlignmentRef(textNode.textLineRefs)?.body.interval;
  const textNodeTags = lineTags(textNode);
  const tagTextStyle = mergeTagTextDisplayStyles(textNodeTags, style);
  const annotations = collectSelectorAnnotations(textNode, textNode.content.text);
  const resourceRefs = collectResourceRefs(textNode.textLineRefs);
  const nodeResources = refsToResources(resourceRefs, resources);

  return (
    <div className={speakerStyle.container}>
      <p className={style.text.line}>
        {canPlay && alignment && (
          <button
            onClick={() => onPlay?.(alignment)}
            className={`${style.layout.playButton} mr-2 align-middle`}
            aria-label="Play line"
            title="Play line"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
        {speaker && (
          <span
            className={[speakerStyle.name, speakerDisplayStyle?.className]
              .filter(Boolean)
              .join(" ")}
            style={speakerNameStyle}
          >
            {speaker.name}:{" "}
          </span>
        )}
        {lineLanguageLabel && (
          <span className={style.text.languageBadge}>{lineLanguageLabel}</span>
        )}
        <span
          className={[isLineNonDefaultLanguage ? style.text.languageSwitch : undefined, tagTextStyle.className]
            .filter(Boolean)
            .join(" ")}
          style={tagTextStyle.style}
        >
          {renderAnnotatedText({
            text,
            annotations,
            translationLanguageId,
            style,
          })}
        </span>
      </p>

      {translations.map((translation) => (
        <p key={translation.id} className={style.text.translation}>
          {translation.image.content.text}
        </p>
      ))}

      {textNodeTags.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {textNodeTags.map((tag) => (
            <TagChip key={tag} tag={tag} style={style} />
          ))}
        </div>
      ) : null}

      {textNode.textLineRefs?.map((refValue) => (
        refValue.body.type === "tag" ? null : (
          <RefView
            key={refValue.id}
            refValue={refValue}
            translationLanguageId={translationLanguageId}
            style={style}
          />
        )
      ))}

      {annotations.length || textNode.selections?.length ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-gray-800">Annotations</summary>
          <div className="mt-2 space-y-2">
            {textNode.selections?.map((selection) => (
              <SelectionSummary
                key={selection.id}
                selection={selection}
                textLine={textNode}
                style={style}
                translationLanguageId={translationLanguageId}
              />
            ))}
            {annotations.map((annotation) => (
              annotationMode === "developer" ? (
                <DeveloperAnnotationView
                  key={annotation.selectorId}
                  annotation={annotation}
                  translationLanguageId={translationLanguageId}
                />
              ) : (
                <LearnerAnnotationView
                  key={annotation.selectorId}
                  annotation={annotation}
                  style={style}
                  translationLanguageId={translationLanguageId}
                />
              )
            ))}
          </div>
        </details>
      ) : null}

      {nodeResources.map((resource) => (
        <ResourceView
          key={resource.id}
          resource={resource}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ))}
    </div>
  );
}
