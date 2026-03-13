import json
from pathlib import Path

import jsonschema
import pytest
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012


def _load_schema(name: str) -> dict:
    repo_root = Path(__file__).resolve().parents[2]
    path = repo_root / "schemas" / "tools" / name
    return json.loads(path.read_text(encoding="utf-8"))


def _registry() -> Registry:
    repo_root = Path(__file__).resolve().parents[2]
    base = (repo_root / "schemas" / "tools").resolve()

    resources = {}
    for path in sorted(base.glob("*.json")):
        schema = json.loads(path.read_text(encoding="utf-8"))
        schema_id = schema.get("$id")
        if not schema_id:
            continue
        resources[schema_id] = Resource.from_contents(schema, default_specification=DRAFT202012)

    return Registry().with_resources(resources)


def _validator(schema: dict):
    return jsonschema.Draft202012Validator(schema, registry=_registry())


def test_schema_validation_web_fetch_request_and_response() -> None:
    req_schema = _load_schema("web.fetch.request.schema.json")
    resp_schema = _load_schema("web.fetch.response.schema.json")

    req = {
        "agent_id": "demo-agent",
        "purpose": "schema validation",
        "request_id": "req-1",
        "context": {"correlation_id": "corr-1", "run_id": "run-1", "case_id": "case-1"},
        "inputs": {"url": "https://example.com"},
    }
    ok_resp = {
        "ok": True,
        "data": {
            "url": "https://example.com",
            "final_url": "https://example.com",
            "status": 200,
            "title": "Example",
            "extracted_text": "hello",
            "fetched_at": "2026-01-01T00:00:00Z",
        },
        "error": None,
        "source_meta": {
            "tool": "web.fetch",
            "backend": "local",
            "policy": {"decision_id": "dec-1", "outcome": "allow", "reason_codes": ["OK"]},
            "capabilities": ["http.get", "extract.text"],
            "limits": {"timeout_ms": 5000},
            "required_permissions": ["network:web"],
        },
        "correlation": {"request_id": "req-1", "correlation_id": "corr-1", "run_id": "run-1", "case_id": "case-1"},
        "timings_ms": {"total": 1.2},
        "content_hash": None,
    }

    _validator(req_schema).validate(req)
    _validator(resp_schema).validate(ok_resp)


def test_schema_validation_web_search_request_and_response() -> None:
    req_schema = _load_schema("web.search.request.schema.json")
    resp_schema = _load_schema("web.search.response.schema.json")

    req = {
        "agent_id": "demo-agent",
        "purpose": "schema validation",
        "request_id": "req-2",
        "context": {"correlation_id": "corr-2"},
        "inputs": {"query": "corestack", "max_results": 5},
    }
    ok_resp = {
        "ok": True,
        "data": {
            "query": "corestack",
            "results": [
                {
                    "title": "Corestack",
                    "url": "https://example.com",
                    "snippet": "Example snippet",
                    "source": "api",
                    "published_at": None,
                }
            ],
            "searched_at": "2026-01-01T00:00:00Z",
        },
        "error": None,
        "source_meta": {
            "tool": "web.search",
            "backend": "n8n",
            "policy": {"decision_id": "dec-2", "outcome": "allow", "reason_codes": ["OK"]},
        },
        "correlation": {"request_id": "req-2", "correlation_id": "corr-2", "run_id": None, "case_id": None},
        "timings_ms": {"total": 1.2},
        "content_hash": None,
    }

    _validator(req_schema).validate(req)
    _validator(resp_schema).validate(ok_resp)


def test_schema_validation_rejects_missing_correlation_context() -> None:
    req_schema = _load_schema("web.search.request.schema.json")
    invalid_req = {
        "agent_id": "demo-agent",
        "purpose": "schema validation",
        "inputs": {"query": "corestack"},
    }

    with pytest.raises(jsonschema.ValidationError):
        _validator(req_schema).validate(invalid_req)
