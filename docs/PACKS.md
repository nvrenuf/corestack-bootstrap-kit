# Corestack Packs

A **pack** is an installable add-on repository that extends Corestack runtime behavior without changing Corestack core code.

## Required Files (Pack Repository)

Every pack repository must contain:

- `pack.json`
- `compose.pack.yml`
- `.env.example`

## Optional Folders

A pack may also include:

- `n8n/workflows/`
- `templates/`
- `schemas/`
- `ui/`

## pack.json Required Fields

`pack.json` must validate against `schemas/packs/pack.schema.json` and include these required fields:

- `id`
- `name`
- `version`
- `description`
- `required_corestack_version`
- `ports`: `{ "offset_required": true, "exposed": [...] }`
- `services`: `[ ... ]` (human-readable service descriptions)

## Port Policy

Packs must not hardcode host ports. Host ports must be expressed through environment variables and a `PORT_OFFSET` strategy.

- Required: `.env.example` declares `PORT_OFFSET`
- Required: compose port mappings use env interpolation for host ports

Example:

```yaml
ports:
  - "${PACK_HTTP_PORT}:8080"
```

## Prohibited Compose Settings

- `container_name` is prohibited in `compose.pack.yml`

Reason: static container names break multi-pack concurrency and compose project isolation.

## Runtime Isolation

Installed packs live at:

- `./packs/<pack-id>/`
- `./corestack pack install` copies pack sources into that directory.

Corestack executes packs with project isolation:

- compose project name: `corestack-<pack-id>`
- base stack is started independently with `./corestack up` (project `corestack`)
- pack lifecycle commands (`up/down/status/logs <pack-id>`) run pack services only

```bash
docker compose \
  -f packs/<id>/compose.pack.yml \
  --env-file packs/<id>/.env \
  -p corestack-<id> <cmd>
```

## Multi-Pack Safety Checks

Corestack fails fast when validating a pack if:

- `compose.pack.yml` contains `container_name:`
- `compose.pack.yml` appears to define literal host ports instead of env-based host ports

Heuristic limitation: port validation uses a line-based pattern check for common `HOST:CONTAINER` shorthand entries and may not catch every advanced YAML form.

## Security Notes

- Do not commit secrets into pack repositories.
- Use `.env` and n8n credentials/secrets for runtime secret material.
- Tool/network allowlists default to secure deny-by-default behavior; packs must opt in explicitly.
