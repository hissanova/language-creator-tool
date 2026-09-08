# Creator Getting Started

Start here if you create or edit `.lcm` teaching materials with Language
Creator Tool (LCT). These instructions assume that you can open a terminal,
copy and paste commands, and share terminal output when a command fails.

LCT currently supports this command-line workflow on Linux and macOS. A Windows
PowerShell launcher is not yet available.

## Before you start

You need:

- Git
- Node.js 20.9.0 or newer, including npm
- a folder for your teaching materials, kept outside the LCT repository

Check the installed tools in a terminal:

```sh
git --version
node --version
npm --version
```

If a command is not found, or the Node.js version is older than 20.9.0, stop and
ask a maintainer to help install or update the required tool.

## First-time setup

Choose a directory where LCT should be installed, open a terminal there, and
run:

```sh
git clone https://github.com/hissanova/language-creator-tool.git
cd language-creator-tool
./scripts/update.sh
```

The update command prepares LCT's dependencies as well as checking for the
latest stable code. A successful run ends with:

```text
Dependencies are ready.
Next: ./scripts/open-content.sh <project-folder>
```

Do not run `npm install` before or after this setup. The update command runs the
reproducible dependency installation itself.

If LCT is already installed, do not clone a second copy. Enter the existing LCT
directory and follow [Updating an existing installation](#updating-an-existing-installation).

## Open a teaching-materials project

From the LCT repository, pass exactly one teaching-materials folder to the
launcher:

```sh
./scripts/open-content.sh <project-folder>
```

For example:

```sh
./scripts/open-content.sh ../teaching-materials
./scripts/open-content.sh "/path/to/Teaching materials"
```

Both relative and absolute paths work. After validation, the terminal prints a
local URL to open in a browser. The project folder must contain at least one
discoverable file whose name ends in `.lcm`.

Press Ctrl-C in the terminal when you want to stop LCT.

## Updating an existing installation

Enter the LCT repository and run:

```sh
./scripts/update.sh
```

This updates LCT and prepares its dependencies. It does not update, delete, or
Git-manage the separate teaching-materials folder.

After a successful update, open the project as usual:

```sh
./scripts/open-content.sh <project-folder>
```

## Daily editing loop

1. Run `./scripts/open-content.sh <project-folder>` from the LCT repository.
2. Open the local URL printed in the terminal.
3. Edit an `.lcm` file in your editor and save it.
4. Reload the Viewer page. You do not need to restart the launcher after every
   edit.
5. Read the filename, line number, and message if compilation fails.
6. Press Ctrl-C in the terminal when finished.

See [Authoring LCM content](authoring-lcm.md) for supported syntax and the
[Executable LCM cheat sheet](../../samples/markup/lcm-cheat-sheet.lcm) for
copyable examples.

## If a command stops

Read the final error and its `Next` instruction. Do not try unrelated Git or
npm commands. See [Creator troubleshooting](creator-troubleshooting.md) for
plain-language explanations, safe next actions, and the output to send to a
maintainer.

For the project-folder rules and launcher details, see
[Opening an external content project](open-external-content.md).
