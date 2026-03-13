from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4


def load_source_data(run_id: UUID) -> list:
    """Return mocked source records for an in-flight synthesis run."""
    timestamp = datetime.now(UTC).isoformat()
    run_ref = str(run_id)

    return [
        {
            "source_record_id": str(uuid4()),
            "run_id": run_ref,
            "topic_id": "work-money_entry-level-collapse",
            "platform": "reddit",
            "url": "https://reddit.com/r/jobs/comments/mock1",
            "title": "Entry-level applicants report 200+ applications",
            "text_snippet": "Posters describe prolonged job searches and reduced callbacks.",
            "collected_at": timestamp,
        },
        {
            "source_record_id": str(uuid4()),
            "run_id": run_ref,
            "topic_id": "work-money_entry-level-collapse",
            "platform": "youtube",
            "url": "https://youtube.com/watch?v=mock2",
            "title": "Career channel covers hiring freezes",
            "text_snippet": "Comments cite fewer junior openings and lower response rates.",
            "collected_at": timestamp,
        },
        {
            "source_record_id": str(uuid4()),
            "run_id": run_ref,
            "topic_id": "work-money_entry-level-collapse",
            "platform": "news",
            "url": "https://example.com/economy/entry-level-trends",
            "title": "Regional employers scale back graduate hiring",
            "text_snippet": "News reporting shows delayed hiring cycles in multiple sectors.",
            "collected_at": timestamp,
        },
    ]
