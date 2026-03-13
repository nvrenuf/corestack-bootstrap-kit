# GITHUB_ISSUE_CLOSEOUT_RUNBOOK.md

This runbook captures the exact GitHub issue status updates to apply after the current integration baseline reconciliation.

## Why this file exists

GitHub issue editing is not available in this environment (`gh` CLI is unavailable), so closeout/status updates are prepared here for manual execution.

## Issues to close now

- #17 — Define tool schemas: web.fetch + web.search

### Close note to paste for #17

Completed in thin-slice MVP scope.

Implemented and merged in PR #28 with commit `2046ecd` (tool request/response contracts and schema validation foundations for `web.fetch` and `web.search`).

Closing this implementation issue as complete for minimum acceptance criteria; broader policy/tooling hardening remains tracked in #4, #18, and #21.

## Issues to mark in progress

- #4 — Design and build policy engine and tool gating
- #18 — Implement Tool Gateway enforcement layer (allowlist, rate limit, payload validation)
- #21 — Add audit logging + security events (requests, domains, decisions, failures)

### Status note to paste for #4

Status update: in progress (partial thin-slice landed).

PR #29 / commit `31c49b4` landed minimal governed tool-gateway scaffolding and policy hook points, but full policy-engine acceptance criteria remain open (comprehensive limits/default-deny hardening and complete enforcement behavior).

### Status note to paste for #18

Status update: in progress (partial thin-slice landed).

PR #29 / commit `31c49b4` landed gateway scaffolding, but full enforcement acceptance criteria (strict allowlist controls, complete payload/rate/timeout enforcement, and hardened negative-path behavior) are still open.

### Status note to paste for #21

Status update: in progress (not complete).

Structured audit/event logging for runs, tools, evidence, and approvals is still pending as an explicit implementation step. Keep open until taxonomy, correlation, and persistence acceptance criteria are fully met.

## Issues to keep open

### Umbrella / platform issues (keep open)

- #2 — Define and implement Corestack control plane architecture
- #4 — Design and build policy engine and tool gating
- #10 — Build workflow engine and orchestration layer
- #9 — Implement model management and routing layer
- #12 — Define product surface area: UI/UX, admin, and day-2 operations
- #16 — Epic: Controlled Internet Access (Tool Gateway + n8n)
- #18 — Tool Gateway enforcement layer
- #21 — Audit logging + security events

### Planning-only close candidates (already satisfied by merged docs/artifacts)

If corresponding issues exist as standalone planning tickets, close them with "planning artifact merged" notes:

- Core vs Module boundary
- Security/OSINT Module 1 definition
- Agent sandbox / gatekeeper security model
- Evidence and case object model
- Approvals and HITL decision model

Use close note template:

Planning artifact is complete and merged to mainline docs.

Closing as planning complete. Any follow-on implementation work remains tracked in implementation issues.

## Commit / PR references used in this runbook

- PR #28: `8cd6592`, `1a2b085`, `1c87d62`, `821abc0`, `0a8d76a`, `2046ecd`
- PR #29: `31c49b4`
- PR #31: `492f359`
- PR #32: `69e72a7`
