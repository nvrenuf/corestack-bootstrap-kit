# PR Summary

## Branch

`feature/postgres-core-schema`

## What was added

1. Postgres service added to default compose stack
- `postgres:16` service on `5432:5432`
- persistent Docker volume: `corestack-postgres-data`
- healthcheck with `pg_isready`
- env template values in `deploy/compose/.env.example`

2. Core DB schema + baseline migrations
- `db/migrations/001_core_schema.sql`
- creates `core` schema
- creates `core.schema_migrations`
- creates baseline tables:
  - `core.agent_runs`
  - `core.tool_calls`
  - `core.web_fetches`
  - `core.artifacts`
- adds baseline indexes and restricted future role pattern (`corestack_agent` NOLOGIN)

3. Idempotent migration runner
- `scripts/corestack-db-init.sh`
- waits for Postgres readiness
- applies migrations in order
- tracks applied versions in `core.schema_migrations`
- safe to run multiple times
- wired into `scripts/granite/bootstrap-launcher.sh`

4. Docs + uninstall updates
- README includes Postgres setup, init, verify, and backup examples
- uninstall keeps volumes by default
- `--purge-data` / `--remove-volumes` deletes all stack volumes including Postgres data

## Acceptance commands

```bash
# 1) Start stack
docker compose --env-file deploy/compose/.env -f deploy/compose/docker-compose.yml up -d

# 2) Apply DB init/migrations
./scripts/corestack-db-init.sh

# 3) Verify core schema + tables
psql "postgresql://corestack:change_me@localhost:5432/corestack" -c "\dn" -c "\dt core.*"

# 4) Uninstall without deleting data
./scripts/granite/uninstall.sh

# 5) Uninstall and purge all volumes (deletes Postgres data)
./scripts/granite/uninstall.sh --purge-data
```
