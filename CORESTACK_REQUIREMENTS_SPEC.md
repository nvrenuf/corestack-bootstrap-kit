# CORESTACK_REQUIREMENTS_SPEC.md

## 1. Executive summary

Corestack is a self-hosted-first desktop/control plane for governed AI-assisted workflows, tools, models, evidence, approvals, and modules.

Corestack is for:

- SOC analysts
- IR leads
- threat hunters
- OSINT investigators
- security managers
- platform administrators

One desktop/control plane with modules is the chosen model because workflow execution, policy enforcement, model routing, evidence handling, approvals, auditability, connectors, and administration are shared platform concerns. These concerns should be implemented once in core and reused across modules instead of being reimplemented in each vertical surface.

Security/OSINT is Module 1 because it exercises the required core contracts early:

- governed workflow orchestration
- controlled external collection
- evidence and case management
- policy and approval enforcement
- audit and forensic reconstruction
- module-aware but core-owned operator UX

If packs or runtime packs are used later, they are implementation or deployment details rather than product identity. The product remains Corestack, and Security/OSINT remains Module 1 within the single control plane.

## 2. Product scope

### In scope

- one Corestack desktop/control plane shell
- a core-owned module system
- Security/OSINT as Module 1
- governed workflow execution
- tool gateway and controlled connector execution
- policy enforcement and approvals/HITL
- open-weight-first model management and routing
- evidence, case, artifact, and finding management
- structured audit/event trail capability (see `AUDIT_EVENT_MODEL.md`) and forensic reconstruction support
- self-hosted-first deployment and operations

### Out of scope

- separate product shells or standalone apps per module
- broad autonomous remediation
- general-purpose SIEM replacement
- full SOAR feature parity
- malware sandboxing or detonation
- enterprise multi-tenant implementation in MVP
- commercial packaging and licensing implementation

### Non-goals

- making packs the product identity
- allowing modules to ship private workflow, policy, approval, audit, or evidence systems
- requiring external SaaS providers as the default execution model
- optimizing for executive dashboarding ahead of operator workflows and evidence review

### Product principles

- one product, one desktop/control plane
- modules extend the product without fragmenting it
- open-weight-first
- self-hosted-first
- policy-governed execution
- hardened-by-design defaults
- evidence-first and audit-friendly operation
- reusable core contracts before module-specific infrastructure

## 2A. Implemented MVP foundation status

The following MVP foundations are now implemented in core and are no longer planning-only requirements:

- persistent Corestack shell and navigation skeleton, including Home and Launcher entry surfaces
- minimum run/workflow execution contract with run-to-case linkage
- governed action enforcement through a real policy decision contract (allow, deny, approval-required)
- schema-defined `web.fetch` and `web.search` tool contracts
- minimum evidence, artifact, and finding objects with run/case linkage
- structured, correlated audit/event logging scaffolding for runs, tools, policy, approvals, and evidence mutations
- approval object model, state machine, workflow checkpoints, and reviewer queue/detail surfaces
- model registry and local-first routing contract, including restriction-aware external-provider hooks and model execution logging
- Security/OSINT Module 1 registered through the core module contract
- first real end-to-end Alert Triage and Investigation workflow

This document remains the canonical product/requirements baseline. For execution-level issue tracking and in-progress detail, see `IMPLEMENTATION_STATUS.md`.

### 2A.1 MVP operations/documentation baseline

The MVP-supported operator path is now documented in `docs/tool-system/RUNBOOK.md` with explicit run/configuration/validation instructions and thin-slice security assumptions.

The documented validation entry point for this slice is `make mvp-validation` (wrapper for `scripts/tool-system/validate-mvp-slice.sh`).

Threat-model notes for this MVP slice are captured in `REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md` and `AUDIT_EVENT_MODEL.md`; these notes describe current trust boundaries and fail-closed assumptions without claiming unfinished platform-grade breadth.

## 3. Functional requirements

### 3.1 Control plane shell

#### Required capabilities

- The product shall provide a single persistent desktop/control plane shell for all core and module-aware surfaces.
- The shell shall expose Home, Launcher, Runs, Approvals, Cases / Evidence, Files / Artifacts, Logs / Audit, Agents, Policies, Models, Connectors, Modules, Settings, and Admin / Tenancy.
- The shell shall allow navigation between runs, cases, evidence, artifacts, approvals, policies, models, connectors, and modules without requiring a separate product context.
- Home and Launcher shall exist as core-owned entry surfaces.

#### Minimum MVP requirements

- persistent shell and navigation
- Home and Launcher
- Runs, Approvals, Cases / Evidence, Files / Artifacts, Logs / Audit
- Policies, Models, Connectors, Modules, Settings, and Admin surfaces at minimum detail level
- module-aware content inside the shell

#### Deferred requirements

- advanced personalization
- deep executive dashboards
- extensive workspace customization

### 3.2 Module system

#### Required capabilities

- Core shall provide a module extension contract for workflows, views, connectors, and allowed schema extensions.
- The module system shall support install, enable, disable, update, and remove lifecycle states.
- The module system shall validate module compatibility with core-owned contracts.
- Modules shall not replace core-owned workflow, policy, approval, audit, evidence, or shell behavior.

#### Minimum MVP requirements

- register and run Security/OSINT Module 1
- list and inspect installed modules
- enable and disable modules
- expose contributed workflows and views

#### Deferred requirements

- mature packaging/distribution workflows
- remote marketplace or catalog behavior

### 3.3 Workflow engine

#### Required capabilities

- Core shall execute reusable workflow definitions using a shared run model.
- The engine shall support step types for ingest, tool, model, policy check, review, approval, evidence write, and export.
- Runs shall support explicit states including in-progress, blocked, failed, completed, and resumable paths.
- Runs shall link to cases, evidence, artifacts, approvals, and audit events.
- The canonical event schema and correlation expectations are defined in `AUDIT_EVENT_MODEL.md`.
- The engine shall expose step-level status and failure detail to the control plane.

#### Minimum MVP requirements

- run lifecycle support for Module 1 workflows
- resumable run state
- visible step execution state
- basic retry and failure handling

#### Deferred requirements

- no-code workflow builder
- broad workflow catalog beyond early modules

### 3.4 Tool gateway

#### Required capabilities

- Core shall provide a normalized tool execution path for `web.fetch` and `web.search`.
- The gateway shall validate request and response schemas.
- The gateway shall enforce allowlists, timeouts, byte limits, and rate limits.
- Tool execution shall emit audit and policy decision events.
- The architecture shall support governed backend routing, including gateway-to-automation integration where needed.

#### Minimum MVP requirements

- schema-validated `web.fetch`
- schema-validated `web.search`
- deny-by-default behavior when policy does not allow execution
- normalized error handling and correlation ids

#### Deferred requirements

- broad high-risk tool classes
- large connector-backed tool catalog

### 3.5 Policy engine

#### Required capabilities

- Core shall evaluate allow, deny, and approval-required decisions.
- Policy shall apply to tools, connectors, models, exports, and selected workflow transitions.
- Policy decisions shall return stable reason codes and applicable limits.
- Policy shall support hardened default-deny deployment profiles.

#### Minimum MVP requirements

- policy decisions for `web.fetch`, `web.search`, enrichment connectors, model routing, and exports
- allowlists and execution limits
- approval-required signaling for gated actions

#### Deferred requirements

- advanced policy authoring UX
- complex inheritance or delegation models

### 3.6 Approvals / HITL

#### Required capabilities

- Core shall create approval objects for gated actions.
- Approval states shall include pending, approved, denied, changes requested, escalated, expired, and overridden.
- Approvals shall link to runs, cases, policies, and exports where applicable.
- Approvers shall be able to approve, deny, request changes, or escalate.
- Overrides shall preserve explicit rationale, scope, and authority.

#### Minimum MVP requirements

- approval queue
- approval detail surface
- core state transitions
- audit logging for all approval actions

#### Deferred requirements

- complex reassignment routing
- SLA-aware escalation models

### 3.7 Model management and routing

#### Required capabilities

- Core shall register local and optional external model providers.
- Routing shall consider capability, policy, sensitivity, hosting, and deployment constraints.
- Local/open-weight models shall be the default execution path.
- Routing decisions and fallbacks shall be logged.
- Workflows shall request capabilities rather than hardcoded vendors.

#### Minimum MVP requirements

- at least one local/open-weight model path
- step-level capability requests for Module 1
- policy-enforced external-provider restriction path

#### Deferred requirements

- fine-tuning pipelines
- advanced cost optimization
- broad model benchmarking orchestration

### 3.8 Evidence / case management

#### Required capabilities

- Core shall manage cases, evidence items, artifacts, findings, notes, entities, relationships, timeline events, approvals, and export package metadata.
- Evidence-bearing objects shall preserve provenance and derived-from references.
- Workflow outputs shall attach directly to cases and evidence objects.
- Cases shall support review, linkage, export preparation, and reconstruction.

#### Minimum MVP requirements

- create and update cases
- attach evidence and artifacts
- create findings and notes
- store timeline events
- support export package metadata

#### Deferred requirements

- advanced graph-native analysis
- legal hold workflows
- sophisticated retention automation

### 3.9 Audit / logging / forensics

#### Required capabilities

- Core shall emit structured events for user actions, workflows, tool calls, policy decisions, model routing, approvals, evidence mutations, and exports.
- Audit records shall preserve correlation across runs, cases, approvals, artifacts, and policies.
- The product shall support search and reconstruction.
- Event storage shall be append-only or compatible with later tamper-evident integrity controls.

#### Minimum MVP requirements

- structured audit events
- searchable audit view
- correlation ids
- links from events to major objects

#### Deferred requirements

- full tamper-evident chains
- advanced forensic export packaging beyond MVP manifests

### 3.10 Connectors

#### Required capabilities

- Core shall register ingestion, enrichment, and export connectors.
- Connector execution shall be policy-governed and secret-scoped.
- Connectors shall expose status and module/workflow usage context.
- Connectors shall be enableable and disableable from core-owned surfaces.

#### Minimum MVP requirements

- alert intake connector path
- enrichment connector framework
- optional external handoff connector path
- connector status and policy association

#### Deferred requirements

- broad connector ecosystem
- advanced connector SDK

### 3.11 Files / artifacts

#### Required capabilities

- Core shall store fetched payloads, normalized artifacts, reports, manifests, and export bundles.
- Artifacts shall link to runs, cases, evidence, and export packages.
- Integrity metadata shall be stored where available.
- The UX shall provide artifact metadata visibility and basic preview paths where feasible.

#### Minimum MVP requirements

- artifact storage path
- artifact metadata view
- linkage to evidence and cases
- report and manifest storage

#### Deferred requirements

- advanced preview rendering across many formats
- rich bulk artifact management

### 3.12 Settings / admin

#### Required capabilities

- The control plane shall provide user-level settings.
- The product shall provide deployment-level administration for modules, connectors, models, policies, and health.
- Admin / Tenancy shall remain a reserved core-owned surface even if tenancy implementation is deferred.

#### Minimum MVP requirements

- basic settings
- module list/detail
- connector list/detail
- policy list/detail
- model list/detail
- basic health/admin status

#### Deferred requirements

- full tenancy implementation
- advanced identity administration

### 3.13 Self-hosted operations

#### Required capabilities

- The product shall support self-hosted deployment as the primary mode.
- The product shall support local/default execution for core services where possible.
- The product shall define operational expectations for storage, secrets, networking, and health.
- The architecture shall support hardened or restricted-network deployment profiles.

#### Minimum MVP requirements

- minimum supported deployment shape
- local/default execution for core services where possible
- startup, health, and troubleshooting guidance

#### Deferred requirements

- mature backup/restore automation
- advanced upgrade orchestration

## 4. Security requirements

### Trust boundaries

- The architecture shall define trust boundaries for the desktop UI, core API/control plane, workflow execution, tool gateway, model routing, evidence/case storage, artifact storage, audit storage, connectors, and external systems.
- Module services shall operate inside the Corestack runtime but shall not act as independent security authorities.

### Least privilege

- Modules shall not receive arbitrary network access by default.
- Workflows shall access tools, models, and exports only through governed core-owned contracts.
- Connectors shall receive only the permissions and credentials needed for their function.

### Sandboxing

- Risk-bearing tool and connector execution shall occur through a sandbox/gatekeeper path or equivalent isolated execution boundary.
- The architecture shall preserve this isolation boundary even if MVP uses a lighter deployment form.

### Tool gating

- All external fetch/search actions shall pass through the tool gateway.
- The tool gateway shall enforce allowlists, limits, and schema validation.
- Module workflows shall not bypass tool gating.

### Secret handling

- Secrets shall be managed by core-owned configuration or secret storage.
- Modules shall reference connector/provider identities rather than duplicating raw secrets.
- Secrets shall not be written into evidence objects, artifacts, logs, or approval history.

### Auditability

- Critical actions shall emit structured audit events.
- Audit records shall include actor, object references, outcome, timestamp, and correlation context.
- Approval, override, policy-denial, and export events shall be first-class audit events.

### Evidence integrity

- Evidence-bearing objects shall preserve provenance metadata.
- Artifacts shall store integrity metadata where available.
- Export manifests shall include object references and integrity references for included artifacts where possible.

### Policy enforcement

- Policy shall be enforced before tool execution, connector execution, external model routing, export/handoff, and selected scope-elevating workflow transitions.
- Policy decisions shall return stable reason codes.

### External-provider restrictions

- Local/open-weight execution shall be the default model path.
- External model and search providers shall be optional adapters, not required dependencies.
- Policy shall be able to disallow external providers for selected deployments, workflows, modules, or data classes.

### Hardened-by-design defaults

- Deployments shall default toward deny-by-default where practical.
- External access shall require explicit policy allowance.
- High-risk actions shall require approval when policy requires it.

## 5. Module 1 requirements: Security/OSINT

### 5.1 Alert triage and investigation

#### Trigger/input

- The system shall accept alert-triggered workflow starts from an alert connector, manual analyst intake, or case-linked new alert.
- Minimum input shall include alert id, source, timestamp, severity, summary, payload, and initial entities if known.

#### Required steps

1. Create or attach a case and start a run.
2. Normalize the alert payload.
3. Extract candidate entities and relevant context.
4. Execute allowed enrichment and external lookups through governed paths.
5. Correlate results with prior evidence, artifacts, and related runs.
6. Draft a triage summary and recommended disposition.
7. Request approval where policy requires it.
8. Finalize case and run state.

#### Required system behavior

- The workflow engine shall link the run to a case.
- The tool gateway and governed connector paths shall be used for all external collection.
- Model routing shall support extraction and summary drafting.
- Blocked or denied steps shall be visible in the run and audit trail.

#### Approval requirements

- Escalation shall require approval where policy requires it.
- Connector scope exceptions shall require approval where policy requires it.
- Final disposition shall require review where confidence or policy thresholds require it.
- External handoff/export shall require approval.

#### Evidence requirements

- The system shall create alert snapshots, normalized alert artifacts, enrichment artifacts, findings, notes, and timeline entries.
- Evidence shall link to the originating run and case.

#### Outputs

- triage summary
- recommended disposition
- linked entities
- findings
- updated case state

#### Success criteria

- the alert is dispositioned or escalated with explicit rationale
- material claims are evidence-linked
- the path is reconstructable from case and audit records

### 5.2 OSINT entity investigation

#### Trigger/input

- The system shall accept manual investigation requests, case pivots, and alert-driven pivots into an entity investigation.
- Minimum input shall include investigation request id, entity type, seed value, purpose, and allowed scope.

#### Required steps

1. Create or attach a case and start a run.
2. Validate requested scope against policy.
3. Execute allowed search, fetch, and enrichment steps.
4. Extract and normalize sources, entities, claims, and relationships.
5. Deduplicate and correlate observations.
6. Draft a summary that separates supported observations from unresolved hypotheses.
7. Request approval where policy requires it.
8. Persist findings, notes, and optional export state.

#### Required system behavior

- Only policy-allowed external access shall occur.
- Source-derived artifacts shall preserve provenance.
- Unsupported or ambiguous conclusions shall not be silently promoted to findings.

#### Approval requirements

- Broadened search scope shall require approval where policy requires it.
- External export or closure shall require approval where policy requires it.

#### Evidence requirements

- The system shall create source records, fetched artifacts, entity records, relationship records, findings, notes, and timeline entries.

#### Outputs

- entity profile
- evidence-backed observations
- structured findings
- optional exportable summary

#### Success criteria

- the initiating question is answered or explicitly recorded as unresolved
- provenance is preserved across collected material
- unsupported claims remain clearly marked as unresolved or speculative

### 5.3 Incident evidence pack generation

#### Trigger/input

- The system shall allow evidence pack generation from an existing case, approval path, or completed run.
- Minimum input shall include case id, report purpose, scope, target time range, and export destination or output type.

#### Required steps

1. Load case, findings, approvals, timeline, evidence, and artifact references.
2. Validate required evidence availability and note gaps.
3. Assemble chronology and report draft material.
4. Generate export manifest and report artifacts.
5. Route for approval.
6. Persist approved export bundle and release metadata.

#### Required system behavior

- The system shall not fabricate missing evidence.
- Missing or unresolved elements shall remain marked as such.
- Export actions shall be auditable and linked back to the case.

#### Approval requirements

- Release shall require approval.
- External handoff/export shall require approval.
- Redaction decisions shall require approval where policy requires it.

#### Evidence requirements

- The system shall create an export manifest, report artifacts, approval linkage, and export receipt or handoff record.

#### Outputs

- incident evidence pack
- analyst report
- management summary

#### Success criteria

- the package is reviewable without ad hoc reconstruction
- included statements map to supporting evidence or explicit analyst assessment
- export history is reconstructable

## 6. UX requirements

### Required user-facing surfaces

- The product shall expose Home, Launcher, Runs, Approvals, Cases / Evidence, Files / Artifacts, Logs / Audit, Agents, Policies, Models, Connectors, Modules, Settings, and Admin / Tenancy.
- These surfaces shall exist within one persistent shell.
- Module-aware content shall extend core-owned surfaces rather than replace them.

### Required user-facing objects

- The UX shall expose agent, run, workflow, approval, case, evidence item, artifact, finding, policy, model, connector, and module as first-class user-facing objects.
- Object detail views shall allow navigation to the most relevant linked objects.

### Required flow expectations

- Home and Launcher shall act as entry surfaces.
- Runs and Cases / Evidence shall serve as the primary execution and review surfaces.
- The UX shall support the first three Module 1 workflows from operator-facing entry points.
- Approvals shall be visible from a dedicated queue and from linked case/run context.
- Evidence provenance and case timeline context shall remain visible from the main investigation workspace.

### Required approval UX

- Approval detail shall show requested action, requester, linked case/run, relevant policy reason, evidence summary, impact of approve versus deny, deadline, and related prior approvals.
- The UI shall support pending, approved, denied, changes requested, escalated, expired, and overridden states.
- Overrides shall be visibly distinct and linked to audit history.

### Required evidence/case UX

- Workflow outputs shall attach evidence by default where possible.
- Evidence detail shall show provenance, source, acquisition method, tool/connector used, time collected, derived-from references, and integrity metadata where present.
- Case review shall expose summary, findings, evidence, timeline, related runs, approvals, and export readiness.
- Export initiation shall show scope, policy impact, and approval requirements before submission.

## 7. Data and object requirements

### 7.1 Run

#### Minimum required fields

- run id
- workflow id
- module id
- status
- trigger/input reference
- actor/request context
- case id if linked
- created/updated timestamps

#### Ownership

- core-owned

#### Lifecycle expectations

- created on workflow start
- transitions through explicit states
- retained for audit and reconstruction

#### Audit expectations

- workflow start, step execution, state changes, failures, retries, and completion shall be logged

### 7.2 Workflow

#### Minimum required fields

- workflow id
- module id
- name
- version
- step definition references
- required capabilities

#### Ownership

- core owns the contract; the module owns workflow definitions

#### Lifecycle expectations

- registered through the module extension contract
- versioned over time

#### Audit expectations

- workflow launch and version used shall be recorded in runs

### 7.3 Approval

#### Minimum required fields

- approval id
- subject/action
- requester
- approver
- state
- rationale
- scope
- expiration
- linked case/run/policy references
- created/updated timestamps

#### Ownership

- core-owned

#### Lifecycle expectations

- created for gated actions
- transitions through defined approval states
- retained with linked work objects

#### Audit expectations

- creation, decisions, escalation, expiry, override, and state changes shall be logged

### 7.4 Case

#### Minimum required fields

- case id
- title/summary
- status
- severity if applicable
- owner/assignee
- trigger reference
- created/updated timestamps

#### Ownership

- core-owned base object with module-aware extensions

#### Lifecycle expectations

- created or linked from runs
- updated through investigation and review
- retained for export and audit purposes

#### Audit expectations

- creation, assignment, status change, export, and major linkage changes shall be logged

### 7.5 Evidence item

#### Minimum required fields

- evidence id
- case id
- source reference
- artifact reference if present
- provenance metadata
- review state
- created timestamp

#### Ownership

- core-owned base object with module-aware extensions

#### Lifecycle expectations

- created from workflow outputs or analyst action
- linked to findings and cases
- retained subject to lifecycle policy

#### Audit expectations

- creation, link/unlink, and review-state changes shall be logged

### 7.6 Artifact

#### Minimum required fields

- artifact id
- storage reference
- type
- content hash if available
- source/run/case linkage
- created timestamp

#### Ownership

- core-owned storage contract; modules may create artifact types

#### Lifecycle expectations

- created during fetch, normalization, report generation, or export
- linked to evidence, runs, and cases

#### Audit expectations

- creation, export, and access-related actions where applicable shall be logged

### 7.7 Finding

#### Minimum required fields

- finding id
- case id
- summary
- status
- confidence or support marker
- supporting evidence references
- author/source

#### Ownership

- core-owned base object with module-aware extensions

#### Lifecycle expectations

- created and revised during investigation
- linked to evidence and exports

#### Audit expectations

- create, edit, and status changes shall be logged

### 7.8 Model

#### Minimum required fields

- model id
- provider id
- capability tags
- hosting type
- availability state
- policy scope

#### Ownership

- core-owned

#### Lifecycle expectations

- registered and enabled/disabled by admin control
- referenced by routing decisions

#### Audit expectations

- routing selections and state changes shall be logged

### 7.9 Policy

#### Minimum required fields

- policy id
- scope
- subject targets
- effect
- limits
- approval-required flag
- version

#### Ownership

- core-owned

#### Lifecycle expectations

- authored and updated by admin/security roles
- evaluated at runtime for governed actions

#### Audit expectations

- policy changes and runtime decision outcomes shall be logged

### 7.10 Connector

#### Minimum required fields

- connector id
- type
- status
- module association if any
- secret binding reference
- policy scope

#### Ownership

- core-owned connector contract; modules may register usage

#### Lifecycle expectations

- registered, configured, enabled/disabled, and tested through core-owned surfaces

#### Audit expectations

- configuration, state change, and execution events shall be logged

### 7.11 Module

#### Minimum required fields

- module id
- name
- version
- lifecycle state
- registered workflows
- registered views/connectors

#### Ownership

- core owns lifecycle and extension contract; modules own their contributed content

#### Lifecycle expectations

- install, enable, disable, update, remove

#### Audit expectations

- lifecycle changes shall be logged

## 8. Deployment and operations requirements

### Self-hosted-first assumptions

- The product shall support local and self-hosted deployment as the default operating model.
- The architecture shall support local/default execution for core services where possible.
- The product shall support hardened or restricted-network deployment through policy and configuration.

### Minimum supported deployment shape

- desktop/control plane UI
- core API layer
- workflow engine/orchestrator
- tool gateway
- policy engine
- approvals service
- evidence/case store
- artifact storage
- audit/event storage
- local model runtime
- Module 1 services

These may be colocated in practice, but their logical roles shall remain distinct.

### Backup/restore expectations

- Backup expectations shall cover evidence/case data, artifacts, audit records, policy state, connector configuration, and module state.
- Restore expectations shall preserve referential integrity across runs, cases, approvals, evidence, and artifacts.

### Upgrade expectations

- Upgrades shall preserve core object compatibility or provide migrations.
- Module updates shall not silently invalidate core-owned data contracts.

### Recovery expectations

- Recovery documentation shall exist for failed upgrades, service failures, and storage restoration.
- Recovery paths should preserve evidence and audit integrity where possible.

### Observability expectations

- The product shall provide health, metrics, logs, and operator-visible failure states for core services, module services, workflow runs, tool calls, and model execution.
- Operational telemetry and forensic audit shall remain conceptually distinct even if stored nearby.

## 9. Non-functional requirements

### Reliability

- Critical workflows shall support resumability and visible failure states.
- Denied, failed, or blocked actions shall not disappear silently.

### Performance

- The control plane shall provide responsive operator-facing updates for runs, approvals, and case activity.
- Heavy artifact handling shall not block core state visibility.

### Auditability

- Critical decisions and state transitions shall be reconstructable.

### Explainability

- The product shall expose why actions were denied, routed, blocked, or gated.
- Findings and outputs shall distinguish supported claims from unresolved or analyst-assessed material.

### Maintainability

- Core contracts shall remain reusable across future modules.
- Module code shall not require duplication of core-owned infrastructure.

### Extensibility

- Future modules shall be able to add workflows, views, connectors, and permitted schema extensions through shared extension points.

### Portability

- Deployment assumptions shall remain compatible with self-hosted and restricted-network environments.

### Operator usability

- The UX shall minimize product-context switching.
- Operators shall be able to move between run, case, evidence, artifact, and approval context with minimal friction.

## 10. MVP boundary

### Included in the first deliverable

- one desktop/control plane shell
- Security/OSINT Module 1
- workflow execution for the first three Module 1 workflows
- `web.fetch` and `web.search` through the tool gateway
- policy enforcement for tools, models, exports, and selected workflow transitions
- approval queue and approval detail with core states
- core case/evidence/artifact/finding objects
- audit logging for critical actions
- one local/open-weight model path
- admin essentials for modules, connectors, policies, and models

### Excluded from the first deliverable

- enterprise identity maturity
- multi-tenant isolation
- broad connector catalog
- advanced graph analytics or graph-native investigation canvas
- full workflow designer
- extensive executive dashboarding
- advanced backup/restore automation
- autonomous remediation

## 11. Sequencing and implementation implications

### Milestone 0: Product and architecture lock

- finalize core versus module boundary
- finalize Security/OSINT Module 1 definition
- finalize evidence/case base objects
- finalize sandbox/gatekeeper model
- finalize approvals/HITL model
- finalize UI/UX/admin/day-2 operational shape

### Milestone 1: Control plane foundation

- implement control plane architecture and shell
- implement policy engine and tool gating
- implement `web.fetch` and `web.search` schemas
- implement tool gateway enforcement
- implement governed tool backend wiring
- implement structured audit logging and security events
- implement integration tests and validation harnesses
- produce foundational docs/runbook/threat model support

### Milestone 2: Security/OSINT Module 1 enablement

- implement workflow engine and orchestration
- implement model management and routing
- implement audit/forensics/evidence trail requirements for investigations
- implement data lifecycle/privacy controls
- implement evaluation harness and quality gates

### Milestone 3: Operations maturity

- implement module packaging/runtime contract maturity
- implement observability and ops telemetry
- implement backup/restore/upgrade/recovery support

### Milestone 4: Enterprise/commercial concerns

- implement enterprise identity and authorization maturity
- implement multi-tenant isolation
- address commercial readiness concerns

## 12. Open questions and unresolved decisions

- Should Home be heavily role-tailored or mostly consistent across personas?
- After intake, should analysts work primarily from Runs or Cases / Evidence?
- What is the canonical normalized alert schema for Module 1 intake?
- What is the minimum object boundary between source, artifact, and evidence item?
- Which enrichment connectors are mandatory for MVP?
- What exact approval state machine and escalation rules should core adopt?
- How should export manifests encode redactions, derived artifacts, and integrity references?
- Which local models are the default for extraction and summarization?
- Which data classes must never leave self-hosted execution without explicit override?
- What is the first optional external handoff target?

## Contradictions resolved or explicitly called out

- Resolved: Corestack is one desktop/control plane, and modules extend that product rather than fragmenting it.
- Resolved: packs or runtime packs are implementation/runtime details, not product identity.
- Resolved: Home and Launcher are entry surfaces, while Runs and Cases / Evidence are the primary execution and review surfaces.
- Resolved: Admin / Tenancy remains a core-owned navigation surface even though tenancy implementation is deferred beyond MVP.
- Called out: the exact analyst-primary surface after intake remains an open UX choice between Runs-first and Cases / Evidence-first emphasis.
- Called out: the exact schema boundary between source, artifact, and evidence item still needs object-model resolution.

## Alignment

This specification consolidates and formalizes:

- [ISSUES_ORDER.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/ISSUES_ORDER.md)
- [CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md)
- [SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/SECURITY_OSINT_MODULE_1.md)
- [REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md)
- [UX_INFORMATION_ARCHITECTURE_CORESTACK_DESKTOP.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/UX_INFORMATION_ARCHITECTURE_CORESTACK_DESKTOP.md)


## MVP integration validation status (Issue #22 thin slice)

Implemented in this slice:
- CI-friendly validation harness command for current supported gateway/module path.
- Integration coverage for allow, malformed, disallowed, oversize, and timeout fail-closed behavior.
- Assertions for normalized audit/security events and schema-conformant responses on supported paths.

Deferred:
- Broad platform-wide future tool/provider/module matrix coverage.

## Issue #20 reconciliation update (Unified Investigation Workspace MVP thin slice)

Implemented in this slice:
- Added a core-owned unified investigation workspace route for one investigation at a time (`caseId` scoped) without changing shell architecture.
- Composed existing case/run/finding/artifact/evidence/audit/approval contracts into one coherent operator surface.
- Added thin disposition/status projection for current case and primary linked run state.

Deferred:
- Broad forensic workbench behavior, timeline exploration, report/export packaging, and cross-module generic workspace patterns.


## Investigation drill-in/navigation polish reconciliation (current thin slice)

Implemented now:
- Investigation workspace provides direct pivots to linked run detail, case detail, files/artifacts detail, approvals, and filtered logs/audit views using existing IDs (`runId`, `caseId`, `artifactId`, `evidenceId`, `findingId`).
- Findings/artifacts summaries provide direct drill-in links to linked detail and audit history surfaces where references exist.
- Navigation labels render without numeric prefixes for operator-facing product readability.

Partially implemented:
- Drill-in is scoped to current Module 1 MVP objects and available linkage data only.

Deferred:
- Broad forensic timeline, report/export packaging, and cross-module generic investigation workspace behavior.
