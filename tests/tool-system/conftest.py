import os
import sys
from pathlib import Path


def pytest_configure() -> None:
    # Allow `import app.*` from `tool-gateway/app/...` without installing a package.
    repo_root = Path(__file__).resolve().parents[2]
    tool_gateway_root = repo_root / "tool-gateway"
    sys.path.insert(0, str(tool_gateway_root))

    # Keep tests deterministic.
    os.environ.setdefault("TOOL_BACKEND", "local")

