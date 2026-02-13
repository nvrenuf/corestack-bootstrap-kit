#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${N8N_CONTAINER_NAME:-corestack-n8n}"
WORKFLOW_MOUNT_PATH="${N8N_WORKFLOW_MOUNT_PATH:-/opt/corestack/n8n/workflows}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "n8n container is not running: ${CONTAINER_NAME}" >&2
  echo "Start stack first: docker compose -f deploy/compose/docker-compose.yml up -d" >&2
  exit 1
fi

files=()
while IFS= read -r file; do
  files+=("${file}")
done < <(docker exec "${CONTAINER_NAME}" sh -lc "ls -1 ${WORKFLOW_MOUNT_PATH}/*.json 2>/dev/null | sort")

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No workflow JSON files found at ${WORKFLOW_MOUNT_PATH}" >&2
  exit 1
fi

echo "Importing ${#files[@]} workflow files into ${CONTAINER_NAME}..."
for file in "${files[@]}"; do
  base="$(basename "${file}")"
  echo "- ${base}"
  docker exec "${CONTAINER_NAME}" n8n import:workflow --input="${file}" >/dev/null
done

echo "Done. Review and activate workflows in http://localhost:5678"
echo "Note: re-importing can create duplicate workflows; clean old copies if needed."
