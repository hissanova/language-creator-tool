# Viewer Style and Configuration

Status: Draft placeholder

Viewer style and configuration define how Core JSON should be presented in a
Viewer. They are intentionally separate from Core JSON and are applied at
render time, not compiled into another content model.

The currently implemented style type is `app/types/viewerStyle.ts`. Related
Viewer configuration types live under `app/types/viewer/`.
`app/styles/viewerStyle.ts` is the single source of truth for the application's
generic Viewer defaults. Application defaults must not contain speaker IDs,
creator names, or other values that belong to a particular teaching resource.

## Current data flow

```text
Core JSON + optional Viewer configuration -> Viewer
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

## Form and Reading controls

The Viewer keeps base-text Form selection separate from Reading selection.

- **Form** chooses the canonical source form or a form supplied by a supported
  whole-line display mapping. Declaring a form in `metadata.forms` alone does
  not make it a base-text option. The control is hidden when only the canonical
  source form is available.
- **Reading** chooses the target form of an available `reading` mapping, such
  as `pinyin` or `zhuyin`. It starts at **None**, meaning that no reading aid is
  displayed. `None` is represented internally by `null`; it is not a form ID.
  The control is hidden when the document has no reading mappings.

The Core mapping type `reading` describes the semantic relationship. Form IDs
such as `pinyin`, `zhuyin`, and `kana` describe the notation used by that
reading. The default Reading presentation is semantic HTML `ruby`.
`alignedText` remains a distinct generic above/below presentation for mapped
text such as future glosses or selected-text translations. Neither renderer is
a selectable form and the control remains labelled **Reading**. **Reading:
None** disables Reading presentation. Existing whole-line Translation display
is a separate feature.

## Illustrative example

`samples/display-style/basic-viewer.yaml` shows a possible configuration shape.
It is an illustrative draft only. LCT does not currently load style YAML from
external content projects, and the sample is not loaded by the creator launcher
or emitted by the LCM compiler.

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

Viewer configuration defines how the content is shown. Do not introduce a
Viewer JSON, Display JSON, or another serialized intermediate layer unless the
project explicitly adopts one in a future RFC.

## Speaker presentation

The optional `ViewerStyle.speakers` map is a generic presentation override
mechanism keyed by Core JSON `speakerId`. Each entry may override
`backgroundColor`, `accentColor`, and `nameColor`. Omitted fields retain the
deterministic palette values assigned from the speaker's position in
`document.metadata.speakers`. Unknown or missing speakers use the neutral
presentation. These colors are Viewer-only presentation and must not be added
to Core JSON.

Resolution starts with the neutral presentation for an unknown or missing
speaker, or the metadata-ordered fallback palette for a known speaker. A
matching `ViewerStyle.speakers[speakerId]` entry is then applied field by field
as the highest-precedence presentation override.

The application defaults intentionally provide no speaker-specific overrides.
Editing `app/styles` inside the LCT repository is not a supported creator
customization workflow. Runtime loading of a creator-owned style file from an
external content project has not been implemented yet.
