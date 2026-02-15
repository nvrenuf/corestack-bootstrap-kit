import json
from pathlib import Path

import pytest

jsonschema = pytest.importorskip("jsonschema")
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


def _validator(schema: dict) -> jsonschema.Validator:
    return jsonschema.Draft202012Validator(schema, registry=_registry())


def test_schema_validation_web_fetch_request_and_response() -> None:
    req_schema = _load_schema("web.fetch.request.schema.json")
    resp_schema = _load_schema("web.fetch.response.schema.json")

    req = {
        "agent_id": "demo-agent",
        "purpose": "schema validation",
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
        "source_meta": {"tool": "web.fetch", "backend": "local"},
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
        "source_meta": {"tool": "web.search", "backend": "n8n"},
        "timings_ms": {"total": 1.2},
        "content_hash": None,
    }

    _validator(req_schema).validate(req)
    _validator(resp_schema).validate(ok_resp)
