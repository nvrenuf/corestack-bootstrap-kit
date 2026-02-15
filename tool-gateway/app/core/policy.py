import os
from functools import lru_cache
from pathlib import Path
from typing import Set


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
    return os.getenv("N8N_WEB_FETCH_URL", "").strip()


def get_n8n_web_search_url() -> str:
    return os.getenv("N8N_WEB_SEARCH_URL", "").strip()
