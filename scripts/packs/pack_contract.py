#!/usr/bin/env python3
"""Pack Contract v1 validation helpers."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Prefer vendored jsonschema/referencing for reproducible local runs.
VENDOR_PYTHON = Path(__file__).resolve().parents[2] / "vendor" / "python"
if str(VENDOR_PYTHON) not in sys.path:
    sys.path.insert(0, str(VENDOR_PYTHON))

import jsonschema


class PackValidationError(Exception):
    pass


@dataclass(frozen=True)
class PackMeta:
    pack_id: str
    version: str
    required_corestack_version: str


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PackValidationError(f"missing required file: {path.name}") from exc
    except json.JSONDecodeError as exc:
        raise PackValidationError(f"invalid JSON in {path.name}: {exc.msg}") from exc


def _load_schema() -> dict[str, Any]:
    schema_path = Path(__file__).resolve().parents[2] / "schemas" / "packs" / "pack.schema.json"
    if not schema_path.is_file():
        raise PackValidationError(f"missing required file: {schema_path}")
    schema = _read_json(schema_path)
    if not isinstance(schema, dict):
        raise PackValidationError("pack schema must be a JSON object")
    return schema


def _validate_schema(meta: Any) -> dict[str, Any]:
    if not isinstance(meta, dict):
        raise PackValidationError("pack.json: must be a JSON object")

    schema = _load_schema()
    validator = jsonschema.Draft202012Validator(schema)
    if hasattr(validator, "iter_errors"):
        errors = sorted(validator.iter_errors(meta), key=lambda e: list(e.path))
        if errors:
            first = errors[0]
            loc = ".".join(str(p) for p in first.path) or "root"
            raise PackValidationError(f"pack.json schema validation failed at {loc}: {first.message}")
    else:
        try:
            validator.validate(meta)
        except Exception as exc:  # vendored jsonschema shim raises ValidationError
            raise PackValidationError(f"pack.json schema validation failed: {exc}") from exc
    return meta


def _validate_compose_policy(compose_text: str) -> None:
    if re.search(r"(?m)^[ \t]*container_name[ \t]*:", compose_text):
        raise PackValidationError("compose.pack.yml: 'container_name' is forbidden")

    # Heuristic: reject host port mappings that are numeric literals instead of env vars.
    # This checks common shorthand list forms and may not detect all YAML variants.
    for line in compose_text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("-"):
            continue
        value = stripped.lstrip("-").strip().strip("\"'")
        if "${" in value:
            continue

        # 8080:80, 8080:80/tcp
        if re.match(r"^\d{2,5}:\d{1,5}(?:/(tcp|udp))?$", value):
            raise PackValidationError(
                "compose.pack.yml: hardcoded host ports are forbidden (use env vars + PORT_OFFSET strategy)"
            )

        # 127.0.0.1:8080:80, 0.0.0.0:8080:80/tcp
        if re.match(r"^(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}:\d{1,5}(?:/(tcp|udp))?$", value):
            raise PackValidationError(
                "compose.pack.yml: hardcoded host ports are forbidden (use env vars + PORT_OFFSET strategy)"
            )


def validate_pack_dir(pack_dir: Path) -> PackMeta:
    if not pack_dir.exists() or not pack_dir.is_dir():
        raise PackValidationError("pack path must be a directory")

    pack_json = pack_dir / "pack.json"
    compose = pack_dir / "compose.pack.yml"
    env_example = pack_dir / ".env.example"

    if not pack_json.is_file():
        raise PackValidationError("missing required file: pack.json")
    if not compose.is_file():
        raise PackValidationError("missing required file: compose.pack.yml")
    if not env_example.is_file():
        raise PackValidationError("missing required file: .env.example")

    meta = _validate_schema(_read_json(pack_json))

    compose_text = compose.read_text(encoding="utf-8", errors="replace")
    _validate_compose_policy(compose_text)

    return PackMeta(
        pack_id=str(meta["id"]).strip(),
        version=str(meta["version"]).strip(),
        required_corestack_version=str(meta["required_corestack_version"]).strip(),
    )


def ensure_env_file(pack_dir: Path) -> Path:
    env_path = pack_dir / ".env"
    if env_path.exists():
        return env_path

    env_example = pack_dir / ".env.example"
    if not env_example.exists():
        raise PackValidationError("missing required file: .env.example")

    env_path.write_text(env_example.read_text(encoding="utf-8"), encoding="utf-8")
    return env_path


def _cmd_validate(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: pack_contract.py validate <pack-dir>", file=sys.stderr)
        return 2
    meta = validate_pack_dir(Path(argv[1]))
    print(json.dumps(meta.__dict__, separators=(",", ":"), ensure_ascii=True))
    return 0


def _cmd_id(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: pack_contract.py id <pack-dir>", file=sys.stderr)
        return 2
    meta = validate_pack_dir(Path(argv[1]))
    print(meta.pack_id)
    return 0


def _cmd_ensure_env(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: pack_contract.py ensure-env <pack-dir>", file=sys.stderr)
        return 2
    path = ensure_env_file(Path(argv[1]))
    print(str(path))
    return 0


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: pack_contract.py <validate|id|ensure-env> ...", file=sys.stderr)
        return 2
    cmd = argv[1]
    try:
        if cmd == "validate":
            return _cmd_validate(argv[1:])
        if cmd == "id":
            return _cmd_id(argv[1:])
        if cmd == "ensure-env":
            return _cmd_ensure_env(argv[1:])
    except PackValidationError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(f"unknown command: {cmd}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
