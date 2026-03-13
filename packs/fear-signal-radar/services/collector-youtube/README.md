# YouTube Collector (FSRA-006)

This service collects recent YouTube videos and top comments for configured queries,
then normalizes records into SignalItem dictionaries suitable for ingest.

## Environment

- `YOUTUBE_API_KEY` (required)
- `EGRESS_PROXY_URL` (optional)

## Entrypoint

- `run_youtube_collector(...)` in `youtube_collector.py`

The collector does not write to the database and does not call ingest directly in FSRA-006.
