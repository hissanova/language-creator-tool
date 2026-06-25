 import type {
  Id,
  SelectionId,
  SelectorId,
  FormedText,
  Provenance,
 } from "./common";
import type { 
  TextLineRef,
  SelectionRef,
 } from "./refences";

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

