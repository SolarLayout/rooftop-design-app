"""A roof outlined on the map, or entered by hand about a place. The projection is the engine's
(rooftop_core.geo), and it is the only one: the browser draws in WGS84 and receives metres."""

import math

from shapely.geometry import Polygon
from shapely.geometry.polygon import orient

from rooftop_api import convert, schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_core import geometry, project
from rooftop_core.geo import local_to_lonlat, lonlat_to_local
from rooftop_core.io.roof_import import box_from_polygon

UNTITLED = "Untitled roof"
NAME_OF_KIND = {"box": "Box", "cylinder": "Tank", "wall": "Wall", "tree": "Tree", "building": "Building"}
POINTS_NEEDED = {"box": 3, "wall": 2, "building": 3}
CROSSES = "The outline crosses itself. Move the corners so that no two edges cross."


def from_map(drawn: schemas.OutlineOnMap) -> schemas.Project:
    """A new project: the roof in local metres around its centroid, everything else at its default."""
    lat0, lon0 = drawn.outline[0][1], drawn.outline[0][0]
    polygon = Polygon(lonlat_to_local([(lon, lat) for lon, lat in drawn.outline], lat0, lon0))
    if not polygon.is_valid:
        raise ApiError(UNPROCESSABLE, "outline_crosses_itself", CROSSES, "outline")
    polygon = orient(polygon, 1.0)
    centre = polygon.centroid
    lon, lat = local_to_lonlat([(centre.x, centre.y)], lat0, lon0)[0]
    outline = [(x - centre.x, y - centre.y) for x, y in list(polygon.exterior.coords)[:-1]]
    # The one check of the limit for a roof drawn on the map: before its obstacles are read.
    geometry.require_roof_within_limit(outline, "outline")
    counts: dict[str, int] = {}
    obstacles = [_obstacle(shape, index, lat, lon, counts) for index, shape in enumerate(drawn.obstacles)]
    roof = geometry.Roof(
        outline=outline,
        lat=lat,
        lon=lon,
        roof_type=drawn.roof_type,
        source=drawn.source,
        obstacles=obstacles,
    )
    new = project.Project(name=drawn.name or UNTITLED, roof=roof)
    new.roof_input["mode"] = "corners"
    return convert.project_from_engine(new)


def on_map(roof: schemas.Roof) -> schemas.RoofOnMap:
    """Where the roof and its obstacles are on the map. A roof over the limit is refused as everywhere."""
    geometry.require_roof_within_limit(roof.outline, "outline")
    outline = [_lonlat(p) for p in local_to_lonlat(roof.outline, roof.lat, roof.lon)]
    return schemas.RoofOnMap(
        outline=outline, obstacles=[_shape(o, roof.lat, roof.lon) for o in roof.obstacles]
    )


def _obstacle(
    shape: schemas.MapShape, index: int, lat: float, lon: float, counts: dict[str, int]
) -> geometry.Obstacle:
    where = f"obstacles.{index}"
    needed = POINTS_NEEDED.get(shape.kind, 1)
    if len(shape.points) < needed:
        raise ApiError(
            UNPROCESSABLE,
            "too_few_points",
            f"A {shape.kind} on the map needs at least {needed} points; this one has {len(shape.points)}.",
            f"{where}.points",
        )
    if shape.kind in ("cylinder", "tree") and shape.diameter is None:
        raise ApiError(
            UNPROCESSABLE, "diameter_missing", f"A {shape.kind} needs its diameter.", f"{where}.diameter"
        )
    counts[shape.kind] = counts.get(shape.kind, 0) + 1
    name = shape.name or f"{NAME_OF_KIND[shape.kind]} {counts[shape.kind]}"
    points = lonlat_to_local([(p[0], p[1]) for p in shape.points], lat, lon)
    if shape.kind == "box":
        found = box_from_polygon(points)
        if found is None:
            raise ApiError(
                UNPROCESSABLE, "not_a_box", "The corners of a box must make a rectangle.", f"{where}.points"
            )
        x, y, length, width, rotation = found
        return geometry.Obstacle(
            name, "box", x=x, y=y, length=length, width=width, rotation_deg=rotation, height=shape.height
        )
    if shape.kind in ("cylinder", "tree"):
        (x, y) = points[0]
        return geometry.Obstacle(
            name, shape.kind, x=x, y=y, diameter=shape.diameter or 0.0, height=shape.height
        )
    return geometry.Obstacle(name, shape.kind, points=points, height=shape.height)


def _shape(obstacle: schemas.Obstacle, lat: float, lon: float) -> schemas.MapShape:
    if obstacle.kind == "box":
        corners = _corners_of_box(obstacle)
        diameter = None
    elif obstacle.kind in ("cylinder", "tree"):
        corners = [(obstacle.x, obstacle.y)]
        diameter = obstacle.diameter
    else:
        corners = list(obstacle.points)
        diameter = None
    points = [_lonlat(p) for p in local_to_lonlat(corners, lat, lon)]
    return schemas.MapShape(
        name=obstacle.name, kind=obstacle.kind, points=points, diameter=diameter, height=obstacle.height
    )


def _corners_of_box(box: schemas.Obstacle) -> list[tuple[float, float]]:
    """The four corners of a box, counter-clockwise from the one at (-length/2, -width/2) before its turn."""
    angle = math.radians(box.rotation_deg)
    cos, sin = math.cos(angle), math.sin(angle)
    half_l, half_w = box.length / 2, box.width / 2
    return [
        (box.x + dx * cos - dy * sin, box.y + dx * sin + dy * cos)
        for dx, dy in ((-half_l, -half_w), (half_l, -half_w), (half_l, half_w), (-half_l, half_w))
    ]


def _lonlat(pair) -> tuple[float, float]:
    return (float(pair[0]), float(pair[1]))
