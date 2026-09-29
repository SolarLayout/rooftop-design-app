"""A roof read from a KMZ, KML or DXF file."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field

from rooftop_api.schemas.common import Input, Latitude, Longitude, Point
from rooftop_api.schemas.roof import Obstacle

MAX_BASE64 = 28_000_000


class RoofFile(Input):
    """The file as base64 of its bytes. A DXF also needs its units and the place of the roof."""

    name: Annotated[str, Field(min_length=1, max_length=255)]
    base64: Annotated[str, Field(min_length=1, max_length=MAX_BASE64)]
    units: Literal["m", "mm"] = "m"
    lat: Latitude | None = None
    lon: Longitude | None = None


class ImportedRoof(BaseModel):
    """The outline and the obstacles, in local metres around the centre of the roof at (lat, lon)."""

    source: Literal["kmz", "dxf"]
    file: str
    outline: list[Point]
    lat: float
    lon: float
    obstacles: list[Obstacle]
    missing_heights: list[str] = Field(description="Names of the obstacles that got the height of 1.0 m")
    notes: list[str]
