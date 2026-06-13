# RFC-0001: Section Blocks

## Status

Draft

## Motivation

The previous section model based on `lines[]` is simple, but it cannot preserve the relative order of lines and other section-level content such as notes, figures, tables, or reference notes.

Language content often needs supplemental material between lines, for example:

- cultural notes
- grammar notes
- figures
- tables
- reference notes
- summaries

Separate arrays such as `lines[]`, `notes[]`, and `figures[]` would lose the intended reading order.

## Proposal

Introduce `blocks[]` under each section.

```ts
type Section = {
  id: string;
  title: string;
  level: number;
  blocks: SectionBlock[];
};

type SectionBlock =
  | { type: "line"; line: Line }
  | { type: "note"; note: Note }
  | { type: "figure"; figure: Figure }
  | { type: "table"; table: Table };
```

## Document Shape

```text
Document
  metadata
  body[]
    blocks[]
      line | note | figure | table
  references[]
```

## Rationale

`blocks[]` keeps the document model language-content-oriented while preserving the order of heterogeneous content.

It is more explicit than `children[]`, while still allowing future extension to block types such as `quiz`, `audioNote`, `map`, or `externalLink`.

## Migration

Existing `lines[]` data may be converted mechanically:

```ts
const blocks = lines.map((line) => ({
  type: "line" as const,
  line,
}));
```

During migration, `lines[]` may remain as a deprecated compatibility field, but new data should use `blocks[]`.

## Example

```json
{
  "metadata": {
    "title": "Section Blocks Example",
    "targetLanguage": "ryu",
    "specVersion": "0.1.0"
  },
  "body": [
    {
      "id": "section-1",
      "title": "Greeting",
      "level": 1,
      "blocks": [
        {
          "type": "line",
          "line": {
            "id": "line-1",
            "text": { "text": "はいさい。" }
          }
        },
        {
          "type": "note",
          "note": {
            "id": "note-1",
            "title": "Greeting note",
            "text": "A short greeting note can appear between lines."
          }
        },
        {
          "type": "line",
          "line": {
            "id": "line-2",
            "text": { "text": "ちゃーがんじゅーやみ？" }
          }
        }
      ]
    }
  ]
}
```

## Alternatives Considered

### `children[]`

More general, but less explicit. `blocks[]` better communicates that these are ordered section-level content blocks.

### Separate arrays

For example, `lines[]`, `notes[]`, and `figures[]`. This is easy to type but does not preserve the order of mixed content.

## Open Questions

- Should references be only document-level, or can a block also contain local reference links?
- Should `note` be a section block only, or can it also appear inside a line annotation?
- How long should `lines[]` remain as a compatibility field?
