#!/usr/bin/env bash
set -euo pipefail

if ! command -v yamllint >/dev/null 2>&1; then
  echo "yamllint not installed"
  exit 0
fi

yamllint config
