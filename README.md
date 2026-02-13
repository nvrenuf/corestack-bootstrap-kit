# Corestack Bootstrap Kit

Corestack Bootstrap Kit provides a local compose stack for Ollama, Open WebUI, n8n, launcher, and the Tool Gateway.

## Quickstart

Prerequisites: Docker Engine/Desktop with Compose v2.

```bash
git clone https://github.com/nvrenuf/corestack-bootstrap-kit.git
cd corestack-bootstrap-kit
cp deploy/compose/.env.example deploy/compose/.env
```

Start stack:

```bash
./corestack up
```

Postgres is included by default and persists data in Docker volume `corestack-postgres-data`.

Run core DB migrations (idempotent):

```bash
./scripts/corestack-db-init.sh
```

Set allowlist and restart Tool Gateway:

```bash
WEB_ALLOWLIST=example.com ./corestack up tool-gateway
```

Call Tool Gateway fetch:

```bash
curl -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "demo-agent",
    "purpose": "quickstart fetch",
    "inputs": {"url": "https://example.com"}
  }'
```

Optional: switch Tool Gateway backend to n8n and call again:

```bash
TOOL_BACKEND=n8n \
N8N_WEB_FETCH_URL=http://n8n:5678/webhook/tools/web.fetch \
N8N_WEB_SEARCH_URL=http://n8n:5678/webhook/tools/web.search \
docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway

curl -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "demo-agent",
    "purpose": "n8n backend fetch",
    "inputs": {"url": "https://example.com"}
  }'
```


## Controlling Corestack

Use the repo-root control script for day-to-day lifecycle management:

```bash
./corestack up
./corestack down
./corestack restart
./corestack status
./corestack logs
./corestack logs tool-gateway
./corestack destroy
```

Notes:
- `down` stops/removes containers and networks but keeps volumes/data.
- `destroy` prompts for confirmation and removes volumes/data (including Postgres data).

## Services and ports

- Launcher: `http://localhost:8080`
- Open WebUI: `http://localhost:3000`
- n8n: `http://localhost:5678`
- Tool Gateway: `http://localhost:8787`
- Ollama tags: `http://localhost:11434/api/tags`
- Postgres: `localhost:5432`

## Postgres setup and verification

Set DB credentials in `deploy/compose/.env` (template in `deploy/compose/.env.example`):

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

Verify schema/tables:

```bash
psql "postgresql://corestack:change_me@localhost:5432/corestack" -c "\dn" -c "\dt core.*"
```

Backup example:

```bash
pg_dump "postgresql://corestack:change_me@localhost:5432/corestack" > corestack-backup.sql
```

Security note:
- keep Postgres bound to trusted local/dev environments only
- do not expose port `5432` publicly on untrusted networks

## Tool Gateway docs

- OpenAPI contract: `docs/tool-gateway-openapi.yaml`
- Contract overview: `docs/tool-gateway.md`
- Agent tool-calling pattern: `docs/agent-tool-calls.md`
- Service README: `tool-gateway/README.md`

## Testing tools without an agent

```bash
WEB_ALLOWLIST=example.com ./corestack up tool-gateway

TOOL_GATEWAY_URL=http://localhost:8787 ./scripts/tool_call.sh health
TOOL_GATEWAY_URL=http://localhost:8787 ./scripts/tool_call.sh fetch https://example.com "manual fetch test"
TOOL_GATEWAY_URL=http://localhost:8787 ./scripts/tool_call.sh search "corestack updates" "manual search test"
```

## n8n tool workflow docs

- Workflow scaffolding: `n8n/README.md`
- Automation notes: `docs/n8n-automations.md`
- Workflow files: `n8n/workflows/00-corestack-healthchecks.json`, `n8n/workflows/01-web-fetch-tool.json`, `n8n/workflows/02-web-search-tool.json`

## Acceptance checks

```bash
# Health
curl -sS http://localhost:8787/health

# Allowed fetch
curl -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"allow-test","inputs":{"url":"https://example.com"}}'

# Denied fetch (expect HTTP 403)
curl -i -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"deny-test","inputs":{"url":"https://wikipedia.org"}}'
```

## Uninstall

Stop/remove containers and networks, but keep data volumes (default and safe):

```bash
./scripts/granite/uninstall.sh
```

Purge all data volumes (including Postgres volume `corestack-postgres-data`):

```bash
./scripts/granite/uninstall.sh --purge-data
```

## Legacy Granite bootstrap

Legacy bootstrap scripts remain available in `scripts/granite/`.
