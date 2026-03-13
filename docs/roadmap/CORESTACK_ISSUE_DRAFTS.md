# Corestack Issue Drafts

This file contains the final draft text for the Corestack planning refactor.
It is intended to be copied into GitHub issues cleanly.

---

## Rewritten Existing Issues

### #2 Define and implement Corestack control plane architecture

**Milestone:** Milestone 1: Corestack Control Plane Foundation (P0/P1)  
**Priority:** P0

**Owner:** TBD

**Summary**  
Define and implement the single Corestack desktop/control plane architecture as the primary product surface for local and self-hosted operation. The control plane must manage modules, runs, approvals, policies, models, evidence/cases, connectors, logs, and system health from one coherent runtime and admin experience.

**Problem Statement**  
Corestack should not evolve as a generic pack-oriented "agent OS" with multiple product shells. It should become one product with one desktop/control plane, where domain capabilities are added as modules and governed centrally. Packs may remain as a runtime packaging term where useful, but they are not the product identity.

**Scope**
- Define the Corestack runtime topology and control surfaces
- Define the control plane responsibilities versus module responsibilities
- Define lifecycle management for modules, runs, approvals, policies, models, connectors, and evidence stores
- Define desktop UI, API, and CLI roles, with the desktop/control plane as the primary product identity
- Define local-first and self-hosted-first deployment assumptions
- Define hardened-by-design baseline security controls for the control plane

**Acceptance Criteria**
- [ ] Architecture document defines the single Corestack control plane and major runtime components
- [ ] Control plane responsibilities are explicitly separated from module responsibilities
- [ ] Lifecycle hooks are defined for module install/enable/disable/update/remove
- [ ] Lifecycle hooks are defined for runs, approvals, policies, models, connectors, and evidence stores
- [ ] Configuration, secrets, storage paths, and environment conventions are defined for self-hosted deployment
- [ ] Security baseline is defined for authentication, authorization, secret handling, audit logging, network boundaries, and safe defaults
- [ ] Control surfaces are defined for the desktop UI, API, and CLI
- [ ] Initial implementation plan identifies the minimum runnable control plane slice

**Out of Scope**
- Specific module implementations
- Enterprise multi-tenant features
- Managed cloud deployment

---

### #9 Implement model management and routing layer

**Milestone:** Milestone 2: Security/OSINT Module 1 Enablement (P1)  
**Priority:** P1

**Owner:** TBD

**Summary**  
Build a model management and routing layer that is open-weight-first, pluggable, policy-governed, and self-hosted-first. The system must support local inference by default while allowing controlled use of external providers under explicit policy.

**Problem Statement**  
The current framing of "local vs online" provider routing is too shallow. Corestack needs a governed model layer that can register models, express routing policy, enforce security and data handling constraints, and select the right model for each module and workflow step.

**Scope**
- Define a model registry for local and external providers
- Define provider adapters and a pluggable execution interface
- Define routing policy inputs including security, privacy, capability, latency, cost, and hosting constraints
- Define module-level and task-level model selection rules
- Define approval and guardrail flows for external model use
- Define observability and audit for model routing decisions

**Acceptance Criteria**
- [ ] Model registry supports open-weight local models as the default path
- [ ] Provider interface supports pluggable local and external model backends
- [ ] Routing policy supports capability, latency, cost, privacy, trust, and hosting constraints
- [ ] Policy can require local-only execution for selected modules, workflows, data classes, or connectors
- [ ] Module-level default models and step-level overrides are supported
- [ ] Routing decisions are logged with policy reasons and execution metadata
- [ ] Failure handling and fallback behavior are defined
- [ ] Initial implementation plan identifies the minimum supported model backends

**Out of Scope**
- Fine-tuning pipelines
- Billing and commercial entitlements

---

### #10 Build workflow engine and orchestration layer

**Milestone:** Milestone 2: Security/OSINT Module 1 Enablement (P1)  
**Priority:** P1

**Owner:** TBD

**Summary**  
Build the workflow engine and orchestration layer for Corestack as a module-agnostic execution system, with Security/OSINT workflows as the first reference implementation.

**Problem Statement**  
The current workflow framing assumes content-production pipelines. Corestack instead needs an orchestration system for investigative and analytical workflows that can coordinate tools, models, humans, approvals, policies, and evidence objects.

**Scope**
- Define workflow primitives, step types, state transitions, and artifacts
- Support human review and approval gates
- Support policy checks and sandbox/tool gate enforcement inside workflow execution
- Support evidence-producing workflows for Security/OSINT first
- Define storage conventions for workflow runs, artifacts, logs, and evidence links

**Acceptance Criteria**
- [ ] Workflow model supports ingest, enrich, correlate, analyze, review, and report patterns
- [ ] Workflow engine supports task, tool, model, human-review, approval, and policy-check steps
- [ ] Workflow engine supports resumable runs and explicit state transitions
- [ ] Manual gates, escalations, and approval checkpoints are supported
- [ ] Workflow artifacts are addressable, retained, and linked to evidence/case records where applicable
- [ ] Security/OSINT reference workflows are defined as the first module implementation target
- [ ] Execution events are observable and auditable
- [ ] Failure, retry, timeout, and compensation behavior are defined

**Out of Scope**
- Full no-code workflow builder
- Domain-specific workflow catalogs beyond the first reference module

---

### #12 Define product surface area: UI/UX, admin, and day-2 operations

**Milestone:** Milestone 0: Product and Architecture Lock (P0)  
**Priority:** P0

**Owner:** TBD

**Summary**  
Define the Corestack product surface as one desktop/control plane experience with clear operator, analyst, and admin workflows. The product must center launcher, agents, runs, approvals, evidence/cases, logs/audit, policies, connectors, administration, and self-hosted day-2 operations.

**Problem Statement**  
The current "stack manager + pack catalog" framing reflects a pack-centric platform. Corestack now needs a product definition for one coherent application with domain modules, a Security/OSINT-first operating model, and hardened self-hosted administration.

**Scope**
- Define primary personas and top-level jobs to be done
- Define information architecture for the desktop/control plane
- Define surfaces for launcher, agents, runs, approvals, evidence/cases, logs/audit, policies, connectors, and admin
- Define module management in product language while keeping packs only as runtime packaging where needed
- Define day-2 operations for backup/restore, upgrade, logs, health, retention, and incident export
- Define self-hosted-first UX assumptions and constraints

**Acceptance Criteria**
- [ ] Product surface map covers the primary navigation and main operator flows
- [ ] UX distinguishes control plane concerns from module-specific concerns
- [ ] Launcher, agents, runs, approvals, evidence/cases, logs/audit, policies, connectors, and admin surfaces are defined
- [ ] Module management surface is defined in place of a generic pack catalog
- [ ] Day-2 operations are defined for health, backup/restore, upgrade, retention, and exports
- [ ] Desktop-first and self-hosted-first assumptions are documented
- [ ] Initial MVP UI scope is identified and sequenced

**Out of Scope**
- Full visual design system
- Marketing site or commercial packaging flows

---

## Split Issue Drafts for #8

### Platform observability and ops telemetry

**Milestone:** Milestone 3: Platform Operations Maturity (P2)  
**Priority:** P2

**Owner:** TBD

**Summary**  
Build platform observability and operations telemetry for the Corestack control plane, modules, workflows, tools, model execution, and self-hosted runtime.

**Problem Statement**  
Corestack needs operational visibility for self-hosted deployments, module execution, workflow health, model performance, and system reliability. This is distinct from forensic audit and evidence-chain requirements.

**Acceptance Criteria**
- [ ] Metrics and health signals are defined for control plane services, modules, workflows, tool calls, connectors, and model execution
- [ ] Dashboards are defined for runtime health, failures, latency, throughput, and capacity
- [ ] Structured logs and traces are defined where applicable
- [ ] Alerts and operator-facing failure states are defined for self-hosted deployments
- [ ] Telemetry export paths are defined for common self-hosted observability stacks
- [ ] Retention and storage guidance are defined for operational telemetry

---

### Security audit, forensics, and evidence trails

**Milestone:** Milestone 2: Security/OSINT Module 1 Enablement (P1)  
**Priority:** P1

**Owner:** TBD

**Summary**  
Build Corestack's security audit, forensics, and evidence trail capabilities to support hardened-by-design operations and Security/OSINT workflows.

**Problem Statement**  
Corestack must capture policy decisions, tool access, model routing, approvals, workflow actions, evidence provenance, and operator actions in a way that supports review, investigation, export, and reconstruction.

**Acceptance Criteria**
- [ ] Security audit event taxonomy is defined for user actions, approvals, policy decisions, tool calls, model routing, workflow steps, and evidence mutations
- [ ] Evidence provenance and chain-of-custody fields are defined
- [ ] Exportable audit and evidence packages are supported
- [ ] Tamper-evident or integrity-protecting mechanisms are defined for critical logs and evidence metadata
- [ ] Retention and redaction rules are defined for audit and forensic records
- [ ] Forensics-friendly search and reconstruction requirements are documented

---

## New Planning Issues

### Core vs Module boundary

**Milestone:** Milestone 0: Product and Architecture Lock (P0)  
**Priority:** P0

**Owner:** TBD

**Summary**  
Define the boundary between the Corestack base product and domain modules so the platform remains coherent, secure, and extensible without spawning separate product variants.

**Acceptance Criteria**
- [ ] Core responsibilities are explicitly defined
- [ ] Module responsibilities are explicitly defined
- [ ] Rules are defined for what can live in core versus modules
- [ ] Shared contracts are defined for modules: APIs, events, policies, workflows, storage, and UI extension points
- [ ] Security and deployment implications of the boundary are documented
- [ ] Security/OSINT Module 1 is validated against the boundary as the first reference case

---

### Security/OSINT Module 1 definition

**Milestone:** Milestone 0: Product and Architecture Lock (P0)  
**Priority:** P0

**Owner:** TBD

**Summary**  
Define Security/OSINT as Module 1, including scope, users, workflows, evidence needs, tooling needs, model needs, and how it exercises the Corestack platform.

**Acceptance Criteria**
- [ ] Module 1 goals, users, and non-goals are documented
- [ ] Core workflows are defined for ingest, enrich, correlate, analyze, review, and report
- [ ] Required tool classes, model classes, policies, connectors, and data stores are identified
- [ ] Required evidence and case objects are identified
- [ ] Control plane surfaces needed for Module 1 are identified
- [ ] The definition clearly distinguishes reusable platform needs from module-specific logic

---

### Agent sandbox / gatekeeper security model

**Milestone:** Milestone 0: Product and Architecture Lock (P0)  
**Priority:** P0

**Owner:** TBD

**Summary**  
Define the security model for agent execution, tool access, connector use, sandboxing, policy enforcement, and gatekeeping across Corestack.

**Acceptance Criteria**
- [ ] Trust boundaries are defined for the control plane, modules, workflows, models, tools, connectors, and external systems
- [ ] Sandbox and execution isolation expectations are defined
- [ ] Tool gating and policy enforcement points are defined
- [ ] Network, filesystem, secret, and identity boundaries are defined
- [ ] Default-deny and least-privilege expectations are documented
- [ ] Audit requirements are identified for all critical decision points

---

### Evidence and case object model

**Milestone:** Milestone 0: Product and Architecture Lock (P0)  
**Priority:** P0

**Owner:** TBD

**Summary**  
Define the canonical object model for evidence, cases, artifacts, provenance, relationships, findings, and review state in Corestack, starting with Security/OSINT needs.

**Acceptance Criteria**
- [ ] Core objects are defined: evidence item, artifact, case, finding, source, relationship, and review state
- [ ] Provenance and chain-of-custody fields are defined
- [ ] Workflow run outputs can attach to evidence and case objects
- [ ] Retention, redaction, and export implications are documented
- [ ] The model separates reusable platform objects from module-specific extensions

---

### Approvals and human-in-the-loop decision model

**Milestone:** Milestone 0: Product and Architecture Lock (P0)  
**Priority:** P0

**Owner:** TBD

**Summary**  
Define the approvals and human-in-the-loop decision model for Corestack, including approval objects, state transitions, escalation paths, override controls, and full auditability.

**Acceptance Criteria**
- [ ] Approval object schema is defined, including requester, approver, subject, scope, rationale, and expiration
- [ ] Approval states are defined, including pending, approved, denied, expired, canceled, superseded, and overridden
- [ ] Escalation rules and reassignment paths are defined
- [ ] Override rules are defined, including who can override, under what policy, and how override scope is limited
- [ ] Workflow, model, tool, and connector actions can require approval where policy demands it
- [ ] All approval and override actions are fully auditable

