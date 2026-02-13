#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

CORESTACK_HOME="${CORESTACK_HOME:-${HOME}/corestack}"
BUILD_DIR="${REPO_ROOT}/build/granite"
ENV_FILE="${CORESTACK_HOME}/corestack.env"
COMPOSE_FILE="${BUILD_DIR}/docker-compose.yml"

PURGE_VOLUMES="false"
DELETE_HOME="false"
COMPOSE_ARGS=()

usage() {
  cat <<'EOF'
Usage: ./scripts/granite/uninstall.sh [options]

Options:
  --purge         Remove named volumes (deletes Postgres/Qdrant/Ollama data).
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
      --purge)
        PURGE_VOLUMES="true"
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
  "${REPO_ROOT}/scripts/granite/render-compose.sh"
}

build_compose_args() {
  COMPOSE_ARGS=(-f "${COMPOSE_FILE}")
  if [[ -f "${ENV_FILE}" ]]; then
    COMPOSE_ARGS=(--env-file "${ENV_FILE}" "${COMPOSE_ARGS[@]}")
  fi
}

main() {
  parse_args "$@"
  require_docker_runtime
  load_env_if_present
  ensure_compose_file
  build_compose_args

  if [[ "${PURGE_VOLUMES}" == "true" ]]; then
    log WARN "Purging containers, networks, and named volumes."
    docker compose "${COMPOSE_ARGS[@]}" down -v --remove-orphans || true
  else
    log INFO "Stopping and removing containers and networks (volumes preserved)."
    docker compose "${COMPOSE_ARGS[@]}" down --remove-orphans || true
  fi

  if [[ -d "${BUILD_DIR}" ]]; then
    rm -rf "${BUILD_DIR}"
    log INFO "Removed generated build directory: ${BUILD_DIR}"
  fi

  if [[ "${DELETE_HOME}" == "true" && -d "${CORESTACK_HOME}" ]]; then
    rm -rf "${CORESTACK_HOME}"
    log INFO "Removed runtime directory: ${CORESTACK_HOME}"
  fi

  log INFO "Granite uninstall complete"
}

main "$@"
