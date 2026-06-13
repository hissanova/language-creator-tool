# Core JSON Specification

Status: Draft placeholder

Core JSON is the canonical internal representation of Language Creator Tool content.

It should describe the structure and meaning of the content, not viewer-specific presentation rules.

# Canonical TypeScript definition:

`app/types/lcm.ts`

## Current Direction

The current proposed high-level shape is:

```text
Conversation
  metadata
  sections[]
    blocks[]
      line | note | figure | table
  references[]
```

## Section Blocks

See `docs/rfc/0001-section-blocks.md` for the current draft proposal.

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

## Display Separation

Core JSON must not encode Basic Viewer-specific display decisions.

Viewer-specific presentation rules belong in `displayStyle.yaml` and the generated Display JSON.
