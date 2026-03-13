# FSRA Ops Runbook

## Preconditions

- Docker Desktop running (for DB-backed tests).
- Python venv available at `.venv`.
- Topic config exists under `configs/topics/`.

## Standard Run (Offline)

```bash
cd packs/fear-signal-radar
scripts/run_topic.sh work-money_entry-level-collapse 7
```

Expected result:
- exit code `0`
- `outputs/<topic_id>/<run_id>/radar_report.json`
- `outputs/<topic_id>/<run_id>/radar_report.md`

## Standard Run (Online)

```bash
cd packs/fear-signal-radar
MODE=online \
INGEST_BASE_URL=http://localhost:8010 \
INGEST_TOKEN=<set-in-env> \
scripts/run_topic.sh work-money_entry-level-collapse 7
```

## Export Report Paths

```bash
scripts/export_report.sh work-money_entry-level-collapse <run-id>
```

## Failure Handling

- If any run step fails, the runner exits non-zero.
- If zero signals are available, the runner exits non-zero.
- In online mode, missing ingest env vars cause immediate exit with usage guidance.

## Incident Steps

1. Reproduce with `make doctor`.
2. Confirm ingest auth and role grants (`test_db_permissions.py`).
3. Confirm collector egress policy and allowlist routing.
4. Capture structured logs (without raw payloads).
5. Escalate with failing command, run id, and topic id.
