# UX_INFORMATION_ARCHITECTURE_CORESTACK_DESKTOP.md

## 1. UX intent

Corestack is one desktop/control plane. The UX should present one coherent operator workspace for modules, workflows, evidence, approvals, policy, and administration.

The UX must feel like a professional operator workspace:

- task-oriented rather than app-switching-oriented
- evidence-aware rather than chat-centric
- stateful and auditable rather than ephemeral
- optimized for review, escalation, and reconstruction

Modules extend the experience without fragmenting the product. A module may add workflows, views, object facets, and domain-specific panels, but it should not introduce a separate shell, separate navigation philosophy, or separate control surfaces for core platform concerns.

Security/OSINT Module 1 is the first real vertical surface. It should shape the first investigator-facing experience in Corestack, but it should do so by consuming shared UI patterns for runs, approvals, cases, evidence, artifacts, logs, policies, and connectors.

## 2. Primary personas

### SOC analyst

#### Primary goals

- triage alerts quickly
- investigate suspicious activity
- capture evidence and findings
- escalate only when warranted

#### Top actions

- open alert-driven runs
- review summaries and linked entities
- attach evidence to cases
- request approval or escalate

#### What they need visible

- current queue or work entry points
- active runs and case status
- evidence and findings linked to a case
- approvals blocking progress
- policy denials or connector failures

#### What they should not need to touch often

- policy administration
- model configuration
- connector secrets
- tenancy/admin controls

### IR lead

#### Primary goals

- oversee incident investigations
- review evidence quality
- approve escalations and exports
- maintain investigation discipline and auditability

#### Top actions

- review high-severity cases
- inspect timelines, findings, and approval requests
- approve or deny evidence packs and escalations
- assign or reassign work

#### What they need visible

- case severity, status, and owners
- timeline of actions and evidence growth
- pending approvals
- export readiness and unresolved gaps

#### What they should not need to touch often

- low-level connector configuration
- routine model selection
- module installation lifecycle

### Threat hunter

#### Primary goals

- pursue hypotheses
- pivot through entities and relationships
- compare related observations across runs
- turn weak signals into structured findings

#### Top actions

- start entity investigations
- search across cases, evidence, and artifacts
- launch enrichment paths
- save findings and notes

#### What they need visible

- entities, relationships, and related runs
- linked evidence and source provenance
- search and pivot paths
- module-specific investigation tools

#### What they should not need to touch often

- approval administration
- export configuration
- system health and infra settings

### OSINT investigator

#### Primary goals

- investigate entities and infrastructure using controlled external sources
- preserve source provenance
- separate evidence-backed observations from hypotheses
- produce reviewable summaries

#### Top actions

- start manual investigations
- run search/fetch and enrichment paths
- collect and attach source artifacts
- draft findings and notes

#### What they need visible

- source records and fetch provenance
- artifacts and extracted entities
- search scope and policy restrictions
- findings and evidence support

#### What they should not need to touch often

- core workflow administration
- model registry details
- tenancy controls

### Security manager

#### Primary goals

- monitor investigation throughput and status
- review major incidents and exported outputs
- understand approvals, exceptions, and audit posture

#### Top actions

- review case summaries
- inspect major approvals and overrides
- open exported evidence packs
- monitor module-level usage and blockers

#### What they need visible

- high-level case and run status
- pending/high-risk approvals
- exports and audit summaries
- major policy exception activity

#### What they should not need to touch often

- detailed evidence editing
- connector setup
- workflow step-by-step operation

### Platform admin

#### Primary goals

- keep the control plane healthy
- manage modules, connectors, policies, and model availability
- support secure self-hosted operations

#### Top actions

- configure connectors and secrets
- manage policies and model/provider availability
- review logs, audits, and system health
- enable/disable modules

#### What they need visible

- module lifecycle status
- connector state and secret bindings
- policy status and violations
- model inventory and routing defaults
- health, logs, and audit streams

#### What they should not need to touch often

- day-to-day case handling
- routine investigation notes
- low-risk analyst workflow decisions

## 3. Top-level navigation

Recommended top-level order:

1. Home
2. Launcher
3. Runs
4. Approvals
5. Cases / Evidence
6. Files / Artifacts
7. Logs / Audit
8. Agents
9. Policies
10. Models
11. Connectors
12. Modules
13. Settings
14. Admin / Tenancy

This order reflects operator frequency first, then control plane governance, then administration.

### Home

#### Purpose

Provide the default workspace overview with active work, blocked work, recent investigations, and system-level status relevant to the signed-in user.

#### Primary users

- SOC analyst
- IR lead
- threat hunter
- security manager
- platform admin

#### Core objects shown there

- assigned runs
- priority cases
- pending approvals
- recent exports
- recent audit alerts or system warnings

#### Key actions

- resume a run
- open a case
- review a pending approval
- launch a module workflow

#### Core-wide or module-aware

- Core-wide, with module-aware widgets

### Launcher

#### Purpose

Provide a stable starting point for entering modules and commonly used workflows without becoming a generic app catalog.

#### Primary users

- SOC analyst
- threat hunter
- OSINT investigator
- platform admin

#### Core objects shown there

- installed modules
- featured workflows
- saved investigation entry points

#### Key actions

- launch Security/OSINT workflows
- open recent module spaces
- discover available module capabilities

#### Core-wide or module-aware

- Core-wide shell with module-aware content

### Agents

#### Purpose

Show reusable agent or assistant definitions, their allowed capabilities, and their operational boundaries.

#### Primary users

- platform admin
- IR lead
- advanced analysts

#### Core objects shown there

- agent definitions
- allowed tools
- model defaults
- policy associations

#### Key actions

- inspect an agent
- enable/disable an agent
- review what an agent can access

#### Core-wide or module-aware

- Core-wide, with module-specific agent assignments

### Runs

#### Purpose

Provide the execution-oriented view of in-progress, failed, queued, and completed workflow runs.

#### Primary users

- SOC analyst
- IR lead
- threat hunter
- OSINT investigator

#### Core objects shown there

- runs
- workflow steps
- statuses
- blockers
- linked approvals
- linked cases

#### Key actions

- open run details
- retry or resume run
- inspect step outputs
- jump to linked case/evidence

#### Core-wide or module-aware

- Core-wide with strong module awareness

### Approvals

#### Purpose

Provide the queue and detail surfaces for approvals, denials, escalations, overrides, and requested changes.

#### Primary users

- IR lead
- security manager
- platform admin

#### Core objects shown there

- approval requests
- approval state
- requester/approver
- linked case/run/policy

#### Key actions

- approve
- deny
- request changes
- escalate
- inspect audit trail

#### Core-wide or module-aware

- Core-wide, with module-specific context panels

### Cases / Evidence

#### Purpose

Provide the primary investigative workspace for cases, evidence, findings, entities, relationships, notes, and timelines.

#### Primary users

- SOC analyst
- IR lead
- threat hunter
- OSINT investigator
- security manager

#### Core objects shown there

- cases
- evidence items
- findings
- entities
- relationships
- notes
- timeline events

#### Key actions

- open and review a case
- attach or detach evidence
- create or edit findings
- inspect provenance
- initiate export

#### Core-wide or module-aware

- Core-wide surface with strong module-aware layouts

### Files / Artifacts

#### Purpose

Provide direct access to stored artifacts, exports, snapshots, manifests, and report files.

#### Primary users

- SOC analyst
- IR lead
- OSINT investigator
- platform admin

#### Core objects shown there

- artifacts
- export bundles
- manifests
- source snapshots
- generated reports

#### Key actions

- preview artifact
- inspect hash/provenance
- link artifact to case/evidence
- export or download where allowed

#### Core-wide or module-aware

- Core-wide, with module-derived artifact types

### Logs / Audit

#### Purpose

Expose operational and forensic records for workflows, tools, models, policies, approvals, and user actions.

#### Primary users

- platform admin
- IR lead
- security manager

#### Core objects shown there

- audit events
- workflow events
- tool/policy/model events
- user action logs

#### Key actions

- search by correlation id or object id
- reconstruct an action path
- inspect denials, failures, and overrides

#### Core-wide or module-aware

- Core-wide

### Policies

#### Purpose

Show and manage execution rules governing tools, models, connectors, exports, and selected workflow actions.

#### Primary users

- platform admin
- security manager

#### Core objects shown there

- policies
- policy scopes
- allow/deny rules
- exception state

#### Key actions

- view policy
- edit policy
- inspect effect on modules/connectors/models
- review recent denials

#### Core-wide or module-aware

- Core-wide with module-level scoping

### Models

#### Purpose

Expose available models, providers, routing defaults, and usage constraints.

#### Primary users

- platform admin
- advanced operators

#### Core objects shown there

- model entries
- provider bindings
- capability classes
- routing defaults

#### Key actions

- inspect availability
- enable/disable model path
- view routing constraints

#### Core-wide or module-aware

- Core-wide with module-aware usage views

### Connectors

#### Purpose

Manage external and internal data connectors, enrichment sources, and export targets.

#### Primary users

- platform admin
- advanced operators

#### Core objects shown there

- connector registrations
- status
- secret bindings
- policy scope

#### Key actions

- configure connector
- enable/disable connector
- test connectivity
- inspect policy restrictions

#### Core-wide or module-aware

- Core-wide with module-aware assignments

### Modules

#### Purpose

Show installed modules, their workflows, extension points, health, and lifecycle state.

#### Primary users

- platform admin
- security manager
- advanced analysts

#### Core objects shown there

- modules
- module status
- contributed workflows
- contributed views/connectors

#### Key actions

- inspect module
- enable/disable module
- review what the module extends

#### Core-wide or module-aware

- Core-wide

### Settings

#### Purpose

Provide user and workspace preferences that are not deep platform administration.

#### Primary users

- all personas, lightly

#### Core objects shown there

- profile settings
- notification settings
- workspace preferences

#### Key actions

- adjust preferences
- manage personal defaults

#### Core-wide or module-aware

- Core-wide

### Admin / Tenancy

#### Purpose

Provide hardened administration for deployment-level configuration, health, access boundaries, and future tenancy controls.

#### Primary users

- platform admin

#### Core objects shown there

- system health
- access controls
- retention settings
- storage status
- tenancy boundaries if later enabled

#### Key actions

- review health
- configure retention/admin settings
- inspect critical system warnings

#### Core-wide or module-aware

- Core-wide

## 4. Core object model in the UX

### Agent

#### What it is

A reusable assistant or execution profile with defined capabilities, tools, policies, and model defaults.

#### Where users see it

- Agents
- Runs
- module workflow launch surfaces

#### What actions users can take on it

- inspect
- enable/disable
- review permissions and defaults

#### What relationships matter most

- linked workflows
- linked tools
- linked models
- linked policies

### Run

#### What it is

A specific execution instance of a workflow.

#### Where users see it

- Home
- Runs
- Cases / Evidence
- Approvals

#### What actions users can take on it

- open
- resume
- retry
- inspect steps
- jump to linked objects

#### What relationships matter most

- workflow
- case
- approvals
- artifacts
- audit events

### Workflow

#### What it is

A reusable procedure definition that drives a run.

#### Where users see it

- Launcher
- Modules
- Runs

#### What actions users can take on it

- launch
- inspect requirements
- view recent run history

#### What relationships matter most

- module
- agent
- runs
- required approvals or policies

### Approval

#### What it is

A human decision object for gated actions.

#### Where users see it

- Approvals
- Runs
- Cases / Evidence
- Logs / Audit

#### What actions users can take on it

- approve
- deny
- request changes
- escalate
- inspect history

#### What relationships matter most

- case
- run
- policy
- requester
- approver

### Case

#### What it is

The primary investigation container for a unit of work, incident, or investigation.

#### Where users see it

- Home
- Cases / Evidence
- Runs
- Approvals

#### What actions users can take on it

- open
- update status
- assign
- review timeline
- export

#### What relationships matter most

- evidence items
- findings
- artifacts
- runs
- approvals

### Evidence item

#### What it is

A structured evidentiary object linked to a case, source, artifact, or finding.

#### Where users see it

- Cases / Evidence
- Runs
- Files / Artifacts

#### What actions users can take on it

- inspect
- attach/detach
- review provenance
- link to findings

#### What relationships matter most

- source
- artifact
- case
- finding
- derived-from chain

### Artifact

#### What it is

A stored file-like or payload snapshot object such as a fetched page, normalized payload, report, or manifest.

#### Where users see it

- Files / Artifacts
- Cases / Evidence
- Runs

#### What actions users can take on it

- preview
- inspect integrity metadata
- link to case/evidence
- export where allowed

#### What relationships matter most

- evidence item
- source
- export package
- run

### Finding

#### What it is

A human- or system-authored conclusion or observation that should be supported by evidence.

#### Where users see it

- Cases / Evidence
- Runs
- exports

#### What actions users can take on it

- create
- edit
- review support
- mark status or confidence

#### What relationships matter most

- case
- supporting evidence
- notes
- approvals

### Policy

#### What it is

A reusable rule set controlling access, routing, approvals, and limits.

#### Where users see it

- Policies
- Approvals
- Runs
- Connectors
- Models

#### What actions users can take on it

- inspect
- edit
- review violations or denials

#### What relationships matter most

- tools
- models
- connectors
- modules
- approvals

### Model

#### What it is

A registered local or external model path with known capabilities and restrictions.

#### Where users see it

- Models
- Runs
- Policies

#### What actions users can take on it

- inspect
- enable/disable
- review routing role

#### What relationships matter most

- provider
- policies
- workflows
- runs

### Connector

#### What it is

A configured integration path for ingestion, enrichment, or export.

#### Where users see it

- Connectors
- Policies
- Runs
- Modules

#### What actions users can take on it

- configure
- enable/disable
- inspect restrictions
- test

#### What relationships matter most

- policies
- workflows
- modules
- secrets

### Module

#### What it is

A domain extension package that adds workflows, views, connectors, and object facets to the Corestack control plane.

#### Where users see it

- Launcher
- Modules
- Home

#### What actions users can take on it

- inspect
- enable/disable
- launch workflows
- review contributions

#### What relationships matter most

- workflows
- views
- connectors
- policies

## 5. Primary user flows

### Alert triage and investigation

#### Entry point

- Home priority queue
- Launcher workflow entry
- direct alert intake into Runs or Cases / Evidence

#### Screens/surfaces touched

- Home
- Runs
- Cases / Evidence
- Approvals
- Files / Artifacts
- Logs / Audit as needed

#### User actions

- open the alert-driven run
- inspect normalized alert and extracted entities
- review enrichment and findings
- add notes or adjust case linkage
- request escalation or disposition

#### Agent/system actions

- create run and attach or create case
- normalize alert
- call allowed tools/connectors
- generate draft summary and findings
- write evidence and artifacts
- request approval when required

#### Approval points

- escalation
- policy exception
- external handoff/export
- final disposition where policy requires review

#### Outputs

- triage summary
- updated case state
- linked evidence and findings

### OSINT entity investigation

#### Entry point

- Launcher workflow entry
- manual investigation action from Home
- pivot from an existing case or evidence item

#### Screens/surfaces touched

- Launcher
- Runs
- Cases / Evidence
- Files / Artifacts
- Approvals if required

#### User actions

- enter seed entity and scope
- review fetched sources and related entities
- refine investigation direction
- save findings and notes
- initiate export if needed

#### Agent/system actions

- create run and case context
- enforce policy on collection scope
- execute search/fetch/enrichment steps
- generate relationship suggestions and draft summaries
- persist sources, artifacts, findings, and notes

#### Approval points

- broadened search scope where policy requires it
- sensitive external collection if later supported
- final export or closure

#### Outputs

- entity profile
- supporting evidence set
- investigator summary

### Incident evidence pack generation

#### Entry point

- action from a case detail view
- action from an approval request
- action from a completed run

#### Screens/surfaces touched

- Cases / Evidence
- Files / Artifacts
- Approvals
- Logs / Audit for verification

#### User actions

- choose report scope and output type
- review included evidence and unresolved gaps
- inspect draft report and manifest
- approve release or request changes

#### Agent/system actions

- assemble evidence set
- draft chronology and summaries
- generate manifest and report artifacts
- write export bundle
- log release and handoff events

#### Approval points

- redactions
- final release
- external handoff/export

#### Outputs

- incident evidence pack
- analyst report
- management summary

## 6. Approval and HITL UX

### Where approvals appear

- global Approvals queue
- run detail pages
- case detail pages
- Home widgets for relevant personas

### What information the approver sees

Every approval detail should show:

- requested action
- requester
- linked case and run
- policy reason for gating
- summary of evidence and findings relevant to the decision
- impact of approve vs deny
- deadline, escalation path, and any prior related approvals

### Approve / deny / request changes / escalate states

User-facing states should include:

- pending
- approved
- denied
- changes requested
- escalated
- expired
- overridden

The UX should make it clear which states are terminal and which return work back to the analyst.

### How overrides are shown

- overrides must be visibly distinct from ordinary approvals
- the UI should show who overrode, why, under what authority, and what scope was overridden
- overridden actions should remain searchable from Logs / Audit and visible from the linked case/run

### How auditability is exposed in the UI

- every approval shows a decision history panel
- linked audit events are accessible from the approval detail
- users can pivot from approval to case, run, policy, and export objects
- changes to approval state should be timeline-visible on the case

## 7. Evidence and case UX

### How evidence is collected and attached

- evidence can be created from workflow steps automatically
- analysts can attach existing artifacts or findings to a case
- workflows should attach evidence by default rather than forcing manual filing

### How provenance is shown

Each evidence detail should expose:

- source
- acquisition method
- collector/tool used
- time collected
- parent/derived-from references
- integrity metadata if present
- linked run and case

### How cases are reviewed

Case detail should center:

- case summary and status
- findings panel
- evidence list
- timeline
- related runs
- approvals
- export readiness

Review should feel chronological and evidence-first, not document-first.

### How exports are initiated

- from case detail
- from approved workflow outputs
- from evidence pack preparation panels

Export initiation should require scope selection, show policy implications, and make approval requirements explicit before submission.

### What makes the experience analyst-friendly

- clear separation of draft system output from approved findings
- one-click pivots between run, case, evidence, artifact, and approval
- visible blockers such as denied tools or pending approvals
- evidence support shown next to findings, not hidden behind secondary screens
- timeline and provenance always accessible from the current work context

## 8. Module UX extension rules

### What navigation can be extended

Modules may extend:

- Launcher entries
- Home widgets
- module-aware tabs or panels inside Runs and Cases / Evidence
- module-specific saved views under Modules

### What objects can be added

Modules may add:

- domain-specific object facets
- domain-specific relationship labels
- domain-specific workflow types
- module-specific summary panels

### What module-specific panels are allowed

Allowed module panels include:

- workflow-specific input panels
- domain-specific evidence views
- investigation summary panels
- module-specific dashboards inside the module context

### What must remain core-owned

- desktop shell and top-level navigation structure
- Runs
- Approvals
- Cases / Evidence base model
- Files / Artifacts base model
- Logs / Audit
- Policies
- Models
- Connectors
- Settings
- Admin / Tenancy

Modules can specialize these surfaces but must not replace them.

## 9. MVP UX scope

### Minimum viable UI

Desktop shell:

- Home
- Launcher
- persistent top-level navigation
- global search or jump entry if feasible

Module 1 workflows:

- launch Security/OSINT investigations
- run detail view with steps, outputs, and blockers
- case detail view with findings, evidence, timeline, and related runs

Approvals:

- approvals queue
- approval detail with approve/deny/request changes/escalate

Evidence/cases:

- case list
- case detail
- evidence detail
- artifact preview or metadata view

Logs/audit:

- searchable audit list
- event detail with correlation ids and linked object references

Admin essentials:

- connector list/detail
- policy list/detail
- model list/detail
- module list/detail
- basic system/admin status

### Explicitly deferred

- advanced visual analytics
- complex graph-native investigation canvas
- broad personalization
- full no-code workflow designer
- deep tenancy management UX
- extensive executive dashboarding
- rich collaboration/chat surfaces

## 10. Open UX questions

- Should Home be role-tailored by default or mostly consistent across personas?
- Should Runs or Cases / Evidence be the primary working surface for analysts after intake?
- What is the first-class entry point for alert-driven work: Home queue, Cases, or Runs?
- How much entity/relationship visualization is required in MVP versus later?
- Should approvals be a dedicated top-level destination for all personas or mainly reviewers/admins?
- What is the minimum artifact preview experience needed for analyst confidence?
- How should module-specific panels be visually distinguished without fragmenting the product?
- What is the right balance between timeline-first and evidence-grid-first case review?
- How should future tenancy or workspace boundaries appear without cluttering the single-product shell?

## Alignment

This document is intended to align:

- [ISSUES_ORDER.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/ISSUES_ORDER.md)
- [SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/SECURITY_OSINT_MODULE_1.md)
- [REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/REFERENCE_ARCHITECTURE_SECURITY_OSINT_MODULE_1.md)

It should guide the UX and product-surface work for:

- the single Corestack desktop/control plane
- Module 1 operator workflows
- approvals and HITL UX
- evidence/case review UX
- module extension rules and MVP UI scope
