# RFC-0002: FormedText, Target Selectors, and Annotation Provenance

## Status

Draft

## Motivation

The LCM/Core JSON model needs clearer separation between:

- language expressions
- target selection
- annotation metadata
- edit history

Previously, some language expressions were stored as plain strings, target selection was mixed into target objects, and provenance risked spreading into places where it did not belong.

## Proposal

### 1. Use `FormedText.surface` as the default form

```ts
type FormedText = {
  surface: string;
  formType?: FormTypeId | "surface";
  decomposition?: Decomposition;
};
```

`surface` is the default form. Other forms can be represented with `formType`.

### 2. Use `FormedText` for annotation values that are language expressions

Examples:

- translation value
- correction value
- form value
- dictionary headword / lemma / meanings

Plain explanatory notes remain strings.

### 3. Introduce `TargetSelector`

```ts
type TargetSelector = TextSelector | IndexSelector;
```

This separates the way a target is selected from the target object itself.

### 4. Keep provenance only on annotations

```ts
type Provenance = {
  source: "manual" | "auto" | "imported";
  agent?: string;
  confidence?: number;
};
```

Targets do not carry provenance.

### 5. Keep Core JSON history minimal

Detailed history should be handled by Git. Core JSON should only keep minimal provenance needed to interpret annotation reliability and origin.

## Consequences

- Viewer code should read `formedText.surface` for default display.
- Existing `{ text: string }` FormedText objects need migration to `{ surface: string }`.
- Existing translation annotations with `text: string` should become `value: FormedText`.
- Targets should use `selector` for text-span selection.

## Open Questions

- Should `surface` always imply `formType: "surface"`, or should omitted `formType` be enough?
- Should dictionary `notes` eventually support rich text or remain plain strings?
