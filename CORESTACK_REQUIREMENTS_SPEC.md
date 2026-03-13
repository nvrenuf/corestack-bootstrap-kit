# CORESTACK_REQUIREMENTS_SPEC.md

## 1. Executive summary

Corestack is a self-hosted-first desktop/control plane for operating governed AI-assisted workflows, tools, models, evidence, approvals, and modules from one coherent product surface.

Corestack is for security-conscious operators, analysts, investigators, managers, and administrators who need:

- one workspace for initiating and reviewing analytical workflows
- controlled access to tools and models
- evidence and case handling with provenance
- auditable approvals and policy enforcement
- extensibility through modules without product fragmentation

The chosen product model is one desktop/control plane with modules because the required capabilities for governance, workflow execution, auditability, evidence handling, model routing, and administration are cross-domain platform concerns, not module-specific concerns. These capabilities must be implemented once in core and reused by all future modules.

Security/OSINT is Module 1 because it exercises the most important reusable platform abstractions early:

- workflow orchestration
- controlled external access
- policy and approval gates
- evidence and case handling
- audit and forensic reconstruction
- module-aware but core-owned UX surfaces

## 2. Product scope

### In scope

- one Corestack desktop/control plane shell
- a module system with core-owned extension contracts
- Security/OSINT as Module 1
- governed workflow execution
- policy-aware tool access
- approvals and HITL
- open-weight-first model routing
- evidence, case, artifact, and finding management
- audit logging and forensic reconstruction support
- self-hosted operations and administration

### Out of scope

- separate product shells per module
- broad autonomous remediation
- general-purpose SIEM replacement
- full SOAR platform breadth
- malware sandboxing or detonation
- commercial packaging and licensing implementation
- enterprise multi-tenant implementation in MVP

### Non-goals

- becoming a generic pack catalog UI
- making modules responsible for their own workflow runtime, policy engine, or approval system
- requiring external SaaS providers as the default model or tool path
- prioritizing visual dashboards over operator workflows and evidence handling

### Product principles

- one product, one desktop/control plane
- modules extend; they do not fragment
- open-weight-first
- self-hosted-first
- policy-governed execution
- hardened-by-design defaults
- evidence-first, audit-friendly operation

## 3. Functional requirements

### 3.1 Control plane shell

#### Required capabilities

- provide a single desktop/control plane shell for all core and module-aware surfaces
- expose top-level navigation for Home, Launcher, Runs, Approvals, Cases / Evidence, Files / Artifacts, Logs / Audit, Agents, Policies, Models, Connectors, Modules, Settings, and Admin / Tenancy
- support role-appropriate entry points without introducing separate product shells
- provide cross-object navigation between runs, approvals, cases, evidence, artifacts, policies, models, connectors, and modules

#### Minimum MVP requirements

- persistent shell and navigation
- Home, Launcher, Runs, Approvals, Cases / Evidence, Files / Artifacts, Logs / Audit, Policies, Models, Connectors, Modules, Settings, and Admin surfaces
- module-aware widgets and links inside the shell

#### Deferred requirements

- advanced personalization
- deep executive dashboarding
- advanced workspace customization

### 3.2 Module system

#### Required capabilities

- register modules through a core-owned extension contract
- allow modules to contribute workflows, views, connectors, and domain schema extensions where allowed
- manage lifecycle states such as install, enable, disable, update, and remove
- prevent modules from duplicating core-owned systems

#### Minimum MVP requirements

- register Module 1
- list and inspect installed modules
- enable/disable modules
- expose contributed workflows and views

#### Deferred requirements

- mature packaging and distribution workflows
- remote marketplace or catalog concepts

### 3.3 Workflow engine

#### Required capabilities

- execute reusable workflow definitions
- support step types for ingest, tool call, model call, policy check, human review, approval gate, evidence write, and export
- create resumable runs with explicit states
- link runs to cases, artifacts, approvals, and audit events
- support failure, retry, timeout, and blocked states

#### Minimum MVP requirements

- run lifecycle support for Module 1 workflows
- resumable run state
- step execution visibility
- basic retry and failure handling

#### Deferred requirements

- no-code workflow builder
- broad workflow catalog beyond early modules

### 3.4 Tool gateway

#### Required capabilities

- expose normalized tool execution interfaces for `web.fetch` and `web.search`
- validate request and response schemas
- enforce allowlists, rate limits, byte limits, and timeouts
- emit audit events for allow, deny, and failure paths
- support backend routing through controlled adapters such as n8n

#### Minimum MVP requirements

- schema-validated `web.fetch` and `web.search`
- deny-by-default behavior when allowlists are empty
- normalized error handling
- shared-secret-backed routing where used

#### Deferred requirements

- broad connector-backed tool catalog
- higher-risk tool classes beyond current Module 1 needs

### 3.5 Policy engine

#### Required capabilities

- evaluate allow, deny, and approval-required decisions
- support policy scope for tools, connectors, models, exports, and selected workflow transitions
- emit structured reason codes and limits
- support hardened default-deny deployment profiles

#### Minimum MVP requirements

- policy decisions for `web.fetch`, `web.search`, enrichment connectors, model routing, and exports
- allowlists and execution limits
- approval-required flags for gated actions

#### Deferred requirements

- advanced policy authoring UX
- complex policy inheritance models

### 3.6 Approvals / HITL

#### Required capabilities

- create approval objects for gated actions
- support states: pending, approved, denied, changes requested, escalated, expired, overridden
- link approvals to runs, cases, policies, and exports
- allow approvers to approve, deny, request changes, or escalate
- capture overrides with explicit rationale and scope

#### Minimum MVP requirements

- approval queue
- approval detail
- core state transitions
- audit logging of all approval actions

#### Deferred requirements

- sophisticated reassignment workflows
- complex SLA or business-hour routing models

### 3.7 Model management and routing

#### Required capabilities

- register local and optional external model providers
- route by requested capability, policy, sensitivity, and deployment constraints
- default to local/open-weight models
- log routing decisions and fallback behavior

#### Minimum MVP requirements

- at least one local/open-weight model path
- module step-level capability requests
- policy-enforced external-provider restrictions

#### Deferred requirements

- fine-tuning pipelines
- advanced cost optimization
- broad benchmarking orchestration

### 3.8 Evidence / case management

#### Required capabilities

- manage cases, evidence items, artifacts, findings, notes, entities, relationships, timeline events, approvals, and export packages
- preserve provenance and derived-from references
- allow workflow outputs to attach directly to cases and evidence
- support export preparation and review

#### Minimum MVP requirements

- create and update cases
- attach evidence and artifacts
- create findings and notes
- store timeline events
- support export package metadata

#### Deferred requirements

- advanced graph-native visualization
- legal hold workflows
- sophisticated retention automation

### 3.9 Audit / logging / forensics

#### Required capabilities

- emit structured events for user actions, workflow execution, tool calls, policy decisions, model routing, approval actions, evidence mutations, and exports
- preserve correlation across runs, cases, approvals, and artifacts
- support search and reconstruction
- support integrity-protecting or integrity-compatible event storage

#### Minimum MVP requirements

- structured audit events
- searchable audit view
- correlation ids
- event linking to major objects

#### Deferred requirements

- full tamper-evident chain implementation
- advanced forensic export packaging beyond MVP manifests

### 3.10 Connectors

#### Required capabilities

- register ingestion, enrichment, and export connectors
- apply policy and secret scoping to connectors
- expose connector status and assignment to workflows or modules

#### Minimum MVP requirements

- alert intake connector path
- enrichment connector framework
- optional external handoff connector path
- connector enable/disable and policy association

#### Deferred requirements

- broad connector ecosystem
- advanced connector SDK

### 3.11 Files / artifacts

#### Required capabilities

- store payload snapshots, fetched materials, normalized artifacts, reports, and manifests
- allow artifacts to be linked to cases, evidence, runs, and export packages
- expose integrity metadata where available

#### Minimum MVP requirements

- artifact metadata view
- linkage to evidence and cases
- report and manifest storage

#### Deferred requirements

- advanced preview rendering for all formats
- rich bulk artifact management

### 3.12 Settings / admin

#### Required capabilities

- provide user-level settings
- provide deployment-level admin surfaces for modules, connectors, models, policies, and health
- reserve Admin / Tenancy as a core-owned surface even though tenancy implementation is deferred

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

- support local and self-hosted deployment as the primary mode
- provide operational runbooks and secure defaults
- define storage, secrets, and network expectations

#### Minimum MVP requirements

- minimum deployment shape
- startup, health, and troubleshooting guidance
- local/default execution for core services where possible

#### Deferred requirements

- mature backup/restore automation
- advanced upgrade orchestration

## 4. Security requirements

### Trust boundaries

- the system shall define trust boundaries for UI/workstation, core API/control plane, workflow execution, tool gateway, model routing, evidence/case storage, artifact storage, audit storage, connectors, and external systems
- module services shall be treated as inside the product runtime but not as independent security authorities

### Least privilege

- modules shall not have arbitrary network access by default
- connectors shall receive only the credentials and access required for their function
- workflows shall access tools, models, and exports only through governed core contracts

### Sandboxing

- risky tool and connector execution shall occur through a sandbox/gatekeeper path or equivalent isolated execution boundary
- the architecture shall preserve this boundary even if MVP uses a lighter deployment form

### Tool gating

- all external fetch/search actions shall pass through the tool gateway
- the tool gateway shall enforce allowlists, limits, and schema validation
- no module workflow shall bypass tool gating

### Secret handling

- secrets shall be core-managed
- secrets shall not be duplicated into module-defined persistence by default
- secrets shall not be written into logs, evidence objects, artifacts, or approval history

### Auditability

- all critical actions shall emit structured audit events
- audit records shall include actor, object references, outcome, timestamp, and correlation context
- approval, override, policy-denial, and export events shall be first-class audit events

### Evidence integrity

- evidence-bearing objects shall preserve provenance metadata
- artifacts shall store integrity metadata where possible
- export manifests shall include object references and integrity references for included artifacts

### Policy enforcement

- policy shall be enforced before tool execution, connector execution, external model routing, export/handoff, and selected scope-elevating workflow transitions
- policy decisions shall produce stable reason codes

### External-provider restrictions

- local/open-weight execution shall be the default for model use
- external model or search providers shall be optional adapters
- policy shall be able to disallow external providers entirely for selected deployments, workflows, modules, or data classes

### Hardened-by-design defaults

- deployments shall default toward deny-by-default where practical
- external access shall require explicit policy allowance
- high-risk actions shall require explicit approval when policy demands it

## 5. Module 1 requirements: Security/OSINT

### 5.1 Alert triage and investigation

#### Trigger/input

- the system shall accept alert-triggered workflow starts from a log/alert connector, manual analyst intake, or case-linked new alert
- the minimum input shall include alert id, source, timestamp, severity, summary, payload, and initial entities if known

#### Required steps

1. create or attach to a case and run
2. normalize the alert payload
3. extract candidate entities
4. run allowed enrichment and controlled lookups
5. correlate related evidence and prior context
6. produce a draft triage summary and recommended disposition
7. request approval where policy requires it
8. finalize case and run state

#### Required system behavior

- the workflow engine shall create a run linked to a case
- the tool gateway and connector paths shall be used for all controlled lookups
- model routing shall support extraction and summarization
- blocked or denied steps shall be visible in the run and audit trails

#### Approval requirements

- escalation shall require approval where policy requires it
- external handoff/export shall require approval
- final disposition shall require review if confidence or policy thresholds require it

#### Evidence requirements

- the system shall create normalized alert artifacts, enrichment artifacts, notes, findings, and timeline entries
- evidence shall link back to the run and case

#### Outputs

- triage summary
- recommended disposition
- linked entities
- findings
- updated case status

#### Success criteria

- the alert is dispositioned or escalated with explicit rationale
- material claims are evidence-linked
- the path is reconstructable from case and audit records

### 5.2 OSINT entity investigation

#### Trigger/input

- the system shall accept manual investigation requests and pivots from existing alert or case context
- the minimum input shall include investigation id, entity type, seed value, purpose, and allowed scope

#### Required steps

1. create or attach to a run and case
2. validate scope and policy
3. execute allowed search, fetch, and enrichment paths
4. extract and normalize entities, sources, and claims
5. deduplicate and correlate observations
6. produce a draft summary separating supported observations from unresolved hypotheses
7. request approval where required
8. persist outputs and optional export state

#### Required system behavior

- only policy-allowed external access shall occur
- source-derived artifacts shall preserve provenance
- unsupported or ambiguous conclusions shall not be silently promoted to findings

#### Approval requirements

- broadened scope shall require approval where policy requires it
- external export or closure shall require approval where policy requires it

#### Evidence requirements

- the system shall create source records, fetched artifacts, entity objects, relationship objects, findings, notes, and timeline entries

#### Outputs

- entity profile
- evidence-backed observations
- structured findings
- optional exportable summary

#### Success criteria

- the investigation answers the initiating question or explicitly records why it cannot
- unresolved items remain marked as unresolved
- provenance is preserved across collected materials

### 5.3 Incident evidence pack generation

#### Trigger/input

- the system shall allow evidence pack generation from an existing case, approval path, or completed run
- the minimum input shall include case id, report purpose, scope, time range, and export target or output type

#### Required steps

1. load case, findings, approvals, timeline, and evidence references
2. validate required evidence availability
3. assemble chronology and report drafts
4. generate export manifest and report artifacts
5. route package for approval
6. persist approved export bundle and release metadata

#### Required system behavior

- the system shall not fabricate missing evidence
- missing or unresolved elements shall remain marked as such
- export actions shall be auditable and linked back to the case

#### Approval requirements

- release shall require approval
- external handoff shall require approval
- redaction decisions shall require approval where policy demands it

#### Evidence requirements

- the system shall create an export manifest, report artifacts, approval linkage, and export receipt or handoff record

#### Outputs

- incident evidence pack
- analyst report
- management summary

#### Success criteria

- the package is reviewable without ad hoc reconstruction
- included statements map to supporting evidence or explicit analyst assessment
- export history is reconstructable

## 6. UX requirements

### Required surfaces

- the product shall expose Home, Launcher, Runs, Approvals, Cases / Evidence, Files / Artifacts, Logs / Audit, Agents, Policies, Models, Connectors, Modules, Settings, and Admin / Tenancy
- these surfaces shall exist within one persistent shell
- module-aware content shall appear inside core-owned surfaces rather than separate shells

### Required core objects in the UX

- the UX shall expose agent, run, workflow, approval, case, evidence item, artifact, finding, policy, model, connector, and module as first-class objects
- object detail views shall support navigation to the most relevant linked objects

### Required flows

- the UX shall support alert triage and investigation from an operator-facing entry point
- the UX shall support manual OSINT investigation launch and review
- the UX shall support case-based evidence pack generation and approval
- approvals shall be visible globally and from linked runs/cases
- evidence provenance and timeline context shall be visible from the case workspace

### MVP UX constraints

- the first working analyst flow shall prioritize Runs and Cases / Evidence as the primary execution and review surfaces
- Home and Launcher shall act as entry points, not as replacements for case and run workspaces

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
- transitions through explicit run states
- retained for audit and reconstruction

#### Audit expectations

- workflow start, step execution, state transitions, failure, retry, and completion shall be logged

### 7.2 Workflow

#### Minimum required fields

- workflow id
- module id
- name
- version
- step definition references
- required capabilities

#### Ownership

- core owns contract; module owns workflow definitions

#### Lifecycle expectations

- registered by module extension
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
- linked case/run/policy
- created/updated timestamps

#### Ownership

- core-owned

#### Lifecycle expectations

- created when a gated action is requested
- transitions through defined approval states
- retained with linked objects

#### Audit expectations

- all creation, decisions, escalation, expiry, override, and state changes shall be logged

### 7.4 Case

#### Minimum required fields

- case id
- title/summary
- status
- severity if applicable
- owner/assignee
- source trigger reference
- created/updated timestamps

#### Ownership

- core-owned base object; module may extend with domain fields

#### Lifecycle expectations

- created or linked from runs
- updated through investigation
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

- core-owned base object; module may extend

#### Lifecycle expectations

- created from workflow outputs or analyst action
- linked to findings and cases
- retained subject to lifecycle policy

#### Audit expectations

- create, link/unlink, and review state changes shall be logged

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
- linked to evidence and cases

#### Audit expectations

- create, export, and access-related actions where applicable shall be logged

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
- applied at runtime to governed actions

#### Audit expectations

- policy changes and runtime decision outputs shall be logged

### 7.10 Connector

#### Minimum required fields

- connector id
- type
- status
- module association if any
- secret binding reference
- policy scope

#### Ownership

- core-owned connector contract; module may register connector usage

#### Lifecycle expectations

- registered, configured, enabled/disabled, and tested through core surfaces

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

- core owns lifecycle and extension contract; module owns its contributed content

#### Lifecycle expectations

- install, enable, disable, update, remove

#### Audit expectations

- lifecycle changes shall be logged

## 8. Deployment and operations requirements

### Self-hosted-first assumptions

- the product shall support local and self-hosted deployments as the default operating model
- the system shall support local/default execution for core services where possible
- the system shall support hardened or restricted-network deployments through policy and configuration

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

These may be colocated in practice, but the logical roles shall remain distinct.

### Backup/restore expectations

- backup expectations shall cover evidence/case data, artifacts, audit records, policy state, connector configuration, and module state
- restore expectations shall preserve referential integrity across cases, evidence, runs, approvals, and artifacts

### Upgrade expectations

- upgrades shall preserve core object compatibility or provide migration paths
- module updates shall not be allowed to silently invalidate core-owned data contracts

### Recovery expectations

- recovery documentation shall exist for failed upgrades, service failure, and storage restoration
- recovery should preserve audit and evidence integrity where possible

### Observability expectations

- the system shall provide health, metrics, logs, and operator-visible failure states for control plane services, module services, workflows, tool calls, and model execution
- operational telemetry and forensic audit shall remain conceptually separate even if stored nearby

## 9. Non-functional requirements

### Reliability

- critical workflows shall support resumability and failure visibility
- denied, failed, or blocked actions shall not silently disappear

### Performance

- the system shall provide responsive operator-facing status updates for runs, approvals, and case activity
- heavy artifact handling shall not prevent core state visibility

### Auditability

- all critical decisions and state transitions shall be reconstructable

### Explainability

- the system shall expose why actions were denied, routed, blocked, or gated
- findings and outputs shall distinguish supported claims from unresolved or analyst-assessed material

### Maintainability

- core contracts shall be reusable across future modules
- module code shall not require duplication of core infrastructure

### Extensibility

- future modules shall be able to add workflows, views, connectors, and schema extensions through shared extension points

### Portability

- deployment assumptions shall remain compatible with self-hosted and restricted-network environments

### Operator usability

- the UX shall minimize shell switching
- the analyst shall be able to move between run, case, evidence, artifact, and approval contexts with minimal friction

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

- enterprise SSO and RBAC maturity
- multi-tenant isolation
- broad connector catalog
- advanced graph analytics
- full workflow designer
- extensive dashboarding
- advanced backup/restore automation
- autonomous remediation

## 11. Sequencing and implementation implications

### Milestone 0 implications

- finalize core vs module boundary
- finalize Module 1 workflows, users, non-goals, and required surfaces
- finalize evidence/case base objects
- finalize sandbox/gatekeeper and approval model
- finalize UX information architecture

### Milestone 1 implications

- implement single control plane architecture
- implement policy engine and tool gating
- implement `web.fetch` and `web.search` contracts and gateway enforcement
- implement baseline structured audit events

### Milestone 2 implications

- implement workflow engine and orchestration
- implement model routing
- implement evidence trails, provenance, and export support
- implement data lifecycle/privacy controls
- implement evaluation harnesses for safety and quality

### Milestone 3 implications

- mature module runtime contract and packaging
- add observability and ops telemetry
- add backup/restore/upgrade/recovery operations

### Milestone 4 implications

- add enterprise identity and authorization
- add tenancy/isolation
- address commercial packaging concerns

## 12. Open questions and unresolved decisions

- Should Home be role-tailored by default or mostly consistent across personas?
- Is the analyst-primary working surface Runs-first or Cases / Evidence-first after intake?
- What is the canonical normalized alert schema for Module 1 intake?
- What is the minimum evidence object split between source, artifact, and evidence item in the core schema?
- Which enrichment connectors are mandatory for MVP?
- What exact approval object state machine and escalation rules will be adopted?
- How should export manifests encode redactions, derived artifacts, and integrity chains?
- Which local models are the default for extraction and summarization?
- Which data classes are never allowed to leave self-hosted execution without override?
- What is the first optional external handoff target?

## Contradictions resolved or called out

- Resolved: Corestack is defined as one desktop/control plane. Packs remain runtime packaging, not product identity.
- Resolved: Admin / Tenancy remains a core-owned navigation surface, but tenancy implementation is deferred beyond MVP.
- Resolved: Home and Launcher are entry surfaces; Runs and Cases / Evidence are the primary work and review surfaces.
- Called out: the exact analyst-primary surface after intake remains a UX decision between Runs-first and Cases / Evidence-first.
- Called out: the detailed object boundary between source, artifact, and evidence item still needs schema resolution.

## Alignment

This specification consolidates:

- [ISSUES_ORDER.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/ISSUES_ORDER.md)
- [SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/SECURITY_OSINT_MODULE_1.md)
- [REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md)
- [UX_INFORMATION_ARCHITECTURE_CORESTACK_DESKTOP.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/UX_INFORMATION_ARCHITECTURE_CORESTACK_DESKTOP.md)
