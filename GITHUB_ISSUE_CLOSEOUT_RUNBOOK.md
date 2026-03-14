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

Status update: in progress (MVP thin-slice hardening landed; full platform enforcement still open).

PR #29 / commit `31c49b4` landed gateway scaffolding. Current branch head (PR TBD) finishes MVP thin-slice enforcement hardening by routing supported tool execution through one core-owned path with schema-first validation, centralized allowlist checks, payload-byte and timeout enforcement, fail-closed normalized deny/error outcomes, and structured audit-compatible request/decision/result emissions for `web.fetch` and `web.search`.

Keep #18 open for non-MVP breadth (strict enterprise allowlist/rate-limit/timeout platform controls and broader connector/provider enforcement).

### Status note to paste for #21

Status update: completed for MVP thin slice.

Structured audit/event logging scaffolding landed in commit `c0fae98`. Current branch head (PR TBD) hardens MVP supported tool-gateway security events with explicit request/result/failure emissions, stable deny/failure reason context, explicit fail-closed timeout events, and redaction-safe URL audit fields. Keep #21 open for non-MVP observability breadth and taxonomy governance.

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


## Issues to close when artifact storage hardening PR merges

- #TBD — Issue 4.2: Implement artifact storage linkage and metadata persistence

### Close note to paste for Issue 4.2

Completed for MVP thin-slice scope.

Hardened artifact persistence/linkage behavior with stricter storage metadata normalization and validation, lifecycle/storage-state consistency enforcement, stronger run/case linkage checks, and tighter evidence/finding reference-integrity boundaries while keeping broad repository/export/search infrastructure explicitly out of scope (commit `current branch head`, PR TBD).

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

## Issues to close when run/case review surface PR merges

- #TBD — Issue 8.1: Implement run detail and case detail review surfaces

### Close note to paste for Issue 8.1

Completed in thin-slice MVP scope.

Implemented core-owned run detail and case detail review surfaces in the shared control plane shell, with module-aware content projected from existing run/case/evidence/artifact/finding/approval/audit contracts. The slice focuses on reviewability and workflow traceability (including sparse-data-safe rendering) without expanding into a full analyst workbench or reporting dashboard (commit `current branch head`, PR TBD).

Keeping deep artifact/evidence inspection and richer linked audit lookup tracked under Issue 8.2.

## Issues to close when artifact/evidence detail PR merges

- #TBD — Issue 8.2: Implement artifact/evidence detail and linked audit lookup

### Close note to paste for Issue 8.2

Completed in thin-slice MVP scope.

Implemented a core-owned Files/Artifacts review surface that projects artifact and evidence detail (with optional thin finding detail), including identity/type/status, run/case linkage, provenance and storage/integrity metadata where available, linked object summaries, and recent correlated audit event history lookups via existing audit correlation fields (`artifact_id`, `evidence_id`, `finding_id`) with graceful sparse-data fallback (commit `current branch head`, PR TBD).

Keeping broader forensic console, deep timeline exploration, and export/report packaging out of scope for subsequent issues.

## Issues to close when module registration slice PR merges

- #TBD — Issue 7.1: Register Security/OSINT Module 1 through the core module contract

### Close note to paste for Issue 7.1

Completed in thin-slice MVP scope.

Implemented a reusable core-owned module registration contract (stable module identifiers, display labels, availability status, declared capabilities, control-plane metadata, registration/loading shape, and future association fields) and registered Security/OSINT Module 1 through that contract for launcher/modules visibility without introducing marketplace behavior (commit `current branch head`, PR TBD).

Keeping full Module 1 workflow implementation tracked under Issue 7.2.

## Issues to close when alert triage workflow PR merges

- #TBD — Issue 7.2: Implement the first end-to-end Module 1 workflow: Alert triage and investigation

### Close note to paste for Issue 7.2

Completed in thin-slice MVP scope.

Implemented the first end-to-end Security/OSINT Module 1 workflow path from launcher initiation through run creation, case linkage, policy decisioning with approval checkpoint handling, model routing/execution participation, evidence/artifact/finding creation, and structured audit/event emissions using existing core contracts (commit `current branch head`, PR TBD).

Keeping second/third Module 1 workflows and broader analyst workbench/dashboard expansion out of scope for subsequent issues.

## Issue status note to paste for #22 (integration tests + validation harness)

Status update: completed for MVP thin-slice sequencing (keep issue open for non-MVP matrix breadth if desired).

Implemented a narrow, CI-friendly validation harness for the currently supported Corestack MVP path, including tool-gateway integration/E2E tests that verify golden-path allow behavior, malformed/disallowed fail-closed behavior, oversize and timeout fail-closed behavior, schema/contract conformance, and normalized audit/security event expectations. Added a repeatable runner (`scripts/tool-system/validate-mvp-slice.sh`, `make mvp-validation`) and preserved compatibility checks for the current Security/OSINT Alert Triage and Investigation workflow path.

This does not claim broad generic platform test-framework completion or future tool/provider/module matrix coverage.


## Issue status note to paste for #23 (docs: runbook + configuration + threat model notes)

Status update: completed for MVP thin-slice sequencing (keep broader platform-grade operations/docs breadth as future work).

Hardened the current supported documentation path so operators can run and validate MVP behavior without code spelunking: updated runbook execution/configuration/validation guidance, added implementation-aware threat boundary and fail-closed assumptions, clarified audit/security-event review expectations, and documented known deferred scope explicitly to avoid over-claiming unfinished breadth.

---

## Issue #20 — Unified Investigation Workspace (Security/OSINT Module 1 thin operator surface)

Status update: completed for MVP thin-slice scope.

Implemented a single core-owned investigation workspace route that unifies one investigation context (case + linked run + findings + evidence/artifacts + recent linked audit/security events + approval/review state) using existing contracts. No new object model was introduced, and scope intentionally excludes broad forensic/timeline/report-export expansion.

Keep future deep-investigation UX and report/export breadth as separate non-MVP issues.


## Issue status note to paste for investigation drill-in and navigation polish thin slice

Status update: completed for MVP thin-slice scope.

Deepened the existing core-owned investigation workspace by adding thin drill-in pivots across findings, artifacts/evidence detail, linked run/case detail, approvals queue, and filtered logs/audit context using existing correlation/linkage contracts. Also polished operator UX by removing numeric menu prefixes and updating operator-facing Ollama utility/startup endpoint defaults to `http://localhost:8080` without changing internal health/reachability checks.

This does not claim full forensic platform completion; broad timeline/report/export and cross-module workbench behavior remain deferred.
