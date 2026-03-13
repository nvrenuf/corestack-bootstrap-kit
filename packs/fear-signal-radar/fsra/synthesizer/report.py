from __future__ import annotations

from datetime import datetime

from .scoring import score_cluster


def _cluster_label(cluster_items: list[dict]) -> str:
    text = " ".join(f"{item.get('title', '')} {item.get('text_snippet', '')}" for item in cluster_items).lower()
    if "layoff" in text or "fired" in text:
        return "Job Loss Shock"
    if "rent" in text or "debt" in text:
        return "Cost Pressure Spiral"
    if "hiring" in text or "denied" in text:
        return "Hiring Gate Collapse"
    return "General Economic Fear"


def _representative_phrasings(cluster_items: list[dict], limit: int = 3) -> list[str]:
    phrases: list[str] = []
    for item in cluster_items:
        snippet = str(item.get("text_snippet") or item.get("title") or "").strip()
        if snippet:
            phrases.append(snippet)
    return phrases[:limit]


def _top_sources(cluster_items: list[dict], limit: int = 3) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for item in cluster_items:
        url = str(item.get("url") or "")
        if not url or url in seen:
            continue
        seen.add(url)
        urls.append(url)
    return urls[:limit]


def _who_it_hits(cluster_items: list[dict]) -> list[str]:
    text = " ".join(f"{item.get('title', '')} {item.get('text_snippet', '')}" for item in cluster_items).lower()
    groups: list[str] = []
    if "junior" in text or "entry" in text:
        groups.append("new graduates and junior workers")
    if "rent" in text or "debt" in text:
        groups.append("households with low cash buffer")
    if not groups:
        groups.append("workers facing unstable hiring cycles")
    return groups


def _trigger_events(cluster_items: list[dict]) -> list[str]:
    text = " ".join(f"{item.get('title', '')} {item.get('text_snippet', '')}" for item in cluster_items).lower()
    events: list[str] = []
    if "layoff" in text or "fired" in text:
        events.append("public layoff announcements")
    if "hiring" in text or "denied" in text:
        events.append("hiring freezes and rejection waves")
    if not events:
        events.append("spikes in anxious user reports")
    return events


def _mechanism(label: str) -> str:
    return (
        f"{label} intensifies when people see repeated negative hiring signals, "
        "causing defensive decisions and lower confidence."
    )


def build_fear_landscape(clusters: list[dict], now: datetime) -> list[dict]:
    fears: list[dict] = []

    for cluster in clusters:
        items = list(cluster.get("items") or [])
        if not items:
            continue

        label = _cluster_label(items)
        score = score_cluster(items, now=now)
        representative = _representative_phrasings(items)
        statement = representative[0] if representative else label

        fears.append(
            {
                "fear_label": label,
                "score": score,
                "fear_statement_in_their_words": statement,
                "who_it_hits": _who_it_hits(items),
                "trigger_events": _trigger_events(items),
                "mechanism": _mechanism(label),
                "representative_phrasings": representative,
                "top_sources": _top_sources(items),
                "safe_claims": [
                    "Posts and comments repeatedly mention hiring uncertainty.",
                    "Multiple sources describe reduced confidence in near-term job stability.",
                ],
                "uncertain_claims": [
                    "The exact macroeconomic cause is still uncertain.",
                ],
            }
        )

    fears.sort(key=lambda item: item["score"]["total"], reverse=True)
    return fears


def build_candidate_post_angles(fear_landscape: list[dict]) -> list[dict]:
    if not fear_landscape:
        return []

    target = min(5, max(3, len(fear_landscape)))
    angles: list[dict] = []

    for idx in range(target):
        fear = fear_landscape[idx % len(fear_landscape)]
        phrasing = (fear.get("representative_phrasings") or [fear["fear_statement_in_their_words"]])[0]
        angles.append(
            {
                "hook": f"{fear['fear_label']}: {phrasing[:110]}",
                "mechanism": fear["mechanism"],
                "who_hits_first": (fear.get("who_it_hits") or ["front-line workers"])[0],
                "actions_7": [
                    "Audit immediate cash burn and pause non-essential spend.",
                    "Send targeted applications to active hiring channels only.",
                ],
                "actions_30": [
                    "Build a role-adjacent project artifact for proof of capability.",
                    "Expand outreach to cross-functional hiring managers.",
                ],
                "actions_90": [
                    "Create resilience plan with backup income pathways.",
                    "Reassess skills roadmap against demand signals every month.",
                ],
            }
        )

    return angles


def build_radar_report(
    topic_id: str,
    run_id: str,
    time_window_days: int,
    generated_at: str,
    fear_landscape: list[dict],
    candidate_post_angles: list[dict],
) -> dict:
    return {
        "topic_id": topic_id,
        "run_id": run_id,
        "time_window_days": time_window_days,
        "generated_at": generated_at,
        "fear_landscape": fear_landscape,
        "candidate_post_angles": candidate_post_angles,
    }
