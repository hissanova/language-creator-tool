# Display Style Specification

Status: Draft placeholder

Display Style defines how Core JSON should be presented in a viewer.

It is intentionally separate from Core JSON.

## Canonical TypeScript definition:

`app/types/viewerStyle.ts`

## Input and Output

```text
Core JSON + displayStyle.yaml -> Display JSON
```

## Purpose

Display Style may define:

- annotation order
- annotation labels
- annotation visibility
- speaker display names and colors
- translation display rules
- note presentation
- figure and table presentation
- reference presentation

## Example

```yaml
viewer: basic

annotationDisplay:
  order:
    - translation
    - meaning
    - grammar
    - note

  labels:
    translation: 訳
    meaning: 意味
    grammar: 文法
    note: 注

  visibility:
    translation: always
    meaning: onClick
    grammar: onClick
    note: collapsed
```

## Principle

Core JSON defines what the content means.

Display Style defines how the content is shown.

Display JSON is the viewer-ready result of combining both.
