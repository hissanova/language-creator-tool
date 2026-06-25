// -----------------------------------------------------------------------------
// Primitive IDs
// -----------------------------------------------------------------------------
export type Id = string;
export type LanguageId = string;
export type FormId = string;
export type ResourceId = string;
export type SelectorId = string;
export type SelectionId = string;

// -----------------------------------------------------------------------------
// FormedText
// -----------------------------------------------------------------------------

export type FormedText = {
  text: string;
  languageId: LanguageId;
  formId: FormId;
};

// -----------------------------------------------------------------------------
// TextLine
// -----------------------------------------------------------------------------

export type TextLine = {
  id: Id;
  content: FormedText;
  provenance?: Provenance;

  selectorRecord?: SelectorRecord;
  selections?: Selection[];

  textMappingBundles?: TextMappingBundle[];
  refAttachmentBundles?: RefAttachmentBundle[];

  textMappings?: TextMappingPayload[];
  refs?: TextLineRef[];
};

// -----------------------------------------------------------------------------
// Selectors
// -----------------------------------------------------------------------------

export type SelectorRecord = Record<SelectorId, Selector>;

/**
 * A Selector is atomic.
 *
 * Multiple selectors are grouped by Selection, not by putting multiple ranges
 * into TextMappingList.source.
 */

export type Selector =
  | TextRangeSelector
  | TextPositionSelector;

export type TextRangeSelector = {
  selectorType: "range";
  range: TextRange;
};

export type TextPositionSelector = {
  selectorType: "position";
  positions: number[];
};

export type TextRange = {
  start: number;
  end: number;
};

// -----------------------------------------------------------------------------
// Text mappings
// -----------------------------------------------------------------------------

export type TextMappingPayload = {
  id: Id;
  mappingType: TextMappingType;
  image: TextLine;
};

export type TextMapping =
  TextMappingPayload & {
    source: SelectorId;
  };

export type TextMappingBundle = {
  id: Id;
  source: SelectorId;
  mappings: TextMappingPayload[];
};

export type TextMappingType =
  | "selection"
  | "language"
  | "form"
  | "translation"
  | "correction"
  | "lemma"
  | "romanization"
  | "transliteration"
  | "phonemization"
  | "representation"
  | "learnerHint"
  | "gloss"
  | string;


// -----------------------------------------------------------------------------
// Ref attachments
// -----------------------------------------------------------------------------

export type RefAttachmentPayload = {
  id: Id;
  ref: TextLineRef;
};

export type RefAttachment =
  RefAttachmentPayload & {
    source: SelectorId;
  };

export type RefAttachmentBundle = {
  id: Id;
  source: SelectorId;
  attachments: RefAttachmentPayload[];
};

// -----------------------------------------------------------------------------
// Selection
// -----------------------------------------------------------------------------

/**
 * Represents a selection of content within a document, consisting of one or more selectors.
 * 
 * A selection groups related selectors together and allows attaching metadata and references
 * at both the selector-level and selection-level.
 * 
 * @property {SelectionId} id - Unique identifier for this selection.
 * @property {SelectorId[]} selectorIds - Array of selector IDs that comprise this selection.
 * @property {SelectionType} selectionType - The type/category of this selection.
 * @property {string} [label] - Optional human-readable label for this selection.
 * @property {TextMappingBundle[]} [textMappingBundles] - Optional text mappings for individual selectors.
 *   Each mapping's source.selectorId must reference a selector in selectorIds.
 * @property {RefAttachmentBundle[]} [refAttachmentBundles] - Optional reference attachments for individual selectors.
 *   Each attachment's source.selectorId must reference a selector in selectorIds.
 * @property {TextLine[]} [selectionTexts] - Optional text lines attached to the selection as a whole,
 *   rather than to individual selectors. Use this for text that applies to the entire selection.
 * @property {SelectionRef[]} [refs] - Optional references attached to the selection as a whole,
 *   rather than to individual selectors.
 * @property {Provenance} [provenance] - Optional provenance information tracking the origin and history of this selection.
 */

export type Selection = {
  id: SelectionId;

  selectorIds: SelectorId[];

  selectionType: SelectionType;

  label?: string;

  textMappingBundles?: TextMappingBundle[];

  refAttachmentBundles?: RefAttachmentBundle[];

  textMappings?: TextMappingPayload[];
  refs?: SelectionRef[];

  provenance?: Provenance;
};

export type SelectionType =
  | "decomposition"
  | "parallel"
  | "relation"
  | "contrast"
  | "discontinuousExpression"
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

// -----------------------------------------------------------------------------
// Validation rules

// TextLine.textMappingBundles[].source
//   must exist in TextLine.selectorRecord

// TextLine.refAttachmentBundles[].source
//   must exist in TextLine.selectorRecord

// Selection.textMappingBundles[].source
//   must be included in Selection.selectorIds

// Selection.refAttachmentBundles[].source
//   must be included in Selection.selectorIds

// Selection.textMappings
//   are mappings from the Selection as a whole

// Selection.refs
//   are refs attached to the Selection as a whole

// -----------------------------------------------------------------------------
// Refs
// -----------------------------------------------------------------------------

export type BaseRef<TBody> = {
  id: Id;
  body: TBody;

  /**
   * Provenance of this ref/assertion itself.
   *
   * Example:
   * - manually added note
   * - imported dictionary entry
   * - auto-detected tag
   * - AI-generated hint
   */
  provenance?: Provenance;
};

export type TextLineRef = BaseRef<
  | NoteBody
  | TagBody
  | ResourceRefBody
  | DictionaryBody
  | AlignmentBody
  | SpeakerBody
  | CustomBody
>;

export type SelectionRef = BaseRef<
  | NoteBody
  | TagBody
  | ResourceRefBody
  | RelationBody
  | CustomBody
>;

export type NoteBody = {
  type: "note";
  noteType?:
    | "learner"
    | "grammar"
    | "usage"
    | "cultural"
    | "editorial"
    | string;
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

export type AlignmentBody = {
  type: "alignment";
  mediaRef: ResourceRef;
  interval: TimeSpan;
};

export type SpeakerBody = {
  type: "speaker";
  speakerId: Id;
};

export type RelationBody = {
  type: "relation";
  relationType: string;
  label?: string;
  refs?: ResourceRef[];
};

export type CustomBody = {
  type: "custom";
  schema?: string;
  value: unknown;
};

// -----------------------------------------------------------------------------
// Provenance
// -----------------------------------------------------------------------------

export type Provenance = {
  method: "manual" | "imported" | "auto" | "ai" | string;
  agent?: string;
  confidence?: number;
  source?: ResourceRef;
  note?: string;
};

// -----------------------------------------------------------------------------
// Resources
// -----------------------------------------------------------------------------

export type ResourceRef = {
  resourceId: ResourceId;
};

export type Resource =
  | MediaResource
  | ImageResource
  | ExternalResource;

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

// -----------------------------------------------------------------------------
// Time
// -----------------------------------------------------------------------------

export type TimeSpan = {
  start: number;
  end: number;
};

// -----------------------------------------------------------------------------
// Document structure
// -----------------------------------------------------------------------------

export type Document = {
  metadata: Metadata;
  resources?: Resource[];
  sections: Section[];
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

export type Section = {
  id: Id;
  title?: string;
  level?: number;
  time?: TimeSpan;
  blocks: SectionBlock[];
};

export type SectionBlock =
  | { type: "text"; text: TextLine }
  | { type: "note"; note: NoteBlock }
  | { type: "figure"; figure: FigureBlock }
  | { type: "table"; table: TableBlock }
  | { type: "section"; section: Section };

export type NoteBlock = {
  id: Id;
  title?: string;
  body: FormedText[];
  refs?: TextLineRef[];
};

export type FigureBlock = {
  id: Id;
  resourceRef: ResourceRef;
  caption?: FormedText[];
  refs?: TextLineRef[];
};

export type TableBlock = {
  id: Id;
  caption?: FormedText[];
  columns: TableColumn[];
  rows: TableRow[];
  refs?: TextLineRef[];
};

export type TableColumn = {
  id: Id;
  label: string;
};

export type TableRow = {
  id: Id;
  cells: Record<string, FormedText>;
};
