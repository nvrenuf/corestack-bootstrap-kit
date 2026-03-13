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
- [x] Define the minimum evidence, artifact, and finding objects (`492f359`, PR #31)
- [x] Define and implement the approval object model and state machine (`current branch head`, PR TBD)
- [x] Add workflow approval checkpoints and approval queue/detail surfaces (`current branch head`, PR TBD)

## In-progress issues

- [ ] Implement a minimal tool gateway with policy enforcement and audit hooks — scaffolding landed (`31c49b4`, PR #29), but full enforcement acceptance criteria remain open.
- [ ] Implement artifact storage linkage and metadata persistence — thin linkage landed (`69e72a7`, PR #32), but full lifecycle and hardening acceptance criteria remain open.
- [x] Implement structured audit/event logging for runs, tools, evidence, and approvals (`c0fae98`, PR TBD)

## Next recommended issue

- Issue 6.1: Define and implement the model registry and local-first routing contract.

## References

- PR #28: merged MVP slice foundation commits (`8cd6592`, `1a2b085`, `1c87d62`, `821abc0`, `0a8d76a`, `2046ecd`)
- PR #29: merged minimal governed tool gateway scaffolding (`31c49b4`)

## Notes / blockers

- Issue 4.1 completed with a thin core-owned evidence model (evidence item, artifact, finding) including run/case linkage, provenance basics, lifecycle states, and audit reference hooks.
- Issue 4.2 has thin artifact storage metadata persistence landed (normalized `storageRef`, run/case linkage validation, artifact/evidence reference checks), but remains in progress for full lifecycle/hardening acceptance criteria.
- Issue 5.1 + 5.2 completed in a combined thin slice with pending/approved/denied/expired approval states, run pending-approval checkpoints, queue/detail review surfaces, and approval lifecycle audit events.
- Local repository does not contain a `main` branch ref; reconciliation was performed against the current integration branch (`work`) and its merged PR commits.
- Tool gateway hardening items (full allowlist/rate-limit/payload limit behavior) should remain tracked as incomplete until acceptance criteria are fully met.
