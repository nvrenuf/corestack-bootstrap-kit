#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE_NAME="${TOOL_SYSTEM_TEST_IMAGE:-corestack-tool-system-tests:py310}"
MODE="${1:-${TOOL_SYSTEM_TEST_MODE:-docker}}"
if [[ $# -gt 0 ]]; then
  shift
fi

run_pytest() {
  local junit
  junit="$(mktemp)"

  pytest tests/tool-system --junitxml "$junit" "$@"

  python3 - "$junit" <<'PY'
import sys
import xml.etree.ElementTree as ET

path = sys.argv[1]
root = ET.parse(path).getroot()

def as_int(value):
    if value is None:
        return 0
    return int(float(value))

skipped = 0
if root.tag == "testsuite":
    skipped = as_int(root.attrib.get("skipped"))
else:
    for suite in root.findall("testsuite"):
        skipped += as_int(suite.attrib.get("skipped"))

if skipped > 0:
    print(f"ERROR: pytest reported {skipped} skipped test(s). Schema validation must not be skipped.")
    sys.exit(1)

print("Schema enforcement check passed (no skipped tests).")
PY
}

cd "$ROOT_DIR"

if [[ "$MODE" == "docker" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker is required for docker mode" >&2
    exit 1
  fi

  if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    docker build -f scripts/tool-system/Dockerfile.test -t "$IMAGE_NAME" .
  fi

  docker run --rm \
    -v "$ROOT_DIR:/workspace" \
    -w /workspace \
    "$IMAGE_NAME" \
    "./scripts/tool-system/test.sh local $*"
  exit 0
fi

if [[ "$MODE" == "local" ]]; then
  for mod in pytest jsonschema referencing; do
    if ! python3 -c "import $mod" >/dev/null 2>&1; then
      echo "ERROR: missing Python dependency '$mod' in local mode. Use docker mode or install from vendored wheels." >&2
      exit 1
    fi
  done
  run_pytest "$@"
  exit 0
fi

echo "ERROR: unsupported mode '$MODE' (expected docker or local)" >&2
exit 1
