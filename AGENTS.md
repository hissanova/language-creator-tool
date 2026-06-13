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
→ Display JSON
→ Viewer

### Source of Truth

Core JSON is the canonical internal representation.

* `docs/spec/` contains accepted specifications.
* `docs/rfc/` contains proposed changes.
* `samples/markup/` contains human-authored source examples.
* `samples/core-json/` contains expected Core JSON outputs.
* `samples/display-json/` contains expected display-oriented outputs (if applicable).
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
* Prefer additive changes over breaking changes.
* Keep samples synchronized with specifications.
* Document non-obvious design decisions in RFCs.

### Do Not

* Do not change Core JSON structures without updating samples.
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

## Display Pipeline

Display JSON is not the source of truth.

It is generated from:

- Core JSON
- `displayStyle.yaml`

`displayStyle.yaml` defines how annotations, speakers, translations, notes, and other content blocks should be presented in a specific viewer.

Core JSON defines what the content means.
Display Style defines how the content is shown.
Display JSON is the viewer-ready result of combining both.

## Samples are executable TypeScript fixtures.

Do not write canonical samples as plain JSON.
Use `.sample.ts` files with `satisfies` and import the corresponding type from `app/types`.