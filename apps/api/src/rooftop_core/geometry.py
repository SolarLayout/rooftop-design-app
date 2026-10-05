# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Roof, obstacles and shadow projection.

All geometry is in local metres on the roof: x east, y north, z up from the
roof surface. Sun azimuths follow pvlib: degrees clockwise from north.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np
import shapely
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, box
from shapely.ops import unary_union

from .errors import RoofTooLarge

ROOF_TYPES = ("flat_tilted", "flat_ew", "sloped_flush")
ROOF_TYPE_LABELS = {
    "flat_tilted": "Flat · tilted rows",
    "flat_ew": "Flat · east-west",
    "sloped_flush": "Sloped · flush",
}
OBSTACLE_KINDS = ("box", "cylinder", "wall", "tree", "building")
PARAPET_THICKNESS_M = 0.2
# One roof at a time: about 3 MWp at the demo's density, eight demo roofs (plan/phase-11-plan.md, D11).
ROOF_AREA_LIMIT_M2 = 30_000.0


@dataclass
class Obstacle:
    """Something that casts a shadow. Heights are above the roof surface."""

    name: str
    kind: str = "box"
    x: float = 0.0               # centre (box, cylinder, tree)
    y: float = 0.0
    length: float = 1.0          # box, along x before rotation
    width: float = 1.0           # box
    rotation_deg: float = 0.0    # box, counter-clockwise
    diameter: float = 1.0        # cylinder; tree crown
    height: float = 1.0
    thickness: float = 0.2       # wall
    trunk_height: float = 2.0    # tree: crown starts here
    points: list[tuple[float, float]] = field(default_factory=list)  # wall polyline / building outline
    auto: bool = False           # parapet walls added by the app

    def footprint(self) -> Polygon:
        """Plan area the obstacle occupies (modules keep clear of it)."""
        if self.kind == "box":
            return _rect(self.x, self.y, self.length, self.width, self.rotation_deg)
        if self.kind == "cylinder":
            return Point(self.x, self.y).buffer(self.diameter / 2.0, 24)
        if self.kind == "tree":
            return Point(self.x, self.y).buffer(max(self.diameter, 0.3) / 2.0, 24)
        if self.kind == "wall":
            return LineString(self.points).buffer(self.thickness / 2.0, cap_style="flat", join_style="mitre")
        if self.kind == "building":
            return Polygon(self.points).buffer(0)
        raise ValueError(self.kind)

    def solids(self) -> list[tuple[Polygon, float, float]]:
        """Vertical prisms (footprint, z_bottom, z_top) that approximate the obstacle."""
        if self.kind == "tree":
            trunk = Point(self.x, self.y).buffer(0.15, 8)
            crown = Point(self.x, self.y).buffer(self.diameter / 2.0, 24)
            return [(trunk, 0.0, self.trunk_height), (crown, self.trunk_height, self.height)]
        if self.kind == "wall" and len(self.points) > 2:
            return [(LineString([a, b]).buffer(self.thickness / 2.0, cap_style="flat"), 0.0, self.height)
                    for a, b in zip(self.points[:-1], self.points[1:], strict=False)]
        if self.kind == "building":
            poly = Polygon(self.points).buffer(0)
            tris = shapely.constrained_delaunay_triangles(poly)
            return [(t, 0.0, self.height) for t in tris.geoms]
        return [(self.footprint(), 0.0, self.height)]

    def size_label(self) -> str:
        if self.kind == "box":
            return f"{self.length:.1f} × {self.width:.1f}"
        if self.kind in ("cylinder", "tree"):
            return f"⌀ {self.diameter:.1f}"
        if self.kind == "wall":
            return "edge" if self.auto else f"{LineString(self.points).length:.1f} long"
        return f"{Polygon(self.points).area:.0f} m²"


def _rect(cx, cy, length, width, rot_deg) -> Polygon:
    r = box(cx - length / 2, cy - width / 2, cx + length / 2, cy + width / 2)
    return shapely.affinity.rotate(r, rot_deg, origin=(cx, cy)) if rot_deg else r


@dataclass
class Roof:
    outline: list[tuple[float, float]]
    lat: float
    lon: float
    roof_type: str = "flat_tilted"
    parapet_h: float = 0.9
    setback_m: float = 1.0
    walkway_m: float = 0.6
    walkway_every_modules: int = 24     # tilted rows: aisle across the rows
    walkway_every_rows: int = 4         # east-west units and flush rows
    obstacle_clearance_m: float = 0.5
    slope_deg: float = 0.0              # sloped roofs: pitch
    slope_azimuth_deg: float = 180.0    # sloped roofs: direction the slope faces
    albedo: float = 0.20
    source: str = "coordinates"
    obstacles: list[Obstacle] = field(default_factory=list)

    @property
    def polygon(self) -> Polygon:
        return Polygon(self.outline).buffer(0)

    @property
    def area_m2(self) -> float:
        return self.polygon.area

    def inner(self) -> Polygon:
        return _largest(self.polygon.buffer(-self.setback_m, join_style="mitre"))

    def parapet_walls(self) -> list[Obstacle]:
        if self.parapet_h <= 0:
            return []
        walls = []
        inset = self.polygon.buffer(-PARAPET_THICKNESS_M / 2, join_style="mitre")
        ring = list(_largest(inset).exterior.coords)
        for i, (a, b) in enumerate(zip(ring[:-1], ring[1:], strict=False)):
            walls.append(Obstacle(f"Parapet {i + 1}", "wall", points=[a, b], height=self.parapet_h,
                                  thickness=PARAPET_THICKNESS_M, auto=True))
        return walls

    def all_casters(self) -> list[Obstacle]:
        return self.parapet_walls() + list(self.obstacles)

    def default_array_azimuth(self) -> float:
        """Azimuth (clockwise from north) of the roof edge normal closest to the equator."""
        target = 180.0 if self.lat >= 0 else 0.0
        if self.roof_type == "sloped_flush":
            return self.slope_azimuth_deg
        with np.errstate(all="ignore"):
            rect = self.polygon.minimum_rotated_rectangle
        pts = list(rect.exterior.coords)[:4]
        best, best_d = target, 999.0
        for a, b in zip(pts, pts[1:] + pts[:1], strict=False):
            dx, dy = b[0] - a[0], b[1] - a[1]
            for nx, ny in ((dy, -dx), (-dy, dx)):
                az = math.degrees(math.atan2(nx, ny)) % 360
                d = abs((az - target + 180) % 360 - 180)
                if d < best_d - 1e-6:
                    best, best_d = az, d
        return round(best, 1)


def require_roof_within_limit(outline: list[tuple[float, float]], field: str = "outline") -> None:
    """Refuse an outline over ROOF_AREA_LIMIT_M2 with RoofTooLarge, naming *field* as the request's.

    The area is the one the Roof gives the outline (its polygon, mended): a closed or a clockwise
    outline is the same roof. A pure check: it does not touch the outline.
    """
    area = Polygon(outline).buffer(0).area
    if area > ROOF_AREA_LIMIT_M2:
        raise RoofTooLarge(area, ROOF_AREA_LIMIT_M2, field)


def _largest(g) -> Polygon:
    if isinstance(g, MultiPolygon):
        return max(g.geoms, key=lambda p: p.area)
    return g if not g.is_empty else Polygon()


# ── Shadows ─────────────────────────────────────────────────────────────────
def shadow_vector(elev_deg: float, az_deg: float) -> tuple[float, float]:
    """Horizontal shadow displacement per metre of height (x east, y north)."""
    t = 1.0 / math.tan(math.radians(max(elev_deg, 0.5)))
    a = math.radians(az_deg)
    return -math.sin(a) * t, -math.cos(a) * t


def prism_shadow(fp: Polygon, z_bottom: float, z_top: float, z_recv: float, vx: float, vy: float):
    """Shadow on the horizontal plane z = z_recv of a vertical prism, or None."""
    lo, hi = max(z_bottom, z_recv), z_top
    if hi <= z_recv + 1e-6:
        return None
    a = shapely.affinity.translate(fp, vx * (lo - z_recv), vy * (lo - z_recv))
    b = shapely.affinity.translate(fp, vx * (hi - z_recv), vy * (hi - z_recv))
    # A convex footprint sweeps into the hull of its two end copies.
    return shapely.convex_hull(shapely.union(a, b))


def solids_of(casters: list[Obstacle]) -> list[tuple[Polygon, float, float]]:
    """The prisms of every caster, built once for all the positions of the sun they are asked at."""
    return [solid for ob in casters for solid in ob.solids()]


def casters_shadow(casters: list[Obstacle], z_recv: float, elev: float, az: float):
    return solids_shadow(solids_of(casters), z_recv, elev, az)


def solids_shadow(solids: list[tuple[Polygon, float, float]], z_recv: float, elev: float, az: float):
    """The shadow of the prisms on the horizontal plane z = z_recv with the sun at *elev*, *az*, or None."""
    parts = shadow_parts(solids, z_recv, elev, az)
    return unary_union(parts) if parts else None


@dataclass
class Prisms:
    """The casters' prisms as arrays, for their shadows at many positions of the sun: every footprint's
    corners (the ring's closing corner left out), the prism each belongs to, each prism's bottom and top."""

    corners: np.ndarray  # (corners, 2)
    owner: np.ndarray    # (corners,) the prism of each corner, in order
    z0: np.ndarray       # (prisms,)
    z1: np.ndarray       # (prisms,)


def prisms_of(solids: list[tuple[Polygon, float, float]]) -> Prisms:
    rings = [np.asarray(fp.exterior.coords)[:-1] for fp, _, _ in solids]
    return Prisms(
        np.concatenate(rings) if rings else np.zeros((0, 2)),
        np.repeat(np.arange(len(rings)), [len(r) for r in rings]),
        np.array([z0 for _, z0, _ in solids], dtype=float),
        np.array([z1 for _, _, z1 in solids], dtype=float),
    )


def prisms_shadow(prisms: Prisms, z_recv: float, elev: float, az: float) -> np.ndarray:
    """prism_shadow of every prism at once: the hull of its footprint at the bottom and at the top of what is
    above z_recv, carried along the sun's shadow vector (a convex footprint sweeps into that hull)."""
    if elev <= 0:
        return np.array([], dtype=object)
    vx, vy = shadow_vector(elev, az)
    lo = np.maximum(prisms.z0, z_recv) - z_recv
    hi = prisms.z1 - z_recv
    above = (prisms.z1 > z_recv + 1e-6)[prisms.owner]  # prism_shadow's own test
    if not above.any():
        return np.array([], dtype=object)
    corners, owner = prisms.corners[above], prisms.owner[above]
    near = corners + np.column_stack((vx * lo[owner], vy * lo[owner]))
    far = corners + np.column_stack((vx * hi[owner], vy * hi[owner]))
    _, which = np.unique(owner, return_inverse=True)
    order = np.argsort(np.concatenate((which, which)), kind="stable")
    points = np.concatenate((near, far))[order]
    return shapely.convex_hull(shapely.multipoints(points, indices=np.concatenate((which, which))[order]))


def shadow_parts(solids: list[tuple[Polygon, float, float]], z_recv: float, elev: float, az: float) -> list:
    """The shadow of each prism on the horizontal plane z = z_recv with the sun at *elev*, *az*: each convex,
    its bounding box tight, where the union of a parapet's is a ring whose box is the whole roof."""
    if elev <= 0:
        return []
    vx, vy = shadow_vector(elev, az)
    parts = []
    for fp, z0, z1 in solids:
        s = prism_shadow(fp, z0, z1, z_recv, vx, vy)
        if s is not None:
            parts.append(s)
    return parts


# ── Design day sun (solar time) ─────────────────────────────────────────────
def solstice_doy(lat: float) -> int:
    return 355 if lat >= 0 else 172


def sun_solar_time(lat: float, doy: int, hour: float) -> tuple[float, float]:
    """(elevation, azimuth clockwise from north) at a solar hour (Cooper declination)."""
    phi = math.radians(lat)
    dec = math.radians(23.45 * math.sin(math.radians(360.0 * (284 + doy) / 365.0)))
    w = math.radians(15.0 * (hour - 12.0))
    sin_el = math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.cos(w)
    el = math.degrees(math.asin(max(-1.0, min(1.0, sin_el))))
    cos_az = (math.sin(dec) - sin_el * math.sin(phi)) / max(1e-9, math.cos(math.asin(sin_el)) * math.cos(phi))
    az = math.degrees(math.acos(max(-1.0, min(1.0, cos_az))))  # from north
    if w > 0:
        az = 360.0 - az
    return el, az


def window_sun(lat: float, doy: int, start: float, end: float, step_h: float = 0.25):
    hours = np.arange(start, end + 1e-9, step_h)
    return [(h, *sun_solar_time(lat, doy, h)) for h in hours]


def keepout(roof: Roof, z_recv: float, start: float, end: float, doy: int | None = None):
    """Union of all obstacle shadows swept across the window on the design day."""
    doy = doy or solstice_doy(roof.lat)
    parts = []
    casters = roof.all_casters()
    for _, el, az in window_sun(roof.lat, doy, start, end):
        s = casters_shadow(casters, z_recv, el, az)
        if s is not None:
            parts.append(s)
    return unary_union(parts) if parts else Polygon()


SKY_BLOCK = 256  # points of sky_loss_sectors worked out at a time


def _blocking_elevations(s: np.ndarray, points: np.ndarray, z: np.ndarray, elev: np.ndarray,
                         n_sectors: int) -> None:
    """Raise *elev* (points × sectors, in place) to the elevation of the highest sample in each sector."""
    dx = s[None, :, 0] - points[:, 0:1]
    dy = s[None, :, 1] - points[:, 1:2]
    dz = s[None, :, 2] - z[:, None]
    dist = np.hypot(dx, dy)
    ang = np.degrees(np.arctan2(dz, np.maximum(dist, 0.05)))
    sector = ((np.degrees(np.arctan2(dx, dy)) % 360.0) / (360.0 / n_sectors)).astype(int) % n_sectors
    ang = np.where(dist < 0.05, 0.0, ang)
    rows = np.broadcast_to(np.arange(len(points))[:, None], sector.shape)
    np.maximum.at(elev, (rows, sector), ang)  # each point's highest sample in each sector


def sky_loss_sectors(points: np.ndarray, z: np.ndarray, casters: list[Obstacle],
                     horizon: list[tuple[float, float]] | None = None, n_sectors: int = 36) -> np.ndarray:
    """Fraction of isotropic diffuse lost at each point to the obstacles and far horizon.

    Each sector's blocking elevation h removes sin²h of the sky (horizontal-plane
    weighting). Returns one value per point.
    """
    samples = []
    for ob in casters:
        for fp, _z0, z1 in ob.solids():
            ring = shapely.segmentize(fp.exterior, 1.0)
            for x, y in list(ring.coords):
                samples.append((x, y, z1))
    elev = np.zeros((len(points), n_sectors))
    if horizon:
        az_h = np.array([a for a, _ in horizon])
        el_h = np.array([e for _, e in horizon])
        centers = (np.arange(n_sectors) + 0.5) * 360.0 / n_sectors
        elev[:] = np.interp(centers, az_h, el_h, period=360.0)[None, :]
    if samples:
        s = np.array(samples)
        # A block of points at a time: points × samples is 12 million at the roof limit, 97 MB an array.
        for i in range(0, len(points), SKY_BLOCK):
            block = slice(i, i + SKY_BLOCK)
            _blocking_elevations(s, points[block], z[block], elev[block], n_sectors)
    elev = np.clip(elev, 0, 90)
    return (np.sin(np.radians(elev)) ** 2).mean(axis=1)
