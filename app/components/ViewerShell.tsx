"use client";

import { useMemo, type ReactNode } from "react";
import type {
  Document,
  FigureBlock,
  NoteBlock,
  Section,
  SectionBlock,
  TableBlock,
} from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import type { MappingPresentationRule } from "../types/viewer/mappingPresentation";
import { defaultMappingPresentationRules } from "../config/mappingPresentationPresets";
import type { ScriptLineComponent } from "./script-line/types";
import { viewerStyle as defaultStyle } from "../styles/viewerStyle";
import { findImageResource, firstCaption } from "./blockContentQueries";
import { PlaybackBar } from "./playback/PlaybackBar";
import { releasePlaybackButtonFocusOnPointerUp } from "./playback/playbackButtonFocus";
import { usePlaybackController } from "./playback/usePlaybackController";
import { usePlaybackKeyboardShortcuts } from "./playback/playbackKeyboardShortcuts";
import { resolveCurrentPlaybackLineId } from "./playback/playbackDisplay";
import { PlayIcon } from "./playback/PlaybackIcons";
import { normalizeMediaSrc } from "./media/normalizeMediaSrc";
import type { LinePlaybackRange } from "./playback/playbackState";
import { AutoFollowControls } from "./auto-follow/AutoFollowControls";
import { useActiveLineAutoFollow } from "./auto-follow/useActiveLineAutoFollow";
import {
  buildLinePlaybackRangeIndex,
  classifyViewerMediaResources,
  collectDocumentTextLines,
  deriveViewerDocumentOptions,
  resolveSectionPlaybackRange,
  resolveViewerLinePlaybackPresentation,
  resolveViewerSpeakers,
} from "./viewerDocumentModel";
import { ViewerOptionControls } from "./viewer-options/ViewerOptionControls";
import { useViewerOptionSelections } from "./viewer-options/useViewerOptionSelections";

type Props = {
  document: Document;
  style?: ViewerStyle;
  mappingPresentationRules?: readonly MappingPresentationRule[];
};

type ViewerShellProps = Props & {
  LineComponent: ScriptLineComponent;
  showMetadata?: boolean;
  showViewerControls?: boolean;
};

function formatTime(value: number | undefined) {
  if (value == null) return "";
  return `${value}s`;
}

function NoteBlockView({ note }: { note: NoteBlock }) {
  return (
    <aside className="rounded border-l-4 border-gray-300 bg-gray-50 p-3 text-sm">
      {note.title && <div className="font-semibold text-gray-800">{note.title}</div>}
      {note.body.map((body, index) => (
        <p key={`${note.id}-${index}`} className="text-gray-700">
          {body.text}
        </p>
      ))}
    </aside>
  );
}

function FigureBlockView({
  figure,
  resources,
}: {
  figure: FigureBlock;
  resources: Document["resources"];
}) {
  const resource = findImageResource(resources, figure.resourceRef.resourceId);
  const caption = firstCaption(figure.caption);

  return (
    <figure className="rounded border bg-white p-3">
      {resource && (
        <img src={normalizeMediaSrc(resource.src)} alt={resource.alt ?? ""} className="max-h-80 max-w-full rounded object-contain" />
      )}
      {caption && <figcaption className="mt-2 text-sm text-gray-600">{caption}</figcaption>}
    </figure>
  );
}

function TableBlockView({ table }: { table: TableBlock }) {
  const caption = firstCaption(table.caption);

  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="p-2 text-left text-gray-600">{caption}</caption>}
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column.id} className="border-b bg-gray-50 p-2 text-left font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.id}>
              {table.columns.map((column) => (
                <td key={column.id} className="border-t p-2 align-top">
                  {row.cells[column.id]?.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Everything renderSectionBlock/renderDocumentSection need to turn a block
 * or section into JSX, gathered in one place so those functions can be
 * plain top-level mappers instead of closures over ViewerShell's body.
 */
type SectionRenderContext = {
  document: Document;
  style: ViewerStyle;
  mappingPresentationRules: readonly MappingPresentationRule[];
  LineComponent: ScriptLineComponent;
  formId: string;
  selectedReadingFormId: string | null;
  translationLanguageId: string;
  speakers: ReturnType<typeof resolveViewerSpeakers>;
  audioResources: ReturnType<typeof classifyViewerMediaResources>["audioResources"];
  playbackRanges: ReturnType<typeof buildLinePlaybackRangeIndex>;
  selectedLineRange: LinePlaybackRange | null;
  currentPlaybackLineId: string | null;
  playLine: (range: LinePlaybackRange) => void;
  toggleLineLock: (range: LinePlaybackRange) => void;
  registerLineElement: (lineId: string) => (element: HTMLDivElement | null) => void;
};

function renderSectionBlock(block: SectionBlock, context: SectionRenderContext): ReactNode {
  const { document, style, LineComponent } = context;

  switch (block.type) {
    case "text": {
      const linePlaybackPresentation = resolveViewerLinePlaybackPresentation(
        block.text, context.playbackRanges, context.selectedLineRange, context.currentPlaybackLineId,
      );
      return (
        <div key={block.text.id} ref={context.registerLineElement(block.text.id)}>
          <LineComponent
            textNode={block.text}
            speakers={context.speakers}
            resources={document.resources}
            defaultLanguageId={document.metadata.defaultLanguageId}
            languages={document.metadata.languages}
            formId={context.formId}
            selectedReadingFormId={context.selectedReadingFormId}
            translationLanguageId={context.translationLanguageId}
            style={style}
            mappingPresentationRules={context.mappingPresentationRules}
            playbackRange={linePlaybackPresentation.playbackRange}
            hasPlaybackTiming={linePlaybackPresentation.hasPlaybackTiming}
            isRangeLocked={linePlaybackPresentation.isRangeLocked}
            isCurrentPlaybackLine={linePlaybackPresentation.isCurrentPlaybackLine}
            onPlayLine={context.playLine}
            onToggleLineLock={context.toggleLineLock}
          />
        </div>
      );
    }
    case "note":
      return <NoteBlockView key={block.note.id} note={block.note} />;
    case "figure":
      return <FigureBlockView key={block.figure.id} figure={block.figure} resources={document.resources} />;
    case "table":
      return <TableBlockView key={block.table.id} table={block.table} />;
    case "section":
      return renderDocumentSection(block.section, context);
  }
}

function renderDocumentSection(section: Section, context: SectionRenderContext): ReactNode {
  const { style } = context;
  const sectionPlaybackRange = resolveSectionPlaybackRange(section, context.audioResources, normalizeMediaSrc);

  return (
    <section key={section.id} className={style.layout.section}>
      <div className={style.layout.sectionHeader}>
        <div className="flex items-center gap-3">
          {sectionPlaybackRange && (
            <button
              type="button"
              onClick={() => context.playLine(sectionPlaybackRange)}
              onPointerUp={releasePlaybackButtonFocusOnPointerUp}
              className={style.layout.playButton}
              aria-label="Play section"
              title="Play section"
            >
              <PlayIcon />
            </button>
          )}

          <div>
            <h2 className={style.layout.sectionTitle}>{section.title}</h2>
            {section.time && (
              <p className={style.layout.sectionTime}>
                {formatTime(section.time.start)}
                {section.time.end != null ? ` - ${formatTime(section.time.end)}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={style.layout.lines}>
        {section.blocks.map((block) => renderSectionBlock(block, context))}
      </div>
    </section>
  );
}

function MetadataDetails({ document }: { document: Document }) {
  return (
    <details className="mb-6 rounded border bg-white p-4 text-sm text-gray-950">
      <summary className="cursor-pointer font-semibold text-gray-950">Metadata</summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-[10rem_1fr]">
        <dt className="font-medium text-gray-700">Spec version</dt>
        <dd>{document.metadata.specVersion}</dd>

        <dt className="font-medium text-gray-700">Document type</dt>
        <dd>{document.metadata.documentType ?? "document"}</dd>

        <dt className="font-medium text-gray-700">Default language</dt>
        <dd>{document.metadata.defaultLanguageId ?? "none"}</dd>

        <dt className="font-medium text-gray-700">Default form</dt>
        <dd>{document.metadata.defaultFormId ?? "none"}</dd>

        <dt className="font-medium text-gray-700">Languages</dt>
        <dd>
          {(document.metadata.languages ?? [])
            .map((language) => language.label ? `${language.label} (${language.id})` : language.id)
            .join(", ") || "none"}
        </dd>

        <dt className="font-medium text-gray-700">Forms</dt>
        <dd>
          {(document.metadata.forms ?? [])
            .map((form) => form.label ? `${form.label} (${form.id})` : form.id)
            .join(", ") || "none"}
        </dd>

        <dt className="font-medium text-gray-700">Speakers</dt>
        <dd>
          {(document.metadata.speakers ?? [])
            .map((speaker) => `${speaker.name} (${speaker.id})`)
            .join(", ") || "none"}
        </dd>

        <dt className="font-medium text-gray-700">Resources</dt>
        <dd>{document.resources?.length ?? 0}</dd>

        <dt className="font-medium text-gray-700">Sections</dt>
        <dd>{document.sections.length}</dd>
      </dl>
    </details>
  );
}

export function ViewerShell({
  document,
  style = defaultStyle,
  mappingPresentationRules = defaultMappingPresentationRules,
  LineComponent,
  showMetadata = false,
  showViewerControls = false,
}: ViewerShellProps) {
  const viewerModel = useMemo(() => {
    const nextTextLines = collectDocumentTextLines(document.sections);
    return {
      ...deriveViewerDocumentOptions(document, nextTextLines),
      ...classifyViewerMediaResources(document),
      speakers: resolveViewerSpeakers(document),
      textLines: nextTextLines,
    };
  }, [document]);
  const {
    formOptions,
    readingOptions,
    translationLanguageOptions,
    audioResources,
    fallbackVideo,
    speakers,
    textLines,
  } = viewerModel;
  const {
    selections,
    selectForm,
    selectReading,
    selectTranslationLanguage,
  } = useViewerOptionSelections(document, viewerModel);
  const playback = usePlaybackController(audioResources, normalizeMediaSrc);
  usePlaybackKeyboardShortcuts(playback, audioResources.length > 0);

  const playbackRanges = useMemo(() => buildLinePlaybackRangeIndex(
    textLines,
    document.resources ?? [],
    normalizeMediaSrc,
    { mediaSource: playback.state.mediaSource, duration: playback.state.duration },
  ), [textLines, document.resources, playback.state.duration, playback.state.mediaSource]);

  const currentPlaybackLineId = resolveCurrentPlaybackLineId(
    playback.state,
    [...playbackRanges.values()],
  );
  const {
    enabled: autoFollowEnabled,
    setEnabled: setAutoFollowEnabled,
    mode: autoFollowMode,
    setMode: setAutoFollowMode,
    suspended: autoFollowSuspended,
    resumeFollow,
    handleSeekIntent,
    registerStickyControls,
    registerLineElement,
  } = useActiveLineAutoFollow({
    documentToken: document,
    sourceToken: playback.state.mediaSource,
    currentLineId: currentPlaybackLineId,
    playbackPosition: playback.state.currentTime,
    playing: playback.state.playing,
  });

  const renderContext: SectionRenderContext = {
    document,
    style,
    mappingPresentationRules,
    LineComponent,
    formId: selections.formId,
    selectedReadingFormId: selections.readingFormId,
    translationLanguageId: selections.translationLanguageId,
    speakers,
    audioResources,
    playbackRanges,
    selectedLineRange: playback.state.selectedLineRange,
    currentPlaybackLineId,
    playLine: playback.actions.playLine,
    toggleLineLock: playback.actions.toggleLineLock,
    registerLineElement,
  };

  return (
    <main className={style.layout.main}>
      <h1 className={style.layout.headerTitle}>{document.metadata.title}</h1>

      {showMetadata && <MetadataDetails document={document} />}

      {audioResources.length > 0 && (
        <div ref={registerStickyControls} className={style.layout.mediaBar}>
          <PlaybackBar
            controller={playback}
            onSeekIntent={handleSeekIntent}
          />
          <AutoFollowControls
            enabled={autoFollowEnabled}
            mode={autoFollowMode}
            suspended={autoFollowSuspended}
            onEnabledChange={setAutoFollowEnabled}
            onModeChange={setAutoFollowMode}
            onResume={resumeFollow}
          />
        </div>
      )}

      {audioResources.length === 0 && fallbackVideo?.type === "media" && (
        <div className={style.layout.mediaBar}>
          <video
            className="max-h-64 w-full"
            controls
            src={normalizeMediaSrc(fallbackVideo.src)}
          />
        </div>
      )}

      {showViewerControls && (
        <ViewerOptionControls
          className={style.layout.controls}
          formOptions={formOptions}
          readingOptions={readingOptions}
          translationLanguageOptions={translationLanguageOptions}
          formId={selections.formId}
          readingFormId={selections.readingFormId}
          translationLanguageId={selections.translationLanguageId}
          onFormChange={selectForm}
          onReadingChange={selectReading}
          onTranslationLanguageChange={selectTranslationLanguage}
        />
      )}

      <div className="space-y-8">
        {document.sections.map((section) => renderDocumentSection(section, renderContext))}
      </div>
    </main>
  );
}
