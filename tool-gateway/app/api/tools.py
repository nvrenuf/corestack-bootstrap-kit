import hashlib
import time
from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.http import fetch_url, post_json
from app.core.logging import log_event
from app.core.policy import (
    get_max_bytes,
    get_n8n_web_fetch_url,
    get_n8n_web_search_url,
    get_rate_limit_per_minute,
    get_timeout_ms,
    get_tool_backend,
    get_tool_shared_secret,
    is_allowed_host,
    rate_limiter,
)
from app.core.schemas import Envelope, ErrorObject, WebFetchRequest, WebSearchRequest

router = APIRouter(prefix="/tools")


def _envelope_error(
    *,
    http_code: int,
    code: str,
    message: str,
    details: Dict[str, Any] | None,
    tool: str,
    backend: str,
    timings: Dict[str, float],
) -> JSONResponse:
    payload = Envelope(
        ok=False,
        data={},
        error=ErrorObject(code=code, message=message, details=details),
        source_meta={"tool": tool, "backend": backend},
        timings_ms=timings,
        content_hash=None,
    )
    return JSONResponse(status_code=http_code, content=payload.model_dump())


def _normalize_n8n_fetch_response(raw: Dict[str, Any], backend: str, elapsed_ms: float) -> Envelope:
    text = str(raw.get("extracted_text", ""))
    content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest() if text else None
    return Envelope(
        ok=True,
        data={
            "url": raw.get("url"),
            "final_url": raw.get("final_url") or raw.get("url"),
            "status": raw.get("status", 0),
            "title": raw.get("title", ""),
            "extracted_text": text,
            "fetched_at": raw.get("fetched_at") or datetime.now(timezone.utc).isoformat(),
        },
        error=None,
        source_meta={"tool": "web.fetch", "backend": backend},
        timings_ms={"total": elapsed_ms},
        content_hash=content_hash,
    )


def _normalize_n8n_search_response(raw: Dict[str, Any], backend: str, elapsed_ms: float) -> Envelope:
    return Envelope(
        ok=True,
        data={
            "query": raw.get("query", ""),
            "results": raw.get("results", []),
            "searched_at": raw.get("searched_at") or datetime.now(timezone.utc).isoformat(),
        },
        error=None,
        source_meta={"tool": "web.search", "backend": backend},
        timings_ms={"total": elapsed_ms},
        content_hash=None,
    )


def _check_rate_limit(tool: str, backend: str, started: float) -> JSONResponse | None:
    limit_per_minute = get_rate_limit_per_minute()
    if rate_limiter.allow(tool, limit_per_minute):
        return None
    elapsed = round((time.perf_counter() - started) * 1000, 2)
    return _envelope_error(
        http_code=status.HTTP_429_TOO_MANY_REQUESTS,
        code="RATE_LIMITED",
        message="Tool rate limit exceeded.",
        details={"limit_per_minute": limit_per_minute},
        tool=tool,
        backend=backend,
        timings={"total": elapsed},
    )


def _n8n_headers() -> Dict[str, str]:
    headers: Dict[str, str] = {}
    shared_secret = get_tool_shared_secret()
    if shared_secret:
        headers["X-Tool-Secret"] = shared_secret
    return headers


def _upstream_error_code(http_code: int) -> str:
    if http_code == 401:
        return "UNAUTHORIZED"
    if http_code == 429:
        return "UPSTREAM_RATE_LIMITED"
    if 400 <= http_code < 500:
        return "UPSTREAM_BAD_REQUEST"
    return "UPSTREAM_ERROR"


@router.post("/web.fetch")
async def web_fetch(payload: Dict[str, Any]) -> JSONResponse:
    started = time.perf_counter()
    backend = get_tool_backend()

    try:
        req = WebFetchRequest.model_validate(payload)
    except ValidationError as exc:
        return _envelope_error(
            http_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="Invalid payload.",
            details={"errors": exc.errors()},
            tool="web.fetch",
            backend=backend,
            timings={"total": 0.0},
        )

    limited = _check_rate_limit("web.fetch", backend, started)
    if limited:
        return limited

    parsed = urlparse(req.inputs.url)
    hostname = (parsed.hostname or "").lower()
    if not hostname:
        return _envelope_error(
            http_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="Invalid URL.",
            details={"field": "inputs.url"},
            tool="web.fetch",
            backend=backend,
            timings={"total": 0.0},
        )

    if not is_allowed_host(hostname):
        elapsed = (time.perf_counter() - started) * 1000
        log_event(
            {
                "request_id": req.request_id,
                "agent_id": req.agent_id,
                "tool": "web.fetch",
                "url": req.inputs.url,
                "decision": "deny",
                "status_code": 403,
                "elapsed_ms": round(elapsed, 2),
            }
        )
        return _envelope_error(
            http_code=status.HTTP_403_FORBIDDEN,
            code="POLICY_DENIED",
            message="Hostname is not allowlisted.",
            details={"hostname": hostname},
            tool="web.fetch",
            backend=backend,
            timings={"total": round(elapsed, 2)},
        )

    try:
        if backend == "n8n":
            raw = await post_json(
                get_n8n_web_fetch_url(),
                {
                    "url": req.inputs.url,
                    "agent_id": req.agent_id,
                    "purpose": req.purpose,
                    "request_id": req.request_id,
                },
                get_timeout_ms(),
                headers=_n8n_headers(),
                max_response_bytes=get_max_bytes(),
            )
            elapsed = (time.perf_counter() - started) * 1000
            envelope = _normalize_n8n_fetch_response(raw, backend, round(elapsed, 2))
            status_code = 200
        else:
            fetch_started = time.perf_counter()
            result = await fetch_url(
                req.inputs.url,
                timeout_ms=get_timeout_ms(),
                max_bytes=get_max_bytes(),
                user_agent="corestack-tool-gateway/0.1",
            )
            fetch_ms = (time.perf_counter() - fetch_started) * 1000
            elapsed = (time.perf_counter() - started) * 1000
            fetched_at = datetime.now(timezone.utc).isoformat()
            content_hash = (
                hashlib.sha256(result.extracted_text.encode("utf-8")).hexdigest()
                if result.extracted_text
                else None
            )
            envelope = Envelope(
                ok=True,
                data={
                    "url": req.inputs.url,
                    "final_url": result.final_url,
                    "status": result.status_code,
                    "title": result.title,
                    "extracted_text": result.extracted_text,
                    "fetched_at": fetched_at,
                },
                error=None,
                source_meta={"tool": "web.fetch", "backend": backend},
                timings_ms={"total": round(elapsed, 2), "fetch": round(fetch_ms, 2)},
                content_hash=content_hash,
            )
            status_code = 200
    except httpx.TimeoutException:
        elapsed = (time.perf_counter() - started) * 1000
        return _envelope_error(
            http_code=status.HTTP_504_GATEWAY_TIMEOUT,
            code="UPSTREAM_TIMEOUT",
            message="Upstream request timed out.",
            details=None,
            tool="web.fetch",
            backend=backend,
            timings={"total": round(elapsed, 2), "fetch": round(elapsed, 2)},
        )
    except httpx.HTTPStatusError as exc:
        elapsed = round((time.perf_counter() - started) * 1000, 2)
        detail = None
        try:
            detail = exc.response.json()
        except ValueError:
            detail = {"text": exc.response.text}
        return _envelope_error(
            http_code=exc.response.status_code,
            code=_upstream_error_code(exc.response.status_code),
            message="Upstream request failed.",
            details=detail,
            tool="web.fetch",
            backend=backend,
            timings={"total": elapsed},
        )
    except ValueError as exc:
        elapsed = (time.perf_counter() - started) * 1000
        return _envelope_error(
            http_code=status.HTTP_502_BAD_GATEWAY,
            code="UPSTREAM_TOO_LARGE",
            message="Upstream response exceeded byte limit.",
            details={"error": str(exc)},
            tool="web.fetch",
            backend=backend,
            timings={"total": round(elapsed, 2)},
        )
    except Exception as exc:  # noqa: BLE001
        elapsed = (time.perf_counter() - started) * 1000
        return _envelope_error(
            http_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_ERROR",
            message="Unexpected server error.",
            details={"error": str(exc)},
            tool="web.fetch",
            backend=backend,
            timings={"total": round(elapsed, 2)},
        )

    log_event(
        {
            "request_id": req.request_id,
            "agent_id": req.agent_id,
            "tool": "web.fetch",
            "url": req.inputs.url,
            "decision": "allow",
            "status_code": status_code,
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 2),
        }
    )
    return JSONResponse(status_code=status_code, content=envelope.model_dump())


@router.post("/web.search")
async def web_search(payload: Dict[str, Any]) -> JSONResponse:
    started = time.perf_counter()
    backend = get_tool_backend()

    try:
        req = WebSearchRequest.model_validate(payload)
    except ValidationError as exc:
        return _envelope_error(
            http_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="Invalid payload.",
            details={"errors": exc.errors()},
            tool="web.search",
            backend=backend,
            timings={"total": 0.0},
        )

    limited = _check_rate_limit("web.search", backend, started)
    if limited:
        return limited

    if backend == "n8n":
        try:
            raw = await post_json(
                get_n8n_web_search_url(),
                {
                    "query": req.inputs.query,
                    "max_results": req.inputs.max_results,
                    "agent_id": req.agent_id,
                    "purpose": req.purpose,
                    "request_id": req.request_id,
                },
                get_timeout_ms(),
                headers=_n8n_headers(),
                max_response_bytes=get_max_bytes(),
            )
            elapsed = round((time.perf_counter() - started) * 1000, 2)
            envelope = _normalize_n8n_search_response(raw, backend, elapsed)
            status_code = 200
        except httpx.TimeoutException:
            return _envelope_error(
                http_code=status.HTTP_504_GATEWAY_TIMEOUT,
                code="UPSTREAM_TIMEOUT",
                message="Upstream request timed out.",
                details=None,
                tool="web.search",
                backend=backend,
                timings={"total": round((time.perf_counter() - started) * 1000, 2)},
            )
        except httpx.HTTPStatusError as exc:
            detail = None
            try:
                detail = exc.response.json()
            except ValueError:
                detail = {"text": exc.response.text}
            return _envelope_error(
                http_code=exc.response.status_code,
                code=_upstream_error_code(exc.response.status_code),
                message="Upstream request failed.",
                details=detail,
                tool="web.search",
                backend=backend,
                timings={"total": round((time.perf_counter() - started) * 1000, 2)},
            )
        except ValueError as exc:
            return _envelope_error(
                http_code=status.HTTP_502_BAD_GATEWAY,
                code="UPSTREAM_TOO_LARGE",
                message="Upstream response exceeded byte limit.",
                details={"error": str(exc)},
                tool="web.search",
                backend=backend,
                timings={"total": round((time.perf_counter() - started) * 1000, 2)},
            )
        except Exception as exc:  # noqa: BLE001
            return _envelope_error(
                http_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                code="INTERNAL_ERROR",
                message="Unexpected server error.",
                details={"error": str(exc)},
                tool="web.search",
                backend=backend,
                timings={"total": round((time.perf_counter() - started) * 1000, 2)},
            )
    else:
        elapsed = round((time.perf_counter() - started) * 1000, 2)
        envelope = Envelope(
            ok=False,
            data={},
            error=ErrorObject(
                code="NOT_CONFIGURED",
                message="Search backend is not configured.",
                details=None,
            ),
            source_meta={"tool": "web.search", "backend": backend},
            timings_ms={"total": elapsed},
            content_hash=None,
        )
        status_code = 200

    log_event(
        {
            "request_id": req.request_id,
            "agent_id": req.agent_id,
            "tool": "web.search",
            "query": req.inputs.query,
            "decision": "allow",
            "status_code": status_code,
            "elapsed_ms": round((time.perf_counter() - started) * 1000, 2),
        }
    )
    return JSONResponse(status_code=status_code, content=envelope.model_dump())
