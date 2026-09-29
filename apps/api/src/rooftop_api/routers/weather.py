"""Weather for a site."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.errors import SERVICE_ERROR_RESPONSES
from rooftop_api.services import weather as service

router = APIRouter(tags=["weather"], responses=SERVICE_ERROR_RESPONSES)


@router.post("/weather", response_model=schemas.WeatherResponse, operation_id="loadWeather")
def weather(request: schemas.WeatherRequest) -> schemas.WeatherResponse:
    """A year of hourly weather for a site, from PVGIS, NASA POWER or the text of a CSV file.

    The answer holds the weather to put into the project (weather_json), so that every later request
    carries it and nothing is downloaded twice.
    """
    return service.load(request)
