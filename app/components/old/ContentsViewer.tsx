"use client";

import { useEffect, useRef, useState } from "react";
import type { Document, OptionId } from "../types/viewer";
import { ScriptLine } from "./ScriptLine";

type Props = {
  lesson: Document;
};

export function ContentsViewer({ lesson }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [textVariantId, setTextVariantId] = useState<OptionId>(
    lesson.defaultTextVariantId
  );

  const [rubyTypeId, setRubyTypeId] = useState<OptionId>(
    lesson.defaultRubyTypeId ?? "none"
  );

  const [translationLanguageId, setTranslationLanguageId] = useState<OptionId>(
    lesson.defaultTranslationLanguageId ?? "none"
  );

  const [sectionEndTime, setSectionEndTime] = useState<number | null>(null);

  const playSection = (startTime: number, endTime: number | null) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = startTime;
    setSectionEndTime(endTime);
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

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-3xl font-bold">{lesson.title}</h1>

      <audio
        ref={audioRef}
        className="mb-6 w-full"
        controls
        src={lesson.audio}
      />

      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border p-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Script</span>
          <select
            className="rounded border px-2 py-1"
            value={textVariantId}
            onChange={(e) => setTextVariantId(e.target.value)}
          >
            {lesson.textVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Ruby</span>
          <select
            className="rounded border px-2 py-1"
            value={rubyTypeId}
            onChange={(e) => setRubyTypeId(e.target.value)}
          >
            {lesson.rubyTypes.map((rubyType) => (
              <option key={rubyType.id} value={rubyType.id}>
                {rubyType.label}
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
            {lesson.translationLanguages.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-8">
        {lesson.chapters.map((section) => (
          <section key={section.id} className="rounded-2xl border p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="text-sm text-gray-500">
                  {section.startTime}s – {section.endTime}s
                </p>
              </div>

              <button
                onClick={() => {
                    const start = section.startTime;
                    if (section.endTime == null) {
                    if (start == null) return;
                    playSection(start, null);
                    return;
                    }
                }}
                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
              >
                Play section
              </button>
            </div>

            <div className="space-y-4">
              {section.lines.map((line) => (
                <ScriptLine
                  key={line.id}
                  line={line}
                  speakers={lesson.speakers}
                  textVariantId={textVariantId}
                  rubyTypeId={rubyTypeId}
                  translationLanguageId={translationLanguageId}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}