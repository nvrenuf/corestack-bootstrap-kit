# n8n Tool Workflows

Corestack includes n8n scaffolding for tool endpoints that can back Tool Gateway.

## Security model

- default-deny domain policy (allowlist-first)
- strict fetch timeouts
- execution logging for tool calls
- do not commit secrets; use n8n credentials/local env

## Tool endpoints

After import + activation:
- `POST /webhook/tools/web.fetch`
- `POST /webhook/tools/web.search`

## Credentials and secrets

- Keep API keys out of workflow exports.
- Use placeholder values in JSON exports.
- Configure real credentials in n8n runtime only.

## Scraping caution

For web fetching/scraping, respect:
- website Terms of Service
- robots directives
- conservative rate limits

## Testing n8n webhooks

```bash
curl -sS -X POST http://localhost:5678/webhook/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"n8n webhook test","inputs":{"url":"https://example.com"}}'

curl -sS -X POST http://localhost:5678/webhook/tools/web.search \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","purpose":"n8n webhook test","inputs":{"query":"corestack","max_results":5}}'
```

## Tool Gateway forwarding mode

```bash
TOOL_BACKEND=n8n \
N8N_WEB_FETCH_URL=http://n8n:5678/webhook/tools/web.fetch \
N8N_WEB_SEARCH_URL=http://n8n:5678/webhook/tools/web.search \
docker compose -f deploy/compose/docker-compose.yml up -d tool-gateway
```

Tool Gateway normalizes n8n responses into the standard envelope so clients do not depend on n8n internals.
