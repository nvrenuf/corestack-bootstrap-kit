# Packs (Contract v1)

This repository supports "packs": self-contained feature bundles that can be installed, run, and removed in a consistent way via the `./corestack` CLI.

## Pack Directory Layout

Each pack is a directory containing the following required files:

- `pack.json` (required)
- `compose.pack.yml` (required)
- `.env.example` (required)

Optional files/directories:

- `README.md`
- `n8n/workflows/` (n8n workflow exports)
- `templates/` (content/templates used by the pack)
- `schemas/` (JSON Schemas for pack-specific tool contracts)
- `ui/tiles.json` (launcher/UI integration metadata)

## pack.json (Contract)

`pack.json` must be valid JSON and include:

- `pack_id` (string): stable identifier used for installation path and compose project naming. Recommended pattern: lowercase letters, digits, and dashes (example: `tool-system`).
- `pack_version` (string): pack release version (example: `1.0.0`).
- `required_corestack_version` (string): minimum compatible CoreStack version (example: `>=0.1.0`).

Additional recommended fields (optional):

- `name` (string)
- `description` (string)
- `author` (string)

## Installation Location

Installed packs live under:

- `./packs/<pack-id>/`

The pack template lives at:

- `./packs/_template/` (not an installed pack)

## Compose Contract (compose.pack.yml)

Packs must be runnable with Docker Compose v2 and follow these rules:

- Compose project name is enforced by CoreStack:
  - `corestack-<pack-id>`
- No static container names:
  - `container_name:` is forbidden (it breaks multi-pack simultaneous runs).
- Ports must be configurable via environment variables:
  - Do not hardcode host ports like `"8080:80"`.
  - Use env interpolation for host ports, e.g. `"${PACK_HTTP_PORT}:80"`.

## Port Policy (PORT_OFFSET)

Packs must declare `PORT_OFFSET` in `.env.example`. Packs should expose all host ports via environment variables and document how to derive them using `PORT_OFFSET`.

Rationale: multi-pack runs need a predictable way to avoid port collisions without editing compose files.

Example `.env.example` snippet:

```dotenv
# This pack uses a base of 18000. When running multiple packs, offset all ports.
PORT_OFFSET=0

# Suggested convention: base + PORT_OFFSET, computed by the operator.
PACK_HTTP_PORT=18080
```

Example `compose.pack.yml` snippet:

```yaml
services:
  pack-service:
    ports:
      - "${PACK_HTTP_PORT}:80"
```

## CLI Lifecycle

Commands:

- `./corestack pack list`
- `./corestack pack install <path-or-git-url>`
- `./corestack pack remove <pack-id>`
- `./corestack up <pack-id>`
- `./corestack down <pack-id>`
- `./corestack status <pack-id>`

Behavior:

- Install validates `pack.json` + required files.
- Install creates `packs/<id>/.env` from `.env.example` if missing.
- `up/down/status` enforce `-p corestack-<pack-id>` so multiple packs can run simultaneously.

