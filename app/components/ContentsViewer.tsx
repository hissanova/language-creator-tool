"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Document, DisplayOption, OptionId, Section } from "../types/lcm";
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

export function ContentsViewer({ document, style = defaultStyle }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const [sectionEndTime, setSectionEndTime] = useState<number | null>(null);

  const media = document.metadata.media;

  const playSection = (section: Section) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = section.time.start;
    setSectionEndTime(section.time.end ?? null);
    audioRef.current.play();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || sectionEndTime === null) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= sectionEndTime) {
        audio.pause();
        setSectionEndTime(null);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [sectionEndTime]);

  const speakers = useMemo(() => document.metadata.speakers ?? [], [document]);

  return (
    <main className={style.layout.main}>
      <h1 className={style.layout.headerTitle}>{document.metadata.title}</h1>

      {media?.type === "audio" && (
        <audio ref={audioRef} className="mb-6 w-full" controls src={media.src} />
      )}

      {media?.type === "video" && (
        <video ref={audioRef as React.RefObject<HTMLVideoElement>} className="mb-6 w-full" controls src={media.src} />
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
              {section.lines.map((line) => (
                <ScriptLine
                  key={line.id}
                  line={line}
                  speakers={speakers}
                  textVariantId={textVariantId}
                  formTypeId={formTypeId}
                  translationLanguageId={translationLanguageId}
                  style={style}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
