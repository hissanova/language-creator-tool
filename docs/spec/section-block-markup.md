# Section Block Markup

Status: Draft

This document describes the draft markup direction for ordered section blocks.

## Goal

The markup should allow lines, notes, figures, and tables to appear in the same order as they should appear in Core JSON / LCM JSON.

## Example

```text
# Greeting

>: はいさい。

@note Greeting note
  A section-level note can appear between lines.

>: ちゃーがんじゅーやみ？
```

## Expected Core JSON Direction

```json
{
  "body": [
    {
      "id": "section-1",
      "title": "Greeting",
      "level": 1,
      "blocks": [
        { "type": "line", "line": { "id": "line-1" } },
        { "type": "note", "note": { "id": "note-1" } },
        { "type": "line", "line": { "id": "line-2" } }
      ]
    }
  ]
}
```

## Notes

The exact parser syntax is still draft. The important structural decision is that mixed section-level content is represented as ordered `blocks[]` in Core JSON / LCM JSON.
