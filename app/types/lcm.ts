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
  references?: Reference[];
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
  blocks: SectionBlock[];
  targets?: Target[];

  /** @deprecated Use blocks with LineBlock instead. Kept only for migration. */
  lines?: Line[];
};

export type SectionBlock = LineBlock | NoteBlock | FigureBlock | TableBlock;

export type LineBlock = {
  type: "line";
  line: Line;
};

export type NoteBlock = {
  type: "note";
  note: Note;
};

export type FigureBlock = {
  type: "figure";
  figure: Figure;
};

export type TableBlock = {
  type: "table";
  table: Table;
};

export type Line = {
  id: Id;
  speakerId?: Id;
  time?: TimeSpan;
  text: FormedText;
  targets?: Target[];
};

/**
 * A language expression with an optional form type.
 *
 * `surface` is the default form and should be used for the ordinary displayed
 * expression. Additional forms can be represented by setting `formType`.
 */
export type FormedText = {
  formType: FormTypeId;
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

export type TargetSelector = TextSelector | IndexSelector;

export type TextSelector = {
  type: "text";
  text: string;
  occurrence?: number;
};

export type IndexSelector = {
  type: "index";
  start: number;
  end: number;
};

export type Target = SectionTarget | LineTarget | TextSpanTarget | UnitTarget;

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
  selector: TargetSelector;
};

export type UnitTarget = BaseTarget & {
  kind: "unit";
  unitId: Id;
};

export type Provenance = {
  source: "manual" | "auto" | "imported";
  agent?: string;
  confidence?: number;
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

export type BaseAnnotation = {
  provenance?: Provenance;
};

export type DictionaryAnnotation = BaseAnnotation & {
  type: "dictionary";
  ref?: DictionaryRef;
  headword?: FormedText;
  lemma?: FormedText;
  pos?: string;
  meanings?: Record<LanguageId, FormedText[]>;
  notes?: string[];
  tags?: string[];
};

export type TranslationAnnotation = BaseAnnotation & {
  type: "translation";
  language: LanguageId;
  value: FormedText;
};

export type FormAnnotation = BaseAnnotation & {
  type: "form";
  formType: FormTypeId;
  value: FormedText;
};

export type NoteAnnotation = BaseAnnotation & {
  type: "note";
  text: string;
};

export type CorrectionAnnotation = BaseAnnotation & {
  type: "correction";
  value: FormedText;
  note?: string;
};

export type TagAnnotation = BaseAnnotation & {
  type: "tag";
  tags: string[];
};

export type LanguageAnnotation = BaseAnnotation & {
  type: "language";
  language: LanguageId;
};

export type SoundAnnotation = BaseAnnotation & {
  type: "sound";
  label: string;
  description?: string;
};

export type Note = {
  id: Id;
  title?: string;
  text: string;
};

export type Figure = {
  id: Id;
  src: string;
  alt?: string;
  caption?: Record<LanguageId, FormedText>;
};

export type Table = {
  id: Id;
  caption?: Record<LanguageId, FormedText>;
  columns: string[];
  rows: FormedText[][];
};

export type Reference = {
  id: Id;
  label?: string;
  citation: string;
  url?: string;
};

export type Resource = ImageResource | AudioResource | VideoResource | UrlResource;

export type BaseResource = {
  id: Id;
  caption?: Record<LanguageId, FormedText>;
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
