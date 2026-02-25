Title: FSRA-010 Pack README + Ops runbook + Security model
Target Version: 0.1.0
Priority: P1
Labels: pack:fear-signal-radar, fsra, mvp, docs, operations, security
Owner:
Context:
MVP handoff requires documentation covering setup, operation, and security boundaries so teams can run the pack consistently and safely.
Scope:
- Write pack README with run instructions and environment variables.
- Document egress model, logging, troubleshooting, and security constraints.
- Include concise operator runbook for normal/failed runs.
Non-Goals:
- End-user dashboard documentation.
- Enterprise compliance bundle.
- Full architecture decision record collection.
Security Requirements:
- Document and enforce non-negotiable rule: no Corestack direct internet outside egress proxy.
- Document collector write-only access pattern and ingest boundary.
- Document sanitization, size caps, dedupe, and fetch logging controls.
- Include incident response steps for allowlist violations and repeated fetch failures.
- Avoid publishing secrets or raw credential examples.

### Version Governance Policy

- Any change affecting:
  - database schema
  - ingest API contract
  - SignalItem schema
  - Radar Report schema
  - scoring formula
  - clustering logic
- MUST increment the pack VERSION file following semantic versioning.
- MUST include an entry in CHANGELOG.md.
- Pull requests that modify the above without version bump are invalid.
Acceptance Criteria (testable bullets):
- `packs/fear-signal-radar/README.md` exists.
- README includes sections: `How to run`, `Environment variables`, `Egress model`, `Logging`, `Troubleshooting`, `Security model`.
- README includes at least one full run command using `scripts/run_topic.sh` and one export command using `scripts/export_report.sh`.
- README lists required env vars with descriptions and no secret literal values.
- Troubleshooting section includes at least 5 concrete failure cases with checks/actions.
- Security model section explicitly states collector write-only and no direct internet constraints.
- README documents version bump rules.
- CHANGELOG contains current 0.1.0 entry.
- VERSION file matches latest CHANGELOG version.
Implementation Notes:
- Keep command examples copy-paste ready.
- Link to topic config and schema paths.
- Include operational checklist for first successful run.
Deliverables (file paths):
- packs/fear-signal-radar/README.md
Dependencies:
- FSRA-001
- FSRA-003
- FSRA-004
- FSRA-009
Definition of Done:
- README covers setup, operation, and security with actionable detail.
- Documentation is reviewed against MVP controls and scripts.
- No secrets or unsafe defaults are included.
