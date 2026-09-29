"""The sun of one day in solar time, and the shadows it casts on the roof."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, Field, model_validator

from rooftop_api.schemas.common import DayOfYear, Input, Latitude, Longitude, Polygon, SolarHour
from rooftop_api.schemas.project import Project

DESIGN_DAY = "design_day"


class ShadowRequest(Input):
    """Shadows of the parapet and the obstacles of a project at one solar hour."""

    project: Project
    hour: SolarHour
    plane_height_m: Annotated[
        float, Field(ge=0, description="Height above the roof of the plane they fall on")
    ] = 0.0


class SunRequest(Input):
    """A place, a day, and the hours wanted: either a list or a step from midnight to midnight."""

    lat: Latitude
    lon: Longitude
    day: DayOfYear | Literal["design_day"] = Field(
        description="Day of the year, or design_day: the winter solstice of the hemisphere (355 or 172)"
    )
    hours: Annotated[list[SolarHour], Field(min_length=1, max_length=1500)] | None = None
    step_h: Annotated[float, Field(ge=1 / 60, le=24)] | None = None
    shadows: ShadowRequest | None = None

    @model_validator(mode="after")
    def asks_for_hours_in_one_way(self) -> Self:
        if (self.hours is None) == (self.step_h is None):
            raise ValueError("give either the hours or a step, not both and not neither")
        return self


class SunPosition(BaseModel):
    hour: float
    elevation_deg: float = Field(description="Above the horizon; negative at night")
    azimuth_deg: float = Field(description="Clockwise from north")


class Shadows(BaseModel):
    """The shadows at one hour. No polygons while the sun is down."""

    hour: float
    elevation_deg: float
    azimuth_deg: float
    plane_height_m: float
    polygons: list[Polygon]


class SunResponse(BaseModel):
    """Sun positions in the order asked. Sunrise and sunset are null where the sun stays up or down."""

    day_of_year: int
    positions: list[SunPosition]
    sunrise_h: float | None
    sunset_h: float | None
    shadows: Shadows | None
