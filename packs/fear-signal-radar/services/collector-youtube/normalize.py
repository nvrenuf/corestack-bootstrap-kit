from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any


_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def _parse_iso8601(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def sanitize_text(value: str | None, max_len: int) -> str:
    if not value:
        return ""
    no_html = _TAG_RE.sub(" ", value)
    normalized = _WS_RE.sub(" ", no_html).strip()
    return normalized[:max_len]


def _days_since(published_at: datetime | None, now: datetime) -> float:
    if published_at is None:
        return 1.0
    delta_days = (now.date() - published_at.date()).days
    return float(max(delta_days, 1))


def normalize_video_item(
    topic_id: str,
    query: str,
    video: dict[str, Any],
    now: datetime,
) -> dict[str, Any]:
    snippet = video.get("snippet", {})
    stats = video.get("statistics", {})
    published_at_raw = snippet.get("publishedAt")
    published_at = _parse_iso8601(published_at_raw)

    view_count = int(stats.get("viewCount", 0))
    like_count = int(stats.get("likeCount", 0))
    comment_count = int(stats.get("commentCount", 0))
    days = _days_since(published_at, now)

    video_id = str(video.get("id", ""))

    return {
        "topic_id": topic_id,
        "platform": "youtube",
        "content_type": "video",
        "source_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "author": snippet.get("channelTitle"),
        "published_at": published_at_raw,
        "title": sanitize_text(snippet.get("title"), 300),
        "text_snippet": sanitize_text(snippet.get("description"), 2000),
        "engagement_json": {
            "views": view_count,
            "likes": like_count,
            "comments": comment_count,
            "views_per_day": view_count / days,
            "comments_per_day": comment_count / days,
        },
        "tags_json": {
            "query": query,
            "channel_id": snippet.get("channelId"),
        },
        "language": "en",
        "raw_ref_json": {
            "videoId": video_id,
            "query": query,
        },
    }


def normalize_comment_item(
    topic_id: str,
    query: str,
    video_id: str,
    thread: dict[str, Any],
) -> dict[str, Any]:
    top_level = thread.get("snippet", {}).get("topLevelComment", {})
    snippet = top_level.get("snippet", {})
    comment_id = top_level.get("id") or ""

    author_channel_id = snippet.get("authorChannelId", {}).get("value")

    return {
        "topic_id": topic_id,
        "platform": "youtube",
        "content_type": "comment",
        "source_id": comment_id,
        "url": f"https://www.youtube.com/watch?v={video_id}&lc={comment_id}",
        "author": snippet.get("authorDisplayName"),
        "published_at": snippet.get("publishedAt"),
        "text_snippet": sanitize_text(snippet.get("textDisplay"), 2000),
        "engagement_json": {
            "likes": int(snippet.get("likeCount", 0)),
        },
        "tags_json": {
            "query": query,
            "channel_id": author_channel_id,
        },
        "language": "en",
        "raw_ref_json": {
            "videoId": video_id,
            "commentThreadId": thread.get("id"),
            "query": query,
        },
    }


def utcnow() -> datetime:
    return datetime.now(UTC)
