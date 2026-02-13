#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

CORESTACK_HOME="${CORESTACK_HOME:-${HOME}/corestack}"
BUILD_DIR="${REPO_ROOT}/build/granite"
ENV_FILE="${CORESTACK_HOME}/corestack.env"
COMPOSE_FILE="${BUILD_DIR}/docker-compose.yml"
DEPLOY_COMPOSE_FILE="${REPO_ROOT}/deploy/compose/docker-compose.yml"
DEPLOY_ENV_FILE="${REPO_ROOT}/deploy/compose/.env"
UNINSTALL_HELPER="${CORESTACK_HOME}/uninstall-granite.sh"
N8N_DATA_DIR="${REPO_ROOT}/n8n/data"

REMOVE_VOLUMES="false"
DELETE_HOME="false"
COMPOSE_ARGS=()

usage() {
  cat <<'EOF'
Usage: ./scripts/granite/uninstall.sh [options]

Options:
  --purge-data    Remove named volumes (including corestack-postgres-data) and purge local n8n artifacts under repo n8n/data.
  --remove-volumes Alias for --purge-data.
  --purge         Backward-compatible alias for --purge-data.
  --delete-home   Remove $CORESTACK_HOME after compose teardown.
  -h, --help      Show this help message.
EOF
}

require_docker_runtime() {
  require_cmd docker
  if ! docker compose version >/dev/null 2>&1; then
    log ERROR "Docker Compose v2 is required."
    return 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --purge-data|--remove-volumes|--purge)
        REMOVE_VOLUMES="true"
        shift
        ;;
      --delete-home)
        DELETE_HOME="true"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        log ERROR "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
  done
}

load_env_if_present() {
  if [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    set +a
  else
    log WARN "Env file not found at ${ENV_FILE}; using defaults for rendering."
  fi
}

ensure_compose_file() {
  if [[ -f "${COMPOSE_FILE}" ]]; then
    return 0
  fi
  log INFO "Compose file missing; rendering ${COMPOSE_FILE}"
  if ! "${REPO_ROOT}/scripts/granite/render-compose.sh"; then
    log WARN "Unable to render legacy compose file; continuing with launcher stack teardown only."
  fi
}

build_compose_args() {
  local compose_file="$1"
  local env_file="$2"
  COMPOSE_ARGS=(-f "${compose_file}")
  if [[ -f "${env_file}" ]]; then
    COMPOSE_ARGS=(--env-file "${env_file}" "${COMPOSE_ARGS[@]}")
  fi
}

teardown_compose_stack() {
  local stack_name="$1"
  local compose_file="$2"
  local env_file="$3"

  if [[ ! -f "${compose_file}" ]]; then
    log INFO "Skipping ${stack_name}; compose file not found: ${compose_file}"
    return 0
  fi

  build_compose_args "${compose_file}" "${env_file}"
  if [[ "${REMOVE_VOLUMES}" == "true" ]]; then
    log WARN "Purging ${stack_name}: containers, networks, and named volumes."
    docker compose "${COMPOSE_ARGS[@]}" down -v --remove-orphans || true
  else
    log INFO "Stopping ${stack_name}: containers and networks (volumes preserved)."
    docker compose "${COMPOSE_ARGS[@]}" down --remove-orphans || true
  fi
}

main() {
  parse_args "$@"
  require_docker_runtime
  load_env_if_present
  ensure_compose_file

  teardown_compose_stack "launcher stack" "${DEPLOY_COMPOSE_FILE}" "${DEPLOY_ENV_FILE}"
  teardown_compose_stack "legacy granite stack" "${COMPOSE_FILE}" "${ENV_FILE}"

  if [[ "${REMOVE_VOLUMES}" == "false" ]]; then
    log INFO "Data volumes were preserved (including corestack-postgres-data)."
    log INFO "Use --purge-data to remove all stack volumes and delete Postgres data."
  else
    log WARN "Data volumes were removed, including corestack-postgres-data."
  fi

  if [[ -d "${BUILD_DIR}" ]]; then
    rm -rf "${BUILD_DIR}"
    log INFO "Removed generated build directory: ${BUILD_DIR}"
  fi

  if [[ -f "${UNINSTALL_HELPER}" ]]; then
    rm -f "${UNINSTALL_HELPER}"
    log INFO "Removed uninstall helper: ${UNINSTALL_HELPER}"
  fi

  if [[ "${REMOVE_VOLUMES}" == "true" && -d "${N8N_DATA_DIR}" ]]; then
    find "${N8N_DATA_DIR}" -mindepth 1 ! -name '.gitkeep' -exec rm -rf {} +
    log INFO "Purged local n8n artifacts under ${N8N_DATA_DIR} (kept .gitkeep)."
  fi

  if [[ "${DELETE_HOME}" == "true" && -d "${CORESTACK_HOME}" ]]; then
    rm -rf "${CORESTACK_HOME}"
    log INFO "Removed runtime directory: ${CORESTACK_HOME}"
  fi

  log INFO "Granite uninstall complete (launcher stack + legacy stack teardown finished)"
}

main "$@"
