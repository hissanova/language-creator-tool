"use client";

import { useId, useState, type CSSProperties } from "react";
import type { Resource } from "../../types/core/document";
import type { TagTextDisplayStyle, ViewerStyle } from "../../types/viewerStyle";
import { learnerAnnotationPanelConfig } from "../../config/annotationPanelPresets";
import { AnnotatedText } from "../AnnotatedText";
import { ScriptLine } from "../ScriptLine";
import { AnnotationPanel } from "./AnnotationPanel";
import { buildScriptLineModel } from "./buildScriptLineModel";
import {
  annotationTags,
  annotationTitle,
  refText,
  type LineRef,
  type SelectorAnnotation,
} from "./coreQueries";
import { resolveAnnotatedTextSegments } from "./resolveAnnotatedTextSegments";
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

function annotationPresentation({
  annotation,
  translationLanguageId,
  style,
}: {
  annotation: SelectorAnnotation;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  const title = annotationTitle(annotation, translationLanguageId);
  const tagTextStyle = mergeTagTextDisplayStyles(annotationTags(annotation), style);
  const annotationClassName = title
    ? style.text.annotated
    : style.text.annotationWithoutPopup;

  return {
    title,
    className: [annotationClassName, tagTextStyle.className].filter(Boolean).join(" "),
    style: tagTextStyle.style,
  };
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

function ConversationAnnotationDisclosure({
  textNode,
  resources,
  annotations,
  translationLanguageId,
}: {
  textNode: ScriptLineCompositionProps["textNode"];
  resources: Resource[];
  annotations: SelectorAnnotation[];
  translationLanguageId: string;
}) {
  const dropdown = learnerAnnotationPanelConfig.dropdown;
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(
    dropdown.defaultOpen ?? false
  );
  const panelId = useId();
  const dropdownTitle = dropdown.title ?? "Annotations";

  return (
    <div className="min-w-0">
      <button
        type="button"
        className="absolute right-1 top-0 z-10 -translate-y-full rounded p-1 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={dropdownTitle}
        aria-expanded={isPanelOpen}
        aria-controls={panelId}
        onClick={() => setIsPanelOpen((open) => !open)}
      >
        {(dropdown.showTitle ?? true) && <span className="mr-1">{dropdownTitle}</span>}
        <span aria-hidden>{isPanelOpen ? "▴" : "▾"}</span>
      </button>

      {isPanelOpen ? (
        <div id={panelId} className="pt-2 text-sm">
          <AnnotationPanel
            textLine={textNode}
            resources={resources}
            annotations={annotations}
            translationLanguageId={translationLanguageId}
            config={learnerAnnotationPanelConfig}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ConversationScriptLine(props: ScriptLineCompositionProps) {
  const {
    textNode,
    resources = [],
    translationLanguageId,
    style,
    playbackRange,
    hasPlaybackTiming,
    isLoopSelected,
    isLinePlaying,
    loopEnabled,
    onPause,
    onPlayLine,
    onToggleLineLoop,
  } = props;
  const model = buildScriptLineModel(props);
  const annotatedTextSegments = resolveAnnotatedTextSegments(
    model.displayTextValue,
    model.annotations,
  );
  const tagTextStyle = mergeTagTextDisplayStyles(model.textNodeTags, style);
  const hasAnnotations = hasConversationAnnotations(textNode);
  const dropdown = learnerAnnotationPanelConfig.dropdown;
  const standaloneRefs = textNode.textLineRefs?.filter(
    (refValue) =>
      refValue.body.type !== "tag" &&
      refValue.body.type !== "note" &&
      Boolean(refText(refValue, translationLanguageId))
  );
  const hasBottomSlot = Boolean(
    standaloneRefs?.length ||
      (hasAnnotations && dropdown.enabled) ||
      model.nodeResources.length
  );

  const bottomSlot = hasBottomSlot ? (
    <>
      {standaloneRefs?.map((refValue) => (
        <RefView
          key={refValue.id}
          refValue={refValue}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ))}

      {hasAnnotations && dropdown.enabled ? (
        <ConversationAnnotationDisclosure
          textNode={textNode}
          resources={resources}
          annotations={model.annotations}
          translationLanguageId={translationLanguageId}
        />
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
  ) : undefined;

  return (
    <ScriptLine
      speaker={model.speaker}
      speakerId={model.speakerId}
      playbackRange={playbackRange}
      hasPlaybackTiming={hasPlaybackTiming}
      isLoopSelected={isLoopSelected}
      isLinePlaying={isLinePlaying}
      loopEnabled={loopEnabled}
      onPause={onPause}
      onPlayLine={onPlayLine}
      onToggleLineLoop={onToggleLineLoop}
      style={style}
      layoutVariant="grid"
      languageLabel={model.lineLanguageLabel}
      textContent={
        <AnnotatedText
          segments={annotatedTextSegments}
          getAnnotationPresentation={(annotation) =>
            annotationPresentation({ annotation, translationLanguageId, style })
          }
        />
      }
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
      rowClassName={hasAnnotations && dropdown.enabled ? "pr-7" : undefined}
      bottomSlot={bottomSlot}
    />
  );
}
