# n8n Automations (Tool Workflows)

Corestack provides n8n scaffolding for **tool workflows** that can sit behind Tool Gateway.

## Tool workflows

- `01-web-fetch-tool.json`
- `02-web-search-tool.json`

These are intended for agent-driven tool calls, not human automation UI flows.

## Health workflow

- `00-corestack-healthchecks.json` checks:
  - Tool Gateway: `http://tool-gateway:8787/health`
  - Ollama tags: `http://ollama:11434/api/tags`

## Gateway forwarding mode

Set Tool Gateway backend to n8n:

```bash
TOOL_BACKEND=n8n \
N8N_WEB_FETCH_URL=http://n8n:5678/webhook/tools/web.fetch \
N8N_WEB_SEARCH_URL=http://n8n:5678/webhook/tools/web.search \
docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
```

When forwarding is enabled, Tool Gateway normalizes n8n output into the same envelope used by local mode.

## Security posture

- Keep allowlist default restrictive.
- Enforce fetch timeout and response-size limits.
- Keep credentials out of workflow exports.
- Respect robots.txt and site Terms of Service.

## Acceptance commands

```bash
# Tool Gateway local backend
docker compose -f deploy/compose/docker-compose.yml up -d
curl -sS http://localhost:8787/health

# Tool Gateway forwarding to n8n
TOOL_BACKEND=n8n docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
curl -sS -X POST http://localhost:8787/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"n8n-forward-test","inputs":{"url":"https://example.com"}}'
```
