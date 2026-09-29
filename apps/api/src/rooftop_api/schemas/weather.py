"""Hourly weather as a project carries it. Mirrors rooftop_core.weather.Weather.to_json."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, Field, model_validator

from rooftop_api.schemas.common import Input, Latitude, Longitude, Point

WeatherSource = Literal["pvgis", "nasa", "csv"]

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


class WeatherRequest(Input):
    """Which weather, and for which site. A CSV file travels as its text; its name only names it."""

    source: WeatherSource
    lat: Latitude
    lon: Longitude
    csv_name: Annotated[str, Field(max_length=1024)] = ""
    csv_text: Annotated[str, Field(max_length=8_000_000)] = ""


class WeatherSummary(BaseModel):
    """The weather in a few numbers, worked out from the hours of the answer."""

    source: WeatherSource
    label: str
    hours: int
    first_hour: str = Field(description="Start of the first hour, UTC")
    last_hour: str = Field(description="Start of the last hour, UTC")
    ghi_kwh_m2: float = Field(description="Global horizontal irradiation over all hours")
    dni_kwh_m2: float = Field(description="Beam irradiation on a plane that faces the sun")
    dhi_kwh_m2: float = Field(description="Diffuse horizontal irradiation")
    t_min_c: float = Field(description="Lowest air temperature")
    t_max_c: float = Field(description="Highest air temperature")
    horizon_highest_deg: float | None = Field(
        description="Highest point of the horizon; null when the source has no horizon"
    )


class WeatherResponse(BaseModel):
    """The weather to put into a project as weather_json, its summary, and what the user should know."""

    weather: Weather
    summary: WeatherSummary
    notes: list[str]
