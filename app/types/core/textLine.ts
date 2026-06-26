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
 } from "./references";

// -----------------------------------------------------------------------------
// TextLine
// -----------------------------------------------------------------------------

export type TextLine = {
  id: Id;
  content: FormedText;
  provenance?: Provenance;

  selectorRecord?: SelectorRecord;
  selections?: Selection[];

  // Optional text mappings attached to individual selectors within the TextLine.
  // Each mapping's source must reference a selector in selectorRecord.
  selectedTextMappings?: TextMappingBundle[];
  selectedTextRefs?: RefAttachmentBundle[];

  // Optional text mappings attached to the TextLine as a whole, rather than to individual selectors.
  // Use this for text that applies to the entire TextLine.
  textLineMappings?: TextMappingPayload[];
  textLineRefs?: TextLineRef[];
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
  selectorType: "positions";
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
 * @property {TextMappingBundle[]} [localSelectedTextMappings] - Optional text mappings for individual selectors.
 *   Each mapping's selectorId must reference a selector in selectorIds.
 * @property {RefAttachmentBundle[]} [localSelectedTextRefs] - Optional reference attachments for individual selectors.
 *   Each attachment's selectorId must reference a selector in selectorIds.
 * @property {TextMappingPayload[]} [selectionMappings] - Optional text mappings attached to the selection as a whole,
 *   rather than to individual selectors. Use this for text that applies to the entire selection.
 * @property {SelectionRef[]} [selectionRefs] - Optional references attached to the selection as a whole,
 *   rather than to individual selectors.
 * @property {Provenance} [provenance] - Optional provenance information tracking the origin and history of this selection.
 */

export type Selection = {
  id: SelectionId;

  selectorIds: SelectorId[];

  selectionType: SelectionType;

  label?: string;

  localSelectedTextMappings?: TextMappingBundle[];

  localSelectedTextRefs?: RefAttachmentBundle[];

  selectionMappings?: TextMappingPayload[];
  selectionRefs?: SelectionRef[];

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

// TextLine.localSelectedTextMappings[].source
//   must exist in TextLine.selectorRecord

// TextLine.localSelectedTextRefs[].source
//   must exist in TextLine.selectorRecord

// Selection.selectionMappings[].source
//   must be included in Selection.selectorIds

// Selection.localSelectedTextRefs[].source
//   must be included in Selection.selectorIds

// Selection.selectionMappings
//   are mappings from the Selection as a whole

// Selection.selectionRefs
//   are refs attached to the Selection as a whole

