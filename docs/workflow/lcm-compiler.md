# Compiling LCM to Core JSON Fixtures

This is the implementation-oriented reference for maintainers extending or
testing the MVP compiler. Content creators should begin with
[Authoring LCM content](authoring-lcm.md).

## Overview

The current compilation pipeline is:

```text
LCM markup
  -> MVP LCM compiler
  -> Core JSON TypeScript fixture
  -> Viewer
```

The compiler under `scripts/lcm/` is a minimum, fixture-driven implementation for the current sample files. It is not a complete implementation of the LCM language.

Core JSON is the canonical internal representation. Its source-of-truth TypeScript definitions are under `app/types/core/`.

## Commands

Run these commands from the repository root:

```bash
npm run compile:lcm
npm run compile:lcm:file -- --input <path> --output <path> --exportName <name>
npm run check:lcm
npm run check:samples
npm run lint
npm run build
```

- `npm run compile:lcm` reads the registered LCM fixtures and rewrites their generated Core JSON TypeScript files.
- `npm run compile:lcm:file -- --input <path> --output <path> --exportName <name>` compiles one LCM file to a TypeScript `Document` module with the requested named export.
- `npm run check:lcm` compiles the fixtures in memory and checks their required semantics, deterministic output, and use of valid text forms.
- `npm run check:samples` type-checks the TypeScript sample fixtures against the current Core JSON types.
- `npm run lint` runs ESLint across the repository.
- `npm run build` runs the Next.js production build.

The fixture registry is `scripts/lcm/fixtures.mjs`. The compiler implementation, generation driver, and semantic checker are `compile-lcm.mjs`, `compile-fixtures.mjs`, and `check-lcm-compiler.mjs` in the same directory.

## Input and Output Files

The MVP compiler currently knows these pairs:

```text
samples/markup/viewer-conversation-smoke.lcm
  -> samples/core-json/generated/viewer-conversation-smoke.generated.ts

samples/markup/decomposition-minimum.lcm
  -> samples/core-json/generated/decomposition-minimum.generated.ts

samples/markup/decomposition-nested-minimum.lcm
  -> samples/core-json/generated/decomposition-nested-minimum.generated.ts
```

The corresponding hand-written reference fixtures are:

```text
samples/core-json/viewer-conversation-smoke.ts
samples/core-json/decomposition-minimum.ts
samples/core-json/decomposition-nested-minimum.ts
```

Generated and hand-written fixtures do not need byte-for-byte equality or identical IDs. Generated IDs are deterministic and readable, while `npm run check:lcm` checks semantic equivalence for the supported features.

## Generated File Policy

Generated Core JSON fixtures use an explicit `Document` annotation:

```ts
import type { Document } from "@/app/types/core/document";

export const sampleGenerated: Document = {
  // ...
};
```

Do not generate fixtures with `satisfies Document`:

```ts
export const sampleGenerated = {
  // ...
} satisfies Document;
```

The explicit `: Document` annotation avoids overly narrow nested object inference for structures such as `selectorRecord` and `selections`.

Generated files must not be edited by hand. Edit the source `.lcm` file or the compiler, then run `npm run compile:lcm` again.

## Supported LCM Subset

The compiler only supports syntax exercised by the three registered fixtures:

- YAML-like front matter with the scalar metadata and object lists used by the fixtures
- front-matter resources, including the first media resource as the alignment target
- level-1 section headings such as `# 喫到飽`
- timestamp blocks using `HH:MM:SS,mmm --> HH:MM:SS,mmm`
- speaker lines such as `>chichi: ...`
- plain text lines such as `>: ...`
- line-level annotation scope with `@line`
- exact single-text selectors such as `@"にーさん"`
- left-to-right decomposition selectors such as `@"喫" | "到" | "飽"`
- positional selection references such as `@1` and `@2`
- tag refs with `+tag`
- editorial note refs with `+note`
- whole-line translations using `-> lang:<id>`
- explicit translations using `-> translation lang:<id>`
- gloss mappings using `-> gloss lang:<id>`
- the indentation-based output-image and source-span nesting used by `decomposition-nested-minimum.lcm`
- source-side nested decomposition materialized as a `localSource` mapping

Single-text selectors use zero-based UTF-16 offsets. The target must have exactly one match. Decomposition parts are resolved left-to-right. These rules are sufficient for the current fixtures but are not a general selector implementation.

## Current Limitations

- No full LCM grammar support yet
- No Core JSON to LCM roundtrip
- No dictionary autoscan
- No full resource or dictionary annotation syntax
- No advanced disambiguation for repeated text selectors
- No full parser error recovery; compilation stops at the first unsupported or invalid construct
- No editor integration
- No guarantee that arbitrary or older LCM files compile
- No automatic fixture discovery; supported inputs must be registered explicitly

The compiler is intentionally fixture-driven. Add syntax only when a small accepted sample requires it.

The creator-facing executable reference is
[`samples/markup/lcm-cheat-sheet.lcm`](../../samples/markup/lcm-cheat-sheet.lcm).
Keep proposed or unsupported syntax out of that file; track it in an Issue or
RFC until the compiler and semantic checks implement it.

## Adding a New Sample

1. Write a small `.lcm` file under `samples/markup/`.
2. Add its basename to `scripts/lcm/fixtures.mjs`.
3. Run `npm run compile:lcm`.
4. Run `npm run check:lcm`.
5. Run `npm run check:samples`.
6. Add or update semantic assertions in `scripts/lcm/check-lcm-compiler.mjs`.
7. Preview the generated fixture through a viewer route if visual confirmation is useful.

Keep new samples small initially. A focused fixture makes parser scope and expected Core JSON semantics easier to review.

## Troubleshooting

### Generated fixture causes a TypeScript `selectorRecord` error

Generate the export with an explicit annotation:

```ts
export const exampleGenerated: Document = {
  // ...
};
```

Do not use `satisfies Document` for generated fixtures, because its narrower nested inference can make selector and selection structures incompatible with consumers expecting `Document`.

### `formId: "gloss"` appears

`gloss` is a mapping type, not a `FormedText.formId`. Use `mappingType: "gloss"` and set the mapping image's `content.formId` to `"surface"`.

### Media does not play

Next.js serves files under `public/` from the site root. Use a source such as `/media/audio/sample-episode-uchi.mp3`, not `/public/media/audio/sample-episode-uchi.mp3`.

### Generated output differs from the hand-written fixture

Exact IDs and object formatting are not required to match. Run `npm run check:lcm` and `npm run check:samples`; semantic checks and Core JSON type compatibility are the important guarantees.
