"""Writes three states boards of Phase 6, step 0 (plan/phase-06-plan.md): SunTime.dc.html, "Time on the stage";
SunPathShadows.dc.html, "Sun path and shadow outlines"; and ShadeMap.dc.html, "Shade map".

The first draws the time on the stage of every lens (the pill of the approved Array boards) and the timeline of
the Sun lens: paused, playing, dragged, focused by key; the day picker with Any date; the sun low at the first
quarter hour of the day; a day without sunrise or sunset; a sun that could not be fetched. The second draws the
day's arc on its dome, the shade-free window on it, the hour marks and the marker, and the engine's shadow
outlines dashed over the rendered shadows, in 3D and in the plan; the switches of On the roof. The third draws the
modules coloured by their near shading over the year, the legend on the stage, a selected module's value and its
string's, the states of the map and the inspector of the Shade map tab, on desktop and on phone.

Every number comes from sun_lens_data.json beside this file, written from the engine for the Pune demo: the sun's
positions of three days every quarter hour with sunrise and sunset, the engine's shadow polygons at three hours,
every position of the layout with its outline, its row, its near shading over the year and its string in option
A, the strings' shade and the figures. The 3D is the projection of build_lenses.py (a point of the roof's metres,
x east, y north, z up, lands at E + A x + C y, F + B x + D y - ZK z); the shadows are cast along the engine's sun.
Every colour is a token of docs/design/design-tokens.md (the 3D palette for the scene); the five steps of the shade
map are the new tokens --color-shade-1 to -5 (shade1 to shade5 in the palette).

Run it in this folder: python3 build_phase6_state_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json
import math

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    CHEVRON,
    CONTROL,
    CONTROL_ACTIVE,
    DISPLAY,
    FOOT,
    GROUND,
    HEAD,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE_LINE,
    SHADOW_FLOAT,
    SHADOW_PRIMARY,
    SHADOW_RAISED,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    WELL,
    bone,
    card,
    icon,
    note,
    quiet,
    ring,
    section,
    state,
)
from build_phase4_boards import SHADOW_HANDLE, SHADOW_LABEL
from build_phase4_obstacles_by_hand import POINTER
from build_phase5_array_boards import INSPECTOR, lens_section, switch, title_line, view_box, view_controls
from build_phase5_roof_boards import PHONE, View, hull, number_field, piece, swap_lens

DATA = json.loads((HERE / "sun_lens_data.json").read_text(encoding="utf-8"))

# The 3D palette of design-tokens.md.
ROOF, ROOF_EDGE = "#D3D6DB", "#ECEEF0"
PARAPET_CAP, PARAPET_LIT, PARAPET_SHADE = "#ECEEF0", "#B9BEC6", "#8E95A0"
WALL_LIT, WALL_SHADE, WALL_EDGE_LIT, WALL_EDGE_SHADE = "#4A5262", "#2E3440", "#343A47", "#22272F"
OBSTACLE_TOP, OBSTACLE_LIT, OBSTACLE_SHADE = "#F1F2F4", "#C2C7CF", "#868D99"
GLASS, FRAME = "#16294D", "#33558C"
SHADOW, GRID_LINE = "#0B1220", "#1B222D"
KEEP_OUT_LINE, SUN, SUN_CORE = "#FFB020", "#FFB020", "#FFD36B"
# The five steps of the shade map: --color-shade-1 to -5, shade1 to shade5 in the scene palette.
SHADE = ["#3C324E", "#634E86", "#8D6CC2", "#B692F2", "#D8C7F9"]
ON_IMAGERY = "#D5DAE2"
RING_FOCUS = f"outline: 2px solid {ACCENT}; outline-offset: 2px"
HALO_DRAG = "box-shadow: 0 0 0 6px rgba(255,176,32,0.18)"
SHADOW_SEGMENT = "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)"
SHADOW_TOOLTIP = "0 1px 2px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)"

PLAY = '<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="#1A1204" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>'
PAUSE = '<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="#1A1204" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><path d="M8.5 5v14M15.5 5v14"/></svg>'

SUN_TIME_HEIGHT = 3920
PATH_SHADOWS_HEIGHT = 2590
SHADE_MAP_HEIGHT = 3600

# --------------------------------------------------------------------------------------------------
# The engine's data
# --------------------------------------------------------------------------------------------------

DAYS = {
    key: {"rise": d["sunrise_h"], "set": d["sunset_h"], "at": {p[0]: (p[1], p[2]) for p in d["positions"]}, "list": d["positions"]}
    for key, d in DATA["days"].items()
}
MODULES = DATA["modules"]
FIGURES = DATA["figures"]
STRINGS = {s["label"]: s for s in DATA["strings"]}
ROW_Y0 = {}
for _m in MODULES:
    ROW_Y0[_m["row"]] = min(ROW_Y0.get(_m["row"], 99.0), min(y for _, y in _m["outline"]))
TILT = math.tan(math.radians(15))
CLEARANCE = 0.5
MODULE_PLANE = 0.5 + 4.4 * TILT / 2  # the middle height of the modules, where a shadow on them is cast

CENTROID = (45.0, 20.0)
DOME = 1.3 * math.hypot(45.0, 20.0)  # 1.3 times the roof's radius, 49.24 m

STAIR = [(20.0, 16.0), (25.0, 16.0), (25.0, 20.0), (20.0, 20.0)]
TANK = (62.0, 24.0, 1.25, 2.0)
AC_UNITS = [[(70.0 + 3 * i, 3.0), (71.5 + 3 * i, 3.0), (71.5 + 3 * i, 4.0), (70.0 + 3 * i, 4.0)] for i in range(4)]
PARAPET_H = 0.9
WALLS = [
    [(0, 0), (90, 0), (90, 0.2), (0, 0.2)],
    [(0, 39.8), (90, 39.8), (90, 40), (0, 40)],
    [(0, 0), (0.2, 0), (0.2, 40), (0, 40)],
    [(89.8, 0), (90, 0), (90, 40), (89.8, 40)],
]


def clock(hour: float) -> str:
    return f"{int(hour + 1e-6):02d}:{int(round((hour % 1) * 60)) % 60:02d}"


def sun_at(day: str, hour: float) -> tuple[float, float]:
    return DAYS[day]["at"][hour]


def shift_of(elevation: float, azimuth: float) -> tuple[float, float]:
    """Where a shadow falls on a level plane per metre of height: away from the sun."""
    t = math.tan(math.radians(elevation))
    a = math.radians(azimuth)
    return -math.sin(a) / t, -math.cos(a) / t


def bearing(azimuth: float) -> str:
    """The bearing from the nearer of south and north (decision 3)."""
    if 90 <= azimuth <= 270:
        off = azimuth - 180
        return f"{abs(off):.1f}° {'W' if off > 0 else 'E'} of south"
    off = azimuth if azimuth < 90 else azimuth - 360
    return f"{abs(off):.1f}° {'E' if off > 0 else 'W'} of north"


def circle(cx: float, cy: float, r: float, n: int = 24) -> list[tuple[float, float]]:
    return [(cx + r * math.cos(2 * math.pi * k / n), cy + r * math.sin(2 * math.pi * k / n)) for k in range(n)]


def module_corners(m: dict) -> list[tuple[float, float, float]]:
    y0 = ROW_Y0[m["row"]]
    return [(x, y, CLEARANCE + (y - y0) * TILT) for x, y in m["outline"]]


def module_centre(m: dict) -> tuple[float, float]:
    xs = [x for x, _ in m["outline"]]
    ys = [y for _, y in m["outline"]]
    return sum(xs) / 4, sum(ys) / 4


def cast(points, heights, shift, plane: float = 0.0):
    """The shadow on a level plane of a thing given by its points and their heights."""
    return hull([(x, y) for x, y in points] + [(x + shift[0] * (h - plane), y + shift[1] * (h - plane)) for (x, y), h in zip(points, heights)])


def shadows_on_roof(shift) -> list[list[tuple[float, float]]]:
    """What the light casts on the roof surface: the parapet, the obstacles, the modules."""
    out = [cast(w, [PARAPET_H] * 4, shift) for w in WALLS]
    out.append(cast(STAIR, [3.0] * 4, shift))
    cx, cy, r, h = TANK
    out.append(cast(circle(cx, cy, r), [h] * 24, shift))
    out += [cast(a, [1.2] * 4, shift) for a in AC_UNITS]
    for m in MODULES:
        corners = module_corners(m)
        out.append(cast([(x, y) for x, y, _ in corners], [z for _, _, z in corners], shift))
    return out


def shadows_on_modules(shift) -> list[list[tuple[float, float]]]:
    """What the obstacles cast on the plane of the modules, which stands higher than the roof."""
    out = [cast(STAIR, [3.0] * 4, shift, MODULE_PLANE)]
    cx, cy, r, h = TANK
    out.append(cast(circle(cx, cy, r), [h] * 24, shift, MODULE_PLANE))
    out += [cast(a, [1.2] * 4, shift, MODULE_PLANE) for a in AC_UNITS]
    return out


def bbox(points) -> tuple[float, float, float, float]:
    xs, ys = [p[0] for p in points], [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def overlaps(a, b) -> bool:
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def step_of(pct: float) -> int:
    return min(4, int(pct))


def dome_point(elevation: float, azimuth: float) -> tuple[float, float, float]:
    e, a = math.radians(elevation), math.radians(azimuth)
    return CENTROID[0] + DOME * math.cos(e) * math.sin(a), CENTROID[1] + DOME * math.cos(e) * math.cos(a), DOME * math.sin(e)


def horizon_azimuth(day: str, rising: bool) -> float:
    """The azimuth where the arc meets the horizon, between the quarter hours on either side."""
    pts = DAYS[day]["list"]
    for p, q in zip(pts, pts[1:]):
        if rising and p[1] <= 0 < q[1] or not rising and p[1] > 0 >= q[1]:
            t = -p[1] / (q[1] - p[1])
            return p[2] + t * (q[2] - p[2])
    raise ValueError(day)


def arc_points(day: str) -> list[tuple[float, tuple[float, float, float]]]:
    d = DAYS[day]
    out = [(d["rise"], dome_point(0.0, horizon_azimuth(day, True)))]
    out += [(h, dome_point(el, az)) for h, el, az in d["list"] if el > 0]
    out.append((d["set"], dome_point(0.0, horizon_azimuth(day, False))))
    return out


# --------------------------------------------------------------------------------------------------
# The 3D, in pixels of the crop
# --------------------------------------------------------------------------------------------------


def fmt(points) -> str:
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


def fit(points3d, width: int, height: int, pad=(0.04, 0.04, 0.04, 0.04)) -> View:
    """A view of the crop's size that holds every point given in the roof's metres."""
    screen = [(View((0, 0, 1, 1), 1, 1).px(*p)) for p in points3d]
    return View(view_box(screen, width, height, pad=pad), width, height)


def faces_viewer(normal) -> bool:
    return normal[0] * -1.0 + normal[1] * -2.142 > 0


def ccw(points):
    a = sum(points[i][0] * points[(i + 1) % len(points)][1] - points[(i + 1) % len(points)][0] * points[i][1] for i in range(len(points)))
    return points if a > 0 else list(reversed(points))


def prism(view: View, footprint, h: float) -> str:
    out = []
    footprint = ccw(footprint)
    n = len(footprint)
    for i in range(n):
        (ax, ay), (bx, by) = footprint[i], footprint[(i + 1) % n]
        normal = (by - ay, -(bx - ax))
        if not faces_viewer(normal):
            continue
        colour = OBSTACLE_LIT if -normal[1] >= -normal[0] else OBSTACLE_SHADE
        out.append(f'<polygon points="{fmt([view.px(ax, ay, 0), view.px(bx, by, 0), view.px(bx, by, h), view.px(ax, ay, h)])}" fill="{colour}"/>')
    out.append(f'<polygon points="{fmt(view.px(x, y, h) for x, y in footprint)}" fill="{OBSTACLE_TOP}"/>')
    return "".join(out)


def cylinder(view: View, cx: float, cy: float, r: float, h: float) -> str:
    ring_ = circle(cx, cy, r)
    side = hull([view.px(x, y, 0) for x, y in ring_] + [view.px(x, y, h) for x, y in ring_])
    return f'<polygon points="{fmt(side)}" fill="{OBSTACLE_LIT}"/><polygon points="{fmt(view.px(x, y, h) for x, y in ring_)}" fill="{OBSTACLE_TOP}"/>'


def depth(x: float, y: float) -> float:
    return 2.187 * x + 4.68 * y


def ring_path(polygon: dict, to_px) -> str:
    rings = [polygon["exterior"], *polygon["holes"]]
    return "".join("M" + " L".join(f"{to_px(x, y)[0]:.1f} {to_px(x, y)[1]:.1f}" for x, y in r) + " Z" for r in rings)


def outline_paths(polygons, to_px, width: float = 2.0) -> str:
    return "".join(
        f'<path d="{ring_path(p, to_px)}" fill="none" stroke="{KEEP_OUT_LINE}" stroke-width="{width}" stroke-dasharray="7 4" stroke-linejoin="round"/>' for p in polygons
    )


class Scene3D:
    """The demo's roof on the stage at one time of a day, drawn in the pixels of a crop."""

    def __init__(
        self,
        view: View,
        tag: str,
        label: str,
        day: str = "355",
        hour: float | None = 16.0,
        shadows: bool = True,
        fade: float = 0.0,
        path: bool = True,
        window: bool = True,
        marker: bool = True,
        outlines: list | None = None,
        shade: bool = False,
        selected: int | None = None,
        marks: dict | None = None,
        vignette: bool = True,
    ):
        self.view, self.tag, self.label, self.day, self.hour = view, tag, label, day, hour
        self.shadows, self.fade, self.path, self.window, self.marker = shadows, fade, path, window, marker
        self.outlines, self.shade, self.selected, self.marks, self.vignette = outlines, shade, selected, marks or {}, vignette

    def html(self) -> str:
        v = self.view
        w, h = v.width, v.height
        sun = sun_at(self.day, self.hour) if self.hour is not None else None
        lit = sun is not None and sun[0] > 0
        shift = shift_of(*sun) if lit and self.shadows else None
        o = [f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="position: absolute; left: 0; top: 0" role="img" aria-label="{self.label}">']
        roof_px = [v.px(0, 0), v.px(90, 0), v.px(90, 40), v.px(0, 40)]
        o.append(
            f'<defs><clipPath id="roof-{self.tag}"><polygon points="{fmt(roof_px)}"/></clipPath>'
            f'<radialGradient id="fade-{self.tag}" cx="50%" cy="52%" r="62%"><stop offset="55%" stop-color="{GROUND}" stop-opacity="0"/><stop offset="100%" stop-color="{GROUND}" stop-opacity="1"/></radialGradient>'
            f'<radialGradient id="glow-{self.tag}"><stop offset="0%" stop-color="{SUN}" stop-opacity="0.45"/><stop offset="100%" stop-color="{SUN}" stop-opacity="0"/></radialGradient></defs>'
        )
        # The ground, six metres down, its grid and the building's shadow.
        grid = []
        for gx in range(-60, 161, 10):
            grid.append(f'<line x1="{v.px(gx, -50, -6)[0]:.1f}" y1="{v.px(gx, -50, -6)[1]:.1f}" x2="{v.px(gx, 110, -6)[0]:.1f}" y2="{v.px(gx, 110, -6)[1]:.1f}"/>')
        for gy in range(-50, 111, 10):
            grid.append(f'<line x1="{v.px(-60, gy, -6)[0]:.1f}" y1="{v.px(-60, gy, -6)[1]:.1f}" x2="{v.px(160, gy, -6)[0]:.1f}" y2="{v.px(160, gy, -6)[1]:.1f}"/>')
        o.append(f'<g stroke="{GRID_LINE}" stroke-width="1">{"".join(grid)}</g>')
        if shift:
            ground = cast([(0, 0), (90, 0), (90, 40), (0, 40)], [6.9] * 4, shift)
            o.append(f'<polygon points="{fmt(v.px(x, y, -6) for x, y in ground)}" fill="#05070A" opacity="0.7"/>')
        if self.vignette:
            o.append(f'<rect width="{w}" height="{h}" fill="url(#fade-{self.tag})"/>')
        # The roof, its setback line, the parapet's far inner faces and caps.
        o.append(f'<polygon points="{fmt(roof_px)}" fill="{ROOF}"/>')
        o.append(f'<polygon points="{fmt([v.px(1, 1), v.px(89, 1), v.px(89, 39), v.px(1, 39)])}" fill="none" stroke="{PARAPET_SHADE}" stroke-width="1" stroke-dasharray="4 3"/>')
        o.append(f'<polygon points="{fmt([v.px(0, 39.8, 0), v.px(90, 39.8, 0), v.px(90, 39.8, PARAPET_H), v.px(0, 39.8, PARAPET_H)])}" fill="{PARAPET_LIT}"/>')
        o.append(f'<polygon points="{fmt([v.px(89.8, 0, 0), v.px(89.8, 40, 0), v.px(89.8, 40, PARAPET_H), v.px(89.8, 0, PARAPET_H)])}" fill="{PARAPET_SHADE}"/>')
        for wall in (WALLS[1], WALLS[3]):
            o.append(f'<polygon points="{fmt(v.px(x, y, PARAPET_H) for x, y in wall)}" fill="{PARAPET_CAP}"/>')
        # On the roof: the rendered shadows, then the engine's outlines.
        strength = 0.36 * (1 - self.fade * 0.7)
        if shift:
            o.append(f'<g clip-path="url(#roof-{self.tag})" fill="{SHADOW}" opacity="{strength:.2f}">')
            o.extend(f'<polygon points="{fmt(v.px(x, y) for x, y in s)}"/>' for s in shadows_on_roof(shift))
            o.append("</g>")
        if self.outlines:
            o.append(f'<g clip-path="url(#roof-{self.tag})">{outline_paths(self.outlines, lambda x, y: v.px(x, y))}</g>')
        # Modules and obstacles, far to near; the obstacles' shadows on the modules they reach.
        on_modules = shadows_on_modules(shift) if shift else []
        boxes = [bbox(s) for s in on_modules]
        items = []
        for m in MODULES:
            corners = module_corners(m)
            pts = [v.px(*p) for p in corners]
            fill = SHADE[step_of(m["near_pct"])] if self.shade else GLASS
            svg = f'<polygon points="{fmt(pts)}" fill="{fill}" stroke="{FRAME}" stroke-width="0.6"/>'
            mb = bbox(m["outline"])
            hits = [s for s, b in zip(on_modules, boxes) if overlaps(mb, b)]
            if hits:
                cid = f"m{self.tag}{m['idx']}"
                svg += f'<clipPath id="{cid}"><polygon points="{fmt(pts)}"/></clipPath><g clip-path="url(#{cid})" fill="{SHADOW}" opacity="{strength:.2f}">'
                svg += "".join(f'<polygon points="{fmt(v.px(x, y, MODULE_PLANE) for x, y in s)}"/>' for s in hits) + "</g>"
            items.append((depth(*module_centre(m)), svg))
        items.append((depth(22.5, 18.0), prism(v, STAIR, 3.0)))
        cx, cy, r, th = TANK
        items.append((depth(cx, cy), cylinder(v, cx, cy, r, th)))
        for a in AC_UNITS:
            items.append((depth(a[0][0] + 0.75, 3.5), prism(v, a, 1.2)))
        items.sort(key=lambda it: -it[0])
        o.extend(svg for _, svg in items)
        # The near walls with the parapet's outer face, and the near caps.
        o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(90, 0, -6), v.px(90, 0, PARAPET_H), v.px(0, 0, PARAPET_H)])}" fill="{WALL_LIT}"/>')
        o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(90, 0, -6), v.px(90, 0, -5.6), v.px(0, 0, -5.6)])}" fill="{WALL_EDGE_LIT}"/>')
        o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(0, 40, -6), v.px(0, 40, PARAPET_H), v.px(0, 0, PARAPET_H)])}" fill="{WALL_SHADE}"/>')
        o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(0, 40, -6), v.px(0, 40, -5.6), v.px(0, 0, -5.6)])}" fill="{WALL_EDGE_SHADE}"/>')
        for wall in (WALLS[0], WALLS[2]):
            o.append(f'<polygon points="{fmt(v.px(x, y, PARAPET_H) for x, y in wall)}" fill="{PARAPET_CAP}"/>')
        if self.fade:
            o.append(f'<rect width="{w}" height="{h}" fill="{GROUND}" opacity="{self.fade * 0.55:.2f}"/>')
        if self.selected is not None:
            m = MODULES[self.selected]
            o.append(f'<polygon points="{fmt(v.px(*p) for p in module_corners(m))}" fill="none" stroke="{ACCENT}" stroke-width="2" stroke-linejoin="round"/>')
        chips = ""
        if self.path and self.hour is not None or self.path and self.marks:
            svg, chips = self.sun_path()
            o.append(svg)
        o.append("</svg>")
        return "".join(o) + chips

    def sun_path(self) -> tuple[str, str]:
        v = self.view
        points = arc_points(self.day)
        line = fmt(v.px(*p) for _, p in points)
        o = [f'<polyline points="{line}" fill="none" stroke="{SUN}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>']
        if self.window:
            inside = [v.px(*p) for hr, p in points if 9.0 <= hr <= 16.0]
            o.append(f'<polyline points="{fmt(inside)}" fill="none" stroke="{SUN}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>')
        chips = ""
        at = dict(points)
        for hour, (words, dx, dy) in self.marks.items():
            x, y = v.px(*at[hour])
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="{GROUND}" stroke="{SUN}" stroke-width="2"/>')
            chips += hour_chip(x + dx, y + dy, words)
        if self.marker and self.hour is not None and sun_at(self.day, self.hour)[0] > 0:
            x, y = v.px(*dome_point(*sun_at(self.day, self.hour)))
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="26" fill="url(#glow-{self.tag})"/><circle cx="{x:.1f}" cy="{y:.1f}" r="10" fill="{SUN}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="{SUN_CORE}"/>')
        return "".join(o), chips


def hour_chip(x: float, y: float, words: str) -> str:
    """An hour mark of the arc: a small chip with the look of the stage's dimension labels, centred on (x, y)."""
    return (
        f'<code style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; transform: translate(-50%, -50%); padding: 0 7px; background: {GROUND}; border-radius: 6px; '
        f'font-size: 11px; line-height: 20px; color: {TEXT_2}; white-space: nowrap; box-shadow: {SHADOW_LABEL}">{words}</code>'
    )


MARKS_355 = {
    DAYS["355"]["rise"]: ("06:33 sunrise", -50, -16),
    9.0: ("09:00", 0, -20),
    12.0: ("12:00", 0, -20),
    16.0: ("16:00", 36, -14),
    DAYS["355"]["set"]: ("sunset 17:27", 0, 18),
}


def frame_crop(width: int, height: int, inside: str, radius: int = 12) -> str:
    return (
        f'<div style="position: relative; flex-shrink: 0; width: {width}px; height: {height}px; overflow: hidden; border-radius: {radius}px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px">'
        f"{inside}</div>"
    )


def stage_sub(day: str = "21 December · winter solstice") -> str:
    return f"{day} · shade-free from 09:00 to 16:00"


# --------------------------------------------------------------------------------------------------
# The plan, north up
# --------------------------------------------------------------------------------------------------


def plan(width: int, height: int, region, tag: str, label: str, day: str = "355", hour: float = 16.0, outlines=None, shade: bool = False, selected: int | None = None) -> tuple[str, object]:
    """The scene seen straight down, north up: *region* is (west, south, east, north) in metres."""
    x0, y0, x1, y1 = region
    s = min(width / (x1 - x0), height / (y1 - y0))
    ox = (width - (x1 - x0) * s) / 2
    oy = (height - (y1 - y0) * s) / 2

    def px(x, y):
        return ox + (x - x0) * s, oy + (y1 - y) * s

    shift = shift_of(*sun_at(day, hour))
    o = [f'<svg viewBox="0 0 {width} {height}" width="{width}" height="{height}" style="position: absolute; left: 0; top: 0" role="img" aria-label="{label}">']
    roof = [px(0, 0), px(90, 0), px(90, 40), px(0, 40)]
    o.append(f'<defs><clipPath id="plan-{tag}"><polygon points="{fmt(roof)}"/></clipPath></defs><rect width="{width}" height="{height}" fill="{GROUND}"/>')
    for gx in range(-100, 200, 10):
        x, _ = px(gx, 0)
        if 0 <= x <= width:
            o.append(f'<line x1="{x:.1f}" y1="0" x2="{x:.1f}" y2="{height}" stroke="{LINE_SUBTLE}"/>')
    for gy in range(-100, 200, 10):
        _, y = px(0, gy)
        if 0 <= y <= height:
            o.append(f'<line x1="0" y1="{y:.1f}" x2="{width}" y2="{y:.1f}" stroke="{LINE_SUBTLE}"/>')
    o.append(f'<polygon points="{fmt(roof)}" fill="{ROOF}"/>')
    o.append(f'<polygon points="{fmt([px(1, 1), px(89, 1), px(89, 39), px(1, 39)])}" fill="none" stroke="{PARAPET_SHADE}" stroke-dasharray="4 3"/>')
    o.append(f'<g clip-path="url(#plan-{tag})" fill="{SHADOW}" opacity="0.36">' + "".join(f'<polygon points="{fmt(px(x, y) for x, y in sh)}"/>' for sh in shadows_on_roof(shift)) + "</g>")
    if outlines:
        o.append(f'<g clip-path="url(#plan-{tag})">{outline_paths(outlines, px, 2.2)}</g>')
    on_modules = shadows_on_modules(shift)
    boxes = [bbox(sh) for sh in on_modules]
    for m in MODULES:
        pts = [px(x, y) for x, y in m["outline"]]
        if not any(-20 < x < width + 20 and -20 < y < height + 20 for x, y in pts):
            continue
        fill = SHADE[step_of(m["near_pct"])] if shade else GLASS
        o.append(f'<polygon points="{fmt(pts)}" fill="{fill}" stroke="{FRAME}" stroke-width="{max(0.6, s * 0.06):.2f}"/>')
        mb = bbox(m["outline"])
        hits = [sh for sh, b in zip(on_modules, boxes) if overlaps(mb, b)]
        if hits:
            cid = f"p{tag}{m['idx']}"
            o.append(f'<clipPath id="{cid}"><polygon points="{fmt(pts)}"/></clipPath><g clip-path="url(#{cid})" fill="{SHADOW}" opacity="0.36">')
            o.append("".join(f'<polygon points="{fmt(px(x, y) for x, y in sh)}"/>' for sh in hits) + "</g>")
    for wall in WALLS:
        o.append(f'<polygon points="{fmt(px(x, y) for x, y in wall)}" fill="{PARAPET_CAP}"/>')
    o.append(f'<polygon points="{fmt(px(x, y) for x, y in STAIR)}" fill="{OBSTACLE_TOP}" stroke="{OBSTACLE_SHADE}"/>')
    cx, cy, r, _ = TANK
    o.append(f'<polygon points="{fmt(px(x, y) for x, y in circle(cx, cy, r, 40))}" fill="{OBSTACLE_TOP}" stroke="{OBSTACLE_SHADE}"/>')
    for a in AC_UNITS:
        o.append(f'<polygon points="{fmt(px(x, y) for x, y in a)}" fill="{OBSTACLE_TOP}" stroke="{OBSTACLE_SHADE}"/>')
    if selected is not None:
        o.append(f'<polygon points="{fmt(px(x, y) for x, y in MODULES[selected]["outline"])}" fill="none" stroke="{ACCENT}" stroke-width="2"/>')
    o.append("</svg>")
    return "".join(o), px


def scale_bar(px_per_m: float, metres: int, left: int = 20, bottom: int = 20) -> str:
    return (
        f'<div style="position: absolute; left: {left}px; bottom: {bottom}px; display: flex; flex-direction: column; gap: 3px"><code style="font-size: 12px; text-shadow: 0 1px 3px rgba(0,0,0,0.9)">{metres} m</code>'
        f'<div style="width: {metres * px_per_m:.0f}px; height: 5px; box-sizing: border-box; border: 2px solid {TEXT}; border-top: 0"></div></div>'
    )


# --------------------------------------------------------------------------------------------------
# The time: the pill of every lens and the timeline of the Sun lens
# --------------------------------------------------------------------------------------------------


def play_button(side: int, playing: bool, glyph: int, focus: bool = False, tag: str = "button") -> str:
    name = "Pause" if playing else "Play the day"
    look = f"; {RING_FOCUS}" if focus else ""
    inner = (PAUSE if playing else PLAY).format(s=glyph)
    label = f' aria-label="{name}"' if tag == "button" else ' aria-hidden="true"'
    return (
        f'<{tag}{label} style="width: {side}px; height: {side}px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: {ACCENT}; border: 0; '
        f'border-radius: 50%; cursor: pointer; box-shadow: {SHADOW_PRIMARY}{look}">{inner}</{tag}>'
    )


def handle(at: str, touch: bool, top: int, focus: bool = False, dragged: bool = False) -> str:
    side, line = (26, 4) if touch else (18, 3)
    look = HALO_DRAG if dragged else f"box-shadow: {SHADOW_HANDLE}"
    ring_ = f"; {RING_FOCUS}" if focus else ""
    pointer = f'<div style="position: absolute; left: calc({at} + 6px); top: {top + side - 6}px">{POINTER}</div>' if dragged else ""
    return (
        f'<div style="position: absolute; left: calc({at} - {side / 2:.0f}px); top: {top}px; width: {side}px; height: {side}px; box-sizing: border-box; border-radius: 50%; '
        f'background: {TEXT}; border: {line}px solid {ACCENT}; {look}{ring_}"></div>{pointer}'
    )


def keys_tooltip() -> str:
    def key(k: str) -> str:
        return f'<code style="padding: 0 5px; border: 1px solid {LINE_STRONG}; border-radius: 4px; font-size: 11px; line-height: 16px; color: {TEXT_2}">{k}</code>'

    return (
        f'<span role="tooltip" style="display: flex; align-items: center; gap: 5px; height: 28px; box-sizing: border-box; padding: 0 10px; background: {CONTROL_ACTIVE}; border: 1px solid {LINE_STRONG}; '
        f'border-radius: 8px; font-size: 12px; white-space: nowrap; box-shadow: {SHADOW_TOOLTIP}">'
        f'{key(",")}{key(".")}<span style="margin-right: 6px">an hour</span>{key("[")}{key("]")}<span style="margin-right: 6px">a day</span>{key("←")}{key("→")}<span>a quarter hour</span></span>'
    )


def pill_track(hour: float, width: int, touch: bool, focus: bool = False, dragged: bool = False, start: float | None = None, end: float | None = None, tip: bool = False) -> str:
    """The short track of the pill: the kit's slider from sunrise to sunset, filled to the time."""
    start = DAYS["355"]["rise"] if start is None else start
    end = DAYS["355"]["set"] if end is None else end
    at = inset_at(hour, start, end, 26 if touch else 18)
    height = 44 if touch else 20
    track_top = height // 2 - 2
    side = 26 if touch else 18
    bubble = (
        f'<div style="position: absolute; left: {at}; top: {track_top - side // 2 - 26}px; transform: translateX(-50%); {MONO}; font-size: 12px; font-weight: 500; white-space: nowrap; text-shadow: 0 1px 3px rgba(0,0,0,0.9)">{clock(hour)}</div>'
        if dragged
        else ""
    )
    tooltip = f'<div style="position: absolute; left: {at}; top: -48px; transform: translateX(-50%)">{keys_tooltip()}</div>' if tip else ""
    return (
        f'<div role="slider" tabindex="0" aria-label="Time of day" aria-valuetext="{clock(hour)} solar time" style="position: relative; flex-shrink: 0; width: {width}px; height: {height}px">'
        f'<div style="position: absolute; left: 0; right: 0; top: {track_top}px; height: 4px; border-radius: 2px; background: {LINE}"></div>'
        f'<div style="position: absolute; left: 0; width: {at}; top: {track_top}px; height: 4px; border-radius: 2px; background: {ACCENT}"></div>'
        + handle(at, touch, track_top + 2 - side // 2, focus, dragged)
        + bubble
        + tooltip
        + "</div>"
    )


def pill(size: str, hour: float = 10.5, playing: bool = False, focus: str = "", dragged: bool = False, day: str = "21 Dec") -> str:
    """The time on the stage of every lens, as the approved Array boards draw it. *focus* is "track",
    "play" or "pill" (phone)."""
    words = f"{day} · {clock(hour)}"
    if size == "phone":
        ring_ = f"; {RING_FOCUS}" if focus else ""
        return (
            f'<button aria-label="{"Pause" if playing else "Play the day"}, 21 December {clock(hour)}" style="display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px 0 6px; background: {CONTROL}; '
            f'border: 1px solid {LINE}; border-radius: 22px; cursor: pointer; box-shadow: {SHADOW_RAISED}{ring_}">'
            + play_button(32, playing, 11, tag="span")
            + f'<span style="{MONO}; font-size: 12px">{words}</span></button>'
        )
    touch = size == "tablet"
    look = (
        "height: 48px; padding: 0 12px 0 6px; border-radius: 24px" if touch else "height: 44px; padding: 0 8px 0 6px; border-radius: 22px"
    )
    after = "" if touch else f'<span style="font-size: 12px; color: {TEXT_3}; padding-right: 8px">solar time</span>'
    return (
        f'<div style="display: inline-flex; align-items: center; gap: 12px; {look}; background: {SURFACE_1}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}">'
        + play_button(36 if touch else 32, playing, 12, focus=focus == "play")
        + f'<span style="{MONO}; font-size: {13 if touch else 12}px; white-space: nowrap">{words}</span>'
        + pill_track(hour, 200 if touch else 180, touch, focus == "track", dragged, tip=focus == "track" and not touch)
        + after
        + "</div>"
    )


def ticks_whole_day() -> list[tuple[float, str]]:
    return [(0.0, "00:00"), (6.0, "06:00"), (12.0, "12:00"), (18.0, "18:00"), (24.0, "24:00")]


def inset_at(hour: float, start: float, end: float, side: int) -> str:
    """Where an hour stands on a track: the middle of the handle stays half a handle from its ends (the kit)."""
    p = (hour - start) / (end - start)
    return f"calc({side / 2}px + {p:.4f} * (100% - {side}px))"


def timeline(
    hour: float,
    touch: bool = False,
    playing: bool = False,
    dragged: bool = False,
    focus: str = "",
    start: float | None = None,
    end: float | None = None,
    ticks: list | None = None,
    words: str = "",
    window: bool = True,
) -> str:
    """The timeline of the Sun lens (components.md), as the Sun lens boards draw it: a floating bar of 64, play
    of 44, the time in display 22 over "solar time", the kit's slider from sunrise to sunset with the shade-free
    window filled and the handle at the time, the ticks under it. On tablet the ends of the day stand beside the
    track, their time over their word."""
    whole_day = start is not None
    start = DAYS["355"]["rise"] if start is None else start
    end = DAYS["355"]["set"] if end is None else end
    side, line = (26, 4) if touch else (18, 3)
    height, track_top, tick_top = (56, 20, 37) if touch else (44, 14, 26)
    beside = touch and not whole_day
    if ticks is None:
        d = DAYS["355"]
        middle = [(9.0, "09:00"), (12.0, "12:00"), (16.0, "16:00")]
        ticks = middle if beside else [(d["rise"], "06:33 sunrise")] + middle + [(d["set"], "sunset 17:27")]
    fill = ""
    if window:
        lo, hi = inset_at(9.0, start, end, side), inset_at(16.0, start, end, side)
        fill = f'<div style="position: absolute; left: {lo}; width: calc({hi} - {lo}); top: {track_top - 2}px; height: 4px; border-radius: 2px; background: {ACCENT}"></div>'
    marks = ""
    for n, (h, label_) in enumerate(ticks):
        colour = TEXT_2 if h in (9.0, 16.0) and window else TEXT_3
        if not beside and n == 0:
            place = "left: 0"
        elif not beside and n == len(ticks) - 1:
            place = "right: 0"
        else:
            place = f"left: {inset_at(h, start, end, side)}; transform: translateX(-50%)"
        marks += f'<span style="position: absolute; {place}; top: {tick_top}px; {MONO}; font-size: 11px; line-height: 16px; color: {colour}; white-space: nowrap">{label_}</span>'
    at = inset_at(hour, start, end, side)
    look = HALO_DRAG if dragged else f"box-shadow: {SHADOW_HANDLE}"
    ring_ = f"; {RING_FOCUS}" if focus == "track" else ""
    knob = (
        f'<div style="position: absolute; left: calc({at} - {side / 2}px); top: {track_top - side / 2}px; width: {side}px; height: {side}px; box-sizing: border-box; border-radius: 50%; '
        f'background: {TEXT}; border: {line}px solid {ACCENT}; {look}{ring_}"></div>'
    )
    if dragged:
        knob += f'<div style="position: absolute; left: calc({at} + 6px); top: {track_top + side / 2 - 6}px">{POINTER}</div>'
    if focus == "track" and not touch:
        knob += f'<div style="position: absolute; left: {at}; top: {track_top - side / 2 - 8 - 28}px; transform: translateX(-50%)">{keys_tooltip()}</div>'
    if words:
        time_block = (
            '<div style="display: flex; flex-direction: column; flex-shrink: 0">'
            f'<div style="display: flex; align-items: baseline; gap: 6px"><span style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">{clock(hour)}</span><span style="font-size: 12px; color: {TEXT_2}">solar time</span></div>'
            f'<span style="font-size: 12px; line-height: 16px; color: {TEXT_2}; white-space: nowrap">{words}</span></div>'
        )
    else:
        time_block = (
            f'<div style="display: flex; flex-direction: column; flex-shrink: 0"><span style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">{clock(hour)}</span>'
            f'<span style="font-size: 12px; line-height: 16px; color: {TEXT_2}">solar time</span></div>'
        )
    track = (
        f'<div role="slider" tabindex="0" aria-label="Time of day" aria-valuetext="{clock(hour)} solar time" style="position: relative; flex-grow: 1; min-width: 0; height: {height}px">'
        f'<div style="position: absolute; left: 0; right: 0; top: {track_top - 2}px; height: 4px; border-radius: 2px; background: {LINE}"></div>'
        + fill
        + marks
        + knob
        + "</div>"
    )
    if beside:
        d = DAYS["355"]
        track = (
            f'<div style="width: 1px; height: 36px; background: {LINE}; flex-shrink: 0"></div>'
            + end_label(d["rise"], "sunrise", "flex-start")
            + track
            + end_label(d["set"], "sunset", "flex-end")
        )
    pad = "0 18px 0 10px" if touch else "0 20px 0 10px"
    return (
        f'<div role="group" aria-label="Time" style="display: flex; align-items: center; gap: {14 if touch else 16}px; height: 64px; box-sizing: border-box; padding: {pad}; background: {SURFACE_1}; border: 1px solid {LINE}; '
        f'border-radius: 16px; box-shadow: {SHADOW_FLOAT}">'
        + play_button(44, playing, 14, focus=focus == "play")
        + time_block
        + track
        + "</div>"
    )


def end_label(hour: float, words: str, align: str) -> str:
    """The time of an end of the day beside the track, its word level with the ticks (tablet)."""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 9px; height: 56px; box-sizing: border-box; padding-top: 12px; flex-shrink: 0; align-items: {align}">'
        f'<span style="{MONO}; font-size: 12px; line-height: 16px; color: {TEXT_2}">{clock(hour)}</span>'
        f'<span style="font-size: 11px; line-height: 16px; color: {TEXT_3}">{words}</span></div>'
    )


def strip(width: int, height: int, inside: str, align: str = "flex-end") -> str:
    """A piece of the stage's ground with what floats on it, inset as on the stage."""
    return (
        f'<div style="position: relative; width: {width}px; height: {height}px; box-sizing: border-box; display: flex; align-items: {align}; padding: 20px; '
        f'background: {GROUND}; border: 1px solid {LINE}; border-radius: 12px">{inside}</div>'
    )


def caption(words: str) -> str:
    return f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">{words}</p>'


def notes(*paragraphs: str) -> str:
    return '<div style="display: flex; flex-direction: column; gap: 10px">' + "".join(caption(p) for p in paragraphs) + "</div>"


def two_columns(left: str, right: str, right_width: int = 272) -> str:
    return f'<div style="display: grid; grid-template-columns: minmax(0, 1fr) {right_width}px; gap: 24px; align-items: start">{left}{right}</div>'


# --------------------------------------------------------------------------------------------------
# The inspector's pieces
# --------------------------------------------------------------------------------------------------


def segmented(options: tuple[str, ...], taken: str, touch: bool = False, label_: str = "") -> str:
    height, radius, item, size = (44, 12, 9, 15) if touch else (34, 10, 7, 13)
    buttons = ""
    for name in options:
        on = name == taken
        look = f"background: {CONTROL_ACTIVE}; font-weight: 500; box-shadow: {SHADOW_SEGMENT}" if on else f"background: transparent; color: {TEXT_2}"
        buttons += f'<button role="radio" aria-checked="{"true" if on else "false"}" style="height: {height}px; border: 0; border-radius: {item}px; font-size: {size}px; cursor: pointer; {look}">{name}</button>'
    return (
        f'<div role="radiogroup" aria-label="{label_}" style="display: grid; grid-template-columns: repeat({len(options)}, minmax(0, 1fr)); gap: 2px; padding: 3px; background: {WELL}; '
        f'border: 1px solid {LINE}; border-radius: {radius}px; box-shadow: {SHADOW_WELL}">{buttons}</div>'
    )


def tile(label_: str, value: str, unit: str = "", dim: bool = False, turning: bool = False, waiting: str = "", skeleton: bool = False) -> str:
    if skeleton:
        # A skeleton in a tile, which is surface-2 itself, takes the next step up: control-active.
        inside = bone(54, 18).replace(f"background: {SURFACE_2}", f"background: {CONTROL_ACTIVE}")
    elif waiting:
        inside = f'<div style="font-size: 12px; line-height: 16px; color: {TEXT_2}">{waiting}</div>'
    else:
        fade = "; opacity: 0.55" if dim else ""
        unit_ = f'<span style="font-family: Geist, sans-serif; font-size: 12px; font-weight: 400; color: {TEXT_2}">{unit}</span>' if unit else ""
        inside = f'<div style="display: flex; align-items: center; gap: 6px"><span style="display: flex; align-items: baseline; gap: 4px; {MONO}; font-weight: 500; font-size: 16px{fade}">{value}{unit_}</span>{ring(16) if turning else ""}</div>'
    return (
        f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; background: {SURFACE_2}; border-radius: 12px">'
        f'<div style="font-size: 12px; color: {TEXT_2}; white-space: nowrap">{label_}</div>{inside}</div>'
    )


def tiles(*items: str) -> str:
    return f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{"".join(items)}</div>'


def hint(words: str) -> str:
    return f'<div style="font-size: 12px; color: {TEXT_3}">{words}</div>'


def select_trigger(label_: str, value: str, touch: bool = False) -> str:
    return (
        f'<button aria-haspopup="listbox" style="display: flex; align-items: center; gap: 8px; height: {44 if touch else 40}px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE}; '
        f'border-radius: {12 if touch else 10}px; cursor: pointer; box-shadow: {SHADOW_RAISED}"><span style="color: {TEXT_2}; font-size: 13px">{label_}</span>'
        f'<span style="flex-grow: 1; text-align: left; font-weight: 500">{value}</span>{icon(CHEVRON, 16, TEXT_3)}</button>'
    )


def day_section(taken: str = "21 Dec", touch: bool = False, other: tuple[str, str] = ("4", "February")) -> str:
    seg = segmented(("21 Dec", "21 Mar", "21 Jun", "Any date"), taken, touch, "Day")
    if taken == "Any date":
        day_, month = other
        body = (
            seg
            + f'<div style="display: grid; grid-template-columns: 116px minmax(0, 1fr); gap: 8px">'
            + number_field("day", "Day", day_, "", height=44 if touch else 40, width=28, radius=12 if touch else 10)
            + select_trigger("Month", month, touch)
            + "</div>"
            + hint("Day 35 · the design day is 21 December")
        )
    else:
        body = seg + hint("21 December is the design day: the winter solstice for this hemisphere")
    return lens_section("Day", body, gap=10)


def sun_at_section(hour: float, day: str = "355", narrow: bool = False) -> str:
    el, az = sun_at(day, hour)
    words = bearing(az)
    value, rest = words.split("° ", 1)
    pair = tile("Height", f"{el:.1f}°") + tile("Bearing", f"{value}°", rest)
    body = f'<div style="display: flex; flex-direction: column; gap: 8px">{pair}</div>' if narrow else tiles(pair)
    return lens_section(f"Sun at {clock(hour)}", body, gap=10)


def figures_section(kind: str = "option") -> str:
    """Shading over the year (decision 13): option A's, or all positions' with the electrical waiting."""
    o = FIGURES["option"]
    a = FIGURES["all_positions"]
    keep = f"{FIGURES['keepout_area_m2']:.0f}"
    if kind == "option":
        body = tiles(
            tile("Near, linear", f"{abs(o['near_pct']):.2f}", "%"),
            tile("Electrical, beyond linear", f"{abs(o['electrical_pct']):.2f}", "%"),
            tile("Far, horizon", f"{abs(o['far_pct']):.2f}", "%"),
            tile("Kept clear", keep, "m²"),
        ) + hint(f"Of the {o['modules']} modules of option {o['letter']} · {FIGURES['far_shading_note']}")
    elif kind == "none":
        body = tiles(
            tile("Near, linear", f"{a['near_pct']:.2f}", "%"),
            tile("Electrical, beyond linear", "", waiting="Choose a system voltage to size the strings"),
            tile("Far, horizon", f"{a['far_pct']:.2f}", "%"),
            tile("Kept clear", keep, "m²"),
        ) + hint(f"Of all {a['positions']} positions · {FIGURES['far_shading_note']}")
    elif kind == "updating":
        body = tiles(
            tile("Near, linear", f"{abs(o['near_pct']):.2f}", "%", dim=True, turning=True),
            tile("Electrical, beyond linear", f"{abs(o['electrical_pct']):.2f}", "%", dim=True, turning=True),
            tile("Far, horizon", f"{abs(o['far_pct']):.2f}", "%", dim=True, turning=True),
            tile("Kept clear", keep, "m²"),
        ) + hint(f"Of the {o['modules']} modules of option {o['letter']} · updating with the design run")
    else:
        body = tiles(
            tile("Near, linear", "", skeleton=True),
            tile("Electrical, beyond linear", "", skeleton=True),
            tile("Far, horizon", "", skeleton=True),
            tile("Kept clear", keep, "m²"),
        ) + f'<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: {TEXT_2}">{ring(16)}Computing hourly shading for every module</div>'
    return lens_section("Shading over the year", body, gap=10)


def switch_line(label_: str, words: str, on: bool) -> str:
    return (
        '<div style="display: flex; align-items: center; gap: 12px">'
        f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span>{label_}</span><span style="font-size: 12px; color: {TEXT_3}">{words}</span></div>'
        f"{switch(on, label_)}</div>"
    )


ON_THE_ROOF = [
    ("Sun path", "The arc the sun follows on this day"),
    ("Shade-free window", "Thick part of the arc, 09:00 to 16:00"),
    ("Calculated shadow outlines", "The engine’s shadows, drawn over what you see"),
]


def on_the_roof_section(states: tuple[bool, bool, bool] = (True, True, False)) -> str:
    return lens_section("On the roof", "".join(switch_line(l, w, s) for (l, w), s in zip(ON_THE_ROOF, states)), gap=14)


def shadows_or_map(taken: str, touch: bool = False) -> str:
    return segmented(("Shadows", "Shade map"), taken, touch, "Show")


def panel(body: str, label_: str = "Sun inspector", width: str = "384px") -> str:
    return f'<div aria-label="{label_}" style="{INSPECTOR}; width: {width}">{body}</div>'


# --------------------------------------------------------------------------------------------------
# The shade map's pieces
# --------------------------------------------------------------------------------------------------

COUNTS = [sum(1 for m in MODULES if step_of(m["near_pct"]) == k) for k in range(5)]


def swatches(width: int = 40, height: int = 10, labels: str = "all") -> str:
    """The five steps in a row, the bounds under them in mono: 0 to 5 %, in steps of 1 %."""
    row = "".join(f'<span style="width: {width}px; height: {height}px; background: {c}; border-radius: {2 if height < 10 else 3}px"></span>' for c in SHADE)
    total = 5 * width + 4 * 2
    if labels == "ends":
        under = f'<div style="display: flex; justify-content: space-between; width: {total}px; {MONO}; font-size: 11px; line-height: 14px; color: {TEXT_3}"><span>0 %</span><span>5 %</span></div>'
    else:
        under = f'<div style="position: relative; width: {total}px; height: 14px; {MONO}; font-size: 11px; line-height: 14px; color: {TEXT_3}">'
        for k in range(6):
            x = k * (width + 2) - (1 if 0 < k < 5 else 0)
            place = "left: 0" if k == 0 else f"right: 0" if k == 5 else f"left: {x}px; transform: translateX(-50%)"
            under += f'<span style="position: absolute; {place}; white-space: nowrap">{k}{" %" if k == 5 else ""}</span>'
        under += "</div>"
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><div style="display: flex; gap: 2px">{row}</div>{under}</div>'


def legend(state_: str = "map", small: bool = False) -> str:
    """The legend on the stage: a floating chip near the bottom left."""
    if state_ == "waiting":
        inside = (
            f'<div style="font-size: 13px; font-weight: 500">Near shading over the year</div>'
            f'<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: {TEXT_2}">{ring(16)}The shade map follows the design run</div>'
        )
    elif small:
        inside = f'<div style="font-size: 12px; font-weight: 500">Near shading over the year</div>' + swatches(22, 8, "ends")
    else:
        inside = (
            f'<div style="font-size: 13px; font-weight: 500">Near shading over the year</div>'
            + swatches()
            + f'<div style="font-size: 12px; color: {TEXT_2}">Of all {len(MODULES)} positions</div>'
        )
    pad = "8px 12px" if small else "10px 14px"
    return (
        f'<div role="group" aria-label="Legend of the shade map" style="display: flex; flex-direction: column; gap: {4 if small else 6}px; padding: {pad}; background: {SURFACE_1}; border: 1px solid {LINE}; '
        f'border-radius: 14px; box-shadow: {SHADOW_FLOAT}">{inside}</div>'
    )


def module_callout(x: float, y: float, idx: int, option: bool = True, above: int = 46, left_of: int = 40, width: int | None = None, small: bool = False) -> str:
    """The callout of a selected module in the shade map (decision 14)."""
    m = MODULES[idx]
    detail = f"Near shading {m['near_pct']:.2f} % over the year"
    if option:
        s = m["string"]
        detail += f" · string {s}, {STRINGS[s]['shade_pct']:.2f} %" if s else " · not used by option A"
    title = f"Position {idx + 1} · row {m['row'] + 1}"
    width_ = f"width: {width}px; white-space: normal; " if width else "white-space: nowrap; "
    return (
        f'<div aria-hidden="true" style="position: absolute; left: {x:.0f}px; top: {y - above:.0f}px; width: 1px; height: {above}px; background: {ACCENT}"></div>'
        f'<div aria-hidden="true" style="position: absolute; left: {x - 4:.0f}px; top: {y - 4:.0f}px; width: 9px; height: 9px; border-radius: 50%; background: {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.25)"></div>'
        f'<div style="position: absolute; left: {x - left_of:.0f}px; top: {y - above:.0f}px; transform: translateY(-100%); box-sizing: border-box; {width_}display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="font-size: 13px; font-weight: 500">{title}</div><div style="font-size: 12px; color: {TEXT_2}">{detail}</div></div>'
    )


def step_rows(touch: bool = False) -> str:
    """The steps of the map, each with its range and its count of positions: the map's text."""
    rows = ""
    for k in range(5):
        count = COUNTS[k]
        rows += (
            f'<div style="display: flex; align-items: center; gap: 10px; height: 26px"><span style="width: 22px; height: 12px; border-radius: 3px; background: {SHADE[k]}"></span>'
            f'<code style="flex-grow: 1; font-size: 13px">{k} to {k + 1} %</code><span style="{MONO}; font-size: 13px; color: {TEXT_2}">{count:,}</span>'
            f'<span style="width: 62px; font-size: 12px; color: {TEXT_3}">{"position" if count == 1 else "positions"}</span></div>'
        )
    return rows.replace("height: 26px", "height: 32px").replace("font-size: 13px", "font-size: 15px") if touch else rows


def map_section() -> str:
    rows = step_rows()
    return lens_section(
        "Shade map",
        f'<p style="margin: 0; font-size: 13px; color: {TEXT_2}">Each module is coloured by its near shading over the year, from the design run. Select a module for its value.</p>'
        f'<div style="display: flex; flex-direction: column">{rows}</div>',
        gap=10,
    )


# --------------------------------------------------------------------------------------------------
# Board 1: Time on the stage
# --------------------------------------------------------------------------------------------------


def pills_card() -> str:
    cells = ""
    rows = [
        ("Paused", dict(), "Paused at 10:30"),
        ("Playing", dict(playing=True, hour=10.75), "Playing: the pause icon; the time moves a quarter hour every 250 ms"),
        ("Focused", dict(focus="track"), "The track has the focus by the keyboard"),
        ("Dragged", dict(dragged=True, hour=14.25), "Dragged: the time follows the handle, live"),
    ]
    for name, kw, words in rows:
        desktop = strip(520, 112, pill("desktop", **kw))
        tablet_kw = dict(kw)
        tablet = strip(440, 112, pill("tablet", **tablet_kw))
        if name == "Dragged":
            phone = (
                f'<div style="width: 260px; height: 112px; box-sizing: border-box; display: flex; align-items: center; padding: 16px; border: 1px dashed {LINE_STRONG}; border-radius: 12px; '
                f'font-size: 12px; color: {TEXT_2}">On phone the pill has no track: a press plays and pauses. The time is moved on the timeline of the Sun lens, in the sheet.</div>'
            )
        else:
            phone_kw = {"playing": kw.get("playing", False), "hour": kw.get("hour", 10.5), "focus": "pill" if name == "Focused" else ""}
            phone = strip(260, 112, pill("phone", **phone_kw), align="flex-start")
        cells += (
            state(f"Desktop · {words}", desktop)
            + state(f"Tablet · {name.lower()}{', no tooltip on touch' if name == 'Focused' else ''}", tablet)
            + state(f"Phone · {name.lower()}{', the whole pill is the button' if name == 'Focused' else ''}", phone)
        )
    grid = f'<div style="display: grid; grid-template-columns: 520px 440px 260px; gap: 18px 30px; align-items: start">{cells}</div>'
    body = grid + notes(
        "The pill stands on the stage of the Roof, Array and Strings lenses where the approved boards put it: desktop 24 from the left over the vitals, tablet 20 from the left at the bottom of the stage, phone 12 from the left at the top. "
        "It shows the day and the time of the view, the same in every lens. The track is the kit's slider from sunrise to sunset (06:33 to 17:27 on 21 December), filled to the time; the handle takes the quarter hours inside them, 06:45 to 17:15.",
        "Play changes to Pause while the time moves; it stops at 17:15, and Play there begins at 06:45. A drag, a key or Pause stops it. While dragged, the time stands over the handle as well as in the pill. "
        "Focused, the handle has the focus ring and the tooltip names the keys, at once by the keyboard and never on touch.",
    )
    return card("The time on every lens", body, gap=14)


def timeline_card() -> str:
    width = 984
    desktop = (
        state("Paused at 16:00, the end of the shade-free window: the window's ends in text-2, the other ticks in text-3", strip(width, 104, f'<div style="flex-grow: 1">{timeline(16.0)}</div>'))
        + state("Playing: Pause in the round button; the time moves a quarter hour every 250 ms and stops at 17:15", strip(width, 104, f'<div style="flex-grow: 1">{timeline(13.5, playing=True)}</div>'))
        + state("Dragged: the handle pressed, its halo on; the time in display follows it, live", strip(width, 104, f'<div style="flex-grow: 1">{timeline(14.25, dragged=True)}</div>'))
        + state("Focused by the keyboard at 12:00: the focus ring on the handle, and the tooltip of the keys over it", strip(width, 140, f'<div style="flex-grow: 1">{timeline(12.0, focus="track")}</div>'))
        + state("Tablet, 834: the same bar over the stage, 20 from its edges; the handle 26, the track 56 high to the touch; the ends of the day stand beside the track, their time over their word, as on the tablet board", strip(834, 104, f'<div style="flex-grow: 1">{timeline(16.0, touch=True)}</div>'))
    )
    side = notes(
        "The timeline stands in the place of the pill in the Sun lens, 20 from the edges of the stage: over the vitals on desktop, at the bottom of the stage on tablet; on phone it is the top of the sheet.",
        "The track runs from sunrise to sunset of the day; the handle takes the quarter hours inside them. The shade-free window, 09:00 to 16:00, is filled in accent; the ticks name sunrise, the window's ends, noon and sunset.",
        "Play moves a quarter hour every 250 ms, about 11 s for the day, up to 17:15 and stops; Play there begins at 06:45. Under reduced motion it moves an hour a second. A drag, a key or Pause stops it. The camera never moves with the time.",
        "Keys, in every lens and not while a field, a slider or a menu has the focus: , and . an hour, [ and ] a day. On the focused timeline the arrows move a quarter hour, Page Up and Page Down an hour, Home and End to the ends.",
        "To a screen reader the track is a slider named Time of day, its value “16:00 solar time”.",
    )
    return card("The timeline of the Sun lens", two_columns(f'<div style="display: flex; flex-direction: column; gap: 14px">{desktop}</div>', side), gap=14)


def day_card() -> str:
    body = (
        '<div style="display: grid; grid-template-columns: 384px 384px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Desktop: 21 December taken, the design day", panel(day_section("21 Dec") + sun_at_section(16.0)))
        + state("Any date taken: a day and a month; 4 February here", panel(day_section("Any date")))
        + state("Tablet, 834: the same in a column of the inspector, 44 high to the touch", panel(day_section("Any date", touch=True), width="100%"))
        + "</div>"
        + notes(
            "The days are those of the hemisphere: 21 December is the winter solstice at Pune, 18.52° N; south of the equator it is 21 June. The line under the choice says which day is the design day, the array's, which the stage shows first.",
            "Any date opens a day and a month: the day is a number field, the month a select of the twelve months. [ and ] move the day by one, in every lens, and the choice becomes Any date. The line says the day of the year and the design day. The timeline's ticks follow the day.",
        )
    )
    return card("The day", body, gap=14)


def low_sun_card() -> str:
    width, height = 984, 520
    view = fit([(0, 0, -6), (90, 40, 0), (90, 0, -6), (0, 40, 3)] + [p for _, p in arc_points("355")], width, height, pad=(0.03, 0.08, 0.03, 0.2))
    marks = {DAYS["355"]["rise"]: ("06:33 sunrise", -58, -16), 12.0: ("12:00", 0, -20)}
    scene = Scene3D(view, "low", "3D view of the roof at 06:45 on 21 December: the sun 2.5° high in the east-south-east, the light faded, the shadows faint and long to the west-north-west", hour=6.75, fade=0.85, marks=marks).html()
    inside = (
        scene
        + title_line("Sun", stage_sub())
        + view_controls()
        + f'<div style="position: absolute; left: 20px; right: 20px; bottom: 20px">{timeline(6.75)}</div>'
    )
    side = (
        panel(sun_at_section(6.75, narrow=True), width="100%")
        + notes(
            "The time stays inside the day: the first quarter hour is 06:45 and the last 17:15, so the sun is always up. The keys, play and a change of the day are held to them.",
            "Below 8° the light fades: the roof darkens and the shadows grow faint, long across the roof. The marker stands low on the arc, at its start. At 17:15 it is the same in the west-south-west.",
        )
    )
    return card("The sun low: 06:45 on 21 December", two_columns(frame_crop(width, height, inside), f'<div style="display: flex; flex-direction: column; gap: 14px">{side}</div>'), gap=14)


def whole_day_card() -> str:
    body = (
        state(
            "A place where the sun stays down: the track runs from 00:00 to 24:00, no sunrise or sunset to name; the window is still filled; there is no light and no marker",
            strip(984, 104, f'<div style="flex-grow: 1">{timeline(12.0, start=0.0, end=24.0, ticks=ticks_whole_day(), words="The sun stays below the horizon all day")}</div>'),
        )
        + state(
            "A place where the sun stays up: the same track; the light follows the time through the night hours",
            strip(984, 104, f'<div style="flex-grow: 1">{timeline(12.0, start=0.0, end=24.0, ticks=ticks_whole_day(), words="The sun stays above the horizon all day")}</div>'),
        )
    )
    side = notes(
        "The engine answers no sunrise and no sunset where the sun does not cross the horizon that day, beyond the polar circles. The timeline then takes the whole day, and its line says why.",
        "“solar time” moves beside the time, so that the line under it can say what holds for the day. The pill of the other lenses says the same in its tooltip and to a screen reader.",
    )
    return card("A day without sunrise or sunset", two_columns(f'<div style="display: flex; flex-direction: column; gap: 14px">{body}</div>', side), gap=14)


def failed_sun_chip(x: int, y: int) -> str:
    return (
        f'<div role="status" style="position: absolute; z-index: 1; left: {x}px; top: {y}px; width: 360px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500">{note(16)}The sun was not updated</div>'
        f'<div style="font-size: 12px; color: {TEXT_2}">The server cannot be reached. Check the connection and try again.</div>'
        f'<div style="display: flex; margin: 2px 0 -4px -10px">{quiet("Try again", 32)}</div></div>'
    )


def failed_card() -> str:
    width, height = 984, 480
    view = fit([(0, 0, -6), (90, 40, 0), (90, 0, -6), (0, 40, 3)], width, height, pad=(0.02, 0.12, 0.02, 0.2))
    scene = Scene3D(view, "fail", "3D view of the roof with the light of 16:00 on 21 December kept; a chip says the sun of 4 February was not updated", hour=16.0, path=False).html()
    inside = (
        scene
        + title_line("Sun", stage_sub("4 February"))
        + view_controls()
        + failed_sun_chip(600, 96)
        + f'<div style="position: absolute; left: 20px; right: 20px; bottom: 20px">{timeline(16.0)}</div>'
    )
    side = notes(
        "The day was changed to 4 February and /sun did not answer. The chip of a failed layout says it: what failed, the API's sentence, Try again. The light, the shadows and the timeline of the last day that came stay; the sun path is away until the day's sun comes.",
        "Try again asks once more; the chip goes when the sun lands, or with Escape. The note is in the notes to review too.",
    )
    return card("A sun that could not be fetched", two_columns(frame_crop(width, height, inside), side), gap=14)


def sun_time_board() -> str:
    width, height = 1440, SUN_TIME_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + pills_card() + timeline_card() + day_card() + low_sun_card() + whole_day_card() + failed_card() + "</div>"
    return (
        HEAD.format(
            title="Time on the stage",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Time on the stage",
            lead="The time of the view on every lens, and the timeline of the Sun lens: paused, playing, dragged, focused by key; the day with Any date; the sun low at the first quarter hour; a day without sunrise or sunset; a sun that could not be fetched. Times are solar time.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Board 2: Sun path and shadow outlines
# --------------------------------------------------------------------------------------------------


def roof_points() -> list[tuple[float, float, float]]:
    return [(0, 0, -6), (90, 0, -6), (90, 40, 0), (0, 40, 3), (0, 0, 1), (90, 0, 1)]


def sun_path_card() -> str:
    width, height = 984, 640
    view = fit(roof_points() + [p for _, p in arc_points("355")], width, height, pad=(0.02, 0.1, 0.02, 0.16))
    scene = Scene3D(view, "big", "3D view of the roof at 16:00 on 21 December: the sun low in the south-west, the arc of the day from the east-south-east over the south to the west-south-west, the shadows to the north-east", marks=MARKS_355).html()
    inside = scene + title_line("Sun", stage_sub()) + view_controls() + f'<div style="position: absolute; left: 20px; right: 20px; bottom: 20px">{timeline(16.0)}</div>'
    main = state("Desktop stage at 16:00 on 21 December, the Sun lens, Shadows: the day's arc, its window thicker, the hour marks, the marker at the time", frame_crop(width, height, inside))
    side = notes(
        f"The arc is the engine's sun of the day, every quarter hour above the horizon, on a dome of {DOME:.1f} m, 1.3 times the roof's radius, about the middle of the roof: a direction of the sun is east cos h sin a, north cos h cos a, up sin h, projected as the roof is.",
        "A line of 2 in the scene's sun; from 09:00 to 16:00, the shade-free window, 5 thick. Hour marks are small chips at sunrise, the window's ends, noon and sunset, placed where the projection puts them. Nothing is drawn below the horizon.",
        "The marker is a disc of sun with a core of sunCore and the sun's glow, at the time; it is never lit or shadowed. It moves with the timeline, the keys and play; the arc follows the day.",
        "At 16:00 the sun stands 18.0° high, 56.6° W of south: low over the south-west corner, its shadows long to the north-east.",
    )
    small_w, small_h = 628, 400
    v1 = fit(roof_points() + [p for _, p in arc_points("355")], small_w, small_h, pad=(0.02, 0.08, 0.02, 0.06))
    morning = Scene3D(v1, "am", "3D view of the roof at 10:30 on 21 December: the sun 42.6° high, 28.5° E of south, the shadows to the north-north-west", hour=10.5, marks={9.0: ("09:00", 0, -18), 12.0: ("12:00", 0, -18), 16.0: ("16:00", 0, -18)}).html()
    v2 = fit(roof_points() + [p for _, p in arc_points("172")], small_w, small_h, pad=(0.02, 0.12, 0.02, 0.05))
    june_marks = {DAYS["172"]["rise"]: ("05:27 sunrise", 0, -18), 9.0: ("09:00", 34, -4), 12.0: ("12:00", 0, -30), 16.0: ("16:00", -34, -4), DAYS["172"]["set"]: ("sunset 18:33", 0, 18)}
    june = Scene3D(v2, "jun", "3D view of the roof at 12:00 on 21 June: the sun 85.1° high, north of the zenith, the arc from the east-north-east to the west-north-west", day="172", hour=12.0, marks=june_marks).html()
    row = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px">'
        + state("10:30 on 21 December: the marker on the morning side of the arc, 42.6° high, 28.5° E of south; shadows short to the north-north-west", frame_crop(small_w, small_h, morning))
        + state("12:00 on 21 June: the arc passes north of the zenith at noon, 85.1° high, since Pune lies at 18.5° N; its shadows fall a little to the south", frame_crop(small_w, small_h, june))
        + "</div>"
    )
    return card("The sun path", two_columns(main, side) + row, gap=16)


def outlines_card() -> str:
    polygons = DATA["shadows"]["355@16.0"]["polygons"]
    w, h = 628, 440
    region = (8.0, 9.0, 42.0, 33.0)
    view = fit([(6, 8, 0), (44, 32, 0), (20, 16, 3)], w, h, pad=(0.02, 0.02, 0.02, 0.02))
    three = Scene3D(view, "ol", "3D view at 16:00 on 21 December, close to the stair room: the engine's shadow outlines dashed in amber over the rendered shadows", outlines=polygons, path=False, vignette=False).html()
    plan_svg, px = plan(w, h, region, "ol", "Plan at 16:00 on 21 December, north up, close to the stair room: the engine's outline of its shadow dashed over the rendered shadow", outlines=polygons)
    cx, cy = px(32.725, 25.085)
    corner = (
        f'<div aria-hidden="true" style="position: absolute; left: {cx - 7:.0f}px; top: {cy - 7:.0f}px; width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; border: 2px solid {ACCENT}"></div>'
        + f'<code style="position: absolute; left: {cx - 10:.0f}px; top: {cy - 36:.0f}px; transform: translateX(-100%); padding: 0 7px; background: {GROUND}; border-radius: 6px; font-size: 11px; line-height: 20px; color: {TEXT_2}; white-space: nowrap; box-shadow: {SHADOW_LABEL}">The engine’s corner · 32.72 m E, 25.09 m N</code>'
    )
    scale = min(w / (region[2] - region[0]), h / (region[3] - region[1]))
    plan_html = plan_svg + corner + scale_bar(scale, 5) + north_mark()
    body = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px">'
        + state("3D, close to the stair room: the outlines dashed in keepOutLine, no fill, lying on the roof surface under the modules; the rendered shadows show inside them", frame_crop(w, h, three))
        + state("Plan, north up, straight down: the stair room's shadow is the engine's polygon; its far corner, of the top corner (25, 20), lies on bare roof 0.32 m north of the modules", frame_crop(w, h, plan_html))
        + "</div>"
        + notes(
            "The outlines are the shadows of the parapet and the obstacles on the roof surface, as the engine calculates them for the day and the time; the rows' own shadows are not among them. Where they and the rendered shadows agree, the view is true: the test holds the stair room's far corner within 0.2 m.",
            "On the modules the rendered shadow is shorter than the outline: the modules stand above the surface the engine's polygons lie on. The outlines are asked when the time rests (a drag let go, a key, a step of play) and stay off at first.",
        )
    )
    return card("Calculated shadow outlines", body, gap=14)


def north_mark() -> str:
    return (
        f'<div aria-label="North up" style="position: absolute; right: 16px; top: 16px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: {CONTROL}; border: 1px solid {LINE}; border-radius: 10px; box-shadow: {SHADOW_RAISED}">'
        f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5 15 9H9z" fill="{ACCENT}"/><path d="M9.5 19v-7l5 7v-7" stroke="{TEXT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
    )


def on_roof_card() -> str:
    w, h = 424, 300
    view = fit(roof_points() + [p for _, p in arc_points("355")], w, h, pad=(0.02, 0.06, 0.02, 0.06))
    off = Scene3D(view, "off", "3D view at 16:00 on 21 December with the sun path off: no arc, no marker, no hour marks", path=False).html()
    plain = Scene3D(view, "thin", "3D view at 16:00 on 21 December with the shade-free window off: the arc of one width", window=False, marks={12.0: ("12:00", 0, -18)}).html()
    body = (
        '<div style="display: grid; grid-template-columns: 384px repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start">'
        + state("The inspector, Shadows: On the roof, as at first", panel(on_the_roof_section((True, True, False))))
        + state("Sun path off: the arc, its marks and the marker go; the light and the shadows stay", frame_crop(w, h, off))
        + state("Shade-free window off: the arc is one width; the timeline keeps its filled window", frame_crop(w, h, plain))
        + "</div>"
        + notes(
            "The three switches are of the view, not of the design (decision 16): Sun path and Shade-free window on, Calculated shadow outlines off, as the stage first opens. Shade-free window depends on Sun path, and is dim while it is off. The time and the switches stay when the lens changes; the outlines go with the Sun lens.",
        )
    )
    return card("On the roof", body, gap=14)


def path_shadows_board() -> str:
    width, height = 1440, PATH_SHADOWS_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + sun_path_card() + outlines_card() + on_roof_card() + "</div>"
    return (
        HEAD.format(
            title="Sun path and shadow outlines",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Sun path and shadow outlines",
            lead="The day's arc of the sun over the roof, its shade-free window thicker, the hour marks and the marker at the time; and the engine's shadows dashed over the rendered ones, in 3D and in the plan, so that the view can be checked.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Board 3: Shade map
# --------------------------------------------------------------------------------------------------


def map_stage(width: int, height: int, tag: str, shade: bool = True, selected: int | None = 422, option: bool = True, legend_state: str = "map", pad=(0.03, 0.14, 0.03, 0.3), callout_at=(46, -60), timeline_on: bool = True, title: bool = True, controls: bool = True) -> str:
    view = fit(roof_points(), width, height, pad=pad)
    label = "3D view of the roof with each module coloured by its near shading over the year: most in the darkest step, lighter ones west and north of the stair room, by the tank and along the parapet" if shade else "3D view of the roof with the modules plain while the shade map waits for the design run"
    scene = Scene3D(view, tag, label, path=False, shade=shade, selected=selected if shade or selected is not None else None).html()
    extra = ""
    if selected is not None:
        m = MODULES[selected]
        cx, cy = module_centre(m)
        x, y = view.px(cx, cy, 1.2)
        extra = module_callout(x, y, selected, option=option, above=-callout_at[1], left_of=callout_at[0])
    bottom = 96 if timeline_on else 20
    inside = (
        scene
        + (title_line("Sun", stage_sub()) if title else "")
        + (view_controls() if controls else "")
        + extra
        + f'<div style="position: absolute; left: 20px; bottom: {bottom}px">{legend(legend_state)}</div>'
        + (f'<div style="position: absolute; left: 20px; right: 20px; bottom: 20px">{timeline(16.0)}</div>' if timeline_on else "")
    )
    return frame_crop(width, height, inside)


def map_tab_card() -> str:
    stage_ = map_stage(984, 700, "tab")
    side = notes(
        f"The glass of each position takes the step of its near shading over the year, from the design run; the frame stays moduleFrame. Five steps of one hue, lighter with the loss, from 0 to 5 %, the next round value over the largest, 3.59 %: {COUNTS[0]} positions in the first step, {COUNTS[1]} in the second, {COUNTS[2]} in the third, {COUNTS[3]} in the fourth, none in the fifth.",
        "The lightest are west and north of the stair room, which shades them in the morning, then by the tank and the AC units. The colour is never alone: the legend says the range, the inspector counts the steps, a selected module says its value.",
        "The callout of a selected module: “Position 423 · row 4”, its near shading over the year and, when the chosen option wires it, its string and the string's shade over the year.",
        "The legend floats 20 from the left, 12 over the timeline. The light and the shadows stay at the time of the timeline; the sun path is off under the map.",
    )
    return card("The Shade map tab", two_columns(state("Desktop stage, the Sun lens, Shade map; position 423 selected", stage_), side), gap=14)


def plan_card() -> str:
    w, h = 872, 470
    region = (-3.0, -3.0, 93.0, 43.0)
    svg, px = plan(w, h, region, "map", "Plan of the shade map, north up: the modules coloured by their near shading over the year, position 298 selected", shade=True, selected=297)
    m = MODULES[297]
    cx, cy = module_centre(m)
    x, y = px(cx, cy)
    scale = min(w / (region[2] - region[0]), h / (region[3] - region[1]))
    inside = svg + module_callout(x, y, 297, above=40, left_of=40) + north_mark() + scale_bar(scale, 10, bottom=14)
    inspector_ = panel(shadows_or_map("Shade map") + map_section() + figures_section("option"))
    left = (
        state("Plan, north up; position 298 selected", frame_crop(w, h, inside))
        + notes(
            "The same map seen straight down. Position 298 is the most shaded of the roof, 3.59 %, west of the stair room at the end of the third row; option A does not use it, and its callout says so.",
            "The inspector of the tab: Shadows and Shade map at its top, then what the map colours and the count of each step, then the figures of the Shadows tab. To a screen reader the steps and their counts are the map's text; the selected module's words are said with its selection.",
        )
    )
    body = (
        f'<div style="display: grid; grid-template-columns: {w}px 384px; gap: 24px; align-items: start">'
        f'<div style="display: flex; flex-direction: column; gap: 14px">{left}</div>'
        + state("The inspector in the Shade map tab, with option A", inspector_)
        + "</div>"
    )
    return card("The plan and the inspector", body, gap=14)


def states_card() -> str:
    w, h = 410, 300
    pad = (0.03, 0.2, 0.03, 0.34)
    computing = map_stage(w, h, "s1", shade=False, selected=None, legend_state="waiting", pad=pad, timeline_on=False, title=False, controls=False)
    newer = map_stage(w, h, "s2", shade=False, selected=None, legend_state="waiting", pad=pad, timeline_on=False, title=False, controls=False)
    none = map_stage(w, h, "s3", shade=True, selected=422, option=False, pad=(0.03, 0.34, 0.03, 0.3), timeline_on=False, title=False, controls=False, callout_at=(30, -40))
    body = (
        '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 25px; align-items: start">'
        + state("The first design run computing: the modules plain; the legend waits with the ring", computing)
        + state("A layout newer than the run: the map of before is not shown, the modules plain; the legend waits", newer)
        + state("No system voltage yet: the map is there; the callout has no string", none)
        + state("The figures, first run: skeletons, and the engine's step", panel(figures_section("first"), width="100%"))
        + state("The figures of before, dimmed with the ring, until the run lands", panel(figures_section("updating"), width="100%"))
        + state("The figures of all positions; electrical shading waits, in the API's words", panel(figures_section("none"), width="100%"))
        + "</div>"
        + notes(
            "The map colours the positions only when the run is of the layout shown: its edit not older than the layout's and the same count of positions (decision 12). Otherwise the modules stay plain, since a map of another layout would colour the wrong modules, and the legend says that the map follows the run.",
            "Without an option there are no strings: near and far shading are of all 790 positions, the electrical figure says what it waits for, and a selected module says its own value only. The system voltage is never chosen for the user.",
        )
    )
    return card("States", body, gap=14)


def phone_card() -> str:
    width = 390
    header = piece(PHONE, "<header", "</header>")
    tabs = piece(PHONE, '<nav aria-label="Workspaces"', "</nav>")
    vitals = piece(PHONE, '<section aria-label="Design vitals"', "</section>")
    controls = piece(PHONE, '<div style="position: absolute; right: 12px; top: 4px;', "</div>\n<button", keep_end=False) + "</div>"
    view = fit(roof_points(), 418, 214, pad=(0.02, 0.06, 0.02, 0.04))
    scene = Scene3D(view, "ph", "3D view of the roof on phone with the shade map: the modules coloured by their near shading over the year", path=False, shade=True).html()
    stage_ = (
        f'<main style="position: relative; height: 252px; flex-shrink: 0; overflow: hidden">'
        f'<div style="position: absolute; left: -14px; top: 30px; width: 418px; height: 214px">{scene}</div>'
        f'<div style="position: absolute; left: 12px; top: 4px">{pill("phone", 16.0)}</div>{controls}'
        f'<div style="position: absolute; left: 12px; bottom: 10px">{legend(small=True)}</div></main>'
    )
    nav = swap_lens(piece(PHONE, '<nav aria-label="Lenses"', "</nav>"), 2)
    inside = (
        '<div style="display: flex; flex-direction: column; gap: 12px; padding: 4px 16px 16px">'
        + shadows_or_map("Shade map", touch=True)
        + section("Shade map", top=4)
        + f'<p style="margin: 0; font-size: 15px; color: {TEXT_2}">Each module is coloured by its near shading over the year, of all {len(MODULES)} positions. Tap a module for its value.</p>'
        + f'<div style="display: flex; flex-direction: column">{step_rows(touch=True)}</div>'
        + "</div>"
    )
    sheet = (
        f'<section aria-label="Inspector" style="flex-shrink: 0; display: flex; flex-direction: column; background: #0E1218; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0; overflow: hidden">'
        f'<div style="display: flex; justify-content: center; padding: 8px 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>{nav}{inside}</section>'
    )
    phone = (
        f'<div style="width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f"{header}{stage_}{vitals}{sheet}{tabs}</div>"
    )
    sel_view = fit([(5, 12, 0), (40, 34, 0), (20, 16, 3)], 390, 252, pad=(0.02, 0.02, 0.02, 0.02))
    m = MODULES[422]
    cx, cy = module_centre(m)
    sx, sy = sel_view.px(cx, cy, 1.2)
    pinched = Scene3D(sel_view, "pp", "3D view on phone pinched in on position 423, selected, with its callout under the pill", path=False, shade=True, selected=422, vignette=False).html()
    pinched_stage = frame_crop(
        390,
        252,
        pinched
        + f'<div style="position: absolute; left: 12px; top: 4px">{pill("phone", 16.0)}</div>'
        + module_callout(sx, sy, 422, above=24, left_of=60, width=250)
        + f'<div style="position: absolute; left: 12px; bottom: 10px">{legend(small=True)}</div>',
        radius=12,
    )
    body = (
        '<div style="display: grid; grid-template-columns: 390px 390px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Phone, 390: the stage of 252 with the pill at the top left, the legend small over its bottom; the sheet open in the Shade map tab, the steps and their counts under the words", phone)
        + state("Pinched in on position 423, selected: the callout stands under the pill and inside the stage, in two lines", pinched_stage)
        + notes(
            "On phone the legend keeps its title and its ends, 0 % and 5 %; the steps and their counts are in the sheet, under the words. The pill says the time; the timeline is the top of the sheet in the Shadows tab.",
            "A tap selects a module; its callout is kept inside the stage, under the pill, and wraps to two lines. The legend is 12 from the left and 10 from the stage's bottom; its chips are not pressed.",
        )
        + "</div>"
    )
    return card("On phone", body, gap=14)


def shade_map_board() -> str:
    width, height = 1440, SHADE_MAP_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + map_tab_card() + plan_card() + states_card() + phone_card() + "</div>"
    return (
        HEAD.format(
            title="Shade map",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Shade map",
            lead="Every position coloured by its near shading over the year, from the design run, in five steps of one hue; the legend on the stage; a selected module's value and its string's; the map waiting for a run; the inspector of the tab; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


if __name__ == "__main__":
    (HERE / "SunTime.dc.html").write_text(sun_time_board(), encoding="utf-8")
    (HERE / "SunPathShadows.dc.html").write_text(path_shadows_board(), encoding="utf-8")
    (HERE / "ShadeMap.dc.html").write_text(shade_map_board(), encoding="utf-8")
    print("SunTime.dc.html, SunPathShadows.dc.html, ShadeMap.dc.html")
