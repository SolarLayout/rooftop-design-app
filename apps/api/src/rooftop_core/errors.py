"""Errors of the engine that the user can act on.

Each says what happened and what to do, and names the field of the project it is about, so a caller can
show the message next to the right input.
"""

from __future__ import annotations

import math


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


class UnusableWeatherFile(EngineError):
    """The CSV weather file is missing, is no table of hours, or has hours that cannot be used."""


class RoofTooLarge(EngineError):
    """The outline covers more than one design takes (plan/phase-11-plan.md, decision 11).

    The words say the area, the limit and what to do. The area is told as the next whole square metre,
    so that a refused roof never reads as the limit itself.
    """

    def __init__(self, area_m2: float, limit_m2: float, field: str | None = None):
        self.area_m2 = area_m2
        self.limit_m2 = limit_m2
        super().__init__(
            f"This outline covers {math.ceil(area_m2):,} m². SolarLayout designs one roof at a time, "
            f"up to {math.ceil(limit_m2):,} m² (about 3 MWp). For a larger site, outline each building "
            "as its own design.",
            field,
        )
