import asyncio
import os

import httpx


def test_allowlist_deny_web_fetch_blocked_domain() -> None:
    async def _run() -> None:
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

    asyncio.run(_run())
