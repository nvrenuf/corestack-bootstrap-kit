from __future__ import annotations

from contextlib import contextmanager
import hashlib
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def _normalize_url_for_test(url: str) -> str:
    parts = urlsplit(url)
    scheme = parts.scheme.lower()
    netloc = parts.netloc.lower()

    filtered_query = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if not (k.lower().startswith("utm_") or k.lower() in {"gclid", "fbclid"})
    ]
    query = urlencode(filtered_query, doseq=True)

    path = parts.path or "/"
    if path != "/" and path.endswith("/"):
        path = path[:-1]

    return urlunsplit((scheme, netloc, path, query, ""))


def test_source_id_dedupe_created_then_duplicate(client, auth_headers, signal_payload):
    payload = dict(signal_payload)
    payload["source_id"] = "same-source-id"

    first = client.post("/ingest/signal", json=payload, headers=auth_headers)
    second = client.post("/ingest/signal", json=payload, headers=auth_headers)

    assert first.status_code == 201
    assert first.json()["dedupe"] == "miss"

    assert second.status_code == 200
    assert second.json()["status"] == "duplicate"
    assert second.json()["dedupe"] == "hit"
    assert second.json()["id"] == first.json()["id"]


def test_url_normalization_used_when_source_id_missing(client, auth_headers, signal_payload):
    payload_a = dict(signal_payload)
    payload_a.pop("source_id", None)
    payload_a["url"] = "https://Example.com/path/?utm_source=a&utm_medium=b#frag"

    payload_b = dict(signal_payload)
    payload_b.pop("source_id", None)
    payload_b["url"] = "https://example.com/path"

    first = client.post("/ingest/signal", json=payload_a, headers=auth_headers)
    second = client.post("/ingest/signal", json=payload_b, headers=auth_headers)

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["status"] == "duplicate"
    assert second.json()["id"] == first.json()["id"]


def test_stored_hash_matches_sha256_rule(client, auth_headers, signal_payload, admin_conn):
    payload = dict(signal_payload)
    payload["platform"] = "youtube"
    payload["source_id"] = "video-123"

    response = client.post("/ingest/signal", json=payload, headers=auth_headers)
    assert response.status_code == 201
    row_id = response.json()["id"]

    expected_hash = hashlib.sha256("youtube:video-123".encode("utf-8")).hexdigest()
    db_hash = admin_conn.execute(
        "SELECT hash FROM signal_items WHERE id = %s",
        (row_id,),
    ).fetchone()[0]

    assert db_hash == expected_hash


def test_service_uses_ingest_writer_and_insert_first_dedupe(app, client, auth_headers, signal_payload):
    assert app.state.settings.db_user == "ingest_api"

    payload = dict(signal_payload)
    payload["source_id"] = "insert-first-no-select"

    first = client.post("/ingest/signal", json=payload, headers=auth_headers)
    second = client.post("/ingest/signal", json=payload, headers=auth_headers)

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["status"] == "duplicate"


def test_hash_uses_normalized_url_when_source_id_missing(client, auth_headers, signal_payload, admin_conn):
    payload = dict(signal_payload)
    payload.pop("source_id", None)
    payload["platform"] = "news"
    payload["url"] = "HTTPS://News.Example.com/path/?utm_source=abc&fbclid=def#hello"

    response = client.post("/ingest/signal", json=payload, headers=auth_headers)
    assert response.status_code == 201

    normalized_url = _normalize_url_for_test(payload["url"])
    expected_hash = hashlib.sha256(f"news:{normalized_url}".encode("utf-8")).hexdigest()

    row = admin_conn.execute(
        "SELECT hash FROM signal_items WHERE id = %s",
        (response.json()["id"],),
    ).fetchone()
    assert row[0] == expected_hash


def test_dedupe_never_uses_select_queries(monkeypatch, app, client, auth_headers, signal_payload):
    from app import main as main_module
    from app import db as db_module

    original_open_conn = main_module.open_conn

    class GuardConn:
        def __init__(self, inner):
            self._inner = inner

        def execute(self, query, *args, **kwargs):
            sql = str(query).lstrip().upper()
            if sql.startswith("SELECT"):
                raise AssertionError("SELECT is forbidden in dedupe path")
            return self._inner.execute(query, *args, **kwargs)

        def __getattr__(self, name):
            return getattr(self._inner, name)

    @contextmanager
    def guarded_open_conn(settings):
        with original_open_conn(settings) as conn:
            yield GuardConn(conn)

    monkeypatch.setattr(main_module, "open_conn", guarded_open_conn)

    payload = dict(signal_payload)
    payload["source_id"] = "no-select-dedupe"
    first = client.post("/ingest/signal", json=payload, headers=auth_headers)
    second = client.post("/ingest/signal", json=payload, headers=auth_headers)

    assert first.status_code == 201
    assert second.status_code == 200
