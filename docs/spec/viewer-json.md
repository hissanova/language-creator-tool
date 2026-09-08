# Viewer JSON (Legacy Proposal)

Status: Legacy; not part of the current LCT architecture

Viewer JSON was an earlier proposal for a separate viewer-ready intermediate
model. LCT does not currently compile Core JSON into Viewer JSON, and there is
no canonical `app/types/viewer.ts` definition.

The current data flow is:

```text
LCM markup
  -> Core JSON
  -> Viewer with optional configuration applied at render time
```

Core JSON remains the canonical representation of content and meaning. Viewer
configuration controls presentation without creating another serialized
content model.

See the [Core JSON specification](core-json.md),
[Viewer style and configuration](display-style.md), and the
[maintainer workflow](../workflow.md) for the current architecture.

Do not add a Viewer JSON or Display JSON dependency without a separately
accepted design change.
