#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/db/migrations"
ENV_FILE="${REPO_ROOT}/deploy/compose/.env"
ENV_EXAMPLE_FILE="${REPO_ROOT}/deploy/compose/.env.example"

POSTGRES_CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-corestack-postgres}"
POSTGRES_USER="${POSTGRES_USER:-corestack}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-change_me}"
POSTGRES_DB="${POSTGRES_DB:-corestack}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source "${ENV_FILE}"
  set +a
elif [[ -f "${ENV_EXAMPLE_FILE}" ]]; then
  set -a
  source "${ENV_EXAMPLE_FILE}"
  set +a
fi

wait_for_postgres() {
  local retries=60
  local delay_seconds=2
  local i

  for ((i=1; i<=retries; i++)); do
    if docker exec "${POSTGRES_CONTAINER_NAME}" pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay_seconds}"
  done

  echo "ERROR: Postgres did not become ready in time (${POSTGRES_CONTAINER_NAME})." >&2
  return 1
}

migration_applied() {
  local version="$1"
  docker exec "${POSTGRES_CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc \
    "SELECT CASE WHEN to_regclass('core.schema_migrations') IS NULL THEN 0 WHEN EXISTS (SELECT 1 FROM core.schema_migrations WHERE version = '${version}') THEN 1 ELSE 0 END;" \
    | tr -d '[:space:]'
}

apply_migration() {
  local migration_file="$1"
  local version
  version="$(basename "${migration_file}" .sql)"

  if [[ "$(migration_applied "${version}")" == "1" ]]; then
    echo "Skipping already applied migration: ${version}"
    return 0
  fi

  echo "Applying migration: ${version}"
  docker exec -i "${POSTGRES_CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${migration_file}"
  docker exec "${POSTGRES_CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c \
    "INSERT INTO core.schema_migrations(version) VALUES ('${version}') ON CONFLICT (version) DO NOTHING;" >/dev/null
}

main() {
  if [[ ! -d "${MIGRATIONS_DIR}" ]]; then
    echo "ERROR: Migrations directory not found: ${MIGRATIONS_DIR}" >&2
    exit 1
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker is required" >&2
    exit 1
  fi

  if ! docker ps --format '{{.Names}}' | grep -qx "${POSTGRES_CONTAINER_NAME}"; then
    echo "ERROR: Postgres container is not running: ${POSTGRES_CONTAINER_NAME}" >&2
    echo "Start stack first: docker compose --env-file deploy/compose/.env -f deploy/compose/docker-compose.yml up -d" >&2
    exit 1
  fi

  wait_for_postgres

  shopt -s nullglob
  local migration_files=("${MIGRATIONS_DIR}"/*.sql)
  shopt -u nullglob

  if [[ ${#migration_files[@]} -eq 0 ]]; then
    echo "No migration files found in ${MIGRATIONS_DIR}" >&2
    exit 1
  fi

  IFS=$'\n' migration_files=($(printf '%s\n' "${migration_files[@]}" | sort))

  for migration in "${migration_files[@]}"; do
    apply_migration "${migration}"
  done

  echo "Corestack DB migrations applied successfully."
}

main "$@"
