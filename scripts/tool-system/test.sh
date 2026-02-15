#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE_NAME="${TOOL_SYSTEM_TEST_IMAGE:-corestack-tool-system-tests:py311}"
MODE="${1:-${TOOL_SYSTEM_TEST_MODE:-docker}}"
if [[ $# -gt 0 ]]; then
  shift
fi

check_skips() {
  local junit="$1"
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
    echo "WARN: docker is not available; falling back to local mode." >&2
    MODE="local"
  else
    docker build -f tests/tool-system/Dockerfile -t "$IMAGE_NAME" .

    tmp_dir="$(mktemp -d)"
    trap 'rm -rf "$tmp_dir"' EXIT

    docker run --rm \
      --read-only \
      -v "$ROOT_DIR:/workspace:ro" \
      -v "$tmp_dir:/tmp" \
      -w /workspace \
      --user "$(id -u):$(id -g)" \
      -e PYTHONPYCACHEPREFIX=/tmp/pycache \
      "$IMAGE_NAME" \
      tests/tool-system \
      --junitxml /tmp/pytest.junit.xml \
      -o cache_dir=/tmp/pytest-cache \
      "$@"

    check_skips "$tmp_dir/pytest.junit.xml"
    exit 0
  fi
fi

if [[ "$MODE" == "local" ]]; then
  export PYTHONPATH="$ROOT_DIR/vendor/python${PYTHONPATH:+:$PYTHONPATH}"

  for mod in pytest jsonschema referencing httpx; do
    if ! python3 -c "import $mod" >/dev/null 2>&1; then
      echo "ERROR: missing Python dependency '$mod' in local mode." >&2
      exit 1
    fi
  done

  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  pytest tests/tool-system \
    --junitxml "$tmp_dir/pytest.junit.xml" \
    -o cache_dir="$tmp_dir/pytest-cache" \
    "$@"

  check_skips "$tmp_dir/pytest.junit.xml"
  exit 0
fi

echo "ERROR: unsupported mode '$MODE' (expected docker or local)" >&2
exit 1
