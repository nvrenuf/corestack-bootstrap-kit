from __future__ import annotations

import psycopg
import pytest
from psycopg import errors
from testcontainers.postgres import PostgresContainer

from utils import apply_migration, conn_kwargs_from_url


@pytest.fixture()
def postgres_db():
    with PostgresContainer("postgres:16-alpine") as container:
        yield container


@pytest.fixture()
def admin_conn(postgres_db):
    conn_url = postgres_db.get_connection_url().replace(
        "postgresql+psycopg2://", "postgresql://", 1
    )
    with psycopg.connect(**conn_kwargs_from_url(conn_url)) as conn:
        yield conn


def _conn_as_role(postgres_db, user: str, password: str) -> psycopg.Connection:
    conn_url = postgres_db.get_connection_url().replace(
        "postgresql+psycopg2://", "postgresql://", 1
    )
    kwargs = conn_kwargs_from_url(conn_url)
    kwargs["user"] = user
    kwargs["password"] = password
    return psycopg.connect(**kwargs)


def test_ingest_service_login_permissions(admin_conn, postgres_db):
    apply_migration(admin_conn)

    with _conn_as_role(postgres_db, "ingest_api", "ingest_api_pw") as ingest_conn:
        ingest_conn.execute(
            """
            INSERT INTO signal_items (topic_id, platform, content_type, url, hash)
            VALUES (%s, %s, %s, %s, %s)
            """,
            ("work-money", "reddit", "post", "https://example.com/a", "ingest-hash-1"),
        )

        with pytest.raises(errors.InsufficientPrivilege) as select_error:
            ingest_conn.execute("SELECT * FROM signal_items").fetchall()
        assert select_error.value.sqlstate == "42501"


def test_synth_service_login_permissions(admin_conn, postgres_db):
    apply_migration(admin_conn)

    admin_conn.execute(
        """
        INSERT INTO signal_items (topic_id, platform, content_type, url, hash)
        VALUES (%s, %s, %s, %s, %s)
        """,
        ("work-money", "news", "article", "https://example.com/b", "reader-hash-1"),
    )

    with _conn_as_role(postgres_db, "synth_api", "synth_api_pw") as synth_conn:
        count = synth_conn.execute("SELECT COUNT(*) FROM signal_items").fetchone()[0]
        assert count >= 1

        with pytest.raises(errors.InsufficientPrivilege) as insert_error:
            synth_conn.execute(
                """
                INSERT INTO signal_items (topic_id, platform, content_type, url, hash)
                VALUES (%s, %s, %s, %s, %s)
                """,
                ("work-money", "reddit", "post", "https://example.com/c", "reader-hash-2"),
            )
        assert insert_error.value.sqlstate == "42501"
