#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/common.sh"

MIN_RAM_MB="16000"
MIN_DISK_GB="40"

check_sudo() {
  if ! sudo -n true >/dev/null 2>&1; then
    log INFO "sudo may prompt for password during bootstrap."
  fi
}

check_resources() {
  local ram_mb
  ram_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
  if (( ram_mb < MIN_RAM_MB )); then
    log WARN "RAM below recommended minimum (${ram_mb}MB < ${MIN_RAM_MB}MB)."
  else
    log INFO "RAM check passed (${ram_mb}MB)."
  fi

  local avail_gb
  avail_gb="$(df -BG --output=avail / | tail -1 | tr -dc '0-9')"
  if (( avail_gb < MIN_DISK_GB )); then
    log WARN "Disk below recommended minimum (${avail_gb}GB < ${MIN_DISK_GB}GB)."
  else
    log INFO "Disk check passed (${avail_gb}GB available)."
  fi
}

check_network() {
  if curl -fsSLI https://registry-1.docker.io >/dev/null 2>&1; then
    log INFO "Network reachability check passed (Docker registry)."
  else
    log WARN "Unable to reach Docker registry; pulls may fail."
  fi
}

main() {
  log INFO "Starting preflight checks"
  if ! is_ubuntu; then
    log ERROR "Unsupported OS. This bootstrap targets Ubuntu."
    exit 1
  fi

  require_cmd awk
  require_cmd df
  require_cmd curl
  require_cmd sudo

  check_sudo
  check_resources
  check_network
  log INFO "Preflight checks completed"
}

main "$@"
