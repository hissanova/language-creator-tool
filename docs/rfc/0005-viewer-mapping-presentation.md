# RFC 0005: Viewer Mapping Presentation Resolution

Status: Draft

## Context

Core `TextLine` mappings describe relationships and mapped text. A future Viewer renderer needs a deterministic decision about which mappings can be placed beside canonical source text. That decision belongs to the Viewer and must not change Core JSON or AnnotationPanel configuration.

## Decision

The Viewer accepts an explicit list of mapping presentation rules. Each rule filters mapping type and mapped text language/form by exact string equality. Omitted filters accept any value; empty filters accept none. A rule selects `alignedText` or `ruby`, `above` or `below`, and an optional order.

A pure resolver collects top-level selected-text, whole-line, local selection, and single-selector selection mappings. It uses the existing annotated-text selector-range helper against `textLine.content.text`. It does not traverse mapping images or project canonical offsets onto a selected alternative form.

Exactly one matching rule yields an item. Zero matches, multiple matches, and unsupported sources yield typed fallbacks. Multiple matches are a conflict, not multiple presentations. Duplicate mapping IDs are collected once, at their first direct occurrence. Within each placement, items sort by source start, source end, rule order, candidate order, then mapping ID. Fallbacks retain candidate order.

The resolver only prepares data. Renderer integration and visible defaults are separate work.

## Trade-off

The first occurrence of a repeated mapping ID determines its source. Core IDs are intended to identify mappings uniquely; inconsistent duplicate IDs therefore remain a content issue. A selection with multiple selectors cannot be represented as one continuous inline range and falls back explicitly.
