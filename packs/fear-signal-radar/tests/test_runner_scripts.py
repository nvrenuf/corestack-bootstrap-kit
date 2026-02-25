from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from uuid import uuid4


PACK_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PACK_ROOT / "scripts"


def test_scripts_use_strict_bash_options():
    run_topic = (SCRIPTS_DIR / "run_topic.sh").read_text(encoding="utf-8")
    export_report = (SCRIPTS_DIR / "export_report.sh").read_text(encoding="utf-8")

    assert "set -euo pipefail" in run_topic
    assert "set -euo pipefail" in export_report


def test_run_topic_offline_generates_report_files(tmp_path):
    run_id = str(uuid4())
    env = os.environ.copy()
    env["MODE"] = "offline"
    env["FSRA_OUTPUT_BASE"] = str(tmp_path)

    command = [
        "bash",
        str(SCRIPTS_DIR / "run_topic.sh"),
        "work-money_entry-level-collapse",
        "7",
        run_id,
    ]

    result = subprocess.run(
        command,
        cwd=PACK_ROOT,
        env=env,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr

    output_dir = tmp_path / "work-money_entry-level-collapse" / run_id
    report_json = output_dir / "radar_report.json"
    report_md = output_dir / "radar_report.md"
    assert report_json.exists()
    assert report_md.exists()

    report = json.loads(report_json.read_text(encoding="utf-8"))
    assert report["topic_id"] == "work-money_entry-level-collapse"
    assert report["run_id"] == run_id


def test_export_report_script_validates_report_exists(tmp_path):
    topic_id = "work-money_entry-level-collapse"
    run_id = str(uuid4())

    output_dir = tmp_path / topic_id / run_id
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "radar_report.json").write_text("{}", encoding="utf-8")
    (output_dir / "radar_report.md").write_text("# report", encoding="utf-8")

    env = os.environ.copy()
    env["FSRA_OUTPUT_BASE"] = str(tmp_path)

    ok = subprocess.run(
        ["bash", str(SCRIPTS_DIR / "export_report.sh"), topic_id, run_id],
        cwd=PACK_ROOT,
        env=env,
        check=False,
        capture_output=True,
        text=True,
    )
    assert ok.returncode == 0
    assert "radar_report.json" in ok.stdout

    missing = subprocess.run(
        ["bash", str(SCRIPTS_DIR / "export_report.sh"), topic_id, str(uuid4())],
        cwd=PACK_ROOT,
        env=env,
        check=False,
        capture_output=True,
        text=True,
    )
    assert missing.returncode != 0
