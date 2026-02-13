# PR Summary

## What was added

- Tool Gateway contract docs and FastAPI scaffold.
- Local tool-call harness and agent-call documentation.
- n8n tool workflow scaffolding:
  - `00-corestack-healthchecks.json`
  - `01-web-fetch-tool.json`
  - `02-web-search-tool.json`
- n8n env/allowlist templates and security docs.
- Optional Tool Gateway forwarding to n8n via `TOOL_BACKEND=n8n`.

## Start stack

```bash
cp deploy/compose/.env.example deploy/compose/.env
docker compose --env-file deploy/compose/.env -f deploy/compose/docker-compose.yml up -d
```

## Import n8n workflows

1. Open `http://localhost:5678`
2. Import from `n8n/workflows/` in order `00`, `01`, `02`
3. Activate workflows

Or:

```bash
./n8n/scripts/import-workflows.sh
```

## Test local Tool Gateway mode

```bash
WEB_ALLOWLIST=example.com docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
TOOL_GATEWAY_URL=http://localhost:8787 ./scripts/tool_call.sh health
TOOL_GATEWAY_URL=http://localhost:8787 ./scripts/tool_call.sh fetch https://example.com "allowed fetch"
TOOL_GATEWAY_URL=http://localhost:8787 ./scripts/tool_call.sh search "corestack" "search test"
```

## Test n8n webhooks directly

```bash
curl -sS -X POST http://localhost:5678/webhook/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"webhook test","inputs":{"url":"https://example.com"}}'

curl -sS -X POST http://localhost:5678/webhook/tools/web.search \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"webhook test","inputs":{"query":"corestack","max_results":5}}'
```

## Switch Tool Gateway to n8n backend

```bash
TOOL_BACKEND=n8n \
N8N_WEB_FETCH_URL=http://n8n:5678/webhook/tools/web.fetch \
N8N_WEB_SEARCH_URL=http://n8n:5678/webhook/tools/web.search \
docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
```

Then call:

```bash
curl -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"gateway forward test","inputs":{"url":"https://example.com"}}'
```
