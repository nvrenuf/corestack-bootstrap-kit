from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class VideoMeta:
    video_id: str
    published_at: datetime
    channel_id: str | None
    channel_title: str | None
    title: str | None
    description: str | None
    view_count: int
    like_count: int
    comment_count: int
    query: str


@dataclass(frozen=True)
class CommentMeta:
    comment_id: str
    thread_id: str | None
    video_id: str
    published_at: datetime | None
    author: str | None
    author_channel_id: str | None
    text: str
    like_count: int
    query: str
