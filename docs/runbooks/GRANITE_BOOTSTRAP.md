# Runbook: Granite Bootstrap (Docker-First)

## Prerequisites

- Docker Engine/Desktop installed
- Docker daemon running
- Docker Compose v2 available (`docker compose version`)
- At least 16 GB RAM and 40 GB free disk
- Git + curl installed

## One-liner install

```bash
git clone <your-fork-or-repo-url> corestack-bootstrap-kit && \
cd corestack-bootstrap-kit && \
./scripts/granite/bootstrap.sh
```

## What bootstrap does

1. Runs preflight validation.
2. Verifies Docker runtime availability.
3. Generates `build/granite/docker-compose.yml` and environment file.
4. Starts services and pulls Granite models via Ollama.
5. Runs post-install checks and writes reports.

## Service URLs

- Open WebUI: `https://localhost`
- n8n: `https://n8n.localhost`

## Default credential handling

- `corestack.env` is created from template on first run only.
- Existing `corestack.env` is never overwritten automatically.
- If regeneration is requested in future flows, a timestamped backup is required.
- Rotate any default/example credentials immediately after bootstrap.

## Trusting Caddy internal certificate

Caddy uses its internal CA for local TLS:

1. Visit `https://localhost` and download/export cert details if prompted.
2. Install/trust Caddy local root CA on your client OS/browser trust store.
3. Re-open `https://localhost` and `https://n8n.localhost`.

For CLI checks you can temporarily use `curl -k`, but production-like validation should use trusted certs.

## Troubleshooting quick links

See `docs/runbooks/TROUBLESHOOTING.md` for:
- docker group and permission issues
- Caddy cert trust steps
- port conflicts
- stalled model pulls

## Uninstall

```bash
# Keep named volumes/data
./scripts/granite/uninstall.sh

# Remove named volumes/data
./scripts/granite/uninstall.sh --purge

# Same script is copied during bootstrap to:
# ~/corestack/uninstall-granite.sh
```
