"""The shapes of requests and answers. They mirror the dataclasses of the engine, field by field."""

from rooftop_api.schemas.array import ArraySpec
from rooftop_api.schemas.common import Point, Polygon
from rooftop_api.schemas.equipment import (
    Coefficients,
    CurrentPerMppt,
    EfficiencyCurve,
    EquipmentFile,
    Inverter,
    InverterResponse,
    Module,
    ModuleResponse,
)
from rooftop_api.schemas.errors import ErrorDetail, ErrorResponse
from rooftop_api.schemas.health import Health
from rooftop_api.schemas.layout import Keepout, Layout, LayoutReadouts, LayoutResponse, PlacedModule
from rooftop_api.schemas.losses import Losses
from rooftop_api.schemas.project import Project, RoofInput
from rooftop_api.schemas.roof import Obstacle, Roof
from rooftop_api.schemas.roof_import import ImportedRoof, RoofFile
from rooftop_api.schemas.sun import ShadowRequest, Shadows, SunPosition, SunRequest, SunResponse
from rooftop_api.schemas.weather import Weather, WeatherRequest, WeatherResponse, WeatherSummary

__all__ = [
    "ArraySpec",
    "Coefficients",
    "CurrentPerMppt",
    "EfficiencyCurve",
    "EquipmentFile",
    "ErrorDetail",
    "ErrorResponse",
    "Health",
    "ImportedRoof",
    "Inverter",
    "InverterResponse",
    "Keepout",
    "Layout",
    "LayoutReadouts",
    "LayoutResponse",
    "Losses",
    "Module",
    "ModuleResponse",
    "Obstacle",
    "PlacedModule",
    "Point",
    "Polygon",
    "Project",
    "Roof",
    "RoofFile",
    "RoofInput",
    "ShadowRequest",
    "Shadows",
    "SunPosition",
    "SunRequest",
    "SunResponse",
    "Weather",
    "WeatherRequest",
    "WeatherResponse",
    "WeatherSummary",
]
