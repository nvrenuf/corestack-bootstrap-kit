# Corestack n8n Automations

## Overview

Corestack ships default n8n automation scaffolding for:

- health checks
- controlled web fetch/search tools
- RSS ingestion
- daily local research digest generation
- NCS profile snapshots

## Security model

- **Default deny outbound**: web tools deny hostnames not in `WEB_ALLOWLIST`.
- **Read-only fetch posture**: workflows fetch and summarize only; no posting or mutation by default.
- **Rate and timeout controls**: requests use `WEB_TIMEOUT_MS` and per-host minimum interval (`WEB_MIN_INTERVAL_MS`).
- **Caching**: repeated queries/fetches are cached using `CACHE_TTL_SECONDS`.
- **Structured logging**: tool workflows append structured entries into workflow static data.

### Important warnings

- Respect website Terms of Service and robots rules before scraping.
- Keep outbound domain scope narrow.
- Never commit credentials or tokens.

## Tool vs agent separation

- **Tools** (`01`, `02`) expose HTTP webhooks:
  - `POST /webhook/tools/web.fetch`
  - `POST /webhook/tools/web.search`
- **Agents/jobs** (`03`, `04`, `05`) are scheduled workflows that call tools and produce artifacts.

This separation keeps policy controls (allowlist, rate limits, logging, cache) centralized in tool workflows.

## Runtime configuration

Configured in compose env:

- `WEB_ALLOWLIST`
- `WEB_TIMEOUT_MS`
- `WEB_USER_AGENT`
- `CACHE_TTL_SECONDS`
- `WEB_MAX_CONTENT_BYTES`
- `WEB_MIN_INTERVAL_MS`

Use templates:

- `n8n/templates/env.n8n.example`
- `n8n/templates/allowlist.example.txt`

## Artifact locations

With default compose mounts:

- `n8n/data/healthchecks/`
- `n8n/data/research-inbox/`
- `n8n/data/digests/`
- `n8n/data/ncs-snapshots/`

## Phase 2 extension path (Playwright)

For dynamic sites and anti-bot resilient extraction, add a dedicated browser automation tool workflow in a later phase:

1. create a separate Playwright microservice container
2. expose a tightly scoped internal endpoint for rendering
3. keep allowlist/rate-limits in front of browser calls
4. preserve audit logs and cache behavior from current tool workflows

Do not introduce browser automation directly into baseline default workflows until policy controls are preserved.
