#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

require_cmd ollama

models=(
  "granite3.1-dense:8b-instruct-q4_K_M"
  "granite3.1-moe:3b-instruct-q4_K_M"
  "nomic-embed-text:v1.5"
)

for model in "${models[@]}"; do
  if ollama list | awk '{print $1}' | rg -qx "${model}"; then
    log INFO "Model already present, skipping: ${model}"
  else
    log INFO "Pulling model: ${model}"
    ollama pull "${model}"
  fi
done
