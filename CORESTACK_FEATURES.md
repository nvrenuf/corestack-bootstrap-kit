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
- Thin disposition/status block for case/run state without introducing a report/export subsystem.

### Partially implemented
- Current surface is intentionally scoped to the present Module 1 MVP path and available linked data.

### Planned / deferred
- Deeper investigation UX (timeline, advanced graphing, richer correlation tools) and broader platform-grade forensic/reporting features.
