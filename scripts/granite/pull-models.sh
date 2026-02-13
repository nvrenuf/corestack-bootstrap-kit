#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

require_cmd docker

run_ollama() {
  docker exec corestack-ollama ollama "$@"
}

wait_for_ollama() {
  local retries=60
  local delay_seconds=2
  local attempt

  for ((attempt=1; attempt<=retries; attempt++)); do
    if run_ollama list >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay_seconds}"
  done

  log ERROR "Ollama in container did not become ready in time."
  return 1
}

models=(
  "granite3.1-dense:8b-instruct-q4_K_M"
  "granite3.1-moe:3b-instruct-q4_K_M"
  "nomic-embed-text:v1.5"
)

wait_for_ollama

for model in "${models[@]}"; do
  if run_ollama list | awk '{print $1}' | grep -Fqx "${model}"; then
    log INFO "Model already present, skipping: ${model}"
  else
    log INFO "Pulling model: ${model}"
    run_ollama pull "${model}"
  fi
done
