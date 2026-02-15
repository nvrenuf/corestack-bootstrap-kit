"""Minimal vendored referencing subset for offline tool-system tests."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class Resource:
    contents: Any
    specification: Any | None = None

    @classmethod
    def from_contents(cls, contents: Any, default_specification: Any | None = None) -> "Resource":
        return cls(contents=contents, specification=default_specification)


class Registry:
    def __init__(self, resources: dict[str, Resource] | None = None) -> None:
        self.resources = resources or {}

    def with_resources(self, resources: dict[str, Resource]) -> "Registry":
        merged = dict(self.resources)
        merged.update(resources)
        return Registry(merged)
