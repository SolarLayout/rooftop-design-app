"""Writes three boards of Phase 5, step 0 (plan/phase-05-plan.md): ArrayLensStates.dc.html, "Studio, Array
lens, states"; RoofTypes3D.dc.html, "Roof types in 3D"; ImportHeights.dc.html, "Import with missing heights".

The first shows what the Array lens does while a run computes, while an edit is on its way and when a layout
failed; the module card with its coefficient line and Replace; the mounting and spacing fields of each roof
type; the switches off; the shade-free window. The second draws the east-west and the sloped roof in 3D and
the plan view, from the engine's own positions: roof_types_positions.json beside this file holds what
`rooftop_core.placement.place` answered for the Pune demo (and for the L-shaped roof of the third board), so
the boards can be written again without the engine. The third shows Import a drawing, the heights a DXF could
not give reviewed one by one, and the obstacles without a height on the roof.

The 3D is the projection of build_lenses.py (the matrices A to F and ZK), applied to every corner of every
module. Every value is one of docs/design/design-tokens.md; the 3D takes the scene palette of the same
document. The words of the engine and the numbers of the Pune demo are the real ones.

Run it in this folder: python3 build_phase5_array_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json
import math

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    BAR,
    CHEVRON,
    CHROME,
    CLOSE,
    COLUMNS,
    CONTROL,
    CONTROL_ACTIVE,
    DISPLAY,
    DOWNLOAD,
    FOLDER,
    FOOT,
    GROUND,
    HEAD,
    HERE,
    HOME,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE_LINE,
    NOTE_SURFACE,
    PLUS,
    SHADOW_CARD,
    SHADOW_FLOAT,
    SHADOW_PANEL,
    SHADOW_RAISED,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    TICK,
    UPLOAD,
    WELL,
    bone,
    card,
    cells,
    drop,
    icon,
    icon_button,
    last_cell,
    menu_row,
    note,
    primary,
    quiet,
    ring,
    ring_of,
    secondary,
    section,
    state,
    toast,
    two_lines,
)
from build_phase4_boards import SHADOW_HANDLE, TEXT_SHADOW, floating
from build_phase4_obstacles_by_hand import BIN, BOX, POINTER, TANK, disabled_primary, height_field

POSITIONS = json.loads((HERE / "roof_types_positions.json").read_text(encoding="utf-8"))

# The projection of build_lenses.py: a point (x east, y north, z up) of the roof's metres lands on the screen
# at (E + A x + C y, F + B x + D y - ZK z).
A, B, C, D, ZK, E, F = 8.154, -2.187, -3.807, -4.680, 7.371, 180.0, 470.0
# The shadow's shift on the roof per metre of height, east and north, at 10:30 on the design day (build_lenses).
SHIFT = (-0.75, 1.0)
GROUND_DEPTH = 6.0  # the building's mass below the roof, metres
PITCH_DEG = 10.0
FLUSH_M = 0.1
MODULE_AREA = 2.58

# The 3D scene palette of design-tokens.md.
ROOF = "#D3D6DB"
PARAPET_CAP, PARAPET_LIT, PARAPET_SHADE = "#ECEEF0", "#B9BEC6", "#8E95A0"
WALL_LIT, WALL_SHADE = "#4A5262", "#2E3440"
OBSTACLE_TOP, OBSTACLE_LIT, OBSTACLE_SHADE = "#F1F2F4", "#C2C7CF", "#868D99"
GLASS, FRAME = "#16294D", "#33558C"
SHADOW = "#0B1220"
GRID_LINE = "#1B222D"
UNUSED = "#8C93A0"

CHART = '<path d="M5 20V10M12 20V4M19 20v-7"/>'
FILE = '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>'
SEARCH = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>'

ARRAY_STATES_HEIGHT = 3340
ROOF_TYPES_HEIGHT = 2240
IMPORT_HEIGHT = 2720

# The obstacles of the demo, as demo-numbers.md lists them (centre x, y, size, height).
DEMO_OBSTACLES = (
    [("box", 22.5, 18.0, 5.0, 4.0, 3.0), ("cylinder", 62.0, 24.0, 2.5, 2.5, 2.0)]
    + [("box", 70.75 + 3 * i, 3.5, 1.5, 1.0, 1.2) for i in range(4)]
)
IMPORTED_OBSTACLES = [
    ("box", 12.0, 12.0, 4.0, 3.0, 1.0),
    ("box", 55.0, 40.0, 8.0, 5.0, 1.0),
    ("box", 30.0, 22.0, 6.0, 2.0, 1.0),
    ("cylinder", 60.0, 10.0, 1.0, 1.0, 0.8),
]


# --------------------------------------------------------------------------------------------------
# Geometry
# --------------------------------------------------------------------------------------------------


def hull(pts):
    pts = sorted(set((round(x, 3), round(y, 3)) for x, y in pts))
    if len(pts) < 3:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0:
            up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]


def rect_pts(cx, cy, w, h):
    return [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]


def circle_pts(cx, cy, r, n=24):
    return [(cx + r * math.cos(2 * math.pi * k / n), cy + r * math.sin(2 * math.pi * k / n)) for k in range(n)]


def cast(pts, heights):
    """The shadow of a thing on the roof: the hull of its plan and of its plan shifted by the sun's shift
    times each corner's height."""
    return hull(list(pts) + [(x + SHIFT[0] * h, y + SHIFT[1] * h) for (x, y), h in zip(pts, heights)])


def footprint(kind, cx, cy, w, h):
    return circle_pts(cx, cy, w / 2) if kind == "cylinder" else rect_pts(cx, cy, w, h)


def area(ring):
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]))) / 2


def depth(x, y):
    """How far a point is from the viewer: larger is further, and is drawn first."""
    return -B * x - D * y


class Scene:
    """The 3D of one roof: the engine's layout, drawn with the projection of build_lenses.py."""

    def __init__(self, kind: str):
        self.data = POSITIONS[kind]
        self.outline = [tuple(p) for p in self.data["outline"]]
        self.parapet = self.data["parapet_h"]
        self.pitched = kind == "sloped_flush"
        self.obstacles = IMPORTED_OBSTACLES if kind == "imported" else DEMO_OBSTACLES
        ys = [y for _, y in self.outline]
        self.mid_y = sum(ys) / len(ys)

    def roof_z(self, y: float) -> float:
        """The roof surface: flat, or pitched about the line through its centroid (plan decision 3), the
        north edge higher."""
        return (y - self.mid_y) * math.tan(math.radians(PITCH_DEG)) if self.pitched else 0.0

    def screen(self, x, y, z=0.0):
        return E + A * x + C * y, F + B * x + D * y - ZK * z

    def on_roof(self, x, y, above=0.0):
        return self.screen(x, y, self.roof_z(y) + above)

    def edges(self):
        n = len(self.outline)
        for i in range(n):
            a, b = self.outline[i], self.outline[(i + 1) % n]
            nx, ny = b[1] - a[1], -(b[0] - a[0])  # the outward normal of a counter-clockwise outline
            yield a, b, (nx, ny)

    @staticmethod
    def faces_viewer(normal):
        return normal[0] * B + normal[1] * D > 0

    def module_corners(self, m):
        """The four corners of a module in metres and their heights: the front pair (facing the azimuth) at
        z_low, the back pair at z_high; on a pitched roof all four lie flush on the pitch."""
        corners = [(m[0], m[1]), (m[2], m[3]), (m[4], m[5]), (m[6], m[7])]
        z_low, z_high, az = m[8], m[9], m[10]
        if self.pitched:
            return [(x, y, self.roof_z(y) + FLUSH_M) for x, y in corners]
        d = (math.sin(math.radians(az)), math.cos(math.radians(az)))
        cx, cy = sum(x for x, _ in corners) / 4, sum(y for _, y in corners) / 4
        along = sorted(range(4), key=lambda i: (corners[i][0] - cx) * d[0] + (corners[i][1] - cy) * d[1])
        return [(x, y, z_low if i in along[2:] else z_high) for i, (x, y) in enumerate(corners)]


def fmt(pts):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)


def ring_path(ringd, to_screen) -> str:
    """A polygon with holes (the parapet's keep-out is the roof less its middle) as one path, drawn even-odd."""
    d = "".join("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in (to_screen(px, py) for px, py in ring)) + " Z" for ring in [ringd["outer"], *ringd["holes"]])
    return f'<path d="{d}" fill-rule="evenodd" fill="{ACCENT}" fill-opacity="0.18" stroke="{ACCENT}" stroke-width="0.8" stroke-dasharray="5 3"/>'


def view_box(points, width, height, pad=(0.04, 0.04, 0.04, 0.04)):
    """A viewBox of the crop's aspect that holds every point, with the padding (left, top, right, bottom)
    as shares of the box."""
    xs, ys = [x for x, _ in points], [y for _, y in points]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = (x1 - x0) / (1 - pad[0] - pad[2]), (y1 - y0) / (1 - pad[1] - pad[3])
    if w / h < width / height:
        w = h * width / height
    else:
        h = w * height / width
    vx = x0 - pad[0] * w - ((w * (1 - pad[0] - pad[2])) - (x1 - x0)) / 2
    vy = y0 - pad[1] * h - ((h * (1 - pad[1] - pad[3])) - (y1 - y0)) / 2
    return vx, vy, w, h


def scene_svg(kind: str, width: int, height: int, view=None, label: str = "", module_opacity: float = 1.0, marks=None, module_shadows: bool = True, unused=(), pad=(0.05, 0.1, 0.05, 0.05)):
    """The stage of the Studio for one roof type, as an SVG of the crop's size. *view* is the viewBox, or
    None to frame the building; the SVG and the mapping of scene points to pixels are returned."""
    s = Scene(kind)
    d = s.data
    outline = s.outline
    top = [(x, y, s.roof_z(y)) for x, y in outline]
    ground_pts = [(x, y, -GROUND_DEPTH) for x, y in outline]
    if view is None:
        view = view_box([s.screen(*p) for p in top + ground_pts], width, height, pad=pad)
    vx, vy, vw, vh = view
    sx = width / vw

    def px(point):
        return (point[0] - vx) * sx, (point[1] - vy) * sx

    uid = f"{kind}{width}x{height}"
    o = [f'<svg viewBox="{vx:.1f} {vy:.1f} {vw:.1f} {vh:.1f}" width="{width}" height="{height}" role="img" aria-label="{label}" style="position: absolute; left: 0; top: 0">']
    o.append(
        f'<defs><pattern id="grid-{uid}" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M 10 0 L 0 0 L 0 10" fill="none" stroke="{GRID_LINE}" stroke-width="0.12"/></pattern>'
        f'<radialGradient id="fade-{uid}" cx="50%" cy="52%" r="62%"><stop offset="55%" stop-color="{GROUND}" stop-opacity="0"/><stop offset="100%" stop-color="{GROUND}" stop-opacity="1"/></radialGradient>'
        f'<clipPath id="roof-{uid}"><polygon points="{fmt(s.screen(*p) for p in top)}"/></clipPath></defs>'
    )
    # The ground, six metres down, with the building's shadow on it.
    building_shadow = cast(outline, [GROUND_DEPTH + s.roof_z(y) + s.parapet for _, y in outline])
    o.append(
        f'<g transform="matrix({A} {B} {C} {D} {E} {F + GROUND_DEPTH * ZK:.2f})"><rect x="-80" y="-60" width="260" height="180" fill="url(#grid-{uid})"/>'
        f'<polygon points="{fmt(building_shadow)}" fill="#05070A" opacity="0.7"/></g>'
    )
    o.append(f'<rect x="{vx:.1f}" y="{vy:.1f}" width="{vw:.1f}" height="{vh:.1f}" fill="url(#fade-{uid})"/>')
    # The walls the viewer sees, far ones first; the parapet's outer face is the wall's top.
    walls = []
    for a, b, n in s.edges():
        if s.faces_viewer(n):
            face = [(a[0], a[1], -GROUND_DEPTH), (b[0], b[1], -GROUND_DEPTH), (b[0], b[1], s.roof_z(b[1]) + s.parapet), (a[0], a[1], s.roof_z(a[1]) + s.parapet)]
            foot = [(a[0], a[1], -GROUND_DEPTH), (b[0], b[1], -GROUND_DEPTH), (b[0], b[1], -GROUND_DEPTH + 0.4), (a[0], a[1], -GROUND_DEPTH + 0.4)]
            lit = n[1] < 0
            walls.append((depth((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), face, foot, lit))
    for _, face, foot, lit in sorted(walls, key=lambda w: -w[0]):
        o.append(f'<polygon points="{fmt(s.screen(*p) for p in face)}" fill="{WALL_LIT if lit else WALL_SHADE}"/>')
        o.append(f'<polygon points="{fmt(s.screen(*p) for p in foot)}" fill="{"#343A47" if lit else "#22272F"}"/>')
    # The roof surface and the setback line.
    o.append(f'<polygon points="{fmt(s.screen(*p) for p in top)}" fill="{ROOF}"/>')
    for ringd in d["inner"]:
        o.append(f'<polygon points="{fmt(s.on_roof(x, y) for x, y in ringd["outer"])}" fill="none" stroke="{PARAPET_SHADE}" stroke-width="0.7" stroke-dasharray="4 3"/>')
    # The parapet's inner faces and the caps of the far edges.
    far_caps, near_caps = [], []
    if s.parapet > 0:
        for a, b, n in s.edges():
            length = math.hypot(n[0], n[1])
            inset = (-n[0] / length * 0.2, -n[1] / length * 0.2)
            cap = [(a[0], a[1], s.parapet), (b[0], b[1], s.parapet), (b[0] + inset[0], b[1] + inset[1], s.parapet), (a[0] + inset[0], a[1] + inset[1], s.parapet)]
            if s.faces_viewer(n):
                near_caps.append(cap)
            else:
                face = [(a[0], a[1], 0), (b[0], b[1], 0), (b[0], b[1], s.parapet), (a[0], a[1], s.parapet)]
                o.append(f'<polygon points="{fmt(s.screen(*p) for p in face)}" fill="{PARAPET_LIT if n[1] > 0 else PARAPET_SHADE}"/>')
                far_caps.append(cap)
    for cap in far_caps:
        o.append(f'<polygon points="{fmt(s.screen(*p) for p in cap)}" fill="{PARAPET_CAP}"/>')
    # Kept-clear areas, from the engine, and the shadows on the roof.
    o.append(f'<g clip-path="url(#roof-{uid})">')
    for ringd in d["keepout"]:
        o.append(ring_path(ringd, s.on_roof))
    o.append(f'<g opacity="0.36" fill="{SHADOW}">')
    if s.parapet > 0:
        for a, b, n in s.edges():
            if s.faces_viewer(n):
                o.append(f'<polygon points="{fmt(s.on_roof(x, y) for x, y in cast([a, b], [s.parapet, s.parapet]))}"/>')
    for kind_, cx, cy, w, h, hh in s.obstacles:
        o.append(f'<polygon points="{fmt(s.on_roof(x, y) for x, y in cast(footprint(kind_, cx, cy, w, h), [hh] * (24 if kind_ == "cylinder" else 4)))}"/>')
    if module_shadows and not s.pitched:
        for m in d["modules"]:
            corners = s.module_corners(m)
            o.append(f'<polygon points="{fmt(s.on_roof(x, y) for x, y in cast([(x, y) for x, y, _ in corners], [z for _, _, z in corners]))}"/>')
    o.append("</g></g>")
    # Modules and obstacles, far to near.
    items = []
    for i, m in enumerate(d["modules"]):
        corners = s.module_corners(m)
        cx, cy = sum(x for x, _, _ in corners) / 4, sum(y for _, y, _ in corners) / 4
        fill = UNUSED if i in unused else GLASS
        items.append((depth(cx, cy), f'<polygon points="{fmt(s.screen(*p) for p in corners)}" fill="{fill}" stroke="{FRAME}" stroke-width="0.5"/>'))
    for k, (kind_, cx, cy, w, h, hh) in enumerate(s.obstacles):
        base = footprint(kind_, cx, cy, w, h)
        parts = []
        if kind_ == "cylinder":
            side = hull([s.on_roof(x, y) for x, y in base] + [s.on_roof(x, y, hh) for x, y in base])
            parts.append(f'<polygon points="{fmt(side)}" fill="#9AA1AC"/>')
            parts.append(f'<polygon points="{fmt(s.on_roof(x, y, hh) for x, y in base)}" fill="{PARAPET_CAP}"/>')
        else:
            n_ = len(base)
            for i in range(n_):
                a, b = base[i], base[(i + 1) % n_]
                normal = (b[1] - a[1], -(b[0] - a[0]))
                if s.faces_viewer(normal):
                    face = [s.on_roof(*a), s.on_roof(*b), s.on_roof(b[0], b[1], hh), s.on_roof(a[0], a[1], hh)]
                    parts.append(f'<polygon points="{fmt(face)}" fill="{OBSTACLE_LIT if normal[1] < 0 else OBSTACLE_SHADE}"/>')
            parts.append(f'<polygon points="{fmt(s.on_roof(x, y, hh) for x, y in base)}" fill="{OBSTACLE_TOP}"/>')
        if marks and k in marks:
            look = marks[k]
            dash = "" if look == "selected" else ' stroke-dasharray="4 3"'
            parts.append(f'<polygon points="{fmt(s.on_roof(x, y, hh) for x, y in base)}" fill="none" stroke="{ACCENT}" stroke-width="1.6"{dash}/>')
        items.append((depth(cx, cy), "".join(parts)))
    items.sort(key=lambda it: -it[0])
    o.append(f'<g opacity="{module_opacity}">' if module_opacity < 1 else "<g>")
    o.extend(svg for _, svg in items)
    o.append("</g>")
    for cap in near_caps:
        o.append(f'<polygon points="{fmt(s.screen(*p) for p in cap)}" fill="{PARAPET_CAP}"/>')
    o.append("</svg>")
    return "\n".join(o), px, s


def title_line(title: str, sub: str, dim: bool = False, shadow: bool = False) -> str:
    fade = f'<div style="display: flex; align-items: center; gap: 8px; color: {TEXT_2}; font-size: 13px"><span style="opacity: 0.55">{sub}</span>{ring(16)}</div>' if dim else f'<div style="color: {TEXT_2}; font-size: 13px">{sub}</div>'
    glow = "; text-shadow: 0 1px 8px rgba(0,0,0,0.8)" if shadow else ""
    return (
        f'<div style="position: absolute; z-index: 1; left: 24px; top: 20px; display: flex; flex-direction: column; gap: 2px{glow}">'
        f'<div style="{DISPLAY}; font-size: 26px; line-height: 32px; letter-spacing: -0.02em">{title}</div>{fade}</div>'
    )


def view_controls(plan: bool = False) -> str:
    seg_on = f"background: {CONTROL_ACTIVE}; border: 0; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)"
    seg_off = f"background: transparent; border: 0; border-radius: 7px; color: {TEXT_2}; font-size: 13px; cursor: pointer"
    raised = f"background: {CONTROL}; border: 1px solid {LINE}; border-radius: 10px; cursor: pointer; box-shadow: {SHADOW_RAISED}"
    turn = "" if plan else '<g transform="rotate(25 12 12)">'
    turn_end = "" if plan else "</g>"
    return (
        '<div style="position: absolute; z-index: 1; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">'
        f'<div role="group" aria-label="View" style="display: flex; gap: 2px; padding: 3px; background: {WELL}; border: 1px solid {LINE}; border-radius: 10px; box-shadow: {SHADOW_WELL}">'
        f'<button aria-pressed="{"false" if plan else "true"}" style="height: 30px; padding: 0 14px; {seg_off if plan else seg_on}">3D</button>'
        f'<button aria-pressed="{"true" if plan else "false"}" style="height: 30px; padding: 0 14px; {seg_on if plan else seg_off}">Plan</button></div>'
        f'<button style="height: 38px; padding: 0 14px; font-size: 13px; color: {TEXT_2}; {raised}">Fit</button>'
        f'<button aria-label="North up" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; {raised}">'
        f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">{turn}<path d="M12 2.5 15 9H9z" fill="{ACCENT}"/><path d="M9.5 19v-7l5 7v-7" stroke="{TEXT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>{turn_end}</svg></button></div>'
    )


def dimension(x: float, y: float, words: str, turn: float) -> str:
    return (
        f'<div style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; transform: translate(-50%, -50%) rotate({turn}deg); {MONO}; font-size: 12px; color: {TEXT_2}; white-space: nowrap">{words}</div>'
    )


def stage(width: int, height: int, inside: str) -> str:
    return (
        f'<div style="position: relative; width: {width}px; height: {height}px; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px">'
        f"{inside}</div>"
    )


def dimensions_of(px, s: Scene, length: str, width_: str, long_edge, short_edge) -> str:
    """The two labels along the near edges of a rectangular roof, as Main.dc.html places them."""
    (ax, ay), (bx, by) = long_edge
    mx, my = px(s.screen((ax + bx) / 2, (ay + by) / 2, -1.6))
    (cx, cy), (dx, dy) = short_edge
    nx, ny = px(s.screen((cx + dx) / 2, (cy + dy) / 2, -1.6))
    return dimension(mx, my, length, -15) + dimension(nx, ny, width_, 51)


# --------------------------------------------------------------------------------------------------
# The stage crops of the three roof types
# --------------------------------------------------------------------------------------------------


def obstacle_marks(px, s: Scene, marks) -> str:
    """Over the stage: a note mark above each obstacle whose height is to review, and the callout of the
    selected one, joined to it by a dot and a short line, at its right so that it covers no mark."""
    out = ""
    for k, look in marks.items():
        kind_, cx, cy, w, h, hh = s.obstacles[k]
        x, y = px(s.on_roof(cx, cy, hh))
        if look == "selected":
            out += (
                f'<div style="position: absolute; left: {x + 4:.0f}px; top: {y - 4:.0f}px; width: 14px; height: 1px; background: {ACCENT}"></div>'
                f'<div style="position: absolute; left: {x - 4:.0f}px; top: {y - 8:.0f}px; width: 9px; height: 9px; border-radius: 50%; background: {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.25)"></div>'
                f'<div style="position: absolute; left: {x + 18:.0f}px; top: {y - 30:.0f}px; display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">'
                f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500">{icon(BOX, 16, ACCENT)}Lift shaft · selected</div>'
                f'<div style="font-size: 12px; color: {TEXT_2}">4.0 × 3.0 m · height to review</div></div>'
            )
        else:
            out += f'<div style="position: absolute; left: {x - 7:.0f}px; top: {y - 24:.0f}px; display: flex" title="Height to review">{note(14)}</div>'
    return out


def three_d_crop(kind: str, width: int, height: int, sub: str, marks=None, module_opacity: float = 1.0, title: str = "Array", dim: bool = False, extra: str = "", labels: bool = True, controls: bool = True, pad=(0.05, 0.1, 0.05, 0.05)) -> str:
    label = {
        "flat_tilted": "3D view of the Pune demo roof: six rows of tilted modules, a stair room, a water tank and four AC units with their shadows",
        "flat_ew": "3D view of the Pune demo roof with east-west units: pairs of modules back to back along a ridge, tilted 10 degrees each way",
        "sloped_flush": "3D view of the Pune demo roof pitched 10 degrees to the south, the modules flush on the pitch",
        "imported": "3D view of an L-shaped roof from a DXF with four obstacles, three of them without a height",
    }[kind]
    svg, px, s = scene_svg(kind, width, height, label=label, marks=marks, module_opacity=module_opacity, pad=pad)
    dims = obstacle_marks(px, s, marks) if marks else ""
    if labels and kind != "imported":
        dims = dimensions_of(px, s, "90.0 m", "40.0 m", ((0, 0), (90, 0)), ((0, 0), (0, 40)))
    return stage(width, height, svg + dims + title_line(title, sub, dim=dim, shadow=not controls) + (view_controls() if controls else "") + extra)


def plan_crop(kind: str, width: int, height: int, sub: str, scale: float = 9.0) -> str:
    """The same scene seen straight down: an orthographic drawing, x east to the right, y north up."""
    s = Scene(kind)
    d = s.data
    xs, ys = [x for x, _ in s.outline], [y for _, y in s.outline]
    roof_w, roof_h = (max(xs) - min(xs)) * scale, (max(ys) - min(ys)) * scale
    ox, oy = (width - roof_w) / 2, (height - roof_h) / 2 + 14

    def px(x, y):
        return ox + (x - min(xs)) * scale, oy + (max(ys) - y) * scale

    def pts(ring):
        return " ".join(f"{px(x, y)[0]:.1f},{px(x, y)[1]:.1f}" for x, y in ring)

    step = 10 * scale
    grid = "".join(f'<path d="M{x:.1f} 0V{height}" stroke="{LINE_SUBTLE}" stroke-width="1"/>' for x in _ticks(ox, width, step)) + "".join(
        f'<path d="M0 {y:.1f}H{width}" stroke="{LINE_SUBTLE}" stroke-width="1"/>' for y in _ticks(oy, height, step)
    )
    o = [f'<svg viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="Plan of the Pune demo roof, north up: six rows of modules, the setback line, the kept-clear areas and the obstacles" style="position: absolute; left: 0; top: 0">']
    o.append(f'<defs><clipPath id="plan-roof"><polygon points="{pts(s.outline)}"/></clipPath></defs>')
    o.append(f'<rect width="{width}" height="{height}" fill="{GROUND}"/>{grid}')
    o.append(f'<polygon points="{pts(s.outline)}" fill="{ROOF}"/>')
    if s.parapet > 0:
        o.append(f'<polygon points="{pts(s.outline)}" fill="none" stroke="{PARAPET_CAP}" stroke-width="{0.2 * scale:.1f}" clip-path="url(#plan-roof)"/>')
    for ringd in d["inner"]:
        o.append(f'<polygon points="{pts(ringd["outer"])}" fill="none" stroke="{PARAPET_SHADE}" stroke-width="0.8" stroke-dasharray="4 3"/>')
    o.append('<g clip-path="url(#plan-roof)">')
    for ringd in d["keepout"]:
        o.append(ring_path(ringd, px))
    o.append(f'<g opacity="0.36" fill="{SHADOW}">')
    if s.parapet > 0:
        for a, b, n in s.edges():
            if s.faces_viewer(n):
                o.append(f'<polygon points="{pts(cast([a, b], [s.parapet, s.parapet]))}"/>')
    for kind_, cx, cy, w, h, hh in s.obstacles:
        o.append(f'<polygon points="{pts(cast(footprint(kind_, cx, cy, w, h), [hh] * (24 if kind_ == "cylinder" else 4)))}"/>')
    for m in d["modules"]:
        corners = s.module_corners(m)
        o.append(f'<polygon points="{pts(cast([(x, y) for x, y, _ in corners], [z for _, _, z in corners]))}"/>')
    o.append("</g></g>")
    for m in d["modules"]:
        o.append(f'<polygon points="{pts([(m[0], m[1]), (m[2], m[3]), (m[4], m[5]), (m[6], m[7])])}" fill="{GLASS}" stroke="{FRAME}" stroke-width="0.5"/>')
    for kind_, cx, cy, w, h, hh in s.obstacles:
        o.append(f'<polygon points="{pts(footprint(kind_, cx, cy, w, h))}" fill="{OBSTACLE_TOP}" stroke="{OBSTACLE_SHADE}" stroke-width="0.6"/>')
    o.append("</svg>")
    lx, ly = px((min(xs) + max(xs)) / 2, min(ys))
    wx, wy = px(min(xs), (min(ys) + max(ys)) / 2)
    labels = dimension(lx, ly + 16, "90.0 m", 0) + dimension(wx - 18, wy, "40.0 m", -90)
    bar = (
        f'<div style="position: absolute; left: 24px; bottom: 20px; display: flex; flex-direction: column; gap: 3px"><code style="font-size: 12px; {TEXT_SHADOW}">10 m</code>'
        f'<div style="width: {10 * scale:.0f}px; height: 5px; box-sizing: border-box; border: 2px solid {TEXT}; border-top: 0"></div></div>'
    )
    return stage(width, height, "\n".join(o) + labels + bar + title_line("Array", sub) + view_controls(plan=True))


def _ticks(centre: float, extent: int, step: float) -> list[float]:
    ticks = []
    at = centre
    while at > 0:
        at -= step
    while at < extent:
        ticks.append(at)
        at += step
    return ticks


def layout_line(kind: str) -> str:
    d = POSITIONS[kind]
    return f"{d['n_modules']:,} positions · {d['table_count']} tables · {d['n_rows']} rows · {round(d['n_modules'] * MODULE_AREA):,} m² of modules"


def roof_types_board() -> str:
    width, height = 1440, ROOF_TYPES_HEIGHT
    ew = three_d_crop("flat_ew", 1000, 520, layout_line("flat_ew"))
    sloped = three_d_crop("sloped_flush", 1000, 520, layout_line("sloped_flush"))
    plan = plan_crop("flat_tilted", 1000, 520, "790 positions · 28 tables · 6 rows · 1,646 m² of modules")
    ew_d, sl_d = POSITIONS["flat_ew"], POSITIONS["sloped_flush"]
    body = (
        '<div style="display: flex; flex-direction: column; gap: 16px">'
        + card(
            "Flat, east-west · 940 positions",
            state(
                f"Every position of the engine: {ew_d['n_modules']} modules in {ew_d['n_rows']} units of two lines back to back along a ridge, each side tilted {ew_d['tilt']:.0f}° away from it, "
                f"the ridge gap of 0.30 m between them, the units {ew_d['pitch']:.2f} m apart; the roof, the parapet, the setback and the obstacles as the Array lens draws them, the sun at 10:30 on the design day",
                ew,
            )
            + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The engine says: {ew_d["notes"][0]} The title line counts what the layout answered: positions, tables, rows (a row is a unit of two lines here), and the modules\' area at 2.58 m² each.</p>',
            gap=12,
        )
        + card(
            "Sloped, flush · 1,068 positions",
            state(
                f"The roof pitched {PITCH_DEG:.0f}° toward the south about the line through its centroid, the north edge higher, no parapet; the building's walls rise to the pitched edge; "
                f"{sl_d['n_modules']:,} modules flush on the pitch, 0.1 m above it, in {sl_d['n_rows']} rows {sl_d['pitch']:.2f} m apart with a walkway every four rows",
                sloped,
            )
            + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The pitch is drawn, not computed: the engine keeps treating the surface as flat for shadows and placement (plan decision 3), and the positions are its own. The setback line and the kept-clear areas lie on the pitch.</p>',
            gap=12,
        )
        + card(
            "Plan",
            state(
                "The tilted-rows layout of the Array lens seen straight down, north up: the same scene with an orthographic camera, about 9 px per metre here. The setback line, the kept-clear areas, the obstacles and their shadows at 10:30, the dimensions, the scale; Plan is taken in the view control and the north control shows north up",
                plan,
            )
            + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Plan is the same scene: nothing is drawn twice. Selection, the callouts and the time work as in 3D. It is also what stands in when there is no WebGL, with a line saying why.</p>',
            gap=12,
        )
        + "</div>"
    )
    return (
        HEAD.format(
            title="Roof types in 3D",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Roof types in 3D",
            lead="The three roof types on the stage, from the engine's positions for the Pune demo: east-west units back to back, modules flush on a pitched roof, and the plan view, which is the same scene seen from above.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# The Array lens: pieces of the inspector
# --------------------------------------------------------------------------------------------------

INSPECTOR = f"width: 384px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 22px; padding: 20px; background: {CHROME}; border: 1px solid {LINE_SUBTLE}; border-radius: 12px"
FIELD_WELL = f"background: {WELL}; border: 1px solid {LINE}; border-radius: 10px; box-shadow: {SHADOW_WELL}"
SEG_ON = f"background: {CONTROL_ACTIVE}; border: 0; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)"
SEG_OFF = f"background: transparent; border: 0; border-radius: 7px; color: {TEXT_2}; font-size: 13px; cursor: pointer"


def inspector(body: str, label: str = "Array inspector") -> str:
    return f'<div aria-label="{label}" style="{INSPECTOR}">{body}</div>'


def lens_section(title: str, body: str, gap: int = 12) -> str:
    return f'<section style="display: flex; flex-direction: column; gap: {gap}px">{section(title)}{body}</section>'


def value_of(value: str, unit: str, size: int = 15) -> str:
    return f'<div style="display: flex; align-items: baseline; gap: 4px; {MONO}"><span style="font-weight: 500; font-size: {size}px">{value}</span><span style="color: {TEXT_2}; font-size: 12px">{unit}</span></div>'


def slider(label_: str, value: str, unit: str, at: float, hint: str = "", dragging: bool = False, name: str = "") -> str:
    """A slider as the kit draws it: the label at the left of the value, the track of 4 with the filled part
    in accent, the handle of 18 with its accent border; a hint under the track."""
    name = name or label_.lower().replace(" ", "-")
    halo = "; box-shadow: 0 0 0 6px rgba(255,176,32,0.18)" if dragging else f"; box-shadow: {SHADOW_HANDLE}"
    pointer = f'<div style="position: absolute; left: calc({at * 100:.1f}% + 4px); top: 12px">{POINTER}</div>' if dragging else ""
    return (
        '<div style="display: flex; flex-direction: column; gap: 6px">'
        f'<div style="display: flex; align-items: center; justify-content: space-between"><span id="{name}-label" style="color: {TEXT_2}">{label_}</span>{value_of(value, unit)}</div>'
        f'<div role="slider" tabindex="0" aria-labelledby="{name}-label" aria-valuetext="{value}{unit}" style="position: relative; height: 20px">'
        f'<div style="position: absolute; left: 0; right: 0; top: 8px; height: 4px; border-radius: 2px; background: {LINE}"></div>'
        f'<div style="position: absolute; left: 0; width: {at * 100:.1f}%; top: 8px; height: 4px; border-radius: 2px; background: {ACCENT}"></div>'
        f'<div style="position: absolute; left: calc({at * 100:.1f}% - 9px); top: 1px; width: 18px; height: 18px; box-sizing: border-box; border-radius: 50%; background: {TEXT}; border: 3px solid {ACCENT}{halo}"></div>{pointer}</div>'
        + (f'<div style="font-size: 12px; color: {TEXT_3}">{hint}</div>' if hint else "")
        + "</div>"
    )


def segmented_row(label_: str, options: tuple[str, ...], taken: str, pad: int = 14) -> str:
    buttons = "".join(
        f'<button aria-pressed="{"true" if name == taken else "false"}" style="height: 30px; padding: 0 {pad}px; {SEG_ON if name == taken else SEG_OFF}">{name}</button>'
        for name in options
    )
    return (
        '<div style="display: flex; align-items: center; justify-content: space-between; height: 40px">'
        f'<span style="color: {TEXT_2}">{label_}</span>'
        f'<div role="group" aria-label="{label_}" style="display: flex; gap: 2px; padding: 3px; {FIELD_WELL}">{buttons}</div></div>'
    )


def stepper_row(label_: str, value: str, name: str) -> str:
    return (
        '<div style="display: flex; align-items: center; justify-content: space-between; height: 40px">'
        f'<label for="{name}" style="color: {TEXT_2}">{label_}</label>'
        f'<div style="display: flex; align-items: center; gap: 2px; padding: 3px; {FIELD_WELL}">'
        f'<button aria-label="Fewer" style="width: 30px; height: 30px; background: transparent; border: 0; border-radius: 7px; color: {TEXT_2}; font-size: 16px; cursor: pointer">−</button>'
        f'<input id="{name}" value="{value}" inputmode="numeric" style="width: 36px; height: 30px; box-sizing: border-box; background: transparent; border: 0; text-align: center; {MONO}; font-weight: 500">'
        f'<button aria-label="More" style="width: 30px; height: 30px; background: transparent; border: 0; border-radius: 7px; color: {TEXT_2}; font-size: 16px; cursor: pointer">+</button></div></div>'
    )


def field_row(label_: str, value: str, unit: str, name: str, width: int = 48) -> str:
    return (
        '<div style="display: flex; align-items: center; justify-content: space-between; height: 40px">'
        f'<label for="{name}" style="color: {TEXT_2}">{label_}</label>'
        f'<div style="display: flex; align-items: center; gap: 6px; height: 36px; box-sizing: border-box; padding: 0 12px; {FIELD_WELL}">'
        f'<input id="{name}" value="{value}" inputmode="decimal" style="width: {width}px; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500"><span style="color: {TEXT_2}; font-size: 12px">{unit}</span></div></div>'
    )


def switch(on: bool, label_: str) -> str:
    if on:
        return f'<button role="switch" aria-checked="true" aria-label="{label_}" style="width: 44px; height: 26px; flex-shrink: 0; padding: 3px; display: flex; justify-content: flex-end; background: {ACCENT}; border: 0; border-radius: 13px; cursor: pointer; box-shadow: inset 0 1px 3px rgba(0,0,0,0.45)"><span style="width: 20px; height: 20px; border-radius: 50%; background: {ACCENT_INK}; box-shadow: 0 1px 3px rgba(0,0,0,0.5)"></span></button>'
    return f'<button role="switch" aria-checked="false" aria-label="{label_}" style="width: 44px; height: 26px; flex-shrink: 0; padding: 3px; display: flex; justify-content: flex-start; background: {LINE_STRONG}; border: 0; border-radius: 13px; cursor: pointer; box-shadow: inset 0 1px 3px rgba(0,0,0,0.45)"><span style="width: 20px; height: 20px; border-radius: 50%; background: {TEXT_2}; box-shadow: 0 1px 3px rgba(0,0,0,0.5)"></span></button>'


def switch_row(label_: str, value: str, hint: str, on: bool, name: str) -> str:
    """A value the engine decides while the switch is on: the value beside its label, the rule under."""
    shown = f'<span style="{MONO}; font-weight: 500; font-size: 15px">{value}</span>' if value else ""
    return (
        '<div style="display: flex; align-items: center; gap: 12px">'
        '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px">'
        f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="color: {TEXT_2}">{label_}</span>{shown}</div>'
        f'<div style="font-size: 12px; color: {TEXT_3}">{hint}</div></div>{switch(on, name)}</div>'
    )


def switch_field_row(label_: str, value: str, unit: str, hint: str, name: str, unit_width: int = 48) -> str:
    """The same with the switch off: the value is a field, and what the engine would have chosen is said."""
    return (
        '<div style="display: flex; align-items: center; gap: 12px">'
        '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px">'
        f'<div style="display: flex; align-items: center; justify-content: space-between"><label for="{name}" style="color: {TEXT_2}">{label_}</label>'
        f'<div style="display: flex; align-items: center; gap: 6px; height: 36px; box-sizing: border-box; padding: 0 12px; {FIELD_WELL}">'
        f'<input id="{name}" value="{value}" inputmode="decimal" style="width: {unit_width}px; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500"><span style="color: {TEXT_2}; font-size: 12px">{unit}</span></div></div>'
        f'<div style="font-size: 12px; color: {TEXT_3}">{hint}</div></div>{switch(False, label_)}</div>'
    )


def readout_row(label_: str, value: str, hint: str) -> str:
    return (
        '<div style="display: flex; flex-direction: column; gap: 2px">'
        f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="color: {TEXT_2}">{label_}</span><span style="{MONO}; font-weight: 500; font-size: 15px">{value}</span></div>'
        f'<div style="font-size: 12px; color: {TEXT_3}">{hint}</div></div>'
    )


def mounting_tilted(tilt: int = 15, dragging: bool = False) -> str:
    body = (
        slider("Tilt", str(tilt), "°", tilt / 45, "Latitude 18.5° N suggests 15°", dragging=dragging)
        + segmented_row("Orientation", ("Portrait", "Landscape"), "Portrait")
        + stepper_row("Modules in tilt", "2", "mit")
        + field_row("Lower-edge clearance", "0.50", "m", "clr")
    )
    return lens_section("Mounting", body)


def spacing_tilted() -> str:
    body = (
        switch_row("Row pitch", "6.45 m", "Shade-free · GCR 0.71 · profile angle 30.5°", True, "Keep row pitch shade-free automatically")
        + switch_row("Azimuth", "180° S", "Follows the roof edge closest to the equator", True, "Follow the roof edge")
    )
    return lens_section("Spacing", body)


def mounting_ew() -> str:
    body = (
        slider("East-west tilt", "10", "°", 10 / 30, "Each side, away from the ridge · 0 to 30°", name="ew-tilt")
        + field_row("Ridge gap", "0.30", "m", "ridge")
        + field_row("Lower-edge clearance", "0.50", "m", "clr-ew")
    )
    return lens_section("Mounting", body)


def spacing_ew() -> str:
    body = (
        switch_row("Azimuth", "180° S", "The ridges run square to the roof edge closest to the equator", True, "Follow the roof edge")
        + readout_row("Unit pitch", "2.53 m", POSITIONS["flat_ew"]["notes"][0])
    )
    return lens_section("Spacing", body)


def mounting_sloped() -> str:
    body = (
        '<div style="display: flex; flex-direction: column; gap: 2px">'
        f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="color: {TEXT_2}">Tilt</span><span style="{MONO}; font-weight: 500; font-size: 15px">10°</span></div>'
        f'<div style="font-size: 12px; color: {TEXT_3}">Follows the roof pitch · 10° facing 180° S · set in the Roof lens</div></div>'
        + segmented_row("Orientation", ("Portrait", "Landscape"), "Portrait")
        + stepper_row("Modules in tilt", "2", "mit-sloped")
    )
    return lens_section("Mounting", body)


def spacing_sloped() -> str:
    return lens_section("Spacing", readout_row("Row pitch", "4.52 m", "Rows follow each other down the pitch, 0.10 m above the roof · walkway every 4 rows"))


def range_slider(start: float, end: float, dragging: float | None = None) -> str:
    """The shade-free window: two handles on one track, from 5 to 19 solar hours in steps of a quarter."""

    def at(hour: float) -> float:
        return (hour - 5) / 14 * 100

    def clock(hour: float) -> str:
        return f"{int(hour):02d}:{int(round((hour % 1) * 60)):02d}"

    def handle(hour: float, live: bool) -> str:
        halo = "; box-shadow: 0 0 0 6px rgba(255,176,32,0.18)" if live else ""
        bubble = (
            f'<div style="position: absolute; left: {at(hour):.1f}%; top: -24px; transform: translateX(-50%); {MONO}; font-size: 12px; font-weight: 500; white-space: nowrap">{clock(hour)}</div>'
            f'<div style="position: absolute; left: calc({at(hour):.1f}% + 6px); top: 12px">{POINTER}</div>'
            if live
            else ""
        )
        return (
            f'<div role="slider" aria-valuetext="{clock(hour)} solar time" style="position: absolute; left: calc({at(hour):.1f}% - 9px); top: 1px; width: 18px; height: 18px; box-sizing: border-box; border-radius: 50%; background: {TEXT}; border: 3px solid {ACCENT}{halo}"></div>{bubble}'
        )

    ticks = "".join(
        f'<span style="position: absolute; left: {at(h):.1f}%; transform: translateX({"0" if h == 5 else "-100%" if h == 19 else "-50%"})">{h:02d}</span>' for h in (5, 8, 12, 16, 19)
    )
    return (
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        f'<div style="display: flex; align-items: baseline; justify-content: space-between"><span style="{MONO}; font-weight: 500; font-size: 15px">{clock(start)} – {clock(end)}</span><span style="font-size: 12px; color: {TEXT_3}">solar time</span></div>'
        f'<div role="group" aria-label="Shade-free window" style="position: relative; height: 20px; margin-top: {14 if dragging is not None else 0}px">'
        f'<div style="position: absolute; left: 0; right: 0; top: 8px; height: 4px; border-radius: 2px; background: {LINE}"></div>'
        f'<div style="position: absolute; left: {at(start):.1f}%; width: {at(end) - at(start):.1f}%; top: 8px; height: 4px; border-radius: 2px; background: {ACCENT}"></div>'
        + handle(start, dragging == start)
        + handle(end, dragging == end)
        + "</div>"
        f'<div style="position: relative; height: 20px; {MONO}; font-size: 11px; color: {TEXT_3}">{ticks}</div></div>'
    )


def design_day_row(taken: str = "Winter solstice") -> str:
    return segmented_row("Design day", ("Winter solstice", "21 Jun", "21 Mar"), taken, pad=10)


def shaded_row(on: bool) -> str:
    hint = "On: positions shaded inside the window are used too" if on else "Off: positions shaded inside the window stay empty"
    return switch_row("Allow shaded positions", "", hint, on, "Allow shaded positions")


def module_card(before_run: bool = False) -> str:
    """The card of the module, at the full width of the inspector: the file's names as they are (plan
    decision 14), the facts, the coefficient line with its note, the file, Replace."""
    glyph = (
        f'<div aria-hidden="true" style="width: 44px; height: 60px; flex-shrink: 0; border-radius: 4px; background: {GLASS}; border: 2px solid {FRAME}; box-sizing: border-box; display: grid; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 2px; padding: 2px"><div style="background: #1F3A69"></div><div style="background: #1F3A69"></div></div>'
    )
    if before_run:
        inside = (
            f'<div style="display: flex; gap: 14px">{glyph}<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px">{bone(150, 14)}{bone(220, 10)}{bone(170, 10)}</div></div>'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{bone(260, 10)}{bone(300, 10)}</div>'
            f'<div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: {TEXT_2}">{ring(16)}Reading the module with the first run</div>'
        )
    else:
        inside = (
            f'<div style="display: flex; gap: 14px">{glyph}<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
            '<div style="font-weight: 600">INA-144MHC-TF-560</div>'
            f'<div style="font-size: 12px; color: {TEXT_2}">INSOLATION GREEN ENERGY PVT.&nbsp;LTD. · 560&nbsp;Wp</div>'
            f'<div style="font-size: 12px; color: {TEXT_3}">2.277 × 1.133 m · bifacial 0.80</div></div></div>'
            f'<code style="font-size: 12px; color: {TEXT_2}">Voc 49.95&nbsp;V · Isc 14.30&nbsp;A · 3 diodes · twin&nbsp;half-cell</code>'
            f'<div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: {TEXT_2}"><span style="display: flex; padding-top: 3px">{note(14)}</span><span>Coefficients (one-diode model): Voc −0.164, Vmp −0.228, Pmpp −0.212 %/°C</span></div>'
            f'<div style="padding: 8px 10px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 8px; font-size: 12px; color: {TEXT_2}">Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.</div>'
            f'<code style="font-size: 12px; color: {TEXT_3}">insolation-ina-144mhc-tf-560.PAN</code>'
            f'<div style="display: flex; justify-content: flex-end"><button style="height: 36px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: {SHADOW_RAISED}">Replace</button></div>'
        )
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">{inside}</div>'
    )


# --------------------------------------------------------------------------------------------------
# The Array lens: the cards of the board
# --------------------------------------------------------------------------------------------------


def vitals_updating() -> str:
    return (
        f'<section aria-label="Design vitals, updating" style="position: absolute; left: 20px; right: 20px; bottom: 20px; {BAR}; {COLUMNS}">'
        + cells(dim=True, ring_beside=True)
        + last_cell(f"border-left: 1px solid {LINE}", ring_of(0.4, 20, 2.5, "40 percent") + two_lines("Updating energy", "Computing hourly shading for every module"))
        + "</section>"
    )


def run_computing_card() -> str:
    svg, px, s = scene_svg("flat_tilted", 1280, 430, view=(-25, 40, 980, 329.2), label="3D view of the Pune demo roof with its 790 positions in place while the energy is computed")
    dims = dimensions_of(px, s, "90.0 m", "40.0 m", ((0, 0), (90, 0)), ((0, 0), (0, 40)))
    inside = svg + dims + title_line("Array", "790 positions · 28 tables · 6 rows · 1,646 m² of modules") + view_controls() + vitals_updating()
    body = (
        state("The layout has landed: the modules of the design stand on the stage at once. The energy follows in seconds: the vitals keep the values of before, dimmed, with a ring beside the energy; the last cell says the step of the engine and how far it is", stage(1280, 430, inside))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Nothing is a skeleton here: every value was there before the edit. The step is the engine\'s own sentence; the second line of the cell is cut short where the room ends, as the vitals do. The ring beside the energy turns; the ring of the cell fills with the progress.</p>'
    )
    return card("A run computing", body, gap=12)


def failed_chip(x: int, y: int) -> str:
    return (
        f'<div role="status" style="position: absolute; z-index: 1; left: {x}px; top: {y}px; width: 380px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500">{note(16)}The layout was not updated</div>'
        f'<div style="font-size: 12px; color: {TEXT_2}">The roof outline crosses itself. Give the corners in order around the roof.</div>'
        f'<div style="display: flex; margin: 2px 0 -4px -10px">{quiet("Try again", 32)}</div></div>'
    )


def edit_and_failed_cards() -> str:
    w, h = 608, 300
    view = (-25, 60, 980, 483.6)
    dim_svg, _, _ = scene_svg("flat_tilted", w, h, view=view, label="3D view of the Pune demo roof with the modules of before while the new layout is on its way")
    updating = stage(w, h, dim_svg + title_line("Array", "790 positions · 28 tables · 6 rows · 1,646 m² of modules", dim=True) + view_controls())
    tilt = (
        f'<div style="{INSPECTOR}; width: auto; gap: 12px">'
        + lens_section("Mounting", slider("Tilt", "10", "°", 10 / 45, "Latitude 18.5° N suggests 15°", dragging=True))
        + "</div>"
    )
    edit = (
        state("The tilt slider was just let go at 10°. The title line dims with a ring beside it, and the modules of before stay on the stage", updating)
        + state("The slider, on release: the value is committed when the drag ends, not while it moves", tilt)
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Within 200 ms of release the new rows land, the title line reads the new counts and the energy follows as the card above. A drag that is broken off is given up.</p>'
    )
    failed_svg, _, _ = scene_svg("flat_tilted", w, h, view=view, label="3D view of the Pune demo roof with its last good layout; a note says the layout was not updated")
    failed = stage(w, h, failed_svg + title_line("Array", "790 positions · 28 tables · 6 rows · 1,646 m² of modules") + view_controls() + failed_chip(150, 96))
    failing = (
        state("A layout that failed: a chip floats over the stage with what failed, in the engine's words, and what to do. The last good modules stay", failed)
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The chip is the callout of the stage with the line of a note. Try again sends the same design once more; the chip goes when a layout lands, or when it is closed with Escape. The note is in the notes to review too, so it is found from the vitals.</p>'
    )
    return (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start">'
        + card("An edit updating", edit, gap=12)
        + card("A layout that failed", failing, gap=12)
        + "</div>"
    )


def replace_dialog() -> str:
    reading = drop(
        f"background: {WELL}; border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}",
        ring(20, 2.5)
        + '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px">'
        '<span style="font-weight: 500">Reading the file</span>'
        f'<code style="font-size: 12px; color: {TEXT_2}">jinko-tiger-neo-72hl4-580.PAN</code></span>',
    )
    return (
        f'<div role="dialog" aria-labelledby="rp-t" aria-describedby="rp-d" style="width: 440px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 22px 22px 20px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="rp-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Replace the module</h3>'
        + icon_button("Close", CLOSE, 32)
        + "</div>"
        f'<p id="rp-d" style="margin: 0; color: {TEXT_2}">A PAN file of PVsyst. The module of before stays until the new one is read; the layout and the energy follow.</p>'
        + reading
        + f'<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px">{quiet("Cancel")}</div></div>'
    )


def module_card_card() -> str:
    left = state("In the inspector, 384 wide: the model on the title line, the manufacturer and the Wp as the file states them, the size and the bifaciality, the facts, the coefficients with their note, the file, Replace", f'<div style="{INSPECTOR}; gap: 0">{module_card()}</div>')
    middle = (
        state("Replace: a dialog with the file drop; a PAN file was dropped and is being read", replace_dialog())
        + state("Refused: the file was no PAN. A toast says so; the equipment of before is kept (D32)", toast(note(20), "Not a PAN file · The equipment of before is kept", "", True))
    )
    right = state("Before the first run: a skeleton in the place of the facts, which come with the run, or with a file", f'<div style="{INSPECTOR}; gap: 0">{module_card(before_run=True)}</div>')
    body = (
        '<div style="display: grid; grid-template-columns: 384px minmax(0, 1fr) 384px; gap: 20px; align-items: start">'
        + left
        + f'<div style="display: flex; flex-direction: column; gap: 16px">{middle}</div>'
        + right
        + "</div>"
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The names are the file\'s (plan decision 14): a shorter name to show is the owner\'s to give. The Voc note is the engine\'s sentence, word for word, and stands in the notes to review as well. The facts come from the design\'s equipment, or from the module read when a PAN replaces it.</p>'
    )
    return card("The module card", body, gap=14)


def mounting_by_roof_type_card() -> str:
    columns = (
        '<div style="display: grid; grid-template-columns: repeat(3, 384px); gap: 16px; align-items: start">'
        + state("Tilted rows: as the Array lens on desktop", inspector(mounting_tilted() + spacing_tilted()))
        + state("East-west: the tilt of both sides, the ridge gap, the clearance; the azimuth with its switch. No orientation, no modules in tilt, no row pitch", inspector(mounting_ew() + spacing_ew()))
        + state("Sloped, flush: the tilt follows the roof pitch; orientation and modules in tilt. No tilt slider, no clearance, no azimuth, no row pitch", inspector(mounting_sloped() + spacing_sloped()))
        + "</div>"
    )
    body = columns + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The fields of the inventory by roof type (1.3): tilt 0 to 45°, east-west tilt 0 to 30°, ridge gap 0 to 2 m, clearance 0 to 3 m, modules in tilt 1 to 4. The roof type is chosen in the Roof lens; the Array lens shows the fields that apply. What the engine decides is read out under the field that would set it.</p>'
    return card("Mounting by roof type", body, gap=14)


def switches_off_card() -> str:
    body = lens_section(
        "Spacing",
        switch_field_row("Row pitch", "7.00", "m", "Shade-free would be 6.45 m", "pitch")
        + switch_field_row("Azimuth", "170", "°", "The roof edge closest to the equator faces 180° S", "azimuth", unit_width=40),
    )
    return card(
        "Spacing, the switches off",
        state("Row pitch and azimuth typed: the switch off turns each into a field, with what the engine would have chosen under it", inspector(body))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">On, the engine decides and the request carries null; off, the value typed goes to the engine. Switching off fills the field with the engine\'s last value, so nothing changes until a number is typed. Fields commit on Enter or blur; the switches at once.</p>',
        gap=12,
    )


def window_card() -> str:
    body = lens_section("Shade-free window", range_slider(9.25, 16.0, dragging=9.25) + design_day_row() + shaded_row(True))
    return card(
        "The shade-free window",
        state("The range slider, the start handle being dragged: its value stands above it while it moves, and the two values at the left follow. The design day, and shaded positions allowed", inspector(body))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Solar hours in steps of a quarter: the start from 5 to 12, the end from 12 to 19; the handles never pass each other. The ticks stand under their hours. The window and the design day set the shade-free pitch and the kept-clear areas; with shaded positions allowed the positions inside the window\'s shadows are used too.</p>',
        gap=12,
    )


def array_states_board() -> str:
    width, height = 1440, ARRAY_STATES_HEIGHT
    body = (
        '<div style="display: flex; flex-direction: column; gap: 16px">'
        + run_computing_card()
        + edit_and_failed_cards()
        + module_card_card()
        + mounting_by_roof_type_card()
        + '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start">'
        + switches_off_card()
        + window_card()
        + "</div></div>"
    )
    return (
        HEAD.format(
            title="Studio, Array lens, states",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Studio, Array lens, states",
            lead="What the Array lens shows while a run computes, while an edit is on its way and when a layout failed; the module card whole; the fields of each roof type; the switches off; the shade-free window.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Import with missing heights
# --------------------------------------------------------------------------------------------------


def switcher_open() -> str:
    trigger = (
        f'<button aria-haspopup="menu" aria-expanded="true" style="align-self: flex-start; display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; background: {SURFACE_2}; border: 1px solid {LINE}; border-radius: 10px; cursor: pointer">'
        '<span style="font-weight: 500">Pune demo roof</span>'
        f'<span style="color: {TEXT_3}; {MONO}; font-size: 12px">18.52° N · 73.86° E</span>'
        f'<span style="display: flex; transform: rotate(180deg)">{icon(CHEVRON, 16, TEXT_3)}</span></button>'
    )
    label = f"padding: 8px 10px 4px; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}"
    hollow = f'<span style="width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {TEXT_3}"></span>'
    panel = (
        f'<div style="width: 340px; box-sizing: border-box; display: flex; flex-direction: column; padding: 6px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="{label}">This design</div>'
        f'<div style="display: flex; align-items: center; gap: 10px; padding: 6px 10px 10px">{icon(TICK, 16, ACCENT, 2.4)}'
        '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">Pune demo roof</span>'
        f'<span style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: {TEXT_2}">{hollow}Not kept on this device</span></span></div>'
        f'<div style="height: 1px; margin: 0 4px; background: {LINE}"></div>'
        f'<div style="{label}">On this device</div>'
        f'<div style="padding: 2px 10px 10px; font-size: 13px; color: {TEXT_2}">Designs you save appear here.</div>'
        f'<div style="height: 1px; margin: 0 4px 4px; background: {LINE}"></div>'
        '<ul role="menu" aria-label="Project" style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px">'
        + menu_row(PLUS, "New design", "Find the roof")
        + menu_row(FOLDER, "Open a project", ".rtd")
        + menu_row(UPLOAD, "Import a drawing", "KMZ, KML, DXF", under_pointer=True)
        + menu_row(DOWNLOAD, "Save a copy", ".rtd")
        + menu_row(HOME, "Home")
        + "</ul></div>"
    )
    return f'<div style="display: flex; flex-direction: column; gap: 6px">{trigger}{panel}</div>'


def units_choice(taken: str | None) -> str:
    def one(name: str) -> str:
        if taken is None:
            return f'<button aria-pressed="false" style="height: 30px; padding: 0 16px; {SEG_OFF}">{name}</button>'
        return f'<button aria-pressed="{"true" if name == taken else "false"}" style="height: 30px; padding: 0 16px; {SEG_ON if name == taken else SEG_OFF}">{name}</button>'

    hint = "Chosen once the file is a DXF" if taken is None else "Suggested for this file. Change it if the drawing is in millimetres"
    fade = "; opacity: 0.45" if taken is None else ""
    return (
        '<div style="display: flex; align-items: center; gap: 12px">'
        f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span>DXF units</span><span style="font-size: 12px; color: {TEXT_3}">{hint}</span></div>'
        f'<div role="group" aria-label="DXF units" style="display: flex; gap: 2px; padding: 3px; {FIELD_WELL}{fade}">{one("m")}{one("mm")}</div></div>'
    )


def place_field(label_: str, value: str, unit: str) -> str:
    name = label_.lower()
    return (
        f'<div style="display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; {FIELD_WELL}">'
        f'<label for="im-{name}" style="flex-grow: 1; color: {TEXT_2}; font-size: 13px">{label_}</label>'
        f'<input id="im-{name}" value="{value}" inputmode="decimal" style="width: 76px; min-width: 0; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500">'
        f'<span style="color: {TEXT_2}; font-size: 12px; white-space: nowrap">{unit}</span></div>'
    )


def place_asked(found: bool) -> str:
    """The place of a DXF: the drawing has none, so it is searched or typed, as the roof entered by hand is."""
    search = (
        f'<div style="display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; {FIELD_WELL}">{icon(SEARCH, 16, TEXT_2)}'
        + (
            '<input aria-label="Search an address or paste coordinates" value="Hinjewadi Phase 2, Pune" style="flex-grow: 1; min-width: 0; background: transparent; border: 0; outline: 0; font-size: 14px">'
            if found
            else f'<input aria-label="Search an address or paste coordinates" value="" placeholder="Search an address or paste coordinates" style="flex-grow: 1; min-width: 0; background: transparent; border: 0; outline: 0; font-size: 14px; color: {TEXT_3}">'
        )
        + "</div>"
    )
    lat, lon = ("18.59120", "73.73840") if found else ("", "")
    hint = "From the search. Change it if the drawing is elsewhere" if found else "The drawing does not say where the roof is. Search the place, or type its coordinates"
    return (
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        f'<div style="display: flex; flex-direction: column; gap: 2px"><span>Place</span><span style="font-size: 12px; color: {TEXT_3}">{hint}</span></div>'
        + search
        + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">{place_field("Latitude", lat, "° N")}{place_field("Longitude", lon, "° E")}</div></div>'
    )


def import_dialog(held_file: str | None = None, place: str | None = None) -> str:
    """The dialog of Import a drawing: empty, or with a file held (`held_file` its name); for a DXF the place
    is asked (`place` "empty" or "found"), for a KMZ or KML it comes from the file."""
    words = '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">{title}</span>' + f'<span style="font-size: 12px; color: {TEXT_2}">{{detail}}</span></span>'
    is_dxf = held_file is not None and held_file.endswith(".dxf")
    if held_file:
        kind = "DXF" if is_dxf else "KML"
        held = drop(
            f"background: {SURFACE_2}; border: 1px solid {LINE}",
            icon(FILE, 20, ACCENT, 1.8)
            + '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px">'
            f'<code style="font-weight: 500">{held_file}</code>'
            f'<span style="font-size: 12px; color: {TEXT_2}">{kind} · 48 KB · read when the roof is opened</span></span>'
            + secondary("Choose another", 36),
        )
        ready = not is_dxf or place == "found"
        actions = quiet("Cancel") + (primary("Open the roof") if ready else disabled_primary("Open the roof"))
    else:
        held = drop(
            f"border: 1px dashed {LINE_STRONG}",
            icon(UPLOAD, 20, TEXT_2, 1.8) + words.format(title="Drop the drawing here", detail="KMZ, KML or DXF") + secondary("Choose a file", 36),
        )
        actions = quiet("Cancel") + disabled_primary("Open the roof")
    return (
        f'<div role="dialog" aria-labelledby="im-t" aria-describedby="im-d" style="width: 440px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 22px 22px 20px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="im-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Import a drawing</h3>'
        + icon_button("Close", CLOSE, 32)
        + "</div>"
        f'<p id="im-d" style="margin: 0; color: {TEXT_2}">The largest closed shape is the roof; the other closed shapes are obstacles, named by their layer. A KMZ or KML says where the roof is; a DXF does not, so its place is asked.</p>'
        + held
        + units_choice("m" if is_dxf else None)
        + (place_asked(place == "found") if is_dxf else "")
        + f'<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px">{actions}</div></div>'
    )


def import_card() -> str:
    body = (
        '<div style="display: grid; grid-template-columns: 340px 440px 440px; gap: 24px; align-items: start">'
        + state("The project switcher, Import a drawing under the pointer", switcher_open())
        + state("The dialog: the file drop, the DXF units with nothing chosen, Open the roof waiting", import_dialog())
        + state("A KML dropped: its place and heights come from the file; Open the roof", import_dialog("warehouse-roof.kml"))
        + "</div>"
        + '<div style="display: grid; grid-template-columns: 440px 440px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("A DXF dropped: m is suggested, as the inventory's default; the place is asked, empty, and Open the roof waits for it", import_dialog("warehouse-roof.dxf", "empty"))
        + state("The place found by the search fills the coordinates, as it does for a roof entered by hand; Open the roof", import_dialog("warehouse-roof.dxf", "found"))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">A DXF holds the roof\'s shape and nothing of where it is on Earth, and the place sets the sun, the shadows and the weather: so nothing is guessed (the desktop app put every DXF at its own default, Pune). The place is searched or pasted, in the words of Find, or typed; the same two fields as "Enter dimensions by hand". The API refuses a DXF without a place (<code>site_missing</code>) and the dialog never sends one without. A KMZ or KML needs no place: the block is not shown.</p>'
        + "</div>"
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The largest closed polyline is the roof; other closed polylines and circles are obstacles, named by their layer: a circle a tank, a near-rectangle a box with its turn, a line a wall, anything else a building. A KMZ or KML gives its place and heights from the placemarks; a DXF gives neither, and its units and its place are asked. Open the roof opens the design in the Studio at the Roof lens. On phone and tablet the dialog is a bottom sheet.</p>'
    )
    return card("Import a drawing", body, gap=14)


def heights_note(touch: bool = False) -> str:
    size = 15 if touch else 14
    return (
        f'<div style="display: flex; gap: 12px; padding: 12px 14px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; border-radius: 12px; box-shadow: 0 0 0 3px rgba(255,176,32,0.14)">'
        f'<span style="display: flex; padding-top: 1px">{note(20)}</span>'
        '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px">'
        f'<span style="font-weight: 500; font-size: {size}px">These obstacles have no height in the file and were set to 1.0 m.</span>'
        f'<div style="display: flex; align-items: center; gap: 12px"><span style="flex-grow: 1; font-size: 12px; color: {TEXT_2}">3 to review</span>{primary("Review", 32)}</div></div></div>'
    )


def roof_card_imported(touch: bool = False) -> str:
    glyph = (
        f'<span aria-hidden="true" style="display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; flex-shrink: 0; border-radius: 10px; background: {SURFACE_2}">'
        f'<svg width="36" height="28" viewBox="0 0 70 50" fill="{ACCENT}" fill-opacity="0.09" stroke="{ACCENT}" stroke-width="2.5" stroke-linejoin="round"><path d="M1 49V13h39V1h29v48z"/></svg></span>'
    )
    return (
        f'<div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">{glyph}'
        '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0">'
        '<code style="font-weight: 500; font-size: 12px; white-space: nowrap">18.59120° N, 73.73840° E</code>'
        f'<div style="font-size: 12px; color: {TEXT_2}">From a file · 6 corners · 4 obstacles</div>'
        f'<code style="font-size: 12px; color: {TEXT_2}">warehouse-roof.dxf</code></div>'
        + ("" if touch else f'<button style="height: 36px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 9px; font-size: 13px; cursor: pointer; box-shadow: {SHADOW_RAISED}">Edit</button>')
        + "</div>"
    )


def small_field(label_: str, value: str, unit: str, name: str, focus: bool = False, touch: bool = False) -> str:
    look = f"border: 1px solid {ACCENT}; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)" if focus else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
    return (
        f'<div style="display: flex; align-items: center; gap: 6px; height: {44 if touch else 40}px; box-sizing: border-box; padding: 0 12px; background: {WELL}; border-radius: 10px; {look}">'
        f'<label for="{name}" style="flex-grow: 1; color: {TEXT_2}; font-size: 13px; white-space: nowrap">{label_}</label>'
        f'<input id="{name}" value="{value}" inputmode="decimal" style="width: 48px; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500">'
        + (f'<span style="color: {TEXT_2}; font-size: 12px">{unit}</span>' if unit else "")
        + "</div>"
    )


def open_obstacle(touch: bool = False, prefix: str = "o") -> str:
    """The selected obstacle, open: its fields by kind; the height has the focus and its hint; Next in the foot."""
    fields = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
        + small_field("Length", "4.0", "m", f"{prefix}-l", touch=touch)
        + small_field("Width", "3.0", "m", f"{prefix}-w", touch=touch)
        + small_field("Height", "1.00", "m", f"{prefix}-h", focus=True, touch=touch)
        + small_field("Rotation", "0", "°", f"{prefix}-r", touch=touch)
        + small_field("East", "12.0", "m", f"{prefix}-x", touch=touch)
        + small_field("North", "12.0", "m", f"{prefix}-y", touch=touch)
        + "</div>"
    )
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; border-radius: 12px; box-shadow: 0 0 0 3px rgba(255,176,32,0.14)">'
        '<div style="display: flex; align-items: center; gap: 10px">'
        f'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{ACCENT}" stroke-width="1.700" stroke-linejoin="round" aria-hidden="true">{BOX}</svg>'
        f'<label for="{prefix}-name" style="position: absolute; width: 1px; height: 1px; overflow: hidden">Name</label>'
        f'<input id="{prefix}-name" value="Lift shaft" style="flex-grow: 1; min-width: 0; background: transparent; border: 0; outline: 0; font-weight: 600">'
        f'<span style="font-size: 12px; color: {TEXT_2}">Box</span>'
        + icon_button("Remove Lift shaft", BIN, 32)
        + "</div>"
        + fields
        + f'<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: {TEXT_3}">{note(14)}Enter the real height. The file gave none; 1.0 m stands until you do</div>'
        f'<div style="display: flex; justify-content: flex-end; margin: -4px -6px -6px 0">{quiet("Next", 32)}</div></div>'
    )


def obstacle_line(path: str, name: str, facts: str, to_review: bool, touch: bool = False) -> str:
    mark = f'<span style="display: flex" title="Height to review">{note(14)}</span>' if to_review else ""
    return (
        f'<button style="display: flex; align-items: center; gap: 10px; height: {52 if touch else 46}px; padding: 0 12px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 12px; text-align: left; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)">'
        f'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{TEXT_2}" stroke-width="1.700" stroke-linejoin="round" aria-hidden="true">{path}</svg>'
        f'<span style="flex-grow: 1; font-weight: 500">{name}</span><code style="font-size: 12px; color: {TEXT_2}">{facts}</code>{mark}</button>'
    )


def obstacle_rows(touch: bool = False, prefix: str = "o") -> str:
    return (
        open_obstacle(touch, prefix)
        + obstacle_line(BOX, "Plant room", "8.0 × 5.0 · h 1.0 m", True, touch)
        + obstacle_line(BOX, "Skylight", "6.0 × 2.0 · h 1.0 m", True, touch)
        + obstacle_line(TANK, "Vent", "⌀ 1.0 · h 0.8 m", False, touch)
    )


def roof_inspector_after_import() -> str:
    edges = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
        + small_field("Parapet", "0.90", "m", "r-par")
        + small_field("Setback", "1.00", "m", "r-set")
        + small_field("Walkway", "0.60", "m", "r-wlk")
        + small_field("Every", "24", "mod", "r-evy")
        + small_field("Clearance", "0.50", "m", "r-clr")
        + small_field("Albedo", "0.20", "", "r-alb")
        + "</div>"
    )
    roof_type = (
        f'<div role="group" aria-label="Roof type" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; padding: 3px; {FIELD_WELL}">'
        f'<button aria-pressed="true" style="height: 34px; {SEG_ON}">Tilted rows</button><button style="height: 34px; {SEG_OFF}">East-west</button><button style="height: 34px; {SEG_OFF}">Sloped</button></div>'
    )
    obstacles = (
        '<section style="display: flex; flex-direction: column; gap: 10px">'
        f'<div style="display: flex; align-items: center">{section("Obstacles · 4")}'
        f'<button style="margin-left: auto; display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 9px; font-size: 13px; cursor: pointer; box-shadow: {SHADOW_RAISED}">{icon(PLUS, 14, "currentColor", 2.2)}Add</button></div>'
        + obstacle_rows()
        + "</section>"
    )
    body = roof_card_imported() + heights_note() + lens_section("Roof type", roof_type, gap=10) + lens_section("Edges and access", edges, gap=10) + obstacles
    return f'<div aria-label="Roof inspector" style="{INSPECTOR}; gap: 16px">{body}</div>'


def phone_after_import() -> str:
    width, height = 390, 844
    header = (
        '<header style="height: 56px; flex-shrink: 0; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 0 8px 0 16px">'
        f'<svg width="28" height="28" viewBox="0 0 26 26" fill="none" role="img" aria-label="SolarLayout Rooftop"><rect x="1" y="1" width="24" height="24" rx="7" fill="{ACCENT}"/><path d="M6 17.5 13 8l7 9.5" stroke="{ACCENT_INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 17.5h7" stroke="{ACCENT_INK}" stroke-width="2" stroke-linecap="round"/></svg>'
        f'<button style="flex-grow: 1; min-width: 0; display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 6px; background: transparent; border: 0; font-weight: 500; cursor: pointer; overflow: hidden"><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">Warehouse roof</span>{icon(CHEVRON, 16, TEXT_3)}</button>'
        f'<button aria-label="1 note to review" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: transparent; border: 0; cursor: pointer">{note(22)}</button>'
        f'<button aria-label="Export" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: {ACCENT}; border: 0; border-radius: 12px; cursor: pointer">{icon(DOWNLOAD, 18, ACCENT_INK)}</button></header>'
    )
    lenses = (
        f'<nav aria-label="Lenses" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; margin: 4px 16px 0; padding: 4px; background: {WELL}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_WELL}">'
        f'<button aria-pressed="true" style="height: 44px; background: {CONTROL_ACTIVE}; border: 0; border-radius: 10px; color: {ACCENT}; font-size: 14px; font-weight: 500; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)">Roof</button>'
        + "".join(f'<button style="height: 44px; background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}; font-size: 14px; cursor: pointer">{name}</button>' for name in ("Array", "Sun", "Strings"))
        + "</nav>"
    )
    sheet = (
        f'<section aria-label="Inspector" style="flex-grow: 1; min-height: 0; display: flex; flex-direction: column; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0; overflow: hidden">'
        f'<div style="display: flex; justify-content: center; padding: 8px 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        + lenses
        + '<div style="display: flex; flex-direction: column; gap: 10px; padding: 12px 16px 0">'
        + roof_card_imported(touch=True)
        + heights_note(touch=True)
        + section("Obstacles · 4", top=4)
        + '<div style="display: flex; flex-direction: column; gap: 6px">'
        + obstacle_rows(touch=True, prefix="p")
        + "</div></div></section>"
    )
    tabs = (
        f'<nav aria-label="Workspaces" style="height: 72px; flex-shrink: 0; box-sizing: border-box; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 6px 12px 10px; background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}">'
        f'<a href="StudioPhone.dc.html" aria-current="page" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: {ACCENT}; font-size: 12px; font-weight: 500">{icon(BOX, 22, "currentColor", 1.7)}Studio</a>'
        f'<a href="Performance.dc.html" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px">{icon(CHART, 22, "currentColor", 1.7)}Performance</a>'
        f'<a href="Handover.dc.html" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px">{icon(FILE, 22, "currentColor", 1.7)}Handover</a></nav>'
    )
    return (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        + header
        + sheet
        + tabs
        + "</div>"
    )


def heights_card() -> str:
    body = (
        '<div style="display: grid; grid-template-columns: 384px 390px; gap: 24px; align-items: start">'
        + state("Desktop, the Roof lens inspector after the import: the card names the file; the note in the engine's words, with the count and Review; Lift shaft selected and open, its height with the focus", roof_inspector_after_import())
        + state("Phone, 390: the sheet at its top stop with the same note and the open card; Next leads to the following one", phone_after_import())
        + "</div>"
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Review, or Next, selects the first obstacle of the list to review and puts the focus in its height. A typed height commits as any field and takes the obstacle off the list; Next selects the following one; the note goes when the list is empty. The two others carry a small mark beside their height in their rows; Vent got its height from the file and has none. The names are the layers of the drawing.</p>'
    )
    return card("The heights to review", body, gap=14)


def on_roof_card() -> str:
    crop = three_d_crop(
        "imported",
        422,
        360,
        f"{round(area(Scene('imported').outline)):,} m² · {round(area(POSITIONS['imported']['inner'][0]['outer'])):,} m² inside the setback · 4 obstacles",
        marks={0: "selected", 1: "review", 2: "review"},
        module_opacity=0.45,
        title="Roof",
        labels=False,
        controls=False,
        pad=(0.05, 0.24, 0.05, 0.04),
    )
    body = (
        state("The three obstacles without a height, drawn with a dashed accent outline; the selected one solid. The layout stands, dimmed, as the Roof lens shows it", crop)
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">What is not yet real is dashed: an obstacle whose height came from the import, not from the file or the user. The dash goes with the typed height. The positions are the engine\'s for this roof: {POSITIONS["imported"]["n_modules"]} in {POSITIONS["imported"]["n_rows"]} rows around the four obstacles at 1.0 and 0.8 m.</p>'
    )
    return card("On the roof", body, gap=12)


def import_board() -> str:
    width, height = 1440, IMPORT_HEIGHT
    body = (
        '<div style="display: flex; flex-direction: column; gap: 16px">'
        + import_card()
        + '<div style="display: grid; grid-template-columns: minmax(0, 1fr) 470px; gap: 16px; align-items: start">'
        + heights_card()
        + on_roof_card()
        + "</div></div>"
    )
    return (
        HEAD.format(
            title="Import with missing heights",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Import with missing heights",
            lead="A drawing is imported from the project switcher. A DXF gives no heights: the obstacles get 1.0 m, the Roof lens says so in the engine's words and selects them one by one until each has a real height.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


if __name__ == "__main__":
    (HERE / "ArrayLensStates.dc.html").write_text(array_states_board(), encoding="utf-8")
    (HERE / "RoofTypes3D.dc.html").write_text(roof_types_board(), encoding="utf-8")
    (HERE / "ImportHeights.dc.html").write_text(import_board(), encoding="utf-8")
    print("ArrayLensStates.dc.html, RoofTypes3D.dc.html, ImportHeights.dc.html")
