# Tool Schemas (Tool System MVP)

This directory defines reusable, core-owned contracts for:

- `web.fetch`
- `web.search`

The source of truth is JSON Schema under `schemas/tools/`.

## Contract goals

- Keep tool contracts reusable for gateway and workflow callers.
- Align tool execution metadata to the policy decision contract semantics (`allow`, `deny`, `require_approval`).
- Normalize errors and correlation metadata for audit/evidence linkage.

## Common Envelope

Both tools return a normalized envelope:

- `ok` (boolean): success flag
- `data` (object): tool-specific payload (present even on errors, usually `{}`)
- `error` (object|null): normalized error when `ok=false`
- `source_meta` (`tool.metadata.schema.json`):
  - `tool`, `backend`
  - policy decision metadata (`decision_id`, `outcome`, `reason_codes`)
  - optional capabilities/limits/permissions
- `correlation`:
  - `request_id`, `correlation_id`
  - optional `run_id`, `case_id`
- `timings_ms` (object): timing measurements
- `content_hash` (string|null): optional content hash for fetched content

See:
- `schemas/tools/envelope.schema.json`
- `schemas/tools/error.schema.json`
- `schemas/tools/tool.metadata.schema.json`

## Normalized errors

`error` includes:

- `code` and `message`
- `category` (`validation`, `policy`, `timeout`, `upstream`, `internal`)
- `retryable` (boolean)
- optional `http_status`
- optional `details`

## Request context requirements

Both request contracts require `context.correlation_id`, with optional run/case/workflow/module references.
This keeps the contract ready for cross-surface traceability without requiring full gateway behavior.

## web.fetch

### Request

Required:
- `agent_id`
- `purpose`
- `inputs.url` (URI)
- `context.correlation_id`

Optional:
- `request_id`
- `context.run_id`, `context.case_id`, `context.workflow_id`, `context.module_id`

Schema: `schemas/tools/web.fetch.request.schema.json`

### Response (ok=true)

`data` includes:
- `url`
- `final_url`
- `status`
- `title`
- `extracted_text`
- `fetched_at`

Schema: `schemas/tools/web.fetch.response.schema.json`

## web.search

### Request

Required:
- `agent_id`
- `purpose`
- `inputs.query`
- `context.correlation_id`

Optional:
- `request_id`
- `inputs.max_results` (1-10; default 5)
- `context.run_id`, `context.case_id`, `context.workflow_id`, `context.module_id`

Schema: `schemas/tools/web.search.request.schema.json`

### Response (ok=true)

`data` includes:
- `query`
- `results[]`:
  - `title`
  - `url`
  - `snippet`
  - `source`
  - `published_at` (string|null)
- `searched_at`

Schema: `schemas/tools/web.search.response.schema.json`
