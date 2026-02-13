#!/usr/bin/env bash
set -euo pipefail

if ! command -v shellcheck >/dev/null 2>&1; then
  echo "shellcheck not installed"
  exit 0
fi

find scripts tests -type f -name '*.sh' -print0 | xargs -0 shellcheck
