# IMPLEMENTATION_STATUS.md

## Current phase

- MVP slice reconciliation (Core control-plane and governed tooling baseline)

## Latest issue update

- Issue name: Investigation drill-in and navigation polish (Security/OSINT Module 1 thin operator UX slice)
- Status: completed for MVP thin-slice scope (drill-in pivots and navigation polish on the existing investigation workspace path)
- Commit hash: `current branch head`
- Short note: Deepened drill-in flow between investigation workspace, run/case detail, files/artifacts detail, and logs/audit filtered context while preserving existing contracts; also removed numeric menu prefixes and switched operator-facing Ollama utility/startup endpoint defaults to `http://localhost:8080`.
- Next recommended issue: Add another thin Module 1 capability slice (new workflow capability) or return to remaining non-MVP platform hardening breadth (#18/#21).

## Completed issues (verified in `main`)

- [x] Implement persistent Corestack shell and navigation skeleton (`8cd6592`, PR #28)
- [x] Implement Home and Launcher as core-owned entry surfaces (`1a2b085`, PR #28)
- [x] Define and implement minimum run/workflow execution contract (`1c87d62`, PR #28)
- [x] Define and implement minimum case object and run-to-case linkage (`821abc0`, PR #28)
- [x] Define policy decision contract for governed actions (`0a8d76a`, PR #28)
- [x] Implement `web.fetch` and `web.search` tool contracts and schemas (`2046ecd`, PR #28)
- [x] Implement a minimal tool gateway with policy enforcement and audit hooks — hardened MVP behavior landed with stricter request validation, normalized deny/approval handling, and structured audit-compatible event emissions (`current branch head`, PR TBD).
- [x] Define the minimum evidence, artifact, and finding objects (`492f359`, PR #31)
- [x] Define and implement the approval object model and state machine (`current branch head`, PR TBD)
- [x] Add workflow approval checkpoints and approval queue/detail surfaces (`current branch head`, PR TBD)
- [x] Define and implement model registry and local-first routing contract (`current branch head`, PR TBD)
- [x] Add model execution logging and external-provider restriction hooks (`current branch head`, PR TBD)
- [x] Register Security/OSINT Module 1 through the core module contract (`current branch head`, PR TBD)
- [x] Implement first end-to-end Module 1 workflow: Alert triage and investigation (`ee7ccce`, PR TBD)
- [x] Implement run detail and case detail review surfaces (`current branch head`, PR TBD)
- [x] Implement artifact/evidence detail and linked audit lookup surfaces (`current branch head`, PR TBD)
- [x] Implement unified investigation workspace for one coherent case-linked operator review context (`current branch head`, PR TBD)
- [x] Implement investigation drill-in and navigation polish for the Module 1 workspace path (`current branch head`, PR TBD)
- [x] Docs/runbook/configuration/threat-model notes hardened for the MVP-supported operation path (`current branch head`, PR TBD); full platform-grade operations/documentation breadth remains out of scope.

## In-progress issues

- [x] Implement artifact storage linkage and metadata persistence — MVP hardening pass landed (`current branch head`, PR TBD) with stricter storage metadata normalization/validation, lifecycle consistency enforcement, and run/case/evidence/finding reference integrity checks; broad storage/export/search concerns remain out of scope.
- [x] Implement structured audit/event logging for runs, tools, evidence, and approvals (`c0fae98`, PR TBD)
- [~] Issue #18 Tool Gateway enforcement layer — MVP thin-slice enforcement hardening landed (`current branch head`, PR TBD); full issue remains open for broader rate-limit/platform breadth.
- [~] Issue #21 Audit logging + security events — MVP thin-slice hardening landed (`79e129c`, PR TBD); full issue remains open for broader observability breadth/taxonomy governance.

## Next recommended issue

- Continue remaining non-MVP breadth for #21 and #18 platform controls, then choose the next visible product capability thin-slice.

## References

- PR #28: merged MVP slice foundation commits (`8cd6592`, `1a2b085`, `1c87d62`, `821abc0`, `0a8d76a`, `2046ecd`)
- PR #29: merged minimal governed tool gateway scaffolding (`31c49b4`)

## Notes / blockers

- Convenience/UI plumbing fix: restored secondary quick links to existing platform utilities (n8n, Ollama, DB Admin/Adminer) on the Launcher surface for operator access, without changing shell architecture, workflow behavior, or roadmap scope.
- Issue 4.1 completed with a thin core-owned evidence model (evidence item, artifact, finding) including run/case linkage, provenance basics, lifecycle states, and audit reference hooks.
- Issue 4.2 completed for MVP thin-slice hardening: storage metadata is normalized/validated more strictly, artifact lifecycle and storage-state consistency is enforced, metadata integrity handling is normalized, and evidence/finding references are constrained to compatible run/case boundaries.
- Issue 5.1 + 5.2 completed in a combined thin slice with pending/approved/denied/expired approval states, run pending-approval checkpoints, queue/detail review surfaces, and approval lifecycle audit events.
- Issue 6.1 completed in a thin core-owned slice by adding a reusable model registry and local-first router contract with policy/audit compatibility hooks and structured unavailable/disallowed route failures.
- Issue 6.2 completed in a thin core-owned slice by introducing model execution audit hooks (requested/decisioned/result), correlation metadata, and external-provider restriction blocking hooks built on top of the routing contract.
- Issue 7.1 completed in a thin core-owned slice (commit `current branch head`) by adding a reusable module registration contract and registering Security/OSINT Module 1 for launcher/modules visibility without enabling marketplace behavior.
- Issue 7.2 completed in a thin end-to-end slice by adding a control-plane-launched alert triage workflow that creates/links cases, enforces approval checkpoints, executes through model routing/execution hooks, and persists evidence/artifact/finding outputs with audit event history.
- Issue 8.1 completed in a thin core-owned review slice by adding run detail and case detail surfaces that project existing run/case/evidence/artifact/finding/approval/audit data into navigable control-plane review views, including sparse-data fallback behavior.
- Issue 8.2 completed in a thin core-owned review slice by adding Files/Artifacts artifact and evidence detail projection (plus thin finding detail) with linked recent correlated audit event lookup by evidence-bearing object identifiers and sparse-data fallback behavior.
- Local repository does not contain a `main` branch ref; reconciliation was performed against the current integration branch (`work`) and its merged PR commits.
- Tool gateway MVP hardening is complete for thin-slice governed behavior; enterprise gateway controls (broad allowlist/rate-limit/platform breadth) remain intentionally out of scope and should stay tracked in broader policy/tooling issues.

- Issue 20 completed in a thin core-owned slice by introducing an Investigation Workspace route that unifies case header, linked run summary, findings/evidence/artifact rollups, approval state, and recent linked audit/security events in one operator context without introducing new object models.
