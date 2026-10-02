"""Writes the three boards of the Studio's Sun lens of Phase 6 (plan/phase-06-plan.md, step 0):
SunLens.dc.html, "Studio, Sun lens · desktop 1440"; SunLensTablet.dc.html, "Studio, Sun lens · tablet 834";
and SunLensPhone.dc.html, "Studio, Sun lens · phone 390".

Each shows the demo at 16:00 solar time on 21 December, the Shadows tab open: the 3D roof with its
shadows, the sun's path over the day with the shade-free window thicker and the marker at the time, the
timeline, the vitals and the Sun inspector (Shadows or Shade map, Day, Sun at, Shading over the year,
On the roof). The frames are those of the approved Array boards: the top bar, the rail or the lens row,
the view controls and the vitals are taken from Main.dc.html, StudioTablet.dc.html and
StudioPhone.dc.html as they are; the stage and the inspector are drawn here.

What the engine answered is read from sun_lens_data.json, written from the engine for these boards: the
sun's positions of the day every quarter hour with sunrise and sunset (days["355"]), the shadow polygons
of the parapet and the obstacles on the roof at 16:00 (shadows["355@16.0"]) and the figures of the
shading. The shadows of the module rows and of the obstacles on the modules, which the engine's polygons
do not hold, are cast here with the engine's sun at 16:00, as the renderer casts them. The projection,
the rows and the obstacles are those of build_phase5_roof_boards.py. Every colour is one of
docs/design/design-tokens.md (the 3D palette for the scene).

Run it in this folder: python3 build_phase6_sun_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json
import math

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    CHROME,
    CONTROL_ACTIVE,
    DISPLAY,
    GROUND,
    HERE,
    LINE,
    LINE_SUBTLE,
    MONO,
    NOTE_LINE,
    SHADOW_FLOAT,
    SHADOW_PRIMARY,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    WELL,
    icon,
    section,
)
from build_phase4_boards import SHADOW_LABEL
from build_phase5_roof_boards import (
    AC_UNITS,
    AVAILABLE,
    COLUMN,
    GRID_LINE,
    MODULE_CELL_LINE,
    MODULE_FRAME,
    MODULE_GLASS,
    OBSTACLE_LIT,
    OBSTACLE_SHADE,
    OBSTACLE_TOP,
    PARAPET_CAP,
    PARAPET_LIT,
    PARAPET_SHADE,
    PHONE,
    ROOF,
    ROWS_Y,
    SHADOW,
    STAGE_VIEW,
    STAIR,
    TABLET,
    TANK_AT,
    WALL_EDGE_LIT,
    WALL_EDGE_SHADE,
    WALL_LIT,
    WALL_SHADE,
    A,
    B,
    C,
    D,
    E,
    F,
    ZK,
    View,
    circle_points,
    colx,
    counter_clockwise,
    cylinder,
    frame,
    hull,
    phone_sheet,
    phone_stage,
    piece,
    poly,
    project,
    rect_points,
    row_matrix,
    runs,
    swap_lens,
)

MAIN = (HERE / "Main.dc.html").read_text(encoding="utf-8")
DATA = json.loads((HERE / "sun_lens_data.json").read_text(encoding="utf-8"))

# The 3D palette of design-tokens.md, beside the scene's colours of the Phase 5 builder.
SUN, SUN_CORE = "#FFB020", "#FFD36B"

# Tokens not in the shared builders.
CONTROL_PRESSED = "#10141A"
SHADOW_SEGMENT = "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)"
SHADOW_TRACK = "inset 0 1px 3px rgba(0,0,0,0.45)"
SHADOW_KNOB = "0 1px 3px rgba(0,0,0,0.5)"
SHADOW_HANDLE = "0 2px 6px rgba(0,0,0,0.6)"

PLAY = '<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="#1A1204" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>'
SUN_GLYPH = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'

# --------------------------------------------------------------------------------------------------
# What the engine answered
# --------------------------------------------------------------------------------------------------

DAY = DATA["days"]["355"]
SUNRISE, SUNSET = DAY["sunrise_h"], DAY["sunset_h"]
AT = DATA["shadows"]["355@16.0"]
ELEVATION, AZIMUTH = AT["elevation_deg"], AT["azimuth_deg"]
WINDOW = tuple(DATA["figures"]["window"])
FIGURES = DATA["figures"]
OPTION = FIGURES["option"]

# Where a shadow falls per metre of height at 16:00: away from the sun, cot(elevation) long.
_LONG = 1 / math.tan(math.radians(ELEVATION))
SHIFT = (-_LONG * math.sin(math.radians(AZIMUTH)), -_LONG * math.cos(math.radians(AZIMUTH)))
TOWARD_SUN = (math.sin(math.radians(AZIMUTH)), math.cos(math.radians(AZIMUTH)))

# The sun path: the day's positions on a dome of 1.3 times the roof's radius about its centroid.
CENTROID, RADIUS = (45.0, 20.0), 49.24
DOME = 1.3 * RADIUS

TAN_TILT = math.tan(math.radians(15))
TABLE_DEPTH, TABLE_RISE = 4.418, 1.184  # two modules in tilt at 15°: across and up
CLEARANCE = 0.5


def clock(hour: float) -> str:
    minutes = round(hour * 60)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def bearing_words(azimuth: float) -> tuple[str, str]:
    """The bearing from the nearer of south and north, as the read-out says it (decision 3)."""
    if 90 <= azimuth <= 270:
        off = azimuth - 180
        return f"{abs(off):.1f}", "° W of south" if off > 0 else "° E of south"
    off = (azimuth + 180) % 360 - 180
    return f"{abs(off):.1f}", "° E of north" if off > 0 else "° W of north"


HEIGHT_WORDS = f"{ELEVATION:.1f}"
BEARING_VALUE, BEARING_UNIT = bearing_words(AZIMUTH)


def on_dome(elevation: float, azimuth: float) -> tuple[float, float, float]:
    e, a = math.radians(elevation), math.radians(azimuth)
    return (
        CENTROID[0] + DOME * math.cos(e) * math.sin(a),
        CENTROID[1] + DOME * math.cos(e) * math.cos(a),
        DOME * math.sin(e),
    )


def day_path() -> list[tuple[float, float, float, float]]:
    """The positions above the horizon as (hour, x, y, z), with the horizon at sunrise and sunset."""
    positions = DAY["positions"]
    out = []
    for (h0, e0, a0), (h1, e1, a1) in zip(positions, positions[1:]):
        if e0 > 0:
            out.append((h0, *on_dome(e0, a0)))
        if (e0 <= 0) != (e1 <= 0):
            t = -e0 / (e1 - e0)
            out.append((h0 + t * (h1 - h0), *on_dome(0.0, a0 + t * (a1 - a0))))
    return out


def point_of(hour: float) -> tuple[float, float, float]:
    """The point of the path at an hour of it: a quarter hour, or sunrise or sunset on the horizon."""
    h, x, y, z = min(day_path(), key=lambda p: abs(p[0] - hour))
    if abs(h - hour) > 0.02:
        raise ValueError(f"no point at {hour}")
    return x, y, z


# The hour marks of the path board (build_phase6_state_boards.py): the words and where the chip stands from its mark.
MARKS = [
    (SUNRISE, f"{clock(SUNRISE)} sunrise", -50, -16),
    (WINDOW[0], clock(WINDOW[0]), 0, -20),
    (12.0, "12:00", 0, -20),
    (WINDOW[1], clock(WINDOW[1]), 36, -14),
    (SUNSET, f"sunset {clock(SUNSET)}", 0, 18),
]


# --------------------------------------------------------------------------------------------------
# The scene at 16:00
# --------------------------------------------------------------------------------------------------


def cast(points: list[tuple[float, float]], height: float) -> list[tuple[float, float]]:
    return hull(points + [(x + SHIFT[0] * height, y + SHIFT[1] * height) for x, y in points])


def ring_path(ring: list[list[float]]) -> str:
    return "M " + " L ".join(f"{x:.3f} {y:.3f}" for x, y in ring) + " Z"


def engine_shadows() -> str:
    """The engine's polygons, exterior and holes, on the roof in its metres."""
    return "".join(
        f'<path fill-rule="evenodd" d="{ring_path(p["exterior"])}' + "".join(" " + ring_path(h) for h in p["holes"]) + '"/>'
        for p in AT["polygons"]
    )


def row_shadows() -> str:
    """The shadow of each table on the roof: its lower edge at the clearance, its upper edge 1.184 m higher."""
    out = []
    for index, ry in enumerate(ROWS_Y):
        m = f"matrix(1 0 {TABLE_RISE * SHIFT[0]:.3f} {TABLE_DEPTH + TABLE_RISE * SHIFT[1]:.3f} {CLEARANCE * SHIFT[0]:.3f} {ry + CLEARANCE * SHIFT[1]:.3f})"
        out.append(f'<g transform="{m}">' + "".join(f'<rect x="{colx(a):.3f}" width="{(b - a + 1) * COLUMN - 0.02:.3f}" height="1"/>' for a, b in runs(AVAILABLE[index])) + "</g>")
    return "".join(out)


def onto_row(x: float, y: float, z: float, y0: float) -> tuple[float, float]:
    """A point of a caster carried away from the sun onto the plane of the table of the row at y0, in
    the table's own coordinates: along the row and up its slope."""
    t = (z - CLEARANCE - TAN_TILT * (y - y0)) / (1 + TAN_TILT * SHIFT[1])
    qy = y + SHIFT[1] * t
    return x + SHIFT[0] * t, (qy - y0) / math.cos(math.radians(15))


CASTERS = (
    [(rect_points(*STAIR[:4]), STAIR[4])]
    + [(circle_points(TANK_AT[0], TANK_AT[1], TANK_AT[2]), TANK_AT[3])]
    + [(rect_points(x0, y0, x1, y1), h) for x0, y0, x1, y1, h in AC_UNITS]
)


def shadow_on_table(index: int) -> str:
    """The shadows the obstacles throw on the modules of a row, clipped to the modules."""
    y0 = ROWS_Y[index]
    parts = []
    for footprint, h in CASTERS:
        points = [onto_row(x, y, h, y0) for x, y in footprint] + [(x, (y - y0) / math.cos(math.radians(15))) for x, y in footprint]
        parts.append(poly(hull(points)))
    return "".join(parts)


def module_row(index: int, tag: str) -> str:
    rects = "".join(f'<rect x="{colx(a):.3f}" width="{(b - a + 1) * COLUMN - 0.02:.3f}" height="4.574"/>' for a, b in runs(AVAILABLE[index]))
    shade = shadow_on_table(index)
    clip = f'<clipPath id="t{index}-{tag}">{rects}</clipPath>' if shade else ""
    over = f'<g clip-path="url(#t{index}-{tag})" fill="{SHADOW}" opacity="0.36">{shade}</g>' if shade else ""
    return f'<g transform="{row_matrix(ROWS_Y[index])}">{clip}<g fill="url(#mod-{tag})">{rects}</g>{over}</g>'


def prism(footprint: list[tuple[float, float]], z0: float, z1: float) -> str:
    """A box from its footprint, lit by the sun of 16:00: a face that looks at the sun more than 0.7 is lit."""
    faces = []
    n = len(footprint)
    for i in range(n):
        (ax, ay), (bx, by) = footprint[i], footprint[(i + 1) % n]
        normal = (by - ay, -(bx - ax))
        length = math.hypot(*normal) or 1.0
        normal = (normal[0] / length, normal[1] / length)
        if normal[0] * -1.0 + normal[1] * -2.142 <= 0:
            continue
        colour = OBSTACLE_LIT if normal[0] * TOWARD_SUN[0] + normal[1] * TOWARD_SUN[1] > 0.7 else OBSTACLE_SHADE
        depth = 2.187 * (ax + bx) + 4.68 * (ay + by)
        faces.append((depth, poly([project(ax, ay, z0), project(bx, by, z0), project(bx, by, z1), project(ax, ay, z1)], f' fill="{colour}"')))
    faces.sort(key=lambda f: -f[0])
    return "".join(f for _, f in faces) + poly([project(x, y, z1) for x, y in footprint], f' fill="{OBSTACLE_TOP}"')


def scene(view: View, tag: str, label: str) -> str:
    """The 3D roof of the demo at 16:00 on 21 December: the ground and the building's shadow on it, the
    roof, its parapet lit from the west, the engine's shadows, the rows' shadows, the rows and the
    obstacles back to front, the walls."""
    bx, by, bw, bh = view.box
    o = [f'<svg viewBox="{bx} {by} {bw} {bh}" width="{view.width}" height="{view.height}" style="position: absolute; left: 0; top: 0" role="img" aria-label="{label}">']
    o.append(
        "<defs>"
        f'<pattern id="mod-{tag}" patternUnits="userSpaceOnUse" width="1.153" height="2.297"><rect width="1.133" height="2.277" fill="{MODULE_GLASS}"/>'
        f'<rect y="1.118" width="1.133" height="0.04" fill="{MODULE_CELL_LINE}"/><rect width="1.133" height="0.06" fill="{MODULE_FRAME}"/></pattern>'
        f'<pattern id="grid-{tag}" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M 10 0 L 0 0 L 0 10" fill="none" stroke="{GRID_LINE}" stroke-width="0.12"/></pattern>'
        f'<clipPath id="roof-{tag}"><rect width="90" height="40"/></clipPath>'
        f'<radialGradient id="fade-{tag}" cx="50%" cy="52%" r="62%"><stop offset="55%" stop-color="{GROUND}" stop-opacity="0"/><stop offset="100%" stop-color="{GROUND}" stop-opacity="1"/></radialGradient>'
        "</defs>"
    )
    o.append(
        f'<g transform="matrix({A} {B} {C} {D} {E} {F + 6 * ZK:.2f})"><rect x="-60" y="-40" width="220" height="140" fill="url(#grid-{tag})"/>'
        + poly(cast(rect_points(0, 0, 90, 40), 6.9), ' fill="#05070A" opacity="0.7"')
        + "</g>"
    )
    o.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="url(#fade-{tag})"/>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F})"><rect width="90" height="40" fill="{ROOF}"/><rect x="1" y="1" width="88" height="38" fill="none" stroke="{PARAPET_SHADE}" stroke-width="0.08" stroke-dasharray="0.5 0.4"/></g>')
    # The inner faces of the far parapets: the east one looks west, at the afternoon sun.
    o.append(f'<g transform="matrix({A} {B} 0 -{ZK} {E + C * 40:.2f} {F + D * 40:.2f})"><rect width="90" height="0.9" fill="{PARAPET_SHADE}"/></g>')
    o.append(f'<g transform="matrix({C} {D} 0 -{ZK} {E + A * 90:.2f} {F + B * 90:.2f})"><rect width="40" height="0.9" fill="{PARAPET_LIT}"/></g>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F - ZK * 0.9:.2f})" fill="{PARAPET_CAP}"><rect y="39.8" width="90" height="0.2"/><rect x="89.8" width="0.2" height="40"/></g>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F})"><g opacity="0.36" fill="{SHADOW}" clip-path="url(#roof-{tag})">{engine_shadows()}{row_shadows()}</g></g>')
    cx, cy, r, th = TANK_AT
    o.append(module_row(5, tag) + module_row(4, tag))
    o.append(cylinder(cx, cy, r, 0.0, th, OBSTACLE_TOP, OBSTACLE_LIT))
    o.append(module_row(3, tag))
    o.append(prism(rect_points(*STAIR[:4]), 0.0, STAIR[4]))
    o.append(module_row(2, tag) + module_row(1, tag))
    for ax0, ay0, ax1, ay1, ah in AC_UNITS:
        o.append(prism(counter_clockwise(rect_points(ax0, ay0, ax1, ay1)), 0.0, ah))
    o.append(module_row(0, tag))
    # The walls: the west one lit, the south one turned from the sun.
    o.append(f'<g transform="matrix({A} {B} 0 -{ZK} {E} {F})"><rect y="-6" width="90" height="6.9" fill="{WALL_SHADE}"/><rect y="-6" width="90" height="0.4" fill="{WALL_EDGE_SHADE}"/></g>')
    o.append(f'<g transform="matrix({C} {D} 0 -{ZK} {E} {F})"><rect y="-6" width="40" height="6.9" fill="{WALL_LIT}"/><rect y="-6" width="40" height="0.4" fill="{WALL_EDGE_LIT}"/></g>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F - ZK * 0.9:.2f})" fill="{PARAPET_CAP}"><rect width="90" height="0.2"/><rect width="0.2" height="40"/></g>')
    o.append("</svg>")
    return "".join(o)


# --------------------------------------------------------------------------------------------------
# Over the scene: the sun path, its hour marks, the marker and its callout, in pixels of the stage
# --------------------------------------------------------------------------------------------------


class Stage:
    """The scene's view placed in the stage at (left, top): a point of roof metres in stage pixels."""

    def __init__(self, view: View, left: float, top: float, width: int, height: int):
        self.view, self.left, self.top, self.width, self.height = view, left, top, width, height

    def px(self, x: float, y: float, z: float = 0.0) -> tuple[float, float]:
        vx, vy = self.view.px(x, y, z)
        return self.left + vx, self.top + vy


def sun_path(stage: Stage, thin: float, thick: float, marker: float, marks: list[float]) -> str:
    path = day_path()

    def line(points: list[tuple[float, float, float, float]]) -> str:
        return "M " + " L ".join("{:.1f} {:.1f}".format(*stage.px(x, y, z)) for _, x, y, z in points)

    inside = [p for p in path if WINDOW[0] - 1e-6 <= p[0] <= WINDOW[1] + 1e-6]
    mx, my = stage.px(*on_dome(ELEVATION, AZIMUTH))
    halo = marker * 2.6
    o = [
        f'<svg width="{stage.width}" height="{stage.height}" viewBox="0 0 {stage.width} {stage.height}" style="position: absolute; left: 0; top: 0; pointer-events: none" aria-hidden="true">',
        f'<defs><radialGradient id="glow-{stage.width}"><stop offset="0%" stop-color="{SUN}" stop-opacity="0.45"/><stop offset="100%" stop-color="{SUN}" stop-opacity="0"/></radialGradient></defs>',
        f'<path d="{line(path)}" fill="none" stroke="{SUN}" stroke-width="{thin}" stroke-linecap="round" stroke-linejoin="round"/>',
        f'<path d="{line(inside)}" fill="none" stroke="{SUN}" stroke-width="{thick}" stroke-linecap="round" stroke-linejoin="round"/>',
    ]
    for hour in marks:
        hx, hy = stage.px(*point_of(hour))
        o.append(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="4" fill="{GROUND}" stroke="{SUN}" stroke-width="2"/>')
    o.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="{halo:.1f}" fill="url(#glow-{stage.width})"/>')
    o.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="{marker}" fill="{SUN}"/>')
    o.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="{marker * 0.5:.1f}" fill="{SUN_CORE}"/>')
    o.append("</svg>")
    return "".join(o)


def shown_marks(stage: Stage, bottom: float) -> list[tuple[float, str, float, float]]:
    """The marks whose chips fall inside the stage, above what floats at its bottom; the marker's hour
    has its callout instead of a chip."""
    out = []
    for hour, words, dx, dy in MARKS:
        if abs(hour - 16.0) < 1e-6:
            continue
        x, y = stage.px(*point_of(hour))
        if 0 <= x + dx <= stage.width and 0 <= y + dy <= bottom:
            out.append((hour, words, dx, dy))
    return out


def hour_chip(stage: Stage, mark: tuple[float, str, float, float]) -> str:
    """An hour on the arc: a chip beside its mark, in the look of the path board (the stage's dimension labels)."""
    hour, words, dx, dy = mark
    x, y = stage.px(*point_of(hour))
    return (
        f'<code style="position: absolute; left: {x + dx:.0f}px; top: {y + dy:.0f}px; transform: translate(-50%, -50%); padding: 0 7px; background: {GROUND}; border-radius: 6px; '
        f'font-size: 11px; line-height: 20px; color: {TEXT_2}; white-space: nowrap; box-shadow: {SHADOW_LABEL}">{words}</code>'
    )


def sun_callout(stage: Stage, marker: float, gap: int = 26) -> str:
    """The callout of the marker: to its right, joined to the disc by a 1 px line."""
    x, y = stage.px(*on_dome(ELEVATION, AZIMUTH))
    left = x + marker + gap
    return (
        f'<div aria-hidden="true" style="position: absolute; left: {x + marker:.0f}px; top: {y:.0f}px; width: {gap}px; height: 1px; background: {ACCENT}"></div>'
        f'<div style="position: absolute; left: {left:.0f}px; top: {y - 31:.0f}px; display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500">{icon(SUN_GLYPH, 16, ACCENT)}{clock(16)} · end of the shade-free window</div>'
        f'<div style="font-size: 12px; color: {TEXT_2}">Sun {HEIGHT_WORDS}° high, {BEARING_VALUE}{BEARING_UNIT}</div></div>'
    )


# --------------------------------------------------------------------------------------------------
# The timeline
# --------------------------------------------------------------------------------------------------


def at(hour: float, handle: int) -> str:
    """Where an hour stands on the track: the middle of the handle stays half a handle from its ends."""
    p = (hour - SUNRISE) / (SUNSET - SUNRISE)
    return f"calc({handle / 2}px + {p:.4f} * (100% - {handle}px))"


def play_button(side: int = 44, glyph: int = 14) -> str:
    return (
        f'<button aria-label="Play the day" style="width: {side}px; height: {side}px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; '
        f'background: {ACCENT}; border: 0; border-radius: 50%; cursor: pointer; box-shadow: {SHADOW_PRIMARY}">{PLAY.format(size=glyph)}</button>'
    )


def time_block() -> str:
    return (
        '<div style="display: flex; flex-direction: column; flex-shrink: 0">'
        f'<span style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">{clock(16)}</span>'
        f'<span style="font-size: 12px; line-height: 16px; color: {TEXT_2}">solar time</span></div>'
    )


def track(touch: bool, ticks: list[tuple[float, str, str]], height: int, track_top: int, tick_top: int) -> str:
    """The slider of the time: the track from sunrise to sunset, the window filled, the handle at 16:00,
    the ticks under it. A tick is (hour, words, where its words stand: start, middle or end)."""
    handle, border = (26, 4) if touch else (18, 3)
    lo, hi = WINDOW
    fill_left, fill_right = at(lo, handle), at(hi, handle)
    marks = ""
    for hour, words, anchor in ticks:
        colour = TEXT_2 if hour in WINDOW else TEXT_3
        if anchor == "start":
            place = "left: 0"
        elif anchor == "end":
            place = "right: 0"
        else:
            place = f"left: {at(hour, handle)}; transform: translateX(-50%)"
        marks += f'<span style="position: absolute; {place}; top: {tick_top}px; {MONO}; font-size: 11px; line-height: 16px; color: {colour}; white-space: nowrap">{words}</span>'
    return (
        f'<div role="slider" aria-label="Time of day" aria-valuemin="{SUNRISE:.2f}" aria-valuemax="{SUNSET:.2f}" aria-valuenow="16" aria-valuetext="16:00 solar time" tabindex="0" '
        f'style="position: relative; flex-grow: 1; min-width: 0; height: {height}px; cursor: pointer">'
        f'<div style="position: absolute; left: 0; right: 0; top: {track_top - 2}px; height: 4px; border-radius: 2px; background: {LINE}"></div>'
        f'<div style="position: absolute; left: {fill_left}; width: calc({fill_right} - {fill_left}); top: {track_top - 2}px; height: 4px; border-radius: 2px; background: {ACCENT}"></div>'
        f'<div style="position: absolute; left: calc({at(16, handle)} - {handle / 2}px); top: {track_top - handle / 2}px; width: {handle}px; height: {handle}px; box-sizing: border-box; '
        f'border-radius: 50%; background: {TEXT}; border: {border}px solid {ACCENT}; box-shadow: {SHADOW_HANDLE}"></div>'
        f"{marks}</div>"
    )


def end_label(hour: float, words: str, align: str) -> str:
    """The time of an end of the day beside the track, level with it, its word level with the ticks (tablet)."""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 9px; height: 56px; box-sizing: border-box; padding-top: 12px; flex-shrink: 0; align-items: {align}">'
        f'<span style="{MONO}; font-size: 12px; line-height: 16px; color: {TEXT_2}">{clock(hour)}</span>'
        f'<span style="font-size: 11px; line-height: 16px; color: {TEXT_3}">{words}</span></div>'
    )


DESKTOP_TICKS = [
    (SUNRISE, f"{clock(SUNRISE)} sunrise", "start"),
    (WINDOW[0], clock(WINDOW[0]), "middle"),
    (12.0, "12:00", "middle"),
    (WINDOW[1], clock(WINDOW[1]), "middle"),
    (SUNSET, f"sunset {clock(SUNSET)}", "end"),
]


def timeline_desktop() -> str:
    return (
        f'<div aria-label="Time" role="group" style="position: absolute; z-index: 10; left: 20px; right: 20px; bottom: 114px; display: flex; align-items: center; gap: 16px; height: 64px; '
        f'box-sizing: border-box; padding: 0 20px 0 10px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px; box-shadow: {SHADOW_FLOAT}">'
        + play_button()
        + time_block()
        + track(False, DESKTOP_TICKS, 44, 14, 26)
        + "</div>"
    )


def timeline_tablet() -> str:
    ticks = [(WINDOW[0], clock(WINDOW[0]), "middle"), (12.0, "12:00", "middle"), (WINDOW[1], clock(WINDOW[1]), "middle")]
    return (
        f'<div aria-label="Time" role="group" style="position: absolute; z-index: 10; left: 20px; right: 20px; bottom: 16px; display: flex; align-items: center; gap: 14px; height: 64px; '
        f'box-sizing: border-box; padding: 0 18px 0 10px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px; box-shadow: {SHADOW_FLOAT}">'
        + play_button()
        + time_block()
        + f'<div style="width: 1px; height: 36px; background: {LINE}; flex-shrink: 0"></div>'
        + end_label(SUNRISE, "sunrise", "flex-start")
        + track(True, ticks, 56, 20, 37)
        + end_label(SUNSET, "sunset", "flex-end")
        + "</div>"
    )


def timeline_phone() -> str:
    """At the top of the sheet: play, the time and the window's words on one line, the track under it."""
    ticks = [(SUNRISE, f"{clock(SUNRISE)} sunrise", "start"), (12.0, "12:00", "middle"), (SUNSET, f"sunset {clock(SUNSET)}", "end")]
    window = (
        '<div style="margin-left: auto; display: flex; align-items: center; gap: 8px">'
        f'<span aria-hidden="true" style="width: 16px; height: 4px; border-radius: 2px; background: {ACCENT}"></span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">Shade-free <code style="font-size: 12px; color: {TEXT}">{clock(WINDOW[0])} – {clock(WINDOW[1])}</code></span></div>'
    )
    return (
        f'<div aria-label="Time" role="group" style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0 10px; border-bottom: 1px solid {LINE_SUBTLE}">'
        '<div style="display: flex; align-items: center; gap: 12px">'
        + play_button()
        + time_block()
        + window
        + "</div>"
        + track(True, ticks, 60, 22, 40)
        + "</div>"
    )


# --------------------------------------------------------------------------------------------------
# The inspector
# --------------------------------------------------------------------------------------------------


def segmented(items: list[str], active: str, label: str, touch: bool, height: int = 34, size: int = 13) -> str:
    """A segmented control whose choices share its width."""
    item_height = 44 if touch else height
    radius, seg_radius = (12, 9) if touch else (10, 7)
    font = 14 if touch else size
    buttons = ""
    for item in items:
        if item == active:
            buttons += (
                f'<button role="radio" aria-checked="true" style="height: {item_height}px; padding: 0 8px; background: {CONTROL_ACTIVE}; border: 0; border-radius: {seg_radius}px; '
                f'font-size: {font}px; font-weight: 500; white-space: nowrap; cursor: pointer; box-shadow: {SHADOW_SEGMENT}">{item}</button>'
            )
        else:
            buttons += (
                f'<button role="radio" aria-checked="false" style="height: {item_height}px; padding: 0 8px; background: transparent; border: 0; border-radius: {seg_radius}px; '
                f'color: {TEXT_2}; font-size: {font}px; white-space: nowrap; cursor: pointer">{item}</button>'
            )
    return (
        f'<div role="radiogroup" aria-label="{label}" style="display: grid; grid-template-columns: repeat({len(items)}, minmax(0, 1fr)); gap: 2px; padding: 3px; '
        f'background: {WELL}; border: 1px solid {LINE}; border-radius: {radius}px; box-shadow: {SHADOW_WELL}">{buttons}</div>'
    )


def tile(label: str, value: str, unit: str) -> str:
    """A stat tile: flat, surface-2, its label over its value in mono with the unit."""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; background: {SURFACE_2}; border-radius: 12px; min-width: 0">'
        f'<span style="font-size: 12px; color: {TEXT_2}; white-space: nowrap">{label}</span>'
        f'<span style="{MONO}; font-weight: 500; font-size: 16px; white-space: nowrap">{value} <span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 12px; color: {TEXT_2}">{unit}</span></span></div>'
    )


def tiles(*cells: str) -> str:
    return f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{"".join(cells)}</div>'


def caption(words: str, colour: str = TEXT_3) -> str:
    return f'<p style="margin: 0; font-size: 12px; line-height: 18px; color: {colour}">{words}</p>'


def switch(on: bool, label: str, touch: bool) -> str:
    if touch:
        knob, track_w, track_h = 24, 52, 30
        return (
            f'<button role="switch" aria-checked="{"true" if on else "false"}" aria-label="{label}" style="width: 52px; height: 44px; flex-shrink: 0; padding: 7px 0; display: flex; align-items: center; background: transparent; border: 0; cursor: pointer">'
            f'<span style="width: {track_w}px; height: {track_h}px; box-sizing: border-box; padding: 3px; display: flex; justify-content: {"flex-end" if on else "flex-start"}; '
            f'background: {ACCENT if on else "#2F3847"}; border-radius: 15px; box-shadow: {SHADOW_TRACK}"><span style="width: {knob}px; height: {knob}px; border-radius: 50%; '
            f'background: {ACCENT_INK if on else TEXT_2}; box-shadow: {SHADOW_KNOB}"></span></span></button>'
        )
    return (
        f'<button role="switch" aria-checked="{"true" if on else "false"}" aria-label="{label}" style="width: 44px; height: 26px; flex-shrink: 0; padding: 3px; display: flex; '
        f'justify-content: {"flex-end" if on else "flex-start"}; background: {ACCENT if on else "#2F3847"}; border: 0; border-radius: 13px; cursor: pointer; box-shadow: {SHADOW_TRACK}">'
        f'<span style="width: 20px; height: 20px; border-radius: 50%; background: {ACCENT_INK if on else TEXT_2}; box-shadow: {SHADOW_KNOB}"></span></button>'
    )


ON_THE_ROOF = [
    ("Sun path", "The arc the sun follows on this day", True),
    ("Shade-free window", f"Thick part of the arc, {clock(WINDOW[0])} to {clock(WINDOW[1])}", True),
    ("Calculated shadow outlines", "The engine’s shadows, drawn over what you see", False),
]


def switch_row(title: str, hint: str, on: bool, touch: bool, rule: bool = False) -> str:
    height = 64 if rule else (48 if touch else 44)
    under = f"border-bottom: 1px solid {LINE_SUBTLE}; " if rule else ""
    return (
        f'<div style="display: flex; align-items: center; gap: 12px; min-height: {height}px; {under}">'
        f'<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span>{title}</span>'
        f'<span style="font-size: 12px; line-height: 16px; color: {TEXT_3}">{hint}</span></div>{switch(on, title, touch)}</div>'
    )


def block(title: str, body: str, gap: int = 10) -> str:
    return f'<section style="display: flex; flex-direction: column; gap: {gap}px">{section(title)}{body}</section>'


def view_tabs(touch: bool) -> str:
    return segmented(["Shadows", "Shade map"], "Shadows", "What the stage shows", touch, height=36, size=14)


def day_block(touch: bool) -> str:
    return block(
        "Day",
        segmented(["21 Dec", "21 Mar", "21 Jun", "Any date"], "21 Dec", "Day", touch, height=34)
        + caption("21 December is the design day: the winter solstice for this hemisphere"),
    )


def sun_at_block() -> str:
    return block(f"Sun at {clock(16)}", tiles(tile("Height", HEIGHT_WORDS, "°"), tile("Bearing", BEARING_VALUE, BEARING_UNIT)))


def shading_block() -> str:
    pct = lambda v: f"{abs(v):.2f}"  # noqa: E731
    return block(
        "Shading over the year",
        tiles(
            tile("Near, linear", pct(OPTION["near_pct"]), "%"),
            tile("Electrical, beyond linear", pct(OPTION["electrical_pct"]), "%"),
            tile("Far, horizon", pct(OPTION["far_pct"]), "%"),
            tile("Kept clear", f"{FIGURES['keepout_area_m2']:.0f}", "m²"),
        )
        + '<div style="display: flex; flex-direction: column; gap: 2px">'
        + caption(f"Of the {OPTION['modules']} modules of option {OPTION['letter']}", TEXT_2)
        + caption(FIGURES["far_shading_note"])
        + "</div>",
    )


def roof_block(touch: bool, rows: bool = False) -> str:
    body = "".join(switch_row(t, h, on, touch, rule=rows and n < 2) for n, (t, h, on) in enumerate(ON_THE_ROOF))
    return block("On the roof", f'<div style="display: flex; flex-direction: column; gap: {0 if rows else 4}px">{body}</div>', gap=6 if rows else 8)


# --------------------------------------------------------------------------------------------------
# Board 1: desktop, 1440 by 900
# --------------------------------------------------------------------------------------------------

SCENE_LABEL = (
    "3D view of the Pune demo roof at 16:00 solar time on 21 December: long shadows to the north-east, "
    "and the sun low in the south-west at the end of its path across the sky"
)


def stage_line() -> str:
    return f"21 December · winter solstice · shade-free from {clock(WINDOW[0])} to {clock(WINDOW[1])}"


def desktop_board() -> str:
    width, height = 1440, 900
    header = piece(MAIN, "<header", "</header>")
    rail = swap_lens(piece(MAIN, '<nav aria-label="Lenses"', "</nav>"), 2)
    a = MAIN.index('<div style="position: absolute; right: 20px; top: 20px;')
    controls = MAIN[a : MAIN.index('<div style="position: absolute; left: 10px; top: 104px', a)].replace("position: absolute;", "position: absolute; z-index: 1;", 1)
    vitals = piece(MAIN, '<section aria-label="Design vitals"', "</section>").replace("position: absolute;", "position: absolute; z-index: 10;", 1)
    view = View(STAGE_VIEW, 964, 492)
    stage = Stage(view, 10, 104, 984, 844)
    title = (
        '<div style="position: absolute; z-index: 1; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px">'
        f'<div style="{DISPLAY}; font-size: 26px; line-height: 32px; letter-spacing: -0.02em">Sun</div>'
        f'<div style="color: {TEXT_2}; font-size: 13px">{stage_line()}</div></div>'
    )
    main = (
        f'<main style="flex-grow: 1; position: relative; min-width: 0; background: {GROUND}">\n'
        f'<div style="position: absolute; left: 10px; top: 104px; width: {view.width}px; height: {view.height}px">{scene(view, "d", SCENE_LABEL)}</div>\n'
        + sun_path(stage, 2, 5, 10, [m[0] for m in shown_marks(stage, 844 - 114 - 64)])
        + "".join(hour_chip(stage, m) for m in shown_marks(stage, 844 - 114 - 64))
        + sun_callout(stage, 10)
        + "\n"
        + title
        + "\n"
        + controls
        + timeline_desktop()
        + "\n"
        + vitals
        + "\n</main>"
    )
    inspector = (
        f'<aside aria-label="Sun inspector" style="width: 384px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 22px; padding: 20px; '
        f'background: {CHROME}; border-left: 1px solid {LINE_SUBTLE}; overflow: hidden">\n'
        + view_tabs(False)
        + day_block(False)
        + sun_at_block()
        + shading_block()
        + roof_block(False)
        + "\n</aside>"
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">\n'
        f'{header}\n<div style="flex-grow: 1; display: flex; min-height: 0">\n{rail}\n{main}\n{inspector}\n</div>\n</div>'
    )
    return frame("Studio, Sun lens, desktop", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 2: tablet, 834 by 1194
# --------------------------------------------------------------------------------------------------


def tablet_board() -> str:
    width, height = 834, 1194
    header = piece(TABLET, "<header", "</header>")
    controls = swap_lens(piece(TABLET, '<nav aria-label="Lenses"', "</nav>"), 2) + piece(TABLET, '<div style="position: absolute; right: 20px; top: 16px;', "</div>")
    vitals = piece(TABLET, '<section aria-label="Design vitals"', "</section>")
    view = View(STAGE_VIEW, 818, 418)
    stage = Stage(view, 8, 60, 834, 508)
    title = (
        '<div style="position: absolute; z-index: 1; left: 20px; top: 84px; display: flex; flex-direction: column; gap: 2px">'
        f'<div style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Sun</div>'
        f'<div style="color: {TEXT_2}; font-size: 13px">{stage_line()}</div></div>'
    )
    main = (
        f'<main style="position: relative; height: 508px; flex-shrink: 0; background: {GROUND}">'
        f'<div style="position: absolute; left: 8px; top: 60px; width: {view.width}px; height: {view.height}px">{scene(view, "t", SCENE_LABEL)}</div>'
        + sun_path(stage, 2, 5, 10, [m[0] for m in shown_marks(stage, 508 - 16 - 64)])
        + "".join(hour_chip(stage, m) for m in shown_marks(stage, 508 - 16 - 64))
        + sun_callout(stage, 10, gap=22)
        + controls
        + title
        + timeline_tablet()
        + "</main>"
    )
    inspector = (
        '<div aria-label="Sun inspector" style="flex-grow: 1; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; padding: 24px 20px 20px; overflow: hidden">'
        '<div style="display: flex; flex-direction: column; gap: 22px">' + view_tabs(True) + day_block(True) + sun_at_block() + "</div>"
        '<div style="display: flex; flex-direction: column; gap: 22px">' + shading_block() + roof_block(True) + "</div></div>"
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">'
        f"\n{header}\n{main}\n{vitals}\n{inspector}\n</div>"
    )
    return frame("Studio, Sun lens, tablet", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 3: phone, 390 wide; the sheet drawn at its full length so that all it holds is seen
# --------------------------------------------------------------------------------------------------

PHONE_HEIGHT = 1500


def phone_board() -> str:
    width = 390
    header = piece(PHONE, "<header", "</header>")
    vitals = piece(PHONE, '<section aria-label="Design vitals"', "</section>")
    tabs = piece(PHONE, '<nav aria-label="Workspaces"', "</nav>")
    view = View(STAGE_VIEW, 418, 214)
    stage = Stage(view, -14, 22, 390, 252)
    inside = (
        f'<div style="position: absolute; left: -14px; top: 22px; width: {view.width}px; height: {view.height}px">{scene(view, "p", SCENE_LABEL)}</div>'
        + sun_path(stage, 1.5, 4, 7, [])
    )
    stage_html = phone_stage(inside).replace("21 December 10:30", "21 December 16:00").replace("21 Dec · 10:30", "21 Dec · 16:00")
    content = (
        '<div style="display: flex; flex-direction: column; gap: 22px; padding: 4px 16px 24px">'
        + timeline_phone()
        + view_tabs(True)
        + day_block(True)
        + sun_at_block()
        + shading_block()
        + roof_block(True, rows=True)
        + "</div>"
    )
    sheet = phone_sheet(content, lens=2, height="flex-grow: 1; min-height: 0")
    root = (
        f'<div style="width: {width}px; height: {PHONE_HEIGHT}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">'
        f"\n{header}\n{stage_html}\n{vitals}\n{sheet}\n{tabs}\n</div>"
    )
    return frame("Studio, Sun lens, phone", width, PHONE_HEIGHT, root)


if __name__ == "__main__":
    (HERE / "SunLens.dc.html").write_text(desktop_board(), encoding="utf-8")
    (HERE / "SunLensTablet.dc.html").write_text(tablet_board(), encoding="utf-8")
    (HERE / "SunLensPhone.dc.html").write_text(phone_board(), encoding="utf-8")
    print("SunLens.dc.html, SunLensTablet.dc.html, SunLensPhone.dc.html")
