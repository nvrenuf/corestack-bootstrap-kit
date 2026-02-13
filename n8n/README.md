# Corestack n8n Tool Workflow Scaffolding

This directory contains importable **tool workflows** for Corestack. These are separated from human-facing automations.

## Included workflows

- `00-corestack-healthchecks.json` (cron health checks)
- `01-web-fetch-tool.json` (`POST /webhook/tools/web.fetch`)
- `02-web-search-tool.json` (`POST /webhook/tools/web.search`)

## Import steps

1. Start n8n with compose:
```bash
docker compose -f deploy/compose/docker-compose.yml up -d n8n
```
2. Open `http://localhost:5678`
3. Import each file from `n8n/workflows/` in order (`00`, `01`, `02`).
4. Activate workflows.

Or scripted import:
```bash
./n8n/scripts/import-workflows.sh
```

## Tool webhook paths

- Web fetch: `http://localhost:5678/webhook/tools/web.fetch`
- Web search: `http://localhost:5678/webhook/tools/web.search`

## Allowlist behavior

`01-web-fetch-tool` includes an allowlist placeholder Set node.
- Start with minimal domains only.
- Non-allowlisted domains return deny responses.
- Prefer feeding this list from environment templates (`n8n/templates/env.n8n.example`).

## Security notes

- Do not store credentials in repository.
- Use placeholder values only in exported workflow files.
- Respect robots.txt and Terms of Service when fetching external pages.

## Acceptance commands

```bash
# Fetch tool call (after import + activate)
curl -sS -X POST http://localhost:5678/webhook/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","agent_id":"demo","purpose":"test"}'

# Search tool call (placeholder response)
curl -sS -X POST http://localhost:5678/webhook/tools/web.search \
  -H 'Content-Type: application/json' \
  -d '{"query":"corestack","agent_id":"demo","purpose":"test","max_results":5}'
```
