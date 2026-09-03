# Language Creator Tool Workflow

This document describes how maintainers and contributors change LCT content,
the LCM compiler, the Core JSON model, and Viewer presentation.

Content creators should start with [Authoring LCM content](workflow/authoring-lcm.md).
For the commands and implementation details of the current compiler, see
[Compiling LCM to Core JSON fixtures](workflow/lcm-compiler.md).

## Current data flow

```text
LCM markup
  -> MVP LCM compiler
  -> Core JSON
  -> optional Viewer configuration
  -> Viewer
```

- **LCM** is the human-authored source format.
- **Core JSON** is the canonical structured representation of content and its
  meaning.
- **Viewer configuration** controls presentation such as visibility, ordering,
  labels, and layout. It is optional and is not an intermediate data model.
- **Viewers** render Core JSON, optionally using Viewer configuration.

Do not introduce a separate Viewer JSON or Display JSON layer unless the
project explicitly adopts one in the future.

## Two compilation workflows

### Repository fixtures

Registered fixtures exercise and test the compiler:

```text
samples/markup/example.lcm
  -> npm run compile:lcm
  -> samples/core-json/generated/example.generated.ts
```

The generated TypeScript files are test artifacts. Do not edit them by hand;
edit the source `.lcm` file or the compiler and regenerate them.

Hand-written TypeScript fixtures under `samples/core-json/` may be used as
focused reference examples. Generated and hand-written fixtures do not need
identical IDs or formatting; semantic checks define the required equivalence.

### External content projects

Creators can keep teaching materials outside the LCT repository:

```text
external-project/episode.lcm
  -> compile on demand
  -> Core JSON in memory
  -> Viewer
```

This workflow does not create or update a generated fixture in the repository.
See [Opening an external content project](workflow/open-external-content.md).

## Choose the workflow by change type

### Content-only change

Use this flow when the compiler already supports everything the content needs:

```text
Edit .lcm
  -> compile
  -> inspect the Viewer
```

Do not add proposed or unsupported syntax to production content as a
placeholder. It may fail compilation or be interpreted as ordinary text.

### Documentation change

Use this flow when the capability exists but creators cannot discover or use it
reliably:

```text
Confirm current compiler behavior
  -> update an executable example when appropriate
  -> update documentation
  -> run the relevant checks
```

### LCM compiler extension

Use this flow when an authoring use case cannot be represented by the supported
LCM subset:

```text
Creator use case
  -> Core JSON representation
  -> LCM syntax decision
  -> focused fixture
  -> compiler implementation
  -> semantic checks
  -> Viewer support when required
  -> documentation
```

A request for new LCM syntax is not only a documentation request. The syntax
has meaning only after the compiler maps it to an agreed Core JSON
representation.

### Core model change

Use an Issue or RFC when the canonical meaning or structure changes:

```text
Issue or RFC
  -> accepted Core design
  -> TypeScript types and specifications
  -> compiler and fixtures
  -> affected consumers
  -> verification
```

Prefer additive changes. Do not update an accepted specification before the
implementation has been validated.

### Viewer-only change

Use this flow when Core JSON already contains the required meaning and only its
presentation changes:

```text
Viewer requirement
  -> Viewer configuration or component
  -> representative sample verification
```

Do not add presentation-only fields to Core JSON.

## Sources of truth

| Concern | Source of truth |
| --- | --- |
| Core JSON structure | Accepted specifications and `app/types/core/` |
| Current compiler behavior | Compiler implementation and registered fixture checks |
| Supported LCM subset | `docs/workflow/lcm-compiler.md` and executable fixtures |
| Viewer presentation | Viewer types, configuration, and components |
| Proposed changes | GitHub Issues and `docs/rfc/` |

If these disagree, open an Issue and reconcile them rather than silently
choosing one representation.

## Verification

Run the checks relevant to the change:

```sh
npm run compile:lcm
npm run check:lcm
npm run check:samples
npm run lint
npm run build
```

- `compile:lcm` regenerates registered Core JSON fixture modules.
- `check:lcm` checks deterministic compilation and required semantics.
- `check:samples` type-checks TypeScript samples against the Core types.
- `lint` checks source style and common mistakes.
- `build` verifies the production application build.

Use `npm run check` to run the full project check suite.
