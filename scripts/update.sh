#!/bin/sh

SCRIPT_DIR=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1
REPOSITORY_ROOT=$(CDPATH= cd -P "$SCRIPT_DIR/.." && pwd) || exit 1

if [ "$#" -ne 0 ]; then
  printf '%s\n' "Update stopped: this command does not accept arguments." >&2
  printf '%s\n' "Run: ./scripts/update.sh" >&2
  printf '%s\n' "No files were changed." >&2
  exit 1
fi

for command_name in git node npm; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf '%s\n' "Update stopped: required command '$command_name' was not found." >&2
    printf '%s\n' "Install $command_name, then run: ./scripts/update.sh" >&2
    printf '%s\n' "No files were changed." >&2
    exit 1
  fi
done

exec node "$SCRIPT_DIR/update.mjs" "$REPOSITORY_ROOT"
