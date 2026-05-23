"use client";

import { useEffect, useRef, useState } from "react";
import type { Lesson, OptionId } from "../types";
import { ScriptLine } from "./ScriptLine";

type Props = {
  lesson: Lesson;
};

export function LessonViewer({ lesson }: Props) {
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

  const [chapterEndTime, setChapterEndTime] = useState<number | null>(null);

  const playChapter = (startTime: number, endTime: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = startTime;
    setChapterEndTime(endTime);
    audioRef.current.play();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || chapterEndTime === null) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= chapterEndTime) {
        audio.pause();
        setChapterEndTime(null);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [chapterEndTime]);

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
        {lesson.chapters.map((chapter) => (
          <section key={chapter.id} className="rounded-2xl border p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{chapter.title}</h2>
                <p className="text-sm text-gray-500">
                  {chapter.startTime}s – {chapter.endTime}s
                </p>
              </div>

              <button
                onClick={() => playChapter(chapter.startTime, chapter.endTime)}
                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
              >
                Play chapter
              </button>
            </div>

            <div className="space-y-4">
              {chapter.lines.map((line) => (
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