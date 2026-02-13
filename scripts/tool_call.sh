#!/usr/bin/env bash
set -euo pipefail

TOOL_GATEWAY_URL="${TOOL_GATEWAY_URL:-http://localhost:8787}"
AGENT_ID="${AGENT_ID:-local-harness}"

pretty_print() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool
  else
    cat
  fi
}

usage() {
  cat <<EOF
Usage:
  ./scripts/tool_call.sh health
  ./scripts/tool_call.sh fetch <url> <purpose>
  ./scripts/tool_call.sh search <query> <purpose>

Env:
  TOOL_GATEWAY_URL (default: http://localhost:8787)
  AGENT_ID          (default: local-harness)
EOF
}

cmd="${1:-}"

case "${cmd}" in
  health)
    curl -sS "${TOOL_GATEWAY_URL}/health" | pretty_print
    ;;
  fetch)
    url="${2:-}"
    purpose="${3:-}"
    if [[ -z "${url}" || -z "${purpose}" ]]; then
      usage
      exit 1
    fi
    curl -sS -X POST "${TOOL_GATEWAY_URL}/tools/web.fetch" \
      -H 'Content-Type: application/json' \
      -d "{
        \"agent_id\": \"${AGENT_ID}\",
        \"purpose\": \"${purpose}\",
        \"inputs\": {\"url\": \"${url}\"}
      }" | pretty_print
    ;;
  search)
    query="${2:-}"
    purpose="${3:-}"
    if [[ -z "${query}" || -z "${purpose}" ]]; then
      usage
      exit 1
    fi
    curl -sS -X POST "${TOOL_GATEWAY_URL}/tools/web.search" \
      -H 'Content-Type: application/json' \
      -d "{
        \"agent_id\": \"${AGENT_ID}\",
        \"purpose\": \"${purpose}\",
        \"inputs\": {\"query\": \"${query}\", \"max_results\": 5}
      }" | pretty_print
    ;;
  *)
    usage
    exit 1
    ;;
esac
