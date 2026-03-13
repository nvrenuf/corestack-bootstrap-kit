from __future__ import annotations

import re

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_SCRIPT_STYLE_RE = re.compile(
    r"<(script|style|iframe)[^>]*>.*?</\1>",
    flags=re.IGNORECASE | re.DOTALL,
)


def sanitize_text(value: str | None, max_len: int) -> str:
    if not value:
        return ""
    cleaned = _SCRIPT_STYLE_RE.sub(" ", value)
    cleaned = _TAG_RE.sub(" ", cleaned)
    cleaned = _WS_RE.sub(" ", cleaned).strip()
    return cleaned[:max_len]
