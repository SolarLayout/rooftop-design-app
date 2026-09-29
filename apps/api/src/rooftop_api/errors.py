"""Every error leaves the API as {"error": {"code", "message", "field"}}. The handlers are all here."""

import logging
from collections.abc import Sequence
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from rooftop_api.schemas.errors import ErrorDetail, ErrorResponse
from rooftop_core.errors import (
    EngineError,
    MissingEquipmentFile,
    UnsupportedProjectFormat,
    UnusableWeatherFile,
    WeatherNotLoaded,
)

logger = logging.getLogger("rooftop_api")

UNPROCESSABLE = 422
BAD_GATEWAY = 502
INTERNAL_MESSAGE = "The server could not finish this request. Try again; if it fails again, report it."
ENGINE_CODES: dict[type[EngineError], str] = {
    MissingEquipmentFile: "equipment_file_missing",
    WeatherNotLoaded: "weather_not_loaded",
    UnsupportedProjectFormat: "unsupported_project_format",
    UnusableWeatherFile: "not_a_weather_csv",
}
# What every route can answer besides its success, for the OpenAPI document.
ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    UNPROCESSABLE: {
        "model": ErrorResponse,
        "description": "The request cannot be used; the message says why.",
    }
}
# What a route can answer when it depends on a service elsewhere.
SERVICE_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    **ERROR_RESPONSES,
    BAD_GATEWAY: {
        "model": ErrorResponse,
        "description": "A service this request depends on failed or could not be reached.",
    },
}


class ApiError(Exception):
    """An error a route answers with: its HTTP status, a code for programs and a message for people."""

    def __init__(self, status: int, code: str, message: str, field: str | None = None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.field = field


def _answer(status: int, code: str, message: str, field: str | None = None) -> JSONResponse:
    body = ErrorResponse(error=ErrorDetail(code=code, message=message, field=field))
    return JSONResponse(status_code=status, content=body.model_dump())


def field_path(location: Sequence[str | int]) -> str | None:
    """The path of a field in the request, as in roof.obstacles.2.height; None for the body itself."""
    parts = [str(part) for part in location if part != "body"]
    return ".".join(parts) if parts and not parts[0].isdigit() else None


def validation_message(errors: Sequence[dict[str, Any]]) -> tuple[str, str | None]:
    """(message, field) of the first fault of a request, with the number of the others."""
    first = errors[0]
    field = field_path(first.get("loc", ()))
    if first.get("type") == "json_invalid":
        return f"The request body is not valid JSON: {first.get('msg', 'it cannot be read')}.", None
    message = f"{field}: {first['msg']}" if field else str(first["msg"])
    if len(errors) > 1:
        message += f" (and {len(errors) - 1} more faults in this request)"
    return message, field


def code_of_status(status: int) -> str:
    """The name of an HTTP status in small letters: not_found for 404."""
    try:
        return HTTPStatus(status).phrase.lower().replace(" ", "_").replace("-", "_")
    except ValueError:
        return f"http_{status}"


async def _api_error(_: Request, error: ApiError) -> JSONResponse:
    return _answer(error.status, error.code, error.message, error.field)


async def _engine_error(_: Request, error: EngineError) -> JSONResponse:
    return _answer(UNPROCESSABLE, ENGINE_CODES.get(type(error), "engine_error"), str(error), error.field)


async def _invalid_request(_: Request, error: RequestValidationError) -> JSONResponse:
    message, field = validation_message(error.errors())
    return _answer(UNPROCESSABLE, "invalid_request", message, field)


async def _http_error(_: Request, error: HTTPException) -> JSONResponse:
    return _answer(error.status_code, code_of_status(error.status_code), str(error.detail))


async def _server_fault(request: Request, error: Exception) -> JSONResponse:
    logger.error("%s %s failed", request.method, request.url.path, exc_info=error)
    return _answer(500, "internal_error", INTERNAL_MESSAGE)


def install_error_handlers(app: FastAPI) -> None:
    """Make *app* answer every error in the one shape."""
    app.add_exception_handler(ApiError, _api_error)
    app.add_exception_handler(EngineError, _engine_error)
    app.add_exception_handler(RequestValidationError, _invalid_request)
    app.add_exception_handler(HTTPException, _http_error)
    app.add_exception_handler(Exception, _server_fault)
