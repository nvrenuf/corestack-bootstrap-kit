from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

from fsra.loader.source_data_loader import load_source_data
from fsra.loader.topic_config_loader import load_topic_config

from .clustering import cluster_signals
from .markdown import render_markdown
from .report import build_candidate_post_angles, build_fear_landscape, build_radar_report

OUTPUT_BASE = Path(__file__).resolve().parents[2] / "outputs"


def utcnow() -> datetime:
    return datetime.now(UTC)


def _topic_keywords(topic_config: dict) -> list[str]:
    primary = topic_config.get("keywords_primary") or []
    secondary = topic_config.get("keywords_secondary") or []
    return [str(item) for item in [*primary, *secondary] if str(item).strip()]


def _write_outputs(topic_id: str, run_id: str, report: dict) -> tuple[Path, Path]:
    output_dir = OUTPUT_BASE / topic_id / run_id
    output_dir.mkdir(parents=True, exist_ok=True)

    json_path = output_dir / "radar_report.json"
    markdown_path = output_dir / "radar_report.md"

    json_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    markdown_path.write_text(render_markdown(report), encoding="utf-8")
    return json_path, markdown_path


def synthesize_topic(run_id: UUID, topic_id: str, time_window_days: int | None = None) -> dict:
    topic_config = load_topic_config(topic_id)
    signals = load_source_data(run_id)
    now = utcnow()

    keywords = _topic_keywords(topic_config)
    clusters = cluster_signals(signals, topic_keywords=keywords)
    fear_landscape = build_fear_landscape(clusters, now=now)
    candidate_post_angles = build_candidate_post_angles(fear_landscape)

    report = build_radar_report(
        topic_id=topic_id,
        run_id=str(run_id),
        time_window_days=int(time_window_days or topic_config.get("time_window_days", 7)),
        generated_at=now.isoformat(),
        fear_landscape=fear_landscape,
        candidate_post_angles=candidate_post_angles,
    )

    _write_outputs(topic_id=topic_id, run_id=str(run_id), report=report)
    return report


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run FSRA synthesizer agent")
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--topic-id", required=True)
    parser.add_argument("--time-window-days", type=int, default=7)
    parser.add_argument("--output-base", default="")
    return parser.parse_args()


def main() -> int:
    global OUTPUT_BASE

    args = _parse_args()
    if args.output_base:
        OUTPUT_BASE = Path(args.output_base)

    run_id = UUID(args.run_id)
    report = synthesize_topic(run_id=run_id, topic_id=args.topic_id, time_window_days=args.time_window_days)
    print(json.dumps({"status": "ok", "topic_id": report["topic_id"], "run_id": report["run_id"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
