#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$PACK_ROOT"

if [[ ! -f .venv/bin/activate ]]; then
  cat <<'EOF'
Missing virtual environment at .venv.
Create it with:
  python3 -m venv .venv
  source .venv/bin/activate
  python -m pip install -U pip setuptools wheel
  python -m pip install -e .[dev]
EOF
  exit 2
fi

# shellcheck disable=SC1091
source .venv/bin/activate
exec bash scripts/fsra_doctor.sh
