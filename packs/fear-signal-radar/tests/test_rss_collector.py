from __future__ import annotations

from datetime import UTC, datetime
import importlib
import sys
from pathlib import Path

import pytest


PACK_DIR = Path(__file__).resolve().parents[1]
SERVICE_ROOT = PACK_DIR / "services" / "collector-rss"


SAMPLE_RSS = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<rss version=\"2.0\"><channel>
  <title>Sample Feed</title>
  <item>
    <guid>g-1</guid>
    <title><![CDATA[<b>Market panic spikes</b>]]></title>
    <link>https://news.example.com/path?a=1&amp;utm_source=x#frag</link>
    <description><![CDATA[<p>Fear index jumps in trading.</p>]]></description>
    <author>Reporter A</author>
    <pubDate>Mon, 24 Feb 2026 00:00:00 GMT</pubDate>
  </item>
  <item>
    <guid>g-2</guid>
    <title>Sports update only</title>
    <link>https://news.example.com/sports</link>
    <description>Nothing about this topic.</description>
    <pubDate>Mon, 24 Feb 2026 00:00:00 GMT</pubDate>
  </item>
  <item>
    <guid>g-3</guid>
    <title>Older market panic recap</title>
    <link>https://news.example.com/old?gclid=abc</link>
    <description>Old but matching keyword.</description>
    <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
  </item>
</channel></rss>
"""


DUPLICATE_RSS = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<rss version=\"2.0\"><channel>
  <title>Dup Feed</title>
  <item>
    <guid>x-1</guid>
    <title>Fear outlook</title>
    <link>https://dup.example.com/a?utm_medium=email#one</link>
    <description>Fear grows in markets.</description>
    <pubDate>Mon, 24 Feb 2026 00:00:00 GMT</pubDate>
  </item>
  <item>
    <guid>x-2</guid>
    <title>Fear outlook followup</title>
    <link>https://dup.example.com/a#two</link>
    <description>Fear grows in markets again.</description>
    <pubDate>Mon, 24 Feb 2026 00:00:00 GMT</pubDate>
  </item>
</channel></rss>
"""


MISSING_DATE_RSS = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<rss version=\"2.0\"><channel>
  <item>
    <guid>m-1</guid>
    <title>Panic without date</title>
    <link>https://missing-date.example.com/item?fbclid=zzz</link>
    <description><![CDATA[<div>Worry continues.</div>]]></description>
  </item>
</channel></rss>
"""


def _load_module(module_name: str):
    service_path = str(SERVICE_ROOT)
    if service_path not in sys.path:
        sys.path.insert(0, service_path)

    for stale in ["rss_collector", "parse", "normalize", "sanitize"]:
        if stale in sys.modules:
            del sys.modules[stale]

    return importlib.import_module(module_name)


def test_filters_keyword_time_window_and_sanitizes_caps(monkeypatch):
    collector = _load_module("rss_collector")
    parse_mod = _load_module("parse")

    entries = parse_mod.parse_feed_content(SAMPLE_RSS)

    monkeypatch.setattr(collector, "utcnow", lambda: datetime(2026, 2, 25, tzinfo=UTC))
    monkeypatch.setattr(collector, "fetch_feed_entries", lambda feed: entries)

    items = collector.run_rss_collector(
        topic_id="work-money",
        feeds=["https://feeds.example.com/sample"],
        keywords=["panic", "fear"],
        time_window_days=7,
        max_items_per_feed=25,
    )

    assert len(items) == 1
    item = items[0]
    assert item["platform"] == "news"
    assert item["content_type"] == "article"
    assert item["url"] == "https://news.example.com/path?a=1"
    assert "<" not in item["title"]
    assert "<" not in item["text_snippet"]
    assert len(item["title"]) <= 300
    assert len(item["text_snippet"]) <= 2000
    assert item["tags_json"]["feed"] == "https://feeds.example.com/sample"
    assert "panic" in item["tags_json"]["keywords_matched"]


def test_dedupes_by_normalized_url(monkeypatch):
    collector = _load_module("rss_collector")
    parse_mod = _load_module("parse")

    entries = parse_mod.parse_feed_content(DUPLICATE_RSS)

    monkeypatch.setattr(collector, "utcnow", lambda: datetime(2026, 2, 25, tzinfo=UTC))
    monkeypatch.setattr(collector, "fetch_feed_entries", lambda feed: entries)

    items = collector.run_rss_collector(
        topic_id="work-money",
        feeds=["https://feeds.example.com/dup"],
        keywords=["fear"],
        time_window_days=7,
        max_items_per_feed=25,
    )

    assert len(items) == 1
    assert items[0]["url"] == "https://dup.example.com/a"


def test_missing_published_date_kept_if_keyword_matches(monkeypatch):
    collector = _load_module("rss_collector")
    parse_mod = _load_module("parse")

    entries = parse_mod.parse_feed_content(MISSING_DATE_RSS)

    monkeypatch.setattr(collector, "utcnow", lambda: datetime(2026, 2, 25, tzinfo=UTC))
    monkeypatch.setattr(collector, "fetch_feed_entries", lambda feed: entries)

    items = collector.run_rss_collector(
        topic_id="work-money",
        feeds=["https://feeds.example.com/missing-date"],
        keywords=["panic", "worry"],
        time_window_days=7,
        max_items_per_feed=25,
    )

    assert len(items) == 1
    assert items[0]["published_at"] is None
    assert items[0]["url"] == "https://missing-date.example.com/item"
