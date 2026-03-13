from __future__ import annotations

import importlib
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest


PACK_DIR = Path(__file__).resolve().parents[1]
SERVICE_ROOT = PACK_DIR / "services" / "collector-youtube"


def _load_module(module_name: str):
    service_path = str(SERVICE_ROOT)
    if service_path not in sys.path:
        sys.path.insert(0, service_path)

    for stale in ["youtube_collector", "client", "models", "normalize"]:
        if stale in sys.modules:
            del sys.modules[stale]

    return importlib.import_module(module_name)


def test_run_youtube_collector_returns_normalized_items(monkeypatch):
    collector = _load_module("youtube_collector")

    monkeypatch.setenv("YOUTUBE_API_KEY", "test-key")
    monkeypatch.delenv("EGRESS_PROXY_URL", raising=False)

    long_title = "T" * 400
    long_description = "<div>desc</div> " + ("D" * 2500)
    long_comment = "<b>comment</b> " + ("C" * 2500)

    video_rows = [
        {
            "id": "video-1",
            "snippet": {
                "publishedAt": "2026-02-15T00:00:00Z",
                "channelId": "channel-1",
                "channelTitle": "Channel One",
                "title": long_title,
                "description": long_description,
            },
            "statistics": {
                "viewCount": "100",
                "likeCount": "5",
                "commentCount": "10",
            },
        }
    ]
    comment_rows = [
        {
            "id": "thread-1",
            "snippet": {
                "topLevelComment": {
                    "id": "comment-1",
                    "snippet": {
                        "authorDisplayName": "Commenter",
                        "authorChannelId": {"value": "author-channel"},
                        "publishedAt": "2026-02-20T00:00:00Z",
                        "textDisplay": long_comment,
                        "likeCount": 7,
                    },
                }
            },
        }
    ]

    class FakeYouTubeClient:
        def __init__(self, api_key: str, proxy_url: str | None = None):
            assert api_key == "test-key"
            assert proxy_url is None

        def search_videos(self, query: str, published_after_iso: str, max_results: int):
            assert query == "market fear"
            assert published_after_iso.endswith("Z")
            assert max_results == 2
            return ["video-1"]

        def get_videos(self, video_ids: list[str]):
            assert video_ids == ["video-1"]
            return video_rows

        def get_top_comments(self, video_id: str, max_comments: int):
            assert video_id == "video-1"
            assert max_comments == 1
            return comment_rows

    monkeypatch.setattr(collector, "YouTubeClient", FakeYouTubeClient)

    items = collector.run_youtube_collector(
        topic_id="work-money_entry-level-collapse",
        queries=["market fear"],
        time_window_days=10,
        max_videos_per_query=2,
        max_comments_per_video=1,
    )

    assert len(items) == 2

    video_item = items[0]
    assert video_item["platform"] == "youtube"
    assert video_item["content_type"] == "video"
    assert video_item["source_id"] == "video-1"
    assert video_item["url"] == "https://www.youtube.com/watch?v=video-1"
    assert video_item["engagement_json"]["views"] == 100
    assert video_item["engagement_json"]["comments"] == 10
    assert video_item["engagement_json"]["views_per_day"] == pytest.approx(10.0)
    assert video_item["engagement_json"]["comments_per_day"] == pytest.approx(1.0)
    assert len(video_item["title"]) == 300
    assert len(video_item["text_snippet"]) == 2000
    assert "<" not in video_item["text_snippet"]

    comment_item = items[1]
    assert comment_item["platform"] == "youtube"
    assert comment_item["content_type"] == "comment"
    assert comment_item["source_id"] == "comment-1"
    assert comment_item["url"] == "https://www.youtube.com/watch?v=video-1&lc=comment-1"
    assert comment_item["engagement_json"]["likes"] == 7
    assert len(comment_item["text_snippet"]) == 2000
    assert "<" not in comment_item["text_snippet"]


def test_run_youtube_collector_requires_api_key(monkeypatch):
    collector = _load_module("youtube_collector")
    monkeypatch.delenv("YOUTUBE_API_KEY", raising=False)

    with pytest.raises(RuntimeError, match="YOUTUBE_API_KEY"):
        collector.run_youtube_collector(topic_id="topic", queries=["query"])


def test_youtube_client_proxy_wiring(monkeypatch):
    client_mod = _load_module("client")

    calls: dict[str, object] = {}

    class FakeHttpClient:
        def __init__(self, **kwargs):
            calls["kwargs"] = kwargs

    monkeypatch.setattr(client_mod.httpx, "Client", FakeHttpClient)

    client_mod.YouTubeClient(api_key="k", proxy_url="http://proxy.internal:8080")

    kwargs = calls["kwargs"]
    assert kwargs["base_url"] == "https://www.googleapis.com/youtube/v3"
    assert kwargs["timeout"] == 15.0
    assert kwargs["proxy"] == "http://proxy.internal:8080"


def test_youtube_client_methods_parse_mocked_api_responses(monkeypatch):
    client_mod = _load_module("client")

    class FakeResponse:
        def __init__(self, payload: dict):
            self._payload = payload

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return self._payload

    class FakeHttpClient:
        def __init__(self, **kwargs):
            self.calls: list[SimpleNamespace] = []

        def get(self, path: str, params: dict):
            self.calls.append(SimpleNamespace(path=path, params=params))
            if path == "/search":
                token = params.get("pageToken")
                if token is None:
                    return FakeResponse(
                        {
                            "items": [{"id": {"videoId": "v1"}}],
                            "nextPageToken": "next",
                        }
                    )
                return FakeResponse({"items": [{"id": {"videoId": "v2"}}]})

            if path == "/videos":
                return FakeResponse({"items": [{"id": "v1"}, {"id": "v2"}]})

            if path == "/commentThreads":
                return FakeResponse({"items": [{"id": "thread-1"}]})

            raise AssertionError(f"unexpected path {path}")

    fake_client = FakeHttpClient()
    monkeypatch.setattr(client_mod.httpx, "Client", lambda **kwargs: fake_client)

    yt = client_mod.YouTubeClient(api_key="secret")
    ids = yt.search_videos(query="fear", published_after_iso="2026-01-01T00:00:00Z", max_results=2)
    assert ids == ["v1", "v2"]

    videos = yt.get_videos(["v1", "v2"])
    assert [v["id"] for v in videos] == ["v1", "v2"]

    comments = yt.get_top_comments("v1", 3)
    assert comments == [{"id": "thread-1"}]

    assert fake_client.calls[0].path == "/search"
    assert fake_client.calls[1].path == "/search"
    assert fake_client.calls[2].path == "/videos"
    assert fake_client.calls[3].path == "/commentThreads"
