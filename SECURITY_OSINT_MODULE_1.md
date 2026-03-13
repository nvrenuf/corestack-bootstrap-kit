# SECURITY_OSINT_MODULE_1.md

## 1. Module purpose

### What Security/OSINT Module 1 is

Security/OSINT Module 1 is the first domain module for Corestack. It defines the minimum investigative capability the Corestack desktop/control plane must support for security operations and open-source intelligence work.

Its purpose is to drive the first reusable platform abstractions for:

- alert and intake handling
- investigative workflow execution
- controlled tool use against internal and external sources
- evidence and case object creation
- policy-governed model use
- human approvals and auditability
- export of investigation outputs

Module 1 is not just a feature bundle. It is the reference module used to shape control plane contracts, workflow semantics, UI surfaces, audit requirements, and issue execution order for the rest of the platform.

### Who it is for

Security/OSINT Module 1 is for teams that need a single operator-facing control plane to:

- triage security alerts
- investigate entities, infrastructure, and external reporting using OSINT
- collect and preserve evidence with provenance
- generate reviewable outputs for incidents and cases

The primary deployment assumption is self-hosted, security-conscious teams that prefer local or controlled execution over SaaS-first architectures.

### What it is not

Security/OSINT Module 1 is not:

- a general-purpose SIEM replacement
- a full SOAR product with broad autonomous remediation
- a malware detonation platform
- a threat intel platform with full feed management and scoring
- a separate product or separate OS build
- a marketing dashboard module

It should stay narrowly scoped to the first investigation-oriented workflows that force the right Corestack platform boundaries.

## 2. Primary users

### SOC analyst

- Starts from alerts, artifacts, or leads.
- Needs fast triage, enrichment, evidence capture, and clear escalation paths.

### IR lead

- Oversees active incidents and investigation quality.
- Needs approval controls, evidence integrity, timeline reconstruction, and exportable case packages.

### Threat hunter

- Starts from hypotheses, weak signals, or suspicious infrastructure.
- Needs entity-centric pivots, enrichment workflows, and repeatable correlation.

### OSINT investigator

- Starts from names, domains, handles, IPs, hashes, or documents.
- Needs controlled external collection, provenance capture, note-taking, and structured findings.

### Security manager

- Reviews outcomes rather than conducting every step directly.
- Needs workflow visibility, approval controls, case summaries, and auditable exports.

## 3. First 3 end-to-end workflows

These are the initial reference workflows for Module 1. They should drive workflow engine primitives, UI layout, evidence storage, approvals, and audit taxonomy.

### Workflow 1: Alert triage and investigation

#### Trigger/input

- Ingested alert from log/alert connector
- Manual analyst-created alert intake
- Existing case receives a new linked alert

Minimum input object:

- alert id
- source system
- timestamp
- severity
- title/summary
- raw event or normalized alert payload
- initial entities if known

#### Steps

1. Create or attach to a case/run.
2. Normalize alert payload and extract candidate entities.
3. Enrich entities with internal context and allowed external lookups.
4. Correlate related alerts/artifacts already present in Corestack.
5. Produce an investigation summary with confidence notes and recommended disposition.
6. Route to human review for disposition.
7. On approval, finalize findings, evidence links, and next-action output.

#### Tools used

- log/alert ingestion connector
- web.search
- web.fetch
- enrichment connectors for domain/IP/hash/user context
- artifact storage writer
- case/report export tool
- optional ticket/case handoff connector

#### Model usage

- Local/open-weight model for entity extraction, summarization, clustering, and analyst-facing draft output
- Optional secondary model for higher-context synthesis only if policy permits
- Deterministic or rule-based validators for schema checks, evidence-link presence, and disposition completeness

#### Human approval points

- Approve external connector use if policy requires elevated access
- Approve incident escalation or case severity increase
- Approve final disposition when workflow confidence is below threshold or policy demands review
- Approve outbound handoff/export to external ticketing or reporting systems

#### Outputs

- triage summary
- recommended disposition
- linked entities
- finding set
- updated case status
- optional escalation package

#### Evidence created

- alert record snapshot
- normalized alert artifact
- enrichment result artifacts
- analyst/model notes with provenance
- finding records linked to supporting evidence
- case timeline entries

#### Logs/audit requirements

- alert ingest event
- workflow start/step/finish events
- tool requests and policy decisions
- model routing decisions
- approvals, denials, overrides
- evidence creation and mutation events
- export/handoff events

#### Failure conditions

- alert payload cannot be normalized
- required enrichment connector unavailable
- policy denies needed tool access
- evidence cannot be written or linked
- output lacks enough support for disposition
- approval timeout on required decision gate

#### Success criteria

- alert is dispositioned or escalated with explicit rationale
- all material claims are linked to evidence
- investigation path is reconstructable from logs and case timeline
- output is reviewable without re-running the workflow

### Workflow 2: OSINT entity investigation

#### Trigger/input

- Manual investigation request
- Entity pivot from alert triage
- Imported target list for domains, IPs, people, organizations, usernames, emails, hashes, or documents

Minimum input object:

- investigation request id
- entity type
- seed value
- request purpose
- allowed connector/tool scope

#### Steps

1. Open a new investigation run or attach to an existing case.
2. Validate entity type and policy-allowed collection scope.
3. Query allowed internal and external sources for baseline context.
4. Extract and normalize related entities, artifacts, and claims.
5. Correlate observations across sources and deduplicate repeated evidence.
6. Draft an investigator summary that separates evidence-backed claims from unresolved hypotheses.
7. Present findings and evidence graph for human review.
8. On approval, persist findings and export or hand off as needed.

#### Tools used

- web.search
- web.fetch
- enrichment connectors
- artifact storage writer
- case/report export tool
- optional ticket/case handoff connector

#### Model usage

- Local/open-weight model for extraction, summarization, relationship suggestion, and note drafting
- Optional retrieval or embedding support for source clustering and similarity search if implemented in Corestack core
- Policy-controlled secondary provider only for steps that exceed local model capability

#### Human approval points

- Approve broadened search scope beyond initial target or connector policy
- Approve high-risk external collection categories if later supported
- Approve final findings before export or case closure

#### Outputs

- entity profile
- linked entities and infrastructure map
- summarized observations
- finding set with confidence and support
- investigator notes

#### Evidence created

- source records with fetch metadata
- content snapshots or extracted metadata artifacts
- normalized entity records
- relationship records
- claim/finding records with supporting evidence links
- investigation timeline entries

#### Logs/audit requirements

- search/fetch requests and normalized responses
- policy allow/deny events
- model routing and prompt class metadata
- provenance records for every persisted source-derived artifact
- review and approval actions

#### Failure conditions

- target is ambiguous and cannot be disambiguated
- source collection fails or returns low-value/noisy data
- unsupported entity type for requested workflow path
- provenance cannot be established for collected material
- findings exceed confidence policy without enough supporting evidence

#### Success criteria

- investigator can answer the initial question with evidence-linked findings
- related entities are captured in structured form
- unsupported claims remain clearly marked as unresolved or speculative
- exported output preserves provenance and review state

### Workflow 3: Incident evidence pack generation

#### Trigger/input

- Existing case marked ready for reporting
- IR lead requests an evidence pack
- Escalation or external handoff requires a structured export

Minimum input object:

- case id
- report purpose
- target time range
- included evidence scope
- export destination or output type

#### Steps

1. Load case, findings, artifacts, approvals, and timeline events.
2. Validate evidence completeness and unresolved gaps.
3. Assemble a draft incident timeline and supporting evidence index.
4. Generate a report package with summaries, findings, artifacts, and provenance references.
5. Route package to reviewer for approval.
6. Freeze approved package metadata and export.
7. Record export event and retention requirements.

#### Tools used

- artifact storage reader/writer
- case/report export tool
- optional ticket/case handoff connector

#### Model usage

- Local/open-weight model for report drafting, chronology summarization, and executive summary generation
- Deterministic packaging logic for manifest generation, checksums, and export validation
- No model should fabricate missing facts; missing evidence must remain marked as missing

#### Human approval points

- Approve final report language and scope
- Approve external export/handoff
- Approve redactions if policy or privacy controls require them

#### Outputs

- incident evidence pack manifest
- analyst-facing detailed report
- management-facing summary
- export bundle reference

#### Evidence created

- immutable export manifest
- checksums or content hashes for included artifacts
- report artifact versions
- approval record for release
- export receipt / handoff record

#### Logs/audit requirements

- package generation request
- evidence inclusion/exclusion decisions
- redaction actions
- final approval and export events
- artifact hash capture

#### Failure conditions

- required evidence missing or inaccessible
- report contains unsupported statements
- redaction policy conflicts with requested export scope
- export target unavailable
- approval denied or expired

#### Success criteria

- package is complete enough for review or handoff without ad hoc reconstruction
- every included statement maps to supporting evidence or is explicitly marked as analyst assessment
- package contents and release path are auditable and reproducible

## 4. Required platform capabilities exercised by Module 1

### Control plane surfaces

Module 1 requires the Corestack desktop/control plane to expose:

- launcher entry for Security/OSINT module
- investigation run view
- case view
- evidence/artifact browser
- approvals queue
- policy decision visibility
- model routing visibility
- connector administration
- audit/log search
- export/handoff status view

These surfaces should be part of one Corestack control plane, not separate apps.

### Workflow engine needs

The workflow engine must support:

- ingest, enrich, correlate, analyze, review, approve, export step types
- resumable runs
- branching based on policy or confidence
- human review checkpoints
- evidence attachment at any step
- failure state capture with retry/review paths
- run-to-case linking

### Model routing needs

The model layer must support:

- step-level model selection
- local/open-weight default routing
- optional external provider routing under policy
- model capability tags such as extraction, summarization, reasoning, report drafting
- routing logs with rationale and policy inputs
- hard blocks for data classes not allowed off-box

### Policy engine needs

The policy engine must support:

- default-deny tool and connector access
- allowlists for external domains and sources
- model routing restrictions by workflow step and data class
- approval-required actions for export, external providers, or sensitive collection
- rate, byte, and timeout limits
- tenant-agnostic now, but structured so future tenancy can scope policies cleanly

### Evidence/case model needs

The core model must support:

- case
- run
- evidence item
- artifact
- source
- entity
- relationship
- finding
- note
- approval
- export package

Objects must support provenance, review state, timestamps, authorship, and linkage across workflow runs.

### Sandbox/gatekeeper needs

Module 1 requires:

- centralized tool gateway for external access
- least-privilege connector execution
- no direct arbitrary internet access from general agents
- policy-enforced allowlist and limits
- separate execution path for collectors/connectors versus case/model logic
- credential isolation for external connectors

### Audit/forensics needs

Module 1 requires:

- append-only or integrity-protected audit streams
- event taxonomy for tool, model, workflow, approval, policy, evidence, export, and user actions
- correlation ids across runs, tools, cases, and approvals
- reconstructable case timeline
- exportable audit bundle for investigations

## 5. Required tool classes and connectors

Keep this to the minimum required for Module 1.

### Web/OSINT fetch/search

- `web.search`
- `web.fetch`
- provider-backed search/fetch through the Tool Gateway and workflow engine

### Log/alert ingestion

- normalized alert intake connector
- manual alert upload/input path

### Artifact storage

- object/artifact storage for snapshots, reports, manifests, and normalized payloads

### Case/report export

- markdown/json export at minimum
- evidence pack manifest export

### Optional ticket/case handoff

- one optional connector path for handing off a case or incident summary to an external system

### Enrichment tools

- minimum enrichment set for domains, IPs, URLs, hashes, users, and entities
- implemented as pluggable connectors behind policy gates

## 6. Approval and HITL model for Module 1

### Can be automatic

- alert normalization
- entity extraction
- allowed enrichment against pre-approved tools/connectors
- draft note and summary generation
- evidence object creation for raw collected artifacts
- internal correlation and duplicate detection
- draft report assembly before release

### Must require approval

- any external export or handoff
- any use of non-approved external model/provider
- severity escalation when policy requires manager or IR lead review
- final disposition for incidents above configured threshold
- final release of incident evidence packs
- policy override or exception-based connector use

### Conditional approval

These may be automatic in low-risk policies and approval-gated in stricter deployments:

- external OSINT collection beyond baseline connectors
- broadened search scope from a seed entity to related parties
- redaction decisions for export
- case closure on low-severity triage outcomes

## 7. Evidence and case expectations

### Minimum evidence objects

Module 1 should assume the following minimum objects exist:

- source
- artifact
- evidence item
- finding
- entity
- relationship
- note
- case
- case timeline event
- approval record
- export package manifest

### Minimum provenance required

Every evidence-bearing object should carry at least:

- object id
- case id and/or run id
- source type
- acquisition method
- collector/tool/connector id
- actor type: user, workflow, tool, model, connector
- timestamp(s)
- content hash or equivalent integrity field where applicable
- parent/derived-from references
- policy decision reference where applicable
- review state

### Minimum case expectations

A case should be able to answer:

- what triggered the case
- what evidence was collected
- what claims/findings were made
- which tools/models/connectors were used
- which approvals occurred
- what was exported
- whether the chain of actions is reconstructable

## 8. Model strategy for Module 1

Module 1 should align to these platform rules:

- open-weight-first
- self-hosted-first
- pluggable providers
- policy-governed routing

### Operational meaning

- Local/open-weight models are the default path for extraction, summarization, clustering, and report drafting.
- External providers are optional adapters, not a required dependency.
- Routing decisions must consider data sensitivity, workflow step, allowed provider class, latency, and cost.
- Steps that involve raw evidence, potentially sensitive incident data, or regulated data classes should default to self-hosted execution unless policy explicitly allows otherwise.
- Module logic should depend on capability classes, not hard-coded vendors.

## 9. MVP boundaries

### In Module 1 MVP

- alert triage and investigation workflow
- OSINT entity investigation workflow
- incident evidence pack generation workflow
- controlled web search/fetch through the gateway
- basic alert ingestion
- minimum enrichment connector framework
- case/evidence linkage sufficient for investigation reconstruction
- approval gates for export, escalation, and policy exceptions
- markdown/json report outputs
- auditable run, tool, model, and approval logging

### Explicitly out of scope

- autonomous remediation or response actions
- malware sandboxing or binary detonation
- deep threat intel feed management
- broad SIEM data lake or search replacement
- multi-tenant isolation design beyond future compatibility
- advanced graph analytics beyond minimum relationships
- full dashboard suite for executives
- broad collaboration suite/chatops
- verification/scoring layers beyond minimum provenance and review controls

Out-of-scope items can become later modules or later milestones, but they should not distort Module 1 architecture.

## 10. Open questions

- What is the first canonical normalized alert schema for Corestack intake?
- What is the minimum evidence object split between `artifact`, `evidence item`, and `source` in the core schema?
- Which enrichment connectors are mandatory for MVP versus deferred?
- What exact approval object schema and state machine will Corestack adopt?
- How should report/export manifests encode redactions, derived artifacts, and hash chains?
- Which local model(s) are the default for extraction and summarization in self-hosted deployments?
- What data classes are never allowed to leave self-hosted execution without explicit override?
- What is the first external handoff target, if any, for optional ticket/case export?
- How much of the current Fear Signal Radar pack should be treated as a downstream runtime pack versus a direct Module 1 reference implementation?
- Which UI surface is primary for analysts first: case-first, run-first, or alert queue-first?

## Alignment to ISSUES_ORDER.md

This document is intended to satisfy and guide the Module 1 planning work called out in:

- Milestone 0, item 2: Security/OSINT Module 1 definition
- Milestone 0, item 3: Evidence and case object model
- Milestone 0, item 4: Agent sandbox / gatekeeper security model
- Milestone 0, item 5: Approvals and human-in-the-loop decision model
- Milestone 1 and 2 items covering workflow engine, model routing, policy engine, audit, and forensics

The implementation implication is straightforward: Corestack remains one desktop/control plane, and Security/OSINT Module 1 is the first domain module that forces the reusable platform contracts.
