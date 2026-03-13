from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os


def _required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} must be set")
    return value


@dataclass(frozen=True)
class Settings:
    ingest_token: str
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str
    db_role: str
    max_body_bytes: int = 256 * 1024

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            ingest_token=_required_env("INGEST_TOKEN"),
            db_host=_required_env("INGEST_DB_HOST"),
            db_port=int(_required_env("INGEST_DB_PORT")),
            db_name=_required_env("INGEST_DB_NAME"),
            db_user=_required_env("INGEST_DB_USER"),
            db_password=_required_env("INGEST_DB_PASSWORD"),
            db_role="ingest_writer",
            max_body_bytes=int(os.environ.get("INGEST_MAX_BODY_BYTES", str(256 * 1024))),
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings.from_env()
    return settings
