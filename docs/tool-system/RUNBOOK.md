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
- Builds `scripts/tool-system/Dockerfile.test` once (or reuses an existing local image).
- Runs tests inside the pinned image so test execution itself does not rely on `pip install`.
- Fails if pytest reports skipped tests (including schema validation skips).

Local fallback (no Docker available):
```bash
./scripts/tool-system/test.sh local
```
This mode prepends `vendor/python` to `PYTHONPATH` so schema-test dependencies are available without network access.

Notes for restricted/no-internet hosts:
- If the image is already present locally, docker-mode tests run fully offline.
- If Docker is not available, local mode uses vendored Python modules from `vendor/python`.
