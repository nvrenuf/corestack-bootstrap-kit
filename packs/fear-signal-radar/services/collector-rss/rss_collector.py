from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from normalize import in_time_window, matched_keywords, normalize_entry, normalize_url
from parse import fetch_feed_entries


def utcnow() -> datetime:
    return datetime.now(UTC)


def run_rss_collector(
    topic_id: str,
    feeds: list[str],
    keywords: list[str],
    time_window_days: int = 7,
    max_items_per_feed: int = 25,
) -> list[dict]:
    items: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    now = utcnow()

    for feed in feeds:
        entries = fetch_feed_entries(feed)
        for entry in entries[: max(max_items_per_feed, 0)]:
            matches = matched_keywords(entry, keywords)
            if not matches:
                continue
            if not in_time_window(entry, now=now, time_window_days=time_window_days):
                continue

            raw_url = str(entry.get("link") or "")
            normalized = normalize_url(raw_url)
            if not normalized or normalized in seen_urls:
                continue

            seen_urls.add(normalized)
            items.append(
                normalize_entry(
                    entry=entry,
                    topic_id=topic_id,
                    feed=feed,
                    matched=matches,
                )
            )

    return items
