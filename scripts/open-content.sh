#!/bin/sh

SCRIPT_DIR=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1

if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' "open-content: Node.js >=20.9.0 is required. Install Node.js, then run npm install." >&2
  exit 1
fi

exec node "$SCRIPT_DIR/open-content.mjs" "$@"
