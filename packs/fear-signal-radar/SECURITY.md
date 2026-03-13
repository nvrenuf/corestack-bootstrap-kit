# FSRA Security Model

## Non-Negotiable Constraints

- No direct internet access for Corestack services by default.
- Collectors are the only outbound components and must use policy-controlled egress.
- Ingest API is write-only for signal ingest clients.
- No secrets are committed in source or docs.

## Database Role Separation

- Privilege roles (NOLOGIN):
  - `ingest_writer`: `INSERT` on `signal_items`, `INSERT/UPDATE` on `radar_runs`
  - `synth_reader`: `SELECT` on `signal_items` and `radar_runs`
- Service login roles (LOGIN, INHERIT):
  - `ingest_api` inherits `ingest_writer`
  - `synth_api` inherits `synth_reader`

Direct table grants are applied to privilege roles only.

## Ingest Controls

- Bearer token authentication on ingest endpoints.
- Request body size limit enforcement.
- HTML/script/style sanitization and text caps before write.
- Dedupe via hash + DB unique constraint handling.

## Logging Controls

- Structured logs include operational metadata only.
- No full raw content logging.
- Include request id / collector id for traceability.

## Operational Security Checks

- Run `make doctor` before DB-backed integration test runs.
- Validate role boundaries with `tests/test_db_permissions.py`.
- Validate ingest auth and write-only behavior with ingest API tests.
