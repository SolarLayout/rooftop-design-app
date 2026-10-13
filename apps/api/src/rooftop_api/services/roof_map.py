"""A roof outlined on the map, or entered by hand about a place. The projection is the engine's
(rooftop_core.geo), and it is the only one: the browser draws in WGS84 and receives metres."""

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
        **_sloped_defaults(drawn.roof_type),
    )
    new = project.Project(name=drawn.name or UNTITLED, roof=roof)
    new.roof_input["mode"] = "corners"
    return convert.project_from_engine(new)


# A new sloped roof has no parapet and a pitch of 10°: the rule of the Roof lens
# (web/lib/geometry/roof-type-rule.ts), so that Sloped chosen on Find is the roof Sloped
# chosen in the lens is (#169). Flat roofs keep the engine's defaults.
SLOPED_PITCH_DEG = 10.0


def _sloped_defaults(roof_type: str) -> dict[str, float]:
    return {"parapet_h": 0.0, "slope_deg": SLOPED_PITCH_DEG} if roof_type == "sloped_flush" else {}


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
