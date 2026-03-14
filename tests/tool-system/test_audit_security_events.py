import asyncio
import json
import os

import httpx


def _read_events(path):
    lines = path.read_text(encoding="utf-8").splitlines()
    return [json.loads(line) for line in lines if line.strip()]


def test_allow_decision_emits_request_and_result_events(tmp_path, monkeypatch) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["WEB_ALLOWLIST"] = "example.com"
        os.environ["TOOL_BACKEND"] = "local"

        from app.core import policy
        from app.core.http import FetchResult

        async def _fake_fetch_url(url: str, timeout_ms: int, max_bytes: int, user_agent: str) -> FetchResult:
            return FetchResult(final_url=url, status_code=200, title="ok", extracted_text="safe")

        policy.load_allowlist.cache_clear()
        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.api import tools as tools_mod

        monkeypatch.setattr(tools_mod, "fetch_url", _fake_fetch_url)

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.fetch",
                json={
                    "agent_id": "agent-a",
                    "purpose": "allow path",
                    "request_id": "req-allow-1",
                    "inputs": {"url": "https://example.com/path?a=secret"},
                },
            )

        assert resp.status_code == 200
        events = _read_events(audit_path)
        requested = [e for e in events if e.get("event_type") == "tool.execution.requested"]
        resulted = [e for e in events if e.get("event_type") == "tool.execution.result"]
        assert requested
        assert resulted
        assert requested[0]["reason_code"] == "REQUEST_RECEIVED"
        assert resulted[0]["decision"] == "allow"
        assert resulted[0]["reason_code"] == "OK"

    asyncio.run(_run())


def test_deny_decision_emits_structured_policy_event_and_redacts_url(tmp_path) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["WEB_ALLOWLIST"] = "localhost,127.0.0.1"
        os.environ["TOOL_BACKEND"] = "local"

        from app.core import policy

        policy.load_allowlist.cache_clear()
        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.fetch",
                json={
                    "agent_id": "agent-b",
                    "purpose": "deny path",
                    "request_id": "req-deny-1",
                    "inputs": {"url": "https://example.com/private?token=super-secret"},
                },
            )

        assert resp.status_code == 403
        events = _read_events(audit_path)
        deny = next(e for e in events if e.get("reason_code") == "POLICY_DENIED")
        assert deny["decision"] == "deny"
        assert deny["event_type"] == "tool.execution.failure"
        assert deny["failure_class"] == "POLICY_DENIED"
        assert deny["url"] == "https://example.com/private"

    asyncio.run(_run())


def test_execution_failure_emits_failure_class_event(tmp_path, monkeypatch) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["TOOL_BACKEND"] = "n8n"
        os.environ["N8N_WEB_SEARCH_URL"] = "http://mock-n8n/webhook/tools/web.search"

        from app.core import policy

        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.api import tools as tools_mod

        async def _fake_post_json(url: str, payload, timeout_ms: int, headers=None, max_response_bytes=1_000_000):
            response = httpx.Response(status_code=500, request=httpx.Request("POST", url))
            raise httpx.HTTPStatusError("boom", request=response.request, response=response)

        monkeypatch.setattr(tools_mod, "post_json", _fake_post_json)

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.search",
                json={"agent_id": "agent-c", "purpose": "fail path", "request_id": "req-fail-1", "inputs": {"query": "x"}},
            )

        assert resp.status_code == 500
        events = _read_events(audit_path)
        failure = next(e for e in events if e.get("error_code") == "UPSTREAM_ERROR")
        assert failure["decision"] == "deny"
        assert failure["event_type"] == "tool.execution.failure"
        assert failure["failure_class"] == "UPSTREAM_ERROR"

    asyncio.run(_run())


def test_timeout_path_emits_fail_closed_event(tmp_path, monkeypatch) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["WEB_ALLOWLIST"] = "example.com"
        os.environ["TOOL_BACKEND"] = "local"

        from app.core import policy

        policy.load_allowlist.cache_clear()
        policy.rate_limiter._events.clear()  # noqa: SLF001

        from app.api import tools as tools_mod

        async def _fake_fetch_url(url: str, timeout_ms: int, max_bytes: int, user_agent: str):
            raise httpx.TimeoutException("timed out")

        monkeypatch.setattr(tools_mod, "fetch_url", _fake_fetch_url)

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.fetch",
                json={"agent_id": "agent-d", "purpose": "timeout", "request_id": "req-timeout-1", "inputs": {"url": "https://example.com"}},
            )

        assert resp.status_code == 504
        events = _read_events(audit_path)
        timeout = next(e for e in events if e.get("reason_code") == "UPSTREAM_TIMEOUT")
        assert timeout["decision"] == "deny"
        assert timeout["fail_closed"] is True
        assert timeout["event_type"] == "tool.execution.failure"

    asyncio.run(_run())
