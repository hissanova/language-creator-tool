import type { CSSProperties, ReactNode } from "react";
import type {
  Language,
  Resource,
  Speaker,
} from "../types/core/document";
import type { TimeSpan } from "../types/core/common";
import type {
  Selection,
  TextLine,
} from "../types/core/textLine";
import type { TagTextDisplayStyle, ViewerStyle } from "../types/viewerStyle";
import { HoverWord } from "./HoverWord";
import {
  annotationTags,
  annotationTitle,
  collectResourceRefs,
  collectSelectorAnnotations,
  getAlignmentRef,
  getDisplayMapping,
  getSelectorRange,
  getSpeakerRef,
  getTranslations,
  isNonDefaultLanguage,
  lineTags,
  mappingText,
  refText,
  refsToResources,
  selectionTags,
  shouldShowMapping,
  type LineRef,
  type SelectorAnnotation,
} from "./script-line/coreQueries";
import { DeveloperAnnotationPanel } from "./script-line/DeveloperAnnotationPanel";

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

function languageLabel(languageId: string, languages: Language[] | undefined) {
  return languages?.find((language) => language.id === languageId)?.label ?? languageId;
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
  const isDeveloperMode = annotationMode === "developer";

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
        {!isDeveloperMode && lineLanguageLabel && (
          <span className={style.text.languageBadge}>{lineLanguageLabel}</span>
        )}
        <span
          className={[
            !isDeveloperMode && isLineNonDefaultLanguage ? style.text.languageSwitch : undefined,
            !isDeveloperMode ? tagTextStyle.className : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
          style={isDeveloperMode ? undefined : tagTextStyle.style}
        >
          {isDeveloperMode
            ? textNode.content.text
            : renderAnnotatedText({
                text,
                annotations,
                translationLanguageId,
                style,
              })}
        </span>
      </p>

      {!isDeveloperMode && translations.map((translation) => (
        <p key={translation.id} className={style.text.translation}>
          {translation.image.content.text}
        </p>
      ))}

      {!isDeveloperMode && textNodeTags.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {textNodeTags.map((tag) => (
            <TagChip key={tag} tag={tag} style={style} />
          ))}
        </div>
      ) : null}

      {!isDeveloperMode && textNode.textLineRefs?.map((refValue) => (
        refValue.body.type === "tag" ? null : (
          <RefView
            key={refValue.id}
            refValue={refValue}
            translationLanguageId={translationLanguageId}
            style={style}
          />
        )
      ))}

      {isDeveloperMode ? (
        <DeveloperAnnotationPanel
          textLine={textNode}
          annotations={annotations}
          translations={translations}
          textNodeTags={textNodeTags}
          nodeResources={nodeResources}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ) : annotations.length || textNode.selections?.length ? (
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
              <LearnerAnnotationView
                key={annotation.selectorId}
                annotation={annotation}
                style={style}
                translationLanguageId={translationLanguageId}
              />
            ))}
          </div>
        </details>
      ) : null}

      {!isDeveloperMode && nodeResources.map((resource) => (
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
