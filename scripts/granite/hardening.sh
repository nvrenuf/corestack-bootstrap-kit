#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/../lib/common.sh"

install_pkg_if_missing() {
  local pkg="$1"
  if dpkg -s "${pkg}" >/dev/null 2>&1; then
    log INFO "Package already installed: ${pkg}"
  else
    log INFO "Installing package: ${pkg}"
    run_sudo apt-get install -y "${pkg}"
  fi
}

main() {
  run_sudo apt-get update -y

  install_pkg_if_missing ufw
  install_pkg_if_missing unattended-upgrades
  install_pkg_if_missing chrony

  run_sudo systemctl enable --now chrony
  run_sudo dpkg-reconfigure -f noninteractive unattended-upgrades

  run_sudo ufw default deny incoming
  run_sudo ufw default allow outgoing
  run_sudo ufw allow 22/tcp
  run_sudo ufw allow 80/tcp
  run_sudo ufw allow 443/tcp
  run_sudo ufw --force enable

  log INFO "Hardening complete"
}

main "$@"
