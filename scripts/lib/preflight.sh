#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/common.sh"

MIN_RAM_MB="16000"
MIN_DISK_GB="40"

detect_os() {
  case "$(uname -s)" in
    Linux)
      if is_ubuntu; then
        echo "ubuntu"
      else
        echo "linux"
      fi
      ;;
    Darwin)
      echo "macos"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

check_sudo() {
  if ! command -v sudo >/dev/null 2>&1; then
    log WARN "sudo command not found."
    return 0
  fi
  if ! sudo -n true >/dev/null 2>&1; then
    log INFO "sudo may prompt for password during bootstrap."
  fi
}

check_resources() {
  local ram_mb
  case "${OS_FAMILY}" in
    ubuntu|linux)
      ram_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
      ;;
    macos)
      ram_mb="$(($(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024))"
      ;;
    *)
      ram_mb=0
      ;;
  esac

  if (( ram_mb == 0 )); then
    log WARN "Unable to determine total RAM on this host."
  elif (( ram_mb < MIN_RAM_MB )); then
    log WARN "RAM below recommended minimum (${ram_mb}MB < ${MIN_RAM_MB}MB)."
  else
    log INFO "RAM check passed (${ram_mb}MB)."
  fi

  local avail_gb
  case "${OS_FAMILY}" in
    ubuntu|linux)
      avail_gb="$(df -BG --output=avail / | tail -1 | tr -dc '0-9')"
      ;;
    macos)
      avail_gb="$(df -g / | awk 'NR==2 {print $4}' | tr -dc '0-9')"
      ;;
    *)
      avail_gb=0
      ;;
  esac

  if (( avail_gb == 0 )); then
    log WARN "Unable to determine available disk on this host."
  elif (( avail_gb < MIN_DISK_GB )); then
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

check_container_runtime() {
  if ! command -v docker >/dev/null 2>&1; then
    log WARN "Docker CLI not found. Bootstrap requires Docker."
    return 0
  fi

  if ! docker compose version >/dev/null 2>&1; then
    log WARN "Docker Compose v2 not detected. Bootstrap requires Docker Compose."
    return 0
  fi

  if docker info >/dev/null 2>&1; then
    log INFO "Docker daemon reachable."
  else
    log WARN "Docker daemon not reachable. Start Docker before bootstrap."
  fi
}

main() {
  log INFO "Starting preflight checks"
  OS_FAMILY="$(detect_os)"
  case "${OS_FAMILY}" in
    ubuntu)
      log INFO "Detected OS: Ubuntu"
      ;;
    linux)
      log WARN "Detected OS: non-Ubuntu Linux. Proceeding with Docker-only preflight."
      ;;
    macos)
      log INFO "Detected OS: macOS"
      ;;
    *)
      log WARN "Detected OS: unsupported/unknown. Proceeding with best-effort checks."
      ;;
  esac

  require_cmd awk
  require_cmd df
  require_cmd curl

  check_sudo
  check_resources
  check_network
  check_container_runtime
  log INFO "Preflight checks completed"
}

main "$@"
