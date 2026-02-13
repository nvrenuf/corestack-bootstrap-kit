#!/usr/bin/env bash
set -euo pipefail

if ! command -v shfmt >/dev/null 2>&1; then
  echo "shfmt not installed"
  exit 0
fi

find scripts tests -type f -name '*.sh' -print0 | xargs -0 shfmt -d -i 2 -ci
