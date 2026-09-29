"""Pieces that many shapes share."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

# (x east, y north) in local roof metres. Elsewhere a pair of numbers that belong together.
Point = tuple[float, float]

Latitude = Annotated[float, Field(ge=-90, le=90, description="Degrees, north positive")]
Longitude = Annotated[float, Field(ge=-180, le=180, description="Degrees, east positive")]
Compass = Annotated[float, Field(ge=0, le=360, description="Degrees clockwise from north")]
DayOfYear = Annotated[int, Field(ge=1, le=366)]
SolarHour = Annotated[float, Field(ge=0, le=24, description="Hour of the day in solar time")]


class Input(BaseModel):
    """Base of everything a request carries: numbers must be finite."""

    model_config = ConfigDict(allow_inf_nan=False)


class Polygon(BaseModel):
    """An area in local roof metres. The rings are not closed: the last point joins the first."""

    exterior: list[Point]
    holes: list[list[Point]] = []
