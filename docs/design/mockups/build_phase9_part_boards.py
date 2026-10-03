"""Writes two boards of Phase 9, step 0 (plan/phase-09-plan.md): HandoverPreviews.dc.html, "Handover, previews", and
HandoverStates.dc.html, "Handover, states".

The first draws the seven previews of the Handover workspace, each as the preview column of the desktop screen (the head
with its title, its facts and its action; then the body), about 960 wide: the single-line diagram as an SVG in the Dusk
palette with the engine's geometry (rooftop_core/plots.py, draw_sld) and the block of MPPT 2 under the pointer with its
tooltip (decision 6); the bill of materials as a Table with "Copy as table" and "In the report, page 5"; the DC cable
schedule sorted by DC cable m downwards with its total row (decision 7); the CAD layout with its layers and the engine's
plan, page 2 of the report (decision 8); the Google Earth model with what is in the file and what is not; the hourly data
with the first eight rows of the CSV and the meaning of each column; the project file with the name as a field, the
file's name and size, and what is embedded (decision 9). The SLD, the BOM and the project file are drawn on phone too, as
the pushed screen of the item.

The second draws the states: before a chosen option, the rows dim with the API's title as their facts, the project file
alone live, the preview a decision card leading to the Strings lens (decision 11); the first load with its skeletons; a
download on its way with the ring in the row and in the button; a download that failed as a toast with the API's words
and Try again (decision 12); the name edited in the project file preview and in the project switcher, and an empty name
refused (decision 13); the toast "Bill of materials copied as a table" (decision 7). The toast, the name and the rows
before an option are drawn on phone too.

Every number and every word of the engine comes from handover_data.json beside this file, written from the engine for
the Pune demo with option A chosen: the system with its strings and inverters, the MPPT loads, the BOM, the cable
schedule, the equipment, the weather's hours, the document, the API's file names and their sizes, the report's pages,
the first rows of the CSV, the KMZ's names, the DXF's layers, the API's words before a voltage and the client's words
when the server cannot be reached. The count of the layout's positions is the API's too (handover_data.json, "layout"). The report's page 2 is the engine's own image in
handover_pages/. Every colour is a token of docs/design/design-tokens.md, by way of the constants of the earlier
builders. The file's name follows the API's file_stem (rooftop_api/services/export.py), mirrored in file_stem below.

Run it in this folder: python3 build_phase9_part_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json
import re

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    ARROW,
    CHEVRON,
    CHROME,
    CLOSE,
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
    SHADOW_PRIMARY,
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
    icon,
    icon_button,
    menu_row,
    note,
    primary,
    ring,
    secondary,
    section,
    state,
    tick,
    toast,
)
from build_phase4_obstacles_by_hand import POINTER
from build_phase5_roof_boards import PHONE, piece
from build_phase6_state_boards import notes, two_columns
from build_phase7_state_boards import FILE, HALO_FOCUS
from build_phase8_part_boards import DIM, DISABLED, HALO_DECISION, NAV_ICONS, TD, TH, caption_line, panel, screen, value_tip
from build_phase8_performance_boards import swap_workspace

DATA = json.loads((HERE / "handover_data.json").read_text(encoding="utf-8"))
POSITIONS = DATA["layout"]["positions"]

# Tokens this file needs beyond the earlier builders': the series colours of the strings by MPPT, the paper of the
# report, the dimming over the screen under a toast's strip.
SERIES = ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300"]
PAPER = "#FBFAF7"
WHITE = "#FFFFFF"

PREVIEWS_HEIGHT = 8468
STATES_HEIGHT = 6595

PREVIEW_WIDTH = 920  # the preview column of the desktop screen: 1440 less the list of 440 and the padding
LIST_WIDTH = 376  # the list at the reduced width of the states board, as approved
CROP_WIDTH = 1240  # a crop of the desktop screen: what a board of 1440 can hold
PAPER_WIDTH = 560  # the engine's plan in its paper frame on the CAD preview

# The API's file name rules (rooftop_api/services/export.py, file_stem), mirrored so that the name under the field is
# the one the API will write.
NOT_IN_A_FILE_NAME = re.compile(r'[\\/:*?"<>|\s\x00-\x1f\x7f]+')
LONGEST_NAME = 80
NAMELESS = "rooftop-design"

# --------------------------------------------------------------------------------------------------
# What the engine answered
# --------------------------------------------------------------------------------------------------

OPTION = DATA["option"]
SYSTEM = OPTION["system"]
STRINGS = SYSTEM["strings"]
INVERTERS = SYSTEM["inverters"]
LOADS = OPTION["mppt_loads"]
BOM = OPTION["bom"]
SCHEDULE = OPTION["cable_schedule"]
MODULE = DATA["equipment"]["module"]
INVERTER = DATA["equipment"]["inverter"]
WEATHER = DATA["weather"]
DOCUMENT = DATA["document"]
FILES = DATA["files"]
PAGES = DATA["pages"]
CSV_HEAD = [line.split(",") for line in DATA["csv_head"]]
KML_NAMES = DATA["kml_names"]
DXF_LAYERS = DATA["dxf_layers"]
NO_OPTIONS = DATA["no_voltage"]["no_options"]
UNREACHABLE = DATA["unreachable"]
NAME = DATA["name"]

N_SERIES, N_STRINGS, N_INVERTERS, N_MODULES = (SYSTEM[k] for k in ("n_series", "n_strings", "n_inverters", "n_modules"))
N_MPPT = INVERTER["n_mppt"]
UNUSED = POSITIONS - N_MODULES
OBSTACLES = DATA["roof"]["obstacles"]


def n0(v: float) -> str:
    return f"{v:,.0f}"


def n1(v: float) -> str:
    return f"{v:,.1f}"


def n2(v: float) -> str:
    return f"{v:,.2f}"


def bom_qty(item: str) -> float:
    return next(row["qty"] for row in BOM if row["item"] == item)


def inverters_words() -> str:
    return "1 inverter" if N_INVERTERS == 1 else f"{N_INVERTERS} inverters"


def file_stem(name: str) -> str:
    words = [word.strip(".") for word in NOT_IN_A_FILE_NAME.split(name)]
    return "-".join(word for word in words if word)[:LONGEST_NAME].rstrip("-.") or NAMELESS


assert file_stem(NAME) + ".rtd" == FILES["names"]["rtd"], "the mirrored file_stem disagrees with the API's name"

# The facts of the rows (decision 14), each computed from the data.
FACTS = {
    "report": f"A4 landscape · {len(PAGES)} pages",
    "sld": f"{N_STRINGS} strings of {N_SERIES} × {MODULE['pnom_w']:.0f} Wp · {inverters_words()}, {N_MPPT} MPPT",
    "bom": f"{n0(bom_qty('PV module'))} modules · {n0(bom_qty('Mounting structure'))} tables · {n0(bom_qty('DC cable'))} m DC cable",
    "schedule": f"{N_STRINGS} strings · Voc cold {n0(SCHEDULE[0]['voc_cold_v'])} V",
    "dxf": "Metres · one layer per string",
    "kmz": f"Roof, obstacles with heights, {N_MODULES} modules",
    "csv": f"{WEATHER['hours']:,} rows · irradiance, temperature, power",
    "rtd": f"{FILES['names']['rtd']} · opens offline",
}
ZIP_FACTS = f"{len(FILES['names']) - 1} files · one zip"
INVERTER_WORDS = f"{INVERTER['pnom_kw']:.0f} kW · {N_MPPT} MPPT"
SLD_TITLE = f"Single-line diagram · {N_STRINGS} strings of {N_SERIES} × {MODULE['pnom_w']:.0f} Wp"
RTD_KB = f"{FILES['bytes']['rtd'] // 1024} KB"
OPTION_WORDS = f"{OPTION['letter']} · {N_SERIES} × {N_STRINGS} on {inverters_words()}"
PAGE_SCHEDULE = next(p["number"] for p in PAGES if p["title"] == "Schedule")
IN_THE_REPORT = f"In the report, page {PAGE_SCHEDULE}"

ROWS = [
    ("PDF", "Design report", FACTS["report"], "file"),
    ("PNG", "Single-line diagram", FACTS["sld"], "file"),
    ("BOM", "Bill of materials", FACTS["bom"], "view"),
    ("DC", "DC cable schedule", FACTS["schedule"], "view"),
    ("DXF", "CAD layout", FACTS["dxf"], "file"),
    ("KMZ", "Google Earth model", FACTS["kmz"], "file"),
    ("CSV", "Hourly data", FACTS["csv"], "file"),
]

# The meaning of each column of the CSV (decision 8: words of mine, approved on the board).
CSV_COLUMNS = {
    "time_utc_hour_start": "The hour's start, UTC",
    "ghi_w_m2": "Global horizontal irradiance, W/m²",
    "poa_eff_w_m2": "Effective irradiance in the plane of the modules, W/m²",
    "t_cell_c": "Cell temperature, °C",
    "p_dc_kw": "DC power into the inverter, kW",
    "p_ac_kw": "AC power to the grid, kW",
}
assert list(CSV_COLUMNS) == CSV_HEAD[0], "the CSV's header is not the one the words are for"

# What each layer of the DXF holds (decision 8).
LAYER_WORDS = {
    "ROOF": "the outline",
    "SETBACK": "the inner line",
    "OBSTACLES": f"{len(OBSTACLES)} footprints",
    "KEEPOUT": "the kept-clear areas",
    "MODULES_UNUSED": f"{UNUSED} positions",
    "INVERTERS": str(N_INVERTERS),
    "TEXT": "the names and heights, " + ", ".join(i["label"] for i in INVERTERS),
}
STRING_LAYERS = [layer for layer in DXF_LAYERS if layer.startswith("STRING_")]
assert len(STRING_LAYERS) == N_STRINGS and all(layer in DXF_LAYERS for layer in LAYER_WORDS)

CHEVRON_RIGHT = '<path d="m9 6 6 6-6 6"/>'
CHEVRON_LEFT = '<path d="m15 6-6 6 6 6"/>'
ARROW_DOWN = '<path d="M12 5v14m0 0-5-5m5 5 5-5"/>'
COPY = '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>'

# --------------------------------------------------------------------------------------------------
# The head of a preview, the frames of the crops
# --------------------------------------------------------------------------------------------------


def head(title: str, facts: str, actions: str = "", facts_html: str = "", touch: bool = False) -> str:
    """The head of the preview column, as the approved board draws it: the title in Geist 600 16, one line of facts,
    the actions at the right."""
    facts_ = facts_html or f'<span style="font-size: 12px; color: {TEXT_2}">{facts}</span>'
    title_ = (
        f'<span style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">{title}</span>'
        if touch
        else f'<span style="font-weight: 600; font-size: 16px">{title}</span>'
    )
    return (
        '<div style="display: flex; align-items: center; gap: 12px">'
        f'<div style="min-width: 0; display: flex; flex-direction: column; gap: 2px">{title_}{facts_}</div>'
        f'<div style="margin-left: auto; flex-shrink: 0; display: flex; align-items: center; gap: 8px">{actions}</div></div>'
    )


def download(label: str, dim: bool = False, busy: bool = False, height: int = 40) -> str:
    before = ring(16) if busy else icon(DOWNLOAD, 16, ACCENT_INK)
    button = primary(label, height, before)
    if dim:
        button = button.replace(f"box-shadow: {SHADOW_PRIMARY}", DISABLED)
    return button


def page_buttons(dim: bool = False) -> str:
    look = f"background: {CONTROL}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}" + (f"; {DISABLED}" if dim else "")
    return "".join(
        f'<button aria-label="{label}" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; cursor: pointer; {look}">{icon(path, 16, colour)}</button>'
        for label, path, colour in (("Previous page", CHEVRON_LEFT, TEXT_3), ("Next page", CHEVRON_RIGHT, TEXT))
    )


def preview(inside: str) -> str:
    """The preview column of the desktop screen, about 960 wide: the head, then the body, on the ground."""
    return screen(inside, PREVIEW_WIDTH)


def tab_bar() -> str:
    """The tab bar of the phone (StudioPhone.dc.html), Handover the current page."""
    return swap_workspace(piece(PHONE, '<nav aria-label="Workspaces"', "</nav>"), 2)


def phone_frame(inside: str) -> str:
    header = piece(PHONE, "<header", "</header>")
    return (
        f'<div style="width: 390px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f"{header}{inside}{tab_bar()}</div>"
    )


def back_row() -> str:
    return (
        f'<a href="Handover.dc.html" style="align-self: flex-start; display: flex; align-items: center; gap: 4px; height: 44px; padding: 0 10px 0 6px; margin-left: -6px; border-radius: 12px; color: {TEXT_2}; font-size: 15px">'
        f"{icon(CHEVRON_LEFT, 18, TEXT_2)}Handover</a>"
    )


def phone_pushed(title: str, facts: str, action: str, body: str) -> str:
    """An item on phone: the list gives way to the item's screen, with a back row "Handover", the title and the facts
    with the action as an icon button of 44, then the body."""
    return phone_frame(
        f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 14px; padding: 0 16px 20px">{back_row()}'
        f'<div style="display: flex; align-items: center; gap: 12px"><div style="min-width: 0; display: flex; flex-direction: column; gap: 2px">'
        f'<span style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">{title}</span><span style="font-size: 13px; color: {TEXT_2}">{facts}</span></div>'
        f'<div style="margin-left: auto; flex-shrink: 0">{action}</div></div>{body}</div>'
    )


def phone_icon_action(label: str, path: str) -> str:
    return (
        f'<button aria-label="{label}" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: {ACCENT}; color: {ACCENT_INK}; '
        f'border: 0; border-radius: 12px; cursor: pointer; box-shadow: {SHADOW_PRIMARY}">{icon(path, 18, ACCENT_INK)}</button>'
    )


def phone_secondary_icon(label: str, path: str) -> str:
    return (
        f'<button aria-label="{label}" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: {CONTROL}; '
        f'border: 1px solid {LINE}; border-radius: 12px; cursor: pointer; box-shadow: {SHADOW_RAISED}">{icon(path, 18, TEXT)}</button>'
    )


def phone_panel(inside: str, gap: int = 10) -> str:
    return panel(inside, "width: 100%", pad="16px", gap=gap)


# --------------------------------------------------------------------------------------------------
# Preview 1: the single-line diagram
# --------------------------------------------------------------------------------------------------


def luminance(colour: str) -> float:
    def channel(hex_: str) -> float:
        c = int(hex_, 16) / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * channel(colour[1:3]) + 0.7152 * channel(colour[3:5]) + 0.0722 * channel(colour[5:7])


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def ink_on(colour: str) -> str:
    """White or accent-ink on a block, whichever contrasts more."""
    return WHITE if contrast(colour, WHITE) >= contrast(colour, ACCENT_INK) else ACCENT_INK


def strings_of(inverter: int, mppt: int) -> list[dict]:
    return [s for s in STRINGS if s["inverter"] == inverter and s["mppt"] == mppt]


def load_of(inverter: int, mppt: int) -> dict:
    return next(l for l in LOADS if l["inverter"] == inverter and l["mppt"] == mppt)


def svg_text(x: float, y: float, words: str, size: int = 12, colour: str = TEXT, weight: int = 400, anchor: str = "middle", mono: bool = False, baseline: str = "middle") -> str:
    family = "'Geist Mono', monospace" if mono else "Geist, sans-serif"
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" dominant-baseline="{baseline}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{colour}">{words}</text>'
    )


def svg_line(x0: float, y0: float, x1: float, y1: float, colour: str = TEXT_2, width: float = 1.5) -> str:
    return f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{colour}" stroke-width="{width}" stroke-linecap="round"/>'


def svg_box(x: float, y: float, w: float, h: float, fill: str = SURFACE_2, stroke: str = LINE_STRONG, extra: str = "") -> str:
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1"{extra}/>'


def mppt_block(x: float, y: float, w: float, h: float, j: int, cnt: int, size: int, hover: bool) -> str:
    colour = SERIES[j % len(SERIES)]
    lift = ' style="filter: brightness(1.14)"' if hover else ""
    return (
        f'<g tabindex="0" role="img" aria-label="{load_of(1, j + 1)["label"]}: {cnt} strings of {N_SERIES} modules"{lift}>'
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="6" fill="{colour}"/>'
        f"{svg_text(x + w / 2, y + h / 2, f'{cnt} × {N_SERIES} mod', size, ink_on(colour), 500)}</g>"
    )


def sld_tooltip(j: int) -> str:
    """The tooltip of a value over an MPPT block: its strings, then its load from mppt_loads."""
    load = load_of(1, j + 1)
    strings = " · ".join(s["label"] for s in strings_of(1, j + 1))
    return value_tip(strings, f"Imp {load['imp_a']:.1f} of {load['imp_limit_a']:.1f} A")


def sld_desktop(width: int, hover: int | None = 1) -> str:
    """The engine's geometry (draw_sld): x from −0.5 to 18, a box per inverter 2.6 wide and max(n_mppt, 2) × 1.1 + 1.0
    high at x 6.2; the MPPT blocks 2.2 by 0.6 at x 0.2, one every 1.1 from y 1.2; the AC line, the ACDB, the meter and
    the grid to the right. Here one inverter, the title drawn over the SVG in HTML."""
    s = width / 18.5
    h_inv = max(N_MPPT, 2) * 1.1 + 1.0
    top, bottom = -0.2, h_inv + 0.6
    height = (bottom - top) * s

    def X(x: float) -> float:
        return (x + 0.5) * s

    def Y(y: float) -> float:
        return (y - top) * s

    out = ""
    tip = ""
    for i in range(N_INVERTERS):
        y0 = i * (h_inv + 1.2)
        out += svg_box(X(6.2), Y(y0), 2.6 * s, h_inv * s)
        out += svg_text(X(7.5), Y(y0 + 0.5), INVERTERS[i]["label"], 13, TEXT, 600)
        out += svg_text(X(7.5), Y(y0 + 0.95), INVERTER_WORDS, 12, TEXT_2)
        for j in range(N_MPPT):
            cnt = len(strings_of(i + 1, j + 1))
            yj = y0 + 1.2 + j * 1.1
            if cnt:
                out += mppt_block(X(0.2), Y(yj - 0.3), 2.2 * s, 0.6 * s, j, cnt, 12, hover == j and i == 0)
                out += svg_line(X(2.4), Y(yj), X(6.2), Y(yj))
                out += svg_text(X(4.3), Y(yj) - 7, f"MPPT {j + 1} · DC", 12, TEXT_2, baseline="auto")
                if hover == j and i == 0:
                    tip = (
                        f'<div style="position: absolute; left: {X(2.4) + 8:.0f}px; top: {Y(yj):.0f}px; transform: translateY(-50%)">{sld_tooltip(j)}</div>'
                        f'<div style="position: absolute; left: {X(1.9):.0f}px; top: {Y(yj) - 2:.0f}px">{POINTER}</div>'
                    )
            else:
                out += svg_text(X(4.3), Y(yj), f"MPPT {j + 1} · not used", 12, TEXT_2)
        ym = y0 + h_inv / 2
        out += svg_line(X(8.8), Y(ym), X(10.6), Y(ym), TEXT, 2)
        out += svg_text(X(9.7), Y(ym) - 7, "AC", 12, TEXT_2, baseline="auto")
    ym = h_inv / 2
    acdb_top, acdb_bottom = ym - 0.6, ym + 0.6
    out += svg_box(X(10.6), Y(acdb_top), 1.4 * s, (acdb_bottom - acdb_top) * s)
    out += svg_text(X(11.3), Y(acdb_top) - 7, "ACDB", 13, TEXT, 600, baseline="auto")
    out += svg_line(X(12.0), Y(ym), X(13.4), Y(ym), TEXT, 2)
    out += svg_box(X(13.4), Y(ym - 0.45), 1.1 * s, 0.9 * s)
    out += svg_text(X(13.95), Y(ym), "kWh", 12, TEXT, 500)
    out += svg_text(X(13.95), Y(ym + 0.75), "Net meter", 12, TEXT_2, baseline="hanging")
    out += svg_line(X(14.5), Y(ym), X(16.0), Y(ym), TEXT, 2)
    out += svg_text(X(16.1), Y(ym) - 9, "Grid /", 13, TEXT, 400, "start")
    out += svg_text(X(16.1), Y(ym) + 9, "LT panel", 13, TEXT, 400, "start")
    svg = f'<svg width="{width}" height="{height:.0f}" viewBox="0 0 {width} {height:.0f}" role="img" aria-label="{SLD_TITLE}" style="display: block; overflow: visible">{out}</svg>'
    return f'<div style="position: relative">{svg}{tip}</div>'


def sld_phone(width: int = 326) -> str:
    """The same diagram on phone: the DC side (the blocks, the lines, the inverter) scaled to the width, the AC side
    under the inverter, downwards, so that every word keeps its size."""
    s = width / 9.3
    h_inv = max(N_MPPT, 2) * 1.1 + 1.0
    top = -0.2

    def X(x: float) -> float:
        return (x + 0.5) * s

    def Y(y: float) -> float:
        return (y - top) * s

    out = svg_box(X(6.2), Y(0), 2.6 * s, h_inv * s)
    out += svg_text(X(7.5), Y(0.5), INVERTERS[0]["label"], 13, TEXT, 600)
    out += svg_text(X(7.5), Y(0.95), f"{INVERTER['pnom_kw']:.0f} kW", 11, TEXT_2)
    out += svg_text(X(7.5), Y(1.3), f"{N_MPPT} MPPT", 11, TEXT_2)
    for j in range(N_MPPT):
        cnt = len(strings_of(1, j + 1))
        yj = 1.2 + j * 1.1
        if cnt:
            out += mppt_block(X(0.2), Y(yj - 0.3), 2.2 * s, 0.6 * s, j, cnt, 11, False)
            out += svg_line(X(2.4), Y(yj), X(6.2), Y(yj))
            out += svg_text(X(4.3), Y(yj) - 6, f"MPPT {j + 1} · DC", 11, TEXT_2, baseline="auto")
        else:
            out += svg_text(X(4.3), Y(yj), f"MPPT {j + 1} · not used", 11, TEXT_2)
    # The AC side, downwards from the middle of the inverter's bottom edge.
    xm = X(7.5)
    y = Y(h_inv)
    out += svg_line(xm, y, xm, y + 40, TEXT, 2)
    out += svg_text(xm + 8, y + 20, "AC", 11, TEXT_2, anchor="start")
    y += 40
    out += svg_box(xm - 46, y, 92, 36)
    out += svg_text(xm, y + 18, "ACDB", 13, TEXT, 600)
    y += 36
    out += svg_line(xm, y, xm, y + 36, TEXT, 2)
    y += 36
    out += svg_box(xm - 30, y, 60, 36)
    out += svg_text(xm, y + 18, "kWh", 12, TEXT, 500)
    out += svg_text(xm - 38, y + 18, "Net meter", 11, TEXT_2, anchor="end")
    y += 36
    out += svg_line(xm, y, xm, y + 36, TEXT, 2)
    y += 36
    out += svg_text(xm, y + 10, "Grid / LT panel", 13, TEXT, 400, baseline="hanging")
    height = y + 30
    svg = f'<svg width="{width}" height="{height:.0f}" viewBox="0 0 {width} {height:.0f}" role="img" aria-label="{SLD_TITLE}" style="display: block">{out}</svg>'
    return svg


def sld_card() -> str:
    body = panel(
        f'<h2 style="margin: 0; font-size: 16px; font-weight: 600">{SLD_TITLE}</h2>' + sld_desktop(PREVIEW_WIDTH - 48) + caption_line("The PNG is the engine's drawing on A4"),
        PREVIEW_WIDTH,
        gap=16,
    )
    desktop = preview(head("Single-line diagram", FACTS["sld"], download("Download PNG")) + body)
    mppt2 = load_of(1, 2)
    phone = phone_pushed(
        "Single-line diagram",
        FACTS["sld"],
        phone_icon_action("Download PNG", DOWNLOAD),
        phone_panel(f'<h2 style="margin: 0; font-size: 16px; font-weight: 600">{SLD_TITLE}</h2>' + sld_phone() + caption_line("The PNG is the engine's drawing on A4"), gap=14),
    )
    side = notes(
        f"The SVG follows the engine's geometry (plots.py, draw_sld): a box per inverter at the middle, {N_MPPT} blocks of MPPTs at the left, each in the series colour of its MPPT as the Strings lens colours "
        f"them, the words “{len(strings_of(1, 1))} × {N_SERIES} mod” in white or accent-ink as the colour allows; a line to the inverter with “MPPT n · DC” over it; from the inverter “AC” to the ACDB, the meter "
        f"“kWh” with “Net meter”, and “Grid / LT panel”. The inverter says “{INVERTERS[0]['label']}” and “{INVERTER_WORDS}”. Every MPPT of the demo has strings, so no “not used” is drawn; an MPPT without "
        "strings would say “MPPT n · not used” in its line, as the engine does.",
        f"Under the pointer the block of MPPT 2 lifts (brightness 1.14) and shows the tooltip of a value beside it, 8 to its right, as the tooltip of a chart stands beside its marker, so that no other block is hidden: its strings, “{' · '.join(s['label'] for s in strings_of(1, 2))}”, then its load "
        f"from mppt_loads, “Imp {mppt2['imp_a']:.1f} of {mppt2['imp_limit_a']:.1f} A”. The same comes with the keyboard focus and on a tap. A list for screen readers says every block.",
        "The PNG is the engine's own drawing on A4 (2338 × 1654), held equal to this by the counts and the words, never by pixels; the line under the drawing says so.",
        "On phone the DC side is scaled to the width and the AC side runs down from the inverter, so that every word keeps its size: the drawing is laid out again, not shrunk.",
    )
    return card(
        "Single-line diagram",
        two_columns(state("Desktop, the preview column of 960: the SVG in the Dusk palette, MPPT 2 under the pointer", desktop), side)
        + state("Phone 390: the item pushed over the list, the download as an icon button of 44", phone),
        gap=14,
    )


# --------------------------------------------------------------------------------------------------
# Preview 2 and 3: the bill of materials and the DC cable schedule, as Tables
# --------------------------------------------------------------------------------------------------


def th(words: str, align: str = "left", sortable: bool = False, active: bool = False) -> str:
    if not sortable:
        return f'<th scope="col" style="{TH}; text-align: {align}">{words}</th>'
    colour = TEXT if active else TEXT_3
    arrow = icon(ARROW_DOWN, 12, TEXT) if active else ""
    sort = ' aria-sort="descending"' if active else ""
    return (
        f'<th scope="col"{sort} style="{TH}; text-align: {align}; padding: 0">'
        f'<button style="display: flex; align-items: center; gap: 4px; width: 100%; height: 36px; padding: 0 8px; justify-content: {"flex-end" if align == "right" else "flex-start"}; '
        f'background: transparent; border: 0; border-radius: 6px; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {colour}; cursor: pointer; white-space: nowrap">{words}{arrow}</button></th>'
    )


def td(words: str, align: str = "left", mono: bool = False, colour: str = TEXT, weight: int = 400, extra: str = "") -> str:
    font = f"{MONO}; font-size: 13px" if mono else ""
    return f'<td style="{TD}; text-align: {align}; color: {colour}; font-weight: {weight}; {font}{extra}">{words}</td>'


def bom_table() -> str:
    rows = "".join(
        f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 500">{row["item"]}</th>'
        f'{td(row["spec"], colour=TEXT_2, extra="; white-space: normal")}{td(n0(row["qty"]), "right", mono=True)}{td(row["unit"])}</tr>'
        for row in BOM
    )
    return (
        f'<table style="width: 100%"><caption style="caption-side: bottom; padding-top: 10px; text-align: left; font-size: 12px; color: {TEXT_2}">The bill of materials of option {OPTION["letter"]}, as the engine lists it</caption>'
        f'<thead><tr>{th("Item")}{th("Specification")}{th("Qty", "right")}{th("Unit")}</tr></thead><tbody>{rows}</tbody></table>'
    )


def bom_cards() -> str:
    cards = "".join(
        f'<div role="listitem" style="display: flex; flex-direction: column; gap: 8px; padding: 14px; background: {SURFACE_2}; border-radius: 12px">'
        f'<span style="font-size: 16px; font-weight: 600">{row["item"]}</span><span style="font-size: 14px; color: {TEXT_2}">{row["spec"]}</span>'
        f'<dl style="margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">'
        f'<div style="display: flex; flex-direction: column; gap: 2px"><dt style="font-size: 12px; color: {TEXT_2}">Qty</dt><dd style="margin: 0; {MONO}; font-weight: 500; font-size: 15px">{n0(row["qty"])}</dd></div>'
        f'<div style="display: flex; flex-direction: column; gap: 2px"><dt style="font-size: 12px; color: {TEXT_2}">Unit</dt><dd style="margin: 0; font-size: 15px">{row["unit"]}</dd></div></dl></div>'
        for row in BOM
    )
    return (
        f'<div role="list" aria-label="The bill of materials of option {OPTION["letter"]}" style="display: flex; flex-direction: column; gap: 8px">{cards}</div>'
        f'<span style="font-size: 12px; color: {TEXT_2}">The bill of materials of option {OPTION["letter"]}, as the engine lists it</span>'
    )


def copy_button(height: int = 40) -> str:
    return secondary("Copy as table", height, icon(COPY, 16, TEXT_2))


def bom_head(touch: bool = False) -> str:
    return head("Bill of materials", FACTS["bom"], caption_line(IN_THE_REPORT) + copy_button(), touch=touch)


def bom_card() -> str:
    desktop = preview(bom_head() + panel(bom_table(), PREVIEW_WIDTH, pad="12px 24px 20px", gap=0))
    phone = phone_pushed(
        "Bill of materials",
        FACTS["bom"],
        phone_secondary_icon("Copy as table", COPY),
        caption_line(IN_THE_REPORT) + phone_panel(bom_cards(), gap=10),
    )
    side = notes(
        f"The Table of components.md: Item in Geist 500 as the head of its row, Specification in Geist text-2 (a column of words), Qty at the right in mono 13 with a comma between thousands, Unit in words. "
        f"The {len(BOM)} rows are the engine's bom of option {OPTION['letter']}, word for word: the module and the inverter as their files name them (D24), the structure, the DC cable "
        f"“{next(r['spec'] for r in BOM if r['item'] == 'DC cable')}” (D25), the connector pairs, the AC cable, the ACDB.",
        f"The head has no primary action: the BOM is in the report, and the head says so, “{IN_THE_REPORT}”, before the secondary “Copy as table”, which writes the rows as tab-separated text with a header "
        "line to the clipboard, pasteable into a spreadsheet, and says so in a toast (the board “Handover, states”).",
        "On phone each row is a card on surface-2: the item in text-title, the specification under it across the width (a column of words has no head on a card), then Qty and Unit as label over value. The copy "
        "is an icon button of 44 in the title's line, with the words in its tooltip and its name.",
    )
    return card(
        "Bill of materials",
        two_columns(state("Desktop: the Table, “Copy as table” and “In the report, page 5” in the head", desktop), side) + state("Phone 390: the rows as cards", phone),
        gap=14,
    )


def schedule_table() -> str:
    rows = sorted(SCHEDULE, key=lambda r: -r["length_m"])
    total = sum(r["length_m"] for r in SCHEDULE)
    body = "".join(
        f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 500">{r["string"]}</th>{td(r["inverter"], mono=True)}{td(str(r["mppt"]), "right", mono=True)}'
        f'{td(str(r["modules"]), "right", mono=True)}{td(n0(r["voc_cold_v"]), "right", mono=True)}{td(n2(r["isc_a"]), "right", mono=True)}{td(n1(r["length_m"]), "right", mono=True)}{td(r["size"], colour=TEXT_2)}</tr>'
        for r in rows
    )
    over = f"border-top: 1px solid {LINE}; border-bottom: 0"
    body += (
        f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 600; {over}">{N_STRINGS} strings</th>'
        + "".join(f'<td style="{TD}; {over}"></td>' for _ in range(5))
        + f'<td style="{TD}; text-align: right; {MONO}; font-size: 13px; font-weight: 500; {over}">{n1(total)}</td><td style="{TD}; {over}"></td></tr>'
    )
    heads = (
        th("String", sortable=True)
        + th("Inverter", sortable=True)
        + th("MPPT", "right", sortable=True)
        + th("Modules", "right", sortable=True)
        + th("Voc cold (V)", "right", sortable=True)
        + th("Isc (A)", "right", sortable=True)
        + th("DC cable (m)", "right", sortable=True, active=True)
        + th("Cable")
    )
    return (
        f'<table style="width: 100%"><caption style="caption-side: bottom; padding-top: 10px; text-align: left; font-size: 12px; color: {TEXT_2}">Sorted by DC cable, the longest first. The order of the engine, by string, is the default</caption>'
        f"<thead><tr>{heads}</tr></thead><tbody>{body}</tbody></table>"
    )


def schedule_card() -> str:
    desktop = preview(head("DC cable schedule", FACTS["schedule"], caption_line(IN_THE_REPORT) + copy_button()) + panel(schedule_table(), PREVIEW_WIDTH, pad="12px 24px 20px", gap=0))
    longest = max(SCHEDULE, key=lambda r: r["length_m"])
    side = notes(
        f"The eight columns in the engine's order: String, Inverter, MPPT, Modules, Voc cold (V), Isc (A), DC cable (m), Cable. Voc cold without decimals ({n0(SCHEDULE[0]['voc_cold_v'])}), Isc with two "
        f"({n2(SCHEDULE[0]['isc_a'])}), the length with one. The {N_STRINGS} rows are the cable_schedule of option {OPTION['letter']}.",
        f"The heads sort (decision 7): each is a button; the active one, “DC cable (m)”, is in the text colour with a small arrow downwards and says aria-sort; the others stay text-3. Sorted by DC cable "
        f"downwards the first row is {longest['string']} with {n1(longest['length_m'])} m. The engine's order, by string, is the default and comes back with a second press on String.",
        f"The total row (components.md “Table”, total) stands over a line without a line under it: “{N_STRINGS} strings” in Geist 600 and the lengths' sum, {n1(sum(r['length_m'] for r in SCHEDULE))}, in Geist Mono 500 under DC "
        "cable. On phone the rows are cards, sorted the same, the total one more card, last.",
    )
    return card("DC cable schedule", two_columns(state("Desktop: sorted by DC cable m downwards, the total row", desktop), side), gap=14)


# --------------------------------------------------------------------------------------------------
# Preview 4, 5 and 6: the CAD layout, the Google Earth model, the hourly data
# --------------------------------------------------------------------------------------------------


def paper_image(page: dict, width: int) -> str:
    height = round(width * page["height"] / page["width"])
    return (
        f'<img src="{page["file"]}" width="{width}" height="{height}" alt="Page {page["number"]} of the report, {page["title"]}" '
        f'style="display: block; width: {width}px; height: {height}px; border-radius: 6px; background: {PAPER}; box-shadow: {SHADOW_PANEL}">'
    )


def fact_row(name: str, words: str, mono: bool = True, name_width: int = 168) -> str:
    name_ = f'<code style="flex-shrink: 0; width: {name_width}px; font-size: 13px">{name}</code>' if mono else f'<span style="flex-shrink: 0; width: {name_width}px">{name}</span>'
    return f'<div style="display: flex; align-items: baseline; gap: 12px; min-height: 28px; border-bottom: 1px solid {LINE_SUBTLE}">{name_}<span style="color: {TEXT_2}">{words}</span></div>'


def layers_list() -> str:
    rows = "".join(fact_row(layer, words) for layer, words in LAYER_WORDS.items())
    rows += fact_row(f"{STRING_LAYERS[0]} to {STRING_LAYERS[-1]}", f"{N_SERIES} modules each")
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px">{section("Layers")}<div style="display: flex; flex-direction: column">{rows}</div>'
        f'{caption_line("R2010 · metres · x east, y north")}</div>'
    )


def cad_card() -> str:
    page2 = next(p for p in PAGES if p["number"] == 2)
    body = (
        f'<div style="display: flex; gap: 24px; align-items: flex-start"><div style="flex-shrink: 0">{paper_image(page2, PAPER_WIDTH)}</div>'
        f'<div style="flex-grow: 1; min-width: 0">{layers_list()}</div></div>'
    )
    desktop = preview(head("CAD layout", FACTS["dxf"], download("Download DXF")) + body)
    side = notes(
        f"At the left the engine's plan: page {page2['number']} of the report, “{page2['title']}”, already drawn, in a paper frame of {PAPER_WIDTH} (decision 8). No second drawing of the plan.",
        f"At the right the DXF's layers from the run, in mono 13 with what is on each in Geist text-2: the seven fixed ones, then one layer per string, {STRING_LAYERS[0]} to {STRING_LAYERS[-1]}, "
        f"{N_SERIES} modules each. MODULES_UNUSED holds the {UNUSED} positions the option does not use, of {POSITIONS}; INVERTERS the {N_INVERTERS}; TEXT the names and heights of the obstacles and the "
        f"inverter's label. The DXF is R2010 in metres, x east and y north, as the line under the list says.",
        f"The file is named by the API, {FILES['names']['dxf']}, {FILES['bytes']['dxf'] // 1024} KB.",
    )
    return card("CAD layout", two_columns(state("Desktop: the engine's plan in its paper frame, the layers beside it", desktop), side), gap=14)


def earth_card() -> str:
    roof = KML_NAMES[1]
    obstacles = KML_NAMES[3 : 3 + len(OBSTACLES)]
    modules = KML_NAMES[3 + len(OBSTACLES)]
    assert modules == f"Modules ({N_MODULES})", modules
    inside = (
        fact_row(roof, "the outline")
        + "".join(fact_row(name, f"the {o['kind'] if o['kind'] != 'cylinder' else 'tank'}'s footprint, its height in the name") for name, o in zip(obstacles, OBSTACLES))
        + fact_row(modules, "the positions used, one by one")
    )
    not_inside = (
        fact_row(f"Positions not used ({UNUSED})", "the layout's free positions stay off the model", mono=False, name_width=220)
        + fact_row("The inverter and the wiring", "the SLD and the schedule carry them", mono=False, name_width=220)
        + fact_row("Heights as shapes", "everything lies flat, the heights are in the names, as the import reads them", mono=False, name_width=220)
    )
    body = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start">'
        f'<div style="display: flex; flex-direction: column; gap: 10px">{section("In the file")}<div style="display: flex; flex-direction: column">{inside}</div></div>'
        f'<div style="display: flex; flex-direction: column; gap: 10px">{section("Not in the file")}<div style="display: flex; flex-direction: column">{not_inside}</div></div></div>'
    )
    desktop = preview(head("Google Earth model", FACTS["kmz"], download("Download KMZ")) + body)
    side = notes(
        f"Two columns. “In the file”: the KML's own names in mono, from the file the engine writes: “{roof}”, the {len(OBSTACLES)} obstacles each as “{obstacles[0]}”, the height in the name, and "
        f"“{modules}”, the positions used one by one. “Not in the file”: the {UNUSED} positions not used, the inverter and the wiring, and that nothing stands up: everything lies flat and the heights are "
        "in the names, as the import of a KMZ reads them (D38 of the import).",
        f"The document's name heads the KML, “{KML_NAMES[0]}”. The file is {FILES['names']['kmz']}, {FILES['bytes']['kmz'] // 1024} KB.",
    )
    return card("Google Earth model", two_columns(state("Desktop: what is in the file, in the KML's names, and what is not", desktop), side), gap=14)


def csv_table() -> str:
    header, rows = CSV_HEAD[0], CSV_HEAD[1:]
    cell = f"padding: 0 8px; height: 36px; white-space: nowrap; border-bottom: 1px solid {LINE_SUBTLE}; {MONO}; font-size: 13px"
    heads = "".join(f'<th scope="col" style="{TH}; text-align: {"left" if i == 0 else "right"}; {MONO}; text-transform: none; letter-spacing: 0; font-weight: 500">{h}</th>' for i, h in enumerate(header))
    body = "".join(
        "<tr>" + "".join(f'<td style="{cell}; text-align: {"left" if i == 0 else "right"}; color: {TEXT_2 if i == 0 else TEXT}">{v}</td>' for i, v in enumerate(row)) + "</tr>" for row in rows
    )
    return (
        f'<table style="width: 100%"><caption style="caption-side: bottom; padding-top: 10px; text-align: left; font-size: 12px; color: {TEXT_2}">The first {len(rows)} of {DATA["csv_rows"]:,} rows</caption>'
        f"<thead><tr>{heads}</tr></thead><tbody>{body}</tbody></table>"
    )


def csv_columns() -> str:
    rows = "".join(fact_row(name, words, name_width=200) for name, words in CSV_COLUMNS.items())
    return f'<div style="display: flex; flex-direction: column; gap: 10px">{section("Columns")}<div style="display: flex; flex-direction: column">{rows}</div></div>'


def csv_card() -> str:
    desktop = preview(head("Hourly data", FACTS["csv"], download("Download CSV")) + panel(csv_table(), PREVIEW_WIDTH, pad="12px 24px 20px", gap=0) + csv_columns())
    side = notes(
        f"The CSV is asked once per run and its first {len(CSV_HEAD) - 1} rows are shown as the file holds them, in mono 13, the time column in text-2: the header line and the hours from "
        f"{CSV_HEAD[1][0]} on. The caption counts: “The first {len(CSV_HEAD) - 1} of {DATA['csv_rows']:,} rows”. The download saves the same bytes (decision 8).",
        "Under the table “Columns” says what each column is, in words of mine for the owner's yes: " + "; ".join(f"{k} “{v}”" for k, v in CSV_COLUMNS.items()) + ".",
        f"The file is {FILES['names']['csv']}, {FILES['bytes']['csv'] // 1024} KB.",
    )
    return card("Hourly data", two_columns(state("Desktop: the header and the first eight rows, the meaning of each column", desktop), side), gap=14)


# --------------------------------------------------------------------------------------------------
# Preview 7: the project file, with the name as a field
# --------------------------------------------------------------------------------------------------


def text_field(value: str, touch: bool = False, focus: bool = False, caret: bool = False, hint: str = "", label: str = "Name") -> str:
    """The name as a text field: the number field's well, 40 high (44 on touch), the label before it in text-2; the
    value in Geist at the left. With the focus: accent border and the halo. A hint under it in text-caption."""
    height = 44 if touch else 40
    size = 15 if touch else 14
    look = f"border: 1px solid {ACCENT}; box-shadow: {HALO_FOCUS}" if focus else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
    caret_ = f'<span aria-hidden="true" style="display: inline-block; width: 1px; height: 18px; margin-left: 1px; vertical-align: text-bottom; background: {TEXT}"></span>' if caret else ""
    hint_ = f'<span style="font-size: 12px; color: {TEXT_2}">{hint}</span>' if hint else ""
    return (
        '<div style="display: flex; flex-direction: column; gap: 6px">'
        f'<label style="display: flex; align-items: center; gap: 12px"><span style="flex-shrink: 0; width: 72px; color: {TEXT_2}">{label}</span>'
        f'<span role="textbox" aria-label="{label}" style="flex-grow: 1; display: flex; align-items: center; height: {height}px; box-sizing: border-box; padding: 0 12px; background: {WELL}; '
        f'border-radius: 10px; font-size: {size}px; {look}">{value}{caret_}</span></label>'
        f'{"<div style=" + chr(34) + "padding-left: 84px" + chr(34) + ">" + hint_ + "</div>" if hint else ""}</div>'
    )


def file_lines(name: str, touch: bool = False) -> str:
    size = 13 if touch else 12
    return (
        f'<div style="display: flex; flex-direction: column; gap: 2px; padding-left: {84 if not touch else 0}px">'
        f'<span style="display: flex; align-items: baseline; gap: 10px"><code style="font-size: {size + 1}px; font-weight: 500">{file_stem(name)}.rtd</code><span style="font-size: {size}px; color: {TEXT_2}">{RTD_KB}</span></span>'
        f'<span style="font-size: {size}px; color: {TEXT_2}">Format {DOCUMENT["format"]} · opens offline, in the desktop app too</span></div>'
    )


def embedded_rows(touch: bool = False) -> str:
    module = DOCUMENT["pan_path"] or "the bundled sample"
    inverter = DOCUMENT["ond_path"] or "the bundled sample"
    rows = [
        ("Module file", module, bool(DOCUMENT["pan_path"])),
        ("Inverter file", inverter, bool(DOCUMENT["ond_path"])),
        ("Weather", f"{WEATHER['label']} · {WEATHER['hours']:,} hours", False),
        ("System voltage", f"{DOCUMENT['system_voltage']:.0f} V", False),
        ("Chosen option", OPTION_WORDS, False),
    ]
    width = 132 if touch else 168
    out = ""
    for label, value, mono in rows:
        value_ = f'<code style="font-size: 13px">{value}</code>' if mono else f"<span>{value}</span>"
        out += f'<div style="display: flex; align-items: baseline; gap: 12px; min-height: 28px; border-bottom: 1px solid {LINE_SUBTLE}"><span style="flex-shrink: 0; width: {width}px; color: {TEXT_2}">{label}</span>{value_}</div>'
    return f'<div style="display: flex; flex-direction: column; gap: 10px">{section("What is in it")}<div style="display: flex; flex-direction: column">{out}</div></div>'


def project_body(name: str = NAME, touch: bool = False, focus: bool = False, caret: bool = False, hint: str = "", value: str | None = None) -> str:
    field = text_field(name if value is None else value, touch, focus, caret, hint)
    return panel(field + file_lines(name, touch) + embedded_rows(touch), PREVIEW_WIDTH if not touch else "width: 100%", pad="22px 24px" if not touch else "16px", gap=18)


def project_card() -> str:
    desktop = preview(head("Project file", FACTS["rtd"], download("Save a copy")) + project_body())
    phone = phone_pushed("Project file", FACTS["rtd"], phone_icon_action("Save a copy", DOWNLOAD), project_body(touch=True))
    side = notes(
        f"The name is a text field (step 6, TextField): the number field's well, 40 high, 44 on touch, labelled “Name”, the value in Geist at the left since it is words. Under it the file's name as the API "
        f"will write it, “{FILES['names']['rtd']}”, in mono, and its size, {RTD_KB} (KB of 1,024, from the bytes the API writes, {FILES['bytes']['rtd']:,}); then “Format {DOCUMENT['format']} · opens offline, in the desktop app too”.",
        f"“What is in it” lists what the .rtd embeds (decision 9): the module file, {DOCUMENT['pan_path'] or 'the bundled sample'}, the inverter file, {DOCUMENT['ond_path'] or 'the bundled sample'} (“the bundled sample” when the "
        f"document names none), the weather with its hours, the system voltage, and the chosen option, “{OPTION_WORDS}”. The file names stand in mono.",
        "“Save a copy” is the primary action here: the .rtd needs no option and no run, so this item is live before a voltage too (decision 1). The same action stands in the project switcher.",
    )
    return card(
        "Project file",
        two_columns(state("Desktop: the name as a field, the file's name and size, what is embedded", desktop), side) + state("Phone 390: the same, the field 44 high", phone),
        gap=14,
    )


def previews_board() -> str:
    width, height = 1440, PREVIEWS_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + sld_card() + bom_card() + schedule_card() + cad_card() + earth_card() + csv_card() + project_card() + "</div>"
    return (
        HEAD.format(
            title="Handover, previews",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Handover, previews",
            lead="The seven previews of the deliverables, each as the preview column of the desktop screen: the single-line diagram under the pointer, the two tables, the CAD layout with its layers, the Google Earth model, the hourly data, the project file; the SLD, the BOM and the project file on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# The list of the deliverables, for the states
# --------------------------------------------------------------------------------------------------


def row(badge: str, title: str, facts: str, kind: str, selected: bool = False, dim: bool = False, skeleton: bool = False, busy: bool = False, touch: bool = False) -> str:
    """A deliverable row (components.md): 64 high, the badge of 44 by 28, the title, one line of facts, then the
    download icon or the chevron."""
    ground = f"background: {SURFACE_2}; border: 1px solid {NOTE_LINE}" if selected else "background: transparent; border: 1px solid transparent"
    badge_look = f"background: {ACCENT}; color: {ACCENT_INK}" if selected else f"background: {CONTROL_ACTIVE}"
    end = ring(16) if busy else icon(DOWNLOAD if kind == "file" else CHEVRON_RIGHT, 18, TEXT if selected else TEXT_3)
    facts_ = bone(96 + (len(title) * 7) % 90, 12) if skeleton else f'<span style="font-size: 12px; color: {TEXT_2}">{facts}</span>'
    fade = f"; {DISABLED}" if dim else ""
    size = 15 if touch else 14
    pressed = ' aria-pressed="true"' if selected else ""
    return (
        f'<button{pressed} style="display: flex; align-items: center; gap: 14px; height: 64px; padding: 0 14px; {ground}; border-radius: 14px; text-align: left; cursor: pointer; font-size: {size}px{fade}">'
        f'<span style="width: 44px; height: 28px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; {badge_look}; border-radius: 6px; {MONO}; font-size: 11px; font-weight: 500">{badge}</span>'
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">{title}</span>{facts_}</span>{end}</button>'
    )


def rows(selected: str = "PDF", dim: bool = False, facts: str | None = None, skeleton: bool = False, busy: str | None = None, only: int | None = None, touch: bool = False) -> str:
    out = ""
    for badge, title, facts_, kind in ROWS[:only]:
        out += row(badge, title, facts if facts is not None else facts_, kind, selected=badge == selected, dim=dim, skeleton=skeleton, busy=busy == badge, touch=touch)
    return f'<div style="display: flex; flex-direction: column; gap: 6px">{out}</div>'


def download_all(dim: bool = False, busy: bool = False, touch: bool = False) -> str:
    button = secondary("Download all", 44 if touch else 36, ring(16) if busy else "")
    if dim:
        button = button.replace(f"box-shadow: {SHADOW_RAISED}", DISABLED)
    return (
        f'<div style="margin-left: auto; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px">{button}'
        f'<span style="font-size: 12px; color: {TEXT_3}{"; " + DISABLED if dim else ""}">{ZIP_FACTS}</span></div>'
    )


def list_title(dim_all: bool = False, busy_all: bool = False, touch: bool = False) -> str:
    size = (22, 28) if touch else (30, 36)
    return (
        '<div style="display: flex; flex-direction: column; gap: 4px">'
        f'<div style="display: flex; align-items: flex-start; gap: 16px"><h1 style="margin: 0; {DISPLAY}; font-size: {size[0]}px; line-height: {size[1]}px; letter-spacing: -0.02em">Handover</h1>{download_all(dim_all, busy_all, touch)}</div>'
        f'<div style="color: {TEXT_2}; font-size: {13 if touch else 14}px">Everything the installer, the client and the utility need</div></div>'
    )


def project_file_card(skeleton: bool = False, touch: bool = False) -> str:
    facts = bone(150, 12) if skeleton else f'<span style="font-size: 12px; color: {TEXT_2}">{FACTS["rtd"]}</span>'
    return (
        f'<div style="margin-top: auto; display: flex; align-items: center; gap: 14px; padding: 16px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
        f'<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">Project file</span>{facts}</div>{secondary("Save a copy", 44 if touch else 40)}</div>'
    )


def aside(inside: str, width: int = LIST_WIDTH) -> str:
    return (
        f'<aside style="width: {width}px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; padding: 28px 24px 24px 24px; border-right: 1px solid {LINE_SUBTLE}">{inside}</aside>'
    )


def desktop_crop(list_html: str, preview_html: str, width: int = CROP_WIDTH) -> str:
    """A crop of the desktop screen under the top bar: the list at the left at the reduced width, the preview beside it."""
    return (
        f'<div style="width: {width}px; box-sizing: border-box; display: flex; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px; overflow: hidden">'
        f"{aside(list_html)}"
        f'<main style="flex-grow: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; padding: 28px 32px 24px 32px">{preview_html}</main></div>'
    )


def phone_list(dim: bool = False, facts: str | None = None, busy_all: bool = False) -> str:
    return phone_frame(
        f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 14px; padding: 8px 16px 16px">{list_title(dim_all=dim, busy_all=busy_all, touch=True)}'
        f"{rows(dim=dim, facts=facts, touch=True)}{project_file_card(touch=True)}</div>"
    )


# --------------------------------------------------------------------------------------------------
# State 1: before a chosen option
# --------------------------------------------------------------------------------------------------


def decision_card() -> str:
    """The decision card (components.md): the API's title as the instruction, its message as the why, the link to the
    Strings lens as a secondary button. Nothing is preselected."""
    link = (
        f'<a href="StringsLensNoVoltage.dc.html" style="flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; background: {CONTROL}; '
        f'border: 1px solid {LINE_STRONG}; border-radius: 10px; color: {TEXT}; font-weight: 500; box-shadow: {SHADOW_RAISED}; white-space: nowrap">Strings lens{icon(ARROW, 16, TEXT_2)}</a>'
    )
    return (
        f'<section aria-label="What the deliverables wait for" style="display: flex; align-items: center; gap: 16px; padding: 22px 24px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; border-radius: 18px; box-shadow: {HALO_DECISION}">'
        f'{note(22)}<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 16px; font-weight: 600">{NO_OPTIONS["title"]}</span>'
        f'<span style="color: {TEXT_2}">{NO_OPTIONS["message"]}</span></span>{link}</section>'
    )


def before_option_card() -> str:
    list_html = list_title(dim_all=True) + rows(dim=True, facts=NO_OPTIONS["title"]) + project_file_card()
    preview_html = head("Design report", "A4 landscape", page_buttons(dim=True) + download("Download PDF", dim=True)) + decision_card()
    crop = desktop_crop(list_html, preview_html)
    phone = phone_list(dim=True, facts=NO_OPTIONS["title"])
    side = notes(
        f"Before a chosen option (no voltage, no positions, no length that fits, too few positions) every row but the project file is dim (opacity-disabled, 0.45) with its icon, and its facts are the API's "
        f"no_options title, “{NO_OPTIONS['title']}” (decision 11, D37). “Download all” is dim with them: the zip needs an option as the five files do. The project file row stays live: the .rtd is written "
        "without an option or a run (decision 1).",
        f"The preview is the decision card of components.md: note-surface, the accent line and halo, the note mark, the API's title as the instruction and its message as the why, “{NO_OPTIONS['message']}”, "
        "and a secondary button to the Strings lens, where the voltage is chosen. No voltage is offered here. The head keeps the item's title; its facts say “A4 landscape” without the count, which comes "
        "with the pages (decision 14); the page buttons and Download PDF are dim.",
        "The web judges nothing itself: require_option of the API would refuse the same way, and the same words serve every reason of no_options.",
    )
    return card(
        "Before a chosen option",
        state(f"Desktop, a crop of {CROP_WIDTH}: the list at {LIST_WIDTH} as approved, every row but the project file dim with the API's title; the decision card in the preview", crop)
        + two_columns(state("Phone 390: the same list", phone), side),
        gap=14,
    )


# --------------------------------------------------------------------------------------------------
# State 2 and 3: the first load, a download on its way
# --------------------------------------------------------------------------------------------------


def paper_skeleton(width: int) -> str:
    height = round(width * PAGES[0]["height"] / PAGES[0]["width"])
    return f'<div style="width: {width}px; height: {height}px; border-radius: 6px; background: {SURFACE_2}; animation: wait 1.6s ease-in-out infinite"></div>'


def thumbnails(skeleton: bool = False, current: int = 1) -> str:
    out = ""
    for page in PAGES:
        on = page["number"] == current
        look = f"background: {SURFACE_2}; border: 1px solid {ACCENT}" if on and not skeleton else f"background: transparent; border: 1px solid {LINE}"
        if skeleton:
            inside = bone(116, 58, 3) + bone(70, 12)
        else:
            inside = f'<span style="height: 58px; border-radius: 3px; background: {PAPER if on else "#D8D6D0"}"></span><span style="font-size: 12px{"" if on else f"; color: {TEXT_2}"}">{page["number"]} · {page["title"]}</span>'
        out += f'<button{" aria-pressed=" + chr(34) + "true" + chr(34) if on and not skeleton else ""} style="display: flex; flex-direction: column; gap: 6px; padding: 8px; {look}; border-radius: 10px; text-align: left; cursor: pointer">{inside}</button>'
    return f'<nav aria-label="Report pages" style="width: 132px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px">{out}</nav>'


def first_load_card() -> str:
    list_html = list_title() + rows(skeleton=True) + project_file_card(skeleton=True)
    paper_width = CROP_WIDTH - LIST_WIDTH - 64 - 132 - 16
    preview_html = (
        head("Design report", "", page_buttons(dim=True) + download("Download PDF", dim=True), facts_html=bone(132, 12))
        + f'<div style="display: flex; gap: 16px; align-items: flex-start">{paper_skeleton(paper_width)}{thumbnails(skeleton=True)}</div>'
    )
    crop = desktop_crop(list_html, preview_html)
    side = notes(
        "The first load: no value was ever there, so every place of a fact holds a skeleton (components.md “Skeleton”): the facts of the rows and of the project file, lines of 12; the facts of the preview's "
        "head; the paper as a block of the page's shape, A4 landscape, on surface-2; the six thumbnails as blocks with their lines. They breathe over 1.6 s and stand still under reduced motion.",
        "The titles stay: they are known before the run. The buttons are dim until the pages come. A fact that was there is never replaced by a skeleton: it stays, dimmed (the next card).",
    )
    return card("The first load", state("Desktop: skeletons in the facts, the head, the paper and the thumbnails", crop) + side, gap=14)


def on_its_way_card() -> str:
    page1 = PAGES[0]
    list_html = list_title(busy_all=True) + rows(busy="PDF", only=3)
    paper_width = CROP_WIDTH - LIST_WIDTH - 64 - 132 - 16
    page_top = (
        f'<div style="width: {paper_width}px; height: 200px; overflow: hidden; border-radius: 6px 6px 0 0; background: {PAPER}; box-shadow: {SHADOW_PANEL}">'
        f'<img src="{page1["file"]}" width="{paper_width}" alt="Page 1 of the report, {page1["title"]}, its top" style="display: block; width: {paper_width}px">'
        "</div>"
    )
    preview_html = (
        head("Design report", f"Page 1 of {len(PAGES)} · {page1['title']}", page_buttons() + download("Download PDF", dim=True, busy=True))
        + f'<div style="display: flex; gap: 16px; align-items: flex-start">{page_top}<div style="height: 200px; overflow: hidden">{thumbnails()}</div></div>'
    )
    crop = f'<div style="height: 372px; overflow: hidden; border-radius: 12px">{desktop_crop(list_html, preview_html)}</div>'
    side = notes(
        "A download on its way (decision 12): the report row shows the turning ring of 16 in place of its download icon; the button “Download PDF” shows the ring before its words and is dim without a shadow "
        "until the file is saved; two presses while it is on its way are one download. “Download all” the same, with its ring, while the zip is made: about a second on the demo, the drawing lock held.",
        "A download done says nothing: the browser shows the file. A download that failed is the toast of the next card.",
    )
    return card("A download on its way", state("Desktop, the top of the screen: the ring in the row, in “Download PDF” and in “Download all”", crop) + side, gap=14)


# --------------------------------------------------------------------------------------------------
# State 4 and 6: the toasts
# --------------------------------------------------------------------------------------------------


def toast_failed(touch: bool = False) -> str:
    out = toast(note(20), UNREACHABLE, "Try again", close=True)
    out = out.replace("font-weight: 500; cursor: pointer\">Try again", "font-weight: 500; cursor: pointer; white-space: nowrap\">Try again")
    if touch:
        out = out.replace("height: 32px; padding: 0 10px", "height: 44px; padding: 0 12px").replace("width: 32px; height: 32px", "width: 44px; height: 44px")
    return out.replace("align-self: flex-start", "align-self: center")


def toast_done(words: str) -> str:
    return toast(tick(18), words).replace("align-self: flex-start", "align-self: center")


def bottom_strip(toast_html: str, width: int = CROP_WIDTH, height: int = 200) -> str:
    """The bottom of the desktop screen, dimmed, with the toast 24 from its edge in the middle."""
    behind = (
        f'<div style="position: absolute; inset: 0; display: flex; opacity: 0.55">'
        f'<div style="width: {LIST_WIDTH}px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 24px 24px; border-right: 1px solid {LINE_SUBTLE}">{project_file_card()}</div>'
        f'<div style="flex-grow: 1; display: flex; gap: 16px; padding: 0 32px"><div style="flex-grow: 1; height: 160px; border-radius: 0 0 6px 6px; background: {PAPER}; box-shadow: {SHADOW_PANEL}"></div>'
        f'<div style="width: 132px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 24px"><div style="height: 84px; border: 1px solid {LINE}; border-radius: 10px"></div></div></div></div>'
    )
    return (
        f'<div style="position: relative; width: {width}px; height: {height}px; box-sizing: border-box; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px; overflow: hidden">'
        f'{behind}<div style="position: absolute; left: 0; right: 0; bottom: 24px; display: flex; flex-direction: column; align-items: center; z-index: 40">{toast_html}</div></div>'
    )


def phone_with_toast(toast_html: str) -> str:
    body = (
        f'<div style="position: relative; flex-grow: 1; display: flex; flex-direction: column; gap: 14px; padding: 8px 16px 16px">{list_title(touch=True)}{rows(only=4, touch=True)}'
        f'<div style="position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; flex-direction: column; z-index: 40">{toast_html}</div></div>'
    )
    return phone_frame(body)


def failed_card() -> str:
    desktop = bottom_strip(toast_failed())
    phone = phone_with_toast(toast_failed(touch=True).replace("align-self: center", "align-self: stretch"))
    side = notes(
        f"A download that failed is a toast with a note (components.md “Toast”): the exclamation mark of 20, the client's words when the server cannot be reached, “{UNREACHABLE}”, the action “Try again” in "
        "accent, Geist 500, and a quiet close button of 32. At the bottom of the screen in its middle, 24 from the edge, in the layer z-toast; it stays until it is closed, and Try again downloads again. "
        "The last good state of the page stays behind it.",
        "A refusal of the API (no option chosen, a wrong day) stands in the same toast in the API's words. On phone the toast stands above the tab bar, 12 from the edges, its action and its close 44 high.",
        "The shell gets its Toaster for this (the open item): one toast at a time, in the order they came, said to a screen reader as a status.",
    )
    return card(
        "A download that failed",
        state("Desktop, the bottom of the screen: the toast with the note, Try again and the close button over the dimmed page", desktop) + two_columns(state("Phone 390: above the tab bar, the action and the close 44 high", phone), side),
        gap=14,
    )


def copied_card() -> str:
    table_top = f'<div style="height: 176px; overflow: hidden">{panel(bom_table(), PREVIEW_WIDTH, pad="12px 24px 20px", gap=0)}</div>'
    done = toast_done("Bill of materials copied as a table")
    crop = (
        f'<div style="position: relative; width: {PREVIEW_WIDTH + 40}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px; padding: 20px 20px 72px; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px; overflow: hidden">'
        f'{bom_head()}{table_top}<div style="position: absolute; left: 0; right: 0; bottom: 24px; display: flex; flex-direction: column; align-items: center; z-index: 40">{done}</div></div>'
    )
    side = notes(
        "“Copy as table” pressed: the rows go to the clipboard as tab-separated text with a header line, and the toast of something done says “Bill of materials copied as a table” with the tick of 18 "
        "(decision 7). It leaves after 5 s (TOAST_STAYS) and stays while the pointer is over it or the focus is in it. The cable schedule says “DC cable schedule copied as a table” the same way.",
        "The table itself does not change: the copy is of what is shown, in the order shown, so a sorted schedule is pasted sorted.",
    )
    return card("Copied as a table", two_columns(state("Desktop: the BOM's head and the toast of something done", crop), side), gap=14)


# --------------------------------------------------------------------------------------------------
# State 5: the name edited, here and in the switcher; an empty name refused
# --------------------------------------------------------------------------------------------------

TYPED = "Pune demo roof, block B"


def switcher_open(field_html: str, touch: bool = False) -> str:
    """The project switcher open (components.md), its "This design" row turned into the name's field."""
    label = f"padding: 8px 10px 4px; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}"
    hollow = f'<span style="width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {TEXT_3}"></span>'
    this_design = (
        f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 4px 10px 10px">{field_html}'
        f'<span style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: {TEXT_2}">{hollow}Not kept on this device</span></div>'
    )
    menu = (
        f'<div style="height: 1px; margin: 0 4px; background: {LINE}"></div>'
        f'<div style="{label}">On this device</div>'
        f'<div style="padding: 2px 10px 10px; font-size: 13px; color: {TEXT_2}">Designs you save appear here.</div>'
        f'<div style="height: 1px; margin: 0 4px 4px; background: {LINE}"></div>'
        '<ul role="menu" aria-label="Project" style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px">'
        + menu_row(PLUS, "New design", "Find the roof")
        + menu_row(FOLDER, "Open a project", ".rtd")
        + menu_row(UPLOAD, "Import a drawing", "KMZ, KML, DXF")
        + menu_row(DOWNLOAD, "Save a copy", ".rtd")
        + menu_row(HOME, "Home")
        + "</ul>"
    )
    if touch:
        return (
            f'<div style="display: flex; flex-direction: column; padding: 8px 10px 16px; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0">'
            f'<div style="display: flex; justify-content: center; padding: 0 0 8px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
            f'<div style="{label}">This design</div>{this_design}{menu}</div>'
        )
    trigger = (
        f'<button aria-haspopup="menu" aria-expanded="true" style="align-self: flex-start; display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; background: {SURFACE_2}; border: 1px solid {LINE}; border-radius: 10px; cursor: pointer">'
        f'<span style="font-weight: 500">{NAME}</span><span style="color: {TEXT_3}; {MONO}; font-size: 12px">{DATA["roof"]["lat"]:.2f}° N · {DATA["roof"]["lon"]:.2f}° E</span>'
        f'<span style="display: flex; transform: rotate(180deg)">{icon(CHEVRON, 16, TEXT_3)}</span></button>'
    )
    panel_ = (
        f'<div style="width: 340px; box-sizing: border-box; display: flex; flex-direction: column; padding: 6px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">'
        f'<div style="{label}">This design</div>{this_design}{menu}</div>'
    )
    return f'<div style="display: flex; flex-direction: column; gap: 6px">{trigger}{panel_}</div>'


def switcher_field(value: str, touch: bool = False, caret: bool = True, hint: str = "") -> str:
    """The name's field inside the switcher: the well across the row, 40 high (44 on touch), with the focus."""
    height = 44 if touch else 40
    caret_ = f'<span aria-hidden="true" style="display: inline-block; width: 1px; height: 18px; margin-left: 1px; vertical-align: text-bottom; background: {TEXT}"></span>' if caret else ""
    hint_ = f'<span style="font-size: 12px; color: {TEXT_2}">{hint}</span>' if hint else ""
    return (
        f'<span role="textbox" aria-label="Name" style="display: flex; align-items: center; height: {height}px; box-sizing: border-box; padding: 0 12px; background: {WELL}; border: 1px solid {ACCENT}; '
        f'border-radius: 10px; font-size: {15 if touch else 14}px; font-weight: 500; box-shadow: {HALO_FOCUS}">{value}{caret_}</span>{hint_}'
    )


def name_edited_card() -> str:
    body = project_body(TYPED, focus=True, caret=True).replace(f"width: {PREVIEW_WIDTH}px", "width: 100%")
    typed_preview = f'<div style="width: 760px; display: flex; flex-direction: column; gap: 20px; padding: 20px; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}">{head("Project file", FACTS["rtd"], download("Save a copy"))}{body}</div>'
    empty = text_field("", focus=True, caret=True, hint="A name is needed")
    empty_crop = f'<div style="width: 760px; display: flex; flex-direction: column; gap: 20px; padding: 20px; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}">{panel(empty + file_lines(NAME), "width: 100%", gap=18)}</div>'
    switcher = switcher_open(switcher_field(TYPED))
    phone_preview = phone_pushed("Project file", FACTS["rtd"], phone_icon_action("Save a copy", DOWNLOAD), project_body(TYPED, touch=True, focus=True, caret=True))
    phone_sheet = phone_frame(
        f'<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-end; background: rgba(5,7,10,0.72)"><div style="height: 140px"></div>{switcher_open(switcher_field(TYPED, touch=True), touch=True)}</div>'
    )
    stem = file_stem(TYPED)
    side = notes(
        f"The name is typed in the field of the project file preview: the focus look (accent border, the halo), the caret after “{TYPED}”. The file's name under it follows every key, as the API will write "
        f"it: “{stem}.rtd” (fileStemOf in TS mirrors file_stem: what a file system refuses and every run of spaces become one dash; the comma stays, since the API keeps it). The head's facts, the top bar and the switcher's trigger keep the committed name until Enter or the focus leaving commits the draft.",
        "Enter or leaving the field commits: the document's name changes, trimmed, 200 characters at most, undone by key like any edit; it asks neither the layout nor the run (decision 13). The top bar and "
        "the switcher show it at once, and every downloaded file carries it.",
        "In the project switcher the “This design” row is the same field, across the row, with the state of saving under it. On phone and tablet the switcher is a bottom sheet over the dimmed screen, the "
        "field 44 high.",
        "An empty or blank name is not committed: the field gives the name of before back and says “A name is needed” under itself, in the style of a number field's hint (D32: an edit that cannot stand is "
        "not committed). The next good entry takes the words away.",
    )
    row1 = (
        '<div style="display: grid; grid-template-columns: 760px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Desktop: the name half typed in the preview's field, the file's name following", typed_preview)
        + state("The project switcher open: “This design” is the same field", switcher)
        + "</div>"
    )
    row2 = (
        '<div style="display: grid; grid-template-columns: 760px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("The field empty: the hint “A name is needed”; the name of before stands in the file's name", empty_crop)
        + side
        + "</div>"
    )
    row3 = (
        '<div style="display: grid; grid-template-columns: 390px 390px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Phone 390: the field in the preview, 44 high", phone_preview)
        + state("Phone 390: the switcher's sheet with the field", phone_sheet)
        + "</div>"
    )
    return card("The name edited", row1 + row2 + row3, gap=14)


def states_board() -> str:
    width, height = 1440, STATES_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + before_option_card() + first_load_card() + on_its_way_card() + failed_card() + name_edited_card() + copied_card() + "</div>"
    return (
        HEAD.format(
            title="Handover, states",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Handover, states",
            lead="Before a chosen option, in the API's words, leading to the Strings lens; the first load with its skeletons; a download on its way with its rings; a download that failed as a toast with Try again; the name edited here and in the switcher, and an empty name refused; the toast of a table copied; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


BOARDS = {
    "HandoverPreviews.dc.html": previews_board,
    "HandoverStates.dc.html": states_board,
}


if __name__ == "__main__":
    for name, build in BOARDS.items():
        html = build()
        (HERE / name).write_text(html, encoding="utf-8")
    print(", ".join(BOARDS))
