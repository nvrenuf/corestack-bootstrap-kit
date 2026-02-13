# Corestack DB Migrations

Corestack database migrations live in `db/migrations/` and are applied by:

```bash
./scripts/corestack-db-init.sh
```

## Behavior

- waits for Postgres readiness
- applies migrations in lexical order
- records applied versions in `core.schema_migrations`
- safe to re-run

## Current migration set

- `001_core_schema.sql` creates:
  - `core` schema
  - `core.schema_migrations`
  - `core.agent_runs`
  - `core.tool_calls`
  - `core.web_fetches`
  - `core.artifacts`
