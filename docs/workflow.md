# Language Creator Tool Workflow

This document defines the recommended workflow for changing the Language Creator Tool data model, markup, samples, and viewer behavior.

## Pipeline

```text
Markup
  -> Core JSON
  -> Core JSON + displayStyle.yaml
  -> Display JSON
  -> Viewer
```

## Roles

### Markup

Human-authored source text.

Stored in:

```text
samples/markup/
```

### Core JSON

Canonical structured representation of the language content.

Core JSON should describe meaning, structure, references, timing, and annotations, but should avoid viewer-specific presentation choices.

Stored in:

```text
samples/core-json/
```

### Display Style

Viewer-specific presentation configuration.

Display Style defines how annotations and content blocks should be presented, for example labels, ordering, visibility, and grouping.

Stored in:

```text
samples/display-style/
```

### Display JSON

Viewer-ready representation generated from Core JSON and Display Style.

Stored in:

```text
samples/display-json/
```

## Recommended Change Flow

Use this order when making non-trivial structural or presentation changes:

1. Write or update an RFC in `docs/rfc/`.
2. Add or update a markup sample in `samples/markup/`.
3. Add or update the expected Core JSON in `samples/core-json/`.
4. Add or update a Display Style YAML file in `samples/display-style/`.
5. Add or update the expected Display JSON in `samples/display-json/`.
6. Update TypeScript types in `app/types/`.
7. Update parser and transformation logic.
8. Update the viewer.
9. Verify that the samples render correctly.
10. Update accepted specs in `docs/spec/`.

## Naming Convention

Use matching base names across sample stages.

```text
samples/markup/basic-conversation.lct
samples/core-json/basic-conversation.json
samples/display-style/basic-viewer.yaml
samples/display-json/basic-conversation.basic-viewer.json
```

For Display JSON, use:

```text
<content-name>.<style-name>.json
```
