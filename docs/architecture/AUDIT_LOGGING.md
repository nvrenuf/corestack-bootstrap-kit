# Audit Logging Design (Stub)

## Objectives

- Provide append-only operational logs for bootstrap and post-install validation.
- Preserve event ordering and integrity hints for future compliance evidence.

## Log streams

1. **Install log** (`~/corestack/logs/install-<timestamp>.log`)
   - command milestones
   - package install and bootstrap steps
2. **Postcheck report** (`~/corestack/logs/postcheck-<timestamp>.log`)
   - endpoint probes
   - container status
   - firewall/runtime checks

## Append-only + hash-chain concept

Future implementation should write structured JSONL entries:

```text
entry_hash = SHA256(previous_hash + canonical_json(entry))
```

Suggested fields:
- `ts`, `actor`, `bootstrap`, `step`, `status`, `details`, `previous_hash`, `entry_hash`

## Tamper evidence roadmap

- Persist latest chain head in a separate protected location.
- Optionally sign chain heads with host key material.
- Export signed snapshots for compliance audits.

## Current status

Current scripts emit timestamped plaintext logs. Hash-chain support is intentionally deferred but interface-compatible with future modules.
