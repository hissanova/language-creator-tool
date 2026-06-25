import type {
  Id,
  LanguageId,
  ResourceId,
  TimeSpan, 
  Provenance,
} from "./common";
import type {
  FormedText,
  TextLine,
} from "./textLine";

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
// Resources
// -----------------------------------------------------------------------------

export type ResourceRef = {
  resourceId: ResourceId;
};
