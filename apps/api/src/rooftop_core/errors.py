"""Errors of the engine that the user can act on.

Each says what happened and what to do, and names the field of the project it is about, so a caller can
show the message next to the right input.
"""

from __future__ import annotations


class EngineError(Exception):
    """Base of the errors below. *field* is the name of the project field concerned, or None."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message)
        self.field = field


class WeatherNotLoaded(EngineError):
    """The project carries no weather for its site and source, and no download was asked for."""


class MissingEquipmentFile(EngineError):
    """The project names a PAN or OND file that is neither embedded nor on this machine."""


class UnsupportedProjectFormat(EngineError):
    """The project file was written in a format this version does not read."""
