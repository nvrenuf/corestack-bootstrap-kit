from __future__ import annotations

import time
from typing import Any

import httpx


class YouTubeClient:
    """Minimal YouTube Data API v3 HTTP wrapper."""

    def __init__(
        self,
        api_key: str,
        proxy_url: str | None = None,
        http_client: httpx.Client | None = None,
        sleep_fn: Any = time.sleep,
    ) -> None:
        if not api_key:
            raise ValueError("YOUTUBE_API_KEY is required")

        self.api_key = api_key
        self.sleep_fn = sleep_fn
        if http_client is not None:
            self._client = http_client
            return

        kwargs: dict[str, Any] = {
            "base_url": "https://www.googleapis.com/youtube/v3",
            "timeout": 15.0,
        }
        if proxy_url:
            kwargs["proxy"] = proxy_url

        self._client = httpx.Client(**kwargs)

    def search_videos(self, query: str, published_after_iso: str, max_results: int) -> list[str]:
        ids: list[str] = []
        page_token: str | None = None

        while len(ids) < max_results:
            remaining = max_results - len(ids)
            per_page = min(remaining, 50)
            params: dict[str, Any] = {
                "part": "id",
                "type": "video",
                "order": "date",
                "q": query,
                "publishedAfter": published_after_iso,
                "maxResults": per_page,
                "key": self.api_key,
            }
            if page_token:
                params["pageToken"] = page_token

            response = self._client.get("/search", params=params)
            response.raise_for_status()
            payload = response.json()

            for item in payload.get("items", []):
                video_id = item.get("id", {}).get("videoId")
                if video_id:
                    ids.append(video_id)
                    if len(ids) >= max_results:
                        break

            page_token = payload.get("nextPageToken")
            if not page_token:
                break

        return ids

    def get_videos(self, video_ids: list[str]) -> list[dict[str, Any]]:
        if not video_ids:
            return []

        response = self._client.get(
            "/videos",
            params={
                "part": "snippet,statistics",
                "id": ",".join(video_ids),
                "maxResults": min(len(video_ids), 50),
                "key": self.api_key,
            },
        )
        response.raise_for_status()
        return response.json().get("items", [])

    def get_top_comments(self, video_id: str, max_comments: int) -> list[dict[str, Any]]:
        if max_comments <= 0:
            return []

        response = self._client.get(
            "/commentThreads",
            params={
                "part": "snippet",
                "videoId": video_id,
                "maxResults": min(max_comments, 100),
                "textFormat": "plainText",
                "order": "relevance",
                "key": self.api_key,
            },
        )
        response.raise_for_status()
        return response.json().get("items", [])
