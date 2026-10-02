"""Weather for a site: downloaded from PVGIS or NASA POWER, or read from the text of a CSV file."""

import requests

from rooftop_api import convert, schemas, settings
from rooftop_api.errors import BAD_GATEWAY, UNPROCESSABLE, ApiError
from rooftop_api.services.uploads import file_name
from rooftop_core import csv_weather
from rooftop_core import weather as wx
from rooftop_core.errors import UnusableWeatherFile

SITES_KEPT = 64
ANOTHER_SOURCE = "choose another weather source"


def new_cache() -> wx.MemoryWeatherCache:
    return wx.MemoryWeatherCache(max_entries=SITES_KEPT)


# Downloads of this process (decision D6). Without it every answer is the same, only slower.
CACHE = new_cache()


def load(request: schemas.WeatherRequest) -> schemas.WeatherResponse:
    if request.source == "csv":
        return _from_csv(request)
    return answer(_download(request), notes=[])


def answer(weather: wx.Weather, notes: list[str]) -> schemas.WeatherResponse:
    """The weather as a project carries it, and the summary of exactly those hours."""
    stored = weather.to_json()
    return schemas.WeatherResponse.model_construct(
        weather=convert.weather_from_engine(stored),
        summary=summary(wx.Weather.from_json(stored)),
        notes=notes,
    )


def summary(weather: wx.Weather) -> schemas.WeatherSummary:
    hours = weather.data
    return schemas.WeatherSummary.model_construct(
        source=weather.source,
        label=weather.label,
        hours=len(hours),
        first_hour=hours.index[0].isoformat(),
        last_hour=hours.index[-1].isoformat(),
        ghi_kwh_m2=weather.ghi_kwh,
        dni_kwh_m2=float(hours["dni"].sum()) / 1000.0,
        dhi_kwh_m2=float(hours["dhi"].sum()) / 1000.0,
        t_min_c=weather.t_min,
        t_max_c=weather.t_max,
        horizon_highest_deg=max((height for _, height in weather.horizon), default=None),
    )


def _from_csv(request: schemas.WeatherRequest) -> schemas.WeatherResponse:
    try:
        read = csv_weather.read(request.csv_text, request.lat, request.lon, file_name(request.csv_name))
    except UnusableWeatherFile as error:
        code = "not_a_weather_csv" if request.csv_text.strip() else "csv_missing"
        raise ApiError(UNPROCESSABLE, code, str(error), "csv_text") from error
    return answer(read.weather, read.notes)


def _download(request: schemas.WeatherRequest) -> wx.Weather:
    label = wx.SOURCE_LABELS[request.source]
    if not settings.weather_downloads_on():
        raise ApiError(
            UNPROCESSABLE,
            "weather_downloads_off",
            f"Downloads of weather are off on this server: {label} was not asked. Load a CSV file, or turn "
            "downloads on.",
            "source",
        )
    try:
        return wx.load(request.source, request.lat, request.lon, cache=CACHE)
    except wx.WeatherServiceError as error:
        raise _refused(error, label, request) from error
    except requests.RequestException as error:
        raise ApiError(
            BAD_GATEWAY,
            "weather_source_unreachable",
            f"{label} could not be reached. Check the connection and try again, or {ANOTHER_SOURCE}.",
            "source",
        ) from error
    except (KeyError, TypeError, ValueError) as error:
        raise ApiError(
            BAD_GATEWAY,
            "weather_source_failed",
            f"{label} answered in a form that cannot be read. Try again later, or {ANOTHER_SOURCE}.",
            "source",
        ) from error


def _refused(error: wx.WeatherServiceError, label: str, request: schemas.WeatherRequest) -> ApiError:
    """A refusal of the request is about the site; anything else is a fault of the service."""
    if 400 <= error.status < 500 and error.said:
        site = f"{request.lat:.4f}, {request.lon:.4f}"
        said = error.said.rstrip(". ")
        return ApiError(
            UNPROCESSABLE,
            "no_weather_for_site",
            f"{label} has no weather for {site}: {said}. Check the site, or {ANOTHER_SOURCE}.",
        )
    return ApiError(
        BAD_GATEWAY,
        "weather_source_failed",
        f"{label} failed: it answered {error.status}. Try again later, or {ANOTHER_SOURCE}.",
        "source",
    )
