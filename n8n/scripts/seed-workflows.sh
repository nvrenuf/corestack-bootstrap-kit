#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_DIR="${1:-n8n/workflows}"

if [[ ! -d "${WORKFLOW_DIR}" ]]; then
  echo "Workflow directory not found: ${WORKFLOW_DIR}" >&2
  exit 1
fi

echo "Corestack n8n workflow files:"
find "${WORKFLOW_DIR}" -maxdepth 1 -type f -name '*.json' | sort

echo
echo "Manual import steps:"
echo "1) Open http://localhost:5678"
echo "2) Import files from ${WORKFLOW_DIR} in numeric order"
echo "3) Review placeholders and activate"
