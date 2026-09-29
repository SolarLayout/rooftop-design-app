"""Hourly weather as a project carries it. Mirrors rooftop_core.weather.Weather.to_json."""

from typing import Annotated, Self

from pydantic import Field, model_validator

from rooftop_api.schemas.common import Input, Latitude, Longitude, Point

SERIES = ("ghi", "dni", "dhi", "temp_air", "wind_speed")
Hours = Annotated[list[float], Field(max_length=8784)]


class Weather(Input):
    """One value per hour, named by its start in UTC. Irradiance in W/m2, air in degC, wind in m/s."""

    lat: Latitude
    lon: Longitude
    source: str
    label: str
    horizon: list[Point] = Field(default=[], description="(azimuth from north, elevation) in degrees")
    time: Annotated[list[str], Field(min_length=1, max_length=8784)]
    ghi: Hours
    dni: Hours
    dhi: Hours
    temp_air: Hours
    wind_speed: Hours

    @model_validator(mode="after")
    def every_series_has_a_value_per_hour(self) -> Self:
        for name in SERIES:
            if len(getattr(self, name)) != len(self.time):
                raise ValueError(f"{name} has {len(getattr(self, name))} values for {len(self.time)} hours")
        return self
