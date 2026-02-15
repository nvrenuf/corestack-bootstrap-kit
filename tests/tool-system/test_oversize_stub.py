import asyncio

import httpx


class _FakeResponse:
    def __init__(self, *, url: str, status_code: int, content: bytes) -> None:
        self.url = httpx.URL(url)
        self.status_code = status_code
        self.content = content


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs) -> None:
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url: str):
        big = (b"<title>Big</title>" + (b"A" * 10_000))
        return _FakeResponse(url=url, status_code=200, content=big)


def test_oversize_content_handling_truncates_to_max_bytes(monkeypatch) -> None:
    async def _run() -> None:
        from app.core import http as http_mod

        monkeypatch.setattr(http_mod.httpx, "AsyncClient", _FakeAsyncClient)

        result = await http_mod.fetch_url(
            "https://example.com",
            timeout_ms=1000,
            max_bytes=50,
            user_agent="test-agent",
        )

        assert result.title == "Big"
        assert len(result.extracted_text) > 0
        assert len(result.extracted_text) < 5000

    asyncio.run(_run())
