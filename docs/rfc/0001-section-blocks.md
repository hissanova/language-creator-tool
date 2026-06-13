# RFC-0001: Section Blocks

## Status

Draft

## Motivation

The current section model based on `lines[]` is simple, but it cannot preserve the relative order of lines and other section-level content such as notes, figures, tables, or references.

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
  title?: string;
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
Conversation
  metadata
  sections[]
    blocks[]
      line | note | figure | table
  references[]
```

## Example

```json
{
  "id": "basic-conversation",
  "sections": [
    {
      "id": "section-1",
      "title": "Greeting",
      "blocks": [
        {
          "type": "line",
          "line": {
            "id": "line-1",
            "text": "Hello."
          }
        },
        {
          "type": "note",
          "note": {
            "id": "note-1",
            "text": "A short greeting note."
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

For example, `lines[]`, `notes[]`, and `figures[]`.

This is easy to type but does not preserve the order of mixed content.

## Open Questions

- Should references be only document-level, or can a block also contain local reference links?
- Should `note` be a section block only, or can it also appear inside a line annotation?
- Should `blocks[]` replace `lines[]` immediately, or should both be supported during migration?
