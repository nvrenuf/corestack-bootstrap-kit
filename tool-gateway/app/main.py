from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.tools import router as tools_router

app = FastAPI(title="Corestack Tool Gateway", version="0.1.0")
app.include_router(health_router)
app.include_router(tools_router)
