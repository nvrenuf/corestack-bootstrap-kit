# SECURITY_OSINT_MODULE_1.md

## 1. Module purpose

### What Security/OSINT Module 1 is

Security/OSINT Module 1 is the first domain module for Corestack. It defines the minimum investigation-oriented capability the Corestack desktop/control plane must support for security operations and open-source intelligence work.

It exists to validate the first reusable platform abstractions for:

- alert and investigation intake
- governed workflow execution
- controlled tool and connector access
- evidence and case creation with provenance
- policy-governed model use
- approvals and human review
- exportable investigation outputs

This module should drive architecture, UI, workflow semantics, evidence objects, and issue sequencing for the rest of the platform.
If a downstream runtime pack is used later, it is an implementation packaging detail and not the product identity for Module 1.

### Who it is for

Security/OSINT Module 1 is for security teams and operators who need one governed workspace for:

- alert triage
- investigation and enrichment
- OSINT-based entity research
- evidence capture and review
- incident reporting and export

### What it is not

Security/OSINT Module 1 is not:

- a general-purpose SIEM replacement
- a full SOAR platform with broad automated response
- a malware sandbox or detonation environment
- a separate product or separate operating shell
- a threat intel platform with broad feed management and scoring
- a marketing or demo-specific module

## 2. Implementation rule

Corestack remains one desktop/control plane product.

Security/OSINT Module 1 must consume and validate reusable platform contracts rather than introducing one-off vertical infrastructure. The default rule is:

- core owns reusable workflow, policy, approval, evidence, audit, model routing, and UI shell behavior
- structured audit/event trails are required platform behavior for run/tool/evidence/approval reconstruction (see `AUDIT_EVENT_MODEL.md`)
- Module 1 owns domain workflows, domain views, domain-specific data extensions, and domain connector usage

If Module 1 appears to require a private subsystem, that should be treated as a signal that the corresponding core platform contract is incomplete and needs refinement.

## 3. Primary users

### SOC analyst

#### Core goals

- triage alerts quickly
- determine whether escalation is needed
- attach evidence and produce defensible findings

#### Main actions

- open alert-driven investigations
- review enrichment and summary output
- attach or review evidence
- disposition or escalate cases

#### What they need from the platform

- fast access to runs and cases
- visible blockers, denials, and pending approvals
- evidence-linked findings
- clear case status and disposition paths

### IR lead

#### Core goals

- oversee active investigations
- maintain evidence quality and review discipline
- approve major incident actions and exports

#### Main actions

- review high-severity cases
- inspect findings, timelines, and evidence coverage
- approve escalations, exports, and exceptions
- reassign or direct investigation work

#### What they need from the platform

- case-centric review views
- approval queues with sufficient context
- export readiness signals
- audit visibility for high-risk actions

### Threat hunter

#### Core goals

- pursue hypotheses across signals and entities
- correlate weak indicators into actionable findings
- pivot quickly across related evidence

#### Main actions

- initiate entity investigations
- search and pivot across evidence, artifacts, and entities
- save hypotheses, notes, and findings

#### What they need from the platform

- entity-aware investigations
- relationship visibility
- rapid access to prior runs and evidence
- policy-safe enrichment and collection paths

### OSINT investigator

#### Core goals

- investigate external entities and infrastructure using controlled sources
- preserve provenance for collected material
- separate evidence-backed observations from unresolved hypotheses

#### Main actions

- run search/fetch/enrichment workflows
- collect and review source artifacts
- produce evidence-linked observations and notes

#### What they need from the platform

- controlled web/OSINT collection
- source and artifact provenance
- easy case and evidence linkage
- exportable investigation outputs

### Security manager

#### Core goals

- understand case status and investigation quality
- review major approvals and exceptions
- consume exportable outputs without re-running technical work

#### Main actions

- review case summaries
- inspect high-risk approvals and overrides
- review exported evidence packs and management summaries

#### What they need from the platform

- concise top-level case visibility
- auditable approval history
- clear review and export surfaces
- confidence that outputs are evidence-backed

## 4. First 3 end-to-end workflows

These workflows are the reference flows for Module 1 and should directly drive workflow engine design, object design, UI surfaces, and issue refinement.

### Workflow 1: Alert triage and investigation

#### Trigger/input

- alert from a log/alert connector
- manual analyst-created alert intake
- new alert attached to an existing case

Minimum input:

- alert id
- source system
- timestamp
- severity
- title or summary
- raw or normalized payload
- initial entities if known

#### Workflow steps

1. Create a run and create or attach to a case.
2. Normalize the alert payload.
3. Extract candidate entities and relevant context.
4. Execute allowed enrichment and external lookups through governed paths.
5. Correlate results with prior evidence, artifacts, and related runs.
6. Draft a triage summary and recommended disposition.
7. Route to approval or review if policy requires it.
8. Finalize case and run state.

#### Tools used

- log/alert ingestion connector
- `web.search`
- `web.fetch`
- enrichment connectors
- artifact storage
- case/report export tool
- optional ticket/case handoff connector

#### Model usage

- local/open-weight model for extraction and summary drafting
- optional secondary provider only where policy permits
- deterministic validation for schema and evidence-link completeness where available

#### Human approval points

- escalation when policy or severity requires review
- connector scope exceptions if policy requires approval
- final disposition when confidence or policy threshold requires it
- external export or handoff

#### Outputs

- triage summary
- recommended disposition
- linked entities
- finding set
- updated case state

#### Evidence created

- alert snapshot
- normalized alert artifact
- enrichment artifacts
- findings and notes
- timeline entries

#### Logs/audit requirements

- alert ingest event
- workflow start/step/failure/completion events
- tool and connector execution events
- policy decisions
- model routing decisions
- approval decisions
- evidence creation and mutation events

#### Failure conditions

- alert cannot be normalized
- required connector is unavailable
- policy denies required collection
- evidence cannot be stored or linked
- output does not meet minimum support for disposition

#### Success criteria

- alert is dispositioned or escalated with rationale
- material claims are linked to evidence
- investigation path is reconstructable
- reconstruction is backed by the structured platform audit/event model in `AUDIT_EVENT_MODEL.md`

### Workflow 2: OSINT entity investigation

#### Trigger/input

- manual investigation request
- pivot from an alert or case
- imported target list

Minimum input:

- investigation request id
- entity type
- seed value
- purpose
- allowed scope

#### Workflow steps

1. Create a run and create or attach to a case.
2. Validate requested scope against policy.
3. Execute allowed search, fetch, and enrichment steps.
4. Extract and normalize sources, entities, and claims.
5. Deduplicate and correlate observations.
6. Draft an investigator summary that separates evidence-backed observations from unresolved hypotheses.
7. Route to approval where required.
8. Persist findings, notes, and optional export state.

#### Tools used

- `web.search`
- `web.fetch`
- enrichment connectors
- artifact storage
- case/report export tool
- optional ticket/case handoff connector

#### Model usage

- local/open-weight model for extraction, clustering assistance, summary drafting, and relationship suggestion
- optional external provider only where policy allows

#### Human approval points

- broadened search scope where policy requires it
- later-added higher-risk external collection categories
- final export or closure where policy requires it

#### Outputs

- entity profile
- structured findings
- investigator notes
- exportable summary where requested

#### Evidence created

- source records
- fetched artifacts and metadata snapshots
- entity records
- relationship records
- findings, notes, and timeline entries

#### Logs/audit requirements

- search/fetch request and response events
- connector usage events
- policy allow/deny events
- model routing and execution metadata
- provenance capture for persisted source-derived artifacts
- approval and export events

#### Failure conditions

- target cannot be disambiguated
- policy blocks required collection
- sources return insufficient or unusable data
- provenance cannot be established for collected material
- findings are not adequately supported

#### Success criteria

- the initial question is answered or explicitly marked unresolved
- provenance is preserved across collected materials
- unsupported claims remain clearly separated from supported findings

### Workflow 3: Incident evidence pack generation

#### Trigger/input

- existing case marked ready for reporting
- IR lead requests an evidence pack
- export or handoff action requires formal packaging

Minimum input:

- case id
- report purpose
- evidence scope
- target time range
- export destination or output type

#### Workflow steps

1. Load case, findings, evidence, artifacts, approvals, and timeline.
2. Validate completeness and identify unresolved gaps.
3. Assemble chronology and supporting evidence references.
4. Draft the report package and manifest.
5. Route the package for review and approval.
6. Freeze approved package metadata.
7. Export and record release metadata.

#### Tools used

- artifact storage read/write
- case/report export tool
- optional external handoff connector

#### Model usage

- local/open-weight model for chronology summarization and report drafting
- deterministic packaging logic for manifest and integrity references
- no model-generated content may silently fill missing evidence

#### Human approval points

- final report approval
- redaction approval where policy requires it
- external export or handoff approval

#### Outputs

- evidence pack manifest
- analyst-facing report
- management-facing summary
- export bundle reference

#### Evidence created

- immutable export manifest
- report artifacts
- approval linkage
- export receipt or handoff record

#### Logs/audit requirements

- package-generation events
- evidence inclusion or exclusion decisions
- redaction events
- approval decisions
- export events

#### Failure conditions

- required evidence is missing or inaccessible
- report contains unsupported statements
- requested export conflicts with policy or redaction requirements
- export target is unavailable

#### Success criteria

- package is reviewable without ad hoc reconstruction
- included statements map to evidence or explicit analyst assessment
- export history is reconstructable

## 5. Platform contracts exercised by Module 1

### Workflow/run contract

#### Purpose

Provide reusable execution semantics for workflow definitions, run states, step execution, and linkage to cases and evidence.

#### What core owns

- run object lifecycle
- step execution model
- resumability and failure states
- run-to-case and run-to-audit linkage

#### What Module 1 expects

- explicit step types for ingest, tool, model, review, approval, evidence, and export
- resumable runs
- linked artifacts and evidence references

### Tool execution contract

#### Purpose

Provide a governed, normalized path for tool and connector invocation.

#### What core owns

- shared request/response schemas
- normalized errors
- execution metadata
- governed transport and routing

#### What Module 1 expects

- policy-safe access to `web.fetch`, `web.search`, and connector-backed actions
- stable response envelopes
- correlation to runs, cases, and evidence

### Policy/gating contract

#### Purpose

Provide reusable runtime decisions for whether an action is allowed, denied, or approval-gated.

#### What core owns

- policy definition and evaluation
- reason codes
- limit enforcement metadata
- approval-required signaling

#### What Module 1 expects

- default-deny behavior for external collection
- step-level restrictions for connectors, models, and export
- predictable policy outcomes that workflows can surface to users

### Approval/HITL contract

#### Purpose

Provide reusable approval objects, state transitions, escalations, overrides, and user-facing review paths.

#### What core owns

- approval object schema
- approval queue and state machine
- escalation and override semantics
- auditability of approval actions

#### What Module 1 expects

- ability to gate escalation, export, exceptions, and selected dispositions
- sufficient context on the approval object to support investigator review

### Evidence/case contract

#### Purpose

Provide canonical objects for cases, evidence, artifacts, findings, notes, entities, relationships, and export metadata.

#### What core owns

- core object definitions
- provenance fields
- lifecycle hooks
- object linkage rules

#### What Module 1 expects

- first-class support for case, evidence item, artifact, finding, source, note, relationship, and export package
- chain-of-custody and derived-from linkage

### Model routing contract

#### Purpose

Provide reusable selection and invocation of local or external models under policy constraints.

#### What core owns

- model registry
- provider adapters
- routing policy and logging
- fallback behavior

#### What Module 1 expects

- local/open-weight default routing
- step-level capability requests for extraction, reasoning, and summarization
- policy-enforced provider restrictions

### Audit/logging contract

#### Purpose

Provide reusable structured event capture for security review, reconstruction, and operations.

#### What core owns

- event taxonomy
- event persistence model
- correlation and integrity strategy
- retention and redaction rules

#### What Module 1 expects

- workflow, tool, policy, model, approval, evidence, and export events
- searchable correlation across runs and cases

### Module extension contract

#### Purpose

Provide the reusable mechanism for modules to add workflows, views, connectors, and schema extensions without duplicating core infrastructure.

#### What core owns

- lifecycle and registration model
- extension points
- compatibility validation
- restrictions on what modules may override

#### What Module 1 expects

- ability to register Security/OSINT workflows, views, and connector usage
- no requirement to provide a private shell, policy engine, or workflow runtime

## 6. Required platform capabilities exercised by Module 1

### Control plane surfaces

Module 1 requires:

- home and launcher entry points
- launcher/module entry
- runs
- approvals
- cases/evidence
- files/artifacts
- logs/audit
- policies
- models
- connectors

### Workflow engine needs

- ingest, tool, model, review, approval, evidence, and export steps
- resumable runs
- blocked/failure state handling
- linkage of outputs to case and evidence objects

### Model routing needs

- local/open-weight default path
- optional external path under policy
- logged routing decisions
- step-level capability selection

### Policy engine needs

- tool and connector gating
- model routing restrictions
- export restrictions
- approval-required decisions
- allowlists and execution limits

### Evidence/case model needs

- core case
- evidence item
- artifact
- finding
- note
- entity
- relationship
- timeline event
- export package linkage

### Sandbox/gatekeeper needs

- centralized tool gateway for external collection
- least-privilege connector execution
- no unmanaged internet access from module workflows
- restricted secret scope and execution boundaries

### Audit/forensics needs

- structured event taxonomy
- correlation ids across runs, approvals, tools, and cases
- provenance and chain-of-custody support
- exportable investigation reconstruction

## 7. Required tool classes and connectors

Keep this minimal and architecture-driving.

### Web/OSINT fetch/search

- `web.fetch`
- `web.search`

### Log/alert ingestion

- alert intake connector
- manual intake path

### Artifact storage

- artifact write/read path for snapshots, reports, and manifests

### Case/report export

- report generation and export path
- evidence pack manifest export

### Optional ticket/case handoff

- one optional external handoff connector class

### Enrichment tools

- minimum enrichment connectors for entities relevant to Module 1 workflows

## 8. Approval and HITL model for Module 1

### What can be automatic

- alert normalization
- baseline entity extraction
- policy-allowed search/fetch/enrichment
- draft note and summary generation
- evidence object creation from workflow outputs
- timeline and artifact creation

### What must require human approval

- external export or handoff
- policy override or scope exception
- incident escalation where policy requires it
- final release of incident evidence packs
- selected final dispositions where confidence or severity requires review

### Who can approve

- SOC analyst may resolve low-risk actions only where policy permits
- IR lead approves incident escalations, major dispositions, and evidence pack release
- security manager approves high-risk exceptions, major exports, or business-impacting escalations
- platform admin approves policy or connector exceptions where the approval concerns platform governance rather than investigation content

### What gets logged

- approval request creation
- requester, approver, subject, rationale, scope, and expiration
- state transitions: approved, denied, changes requested, escalated, expired, overridden
- linked case, run, policy, and export references
- override rationale and authority when used

## 9. Evidence and case expectations

### Minimum evidence objects

- case
- evidence item
- artifact
- source
- finding
- note
- entity
- relationship
- timeline event
- approval linkage
- export package or manifest

### Minimum provenance required

Every evidence-bearing object should carry at least:

- stable id
- linked case id and/or run id
- source or acquisition method
- tool or connector used
- actor type
- created timestamp
- parent or derived-from reference where applicable
- policy decision reference where applicable
- integrity metadata where available

### Case expectations

A case should answer:

- what triggered the work
- what runs were executed
- what evidence exists
- what findings were produced
- what approvals occurred
- what was exported
- whether the full path is reconstructable

## 10. Model strategy for Module 1

Module 1 shall align to these platform rules:

- open-weight-first
- self-hosted-first
- pluggable providers
- policy-governed routing

Operational meaning:

- local/open-weight models are the default path for extraction, reasoning support, and summarization
- external providers are optional and never the default architecture
- provider selection must remain policy-governed and auditable
- workflows must express capability requirements rather than vendor-specific dependencies

## 11. MVP boundaries

### In Module 1 MVP

- alert triage and investigation
- OSINT entity investigation
- incident evidence pack generation
- controlled `web.fetch` and `web.search`
- alert intake path
- minimal enrichment connector framework
- case/evidence/artifact/finding linkage
- approvals for export, exception, and selected escalation paths
- auditable workflow, tool, policy, model, approval, and evidence events

### Explicitly out of scope

- autonomous remediation
- malware detonation
- broad threat-intel feed platform behavior
- enterprise tenancy implementation
- advanced graph visualization
- extensive executive dashboards
- broad connector catalog beyond Module 1 minimums

## 12. Open questions

- What is the canonical normalized alert schema for Module 1 intake?
- What is the exact object boundary between source, artifact, and evidence item?
- Which enrichment connectors are mandatory for MVP?
- What exact approval state machine and escalation rules should core adopt?
- Which local models are the default for extraction and summarization?
- Which data classes must never leave self-hosted execution without override?
- What is the first optional external handoff target?
- How should export manifests encode redactions and integrity references?

## Alignment to ISSUES_ORDER.md

This document is intended to satisfy and guide:

- Milestone 0, item 2: Security/OSINT Module 1 definition
- Milestone 0, item 3: Evidence and case object model
- Milestone 0, item 4: Agent sandbox / gatekeeper security model
- Milestone 0, item 5: Approvals and human-in-the-loop decision model
- Milestone 1 and 2 work on control plane architecture, tool gating, workflow orchestration, model routing, audit, and evidence trails

Corestack remains one desktop/control plane, and Security/OSINT Module 1 is the first module used to validate the shared platform contracts.
