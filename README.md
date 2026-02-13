# Corestack Bootstrap Kit

Corestack Bootstrap Kit is a docs-first, local-first installer framework for Corestack "AI OS" deployments on Ubuntu. It provides reusable scaffolding for secure, idempotent bootstrap flows, starting with IBM Granite on Ollama and extending to additional model stacks like Mistral.

## Why this repo exists

- **Local-first operations:** AI workloads run on customer infrastructure first.
- **Data residency by default:** model serving, vector storage, and workflow tooling remain in customer-controlled environments.
- **Repeatable installs:** each bootstrap is safe to re-run and keeps operator edits intact.
- **Docs as source of truth:** every operational behavior must be documented before and with script changes.

## Current included bootstrap

- `granite`: Ubuntu bootstrap for Ollama + Granite model pulls + Open WebUI + n8n + supporting services.

## Golden path quickstart (Granite)

On a fresh Ubuntu host:

```bash
git clone <your-fork-or-repo-url> corestack-bootstrap-kit
cd corestack-bootstrap-kit
make smoke
./scripts/granite/bootstrap.sh
```

After install:
- Open WebUI: `https://localhost`
- n8n: `https://n8n.localhost`

Generated files are written under `./build/`, runtime logs under `~/corestack/logs/` (unless overridden), and optional local repo logs under `./logs/`.

## Where to look next

- Docs index: `docs/README.md`
- Granite runbook: `docs/runbooks/GRANITE_BOOTSTRAP.md`
- Config conventions and pinning: `docs/architecture/CONFIG_CONVENTIONS.md`
- New bootstrap authoring guide: `docs/runbooks/ADDING_A_BOOTSTRAP.md`

## Add a new bootstrap

Use the template workflow in `docs/runbooks/ADDING_A_BOOTSTRAP.md`:
1. Add `config/<bootstrap>/versions.yaml`.
2. Add `scripts/<bootstrap>/` scripts that call `scripts/lib/preflight.sh` and `scripts/lib/postcheck.sh`.
3. Add template files in `templates/` and render into `build/` only.
4. Update docs and tests in the same change.
