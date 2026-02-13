# Security Policy

## Scope

This repository contains bootstrap assets for local/customer-hosted AI infrastructure. Security defaults prioritize least privilege, idempotent provisioning, and auditable operations.

## Supported hardening posture

Current scripts target Ubuntu LTS and enforce:
- localhost binding for sensitive services (Ollama and Qdrant)
- UFW-enabled host firewall defaults
- unattended-upgrades for automated security patching
- post-install checks to validate expected runtime posture

## Reporting vulnerabilities

Please report vulnerabilities privately to project maintainers. Do not open public issues containing exploit details or sensitive system information.

## Secrets and credentials

- Never commit real secrets.
- Use `.env` files generated from templates with local-only storage.
- Keep credentials out of shell history when possible.
- Treat bootstrap-generated credentials as temporary and rotate during handoff.

## Threat model and audit design

- Bootstrap and runtime threats: see `docs/architecture/THREAT_MODEL.md`.
- Audit logging design: see `docs/architecture/AUDIT_LOGGING.md`.

## Security controls roadmap

- Add signed artifact verification for installer dependencies.
- Add pluggable security scans through `scripts/granite/skill-scans.sh` modules.
- Add CIS benchmark profile checks per supported Ubuntu release.
