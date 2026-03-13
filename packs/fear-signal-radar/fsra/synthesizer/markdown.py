from __future__ import annotations


def render_markdown(report: dict) -> str:
    lines: list[str] = []
    lines.append(f"# Fear Signal Radar Report: {report['topic_id']}")
    lines.append("")
    lines.append(f"- Run ID: {report['run_id']}")
    lines.append(f"- Time Window Days: {report['time_window_days']}")
    lines.append(f"- Generated At: {report['generated_at']}")
    lines.append("")
    lines.append("## Fear Landscape")
    lines.append("")

    for index, fear in enumerate(report.get("fear_landscape", []), start=1):
        score = fear.get("score", {})
        lines.append(f"### {index}. {fear.get('fear_label', 'Unknown')}")
        lines.append(f"- Total Score: {score.get('total', 0)}")
        lines.append(f"- In Their Words: {fear.get('fear_statement_in_their_words', '')}")
        lines.append(f"- Mechanism: {fear.get('mechanism', '')}")
        lines.append("- Representative Phrasings:")
        for phrasing in fear.get("representative_phrasings", []):
            lines.append(f"  - {phrasing}")
        lines.append("- Top Sources:")
        for source in fear.get("top_sources", []):
            lines.append(f"  - {source}")
        lines.append("")

    lines.append("## Candidate Post Angles")
    lines.append("")

    for index, angle in enumerate(report.get("candidate_post_angles", []), start=1):
        lines.append(f"### {index}. {angle.get('hook', '')}")
        lines.append(f"- Mechanism: {angle.get('mechanism', '')}")
        lines.append(f"- Who Hits First: {angle.get('who_hits_first', '')}")
        lines.append("- Actions (7 days):")
        for action in angle.get("actions_7", []):
            lines.append(f"  - {action}")
        lines.append("- Actions (30 days):")
        for action in angle.get("actions_30", []):
            lines.append(f"  - {action}")
        lines.append("- Actions (90 days):")
        for action in angle.get("actions_90", []):
            lines.append(f"  - {action}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"
