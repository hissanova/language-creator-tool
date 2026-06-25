# Section Block Markup

Status: Draft

Sections contain ordered blocks. This lets text, notes, figures, and tables
appear in the same order in LCM source and Core JSON.

Section blocks may include:

* text blocks
* note blocks
* figure blocks
* table blocks

The current Core Model shape is:

```ts
type Section = {
  id: string;
  title: string;
  level?: number;
  blocks: SectionBlock[];
};

type SectionBlock =
  | { type: "text"; text: TextNode }
  | { type: "note"; note: NoteBlock }
  | { type: "figure"; figure: FigureBlock }
  | { type: "table"; table: TableBlock };
```

Use `sections`, not `body`. Use `type: "text"` for ordinary text content, not
`type: "line"`.

## Example

```lcm
# Greeting

>: はいさい。

[note] 沖縄語の挨拶に関して
  沖縄語の首里・那覇方言では、男性は「はいさい」、女性は「はいたい」という習慣がある。

>: ちゃーがんじゅーやみ？
```

## Expected Core JSON Direction

```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "Greeting",
      "level": 1,
      "blocks": [
        { "type": "text", "text": { "id": "line-1" } },
        { "type": "note", "note": { "id": "note-1" } },
        { "type": "text", "text": { "id": "line-2" } }
      ]
    }
  ]
}
```

This example omits the full `TextNode` and `NoteBlock` bodies so the ordered
block structure stays visible.

## Notes

The exact parser syntax for every block kind is still draft. The stable
structural decision is that mixed section-level content is represented as
ordered `blocks[]` in Core JSON.
