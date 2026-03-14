# CORESTACK_FEATURES.md

Capability-oriented source of truth for CoreStack feature status.

## Core control-plane shell and operations

### Implemented now
- Persistent desktop shell with module-aware navigation and core-owned Home/Launcher entry surfaces.
- Run, case, approval, evidence, artifact, and audit review surfaces needed for current MVP operations.

### Partially implemented
- Admin/day-2 operational depth remains minimal and intentionally thin.

### Planned / deferred
- Broader operational automation and full platform-grade admin controls.

## Governed tool gateway (web.fetch + web.search)

### Implemented now
- Tool gateway contract for `web.fetch` and `web.search` with schema validation and normalized envelope outputs.
- Allowlist enforcement, payload/response limits, timeout handling, and deny-by-default failure behavior on supported paths.
- Structured audit/security event emissions for request/result/failure with URL redaction-safe output.

### Partially implemented
- Enforcement depth is MVP-thin-slice for the currently supported tool path, not full platform breadth.

### Planned / deferred
- Expanded control coverage (broader rate-limit strategy, deeper taxonomy governance, future tool/provider matrix).

## Security/OSINT Module 1 workflow

### Implemented now
- Module registration through core module contract.
- End-to-end Alert Triage and Investigation MVP workflow with case linkage, approvals, model routing, and evidence/finding creation.
- Compatibility tests that keep this workflow aligned with hardened tool-gateway and audit/security behavior.

### Partially implemented
- Current implementation validates one supported workflow path; wider OSINT workflow families remain open.

### Planned / deferred
- Additional workflow variants, expanded evidence export/forensics, and broader module coverage.

## Integration/E2E validation harness

### Implemented now
- Narrow CI-friendly harness for the current MVP path covering golden path, malformed/disallowed denial, oversize fail-closed, timeout fail-closed, schema conformance, and normalized audit/security events.
- Repeatable runner command for local/CI execution of tool-system integration tests plus Module 1 alert-triage compatibility test.

### Partially implemented
- Focused on current MVP-supported path only.

### Planned / deferred
- Broader future-module/tool matrix and non-MVP platform-wide validation expansion.


## MVP runbook, configuration, and threat-model documentation

### Implemented now
- MVP runbook documents supported run path, required environment/configuration, validation commands, and troubleshooting for the current tool-gateway slice.
- Threat-model notes document current trust boundaries, fail-closed assumptions, audit/security-event review role, and local-first model restriction posture.
- Deferred scope is explicitly called out to avoid claiming unsupported platform-grade operations breadth.

### Partially implemented
- Documentation is intentionally scoped to the currently supported MVP path and does not yet cover full platform operations maturity.

### Planned / deferred
- Expanded operational runbooks for broader module/tool/provider matrix, enterprise hardening controls, and forensic/export depth.

## Unified investigation workspace (Security/OSINT Module 1)

### Implemented now
- Core-owned `Investigation Workspace` surface that unifies one selected investigation into one coherent operator context.
- Combined visibility for case summary, linked run summary, findings rollup, artifacts/evidence rollup, recent audit/security events, and approval/review state.
- Thin drill-in pivots between investigation workspace, run detail, case detail, files/artifacts detail, approvals queue, and filtered logs/audit context.
- Thin disposition/status block for case/run state without introducing a report/export subsystem.
- Menu labels render as product navigation (without numeric launcher prefixes).
- Operator-facing Ollama utility endpoint defaults to `http://localhost:8080` in launcher/startup surfaces.

### Partially implemented
- Current surface remains intentionally scoped to the present Module 1 MVP path and available linked data.

### Planned / deferred
- Deeper investigation UX (timeline, advanced graphing, richer correlation tools) and broader platform-grade forensic/reporting features.


## Nav surface completion and product map

### Implemented now
- All current left-nav items resolve to intentional surfaces in the shared control-plane shell.
- Existing implemented review surfaces are preserved as primary operational surfaces: Runs, Approvals, Cases / Evidence, Investigation Workspace, Files / Artifacts, and Logs / Audit.
- Agents, Policies, Models, Connectors, Settings, and Admin / Tenancy now provide truthful thin product pages with explicit ownership and capability-status framing.

### Partially implemented
- Several surfaces are intentionally status/visibility-first and do not yet include full CRUD or workflow-management tooling.

### Planned / deferred
- Full policy authoring, connector onboarding, agent orchestration administration, and tenant management UX depth.

## Policies governance workspace (core-owned)

### Implemented now
- Policies route now acts as a thin governance workspace instead of a generic placeholder.
- Surface inventory shows policy decisions attached to runs, decision outcomes, pending approval checkpoints, and governed-action coverage using existing contracts.
- Operators can see where governance applies through direct relationship framing across Runs, Approvals, Models, and Logs / Audit.

### Partially implemented
- Policy visibility is strong enough for MVP operations, but remains read-oriented and intentionally thin.

### Planned / deferred
- Policy authoring/versioning, simulation/testing, and broad enterprise policy administration remain deferred.


## Connectors governance/readiness workspace (core-owned)

### Implemented now
- Connectors route now presents a thin operator workspace for controlled integration boundaries rather than a generic placeholder.
- Implemented connector inventory is shown with explicit status framing for current paths (`web.fetch`, `web.search`) and truthful deferred lifecycle administration.
- Readiness/governance context is projected from existing contracts: tool-gateway audit/security event counts, policy outcome summary, module applicability, and local-vs-external model posture context.

### Partially implemented
- Connector visibility is read-oriented and scope-limited to current MVP-supported gateway paths.

### Planned / deferred
- Connector onboarding/provisioning UX, credential/secret lifecycle tooling, tenant-scoped connector administration, and broad connector marketplace coverage.


## Agents orchestration/readiness workspace (core-owned)

### Implemented now
- Agents route now provides a thin core-owned orchestration/readiness workspace instead of a placeholder.
- Surface projects implemented execution-role inventory and posture using existing contracts: workflow/run state, model routing/execution governance signals, tool-gateway activity, policy decisions, approvals, and correlated audit events.
- Operators can see module/workflow relationship context for agent-like behavior (for current MVP, Security / OSINT Module 1 alert-triage workflow).

### Partially implemented
- Current behavior is visibility-first and read-oriented for MVP-supported execution roles.

### Planned / deferred
- Fleet-scale multi-agent assignment/scheduling/planning and full agent lifecycle administration UX remain deferred.
