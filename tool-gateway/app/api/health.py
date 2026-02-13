from fastapi import APIRouter

from app.core.policy import get_tool_backend
from app.core.schemas import Envelope

router = APIRouter()


@router.get("/health", response_model=Envelope)
async def health() -> Envelope:
    return Envelope(
        ok=True,
        data={"status": "healthy", "service": "tool-gateway"},
        error=None,
        source_meta={"backend": get_tool_backend()},
        timings_ms={"total": 1.0},
        content_hash=None,
    )
