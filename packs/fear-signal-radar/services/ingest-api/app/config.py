from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os


@dataclass(frozen=True)
class Settings:
    ingest_token: str
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str
    max_body_bytes: int = 256 * 1024

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            ingest_token=os.environ.get("INGEST_TOKEN", ""),
            db_host=os.environ.get("INGEST_DB_HOST", "localhost"),
            db_port=int(os.environ.get("INGEST_DB_PORT", "5432")),
            db_name=os.environ.get("INGEST_DB_NAME", "postgres"),
            db_user=os.environ.get("INGEST_DB_USER", "ingest_writer"),
            db_password=os.environ.get("INGEST_DB_PASSWORD", "ingest_writer"),
            max_body_bytes=int(os.environ.get("INGEST_MAX_BODY_BYTES", str(256 * 1024))),
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings.from_env()
    if not settings.ingest_token:
        raise RuntimeError("INGEST_TOKEN must be set")
    if settings.db_user != "ingest_writer":
        raise RuntimeError("Ingest API must run with ingest_writer credentials")
    return settings
