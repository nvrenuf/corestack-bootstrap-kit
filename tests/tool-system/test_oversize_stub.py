import httpx
import pytest


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
        # Create content larger than max_bytes; fetch_url must truncate.
        big = (b"<title>Big</title>" + (b"A" * 10_000))
        return _FakeResponse(url=url, status_code=200, content=big)


@pytest.mark.asyncio
async def test_oversize_content_handling_truncates_to_max_bytes(monkeypatch) -> None:
    # This exercises the local fetch implementation truncation behavior.
    from app.core import http as http_mod

    monkeypatch.setattr(http_mod.httpx, "AsyncClient", _FakeAsyncClient)

    result = await http_mod.fetch_url(
        "https://example.com",
        timeout_ms=1000,
        max_bytes=50,
        user_agent="test-agent",
    )

    # Title should still be extractable from the truncated prefix.
    assert result.title == "Big"
    # Ensure we did not keep the full content.
    assert len(result.extracted_text) > 0
    assert len(result.extracted_text) < 5000

