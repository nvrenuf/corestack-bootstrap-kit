# REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md

## 1. Architecture intent

Corestack is one desktop/control plane product. It owns the common runtime, UI, API, security controls, workflow execution, policy enforcement, evidence handling, auditability, and module lifecycle.

Security/OSINT is Module 1. It is the first domain module to consume these reusable platform contracts and prove they are sufficient for real investigative work.

Module 1 must not introduce one-off vertical infrastructure unless there is an explicit architectural justification. The default rule is:

- reusable execution, policy, approval, evidence, model, audit, and UI patterns belong in core
- domain workflows, domain connectors, domain views, and domain-specific data extensions belong in the module

The architecture goal is to let future modules reuse the same contracts without cloning infrastructure inside each module.

## 2. Platform contracts exercised by Module 1

### Workflow/run contract

#### Purpose

Provide the reusable execution model for all module workflows, including state, steps, artifacts, retries, resumability, and linkage to cases and approvals.

#### Required inputs/outputs

Inputs:

- workflow definition id
- module id
- trigger/input payload
- actor/request context
- case id if present
- policy context

Outputs:

- run id
- step execution records
- run state transitions
- attached artifacts/evidence references
- approval requests
- final outputs and status

#### Ownership

- Core owns the contract, state machine, execution semantics, and storage conventions.
- Module 1 owns workflow definitions, step intent, and domain-specific output schemas.

#### What Module 1 expects from it

- resumable investigation runs
- explicit step types for ingest, enrich, analyze, review, approve, and export
- failure and retry handling
- run-to-case linking
- evidence attachment at any step

### Tool execution contract

#### Purpose

Provide a controlled, normalized interface for executing tools and connectors through a governed path.

#### Required inputs/outputs

Inputs:

- tool id
- requester identity
- purpose
- workflow/run context
- typed tool input payload

Outputs:

- normalized response envelope
- timing and byte metadata
- policy decision metadata
- correlation id
- normalized error shape on failure

#### Ownership

- Core owns tool invocation semantics, transport, normalization, and shared schemas.
- Module 1 owns which tools/connectors it requests and any domain-specific interpretation of outputs.

#### What Module 1 expects from it

- stable request/response schemas
- deny-by-default execution
- correlation between tool output and workflow/evidence objects
- support for `web.search`, `web.fetch`, enrichment connectors, export, and intake paths

### Policy/gating contract

#### Purpose

Provide reusable decision points for whether a tool, connector, model, export, or workflow step is allowed.

#### Required inputs/outputs

Inputs:

- subject action
- requester and role
- module/workflow/step context
- target resource
- data classification if known
- environment/deployment policy

Outputs:

- allow/deny decision
- reason codes
- required limits or obligations
- approval required flag when applicable

#### Ownership

- Core owns policy expression, evaluation, logging, and enforcement hooks.
- Module 1 may contribute policy-relevant metadata and module defaults, but does not own the policy engine.

#### What Module 1 expects from it

- default-deny behavior
- allowlists and limit controls for external sources
- step-level restrictions for connectors and model providers
- approval escalation when policy requires it

### Approval/HITL contract

#### Purpose

Provide a reusable approval object and lifecycle for actions that cannot run automatically.

#### Required inputs/outputs

Inputs:

- approval subject
- requested action
- scope
- rationale
- requester
- expiration/escalation metadata
- linked run/case/policy references

Outputs:

- approval id
- state transitions
- approver identity
- decision rationale
- override/escalation record if applicable

#### Ownership

- Core owns approval objects, states, queues, and auditability.
- Module 1 owns when its workflows ask for approval and what domain context is presented to approvers.

#### What Module 1 expects from it

- explicit gates for export, escalation, policy exceptions, and sensitive actions
- human review surfaces tied to runs and cases
- timeout and escalation handling

### Evidence/case contract

#### Purpose

Provide the canonical object model for cases, evidence, findings, entities, relationships, notes, timeline events, and export packages.

#### Required inputs/outputs

Inputs:

- object type
- provenance metadata
- actor/workflow context
- parent or derived-from references
- review state

Outputs:

- stable object ids
- relationship links
- case timeline updates
- exportable evidence manifests
- retention/redaction metadata

#### Ownership

- Core owns canonical object types, provenance rules, integrity fields, and storage contracts.
- Module 1 owns domain-specific extensions such as security alert fields or OSINT-specific entity annotations.

#### What Module 1 expects from it

- first-class support for case, artifact, evidence item, source, finding, entity, relationship, note, approval, and export package
- chain-of-custody and provenance fields
- ability to link workflow outputs to evidence and cases

### Model routing contract

#### Purpose

Provide a reusable path for selecting and invoking models based on capability, policy, hosting, and risk constraints.

#### Required inputs/outputs

Inputs:

- requested capability
- module/workflow/step context
- data sensitivity context
- routing constraints
- prompt/input payload

Outputs:

- selected model/provider
- execution result
- routing decision metadata
- fallback/failure metadata

#### Ownership

- Core owns model registry, provider adapters, routing logic, and logging.
- Module 1 owns capability requests and task-level quality requirements.

#### What Module 1 expects from it

- local/open-weight default routing
- optional external providers under policy
- step-level capability selection for extraction, summarization, reasoning, and report drafting
- logged routing rationale

### Audit/logging contract

#### Purpose

Provide a reusable event taxonomy and integrity-preserving record of actions across the platform.

#### Required inputs/outputs

Inputs:

- event type
- actor
- object references
- outcome/status
- correlation ids
- structured metadata

Outputs:

- append-only or integrity-protected event records
- searchable event streams
- exportable audit bundles

#### Ownership

- Core owns the event taxonomy, sinks, integrity approach, and retention/redaction rules.
- Module 1 adds module-specific event classes and metadata within the shared taxonomy.

#### What Module 1 expects from it

- logging of workflow steps, policy decisions, tool calls, model routing, approvals, evidence mutations, exports, and user actions
- linkage to cases and runs
- forensic reconstruction support

### Module extension contract

#### Purpose

Provide the reusable way modules extend Corestack without copying core infrastructure.

#### Required inputs/outputs

Inputs:

- module manifest/descriptor
- workflow definitions
- UI extension declarations
- connector registrations
- data/schema extensions where allowed
- policy defaults where allowed

Outputs:

- module lifecycle states
- registered workflows/views/connectors
- validated compatibility with core contracts

#### Ownership

- Core owns extension points, lifecycle, compatibility checks, and security constraints.
- Module 1 owns the content it registers through those extension points.

#### What Module 1 expects from it

- ability to register Security/OSINT workflows, views, connectors, and domain schema extensions
- no requirement to ship a separate control plane or duplicate shared services

## 3. Runtime architecture

### Major runtime components

#### Desktop/control plane UI

Primary user-facing surface for:

- launcher/module entry
- alert queue or investigation start points
- run monitoring
- case and evidence review
- approvals queue
- policy visibility
- export actions

#### API layer

Core API boundary for:

- UI requests
- module registrations
- workflow/run lifecycle
- evidence/case operations
- approvals
- policy query surfaces
- export operations

#### Workflow engine/orchestrator

Executes workflow definitions using reusable step primitives:

- ingest
- tool call
- model invocation
- policy check
- human review
- approval gate
- evidence write
- export

#### Tool gateway

Policy-aware execution path for external and controlled tool access. It normalizes requests, enforces limits, applies allowlists, and emits audit events.

#### Model routing layer

Selects a model/provider for each model step based on:

- required capability
- policy
- data sensitivity
- deployment constraints

#### Policy engine

Evaluates allow/deny/approval-required decisions for:

- tools
- connectors
- models
- exports
- selected workflow transitions

#### Approvals service

Stores approval objects, manages queues and state transitions, and returns approval decisions back into workflow execution.

#### Evidence/case store

Persists structured investigative objects:

- case
- run linkage
- evidence item
- source
- entity
- relationship
- finding
- note
- timeline event
- approval linkage
- export package metadata

#### Artifact storage

Stores payload snapshots, reports, manifests, normalized source artifacts, and other large binary/text artifacts addressed by references from the evidence/case store.

#### Audit/event log

Stores structured event streams for workflow actions, tool calls, policy decisions, model routing, approvals, exports, and evidence mutations.

#### Module services

Security/OSINT-specific services may include:

- alert normalization/adapters
- enrichment adapters
- domain-specific workflow definitions
- module-specific UI views

These consume core contracts and should remain thin where possible.

#### Sandbox/gatekeeper layer

Execution boundary around tools, connectors, and any risky module service. It enforces:

- least privilege
- restricted network paths
- secret scoping
- filesystem constraints
- policy checkpoints

### High-level interaction model

1. User works through the desktop/control plane UI.
2. UI calls the core API layer.
3. API starts or continues a workflow run in the orchestrator.
4. Orchestrator evaluates policy before each controlled action.
5. Tool calls route through the tool gateway.
6. Model calls route through the model routing layer.
7. Human-gated actions route through the approvals service.
8. Structured objects persist to the evidence/case store.
9. Large artifacts persist to artifact storage.
10. Every significant action emits audit events.

## 4. Security architecture

### Trust boundaries

Core trust boundaries:

- user workstation and desktop UI
- core API/control plane runtime
- workflow/orchestration runtime
- tool gateway and external network boundary
- model execution boundary
- evidence/case data stores
- artifact storage
- external providers and external data sources

Module services operate inside the control plane trust model but should still be treated as less trusted than the core security boundary because module code can evolve faster and may integrate with external systems.

### Least-privilege assumptions

- modules do not get arbitrary network access by default
- general workflows do not directly access the internet
- connectors only get the credentials and network access needed for their function
- model providers only receive the data classes policy allows
- export paths are explicit and controlled

### Sandbox model

The reference model is:

- core orchestrator coordinates execution
- risky tool/connectors run through isolated gateway or worker paths
- external fetch/search is centralized behind the tool gateway
- future higher-risk tools can be isolated more aggressively without changing module contracts

Module 1 should assume the sandbox/gatekeeper layer exists even if MVP starts with a minimal implementation.

### Tool/network controls

- deny-by-default for external network access
- hostname/domain allowlisting for web search/fetch paths
- request size, response size, timeout, and rate limits
- connector-specific network policy where applicable
- no direct bypass of the tool gateway by module workflows

### Secret handling

- secrets live in core-managed config or secret stores
- modules reference secrets by registered connector/provider identity, not raw secret duplication
- secrets must not be written to evidence objects, artifacts, or audit logs
- approvals and policy metadata should refer to secret-backed connectors abstractly

### Policy enforcement points

Policy must be evaluated at minimum:

- before tool execution
- before connector execution
- before model routing to an external provider
- before export or external handoff
- before workflow transitions that elevate severity or broaden scope

### Approval enforcement points

Approval must be enforceable at minimum:

- before external export/handoff
- before policy override
- before external provider use when policy requires it
- before final release of an incident evidence pack
- before selected escalations or case closures

### Audit points

Audit events must exist for:

- user actions
- workflow start/step/end/failure
- tool calls
- policy decisions
- model routing decisions
- approval requests and decisions
- evidence creation/mutation
- exports and handoffs

### Evidence integrity expectations

- evidence objects carry provenance and derived-from references
- artifacts should carry content hashes where possible
- export manifests should include included artifact references and integrity metadata
- audit/event streams should be integrity-protected or compatible with a later tamper-evident scheme

## 5. Data and object flow

### Workflow 1: Alert triage and investigation

#### Input

- alert record from connector or manual intake

#### Orchestration flow

1. Intake path creates or updates a case and starts a workflow run.
2. Alert payload is normalized by module logic using the workflow/run contract.
3. Policy is checked for allowed enrichment and external lookups.
4. Allowed tool calls execute through the tool gateway and enrichment connectors.
5. Model routing layer is used for extraction and summary drafting.
6. Findings, notes, entities, and source artifacts are written to evidence/case storage.
7. Approval is requested if escalation, export, or policy-sensitive actions are needed.
8. Final disposition updates the case and run state.

#### Tools used

- alert intake connector
- `web.search`
- `web.fetch`
- enrichment connectors

#### Model use

- extraction of entities from alert context
- synthesis of triage summary
- optional reasoning/summarization for disposition support

#### Approval points

- escalation
- policy-exception lookups
- external handoff/export
- final disposition when policy requires review

#### Evidence generated

- normalized alert artifact
- source/enrichment artifacts
- entities and relationships
- findings and notes
- case timeline events

#### Outputs

- dispositioned or escalated case state
- triage summary
- linked evidence set

### Workflow 2: OSINT entity investigation

#### Input

- investigation request with seed entity and scope

#### Orchestration flow

1. API starts a module workflow run tied to a new or existing case.
2. Policy checks validate the requested collection scope.
3. Tool gateway executes allowed search/fetch requests.
4. Enrichment connectors return normalized context.
5. Model routing layer supports extraction, deduplication assistance, and summary drafting.
6. Structured sources, entities, relationships, findings, and notes persist to the evidence/case store.
7. Human review or approval occurs before final export or closure when required.

#### Tools used

- `web.search`
- `web.fetch`
- enrichment connectors

#### Model use

- extract related entities and claims
- summarize evidence-backed observations
- propose structured relationship candidates

#### Approval points

- broadened search scope
- high-risk connector use if later added
- final export or closure

#### Evidence generated

- source records
- fetched artifacts/snapshots
- entity and relationship objects
- findings with supporting links
- investigation notes and timeline events

#### Outputs

- entity profile
- findings set
- exportable investigation summary

### Workflow 3: Incident evidence pack generation

#### Input

- existing case and selected reporting/export scope

#### Orchestration flow

1. Workflow loads case, findings, artifacts, approvals, and timeline from the evidence/case store.
2. Packaging logic reads referenced artifacts from artifact storage.
3. Model routing layer may draft chronology and report sections.
4. Packaging step builds the export manifest and integrity references.
5. Approval gate reviews the report and export action.
6. Approved bundle is written to artifact storage and linked back to the case.
7. Audit/event log records release and handoff metadata.

#### Tools used

- artifact storage read/write path
- report/export tool
- optional external handoff connector

#### Model use

- chronology summarization
- report drafting
- management summary drafting

#### Approval points

- redactions where required
- final package release
- external handoff/export

#### Evidence generated

- export manifest
- report artifacts
- approval record
- export receipt and timeline events

#### Outputs

- incident evidence pack
- analyst report
- management summary

## 6. Module boundary rules

### What stays in core

- desktop/control plane shell
- core API and lifecycle management
- workflow engine and run state model
- tool execution contract and tool gateway
- policy engine
- approval object model and service
- model registry and routing
- canonical evidence/case objects
- artifact storage contract
- audit/event taxonomy and sinks
- module lifecycle and extension contract

### What belongs in Security/OSINT Module 1

- Security/OSINT workflow definitions
- domain-specific intake normalization
- domain-specific enrichment mappings
- domain-specific UI views and terminology
- Security/OSINT schema extensions that sit on top of core evidence/case objects
- module-specific report templates or export views

### What can be extended by future modules

- new workflows on the shared workflow contract
- new domain connectors using the shared tool/connector contract
- new UI views registered through module extension points
- schema extensions allowed by the evidence/case extension rules
- new policy defaults expressed through the core policy engine

### What cannot be duplicated inside modules

- separate approval systems
- separate policy engines
- separate workflow runtimes
- separate audit systems
- separate evidence/case stores for core investigative objects
- direct unmanaged internet access paths
- vendor-specific model routing hardcoded as a private module subsystem

## 7. Deployment architecture

### Deployment principles

- self-hosted-first
- open-weight-first
- pluggable providers
- local/default execution where possible

### Minimum local deployment shape

Minimum reference shape:

- desktop/control plane UI
- core API layer
- workflow engine/orchestrator
- tool gateway
- policy engine
- approvals service
- evidence/case store
- artifact storage
- audit/event log
- local model runtime
- Security/OSINT Module 1 services

In a compact deployment, several of these may be packaged together as fewer processes, but the architecture should preserve the logical boundaries.

### Optional external-provider path

Optional providers may exist for:

- external search providers behind `web.search`
- external model providers through the model routing layer
- external ticket/case handoff targets

These paths are adapters behind core contracts, not direct module dependencies.

### Where policy can restrict external use

Policy should be able to enforce:

- local-only model execution for selected workflows or data classes
- approved-domain-only external search/fetch
- export-denied or approval-required handoff
- connector-specific restrictions by deployment profile
- complete external disablement for hardened or air-gapped deployments

## 8. MVP architecture slice

### Minimum architecture needed for Module 1 MVP

Module 1 MVP needs:

- one desktop/control plane experience with module entry, runs, cases, approvals, and evidence views
- one core API surface for run, case, evidence, approval, and export operations
- one workflow engine with step support for ingest, tool, model, review, approval, and export
- one tool gateway supporting `web.fetch` and `web.search`
- one policy engine enforcing deny-by-default, allowlists, and basic approval-required decisions
- one approval service with pending/approved/denied lifecycle
- one evidence/case store with minimum canonical objects
- one artifact storage path for snapshots and reports
- one audit/event stream for workflows, tools, policies, approvals, and evidence mutations
- one local model runtime path as default
- thin Security/OSINT module services for alert intake, investigation workflows, and evidence pack generation

### Deferred from MVP

- full no-code workflow builder
- broad connector catalog
- advanced graph analytics
- sophisticated sandbox isolation for every component class
- enterprise multi-tenant boundaries
- advanced retention automation and legal hold workflows
- extensive executive dashboards
- broad remediation or response automation

## 9. Open risks and design tensions

### Local models vs capability

Open-weight local models align with the product direction, but some investigative tasks may pressure the system toward stronger external models. The routing and policy layers must keep this as a controlled exception, not the default architecture.

### Sandbox overhead

Strong isolation improves security but can increase runtime complexity and operator burden. The architecture should preserve isolation boundaries logically even if MVP uses lighter-weight deployment choices first.

### Policy complexity

A powerful policy engine can become difficult to reason about. The design should prefer a small set of explicit enforcement points and stable reason codes over early policy sprawl.

### Evidence retention burden

Evidence-rich workflows create storage, retention, and privacy pressure. The reference architecture must preserve provenance and integrity while keeping retention/redaction rules as first-class core concerns.

### Module extensibility vs strict control

Future modules need enough extension room to be useful, but the platform cannot permit private workflow runtimes, policy engines, or evidence systems inside modules. Core must remain the only place where those contracts are implemented.

## Alignment

This document is intended to concretize and align:

- [ISSUES_ORDER.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/ISSUES_ORDER.md)
- [SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/SECURITY_OSINT_MODULE_1.md)

It should guide the architecture work behind:

- Corestack control plane architecture
- workflow engine and orchestration
- model management and routing
- approvals and HITL
- evidence/case object model
- sandbox/gatekeeper model
- security audit, forensics, and evidence trails
