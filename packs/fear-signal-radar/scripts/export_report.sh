#!/usr/bin/env bash
set -euo pipefail

TOPIC_ID="${1:-}"
RUN_ID="${2:-}"
PACK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_BASE="${FSRA_OUTPUT_BASE:-${PACK_ROOT}/outputs}"

if [[ -z "${TOPIC_ID}" || -z "${RUN_ID}" ]]; then
  echo "Usage: scripts/export_report.sh <TOPIC_ID> <RUN_ID>" >&2
  exit 2
fi

report_dir="${OUTPUT_BASE}/${TOPIC_ID}/${RUN_ID}"
json_path="${report_dir}/radar_report.json"
md_path="${report_dir}/radar_report.md"

if [[ ! -f "${json_path}" || ! -f "${md_path}" ]]; then
  echo "Report files not found under ${report_dir}" >&2
  exit 1
fi

echo "radar_report.json: ${json_path}"
echo "radar_report.md: ${md_path}"
