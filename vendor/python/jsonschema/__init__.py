"""Minimal vendored jsonschema subset for offline tool-system tests.

This lightweight module implements only the API surface used by tests/tool-system.
It is not a full JSON Schema implementation.
"""

from __future__ import annotations

from typing import Any


class ValidationError(Exception):
    """Raised when a value fails lightweight validation."""


class Draft202012Validator:
    def __init__(self, schema: dict[str, Any], registry: Any | None = None) -> None:
        self.schema = schema
        self.registry = registry

    def validate(self, instance: Any) -> None:
        _validate_against_schema(self.schema, instance)


Validator = Draft202012Validator


def _validate_against_schema(schema: dict[str, Any], instance: Any) -> None:
    schema_type = schema.get("type")

    if schema_type == "object":
        if not isinstance(instance, dict):
            raise ValidationError("expected object")
        for key in schema.get("required", []):
            if key not in instance:
                raise ValidationError(f"missing required field: {key}")
        properties = schema.get("properties", {})
        for key, subschema in properties.items():
            if key in instance and isinstance(subschema, dict):
                _validate_against_schema(subschema, instance[key])
        return

    if schema_type == "array":
        if not isinstance(instance, list):
            raise ValidationError("expected array")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for item in instance:
                _validate_against_schema(item_schema, item)
        return

    if schema_type == "string" and not isinstance(instance, str):
        raise ValidationError("expected string")
    if schema_type == "number" and not isinstance(instance, (int, float)):
        raise ValidationError("expected number")
    if schema_type == "integer" and not isinstance(instance, int):
        raise ValidationError("expected integer")
    if schema_type == "boolean" and not isinstance(instance, bool):
        raise ValidationError("expected boolean")
