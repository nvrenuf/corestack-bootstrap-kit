# Tool System Runbook (MVP)

This runbook covers running and operating the Tool System MVP (Tool Gateway + optional n8n backend tools).

## Run

Base stack uses the repo compose stack. See `README.md` for service ports.

Tool Gateway endpoints:
- `POST /tools/web.fetch`
- `POST /tools/web.search`

## Allowlist Configuration

Tool Gateway allowlist is enforced by hostname.

Precedence and behavior:
1. If `WEB_ALLOWLIST_FILE` is set and the file exists: load allowlist entries from the file.
2. Otherwise: load allowlist entries from `WEB_ALLOWLIST` (comma-separated).
3. Deny-by-default: if the allowlist is empty after loading, all requests are denied.
4. Wildcard is explicit opt-in only: `WEB_ALLOWLIST=*` allows all hostnames (intended for permissive profiles only).

Examples:

Allow only `example.com`:
```bash
export WEB_ALLOWLIST=example.com
```

Allowlist from file:
```bash
export WEB_ALLOWLIST_FILE=/path/to/allowlist.txt
```

Allow all (opt-in):
```bash
export WEB_ALLOWLIST=*
```

## Troubleshooting

### 403 POLICY_DENIED

Cause: hostname is not allowlisted (or allowlist is empty).

Fix:
- Add the hostname to `WEB_ALLOWLIST` or `WEB_ALLOWLIST_FILE`.
- Confirm the URL parses to the expected hostname (redirects may change the final destination).

### 500 NOT_CONFIGURED (web.search)

Cause: `web.search` is only implemented via n8n in the current MVP. If `TOOL_BACKEND=local`, `web.search` will return NOT_CONFIGURED.

Fix:
- Set `TOOL_BACKEND=n8n`
- Set:
  - `N8N_WEB_FETCH_URL` (for `web.fetch`)
  - `N8N_WEB_SEARCH_URL` (for `web.search`)

### 504 UPSTREAM_TIMEOUT

Cause: upstream request exceeded `WEB_TIMEOUT_MS`.

Fix:
- Increase `WEB_TIMEOUT_MS` cautiously.
- Reduce concurrency or restrict allowlists to fewer/known-fast domains.

## Schemas and Contract Testing

- JSON Schemas: `schemas/tools/*.schema.json`
- Contract overview: `docs/tool-system/TOOL_SCHEMAS.md`

To run the test harness (after installing dev deps):
```bash
python3 -m pip install -r tool-gateway/requirements.txt -r tool-gateway/requirements-dev.txt
pytest
```

