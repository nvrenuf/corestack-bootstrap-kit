# RSS/News Collector (FSRA-007)

This collector parses RSS/Atom feeds, filters entries by keyword and time window,
and returns normalized SignalItem dictionaries suitable for ingest.

## Entrypoint

- `run_rss_collector(...)` in `rss_collector.py`

## Behavior

- platform: `news`
- content_type: `article`
- within-run dedupe by normalized URL
- HTML stripping and text caps:
  - title: 300
  - snippet: 2000
- no DB writes and no ingest API call in FSRA-007
