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

cleanup() {
  log INFO "Bootstrap completed with exit code $?"
}
trap cleanup EXIT

install_deps() {
  run_sudo apt-get update -y
  local packages=(curl ca-certificates gnupg lsb-release gettext-base jq)
  for pkg in "${packages[@]}"; do
    if ! dpkg -s "${pkg}" >/dev/null 2>&1; then
      run_sudo apt-get install -y "${pkg}"
    fi
  done

  if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | run_sudo sh
  fi

  run_sudo systemctl enable --now docker
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
  install_deps
  "${REPO_ROOT}/scripts/granite/hardening.sh"

  if [[ -f "${ENV_FILE}" ]]; then
    log INFO "Existing env file found; leaving unchanged: ${ENV_FILE}"
  else
    cp "${REPO_ROOT}/config/granite/corestack.env.template" "${ENV_FILE}"
    log INFO "Created env file from template: ${ENV_FILE}"
  fi

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a

  load_pins

  "${REPO_ROOT}/scripts/granite/render-compose.sh"

  cp "${REPO_ROOT}/templates/env/corestack.env.tmpl" "${BUILD_DIR}/corestack.env.rendered"
  envsubst < "${BUILD_DIR}/corestack.env.rendered" > "${BUILD_DIR}/corestack.env"

  docker compose --env-file "${ENV_FILE}" -f "${BUILD_DIR}/docker-compose.yml" up -d

  "${REPO_ROOT}/scripts/granite/pull-models.sh"
  "${REPO_ROOT}/scripts/granite/skill-scans.sh" "${CORESTACK_HOME}"
  CORESTACK_HOME="${CORESTACK_HOME}" "${REPO_ROOT}/scripts/lib/postcheck.sh" --bootstrap granite

  log INFO "Granite bootstrap finished successfully"
  log INFO "Install log: ${INSTALL_LOG}"
}

main "$@"
