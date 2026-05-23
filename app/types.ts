export type OptionId = string;

export type DisplayOption = {
  id: OptionId;
  label: string;
};

export type Speaker = {
  id: string;
  name: string;
  color: "blue" | "green" | "purple" | "orange";
};

export type TextAnnotation = {
  id: string;
  type: "word" | "phrase" | "note";
  start: number;
  end: number;

  ruby?: Record<OptionId, string>;
  meanings?: Record<OptionId, string>;
  note?: string;
};

export type ImageAnnotation = {
  id: string;
  type: "image";
  src: string;
  alt?: string;
  caption?: Record<OptionId, string>;
};

export type Annotation = TextAnnotation | ImageAnnotation;

export type ScriptLine = {
  id: string;
  speakerId: string;

  texts: Record<OptionId, string>;
  translations?: Record<OptionId, string>;

  annotations?: Annotation[];
};

export type Chapter = {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  lines: ScriptLine[];
};

export type Lesson = {
  title: string;
  audio: string;

  textVariants: DisplayOption[];
  rubyTypes: DisplayOption[];
  translationLanguages: DisplayOption[];

  defaultTextVariantId: OptionId;
  defaultRubyTypeId?: OptionId;
  defaultTranslationLanguageId?: OptionId;

  speakers: Speaker[];
  chapters: Chapter[];
};