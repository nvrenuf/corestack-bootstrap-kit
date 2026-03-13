# ISSUES_ORDER.md — Corestack Execution Order

This file defines the build order for Corestack, grouped into milestones with clear priorities.
Rule: **Corestack is one desktop/control plane product.** Domain capabilities ship as **modules**, not separate OS builds. The term **pack** remains available only where it is the correct runtime packaging concept.

---

## Milestone 0 — Product and Architecture Lock (P0)

Goal: Lock the product shape, architecture boundaries, approval model, security posture, and first module before implementation expands.

1. **Core vs Module boundary**  #TBD  
   Owner: TBD  
   - [ ] Core responsibilities are explicitly defined  
   - [ ] Module responsibilities are explicitly defined  
   - [ ] Shared contracts are defined for APIs, events, storage, policies, workflows, and UI extension points

2. **Security/OSINT Module 1 definition**  #TBD  
   Owner: TBD  
   - [ ] Users, jobs, and non-goals are documented  
   - [ ] Reference workflows are defined  
   - [ ] Required tools, models, evidence objects, connectors, and control plane surfaces are identified

3. **Evidence and case object model**  #TBD  
   Owner: TBD  
   - [ ] Core evidence, case, artifact, finding, source, and relationship objects are defined  
   - [ ] Provenance and chain-of-custody fields are defined  
   - [ ] Retention, redaction, and export implications are documented

4. **Agent sandbox / gatekeeper security model**  #TBD  
   Owner: TBD  
   - [ ] Trust boundaries are defined  
   - [ ] Sandbox and isolation expectations are documented  
   - [ ] Policy enforcement points and audit requirements are defined

5. **Approvals and human-in-the-loop decision model**  #TBD  
   Owner: TBD  
   - [ ] Approval object, states, escalation, and override rules are defined  
   - [ ] Workflow, model, tool, and connector approval hooks are identified  
   - [ ] Auditability requirements are defined

6. **Define product surface area: UI/UX, admin, and day-2 operations**  #12 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/12  
   Owner: TBD  
   - [ ] Launcher, agents, runs, approvals, evidence/cases, logs/audit, policies, connectors, admin, and day-2 ops surfaces are defined  
   - [ ] Module management is defined in product language  
   - [ ] Self-hosted-first UX assumptions are documented

---

## Milestone 1 — Corestack Control Plane Foundation (P0/P1)

Goal: Deliver the minimum secure Corestack control plane that can host Module 1.

### MVP Slice Reconciliation Status (main)

- [x] Implement persistent Corestack shell and navigation skeleton (`8cd6592`, PR #28)
- [x] Implement Home and Launcher as core-owned entry surfaces (`1a2b085`, PR #28)
- [x] Define and implement minimum run/workflow execution contract (`1c87d62`, PR #28)
- [x] Define and implement minimum case object and run-to-case linkage (`821abc0`, PR #28)
- [x] Define policy decision contract for governed actions (`0a8d76a`, PR #28)
- [x] Implement `web.fetch` and `web.search` tool contracts and schemas (`2046ecd`, PR #28)
- [~] Land minimal governed tool gateway scaffolding (`31c49b4`, PR #29)
- [x] Define the minimum evidence, artifact, and finding objects (`492f359`, PR #31)
- [~] Implement artifact storage linkage and metadata persistence (`69e72a7`, PR #32)
- [x] Implement structured audit/event logging for runs, tools, evidence, and approvals (`c0fae98`, PR TBD)
- [x] Define and implement approval object model and state machine (`current branch head`, PR TBD)
- [x] Add workflow approval checkpoints and approval queue/detail surfaces (`current branch head`, PR TBD)
- [x] Define and implement model registry and local-first routing contract (`current branch head`, PR TBD)
- [x] Add model execution logging and external-provider restriction hooks (`current branch head`, PR TBD)
- [x] Register Security/OSINT Module 1 through the core module contract (`current branch head`, PR TBD)

Note: These are MVP-slice thin-slice reconciliations. Keep Milestone issues #4/#18/#21 open until full acceptance criteria are satisfied.

### Epic: Controlled Internet Access (Tool Gateway + n8n)  #16 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/16
7. **Define and implement Corestack control plane architecture**  #2 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/2  
   Owner: TBD  
   - [ ] Single control plane runtime and component topology are defined  
   - [ ] Module, run, approval, policy, model, connector, and evidence lifecycles are defined  
   - [ ] Self-hosted config, secrets, storage, and security defaults are defined

8. **Design and build policy engine and tool gating**  #4 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/4  
   Owner: TBD  
   - [ ] Policy model covers allow/deny, rate limits, timeouts, size limits, and trust boundaries  
   - [ ] Decision logging format is defined  
   - [ ] Safe defaults are deny-by-default for hardened deployments

9. **Define tool schemas: web.fetch + web.search**  #17 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/17  
   Owner: TBD  
   - [ ] JSON schema for each tool request and response  
   - [ ] Error model and normalization rules are defined  
   - [ ] Tool metadata includes capabilities, limits, and required permissions

10. **Implement Tool Gateway enforcement layer (allowlist, rate limit, payload validation)**  #18 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/18  
    Owner: TBD  
    - [ ] Inputs are validated against schema  
    - [ ] Allowlists, rate limits, max bytes, and timeouts are enforced  
    - [ ] Normalized errors are returned

11. **Wire Tool Gateway → n8n (routing, auth header/shared secret, response normalization)**  #20 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/20  
    Owner: TBD  
    - [ ] Shared secret and auth header handling are defined  
    - [ ] Routes are wired safely  
    - [ ] Responses are normalized and failure paths are safe

12. **Build n8n workflows for web.fetch (HTTP request) and web.search (search provider)**  #19 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/19  
    Owner: TBD  
    - [ ] web.fetch and web.search workflows are implemented  
    - [ ] Limits and normalization are enforced  
    - [ ] Provider config is externalized safely

13. **Add audit logging + security events (requests, domains, decisions, failures)**  #21 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/21  
    Owner: TBD  
    - [ ] Structured event format is implemented  
    - [ ] Allow and deny decisions are logged with reasons  
    - [ ] Secret redaction rules are enforced

14. **Integration tests + validation harness (E2E, negative tests, allowlist tests)**  #22 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/22  
    Owner: TBD  
    - [ ] Golden-path and negative-path E2E tests are implemented  
    - [ ] Contract tests enforce schema conformance  
    - [ ] CI-friendly runner is available

15. **Docs: runbook + configuration + threat model notes**  #23 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/23  
    Owner: TBD  
    - [ ] Runbook and configuration docs exist  
    - [ ] Threats and mitigations are documented  
    - [ ] Operational troubleshooting is documented

---

## Milestone 2 — Security/OSINT Module 1 Enablement (P1)

Goal: Make the platform capable of supporting the first real module: Security/OSINT.

16. **Build workflow engine and orchestration layer**  #10 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/10  
    Owner: TBD  
    - [ ] Workflow primitives support ingest, enrich, correlate, analyze, review, and report patterns  
    - [ ] Human review, approvals, policy checks, and resumable runs are supported  
    - [ ] Workflow artifacts can attach to evidence and case records

17. **Implement model management and routing layer**  #9 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/9  
    Owner: TBD  
    - [ ] Open-weight local models are the default path  
    - [ ] Pluggable provider adapters are supported  
    - [ ] Policy-governed routing is enforced and logged

18. **Security audit, forensics, and evidence trails**  #TBD  
    Owner: TBD  
    - [ ] Security audit taxonomy is defined  
    - [ ] Evidence provenance and chain-of-custody are captured  
    - [ ] Exportable forensic packages are supported

19. **Define data lifecycle and privacy controls**  #6 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/6  
    Owner: TBD  
    - [ ] Retention policies are defined  
    - [ ] Redaction and PII handling are defined  
    - [ ] Deletion workflows are defined

20. **Develop evaluation harness and quality gates**  #13 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/13  
    Owner: TBD  
    - [ ] Output validators exist for safety and correctness  
    - [ ] Regression tests cover module behavior  
    - [ ] Quality gates are defined for release readiness

---

## Milestone 3 — Platform Operations Maturity (P2)

Goal: Make Corestack stable, operable, and maintainable in self-hosted environments.

21. **Establish module packaging, runtime contract, and pack distribution/security**  #11 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/11  
    Owner: TBD  
    - [ ] Module contract is defined  
    - [ ] Runtime packaging and update flows are defined  
    - [ ] Pack provenance and secrets separation are supported

22. **Platform observability and ops telemetry**  #TBD  
    Owner: TBD  
    - [ ] Metrics, logs, traces, and dashboards exist for the control plane and modules  
    - [ ] Alerts and health views exist for self-hosted operation  
    - [ ] Telemetry export paths are defined

23. **Backup, restore, upgrade, and recovery operations**  #TBD  
    Owner: TBD  
    - [ ] Backup and restore flows are implemented  
    - [ ] Upgrade and rollback expectations are defined  
    - [ ] Recovery runbooks are documented

---

## Milestone 4 — Enterprise and Commercial Readiness (P3)

Goal: Add enterprise controls after the single-product, self-hosted, security-first foundation is working.

24. **Integrate enterprise-grade identity and authorization**  #3 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/3  
    Owner: TBD  
    - [ ] SSO and OIDC integration path is defined  
    - [ ] Role-based access controls are implemented  
    - [ ] Module permissions are supported

25. **Implement multi-tenant isolation and segregation**  #5 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/5  
    Owner: TBD  
    - [ ] Tenant scoping exists for tools, data, logs, models, and evidence  
    - [ ] Isolation boundaries are enforced  
    - [ ] Tenant-level policies and keys are supported

26. **Plan commercial readiness: deployment options, licensing, and procurement**  #14 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/14  
    Owner: TBD  
    - [ ] Self-hosted and airgapped packaging are defined  
    - [ ] Licensing and entitlement approach is defined  
    - [ ] Security documentation bundle is prepared

---

## Fear Signal Radar (STA) — Module 1 Candidate Runtime Pack

Current pack version: **0.1.0**  
Status: NOT STARTED

This section remains as an implementation/runtime packaging plan for the Security/OSINT domain. It is not the product-level roadmap.

### 0.1.0 MVP Execution Order

1. **FSRA-001 Define TopicConfig schema + first topic file**  
   File: `packs/fear-signal-radar/issues/FSRA-001_define-topicconfig-schema-first-topic-file.md`
2. **FSRA-002 Postgres schema + migrations for signal_items and radar_runs**  
   File: `packs/fear-signal-radar/issues/FSRA-002_postgres-schema-migrations-signal-items-radar-runs.md`
3. **FSRA-003 Ingest API write-only endpoint with auth + sanitization + dedupe**  
   File: `packs/fear-signal-radar/issues/FSRA-003_ingest-api-write-only-auth-sanitization-dedupe.md`
4. **FSRA-004 Egress proxy allowlist enforcement (collector-only outbound)**  
   File: `packs/fear-signal-radar/issues/FSRA-004_egress-proxy-allowlist-enforcement-collector-only-outbound.md`
5. **FSRA-005 Reddit Collector (top/week + keyword + top comments)**  
   File: `packs/fear-signal-radar/issues/FSRA-005_reddit-collector-top-week-keyword-top-comments.md`
6. **FSRA-006 YouTube Collector (recent videos + top comments + velocity proxy)**  
   File: `packs/fear-signal-radar/issues/FSRA-006_youtube-collector-recent-videos-top-comments-velocity-proxy.md`
7. **FSRA-007 News/RSS Collector (snippet-only ingest)**  
   File: `packs/fear-signal-radar/issues/FSRA-007_news-rss-collector-snippet-only-ingest.md`
8. **FSRA-008 Synthesizer Agent (cluster + score + report JSON+MD export)**  
   File: `packs/fear-signal-radar/issues/FSRA-008_synthesizer-agent-cluster-score-report-json-md-export.md`
9. **FSRA-009 End-to-end runner scripts + minimal admin queries**  
   File: `packs/fear-signal-radar/issues/FSRA-009_end-to-end-runner-scripts-minimal-admin-queries.md`
10. **FSRA-010 Pack README + Ops runbook + Security model**  
    File: `packs/fear-signal-radar/issues/FSRA-010_pack-readme-ops-runbook-security-model.md`

### Backlog (0.2.0-0.4.0)

- **0.2.0**: FSRA-011 Velocity + history + trend detection  
  File: `packs/fear-signal-radar/issues/FSRA-011_velocity-history-trend-detection.md`
- **0.3.0**: FSRA-012 Verification layer (evidence vs speculation; citations workflow)  
  File: `packs/fear-signal-radar/issues/FSRA-012_verification-layer-evidence-vs-speculation-citations.md`
- **0.4.0**: FSRA-013 Dashboard + angle picker + exports  
  File: `packs/fear-signal-radar/issues/FSRA-013_dashboard-angle-picker-exports.md`

---

## Notes

- Corestack is **one desktop/control plane**, not a family of separate OS builds.
- Domain capabilities are **modules**, not separate products.
- **Security/OSINT is Module 1** and should drive the first real platform abstractions.
- Models are **open-weight-first, pluggable, and policy-governed**.
- Security is **hardened by design**, with sandboxing, gatekeeping, audit, and least-privilege defaults.
- Deployment is **self-hosted-first**; managed and commercial concerns come later.
