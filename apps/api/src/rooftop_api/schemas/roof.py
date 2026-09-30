"""The roof and what stands on it. Mirrors rooftop_core.geometry."""

from typing import Annotated, Literal, Self

from pydantic import Field, model_validator

from rooftop_api.schemas.common import Compass, Input, Latitude, Longitude, Point

ObstacleKind = Literal["box", "cylinder", "wall", "tree", "building"]
RoofType = Literal["flat_tilted", "flat_ew", "sloped_flush"]
RoofSource = Literal["coordinates", "kmz", "dxf", "map"]
Metres = Annotated[float, Field(ge=0)]
Size = Annotated[float, Field(gt=0, description="Metres, more than nothing")]
POINTS_NEEDED = {"wall": 2, "building": 3}


class Obstacle(Input):
    """Something that casts a shadow. Heights are above the roof surface."""

    name: Annotated[str, Field(max_length=200)]
    kind: ObstacleKind = "box"
    x: float = 0.0
    y: float = 0.0
    length: Size = 1.0
    width: Size = 1.0
    rotation_deg: float = 0.0
    diameter: Size = 1.0
    height: Metres = 1.0
    thickness: Size = 0.2
    trunk_height: Metres = 2.0
    points: list[Point] = []
    auto: bool = False

    @model_validator(mode="after")
    def has_the_points_its_kind_needs(self) -> Self:
        needed = POINTS_NEEDED.get(self.kind, 0)
        if len(self.points) < needed:
            raise ValueError(f"a {self.kind} needs at least {needed} points, this one has {len(self.points)}")
        return self


class Roof(Input):
    """The roof outline in local metres around its reference point (lat, lon), and its obstacles."""

    outline: Annotated[list[Point], Field(min_length=3)]
    lat: Latitude
    lon: Longitude
    roof_type: RoofType = "flat_tilted"
    parapet_h: Metres = 0.9
    setback_m: Metres = 1.0
    walkway_m: Metres = 0.6
    walkway_every_modules: Annotated[int, Field(ge=0)] = 24
    walkway_every_rows: Annotated[int, Field(ge=0)] = 4
    obstacle_clearance_m: Metres = 0.5
    slope_deg: Annotated[float, Field(ge=0, lt=90)] = 0.0
    slope_azimuth_deg: Compass = 180.0
    albedo: Annotated[float, Field(ge=0, le=1)] = 0.20
    source: RoofSource = "coordinates"
    obstacles: list[Obstacle] = []
