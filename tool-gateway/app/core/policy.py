import os
import time
from collections import deque
from functools import lru_cache
from pathlib import Path
from typing import Deque, Dict, Set


def _parse_allowlist(raw: str) -> Set[str]:
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


@lru_cache(maxsize=1)
def load_allowlist() -> Set[str]:
    file_path = os.getenv("WEB_ALLOWLIST_FILE", "").strip()
    if file_path:
        path = Path(file_path)
        if path.exists():
            values = []
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                values.append(line.lower())
            return set(values)
    return _parse_allowlist(os.getenv("WEB_ALLOWLIST", ""))


def is_allowed_host(hostname: str) -> bool:
    allowlist = load_allowlist()
    if not allowlist:
        return False
    # Explicit wildcard opt-in (used for the "marketing" deployment profile).
    if "*" in allowlist:
        return True
    return hostname.lower() in allowlist


def get_timeout_ms() -> int:
    return int(os.getenv("WEB_TIMEOUT_MS", "8000"))


def get_max_bytes() -> int:
    return int(os.getenv("WEB_MAX_BYTES", "1500000"))


def get_tool_backend() -> str:
    return os.getenv("TOOL_BACKEND", "local").strip().lower() or "local"


def get_n8n_web_fetch_url() -> str:
    return os.getenv("N8N_WEB_FETCH_URL", "http://n8n:5678/webhook/tools/web.fetch").strip()


def get_n8n_web_search_url() -> str:
    return os.getenv("N8N_WEB_SEARCH_URL", "http://n8n:5678/webhook/tools/web.search").strip()


def get_tool_shared_secret() -> str:
    return os.getenv("TOOL_SHARED_SECRET", "").strip()


def get_rate_limit_per_minute() -> int:
    return max(1, int(os.getenv("TOOL_RATE_LIMIT_PER_MINUTE", "120")))


class RateLimiter:
    def __init__(self) -> None:
        self._events: Dict[str, Deque[float]] = {}

    def allow(self, key: str, limit_per_minute: int) -> bool:
        now = time.monotonic()
        window_start = now - 60.0
        bucket = self._events.setdefault(key, deque())
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= limit_per_minute:
            return False
        bucket.append(now)
        return True


rate_limiter = RateLimiter()
