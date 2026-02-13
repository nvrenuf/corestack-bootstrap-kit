# Corestack Bootstrap Architecture Overview

Corestack Bootstrap Kit standardizes installation workflows for local/customer-hosted AI OS stacks.

## Purpose

- Deliver repeatable installers for AI runtime components.
- Keep security defaults strong on day one.
- Let operators safely re-run installers after partial failures or host changes.

## Bootstrap lifecycle

1. **Preflight:** verify host OS, privileges, resources, and network access.
2. **Render:** load pinned config, render templates into `build/`, never mutate templates directly.
3. **Install + harden:** install required packages, apply host hardening, start services.
4. **Postcheck:** validate endpoints, daemon state, firewall status, and model availability.
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
