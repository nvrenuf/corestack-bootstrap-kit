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
- [x] Define the minimum evidence, artifact, and finding objects (`492f359`, PR pending)
- [x] Implement artifact storage linkage and metadata persistence (`69e72a7`, PR pending)

## In-progress issues

- [ ] Implement a minimal tool gateway with policy enforcement and audit hooks — scaffolding landed (`31c49b4`, PR #29), but full enforcement acceptance criteria remain open.

## Next recommended issue

- Issue 4.3: Implement structured audit/event logging for runs, tools, evidence, and approvals.

## References

- PR #28: merged MVP slice foundation commits (`8cd6592`, `1a2b085`, `1c87d62`, `821abc0`, `0a8d76a`, `2046ecd`)
- PR #29: merged minimal governed tool gateway scaffolding (`31c49b4`)

## Notes / blockers

- Issue 4.1 completed with a thin core-owned evidence model (evidence item, artifact, finding) including run/case linkage, provenance basics, lifecycle states, and audit reference hooks.
- Issue 4.2 completed by adding thin artifact storage metadata persistence, normalized `storageRef` shape, run/case linkage validation, and artifact/evidence reference integrity checks.
- Local repository does not contain a `main` branch ref; reconciliation was performed against the current integration branch (`work`) and its merged PR commits.
- Tool gateway hardening items (full allowlist/rate-limit/payload limit behavior) should remain tracked as incomplete until acceptance criteria are fully met.
