"""Writes three boards of Phase 7, step 0 (plan/phase-07-plan.md): StringsOnRoof.dc.html, "Strings on the roof";
StringsOptions.dc.html, "Options and your own"; and StringsInverterSizing.dc.html, "Inverter and sizing".

The first draws the engine's strings on the roof: option A coloured by string, by MPPT, and option D by inverter with
its two markers; a string traced under the pointer and a string selected with its callout; the plan; on phone. The
second draws the options of the inspector: Add your own open, your own chosen, your own refused after the voltage
changed, and no string length that fits at 600 V; on phone. The third draws the MPPT table of option A, with and
without a current limit; the inverter replaced from an OND; the inverter's limits and the AC cable; the sizing
temperatures with the cell rise and the Voc coefficient, its note and a value entered; on phone.

Every number comes from strings_lens_data.json beside this file, written from the engine for the Pune demo: the 790
positions with their outlines, the options at 1500, 1000 and 600 V with their strings in wired order, inverters,
MPPT loads, cable schedules and verdicts, your own option chosen and refused, the Voc coefficient entered, the OND
without IMaxDC, the equipment and the sizing. The light and the shadows are the engine's sun at 10:30 on 21 December
(sun_lens_data.json), the time the stage opens at. The 3D is the projection of build_lenses.py, through the helpers of
build_phase6_state_boards.py. Every colour is a token of docs/design/design-tokens.md: the strings take the series
colours, positions not used moduleUnused, a string traced or selected white (stringSelected), the inverter's box the
accent (inverterMarker); the two scene names are new in the palette (plan/phase-07-plan.md, step 12).

Run it in this folder: python3 build_phase7_state_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    ARROW,
    CHROME,
    CLOSE,
    CONTROL,
    CONTROL_ACTIVE,
    DISPLAY,
    FOOT,
    GROUND,
    HALO_SELECTED,
    HEAD,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE_LINE,
    NOTE_SURFACE,
    OK,
    PLUS,
    SHADOW_CARD,
    SHADOW_FLOAT,
    SHADOW_PANEL,
    SHADOW_PRIMARY,
    SHADOW_RAISED,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    UPLOAD,
    WELL,
    card,
    drop,
    icon,
    icon_button,
    note,
    quiet,
    secondary,
    state,
)
from build_phase4_boards import SHADOW_LABEL
from build_phase4_obstacles_by_hand import POINTER
from build_phase5_array_boards import dimension, title_line, view_controls
from build_phase5_roof_boards import PHONE, piece, swap_lens
from build_phase6_state_boards import (
    AC_UNITS,
    FRAME,
    GLASS,
    GRID_LINE,
    MODULE_PLANE,
    OBSTACLE_SHADE,
    OBSTACLE_TOP,
    PARAPET_CAP,
    PARAPET_H,
    PARAPET_LIT,
    PARAPET_SHADE,
    ROOF,
    SHADOW,
    STAIR,
    TANK,
    WALL_EDGE_LIT,
    WALL_EDGE_SHADE,
    WALL_LIT,
    WALL_SHADE,
    WALLS,
    bbox,
    cast,
    circle,
    cylinder,
    depth,
    fit,
    fmt,
    frame_crop,
    module_corners,
    module_centre,
    north_mark,
    notes,
    overlaps,
    pill,
    prism,
    roof_points,
    scale_bar,
    shadows_on_modules,
    shadows_on_roof,
    shift_of,
    sun_at,
    two_columns,
)

DATA = json.loads((HERE / "strings_lens_data.json").read_text(encoding="utf-8"))

# The series colours (--color-series-1 to -6), moduleUnused, stringSelected and inverterMarker of the palette.
SERIES = ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300"]
UNUSED = "#8C93A0"
STRING_SELECTED = "#FFFFFF"
INVERTER_MARKER = ACCENT
ACCENT_PRESSED = "#E99C12"
SHADOW_SEGMENT = "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)"
HALO_FOCUS = "inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)"
CHEVRON_RIGHT = '<path d="m9 6 6 6-6 6"/>'
CHEVRON_DOWN = '<path d="m6 9 6 6 6-6"/>'
FILE = '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'
MINUS = "−"

ON_ROOF_HEIGHT = 3500
OPTIONS_HEIGHT = 3630
INVERTER_HEIGHT = 4060

HOUR = 10.5  # the time the stage opens at: 21 December, 10:30 solar time

MODULES = DATA["modules"]
AT_1500, AT_1000, AT_600 = DATA["at_1500"], DATA["at_1000"], DATA["at_600"]
OPTION = {o["letter"]: o for o in AT_1500["options"]}
A = OPTION["A"]
OPTION_D = OPTION["D"]
CUSTOM = DATA["custom_26x24x1"]
REFUSED = DATA["custom_refused_at_1000"]
VOC_ENTERED = DATA["voc_entered"]
NO_IMAX = DATA["without_imaxdc"]
EQUIPMENT = DATA["equipment"]
SIZING = DATA["sizing"]
CABLE = {c["string"]: c for c in A["cable_schedule"]}
S12 = next(s for s in A["strings"] if s["label"] == "S12")


def true_minus(words: str) -> str:
    return words.replace("-", MINUS)


def mix(colour: str, toward: str, share: float) -> str:
    """A colour mixed *share* of the way toward another: how the strings not traced are dimmed."""
    a = [int(colour[i : i + 2], 16) for i in (1, 3, 5)]
    b = [int(toward[i : i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * share):02X}" for x, y in zip(a, b))


def number(s: dict) -> int:
    return int(s["label"][1:])


# --------------------------------------------------------------------------------------------------
# The colours of the positions (decision 12)
# --------------------------------------------------------------------------------------------------


def fills_of(option: dict, by: str) -> dict[int, str]:
    """The glass of every position: a string's series colour by its number, its MPPT's or its inverter's;
    moduleUnused for what the option does not use."""
    out = {m["idx"]: UNUSED for m in MODULES}
    for s in option["strings"]:
        k = {"string": number(s), "mppt": s["mppt"], "inverter": s["inverter"]}[by]
        for i in s["modules"]:
            out[i] = SERIES[(k - 1) % 6]
    return out


def traced(fills: dict[int, str], string: dict) -> dict[int, str]:
    """A string traced: its glass white, every other position its colour mixed 55 % toward the stage."""
    out = {i: mix(c, GROUND, 0.55) for i, c in fills.items()}
    for i in string["modules"]:
        out[i] = STRING_SELECTED
    return out


def module_middle(idx: int) -> tuple[float, float, float]:
    corners = module_corners(MODULES[idx])
    return tuple(sum(p[k] for p in corners) / 4 for k in range(3))


def string_middle(string: dict) -> int:
    """The position of the string nearest its middle, where the callout's dot stands."""
    xs = [module_centre(MODULES[i]) for i in string["modules"]]
    cx, cy = sum(x for x, _ in xs) / len(xs), sum(y for _, y in xs) / len(xs)
    return min(string["modules"], key=lambda i: (module_centre(MODULES[i])[0] - cx) ** 2 + (module_centre(MODULES[i])[1] - cy) ** 2)


# --------------------------------------------------------------------------------------------------
# The 3D, coloured by the strings
# --------------------------------------------------------------------------------------------------

BOX = (2.0, 1.0, 1.2)  # the inverter's box on the roof: east-west, north-south, height, in metres


def box_footprint(x: float, y: float) -> list[tuple[float, float]]:
    w, d, _ = BOX
    return [(x - w / 2, y - d / 2), (x + w / 2, y - d / 2), (x + w / 2, y + d / 2), (x - w / 2, y + d / 2)]


def inverter_box(view, x: float, y: float) -> str:
    """The inverter as a small box in inverterMarker: its top in the accent, its faces a step darker."""
    return prism(view, box_footprint(x, y), BOX[2]).replace(OBSTACLE_TOP, INVERTER_MARKER).replace("#C2C7CF", ACCENT_PRESSED).replace("#868D99", ACCENT_PRESSED)


def marker_chip(x: float, y: float, words: str) -> str:
    return (
        f'<div style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; transform: translate(-50%, -100%); padding: 2px 8px; background: {ACCENT}; color: {ACCENT_INK}; border-radius: 6px; '
        f'{MONO}; font-size: 11px; line-height: 16px; font-weight: 500; white-space: nowrap; box-shadow: {SHADOW_LABEL}">{words}</div>'
    )


def strings_scene(view, tag: str, label: str, fills: dict[int, str], inverters=(), trace: dict | None = None, vignette: bool = True) -> str:
    """The demo's roof at 10:30 on 21 December, every position in its colour, as Scene3D of Phase 6 draws it."""
    v = view
    w, h = v.width, v.height
    shift = shift_of(*sun_at("355", HOUR))
    o = [f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="position: absolute; left: 0; top: 0" role="img" aria-label="{label}">']
    roof_px = [v.px(0, 0), v.px(90, 0), v.px(90, 40), v.px(0, 40)]
    o.append(
        f'<defs><clipPath id="roof-{tag}"><polygon points="{fmt(roof_px)}"/></clipPath>'
        f'<radialGradient id="fade-{tag}" cx="50%" cy="52%" r="62%"><stop offset="55%" stop-color="{GROUND}" stop-opacity="0"/><stop offset="100%" stop-color="{GROUND}" stop-opacity="1"/></radialGradient></defs>'
    )
    grid = []
    for gx in range(-60, 161, 10):
        grid.append(f'<line x1="{v.px(gx, -50, -6)[0]:.1f}" y1="{v.px(gx, -50, -6)[1]:.1f}" x2="{v.px(gx, 110, -6)[0]:.1f}" y2="{v.px(gx, 110, -6)[1]:.1f}"/>')
    for gy in range(-50, 111, 10):
        grid.append(f'<line x1="{v.px(-60, gy, -6)[0]:.1f}" y1="{v.px(-60, gy, -6)[1]:.1f}" x2="{v.px(160, gy, -6)[0]:.1f}" y2="{v.px(160, gy, -6)[1]:.1f}"/>')
    o.append(f'<g stroke="{GRID_LINE}" stroke-width="1">{"".join(grid)}</g>')
    ground = cast([(0, 0), (90, 0), (90, 40), (0, 40)], [6.9] * 4, shift)
    o.append(f'<polygon points="{fmt(v.px(x, y, -6) for x, y in ground)}" fill="#05070A" opacity="0.7"/>')
    if vignette:
        o.append(f'<rect width="{w}" height="{h}" fill="url(#fade-{tag})"/>')
    o.append(f'<polygon points="{fmt(roof_px)}" fill="{ROOF}"/>')
    o.append(f'<polygon points="{fmt([v.px(1, 1), v.px(89, 1), v.px(89, 39), v.px(1, 39)])}" fill="none" stroke="{PARAPET_SHADE}" stroke-width="1" stroke-dasharray="4 3"/>')
    o.append(f'<polygon points="{fmt([v.px(0, 39.8, 0), v.px(90, 39.8, 0), v.px(90, 39.8, PARAPET_H), v.px(0, 39.8, PARAPET_H)])}" fill="{PARAPET_LIT}"/>')
    o.append(f'<polygon points="{fmt([v.px(89.8, 0, 0), v.px(89.8, 40, 0), v.px(89.8, 40, PARAPET_H), v.px(89.8, 0, PARAPET_H)])}" fill="{PARAPET_SHADE}"/>')
    for wall in (WALLS[1], WALLS[3]):
        o.append(f'<polygon points="{fmt(v.px(x, y, PARAPET_H) for x, y in wall)}" fill="{PARAPET_CAP}"/>')
    o.append(f'<g clip-path="url(#roof-{tag})" fill="{SHADOW}" opacity="0.36">')
    o.extend(f'<polygon points="{fmt(v.px(x, y) for x, y in s)}"/>' for s in shadows_on_roof(shift))
    o.append("</g>")
    on_modules = shadows_on_modules(shift)
    boxes = [bbox(s) for s in on_modules]
    items = []
    for m in MODULES:
        pts = [v.px(*p) for p in module_corners(m)]
        svg = f'<polygon points="{fmt(pts)}" fill="{fills.get(m["idx"], GLASS)}" stroke="{FRAME}" stroke-width="0.6"/>'
        hits = [s for s, b in zip(on_modules, boxes) if overlaps(bbox(m["outline"]), b)]
        if hits:
            cid = f"m{tag}{m['idx']}"
            svg += f'<clipPath id="{cid}"><polygon points="{fmt(pts)}"/></clipPath><g clip-path="url(#{cid})" fill="{SHADOW}" opacity="0.36">'
            svg += "".join(f'<polygon points="{fmt(v.px(x, y, MODULE_PLANE) for x, y in s)}"/>' for s in hits) + "</g>"
        items.append((depth(*module_centre(m)), svg))
    items.append((depth(22.5, 18.0), prism(v, STAIR, 3.0)))
    cx, cy, r, th = TANK
    items.append((depth(cx, cy), cylinder(v, cx, cy, r, th)))
    for a in AC_UNITS:
        items.append((depth(a[0][0] + 0.75, 3.5), prism(v, a, 1.2)))
    for inv in inverters:
        x, y = inv["position"]
        items.append((depth(x, y), inverter_box(v, x, y)))
    items.sort(key=lambda it: -it[0])
    o.extend(svg for _, svg in items)
    o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(90, 0, -6), v.px(90, 0, PARAPET_H), v.px(0, 0, PARAPET_H)])}" fill="{WALL_LIT}"/>')
    o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(90, 0, -6), v.px(90, 0, -5.6), v.px(0, 0, -5.6)])}" fill="{WALL_EDGE_LIT}"/>')
    o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(0, 40, -6), v.px(0, 40, PARAPET_H), v.px(0, 0, PARAPET_H)])}" fill="{WALL_SHADE}"/>')
    o.append(f'<polygon points="{fmt([v.px(0, 0, -6), v.px(0, 40, -6), v.px(0, 40, -5.6), v.px(0, 0, -5.6)])}" fill="{WALL_EDGE_SHADE}"/>')
    for wall in (WALLS[0], WALLS[2]):
        o.append(f'<polygon points="{fmt(v.px(x, y, PARAPET_H) for x, y in wall)}" fill="{PARAPET_CAP}"/>')
    if trace:
        line = fmt(v.px(*module_middle(i)) for i in trace["modules"])
        # A casing of the stage colour under the white line, so that it reads over the white glass.
        o.append(f'<polyline points="{line}" fill="none" stroke="{GROUND}" stroke-opacity="0.6" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>')
        o.append(f'<polyline points="{line}" fill="none" stroke="{STRING_SELECTED}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>')
    o.append("</svg>")
    chips = ""
    for inv in inverters:
        x, y = inv["position"]
        px, py = v.px(x, y, BOX[2])
        chips += marker_chip(px, py - 4, inv["label"])
    return "".join(o) + chips


def plan_svg(width: int, height: int, region, tag: str, label: str, fills: dict[int, str], inverters=()) -> tuple[str, object, float]:
    """The scene seen straight down, north up, every position in its colour; *region* is (west, south, east, north)."""
    x0, y0, x1, y1 = region
    s = min(width / (x1 - x0), height / (y1 - y0))
    ox = (width - (x1 - x0) * s) / 2
    oy = (height - (y1 - y0) * s) / 2

    def px(x, y):
        return ox + (x - x0) * s, oy + (y1 - y) * s

    shift = shift_of(*sun_at("355", HOUR))
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
    on_modules = shadows_on_modules(shift)
    boxes = [bbox(sh) for sh in on_modules]
    for m in MODULES:
        pts = [px(x, y) for x, y in m["outline"]]
        o.append(f'<polygon points="{fmt(pts)}" fill="{fills.get(m["idx"], GLASS)}" stroke="{FRAME}" stroke-width="{max(0.6, s * 0.06):.2f}"/>')
        hits = [sh for sh, b in zip(on_modules, boxes) if overlaps(bbox(m["outline"]), b)]
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
    for inv in inverters:
        x, y = inv["position"]
        o.append(f'<polygon points="{fmt(px(a, b) for a, b in box_footprint(x, y))}" fill="{INVERTER_MARKER}" stroke="{ACCENT_INK}" stroke-width="1"/>')
    o.append("</svg>")
    chips = ""
    for inv in inverters:
        x, y = inv["position"]
        cx_, cy_ = px(x, y + BOX[1] / 2)
        chips += marker_chip(cx_, cy_ - 4, inv["label"])
    return "".join(o) + chips, px, s


# --------------------------------------------------------------------------------------------------
# On the stage: the colour switch with the legend, the callout of a string
# --------------------------------------------------------------------------------------------------


def colour_switch(taken: str) -> str:
    buttons = ""
    for name in ("String", "MPPT", "Inverter"):
        on = name == taken
        look = f"background: {CONTROL_ACTIVE}; font-weight: 500; box-shadow: {SHADOW_SEGMENT}" if on else f"background: transparent; color: {TEXT_2}"
        buttons += f'<button role="radio" aria-checked="{"true" if on else "false"}" style="height: 34px; padding: 0 12px; border: 0; border-radius: 7px; font-size: 13px; cursor: pointer; {look}">{name}</button>'
    return (
        f'<div role="radiogroup" aria-label="Colour by" style="display: flex; gap: 2px; padding: 3px; background: {WELL}; border: 1px solid {LINE}; border-radius: 10px; box-shadow: {SHADOW_WELL}">{buttons}</div>'
    )


def swatch(colour: str, size: int = 12) -> str:
    return f'<span style="width: {size}px; height: {size}px; flex-shrink: 0; border-radius: 3px; background: {colour}"></span>'


def legend_item(colour: str, words: str) -> str:
    return f'<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: {TEXT_2}">{swatch(colour)}{words}</span>'


def legend_entries(option: dict, by: str) -> list[tuple[str, str]]:
    """The legend's entries by colouring: by string the six colours in turn, with the strings each one takes."""
    if by == "string":
        labels = [s["label"] for s in option["strings"]]
        out = [(SERIES[k], " · ".join(labels[k::6])) for k in range(min(6, len(labels)))]
    elif by == "mppt":
        out = [(SERIES[k - 1], f"MPPT {k}") for k in sorted({s["mppt"] for s in option["strings"]})]
    else:
        out = [(SERIES[k - 1], f"INV-{k}") for k in sorted({s["inverter"] for s in option["strings"]})]
    return out + [(UNUSED, "Not used")]


def colour_legend(option: dict, by: str) -> str:
    """The colour switch and the legend, floating at the bottom of the stage as the approved board draws it. By
    string the legend takes a line of its own under the switch: six colours, each with the strings it marks."""
    taken = {"string": "String", "mppt": "MPPT", "inverter": "Inverter"}[by]
    items = "".join(legend_item(c, w) for c, w in legend_entries(option, by))
    look = f"background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}"
    if by == "string":
        return (
            f'<div role="group" aria-label="Colours of the strings" style="display: flex; flex-direction: column; gap: 8px; padding: 6px 16px 10px 6px; {look}">'
            f'<div style="display: flex; align-items: center; gap: 14px">{colour_switch(taken)}<span style="font-size: 12px; color: {TEXT_2}">By string: six colours in turn along the rows</span></div>'
            f'<div style="display: flex; align-items: center; gap: 14px; padding-left: 10px">{items}</div></div>'
        )
    return f'<div role="group" aria-label="Colours of the strings" style="display: flex; align-items: center; gap: 14px; height: 48px; box-sizing: border-box; padding: 0 16px 0 6px; {look}">{colour_switch(taken)}{items}</div>'


def string_callout(x: float, y: float, colour: str, title: str, detail: str, hang: bool = False, line: int = 40, left_of: int = 120, width: int | None = None) -> str:
    """The callout of a selected string (components.md): a chip joined to the string by a 1 px line and a 9 px
    dot in the accent, as every callout of the stage (the string's white is for its glass and its trace line); it stands over the dot, or hangs under it where it would rise into the stage's top."""
    top = y if hang else y - line
    chip_top = f"top: {y + line:.0f}px" if hang else f"top: {y - line:.0f}px; transform: translateY(-100%)"
    size = f"width: {width}px; white-space: normal" if width else "white-space: nowrap"
    return (
        f'<div aria-hidden="true" style="position: absolute; left: {x:.0f}px; top: {top:.0f}px; width: 1px; height: {line}px; background: {ACCENT}"></div>'
        f'<div aria-hidden="true" style="position: absolute; left: {x - 4:.0f}px; top: {y - 4:.0f}px; width: 9px; height: 9px; border-radius: 50%; background: {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.25)"></div>'
        f'<div style="position: absolute; left: {x - left_of:.0f}px; {chip_top}; box-sizing: border-box; {size}; display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 12px; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500">{swatch(colour)}{title}</div>'
        f'<div style="{MONO}; font-size: 12px; color: {TEXT_2}">{detail}</div></div>'
    )


def s12_words() -> tuple[str, str]:
    c = CABLE["S12"]
    return (
        f"String {number(S12)} · INV-{S12['inverter']}, MPPT {S12['mppt']}",
        f"{len(S12['modules'])} modules · Voc cold {c['voc_cold_v']:,} V · {c['length_m']:.0f} m of cable",
    )


def lens_sub(option: dict) -> str:
    """The line under the lens's title (decision 14)."""
    strings = len(option["strings"])
    used = sum(len(s["modules"]) for s in option["strings"])
    n_inv = option["n_inverters"]
    inverters = "1 inverter, 6 MPPT" if n_inv == 1 else f"{n_inv} inverters, 6 MPPT each"
    return f"{strings} strings of {option['n_series']} modules · {inverters} · {len(MODULES) - used} positions not used"


# --------------------------------------------------------------------------------------------------
# Board 1: Strings on the roof
# --------------------------------------------------------------------------------------------------


def whole_stage(option: dict, by: str, tag: str, label: str, width: int = 984, height: int = 540) -> str:
    view = fit(roof_points(), width, height, pad=(0.04, 0.16, 0.04, 0.22))
    scene = strings_scene(view, tag, label, fills_of(option, by), inverters=option["inverters"])
    inside = scene + title_line("Strings", lens_sub(option)) + view_controls() + f'<div style="position: absolute; left: 20px; bottom: 20px">{colour_legend(option, by)}</div>'
    return frame_crop(width, height, inside)


def by_string_card() -> str:
    stage_ = whole_stage(A, "string", "bys", "3D view of the roof with option A coloured by string: 22 strings in six colours in turn along the rows, 152 positions not used in grey, INV-1 on the north edge")
    side = notes(
        "Option A at 1500 V, the engine's 22 strings of 29 modules, each drawn on the positions it wires (strings, modules by layout idx). String S<i>k</i> takes series colour ((k − 1) mod 6) + 1: S1, S7, S13 and S19 share the first colour, S6, S12 and S18 the sixth (decision 12).",
        "The engine numbers the strings along the rows, so neighbours in a row never share a colour; across rows one may meet another of its colour. The legend names, for each colour, the strings it marks; the trace and the callout tell two apart (decision 13).",
        "The 152 positions A does not use are moduleUnused, grey. INV-1 is a small box in the accent at the engine's place, (31.04, 39.0), on the north edge inside the setback, with its chip.",
        "By string the legend takes a second line under the switch: the six colours do not fit beside it. The light and the shadows are of 10:30 on 21 December, the time the stage opens at; the time pill and the vitals are left out of these crops.",
    )
    return card("Coloured by string", two_columns(state("Desktop stage, option A by string", stage_), side), gap=14)


def by_mppt_card() -> str:
    stage_ = whole_stage(A, "mppt", "bym", "3D view of the roof with option A coloured by MPPT: six colours, one for each MPPT of INV-1, 152 positions not used in grey")
    loads = " ".join(f"MPPT {l['mppt']} takes {l['strings']}," for l in A["mppt_loads"]).rstrip(",")
    side = notes(
        "The same strings coloured by the MPPT each is wired to (mppt): MPPT 1 the first series colour, MPPT 6 the sixth, as on the approved board, where the stage opens. The legend is the approved one.",
        f"The engine fills the MPPTs in the order of the strings: {loads} strings; so the colours follow the rows of the roof, the lowest rows MPPT 1.",
        "A string of another inverter's MPPT 3 takes the colour of MPPT 3 too: by MPPT is the MPPT within its inverter.",
    )
    return card("Coloured by MPPT", two_columns(state("Desktop stage, option A by MPPT", stage_), side), gap=14)


def by_inverter_card() -> str:
    stage_ = whole_stage(OPTION_D, "inverter", "byi", "3D view of the roof with option D coloured by inverter: INV-1 in the first colour on the southern rows, INV-2 in the second on the northern, 88 positions not used, the two inverters' boxes with their chips")
    inv = OPTION_D["inverters"]
    side = notes(
        f"Option D, 26 × 27 on two inverters, coloured by inverter: INV-1 the first series colour, INV-2 the second. Its 27 strings use 702 positions; 88 are not used.",
        f"Both markers stand where the engine places them: {inv[0]['label']} at ({inv[0]['position'][0]:.2f}, {inv[0]['position'][1]:.1f}) on the south edge, near the strings it takes, {inv[1]['label']} at ({inv[1]['position'][0]:.2f}, {inv[1]['position'][1]:.1f}) on the north edge. Each is a small box in inverterMarker with its chip, placed by the Projector.",
        "D is below the DC/AC target; it is shown here for its two inverters. The line under the title counts them: 2 inverters, 6 MPPT each.",
    )
    return card("Coloured by inverter", two_columns(state("Desktop stage, option D by inverter", stage_), side), gap=14)


def s12_view(width: int, height: int, pad):
    xs = [module_middle(i) for i in S12["modules"]]
    pts = [(x, y, z) for x, y, z in xs] + [(-1, 14, 0), (40, 30, 0)]
    return fit(pts, width, height, pad=pad)


def trace_card() -> str:
    w, h = 628, 440
    view = s12_view(w, h, (0.03, 0.34, 0.03, 0.08))
    by_mppt = fills_of(A, "mppt")
    trace_fills = traced(by_mppt, S12)
    hover = strings_scene(view, "tr", "3D view, close: string 12 traced under the pointer, its glass white with a line through its modules in wired order, the other strings dimmed", trace_fills, inverters=A["inverters"], trace=S12, vignette=False)
    hx, hy = view.px(*module_middle(S12["modules"][4]))
    hover += f'<div style="position: absolute; left: {hx - 2:.0f}px; top: {hy - 2:.0f}px">{POINTER}</div>'
    picked = strings_scene(view, "sel", "3D view, close: string 12 selected, white with its line, the other strings dimmed, its callout above it", trace_fills, inverters=A["inverters"], trace=S12, vignette=False)
    mid = string_middle(S12)
    dx, dy = view.px(*module_middle(mid))
    title, detail = s12_words()
    picked += string_callout(dx, dy, SERIES[S12["mppt"] - 1], title, detail, left_of=150)
    body = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px">'
        + state("Traced under the pointer: string 12 of option A, coloured by MPPT", frame_crop(w, h, hover))
        + state("Pressed: string 12 selected, with its callout", frame_crop(w, h, picked))
        + "</div>"
        + notes(
            f"Under the pointer a string is traced (decision 13): its glass stringSelected, white; every other position its colour mixed 55 % toward the stage; a line of 2 in white through the middles of its modules in the order they are wired (modules of S12, {len(S12['modules'])} of them: east along the northern line of the row, then back west along the southern). The stair room's kept-clear area splits it in two runs. On touch there is no trace.",
            f"A press selects it and the callout says the string, its inverter and its MPPT, its modules, its Voc cold and its metres of cable, from the engine's cable schedule of A: {CABLE['S12']['voc_cold_v']:,} V and {CABLE['S12']['length_m']} m, shown as {CABLE['S12']['length_m']:.0f} m. The swatch is the string's colour of the moment, here MPPT 3's. The callout's line and dot are in the accent, as every callout on the stage; the string's white is for its glass and its trace line only. The chip stands over the dot on a line of 40.",
            "The approved board said 63 m of cable for string 12; the engine's schedule says 93.2 m, and the board follows the engine.",
        )
    )
    return card("A string traced and selected", body, gap=14)


def plan_and_phone_card() -> str:
    w, h = 866, 440
    region = (-3.0, -3.0, 93.0, 43.0)
    svg, px, s = plan_svg(w, h, region, "pl", "Plan, north up: option A coloured by MPPT, the positions not used in grey, INV-1 on the north edge", fills_of(A, "mppt"), inverters=A["inverters"])
    lx, ly = px(45, -1.6)
    wx, wy = px(-1.6, 20)
    inside = svg + dimension(lx, ly, "90.0 m", 0) + dimension(wx, wy, "40.0 m", -90) + north_mark() + scale_bar(s, 10, left=40, bottom=8)
    plan_ = state("Plan, north up: option A by MPPT, INV-1 with its chip", frame_crop(w, h, inside))
    # The phone: the stage of 252 pinched in on string 12, selected by a tap.
    pw, ph = 390, 252
    view = s12_view(pw, ph, (0.02, 0.36, 0.02, 0.22))
    fills = traced(fills_of(A, "mppt"), S12)
    scene = strings_scene(view, "ph", "3D view on phone, pinched in: string 12 selected by a tap, white, the other strings dimmed, its callout under the time", fills, inverters=A["inverters"], trace=S12, vignette=False)
    mid = string_middle(S12)
    dx, dy = view.px(*module_middle(mid))
    title, detail = s12_words()
    controls = piece(PHONE, '<div style="position: absolute; right: 12px; top: 4px;', "</div>\n<button", keep_end=False) + "</div>"
    phone_ = frame_crop(
        pw,
        ph,
        scene
        + f'<div style="position: absolute; left: 12px; top: 4px">{pill("phone", HOUR)}</div>'
        + controls
        + string_callout(dx, dy, SERIES[S12["mppt"] - 1], title, detail, hang=True, line=28, left_of=dx - 12, width=264),
    )
    right = (
        state("Phone, 390: the stage of 252, pinched in; string 12 selected by a tap", phone_)
        + notes(
            "On phone a tap selects a string; nothing is traced. The callout, its line and dot in the accent, hangs under the dot, since the time and the view controls fill the top of the stage, and wraps in a chip of 264. The colour switch and the legend are in the sheet (the lens's phone board).",
        )
    )
    body = (
        f'<div style="display: grid; grid-template-columns: {w}px 390px; gap: 24px; align-items: start">'
        + f'<div style="display: flex; flex-direction: column; gap: 14px">{plan_}'
        + notes(
            "Plan is the same scene seen straight down, north up, and what stands in without WebGL: the positions by MPPT, the 152 not used in grey, INV-1 a box in the accent on the north edge with its chip. The roof's edges are labelled as on the plan of the Array lens, with the scale and the north control.",
        )
        + "</div>"
        + f'<div style="display: flex; flex-direction: column; gap: 14px">{right}</div>'
        + "</div>"
    )
    return card("The plan, and on phone", body, gap=14)


def on_roof_board() -> str:
    width, height = 1440, ON_ROOF_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + by_string_card() + by_mppt_card() + by_inverter_card() + trace_card() + plan_and_phone_card() + "</div>"
    return (
        HEAD.format(
            title="Strings on the roof",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Strings on the roof",
            lead="The engine's strings drawn on the positions they wire: option A by string and by MPPT, option D by inverter with its two inverters; a string traced under the pointer and selected with its callout; the plan; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# The inspector's pieces (the approved Strings board's look)
# --------------------------------------------------------------------------------------------------

H2 = f"margin: 0; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}"


def column(body: str, label: str = "Strings inspector", width: str = "384px") -> str:
    """A column of the inspector: chrome, padding 20, sections 18 apart, as the approved board."""
    return (
        f'<div aria-label="{label}" style="width: {width}; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; padding: 20px; '
        f'background: {CHROME}; border: 1px solid {LINE_SUBTLE}; border-radius: 12px">{body}</div>'
    )


def head_row(title: str, right: str = "", mono: bool = False) -> str:
    look = f"{MONO}; font-size: 12px; color: {TEXT_2}" if mono else f"font-size: 12px; color: {TEXT_3}"
    after = f'<span style="margin-left: auto; {look}">{right}</span>' if right else ""
    return f'<div style="display: flex; align-items: baseline; gap: 12px"><h2 style="{H2}">{title}</h2>{after}</div>'


def block(inside: str, gap: int = 8, grow: bool = False) -> str:
    return f'<section style="display: flex; flex-direction: column; gap: {gap}px">{inside}</section>'


INVERTER_GLYPH = (
    f'<div aria-hidden="true" style="width: 44px; height: 56px; flex-shrink: 0; box-sizing: border-box; border-radius: 6px; background: {SURFACE_2}; border: 2px solid {LINE_STRONG}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px">'
    f'<span style="width: 22px; height: 3px; border-radius: 2px; background: {ACCENT}"></span><span style="width: 22px; height: 3px; border-radius: 2px; background: {LINE_STRONG}"></span>'
    f'<span style="width: 22px; height: 3px; border-radius: 2px; background: {LINE_STRONG}"></span></div>'
)


def inverter_card(name: str = "WP-330KTL-H1", facts: str = "WattPower · 275 kW · 6 MPPT", line: str = "65.0 A per MPPT · 28 inputs", marked: bool = False, touch: bool = False) -> str:
    """The inverter card of the approved board. A line with a note (an OND without a current limit) stands under
    the card's top at its full width, with the note mark and the words in the text face."""
    size = "font-size: 13px" if touch else "font-size: 12px"
    third = "" if marked else f'<div style="{MONO}; {size}; color: {TEXT_3}; white-space: nowrap">{line}</div>'
    under = (
        f'<div style="display: flex; align-items: center; gap: 8px; {size}; color: {TEXT_2}">{note(14)}<span>{line}</span></div>' if marked else ""
    )
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
        '<div style="display: flex; align-items: center; gap: 14px">'
        + INVERTER_GLYPH
        + '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0">'
        f'<div style="font-weight: 600; white-space: nowrap">{name}</div>'
        f'<div style="{size}; color: {TEXT_2}; white-space: nowrap">{facts}</div>{third}</div>'
        f'<button style="height: {44 if touch else 36}px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 9px; font-size: 13px; cursor: pointer; box-shadow: {SHADOW_RAISED}">Replace</button></div>'
        f"{under}</div>"
    )


def voltage_section(taken: str, touch: bool = False) -> str:
    buttons = ""
    for v in ("600 V", "1000 V", "1500 V"):
        on = v == taken
        look = f"background: {CONTROL_ACTIVE}; font-weight: 500; box-shadow: {SHADOW_SEGMENT}" if on else f"background: transparent; color: {TEXT_2}"
        buttons += f'<button role="radio" aria-checked="{"true" if on else "false"}" style="height: {44 if touch else 36}px; padding: 0 12px; border: 0; border-radius: {9 if touch else 7}px; font-size: {15 if touch else 14}px; cursor: pointer; {look}">{v}</button>'
    seg = (
        f'<div role="radiogroup" aria-label="System voltage" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; padding: 3px; background: {WELL}; '
        f'border: 1px solid {LINE}; border-radius: {12 if touch else 10}px; box-shadow: {SHADOW_WELL}">{buttons}</div>'
    )
    return block(head_row("System voltage", "Your choice") + seg)


def share(n: int, low: int, high: int) -> float:
    """Where a length stands on the track: the range takes its middle 44 %, as the approved board draws 14 to 29."""
    if high == low:
        return 0.5
    return 0.28 + (n - low) * 0.44 / (high - low)


def end_label(at: float, words: str, colour: str, top: int = 26) -> str:
    return f'<span style="position: absolute; left: {at * 100:.1f}%; top: {top}px; transform: translateX(-50%); {MONO}; font-size: 11px; color: {colour}; white-space: nowrap">{words}</span>'


def series_bar(n_min: int, n_max: int, upper: str, marker: int | None) -> str:
    """The series range bar (components.md): the track, the feasible band, the chosen length's marker, the ends'
    labels with what sets each. With no length between the ends, no band: the two ends as ticks, the lower first."""
    track = f'<div style="position: absolute; left: 0; right: 0; top: 8px; height: 8px; border-radius: 4px; background: {WELL}; box-shadow: inset 0 1px 2px rgba(0,0,0,0.7)"></div>'
    if n_max >= n_min:
        lo, hi = share(n_min, n_min, n_max), share(n_max, n_min, n_max)
        band = f'<div style="position: absolute; left: {lo * 100:.1f}%; width: {(hi - lo) * 100:.1f}%; top: 8px; height: 8px; border-radius: 4px; background: {OK}; opacity: 0.55"></div>'
        mark = ""
        if marker is not None:
            at = share(marker, n_min, n_max)
            mark = f'<div style="position: absolute; left: calc({at * 100:.1f}% - 2px); top: 2px; width: 4px; height: 20px; border-radius: 2px; background: {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.2)"></div>'
        upper_colour = TEXT if marker == n_max else TEXT_2
        labels = end_label(lo, f"{n_min} · MPPT minimum", TEXT_2) + end_label(hi, f"{n_max} · {upper}", upper_colour)
        return f'<div style="position: relative; height: 44px">{track}{band}{mark}{labels}</div>'
    lo, hi = share(n_max, n_max, n_min), share(n_min, n_max, n_min)
    ticks = "".join(
        f'<div style="position: absolute; left: calc({at * 100:.1f}% - 1px); top: 4px; width: 2px; height: 16px; border-radius: 1px; background: {TEXT_2}"></div>' for at in (lo, hi)
    )
    labels = end_label(lo, f"{n_max} · {upper}", TEXT_2) + end_label(hi, f"{n_min} · MPPT minimum", TEXT_2)
    return f'<div style="position: relative; height: 44px">{track}{ticks}{labels}</div>'


def verdict(fits: bool, words: str, title: str = "", touch: bool = False) -> str:
    mark = (
        icon('<path d="m5 12 5 5 9-10"/>', 16, OK, 2.4).replace('aria-hidden="true"', 'role="img" aria-label="Fits"')
        if fits
        else icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>', 16, ACCENT).replace('aria-hidden="true"', 'role="img" aria-label="Note"')
    )
    size = 13 if touch else 12
    head = f'<span style="display: block; font-size: {size + 1}px; font-weight: 500; color: {TEXT}">{title}</span>' if title else ""
    return f'<div style="display: flex; align-items: flex-start; gap: 8px; font-size: {size}px; color: {TEXT_2}">{mark}<span>{head}{words}</span></div>'


def series_section(range_: dict, marker: int | None, verdict_html: str, right: str | None = None) -> str:
    n_min, n_max = range_["n_min"], range_["n_max"]
    right = right if right is not None else f"{n_min} to {n_max} fit"
    return block(head_row("Modules in series", right, mono=True) + series_bar(n_min, n_max, range_["upper_limit"], marker) + verdict_html)


def mark_of(fits: bool, size: int = 16, words: str = "") -> str:
    if fits:
        return icon('<path d="m5 12 5 5 9-10"/>', size, OK, 2.4).replace('aria-hidden="true"', f'role="img" aria-label="{words or "Fits"}"')
    return icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>', size, ACCENT).replace('aria-hidden="true"', f'role="img" aria-label="{words or "Note"}"')


def option_card(letter: str, title: str, line: str, energy: str, fits: bool, selected: bool = False, touch: bool = False) -> str:
    if selected:
        look = f"background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; box-shadow: {HALO_SELECTED}"
        badge = f"background: {ACCENT}; color: {ACCENT_INK}"
    else:
        look = f"background: {SURFACE_1}; border: 1px solid {LINE}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)"
        badge = f"background: {CONTROL_ACTIVE}; color: {TEXT}"
    height, t_size, m_size, e_size = (60, 15, 13, 15) if touch else (52, 13, 11.5, 13)
    energy_ = f'<span style="{MONO}; font-weight: 500; font-size: {e_size}px">{energy}</span>' if energy else ""
    return (
        f'<button role="radio" aria-checked="{"true" if selected else "false"}" style="display: flex; align-items: center; gap: 12px; height: {height}px; padding: 0 12px; {look}; border-radius: 12px; text-align: left; cursor: pointer">'
        f'<span style="width: 26px; height: 26px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; {badge}; {MONO}; font-weight: 500; font-size: 13px">{letter}</span>'
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column"><span style="font-weight: 500; font-size: {t_size}px">{title}</span>'
        f'<span style="{MONO}; font-size: {m_size}px; color: {TEXT_2}">{line}</span></span>{energy_}{mark_of(fits)}</button>'
    )


def option_line(o: dict) -> str:
    return f"{o['n_series']} × {o['n_strings']} · {o['dc_kwp']:.2f} · {o['dcac']:.2f}"


CAPTIONS_1500 = {"A": "Recommended", "B": "Fills the inverter", "C": "Lower clipping", "D": "Below target, 2 inverters", "E": "Below target, 2 inverters"}


def caption_of(o: dict) -> str:
    """The caption of decision 11, from the option's data: for one outside the target its note and its inverters."""
    if o["recommended"]:
        return "Recommended"
    if o["note"]:
        n = o["n_inverters"]
        return f"{o['note'].capitalize()}, {n} inverters" if n > 1 else o["note"].capitalize()
    return ""


def cards_1500(chosen: str | None, touch: bool = False) -> str:
    return "".join(
        option_card(o["letter"], CAPTIONS_1500[o["letter"]], option_line(o), f"{o['energy_mwh']:.1f}", o["ok"], selected=o["letter"] == chosen, touch=touch) for o in AT_1500["options"]
    )


def add_button() -> str:
    return (
        f'<button style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 40px; background: transparent; border: 1px dashed {LINE_STRONG}; border-radius: 12px; color: {TEXT_2}; font-size: 13px; cursor: pointer">'
        f'{icon(PLUS, 14, "currentColor", 2.2)}Add your own</button>'
    )


def options_section(cards: str, extra: str = "", right: str = "series × strings · kWp · DC/AC · MWh") -> str:
    return block(head_row("Options", right) + cards + extra, gap=6)


def closed_row(label: str, value: str, opened: str = "", touch: bool = False) -> str:
    """A row that opens in place (the approved "Sizing temperatures"): closed, its label, its value and a chevron;
    open, the chevron turns down and the fields stand under a line, in the same box."""
    chevron = CHEVRON_DOWN if opened else CHEVRON_RIGHT
    height = 52 if touch else 44
    size = 15 if touch else 13
    head = (
        f'<button aria-expanded="{"true" if opened else "false"}" style="display: flex; align-items: center; gap: 10px; height: {height}px; padding: 0 12px; background: transparent; border: 0; text-align: left; font-size: {size}px; cursor: pointer">'
        f'<span style="flex-grow: 1; color: {TEXT if opened else TEXT_2}; white-space: nowrap; {"font-weight: 500" if opened else ""}">{label}</span>'
        f'<span style="{MONO}; font-size: {size - 1}px; white-space: nowrap">{value}</span>{icon(chevron, 16, TEXT_3)}</button>'
    )
    body = f'<div style="display: flex; flex-direction: column; gap: 14px; padding: 14px 12px 14px; border-top: 1px solid {LINE_SUBTLE}">{opened}</div>' if opened else ""
    return f'<div style="display: flex; flex-direction: column; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)">{head}{body}</div>'


def sizing_closed() -> str:
    return closed_row("Sizing temperatures", f"{SIZING['t_min_c']:.1f} to {SIZING['t_max_c']:.1f} °C")


def field(id_: str, value: str, unit: str, width: int = 96, focus: bool = False, touch: bool = False) -> str:
    look = f"border: 1px solid {ACCENT}; box-shadow: {HALO_FOCUS}" if focus else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
    height, radius, size = (48, 12, 15) if touch else (36, 10, 14)
    after = f'<span style="flex-shrink: 0; color: {TEXT_2}; font-size: 12px; white-space: nowrap">{unit}</span>' if unit else ""
    return (
        f'<div style="flex-shrink: 0; display: flex; align-items: center; gap: 6px; width: {width}px; height: {height}px; box-sizing: border-box; padding: 0 12px; background: {WELL}; border-radius: {radius}px; {look}">'
        f'<input id="{id_}" value="{value}" inputmode="decimal" style="flex-grow: 1; width: 20px; min-width: 0; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-size: {size}px; font-weight: 500">{after}</div>'
    )


def field_row(id_: str, label: str, value: str, unit: str, hint: str = "", width: int = 104, focus: bool = False, touch: bool = False, after: str = "") -> str:
    """A field of the inspector: the label before the field, a line under the label, an action under the line."""
    size = 15 if touch else 14
    hint_ = f'<span style="font-size: 12px; color: {TEXT_3}">{hint}</span>' if hint else ""
    return (
        '<div style="display: flex; flex-direction: column; gap: 4px">'
        '<div style="display: flex; align-items: center; gap: 12px">'
        f'<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><label for="{id_}" style="color: {TEXT_2}; font-size: {size}px">{label}</label>{hint_}</div>'
        f"{field(id_, value, unit, width, focus, touch)}</div>{after}</div>"
    )


def use_link(words: str, touch: bool = False) -> str:
    return (
        f'<div style="display: flex; justify-content: flex-end; margin: -2px -10px 0 0"><button style="height: {44 if touch else 28}px; padding: 0 10px; background: transparent; border: 0; border-radius: 8px; '
        f'color: {TEXT_2}; font-size: {14 if touch else 12}px; cursor: pointer">{words}</button></div>'
    )


def note_box(words: str, touch: bool = False, extra: str = "") -> str:
    return f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 8px; font-size: {13 if touch else 12}px; color: {TEXT_2}">{words}{extra}</div>'


def small_quiet(label: str, touch: bool = False) -> str:
    return f'<button style="height: {44 if touch else 32}px; padding: 0 12px; background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}; font-size: {15 if touch else 13}px; cursor: pointer">{label}</button>'


def own_actions(touch: bool = False) -> str:
    return f'<div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: -2px">{small_quiet("Change", touch)}{small_quiet("Remove", touch)}</div>'


# --------------------------------------------------------------------------------------------------
# Board 2: Options and your own
# --------------------------------------------------------------------------------------------------


def a_verdict(touch: bool = False) -> str:
    return verdict(True, A["verdict"]["detail"], touch=touch)


def add_open() -> str:
    """Add your own, open in place of its button: three fields prefilled with the chosen option, their bounds
    under them (decision 9), Cancel and Add."""
    rng = AT_1500["series_range"]
    rows = (
        field_row("own-n", "Series", str(A["n_series"]), "", f"{rng['n_min']} to {rng['n_max']} fit", width=88, focus=True)
        + field_row("own-s", "Strings", str(A["n_strings"]), "", f"1 to {A['available_strings']} of {A['n_series']} fit", width=88)
        + field_row("own-i", "Inverters", str(A["n_inverters"]), "", "", width=88)
    )
    buttons = (
        '<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px">'
        f'<button style="height: 36px; padding: 0 14px; background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}; font-size: 13px; cursor: pointer">Cancel</button>'
        f'<button style="height: 36px; padding: 0 16px; background: {ACCENT}; color: {ACCENT_INK}; border: 0; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: {SHADOW_PRIMARY}">Add</button></div>'
    )
    return (
        f'<div role="group" aria-label="Your own option" style="display: flex; flex-direction: column; gap: 12px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 12px; box-shadow: {SHADOW_RAISED}">'
        f'<div style="display: flex; align-items: baseline; gap: 12px"><span style="font-size: 13px; font-weight: 500">Your own</span><span style="margin-left: auto; font-size: 12px; color: {TEXT_3}">series × strings × inverters</span></div>'
        + rows
        + buttons
        + "</div>"
    )


def inspector_add_open() -> str:
    return column(
        inverter_card()
        + voltage_section("1500 V")
        + series_section(AT_1500["series_range"], A["n_series"], a_verdict())
        + options_section(cards_1500("A"), add_open())
        + sizing_closed()
    )


def own_card(touch: bool = False) -> str:
    c = CUSTOM
    return option_card(c["letter"], "Your own", option_line(c), f"{c['energy_mwh']:.1f}", c["ok"], selected=True, touch=touch)


def inspector_own_chosen() -> str:
    return column(
        inverter_card()
        + voltage_section("1500 V")
        + series_section(AT_1500["series_range"], CUSTOM["n_series"], verdict(CUSTOM["verdict"]["ok"], CUSTOM["verdict"]["detail"]))
        + options_section(cards_1500(None), own_card() + own_actions())
        + sizing_closed()
    )


def refused_card(letter: str, touch: bool = False) -> str:
    """Your own, refused by the engine: the note mark, the engine's title and detail, no energy (decision 8)."""
    t_size, d_size = (15, 13) if touch else (13, 12)
    return (
        f'<div role="radio" aria-checked="false" aria-disabled="true" style="display: flex; flex-direction: column; gap: 6px; padding: 12px; background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px">'
        '<div style="display: flex; align-items: center; gap: 12px">'
        f'<span style="width: 26px; height: 26px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: {CONTROL_ACTIVE}; {MONO}; font-weight: 500; font-size: 13px">{letter}</span>'
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column"><span style="font-weight: 500; font-size: {t_size}px">Your own</span>'
        f'<span style="{MONO}; font-size: {11.5 if not touch else 13}px; color: {TEXT_2}">29 × 22 · 1 inverter</span></span>{mark_of(False, 16, "Does not fit")}</div>'
        f'<div style="padding-left: 38px; font-size: {d_size}px; color: {TEXT_2}"><span style="display: block; color: {TEXT}; font-weight: 500">{REFUSED["title"]}</span>{REFUSED["detail"]}</div></div>'
    )


def cards_1000(chosen: str) -> str:
    return "".join(option_card(o["letter"], caption_of(o), option_line(o), f"{o['energy_mwh']:.1f}", o["ok"], selected=o["letter"] == chosen) for o in AT_1000["options"])


def inspector_refused() -> str:
    first = AT_1000["options"][0]
    letter = chr(ord(AT_1000["options"][-1]["letter"]) + 1)
    return column(
        inverter_card()
        + voltage_section("1000 V")
        + series_section(AT_1000["series_range"], first["n_series"], verdict(first["verdict"]["ok"], first["verdict"]["detail"]))
        + options_section(cards_1000(first["letter"]), refused_card(letter) + own_actions())
        + sizing_closed()
    )


def what_changes(touch: bool = False) -> str:
    return (
        f'<div style="display: flex; align-items: center; justify-content: center; min-height: {64 if touch else 56}px; box-sizing: border-box; padding: 10px 16px; border: 1px dashed {LINE_STRONG}; border-radius: 12px; '
        f'font-size: {14 if touch else 13}px; color: {TEXT_2}; text-align: center">Change the system voltage, the inverter or the sizing temperatures</div>'
    )


def no_fit_series(touch: bool = False) -> str:
    rng = AT_600["series_range"]
    no = AT_600["no_options"]
    return series_section(rng, None, verdict(False, no["message"], title=no["title"], touch=touch), right="None fit")


def inspector_no_fit() -> str:
    return column(
        inverter_card()
        + voltage_section("600 V")
        + no_fit_series()
        + options_section(what_changes(), right="")
        + sizing_closed()
    )


def vitals_no_options() -> str:
    """The vitals as D37 has them when there are no options: three values and the API's title and message."""
    no = AT_600["no_options"]

    def cell(label: str, value: str, unit: str, edge: bool) -> str:
        line = f"; border-left: 1px solid {LINE}" if edge else ""
        return (
            f'<div style="display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 0 18px{line}"><div style="font-size: 12px; color: {TEXT_2}">{label}</div>'
            f'<div style="{MONO}; font-weight: 500; font-size: 16px">{value} <span style="font-family: Geist, sans-serif; font-size: 12px; color: {TEXT_2}; font-weight: 400">{unit}</span></div></div>'
        )

    bar = (
        f'<section aria-label="Design vitals" style="position: absolute; left: 20px; right: 20px; bottom: 20px; height: 78px; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1fr 1fr 2.4fr; '
        f'white-space: nowrap; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px; box-shadow: {SHADOW_FLOAT}">'
        + cell("Roof", "3,600", "m²", False)
        + cell("Positions", "790", "modules", True)
        + cell("If all were used", "442.40", "kWp", True)
        + f'<a href="StringsOptions.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 0 18px; background: {NOTE_SURFACE}; border-left: 1px solid {NOTE_LINE}; border-radius: 0 15px 15px 0; color: {TEXT}; white-space: normal">'
        + note(22)
        + f'<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 13px; font-weight: 500">{no["title"]}</span><span style="font-size: 12px; line-height: 16px; color: {TEXT_2}">{no["message"]}</span></span></a></section>'
    )
    return frame_crop(984, 118, bar)


def options_desktop_card() -> str:
    body = (
        '<div style="display: grid; grid-template-columns: 384px 384px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Add your own, open, prefilled with A", inspector_add_open())
        + state("Your own chosen, 26 × 24 × 1", inspector_own_chosen())
        + notes(
            f"Add your own opens in place of the dashed button: three fields prefilled with the chosen option, {A['n_series']} × {A['n_strings']} × {A['n_inverters']}, each with its bounds under it (decision 9): the series by the range, {AT_1500['series_range']['n_min']} to {AT_1500['series_range']['n_max']}; the strings by what the roof holds of that length, {A['available_strings']} of {A['n_series']} (strings_by_series of the engine, A's available_strings); the inverters at least one string each. The focus goes to Series. Add commits the option and chooses it; Cancel closes the fields and changes nothing.",
            f"Your own chosen: the sixth card, F, with the caption Your own and the engine's numbers of 26 × 24 × 1: {CUSTOM['dc_kwp']:.2f} kWp, DC/AC {CUSTOM['dcac']:.2f}, {CUSTOM['energy_mwh']:.1f} MWh, a tick. It is selected, A no longer; under it Change, which opens the same fields with its numbers, and Remove, which takes it out and chooses the run's first option (decision 9). The bar's marker moves to 26 and the verdict is your own's, in the engine's words.",
            "There is one option of your own at most, so Add your own is not offered while there is one. Choosing a card asks nothing of the engine: every option carries its results (decision 3).",
            "The verdict under the bar is the engine's detail, word for word, with its “inverter(s)”; the approved board wrote it shorter by hand.",
        )
        + "</div>"
    )
    return card("Add your own, and your own chosen", body, gap=14)


def refused_desktop_card() -> str:
    body = (
        '<div style="display: grid; grid-template-columns: 384px 384px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Your own refused at 1000 V", inspector_refused())
        + state("No string length fits: 600 V", inspector_no_fit())
        + notes(
            f"At 1000 V the range is {AT_1000['series_range']['n_min']} to {AT_1000['series_range']['n_max']} and the engine answers four options, all below the DC/AC target: their captions come from their data (decision 11): the note, and the inverters only where there are more than one, so A and B read “Below target, 2 inverters”, C and D “Below target”. None is recommended; the run's first, A, is chosen.",
            f"Your own of 29 in series no longer fits. The engine does not simulate it and says why (custom_refused, decision 8): “{REFUSED['title']}”, “{REFUSED['detail']}” The card keeps the numbers you gave, a note mark, no kWp, no DC/AC and no energy, since what cannot be built has none; it cannot be chosen. Change and Remove stand under it. Its letter is the one after the run's options.",
            f"At 600 V no length fits. The bar has no band: the engine's two ends stand as ticks on the scale of lengths, the Voc limit, {AT_600['series_range']['n_max']}, below the MPPT minimum, {AT_600['series_range']['n_min']}, so the lower is at the left. The verdict is the note of no_options, its title and its message; there are no options and no Add your own, and a line says what can change it.",
            "The track's scale: the range takes the middle 44 % of the track, as the approved board draws 14 to 29, so the labels of the ends never meet; with no band, the two ends take the same places, the lower one first.",
        )
        + "</div>"
        + state("The vitals at 600 V, as D37: three values and the API's title and message; the cell leads to the Strings lens", vitals_no_options())
    )
    return card("Your own refused, and no string length fits", body, gap=14)


def sheet(inside: str, label: str = "Inspector") -> str:
    nav = swap_lens(piece(PHONE, '<nav aria-label="Lenses"', "</nav>"), 3)
    return (
        f'<section aria-label="{label}" style="display: flex; flex-direction: column; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0; overflow: hidden">'
        f'<div style="display: flex; justify-content: center; padding: 8px 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>{nav}'
        f'<div style="display: flex; flex-direction: column; gap: 18px; padding: 16px 16px 20px">{inside}</div></section>'
    )


def phone_frame(inside: str) -> str:
    return (
        f'<div style="width: 390px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f"{inside}</div>"
    )


def phone_vitals_own() -> str:
    v = piece(PHONE, '<section aria-label="Design vitals"', "</section>")
    v = v.replace(">617.8 <", f">{CUSTOM['energy_mwh']:.1f} <").replace(">357.28 <", f">{CUSTOM['dc_kwp']:.2f} <").replace(">1.30<", f">{CUSTOM['dcac']:.2f}<").replace(">638 <", f">{CUSTOM['n_modules']} <")
    return v.replace("padding: 0 0 14px 16px", "padding: 14px 0 14px 16px")


def phone_vitals_no_fit() -> str:
    no = AT_600["no_options"]

    def small(label: str, value: str, unit: str) -> str:
        return (
            f'<div style="flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; height: 64px; box-sizing: border-box; padding: 0 16px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
            f'<div style="font-size: 12px; color: {TEXT_2}">{label}</div>'
            f'<div style="{MONO}; font-weight: 500; font-size: 16px">{value} <span style="font-family: Geist, sans-serif; font-size: 12px; color: {TEXT_2}; font-weight: 400">{unit}</span></div></div>'
        )

    return (
        f'<section aria-label="Design vitals" style="flex-shrink: 0; display: flex; gap: 8px; padding: 14px 0 14px 16px; overflow: hidden; white-space: nowrap">'
        f'<a href="StringsOptions.dc.html" style="flex-shrink: 0; display: flex; align-items: center; gap: 10px; height: 64px; box-sizing: border-box; padding: 0 14px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 14px; color: {TEXT}">'
        + note(22)
        + f'<span style="width: 160px; font-size: 13px; font-weight: 500; white-space: normal">{no["title"]}</span></a>'
        + small("Roof", "3,600", "m²")
        + small("Positions", "790", "modules")
        + small("If all were used", "442.40", "kWp")
        + "</section>"
    )


def options_phone_card() -> str:
    own = phone_frame(
        phone_vitals_own()
        + sheet(
            voltage_section("1500 V", touch=True)
            + series_section(AT_1500["series_range"], CUSTOM["n_series"], verdict(True, CUSTOM["verdict"]["detail"], touch=True))
            + options_section(cards_1500(None, touch=True), own_card(touch=True) + own_actions(touch=True), right="series × strings · kWp · DC/AC")
        )
    )
    none = phone_frame(
        phone_vitals_no_fit()
        + sheet(voltage_section("600 V", touch=True) + no_fit_series(touch=True) + options_section(what_changes(touch=True), right=""))
    )
    body = (
        '<div style="display: grid; grid-template-columns: 390px 390px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Phone: your own chosen, the vitals its numbers; the sheet open in the Strings lens", own)
        + state("Phone: no string length fits at 600 V; the vitals as D37, the title alone", none)
        + notes(
            "On phone the inspector is the sheet: the lens switch, then the sections as on desktop at the sizes of touch: the voltage 44 high, option cards 60, body 15. Change and Remove are 44 high. The inverter card and the closed rows follow under the options when the sheet is scrolled.",
            "The vitals row follows the chosen option: your own's 607.7 MWh, 349.44 kWp, 1.27 and 624 of 790. At 600 V it begins with the note, the API's title alone (D37), and leads to the Strings lens.",
            "The options' header on phone leaves out MWh, which the energy at the right of each card says.",
        )
        + "</div>"
    )
    return card("On phone", body, gap=14)


def options_board() -> str:
    width, height = 1440, OPTIONS_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + options_desktop_card() + refused_desktop_card() + options_phone_card() + "</div>"
    return (
        HEAD.format(
            title="Options and your own",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Options and your own",
            lead="The options of the Strings lens: Add your own, bounded by what fits; your own chosen among A to E; your own refused when the voltage changes, in the engine's words; no string length that fits at 600 V; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Board 3: Inverter and sizing
# --------------------------------------------------------------------------------------------------

TH = f"padding: 0 6px; height: 36px; white-space: nowrap; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}; border-bottom: 1px solid {LINE}"
TD = f"padding: 0 6px; height: 44px; white-space: nowrap; border-bottom: 1px solid {LINE_SUBTLE}"


def current_words(value: float, limit: float | None, touch: bool = False) -> str:
    if limit is None:
        return f'{value:.1f} A <span style="font-family: Geist, sans-serif; color: {TEXT_2}">of not known</span>'
    return f"{value:.1f} of {limit:.1f} A"


def mppt_table(loads: list[dict], option: str = "A") -> str:
    """The MPPT table (decision 17, components.md "Table"): a row per MPPT that has strings; Imp and Isc each of
    its limit, stacked in one column, kWp and the mark."""
    rows = ""
    for l in loads:
        known = l["imp_limit_a"] is not None
        mark = mark_of(l["ok"], 16, "Fits" if l["ok"] else "Limit not known")
        current = (
            f'<span style="display: flex; flex-direction: column; line-height: 16px">'
            f'<span><span style="font-family: Geist, sans-serif; font-size: 11px; color: {TEXT_3}">Imp </span>{current_words(l["imp_a"], l["imp_limit_a"])}</span>'
            f'<span><span style="font-family: Geist, sans-serif; font-size: 11px; color: {TEXT_3}">Isc </span>{current_words(l["isc_a"], l["isc_limit_a"])}</span></span>'
        )
        rows += (
            f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 500"><span style="display: flex; flex-direction: column; line-height: 16px"><span style="font-size: 13px">MPPT {l["mppt"]}</span>'
            f'<span style="font-size: 12px; font-weight: 400; color: {TEXT_3}">INV-{l["inverter"]}</span></span></th>'
            f'<td style="{TD}; text-align: right; {MONO}; font-size: 13px">{l["strings"]}</td>'
            f'<td style="{TD}; text-align: left; {MONO}; font-size: 12px">{current}</td>'
            f'<td style="{TD}; text-align: right; {MONO}; font-size: 13px">{l["kwp"]:.2f}</td>'
            f'<td style="{TD}; width: 16px; padding-right: 0">{mark}</td></tr>'
        )
    total = sum(l["strings"] for l in loads)
    return (
        f'<table style="width: 100%"><caption style="caption-side: bottom; padding-top: 10px; text-align: left; font-size: 12px; color: {TEXT_2}">Option {option}: {total} strings on {len(loads)} MPPT, at 1500 V</caption><thead><tr>'
        f'<th scope="col" style="{TH}; text-align: left">MPPT</th><th scope="col" style="{TH}; text-align: right">Strings</th><th scope="col" style="{TH}; text-align: left">Current</th>'
        f'<th scope="col" style="{TH}; text-align: right">kWp</th><th scope="col" style="{TH}; padding-right: 0"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden">Fits</span></th></tr></thead>'
        f"<tbody>{rows}</tbody></table>"
    )


def enter_link(touch: bool = False) -> str:
    return (
        f'<a href="StringsInverterSizing.dc.html" style="display: inline-flex; align-items: center; gap: 6px; {"min-height: 44px; " if touch else ""}color: {TEXT}; font-weight: 500">Enter the current per MPPT{icon(ARROW, 14, TEXT_2)}</a>'
    )


def unknown_note(touch: bool = False) -> str:
    return note_box(NO_IMAX["max_current_per_mppt"]["note"], touch, enter_link(touch))


def mppt_section(known: bool = True) -> str:
    loads = A["mppt_loads"] if known else NO_IMAX["option_a"]["mppt_loads"]
    return block(head_row("MPPT loading", "of option A") + mppt_table(loads) + ("" if known else unknown_note()), gap=8)


def mppt_card() -> str:
    a_loads = A["mppt_loads"]
    body = (
        '<div style="display: grid; grid-template-columns: 384px 384px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Under the options: the MPPT loading of A", column(mppt_section(True)))
        + state("The demo's OND without IMaxDC", column(mppt_section(False)))
        + notes(
            f"The table stands under the options and is of the chosen option (decision 17): a row for each MPPT that has strings, from the engine's mppt_loads. A puts 4, 4, 4, 4, 3 and 3 strings on the six MPPTs of INV-1; four strings draw Imp {a_loads[0]['imp_a']:.1f} A and Isc {a_loads[0]['isc_a']:.1f} A of the {a_loads[0]['imp_limit_a']:.1f} A an MPPT takes; kWp is the strings × 29 × 560 W, {a_loads[0]['kwp']:.2f} for four.",
            "The row is the table of the kit at the inspector's width: the MPPT with its inverter under it, the strings, Imp and Isc in one column of two lines, each of its limit, the kWp and the mark. A tick where both are within the limit; over it the row has a note and the verdict names the MPPT (decision 18).",
            f"Without a current limit in the OND every limit is not known: the row says “of not known” and has a note mark, never a red cross. Under the table, the API's words (max_current_per_mppt.note) and a link to the field of the current per MPPT. The options note says the same: “{NO_IMAX['options_note'].split('. ')[1]}.”",
        )
        + "</div>"
    )
    return card("MPPT loading", body, gap=14)


def replace_dialog(drop_html: str) -> str:
    return (
        f'<div role="dialog" aria-labelledby="ri-t" aria-describedby="ri-d" style="width: 440px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 22px 22px 20px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="ri-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Replace the inverter</h3>'
        + icon_button("Close", CLOSE, 32)
        + "</div>"
        f'<p id="ri-d" style="margin: 0; color: {TEXT_2}">An OND file of PVsyst. The inverter of before stays until the new one is read; the strings and the energy follow.</p>'
        + drop_html
        + f'<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px">{quiet("Cancel")}</div></div>'
    )


def dimmed(inside: str, height: int = 360) -> str:
    return f'<div style="display: flex; align-items: center; justify-content: center; height: {height}px; border-radius: 12px; background: rgba(5,7,10,0.72); border: 1px solid {LINE_SUBTLE}">{inside}</div>'


def words_of(title: str, detail: str, mono_detail: bool = False) -> str:
    d = f'<code style="font-size: 12px; color: {TEXT_2}">{detail}</code>' if mono_detail else f'<span style="font-size: 12px; color: {TEXT_2}">{detail}</span>'
    return f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">{title}</span>{d}</span>'


def replace_card() -> str:
    rest = drop(f"border: 1px dashed {LINE_STRONG}", icon(UPLOAD, 20, TEXT_2, 1.8) + words_of("Drop the inverter file here", "An OND file of PVsyst") + secondary("Choose a file", 36))
    refused = drop(
        f"background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}",
        note(20) + words_of("This file was not loaded", "insolation.PAN: not a PVsyst inverter file (PNomConv or VMPPMax missing)") + secondary("Choose another", 36),
        height=104,
    )
    after = column(
        inverter_card("SG3300UD-20", "Sungrow · 3300 kW · 3 MPPT", "Current per MPPT not in the OND · 5 inputs", marked=True)
        + f'<code style="font-size: 12px; color: {TEXT_3}; margin-top: -10px">sungrow-sg3300ud-20.OND</code>'
    )
    body = (
        '<div style="display: grid; grid-template-columns: 520px 520px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Replace on the inverter card opens the dialog: the file drop at rest", dimmed(replace_dialog(rest)))
        + state("A file that is no OND, refused in the engine's words; the inverter of before stays", dimmed(replace_dialog(refused)))
        + notes(
            "The dialog is the module's (the board “Studio, Array lens, states”): its title, one sentence of what happens, the file drop of the kit, Cancel. The file is read by the API's /equipment/inverter; reading, the drop shows the ring and the file's name.",
            "A file refused leaves the inverter of before in place (D32), and the drop says why in the engine's words, the file's name first. Choose another opens the chooser again.",
        )
        + "</div>"
        + '<div style="display: grid; grid-template-columns: 384px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("After a file is read: the card shows the inverter of the file until the run with it lands", after)
        + notes(
            "The card after the Sungrow SG3300UD-20 of the fixtures is read: the model and the maker as the file states them (decision 15), its 3300 kW and its 3 MPPT; its current per MPPT is not in the OND, so the third line has the note mark and says so, beside its 5 inputs. The file's name stands under the card.",
            "Replace commits the OND's text and its name and clears a current per MPPT that was entered (inventory 1.4); the strings, the options and the energy follow with the run.",
        )
        + "</div>"
    )
    return card("Replace the inverter", body, gap=14)


def limits_fields(entered: bool = False) -> str:
    imax = EQUIPMENT["max_current_per_mppt"]
    inv = EQUIPMENT["inverter"]
    source = f"IMaxDC {inv['idc_max_a']:.0f} A ÷ {inv['n_mppt']} MPPT"
    if entered:
        current = field_row("imppt", "Current per MPPT", "60.0", "A", "entered", after=use_link(f"Use the file's {imax['value_a']:.1f} A"))
    else:
        current = field_row("imppt", "Current per MPPT", "", "A", f"{imax['value_a']:.1f} A · {source}") + note_box(imax["note"])
    cable = field_row("accable", "AC cable per inverter", "30.00", "m", "1 to 2,000 m")
    return current + cable


def sizing_fields(voc: str = "default", touch: bool = False) -> str:
    s = SIZING
    c = EQUIPMENT["coefficients"]
    rows = (
        field_row("tmin", "Lowest ambient", "", "°C", f"{s['t_min_c']:.1f} °C from the weather", touch=touch)
        + field_row("tmax", "Highest ambient", "", "°C", f"{s['t_max_c']:.1f} °C from the weather", touch=touch)
        + field_row("rise", "Cell rise", "", "°C", f"{s['cell_rise_c']:.0f} °C by roof type: flat, open rack", touch=touch)
    )
    if voc == "entered":
        value = f"{VOC_ENTERED['voc_coefficient_pct']:.2f}".replace("-", MINUS)
        rows += field_row("muvoc", "Voc coefficient", value, "%/°C", "entered", width=128 if not touch else 148, touch=touch, after=use_link(f"Use the model's {MINUS}{abs(c['mu_voc_pct']):.3f} %/°C", touch))
    else:
        rows += field_row("muvoc", "Voc coefficient", "", "%/°C", f"{MINUS}{abs(c['mu_voc_pct']):.3f} %/°C from the one-diode model", width=128 if not touch else 148, touch=touch)
        rows += note_box(true_minus(EQUIPMENT["module_notes"][0]), touch)
    return rows


def limits_row(entered: bool = False) -> str:
    value = "60.0 A · 30 m" if entered else f"{EQUIPMENT['max_current_per_mppt']['value_a']:.1f} A · 30 m"
    return closed_row("Inverter limits and cabling", value, limits_fields(entered))


def sizing_row(voc: str = "default", touch: bool = False) -> str:
    return closed_row("Sizing temperatures", f"{SIZING['t_min_c']:.1f} to {SIZING['t_max_c']:.1f} °C", sizing_fields(voc, touch), touch=touch)


def tail_of_options() -> str:
    """The end of the options, so that the rows are seen where they stand: E and Add your own."""
    e = OPTION["E"]
    return options_section(option_card("E", CAPTIONS_1500["E"], option_line(e), f"{e['energy_mwh']:.1f}", e["ok"]) + add_button(), right="")


def limits_card() -> str:
    body = (
        '<div style="display: grid; grid-template-columns: 384px 384px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Inverter limits and cabling, opened", column(sizing_closed() + limits_row(False)))
        + state("60 A entered", column(sizing_closed() + limits_row(True)))
        + notes(
            f"The inverter's two values stand in a closed row of their own at the end of the inspector, under Sizing temperatures, so that the approved top stays as it is: the row says the current and the cable, {EQUIPMENT['max_current_per_mppt']['value_a']:.1f} A and 30 m, and opens in place.",
            f"Current per MPPT is empty while it is the file's: beside it, the value and where it comes from, IMaxDC {EQUIPMENT['inverter']['idc_max_a']:.0f} A ÷ {EQUIPMENT['inverter']['n_mppt']} MPPT, and the API's note in its words. A value entered (60.0 A here) says “entered”, the note goes, and “Use the file's 65.0 A” sets it back to none (decision 16). A new OND clears it.",
            "AC cable per inverter is the document's 30 m, in metres from 1 to 2,000; the BOM counts it for each inverter. Fields commit on Enter or when the focus leaves.",
        )
        + "</div>"
    )
    return card("Inverter limits and cabling", body, gap=14)


def sizing_card() -> str:
    rng = AT_1500["series_range"]
    after_run = series_section(
        {"n_min": rng["n_min"], "n_max": VOC_ENTERED["n_max"], "upper_limit": rng["upper_limit"]},
        None,
        "",
    )
    body = (
        '<div style="display: grid; grid-template-columns: 384px 384px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Sizing temperatures, opened, every value the default", column(sizing_row("default")))
        + state("The Voc coefficient entered, −0.29; the range after the run", column(after_run + sizing_row("entered")))
        + notes(
            f"Each field is empty while the engine's default holds, and says the default and its source beside it (decision 7): the lowest and the highest ambient from the weather, {SIZING['t_min_c']:.1f} and {SIZING['t_max_c']:.1f} °C; the cell rise by roof type, {SIZING['cell_rise_c']:.0f} °C on the flat roof with open racks. A value entered stays, even when it equals the default; “Use the weather's” sets it back to none.",
            f"The Voc coefficient is the one-diode model's, {MINUS}{abs(EQUIPMENT['coefficients']['mu_voc_pct']):.3f} %/°C, the demo's PAN stating none; the module's note says so in the engine's words, with true minus signs. Entered, it sizes the strings (decision 6): Voc at the lowest ambient is Voc at STC × (1 + μ × (t_min − 25)).",
            f"With {MINUS}0.29 entered the field says “entered” and the note goes. The run sizes the strings with it: Voc cold {VOC_ENTERED['voc_cold']:.2f} V a module against {rng['voc_cold']:.2f} V, so at most {VOC_ENTERED['n_max']} fit under 1500 V ({VOC_ENTERED['string_voc_at_n_max']:,} V for 28) and the range is 14 to 28. The options of that run are not in the data of this board; the marker and the verdict, which follow the option it chooses, are left out.",
        )
        + "</div>"
    )
    return card("Sizing temperatures and the Voc coefficient", body, gap=14)


def mppt_cards_phone(known: bool = True) -> str:
    loads = A["mppt_loads"] if known else NO_IMAX["option_a"]["mppt_loads"]
    out = ""
    for l in loads:
        mark = mark_of(l["ok"], 18, "Fits" if l["ok"] else "Limit not known")

        def value(label: str, inside: str) -> str:
            return f'<div style="display: flex; flex-direction: column; gap: 2px"><dt style="font-size: 12px; color: {TEXT_2}">{label}</dt><dd style="margin: 0; {MONO}; font-weight: 500; font-size: 15px">{inside}</dd></div>'

        def current(v: float, limit: float | None) -> str:
            if limit is None:
                return f'{v:.1f} A <span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 13px; color: {TEXT_2}">of not known</span>'
            return f"{v:.1f} of {limit:.1f} A"

        out += (
            f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; background: {SURFACE_2}; border-radius: 12px">'
            f'<div style="display: flex; align-items: center; gap: 8px"><span style="flex-grow: 1; font-weight: 600; font-size: 16px">{l["label"]}</span>{mark}</div>'
            '<dl style="margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 8px">'
            + value("Strings", str(l["strings"]))
            + value("kWp", f"{l['kwp']:.2f}")
            + value("Imp", current(l["imp_a"], l["imp_limit_a"]))
            + value("Isc", current(l["isc_a"], l["isc_limit_a"]))
            + "</dl></div>"
        )
    caption = f'<div style="font-size: 13px; color: {TEXT_2}">Option A: 22 strings on 6 MPPT, at 1500 V</div>'
    return block(head_row("MPPT loading", "of option A") + f'<div role="list" style="display: flex; flex-direction: column; gap: 8px">{out}</div>' + caption + ("" if known else unknown_note(True)), gap=10)


def inverter_phone_card() -> str:
    a = phone_frame(sheet(mppt_cards_phone(True)))
    b = phone_frame(sheet(mppt_cards_phone(False)))
    e = phone_frame(sheet(sizing_row("default", touch=True)))
    body = (
        '<div style="display: grid; grid-template-columns: repeat(3, 390px); gap: 24px; align-items: start">'
        + state("Phone: the MPPT loading of A as cards", a)
        + state("Phone: the limit not known; the note and the link under the cards", b)
        + state("Phone: Sizing temperatures opened, the fields 48 high", e)
        + "</div>"
        + notes(
            "On phone the table is a list of cards (components.md “Table”): each MPPT with its inverter as the title, its mark, then its values in two columns, since a current of its limit does not fit a third. The caption stands under the cards. Without a limit each card has the note mark and says “of not known”; the API's words and the link follow the list.",
            "The sizing temperatures open in the sheet as rows: the label and its source at the left, the field of 48 at the right; the module's note under the Voc coefficient. The sheet scrolls to them under the options.",
        )
    )
    return card("On phone", body, gap=14)


def inverter_board() -> str:
    width, height = 1440, INVERTER_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + mppt_card() + replace_card() + limits_card() + sizing_card() + inverter_phone_card() + "</div>"
    return (
        HEAD.format(
            title="Inverter and sizing",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Inverter and sizing",
            lead="The MPPT loading of the chosen option, with and without a current limit; the inverter replaced from an OND; the current per MPPT and the AC cable; the sizing temperatures with the cell rise and the Voc coefficient; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


if __name__ == "__main__":
    (HERE / "StringsOnRoof.dc.html").write_text(on_roof_board(), encoding="utf-8")
    (HERE / "StringsOptions.dc.html").write_text(options_board(), encoding="utf-8")
    (HERE / "StringsInverterSizing.dc.html").write_text(inverter_board(), encoding="utf-8")
    print("StringsOnRoof.dc.html, StringsOptions.dc.html, StringsInverterSizing.dc.html")
