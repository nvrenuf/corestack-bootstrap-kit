#!/usr/bin/env bash
set -euo pipefail

TOPIC_ID="${1:-}"
TIME_WINDOW_DAYS="${2:-7}"
RUN_ID="${3:-}"
MODE="${MODE:-offline}"
PACK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_BASE="${FSRA_OUTPUT_BASE:-${PACK_ROOT}/outputs}"

if [[ -z "${TOPIC_ID}" ]]; then
  echo "Usage: scripts/run_topic.sh <TOPIC_ID> [TIME_WINDOW_DAYS] [RUN_ID]" >&2
  exit 2
fi

if [[ -z "${RUN_ID}" ]]; then
  RUN_ID="$(python - <<'PY'
from uuid import uuid4
print(uuid4())
PY
)"
fi

if ! [[ "${TIME_WINDOW_DAYS}" =~ ^[0-9]+$ ]] || [[ "${TIME_WINDOW_DAYS}" -lt 1 ]]; then
  echo "TIME_WINDOW_DAYS must be a positive integer" >&2
  exit 2
fi

export PYTHONPATH="${PACK_ROOT}:${PYTHONPATH:-}"

signal_count="$(python - <<PY
from uuid import UUID
from fsra.loader.source_data_loader import load_source_data
print(len(load_source_data(UUID("${RUN_ID}"))))
PY
)"

if [[ "${signal_count}" -eq 0 ]]; then
  echo "No signals available for run ${RUN_ID}; aborting." >&2
  exit 1
fi

if [[ "${MODE}" == "online" ]]; then
  if [[ -z "${INGEST_BASE_URL:-}" || -z "${INGEST_TOKEN:-}" ]]; then
    echo "MODE=online requires INGEST_BASE_URL and INGEST_TOKEN" >&2
    exit 2
  fi
  curl -fsS \
    -H "Authorization: Bearer ${INGEST_TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "${INGEST_BASE_URL%/}/ingest/run/start" \
    -d "{\"topic_id\":\"${TOPIC_ID}\",\"time_window_days\":${TIME_WINDOW_DAYS}}" >/dev/null
fi

python -m fsra.synthesizer.synthesizer_agent \
  --topic-id "${TOPIC_ID}" \
  --run-id "${RUN_ID}" \
  --time-window-days "${TIME_WINDOW_DAYS}" \
  --output-base "${OUTPUT_BASE}" >/dev/null

report_path="${OUTPUT_BASE}/${TOPIC_ID}/${RUN_ID}/radar_report.json"
if [[ ! -f "${report_path}" ]]; then
  echo "Synthesis report missing at ${report_path}" >&2
  exit 1
fi

if [[ "${MODE}" == "online" ]]; then
  curl -fsS \
    -H "Authorization: Bearer ${INGEST_TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "${INGEST_BASE_URL%/}/ingest/run/finish" \
    -d "{\"run_id\":\"${RUN_ID}\",\"status\":\"ok\",\"counts_json\":{\"signals\":${signal_count}}}" >/dev/null
fi

echo "run_id=${RUN_ID}"
echo "report_json=${report_path}"
echo "report_md=${OUTPUT_BASE}/${TOPIC_ID}/${RUN_ID}/radar_report.md"
