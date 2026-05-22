export type ScriptLine = {
  speaker: string;
  text: string;
  translation?: string;
};

export type Lesson = {
  title: string;
  audio: string;
  lines: ScriptLine[];
  dictionary: Record<string, string>;
};