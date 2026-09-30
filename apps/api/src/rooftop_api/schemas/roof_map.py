"""A roof drawn on the map, in WGS84, and a roof shown on the map again."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field

from rooftop_api.schemas.common import Input, Latitude, Longitude
from rooftop_api.schemas.roof import Metres, RoofType, Size

# (lon, lat), as GeoJSON has it: x east, then y north.
LonLat = tuple[Longitude, Latitude]
MapKind = Literal["box", "cylinder", "wall", "tree", "building"]
Name = Annotated[str, Field(max_length=200)]


class MapShape(Input):
    """An obstacle as it is drawn on the map: a box by its four corners, a cylinder or a tree by its
    centre and its diameter, a wall by the points of its line, a building by the corners of its outline.
    The height is asked for: imagery cannot give it."""

    name: Name = ""
    kind: MapKind = "box"
    points: Annotated[list[LonLat], Field(min_length=1)]
    diameter: Size | None = Field(default=None, description="Metres; a cylinder or a tree needs it")
    height: Metres


class OutlineOnMap(Input):
    """What was drawn on the map: the corners of the roof, the obstacles, the roof type, a name."""

    outline: Annotated[list[LonLat], Field(min_length=3)]
    obstacles: list[MapShape] = []
    roof_type: RoofType = "flat_tilted"
    name: Name | None = Field(
        default=None, description="The name of the new design; the API's default when left out"
    )


class RoofOnMap(BaseModel):
    """A roof of a project, in WGS84, so that the map shows it where it is."""

    outline: list[LonLat]
    obstacles: list[MapShape]
