from __future__ import annotations

import json


def test_missing_authorization_header_returns_401(client, signal_payload):
    response = client.post("/ingest/signal", json=signal_payload)
    assert response.status_code == 401


def test_wrong_token_returns_401(client, signal_payload):
    response = client.post(
        "/ingest/signal",
        json=signal_payload,
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert response.status_code == 401


def test_correct_token_allows_request(client, auth_headers, signal_payload):
    response = client.post("/ingest/signal", json=signal_payload, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["status"] == "created"


def test_ingest_logs_structured_event(caplog, client, auth_headers, signal_payload):
    caplog.set_level("INFO", logger="fear_signal_radar.ingest_api")

    response = client.post("/ingest/signal", json=signal_payload, headers=auth_headers)
    assert response.status_code == 201

    records = [json.loads(r.message) for r in caplog.records if r.name == "fear_signal_radar.ingest_api"]
    assert records, "Expected at least one ingest log record"
    log = records[-1]

    assert log["event"] == "ingest_signal"
    assert log["topic_id"] == signal_payload["topic_id"]
    assert log["platform"] == signal_payload["platform"]
    assert log["status"] == "created"
    assert isinstance(log["duration_ms"], int)
    assert log["duplicate_flag"] is False
    assert "text_snippet" not in log
