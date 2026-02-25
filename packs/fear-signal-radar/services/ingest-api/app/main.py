from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import time
from uuid import UUID, uuid4, uuid5

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse

from .config import get_settings
from .db import insert_run_start, insert_signal_item, open_conn, update_run_finish
from .logging import get_logger, log_ingest_event
from .models import RunFinishIn, RunStartIn, SignalIn
from .sanitize import normalize_url_for_dedupe, sanitize_text, sanitize_url

_DEDUPE_NS = UUID("f24ea027-a3e9-4f56-8b7f-9df2f7e4f0fb")


def _require_token(authorization: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    token = authorization.split(" ", 1)[1].strip()
    if token != settings.ingest_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def _compute_hash(platform: str, source_id: str | None, url: str) -> tuple[str, str]:
    if source_id:
        dedupe_material = f"{platform}:{source_id}"
    else:
        dedupe_material = f"{platform}:{normalize_url_for_dedupe(url)}"
    return hashlib.sha256(dedupe_material.encode("utf-8")).hexdigest(), dedupe_material


def create_app() -> FastAPI:
    app = FastAPI(title="Fear Signal Radar Ingest API", version="0.1.0")
    logger = get_logger()
    settings = get_settings()
    app.state.settings = settings
    log_ingest_event(
        logger,
        event="ingest_startup",
        db_user=settings.db_user,
        db_host=settings.db_host,
        db_port=settings.db_port,
    )

    @app.middleware("http")
    async def body_limit_and_request_id(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = request_id

        body = await request.body()
        request.state.bytes_in = len(body)
        if len(body) > settings.max_body_bytes:
            return JSONResponse(status_code=413, content={"detail": "Request body too large"})

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.post("/ingest/signal")
    def ingest_signal(
        payload: SignalIn,
        request: Request,
        _: None = Depends(_require_token),
        x_collector_id: str | None = Header(default=None, alias="X-Collector-ID"),
    ):
        start = time.perf_counter()

        sanitized_url = sanitize_url(payload.url, max_len=2000)
        sanitized_title = sanitize_text(payload.title, max_len=300)
        sanitized_snippet = sanitize_text(payload.text_snippet, max_len=2000)
        sanitized_author = sanitize_text(payload.author, max_len=100)
        dedupe_hash, _ = _compute_hash(payload.platform, payload.source_id, sanitized_url)
        row_id = uuid5(_DEDUPE_NS, dedupe_hash)

        created = False
        with open_conn(settings) as conn:
            created = insert_signal_item(
                conn,
                {
                    "id": str(row_id),
                    "topic_id": payload.topic_id,
                    "platform": payload.platform,
                    "content_type": payload.content_type,
                    "source_id": payload.source_id,
                    "url": sanitized_url,
                    "author": sanitized_author,
                    "published_at": payload.published_at,
                    "collected_at": payload.collected_at or datetime.now(timezone.utc),
                    "title": sanitized_title,
                    "text_snippet": sanitized_snippet,
                    "engagement_json": payload.engagement_json,
                    "tags_json": payload.tags_json,
                    "language": payload.language,
                    "hash": dedupe_hash,
                    "raw_ref_json": payload.raw_ref_json,
                },
            )

        duration_ms = int((time.perf_counter() - start) * 1000)
        dedupe_status = "miss" if created else "hit"
        response_status = "created" if created else "duplicate"

        log_ingest_event(
            logger,
            event="ingest_signal",
            request_id=request.state.request_id,
            collector_id=x_collector_id or "unknown",
            topic_id=payload.topic_id,
            platform=payload.platform,
            url=sanitized_url,
            status=response_status,
            dedupe=dedupe_status,
            duplicate_flag=not created,
            duration_ms=duration_ms,
            bytes_in=getattr(request.state, "bytes_in", 0),
        )

        status_code = 201 if created else 200
        return JSONResponse(
            status_code=status_code,
            content={"status": response_status, "id": str(row_id), "dedupe": dedupe_status},
        )

    @app.post("/ingest/run/start", status_code=201)
    def run_start(payload: RunStartIn, _: None = Depends(_require_token)):
        run_id = uuid4()
        with open_conn(settings) as conn:
            insert_run_start(
                conn,
                run_id=run_id,
                topic_id=payload.topic_id,
                time_window_days=payload.time_window_days,
            )
        return {"run_id": str(run_id)}

    @app.post("/ingest/run/finish")
    def run_finish(payload: RunFinishIn, _: None = Depends(_require_token)):
        with open_conn(settings) as conn:
            updated = update_run_finish(
                conn,
                run_id=payload.run_id,
                status=payload.status,
                counts_json=payload.counts_json,
                error_text=payload.error_text,
            )
        if updated == 0:
            raise HTTPException(status_code=404, detail="Run not found")
        return {"status": "updated", "run_id": str(payload.run_id)}

    return app
