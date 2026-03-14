# IMPLEMENTATION_STATUS.md

## Current phase

- MVP slice reconciliation (Core control-plane and governed tooling baseline)

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

## In-progress issues

- [x] Implement artifact storage linkage and metadata persistence — MVP hardening pass landed (`current branch head`, PR TBD) with stricter storage metadata normalization/validation, lifecycle consistency enforcement, and run/case/evidence/finding reference integrity checks; broad storage/export/search concerns remain out of scope.
- [x] Implement structured audit/event logging for runs, tools, evidence, and approvals (`c0fae98`, PR TBD)

## Next recommended issue

- Issue 8.1: Implement run detail and case detail review surfaces (artifact linkage base is now hardened for MVP).

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
- Local repository does not contain a `main` branch ref; reconciliation was performed against the current integration branch (`work`) and its merged PR commits.
- Tool gateway MVP hardening is complete for thin-slice governed behavior; enterprise gateway controls (broad allowlist/rate-limit/platform breadth) remain intentionally out of scope and should stay tracked in broader policy/tooling issues.
