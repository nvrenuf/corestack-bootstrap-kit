# Tool System Runbook (MVP)

This runbook covers running and operating the Tool System MVP (Tool Gateway + n8n-backed tools).

## Run

Tool Gateway endpoints:
- `POST /tools/web.fetch`
- `POST /tools/web.search`

Set `TOOL_BACKEND=n8n` to route both tools through n8n webhooks.

## n8n workflow import and execution

Workflows for Milestone 1 E2E live in:
- `n8n/workflows/web.fetch.json`
- `n8n/workflows/web.search.json`

Import options:
1. n8n UI → **Workflows** → **Import from file** (import both files).
2. CLI/script flow: use `n8n/scripts/import-workflows.sh` as a template for API-based import in your environment.

After import, activate both workflows and ensure webhook paths are unchanged.

### Expected webhook URLs

Tool Gateway expects these URLs when `TOOL_BACKEND=n8n`:
- `N8N_WEB_FETCH_URL` default: `http://n8n:5678/webhook/tools/web.fetch`
- `N8N_WEB_SEARCH_URL` default: `http://n8n:5678/webhook/tools/web.search`

If you use test webhooks in n8n UI, update env vars to those test URLs.

### Required environment variables

Tool Gateway:
- `TOOL_BACKEND=n8n`
- `N8N_WEB_FETCH_URL` (optional override; default above)
- `N8N_WEB_SEARCH_URL` (optional override; default above)
- `TOOL_SHARED_SECRET` (optional but recommended; sent as `X-Tool-Secret`)
- `WEB_ALLOWLIST` and/or `WEB_ALLOWLIST_FILE`
- `WEB_TIMEOUT_MS`
- `WEB_MAX_BYTES`
- `TOOL_RATE_LIMIT_PER_MINUTE`

n8n workflow environment / credential placeholders:
- `TOOL_SHARED_SECRET` (must match gateway when enabled)
- `SEARCH_API_URL` (generic provider URL for `web.search`)
- `SEARCH_API_KEY` (generic provider API key for `web.search`)

If `SEARCH_API_URL` or `SEARCH_API_KEY` is missing, `web.search` returns a normalized provider config error:
- HTTP `500`
- body includes `code: CONFIG_MISSING`

## Allowlist Configuration

Tool Gateway allowlist is enforced by hostname before calling n8n.

Precedence and behavior:
1. If `WEB_ALLOWLIST_FILE` is set and the file exists: load allowlist entries from the file.
2. Otherwise: load allowlist entries from `WEB_ALLOWLIST` (comma-separated).
3. Deny-by-default: if the allowlist is empty after loading, all requests are denied.
4. Wildcard is explicit opt-in only: `WEB_ALLOWLIST=*` allows all hostnames (intended for permissive profiles only).

## Audit Logging

Tool Gateway emits JSONL audit events for tool invocations (policy decisions, upstream completion, and errors).

Default: events are written to stdout (one JSON object per line).

To write to a file instead, set:
- `AUDIT_LOG_PATH=/path/to/audit.jsonl`

Example event (single line):
```json
{"timestamp":"2026-01-01T00:00:00+00:00","tool_name":"web.fetch","decision":"deny","reason_code":"POLICY_DENIED","domain":"example.com","url":"https://example.com","http_status":403,"duration_ms":1.23,"bytes_in":123,"bytes_out":456,"requester":"demo-agent","correlation_id":"req-123","upstream":"local","error_code":"POLICY_DENIED"}
```

Retention guidance:
- If logging to stdout: rely on your runtime log driver (Docker logging, systemd journal, cloud log ingestion) and configure retention/rotation there.
- If logging to a file via `AUDIT_LOG_PATH`: use filesystem rotation (e.g., logrotate) and a retention policy appropriate to your security/compliance requirements.

## Local dev runner

Use:
```bash
scripts/tool-system/dev.sh
```

This starts:
- a lightweight local mock n8n server (`127.0.0.1:${MOCK_N8N_PORT:-18080}`)
- Tool Gateway (`0.0.0.0:${TOOL_GATEWAY_PORT:-8787}`)

The script sets gateway webhook env vars to the mock server so E2E requests can be run locally.

## Troubleshooting

### 401 UNAUTHORIZED

Cause: n8n rejected `X-Tool-Secret`.

Fix:
- Set matching `TOOL_SHARED_SECRET` in both Tool Gateway and n8n runtime env.

### 403 POLICY_DENIED

Cause: hostname is not allowlisted (or allowlist is empty).

Fix:
- Add hostname to `WEB_ALLOWLIST` or `WEB_ALLOWLIST_FILE`.

### 429 RATE_LIMITED

Cause: gateway in-memory per-tool minute rate limit exceeded.

Fix:
- Reduce request burst or raise `TOOL_RATE_LIMIT_PER_MINUTE`.

### 504 UPSTREAM_TIMEOUT

Cause: upstream request exceeded `WEB_TIMEOUT_MS`.

Fix:
- Increase `WEB_TIMEOUT_MS` cautiously.

## Schemas and Contract Testing

- JSON Schemas: `schemas/tools/*.schema.json`
- Contract overview: `docs/tool-system/TOOL_SCHEMAS.md`

Run all tool-system tests (schema enforcement enabled):
```bash
./scripts/tool-system/test.sh
```

The script runs pytest and fails if any schema validation test is skipped.

## Offline / restricted network test execution

Use the reproducible Docker test runner:

```bash
./scripts/tool-system/test.sh
```

Behavior:
- Builds `tests/tool-system/Dockerfile` (Docker layer cache keeps rebuilds fast).
- Runs pytest inside the pinned image, mounting the repository read-only and writing only to a temporary `/tmp` mount.
- Produces a JUnit report and fails if **any** tests are skipped (schema validation is mandatory in this path).

Developer-only local fallback (not used by CI):
```bash
./scripts/tool-system/test.sh local
```
This mode requires local installs of `pytest`, `jsonschema`, and `referencing`.

Prerequisites:
- Docker (required for the reproducible/offline path).

Notes for restricted/no-internet hosts:
- As long as the test image is already cached on the machine, `./scripts/tool-system/test.sh` runs with no pip network access.

## Compose project naming for multi-pack execution

When running multiple CoreStack packs side-by-side, use a unique Docker Compose project name per pack via either:
- `docker compose -p <project-name> ...`, or
- `COMPOSE_PROJECT_NAME=<project-name> docker compose ...`

Compose prefixes resources (containers, networks, volumes) by project name, which prevents collisions across simultaneous pack runs.
