#!/usr/bin/env bash
set -euo pipefail

print_docker_socket_help() {
  cat <<'EOF'
Docker/Testcontainers connectivity issue detected.
Run these checks:
  ls -l /var/run/docker.sock
  ls -l "$HOME/.docker/run/docker.sock"
  docker context ls
  docker ps
If Docker Desktop is not running, start Docker Desktop and retry.
EOF
}

if [[ ! -f pyproject.toml || ! -d tests ]]; then
  echo "Run this from the pack root directory."
  echo "cd /Users/leecuevas/Projects/corestack-bootstrap-kit/packs/fear-signal-radar"
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI not found. Install Docker Desktop and retry."
  exit 2
fi

ORIGINAL_DOCKER_HOST="${DOCKER_HOST-}"
unset DOCKER_HOST

if docker ps >/dev/null 2>&1; then
  echo "Docker reachable via context; DOCKER_HOST not required"
else
  if [[ -S /var/run/docker.sock ]]; then
    export DOCKER_HOST="unix:///var/run/docker.sock"
  elif [[ -S "$HOME/.docker/run/docker.sock" ]]; then
    export DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"
  fi

  echo "Using DOCKER_HOST=${DOCKER_HOST:-<default>}"
  if ! docker ps >/dev/null 2>&1; then
    if [[ -n "$ORIGINAL_DOCKER_HOST" ]]; then
      echo "Original DOCKER_HOST was: $ORIGINAL_DOCKER_HOST"
    fi
    echo "Start Docker Desktop"
    print_docker_socket_help
    exit 2
  fi
fi

status=0

schema_out="$(mktemp)"
if ! python -m pytest -q tests/test_db_schema.py >"$schema_out" 2>&1; then
  if rg -q "DockerException|PermissionError|Connection aborted|/var/run/docker.sock|\.docker/run/docker\.sock" "$schema_out"; then
    cat "$schema_out"
    print_docker_socket_help
    rm -f "$schema_out"
    exit 2
  fi

  cat "$schema_out"
  rm -f "$schema_out"
  echo "FSRA TESTS: RED"
  exit 1
fi
cat "$schema_out"
rm -f "$schema_out"

if ! python -m pytest -q tests/test_db_permissions.py; then
  status=1
fi

if ! python -m pytest -q tests/test_ingest_api_auth.py; then
  status=1
fi

if ! python -m pytest -q; then
  status=1
fi

if [[ $status -eq 0 ]]; then
  echo "FSRA TESTS: GREEN"
  exit 0
fi

echo "FSRA TESTS: RED"
exit 1
