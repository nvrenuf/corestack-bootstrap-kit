import json
from datetime import datetime, timezone
from typing import Any, Dict


def log_event(event: Dict[str, Any]) -> None:
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **event,
    }
    print(json.dumps(payload, separators=(",", ":"), ensure_ascii=True), flush=True)
