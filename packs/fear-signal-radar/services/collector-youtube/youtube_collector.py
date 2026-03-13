from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

from client import YouTubeClient
from normalize import normalize_comment_item, normalize_video_item, utcnow


def _published_after_iso(time_window_days: int, now: datetime) -> str:
    cutoff = now - timedelta(days=max(time_window_days, 1))
    return cutoff.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def run_youtube_collector(
    topic_id: str,
    queries: list[str],
    time_window_days: int = 7,
    max_videos_per_query: int = 10,
    max_comments_per_video: int = 3,
) -> list[dict]:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise RuntimeError("YOUTUBE_API_KEY is required")

    proxy_url = os.getenv("EGRESS_PROXY_URL")
    client = YouTubeClient(api_key=api_key, proxy_url=proxy_url)

    now = utcnow()
    published_after = _published_after_iso(time_window_days, now)

    signal_items: list[dict] = []
    for query in queries:
        if not query.strip():
            continue

        video_ids = client.search_videos(
            query=query,
            published_after_iso=published_after,
            max_results=max_videos_per_query,
        )
        video_rows = client.get_videos(video_ids)

        for video in video_rows:
            video_item = normalize_video_item(topic_id=topic_id, query=query, video=video, now=now)
            signal_items.append(video_item)

            video_id = video_item["source_id"]
            comment_rows = client.get_top_comments(video_id=video_id, max_comments=max_comments_per_video)
            for thread in comment_rows:
                signal_items.append(
                    normalize_comment_item(
                        topic_id=topic_id,
                        query=query,
                        video_id=video_id,
                        thread=thread,
                    )
                )

    return signal_items
