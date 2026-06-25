import type { 
  ResourceRef,
 } from "./refences";

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
// Time
// -----------------------------------------------------------------------------

export type TimeSpan = {
  start: number;
  end: number;
};

