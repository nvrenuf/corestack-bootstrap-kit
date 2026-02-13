# Tool Gateway Contract

`docs/tool-gateway-openapi.yaml` defines the contract for Corestack Tool Gateway.

## Endpoints

- `GET /health`
- `POST /tools/web.fetch`
- `POST /tools/web.search`

All tool requests include metadata fields:
- `agent_id`
- `purpose`
- `request_id` (optional)
- `inputs` object

All responses use a normalized envelope:
- `ok` (boolean)
- `data` (object)
- `error` (object or `null`)
- `source_meta` (object)
- `timings_ms` (object)
- `content_hash` (string or `null`)

## Error Codes

- `400 BAD_REQUEST`: invalid payload or missing required fields.
- `403 POLICY_DENIED`: policy rejected request (for example, non-allowlisted domain).
- `429 RATE_LIMITED`: request throttled.
- `500 INTERNAL_ERROR`: unhandled internal failure.
- `504 UPSTREAM_TIMEOUT`: upstream request exceeded timeout.

## Acceptance Commands

```bash
# Inspect contract file
sed -n '1,240p' docs/tool-gateway-openapi.yaml

# Validate basic OpenAPI presence of required endpoints
grep -n '/health\|/tools/web.fetch\|/tools/web.search' docs/tool-gateway-openapi.yaml
```
