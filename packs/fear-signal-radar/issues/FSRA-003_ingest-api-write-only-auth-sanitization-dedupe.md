Title: FSRA-003 Ingest API write-only endpoint with auth + sanitization + dedupe
Target Version: 0.1.0
Priority: P0
Labels: pack:fear-signal-radar, fsra, mvp, api, ingest, security
Owner:
Context:
Collectors need a controlled write-only ingress to submit fetched snippets. This endpoint enforces auth, validation, sanitization, size caps, and dedupe before DB persistence.
Scope:
- Implement write-only ingest endpoint(s) for collector submissions.
- Validate payload against schema and reject malformed/oversized requests.
- Authenticate collector requests and dedupe by content hash.
Non-Goals:
- Public read endpoints.
- Full-text search endpoints.
- Dashboard APIs.
Security Requirements:
- Corestack direct internet from base services is prohibited; ingest accepts internal collector traffic only.
- Collectors are write-only and cannot query existing data via ingest API.
- All text fields are sanitized and normalized before hashing and storage.
- Request size and per-item caps are enforced server-side.
- Fetch logging metadata (collector id, source URL, fetched_at) is mandatory per accepted item.

### Database Role Separation

- Postgres must define separate roles:
  - `ingest_writer` (INSERT only on signal_items; INSERT/UPDATE limited to radar_runs)
  - `synth_reader` (SELECT only; no INSERT/UPDATE/DELETE)
- Ingest API must use `ingest_writer` credentials.
- Synthesizer must use `synth_reader` credentials.
- Collectors must have NO database credentials and no direct DB network access.
- Verify via test query that ingest role cannot SELECT from signal_items.
- Verify via test query that synth_reader cannot INSERT into signal_items.
Acceptance Criteria (testable bullets):
- `services/ingest-api/` exists with endpoint implementation and request schema validation.
- Endpoint rejects unauthenticated requests with `401` and malformed payloads with `400`.
- Endpoint rejects payloads over configured byte cap with `413`.
- Endpoint returns deterministic dedupe behavior: duplicate `content_hash` yields `200`/`202` with `deduped_count >= 1` and no duplicate DB row.
- Sanitization strips or escapes control characters and HTML tags from text fields before persistence.
- Integration test fixture proves collectors cannot perform read operations through ingest route(s).
- Attempting SELECT using ingest role fails.
- Attempting INSERT using synth_reader role fails.
- Collectors cannot establish TCP connection to Postgres container.
Implementation Notes:
- Use service-level auth token scoped to collector identities.
- Keep request and response schema files under `services/ingest-api/schemas/`.
- Emit structured logs for accepted/rejected item counts.
Deliverables (file paths):
- services/ingest-api/
- services/ingest-api/schemas/
- services/ingest-api/README.md
Dependencies:
- FSRA-001
- FSRA-002
Definition of Done:
- Endpoint is committed with auth, validation, sanitization, and dedupe.
- Tests demonstrate cap enforcement and write-only contract.
- Logs include trace fields needed for operational audit.
