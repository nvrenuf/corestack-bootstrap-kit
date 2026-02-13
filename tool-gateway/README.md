# Tool Gateway (FastAPI Scaffold)

Corestack Tool Gateway is a policy-aware API layer for agent tool calls.

## Endpoints

- `GET /health`
- `POST /tools/web.fetch`
- `POST /tools/web.search`

## Environment

- `WEB_ALLOWLIST` comma-separated hostnames (default empty -> deny all)
- `WEB_ALLOWLIST_FILE` optional file path, one hostname per line
- `WEB_TIMEOUT_MS` request timeout in milliseconds (default `8000`)
- `WEB_MAX_BYTES` max response bytes processed (default `1500000`)
- `TOOL_BACKEND` `local` or `n8n` (default `local`)
- `N8N_WEB_FETCH_URL` required when `TOOL_BACKEND=n8n`
- `N8N_WEB_SEARCH_URL` required when `TOOL_BACKEND=n8n`

## Logging

The service logs JSONL to stdout with fields:

- `timestamp`
- `request_id`
- `agent_id`
- `tool`
- `url` or `query`
- `decision` (`allow`/`deny`)
- `status_code`
- `elapsed_ms`

## Compose bring-up

```bash
docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
```

## Acceptance commands

```bash
# Health
curl -sS http://localhost:8787/health | jq

# Allowed fetch (set allowlist first)
WEB_ALLOWLIST=example.com docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
curl -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo-agent","purpose":"test fetch","inputs":{"url":"https://example.com"}}' | jq

# Disallowed fetch should return 403
curl -i -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo-agent","purpose":"test deny","inputs":{"url":"https://www.wikipedia.org"}}'
```
