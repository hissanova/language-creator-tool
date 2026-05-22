import type { ScriptLine as ScriptLineType } from "../types";
import { HoverWord } from "./HoverWord";

type Props = {
  line: ScriptLineType;
  dictionary: Record<string, string>;
};

export function ScriptLine({ line, dictionary }: Props) {
  const words = Object.keys(dictionary).sort((a, b) => b.length - a.length);

  const parts: { text: string; meaning?: string }[] = [];

  let i = 0;

  while (i < line.text.length) {
    const matchedWord = words.find((word) => line.text.startsWith(word, i));

    if (matchedWord) {
      parts.push({
        text: matchedWord,
        meaning: dictionary[matchedWord],
      });
      i += matchedWord.length;
    } else {
      parts.push({ text: line.text[i] });
      i += 1;
    }
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="text-lg leading-8">
        <span className="mr-2 font-bold">{line.speaker}:</span>
        {parts.map((part, index) =>
          part.meaning ? (
            <HoverWord key={index} text={part.text} meaning={part.meaning} />
          ) : (
            <span key={index}>{part.text}</span>
          )
        )}
      </p>

      {line.translation && (
        <p className="mt-2 text-sm text-gray-600">{line.translation}</p>
      )}
    </div>
  );
}