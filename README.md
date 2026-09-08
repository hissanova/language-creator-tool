# Language Creator Tool

Language Creator Tool (LCT) is a platform for creating, annotating, and viewing
structured language-learning content, especially for minority and heritage
languages.

## For content creators

- **[New to LCT? Start here](docs/workflow/creator-getting-started.md)** — complete
  the first-time setup, update LCT, and open a teaching-materials folder using
  copyable terminal commands.
- [Authoring LCM content](docs/workflow/authoring-lcm.md) — understand what
  compilation does, which authoring features are supported, and how to request
  an extension.
- [Opening an external content project](docs/workflow/open-external-content.md)
  — understand the launcher and project-folder rules in detail.
- [Creator troubleshooting](docs/workflow/creator-troubleshooting.md) — understand
  common terminal errors, what is safe, and what output to send to a maintainer.
- [Executable LCM cheat sheet](samples/markup/lcm-cheat-sheet.lcm) — copyable
  examples that are checked against the current compiler.

## For maintainers and contributors

- [Language Creator Tool workflow](docs/workflow.md) — current architecture,
  change paths, sources of truth, and documentation ownership.
- [Compiling LCM to Core JSON fixtures](docs/workflow/lcm-compiler.md) — compiler
  commands, registered fixtures, generated-file policy, and verification.
- [Samples](samples/README.md) — current sample directories and the distinction
  between generated and hand-written fixtures.
- [Specification index](docs/spec/README.md) — Core JSON, LCM, Viewer
  configuration, and the status of legacy proposals.
- [Repository instructions](AGENTS.md) — contribution rules that apply to all
  changes in this repository.

## Development

Requirements:

- Node.js 20.9.0 or newer

Install dependencies and run the development server:

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>.

Run the full project check suite with:

```sh
npm run check
```
