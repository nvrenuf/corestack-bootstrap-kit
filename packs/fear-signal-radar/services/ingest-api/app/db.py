from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from typing import Any
from uuid import UUID

import psycopg
from psycopg import sql
from psycopg.types.json import Jsonb

from .config import Settings


@contextmanager
def open_conn(settings: Settings):
    with psycopg.connect(
        host=settings.db_host,
        port=settings.db_port,
        dbname=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        autocommit=True,
    ) as conn:
        # Force the intended write-only privilege role for this session.
        conn.execute(sql.SQL("SET ROLE {}").format(sql.Identifier(settings.db_role)))
        yield conn


def insert_signal_item(conn: psycopg.Connection, params: dict[str, Any]) -> bool:
    insert_params = dict(params)
    insert_params["engagement_json"] = Jsonb(insert_params["engagement_json"])
    insert_params["tags_json"] = Jsonb(insert_params["tags_json"])
    insert_params["raw_ref_json"] = Jsonb(insert_params["raw_ref_json"])

    row = conn.execute(
        """
        INSERT INTO signal_items (
            id, topic_id, platform, content_type, source_id, url, author,
            published_at, collected_at, title, text_snippet,
            engagement_json, tags_json, language, hash, raw_ref_json
        ) VALUES (
            %(id)s, %(topic_id)s, %(platform)s, %(content_type)s, %(source_id)s, %(url)s,
            %(author)s, %(published_at)s, %(collected_at)s, %(title)s, %(text_snippet)s,
            %(engagement_json)s, %(tags_json)s, %(language)s, %(hash)s, %(raw_ref_json)s
        )
        ON CONFLICT (hash) DO NOTHING
        RETURNING id
        """,
        insert_params,
    ).fetchone()
    return row is not None


def insert_run_start(
    conn: psycopg.Connection,
    *,
    run_id: UUID,
    topic_id: str,
    time_window_days: int,
) -> None:
    conn.execute(
        """
        INSERT INTO radar_runs (run_id, topic_id, started_at, time_window_days, status)
        VALUES (%s, %s, now(), %s, %s)
        """,
        (str(run_id), topic_id, time_window_days, "ok"),
    )


def update_run_finish(
    conn: psycopg.Connection,
    *,
    run_id: UUID,
    status: str,
    counts_json: dict[str, Any],
    error_text: str | None,
) -> int:
    cur = conn.execute(
        """
        UPDATE radar_runs
        SET finished_at = now(), counts_json = %s, status = %s, error_text = %s
        WHERE run_id = %s
        """,
        (Jsonb(counts_json), status, error_text, str(run_id)),
    )
    return cur.rowcount
