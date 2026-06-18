# RFC-0003: TextNode, SelectorNode, Ref, and Transform Core Model

Status: Accepted

## Summary

Replace the old Line / Target / Annotation / Decomposition Core JSON model with a smaller graph built from:

- `TextNode`: formed text content.
- `SelectorNode`: resolved index ranges over a source `TextNode`, plus child `TextNode`s.
- `Ref`: information attached to a `TextNode` or `SelectorNode`.
- `Transform`: a derived `TextNode` output from a source `TextNode`.
- `Resource`: simplified top-level media, image, and external resources.

## Motivation

The previous model mixed authoring selectors, annotation bodies, decomposition, and viewer-oriented concerns into the Core Model. Core JSON should store resolved structure and meaning, while parser-specific selector expressions remain in the parser layer.

## Model

Conceptually:

```text
TextNode = C*
SelectorNode = C* -> P(C*)
Ref = information attached to TextNode or SelectorNode
Transform = TextNode -> TextNode
```

Selector-created child `TextNode.source.ranges` stores resolved index ranges. Occurrence selectors and text-match selectors belong to markup or parser internals, not Core JSON.

## Decisions

- Remove `Speaker.color`; speaker display colors belong in display style.
- Replace `FormTypeId` with `FormId`.
- Replace `Line`, `Target`, `Annotation`, `Decomposition`, and `FormedTextUnit` with `TextNode`, `SelectorNode`, `Ref`, and `Transform`.
- Represent alignment as a `TextNodeRef`.
- Represent translations, forms, corrections, romanization, phonemization, and other derived representations as transforms whose output is a `TextNode`.
- Represent language switches, foreign text, and non-speech content as selector children with appropriate `content.languageId` and `content.formId`.
- Do not add `StructureBody`; structure is represented by `SelectorNode.selectorType`.
- Simplify resources to `MediaResource | ImageResource | ExternalResource`.
- Use `Document.sections`, not `Document.body`.

## Compatibility

This is a breaking change. New canonical samples must be TypeScript fixtures using `satisfies Document`.
