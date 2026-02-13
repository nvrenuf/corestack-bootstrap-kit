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

{
  log INFO "Postcheck start bootstrap=${BOOTSTRAP}"

  if docker ps >/dev/null 2>&1; then
    log INFO "Docker daemon reachable"
    docker ps --format 'table {{.Names}}\t{{.Status}}'
  else
    log WARN "Docker daemon not reachable"
  fi

  if command -v ufw >/dev/null 2>&1; then
    run_sudo ufw status verbose || true
  else
    log WARN "ufw command not found"
  fi

  curl -ksSf https://localhost >/dev/null 2>&1 && log INFO "WebUI route reachable" || log WARN "WebUI route unreachable"
  curl -ksSf https://n8n.localhost >/dev/null 2>&1 && log INFO "n8n route reachable" || log WARN "n8n route unreachable"

  if command -v ollama >/dev/null 2>&1; then
    ollama list || log WARN "Unable to list ollama models"
  else
    log WARN "ollama CLI not found"
  fi

  log INFO "Postcheck complete"
} | tee "${REPORT_FILE}"

log INFO "Postcheck report written to ${REPORT_FILE}"
