# Agent Tool-Calling Pattern

Agents should emit tool calls as JSON commands. An orchestrator receives these commands and routes them to Tool Gateway.

## Tool call schema

```json
{
  "tool": "web.fetch",
  "agent_id": "research-agent",
  "purpose": "collect source context",
  "request_id": "req-optional-id",
  "inputs": {
    "url": "https://example.com"
  }
}
```

For search:

```json
{
  "tool": "web.search",
  "agent_id": "research-agent",
  "purpose": "find recent sources",
  "request_id": "req-optional-id",
  "inputs": {
    "query": "corestack updates",
    "max_results": 5
  }
}
```

## Orchestrator routing

- if `tool == "web.fetch"` -> `POST /tools/web.fetch`
- if `tool == "web.search"` -> `POST /tools/web.search`

Tool Gateway always returns the normalized envelope, regardless of backend (`local` or `n8n`).

## Response envelope

Every tool response uses:
- `ok`
- `data`
- `error`
- `source_meta`
- `timings_ms`
- `content_hash`

## Security expectations

- default-deny allowlist for outbound fetch/search
- rate limiting at gateway/tool layer
- strict request timeouts
- structured logging for each tool call
- never commit secrets; pass via environment or secret manager

## Acceptance commands

```bash
export TOOL_GATEWAY_URL=http://localhost:8787
./scripts/tool_call.sh health
./scripts/tool_call.sh fetch https://example.com "smoke test fetch"
./scripts/tool_call.sh search "corestack updates" "smoke test search"
```

Expected:
- `health` returns `ok=true`
- `fetch` returns `ok=true` when allowlisted
- `search` returns valid envelope, usually `ok=false` with `NOT_CONFIGURED` until backend is configured
