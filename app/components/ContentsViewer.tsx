"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Document,
  DisplayOption,
  Figure,
  Line,
  Note,
  OptionId,
  Section,
  SectionBlock,
  Table,
} from "../types/lcm";
import type { ViewerStyle } from "../types/viewerStyle";
import { ScriptLine } from "./ScriptLine";
import { viewerStyle as defaultStyle } from "../styles/viewerStyle";

type Props = {
  document: Document;
  style?: ViewerStyle;
};

const noneOption: DisplayOption = { id: "none", label: "Off" };

function withNone(options: DisplayOption[] | undefined): DisplayOption[] {
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

function getSectionBlocks(section: Section): SectionBlock[] {
  if (section.blocks) return section.blocks;
  return section.lines?.map((line) => ({ type: "line" as const, line })) ?? [];
}

function NoteBlockView({ note }: { note: Note }) {
  return (
    <aside className="rounded border-l-4 border-gray-300 bg-gray-50 p-3 text-sm">
      {note.title && <div className="font-semibold text-gray-800">{note.title}</div>}
      <p className="text-gray-700">{note.text}</p>
    </aside>
  );
}

function FigureBlockView({ figure }: { figure: Figure }) {
  const caption = Object.values(figure.caption ?? {})[0]?.text;

  return (
    <figure className="rounded border bg-white p-3">
      {figure.src && (
        <img src={figure.src} alt={figure.alt ?? ""} className="max-h-80 max-w-full rounded object-contain" />
      )}
      {caption && <figcaption className="mt-2 text-sm text-gray-600">{caption}</figcaption>}
    </figure>
  );
}

function TableBlockView({ table }: { table: Table }) {
  const caption = Object.values(table.caption ?? {})[0]?.text;

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

export function ContentsViewer({ document, style = defaultStyle }: Props) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  const textVariantOptions = document.metadata.textVariants ?? [];
  const formTypeOptions = withNone(document.metadata.formTypes);
  const translationLanguageOptions = withNone(document.metadata.translationLanguages);

  const [textVariantId, setTextVariantId] = useState<OptionId>(
    document.metadata.defaultTextVariantId ??
      textVariantOptions[0]?.id ??
      document.metadata.targetLanguage
  );

  const [formTypeId, setFormTypeId] = useState<OptionId>(
    document.metadata.defaultFormTypeId ?? "none"
  );

  const [translationLanguageId, setTranslationLanguageId] = useState<OptionId>(
    document.metadata.defaultTranslationLanguageId ?? "none"
  );

  const [playbackEndTime, setPlaybackEndTime] = useState<number | null>(null);

  const media = document.metadata.media;
  const mediaSrc = media ? normalizeMediaSrc(media.src) : undefined;

  const playSection = (section: Section) => {
    if (!mediaRef.current) return;

    mediaRef.current.currentTime = section.time.start;
    setPlaybackEndTime(section.time.end ?? null);
    mediaRef.current.play();
  };

  const playLine = (line: Line) => {
    if (!mediaRef.current || !line.time) return;

    mediaRef.current.currentTime = line.time.start;
    setPlaybackEndTime(line.time.end ?? null);
    mediaRef.current.play();
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
      case "line":
        return (
          <ScriptLine
            key={block.line.id}
            line={block.line}
            speakers={speakers}
            textVariantId={textVariantId}
            formTypeId={formTypeId}
            translationLanguageId={translationLanguageId}
            style={style}
            canPlay={Boolean(media && block.line.time)}
            onPlay={playLine}
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

      {media?.type === "audio" && (
        <audio
          ref={(element) => {
            mediaRef.current = element;
          }}
          className="mb-6 w-full"
          controls
          src={mediaSrc}
        />
      )}

      {media?.type === "video" && (
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
        {textVariantOptions.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Script</span>
            <select
              className="rounded border px-2 py-1"
              value={textVariantId}
              onChange={(e) => setTextVariantId(e.target.value)}
            >
              {textVariantOptions.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Form</span>
          <select
            className="rounded border px-2 py-1"
            value={formTypeId}
            onChange={(e) => setFormTypeId(e.target.value)}
          >
            {formTypeOptions.map((formType) => (
              <option key={formType.id} value={formType.id}>
                {formType.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Translation / Meaning</span>
          <select
            className="rounded border px-2 py-1"
            value={translationLanguageId}
            onChange={(e) => setTranslationLanguageId(e.target.value)}
          >
            {translationLanguageOptions.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-8">
        {document.body.map((section) => (
          <section key={section.id} className={style.layout.section}>
            <div className={style.layout.sectionHeader}>
              <div className="flex items-center gap-3">
                {media && (
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
                  <p className={style.layout.sectionTime}>
                    {formatTime(section.time.start)}
                    {section.time.end != null ? ` – ${formatTime(section.time.end)}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className={style.layout.lines}>
              {getSectionBlocks(section).map((block) => renderBlock(block))}
            </div>

            {section.sections?.map((child) => (
              <div key={child.id} className="mt-6">
                <section className={style.layout.section}>
                  <h3 className={style.layout.sectionTitle}>{child.title}</h3>
                  <div className={style.layout.lines}>
                    {getSectionBlocks(child).map((block) => renderBlock(block))}
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
