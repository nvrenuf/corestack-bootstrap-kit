from __future__ import annotations

import re
from collections.abc import Iterable

TokenSet = set[str]
Cluster = dict[str, object]

_WORD_RE = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> TokenSet:
    return {match.group(0) for match in _WORD_RE.finditer(text.lower())}


def jaccard_similarity(left: TokenSet, right: TokenSet) -> float:
    if not left and not right:
        return 1.0
    union = left | right
    if not union:
        return 0.0
    return len(left & right) / len(union)


def _signal_tokens(signal: dict, keyword_tokens: TokenSet) -> TokenSet:
    text = f"{signal.get('title', '')} {signal.get('text_snippet', '')}".strip()
    tokens = tokenize(text)
    narrowed = tokens & keyword_tokens
    return narrowed if narrowed else tokens


def cluster_signals(
    signals: Iterable[dict],
    topic_keywords: Iterable[str],
    threshold: float = 0.35,
) -> list[Cluster]:
    keyword_tokens = tokenize(" ".join(topic_keywords))
    clusters: list[Cluster] = []

    for signal in signals:
        tokens = _signal_tokens(signal, keyword_tokens)
        if not tokens:
            continue

        best_index = -1
        best_similarity = 0.0
        for index, cluster in enumerate(clusters):
            similarity = jaccard_similarity(tokens, cluster["tokens"])
            if similarity > best_similarity:
                best_similarity = similarity
                best_index = index

        if best_index >= 0 and best_similarity >= threshold:
            target = clusters[best_index]
            target["items"].append(signal)
            target["tokens"] = target["tokens"] | tokens
            continue

        clusters.append({"items": [signal], "tokens": tokens})

    return clusters
