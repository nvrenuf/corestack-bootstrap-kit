# Documentation Index

This repository is documentation-driven. Operational behavior in scripts must match these docs.

## Architecture

- `docs/architecture/OVERVIEW.md` — Corestack bootstrap architecture and lifecycle.
- `docs/architecture/THREAT_MODEL.md` — bootstrap/runtime threat model and controls.
- `docs/architecture/AUDIT_LOGGING.md` — append-only logging + hash-chain stub design.
- `docs/architecture/CONFIG_CONVENTIONS.md` — config precedence, version pinning, service exposure rules.

## Runbooks

- `docs/runbooks/INSTALL_UBUNTU.md` — assumptions for fresh Ubuntu hosts.
- `docs/runbooks/GRANITE_BOOTSTRAP.md` — end-to-end operator guide for Granite bootstrap.
- `docs/runbooks/TROUBLESHOOTING.md` — high-frequency operator issues and fixes.
- `docs/runbooks/ADDING_A_BOOTSTRAP.md` — contributor guide for new bootstraps.

## Roadmap

- `docs/roadmap/ROADMAP.md` — staged plan from SOC2-focused baseline through broader compliance packs.

## Documentation conventions

1. Docs are authoritative: update docs in the same PR as script/config changes.
2. Prefer explicit pinned versions in YAML config over implicit latest tags.
3. Call out localhost-only services and any externally exposed endpoints.
4. Include validation commands and expected outcomes in runbooks.
