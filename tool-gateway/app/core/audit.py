import json
import os
from datetime import datetime, timezone
from typing import Any, Dict


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _audit_path() -> str:
    return os.getenv("AUDIT_LOG_PATH", "").strip()


def emit_tool_event(event: Dict[str, Any]) -> None:
    """
    Emit a single JSONL audit event.

    Default sink: stdout.
    Optional sink: append to AUDIT_LOG_PATH.

    Audit logging must never break tool execution; failures are swallowed.
    """
    payload = {"timestamp": _now_iso(), **event}
    line = json.dumps(payload, separators=(",", ":"), ensure_ascii=True)

    try:
        path = _audit_path()
        if path:
            with open(path, "a", encoding="utf-8") as f:
                f.write(line)
                f.write("\n")
                f.flush()
            return
        print(line, flush=True)
    except Exception:  # noqa: BLE001
        # Best-effort fallback: do not fail the request path due to logging.
        try:
            print(line, flush=True)
        except Exception:  # noqa: BLE001
            return

