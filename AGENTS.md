<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Language Creator Tool Development Rules

## Project Purpose

Language Creator Tool (LCT) is a platform for creating, annotating, and viewing structured language-learning content, especially for minority and heritage languages.

---

## Architecture

### Data Flow

Markup
→ Core JSON
→ Viewer

Optional Viewer configuration may be applied at render time, but do not introduce Viewer JSON or Display JSON unless the project explicitly re-adopts that layer.

### Source of Truth

Core JSON is the canonical internal representation.

* `docs/spec/` contains accepted specifications.
* `docs/rfc/` contains proposed changes.
* `samples/markup/` contains human-authored source examples.
* `samples/core-json/` contains expected Core JSON outputs.
* `app/types/` must remain consistent with `docs/spec/core-json.md`.

---

## Design Goals

* Language independent
* Annotation independent
* Mobile friendly
* Extensible
* Human-readable authoring format
* Long-term backward compatibility when practical

---

## Development Workflow

### Specification Changes

When introducing or modifying a data structure:

1. Create or update an RFC.
2. Add a minimal markup sample.
3. Add the expected Core JSON output.
4. Update TypeScript types.
5. Update parser and transformation logic.
6. Update viewer implementation.
7. Verify samples render correctly.
8. Update accepted specifications after implementation is working.

Recommended workflow:

RFC
→ Sample
→ Expected JSON
→ TypeScript Types
→ Parser
→ Viewer
→ Specification

---

## Rules

### Do

* Keep Core JSON as the primary internal model.
* Render viewers from Core JSON plus optional Viewer configuration.
* Preserve section order with `blocks[]`; keep `lines[]` only as a deprecated migration fallback.
* Prefer additive changes over breaking changes.
* Keep samples synchronized with specifications.
* Document non-obvious design decisions in RFCs.

### Do Not

* Do not change Core JSON structures without updating samples.
* Do not introduce Viewer JSON, Display JSON, or another intermediate viewer model unless explicitly requested.
* Do not silently rename fields.
* Do not mix experimental content into production sample data.
* Do not update accepted specifications before implementation has been validated.
* Do not rely on outdated framework assumptions; verify against current project dependencies when necessary.

---

## Decision Hierarchy

When conflicts arise, follow this order:

1. Accepted Specification (`docs/spec`)
2. Accepted RFCs
3. Sample Core JSON
4. TypeScript Types
5. Viewer Implementation

The implementation should follow the specification, not the other way around.

## Viewer Configuration

Core JSON is rendered directly by the viewer.

The current viewer direction is:

- Core JSON
- optional Viewer configuration
- Viewer

Viewer configuration may define how annotations, speakers, translations, notes, and other content blocks are presented in a specific viewer.

Core JSON defines what the content means.
Viewer configuration defines how the content is shown.

Do not add a Viewer JSON or Display JSON layer for the current universal/debug viewer.

### Viewer Architecture Boundaries

Inside the Viewer, dependencies must flow in this direction:

```text
Core JSON semantics
  -> mode-specific composition or model
  -> generic presentation props
  -> shared rendering components
```

Domain information may select a presentation, but a generic renderer must not know why that presentation was selected.

#### Shared Rendering Components

Shared layout, row, and frame components consume already-resolved presentation data. When generic props are sufficient, they must not import Core domain types, resolve Core refs, or interpret Core metadata. Do not pass speaker, annotation, resource, document-type, or other domain concepts into a shared component unless it directly renders that concept. Do not add domain-specific DOM attributes solely to support tests.

For example, `ScriptLineFrame` may receive a background, border, active state, and generic slots. It must not receive `speakerId` merely because speaker metadata determined its colors.

#### Composition and Model Layer

Mode-specific compositions, models, and dedicated resolvers own:

* interpreting Core JSON refs
* resolving speaker, annotation, resource, and document-type semantics
* converting domain semantics into generic view models or presentation props
* adapting domain-specific inputs for shared renderers

A domain-specific resolver may return generic output:

```text
speaker metadata
  -> resolveSpeakerLinePresentation
  -> ScriptLinePresentation
```

#### Shared Shells

Shared shells such as `ViewerShell` coordinate document traversal, shared state, and composition selection. Do not add domain-specific presentation policy to a shared shell by default when a mode-specific composition, model, or dedicated resolver can own it.

#### Content Independence

Application code and application defaults must not depend on IDs or values taken from a particular sample or external teaching material. Sample fixtures may use actual speaker IDs and other realistic content values, but shared application code and defaults must work with arbitrary content. Concrete cleanup of existing content-specific style defaults is tracked in #42.

#### Viewer Implementation Pre-check

Before editing Viewer code, identify:

1. which layer owns the requested behaviour
2. whether a new prop, import, resolver, or DOM attribute leaks a domain concept into a shared layer
3. whether a domain-specific input can produce a generic output
4. which existing behaviour must remain unchanged
5. whether the task requires a separate schema or terminology decision

If the request appears to require breaking the documented dependency direction, stop before implementing and explain the trade-off for confirmation.

#### Scope Control

* Do not introduce a new Core concept merely to generalize one Viewer feature.
* Do not rename `ScriptLine`, `TextLine`, or other established terms unless the Issue explicitly includes terminology work.
* Choose the smallest change that preserves the documented dependency direction.
* Record broader design questions in the relevant Issue instead of silently expanding the PR.

This section governs Viewer-internal dependencies. Core-versus-Viewer type ownership is a separate concern tracked in #11.

## Samples are executable TypeScript fixtures.

Do not write canonical samples as plain JSON.
Use TypeScript fixture files with `satisfies` and import the corresponding type from `app/types`.

## Generated Core JSON fixtures

Generated Core JSON fixture files should use explicit `: Document` annotations rather than `satisfies Document`.

Use:

```ts
export const sampleGenerated: Document = { ... };
```
Do not use:

```ts
export const sampleGenerated = { ... } satisfies Document;
```

This avoids overly narrow nested object inference for generated selectorRecord and selections.
