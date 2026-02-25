from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

import pytest
import yaml
from jsonschema import Draft7Validator
from jsonschema.exceptions import ValidationError

PACK_DIR = Path(__file__).resolve().parents[1]
SCHEMA_PATH = PACK_DIR / "schemas" / "topic_config.schema.json"
TOPIC_PATH = PACK_DIR / "configs" / "topics" / "work-money_entry-level-collapse.yaml"


def _load_schema() -> dict:
    assert SCHEMA_PATH.exists(), f"Schema not found: {SCHEMA_PATH}"
    with SCHEMA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_topic() -> dict:
    assert TOPIC_PATH.exists(), f"Topic config not found: {TOPIC_PATH}"
    with TOPIC_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _validate(config: dict) -> None:
    schema = _load_schema()
    validator = Draft7Validator(schema)
    errors = sorted(validator.iter_errors(config), key=lambda e: list(e.path))
    if errors:
        raise ValidationError(errors[0].message)


def test_schema_validates_correct_topic() -> None:
    _validate(_load_topic())


@pytest.mark.parametrize(
    "missing_key",
    [
        "topic_id",
        "pillar",
        "description",
        "keywords_primary",
        "platforms_enabled",
        "scoring_weights",
    ],
)
def test_missing_required_field_fails(missing_key: str) -> None:
    topic = deepcopy(_load_topic())
    topic.pop(missing_key, None)
    with pytest.raises(ValidationError):
        _validate(topic)


def test_description_min_length_enforced() -> None:
    topic = deepcopy(_load_topic())
    topic["description"] = "too short"
    with pytest.raises(ValidationError):
        _validate(topic)


def test_keywords_primary_min_items_enforced() -> None:
    topic = deepcopy(_load_topic())
    topic["keywords_primary"] = []
    with pytest.raises(ValidationError):
        _validate(topic)


def test_invalid_platform_enum_fails() -> None:
    topic = deepcopy(_load_topic())
    topic["platforms_enabled"] = topic["platforms_enabled"] + ["tiktok"]
    with pytest.raises(ValidationError):
        _validate(topic)


def test_missing_scoring_weight_field_fails() -> None:
    topic = deepcopy(_load_topic())
    topic["scoring_weights"].pop("velocity", None)
    with pytest.raises(ValidationError):
        _validate(topic)


def test_scoring_weights_range_enforced() -> None:
    topic = deepcopy(_load_topic())
    topic["scoring_weights"]["volume"] = 10
    with pytest.raises(ValidationError):
        _validate(topic)


def test_additional_property_rejected() -> None:
    topic = deepcopy(_load_topic())
    topic["unexpected"] = "nope"
    with pytest.raises(ValidationError):
        _validate(topic)


def test_optional_fields_can_be_omitted() -> None:
    topic = deepcopy(_load_topic())
    for key in [
        "keywords_secondary",
        "news_queries",
        "rss_feeds",
        "time_window_days",
        "language",
        "exclusions",
    ]:
        topic.pop(key, None)
    _validate(topic)


def test_reddit_requires_non_empty_subreddits() -> None:
    topic = deepcopy(_load_topic())
    assert "reddit" in topic["platforms_enabled"]

    topic_missing = deepcopy(topic)
    topic_missing.pop("subreddits", None)
    with pytest.raises(ValidationError):
        _validate(topic_missing)

    topic_empty = deepcopy(topic)
    topic_empty["subreddits"] = []
    with pytest.raises(ValidationError):
        _validate(topic_empty)


def test_youtube_requires_non_empty_queries() -> None:
    topic = deepcopy(_load_topic())
    assert "youtube" in topic["platforms_enabled"]

    topic_missing = deepcopy(topic)
    topic_missing.pop("youtube_queries", None)
    with pytest.raises(ValidationError):
        _validate(topic_missing)

    topic_empty = deepcopy(topic)
    topic_empty["youtube_queries"] = []
    with pytest.raises(ValidationError):
        _validate(topic_empty)


def test_no_duplicate_platforms() -> None:
    topic = deepcopy(_load_topic())
    topic["platforms_enabled"] = ["reddit", "reddit", "youtube"]
    with pytest.raises(ValidationError):
        _validate(topic)
