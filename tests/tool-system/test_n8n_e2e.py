import asyncio
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import httpx
import pytest

jsonschema = pytest.importorskip("jsonschema")
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012


class _MockN8NHandler(BaseHTTPRequestHandler):
    server_version = "MockN8N/1.0"

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8") if length else "{}"
        payload = json.loads(body or "{}")
        expected_secret = os.environ.get("MOCK_EXPECTED_SECRET", "")
        provided = self.headers.get("X-Tool-Secret", "")

        if expected_secret and provided != expected_secret:
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"code":"UNAUTHORIZED","message":"Invalid X-Tool-Secret"}')
            return

        if self.path.endswith("/web.fetch"):
            response = {
                "url": payload.get("url", ""),
                "final_url": payload.get("url", ""),
                "status": 200,
                "title": "Mock Fetch",
                "extracted_text": "mock fetched text",
                "fetched_at": "2026-01-01T00:00:00Z",
            }
        elif self.path.endswith("/web.search"):
            response = {
                "query": payload.get("query", ""),
                "results": [
                    {
                        "title": "Mock Result",
                        "url": "https://example.com/result",
                        "snippet": "mock snippet",
                        "source": "mock-provider",
                        "published_at": None,
                    }
                ],
                "searched_at": "2026-01-01T00:00:00Z",
            }
        else:
            self.send_response(404)
            self.end_headers()
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode("utf-8"))

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return


@pytest.fixture()
def mock_n8n_server() -> str:
    server = ThreadingHTTPServer(("127.0.0.1", 0), _MockN8NHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        host, port = server.server_address
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        thread.join(timeout=1)


def _load_schema(name: str) -> dict:
    repo_root = Path(__file__).resolve().parents[2]
    path = repo_root / "schemas" / "tools" / name
    return json.loads(path.read_text(encoding="utf-8"))


def _registry() -> Registry:
    repo_root = Path(__file__).resolve().parents[2]
    base = (repo_root / "schemas" / "tools").resolve()
    resources = {}
    for path in sorted(base.glob("*.json")):
        schema = json.loads(path.read_text(encoding="utf-8"))
        schema_id = schema.get("$id")
        if schema_id:
            resources[schema_id] = Resource.from_contents(schema, default_specification=DRAFT202012)
    return Registry().with_resources(resources)


def test_n8n_forwarding_and_schema_validation(mock_n8n_server: str) -> None:
    async def _run() -> None:
        os.environ["TOOL_BACKEND"] = "n8n"
        os.environ["TOOL_SHARED_SECRET"] = "top-secret"
        os.environ["MOCK_EXPECTED_SECRET"] = "top-secret"
        os.environ["WEB_ALLOWLIST"] = "example.com"
        os.environ["N8N_WEB_FETCH_URL"] = f"{mock_n8n_server}/webhook/tools/web.fetch"
        os.environ["N8N_WEB_SEARCH_URL"] = f"{mock_n8n_server}/webhook/tools/web.search"

        from app.core import policy

        policy.load_allowlist.cache_clear()
        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            fetch_resp = await client.post(
                "/tools/web.fetch",
                json={
                    "agent_id": "test-agent",
                    "purpose": "n8n fetch e2e",
                    "inputs": {"url": "https://example.com"},
                },
            )
            search_resp = await client.post(
                "/tools/web.search",
                json={
                    "agent_id": "test-agent",
                    "purpose": "n8n search e2e",
                    "inputs": {"query": "corestack", "max_results": 3},
                },
            )

        assert fetch_resp.status_code == 200
        assert search_resp.status_code == 200

        fetch_schema = _load_schema("web.fetch.response.schema.json")
        search_schema = _load_schema("web.search.response.schema.json")
        validator_fetch = jsonschema.Draft202012Validator(fetch_schema, registry=_registry())
        validator_search = jsonschema.Draft202012Validator(search_schema, registry=_registry())
        validator_fetch.validate(fetch_resp.json())
        validator_search.validate(search_resp.json())

    asyncio.run(_run())


def test_n8n_secret_enforcement_returns_401(mock_n8n_server: str) -> None:
    async def _run() -> None:
        os.environ["TOOL_BACKEND"] = "n8n"
        os.environ["TOOL_SHARED_SECRET"] = "wrong-secret"
        os.environ["MOCK_EXPECTED_SECRET"] = "expected-secret"
        os.environ["N8N_WEB_SEARCH_URL"] = f"{mock_n8n_server}/webhook/tools/web.search"

        from app.core import policy

        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.search",
                json={
                    "agent_id": "test-agent",
                    "purpose": "secret mismatch",
                    "inputs": {"query": "corestack"},
                },
            )

        assert resp.status_code == 401
        payload = resp.json()
        assert payload["ok"] is False
        assert payload["error"]["code"] == "UNAUTHORIZED"

    asyncio.run(_run())
