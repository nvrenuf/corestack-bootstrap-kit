#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log() {
  local level="$1"
  shift
  printf '[%s] [%s] %s\n' "$(timestamp)" "${level}" "$*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    log ERROR "Required command not found: ${cmd}"
    return 1
  fi
}

ensure_dir() {
  local dir="$1"
  if [[ ! -d "${dir}" ]]; then
    mkdir -p "${dir}"
    log INFO "Created directory: ${dir}"
  fi
}

backup_file() {
  local path="$1"
  if [[ -f "${path}" ]]; then
    local backup="${path}.bak.$(date +%Y%m%d%H%M%S)"
    cp "${path}" "${backup}"
    log WARN "Backed up ${path} -> ${backup}"
  fi
}

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

is_ubuntu() {
  [[ -f /etc/os-release ]] && grep -qi 'ubuntu' /etc/os-release
}
