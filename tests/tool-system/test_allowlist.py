import asyncio
import json
import os

import httpx


def test_allowlist_deny_web_fetch_blocked_domain(tmp_path) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["WEB_ALLOWLIST"] = "localhost,127.0.0.1"
        os.environ.pop("WEB_ALLOWLIST_FILE", None)

        from app.core import policy

        policy.load_allowlist.cache_clear()

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.fetch",
                json={
                    "agent_id": "test-agent",
                    "purpose": "allowlist deny test",
                    "inputs": {"url": "https://example.com"},
                },
            )

        assert resp.status_code == 403
        payload = resp.json()
        assert payload["ok"] is False
        assert payload["error"]["code"] == "POLICY_DENIED"

        lines = audit_path.read_text(encoding="utf-8").splitlines()
        events = [json.loads(line) for line in lines if line.strip()]
        deny = next(e for e in events if e.get("tool_name") == "web.fetch" and e.get("decision") == "deny")
        assert deny["reason_code"] == "POLICY_DENIED"
        assert deny["http_status"] == 403
        assert deny["domain"] == "example.com"
        assert deny["url"] == "https://example.com"

    asyncio.run(_run())


def test_audit_logging_successful_fetch_emits_allow_event(tmp_path, monkeypatch) -> None:
    async def _run() -> None:
        audit_path = tmp_path / "audit.jsonl"
        os.environ["AUDIT_LOG_PATH"] = str(audit_path)
        os.environ["WEB_ALLOWLIST"] = "example.com"
        os.environ.pop("WEB_ALLOWLIST_FILE", None)

        from app.core import policy
        from app.core.http import FetchResult

        async def _fake_fetch_url(url: str, timeout_ms: int, max_bytes: int, user_agent: str) -> FetchResult:
            return FetchResult(
                final_url=url,
                status_code=200,
                title="Example",
                extracted_text="Hello world",
            )

        policy.load_allowlist.cache_clear()

        from app.api import tools as tools_mod
        monkeypatch.setattr(tools_mod, "fetch_url", _fake_fetch_url)

        from app.main import app

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/tools/web.fetch",
                json={
                    "agent_id": "test-agent",
                    "purpose": "audit allow test",
                    "request_id": "corr-123",
                    "inputs": {"url": "https://example.com"},
                },
            )

        assert resp.status_code == 200
        payload = resp.json()
        assert payload["ok"] is True

        lines = audit_path.read_text(encoding="utf-8").splitlines()
        events = [json.loads(line) for line in lines if line.strip()]
        allow = next(e for e in events if e.get("tool_name") == "web.fetch" and e.get("decision") == "allow")
        assert allow["reason_code"] == "OK"
        assert allow["http_status"] == 200
        assert allow["duration_ms"] >= 0
        assert allow["bytes_in"] > 0
        assert allow["bytes_out"] > 0
        assert allow["requester"] == "test-agent"
        assert allow["correlation_id"] == "corr-123"
        assert allow["upstream"] == "local"

    asyncio.run(_run())
