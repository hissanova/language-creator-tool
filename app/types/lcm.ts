export type Id = string;
export type LanguageId = string;
export type OptionId = string;
export type FormId = string;
export type ResourceId = string;

export type TimeSpan = {
  start: number;
  end?: number;
};

export type DisplayOption = {
  id: string;
  label: string;
};

export type Language = {
  id: LanguageId;
  label?: string;
};

export type Form = {
  id: FormId;
  label?: string;
};

export type Speaker = {
  id: Id;
  name: string;
};

export type Metadata = {
  specVersion: string;
  title: string;
  documentType?: "conversation" | "lesson" | "text" | "corpus" | string;
  defaultLanguageId?: LanguageId;
  defaultFormId?: FormId;
  languages?: Language[];
  forms?: Form[];
  speakers?: Speaker[];
};

export type Document = {
  metadata: Metadata;
  resources?: Resource[];
  sections: Section[];
};

export type Section = {
  id: Id;
  title: string;
  level?: number;
  time?: TimeSpan;
  sections?: Section[];
  blocks: SectionBlock[];
};

export type SectionBlock =
  | { type: "text"; text: TextNode }
  | { type: "note"; note: NoteBlock }
  | { type: "figure"; figure: FigureBlock }
  | { type: "table"; table: TableBlock };

export type FormedText = {
  text: string;
  languageId: LanguageId;
  formId: FormId;
};

export type TextNode = {
  id: Id;
  content: FormedText;
  source?: TextNodeSource;
  selectors?: SelectorNode[];
  refs?: TextNodeRef[];
  transforms?: Transform[];
};

export type TextNodeSource =
  | {
      type: "selector";
      ranges: TextRange[];
    }
  | {
      type: "external";
      label?: string;
    };

export type TextRange = {
  start: number;
  end: number;
};

export type SelectorNode = {
  id: Id;
  selectorType:
    | "span"
    | "decomposition"
    | "morphology"
    | "syntax"
    | "phonology"
    | "prosody"
    | "translationUnit"
    | "namedEntity"
    | "languageSwitch"
    | "nonSpeech"
    | "custom"
    | string;
  label?: string;
  children: TextNode[];
  refs?: SelectorRef[];
};

export type Provenance = {
  source: "manual" | "auto" | "imported";
  agent?: string;
  confidence?: number;
};

export type BaseRef<TBody> = {
  id: Id;
  body: TBody;
  provenance?: Provenance;
};

export type CommonRefBody =
  | NoteBody
  | TagBody
  | ResourceRefBody
  | CustomBody
  | DictionaryBody;

export type TextNodeRef = BaseRef<CommonRefBody | TextNodeOnlyRefBody>;

export type SelectorRef = BaseRef<CommonRefBody | SelectorOnlyRefBody>;

export type TextNodeOnlyRefBody = AlignmentRefBody | SpeakerBody;

export type SelectorOnlyRefBody = RelationBody;

export type NoteBody = {
  type: "note";
  noteType?: "learner" | "grammar" | "usage" | "cultural" | "editorial" | string;
  text: string;
  refs?: ResourceRef[];
};

export type TagBody = {
  type: "tag";
  tags: string[];
};

export type ResourceRefBody = {
  type: "resourceRef";
  refs: ResourceRef[];
};

export type CustomBody = {
  type: "custom";
  schema?: string;
  value: unknown;
};

export type AlignmentRefBody = {
  type: "alignment";
  mediaRef: ResourceRef;
  interval: TimeSpan;
};

export type SpeakerBody = {
  type: "speaker";
  speakerId: Id;
};

export type DictionaryBody = {
  type: "dictionary";
  ref?: ResourceRef;
  headword?: FormedText | string;
  lemma?: FormedText | string;
  pos?: string;
  definitions?: Record<LanguageId, FormedText[] | string[] | string>;
  tags?: string[];
  refs?: ResourceRef[];
};

export type RelationBody = {
  type: "relation";
  relationType: string;
  label?: string;
  refs?: ResourceRef[];
};

export type TransformType =
  | "translation"
  | "form"
  | "correction"
  | "transliteration"
  | "romanization"
  | "phonemization"
  | "representation"
  | string;

export type Transform = {
  id: Id;
  transformType: TransformType;
  output: TextNode;
  provenance?: Provenance;
};

export type Resource = MediaResource | ImageResource | ExternalResource;

export type ResourceRef = {
  resourceId: ResourceId;
};

export type MediaResource = {
  id: ResourceId;
  type: "media";
  mediaType: "audio" | "video";
  src: string;
  label?: string;
};

export type ImageResource = {
  id: ResourceId;
  type: "image";
  src: string;
  alt?: string;
  caption?: Record<LanguageId, FormedText>;
};

export type ExternalResource = {
  id: ResourceId;
  type: "external";
  resourceType?:
    | "url"
    | "bibliography"
    | "dataset"
    | "dictionary"
    | "note"
    | string;
  title?: string;
  uri?: string;
  citation?: string;
  data?: unknown;
};

export type NoteBlock = {
  id: Id;
  title?: string;
  text: string;
};

export type FigureBlock = {
  id: Id;
  resourceRef?: ResourceRef;
  src?: string;
  alt?: string;
  caption?: Record<LanguageId, FormedText>;
};

export type TableBlock = {
  id: Id;
  caption?: Record<LanguageId, FormedText>;
  columns: string[];
  rows: FormedText[][];
};
