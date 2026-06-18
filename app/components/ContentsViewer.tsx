"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Document,
  FigureBlock,
  FormedText,
  NoteBlock,
  OptionId,
  Section,
  SectionBlock,
  TableBlock,
  TimeSpan,
} from "../types/lcm";
import type { ViewerStyle } from "../types/viewerStyle";
import { ScriptLine } from "./ScriptLine";
import { viewerStyle as defaultStyle } from "../styles/viewerStyle";

type Props = {
  document: Document;
  style?: ViewerStyle;
};

type ViewerShellProps = Props & {
  annotationMode: "learner" | "developer";
  showMetadata?: boolean;
};

type SelectOption = {
  id: string;
  label?: string;
};

const noneOption: SelectOption = { id: "none", label: "Off" };

function withNone(options: SelectOption[] | undefined): SelectOption[] {
  if (!options || options.length === 0) return [noneOption];
  return options.some((option) => option.id === "none")
    ? options
    : [noneOption, ...options];
}

function formatTime(value: number | undefined) {
  if (value == null) return "";
  return `${value}s`;
}

function normalizeMediaSrc(src: string) {
  if (src.startsWith("@/public/sample-media/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON")) {
    return "/media/audio/hyq_2026-04-16_xindeyanjing.mp3";
  }

  if (src.startsWith("@/public/")) {
    return `/${src.slice("@/public/".length)}`;
  }

  return src;
}

function firstCaption(caption: Record<string, FormedText> | undefined) {
  return Object.values(caption ?? {})[0]?.text;
}

function NoteBlockView({ note }: { note: NoteBlock }) {
  return (
    <aside className="rounded border-l-4 border-gray-300 bg-gray-50 p-3 text-sm">
      {note.title && <div className="font-semibold text-gray-800">{note.title}</div>}
      <p className="text-gray-700">{note.text}</p>
    </aside>
  );
}

function FigureBlockView({ figure }: { figure: FigureBlock }) {
  const caption = firstCaption(figure.caption);

  return (
    <figure className="rounded border bg-white p-3">
      {figure.src && (
        <img src={figure.src} alt={figure.alt ?? ""} className="max-h-80 max-w-full rounded object-contain" />
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
              <th key={column} className="border-b bg-gray-50 p-2 text-left font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-t p-2 align-top">
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  annotationMode,
  showMetadata = false,
}: ViewerShellProps) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  const formOptions = withNone(document.metadata.forms);
  const translationLanguageOptions = withNone(document.metadata.languages);

  const [formId, setFormId] = useState<OptionId>(
    document.metadata.defaultFormId ?? "none"
  );

  const [translationLanguageId, setTranslationLanguageId] = useState<OptionId>(
    "none"
  );

  const [playbackEndTime, setPlaybackEndTime] = useState<number | null>(null);

  const media = document.resources?.find((resource) => resource.type === "media");
  const mediaSrc = media ? normalizeMediaSrc(media.src) : undefined;

  const playSpan = (span: TimeSpan) => {
    if (!mediaRef.current) return;

    mediaRef.current.currentTime = span.start;
    setPlaybackEndTime(span.end ?? null);
    mediaRef.current.play();
  };

  const playSection = (section: Section) => {
    if (!section.time) return;
    playSpan(section.time);
  };

  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement || playbackEndTime === null) return;

    const handleTimeUpdate = () => {
      if (mediaElement.currentTime >= playbackEndTime) {
        mediaElement.pause();
        setPlaybackEndTime(null);
      }
    };

    mediaElement.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      mediaElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [playbackEndTime]);

  const speakers = useMemo(() => document.metadata.speakers ?? [], [document]);

  const renderBlock = (block: SectionBlock) => {
    switch (block.type) {
      case "text":
        return (
          <ScriptLine
            key={block.text.id}
            textNode={block.text}
            speakers={speakers}
            resources={document.resources}
            formId={formId}
            translationLanguageId={translationLanguageId}
            style={style}
            annotationMode={annotationMode}
            canPlay={Boolean(media)}
            onPlay={playSpan}
          />
        );
      case "note":
        return <NoteBlockView key={block.note.id} note={block.note} />;
      case "figure":
        return <FigureBlockView key={block.figure.id} figure={block.figure} />;
      case "table":
        return <TableBlockView key={block.table.id} table={block.table} />;
    }
  };

  return (
    <main className={style.layout.main}>
      <h1 className={style.layout.headerTitle}>{document.metadata.title}</h1>

      {showMetadata && <MetadataDetails document={document} />}

      {media?.mediaType === "audio" && (
        <audio
          ref={(element) => {
            mediaRef.current = element;
          }}
          className="mb-6 w-full"
          controls
          src={mediaSrc}
        />
      )}

      {media?.mediaType === "video" && (
        <video
          ref={(element) => {
            mediaRef.current = element;
          }}
          className="mb-6 w-full"
          controls
          src={mediaSrc}
        />
      )}

      <div className={style.layout.controls}>
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Form</span>
          <select
            className="rounded border bg-white px-2 py-1 text-gray-950"
            value={formId}
            onChange={(event) => setFormId(event.target.value)}
          >
            {formOptions.map((form) => (
              <option key={form.id} value={form.id} className="bg-white text-gray-950">
                {form.label ?? form.id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Translation / Meaning</span>
          <select
            className="rounded border bg-white px-2 py-1 text-gray-950"
            value={translationLanguageId}
            onChange={(event) => setTranslationLanguageId(event.target.value)}
          >
            {translationLanguageOptions.map((language) => (
              <option key={language.id} value={language.id} className="bg-white text-gray-950">
                {language.label ?? language.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-8">
        {document.sections.map((section) => (
          <section key={section.id} className={style.layout.section}>
            <div className={style.layout.sectionHeader}>
              <div className="flex items-center gap-3">
                {media && section.time && (
                  <button
                    onClick={() => playSection(section)}
                    className={style.layout.playButton}
                    aria-label="Play section"
                    title="Play section"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
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
              {section.blocks.map((block) => renderBlock(block))}
            </div>

            {section.sections?.map((child) => (
              <div key={child.id} className="mt-6">
                <section className={style.layout.section}>
                  <h3 className={style.layout.sectionTitle}>{child.title}</h3>
                  <div className={style.layout.lines}>
                    {child.blocks.map((block) => renderBlock(block))}
                  </div>
                </section>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}

export function ConversationViewer(props: Props) {
  return <ViewerShell {...props} annotationMode="learner" />;
}

export const ContentsViewer = ConversationViewer;
