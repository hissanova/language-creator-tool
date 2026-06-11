export type Id = string;
export type LanguageId = string;
export type OptionId = string;
export type FormTypeId = string;
export type DictionaryRef = string;

export type TimeSpan = {
  start: number;
  end: number;
};

export type DisplayOption = {
  id: string;
  label: string;
};

export type Speaker = {
  id: Id;
  name: string;
  color?: string;
};

export type Media = {
  src: string;
  type: "audio" | "video";
};

export type DictionarySource = {
  id: Id;
  type: "json" | "extension" | "api" | "online";
  path?: string;
  url?: string;
  name?: string;
};

export type Metadata = {
  title: string;
  documentType?: string;
  targetLanguage: LanguageId;

  textVariants?: DisplayOption[];
  translationLanguages?: DisplayOption[];
  formTypes?: DisplayOption[];

  defaultTextVariantId?: OptionId;
  defaultFormTypeId?: FormTypeId | "none";
  defaultTranslationLanguageId?: LanguageId | "none";

  speakers?: Speaker[];
  dictionarySources?: DictionarySource[];
  media?: Media | null;

  specVersion: string;
};

export type Document = {
  metadata: Metadata;
  body: Section[];
};

export type Section = {
  id: Id;
  title: string;
  level: number;
  time: {
    start: number;
    end?: number;
  };
  sections?: Section[];
  lines: Line[];
  targets?: Target[];
};

export type Line = {
  id: Id;
  speakerId?: Id;
  time?: TimeSpan;
  text: FormedText;
  targets?: Target[];
};

export type FormedText = {
  text: string;
  decomposition?: Decomposition;
};

export type Decomposition = {
  units: FormedTextUnit[];
};

export type FormedTextUnit = {
  id: Id;
  text: FormedText;
  time?: TimeSpan;
  targets?: Target[];
};

export type Target = SectionTarget | LineTarget | TextSpanTarget;

export type BaseTarget = {
  id: Id;
  time?: TimeSpan;
  annotations?: Annotation[];
  resources?: Resource[];
};

export type SectionTarget = BaseTarget & {
  kind: "section";
  sectionId: Id;
};

export type LineTarget = BaseTarget & {
  kind: "line";
  lineId: Id;
};

export type TextSpanTarget = BaseTarget & {
  kind: "textSpan";
  text: string;
  occurrence?: number;
  range?: {
    start: number;
    end: number;
  };
};

export type Annotation =
  | DictionaryAnnotation
  | TranslationAnnotation
  | FormAnnotation
  | NoteAnnotation
  | CorrectionAnnotation
  | TagAnnotation
  | LanguageAnnotation
  | SoundAnnotation;

export type DictionaryAnnotation = {
  type: "dictionary";
  ref?: DictionaryRef;
  headword?: string;
  lemma?: string;
  pos?: string;
  meanings?: Record<LanguageId, string>;
  notes?: string[];
  tags?: string[];
};

export type TranslationAnnotation = {
  type: "translation";
  language: LanguageId;
  text: string;
};

export type FormAnnotation = {
  type: "form";
  formType: FormTypeId;
  value: FormedText;
};

export type NoteAnnotation = {
  type: "note";
  text: string;
};

export type CorrectionAnnotation = {
  type: "correction";
  value: FormedText;
  note?: string;
};

export type TagAnnotation = {
  type: "tag";
  tags: string[];
};

export type LanguageAnnotation = {
  type: "language";
  language: LanguageId;
};

export type SoundAnnotation = {
  type: "sound";
  label: string;
  description?: string;
};

export type Resource = ImageResource | AudioResource | VideoResource | UrlResource;

export type BaseResource = {
  id: Id;
  caption?: Record<LanguageId, string>;
};

export type ImageResource = BaseResource & {
  type: "image";
  src: string;
  alt?: string;
};

export type AudioResource = BaseResource & {
  type: "audio";
  src: string;
};

export type VideoResource = BaseResource & {
  type: "video";
  src: string;
};

export type UrlResource = BaseResource & {
  type: "url";
  href: string;
  label?: string;
};
