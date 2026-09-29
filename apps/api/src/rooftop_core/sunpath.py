"""The sun of one day in solar time, from the engine's `sun_solar_time`.

Sunrise and sunset are the hours at which that same function gives an elevation of zero, so a sun path
drawn from here agrees with the shadows and the row pitch of the engine.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .geometry import solstice_doy, sun_solar_time

NOON = 12.0
DAY_H = 24.0
HALVINGS = 60  # of the twelve hours before noon: far below any precision that matters


@dataclass(frozen=True)
class SunPosition:
    hour: float  # solar time
    elevation_deg: float  # above the horizon; negative at night
    azimuth_deg: float  # clockwise from north


def day_of_year(day: int | None, lat: float) -> int:
    """The day given, or the design day: the winter solstice of the hemisphere of *lat*."""
    return solstice_doy(lat) if day is None else day


def sun_positions(lat: float, doy: int, hours: list[float]) -> list[SunPosition]:
    return [SunPosition(hour, *sun_solar_time(lat, doy, hour)) for hour in hours]


def hours_by_step(step_h: float) -> list[float]:
    """Solar hours from midnight to midnight, one every *step_h*."""
    if step_h <= 0:
        raise ValueError("The step must be more than 0 hours.")
    count = math.floor(DAY_H / step_h + 1e-9)
    return [round(i * step_h, 9) for i in range(count + 1)]


def sunrise_sunset(lat: float, doy: int) -> tuple[float, float] | None:
    """(sunrise, sunset) in solar hours, or None where the sun stays up or down all day.

    Solar time is symmetric about noon, so the sun sets as long after noon as it rose before.
    """
    if sun_solar_time(lat, doy, 0.0)[0] >= 0 or sun_solar_time(lat, doy, NOON)[0] <= 0:
        return None
    below, above = 0.0, NOON
    for _ in range(HALVINGS):
        middle = (below + above) / 2
        if sun_solar_time(lat, doy, middle)[0] < 0:
            below = middle
        else:
            above = middle
    sunrise = (below + above) / 2
    return sunrise, DAY_H - sunrise
