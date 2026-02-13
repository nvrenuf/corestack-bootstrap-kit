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

## Acceptance commands

```bash
export TOOL_GATEWAY_URL=http://localhost:8787
./scripts/tool_call.sh
```

Expected:
- fetch returns `ok=true` when allowlisted
- search returns valid envelope, with `NOT_CONFIGURED` until search backend is connected
