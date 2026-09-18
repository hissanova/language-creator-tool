# Samples

Samples exercise LCM authoring, Core JSON, and Viewer behavior. Core JSON is the
canonical content model; optional Viewer configuration is applied when the
Viewer renders it. There is no generated Display JSON layer in the current
architecture.

## Current structure

| Directory | Purpose |
| --- | --- |
| `samples/markup/` | Human-authored `.lcm` examples and registered compiler inputs |
| `samples/core-json/generated/` | Generated TypeScript `Document` fixtures; never edit by hand |
| `samples/core-json/` | Focused hand-written TypeScript `Document` reference fixtures |
| `samples/display-style/` | Illustrative Viewer-configuration examples; not compiler output |
| `samples/conversation-*/` | Larger content and media used for Viewer development |

## Repository fixture pipeline

```text
samples/markup/example.lcm
  -> npm run compile:lcm
  -> samples/core-json/generated/example.generated.ts
```

Registered inputs and outputs are defined in `scripts/lcm/fixtures.mjs`. See
[Compiling LCM to Core JSON fixtures](../docs/workflow/lcm-compiler.md) for the
commands, supported subset, generated-file policy, and semantic checks.

Generated and hand-written fixtures serve different purposes. Generated files
prove what the compiler emits. Hand-written fixtures provide small, readable
Core JSON references. They do not need byte-for-byte equality or identical IDs;
the registered semantic checks define the required correspondence.

## Naming

Use the `.lcm` extension for markup and `.generated.ts` for generated Core JSON
modules:

```text
samples/markup/example.lcm
samples/core-json/generated/example.generated.ts
```

A matching hand-written reference, when useful, is a TypeScript module:

```text
samples/core-json/example.ts
```

Not every registered compiler input needs a separate hand-written fixture.

## View a built-in sample

1. Add or compile the sample document.
2. Add one typed entry to `samples/core-json/sampleRegistry.ts` with a stable ID, label, and loader.
3. Open `/contents/generated/<sample-id>`.

No per-sample Next.js `page.tsx` is required. The registry also supplies the home-page links and static route parameters.
