from __future__ import annotations

from datetime import UTC, datetime, timedelta
import hashlib
from time import struct_time
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sanitize import sanitize_text

_TRACKING_PARAMS = {"fbclid", "gclid", "mc_cid", "mc_eid"}


def normalize_url(url: str) -> str:
    parts = urlsplit(url)
    scheme = parts.scheme.lower()
    netloc = parts.netloc.lower()

    filtered_query = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if not (k.lower().startswith("utm_") or k.lower() in _TRACKING_PARAMS)
    ]

    path = parts.path or "/"
    query = urlencode(filtered_query, doseq=True)
    return urlunsplit((scheme, netloc, path, query, ""))


def _published_datetime(entry: dict[str, Any]) -> datetime | None:
    parsed: struct_time | None = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed is not None:
        return datetime(*parsed[:6], tzinfo=UTC)

    raw = entry.get("published") or entry.get("updated")
    if raw:
        try:
            return datetime.fromisoformat(str(raw).replace("Z", "+00:00")).astimezone(UTC)
        except ValueError:
            return None
    return None


def in_time_window(entry: dict[str, Any], *, now: datetime, time_window_days: int) -> bool:
    published_dt = _published_datetime(entry)
    if published_dt is None:
        return True

    cutoff = now - timedelta(days=max(time_window_days, 1))
    return published_dt >= cutoff


def matched_keywords(entry: dict[str, Any], keywords: list[str]) -> list[str]:
    haystack = f"{entry.get('title', '')} {entry.get('summary', '')}".lower()
    return [kw for kw in keywords if kw.lower() in haystack]


def stable_source_id(entry: dict[str, Any], normalized_url_value: str) -> str:
    guid = entry.get("id") or entry.get("guid")
    if guid:
        return str(guid)
    return hashlib.sha256(normalized_url_value.encode("utf-8")).hexdigest()


def normalize_entry(
    *,
    entry: dict[str, Any],
    topic_id: str,
    feed: str,
    matched: list[str],
) -> dict[str, Any]:
    original_url = str(entry.get("link") or "")
    normalized_url_value = normalize_url(original_url)
    source_id = stable_source_id(entry, normalized_url_value)
    published_dt = _published_datetime(entry)

    return {
        "topic_id": topic_id,
        "platform": "news",
        "content_type": "article",
        "source_id": source_id,
        "url": normalized_url_value,
        "author": entry.get("author"),
        "published_at": published_dt.isoformat().replace("+00:00", "Z") if published_dt else None,
        "title": sanitize_text(entry.get("title"), 300),
        "text_snippet": sanitize_text(entry.get("summary"), 2000),
        "engagement_json": {},
        "tags_json": {"keywords_matched": matched, "feed": feed},
        "language": "en",
        "raw_ref_json": {
            "feed": feed,
            "guid": entry.get("id") or entry.get("guid"),
            "original_url": original_url,
        },
    }
