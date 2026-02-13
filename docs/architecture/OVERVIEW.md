# Corestack Bootstrap Architecture Overview

Corestack Bootstrap Kit standardizes installation workflows for local/customer-hosted AI OS stacks.

## Purpose

- Deliver repeatable installers for AI runtime components.
- Keep security defaults strong on day one.
- Let operators safely re-run installers after partial failures or host changes.

## Bootstrap lifecycle

1. **Preflight:** verify resources, Docker runtime availability, and network access.
2. **Render:** load pinned config, render templates into `build/`, never mutate templates directly.
3. **Deploy:** start services from rendered Compose assets and run model pulls.
4. **Postcheck:** validate endpoints, daemon state, and model availability.
5. **Audit trail:** write machine-readable logs and reports.

## Component map (Granite)

- **Caddy**: TLS termination using internal CA, routes `https://localhost` and `https://n8n.localhost`.
- **Open WebUI**: operator-facing chat UI.
- **n8n**: automation workflow engine.
- **Ollama**: local model serving on localhost-only bind.
- **Qdrant**: vector DB on localhost-only bind.
- **Postgres**: metadata/workflow persistence.

## Extensibility

Each new bootstrap should re-use:
- `scripts/lib/common.sh`
- `scripts/lib/preflight.sh`
- `scripts/lib/postcheck.sh`
- template rendering into `build/`

This keeps behavior consistent as Corestack adds new model stacks.
