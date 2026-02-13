# Runbook: Adding a New Bootstrap (Example: Mistral)

## Design rules

- Keep docs primary: update architecture + runbook docs in same PR.
- Reuse shared library scripts for preflight/postcheck behavior.
- Pin every image/model version in `config/<bootstrap>/versions.yaml`.
- Keep localhost-first bindings unless explicit product requirement says otherwise.

## Required file additions

1. `config/<bootstrap>/versions.yaml`
2. `scripts/<bootstrap>/bootstrap.sh`
3. `scripts/<bootstrap>/render-compose.sh`
4. `scripts/<bootstrap>/pull-models.sh` (if model-serving involved)
5. `templates/compose/<bootstrap>/docker-compose.yml.tmpl`
6. Bootstrap-specific runbook in `docs/runbooks/`

## Integration points

- Source `scripts/lib/common.sh` for strict logging and guardrails.
- Call `scripts/lib/preflight.sh` before install actions.
- Call `scripts/lib/postcheck.sh --bootstrap <bootstrap>` after deployment.
- Emit logs to `~/corestack/logs/`.

## Validation checklist

- `make lint`
- `make test`
- `make smoke`
- verify idempotent re-run of bootstrap script
- verify docs reflect any new ports/services/credentials
