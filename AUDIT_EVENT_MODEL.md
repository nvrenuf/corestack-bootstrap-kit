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
