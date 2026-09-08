# Specification Index

This index helps maintainers distinguish current architecture, draft
specifications, and legacy proposals. Each document's own status line remains
authoritative; appearing in this index does not make a draft accepted.

## Architecture references

- [Core JSON](core-json.md) — canonical content and meaning; implemented
  TypeScript definitions live under `app/types/core/`.
- [LCM overview](lcm-overview.md) — human-authored markup that compiles to Core
  JSON.
- [Viewer style and configuration](display-style.md) — optional presentation
  settings applied when a Viewer renders Core JSON.

The current flow is:

```text
LCM markup
  -> Core JSON
  -> optional Viewer configuration
  -> Viewer
```

For the implementation-oriented source-of-truth rules, see the
[maintainer workflow](../workflow.md).

## LCM draft details

- [General markup](markup.md)
- [FormedText and transforms](formed-text-and-transform.md)
- [Selectors and refs](selector-and-ref-markup.md)
- [Section blocks](section-block-markup.md)
- [Dictionary resources](dictionary.md)

The executable description of the currently supported compiler subset is the
[compiler workflow](../workflow/lcm-compiler.md) and its registered fixtures.
Draft syntax is not supported merely because it appears in a specification.

## Legacy proposals

- [Viewer JSON](viewer-json.md) — retained as a historical note; it is not a
  layer in the current architecture.

## RFCs

Design changes and their acceptance status are recorded in [`docs/rfc/`](../rfc/).
Do not treat a draft RFC as implemented behavior.
