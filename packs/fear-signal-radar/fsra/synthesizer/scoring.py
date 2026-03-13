from __future__ import annotations

from datetime import UTC, datetime

LOSS_WORDS = {
    "job",
    "jobs",
    "layoff",
    "layoffs",
    "fired",
    "denied",
    "debt",
    "rent",
    "kid",
    "kids",
    "foreclosure",
    "eviction",
    "unemployed",
}


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _engagement_points(item: dict) -> float:
    engagement = item.get("engagement_json")
    if not isinstance(engagement, dict):
        return 0.0
    total = 0.0
    for value in engagement.values():
        if isinstance(value, (int, float)):
            total += float(value)
    return total


def _bucket(value: float, thresholds: list[float]) -> int:
    score = 0
    for cutoff in thresholds:
        if value >= cutoff:
            score += 1
    return min(score, 5)


def score_cluster(cluster_items: list[dict], now: datetime) -> dict[str, int]:
    if not cluster_items:
        return {"volume": 0, "velocity": 0, "cross_platform": 0, "impact": 0, "total": 0}

    volume = min(5, len(cluster_items))

    engagement_sum = sum(_engagement_points(item) for item in cluster_items)
    engagement_avg = engagement_sum / len(cluster_items)

    ages: list[float] = []
    for item in cluster_items:
        published = _parse_dt(item.get("published_at"))
        if published is None:
            continue
        age_days = max((now - published).total_seconds() / 86400, 0.0)
        ages.append(age_days)
    avg_age = (sum(ages) / len(ages)) if ages else 7.0

    engagement_component = _bucket(engagement_avg, [1, 10, 25, 50, 100])
    recency_bonus = 2 if avg_age <= 1.0 else 1 if avg_age <= 3.0 else 0
    velocity = min(5, engagement_component + recency_bonus)

    platforms = {str(item.get("platform") or "").lower() for item in cluster_items}
    platform_count = len({name for name in platforms if name})
    if platform_count <= 1:
        cross_platform = 1
    elif platform_count == 2:
        cross_platform = 3
    else:
        cross_platform = 5

    corpus = " ".join(
        f"{item.get('title', '')} {item.get('text_snippet', '')}".lower() for item in cluster_items
    )
    impact_hits = sum(1 for word in LOSS_WORDS if word in corpus)
    impact = min(5, max(1, impact_hits))

    total = min(20, volume + velocity + cross_platform + impact)

    return {
        "volume": int(volume),
        "velocity": int(velocity),
        "cross_platform": int(cross_platform),
        "impact": int(impact),
        "total": int(total),
    }
