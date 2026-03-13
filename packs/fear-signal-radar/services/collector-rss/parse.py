from __future__ import annotations

from email.utils import parsedate_to_datetime
from typing import Any
from urllib.request import urlopen
import xml.etree.ElementTree as ET


def _strip_ns(tag: str) -> str:
    return tag.split("}", 1)[1] if "}" in tag else tag


def _get_child_text(node: ET.Element, names: tuple[str, ...]) -> str | None:
    for child in list(node):
        if _strip_ns(child.tag) in names and child.text:
            return child.text.strip()
    return None


def _parse_published(value: str | None):
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).utctimetuple()
    except (TypeError, ValueError):
        return None


def _parse_entry(node: ET.Element, *, is_atom: bool) -> dict[str, Any]:
    if is_atom:
        link = ""
        for child in list(node):
            if _strip_ns(child.tag) == "link":
                href = child.attrib.get("href")
                if href:
                    link = href
                    break
        title = _get_child_text(node, ("title",))
        summary = _get_child_text(node, ("summary", "content"))
        guid = _get_child_text(node, ("id",))
        published = _get_child_text(node, ("published", "updated"))
        author = None
        for child in list(node):
            if _strip_ns(child.tag) == "author":
                author = _get_child_text(child, ("name",))
                if author:
                    break
    else:
        title = _get_child_text(node, ("title",))
        summary = _get_child_text(node, ("description", "summary"))
        link = _get_child_text(node, ("link",)) or ""
        guid = _get_child_text(node, ("guid",))
        published = _get_child_text(node, ("pubDate", "published"))
        author = _get_child_text(node, ("author",))

    return {
        "title": title,
        "summary": summary,
        "link": link,
        "guid": guid,
        "id": guid,
        "author": author,
        "published": published,
        "published_parsed": _parse_published(published),
    }


def _parse_with_xml(xml_content: str) -> list[dict[str, Any]]:
    root = ET.fromstring(xml_content)
    root_name = _strip_ns(root.tag).lower()

    if root_name == "rss":
        entries: list[dict[str, Any]] = []
        for channel in list(root):
            if _strip_ns(channel.tag) != "channel":
                continue
            for item in list(channel):
                if _strip_ns(item.tag) == "item":
                    entries.append(_parse_entry(item, is_atom=False))
        return entries

    if root_name == "feed":
        return [
            _parse_entry(entry, is_atom=True)
            for entry in list(root)
            if _strip_ns(entry.tag) == "entry"
        ]

    return []


def parse_feed_content(xml_content: str) -> list[dict[str, Any]]:
    return _parse_with_xml(xml_content)


def fetch_feed_entries(feed: str) -> list[dict[str, Any]]:
    try:
        import feedparser

        parsed = feedparser.parse(feed)
        return [dict(entry) for entry in parsed.entries]
    except ModuleNotFoundError:
        with urlopen(feed, timeout=15) as response:
            xml_content = response.read().decode("utf-8", errors="replace")
        return _parse_with_xml(xml_content)
