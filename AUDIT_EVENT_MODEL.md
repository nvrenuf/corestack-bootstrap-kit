# AUDIT_EVENT_MODEL.md

## 1. Purpose

The audit/event model exists to make Corestack actions reconstructable, reviewable, and governable across workflows, tools, policy decisions, approvals, and evidence handling.

It matters because Corestack is one desktop/control plane, not a collection of disconnected module runtimes. The same platform contracts must produce a consistent event trail across all modules so operations, review, and trust do not fragment.

For Security/OSINT, this is critical for:

- investigation reconstruction
- reviewer and approver confidence
- defensible evidence handling
- post-incident review and governance

## 2. Design intent

The audit/event model is a structured event trail, not ad hoc logging.

Design intent:

- Core-owned platform capability, not module-specific behavior
- Consistent event taxonomy and correlation model across workflows
- Supports reconstruction, auditability, review, and future export
- Preserves product identity: modules and packs extend Corestack but do not replace core contracts

## 2A. Current implementation status

Implemented now (MVP foundation slice):

- structured event emission scaffolding exists in core for run lifecycle, governed tool activity, policy decisions, approvals, model execution, and evidence/artifact/finding linkage
- events carry correlation context across run, case, and related governed action paths
- policy decisions and approval-required/approved/denied outcomes are represented as first-class auditable events
- reviewer actions in approval flows are captured as structured approval lifecycle events
- model routing/execution decisions are emitted with restriction-aware outcomes, including blocked external-provider attempts

Still deferred (by design):

- finalized long-term taxonomy/versioning governance
- retention tier optimization and cross-tenant analytics layers
- tamper-evident hardening beyond baseline integrity-compatible storage
- broad forensic export packaging and external schema standardization

This document remains the canonical architecture and capability model for audit/events. `IMPLEMENTATION_STATUS.md` is the execution tracker for what has landed versus what is still open.

## 2B. MVP security-event operating assumptions

For the currently supported tool-gateway + Module 1 slice:

- Security/audit events are part of the operational contract, not optional diagnostics.
- Reviewability depends on stable correlation fields (`run_id`, `case_id`, tool and evidence object references, and reason/error codes).
- Redaction posture is baseline: URL query/fragment values are stripped in gateway-emitted URL audit fields.
- Logs are not a sensitive-data vault; operators must avoid raw-secret/PII inclusion in request payload conventions and downstream tooling.
- This model improves reconstruction but does not yet provide immutable/tamper-proof guarantees in MVP scope.

## 3. What an event is

An event is a typed, timestamped, structured record of a significant platform action or decision.

Each event should include at minimum:

- **event id**: stable unique identifier for the record
- **event type**: taxonomy class describing the action or decision
- **timestamp**: canonical event time (UTC)
- **actor/reference**: user, service, system, or automation identity that initiated or produced the event
- **run/workflow/case correlation**: references linking the event to run, workflow, and case context
- **artifact/evidence/finding references**: object ids for evidence-bearing or review-relevant objects
- **structured payload/details**: typed metadata, outcome fields, reason codes, and error/limit details where applicable

## 4. Event categories

Minimum categories for the platform model:

- **Run lifecycle events**: run created, started, blocked, resumed, failed, completed, cancelled
- **Tool request / tool decision / tool result events**: requested action, policy outcome, execution result envelope
- **Policy decision events**: allow/deny/approval-required decisions with reason codes and limits
- **Artifact/evidence/finding create/update/link events**: object creation, mutation, linkage, and provenance updates
- **Approval-related compatibility events**: approval requested, assigned, escalated, approved, denied, overridden, expired
- **Case linkage events**: run-to-case linkage, evidence-to-case linkage, finding-to-case linkage, case state transitions

## 5. Correlation model

Events must be correlation-first so reviewers can reconstruct chain-of-action without inference-heavy guesswork.

Each event should relate to one or more of:

- **run**: the execution instance where the action happened
- **workflow**: the reusable workflow definition or version
- **case**: investigative case context
- **actor**: user, approver, service identity, or system principal
- **policy decision**: policy evaluation record that allowed, denied, or gated action
- **artifact**: file-like output reference (snapshot, report, export component)
- **evidence item**: evidence object linked to provenance and timeline
- **finding**: analytic conclusion or claim linked to supporting evidence

## 6. Why this is a selling point

This capability is a concrete product advantage, not background plumbing.

- **Reconstructable chain of actions**: teams can replay what happened across workflow steps and decisions.
- **Traceable governed decisions**: policy outcomes and approval actions are visible and attributable.
- **Evidence-linked activity history**: claims, findings, and outputs remain tied to source artifacts and case context.
- **Better analyst trust**: operators can verify how results were produced rather than treating outputs as opaque.
- **Stronger security/compliance posture**: governance controls are demonstrable, not implied.
- **Foundation for future exports and investigations**: structured events enable defensible export packages and deeper investigations later.

## 7. What this is not

This model is intentionally scoped. It is:

- not a full SIEM
- not full observability coverage
- not broad analytics/reporting infrastructure
- not full forensic export capability yet

## 8. MVP expectations

MVP should capture a reliable minimum slice:

- run lifecycle state changes
- tool request/decision/result triplets for governed actions
- policy decisions with reason codes and limits
- approval request and decision transitions
- evidence/artifact/finding create and link events
- case linkage and state transition events

MVP defers:

- full cross-tenant analytics
- high-volume long-horizon retention optimization
- broad external export formats
- tamper-evident hardening beyond baseline integrity-compatible storage
- full forensic packaging pipelines

## 9. Open questions

- What exact event taxonomy versioning strategy should core use?
- Which fields are mandatory for all events versus category-specific optional fields?
- What retention tiers are required for local-first deployments versus managed deployments?
- How should redaction policy interact with evidence provenance requirements?
- Which event subsets should be query-optimized first for analyst and reviewer workflows?
- What export schema should represent correlated run/case/evidence/approval timelines in future releases?


## MVP validation harness coverage update

Current integration tests explicitly assert normalized `tool.execution.requested`, `tool.execution.result`, and `tool.execution.failure` event expectations for supported allow/deny/failure/timeout flows. This validates current audit behavior for the MVP-supported gateway paths while broader taxonomy governance remains deferred.

## Issue #20 impact (Unified Investigation Workspace)

No new audit event schema is introduced in this slice.

The workspace reuses existing linked lookup behavior by `case_id`/`run_id` and evidence-bearing correlation references (`artifact_id`, `evidence_id`, `finding_id`) to project recent investigation-relevant events in one operator context.


## Investigation drill-in usage note (current thin slice)

Implemented now:
- Operator drill-ins consume existing correlation keys (`run_id`, `case_id`, `artifact_id`, `evidence_id`, `finding_id`) to filter Logs/Audit views from workspace and detail surfaces.
- No new audit event type/category was required for this thin slice; UI pivots are composed on top of current structured events.

Partially implemented:
- Filtered list projection is available for recent correlated events only.

Planned/deferred:
- Broader timeline analytics, long-horizon reconstruction UX, and export/report-focused audit presentation layers.


## Surface-mapping note (thin nav completion slice)

- The current UI layer exposes this audit model across all left-nav surfaces through direct review surfaces (Runs/Cases/Files/Logs) and thin status surfaces (Policies/Models/Admin).
- This slice does not expand the canonical event schema; it broadens truthful visibility framing only.

## Policies workspace visibility note (current thin slice)

- Policies now uses existing audit-linked governance signals (policy decisions, approval checkpoint linkage, and model restriction/routing events) to make governed behavior legible in one core-owned surface.
- No new audit object model or event taxonomy was introduced; this is a projection/composition slice on top of existing correlated events and contracts.


## Connectors workspace visibility note (current thin slice)

- Connectors now consumes existing `tool.execution.*` and policy-outcome context to expose connector governance/readiness posture in-product.
- No new audit taxonomy was introduced; this remains a projection layer on top of existing correlated events.


## Agents workspace visibility note (current thin slice)

- Agents workspace now consumes existing correlated events/signals (run lifecycle, model route/execution governance signals, tool execution governance events, policy/approval linkage) to make execution-role posture legible.
- No new event taxonomy/category was added for this slice; it is a composition/projection layer over existing event contracts.

## Models surface visibility reconciliation (MVP thin slice)

Implemented now:
- The core-owned Models surface now projects existing model-routing and model-execution audit signals into operator-visible governance posture.
- Route selection/decision, restriction-blocked outcomes, and execution-result events are shown as reviewable model-governance signals alongside policy/approval context.

Partially implemented:
- Event visibility is thin and read-oriented for current MVP workflow paths.

Deferred:
- Full platform-grade analytics, long-horizon model-operations dashboards, and advanced governance forensics remain deferred.

## Modules workspace audit-visibility note (MVP thin slice)

Implemented now:
- Modules surface consumes existing correlated event context to show module runtime posture (run-linked approvals and audit-event volume) for Security / OSINT Module 1.
- No new event taxonomy/category is introduced; this slice composes existing run/case/evidence/tool/model/policy/audit relationships.

Partially implemented:
- Event projection is read-oriented and scoped to current module workflow path coverage.

Planned/deferred:
- Dedicated module-platform analytics dashboards and long-horizon module operations reporting remain deferred.

## Settings + Admin / Tenancy visibility note (MVP thin slice)

Implemented now:
- Settings and Admin / Tenancy surfaces now consume existing correlated governance signals (policy decisions, approval counts, model/tool governance events, run/case posture) to make platform readiness and admin boundary status legible.
- No new audit event taxonomy/category was introduced; this is a projection layer using current event contracts.

Partially implemented:
- Event-derived posture is read-oriented and scoped to current MVP-supported paths.

Planned/deferred:
- Enterprise admin analytics, tenant-scoped governance dashboards, and long-horizon admin/tenancy reporting remain deferred.
