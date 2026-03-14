# REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md

## 1. Architecture intent

Corestack is one desktop/control plane product. The control plane owns the shared runtime, major product surfaces, workflow execution, policy enforcement, approvals, evidence handling, model routing, auditability, and module lifecycle.

Security/OSINT Module 1 is the first domain module. It consumes reusable platform contracts and validates that those contracts are sufficient for investigation-oriented work.

Module 1 must not introduce one-off vertical infrastructure unless there is an explicit architectural justification. If a Module 1 need cannot be served by an existing contract, the default response is to refine the corresponding core contract rather than create a private subsystem.

If runtime packs are mentioned, they should be treated as packaging or deployment details, not as product identity. The product remains Corestack, and Security/OSINT remains a module within the single control plane.

## 1A. Implemented foundation status

Current implementation now covers the first operational foundation slice of this architecture:

- persistent control-plane shell + navigation skeleton with Home and Launcher entry surfaces
- minimum workflow/run contract with case linkage and governed execution pathing
- real policy decision contract for governed actions, including approval-required decisions
- implemented `web.fetch` and `web.search` governed tool schemas
- implemented approval object/state machine with workflow checkpoints and reviewer queue/detail UX surfaces
- implemented core-owned Policies governance workspace that projects real policy/approval/model/audit signals without introducing policy-authoring controls
- implemented evidence/artifact/finding minimum objects and linkage to runs/cases
- implemented structured, correlated audit/event scaffolding for run/tool/policy/approval/model/evidence activity
- implemented model registry + local-first routing contract with external-provider restriction hooks
- Security/OSINT Module 1 registered through the core module contract
- first end-to-end Alert Triage and Investigation workflow implemented on top of these contracts

This document remains the canonical architecture description and target boundaries. `IMPLEMENTATION_STATUS.md` tracks issue-by-issue execution state.

## 1B. MVP threat model notes (current supported slice)

### Trust boundaries that currently matter

- **Operator/UI boundary**: user-triggered workflow actions enter core contracts through the control-plane shell.
- **Control plane ↔ tool gateway boundary**: external fetch/search is only supported via governed gateway endpoints, not direct module egress.
- **Tool gateway ↔ n8n/provider boundary**: upstream execution is treated as untrusted; responses are normalized before use.
- **Model routing boundary**: local-first model execution is the default; policy restrictions can block disallowed external-provider routes.
- **Storage/audit boundary**: run/case/evidence state and structured events provide reconstruction context for review.

### Current risk posture and assumptions

- Fail-closed outcomes are required for malformed requests, disallowed hostnames, payload/timeout limit breaches, and blocked provider routes.
- Audit/security events are treated as required operational evidence for reviewing governed actions and denials.
- URL fields emitted by gateway audit events are redaction-safe for query/fragment components in the current slice.
- Shared-secret protection for gateway↔n8n requests is the minimum supported integrity check; stronger deployment controls remain environment responsibilities.

### Non-goals / open risks outside this slice

- Not a complete STRIDE-level threat model for every future module/provider/connector permutation.
- Not full tamper-evident logging, cross-system attestation, or enterprise key management guidance.
- Not broad multi-tenant hard isolation documentation for unimplemented enterprise modes.

## 2. Platform contracts exercised by Module 1

### Workflow/run contract

#### Purpose

Provide the reusable execution model for workflows, runs, step state, retries, resumability, and linkage to evidence, approvals, and cases.

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
- step records
- state transitions
- linked artifacts/evidence references
- approval requests
- final outputs and terminal state

#### Who owns it

- Core owns the contract, state model, step semantics, execution lifecycle, and storage conventions.
- Module 1 owns workflow definitions and module-specific interpretation of outputs.

#### What Module 1 expects from it

- explicit support for ingest, tool, model, review, approval, evidence, and export steps
- resumable runs
- blocked/failure visibility
- run-to-case and run-to-evidence linkage

### Tool execution contract

#### Purpose

Provide a governed, normalized path for tool and connector invocation.

#### Required inputs/outputs

Inputs:

- tool or connector id
- requester identity
- purpose
- run/workflow context
- typed request payload

Outputs:

- normalized response envelope
- execution metadata
- policy decision metadata
- correlation id
- normalized error shape

#### Who owns it

- Core owns schemas, transport, normalization, routing, and enforcement hooks.
- Module 1 owns which tools or connectors it requests and how their results feed module workflows.

#### What Module 1 expects from it

- stable `web.fetch` and `web.search` access
- connector-backed enrichment and export paths
- correlation to runs, cases, and evidence objects
- deny-by-default enforcement when policy does not permit execution

### Policy/gating contract

#### Purpose

Provide reusable allow, deny, and approval-required decisions for governed actions.

#### Required inputs/outputs

Inputs:

- requested action
- requester and role context
- module/workflow/step context
- target resource
- data sensitivity or classification if known
- deployment policy scope

Outputs:

- allow or deny decision
- reason codes
- required limits or obligations
- approval-required flag when applicable

#### Who owns it

- Core owns policy definition, evaluation, logging, and enforcement points.
- Module 1 may supply metadata that policy evaluation uses, but it does not own the policy engine.

#### What Module 1 expects from it

- default-deny behavior for external collection
- step-level restrictions for tool, connector, model, and export actions
- predictable policy outcomes that workflows can surface to users

### Approval/HITL contract

#### Purpose

Provide reusable approval objects, state transitions, escalation paths, overrides, and review flows.

#### Required inputs/outputs

Inputs:

- approval subject/action
- requester
- rationale
- scope
- linked case/run/policy references
- expiration or escalation metadata

Outputs:

- approval id
- state transitions
- approver identity
- decision rationale
- escalation or override records

#### Who owns it

- Core owns approval schema, queueing, state machine, escalation semantics, and auditability.
- Module 1 owns when workflows request approval and what context is attached to those requests.

#### What Module 1 expects from it

- ability to gate export, escalation, scope exception, and selected dispositions
- enough context on approval objects for investigator and reviewer decisions

### Evidence/case contract

#### Purpose

Provide canonical investigative objects and linkages for cases, evidence, artifacts, findings, notes, entities, relationships, and export metadata.

#### Required inputs/outputs

Inputs:

- object type
- provenance metadata
- actor/workflow context
- parent or derived-from references
- review state

Outputs:

- stable object ids
- linked object references
- case timeline updates
- exportable evidence references
- lifecycle and retention metadata

#### Who owns it

- Core owns canonical object definitions, provenance rules, linkage semantics, and lifecycle hooks.
- Module 1 owns domain-specific fields or extensions permitted by the contract.

#### What Module 1 expects from it

- first-class support for case, evidence item, artifact, source, finding, note, entity, relationship, and export package
- provenance and chain-of-custody support
- direct linkage from workflow outputs to evidence and cases

### Model routing contract

#### Purpose

Provide reusable selection and invocation of local or optional external model providers under policy control.

#### Required inputs/outputs

Inputs:

- requested capability
- module/workflow/step context
- data sensitivity context
- routing constraints
- prompt or task payload

Outputs:

- selected provider/model
- execution result
- routing metadata
- failure or fallback metadata

#### Who owns it

- Core owns model registry, provider adapters, routing logic, and routing logs.
- Module 1 owns capability requests and module-specific quality needs.

#### What Module 1 expects from it

- local/open-weight default path
- optional external path under policy
- step-level capability selection for extraction, reasoning support, and summarization
- auditable routing decisions

### Audit/logging contract

#### Purpose

Provide reusable structured event capture for review, investigation reconstruction, and operations.

This contract follows the platform-wide model defined in `AUDIT_EVENT_MODEL.md`.

#### Required inputs/outputs

Inputs:

- event type
- actor
- object references
- outcome/status
- correlation ids
- structured metadata

Outputs:

- append-only or integrity-compatible event records
- searchable event streams
- exportable audit references or bundles

#### Who owns it

- Core owns event taxonomy, persistence model, correlation strategy, integrity approach, and retention/redaction rules.
- Module 1 contributes module-specific event classes and metadata inside the shared taxonomy.

#### What Module 1 expects from it

- workflow, tool, connector, policy, model, approval, evidence, and export events
- searchable correlation across runs and cases
- sufficient detail for security review and forensic reconstruction

### Module extension contract

#### Purpose

Provide the reusable mechanism for modules to add workflows, views, connectors, and schema extensions without duplicating core infrastructure.

#### Required inputs/outputs

Inputs:

- module manifest or descriptor
- workflow registrations
- view registrations
- connector registrations
- schema extensions where allowed
- module defaults where allowed

Outputs:

- module lifecycle states
- registered workflows/views/connectors
- validated compatibility with core contracts

#### Who owns it

- Core owns lifecycle, extension points, compatibility validation, and restrictions on what modules may override.
- Module 1 owns the content it registers through those extension points.

#### What Module 1 expects from it

- ability to register Security/OSINT workflows, views, and connector usage
- no need to provide a private shell, workflow runtime, policy engine, or approval system

## 3. Runtime architecture

### Desktop/control plane UI

The desktop/control plane UI is the primary user-facing surface for Corestack. It presents the shared product shell and hosts module-aware experiences without creating separate product shells.

### Home and launcher entry surfaces

Home and Launcher are entry surfaces inside the control plane. They should provide starting points into module workflows, assigned work, recent runs, priority cases, and pending approvals.

These surfaces are core-owned but module-aware.

### API layer

The API layer provides the shared application boundary for:

- UI requests
- module registrations
- workflow and run lifecycle operations
- evidence/case operations
- approvals
- policy and model metadata surfaces
- export actions

### Workflow engine/orchestrator

The workflow engine executes workflow definitions using reusable step primitives and state transitions. It coordinates tool calls, model use, approvals, policy checks, evidence writes, and export paths.

### Tool gateway

The tool gateway is the governed path for controlled external access and normalized tool execution. It enforces schemas, allowlists, limits, and audit hooks for `web.fetch`, `web.search`, and future governed tool classes.

### Model routing layer

The model routing layer selects a model/provider for each model step based on capability, policy, sensitivity, and hosting constraints.

### Policy engine

The policy engine evaluates whether tools, connectors, models, exports, and selected workflow transitions are allowed, denied, or approval-gated.

### Approvals service

The approvals service stores approval objects, manages their states, handles escalation and override semantics, and returns approval outcomes to workflow execution.

### Evidence/case store

The evidence/case store persists structured investigative objects and linkages:

- case
- evidence item
- artifact references
- findings
- notes
- entities
- relationships
- timeline events
- approval linkage
- export package metadata

### Artifact storage

Artifact storage stores large payloads, fetched snapshots, normalized artifacts, reports, manifests, and other file-like outputs referenced by the evidence/case store.

### Audit/event log

The audit/event log stores structured events for user actions, workflow execution, tool calls, policy decisions, model routing, approval actions, evidence mutations, and exports.

Event taxonomy and correlation rules are canonicalized in `AUDIT_EVENT_MODEL.md`.

### Module services

Module services are Security/OSINT-specific service logic, including:

- alert intake normalization
- domain-specific workflow definitions
- enrichment orchestration specific to Module 1
- module-specific UI panels or summaries

These remain thin and should consume core contracts instead of replacing them.

### Sandbox/gatekeeper layer

The sandbox/gatekeeper layer provides isolated or policy-restricted execution boundaries around risky tool and connector actions. It protects network paths, secret use, and execution scope.

### High-level interaction model

1. A user enters through Home, Launcher, or a linked control plane surface.
2. The UI calls the core API.
3. The API starts or continues a workflow run in the orchestrator.
4. The orchestrator evaluates policy before governed actions.
5. Tool and connector actions route through the tool gateway or governed execution path.
6. Model steps route through the model routing layer.
7. Approval-gated actions route through the approvals service.
8. Structured outputs write to the evidence/case store.
9. File-like outputs write to artifact storage.
10. Significant actions emit audit events.

## 4. Security architecture

### Trust boundaries

Core trust boundaries include:

- user workstation and desktop UI
- core API and control plane runtime
- workflow execution runtime
- tool gateway and external network boundary
- model execution boundary
- evidence/case storage
- artifact storage
- audit/event storage
- external providers and external data sources

Module services operate within the control plane runtime but are not independent security authorities. They must remain subject to core-owned policy, approval, audit, and execution boundaries.

### Least-privilege assumptions

- modules do not receive arbitrary network access by default
- workflows do not bypass governed tool or connector paths
- connectors receive only the credentials and access needed for their task
- external model providers receive only data policy allows
- export actions are explicit and controlled

### Sandbox model

The reference model is:

- the orchestrator coordinates execution
- risky tool and connector actions execute through a gatekept boundary
- external web/OSINT collection is centralized through the tool gateway
- stronger isolation can be added later without changing module contracts

### Tool/network controls

- external collection is deny-by-default until explicitly allowed
- hostname/domain allowlisting is enforced for fetch/search
- size, timeout, and rate limits are enforced
- module workflows may not create unmanaged direct network paths
- connector execution remains policy-restricted

### Secret handling

- secrets are core-managed
- modules reference connector or provider identities rather than duplicating raw secrets
- secrets must not be written to evidence, artifacts, logs, or approval history
- secret access is scoped to the connector or provider execution boundary

### Policy enforcement points

Policy must be enforced at minimum:

- before tool execution
- before connector execution
- before external model routing
- before export or external handoff
- before selected scope expansions or escalation transitions

### Approval enforcement points

Approval must be enforceable at minimum:

- before external export or handoff
- before policy override or scope exception
- before selected incident escalations
- before final release of incident evidence packs
- before selected final dispositions where policy requires review

### Audit points

Audit events must exist for:

- user actions
- workflow start, step, failure, and completion
- tool and connector actions
- policy decisions
- model routing decisions
- approval requests and decisions
- evidence mutations
- exports and handoffs

### Evidence integrity expectations

- evidence-bearing objects must preserve provenance
- artifacts should include integrity metadata where available
- export manifests should include evidence references and integrity references for included artifacts
- audit/event storage should be integrity-compatible with later tamper-evident improvements

## 5. Data and object flow

### Workflow 1: Alert triage and investigation

#### Input

- alert record from connector or manual intake

#### Orchestration flow

1. Home, Launcher, or intake path creates a run and creates or attaches a case.
2. Workflow engine normalizes the alert and extracts candidate entities.
3. Policy is evaluated for enrichment and external lookups.
4. Allowed tool and connector actions execute through the tool gateway/governed path.
5. Model routing supports extraction and triage summary drafting.
6. Findings, notes, artifacts, and timeline entries are written to evidence/case storage.
7. Approvals service handles escalation, disposition, or export gates if required.
8. Final case and run state is written and audit events are emitted.

#### Tools used

- alert intake connector
- `web.search`
- `web.fetch`
- enrichment connectors

#### Model use

- entity extraction
- triage summary drafting
- optional reasoning support under policy

#### Approval points

- escalation
- connector scope exception
- final disposition where policy requires review
- export or handoff

#### Evidence generated

- alert snapshot
- normalized alert artifact
- enrichment artifacts
- findings
- notes
- timeline entries

#### Outputs

- triage summary
- recommended disposition
- updated case state

### Workflow 2: OSINT entity investigation

#### Input

- manual request or pivot with seed entity and scope

#### Orchestration flow

1. User enters from Home, Launcher, or an existing case pivot.
2. API starts a run and creates or attaches a case.
3. Policy validates requested search and collection scope.
4. Allowed search/fetch/enrichment actions run through governed execution paths.
5. Model routing supports extraction, clustering assistance, relationship suggestion, and summary drafting.
6. Structured sources, entities, relationships, findings, notes, and timeline entries are persisted.
7. Approvals service handles broadened scope, export, or closure gates where required.

#### Tools used

- `web.search`
- `web.fetch`
- enrichment connectors

#### Model use

- source and entity extraction
- relationship suggestion
- evidence-backed summary drafting

#### Approval points

- broadened search scope
- later-added higher-risk collection categories
- export or closure where policy requires it

#### Evidence generated

- source records
- fetched artifacts
- entity records
- relationship records
- findings
- notes
- timeline entries

#### Outputs

- entity profile
- structured findings
- exportable investigation summary where requested

### Workflow 3: Incident evidence pack generation

#### Input

- existing case, export scope, and output target

#### Orchestration flow

1. User starts from a case, approval context, or completed run.
2. Workflow loads case, findings, artifacts, evidence, approvals, and timeline from the evidence/case store.
3. Artifact storage provides referenced payloads and report inputs.
4. Model routing supports chronology summarization and report drafting.
5. Packaging logic assembles the manifest and output artifacts.
6. Approvals service handles release, redaction, and handoff gating.
7. Approved outputs are written to artifact storage and linked back to the case.
8. Audit events record release and handoff results.

#### Tools used

- artifact storage read/write
- report/export tool
- optional external handoff connector

#### Model use

- chronology summarization
- report drafting
- management summary drafting

#### Approval points

- final report approval
- redaction approval where required
- export or handoff approval

#### Evidence generated

- manifest
- report artifacts
- approval linkage
- export receipt or handoff record

#### Outputs

- evidence pack manifest
- analyst report
- management summary
- export bundle reference

## 6. Module boundary rules

### What stays in core

- desktop/control plane shell
- Home and Launcher entry surfaces
- API layer
- workflow engine and run state model
- tool execution contract and tool gateway
- policy engine
- approvals service and approval contract
- model registry and routing
- canonical evidence/case objects
- artifact storage contract
- audit/event taxonomy and storage
- module lifecycle and extension contract

### What belongs in Security/OSINT Module 1

- Security/OSINT workflow definitions
- alert normalization logic specific to the module
- domain-specific enrichment sequencing
- module-specific views, summaries, and domain object facets
- module-specific usage of core connectors and tools

### What can be extended by future modules

- additional workflows registered through the workflow contract
- additional module-aware views through extension points
- additional connector usage patterns through governed contracts
- additional schema extensions where allowed by core object rules

### What cannot be duplicated inside modules

- separate workflow runtimes
- separate policy engines
- separate approval systems
- separate evidence/case stores for core investigative objects
- separate audit systems
- unmanaged internet access paths
- vendor-specific model routing subsystems that bypass core routing

## 7. Deployment architecture

### Alignment principles

- self-hosted-first
- open-weight-first
- pluggable providers
- local/default execution where possible

### Minimum local deployment shape

Minimum reference shape:

- desktop/control plane UI
- home and launcher entry surfaces within the shell
- core API layer
- workflow engine/orchestrator
- tool gateway
- policy engine
- approvals service
- evidence/case store
- artifact storage
- audit/event log
- local model runtime
- Module 1 services

These components may be colocated in practice, but their logical roles and trust boundaries should remain distinct.

### Optional external-provider path

Optional external paths may exist for:

- external search providers behind `web.search`
- external model providers via the model routing layer
- external export or ticket/case handoff targets

These are optional adapters behind core-owned contracts and not part of product identity.

### Where policy can restrict external use

Policy must be able to:

- force local-only model execution
- restrict or disable external search/fetch
- require approval for export or handoff
- restrict connectors by deployment profile
- fully disable external providers for hardened or air-gapped deployments

## 8. MVP architecture slice

### Minimum architecture needed for Module 1 MVP

Module 1 MVP requires:

- one desktop/control plane shell
- Home and Launcher entry surfaces
- one core API layer
- one workflow engine with the required step types for Module 1
- one tool gateway supporting `web.fetch` and `web.search`
- one policy engine with allow/deny and approval-required decisions
- one approvals service with core state transitions
- one evidence/case store with minimum canonical objects
- one artifact storage path
- one audit/event stream for critical actions
- one local/open-weight model path
- thin Module 1 services for alert triage, OSINT investigation, and evidence pack generation

### Deferred from MVP

- full no-code workflow builder
- broad connector ecosystem
- advanced graph visualization
- stronger isolation for every component type
- enterprise tenancy implementation
- advanced backup/restore automation
- extensive dashboards
- autonomous remediation

## 9. Open risks and design tensions

### Local models vs capability

Open-weight local models match product direction, but some investigative tasks may pressure the architecture toward stronger external providers. The routing and policy model must keep this controlled and auditable.

### Sandbox overhead

Stronger isolation improves security but increases operational complexity. The architecture should preserve the boundary now even if MVP uses lighter-weight deployment choices.

### Policy complexity

A rich policy engine can become difficult to reason about. The design should prefer a small set of clear enforcement points and stable reason codes over early policy sprawl.

### Evidence retention burden

Evidence-rich workflows increase storage and retention pressure. The architecture must keep provenance and audit value without treating indefinite retention as the default.

### Module extensibility vs strict control

Modules must have enough room to be useful, but core must remain the sole owner of workflow, policy, approval, evidence, audit, and shell behavior. That tension will need active boundary discipline.

## Alignment

This document is intended to align:

- [ISSUES_ORDER.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/ISSUES_ORDER.md)
- [docs/roadmap/CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md)
- [SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/SECURITY_OSINT_MODULE_1.md)

It should guide the architecture work for:

- the single Corestack desktop/control plane
- Module 1 runtime and contract validation
- workflow engine and orchestration
- policy, approval, and audit architecture
- evidence/case and artifact architecture


## Integration validation harness alignment (Issue #22 MVP thin slice)

Architecture validation now includes a narrow end-to-end harness that exercises the supported tool gateway allow/deny/error paths and verifies Security/OSINT Module 1 workflow compatibility with those hardened contracts. This is an MVP validation slice, not a generic cross-module platform test framework.

## MVP architecture note: Unified Investigation Workspace composition (Issue #20)

The investigation workspace is a composition layer in the existing control-plane shell:
- Input scope: selected `caseId` and linked existing objects.
- Data sources: case store, run store, evidence store, approval store, audit event store.
- No new persistence model introduced.
- No module-owned shell introduced.

Projection contract used by the workspace:
- case header from case object
- linked run summary from existing run linkage
- findings/artifacts/evidence rollups from existing evidence contracts
- audit/security panel from existing linked audit queries
- approval/review block from existing approval linkage


## Investigation drill-in/navigation polish architecture note (thin slice)

Implemented now:
- Reused existing core route surfaces (`investigation-workspace`, `runs`, `cases-evidence`, `files-artifacts`, `logs-audit`, `approvals`) as composable drill-in targets.
- Reused existing correlation contracts (`run_id`, `case_id`, `artifact_id`, `evidence_id`, `finding_id`) for filtered audit projection in Logs/Audit.

Partially implemented:
- Logs/Audit remains a thin correlated-event projection surface, not a full SIEM/timeline system.

Planned/deferred:
- Advanced cross-case correlation graphs, timeline exploration, and report/export packaging architecture.


## Nav surface completion note (thin slice)

- The control-plane left navigation now resolves all current routes to intentional surfaces without introducing separate module-owned shells.
- Core operational surfaces (Runs, Approvals, Cases / Evidence, Investigation Workspace, Files / Artifacts, Logs / Audit) remain the primary implemented operator workflow path.
- Adjacent surfaces (Agents, Policies, Models, Connectors, Settings, Admin / Tenancy) are intentionally thin but explicit about ownership, implemented contracts, and deferred capabilities.


## Connectors surface mapping note (MVP thin slice)

- Connectors is a core-owned shell surface that now projects controlled integration boundary status (implemented vs deferred) from existing gateway/policy/audit/module contracts.
- This is intentionally not a connector lifecycle management subsystem; no new backend connector object model was added in this slice.


## Agents surface mapping note (MVP thin slice)

- Agents is a core-owned control-plane surface that now projects orchestration/readiness posture from existing contracts (runs/workflows, model governance hooks, tool gateway governance, policy/approval boundaries, audit correlation).
- Module 1 contributes agent-relevant behavior through workflow contracts and module metadata, not through a module-owned agent shell.
- No new backend orchestration object model was introduced in this slice.
