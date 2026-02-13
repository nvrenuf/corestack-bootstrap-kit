#!/usr/bin/env bash
set -euo pipefail

./scripts/lib/preflight.sh

CORESTACK_HOME="${HOME}/corestack-smoke" ./scripts/granite/render-compose.sh

test -f build/granite/docker-compose.yml
test -f build/granite/Caddyfile

echo "smoke_granite complete"
