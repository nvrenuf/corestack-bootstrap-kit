#!/usr/bin/env bash
set -euo pipefail

TOOL_GATEWAY_URL="${TOOL_GATEWAY_URL:-http://localhost:8787}"

echo "Tool Gateway: ${TOOL_GATEWAY_URL}"

echo
echo "== health =="
curl -sS "${TOOL_GATEWAY_URL}/health" | jq .

echo
echo "== web.fetch (allowed example) =="
curl -sS -X POST "${TOOL_GATEWAY_URL}/tools/web.fetch" \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "local-harness",
    "purpose": "smoke test fetch",
    "request_id": "harness-fetch-1",
    "inputs": {"url": "https://example.com"}
  }' | jq .

echo
echo "== web.search (expected NOT_CONFIGURED unless backend wired) =="
curl -sS -X POST "${TOOL_GATEWAY_URL}/tools/web.search" \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "local-harness",
    "purpose": "smoke test search",
    "request_id": "harness-search-1",
    "inputs": {"query": "corestack bootstrap kit", "max_results": 5}
  }' | jq .
