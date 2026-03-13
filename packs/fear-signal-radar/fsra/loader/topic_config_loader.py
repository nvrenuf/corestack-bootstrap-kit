from __future__ import annotations


def load_topic_config(topic_id: str) -> dict:
    """Return a mocked but plausible topic configuration for the given topic."""
    if not topic_id or not topic_id.strip():
        raise ValueError("topic_id must be a non-empty string")

    return {
        "topic_id": topic_id,
        "pillar": "work-money",
        "description": "Tracks anxiety signals about entry-level job market instability.",
        "keywords_primary": [
            "entry level jobs",
            "layoffs",
            "hiring freeze",
        ],
        "keywords_secondary": [
            "recession",
            "application ghosting",
        ],
        "platforms_enabled": ["reddit", "youtube", "news"],
        "time_window_days": 7,
        "language": "en",
    }
