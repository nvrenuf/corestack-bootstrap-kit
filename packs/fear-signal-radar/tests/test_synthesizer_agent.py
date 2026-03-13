from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from uuid import uuid4


def _sample_topic_config(topic_id: str) -> dict:
    return {
        "topic_id": topic_id,
        "pillar": "work-money",
        "description": "Tracks collapse signals in entry-level work access.",
        "keywords_primary": [
            "layoff",
            "job",
            "hiring",
            "rent",
            "debt",
            "denied",
        ],
        "keywords_secondary": ["junior", "entry-level", "interview"],
        "platforms_enabled": ["reddit", "youtube", "news"],
        "scoring_weights": {
            "volume": 2,
            "velocity": 1,
            "cross_platform": 1,
            "impact": 1,
        },
        "time_window_days": 7,
        "language": "en",
    }


def _sample_signals(now: datetime) -> list[dict]:
    recent = (now - timedelta(days=1)).isoformat()
    return [
        {
            "platform": "reddit",
            "content_type": "post",
            "url": "https://reddit.com/r/jobs/1",
            "title": "Layoff wave and rent panic",
            "text_snippet": "I got fired and now cannot pay rent.",
            "published_at": recent,
            "engagement_json": {"score": 40, "comments": 16},
            "tags_json": {},
            "raw_ref_json": {},
        },
        {
            "platform": "youtube",
            "content_type": "comment",
            "url": "https://youtube.com/watch?v=abc",
            "title": "",
            "text_snippet": "Hiring freeze means no junior jobs and more debt.",
            "published_at": recent,
            "engagement_json": {"likeCount": 17},
            "tags_json": {},
            "raw_ref_json": {},
        },
        {
            "platform": "news",
            "content_type": "article",
            "url": "https://news.example.com/economy",
            "title": "Applicants denied after final rounds",
            "text_snippet": "More entry-level candidates denied despite strong interviews.",
            "published_at": recent,
            "engagement_json": {"views": 90},
            "tags_json": {},
            "raw_ref_json": {},
        },
        {
            "platform": "news",
            "content_type": "article",
            "url": "https://news.example.com/ai",
            "title": "AI agents replace repetitive work",
            "text_snippet": "Vendors pitch automation to reduce junior headcount.",
            "published_at": recent,
            "engagement_json": {"views": 20},
            "tags_json": {},
            "raw_ref_json": {},
        },
    ]


def test_synthesizer_generates_sorted_report_and_exports(monkeypatch, tmp_path):
    from fsra.synthesizer import synthesizer_agent

    topic_id = "work-money_entry-level-collapse"
    run_id = uuid4()
    now = datetime(2026, 2, 25, tzinfo=UTC)

    monkeypatch.setattr(synthesizer_agent, "utcnow", lambda: now)
    monkeypatch.setattr(
        synthesizer_agent,
        "load_topic_config",
        lambda incoming_topic_id: _sample_topic_config(incoming_topic_id),
    )
    monkeypatch.setattr(
        synthesizer_agent,
        "load_source_data",
        lambda incoming_run_id: _sample_signals(now),
    )
    monkeypatch.setattr(synthesizer_agent, "OUTPUT_BASE", tmp_path)

    report = synthesizer_agent.synthesize_topic(run_id=run_id, topic_id=topic_id)

    assert report["topic_id"] == topic_id
    assert report["run_id"] == str(run_id)
    assert report["time_window_days"] == 7
    assert isinstance(report["fear_landscape"], list)
    assert len(report["fear_landscape"]) >= 2
    assert isinstance(report["candidate_post_angles"], list)
    assert 3 <= len(report["candidate_post_angles"]) <= 5

    totals = [item["score"]["total"] for item in report["fear_landscape"]]
    assert totals == sorted(totals, reverse=True)

    out_dir = tmp_path / topic_id / str(run_id)
    json_path = out_dir / "radar_report.json"
    md_path = out_dir / "radar_report.md"

    assert json_path.exists()
    assert md_path.exists()

    persisted = json.loads(json_path.read_text(encoding="utf-8"))
    assert persisted["topic_id"] == topic_id

    markdown_text = md_path.read_text(encoding="utf-8")
    assert "Fear Landscape" in markdown_text
    assert "Candidate Post Angles" in markdown_text
    assert report["candidate_post_angles"][0]["hook"] in markdown_text
