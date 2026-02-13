# PR Summary

## Branch

`feature/tool-gateway-and-n8n-scaffolding`

## What changed

1. Step 1: Tool Gateway contract-first OpenAPI spec
- Added `docs/tool-gateway-openapi.yaml` with:
  - `GET /health`
  - `POST /tools/web.fetch`
  - `POST /tools/web.search`
- Added normalized response envelope schema and error responses (`400`, `403`, `429`, `500`, `504`).
- Added contract notes in `docs/tool-gateway.md`.

2. Step 2: FastAPI Tool Gateway scaffold
- Added new service under `tool-gateway/` with:
  - FastAPI routes for `/health`, `/tools/web.fetch`, `/tools/web.search`
  - allowlist policy from `WEB_ALLOWLIST` or `WEB_ALLOWLIST_FILE`
  - default-deny if allowlist empty
  - timeout and byte limits via env (`WEB_TIMEOUT_MS`, `WEB_MAX_BYTES`)
  - JSONL structured logging to stdout
  - local fetch implementation with title/text extraction and SHA-256 `content_hash`
  - search endpoint validation + `NOT_CONFIGURED` envelope stub
- Integrated service into `deploy/compose/docker-compose.yml` on port `8787`.

3. Step 3: Agent calling pattern + harness
- Added `docs/agent-tool-calls.md` with tool-call schema and routing pattern.
- Added `scripts/tool_call.sh` harness for local smoke calls.

4. Step 4: n8n tool workflow scaffolding + forwarding docs
- Added/updated n8n tool workflow scaffolding:
  - `n8n/workflows/00-corestack-healthchecks.json`
  - `n8n/workflows/01-web-fetch-tool.json`
  - `n8n/workflows/02-web-search-tool.json`
- Added `n8n/templates/env.n8n.example` and `n8n/templates/allowlist.example.txt`.
- Updated `n8n/README.md` and `docs/n8n-automations.md` for import, separation, and forwarding usage.
- Tool Gateway supports `TOOL_BACKEND=n8n` with normalized response envelopes.

## Test commands

```bash
# 1) Compose config validation
docker compose -f deploy/compose/docker-compose.yml config

# 2) Python app import/compile sanity
python3 -m compileall tool-gateway/app

# 3) n8n workflow JSON validation
node n8n/scripts/validate-workflows.js

# 4) Bring up stack
docker compose --env-file deploy/compose/.env.example -f deploy/compose/docker-compose.yml up -d

# 5) Health check
curl -sS http://localhost:8787/health | jq

# 6) Allowed fetch example
WEB_ALLOWLIST=example.com docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
curl -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"allowed-test","inputs":{"url":"https://example.com"}}' | jq

# 7) Disallowed fetch example (expect 403)
curl -i -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"deny-test","inputs":{"url":"https://wikipedia.org"}}'

# 8) Optional n8n backend mode
TOOL_BACKEND=n8n \
N8N_WEB_FETCH_URL=http://n8n:5678/webhook/tools/web.fetch \
N8N_WEB_SEARCH_URL=http://n8n:5678/webhook/tools/web.search \
docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
```
