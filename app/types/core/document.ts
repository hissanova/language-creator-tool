import type {
  FormId,
  Id,
  LanguageId,
  ResourceId,
  TimeSpan,
} from "./common";
import type {
  FormedText,
  TextLine,
} from "./textLine";
import type { 
  TextLineRef,
  ResourceRef,
} from "./refences";

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

