"""Writes the three boards of the Roof lens of Phase 5 (plan/phase-05-plan.md, step 0):
RoofLensTablet.dc.html, "Studio, Roof lens · tablet 834"; RoofLensPhone.dc.html, "Studio, Roof lens ·
phone 390"; and ObstacleOnRoof.dc.html, "Obstacle edited on the roof".

The first two put the Roof lens of RoofLens.dc.html into the frames of StudioTablet.dc.html and
StudioPhone.dc.html: the top bar, the vitals and the tab bar are taken from those boards as they are,
the stage and the inspector are drawn here. The third is a states board: the selected obstacle on the
3D roof with its handles and its callout, a drag, the handles one by one, Add with its kinds and the
draft it makes, a tree, and the same on phone.

The 3D roof is drawn with the projection of build_lenses.py (the matrices A, B, C, D, ZK, E, F: a point
of the engine's metres, x east, y north, z up, lands at E + A x + C y, F + B x + D y - ZK z), redrawn
here so that an obstacle can be moved, turned, raised or added. build_lenses.py reads Main.dc.html when
it is imported, so it cannot be imported; its scene is ported. Every colour is one of
docs/design/design-tokens.md (the 3D palette for the scene); every number is one of the Pune demo
(plan/reference/demo-numbers.md).

Run it in this folder: python3 build_phase5_roof_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import math
import re

from build_phase3_boards import (
    ACCENT,
    CHROME,
    CONTROL,
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
    NOTE_SURFACE,
    SHADOW_CARD,
    SHADOW_FLOAT,
    SHADOW_RAISED,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    WELL,
    card,
    icon,
    icon_button,
    quiet,
    section,
    state,
)
from build_phase4_boards import SHADOW_LABEL, TURN, corner, floating, roof_type_segmented
from build_phase4_obstacles_by_hand import BIN, BOX, BUILDING, PLUS, POINTER, TANK, WALL, disabled_primary

TREE = '<path d="M12 21v-5"/><path d="M8 16h8l-2-3h1.5l-2.5-3.500h1L12 5 8 9.500h1L6.500 13H8z"/>'
PARAPET = '<path d="M3 19V8h18v11M3 8V6h18v2"/>'

# The 3D palette of design-tokens.md.
ROOF, PARAPET_CAP, PARAPET_LIT, PARAPET_SHADE = "#D3D6DB", "#ECEEF0", "#B9BEC6", "#8E95A0"
WALL_LIT, WALL_SHADE, WALL_EDGE_LIT, WALL_EDGE_SHADE = "#4A5262", "#2E3440", "#343A47", "#22272F"
OBSTACLE_TOP, OBSTACLE_LIT, OBSTACLE_SHADE = "#F1F2F4", "#C2C7CF", "#868D99"
MODULE_GLASS, MODULE_CELL_LINE, MODULE_FRAME = "#16294D", "#2A4675", "#33558C"
SHADOW, GRID_LINE = "#0B1220", "#1B222D"
ON_IMAGERY = "#D5DAE2"

TEXT_GLOW = "text-shadow: 0 1px 8px rgba(0,0,0,0.8)"

# The projection of the approved Studio boards (build_lenses.py).
A, B, C, D, ZK, E, F = 8.154, -2.187, -3.807, -4.680, 7.371, 180, 470
SUN_SHIFT = (-0.75, 1.0)  # where a shadow falls per metre of height at 10:30 on the design day
TOWARD_VIEWER = (-1.0, -2.142, 1.657)  # the null space of the projection, on the viewer's side

ROWS_Y = [1.0, 7.45, 13.9, 20.35, 26.8, 33.25]
COLUMN = 1.153
AVAILABLE = {
    0: list(range(0, 58)) + [71, 72, 73],
    1: list(range(0, 74)),
    2: list(range(0, 14)) + list(range(24, 74)),
    3: list(range(0, 13)) + list(range(24, 48)) + list(range(56, 74)),
    4: list(range(0, 48)) + list(range(55, 74)),
    5: list(range(0, 74)),
}

STAIR = (20.0, 16.0, 25.0, 20.0, 3.0)  # x0, y0, x1, y1, height: the stair room of the demo
TANK_AT = (62.0, 24.0, 1.25, 2.0)  # centre, radius, height
AC_UNITS = [(70.0 + 3 * i, 3.0, 71.5 + 3 * i, 4.0, 1.2) for i in range(4)]

TABLET = (HERE / "StudioTablet.dc.html").read_text(encoding="utf-8")
PHONE = (HERE / "StudioPhone.dc.html").read_text(encoding="utf-8")

OBSTACLE_HEIGHT = 2580


# --------------------------------------------------------------------------------------------------
# Geometry
# --------------------------------------------------------------------------------------------------


def project(x: float, y: float, z: float = 0.0) -> tuple[float, float]:
    return E + A * x + C * y, F + B * x + D * y - ZK * z


def hull(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    points = sorted(set((round(x, 3), round(y, 3)) for x, y in points))
    if len(points) < 3:
        return points

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def cast(points: list[tuple[float, float]], height: float, lift: float = 0.0) -> list[tuple[float, float]]:
    """The shadow of a prism on the roof: its footprint and the footprint shifted by the sun."""
    return hull(
        [(x + SUN_SHIFT[0] * lift, y + SUN_SHIFT[1] * lift) for x, y in points]
        + [(x + SUN_SHIFT[0] * height, y + SUN_SHIFT[1] * height) for x, y in points]
    )


def poly(points: list[tuple[float, float]], extra: str = "") -> str:
    return '<polygon points="' + " ".join(f"{x:.2f},{y:.2f}" for x, y in points) + f'"{extra}/>'


def rect_points(x0: float, y0: float, x1: float, y1: float) -> list[tuple[float, float]]:
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def turned_rect(cx: float, cy: float, w: float, d: float, degrees: float) -> list[tuple[float, float]]:
    """A rectangle about its centre, turned counter-clockwise as the engine turns a box."""
    a = math.radians(degrees)
    out = []
    for dx, dy in ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)):
        out.append((cx + dx * math.cos(a) - dy * math.sin(a), cy + dx * math.sin(a) + dy * math.cos(a)))
    return out


def circle_points(cx: float, cy: float, r: float, n: int = 24) -> list[tuple[float, float]]:
    return [(cx + r * math.cos(t * 2 * math.pi / n), cy + r * math.sin(t * 2 * math.pi / n)) for t in range(n)]


def colx(c: int) -> float:
    return 1.23 + c * COLUMN + 0.6 * (c // 24)


def runs(cols: list[int]) -> list[tuple[int, int]]:
    """Contiguous runs of columns that do not cross a walkway (every 24 columns)."""
    out, start, prev = [], None, None
    for c in cols:
        if start is None:
            start = prev = c
        elif c == prev + 1 and c % 24 != 0:
            prev = c
        else:
            out.append((start, prev))
            start = prev = c
    if start is not None:
        out.append((start, prev))
    return out


class View:
    """A window on the scene: the viewBox of its SVG and the size it is drawn at, so that a point of
    the roof in metres can be placed in pixels over it."""

    def __init__(self, box: tuple[float, float, float, float], width: int, height: int):
        self.box, self.width, self.height = box, width, height
        self.scale = width / box[2]

    def px(self, x: float, y: float, z: float = 0.0) -> tuple[float, float]:
        sx, sy = project(x, y, z)
        return (sx - self.box[0]) * self.scale, (sy - self.box[1]) * self.scale

    def px_of(self, sx: float, sy: float) -> tuple[float, float]:
        return (sx - self.box[0]) * self.scale, (sy - self.box[1]) * self.scale


STAGE_VIEW = (0, 50, 940, 480)  # the viewBox of the Array boards on tablet and phone


# --------------------------------------------------------------------------------------------------
# The scene
# --------------------------------------------------------------------------------------------------


def prism(footprint: list[tuple[float, float]], z0: float, z1: float, top: str, lit: str, shade: str) -> str:
    """A prism from its footprint: the faces that look at the viewer, farthest first, then the top."""
    faces = []
    n = len(footprint)
    for i in range(n):
        (ax, ay), (bx, by) = footprint[i], footprint[(i + 1) % n]
        normal = (by - ay, -(bx - ax))  # outward for a counter-clockwise footprint
        length = math.hypot(*normal) or 1.0
        normal = (normal[0] / length, normal[1] / length)
        if normal[0] * TOWARD_VIEWER[0] + normal[1] * TOWARD_VIEWER[1] <= 0:
            continue
        colour = lit if -normal[1] >= -normal[0] else shade
        depth = 2.187 * (ax + bx) + 4.68 * (ay + by)
        faces.append((depth, poly([project(ax, ay, z0), project(bx, by, z0), project(bx, by, z1), project(ax, ay, z1)], f' fill="{colour}"')))
    faces.sort(key=lambda f: -f[0])
    return "".join(f for _, f in faces) + poly([project(x, y, z1) for x, y in footprint], f' fill="{top}"')


def counter_clockwise(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    area = sum(points[i][0] * points[(i + 1) % len(points)][1] - points[(i + 1) % len(points)][0] * points[i][1] for i in range(len(points)))
    return points if area > 0 else list(reversed(points))


def box(x0: float, y0: float, x1: float, y1: float, h: float, degrees: float = 0.0) -> str:
    footprint = turned_rect((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, degrees) if degrees else rect_points(x0, y0, x1, y1)
    return prism(counter_clockwise(footprint), 0.0, h, OBSTACLE_TOP, OBSTACLE_LIT, OBSTACLE_SHADE)


def cylinder(cx: float, cy: float, r: float, z0: float, z1: float, top: str, side: str) -> str:
    ring = circle_points(cx, cy, r)
    silhouette = hull([project(x, y, z0) for x, y in ring] + [project(x, y, z1) for x, y in ring])
    lid = f'<g transform="matrix({A} {B} {C} {D} {E} {F - ZK * z1:.2f})"><circle cx="{cx}" cy="{cy}" r="{r}" fill="{top}"/></g>'
    return poly(silhouette, f' fill="{side}"') + lid


def tree(cx: float, cy: float, crown: float, starts: float, height: float) -> str:
    return cylinder(cx, cy, 0.15, 0.0, starts, OBSTACLE_SHADE, OBSTACLE_SHADE) + cylinder(cx, cy, crown / 2, starts, height, OBSTACLE_TOP, OBSTACLE_LIT)


def keepout_of(x0: float, y0: float, x1: float, y1: float) -> list[tuple[float, float]]:
    """The area a box keeps clear at the demo's window: its clearance, and its shadow to the north."""
    return [(x0 - 0.5, y0 - 0.5), (x1 + 0.5, y0 - 0.5), (x1 + 4.2, y1 + 4.9), (x0 - 4.0, y1 + 4.9)]


def pattern_defs(tag: str, fade: str) -> str:
    return (
        "<defs>"
        f'<pattern id="mod-{tag}" patternUnits="userSpaceOnUse" width="1.153" height="2.297"><rect width="1.133" height="2.277" fill="{MODULE_GLASS}"/>'
        f'<rect y="1.118" width="1.133" height="0.04" fill="{MODULE_CELL_LINE}"/><rect width="1.133" height="0.06" fill="{MODULE_FRAME}"/></pattern>'
        f'<pattern id="grid-{tag}" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M 10 0 L 0 0 L 0 10" fill="none" stroke="{GRID_LINE}" stroke-width="0.12"/></pattern>'
        f'<clipPath id="roof-{tag}"><rect width="90" height="40"/></clipPath>'
        + (f'<radialGradient id="fade-{tag}" cx="50%" cy="52%" r="62%"><stop offset="55%" stop-color="{GROUND}" stop-opacity="0"/><stop offset="100%" stop-color="{GROUND}" stop-opacity="1"/></radialGradient>' if fade else "")
        + "</defs>"
    )


def row_matrix(y0: float) -> str:
    return f"matrix({A} {B} {round(C * 0.966, 3)} {round(D * 0.966 - ZK * 0.2588, 3)} {round(E + C * y0, 2)} {round(F + D * y0 - ZK * 0.5, 2)})"


def module_row(index: int, tag: str, dim: bool, available: dict[int, list[int]]) -> str:
    fade = ' opacity="0.45"' if dim else ""
    return (
        f'<g transform="{row_matrix(ROWS_Y[index])}" fill="url(#mod-{tag})"{fade}>'
        + "".join(f'<rect transform="translate({colx(a):.3f} 0)" width="{(b - a + 1) * COLUMN - 0.02:.3f}" height="4.574"/>' for a, b in runs(available[index]))
        + "</g>"
    )


def scene(
    view: View,
    tag: str,
    label: str,
    stair: tuple[float, float, float, float, float] = STAIR,
    stair_turn: float = 0.0,
    dim: bool = False,
    fade: bool = True,
    keepouts: bool = True,
    keepout_stair: tuple[float, float, float, float] | None = None,
    draft: tuple[float, float, float, float] | None = None,
    tree_at: tuple[float, float, float, float, float] | None = None,
    hole: dict[int, list[int]] | None = None,
) -> str:
    """The 3D roof of the demo at 10:30 on the design day, as the Array boards draw it: the ground on
    its grid, the building, the roof with its parapet, the six rows, the obstacles and their shadows.
    The stair room can stand elsewhere, turned or higher; a draft footprint and a tree can be added."""
    bx, by, bw, bh = view.box
    available = dict(AVAILABLE)
    if hole:
        available.update(hole)
    x0, y0, x1, y1, h = stair
    stair_print = counter_clockwise(turned_rect((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, stair_turn)) if stair_turn else rect_points(x0, y0, x1, y1)
    kx0, ky0, kx1, ky1 = keepout_stair or (x0, y0, x1, y1)
    o = [f'<svg viewBox="{bx} {by} {bw} {bh}" width="{view.width}" height="{view.height}" style="position: absolute; left: 0; top: 0" role="img" aria-label="{label}">']
    o.append(pattern_defs(tag, fade))
    # The ground, 6 m below the roof, with the building's shadow on it.
    o.append(
        f'<g transform="matrix({A} {B} {C} {D} {E} {F + 6 * ZK:.2f})"><rect x="-60" y="-40" width="220" height="140" fill="url(#grid-{tag})"/>'
        + poly(cast(rect_points(0, 0, 90, 40), 6.9), ' fill="#05070A" opacity="0.7"')
        + "</g>"
    )
    if fade:
        o.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="url(#fade-{tag})"/>')
    # The roof and its setback line; the parapet's inner faces and the far caps.
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F})"><rect width="90" height="40" fill="{ROOF}"/><rect x="1" y="1" width="88" height="38" fill="none" stroke="{PARAPET_SHADE}" stroke-width="0.08" stroke-dasharray="0.5 0.4"/></g>')
    o.append(f'<g transform="matrix({A} {B} 0 -{ZK} {E + C * 40:.2f} {F + D * 40:.2f})"><rect width="90" height="0.9" fill="{PARAPET_LIT}"/></g>')
    o.append(f'<g transform="matrix({C} {D} 0 -{ZK} {E + A * 90:.2f} {F + B * 90:.2f})"><rect width="40" height="0.9" fill="{PARAPET_SHADE}"/></g>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F - ZK * 0.9:.2f})" fill="{PARAPET_CAP}"><rect y="39.8" width="90" height="0.2"/><rect x="89.8" width="0.2" height="40"/></g>')
    # On the roof: the kept-clear areas, then every shadow.
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F})">')
    if keepouts:
        o.append(f'<g fill="{ACCENT}" fill-opacity="0.18" stroke="{ACCENT}" stroke-width="0.1" stroke-dasharray="0.6 0.4">')
        o.append(poly(keepout_of(kx0, ky0, kx1, ky1)))
        o.append('<polygon points="60.2,22.2 63.8,22.2 66.8,31.3 57.7,31.3"/><polygon points="69.4,2.5 81.6,2.5 84.2,5.6 69.2,5.6"/></g>')
    o.append(f'<g opacity="0.36" fill="{SHADOW}" clip-path="url(#roof-{tag})">')
    o.append('<polygon points="0,0 90,0 89.325,0.9 0,0.9"/><polygon points="90,0 90,40 89.325,40 89.325,0.9"/>')
    o.append(poly(cast(stair_print, h)))
    cx, cy, r, th = TANK_AT
    o.append(poly(cast(circle_points(cx, cy, r), th)))
    for ax0, ay0, ax1, ay1, ah in AC_UNITS:
        o.append(poly(cast(rect_points(ax0, ay0, ax1, ay1), ah)))
    if tree_at:
        tx, ty, crown, starts, height = tree_at
        o.append(poly(cast(circle_points(tx, ty, crown / 2), height, lift=starts)))
    for index, ry in enumerate(ROWS_Y):
        m = f"matrix(1 0 {1.184 * SUN_SHIFT[0]:.3f} {4.418 + 1.184 * SUN_SHIFT[1]:.3f} {0.5 * SUN_SHIFT[0]:.3f} {ry + 0.5 * SUN_SHIFT[1]:.3f})"
        o.append(f'<g transform="{m}">' + "".join(f'<rect x="{colx(a):.3f}" width="{(b - a + 1) * COLUMN - 0.02:.3f}" height="1"/>' for a, b in runs(available[index])) + "</g>")
    o.append("</g></g>")
    # Back to front: the rows, with the obstacles between them.
    o.append(module_row(5, tag, dim, available) + module_row(4, tag, dim, available))
    if tree_at:
        o.append(tree(*tree_at))
    o.append(cylinder(cx, cy, r, 0.0, th, OBSTACLE_TOP, OBSTACLE_LIT))
    o.append(module_row(3, tag, dim, available))
    o.append(prism(stair_print, 0.0, h, OBSTACLE_TOP, OBSTACLE_LIT, OBSTACLE_SHADE))
    o.append(module_row(2, tag, dim, available) + module_row(1, tag, dim, available))
    if draft:
        o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F})">' + poly(rect_points(*draft), f' fill="{ACCENT}" fill-opacity="0.18" stroke="{ACCENT}" stroke-width="0.25" stroke-dasharray="0.6 0.4"') + "</g>")
    for ax0, ay0, ax1, ay1, ah in AC_UNITS:
        o.append(box(ax0, ay0, ax1, ay1, ah))
    o.append(module_row(0, tag, dim, available))
    # The building's walls, with the parapet's outer face, and the near caps.
    o.append(f'<g transform="matrix({A} {B} 0 -{ZK} {E} {F})"><rect y="-6" width="90" height="6.9" fill="{WALL_LIT}"/><rect y="-6" width="90" height="0.4" fill="{WALL_EDGE_LIT}"/></g>')
    o.append(f'<g transform="matrix({C} {D} 0 -{ZK} {E} {F})"><rect y="-6" width="40" height="6.9" fill="{WALL_SHADE}"/><rect y="-6" width="40" height="0.4" fill="{WALL_EDGE_SHADE}"/></g>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F - ZK * 0.9:.2f})" fill="{PARAPET_CAP}"><rect width="90" height="0.2"/><rect width="0.2" height="40"/></g>')
    o.append("</svg>")
    return "".join(o)


# --------------------------------------------------------------------------------------------------
# Over the scene: the selection, the handles, the callout, in pixels
# --------------------------------------------------------------------------------------------------


def overlay_svg(view: View, inside: str) -> str:
    return (
        f'<svg width="{view.width}" height="{view.height}" viewBox="0 0 {view.width} {view.height}" style="position: absolute; left: 0; top: 0; pointer-events: none" aria-hidden="true">{inside}</svg>'
    )


def px_poly(view: View, points: list[tuple[float, float, float]], extra: str) -> str:
    return poly([view.px(x, y, z) for x, y, z in points], extra)


def selection(view: View, footprint: list[tuple[float, float]], h: float, hover: bool = False) -> str:
    """The outline of a selected prism: its silhouette and the edges of its top, in accent."""
    colour = "#FFD36B" if hover else ACCENT
    corners = [view.px(x, y, 0) for x, y in footprint] + [view.px(x, y, h) for x, y in footprint]
    return poly(hull(corners), f' fill="none" stroke="{colour}" stroke-width="2" stroke-linejoin="round"') + poly(
        [view.px(x, y, h) for x, y in footprint], f' fill="none" stroke="{colour}" stroke-width="1.5" stroke-linejoin="round"'
    )


def ghost(view: View, footprint: list[tuple[float, float]]) -> str:
    return poly([view.px(x, y, 0) for x, y in footprint], f' fill="none" stroke="{ACCENT}" stroke-width="1.5" stroke-dasharray="5 4" stroke-linejoin="round"')


def stem(x0: float, y0: float, x1: float, y1: float, width: float = 2) -> str:
    return f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{ACCENT}" stroke-width="{width}"/>'


def turn_handle(x: float, y: float, side: int = 32) -> str:
    return (
        f'<button aria-label="Turn the obstacle" style="position: absolute; left: {x - side / 2:.0f}px; top: {y - side / 2:.0f}px; width: {side}px; height: {side}px; '
        f'display: flex; align-items: center; justify-content: center; cursor: grab; padding: 0; {floating("; border-radius: 50%; border-color: " + ACCENT)}">{icon(TURN, 16 if side < 40 else 18, ACCENT)}</button>'
    )


def hit_area(x: float, y: float) -> str:
    """What a touch handle takes: 44 by 44 around it, shown faintly."""
    return f'<div aria-hidden="true" style="position: absolute; left: {x - 22:.0f}px; top: {y - 22:.0f}px; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.10)"></div>'


def handle_set(view: View, footprint: list[tuple[float, float]], h: float, touch: bool = False, live: int = -1, turn: bool = True, height: bool = True, height_live: bool = False) -> str:
    """The handles of a selected box: its four top corners (size), the turn handle on a stem off the
    north edge, the height handle on a vertical stem from the middle of the top."""
    side = 44 if touch else 32
    out = ""
    lines = ""
    for n, (x, y) in enumerate(footprint):
        px, py = view.px(x, y, h)
        if touch:
            out += hit_area(px, py)
        out += corner(px, py, touch=touch, live=n == live)
    if turn:
        (nx, ny) = ((footprint[2][0] + footprint[3][0]) / 2, (footprint[2][1] + footprint[3][1]) / 2)
        sx, sy = view.px(nx, ny, h)
        ax, ay = view.px(nx, ny + 1, h)
        length = 44
        dx, dy = ax - sx, ay - sy
        norm = math.hypot(dx, dy)
        tx, ty = sx + dx / norm * length, sy + dy / norm * length
        lines += stem(sx, sy, tx, ty)
        out += turn_handle(tx, ty, side)
    if height:
        sx, sy = view.px(sum(x for x, _ in footprint) / 4, sum(y for _, y in footprint) / 4, h)
        rise = 52 if touch else 40
        lines += stem(sx, sy, sx, sy - rise)
        if touch:
            out += hit_area(sx, sy - rise)
        out += corner(sx, sy - rise, touch=touch, live=height_live)
    return overlay_svg(view, lines) + out


def stage_callout(x: float, y: float, title: str, detail: str, glyph: str = BOX, above: int = 52, width: int = 236, left_of: int = 118) -> str:
    """The callout of a selected object on the stage: joined to it by a 1 px line and a 9 px dot."""
    return (
        f'<div aria-hidden="true" style="position: absolute; left: {x:.0f}px; top: {y - above:.0f}px; width: 1px; height: {above}px; background: {ACCENT}"></div>'
        f'<div aria-hidden="true" style="position: absolute; left: {x - 4:.0f}px; top: {y - 4:.0f}px; width: 9px; height: 9px; border-radius: 50%; background: {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.25)"></div>'
        f'<div style="position: absolute; left: {x - left_of:.0f}px; top: {y - above - 58:.0f}px; width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500">{icon(glyph, 16, ACCENT)}{title}</div>'
        f'<div style="font-size: 12px; color: {TEXT_2}">{detail}</div></div>'
    )


def live_label(x: float, y: float, words: str) -> str:
    return (
        f'<code style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; padding: 3px 9px; background: {GROUND}; border-radius: 7px; '
        f'font-size: 12px; font-weight: 500; white-space: nowrap; box-shadow: {SHADOW_LABEL}">{words}</code>'
    )


def crop(view: View, inside: str, radius: int = 12) -> str:
    return (
        f'<div style="position: relative; width: {view.width}px; height: {view.height}px; overflow: hidden; border-radius: {radius}px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px">'
        f"{inside}</div>"
    )


# --------------------------------------------------------------------------------------------------
# The inspector's pieces, for desktop, tablet (touch) and phone (rows)
# --------------------------------------------------------------------------------------------------


def piece(html: str, start: str, end: str, keep_end: bool = True) -> str:
    a = html.index(start)
    b = html.index(end, a)
    return html[a : b + (len(end) if keep_end else 0)]


def swap_lens(nav: str, active: int) -> str:
    """The lens row of an Array board with another lens active: the tags of its buttons are swapped."""
    tags = re.findall(r"<button[^>]*>", nav)[:4]
    on = next(t for t in tags if "aria-pressed" in t)
    off = next(t for t in tags if "aria-pressed" not in t)
    parts = nav
    for t in tags:
        parts = parts.replace(t, "@@BUTTON@@", 1)
    split = parts.split("@@BUTTON@@")
    return "".join(split[n] + (on if n == active else off) for n in range(4)) + split[4]


def number_field(id_: str, label: str, value: str, unit: str = "m", height: int = 40, focus: bool = False, width: int = 48, radius: int = 10, wide: bool = False) -> str:
    """A number field with its label inside, at the left (the form of the Roof lens on desktop and tablet).
    A wide one takes the row of the grid it is in."""
    look = f"border: 1px solid {ACCENT}; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)" if focus else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
    after = f'<span style="color: {TEXT_2}; font-size: 12px">{unit}</span>' if unit else ""
    span = "grid-column: span 2; " if wide else ""
    return (
        f'<div style="{span}display: flex; align-items: center; gap: 6px; height: {height}px; padding: 0 12px; background: {WELL}; border-radius: {radius}px; {look}">'
        f'<label for="{id_}" style="flex-grow: 1; color: {TEXT_2}; font-size: 13px; white-space: nowrap">{label}</label>'
        f'<input id="{id_}" value="{value}" inputmode="decimal" style="width: {width}px; min-width: 0; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500">{after}</div>'
    )


def phone_row(id_: str, label: str, value: str, unit: str = "m", focus: bool = False) -> str:
    """A row of the sheet on phone: the label before the field, the field 48 high with the radius of a row."""
    look = f"border: 1px solid {ACCENT}; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)" if focus else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
    after = f'<span style="color: {TEXT_2}; font-size: 12px">{unit}</span>' if unit else ""
    return (
        '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 48px">'
        f'<label for="{id_}" style="color: {TEXT_2}">{label}</label>'
        f'<div style="display: flex; align-items: center; gap: 6px; width: 132px; height: 48px; box-sizing: border-box; padding: 0 14px; background: {WELL}; border-radius: 12px; {look}">'
        f'<input id="{id_}" value="{value}" inputmode="decimal" style="flex-grow: 1; width: 56px; min-width: 0; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500">{after}</div></div>'
    )


def edit_link(height: int, radius: int) -> str:
    return (
        f'<a href="Locate.dc.html" style="flex-shrink: 0; display: flex; align-items: center; height: {height}px; padding: 0 {14 if height > 40 else 12}px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; '
        f'border-radius: {radius}px; font-size: {14 if height > 40 else 13}px; font-weight: 500; color: {TEXT}; box-shadow: {SHADOW_RAISED}">Edit</a>'
    )


ROOF_GLYPH = (
    f'<div aria-hidden="true" style="width: {{side}}px; height: {{side}}px; flex-shrink: 0; border-radius: 10px; background: #3B4037; position: relative; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08)">'
    f'<div style="position: absolute; left: 18%; top: 36%; width: 64%; height: 28%; background: #B4B8BE; outline: 2px solid {ACCENT}"></div></div>'
)


def roof_lines(tag: str) -> str:
    """The four lines of the roof's card: the place, how it came, its counts, its size. The counts
    are a line of their own so that no line is cut short on any size."""
    line = f'<{tag} style="font-size: 12px; color: {TEXT_2}; white-space: nowrap">{{}}</{tag}>'
    return (
        '<code style="font-weight: 500; font-size: 12px; white-space: nowrap">18.52000° N, 73.86000° E</code>'
        + line.format("Outlined on satellite")
        + line.format("4 corners · 6 obstacles")
        + line.format("90.0 × 40.0 m · faces 180° S")
    )


def roof_card(touch: bool) -> str:
    """The card of the roof: where it is, how it came, its counts, its size; Edit goes back to the map."""
    return (
        f'<div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
        + ROOF_GLYPH.format(side=56)
        + '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; line-height: 16px">'
        + roof_lines("div")
        + "</div>"
        + edit_link(44 if touch else 36, 12 if touch else 9)
        + "</div>"
    )


def roof_row_phone() -> str:
    """The roof on phone: a row of the sheet, as the module is on the Array lens; a press is Edit."""
    return (
        f'<a href="LocatePhone.dc.html" style="display: flex; align-items: center; gap: 12px; height: 84px; border-bottom: 1px solid {LINE_SUBTLE}; color: {TEXT}">'
        + ROOF_GLYPH.format(side=44)
        + '<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; line-height: 16px">'
        + roof_lines("span")
        + "</span>"
        + icon('<path d="m9 6 6 6-6 6"/>', 18, TEXT_3)
        + "</a>"
    )


def roof_type_section(touch: bool) -> str:
    if touch:
        control = roof_type_segmented()
    else:
        control = (
            f'<div role="group" aria-label="Roof type" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; padding: 3px; background: {WELL}; border: 1px solid {LINE}; border-radius: 10px; box-shadow: {SHADOW_WELL}">'
            f'<button aria-pressed="true" style="height: 34px; background: #232A36; border: 0; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)">Tilted rows</button>'
            f'<button style="height: 34px; background: transparent; border: 0; border-radius: 7px; color: {TEXT_2}; font-size: 13px; cursor: pointer">East-west</button>'
            f'<button style="height: 34px; background: transparent; border: 0; border-radius: 7px; color: {TEXT_2}; font-size: 13px; cursor: pointer">Sloped</button></div>'
        )
    return f'<section style="display: flex; flex-direction: column; gap: 10px">{section("Roof type")}{control}</section>'


EDGES = [("par", "Parapet", "0.90", "m"), ("set", "Setback", "1.00", "m"), ("wlk", "Walkway", "0.60", "m"), ("evy", "Every", "24", "mod"), ("clr", "Clearance", "0.50", "m"), ("alb", "Albedo", "0.20", "")]


def edges_section(touch: bool) -> str:
    fields = "".join(number_field("r-" + id_, label, value, unit, height=44 if touch else 40) for id_, label, value, unit in EDGES)
    return (
        f'<section style="display: flex; flex-direction: column; gap: 10px">{section("Edges and access")}'
        f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{fields}</div></section>'
    )


def obstacle_head(name: str, kind: str, touch: bool, remove: bool = True, glyph: str = BOX) -> str:
    side = 44 if touch else 32
    end = icon_button("Remove " + name, BIN, side, TEXT_2) if remove else ""
    return (
        '<div style="display: flex; align-items: center; gap: 10px">'
        + icon(glyph, 20, ACCENT, 1.7)
        + f'<label for="o-name" style="position: absolute; width: 1px; height: 1px; overflow: hidden">Name</label>'
        f'<input id="o-name" value="{name}" style="flex-grow: 1; min-width: 0; background: transparent; border: 0; outline: 0; font-weight: 600">'
        f'<span style="font-size: 12px; color: {TEXT_2}">{kind}</span>{end}</div>'
    )


STAIR_FIELDS = [("l", "Length", "5.0", "m"), ("w", "Width", "4.0", "m"), ("h", "Height", "3.0", "m"), ("r", "Rotation", "0", "°"), ("x", "East", "22.5", "m"), ("y", "North", "18.0", "m")]
BOX7_FIELDS = [("l", "Length", "2.0", "m"), ("w", "Width", "2.0", "m"), ("h", "Height", "", "m"), ("r", "Rotation", "0", "°"), ("x", "East", "45.0", "m"), ("y", "North", "20.0", "m")]
TREE_FIELDS = [("d", "Crown ⌀", "4.0", "m"), ("h", "Height", "6.0", "m"), ("s", "Crown starts at", "2.0", "m"), ("x", "East", "10.0", "m"), ("y", "North", "34.0", "m")]
WIDE_FIELDS = ("s",)  # a label too long for half a row


def selected_card(name: str, kind: str, fields: list[tuple[str, str, str, str]], touch: bool = False, focus: str = "", glyph: str = BOX, foot: str = "", remove: bool = True) -> str:
    """The selected obstacle, open in the list: its name, its kind, Remove, and its fields by kind."""
    height = 44 if touch else 40
    grid = "".join(number_field("o-" + id_, label, value, unit, height=height, focus=id_ == focus, wide=id_ in WIDE_FIELDS) for id_, label, value, unit in fields)
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; border-radius: 12px; box-shadow: 0 0 0 3px rgba(255,176,32,0.14)">'
        + obstacle_head(name, kind, touch, remove, glyph)
        + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{grid}</div>{foot}</div>'
    )


def selected_card_phone(name: str, kind: str, fields: list[tuple[str, str, str, str]]) -> str:
    rows = "".join(phone_row("p-" + id_, label, value, unit) for id_, label, value, unit in fields)
    return (
        f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 14px 14px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; border-radius: 12px; box-shadow: 0 0 0 3px rgba(255,176,32,0.14)">'
        + obstacle_head(name, kind, touch=True)
        + rows
        + "</div>"
    )


def collapsed_row(glyph: str, name: str, facts: str, touch: bool = False) -> str:
    return (
        f'<button style="display: flex; align-items: center; gap: 10px; height: {44 if touch else 46}px; padding: 0 12px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 12px; text-align: left; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)">'
        f'{icon(glyph, 20, TEXT_2, 1.7)}<span style="flex-grow: 1; font-weight: 500">{name}</span><code style="font-size: 12px; color: {TEXT_2}">{facts}</code></button>'
    )


def parapet_row(touch: bool = False) -> str:
    return (
        f'<div style="display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; color: {TEXT_3}; font-size: 13px">'
        f'{icon(PARAPET, 20, TEXT_3, 1.7)}<span style="flex-grow: 1">Parapet, all edges</span><code style="font-size: 12px">h 0.9 m</code></div>'
    )


def add_button(touch: bool, open_: bool = False) -> str:
    height = 44 if touch else 32
    look = (
        f"background: #10141A; border: 1px solid {LINE_STRONG}; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5)"
        if open_
        else f"background: {CONTROL}; border: 1px solid {LINE_STRONG}; box-shadow: {SHADOW_RAISED}"
    )
    return (
        f'<button aria-haspopup="menu" aria-expanded="{"true" if open_ else "false"}" style="margin-left: auto; display: flex; align-items: center; gap: 6px; height: {height}px; padding: 0 {14 if touch else 12}px; '
        f'{look}; border-radius: {12 if touch else 9}px; font-size: {14 if touch else 13}px; font-weight: 500; cursor: pointer">{icon(PLUS, 14, "currentColor", 2.2)}Add</button>'
    )


def obstacles_head(count: str, touch: bool, open_: bool = False) -> str:
    return f'<div style="display: flex; align-items: center">{section("Obstacles · " + count)}{add_button(touch, open_)}</div>'


def other_rows(touch: bool) -> str:
    return (
        collapsed_row(TANK, "Water tank", "⌀ 2.5 · h 2.0 m", touch)
        + collapsed_row(BOX, "AC unit 1–4", "4 × 1.5 × 1.0 · h 1.2 m", touch)
        + parapet_row(touch)
    )


def obstacles_section(touch: bool) -> str:
    return (
        f'<section style="flex-grow: 1; min-height: 0; display: flex; flex-direction: column; gap: {8 if touch else 10}px">'
        + obstacles_head("6", touch)
        + selected_card("Stair room", "Box", STAIR_FIELDS, touch)
        + other_rows(touch)
        + "</section>"
    )


def kinds_menu() -> str:
    """Add, open: the kinds an obstacle can be."""
    rows = ""
    for glyph, name, fact, under in [(BOX, "Box", "2.0 × 2.0 m", True), (TANK, "Tank", "⌀ 2.0 m", False), (WALL, "Wall", "6.0 m, points", False), (TREE, "Tree", "crown ⌀ 4.0 m", False), (BUILDING, "Building", "beside the roof, points", False)]:
        ground = SURFACE_2 if under else "transparent"
        rows += (
            f'<li role="menuitem" style="display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 10px; border-radius: 8px; background: {ground}; cursor: pointer">'
            f'{icon(glyph, 18, TEXT_2, 1.8)}<span style="flex-grow: 1">{name}</span><span style="font-size: 12px; color: {TEXT_3}">{fact}</span></li>'
        )
    return (
        f'<ul role="menu" aria-label="Add an obstacle" style="list-style: none; margin: 0; width: 280px; box-sizing: border-box; display: flex; flex-direction: column; gap: 2px; padding: 6px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">{rows}</ul>'
    )


def caption(words: str) -> str:
    return f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">{words}</p>'


# --------------------------------------------------------------------------------------------------
# Board 1: the Roof lens on tablet, 834 by 1194
# --------------------------------------------------------------------------------------------------


def stage_title(top: int, touch: bool) -> str:
    size = "font-size: 22px; line-height: 28px" if touch else "font-size: 26px; line-height: 32px"
    return (
        f'<div style="position: absolute; z-index: 1; left: {20 if touch else 24}px; top: {top}px; display: flex; flex-direction: column; gap: 2px; {TEXT_GLOW}">'
        f'<div style="{DISPLAY}; {size}; letter-spacing: -0.02em">Roof</div>'
        f'<div style="color: {ON_IMAGERY}; font-size: 13px">3,600 m² · 3,344 m² inside the setback · 6 obstacles</div></div>'
    )


def tablet_board() -> str:
    width, height = 834, 1194
    header = piece(TABLET, "<header", "</header>")
    controls = swap_lens(piece(TABLET, '<nav aria-label="Lenses"', "</nav>"), 0) + piece(TABLET, '<div style="position: absolute; right: 20px; top: 16px;', "</div>")
    pill = piece(TABLET, '<div style="position: absolute; left: 20px; bottom: 16px;', "</main>", keep_end=False)
    vitals = piece(TABLET, '<section aria-label="Design vitals"', "</section>")
    view = View(STAGE_VIEW, 818, 418)
    x0, y0, x1, y1, h = STAIR
    footprint = rect_points(x0, y0, x1, y1)
    cx, cy = view.px(x1, (y0 + y1) / 2, h)
    stage = (
        f'<div style="position: absolute; left: 8px; top: 76px; width: {view.width}px; height: {view.height}px">'
        + scene(view, "t", "3D view of the Pune demo roof with the stair room selected: six rows of modules dimmed, a water tank and four AC units with their shadows", dim=True)
        + overlay_svg(view, selection(view, footprint, h))
        + stage_callout(cx, cy, "Stair room · selected", "5.0 × 4.0 m · 3.0 m high · drag to move", above=44)
        + "</div>"
    )
    main = f'<main style="position: relative; height: 508px; flex-shrink: 0; background: {GROUND}">{controls}{stage_title(84, touch=True)}{stage}{pill}</main>'
    inspector = (
        '<div aria-label="Roof inspector" style="flex-grow: 1; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; padding: 16px 20px 16px; overflow: hidden">'
        '<div style="display: flex; flex-direction: column; gap: 20px">' + roof_card(touch=True) + roof_type_section(touch=True) + edges_section(touch=True) + "</div>"
        '<div style="display: flex; flex-direction: column; gap: 20px">' + obstacles_section(touch=True) + "</div></div>"
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">'
        f"\n{header}\n{main}\n{vitals}\n{inspector}\n</div>"
    )
    return frame("Studio, Roof lens, tablet", width, height, root)


def frame(title: str, width: int, height: int, root: str) -> str:
    """A screen board: the head of the Array boards around a root of the device's size."""
    head = piece(TABLET, "<!doctype html>", "</helmet>").replace("<title>Studio, tablet</title>", f"<title>{title}</title>")
    head = head.replace("@keyframes live", "@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,176,32,.55),0 2px 6px rgba(0,0,0,.6)}50%{box-shadow:0 0 0 9px rgba(255,176,32,0),0 2px 6px rgba(0,0,0,.6)}}\n@keyframes live")
    return head + "\n" + root + "\n" + FOOT.format(width=width, height=height)


# --------------------------------------------------------------------------------------------------
# Board 2: the Roof lens on phone, 390 by 844
# --------------------------------------------------------------------------------------------------


def phone_sheet(inside: str, lens: int = 0, height: str = "flex-grow: 1; min-height: 0") -> str:
    nav = swap_lens(piece(PHONE, '<nav aria-label="Lenses"', "</nav>"), lens)
    return (
        f'<section aria-label="Inspector" style="{height}; display: flex; flex-direction: column; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0; overflow: hidden">'
        f'<div style="display: flex; justify-content: center; padding: 8px 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        f"{nav}{inside}</section>"
    )


def phone_stage(inside: str) -> str:
    controls = piece(PHONE, '<div style="position: absolute; right: 12px; top: 4px;', "</main>", keep_end=False)
    return f'<main style="position: relative; height: 252px; flex-shrink: 0; overflow: hidden">{inside}{controls}</main>'


def phone_board() -> str:
    width, height = 390, 844
    header = piece(PHONE, "<header", "</header>")
    vitals = piece(PHONE, '<section aria-label="Design vitals"', "</section>")
    tabs = piece(PHONE, '<nav aria-label="Workspaces"', "</nav>")
    view = View(STAGE_VIEW, 418, 214)
    x0, y0, x1, y1, h = STAIR
    stage = phone_stage(
        f'<div style="position: absolute; left: -14px; top: 22px; width: {view.width}px; height: {view.height}px">'
        + scene(view, "p", "3D view of the Pune demo roof with the stair room selected", dim=True)
        + overlay_svg(view, selection(view, rect_points(x0, y0, x1, y1), h))
        + "</div>"
    )
    rows = "".join(phone_row("r-" + id_, label, value, unit) for id_, label, value, unit in EDGES[:3])
    inside = (
        '<div style="display: flex; flex-direction: column; gap: 10px; padding: 8px 16px 0">'
        + roof_row_phone()
        + section("Roof type", top=4)
        + roof_type_segmented()
        + section("Edges and access", top=6)
        + f'<div style="display: flex; flex-direction: column; gap: 8px">{rows}</div>'
        + "</div>"
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">'
        f"\n{header}\n{stage}\n{vitals}\n{phone_sheet(inside)}\n{tabs}\n</div>"
    )
    return frame("Studio, Roof lens, phone", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 3: an obstacle edited on the roof
# --------------------------------------------------------------------------------------------------

CROP = (60, 165, 500, 300)  # the desktop stage about the stair room, 1.4 times its size


def selected_card_on_roof() -> str:
    view = View(CROP, 700, 420)
    x0, y0, x1, y1, h = STAIR
    footprint = rect_points(x0, y0, x1, y1)
    cx, cy = view.px(x1, (y0 + y1) / 2, h)
    inside = (
        scene(view, "s", "The stair room selected on the 3D roof", dim=True, fade=False)
        + overlay_svg(view, selection(view, footprint, h))
        + handle_set(view, footprint, h)
        + stage_callout(cx, cy, "Stair room · selected", "5.0 × 4.0 m · 3.0 m high · drag to move", above=60, left_of=20)
    )
    body = (
        state("The desktop stage about the stair room, selected: the accent outline, a handle at each corner of its top, the turn handle on its stem off the north edge, the height handle on a vertical stem from the middle of its top", crop(view, inside))
        + caption(
            "A press on the roof, an obstacle, a kept-clear area or a module selects it; hover is a lighter outline, on pointer devices only; Escape clears. "
            "The list and the roof share one selection: the row opens in the list, the callout stands on the roof. The parapet is not selectable."
        )
    )
    return card("Selected on the roof", body, gap=12)


def dragged_card() -> str:
    view = View(CROP, 700, 420)
    x0, y0, x1, y1, h = STAIR
    moved = (x0 + 5, y0, x1 + 5, y1, h)
    footprint = rect_points(*moved[:4])
    px, py = view.px(moved[0] + 2.5, moved[1] + 2, h)
    inside = (
        scene(view, "d", "The stair room dragged 5 m east on the 3D roof", stair=moved, keepout_stair=STAIR[:4], dim=True, fade=False)
        + overlay_svg(view, ghost(view, rect_points(x0, y0, x1, y1)) + selection(view, footprint, h))
        + f'<div style="position: absolute; left: {px + 2:.0f}px; top: {py + 2:.0f}px">{POINTER}</div>'
        + live_label(px + 22, py - 4, "East 27.5 m · North 18.0 m")
    )
    body = (
        state("Mid-drag: the stair room follows the pointer on the roof plane, snapping to 0.1 m; its old place stays as a dashed ghost, the live position stands beside the pointer. The handles are away while it moves", crop(view, inside))
        + caption(
            "The drop commits the edit: the layout follows at once (the kept-clear area moves with the stair room, the module count changes), the design after the pause. "
            "Undo (Cmd or Ctrl+Z) restores the place, the layout and the count; a drag is one edit. The obstacle stays inside the roof."
        )
    )
    return card("Dragged", body, gap=12)


def handles_card() -> str:
    def small(box: tuple[float, float, float, float, float], turn: float, live: int, height_live: bool, words: str, tag: str) -> str:
        view = View((228, 268, 130, 110), 260, 220)
        x0, y0, x1, y1, h = box
        footprint = counter_clockwise(turned_rect((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, turn)) if turn else rect_points(x0, y0, x1, y1)
        lx, ly = view.px(x0, y0, 0)
        inside = (
            scene(view, tag, "The stair room with one handle dragged", stair=box, stair_turn=turn, dim=True, fade=False, keepouts=False)
            + overlay_svg(view, selection(view, footprint, h))
            + handle_set(view, footprint, h, live=live, height_live=height_live)
            + live_label(lx - 12, ly + 12, words)
        )
        return crop(view, inside)

    drawings = (
        '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 16px">'
        + state("A corner: the size", small((20, 16, 26, 20, 3.0), 0, 1, False, "6.0 × 4.0 m", "h1"))
        + state("The turn handle: the rotation", small(STAIR, 15, -1, False, "Rotation 15°", "h2"))
        + state("The height handle: the height", small((20, 16, 25, 20, 3.5), 0, -1, True, "3.5 m high", "h3"))
        + "</div>"
    )
    body = drawings + caption(
        "Each handle changes one thing: a corner the length and the width (the opposite corner stays), the turn handle the rotation (it snaps to 0° and 90° within 3°), "
        "the height handle the height. The fields of the list do the same by number, and say the same while a handle is dragged. A tank has one handle, at its edge, for its diameter."
    )
    return card("Handles", body, gap=12)


def add_card() -> str:
    view = View((368, 200, 206, 100), 412, 200)
    draft = (44.0, 19.0, 46.0, 21.0)
    dx, dy = view.px(45, 20, 0)
    on_roof = (
        scene(view, "a", "A draft box at the centre of the roof, in accent", draft=draft, dim=True, fade=False, keepouts=False)
        + stage_callout(dx, dy, "Box 7 · draft", "2.0 × 2.0 m · type its height to add it", above=48, width=250, left_of=125)
    )
    menu = (
        '<div style="display: flex; flex-direction: column; gap: 6px; width: 332px">'
        + obstacles_head("6", touch=False, open_=True)
        + f'<div style="align-self: flex-end">{kinds_menu()}</div></div>'
    )
    foot = f'<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px">{quiet("Remove", 36)}{disabled_primary("Add the box", 36)}</div>'
    draft_card = f'<div style="width: 332px">{selected_card("Box 7", "Box", BOX7_FIELDS, focus="h", foot=foot, remove=False)}</div>'
    body = (
        state("Add opens the kinds; the pointer is on Box", menu)
        + state("Box taken: the draft stands at the centre of the roof, in accent, as a footprint without a height", crop(view, on_roof))
        + state("Its card opens in the list with the sizes of the inventory; the height is empty and has the focus; the action waits", draft_card)
        + caption(
            "Nothing is preselected. The obstacle joins the design when its height is typed (decision 15 of the plan): Enter in the field, or the action once it has a number. "
            "Until then it is a draft of the view, not of the document; Remove or Escape drops it. Add, then a tap on the roof, places it where the tap was."
        )
    )
    return card("Add", body, gap=14)


def tree_card() -> str:
    tree_at = (10.0, 34.0, 4.0, 2.0, 6.0)
    view = View((-20, 166, 294, 143), 412, 200)
    tx, ty = view.px(10, 34, 6)
    hole = {5: [c for c in AVAILABLE[5] if c < 5 or c > 9]}
    on_roof = (
        scene(view, "r", "A tree on the roof: a trunk and a crown disc", tree_at=tree_at, hole=hole, dim=True, fade=False, keepouts=False)
        + overlay_svg(view, poly(hull([view.px(x, y, 2.0) for x, y in circle_points(10, 34, 2)] + [view.px(x, y, 6.0) for x, y in circle_points(10, 34, 2)]), f' fill="none" stroke="{ACCENT}" stroke-width="2" stroke-linejoin="round"'))
        + stage_callout(tx, ty, "Tree 1 · selected", "crown ⌀ 4.0 m from 2.0 to 6.0 m · drag to move", TREE, above=40, width=300, left_of=150)
    )
    body = (
        state("The tree's card: its crown, where the crown starts, its height, and where it stands", f'<div style="width: 332px">{selected_card("Tree 1", "Tree", TREE_FIELDS, glyph=TREE)}</div>')
        + state("On the roof: the trunk, 0.3 m wide, to where the crown starts; the crown as a disc to its height. Selected, with its callout", crop(view, on_roof))
        + caption(
            "Trees are entered here, never on the map: the map cannot tell a crown from its shade. The crown keeps positions clear below it and shades to the north like any obstacle. "
            "A wall and a building are entered by their points, in a table as the corners of “Enter dimensions by hand” (east and north of the middle of the roof, added and removed); a wall has its thickness too."
        )
    )
    return card("A tree", body, gap=14)


def phone_card() -> str:
    width = 390
    header = piece(PHONE, "<header", "</header>")
    tabs = piece(PHONE, '<nav aria-label="Workspaces"', "</nav>")
    view = View((146, 244, 299, 153), 418, 214)
    x0, y0, x1, y1, h = STAIR
    footprint = rect_points(x0, y0, x1, y1)
    stage = phone_stage(
        f'<div style="position: absolute; left: -14px; top: 22px; width: {view.width}px; height: {view.height}px">'
        + scene(view, "ph", "The 3D roof pinched in on the stair room, selected", dim=True, fade=False)
        + overlay_svg(view, selection(view, footprint, h))
        + handle_set(view, footprint, h, touch=True)
        + "</div>"
    )
    inside = (
        '<div style="display: flex; flex-direction: column; gap: 10px; padding: 12px 16px 16px">'
        + obstacles_head("6", touch=True)
        + selected_card_phone("Stair room", "Box", STAIR_FIELDS)
        + other_rows(touch=True)
        + "</div>"
    )
    phone = (
        f'<div style="width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f"{header}{stage}{phone_sheet(inside, height='flex-shrink: 0')}{tabs}</div>"
    )
    body = (
        state("Phone, 390: the stage pinched in on the stair room, its handles 22 px and each taking a press of 44 by 44 (shown faintly); the sheet at its full stop, scrolled to the list, with the card open on rows of 48 and Remove in its head", phone)
        + caption("A tap selects; a drag moves it on the roof plane once the handles are there, and one finger elsewhere orbits. The sheet scrolls; the roof's card, the roof type and the edges stand above the list.")
    )
    return card("On phone", body, gap=12)


def obstacle_board() -> str:
    width, height = 1440, OBSTACLE_HEIGHT
    column = '<div style="display: flex; flex-direction: column; gap: 16px">\n'
    grid = (
        '<div style="flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1fr) 460px; gap: 16px; align-items: start">\n'
        + column + selected_card_on_roof() + dragged_card() + handles_card() + tree_card() + "</div>\n"
        + column + add_card() + phone_card() + "</div>\n"
        + "</div>\n"
    )
    return (
        HEAD.format(
            title="Obstacle edited on the roof",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Obstacle edited on the roof",
            lead="The obstacles of the Roof lens are edited on the 3D roof as well as in the list: selected by a press, moved by a drag, sized, turned and raised by handles; added by kind, with nothing preselected. One selection for the roof and the list.",
        ).replace("@keyframes spin", "@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,176,32,.55),0 2px 6px rgba(0,0,0,.6)}50%{box-shadow:0 0 0 9px rgba(255,176,32,0),0 2px 6px rgba(0,0,0,.6)}}\n@keyframes spin")
        + grid
        + FOOT.format(width=width, height=height)
    )


if __name__ == "__main__":
    (HERE / "RoofLensTablet.dc.html").write_text(tablet_board(), encoding="utf-8")
    (HERE / "RoofLensPhone.dc.html").write_text(phone_board(), encoding="utf-8")
    (HERE / "ObstacleOnRoof.dc.html").write_text(obstacle_board(), encoding="utf-8")
    print("RoofLensTablet.dc.html, RoofLensPhone.dc.html, ObstacleOnRoof.dc.html")
