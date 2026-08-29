"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import type { Resource } from "../../types/core/document";
import type { TagTextDisplayStyle, ViewerStyle } from "../../types/viewerStyle";
import { learnerAnnotationPanelConfig } from "../../config/annotationPanelPresets";
import { HoverWord } from "../HoverWord";
import { ScriptLine } from "../ScriptLine";
import { AnnotationPanel } from "./AnnotationPanel";
import { buildScriptLineModel } from "./buildScriptLineModel";
import {
  annotationTags,
  annotationTitle,
  getSelectorRange,
  refText,
  type LineRef,
  type SelectorAnnotation,
} from "./coreQueries";
import type { ScriptLineCompositionProps } from "./types";

function mergeTagTextDisplayStyles(tags: string[], style: ViewerStyle) {
  const configuredStyles = tags
    .map((tag) => style.tags?.[tag])
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
    .filter(
      (item): item is {
        annotation: SelectorAnnotation;
        range: { start: number; end: number };
      } => Boolean(item.range)
    )
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
    const annotationClassName = title
      ? style.text.annotated
      : style.text.annotationWithoutPopup;

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

function hasConversationAnnotations(textNode: ScriptLineCompositionProps["textNode"]) {
  const hasLineRefs = textNode.textLineRefs?.some(
    (refValue) =>
      refValue.body.type === "tag" ||
      refValue.body.type === "note" ||
      refValue.body.type === "dictionary"
  );
  const hasSelections = textNode.selections?.some(
    (selection) =>
      selection.selectionType === "decomposition" || selection.selectionType === "parallel"
  );
  const hasSelectedTextMappings = textNode.selectedTextMappings?.some((bundle) =>
    bundle.mappings.some(
      (mapping) => mapping.mappingType === "gloss" || mapping.mappingType === "translation"
    )
  );
  const hasSelectedTextRefs = textNode.selectedTextRefs?.some((bundle) =>
    bundle.attachments.some(
      (attachment) =>
        attachment.ref.body.type === "tag" ||
        attachment.ref.body.type === "note" ||
        attachment.ref.body.type === "dictionary"
    )
  );

  return Boolean(
    hasLineRefs || hasSelections || hasSelectedTextMappings || hasSelectedTextRefs
  );
}

export function ConversationScriptLine(props: ScriptLineCompositionProps) {
  const { textNode, resources = [], translationLanguageId, style, canPlay, onPlay } = props;
  const model = buildScriptLineModel(props);
  const tagTextStyle = mergeTagTextDisplayStyles(model.textNodeTags, style);
  const hasAnnotations = hasConversationAnnotations(textNode);
  const dropdown = learnerAnnotationPanelConfig.dropdown;
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(dropdown.defaultOpen ?? false);
  const panelId = useId();
  const dropdownTitle = dropdown.title ?? "Annotations";

  const trailingControl = hasAnnotations && dropdown.enabled ? (
    <button
      type="button"
      className="col-start-4 self-end rounded p-1 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={dropdownTitle}
      aria-expanded={isPanelOpen}
      aria-controls={panelId}
      onClick={() => setIsPanelOpen((open) => !open)}
    >
      {(dropdown.showTitle ?? true) && <span className="mr-1">{dropdownTitle}</span>}
      <span aria-hidden>{isPanelOpen ? "▴" : "▾"}</span>
    </button>
  ) : null;

  const belowContent = (
    <>
      {textNode.textLineRefs?.map((refValue) =>
        refValue.body.type === "tag" || refValue.body.type === "note" ? null : (
          <RefView
            key={refValue.id}
            refValue={refValue}
            translationLanguageId={translationLanguageId}
            style={style}
          />
        )
      )}

      {hasAnnotations && dropdown.enabled && isPanelOpen ? (
        <div id={panelId} className="mt-2 text-sm">
          <AnnotationPanel
            textLine={textNode}
            resources={resources}
            annotations={model.annotations}
            translationLanguageId={translationLanguageId}
            config={learnerAnnotationPanelConfig}
          />
        </div>
      ) : null}

      {model.nodeResources.map((resource) => (
        <ResourceView
          key={resource.id}
          resource={resource}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ))}
    </>
  );

  return (
    <ScriptLine
      speaker={model.speaker}
      speakerId={model.speakerId}
      alignment={model.alignment}
      canPlay={canPlay}
      onPlay={onPlay}
      style={style}
      layoutVariant="grid"
      languageLabel={model.lineLanguageLabel}
      textContent={renderAnnotatedText({
        text: model.displayTextValue,
        annotations: model.annotations,
        translationLanguageId,
        style,
      })}
      textClassName={[
        model.isLineNonDefaultLanguage ? style.text.languageSwitch : undefined,
        tagTextStyle.className,
      ]
        .filter(Boolean)
        .join(" ")}
      textStyle={tagTextStyle.style}
      translations={model.translations.map((translation) => (
        <p key={translation.id} className={style.text.translation}>
          {translation.image.content.text}
        </p>
      ))}
      trailingControl={trailingControl}
      belowContent={belowContent}
    />
  );
}
