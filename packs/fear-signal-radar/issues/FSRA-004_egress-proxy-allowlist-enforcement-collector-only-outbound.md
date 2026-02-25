Title: FSRA-004 Egress proxy allowlist enforcement (collector-only outbound)
Target Version: 0.1.0
Priority: P0
Labels: pack:fear-signal-radar, fsra, mvp, network, egress, security
Owner:
Context:
External fetching must be centralized and policy-controlled. This issue creates an egress proxy (or equivalent policy layer) that all collectors must use.
Scope:
- Implement centralized outbound policy enforcement for collectors.
- Enforce domain allowlist, request limits, and rate limiting.
- Deny all non-collector outbound traffic by default for this pack path.
Non-Goals:
- Global proxy rollout for all packs.
- UI for dynamic allowlist edits.
- Advanced anti-bot bypass techniques.
Security Requirements:
- No Corestack direct internet access outside approved egress proxy.
- Only collector services may use outbound network path.
- Fetch logging must include destination domain, path, status code, bytes, and latency.
- Enforce strict allowlist and deny-by-default behavior.
- Apply centralized rate limiting and timeout caps.
- No Corestack-internal service (postgres, ingest-api, synthesizer) may have default route to internet.
- DNS resolution for collectors must be routed through proxy-controlled path where possible.
Acceptance Criteria (testable bullets):
- `services/egress-proxy/` (or documented equivalent path) exists with policy configuration files.
- Requests to non-allowlisted domains are blocked with explicit deny response.
- Requests from non-collector service identities are blocked.
- Per-collector and global rate limits are enforced and test-covered.
- Logs capture domain, method, response status, bytes transferred, and request duration for every outbound attempt.
- Collector integration docs show all outbound calls routed through proxy endpoint.
- Direct outbound HTTP(S) from collector container (bypassing egress-proxy) fails.
- Direct outbound HTTP(S) from ingest-api container fails.
- Direct outbound HTTP(S) from synthesizer container fails.
- Egress-proxy rejects requests to non-allowlisted domains with explicit log entry.
- All outbound collector traffic is observable in proxy logs with:
  - url
  - timestamp
  - status
  - duration
  - bytes transferred
Implementation Notes:
- Align domain allowlist structure with topic config `allowed_domains`.
- Keep policy files declarative to support audits.
- Make timeout and max-byte caps configurable via env vars.
Deliverables (file paths):
- services/egress-proxy/
- services/egress-proxy/config/
- services/egress-proxy/README.md
Dependencies:
- FSRA-001
Definition of Done:
- Egress policy layer is committed and enforceable in local integration tests.
- Deny-by-default and collector-only constraints are validated.
- Logging and rate limiting behavior is documented.
