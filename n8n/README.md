# Corestack Default n8n Automations

This folder contains importable n8n workflows and templates that ship with Corestack.

## What these automations are

- **Tools**: webhook workflows callable by agents
  - `01-web-fetch-tool.json`
  - `02-web-search-tool.json`
- **Agents/Jobs**: scheduled workflows that consume tools or generate local artifacts
  - `00-corestack-healthchecks.json`
  - `03-rss-ingest.json`
  - `04-daily-research-digest.json`
  - `05-ncs-profile-snapshot.json`

## Security defaults

- Default allowlist is restrictive and local-first.
- Outbound fetch/search tools must deny non-allowlisted hostnames.
- No secrets are stored in this repository.
- Scraping workflows are read-only and must respect robots.txt, Terms of Service, and rate limits.

## Import workflows

### Scripted import (recommended)

```bash
./n8n/scripts/import-workflows.sh
```

This imports all files in `n8n/workflows/` into the running `corestack-n8n` container.

### Manual import (UI)

1. Start stack: `docker compose -f deploy/compose/docker-compose.yml up -d`
2. Open n8n: `http://localhost:5678`
3. Import workflow files from `n8n/workflows/` in this order:
   - `00-corestack-healthchecks.json`
   - `01-web-fetch-tool.json`
   - `02-web-search-tool.json`
   - `03-rss-ingest.json`
   - `04-daily-research-digest.json`
   - `05-ncs-profile-snapshot.json`
4. Review placeholders and activate workflows.

## Required environment variables

Use `n8n/templates/env.n8n.example` as a base.

- `WEB_ALLOWLIST` (comma-separated hostnames)
- `WEB_TIMEOUT_MS`
- `WEB_USER_AGENT`
- `CACHE_TTL_SECONDS`
- `WEB_MAX_CONTENT_BYTES`
- `WEB_MIN_INTERVAL_MS`

Optional for search API mode:
- `SEARCH_API_PROVIDER`
- `SEARCH_API_KEY` (REQUIRED for API mode)
- `SEARCH_API_URL`

## Allowlist behavior

`01-web-fetch-tool` checks each request URL hostname against `WEB_ALLOWLIST`.

- allowlisted -> request may proceed
- non-allowlisted -> hard reject (`403`)
- too many rapid requests to same host -> hard reject (`429`)

## Output artifacts

When using the default compose mounts, artifacts are written under:

- `n8n/data/healthchecks/`
- `n8n/data/research-inbox/`
- `n8n/data/digests/`
- `n8n/data/ncs-snapshots/`

## Credentials placeholders

- Search API credentials are placeholders only.
- Do not commit real keys.
- Configure credentials in local `.env` or your secret manager.

## Example tool calls

Web fetch tool:

```bash
curl -sS -X POST http://localhost:5678/webhook/tools/web.fetch \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "agent": "research-agent",
    "purpose": "collect public summary"
  }'
```

Web search tool:

```bash
curl -sS -X POST http://localhost:5678/webhook/tools/web.search \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "corestack local ai stack updates",
    "agent": "research-agent",
    "purpose": "daily digest",
    "max_results": 5
  }'
```

## Validation helper

```bash
node n8n/scripts/validate-workflows.js
```
