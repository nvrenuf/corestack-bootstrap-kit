# Corestack Tool Workflows for n8n

This directory contains importable **Corestack Tool Workflows** for n8n.
These are backend tool endpoints for agent/orchestrator flows, not end-user automation recipes.

## Included workflows

- `00-corestack-healthchecks.json`
- `01-web-fetch-tool.json` (legacy)
- `02-web-search-tool.json` (legacy)
- `web.fetch.json` (Milestone 1 E2E)
- `web.search.json` (Milestone 1 E2E)

## Import workflows

1. Start n8n:
```bash
docker compose -f deploy/compose/docker-compose.yml up -d n8n
```
2. Open `http://localhost:5678`.
3. Import `web.fetch.json` and `web.search.json` for Milestone 1 E2E (or legacy `01`/`02` if needed).
4. Activate imported workflows.

Optional scripted import:
```bash
./n8n/scripts/import-workflows.sh
```

## Tool webhook endpoints

- `POST http://localhost:5678/webhook/tools/web.fetch`
- `POST http://localhost:5678/webhook/tools/web.search`

Expected request shape:

```json
{
  "agent_id": "string",
  "purpose": "string",
  "inputs": { ... }
}
```

## Required env templates

Use these templates as non-secret defaults:

- `n8n/templates/env.n8n.example`
- `n8n/templates/allowlist.example.txt`

No secrets should be committed. Configure API keys in n8n credentials or local environment only.

## Allowlist behavior

`01-web-fetch-tool` includes an allowlist placeholder Set node + IF gate.
Only allowlisted hostnames should be fetched.

## Ports and volumes (default compose)

- n8n UI/API: `5678:5678`
- persistent data volume: `/home/node/.n8n`
- mounted workflow files: `/opt/corestack/n8n/workflows`
- mounted templates: `/opt/corestack/n8n/templates`

## Acceptance commands

```bash
# web.fetch test
curl -sS -X POST http://localhost:5678/webhook/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"fetch test","inputs":{"url":"https://example.com"}}'

# web.search test
curl -sS -X POST http://localhost:5678/webhook/tools/web.search \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"search test","inputs":{"query":"corestack","max_results":5}}'
```
