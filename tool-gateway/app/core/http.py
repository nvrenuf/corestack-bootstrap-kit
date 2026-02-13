import re
from dataclasses import dataclass

import httpx


@dataclass
class FetchResult:
    final_url: str
    status_code: int
    title: str
    extracted_text: str


_title_re = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
_tag_re = re.compile(r"<[^>]+>")
_space_re = re.compile(r"\s+")


def _extract_title(html: str) -> str:
    match = _title_re.search(html)
    if not match:
        return ""
    return _space_re.sub(" ", match.group(1)).strip()


def _extract_text(content: str) -> str:
    without_tags = _tag_re.sub(" ", content)
    normalized = _space_re.sub(" ", without_tags).strip()
    return normalized[:12000]


async def fetch_url(url: str, timeout_ms: int, max_bytes: int, user_agent: str) -> FetchResult:
    timeout = httpx.Timeout(timeout_ms / 1000.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers={"User-Agent": user_agent}) as client:
        response = await client.get(url)
        body_bytes = response.content[:max_bytes]
        text = body_bytes.decode("utf-8", errors="ignore")
        title = _extract_title(text)
        extracted_text = _extract_text(text)
        return FetchResult(
            final_url=str(response.url),
            status_code=response.status_code,
            title=title,
            extracted_text=extracted_text,
        )


async def post_json(url: str, payload: dict, timeout_ms: int) -> dict:
    timeout = httpx.Timeout(timeout_ms / 1000.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        return response.json()
