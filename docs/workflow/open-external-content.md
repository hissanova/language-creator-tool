# Opening an External Content Project

This workflow is intended for Simon's day-to-day editing of learning materials that live outside the Language Creator Tool (LCT) repository.

## First-time setup

Install Node.js 20.9.0 or newer and install the LCT dependencies once:

```sh
npm install
```

The launcher does not install Node.js or packages, select an `nvm` version, update LCT, or run Git commands.

## Daily command

From the LCT repository root, run exactly one project-folder argument:

```sh
./scripts/open-content.sh <project-folder>
```

Both relative and absolute paths work, including paths containing spaces:

```sh
./scripts/open-content.sh ../simon-materials
./scripts/open-content.sh "/path/to/Simon materials"
```

After validation, the command prints the local URL to open. Use the landing page to choose a document. Press Ctrl-C in the terminal to stop the Viewer and all of its child processes.

## MVP project-folder convention

- A project is an ordinary directory; it does not need a manifest or a Git repository.
- LCM documents are files whose names end in the case-sensitive extension `.lcm`.
- LCM discovery is recursive and sorted by project-relative path.
- Hidden directories (names beginning with `.`), `node_modules`, `build`, `coverage`, `dist`, and `out` are not scanned. Symbolic links are not followed during LCM discovery.
- A project must contain at least one discoverable `.lcm` file.
- A document's identity is its complete project-relative path, including `.lcm`. Therefore `unit-1/lesson.lcm` and `unit-2/lesson.lcm` do not collide and appear as separate entries. Two files cannot have the same complete relative path.
- `src` values for local audio, video, and image resources are POSIX-style paths relative to the project root, for example `media/audio/lesson-1.mp3`. Absolute paths and `..` traversal are rejected. HTTP(S), data, and blob URLs remain unchanged.
- Local resources must exist as files. A symbolic link may be served only when its resolved target remains inside the project root.

The launcher reads and serves the external project but never writes to it. It also does not copy external content into `samples/` or `app/contents/generated/` and creates no tracked runtime fixture.

## Editing loop

The initial command compiles every discovered LCM once to catch errors before starting the server. The document route then reads and compiles the selected `.lcm` again on every browser request. After editing an LCM file, reload its Viewer page; restarting the command is unnecessary.

Local resource URLs are rewritten in the in-memory Core JSON document to an LCT resource route. That route resolves the requested file against the configured project root, resolves symbolic links, rejects traversal or anything outside the root, and returns `Cache-Control: no-store` so reloading also fetches changed media.

Compiler errors include the project-relative LCM filename and the compiler's source location/message. They are printed in the terminal and shown on the landing or document page.

## Current limits

- This uses the compiler's existing MVP LCM subset; it is not the full LCM grammar.
- There is no project manifest, dictionary autoscan, editor, waveform, production deployment, GUI launcher, global CLI, or Windows PowerShell launcher.
- The local server binds to `127.0.0.1:3000` by default. For development or automated verification, `LCT_OPEN_CONTENT_PORT` may select another available port.
