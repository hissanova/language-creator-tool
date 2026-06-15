# Core JSON Specification

Status: Draft

Canonical TypeScript definition: `app/types/lcm.ts`

Core JSON is the canonical internal representation of Language Creator Tool content. It describes content structure and meaning, not viewer-specific presentation rules.

## Current high-level shape

```text
Document
  metadata
  body[]
    Section
      blocks[]
        line | note | figure | table
      targets[]
  references[]
```

## Section blocks

Sections use `blocks[]` rather than separate arrays such as `lines[]`, `notes[]`, and `figures[]`.

This preserves the intended order of mixed section-level content.

```ts
type Section = {
  id: Id;
  title: string;
  level: number;
  blocks: SectionBlock[];
};

type SectionBlock = LineBlock | NoteBlock | FigureBlock | TableBlock;
```

`lines[]` may be temporarily retained only for migration. New content should use `blocks[]`.

## FormedText

Language expressions are represented by `FormedText`.

```ts
type FormedText = {
  text: string;
  formType?: FormTypeId | "surface";
  decomposition?: Decomposition;
};
```

Rules:

- `text` is the default display form for the expression.
- `formType` identifies non-default forms such as romanization, phonetic form, normalized form, or grammatical form.
- If an annotation value is itself a language expression, it should use `FormedText` rather than plain `string`.

Examples of annotation fields that use `FormedText`:

- translation value
- correction value
- form value
- dictionary headword / lemma / meanings

Plain explanatory notes may remain `string`.

## Target selectors

A target may point to text either by textual matching or by index.

```ts
type TargetSelector = TextSelector | IndexSelector;

type TextSelector = {
  type: "text";
  text: string;
  occurrence?: number;
  range?: { start: number; end: number };
};

type IndexSelector = {
  type: "index";
  index: number;
};
```

`TextSelector` is useful for human-authored markup. `IndexSelector` is useful after parsing or decomposition.

## Provenance

Only annotations carry provenance.

Targets do not carry provenance. They identify where an annotation applies; they do not describe how the annotation was created.

```ts
type Provenance = {
  source: "manual" | "auto" | "imported";
  agent?: string;
  confidence?: number;
};
```

Rules:

- `provenance` belongs to `Annotation` only.
- `Target` must not have `provenance`.
- Core JSON does not store detailed edit history.
- Long-term history management is delegated to Git.

## Display separation

Core JSON must not encode Basic Viewer-specific display decisions. The current viewer direction is to render Core JSON directly with optional style/config such as `displayStyle.yaml`.

Do not introduce a Viewer JSON or Display JSON layer for the current universal/debug viewer.
