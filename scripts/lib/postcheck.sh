#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/common.sh"

BOOTSTRAP="granite"
STACK_DIR="${CORESTACK_HOME:-${HOME}/corestack}"
REPORT_FILE="${STACK_DIR}/logs/postcheck-$(date +%Y%m%d%H%M%S).log"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bootstrap)
      BOOTSTRAP="$2"
      shift 2
      ;;
    *)
      log ERROR "Unknown argument: $1"
      exit 1
      ;;
  esac
done

ensure_dir "${STACK_DIR}/logs"

probe_url() {
  local url="$1"
  local attempts="${2:-15}"
  local sleep_seconds="${3:-2}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    if curl -ksSf "${url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${sleep_seconds}"
  done
  return 1
}

{
  log INFO "Postcheck start bootstrap=${BOOTSTRAP}"

  if run_sudo docker ps >/dev/null 2>&1; then
    log INFO "Docker daemon reachable"
    run_sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
  else
    log WARN "Docker daemon not reachable"
  fi

  if command -v ufw >/dev/null 2>&1; then
    run_sudo ufw status verbose || true
  else
    log WARN "ufw command not found"
  fi

  probe_url "https://localhost" && log INFO "WebUI route reachable" || log WARN "WebUI route unreachable"
  probe_url "https://n8n.localhost" && log INFO "n8n route reachable" || log WARN "n8n route unreachable"

  if run_sudo docker ps --format '{{.Names}}' | grep -qx 'corestack-ollama'; then
    run_sudo docker exec corestack-ollama ollama list || log WARN "Unable to list ollama models from container"
  elif command -v ollama >/dev/null 2>&1; then
    ollama list || log WARN "Unable to list ollama models"
  else
    log WARN "ollama CLI not found and corestack-ollama container not running"
  fi

  log INFO "Postcheck complete"
} | tee "${REPORT_FILE}"

log INFO "Postcheck report written to ${REPORT_FILE}"
