"""Writes the three boards of the Studio's Strings lens of Phase 7 (plan/phase-07-plan.md, step 0):
StringsLens.dc.html, "Studio, Strings lens · desktop 1440" (in the place of the board drawn by hand);
StringsLensTablet.dc.html, "Studio, Strings lens · tablet 834"; and StringsLensPhone.dc.html, "Studio,
Strings lens · phone 390".

Each shows the demo at 1500 V, the user's choice, with option A chosen and the strings coloured by MPPT:
the 3D roof at 10:30 solar time on 21 December as the Array boards draw it, every position of option A in
the series colour of the MPPT of its string, the positions A does not use in moduleUnused, the inverter
INV-1 where the engine places it, the colour switch String | MPPT | Inverter with its legend, the time
pill of every lens, the vitals and the Strings inspector. The inspector is the approved one of the board
drawn by hand (build_lenses.py): the inverter card with Replace, System voltage with "Your choice",
Modules in series with the bar and the verdict, Options A to E with Add your own, and the closed row of
the sizing temperatures. The frames are those of the approved Array boards: the top bar, the rail or the
lens row, the view controls, the time pill and the vitals are taken from Main.dc.html,
StudioTablet.dc.html and StudioPhone.dc.html as they are; the stage and the inspector are drawn here.

What the engine answered is read from strings_lens_data.json, written from the engine for these boards:
the 790 positions with their outlines in roof metres (modules), option A's 22 strings with their modules
by layout idx in wired order, their inverter and MPPT (at_1500.options[0].strings), its inverter's
position, its cable schedule, the five options with their figures and verdicts, the series range, the
equipment and the sizing temperatures. The options' captions are worded by the rule of the plan's
decision 11 from the options' own figures. The light, the shadows on the roof, the obstacles and the
projection are those of build_phase5_roof_boards.py (10:30 on the design day); the shadows of the rows
are cast from the engine's positions. Every colour is one of docs/design/design-tokens.md: the series
colours and moduleUnused for the glass, the 3D palette for the rest of the scene.

Run it in this folder: python3 build_phase7_lens_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json
import math
import re

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    CHROME,
    CONTROL,
    CONTROL_ACTIVE,
    DISPLAY,
    GROUND,
    HALO_SELECTED,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE_SURFACE,
    OK,
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
    section,
)
from build_phase4_boards import SHADOW_LABEL
from build_phase5_roof_boards import (
    AC_UNITS,
    GRID_LINE,
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
    SUN_SHIFT,
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
    box,
    cast,
    circle_points,
    counter_clockwise,
    cylinder,
    frame,
    hull,
    phone_sheet,
    phone_stage,
    piece,
    poly,
    prism,
    rect_points,
    row_matrix,
    swap_lens,
)

MAIN = (HERE / "Main.dc.html").read_text(encoding="utf-8")
DATA = json.loads((HERE / "strings_lens_data.json").read_text(encoding="utf-8"))

# The series colours of design-tokens.md in their fixed order, and the 3D palette's moduleUnused.
SERIES = ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300"]
MODULE_UNUSED = "#8C93A0"
HOVER = "#FFD36B"  # the 3D palette's hover and sunCore: the lit top of the inverter's box

# Tokens not in the shared builders.
SHADOW_SEGMENT = "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)"
SHADOW_TRACK = "inset 0 1px 2px rgba(0,0,0,0.7)"

TICK = (
    f'<svg style="flex-shrink: 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{OK}" stroke-width="2.4" stroke-linecap="round" '
    'stroke-linejoin="round" role="img" aria-label="Fits"><path d="m5 12 5 5 9-10"/></svg>'
)
NOTE = (
    f'<svg style="flex-shrink: 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{ACCENT}" stroke-width="2" stroke-linecap="round" '
    'stroke-linejoin="round" role="img" aria-label="Below the DC/AC target"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>'
)
CHEVRON_RIGHT = '<path d="m9 6 6 6-6 6"/>'
PLUS = '<path d="M12 5v14M5 12h14"/>'

# --------------------------------------------------------------------------------------------------
# What the engine answered
# --------------------------------------------------------------------------------------------------

AT = DATA["at_1500"]
OPTIONS = AT["options"]
CHOSEN = next(o for o in OPTIONS if o["key"] == AT["chosen_option"])
RANGE = AT["series_range"]
MODULES = DATA["modules"]
INVERTER = DATA["equipment"]["inverter"]
CURRENT = DATA["equipment"]["max_current_per_mppt"]
SIZING = DATA["sizing"]

# The colour of every position: its string's MPPT, or not used.
COLOUR_OF = {m["idx"]: MODULE_UNUSED for m in MODULES}
for _string in CHOSEN["strings"]:
    for _idx in _string["modules"]:
        COLOUR_OF[_idx] = SERIES[(_string["mppt"] - 1) % len(SERIES)]
USED = sum(len(s["modules"]) for s in CHOSEN["strings"])
UNUSED = len(MODULES) - USED
assert USED == CHOSEN["n_modules"] == 638 and UNUSED == 152, (USED, UNUSED)
MPPTS = sorted({s["mppt"] for s in CHOSEN["strings"]})

CALLED = next(s for s in CHOSEN["strings"] if s["label"] == "S12")
CALLED_CABLE = next(c for c in CHOSEN["cable_schedule"] if c["string"] == CALLED["label"])

# At most this many strings a MPPT, so an inverter takes this many: the engine's options note says it.
PER_INVERTER = int(re.search(r"one inverter takes (\d+) strings", AT["options_note"]).group(1))


def number(value: float, digits: int = 0) -> str:
    return f"{value:,.{digits}f}"


def caption_of(option: dict) -> str:
    """The caption of an option card, by the rule of decision 11: the recommended one; one outside the
    target says so with its inverters; one in target fills its inverters or clips less than the
    recommended one; else none."""
    if option["recommended"]:
        return "Recommended"
    if not option["ok"]:
        n = option["n_inverters"]
        return f"{option['note'].capitalize()}, {n} inverter{'s' if n > 1 else ''}"
    if option["n_strings"] == PER_INVERTER * option["n_inverters"]:
        return "Fills the inverter"
    recommended = next(o for o in OPTIONS if o["recommended"])
    if option["clipping_pct"] < recommended["clipping_pct"]:
        return "Lower clipping"
    return ""


CAPTIONS = [caption_of(o) for o in OPTIONS]
assert CAPTIONS == ["Recommended", "Fills the inverter", "Lower clipping", "Below target, 2 inverters", "Below target, 2 inverters"], CAPTIONS

STAGE_LINE = (
    f"{CHOSEN['n_strings']} strings of {CHOSEN['n_series']} modules · {CHOSEN['n_inverters']} inverter, {INVERTER['n_mppt']} MPPT · "
    f"{UNUSED} positions not used"
)
CALLOUT_TITLE = f"String {CALLED['label'][1:]} · INV-{CALLED['inverter']}, MPPT {CALLED['mppt']}"
CALLOUT_DETAIL = f"{len(CALLED['modules'])} modules · Voc cold {number(CALLED_CABLE['voc_cold_v'])} V · {CALLED_CABLE['length_m']:.0f} m of cable"
VERDICT = (
    f"Voc at {RANGE['t_min']:.1f} °C is {number(RANGE['voc_cold'] * CHOSEN['n_series'])} V, limit {number(RANGE['limit_v'])} V. "
    f"Vmp at {RANGE['t_cell_hot']:.1f} °C cell is {number(RANGE['vmp_hot'] * CHOSEN['n_series'])} V, MPPT minimum {number(INVERTER['vmpp_min'])} V."
)
assert "1,480 V" in VERDICT and "1,097 V" in VERDICT, VERDICT

# --------------------------------------------------------------------------------------------------
# The scene at 10:30, as the Array boards draw it, with the glass coloured by the strings
# --------------------------------------------------------------------------------------------------

TILT = math.radians(15)
CLEARANCE = 0.5
SLOT = 2.297  # a module and the gap to the next, up the slope


def outline_x(m: dict) -> float:
    return min(p[0] for p in m["outline"])


def row_runs(row: int) -> list[tuple[float, float]]:
    """The engine's positions of a row as runs along it, (x from, x to): where its table stands."""
    xs = sorted(outline_x(m) for m in MODULES if m["row"] == row and m["line"] == 0)
    out: list[list[float]] = []
    for x in xs:
        if out and x - out[-1][1] < 0.05:
            out[-1][1] = x + 1.133
        else:
            out.append([x, x + 1.133])
    return [(a, b) for a, b in out]


RUNS = {row: row_runs(row) for row in range(len(ROWS_Y))}


def defs(tag: str) -> str:
    return (
        "<defs>"
        f'<pattern id="cells-{tag}" patternUnits="userSpaceOnUse" width="1.153" height="{SLOT}">'
        f'<rect y="1.118" width="1.133" height="0.04" fill="{GROUND}" fill-opacity="0.35"/><rect width="1.133" height="0.06" fill="{GROUND}" fill-opacity="0.45"/></pattern>'
        f'<pattern id="grid-{tag}" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M 10 0 L 0 0 L 0 10" fill="none" stroke="{GRID_LINE}" stroke-width="0.12"/></pattern>'
        f'<clipPath id="roof-{tag}"><rect width="90" height="40"/></clipPath>'
        f'<radialGradient id="fade-{tag}" cx="50%" cy="52%" r="62%"><stop offset="55%" stop-color="{GROUND}" stop-opacity="0"/><stop offset="100%" stop-color="{GROUND}" stop-opacity="1"/></radialGradient>'
        "</defs>"
    )


def module_row(row: int, tag: str) -> str:
    """A table of the engine's positions: each module its colour, the cells and the frame over them."""
    glass = "".join(
        f'<rect x="{outline_x(m):.3f}" y="{m["line"] * SLOT:.3f}" width="1.133" height="2.277" fill="{COLOUR_OF[m["idx"]]}"/>'
        for m in MODULES
        if m["row"] == row
    )
    cells = "".join(f'<rect transform="translate({a:.3f} 0)" width="{b - a:.3f}" height="4.574"/>' for a, b in RUNS[row])
    return f'<g transform="{row_matrix(ROWS_Y[row])}">{glass}<g fill="url(#cells-{tag})">{cells}</g></g>'


def row_shadows() -> str:
    out = []
    for row, ry in enumerate(ROWS_Y):
        m = f"matrix(1 0 {1.184 * SUN_SHIFT[0]:.3f} {4.418 + 1.184 * SUN_SHIFT[1]:.3f} {CLEARANCE * SUN_SHIFT[0]:.3f} {ry + CLEARANCE * SUN_SHIFT[1]:.3f})"
        out.append(f'<g transform="{m}">' + "".join(f'<rect x="{a:.3f}" width="{b - a:.3f}" height="1"/>' for a, b in RUNS[row]) + "</g>")
    return "".join(out)


INVERTER_AT = tuple(CHOSEN["inverters"][0]["position"])
INVERTER_BOX = (1.4, 0.5, 1.0)  # along the edge, across it, high: a marker, not the inverter's size


def inverter_box() -> str:
    """The marker of the inverter on the roof: a small box at the engine's position, the accent's."""
    w, d, h = INVERTER_BOX
    x, y = INVERTER_AT
    footprint = counter_clockwise(rect_points(x - w / 2, y - d / 2, x + w / 2, y + d / 2))
    return prism(footprint, 0.0, h, HOVER, ACCENT, ACCENT).replace("/>", f' stroke="{ACCENT_INK}" stroke-width="0.6" stroke-linejoin="round"/>')


def scene(view: View, tag: str, label: str) -> str:
    """The 3D roof of the demo at 10:30 on the design day: the ground on its grid and the building's
    shadow, the roof and its parapet, the shadows on the roof, the rows and the obstacles back to front,
    the walls; then the inverter's marker over all, as the Projector stands it over the scene."""
    bx, by, bw, bh = view.box
    o = [f'<svg viewBox="{bx} {by} {bw} {bh}" width="{view.width}" height="{view.height}" style="position: absolute; left: 0; top: 0" role="img" aria-label="{label}">']
    o.append(defs(tag))
    o.append(
        f'<g transform="matrix({A} {B} {C} {D} {E} {F + 6 * ZK:.2f})"><rect x="-60" y="-40" width="220" height="140" fill="url(#grid-{tag})"/>'
        + poly(cast(rect_points(0, 0, 90, 40), 6.9), ' fill="#05070A" opacity="0.7"')
        + "</g>"
    )
    o.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="url(#fade-{tag})"/>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F})"><rect width="90" height="40" fill="{ROOF}"/><rect x="1" y="1" width="88" height="38" fill="none" stroke="{PARAPET_SHADE}" stroke-width="0.08" stroke-dasharray="0.5 0.4"/></g>')
    o.append(f'<g transform="matrix({A} {B} 0 -{ZK} {E + C * 40:.2f} {F + D * 40:.2f})"><rect width="90" height="0.9" fill="{PARAPET_LIT}"/></g>')
    o.append(f'<g transform="matrix({C} {D} 0 -{ZK} {E + A * 90:.2f} {F + B * 90:.2f})"><rect width="40" height="0.9" fill="{PARAPET_SHADE}"/></g>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F - ZK * 0.9:.2f})" fill="{PARAPET_CAP}"><rect y="39.8" width="90" height="0.2"/><rect x="89.8" width="0.2" height="40"/></g>')
    x0, y0, x1, y1, h = STAIR
    cx, cy, r, th = TANK_AT
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F})"><g opacity="0.36" fill="{SHADOW}" clip-path="url(#roof-{tag})">')
    o.append('<polygon points="0,0 90,0 89.325,0.9 0,0.9"/><polygon points="90,0 90,40 89.325,40 89.325,0.9"/>')
    o.append(poly(cast(rect_points(x0, y0, x1, y1), h)))
    o.append(poly(cast(circle_points(cx, cy, r), th)))
    for ax0, ay0, ax1, ay1, ah in AC_UNITS:
        o.append(poly(cast(rect_points(ax0, ay0, ax1, ay1), ah)))
    o.append(row_shadows())
    o.append("</g></g>")
    o.append(module_row(5, tag) + module_row(4, tag))
    o.append(cylinder(cx, cy, r, 0.0, th, OBSTACLE_TOP, OBSTACLE_LIT))
    o.append(module_row(3, tag))
    o.append(prism(rect_points(x0, y0, x1, y1), 0.0, h, OBSTACLE_TOP, OBSTACLE_LIT, OBSTACLE_SHADE))
    o.append(module_row(2, tag) + module_row(1, tag))
    for ax0, ay0, ax1, ay1, ah in AC_UNITS:
        o.append(box(ax0, ay0, ax1, ay1, ah))
    o.append(module_row(0, tag))
    o.append(f'<g transform="matrix({A} {B} 0 -{ZK} {E} {F})"><rect y="-6" width="90" height="6.9" fill="{WALL_LIT}"/><rect y="-6" width="90" height="0.4" fill="{WALL_EDGE_LIT}"/></g>')
    o.append(f'<g transform="matrix({C} {D} 0 -{ZK} {E} {F})"><rect y="-6" width="40" height="6.9" fill="{WALL_SHADE}"/><rect y="-6" width="40" height="0.4" fill="{WALL_EDGE_SHADE}"/></g>')
    o.append(f'<g transform="matrix({A} {B} {C} {D} {E} {F - ZK * 0.9:.2f})" fill="{PARAPET_CAP}"><rect width="90" height="0.2"/><rect width="0.2" height="40"/></g>')
    o.append(inverter_box())
    o.append("</svg>")
    return "".join(o)


def drawn_glass(html: str) -> tuple[int, int]:
    """The positions a board draws: coloured and not used, counted in its markup."""
    rects = re.findall(r'<rect x="[^"]+" y="[^"]+" width="1.133" height="2.277" fill="([^"]+)"/>', html)
    return sum(1 for c in rects if c in SERIES), sum(1 for c in rects if c == MODULE_UNUSED)


# --------------------------------------------------------------------------------------------------
# Over the scene, in pixels of the stage: the inverter's label and the callout of string 12
# --------------------------------------------------------------------------------------------------


def module_centre(m: dict) -> tuple[float, float, float]:
    xs = [p[0] for p in m["outline"]]
    ys = [p[1] for p in m["outline"]]
    x, y = sum(xs) / 4, sum(ys) / 4
    up_slope = (y - ROWS_Y[m["row"]]) / math.cos(TILT)
    return x, y, CLEARANCE + up_slope * math.sin(TILT)


def at(view: View, left: float, top: float, point: tuple[float, float, float]) -> tuple[float, float]:
    vx, vy = view.px(*point)
    return left + vx, top + vy


def inverter_label(view: View, left: float, top: float) -> str:
    x, y = at(view, left, top, (INVERTER_AT[0], INVERTER_AT[1], INVERTER_BOX[2]))
    return (
        f'<div style="position: absolute; z-index: 1; left: {x:.0f}px; top: {y - 8:.0f}px; transform: translate(-50%, -100%); padding: 2px 8px; background: {ACCENT}; '
        f'color: {ACCENT_INK}; border-radius: 6px; {MONO}; font-size: 11px; line-height: 16px; font-weight: 500; white-space: nowrap; box-shadow: {SHADOW_LABEL}">INV-1</div>'
    )


def string_callout(view: View, left: float, top: float, line: int = 40) -> str:
    """The callout of string 12, over the middle of its modules: a 1 px line and a 9 px dot; the chip
    over the line, its swatch in the colour of the string's MPPT."""
    centres = [module_centre(MODULES[i]) for i in CALLED["modules"]]
    middle = min(centres, key=lambda c: (c[0] - sum(p[0] for p in centres) / len(centres)) ** 2)
    x, y = at(view, left, top, middle)
    swatch = SERIES[CALLED["mppt"] - 1]
    return (
        f'<div aria-hidden="true" style="position: absolute; z-index: 1; left: {x:.0f}px; top: {y - line:.0f}px; width: 1px; height: {line}px; background: {ACCENT}"></div>'
        f'<div aria-hidden="true" style="position: absolute; z-index: 1; left: {x - 4:.0f}px; top: {y - 4:.0f}px; width: 9px; height: 9px; border-radius: 50%; background: {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.25)"></div>'
        f'<div style="position: absolute; z-index: 1; left: {x:.0f}px; top: {y - line:.0f}px; transform: translate(-50%, -100%); display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 12px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500"><span aria-hidden="true" style="width: 12px; height: 12px; border-radius: 3px; background: {swatch}"></span>{CALLOUT_TITLE}</div>'
        f'<div style="{MONO}; font-size: 12px; color: {TEXT_2}">{CALLOUT_DETAIL}</div></div>'
    )


# --------------------------------------------------------------------------------------------------
# The colour switch and the legend
# --------------------------------------------------------------------------------------------------


def segmented(items: list[str], active: str, label: str, touch: bool, height: int = 34, size: int = 13, grid: bool = True, accent: bool = False) -> str:
    item_height = 44 if touch else height
    radius, seg_radius = (12, 9) if touch else (10, 7)
    font = 14 if touch else size
    buttons = ""
    for item in items:
        if item == active:
            colour = f"color: {ACCENT}; " if accent else ""
            buttons += (
                f'<button role="radio" aria-checked="true" style="height: {item_height}px; padding: 0 12px; background: {CONTROL_ACTIVE}; border: 0; border-radius: {seg_radius}px; {colour}'
                f'font-size: {font}px; font-weight: 500; white-space: nowrap; cursor: pointer; box-shadow: {SHADOW_SEGMENT}">{item}</button>'
            )
        else:
            buttons += (
                f'<button role="radio" aria-checked="false" style="height: {item_height}px; padding: 0 12px; background: transparent; border: 0; border-radius: {seg_radius}px; '
                f'color: {TEXT_2}; font-size: {font}px; white-space: nowrap; cursor: pointer">{item}</button>'
            )
    layout = f"display: grid; grid-template-columns: repeat({len(items)}, minmax(0, 1fr))" if grid else "display: flex"
    return (
        f'<div role="radiogroup" aria-label="{label}" style="{layout}; gap: 2px; padding: 3px; flex-shrink: 0; '
        f'background: {WELL}; border: 1px solid {LINE}; border-radius: {radius}px; box-shadow: {SHADOW_WELL}">{buttons}</div>'
    )


def colour_switch(touch: bool, grid: bool = False) -> str:
    return segmented(["String", "MPPT", "Inverter"], "MPPT", "Colour the strings by", touch, grid=grid)


def swatch(colour: str, size: int = 12) -> str:
    return f'<span aria-hidden="true" style="width: {size}px; height: {size}px; flex-shrink: 0; border-radius: 3px; background: {colour}"></span>'


def legend_item(colour: str, words: str, size: int = 12) -> str:
    return f'<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: {TEXT_2}; white-space: nowrap">{swatch(colour, size)}{words}</span>'


def legend_full() -> str:
    return "".join(legend_item(SERIES[n - 1], f"MPPT {n}") for n in MPPTS) + legend_item(MODULE_UNUSED, "Not used")


def legend_compact() -> str:
    """MPPT and its numbers, each beside its swatch, then Not used: the words in text-2, never in a series colour."""
    numbers = "".join(
        f'<span style="display: flex; align-items: center; gap: 4px; {MONO}; font-size: 12px; color: {TEXT_2}">{swatch(SERIES[n - 1], 10)}{n}</span>' for n in MPPTS
    )
    return (
        f'<div role="list" aria-label="Colours: MPPT 1 to {MPPTS[-1]}, and positions not used" style="display: flex; align-items: center; gap: 10px; white-space: nowrap">'
        f'<span style="font-size: 12px; color: {TEXT_2}">MPPT</span>{numbers}'
        f'<span aria-hidden="true" style="width: 1px; height: 14px; background: {LINE_STRONG}"></span>{legend_item(MODULE_UNUSED, "Not used", 10)}</div>'
    )


def legend_desktop(bottom: int) -> str:
    return (
        f'<div role="group" aria-label="Strings on the roof" style="position: absolute; z-index: 10; left: 24px; bottom: {bottom}px; display: flex; align-items: center; gap: 14px; height: 48px; '
        f'box-sizing: border-box; padding: 0 16px 0 6px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">'
        + colour_switch(False)
        + legend_full()
        + "</div>"
    )


def legend_tablet(width: int) -> str:
    """At the stage's bottom right, level with the pill: the switch over the compact legend."""
    return (
        f'<div role="group" aria-label="Strings on the roof" style="position: absolute; z-index: 10; right: 20px; bottom: 28px; width: {width}px; box-sizing: border-box; display: flex; '
        f'flex-direction: column; gap: 8px; padding: 6px 6px 10px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px; box-shadow: {SHADOW_FLOAT}">'
        + colour_switch(True, grid=True)
        + f'<div style="display: flex; justify-content: center">{legend_compact()}</div></div>'
    )


def legend_phone() -> str:
    return (
        f'<div style="position: absolute; z-index: 1; left: 12px; bottom: 28px; display: flex; align-items: center; height: 32px; box-sizing: border-box; padding: 0 12px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 10px; box-shadow: {SHADOW_FLOAT}">{legend_compact()}</div>'
    )


# --------------------------------------------------------------------------------------------------
# The inspector, as approved (build_lenses.py), its words and numbers from the engine
# --------------------------------------------------------------------------------------------------


def head(title: str, aside: str, mono: bool = False) -> str:
    look = f"{MONO}; font-size: 12px; color: {TEXT_2}" if mono else f"font-size: 12px; color: {TEXT_3}"
    return f'<div style="display: flex; align-items: center; gap: 12px">{section(title)}<span style="margin-left: auto; {look}; white-space: nowrap">{aside}</span></div>'


INVERTER_GLYPH = (
    f'<div style="width: 44px; height: 56px; flex-shrink: 0; box-sizing: border-box; border-radius: 6px; background: {SURFACE_2}; border: 2px solid {LINE_STRONG}; display: flex; '
    f'flex-direction: column; align-items: center; justify-content: center; gap: 5px"><span style="width: 22px; height: 3px; border-radius: 2px; background: {ACCENT}"></span>'
    f'<span style="width: 22px; height: 3px; border-radius: 2px; background: {LINE_STRONG}"></span><span style="width: 22px; height: 3px; border-radius: 2px; background: {LINE_STRONG}"></span></div>'
)
# The approved board's short name of the manufacturer; the file states "WattPower Systems Pvt.Ltd" (decision 15).
INVERTER_FACTS = f"WattPower · {INVERTER['pnom_kw']:.0f} kW · {INVERTER['n_mppt']} MPPT"
INVERTER_LIMITS = f"{CURRENT['value_a']:.1f} A per MPPT · {INVERTER['n_inputs']} inputs"


def inverter_card(touch: bool) -> str:
    return (
        f'<div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
        + INVERTER_GLYPH
        + '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0">'
        f'<div style="font-weight: 600; white-space: nowrap">{INVERTER["model"]}</div>'
        f'<div style="font-size: 12px; color: {TEXT_2}; white-space: nowrap">{INVERTER_FACTS}</div>'
        f'<div style="{MONO}; font-size: 12px; color: {TEXT_3}; white-space: nowrap">{INVERTER_LIMITS}</div></div>'
        f'<button style="height: {44 if touch else 36}px; padding: 0 {14 if touch else 12}px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 9px; font-size: {14 if touch else 13}px; '
        f'cursor: pointer; box-shadow: {SHADOW_RAISED}">Replace</button></div>'
    )


def inverter_row() -> str:
    """On phone the inverter is a row that opens its card, as the module's row of the Array lens."""
    return (
        f'<button style="display: flex; align-items: center; gap: 12px; height: 68px; padding: 0; background: transparent; border: 0; border-bottom: 1px solid {LINE_SUBTLE}; text-align: left; cursor: pointer">'
        f'<span style="width: 30px; height: 42px; flex-shrink: 0; box-sizing: border-box; border-radius: 4px; background: {SURFACE_2}; border: 2px solid {LINE_STRONG}; display: flex; flex-direction: column; '
        f'align-items: center; justify-content: center; gap: 4px"><span style="width: 14px; height: 2px; border-radius: 1px; background: {ACCENT}"></span><span style="width: 14px; height: 2px; border-radius: 1px; '
        f'background: {LINE_STRONG}"></span><span style="width: 14px; height: 2px; border-radius: 1px; background: {LINE_STRONG}"></span></span>'
        f'<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0"><span style="font-weight: 600">{INVERTER["model"]}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">{INVERTER_FACTS}</span><span style="{MONO}; font-size: 12px; color: {TEXT_3}">{INVERTER_LIMITS}</span></span>'
        f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{TEXT_3}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{CHEVRON_RIGHT}</svg></button>'
    )


def voltage_block(touch: bool) -> str:
    return (
        f'<section style="display: flex; flex-direction: column; gap: 8px">{head("System voltage", "Your choice")}'
        + segmented(["600 V", "1000 V", "1500 V"], f"{RANGE['system_v']:.0f} V", "System voltage", touch, height=36, size=14)
        + "</section>"
    )


# Where the band and the marker stand on the track: the approved board's shares.
BAND = (28, 72)


def series_block() -> str:
    lo, hi = BAND
    chosen = hi if CHOSEN["n_series"] == RANGE["n_max"] else lo + (hi - lo) * (CHOSEN["n_series"] - RANGE["n_min"]) / (RANGE["n_max"] - RANGE["n_min"])
    fit = f"{RANGE['n_min']} to {RANGE['n_max']} fit"
    return (
        f'<section style="display: flex; flex-direction: column; gap: 8px">{head("Modules in series", fit, mono=True)}'
        '<div style="position: relative; height: 44px">'
        f'<div style="position: absolute; left: 0; right: 0; top: 8px; height: 8px; border-radius: 4px; background: {WELL}; box-shadow: {SHADOW_TRACK}"></div>'
        f'<div style="position: absolute; left: {lo}%; width: {hi - lo}%; top: 8px; height: 8px; border-radius: 4px; background: {OK}; opacity: 0.55"></div>'
        f'<div style="position: absolute; left: calc({chosen:.0f}% - 2px); top: 2px; width: 4px; height: 20px; border-radius: 2px; background: {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.2)"></div>'
        f'<span style="position: absolute; left: {lo}%; top: 26px; transform: translateX(-50%); {MONO}; font-size: 11px; color: {TEXT_2}; white-space: nowrap">{RANGE["n_min"]} · MPPT minimum</span>'
        f'<span style="position: absolute; left: {hi}%; top: 26px; transform: translateX(-50%); {MONO}; font-size: 11px; color: {TEXT}; white-space: nowrap">{RANGE["n_max"]} · {RANGE["upper_limit"]}</span></div>'
        f'<div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 18px; color: {TEXT_2}">{TICK if CHOSEN["verdict"]["ok"] else NOTE}<span>{VERDICT}</span></div>'
        "</section>"
    )


def option_card(option: dict, caption: str, touch: bool) -> str:
    active = option["key"] == CHOSEN["key"]
    look = (
        f"background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; box-shadow: {HALO_SELECTED}"
        if active
        else f"background: {SURFACE_1}; border: 1px solid {LINE}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)"
    )
    line = f"{option['n_series']} × {option['n_strings']} · {option['dc_kwp']:.2f} · {option['dcac']:.2f}"
    return (
        f'<button role="radio" aria-checked="{"true" if active else "false"}" style="display: flex; align-items: center; gap: 12px; height: {56 if touch else 52}px; flex-shrink: 0; padding: 0 12px; {look}; '
        'border-radius: 12px; text-align: left; cursor: pointer">'
        f'<span style="width: 26px; height: 26px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: {ACCENT if active else CONTROL_ACTIVE}; '
        f'color: {ACCENT_INK if active else TEXT}; {MONO}; font-weight: 500; font-size: 13px">{option["letter"]}</span>'
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column"><span style="font-weight: 500; font-size: {14 if touch else 13}px; white-space: nowrap">{caption}</span>'
        f'<span style="{MONO}; font-size: {12 if touch else 11.5}px; color: {TEXT_2}; white-space: nowrap">{line}</span></span>'
        f'<span style="{MONO}; font-weight: 500; font-size: {14 if touch else 13}px">{option["energy_mwh"]:.1f}</span>{TICK if option["ok"] else NOTE}</button>'
    )


def add_your_own(touch: bool) -> str:
    return (
        f'<button style="display: flex; align-items: center; justify-content: center; gap: 8px; height: {44 if touch else 40}px; flex-shrink: 0; background: transparent; border: 1px dashed {LINE_STRONG}; '
        f'border-radius: 12px; color: {TEXT_2}; font-size: {14 if touch else 13}px; cursor: pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
        f'stroke-linecap="round" aria-hidden="true">{PLUS}</svg>Add your own</button>'
    )


def options_block(touch: bool, grow: bool = True) -> str:
    cards = "".join(option_card(o, c, touch) for o, c in zip(OPTIONS, CAPTIONS))
    stretch = "flex-grow: 1; min-height: 0; " if grow else ""
    return (
        f'<section role="radiogroup" aria-label="Options" style="{stretch}display: flex; flex-direction: column; gap: 6px">'
        f'{head("Options", "series × strings · kWp · DC/AC · MWh")}{cards}{add_your_own(touch)}</section>'
    )


SIZING_WORDS = f"{SIZING['t_min_c']:.1f} to {SIZING['t_max_c']:.1f} °C"


def sizing_row(touch: bool) -> str:
    return (
        f'<button style="display: flex; align-items: center; gap: 10px; height: {48 if touch else 44}px; flex-shrink: 0; padding: 0 12px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 12px; '
        f'text-align: left; font-size: {14 if touch else 13}px; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)"><span style="flex-grow: 1; color: {TEXT_2}; white-space: nowrap">Sizing temperatures</span>'
        f'<span style="{MONO}; font-size: 12px; white-space: nowrap">{SIZING_WORDS}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{TEXT_3}" stroke-width="2" '
        f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{CHEVRON_RIGHT}</svg></button>'
    )


def sizing_row_phone() -> str:
    return (
        f'<button style="display: flex; align-items: center; gap: 12px; height: 64px; padding: 0; background: transparent; border: 0; border-top: 1px solid {LINE_SUBTLE}; text-align: left; cursor: pointer">'
        f'<span style="flex-grow: 1; color: {TEXT_2}">Sizing temperatures</span><span style="{MONO}; font-size: 13px">{SIZING_WORDS}</span>'
        f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{TEXT_3}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{CHEVRON_RIGHT}</svg></button>'
    )


# --------------------------------------------------------------------------------------------------
# The notes beside each board
# --------------------------------------------------------------------------------------------------

NOTES_WIDTH = 360


def notes_column(height: int, *paragraphs: str) -> str:
    body = "".join(f'<p style="margin: 0; font-size: 12px; line-height: 18px; color: {TEXT_2}">{p}</p>' for p in paragraphs)
    return (
        f'<aside aria-label="Notes on the board" style="width: {NOTES_WIDTH}px; height: {height}px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; '
        f'padding: 28px 24px; background: {GROUND}; border-left: 1px solid {LINE}; overflow: hidden">{section("Notes")}{body}</aside>'
    )


def board(screen: str, width: int, height: int, notes: str, font: int) -> str:
    return (
        f'<div style="width: {width + NOTES_WIDTH}px; height: {height}px; display: flex; background: {GROUND}; color: {TEXT}; overflow: hidden">'
        f'<div style="width: {width}px; height: {height}px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; '
        f'font-size: {font}px; line-height: 20px">\n{screen}\n</div>\n{notes}</div>'
    )


MPPT_COUNTS = ", ".join(
    f"MPPT {n} {sum(1 for s in CHOSEN['strings'] if s['mppt'] == n)} strings" for n in MPPTS
)
COMMON_NOTES = (
    f"Option A of the engine at {RANGE['system_v']:.0f} V, the user's choice: {CHOSEN['n_strings']} strings of {CHOSEN['n_series']} (S1 to S{CHOSEN['n_strings']}, numbered along the rows from the south), "
    f"{USED} positions coloured by the MPPT of their string ({MPPT_COUNTS}), the {UNUSED} positions A leaves in moduleUnused. Every string's modules are its layout idx in wired order "
    "(strings_lens_data.json); each is drawn at its engine outline.",
    f"INV-1 stands where the engine places it, ({INVERTER_AT[0]:.2f}, {INVERTER_AT[1]:.1f}) m, on the north edge inside the setback: a small box in the accent with its label, drawn over the rows as the "
    "Projector stands the label over the scene; from this camera the box itself is behind row 6.",
    "The light is the Array boards' at 10:30 on 21 December: the shadows of the parapet, the obstacles and the rows on the roof, the walls lit from the west. The time pill says it.",
)


# --------------------------------------------------------------------------------------------------
# Board 1: desktop, 1440 by 900
# --------------------------------------------------------------------------------------------------

SCENE_LABEL = (
    f"3D view of the Pune demo roof at 10:30 on 21 December: {CHOSEN['n_strings']} strings of {CHOSEN['n_series']} modules coloured by MPPT, "
    f"{UNUSED} positions not used in grey, and the inverter INV-1 on the north edge"
)

PILL_BOTTOM = 116  # the Array board's
PILL_HEIGHT = 44
LEGEND_BOTTOM = PILL_BOTTOM + PILL_HEIGHT + 12  # 12 over the pill, as the shade map's legend over the timeline


def stage_title(top: int, left: int, size: int, line_height: int) -> str:
    return (
        f'<div style="position: absolute; z-index: 1; left: {left}px; top: {top}px; display: flex; flex-direction: column; gap: 2px">'
        f'<div style="{DISPLAY}; font-size: {size}px; line-height: {line_height}px; letter-spacing: -0.02em">Strings</div>'
        f'<div style="color: {TEXT_2}; font-size: 13px">{STAGE_LINE}</div></div>'
    )


def desktop_board() -> str:
    width, height = 1440, 900
    header = piece(MAIN, "<header", "</header>")
    rail = swap_lens(piece(MAIN, '<nav aria-label="Lenses"', "</nav>"), 3)
    a = MAIN.index('<div style="position: absolute; right: 20px; top: 20px;')
    controls = MAIN[a : MAIN.index('<div style="position: absolute; left: 10px; top: 104px', a)].replace("position: absolute;", "position: absolute; z-index: 1;", 1)
    pill = piece(MAIN, f'<div style="position: absolute; left: 24px; bottom: {PILL_BOTTOM}px;', "</div>").replace("position: absolute;", "position: absolute; z-index: 10;", 1)
    vitals = piece(MAIN, '<section aria-label="Design vitals"', "</section>").replace("position: absolute;", "position: absolute; z-index: 10;", 1)
    for figure in (f"{CHOSEN['energy_mwh']:.1f}", f"{CHOSEN['dc_kwp']:.2f}", f"{CHOSEN['dcac']:.2f}", f"{CHOSEN['n_modules']}", f"{CHOSEN['pr']:.1f}", number(CHOSEN["specific_yield"])):
        assert figure in vitals, figure
    view = View(STAGE_VIEW, 964, 492)
    main = (
        f'<main style="flex-grow: 1; position: relative; min-width: 0; background: {GROUND}">\n'
        f'<div style="position: absolute; left: 10px; top: 104px; width: {view.width}px; height: {view.height}px">{scene(view, "d", SCENE_LABEL)}</div>\n'
        + inverter_label(view, 10, 104)
        + string_callout(view, 10, 104)
        + "\n"
        + stage_title(20, 24, 26, 32)
        + "\n"
        + controls
        + legend_desktop(LEGEND_BOTTOM)
        + "\n"
        + pill
        + "\n"
        + vitals
        + "\n</main>"
    )
    inspector = (
        f'<aside aria-label="Strings inspector" style="width: 384px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; padding: 20px; '
        f'background: {CHROME}; border-left: 1px solid {LINE_SUBTLE}; overflow: hidden">\n'
        + inverter_card(False)
        + voltage_block(False)
        + series_block()
        + options_block(False)
        + sizing_row(False)
        + "\n</aside>"
    )
    screen = f'{header}\n<div style="flex-grow: 1; display: flex; min-height: 0">\n{rail}\n{main}\n{inspector}\n</div>'
    notes = notes_column(
        height,
        *COMMON_NOTES,
        f"The callout of string 12, pointed at the middle of its modules: “{CALLOUT_TITLE}”, “{CALLOUT_DETAIL}”, from A's cable schedule ({number(CALLED_CABLE['voc_cold_v'])} V, "
        f"{CALLED_CABLE['length_m']} m). The board drawn by hand said 63 m. Its line and dot are the callout's of components.md; its swatch carries the MPPT, the words stay in text.",
        f"The time pill stands where the Array board puts it, 24 from the left and {PILL_BOTTOM} over the stage's bottom. The colour switch and the legend stand 12 over it "
        f"({LEGEND_BOTTOM} over the bottom), as the shade map's legend stands over the timeline: the two do not fit side by side in the stage's 943.",
        "The inspector is the approved one. The captions of the options are worded by decision 11 from the engine's figures: A recommended; B takes all 24 strings its inverter takes; "
        "C clips 2.4 % against A's 3.4 %; D and E are below the DC/AC target with 2 inverters. The verdict's figures are the series range's; the note on D and E is the amber exclamation.",
    )
    return frame("Studio, Strings lens, desktop", width + NOTES_WIDTH, height, board(screen, width, height, notes, 14))


# --------------------------------------------------------------------------------------------------
# Board 2: tablet, 834 by 1194
# --------------------------------------------------------------------------------------------------

TABLET_LEGEND_WIDTH = 384


def tablet_board() -> str:
    width, height = 834, 1194
    header = piece(TABLET, "<header", "</header>")
    controls = swap_lens(piece(TABLET, '<nav aria-label="Lenses"', "</nav>"), 3) + piece(TABLET, '<div style="position: absolute; right: 20px; top: 16px;', "</div>")
    pill = piece(TABLET, '<div style="position: absolute; left: 20px; bottom: 16px;', "</main>", keep_end=False).replace(
        "position: absolute; left: 20px; bottom: 16px;", "position: absolute; z-index: 10; left: 20px; bottom: 28px;", 1
    )
    vitals = piece(TABLET, '<section aria-label="Design vitals"', "</section>")
    view = View(STAGE_VIEW, 818, 418)
    main = (
        f'<main style="position: relative; height: 508px; flex-shrink: 0; background: {GROUND}">'
        f'<div style="position: absolute; left: 8px; top: 60px; width: {view.width}px; height: {view.height}px">{scene(view, "t", SCENE_LABEL)}</div>'
        + inverter_label(view, 8, 60)
        + controls
        + stage_title(84, 20, 22, 28)
        + legend_tablet(TABLET_LEGEND_WIDTH)
        + pill
        + "</main>"
    )
    inspector = (
        '<div aria-label="Strings inspector" style="flex-grow: 1; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; padding: 24px 20px 20px; overflow: hidden">'
        '<div style="display: flex; flex-direction: column; gap: 22px">' + inverter_card(True) + voltage_block(True) + series_block() + "</div>"
        '<div style="display: flex; flex-direction: column; gap: 14px">' + options_block(True, grow=False) + sizing_row(True) + "</div></div>"
    )
    screen = f"{header}\n{main}\n{vitals}\n{inspector}"
    notes = notes_column(
        height,
        *COMMON_NOTES,
        "The stage of 508 with the lens row and the view controls of the Array board, the title under the lens row as the Sun lens has it. The time pill at the bottom left, 20 from the left "
        "and 28 over the stage's bottom, as built in Phase 6.",
        f"The colour switch and the legend stand at the bottom right, {TABLET_LEGEND_WIDTH} wide, 20 from the right and 28 over the bottom: level with the pill and clear of it, over the "
        "south wall and under the roof's front edge. The switch takes the card's width at 44; under it the legend is compact, MPPT and its numbers each beside its swatch, then Not used. "
        "Both stand 28 over the bottom so that the imagery's attribution, at the bottom left 4 over the edge when imagery is under the roof, stays clear under the pill.",
        "Under the vitals (4 by 2) the inspector in two columns: the inverter card, the system voltage and the modules in series; the options with Add your own, then the closed row of the "
        "sizing temperatures. Everything that takes a touch is 44 or more.",
    )
    return frame("Studio, Strings lens, tablet", width + NOTES_WIDTH, height, board(screen, width, height, notes, 15))


# --------------------------------------------------------------------------------------------------
# Board 3: phone, 390 wide; the sheet drawn at its full length so that all it holds is seen
# --------------------------------------------------------------------------------------------------

PHONE_HEIGHT = 1400


def phone_board() -> str:
    width = 390
    header = piece(PHONE, "<header", "</header>")
    vitals = piece(PHONE, '<section aria-label="Design vitals"', "</section>")
    tabs = piece(PHONE, '<nav aria-label="Workspaces"', "</nav>")
    view = View(STAGE_VIEW, 418, 214)
    inside = (
        f'<div style="position: absolute; left: -14px; top: 22px; width: {view.width}px; height: {view.height}px">{scene(view, "p", SCENE_LABEL)}</div>'
        + inverter_label(view, -14, 22)
        + legend_phone()
    )
    stage = phone_stage(inside)
    content = (
        '<div style="display: flex; flex-direction: column; gap: 18px; padding: 12px 16px 24px">'
        + colour_switch(True, grid=True)
        + '<div style="display: flex; flex-direction: column; gap: 18px">'
        + inverter_row()
        + voltage_block(True)
        + f'<div style="padding-top: 2px">{series_block()}</div>'
        + options_block(True, grow=False)
        + sizing_row_phone()
        + "</div></div>"
    )
    sheet = phone_sheet(content, lens=3, height="flex-grow: 1; min-height: 0")
    screen = f"{header}\n{stage}\n{vitals}\n{sheet}\n{tabs}"
    notes = notes_column(
        PHONE_HEIGHT,
        *COMMON_NOTES,
        "The stage of 252: the play button alone at its top left, as every lens has it on phone; the view controls at its top right; the legend compact at its bottom left, 12 from the left "
        "and 28 over the bottom, where the shade map's legend stands, so that the attribution keeps the line under it.",
        "The sheet at half, drawn at its full length so that all it holds is seen: the lens switch, then the colour switch String, MPPT, Inverter as a segmented control of 44, then the "
        "inspector as rows: the inverter (a press opens its card with Replace), the system voltage with “Your choice”, the modules in series with the bar and the verdict, the options as "
        "cards of 56 with Add your own, the closed row of the sizing temperatures.",
        "No string is selected here: a tap on a module selects its string and its callout stands under the time (plan, step 22).",
    )
    return frame("Studio, Strings lens, phone", width + NOTES_WIDTH, PHONE_HEIGHT, board(screen, width, PHONE_HEIGHT, notes, 15))


if __name__ == "__main__":
    for name, html in (("StringsLens.dc.html", desktop_board()), ("StringsLensTablet.dc.html", tablet_board()), ("StringsLensPhone.dc.html", phone_board())):
        coloured, grey = drawn_glass(html)
        assert (coloured, grey) == (USED, UNUSED), (name, coloured, grey)
        (HERE / name).write_text(html, encoding="utf-8")
        print(f"{name}: {coloured} positions coloured, {grey} not used")
