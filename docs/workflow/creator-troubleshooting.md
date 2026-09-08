# Creator Troubleshooting

Use this page when a command from
[Creator Getting Started](creator-getting-started.md) stops. These instructions
assume that you can copy and paste terminal commands, but they do not require
you to diagnose Git, npm, or LCT internals.

## First rule: keep the complete output

Read the final error and any `Next` instruction. Unless that instruction names
a command to run:

1. do not delete, restore, move, or rename files
2. do not run `npm install`, `git reset`, or another guessed workaround
3. copy the complete terminal output or take a screenshot
4. send it to a maintainer

LCT's updater stops before discarding local changes. It does not modify the
separate teaching-materials folder.

## `git`, `node`, or `npm`: command not found

**Meaning:** A required tool is missing or is not available in this terminal.

**Teaching materials:** Safe. LCT has not opened them.

**Next action:** Copy and run these checks, then send all output to a
maintainer:

```sh
git --version
node --version
npm --version
```

Stop here if any command is not found. Do not install a similarly named npm
package as a workaround.

## Node.js version is not supported

**Meaning:** The installed Node.js is older than the version required by LCT.

**Teaching materials:** Safe.

**Next action:** Run the following command and send its output to a maintainer:

```sh
node --version
```

A maintainer can help update Node.js. Run `./scripts/update.sh` again after the
supported version is available.

## `./scripts/update.sh`: no such file or directory

**Meaning:** The terminal may not be in the LCT repository, or the installed
copy may be too old to contain the updater.

**Teaching materials:** Safe.

**Next action:** Copy and run:

```sh
pwd
ls
```

Send the output to a maintainer. Do not run `git pull` from an unknown
directory.

## The updater reports local changes

**Meaning:** A file inside the LCT repository differs from the stable version.
The updater stopped so that it would not discard anything.

**Teaching materials:** Safe when they are stored outside the LCT repository.

**Next action:** Send the complete `Update stopped` message to a maintainer.
Do not decide which files to restore, and do not run `npm install` or remove a
lockfile manually.

## Dependency installation failed

**Meaning:** LCT could not prepare its internal Node.js dependencies. This can
be caused by a Node.js/npm mismatch, a network problem, or a package error.

**Teaching materials:** Safe. Dependency installation runs inside the LCT
repository.

**Next action:** Follow the exact `Next` instruction printed by the updater. If
the same command fails again, send the complete output to a maintainer instead
of trying another npm command.

## The content folder is missing or has no `.lcm` files

**Meaning:** The launcher could not find the folder, or the folder contains no
discoverable file whose name ends in the case-sensitive extension `.lcm`.

**Teaching materials:** Safe. The launcher reads the project but does not write
to it.

**Next action:** Check the folder path and run the launcher again. Put quotation
marks around a path containing spaces:

```sh
./scripts/open-content.sh "/path/to/Teaching materials"
```

If the folder exists and contains `.lcm` files but still fails, send the full
terminal output to a maintainer.

## LCM compilation failed

**Meaning:** The compiler found unsupported or invalid content. The error
includes the project-relative filename and source location.

**Teaching materials:** Safe. Compilation reads the file and does not rewrite
it.

**Next action:** Correct the indicated `.lcm` line if the message is clear, then
reload the Viewer. Otherwise send the filename, line number, message, and the
small relevant excerpt to a maintainer.

## The Viewer did not start

**Meaning:** Startup failed, or another process may already be using the local
port.

**Teaching materials:** Safe.

**Next action:** Press Ctrl-C once, then run the normal launcher command once
more. If it still fails, send the complete output to a maintainer.

```sh
./scripts/open-content.sh <project-folder>
```

Do not start several copies of the launcher at the same time.
