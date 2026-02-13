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
    get_timeout_ms,
    get_tool_backend,
    is_allowed_host,
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
            n8n_url = get_n8n_web_fetch_url()
            if not n8n_url:
                return _envelope_error(
                    http_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    code="NOT_CONFIGURED",
                    message="N8N_WEB_FETCH_URL is required when TOOL_BACKEND=n8n.",
                    details=None,
                    tool="web.fetch",
                    backend=backend,
                    timings={"total": 0.0},
                )
            raw = await post_json(
                n8n_url,
                {
                    "url": req.inputs.url,
                    "agent_id": req.agent_id,
                    "purpose": req.purpose,
                    "request_id": req.request_id,
                },
                get_timeout_ms(),
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

    if backend == "n8n":
        n8n_url = get_n8n_web_search_url()
        if not n8n_url:
            return _envelope_error(
                http_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                code="NOT_CONFIGURED",
                message="N8N_WEB_SEARCH_URL is required when TOOL_BACKEND=n8n.",
                details=None,
                tool="web.search",
                backend=backend,
                timings={"total": 0.0},
            )
        try:
            raw = await post_json(
                n8n_url,
                {
                    "query": req.inputs.query,
                    "max_results": req.inputs.max_results,
                    "agent_id": req.agent_id,
                    "purpose": req.purpose,
                    "request_id": req.request_id,
                },
                get_timeout_ms(),
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
