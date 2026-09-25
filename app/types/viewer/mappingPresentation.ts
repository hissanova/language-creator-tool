import type { FormedText } from "../core/common";
import type { TextMappingPayload } from "../core/textLine";

export type MappingPresentationRule = {
  readonly id: string;
  readonly match: {
    readonly mappingTypes?: readonly string[];
    readonly languageIds?: readonly string[];
    readonly formIds?: readonly string[] | "currentForm" | "currentReading" | "any";
    readonly sourceKinds?: readonly ("wholeLine" | "selector")[];
  };
  readonly presentation: "alignedText" | "ruby";
  readonly placement: "above" | "below";
  readonly order?: number;
};

export type MappingPresentationContext = {
  readonly selectedFormId: string;
  readonly selectedReadingFormId: string | null;
};

export type MappingSource =
  | { readonly kind: "wholeLine" }
  | { readonly kind: "selector"; readonly selectorId: string }
  | { readonly kind: "selection"; readonly selectionId: string };

export type MappingSourceRange = {
  readonly start: number;
  readonly end: number;
};

export type MappingPresentationItem = {
  readonly ruleId: string;
  readonly mappingId: string;
  readonly mappingType: string;
  readonly mappedText: Readonly<FormedText>;
  readonly source: Exclude<MappingSource, { kind: "selection" }>;
  /** UTF-16 offsets into textLine.content.text, with an exclusive end. */
  readonly range: MappingSourceRange;
  readonly presentation: MappingPresentationRule["presentation"];
  readonly placement: MappingPresentationRule["placement"];
  readonly order: number;
  readonly inputOrder: number;
};

export type MappingPresentationFallbackReason =
  | "unmatched"
  | "conflicting-rules"
  | "missing-selector"
  | "unsupported-selector"
  | "invalid-range"
  | "overlapping-ranges"
  | "multiple-ruby-annotations"
  | "unsupported-selection-source";

export type MappingPresentationFallback = {
  readonly mappingId: string;
  readonly mappingType: string;
  readonly source: MappingSource;
  readonly reason: MappingPresentationFallbackReason;
  readonly matchingRuleIds?: readonly string[];
  readonly inputOrder: number;
};

export type MappingPresentationResult = {
  readonly above: readonly MappingPresentationItem[];
  readonly below: readonly MappingPresentationItem[];
  readonly fallbacks: readonly MappingPresentationFallback[];
};

export type MappingPresentationCandidate = {
  readonly mapping: TextMappingPayload;
  readonly source: MappingSource;
  readonly inputOrder: number;
  readonly sourceFallback?: MappingPresentationFallbackReason;
  readonly range?: MappingSourceRange;
};
