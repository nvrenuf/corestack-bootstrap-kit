Title: FSRA-009 End-to-end runner scripts + minimal admin queries
Target Version: 0.1.0
Priority: P1
Labels: pack:fear-signal-radar, fsra, mvp, scripts, ops, security
Owner:
Context:
Operators need repeatable commands to execute a full topic run, export reports, and inspect core DB state without manual SQL discovery each time.
Scope:
- Add topic run orchestration script.
- Add export helper script for report artifacts.
- Add minimal SQL admin queries for operational checks.
Non-Goals:
- Full workflow scheduler.
- Web admin console.
- Advanced analytics query library.
Security Requirements:
- Scripts must not bypass egress policy controls.
- Scripts must not expose secrets in stdout/stderr logs.
- Collector flow remains write-only to ingest API.
- Script parameters enforce safe defaults and bounded operations.
- Operational logs retain fetch and ingest traceability references.
Acceptance Criteria (testable bullets):
- `scripts/run_topic.sh` exists and runs collectors + synthesizer for one `topic_id` argument.
- `scripts/export_report.sh` exists and exports/copies latest report artifacts for a topic.
- `scripts/db_admin_queries.sql` exists with at least 5 queries covering run status, ingest counts, dedupe counts, latest outputs, and error counts.
- `run_topic.sh` exits non-zero when required env vars are missing.
- Scripts redact secrets from logged command output.
- README/runbook references these scripts and expected arguments.
- If any collector returns non-200 from ingest, runner exits non-zero.
- If radar_run status is not "ok" at finish, runner exits non-zero.
- If zero signals are ingested across all platforms, runner exits non-zero.
- Collector container must exit non-zero if:
  - fetch failures exceed threshold
  - ingest POST failures exceed threshold
- radar_runs.status must be set to "error" if collector aborts prematurely.
Implementation Notes:
- Keep scripts POSIX shell compatible where possible.
- Provide `set -euo pipefail` and explicit error messages.
- Admin queries should be read-only.
- Shell scripts must use `set -euo pipefail`.
- Non-zero exit codes must propagate through docker compose or orchestration layer.
Deliverables (file paths):
- scripts/run_topic.sh
- scripts/export_report.sh
- scripts/db_admin_queries.sql
Dependencies:
- FSRA-003
- FSRA-005
- FSRA-006
- FSRA-007
- FSRA-008
Definition of Done:
- Scripts execute the documented MVP workflow.
- Admin queries provide actionable status checks.
- Security and logging constraints are preserved in script behavior.
