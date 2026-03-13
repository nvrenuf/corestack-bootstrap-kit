# GITHUB_ISSUE_CLOSEOUT_RUNBOOK.md

This runbook captures the exact GitHub issue status updates to apply after the current integration baseline reconciliation.

## Why this file exists

GitHub issue editing is not available in this environment (`gh` CLI is unavailable), so closeout/status updates are prepared here for manual execution.

## Issues to close now

- #17 — Define tool schemas: web.fetch + web.search
- #9 — Implement model management and routing layer (Issue 6.1 thin-slice baseline)

### Close note to paste for #17

Completed in thin-slice MVP scope.

Implemented and merged in PR #28 with commit `2046ecd` (tool request/response contracts and schema validation foundations for `web.fetch` and `web.search`).

Closing this implementation issue as complete for minimum acceptance criteria; broader policy/tooling hardening remains tracked in #4, #18, and #21.

### Close note to paste for #9

Completed for MVP Issue 6.1 thin-slice scope.

Implemented a core-owned model registry and local-first routing contract with stable model identifiers, model kind/provider metadata, availability and trust tags, policy-compatible provider restriction hooks, structured route-result/error shapes, and audit-compatible routing decision records (commit `current branch head`, PR TBD).

Keeping advanced execution logging/fallback orchestration and broader provider integrations tracked under Issue 6.2 and subsequent model-routing work.

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

Status update: completed for MVP thin slice.

Structured audit/event logging scaffolding for runs, tools, evidence/artifacts/findings, and approval-compatible placeholder events landed in commit `c0fae98` (PR TBD), including correlation references and minimal persistence for reconstructable event history.

## Issues to keep open

### Umbrella / platform issues (keep open)

- #2 — Define and implement Corestack control plane architecture
- #4 — Design and build policy engine and tool gating
- #10 — Build workflow engine and orchestration layer
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

## Issues to close when approval slice PR merges

- #5.1 — Define and implement the approval object model and state machine
- #5.2 — Add workflow approval checkpoints and approval queue/detail surfaces

### Close note to paste for #5.1

Completed in thin-slice MVP scope.

Implemented durable approval objects with stable identifiers, run/workflow/case/policy linkage, pending/approved/denied/expired state machine transitions, and approval lifecycle audit events aligned to the structured audit model.

### Close note to paste for #5.2

Completed in thin-slice MVP scope.

Implemented minimal run/workflow approval checkpoints using existing policy decision semantics plus core-owned approvals queue/detail UI surfaces with approve/deny actions that resume or terminate gated runs and persist audit trail transitions.


## Issues to close when model execution hook PR merges

- #TBD — Issue 6.2: Add model execution logging and external-provider restriction hooks

### Close note to paste for Issue 6.2

Completed in thin-slice MVP scope.

Implemented structured model execution audit hooks (`model.execution.requested`, `model.execution.decisioned`, `model.execution.result`, and `model.execution.restriction_blocked`) with run/workflow/case/actor/model correlation and route-decision compatibility, plus external-provider restriction blocking hooks for local-only/policy-disallowed execution paths (commit `current branch head`, PR TBD).

Keeping broad provider integrations and full inference orchestration out of scope for subsequent issues.

## Issues to close when module registration slice PR merges

- #TBD — Issue 7.1: Register Security/OSINT Module 1 through the core module contract

### Close note to paste for Issue 7.1

Completed in thin-slice MVP scope.

Implemented a reusable core-owned module registration contract (stable module identifiers, display labels, availability status, declared capabilities, control-plane metadata, registration/loading shape, and future association fields) and registered Security/OSINT Module 1 through that contract for launcher/modules visibility without introducing marketplace behavior (commit `current branch head`, PR TBD).

Keeping full Module 1 workflow implementation tracked under Issue 7.2.
