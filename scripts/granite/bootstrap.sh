#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

CORESTACK_HOME="${CORESTACK_HOME:-${HOME}/corestack}"
LOG_DIR="${CORESTACK_HOME}/logs"
INSTALL_LOG="${LOG_DIR}/install-$(date +%Y%m%d%H%M%S).log"
BUILD_DIR="${REPO_ROOT}/build/granite"
ENV_FILE="${CORESTACK_HOME}/corestack.env"
UNINSTALL_HELPER="${CORESTACK_HOME}/uninstall-granite.sh"

cleanup() {
  log INFO "Bootstrap completed with exit code $?"
}
trap cleanup EXIT

require_docker_runtime() {
  require_cmd docker

  if ! docker compose version >/dev/null 2>&1; then
    log ERROR "Docker Compose v2 is required. Install/enable Docker Compose and retry."
    return 1
  fi

  if ! docker info >/dev/null 2>&1; then
    log ERROR "Docker daemon is not reachable. Start Docker and retry."
    return 1
  fi
}

resolve_chat_model() {
  local default_chat_model="granite3.1-dense:8b-instruct-q4_K_M"
  local configured_chat_model="${CHAT_MODEL:-${default_chat_model}}"

  if [[ "${configured_chat_model}" == "nomic-embed-text:v1.5" ]]; then
    log WARN "Configured CHAT_MODEL=${configured_chat_model} is embeddings-only and cannot serve chat."
    configured_chat_model="${default_chat_model}"
    log INFO "Falling back CHAT_MODEL to ${configured_chat_model}"
  fi

  if docker ps --format '{{.Names}}' | grep -qx 'corestack-ollama'; then
    if docker exec corestack-ollama ollama list | awk '{print $1}' | grep -Fqx "${configured_chat_model}"; then
      log INFO "CHAT_MODEL is available in Ollama: ${configured_chat_model}"
    else
      log WARN "CHAT_MODEL not present in Ollama yet: ${configured_chat_model}"
    fi
  else
    log WARN "Skipping CHAT_MODEL presence check because corestack-ollama is not running."
  fi

  CHAT_MODEL="${configured_chat_model}"
  export CHAT_MODEL
}

load_pins() {
  local versions_file="${REPO_ROOT}/config/granite/versions.yaml"
  if command -v yq >/dev/null 2>&1; then
    CADDY_IMAGE="$(yq -r '.containers.caddy' "${versions_file}")"
    OLLAMA_IMAGE="$(yq -r '.containers.ollama' "${versions_file}")"
    OPEN_WEBUI_IMAGE="$(yq -r '.containers.open_webui' "${versions_file}")"
    QDRANT_IMAGE="$(yq -r '.containers.qdrant' "${versions_file}")"
    POSTGRES_IMAGE="$(yq -r '.containers.postgres' "${versions_file}")"
    N8N_IMAGE="$(yq -r '.containers.n8n' "${versions_file}")"
  else
    CADDY_IMAGE="$(awk -F'"' '/caddy:/ {print $2}' "${versions_file}")"
    OLLAMA_IMAGE="$(awk -F'"' '/ollama:/ {print $2}' "${versions_file}")"
    OPEN_WEBUI_IMAGE="$(awk -F'"' '/open_webui:/ {print $2}' "${versions_file}")"
    QDRANT_IMAGE="$(awk -F'"' '/qdrant:/ {print $2}' "${versions_file}")"
    POSTGRES_IMAGE="$(awk -F'"' '/postgres:/ {print $2}' "${versions_file}")"
    N8N_IMAGE="$(awk -F'"' '/n8n:/ {print $2}' "${versions_file}")"
  fi

  export CADDY_IMAGE OLLAMA_IMAGE OPEN_WEBUI_IMAGE QDRANT_IMAGE POSTGRES_IMAGE N8N_IMAGE
}

main() {
  ensure_dir "${CORESTACK_HOME}"
  ensure_dir "${LOG_DIR}"
  ensure_dir "${BUILD_DIR}"

  exec > >(tee -a "${INSTALL_LOG}") 2>&1
  log INFO "Starting Granite bootstrap"

  "${REPO_ROOT}/scripts/lib/preflight.sh"
  require_docker_runtime

  if [[ -f "${ENV_FILE}" ]]; then
    log INFO "Existing env file found; leaving unchanged: ${ENV_FILE}"
  else
    cp "${REPO_ROOT}/config/granite/corestack.env.template" "${ENV_FILE}"
    log INFO "Created env file from template: ${ENV_FILE}"
  fi

  install -m 0755 "${REPO_ROOT}/scripts/granite/uninstall.sh" "${UNINSTALL_HELPER}"
  log INFO "Installed uninstall helper: ${UNINSTALL_HELPER}"

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a

  if [[ "${WEBUI_PORT:-}" == "3000" ]]; then
    log WARN "Detected legacy WEBUI_PORT=3000 in ${ENV_FILE}; overriding to 8080 for Open WebUI compatibility."
    WEBUI_PORT=8080
    export WEBUI_PORT
  fi

  load_pins

  "${REPO_ROOT}/scripts/granite/render-compose.sh"

  cp "${REPO_ROOT}/templates/env/corestack.env.tmpl" "${BUILD_DIR}/corestack.env.rendered"
  envsubst < "${BUILD_DIR}/corestack.env.rendered" > "${BUILD_DIR}/corestack.env"

  docker compose --env-file "${ENV_FILE}" -f "${BUILD_DIR}/docker-compose.yml" up -d

  "${REPO_ROOT}/scripts/granite/pull-models.sh"
  resolve_chat_model
  "${REPO_ROOT}/scripts/granite/skill-scans.sh" "${CORESTACK_HOME}"
  CORESTACK_HOME="${CORESTACK_HOME}" "${REPO_ROOT}/scripts/lib/postcheck.sh" --bootstrap granite

  local webui_url="https://${PUBLIC_WEBUI_HOST:-localhost}"
  local n8n_url="https://${PUBLIC_N8N_HOST:-n8n.localhost}"

  log INFO "Granite bootstrap finished successfully"
  log INFO "Open WebUI: ${webui_url}"
  log INFO "n8n: ${n8n_url}"
  log INFO "Chat model: ${CHAT_MODEL}"
  log INFO "Embedding model only (not chat-capable): nomic-embed-text:v1.5"
  log INFO "Install log: ${INSTALL_LOG}"
}

main "$@"
