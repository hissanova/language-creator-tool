import type { Lesson } from "../types";
import { ScriptLine } from "./ScriptLine";

type Props = {
  lesson: Lesson;
};

export function LessonViewer({ lesson }: Props) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>

      <audio className="mb-6 w-full" controls src={lesson.audio} />

      <div className="space-y-4">
        {lesson.lines.map((line, index) => (
          <ScriptLine
            key={index}
            line={line}
            dictionary={lesson.dictionary}
          />
        ))}
      </div>
    </main>
  );
}