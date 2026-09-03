# Language Creator Tool

Language Creator Tool (LCT) is a platform for creating, annotating, and viewing
structured language-learning content, especially for minority and heritage
languages.

## For content creators

- [Authoring LCM content](docs/workflow/authoring-lcm.md) — understand what
  compilation does, which authoring features are supported, and how to request
  an extension.
- [Opening an external content project](docs/workflow/open-external-content.md)
  — update LCT and open a folder of `.lcm` teaching materials.
- [Executable LCM cheat sheet](samples/markup/lcm-cheat-sheet.lcm) — copyable
  examples that are checked against the current compiler.

## For maintainers and contributors

- [Language Creator Tool workflow](docs/workflow.md)
- [Compiling LCM to Core JSON fixtures](docs/workflow/lcm-compiler.md)
- [LCM specification overview](docs/spec/lcm-overview.md)
- [Core JSON specification](docs/spec/core-json.md)

## Development

Requirements:

- Node.js 20.9.0 or newer

Install dependencies and run the development server:

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

Run the full project check suite with:

```sh
npm run check
```
