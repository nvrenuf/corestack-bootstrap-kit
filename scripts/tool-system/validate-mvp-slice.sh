#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

./scripts/tool-system/test.sh local \
  tests/tool-system/test_mvp_validation_harness.py \
  tests/tool-system/test_n8n_e2e.py \
  tests/tool-system/test_schema_validation.py

node --test tests/launcher/corestack-security-osint-alert-triage.test.mjs
