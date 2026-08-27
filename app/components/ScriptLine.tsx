import type { CSSProperties, ReactNode } from "react";
import type {
  Language,
  Resource,
  Speaker,
} from "../types/core/document";
import type { TimeSpan } from "../types/core/common";
import type {
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
  refText,
  refsToResources,
  type LineRef,
  type SelectorAnnotation,
} from "./script-line/coreQueries";
import { AnnotationPanel } from "./script-line/AnnotationPanel";
import { DeveloperAnnotationPanel } from "./script-line/DeveloperAnnotationPanel";
import { learnerAnnotationPanelConfig } from "./script-line/annotationPanelPresets";

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
  const hasLearnerLineRefs = textNode.textLineRefs?.some(
    (refValue) =>
      refValue.body.type === "tag" ||
      refValue.body.type === "note" ||
      refValue.body.type === "dictionary"
  );
  const hasLearnerSelections = textNode.selections?.some(
    (selection) =>
      selection.selectionType === "decomposition" || selection.selectionType === "parallel"
  );
  const hasLearnerSelectedTextMappings = textNode.selectedTextMappings?.some((bundle) =>
    bundle.mappings.some(
      (mapping) => mapping.mappingType === "gloss" || mapping.mappingType === "translation"
    )
  );
  const hasLearnerSelectedTextRefs = textNode.selectedTextRefs?.some((bundle) =>
    bundle.attachments.some(
      (attachment) =>
        attachment.ref.body.type === "tag" ||
        attachment.ref.body.type === "note" ||
        attachment.ref.body.type === "dictionary"
    )
  );

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

      {!isDeveloperMode && textNode.textLineRefs?.map((refValue) => (
        refValue.body.type === "tag" || refValue.body.type === "note" ? null : (
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
          textNodeTags={textNodeTags}
          nodeResources={nodeResources}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ) : hasLearnerLineRefs ||
        hasLearnerSelectedTextMappings ||
        hasLearnerSelectedTextRefs ||
        hasLearnerSelections ? (
        <details
          className="mt-3 text-sm"
          open={learnerAnnotationPanelConfig.defaultOpen}
        >
          <summary className="cursor-pointer text-gray-800">
            {learnerAnnotationPanelConfig.summaryLabel}
          </summary>
          <div className="mt-2">
            <AnnotationPanel
              textLine={textNode}
              resources={resources}
              annotations={annotations}
              translationLanguageId={translationLanguageId}
              config={learnerAnnotationPanelConfig}
            />
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
