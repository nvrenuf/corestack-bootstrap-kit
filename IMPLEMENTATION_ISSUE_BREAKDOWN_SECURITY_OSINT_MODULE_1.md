# IMPLEMENTATION_ISSUE_BREAKDOWN_SECURITY_OSINT_MODULE_1.md

## 1. Implementation principles

- Corestack is one desktop/control plane.
- Modules are domain capabilities that consume shared core contracts.
- Security/OSINT is Module 1.
- The implementation path is self-hosted-first.
- Model execution is open-weight-first, pluggable, and policy-governed.
- Security controls are hardened-by-design, not retrofitted later.
- Packs are runtime or deployment details, not product identity.
- The implementation path should prefer thin vertical slices that validate core contracts under real workflow pressure.
- Core-owned infrastructure should be built only to the depth required to unblock the next working slice.

## 2. Recommended implementation epics

### Epic 1: Control plane shell and navigation foundation

#### Purpose

Establish the single Corestack desktop/control plane shell and the minimum shared surfaces needed to host Module 1 workflows.

#### Why it exists

Without a real shell and navigation model, module work will drift into separate-product behavior and UX fragmentation.

#### Dependencies

- none

#### What it delivers

- persistent control plane shell
- Home and Launcher entry surfaces
- base navigation for Runs, Approvals, Cases / Evidence, Files / Artifacts, Logs / Audit, Policies, Models, Connectors, Modules, Settings, and Admin
- module-aware routing model

### Epic 2: Core workflow, run, and case skeleton

#### Purpose

Create the minimum executable run and case model needed to support the first Module 1 workflow.

#### Why it exists

Module 1 must validate shared run and case contracts early. Building connectors or model routing first without run/case semantics would create rework.

#### Dependencies

- Epic 1

#### What it delivers

- workflow/run object model
- case object model
- run-to-case linkage
- basic run state transitions
- timeline/event attachment points

### Epic 3: Policy-gated tool execution foundation

#### Purpose

Provide the minimum governed external access path for Module 1 through `web.fetch` and `web.search`.

#### Why it exists

Security/OSINT cannot be implemented safely if tool access is ad hoc or module-owned.

#### Dependencies

- Epic 2

#### What it delivers

- tool execution contract
- policy evaluation for tool use
- `web.fetch` and `web.search` schema validation
- controlled execution path with audit events

### Epic 4: Evidence, artifact, and audit backbone

#### Purpose

Provide the minimum evidence-bearing object model and artifact/audit support needed to preserve investigation outputs.

#### Why it exists

Module 1 is not credible without evidence capture, provenance, and reconstructable actions.

#### Dependencies

- Epic 2
- Epic 3

#### What it delivers

- evidence item, finding, artifact, and note support
- basic provenance fields
- artifact storage references
- structured audit/event records

### Epic 5: Approvals and HITL flow

#### Purpose

Provide approval objects, queues, and workflow gates for human review.

#### Why it exists

Module 1 requires approval-gated escalation, export, and exception handling. This cannot be deferred without breaking the platform direction.

#### Dependencies

- Epic 2
- Epic 4

#### What it delivers

- approval object model
- approval queue and detail surfaces
- workflow approval checkpoints
- approval audit trail

### Epic 6: Model routing baseline

#### Purpose

Provide the minimum local-first model selection and invocation path used by Module 1 workflows.

#### Why it exists

The workflow must prove that model use is routed by core contracts and policy rather than hardcoded inside the module.

#### Dependencies

- Epic 2
- Epic 3

#### What it delivers

- local/open-weight model registration
- step-level capability routing
- model execution logging
- policy-enforced provider restrictions

### Epic 7: Security/OSINT Module 1 workflow slice

#### Purpose

Implement the first working Security/OSINT workflow end to end.

#### Why it exists

The platform direction is only validated when a real module workflow runs through shell, run, policy, tools, evidence, model, and approval paths.

#### Dependencies

- Epic 1
- Epic 2
- Epic 3
- Epic 4
- Epic 5
- Epic 6

#### What it delivers

- Module 1 registration
- first workflow launch path
- alert-driven workflow execution
- evidence-linked case outcome

### Epic 8: MVP operator review surfaces

#### Purpose

Deliver the smallest coherent operator-facing review experience around runs, cases, approvals, and artifacts.

#### Why it exists

Platform contracts are not sufficiently validated until an operator can review, approve, and trace the outputs in the UI.

#### Dependencies

- Epic 1
- Epic 2
- Epic 4
- Epic 5
- Epic 7

#### What it delivers

- run detail
- case detail
- approval detail
- artifact/evidence detail
- audit lookup for linked actions

## 3. Implementation issue breakdown

### Epic 1: Control plane shell and navigation foundation

#### Issue 1.1: Implement the persistent Corestack shell and navigation skeleton [x] (main: `8cd6592`, PR #28)

##### Purpose

Create the single desktop/control plane shell and top-level information architecture.

##### Scope

- shell layout
- top-level navigation
- route placeholders for required surfaces
- module-aware navigation hooks

##### Dependencies

- none

##### Acceptance criteria

- users can navigate within one shell to all required top-level surfaces
- Home and Launcher are present as entry surfaces
- the shell makes no distinction suggesting modules are separate products

##### Ownership

- core-owned

##### Status

- complete

#### Issue 1.2: Implement Home and Launcher as core-owned entry surfaces [x] (main: `1a2b085`, PR #28)

##### Purpose

Provide the first operator entry points into Corestack work and Module 1 workflows.

##### Scope

- Home overview skeleton
- Launcher workflow/module entry surface
- recent/assigned work hooks

##### Dependencies

- Issue 1.1

##### Acceptance criteria

- Home can display active work, approvals, and recent activity placeholders
- Launcher can expose Module 1 workflow entry points
- both surfaces operate within the core-owned shell

##### Ownership

- core-owned

##### Status

- complete

### Epic 2: Core workflow, run, and case skeleton

#### Issue 2.1: Define and implement the minimum run and workflow execution contract [x] (main: `1c87d62`, PR #28)

##### Purpose

Establish the shared run model required by Module 1 workflows.

##### Scope

- run object
- workflow registration shape
- run states
- step execution records
- resumable/blocking semantics

##### Dependencies

- Issue 1.1

##### Acceptance criteria

- a workflow can be registered and launched as a run
- runs expose explicit states and step records
- runs can link to later evidence, approvals, and case objects

##### Ownership

- core-owned

##### Status

- complete

#### Issue 2.2: Define and implement the minimum case object and run-to-case linkage [x] (main: `821abc0`, PR #28)

##### Purpose

Create the base investigation container required for Module 1.

##### Scope

- case object
- case status and ownership fields
- run-to-case linkage
- case timeline hooks

##### Dependencies

- Issue 2.1

##### Acceptance criteria

- a run can create a case or attach to an existing one
- case status and timeline are persisted
- case identity is visible from linked run state

##### Ownership

- core-owned

##### Status

- complete

### Epic 3: Policy-gated tool execution foundation

#### Issue 3.1: Define the policy decision contract for governed actions [x] (main: `0a8d76a`, PR #28)

##### Purpose

Create the minimum allow/deny/approval-required contract used by tools, models, and exports.

##### Scope

- policy decision input shape
- allow/deny/approval-required outputs
- reason codes
- limit fields

##### Dependencies

- Issue 2.1

##### Acceptance criteria

- governed actions can request a policy decision
- decisions return stable effect and reason metadata
- the contract is reusable beyond tools

##### Ownership

- core-owned

##### Status

- complete

#### Issue 3.2: Implement the `web.fetch` and `web.search` tool contracts and schemas [x] (main: `2046ecd`, PR #28)

##### Purpose

Provide the first governed tool classes used by Module 1.

##### Scope

- tool request and response schemas
- normalized error shape
- correlation metadata

##### Dependencies

- Issue 3.1

##### Acceptance criteria

- `web.fetch` and `web.search` requests validate against shared schemas
- normalized responses include execution metadata
- invalid requests are rejected consistently

##### Ownership

- core-owned

##### Status

- complete

#### Issue 3.3: Implement a minimal tool gateway with policy enforcement and audit hooks [~] (main: `31c49b4`, PR #29; scaffolding landed)

##### Purpose

Route governed tool execution through a single controlled path.

##### Scope

- tool gateway service path
- policy enforcement before execution
- request limits and allowlist checks
- audit emission on allow/deny/failure

##### Dependencies

- Issue 3.1
- Issue 3.2

##### Acceptance criteria

- `web.fetch` and `web.search` only execute through the gateway
- denied actions are visible with reason codes
- allowed executions emit correlation-ready events

##### Ownership

- core-owned

##### Status

- in progress (scaffolding landed; full enforcement and hardening pending)

### Epic 4: Evidence, artifact, and audit backbone

#### Issue 4.1: Define the minimum evidence, artifact, and finding objects

##### Purpose

Create the smallest evidence-bearing object set needed for Module 1.

##### Scope

- evidence item
- artifact reference
- finding
- note
- provenance fields

##### Dependencies

- Issue 2.2

##### Acceptance criteria

- evidence-bearing objects can be created and linked to a case
- provenance fields exist on relevant objects
- findings can reference supporting evidence

##### Ownership

- core-owned

##### Status target

- MVP

#### Issue 4.2: Implement artifact storage linkage and metadata persistence

##### Purpose

Support file-like outputs such as fetched content, normalized payloads, and reports.

##### Scope

- artifact reference model
- storage linkage
- content hash support where available
- run/case/evidence linkage

##### Dependencies

- Issue 4.1

##### Acceptance criteria

- artifacts can be stored and referenced from cases and evidence
- artifact metadata persists with provenance and integrity fields where available

##### Ownership

- core-owned

##### Status target

- MVP

#### Issue 4.3: Implement structured audit/event logging for runs, tools, evidence, and approvals

##### Purpose

Provide reconstructable action history for the initial MVP slice.

##### Scope

- event taxonomy for workflow, tool, policy, evidence, and approval actions
- correlation ids
- persistence for event records

##### Dependencies

- Issue 2.1
- Issue 3.3
- Issue 4.1

##### Acceptance criteria

- critical actions emit structured events
- events can be correlated to runs and cases
- audit records can be surfaced later in the UI

##### Ownership

- core-owned

##### Status target

- MVP

### Epic 5: Approvals and HITL flow

#### Issue 5.1: Define and implement the approval object model and state machine

##### Purpose

Provide the shared approval contract required for Module 1.

##### Scope

- approval object
- states
- linkage to case/run/policy
- rationale and scope fields

##### Dependencies

- Issue 2.1
- Issue 2.2

##### Acceptance criteria

- approval requests can be created, updated, and resolved
- approval states include pending, approved, denied, changes requested, escalated, expired, and overridden
- approvals link to relevant work objects

##### Ownership

- core-owned

##### Status target

- MVP

#### Issue 5.2: Add workflow approval checkpoints and approval queue/detail surfaces

##### Purpose

Make approvals actionable in the operator experience.

##### Scope

- approval checkpoint handling in runs
- approvals queue view
- approval detail view
- audit linkage from approval detail

##### Dependencies

- Issue 5.1
- Issue 4.3
- Issue 1.1

##### Acceptance criteria

- a workflow can pause on an approval checkpoint
- approvers can approve, deny, request changes, or escalate
- approval outcomes resume or terminate the gated path appropriately

##### Ownership

- core-owned

##### Status target

- MVP

### Epic 6: Model routing baseline

#### Issue 6.1: Define and implement the model registry and local-first routing contract

##### Purpose

Create the minimum shared model path for Module 1 workflow steps.

##### Scope

- model registry
- capability tags
- local/open-weight default routing
- policy-aware provider selection

##### Dependencies

- Issue 3.1
- Issue 2.1

##### Acceptance criteria

- workflows can request model capabilities instead of vendor-specific calls
- at least one local/open-weight model path is available
- routing decisions are explicit and inspectable

##### Ownership

- core-owned

##### Status target

- MVP

#### Issue 6.2: Add model execution logging and external-provider restriction hooks

##### Purpose

Ensure model use is auditable and policy-governed from the first slice.

##### Scope

- model execution event logging
- provider restriction enforcement hooks
- fallback/error handling metadata

##### Dependencies

- Issue 6.1
- Issue 4.3

##### Acceptance criteria

- model invocations emit structured audit events
- provider restrictions can block disallowed external routing
- failure and fallback behavior is recorded

##### Ownership

- core-owned

##### Status target

- MVP

### Epic 7: Security/OSINT Module 1 workflow slice

#### Issue 7.1: Register Security/OSINT Module 1 through the core module contract

##### Purpose

Validate that Module 1 is a domain extension rather than a private subsystem.

##### Scope

- module registration
- workflow registration
- module-aware navigation exposure

##### Dependencies

- Issue 1.1
- Issue 2.1

##### Acceptance criteria

- Security/OSINT appears as a module in the control plane
- Module 1 contributes workflows through core extension points
- no module-specific shell or separate runtime is introduced

##### Ownership

- module-owned content on a core-owned contract

##### Status target

- MVP

#### Issue 7.2: Implement the first end-to-end Module 1 workflow: Alert triage and investigation

##### Purpose

Deliver the narrowest real workflow that proves the platform direction.

##### Scope

- alert-triggered or manual intake path
- run creation
- case linkage
- governed `web.fetch` or `web.search` usage where applicable
- model-assisted extraction/summary
- evidence and finding creation
- approval checkpoint

##### Dependencies

- Issue 2.2
- Issue 3.3
- Issue 4.3
- Issue 5.2
- Issue 6.2
- Issue 7.1

##### Acceptance criteria

- an operator can launch the workflow from the control plane
- the workflow creates a run and case
- governed tool usage is policy-checked and logged
- model usage is routed through the core routing path
- evidence and findings are attached to the case
- at least one approval-gated action can be exercised end to end

##### Ownership

- module-owned workflow on core-owned contracts

##### Status target

- MVP

#### Issue 7.3: Add the OSINT entity investigation workflow

##### Purpose

Extend Module 1 beyond alert-driven work to direct investigation use cases.

##### Scope

- manual entity investigation start path
- scope validation
- governed search/fetch path
- source/entity/finding creation

##### Dependencies

- Issue 7.2

##### Acceptance criteria

- users can launch an entity investigation from Launcher or case context
- results preserve provenance and link to cases/evidence
- broadened-scope approval behavior is supported where configured

##### Ownership

- module-owned

##### Status target

- post-MVP

#### Issue 7.4: Add incident evidence pack generation

##### Purpose

Support formal package generation from completed or in-progress cases.

##### Scope

- evidence pack generation flow
- report and manifest artifact creation
- release approval gate
- export linkage

##### Dependencies

- Issue 7.2
- Issue 4.2
- Issue 5.2

##### Acceptance criteria

- a case can produce a manifest-backed evidence pack
- release is gated by approval
- exported outputs link back to evidence and audit history

##### Ownership

- module-owned

##### Status target

- post-MVP

### Epic 8: MVP operator review surfaces

#### Issue 8.1: Implement run detail and case detail review surfaces

##### Purpose

Provide the minimum analyst workspace for execution and review.

##### Scope

- run detail
- case detail
- linked evidence/finding/timeline panels
- pivots between run and case

##### Dependencies

- Issue 2.2
- Issue 4.1
- Issue 7.2

##### Acceptance criteria

- operators can inspect run state, step state, and linked case information
- case detail shows findings, evidence, and timeline in one review surface
- users can pivot between run and case without leaving the control plane shell

##### Ownership

- core-owned surface with module-aware content

##### Status target

- MVP

#### Issue 8.2: Implement artifact/evidence detail and linked audit lookup

##### Purpose

Allow operators and reviewers to inspect provenance and reconstruct actions.

##### Scope

- evidence detail
- artifact metadata/detail
- linked audit event lookup from run/case/approval context

##### Dependencies

- Issue 4.2
- Issue 4.3
- Issue 8.1

##### Acceptance criteria

- evidence detail shows provenance fields
- artifact detail shows linkage and integrity metadata where available
- operators can inspect linked audit history from core work surfaces

##### Ownership

- core-owned

##### Status target

- MVP

## 4. Recommended execution order

Recommended build order for the first implementation slice:

1. Issue 1.1: Implement the persistent Corestack shell and navigation skeleton
2. Issue 1.2: Implement Home and Launcher as core-owned entry surfaces
3. Issue 2.1: Define and implement the minimum run and workflow execution contract
4. Issue 2.2: Define and implement the minimum case object and run-to-case linkage
5. Issue 3.1: Define the policy decision contract for governed actions
6. Issue 3.2: Implement the `web.fetch` and `web.search` tool contracts and schemas
7. Issue 3.3: Implement a minimal tool gateway with policy enforcement and audit hooks
8. Issue 4.1: Define the minimum evidence, artifact, and finding objects
9. Issue 4.2: Implement artifact storage linkage and metadata persistence
10. Issue 4.3: Implement structured audit/event logging for runs, tools, evidence, and approvals
11. Issue 5.1: Define and implement the approval object model and state machine
12. Issue 5.2: Add workflow approval checkpoints and approval queue/detail surfaces
13. Issue 6.1: Define and implement the model registry and local-first routing contract
14. Issue 6.2: Add model execution logging and external-provider restriction hooks
15. Issue 7.1: Register Security/OSINT Module 1 through the core module contract
16. Issue 7.2: Implement the first end-to-end Module 1 workflow: Alert triage and investigation
17. Issue 8.1: Implement run detail and case detail review surfaces
18. Issue 8.2: Implement artifact/evidence detail and linked audit lookup

Issues that must come first:

- Issue 1.1 must come before any module-facing UI work.
- Issue 2.1 must come before workflow-specific module implementation.
- Issue 3.1 must come before tool and model execution paths.
- Issue 4.1 must come before attempting workflow evidence output.
- Issue 5.1 must come before approval-gated workflow behavior.
- Issue 6.1 must come before model-assisted workflow steps.
- Issue 7.2 should be the first real workflow implementation before adding second and third workflows.

## 5. Smallest viable implementation slice

The narrowest buildable slice that proves the platform direction is:

- one control plane shell
- Home and Launcher
- one registered module: Security/OSINT
- one workflow/run contract
- one case object
- one policy decision contract
- one governed tool gateway supporting `web.fetch` or `web.search`
- one local-first model routing path
- one approval object and approval queue/detail
- one evidence/finding/artifact path
- one run detail and one case detail review surface
- one working Module 1 workflow: Alert triage and investigation

This slice should demonstrate:

- one control plane rather than separate product surfaces
- one Module 1 workflow executed through shared core contracts
- approvals/HITL as a real workflow gate
- evidence capture linked to a case
- policy-gated tool usage through a tool gateway
- model routing basics with local-first behavior

## 6. Deferred implementation work

The following items should wait until after the smallest viable slice:

- OSINT entity investigation workflow
- incident evidence pack generation
- broad connector catalog
- advanced graph or relationship visualization
- full workflow designer
- advanced admin and tenancy controls
- external provider breadth beyond what is needed to prove routing constraints
- sophisticated backup/restore automation
- advanced observability and ops telemetry
- broad dashboarding or management-summary UX

## 7. Risks in execution order

- Building Module 1 workflow logic before the run/case contract is stable will create rework in workflow state and evidence linkage.
- Building connector-specific integrations before the shared tool gateway will encourage private execution paths that violate the architecture.
- Building model invocation inside module code before core routing exists will create vendor-coupled module behavior.
- Building approval UI before approval state semantics are defined will force a second pass across workflow and audit behavior.
- Building evidence exports before the minimum evidence/artifact/provenance model is stable will create incompatible objects and weak auditability.
- Building broad framework layers before one working alert-triage slice risks overbuilding abstractions that are not proven by real operator flow.
- Delaying audit hooks until after workflow and tool work will leave the first slice non-reconstructable and will require retrofitting correlation across multiple subsystems.

## Alignment

This breakdown is based on:

- [ISSUES_ORDER.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/ISSUES_ORDER.md)
- [CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md)
- [SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/SECURITY_OSINT_MODULE_1.md)
- [REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md)
- [UX_INFORMATION_ARCHITECTURE_CORESTACK_DESKTOP.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/UX_INFORMATION_ARCHITECTURE_CORESTACK_DESKTOP.md)
- [CORESTACK_REQUIREMENTS_SPEC.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/CORESTACK_REQUIREMENTS_SPEC.md)
