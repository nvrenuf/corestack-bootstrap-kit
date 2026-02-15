# Tool System Threat Model (MVP)

Scope: Tool Gateway (`tool-gateway/`) and n8n tool workflows (`n8n/workflows/*web-*.json`) powering `web.fetch` and `web.search`.

## Trust Boundaries

1. Agent/client -> Tool Gateway (`/tools/*`)
2. Tool Gateway -> n8n webhooks (when `TOOL_BACKEND=n8n`)
3. n8n -> internet (HTTP requests / search provider)
4. Tool Gateway logs -> log sink / filesystem

## Assets

- Egress capability (ability to reach external networks)
- Any secrets in env vars / n8n credentials
- Retrieved content (may be malicious, large, or sensitive)
- Audit logs (contain URLs, queries, decision metadata)

## Threats and Mitigations

### SSRF / Internal Network Access

Threat: An attacker uses `web.fetch` (or `web.search` provider URLs) to access internal services (cloud metadata, localhost, RFC1918).

MVP mitigations:
- Deny-by-default allowlist at Tool Gateway. If allowlist is empty, requests are denied.
- Explicit opt-in wildcard: `WEB_ALLOWLIST=*` (intended for permissive profiles only).

Known gaps (track for later hardening):
- Redirect chains may leave the allowlisted hostname.
- Hostname allowlisting does not prevent DNS rebinding or IP literal access.
- No explicit private IP/ranges blocklist at the gateway (yet).

### Egress Abuse / Data Exfiltration

Threat: Tool calls are used to exfiltrate data to attacker-controlled endpoints.

MVP mitigations:
- Allowlist enforcement (secure profile should be narrowly scoped).
- Audit logging for every allow/deny decision with URL/query context (no secrets).

### Prompt Injection via Retrieved Content

Threat: Retrieved pages contain instructions that manipulate downstream agents (\"ignore prior instructions\", \"send secrets\", etc.).

MVP mitigations:
- Treat retrieved content as untrusted input.
- Document safe agent behavior: do not execute actions or reveal secrets based on retrieved content without additional validation.

### Oversize / Resource Exhaustion

Threat: Large responses or slow endpoints cause memory/CPU exhaustion or timeouts.

MVP mitigations:
- Timeout controls (`WEB_TIMEOUT_MS`).
- Max-byte controls (`WEB_MAX_BYTES` in Tool Gateway; n8n workflows also have limits).
- Content truncation in local fetch implementation.

### Logging / Privacy Leakage

Threat: Logs capture secrets (query params, tokens) or sensitive content.

MVP mitigations:
- Log structured decision metadata; avoid logging full response bodies.
- Document redaction rules and what must never be logged.

### Credential Misuse (n8n)

Threat: Search provider keys and other credentials are exposed in workflow exports or logs.

MVP mitigations:
- Use n8n Credentials for secrets, not workflow JSON literals.
- Keep provider config placeholders in workflow templates; inject secrets at runtime.

