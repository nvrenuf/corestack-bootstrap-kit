from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg
import pytest
from testcontainers.postgres import PostgresContainer

PACK_DIR = Path(__file__).resolve().parents[1]
MIGRATION_PATH = PACK_DIR / "migrations" / "0001_init.sql"
SERVICE_ROOT = PACK_DIR / "services" / "ingest-api"
DOCKER_SOCKET = Path.home() / ".docker" / "run" / "docker.sock"

if "DOCKER_HOST" not in os.environ and DOCKER_SOCKET.exists():
    os.environ["DOCKER_HOST"] = f"unix://{DOCKER_SOCKET}"


def _conn_kwargs_from_url(conn_url: str) -> dict[str, object]:
    parsed = urlparse(conn_url)
    return {
        "host": parsed.hostname,
        "port": parsed.port,
        "dbname": parsed.path.lstrip("/"),
        "user": parsed.username,
        "password": parsed.password,
        "autocommit": True,
    }


@pytest.fixture()
def postgres_container():
    with PostgresContainer("postgres:16-alpine") as container:
        yield container


@pytest.fixture()
def postgres_db(postgres_container):
    return postgres_container


@pytest.fixture()
def admin_conn(postgres_container):
    conn_url = postgres_container.get_connection_url().replace(
        "postgresql+psycopg2://", "postgresql://", 1
    )
    with psycopg.connect(**_conn_kwargs_from_url(conn_url)) as conn:
        yield conn


@pytest.fixture()
def migrated_db(admin_conn):
    assert MIGRATION_PATH.exists(), f"Migration file not found: {MIGRATION_PATH}"
    admin_conn.execute(MIGRATION_PATH.read_text(encoding="utf-8"))
    return admin_conn


@pytest.fixture()
def ingest_env(postgres_container, migrated_db):
    conn_url = postgres_container.get_connection_url().replace(
        "postgresql+psycopg2://", "postgresql://", 1
    )
    parsed = urlparse(conn_url)

    privilege_row = migrated_db.execute(
        """
        SELECT
          has_table_privilege('ingest_api', 'public.signal_items', 'INSERT') AS can_insert_signal,
          has_table_privilege('ingest_api', 'public.radar_runs', 'UPDATE') AS can_update_runs
        """
    ).fetchone()
    if not privilege_row or not privilege_row[0] or not privilege_row[1]:
        raise RuntimeError(
            "Grants not applied; ingest_api lacks privileges; migration not executed as admin or wrong container."
        )

    os.environ["INGEST_TOKEN"] = "test-ingest-token"
    os.environ["INGEST_DB_HOST"] = parsed.hostname or "localhost"
    os.environ["INGEST_DB_PORT"] = str(parsed.port or 5432)
    os.environ["INGEST_DB_NAME"] = parsed.path.lstrip("/")
    os.environ["INGEST_DB_USER"] = "ingest_api"
    os.environ["INGEST_DB_PASSWORD"] = "ingest_api_pw"
    os.environ["INGEST_MAX_BODY_BYTES"] = str(256 * 1024)
    os.environ["MAX_BODY_BYTES"] = str(256 * 1024)

    assert os.environ.get("INGEST_DB_HOST"), "INGEST_DB_HOST was not injected"


@pytest.fixture()
def app(ingest_env):
    assert os.environ.get("INGEST_DB_HOST") is not None, "INGEST_DB_HOST must be set before app import"

    service_path = str(SERVICE_ROOT)
    if service_path not in sys.path:
        sys.path.insert(0, service_path)

    for module_name in [
        "app.main",
        "app.config",
        "app.db",
        "app.models",
        "app.sanitize",
        "app.logging",
    ]:
        if module_name in sys.modules:
            del sys.modules[module_name]

    main_module = importlib.import_module("app.main")
    return main_module.create_app()


@pytest.fixture()
def client(postgres_container, ingest_env, app):
    assert os.environ.get("INGEST_DB_HOST") is not None, "INGEST_DB_HOST must be set before creating client"
    from fastapi.testclient import TestClient

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def auth_headers():
    return {
        "Authorization": "Bearer test-ingest-token",
        "X-Collector-ID": "collector-01",
    }


@pytest.fixture()
def signal_payload():
    return {
        "topic_id": "work-money",
        "platform": "reddit",
        "content_type": "post",
        "source_id": "abc-123",
        "url": "https://www.example.com/path?utm_source=a#frag",
        "title": "Title",
        "text_snippet": "Snippet",
        "author": "Author",
        "language": "en",
        "engagement_json": {},
        "tags_json": {},
        "raw_ref_json": {},
    }
