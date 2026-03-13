# Fear Signal Radar (FSRA)

Fear Signal Radar is a Corestack pack that ingests platform signals, clusters fear themes, scores severity, and exports operator-ready reports (JSON + Markdown).

## MVP Scope

- Topic config validation and example topic config
- Write-only ingest API with token auth, sanitization, and dedupe
- Collector stubs/modules (YouTube, RSS) that normalize SignalItems
- Synthesizer agent with deterministic clustering/scoring/report export
- Runner scripts for local/offline and online orchestrations

## How To Run

### Test Commands

```bash
make doctor
make test-fast
make test-db
```

`make doctor` validates Docker/testcontainers wiring and runs the full pack test sequence.

### End-To-End Runner

Offline run (default mode):

```bash
scripts/run_topic.sh work-money_entry-level-collapse 7
```

Online run (requires ingest API):

```bash
MODE=online \
INGEST_BASE_URL=http://localhost:8010 \
INGEST_TOKEN=<set-in-env> \
scripts/run_topic.sh work-money_entry-level-collapse 7
```

Export generated report paths:

```bash
scripts/export_report.sh work-money_entry-level-collapse <run-id>
```

## Environment Variables

- `INGEST_TOKEN`: bearer token expected by ingest API.
- `INGEST_BASE_URL`: base URL for ingest API (`MODE=online` only).
- `MODE`: runner mode. `offline` (default) or `online`.
- `FSRA_OUTPUT_BASE`: override report output location (default `packs/fear-signal-radar/outputs`).
- `YOUTUBE_API_KEY`: required by YouTube collector runtime (not used in unit tests).
- `EGRESS_PROXY_URL`: optional proxy endpoint for collector outbound traffic.
- `INGEST_DB_HOST`, `INGEST_DB_PORT`, `INGEST_DB_NAME`, `INGEST_DB_USER`, `INGEST_DB_PASSWORD`: ingest API DB connection settings.

## Egress Model

- Corestack services are no-internet by default.
- Collectors are the only components allowed to call external sources.
- Collector egress must route through an allowlisted proxy (`EGRESS_PROXY_URL`) in production.
- Ingest and synthesizer components do not require outbound internet access.

## Logging

- Ingest API emits structured ingestion logs only.
- Logs include request metadata (request id, collector id, topic id, platform, URL, status, dedupe state, duration, bytes in).
- Raw full content is not logged.

## Troubleshooting

1. `make doctor` fails with Docker socket errors: start Docker Desktop and re-run.
2. `permission denied for table signal_items`: verify migration grants and role inheritance (`ingest_api INHERIT` + membership in `ingest_writer`).
3. Ingest `401`: check `Authorization: Bearer <INGEST_TOKEN>` and env value.
4. `413 Payload Too Large`: reduce payload size or raise configured ingest body limit.
5. Runner exits with `No signals available`: confirm topic/source loader returns data for the run id.

## Security Model

- Ingest API is write-only for collectors; no signal read endpoints are exposed.
- DB role model uses NOLOGIN privilege roles (`ingest_writer`, `synth_reader`) and LOGIN service roles (`ingest_api`, `synth_api`) via role membership.
- Ingest login role must not have direct SELECT on `signal_items`.
- Collectors do not hold DB credentials; they emit normalized payloads to ingest.

## Version Governance Policy

Any change affecting database schema, ingest API contract, SignalItem schema, Radar Report schema, scoring formula, or clustering logic must:

1. bump `VERSION` using semantic versioning,
2. add a `CHANGELOG.md` entry,
3. keep `VERSION` aligned with latest changelog version.

## Known Limitations

- FSRA-011: no historical trend persistence yet.
- FSRA-012: no evidence verification/citation layer yet.
- FSRA-013: no dashboard/angle picker UI yet.
