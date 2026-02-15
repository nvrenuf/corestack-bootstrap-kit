# Tool Schemas (Tool System MVP)

This directory defines the Tool System MVP contracts for the Tool Gateway tools:

- `web.fetch`
- `web.search`

The source of truth is JSON Schema under `schemas/tools/`.

## Common Envelope

Both tools return a normalized envelope:

- `ok` (boolean): success flag
- `data` (object): tool-specific payload (present even on errors, usually `{}`)
- `error` (object|null): normalized error when `ok=false`
- `source_meta` (object): metadata about the tool/backend
- `timings_ms` (object): timing measurements
- `content_hash` (string|null): optional content hash for fetched content

See:
- `schemas/tools/envelope.schema.json`
- `schemas/tools/error.schema.json`

## web.fetch

### Request

POST `http://<tool-gateway>/tools/web.fetch`

Required:
- `agent_id` (string)
- `purpose` (string)
- `inputs.url` (string, URI)

Optional:
- `request_id` (string)

Schema: `schemas/tools/web.fetch.request.schema.json`

### Response (ok=true)

`data` includes:
- `url` (string)
- `final_url` (string)
- `status` (integer)
- `title` (string)
- `extracted_text` (string)
- `fetched_at` (string, date-time)

Schema: `schemas/tools/web.fetch.response.schema.json`

## web.search

### Request

POST `http://<tool-gateway>/tools/web.search`

Required:
- `agent_id` (string)
- `purpose` (string)
- `inputs.query` (string)

Optional:
- `request_id` (string)
- `inputs.max_results` (integer, 1-10; default 5)

Schema: `schemas/tools/web.search.request.schema.json`

### Response (ok=true)

`data` includes:
- `query` (string)
- `results` (array):
  - `title` (string)
  - `url` (string)
  - `snippet` (string)
  - `source` (string)
  - `published_at` (string|null)
- `searched_at` (string, date-time)

Schema: `schemas/tools/web.search.response.schema.json`

