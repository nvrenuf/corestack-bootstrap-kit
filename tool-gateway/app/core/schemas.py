from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ErrorObject(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class Envelope(BaseModel):
    ok: bool
    data: Dict[str, Any]
    error: Optional[ErrorObject] = None
    source_meta: Dict[str, Any] = Field(default_factory=dict)
    timings_ms: Dict[str, float] = Field(default_factory=dict)
    content_hash: Optional[str] = None


class WebFetchInputs(BaseModel):
    url: str


class WebFetchRequest(BaseModel):
    agent_id: str
    purpose: str
    request_id: Optional[str] = None
    inputs: WebFetchInputs


class WebSearchInputs(BaseModel):
    query: str
    max_results: int = 5


class WebSearchRequest(BaseModel):
    agent_id: str
    purpose: str
    request_id: Optional[str] = None
    inputs: WebSearchInputs


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    published_at: Optional[str] = None


class WebSearchData(BaseModel):
    query: str
    results: List[SearchResult]
    searched_at: str
