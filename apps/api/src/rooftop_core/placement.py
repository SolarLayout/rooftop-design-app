# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Module placement on the roof.

Placement works in a *frame* rotated so the array faces frame-south (−y). Tilted
rows and flush rows run along frame-x; east-west units run along frame-y with the
ridge on that axis. Positions inside the shadow keep-out stay empty unless the
user allows shaded positions.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np
import shapely
from shapely.affinity import rotate
from shapely.geometry import Polygon, box
from shapely.ops import unary_union

from .geometry import Roof, keepout, solstice_doy, window_sun
from .io.pvsyst import Module


@dataclass
class ArraySpec:
    tilt_deg: float = 15.0
    azimuth_deg: float | None = None       # None: roof edge closest to the equator
    orientation: str = "portrait"          # portrait | landscape
    modules_in_tilt: int = 1               # a new design: one module up the slope (D69)
    clearance_m: float = 0.5               # lower edge above the roof
    module_gap_m: float = 0.02
    row_pitch_m: float | None = None       # None: shade-free in the window
    ew_tilt_deg: float = 10.0
    ew_ridge_gap_m: float = 0.3
    flush_clearance_m: float = 0.1
    allow_shaded: bool = False
    window_start_h: float = 9.0
    window_end_h: float = 16.0
    design_doy: int | None = None          # None: winter solstice


@dataclass
class PlacedModule:
    idx: int
    poly: Polygon                 # plan footprint, roof coordinates
    row: int                      # table row (tilted / flush) or unit (east-west)
    col: int                      # column along the row
    line: int                     # 0 = bottom line of the table
    tilt: float
    azimuth: float
    z_low: float
    z_high: float
    fx: float                     # frame position, for ordering
    fy: float
    # Row-to-row shading: obstacle edge height H above the table's lower edge,
    # horizontal distance D in the facing direction, table slope length and this
    # module's span along the slope. None when nothing stands in front.
    front: tuple[float, float] | None = None
    slope_len: float = 0.0
    span: tuple[float, float] = (0.0, 0.0)

    @property
    def z_mid(self) -> float:
        return 0.5 * (self.z_low + self.z_high)

    @property
    def center(self) -> tuple[float, float]:
        c = self.poly.centroid
        return c.x, c.y


@dataclass
class Layout:
    kind: str                      # roof type the layout was made for
    modules: list[PlacedModule]
    azimuth: float
    tilt: float
    pitch: float
    gcr: float
    slope_len: float
    table_count: int
    n_rows: int
    inner: Polygon
    usable: Polygon
    keepout: Polygon
    obstacle_zone: Polygon
    design_doy: int
    psi_min_deg: float | None = None
    notes: list[str] = field(default_factory=list)
    # What the engine would decide where it is told otherwise, so that the lens can say so (#179, item 9): the pitch it
    # would choose for the window (flat tilted rows only), and the azimuth of the roof edge closest to the equator.
    shade_free_pitch: float | None = None
    edge_azimuth: float = 180.0

    @property
    def n_modules(self) -> int:
        return len(self.modules)

    @property
    def keepout_area_in_roof(self) -> float:
        return self.inner.intersection(self.keepout).area


def module_dims(module: Module, orientation: str) -> tuple[float, float]:
    """(side along the slope, side along the row)."""
    if orientation == "landscape":
        return module.width_m, module.length_m
    return module.length_m, module.width_m


def shade_free_pitch(lat: float, facing_az: float, tilt: float, slope_len: float,
                     start: float, end: float, doy: int) -> tuple[float, float]:
    """Pitch that keeps rows unshaded through the window, and the limiting profile angle."""
    b = math.radians(tilt)
    psi_min = 90.0
    for _, el, az in window_sun(lat, doy, start, end):
        if el <= 0:
            continue
        rel = math.radians(az - facing_az)
        if math.cos(rel) <= 1e-6:
            continue
        psi = math.degrees(math.atan(math.tan(math.radians(el)) / math.cos(rel)))
        psi_min = min(psi_min, psi)
    psi_min = max(psi_min, 1.0)
    pitch = slope_len * (math.cos(b) + math.sin(b) / math.tan(math.radians(psi_min)))
    return pitch, psi_min


def place(roof: Roof, arr: ArraySpec, module: Module) -> Layout:
    rt = roof.roof_type
    doy = arr.design_doy or solstice_doy(roof.lat)
    az = roof.default_array_azimuth() if arr.azimuth_deg is None else arr.azimuth_deg
    if rt == "sloped_flush":
        # Flush modules lie on the roof, so they face where it slopes: an array azimuth kept from a flat roof is
        # not theirs (#179, item 12).
        az = roof.slope_azimuth_deg
    rot = az - 180.0
    origin = roof.polygon.centroid

    def to_frame(g):
        return rotate(g, rot, origin=origin)

    def to_world(g):
        return rotate(g, -rot, origin=origin)

    inner = roof.inner()
    obst = [o.footprint().buffer(roof.obstacle_clearance_m) for o in roof.obstacles]
    obstacle_zone = unary_union(obst) if obst else Polygon()
    if rt == "flat_tilted":
        z_low = arr.clearance_m
    elif rt == "flat_ew":
        z_low = arr.clearance_m
    else:
        z_low = arr.flush_clearance_m
    ko = keepout(roof, z_low, arr.window_start_h, arr.window_end_h, doy)
    usable = inner.difference(obstacle_zone)
    if not arr.allow_shaded:
        usable = usable.difference(ko)
    usable_f = to_frame(usable)
    shapely.prepare(usable_f)

    gap = arr.module_gap_m
    notes: list[str] = []
    modules: list[PlacedModule] = []
    psi_min = None
    free_pitch = None

    if rt in ("flat_tilted", "sloped_flush"):
        tilt = arr.tilt_deg if rt == "flat_tilted" else roof.slope_deg
        n_lines = max(1, arr.modules_in_tilt)
        m_slope, m_row = module_dims(module, arr.orientation)
        L = n_lines * m_slope + (n_lines - 1) * gap
        b = math.radians(tilt)
        D = L * math.cos(b)
        if rt == "flat_tilted":
            free, psi = shade_free_pitch(roof.lat, az, tilt, L, arr.window_start_h, arr.window_end_h, doy)
            free_pitch = max(math.ceil(free * 20) / 20.0, D + 0.3)  # rounded up to 5 cm, the rows never overlapping
            if arr.row_pitch_m:
                pitch = arr.row_pitch_m
            else:
                pitch, psi_min = free_pitch, psi
            if arr.row_pitch_m and arr.row_pitch_m < D + 0.3:
                # The rows must not overlap; a pitch entered under that is raised, and says so (#179, item 10).
                notes.append(
                    f"Row pitch {arr.row_pitch_m:.2f} m is under a table's depth on plan plus 0.3 m, "
                    f"so {D + 0.3:.2f} m is used."
                )
            pitch = max(pitch, D + 0.3)
            every, aisle_after = roof.walkway_every_modules, "modules"
        else:
            pitch = D + gap * math.cos(b)
            every, aisle_after = roof.walkway_every_rows, "rows"
        minx, miny, maxx, maxy = usable_f.bounds if not usable_f.is_empty else (0, 0, 0, 0)
        col_w = m_row + gap
        # Column x positions shared by every row, with an aisle every N modules (tilted).
        xs = []
        x, k = minx, 0
        while x + m_row <= maxx + 1e-9:
            xs.append(x)
            k += 1
            x += col_w
            if aisle_after == "modules" and every and k % every == 0:
                x += roof.walkway_m - gap
        rows_y = []
        y, r = miny, 0
        while y + D <= maxy + 1e-9:
            rows_y.append(y)
            r += 1
            y += pitch
            if aisle_after == "rows" and every and r % every == 0:
                y += roof.walkway_m
        occupied: dict[int, set[int]] = {}
        for r, y0 in enumerate(rows_y):
            cols = [c for c, x0 in enumerate(xs) if usable_f.contains(box(x0, y0, x0 + m_row, y0 + D))]
            occupied[r] = set(cols)
            for c in cols:
                x0 = xs[c]
                for j in range(n_lines):
                    u0 = j * (m_slope + gap)
                    u1 = u0 + m_slope
                    fp = box(x0, y0 + u0 * math.cos(b), x0 + m_row, y0 + u1 * math.cos(b))
                    front = None
                    if rt == "flat_tilted" and r > 0 and (c in occupied.get(r - 1, ()) or
                                                          c - 1 in occupied.get(r - 1, ()) or
                                                          c + 1 in occupied.get(r - 1, ())):
                        front = (L * math.sin(b), rows_y[r] - rows_y[r - 1] - D)
                    modules.append(PlacedModule(
                        idx=len(modules), poly=fp, row=r, col=c, line=j, tilt=tilt, azimuth=az,
                        z_low=z_low + u0 * math.sin(b), z_high=z_low + u1 * math.sin(b),
                        fx=x0, fy=y0, front=front, slope_len=L, span=(u0, u1)))
        table_count = _count_tables(modules, n_lines, xs, col_w)
        gcr = L / pitch if rt == "flat_tilted" else 1.0
        slope_len, used_pitch = L, pitch
        n_rows = len([r for r in occupied if occupied[r]])
    else:  # east-west
        tilt = arr.ew_tilt_deg
        m_slope, m_row = module.width_m, module.length_m  # 1L each side
        L = m_slope
        b = math.radians(tilt)
        d = L * math.cos(b)
        H = L * math.sin(b)
        ridge = arr.ew_ridge_gap_m
        W = 2 * d + ridge
        # Gap between units: zero unless the window needs one.
        g = 0.0
        for face in (az - 90.0, az + 90.0):
            _, psi = shade_free_pitch(roof.lat, face, tilt, L, arr.window_start_h, arr.window_end_h, doy)
            g = max(g, H / math.tan(math.radians(psi)) - d)
        g = math.ceil(max(g, 0.0) * 20) / 20.0
        psi_min = None
        minx, miny, maxx, maxy = usable_f.bounds if not usable_f.is_empty else (0, 0, 0, 0)
        units_x, x, k = [], minx, 0
        while x + W <= maxx + 1e-9:
            units_x.append(x)
            k += 1
            x += W + g
            if roof.walkway_every_rows and k % roof.walkway_every_rows == 0:
                x += roof.walkway_m
        ys, y = [], miny
        while y + m_row <= maxy + 1e-9:
            ys.append(y)
            y += m_row + gap
        present: dict[tuple[int, int, int], bool] = {}
        pending = []
        for u, x0 in enumerate(units_x):
            for c, y0 in enumerate(ys):
                # side 0: faces frame-west (az + 90 in world), side 1: faces frame-east.
                for side, (xa, xb) in enumerate(((x0, x0 + d), (x0 + d + ridge, x0 + W))):
                    fp = box(xa, y0, xb, y0 + m_row)
                    if usable_f.contains(fp):
                        present[(u, c, side)] = True
                        pending.append((u, c, side, fp, y0, x0))
        for u, c, side, fp, y0, x0 in pending:
            # West-facing side of unit u looks at unit u-1's ridge; east-facing at unit u+1's.
            nb = (u - 1, c, 1) if side == 0 else (u + 1, c, 0)
            front = None
            if present.get(nb):
                dist = (units_x[u] - (units_x[u - 1] + W)) if side == 0 else (units_x[u + 1] - (x0 + W))
                front = (H, dist + d)
            face_az = (az + 90.0) % 360 if side == 0 else (az - 90.0) % 360
            # frame-west in world = az + 90 because the frame is rotated by az − 180
            modules.append(PlacedModule(
                idx=len(modules), poly=fp, row=u, col=c, line=side, tilt=tilt, azimuth=face_az,
                z_low=z_low, z_high=z_low + H, fx=x0, fy=y0, front=front, slope_len=L, span=(0.0, L)))
        table_count = len({(m.row, m.col // 10) for m in modules})
        gcr = 2 * L / (W + g) if units_x else 0.0
        slope_len, used_pitch = L, W + g
        n_rows = len({m.row for m in modules})
        if g > 0:
            # A gap of nothing is no news: noted every time, it left an east-west design always with a note (#179, item 11).
            notes.append(f"Unit gap {g:.2f} m keeps east-west units shade-free in the window.")

    # The modules were placed in the frame; back to the roof, all of them in one call.
    for m, world in zip(modules, rotate_all([m.poly for m in modules], -rot, origin), strict=True):
        m.poly = world
    return Layout(
        kind=rt, modules=modules, azimuth=az, tilt=tilt, pitch=used_pitch, gcr=gcr, slope_len=slope_len,
        table_count=table_count, n_rows=n_rows, inner=inner, usable=usable, keepout=ko,
        obstacle_zone=obstacle_zone, design_doy=doy, psi_min_deg=psi_min, notes=notes,
        shade_free_pitch=free_pitch, edge_azimuth=roof.default_array_azimuth())


def rotate_all(geoms: list, angle_deg: float, origin) -> np.ndarray:
    """shapely.affinity.rotate of every geometry about the point *origin*, in one transform: the coefficients and the
    arithmetic of shapely's own rotate (a·x + b·y + x_off, coordinate by coordinate), so each result is the same to
    the bit as rotating it alone."""
    angle = angle_deg * math.pi / 180.0
    cosp, sinp = math.cos(angle), math.sin(angle)
    if abs(cosp) < 2.5e-16:
        cosp = 0.0
    if abs(sinp) < 2.5e-16:
        sinp = 0.0
    x0, y0 = origin.x, origin.y
    xoff, yoff = x0 - x0 * cosp + y0 * sinp, y0 - x0 * sinp - y0 * cosp

    def turned(coords: np.ndarray) -> np.ndarray:
        x, y = coords.T
        return np.stack([cosp * x + -sinp * y + xoff, sinp * x + cosp * y + yoff]).T

    return shapely.transform(np.array(geoms, dtype=object), turned)


def _count_tables(modules: list[PlacedModule], n_lines: int, xs: list[float], col_w: float) -> int:
    """Tables are runs of adjacent columns in a row (an aisle or a gap ends a table)."""
    cols_by_row: dict[int, list[int]] = {}
    for m in modules:
        if m.line == 0:
            cols_by_row.setdefault(m.row, []).append(m.col)
    count = 0
    for cols in cols_by_row.values():
        cols = sorted(cols)
        for i, c in enumerate(cols):
            if i == 0 or c != cols[i - 1] + 1 or xs[c] - xs[cols[i - 1]] > col_w + 1e-6:
                count += 1
    return count


def centers(layout: Layout) -> np.ndarray:
    return np.array([m.center for m in layout.modules]) if layout.modules else np.zeros((0, 2))
