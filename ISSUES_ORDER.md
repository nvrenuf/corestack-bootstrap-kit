# ISSUES_ORDER.md — Corestack Execution Order

This file defines the build order for Corestack, grouped into milestones with clear priorities.
Rule: **Corestack base stays lean.** Domain “agents” ship as **packs** on top of these primitives.

---

## Milestone 1 — Tool System MVP (P0/P1)

Goal: Prove Corestack as an “agent OS” by delivering a secure, testable, documented tool system that any pack can use.

### Epic: Controlled Internet Access (Tool Gateway + n8n)  #16 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/16
1. **Define and implement Corestack control plane architecture**  #2 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/2  
   Owner: TBD  
   - [ ] Define base services and control surfaces (CLI first)  
   - [ ] Define profile/pack lifecycle hooks (install/up/down/status/logs)  
   - [ ] Define config/env conventions and storage paths

2. **Design and build policy engine and tool gating**  #4 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/4  
   Owner: TBD  
   - [ ] Policy model (allowlist/denylist, rate-limit, timeouts, size limits)  
   - [ ] Decision logging format (audit events)  
   - [ ] Safe defaults (deny-by-default for secure profile)

3. **Define tool schemas: web.fetch + web.search**  #17 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/17  
   Owner: TBD  
   - [ ] JSON schema for each tool request/response  
   - [ ] Error model and normalization rules  
   - [ ] Tool metadata (capabilities, limits, required permissions)

4. **Implement Tool Gateway enforcement layer (allowlist, rate limit, payload validation)**  #18 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/18  
   Owner: TBD  
   - [ ] Validate inputs against schema  
   - [ ] Enforce allowlist + file-based allowlist support  
   - [ ] Enforce rate limits, max bytes, timeouts  
   - [ ] Return normalized errors

5. **Wire Tool Gateway → n8n (routing, auth header/shared secret, response normalization)**  #20 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/20  
   Owner: TBD  
   - [ ] Shared secret / auth header between gateway and n8n  
   - [ ] Route web.fetch/web.search to correct webhook endpoints  
   - [ ] Normalize n8n responses to tool schemas  
   - [ ] Handle retries and timeouts safely

6. **Build n8n workflows for web.fetch (HTTP request) and web.search (search provider)**  #19 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/19  
   Owner: TBD  
   - [ ] web.fetch workflow: fetch → parse → limits → return  
   - [ ] web.search workflow: provider call → normalize → return  
   - [ ] Provider-agnostic config placeholders (keys via credentials)

7. **Add audit logging + security events (requests, domains, decisions, failures)**  #21 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/21  
   Owner: TBD  
   - [ ] Structured event format (JSON)  
   - [ ] Log decisions (allow/deny) + reasons  
   - [ ] Include domain, tool, requester, size, duration, status  
   - [ ] Redaction rules for secrets

8. **Integration tests + validation harness (E2E, negative tests, allowlist tests)**  #22 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/22  
   Owner: TBD  
   - [ ] Golden-path E2E for web.fetch and web.search  
   - [ ] Negative tests: blocked domain, oversize payload, timeout, rate limit  
   - [ ] Contract tests for schema conformance  
   - [ ] CI-friendly runner

9. **Docs: runbook + configuration + threat model notes**  #23 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/23  
   Owner: TBD  
   - [ ] How to run base + tool system  
   - [ ] How to configure allowlists safely  
   - [ ] Threat model: egress, prompt injection via retrieved content, SSRF, data exfil  
   - [ ] Operational troubleshooting (logs, common failures)

---

## Milestone 2 — Packs + Ops Maturity (P2)

Goal: Make the platform stable to build and ship multiple paid packs.

10. **Establish tool ecosystem packaging, distribution, and security**  #11 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/11  
    Owner: TBD  
    - [ ] Pack contract (pack.json + compose + assets)  
    - [ ] Pack install/update/remove flow (CLI)  
    - [ ] Pack provenance (signing/checksums)  
    - [ ] Secrets separation per pack

11. **Build workflow engine and orchestration layer**  #10 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/10  
    Owner: TBD  
    - [ ] Standard pipeline patterns (research → draft → QA → publish)  
    - [ ] Manual gates support  
    - [ ] Artifact storage conventions

12. **Implement model management and routing layer**  #9 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/9  
    Owner: TBD  
    - [ ] Provider routing rules (local vs online)  
    - [ ] Per-pack model selection  
    - [ ] Cost/latency constraints

13. **Develop comprehensive observability, audit, and forensics functionality**  #8 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/8  
    Owner: TBD  
    - [ ] Dashboards for tool usage and failures  
    - [ ] Exportable audit trails  
    - [ ] Forensics-friendly retention

14. **Define data lifecycle and privacy controls**  #6 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/6  
    Owner: TBD  
    - [ ] Retention policies per pack  
    - [ ] Redaction + PII handling  
    - [ ] Deletion workflows

15. **Develop evaluation harness and quality gates**  #13 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/13  
    Owner: TBD  
    - [ ] Output validators (citations, banned claims, safety)  
    - [ ] Regression tests for packs  
    - [ ] Quality scoring gates

16. **Define product surface area: UI/UX, admin, and day‑2 operations**  #12 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/12  
    Owner: TBD  
    - [ ] Stack Manager UI (start/stop/status)  
    - [ ] Pack catalog view (installed/available)  
    - [ ] Backup/restore workflows

---

## Milestone 3 — Enterprise + Commercial (P3)

Goal: Make Corestack enterprise-deployable and sellable with procurement-ready posture.

17. **Integrate enterprise-grade identity and authorization**  #3 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/3  
    Owner: TBD  
    - [ ] SSO/OIDC integration path  
    - [ ] Role-based access controls  
    - [ ] Per-pack permissions

18. **Implement multi-tenant isolation and segregation**  #5 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/5  
    Owner: TBD  
    - [ ] Tenant scoping for tools/data/logs  
    - [ ] Isolation boundaries and enforcement  
    - [ ] Tenant-level allowlists and keys

19. **Plan commercial readiness: deployment options, licensing, and procurement**  #14 — https://github.com/nvrenuf/corestack-bootstrap-kit/issues/14  
    Owner: TBD  
    - [ ] Packaging (self-host, managed, airgapped options)  
    - [ ] Licensing/entitlement model for paid packs  
    - [ ] Security documentation bundle (SOC2 mapping, threat model, SBOM)

---

## Notes

- “Controlled Internet Access (Tool Gateway + n8n)” is **not the whole platform**; it is the **first proof** of the Tool System MVP (Milestone 1).
- Packs (e.g., Marketing, OSINT, SHIELD) should not add complexity to the base. They consume the primitives above.
