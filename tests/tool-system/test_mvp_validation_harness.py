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


class _HarnessN8NHandler(BaseHTTPRequestHandler):
    server_version = "HarnessN8N/1.0"

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8") if length else "{}"
        payload = json.loads(body or "{}")

        mode = self.headers.get("X-Harness-Mode", "ok")
        if mode == "timeout":
            self.send_response(504)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"code":"TIMEOUT"}')
            return

        if mode == "oversize":
            data = {"query": payload.get("query", ""), "results": [{"title": "big", "url": "https://example.com", "snippet": "A" * 5000}], "searched_at": "2026-01-01T00:00:00Z"}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if self.path.endswith("/web.search"):
            response = {
                "query": payload.get("query", ""),
                "results": [
                    {
                        "title": "Harness Result",
                        "url": "https://example.com/result",
                        "snippet": "harness snippet",
                        "source": "harness-provider",
                        "published_at": None,
                    }
                ],
                "searched_at": "2026-01-01T00:00:00Z",
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        return


@pytest.fixture()
def harness_n8n() -> str:
    server = ThreadingHTTPServer(("127.0.0.1", 0), _HarnessN8NHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        host, port = server.server_address
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        thread.join(timeout=1)


def _read_events(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _load_schema(name: str) -> dict[str, Any]:
    root = Path(__file__).resolve().parents[2]
    return json.loads((root / "schemas" / "tools" / name).read_text(encoding="utf-8"))


def _registry() -> Registry:
    root = Path(__file__).resolve().parents[2]
    base = root / "schemas" / "tools"
    resources = {}
    for path in sorted(base.glob("*.json")):
        schema = json.loads(path.read_text(encoding="utf-8"))
        if schema.get("$id"):
            resources[schema["$id"]] = Resource.from_contents(schema, default_specification=DRAFT202012)
    return Registry().with_resources(resources)


def test_mvp_supported_request_is_schema_valid_and_audited(harness_n8n: str, tmp_path) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["TOOL_BACKEND"] = "n8n"
        os.environ["N8N_WEB_SEARCH_URL"] = f"{harness_n8n}/webhook/tools/web.search"

        from app.core import policy

        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.search",
                json={"agent_id": "harness", "purpose": "golden", "request_id": "h-1", "inputs": {"query": "corestack", "max_results": 1}},
            )

        assert resp.status_code == 200
        body = resp.json()
        jsonschema.Draft202012Validator(_load_schema("web.search.response.schema.json"), registry=_registry()).validate(body)

        events = _read_events(audit_path)
        assert any(e.get("event_type") == "tool.execution.requested" for e in events)
        assert any(e.get("event_type") == "tool.execution.result" and e.get("decision") == "allow" for e in events)

    asyncio.run(_run())


def test_mvp_malformed_and_disallowed_fail_closed_with_normalized_errors(tmp_path) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["TOOL_BACKEND"] = "local"
        os.environ["WEB_ALLOWLIST"] = "localhost"

        from app.core import policy

        policy.load_allowlist.cache_clear()
        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            malformed = await client.post("/tools/web.search", json={"purpose": "missing agent", "inputs": {"query": "x"}})
            denied = await client.post(
                "/tools/web.fetch",
                json={"agent_id": "harness", "purpose": "deny", "request_id": "h-2", "inputs": {"url": "https://example.com/private?token=1"}},
            )

        assert malformed.status_code == 400
        assert malformed.json()["error"]["code"] == "BAD_REQUEST"
        assert denied.status_code == 403
        assert denied.json()["error"]["code"] == "POLICY_DENIED"

        events = _read_events(audit_path)
        assert any(e.get("reason_code") == "BAD_REQUEST" and e.get("event_type") == "tool.execution.failure" for e in events)
        denied_event = next(e for e in events if e.get("reason_code") == "POLICY_DENIED")
        assert denied_event["url"] == "https://example.com/private"

    asyncio.run(_run())


def test_mvp_oversize_and_timeout_are_fail_closed(tmp_path, monkeypatch) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["WEB_ALLOWLIST"] = "example.com"
        os.environ["TOOL_BACKEND"] = "local"

        from app.core import policy

        policy.load_allowlist.cache_clear()
        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.api import tools as tools_mod

        async def _fake_fetch_oversize(url: str, timeout_ms: int, max_bytes: int, user_agent: str):
            raise ValueError("Response exceeded max bytes")

        monkeypatch.setattr(tools_mod, "fetch_url", _fake_fetch_oversize)

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            oversize = await client.post(
                "/tools/web.fetch",
                json={"agent_id": "harness", "purpose": "oversize", "request_id": "h-3", "inputs": {"url": "https://example.com"}},
            )

        async def _fake_fetch_timeout(url: str, timeout_ms: int, max_bytes: int, user_agent: str):
            raise httpx.TimeoutException("timeout")

        monkeypatch.setattr(tools_mod, "fetch_url", _fake_fetch_timeout)

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            timeout = await client.post(
                "/tools/web.fetch",
                json={"agent_id": "harness", "purpose": "timeout", "request_id": "h-4", "inputs": {"url": "https://example.com"}},
            )

        assert oversize.status_code == 502
        assert oversize.json()["error"]["code"] == "UPSTREAM_TOO_LARGE"
        assert timeout.status_code == 504
        assert timeout.json()["error"]["code"] == "UPSTREAM_TIMEOUT"

        events = _read_events(audit_path)
        assert any(e.get("reason_code") == "UPSTREAM_TOO_LARGE" and e.get("decision") == "deny" for e in events)
        timeout_event = next(e for e in events if e.get("reason_code") == "UPSTREAM_TIMEOUT")
        assert timeout_event["fail_closed"] is True

    asyncio.run(_run())
