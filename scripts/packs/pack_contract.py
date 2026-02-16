#!/usr/bin/env python3
"""
Pack Contract v1 validation helpers.

This module is used by the `./corestack` bash CLI for pack lifecycle commands,
and by unit tests under `tests/packs/`.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class PackValidationError(Exception):
    pass


_PACK_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")


@dataclass(frozen=True)
class PackMeta:
    pack_id: str
    pack_version: str
    required_corestack_version: str


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PackValidationError(f"missing required file: {path.name}") from exc
    except json.JSONDecodeError as exc:
        raise PackValidationError(f"invalid JSON in {path.name}: {exc.msg}") from exc


def _require_str(obj: dict[str, Any], key: str) -> str:
    val = obj.get(key)
    if not isinstance(val, str) or not val.strip():
        raise PackValidationError(f"pack.json: '{key}' must be a non-empty string")
    return val.strip()


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

    meta = _read_json(pack_json)
    if not isinstance(meta, dict):
        raise PackValidationError("pack.json: must be a JSON object")

    pack_id = _require_str(meta, "pack_id")
    pack_version = _require_str(meta, "pack_version")
    required_corestack_version = _require_str(meta, "required_corestack_version")

    if pack_id == "_template":
        raise PackValidationError("pack.json: 'pack_id' must not be '_template'")
    if not _PACK_ID_RE.match(pack_id):
        raise PackValidationError(
            "pack.json: 'pack_id' must match /^[a-z0-9][a-z0-9-]{0,62}$/"
        )

    env_text = env_example.read_text(encoding="utf-8", errors="replace")
    if not re.search(r"(?m)^[ \t]*PORT_OFFSET[ \t]*=", env_text):
        raise PackValidationError(".env.example: must declare PORT_OFFSET")

    compose_text = compose.read_text(encoding="utf-8", errors="replace")
    if re.search(r"(?m)^[ \t]*container_name[ \t]*:", compose_text):
        raise PackValidationError("compose.pack.yml: 'container_name' is forbidden")

    # Port policy: host ports must be defined via env interpolation, not hardcoded numbers.
    # Reject typical forms:
    #   - "8080:80"
    #   - 8080:80
    #   - "127.0.0.1:8080:80"
    if re.search(r'(?m)^[ \t-]*"?(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}\s*:\s*\d{1,5}"?\s*$', compose_text):
        raise PackValidationError("compose.pack.yml: hardcoded host ports are forbidden (use env vars)")
    if re.search(r'(?m)^[ \t-]*"?\d{2,5}\s*:\s*\d{1,5}"?\s*$', compose_text):
        raise PackValidationError("compose.pack.yml: hardcoded host ports are forbidden (use env vars)")

    return PackMeta(
        pack_id=pack_id,
        pack_version=pack_version,
        required_corestack_version=required_corestack_version,
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


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: pack_contract.py <validate|id> ...", file=sys.stderr)
        return 2
    cmd = argv[1]
    try:
        if cmd == "validate":
            return _cmd_validate(argv[1:])
        if cmd == "id":
            return _cmd_id(argv[1:])
    except PackValidationError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print(f"unknown command: {cmd}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
