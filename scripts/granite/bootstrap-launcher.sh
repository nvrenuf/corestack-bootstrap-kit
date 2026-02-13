#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/deploy/compose/docker-compose.yml"

CHAT_MODEL="${CHAT_MODEL:-granite3.1-moe:3b-instruct-q4_K_M}"
FALLBACK_CHAT_MODEL="${FALLBACK_CHAT_MODEL:-mistral:7b}"
EMBEDDING_MODEL="${EMBEDDING_MODEL:-nomic-embed-text:v1.5}"
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://host.docker.internal:11434}"

export CHAT_MODEL EMBEDDING_MODEL OLLAMA_BASE_URL

wait_for_ollama() {
  local retries=60
  local delay_seconds=2
  local attempt

  for ((attempt=1; attempt<=retries; attempt++)); do
    if docker exec corestack-ollama ollama list >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay_seconds}"
  done

  echo "ERROR: Ollama did not become ready in time." >&2
  return 1
}

pull_chat_model_with_fallback() {
  if docker exec corestack-ollama ollama pull "${CHAT_MODEL}"; then
    return 0
  fi

  echo "WARN: Failed to pull CHAT_MODEL=${CHAT_MODEL}. Falling back to ${FALLBACK_CHAT_MODEL}."
  CHAT_MODEL="${FALLBACK_CHAT_MODEL}"
  export CHAT_MODEL
  docker exec corestack-ollama ollama pull "${CHAT_MODEL}"
}

main() {
  docker compose -f "${COMPOSE_FILE}" up -d ollama
  wait_for_ollama

  pull_chat_model_with_fallback
  docker exec corestack-ollama ollama pull "${EMBEDDING_MODEL}"

  docker compose -f "${COMPOSE_FILE}" up -d

  "${REPO_ROOT}/scripts/corestack-db-init.sh"

  cat <<EOF
Corestack stack is up.
- Launcher: http://localhost:8080
- Open WebUI: http://localhost:3000
- n8n: http://localhost:5678
- Ollama API tags: http://localhost:11434/api/tags
- Chat model: ${CHAT_MODEL}
- Embedding model: ${EMBEDDING_MODEL}
EOF
}

main "$@"
