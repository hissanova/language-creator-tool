# Core JSON Specification

Status: Draft

Canonical TypeScript definition: `app/types/lcm.ts`

Core JSON is the canonical internal representation of Language Creator Tool content. It describes content structure and meaning, not viewer-specific presentation rules.

## Current High-Level Shape

```text
Document
  metadata
  resources[]
  sections[]
    Section
      blocks[]
        text | note | figure | table
```

Core JSON is rendered directly by the viewer with optional display style/config. Do not introduce Viewer JSON or Display JSON for the current universal/debug viewer.

## Document

```ts
type Document = {
  metadata: Metadata;
  resources?: Resource[];
  sections: Section[];
};
```

Use `sections`, not `body`.

## Metadata

```ts
type Metadata = {
  specVersion: string;
  title: string;
  documentType?: "conversation" | "lesson" | "text" | "corpus" | string;
  defaultLanguageId?: LanguageId;
  defaultFormId?: FormId;
  languages?: Language[];
  forms?: Form[];
  speakers?: Speaker[];
};
```

Speaker color is not part of Core JSON. Speaker styling belongs in display style.

## Section Blocks

Sections use ordered `blocks[]` for mixed section content.

```ts
type Section = {
  id: Id;
  title: string;
  level?: number;
  time?: TimeSpan;
  sections?: Section[];
  blocks: SectionBlock[];
};

type SectionBlock =
  | { type: "text"; text: TextNode }
  | { type: "note"; note: NoteBlock }
  | { type: "figure"; figure: FigureBlock }
  | { type: "table"; table: TableBlock };
```

## FormedText

```ts
type FormedText = {
  text: string;
  languageId: LanguageId;
  formId: FormId;
};
```

`FormedText` identifies the language and form of a text value. Derived forms are represented as `Transform` outputs.

## TextNode

```ts
type TextNode = {
  id: Id;
  content: FormedText;
  source?: TextNodeSource;
  selectors?: SelectorNode[];
  refs?: TextNodeRef[];
  transforms?: Transform[];
};
```

Conceptually, a `TextNode` is `C*`: a sequence of content with language and form metadata.

## SelectorNode

```ts
type SelectorNode = {
  id: Id;
  selectorType: "span" | "decomposition" | "morphology" | "syntax" | string;
  label?: string;
  children: TextNode[];
  refs?: SelectorRef[];
};

type TextRange = {
  start: number;
  end: number;
};
```

A `SelectorNode` maps a `TextNode` to optional child `TextNode`s. Selector-created children store resolved index ranges in `child.source.ranges`; the selector itself does not duplicate those ranges. Text-match selectors, occurrence selectors, and other parser-specific selector expressions belong outside Core JSON.

## Refs

Refs attach information to `TextNode` or `SelectorNode`.

```ts
type BaseRef<TBody> = {
  id: Id;
  body: TBody;
  provenance?: Provenance;
};
```

Common ref bodies include notes, tags, resource references, custom payloads, and dictionary entries. `TextNode`-only refs include alignment and speaker. `SelectorNode`-only refs include relations.

`StructureBody` is not used; selector structure is represented by `SelectorNode.selectorType`.

## Transform

```ts
type Transform = {
  id: Id;
  transformType:
    | "translation"
    | "form"
    | "correction"
    | "transliteration"
    | "romanization"
    | "phonemization"
    | "representation"
    | string;
  output: TextNode;
  provenance?: Provenance;
};
```

The source is the `TextNode` that owns the transform. Transform output is always another `TextNode`.

## Resources

```ts
type Resource = MediaResource | ImageResource | ExternalResource;

type ResourceRef = {
  resourceId: ResourceId;
};
```

Resources are top-level reusable objects. Media and dictionary sources belong in `resources`, not `metadata`.

## Display Separation

Core JSON must not encode viewer-specific display decisions. Display style may define how annotations, speakers, translations, notes, and other blocks are presented.

# For new core-Json
## Text Range
TextRange.start and TextRange.end are zero-based UTF-16 code unit offsets in TextLine.content.text.
The end offset is exclusive.
TextRange.start and TextRange.end must be within TextLine.content.text.
TextRange.start must be <= TextRange.end.
For selectionType: "decomposition", selectorIds order is meaningful.
For decomposition, ranges should usually be ordered and non-overlapping.