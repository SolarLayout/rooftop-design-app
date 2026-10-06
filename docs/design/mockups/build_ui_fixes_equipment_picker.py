"""The boards "UI fixes · Choose a module or an inverter" on desktop 1440, tablet 834 and phone 390.

The owner (session 18): users may not have a PAN or an OND file at hand. The app carries a library of them (the
owner's PVsyst files, as their makers publish them), and Replace on the module card and on the inverter card opens a
picker over it: a search, range sliders to narrow it (the module by its power; the inverter by its AC power and its
MPPT count), the list, and the file of one's own still taken. The rows are real: equipment_picker_data.json, taken from
the owner's indexes of the two libraries. Written beside this script: EquipmentPicker.dc.html,
EquipmentPickerTablet.dc.html, EquipmentPickerPhone.dc.html.
Usage: python3 -I build_ui_fixes_equipment_picker.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import (  # noqa: E402
    ACCENT, CLOSE, CONTROL, CONTROL_ACTIVE, GROUND, HALO_SELECTED, LINE, LINE_STRONG, LINE_SUBTLE, NOTE, NOTE_LINE,
    NOTE_SURFACE, SHADOW_PANEL, SHADOW_WELL, SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, TICK, UPLOAD, WELL, icon,
    primary, quiet, ring, secondary,
)

DATA = json.loads((HERE / "equipment_picker_data.json").read_text(encoding="utf-8"))
DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
MONO = "font-family: 'Geist Mono', monospace"
SEARCH = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'
SHADOW_HANDLE = "0 1px 2px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)"
DIM = "rgba(5,7,10,0.72)"

# The names of the makers as people know them; the file's own name stays on the card (decisions 14 and 15).
MAKERS = {
    "Heliene Inc": "Heliene", "Silfab Solar Inc.": "Silfab", "Silfab": "Silfab", "ET SOLAR": "ET Solar",
    "Ginlong Technologies": "Solis", "Fronius International": "Fronius", "Kaco new energy": "KACO",
    "MA SOLAR ITALY": "FIMER", "FIMER": "FIMER", "Chint Power Systems (CPS)": "CPS",
}
# A model that comes in two files is told apart by the file's data source (DataSource=).
TWICE = {m["model"] for m in DATA["modules"] if sum(1 for n in DATA["modules"] if n["model"] == m["model"]) > 1}

# The scale of the AC power goes by steps, closer at the low end: 232 of the 405 inverters are of 20 kW or less.
KW_STOPS = [0.7, 1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350]


def num(value: float, decimals: int = 0) -> str:
    return f"{value:,.{decimals}f}"


def kw(value: float) -> str:
    return num(value, 1) if value < 1 else num(value)


def at_kw(value: float) -> float:
    return KW_STOPS.index(value) / (len(KW_STOPS) - 1)


# ---------------------------------------------------------------------------------------------------
# Controls, in two sizes: desktop, and touch (tablet and phone)
# ---------------------------------------------------------------------------------------------------


def search(value: str, placeholder: str, touch: bool) -> str:
    height = 44 if touch else 40
    shown = (
        f'<span style="flex-grow: 1; min-width: 0">{value}</span>'
        f'<button aria-label="Clear the search" style="display: flex; padding: 0; background: transparent; border: 0; color: {TEXT_2}">{icon(CLOSE, 16)}</button>'
        if value
        else f'<span style="flex-grow: 1; min-width: 0; color: {TEXT_3}">{placeholder}</span>'
    )
    return (
        f'<div role="searchbox" style="display: flex; align-items: center; gap: 10px; height: {height}px; box-sizing: border-box; padding: 0 12px; '
        f'background: {WELL}; border: 1px solid {LINE}; border-radius: 10px; box-shadow: {SHADOW_WELL}; font-size: {16 if touch else 14}px">'
        f"{icon(SEARCH, 16, TEXT_2)}{shown}</div>"
    )


def range_slider(label: str, start: float, end: float, shown: str, unit: str, ticks: list[tuple[float, str]], touch: bool) -> str:
    """The range slider of the kit: the label at the left, the two values at the right, the track filled between the
    handles; ticks under it. 20 high on desktop, 44 on touch with handles of 26."""
    high, handle, border = (44, 26, 4) if touch else (20, 18, 3)

    def place(fraction: float) -> str:
        return f"calc({handle / 2}px + ({fraction:.4f} * (100% - {handle}px)))"

    def knob(fraction: float, name: str) -> str:
        return (
            f'<div role="slider" aria-label="{label}, {name}" style="position: absolute; left: calc({place(fraction)} - {handle / 2}px); top: {(high - handle) / 2}px; '
            f'width: {handle}px; height: {handle}px; box-sizing: border-box; border-radius: 50%; background: {TEXT}; border: {border}px solid {ACCENT}; box-shadow: {SHADOW_HANDLE}"></div>'
        )

    marks = "".join(
        f'<span style="position: absolute; left: {place(fraction)}; transform: translateX(-50%)">{text}</span>' for fraction, text in ticks
    )
    return (
        '<div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">'
        f'<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px"><span style="color: {TEXT_2}">{label}</span>'
        f'<span style="{MONO}; font-weight: 500; font-size: {16 if touch else 14}px; white-space: nowrap">{shown}<span style="color: {TEXT_2}; font-size: 12px; font-weight: 400"> {unit}</span></span></div>'
        f'<div role="group" aria-label="{label}" style="position: relative; height: {high}px">'
        f'<div style="position: absolute; left: 0; right: 0; top: {high / 2 - 2}px; height: 4px; border-radius: 2px; background: {LINE}"></div>'
        f'<div style="position: absolute; left: {place(start)}; width: calc({end - start:.4f} * (100% - {handle}px)); top: {high / 2 - 2}px; height: 4px; border-radius: 2px; background: {ACCENT}"></div>'
        f"{knob(start, 'from')}{knob(end, 'to')}</div>"
        f'<div style="position: relative; height: 14px; {MONO}; font-size: 11px; color: {TEXT_3}">{marks}</div></div>'
    )


def power_slider(start: float, end: float, touch: bool) -> str:
    scale = lambda w: (w - 300) / 350  # noqa: E731
    return range_slider("Power", scale(start), scale(end), f"{num(start)} – {num(end)}", "Wp",
                        [(scale(w), num(w)) for w in (300, 400, 500, 650)], touch)


def ac_slider(start: float, end: float, touch: bool) -> str:
    return range_slider("AC power", at_kw(start), at_kw(end), f"{kw(start)} – {kw(end)}", "kW",
                        [(at_kw(v), kw(v)) for v in (0.7, 10, 50, 125, 350)], touch)


def mppt_slider(start: int, end: int, touch: bool) -> str:
    scale = lambda n: (n - 1) / 14  # noqa: E731
    return range_slider("MPPT", scale(start), scale(end), f"{start} – {end}", "", [(scale(n), str(n)) for n in (1, 5, 10, 15)], touch)


def tag(text: str, look: str = "plain") -> str:
    colours = {"plain": f"color: {TEXT_2}; border: 1px solid {LINE_STRONG}", "note": f"color: {ACCENT}; border: 1px solid {NOTE_LINE}; background: {NOTE_SURFACE}",
               "here": f"color: {TEXT}; border: 1px solid {LINE_STRONG}; background: {SURFACE_2}"}[look]
    return f'<span style="flex-shrink: 0; height: 18px; padding: 0 6px; display: inline-flex; align-items: center; border-radius: 6px; font-size: 11px; font-weight: 500; {colours}">{text}</span>'


# ---------------------------------------------------------------------------------------------------
# The rows of the list
# ---------------------------------------------------------------------------------------------------


def module_cells(row: dict, source: str = "") -> tuple[str, str, list[str]]:
    maker = MAKERS.get(row["maker"], row["maker"])
    second = maker + (f" · {source}" if source else "")
    bif = num(row["bif"], 2) if row["bif"] else "–"
    return row["model"], second, [num(row["wp"]), num(row["eff"], 1), f'{num(row["h"], 2)} × {num(row["w"], 2)}', bif]


def inverter_cells(row: dict) -> tuple[str, str, list[str]]:
    maker = MAKERS.get(row["maker"], row["maker"])
    return row["model"], maker, [kw(row["kw"]), str(row["mppt"]), f'{num(row["vmin"])}–{num(row["vmax"])}', num(row["vabs"])]


def list_row(first: str, second: str, numbers: list[str], columns: str, height: int, selected: bool = False, tags: str = "", last: bool = False) -> str:
    look = (
        f"background: {CONTROL_ACTIVE}; box-shadow: inset 2px 0 0 {ACCENT}, {HALO_SELECTED}"
        if selected
        else ""
    )
    edge = "" if last else f"border-bottom: 1px solid {LINE_SUBTLE};"
    mark = (
        f'<span style="width: 16px; display: flex">{icon(TICK, 16, ACCENT, 2.4)}</span>'
        if selected
        else '<span style="width: 16px"></span>'
    )
    cells = "".join(f'<span style="{MONO}; font-size: 13px; text-align: right; white-space: nowrap">{n}</span>' for n in numbers)
    return (
        f'<div role="option" aria-selected="{"true" if selected else "false"}" style="display: grid; grid-template-columns: 16px {columns}; gap: 14px; align-items: center; '
        f'height: {height}px; box-sizing: border-box; padding: 0 14px 0 10px; {edge} {look}">{mark}'
        f'<span style="min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="display: flex; align-items: center; gap: 8px; min-width: 0">'
        f'<span style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{first}</span>{tags}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{second}</span></span>{cells}</div>'
    )


CHEVRON = '<path d="m6 9 6 6 6-6"/>'
ARROW_UP = '<path d="M12 19V5m0 0-6 6m6-6 6 6"/>'
ARROW_DOWN = '<path d="M12 5v14m0 0-6-6m6 6 6-6"/>'
UP_DOWN = '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>'


def head_cell(name: str, first: bool, sorts: bool, active: str, high: int) -> str:
    """A head that sorts is a button (the table's sorting, the board "Handover, previews"): the active one in text with
    its arrow, the others in text-3 with a quiet mark of up and down that says they sort. A head that does not sort is words."""
    align = "flex-start" if first else "flex-end"
    if not sorts:
        return f'<span style="display: flex; justify-content: {align}">{name}</span>'
    mark = icon(ARROW_UP if active == "up" else ARROW_DOWN, 14, TEXT, 2.2) if active else icon(UP_DOWN, 12, TEXT_3, 2)
    order = {"up": "ascending", "down": "descending", "": "none"}[active]
    colour = TEXT if active else TEXT_3
    return (
        f'<button aria-sort="{order}" style="display: flex; align-items: center; justify-content: {align}; gap: 4px; height: {high}px; margin: 0 -6px; padding: 0 6px; '
        f'background: transparent; border: 0; border-radius: 6px; font-size: 12px; color: {colour}; font-weight: {500 if active else 400}; cursor: pointer; white-space: nowrap">{name}{mark}</button>'
    )


def list_head(names: list[str], columns: str, sorts: list[bool] | None = None, active: int = 1, way: str = "up", high: int = 32) -> str:
    sorts = sorts or [False] * len(names)
    cells = "".join(head_cell(n, i == 0, sorts[i], way if i == active else "", high) for i, n in enumerate(names))
    return (
        f'<div style="display: grid; grid-template-columns: 16px {columns}; gap: 14px; align-items: center; height: {high}px; padding: 0 14px 0 10px; '
        f'border-bottom: 1px solid {LINE}; font-size: 12px; color: {TEXT_3}; background: {SURFACE_1}"><span></span>{cells}</div>'
    )


def list_well(head: str, rows: str, height: int, scrolled: bool = False, empty: bool = False) -> str:
    bar = "" if empty else (
        f'<span aria-hidden="true" style="position: absolute; right: 3px; top: {48 if scrolled else 36}px; width: 4px; height: 64px; border-radius: 2px; background: {LINE_STRONG}"></span>'
    )
    return (
        f'<div role="listbox" style="position: relative; height: {height}px; overflow: hidden; border: 1px solid {LINE}; border-radius: 12px; background: {WELL}; box-shadow: {SHADOW_WELL}">'
        f"{head}{rows}{bar}</div>"
    )


def count_line(text: str, clear: bool = True) -> str:
    right = f'<button style="padding: 0; background: transparent; border: 0; color: {TEXT_2}; text-decoration: underline; text-underline-offset: 3px; cursor: pointer">Clear the filters</button>' if clear else ""
    return f'<div role="status" style="display: flex; align-items: baseline; justify-content: space-between; font-size: 13px; color: {TEXT_2}"><span>{text}</span>{right}</div>'


def own_file(kind: str, touch: bool, phone: bool = False) -> str:
    """The file of one's own: a slim drop under the list, its button to choose one (on phone the button alone)."""
    if phone:
        return secondary(f"Choose {'an' if kind == 'OND' else 'a'} {kind} file of your own", 48, icon(UPLOAD, 18, TEXT_2)).replace("flex-shrink: 0;", "width: 100%;")
    return (
        f'<div style="display: flex; align-items: center; gap: 12px; height: {60 if touch else 52}px; box-sizing: border-box; padding: 0 8px 0 14px; '
        f'border: 1px dashed {LINE_STRONG}; border-radius: 12px">{icon(UPLOAD, 18, TEXT_2)}'
        f'<span style="flex-grow: 1; color: {TEXT_2}">Or drop {"an" if kind == "OND" else "a"} {kind} file of your own here</span>{secondary("Choose a file", 44 if touch else 36)}</div>'
    )


def header(title: str, touch: bool, phone: bool = False) -> str:
    close = "" if phone else (
        f'<button aria-label="Close" style="flex-shrink: 0; width: {44 if touch else 32}px; height: {44 if touch else 32}px; display: flex; align-items: center; justify-content: center; '
        f'background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}">{icon(CLOSE, 18)}</button>'
    )
    return (
        f'<div style="display: flex; align-items: center; gap: 12px"><h3 style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; '
        f'letter-spacing: -0.02em">{title}</h3>{close}</div>'
    )


def foot(file: str, use: str, touch: bool, waiting: bool = False, reading: bool = False) -> str:
    height = 44 if touch else 40
    action = (
        primary("Reading", height, ring(16)).replace("cursor: pointer", "cursor: default")
        if reading
        else primary(use, height).replace("cursor: pointer", "cursor: default; opacity: 0.45") if waiting else primary(use, height)
    )
    chosen = f'<code style="flex-grow: 1; min-width: 0; font-size: 12px; color: {TEXT_3}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{file}</code>' if file else '<span style="flex-grow: 1"></span>'
    return f'<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px">{chosen}{quiet("Cancel", height)}{action}</div>'


def dialog(width: int, body: str, touch: bool) -> str:
    return (
        f'<div role="dialog" style="width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; padding: {24 if touch else 22}px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">{body}</div>'
    )


def over_dim(inner: str, width: int, height: int) -> str:
    return (
        f'<div style="display: flex; align-items: center; justify-content: center; width: {width}px; height: {height}px; flex-shrink: 0; '
        f'border-radius: 12px; background: {DIM}; border: 1px solid {LINE_SUBTLE}">{inner}</div>'
    )


# ---------------------------------------------------------------------------------------------------
# The dialogs
# ---------------------------------------------------------------------------------------------------

M_TOTAL, I_TOTAL = DATA["modules_total"], DATA["inverters_total"]
MODULE_PICKED = "144HC-560 M10 NTYP SL Bifacial"
INVERTER_PICKED = "S5-GC125K-HV"
MODULE_FILE = next(m["file"] for m in DATA["modules"] if m["model"] == MODULE_PICKED)
INVERTER_FILE = next(i["file"] for i in DATA["inverters"] if i["model"] == INVERTER_PICKED)


def module_rows(columns: str, n: int, height: int, picked: str, count: int, here: str = "", skip: int = 0, given: list[dict] | None = None) -> str:
    rows = []
    shown = (given or DATA["modules"])[skip: skip + count]
    for i, row in enumerate(shown):
        first, second, numbers = module_cells(row, row["source"] if row["model"] in TWICE else "")
        tags = tag("In this design", "here") if row["model"] == here else ""
        rows.append(list_row(first, second, numbers[:n], columns, height,
                             selected=row["model"] == picked, tags=tags, last=i == count - 1))
    return "".join(rows)


def inverter_rows(columns: str, n: int, height: int, picked: str, rows_of: list[dict]) -> str:
    rows = []
    for i, row in enumerate(rows_of):
        first, second, numbers = inverter_cells(row)
        tags = tag("Preliminary", "note") if row["pre"] else ""
        rows.append(list_row(first, second, numbers[:n], columns, height, selected=row["model"] == picked, tags=tags, last=i == len(rows_of) - 1))
    return "".join(rows)


def module_sorts(names: list[str]) -> list[bool]:
    """The module sorts by its model, its power, its efficiency and its bifaciality; the size is two numbers, and does not."""
    return [not n.startswith("Size") for n in names]


def inverter_sorts(names: list[str]) -> list[bool]:
    """The inverter sorts by its model, its AC power, its MPPT and its maximum DC voltage; the MPPT window is two numbers."""
    return [n != "MPPT V" for n in names]


def sorted_list(width: int) -> str:
    """The modules sorted by efficiency, high to low: the head of efficiency active with its arrow down."""
    given = sorted(DATA["modules"], key=lambda m: -m["eff"])
    head = list_head(D_MODULE_NAMES, D_MODULE_COLUMNS, module_sorts(D_MODULE_NAMES), active=2, way="down")
    rows = module_rows(D_MODULE_COLUMNS, 4, 52, MODULE_PICKED, 5, here="144HC-550 M10 SL Bifacial", given=given)
    return f'<div style="width: {width}px">{list_well(head, rows, 296)}</div>'


def module_dialog(width: int, touch: bool, list_height: int, rows: int, columns: str, names: list[str], skip: int = 0) -> str:
    filters = (
        f'<div style="display: grid; grid-template-columns: {"1fr" if touch else "1fr 1fr"}; gap: {16 if touch else 24}px; align-items: end">'
        f'{search("", "Maker or model", touch)}{power_slider(540, 580, touch)}</div>'
    )
    count = len(DATA["modules"])
    body = (
        header("Choose a module", touch) + filters
        + count_line(f"{count} of {M_TOTAL} modules")
        + list_well(list_head(names, columns, module_sorts(names), high=44 if touch else 32), module_rows(columns, len(names) - 1, 60 if touch else 52, MODULE_PICKED, rows, here="144HC-550 M10 SL Bifacial", skip=skip), list_height)
        + own_file("PAN", touch) + foot(MODULE_FILE, "Use this module", touch)
    )
    return dialog(width, body, touch)


def inverter_dialog(width: int, touch: bool, list_height: int, rows: int, columns: str, names: list[str]) -> str:
    sliders = f'{ac_slider(50, 125, touch)}{mppt_slider(4, 10, touch)}'
    filters = (
        f'<div style="display: grid; grid-template-columns: {"1fr 1fr" if touch else "1.1fr 1fr 0.8fr"}; gap: {16 if touch else 24}px; align-items: end">'
        + (f'<div style="grid-column: 1 / -1">{search("", "Maker or model", touch)}</div>' if touch else search("", "Maker or model", touch))
        + f"{sliders}</div>"
    )
    count = len(DATA["inverters"])
    shown = DATA["inverters"][-rows:]
    body = (
        header("Choose an inverter", touch) + filters
        + count_line(f"{count} of {I_TOTAL} inverters")
        + list_well(list_head(names, columns, inverter_sorts(names), high=44 if touch else 32), inverter_rows(columns, len(names) - 1, 60 if touch else 52, INVERTER_PICKED, shown), list_height, scrolled=True)
        + own_file("OND", touch) + foot(INVERTER_FILE, "Use this inverter", touch)
    )
    return dialog(width, body, touch)


def empty_dialog(width: int, touch: bool, list_height: int, columns: str, names: list[str]) -> str:
    filters = (
        f'<div style="display: grid; grid-template-columns: {"1fr 1fr" if touch else "1.1fr 1fr 0.8fr"}; gap: {16 if touch else 24}px; align-items: end">'
        + (f'<div style="grid-column: 1 / -1">{search("huawei", "", touch)}</div>' if touch else search("huawei", "", touch))
        + f'{ac_slider(0.7, 350, touch)}{mppt_slider(1, 15, touch)}</div>'
    )
    nothing = (
        f'<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: {list_height - 34}px; padding: 0 32px; text-align: center">'
        f'<span style="color: {TEXT}">No inverter in the app matches “huawei”.</span>'
        f'<span style="font-size: 13px; color: {TEXT_2}">The search reads the maker, the model and the file’s name. An OND file of your own is taken below.</span>'
        f'{secondary("Clear the search", 44 if touch else 36)}</div>'
    )
    body = (
        header("Choose an inverter", touch) + filters
        + count_line(f"0 of {I_TOTAL} inverters", clear=False)
        + list_well(list_head(names, columns, inverter_sorts(names), high=44 if touch else 32), nothing, list_height, empty=True)
        + own_file("OND", touch) + foot("", "Use this inverter", touch, waiting=True)
    )
    return dialog(width, body, touch)


def reading_foot(width: int, touch: bool) -> str:
    return f'<div style="width: {width}px; box-sizing: border-box; padding: 14px 22px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 16px">{foot(MODULE_FILE, "Use this module", touch, reading=True)}</div>'


def refused(width: int) -> str:
    return (
        f'<div style="width: {width}px; box-sizing: border-box; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: {NOTE_SURFACE}; '
        f'border: 1px solid {NOTE_LINE}; border-radius: 12px">{icon(NOTE, 18, ACCENT)}<span style="display: flex; flex-direction: column; gap: 2px">'
        f'<span style="font-weight: 500">This module was not loaded</span><span style="font-size: 12px; color: {TEXT_2}">'
        f'Heliene_144HC-560-M10-NTYP-SL-Bifacial.PAN: not a PVsyst module file (PNom, Voc or Isc missing). The module of before is kept.</span></span></div>'
    )


# ---------------------------------------------------------------------------------------------------
# Phone: the bottom sheet of the dialog, at its full height
# ---------------------------------------------------------------------------------------------------


def phone_row(first: str, second: str, third: str, selected: bool = False, tags: str = "", last: bool = False) -> str:
    look = f"background: {CONTROL_ACTIVE}; box-shadow: inset 2px 0 0 {ACCENT}" if selected else ""
    edge = "" if last else f"border-bottom: 1px solid {LINE_SUBTLE};"
    mark = f'<span style="width: 18px; display: flex">{icon(TICK, 18, ACCENT, 2.4)}</span>' if selected else '<span style="width: 18px"></span>'
    return (
        f'<div role="option" aria-selected="{"true" if selected else "false"}" style="display: flex; align-items: center; gap: 10px; min-height: 64px; box-sizing: border-box; '
        f'padding: 8px 12px 8px 8px; {edge} {look}">{mark}<span style="min-width: 0; flex-grow: 1; display: flex; flex-direction: column; gap: 2px">'
        f'<span style="display: flex; align-items: center; gap: 8px; min-width: 0"><span style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{first}</span>{tags}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{second}</span>'
        f'<span style="{MONO}; font-size: 12px; color: {TEXT_2}; white-space: nowrap">{third}</span></span></div>'
    )


def phone_count(text: str, sort: str, clear: bool = True) -> str:
    """On phone the list has no heads: the order is a select beside the count, its options each column that sorts, both ways."""
    link = f' · <button style="padding: 0; background: transparent; border: 0; color: {TEXT_2}; text-decoration: underline; text-underline-offset: 3px">Clear the filters</button>' if clear else ""
    trigger = (
        f'<button aria-haspopup="listbox" aria-label="Sort" style="display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px; background: {CONTROL}; '
        f'border: 1px solid {LINE}; border-radius: 9px; font-size: 13px; white-space: nowrap">{sort}{icon(CHEVRON, 14, TEXT_2)}</button>'
    )
    return f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; color: {TEXT_2}"><span>{text}{link}</span>{trigger}</div>'


def phone_sheet(title: str, filters: str, count: str, rows: str, list_height: int, kind: str, use: str, waiting: bool = False) -> str:
    action = primary(use, 48).replace("flex-shrink: 0;", "width: 100%;")
    if waiting:
        action = action.replace("cursor: pointer", "cursor: default; opacity: 0.45")
    return (
        f'<div style="position: relative; width: 390px; height: 844px; flex-shrink: 0; overflow: hidden; border-radius: 12px; background: {DIM}; border: 1px solid {LINE_SUBTLE}">'
        f'<div role="dialog" style="position: absolute; left: 0; right: 0; top: 48px; bottom: 0; display: flex; flex-direction: column; gap: 12px; padding: 8px 16px 24px; '
        f'background: {SURFACE_1}; border-top: 1px solid {LINE_STRONG}; border-radius: 22px 22px 0 0; box-shadow: {SHADOW_PANEL}">'
        f'<div style="display: flex; justify-content: center; height: 20px; align-items: center"><span style="width: 40px; height: 5px; border-radius: 3px; background: {LINE_STRONG}"></span></div>'
        f"{header(title, True, phone=True)}{filters}{count}"
        f'<div role="listbox" style="flex: 1 1 0; min-height: {list_height}px; overflow: hidden; border: 1px solid {LINE}; border-radius: 12px; background: {WELL}; box-shadow: {SHADOW_WELL}">{rows}</div>'
        f'<div style="display: flex; flex-direction: column; gap: 8px">{action}{own_file(kind, True, phone=True)}</div></div></div>'
    )


def phone_module() -> str:
    rows = []
    for i, row in enumerate(DATA["modules"][3:9]):
        first, second, numbers = module_cells(row)
        rows.append(phone_row(first, second, f"{numbers[0]} Wp · {numbers[1]} % · {numbers[2]} m", selected=row["model"] == MODULE_PICKED,
                              tags=tag("In this design", "here") if row["model"] == "144HC-550 M10 SL Bifacial" else "", last=i == 5))
    filters = f'<div style="display: flex; flex-direction: column; gap: 10px">{search("", "Maker or model", True)}{power_slider(540, 580, True)}</div>'
    return phone_sheet("Choose a module", filters, phone_count(f"{len(DATA['modules'])} of {M_TOTAL}", "Power, low to high"), "".join(rows), 323, "PAN", "Use this module")


def phone_inverter() -> str:
    rows = []
    shown = DATA["inverters"][-7:]
    for i, row in enumerate(shown):
        first, second, numbers = inverter_cells(row)
        rows.append(phone_row(first, second, f"{numbers[0]} kW · {numbers[1]} MPPT · {numbers[2]} V", selected=row["model"] == INVERTER_PICKED,
                               tags=tag("Preliminary", "note") if row["pre"] else "", last=i == len(shown) - 1))
    filters = f'<div style="display: flex; flex-direction: column; gap: 10px">{search("", "Maker or model", True)}{ac_slider(50, 125, True)}{mppt_slider(4, 10, True)}</div>'
    return phone_sheet("Choose an inverter", filters, phone_count(f"{len(DATA['inverters'])} of {I_TOTAL}", "AC power, low to high"), "".join(rows), 238, "OND", "Use this inverter")


def phone_empty() -> str:
    filters = f'<div style="display: flex; flex-direction: column; gap: 10px">{search("huawei", "", True)}{ac_slider(0.7, 350, True)}{mppt_slider(1, 15, True)}</div>'
    nothing = (
        f'<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 100%; padding: 0 20px; text-align: center">'
        f'<span>No inverter in the app matches “huawei”.</span><span style="font-size: 13px; color: {TEXT_2}">An OND file of your own is taken below.</span>'
        f'{secondary("Clear the search", 44)}</div>'
    )
    return phone_sheet("Choose an inverter", filters, phone_count(f"0 of {I_TOTAL}", "AC power, low to high", clear=False), nothing, 238, "OND", "Use this inverter", waiting=True)


# ---------------------------------------------------------------------------------------------------
# The boards
# ---------------------------------------------------------------------------------------------------

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
body{{margin:0;font-family:Geist,system-ui,sans-serif;background:#0B0E13;color:#F2F4F7}}
button,input{{font:inherit;color:inherit}}
code{{font-family:'Geist Mono',monospace}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important}}}}
</style>
</helmet>
"""
TAIL = """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""


def caption(text: str, inner: str) -> str:
    return f'<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 13px; color: {TEXT_2}">{text}</span>{inner}</div>'


def notes(*lines: str) -> str:
    return '<div style="display: flex; flex-direction: column; gap: 10px; max-width: 560px">' + "".join(
        f'<p style="margin: 0; font-size: 13px; color: {TEXT_2}">{line}</p>' for line in lines) + "</div>"


def board(file: str, title: str, width: int, pad: int, intro: str, rows: str, height: int) -> None:
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px; padding: 40px {pad}px; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'Choose a module or an inverter</h1><p style="margin: 0; max-width: 980px; color: {TEXT_2}">{intro}</p></div>{rows}</div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


INTRO = (
    "Replace on the module card and on the inverter card opens a picker over the app's own library of PVsyst files. "
    "A search over the maker, the model and the file's name, and range sliders to narrow the list: the module by its power, "
    "the inverter by its AC power and its count of MPPT. The list is sorted by power. A row is chosen, then used; the file "
    "is read by the engine as a dropped file is, so the card, the layout and the energy follow as they do today. A file of "
    "one's own is still taken, under the list. {size}"
)

D_MODULE_COLUMNS = "minmax(0, 1fr) 64px 76px 96px 64px"
D_MODULE_NAMES = ["Module", "Wp", "Efficiency %", "Size m", "Bifacial"]
D_INVERTER_COLUMNS = "minmax(0, 1fr) 56px 48px 96px 72px"
D_INVERTER_NAMES = ["Inverter", "AC kW", "MPPT", "MPPT V", "Max DC V"]
T_MODULE_COLUMNS = "minmax(0, 1fr) 60px 64px 96px"
T_MODULE_NAMES = ["Module", "Wp", "Eff. %", "Size m"]
T_INVERTER_COLUMNS = "minmax(0, 1fr) 56px 48px 92px"
T_INVERTER_NAMES = ["Inverter", "AC kW", "MPPT", "MPPT V"]

if __name__ == "__main__":
    row = lambda *parts: f'<div style="display: flex; gap: 48px; align-items: flex-start">{"".join(parts)}</div>'  # noqa: E731
    desktop = "".join((
        row(caption("The module: 760 wide, filtered to 540 – 580 Wp; the module of the design marked, another chosen",
                    over_dim(module_dialog(760, False, 400, 7, D_MODULE_COLUMNS, D_MODULE_NAMES), 840, 940)),
            notes(
                "The dialog is the kit's, wider: 760 (a new width, `dialog-wide`). The title, the filters, the count, the list, the file of one's own, the foot; no sentence under the title (the owner, after the first boards).",
                "The search and the slider share the first row. The power runs 300 to 650 Wp, the library's own ends, in steps of 5; at rest both handles stand at the ends and every module is listed.",
                "A row: the model, and under it the maker as people know it (Heliene, not “Heliene Inc”); when one model comes in two files, the second line adds the file's data source (“TUV SUD”, “Manufacturer 2021”). Then the numbers in mono: Wp, efficiency, size, bifaciality.",
                "The module of the design, when it is one of the library, carries “In this design” and the list opens scrolled to it. A press chooses a row (the tick, the accent edge); the arrows move the choice, Enter uses it. The chosen file's name stands in the foot.",
                "“Use this module” waits until a row other than the design's is chosen. Used, the file is read by /equipment/module as a dropped file is; the dialog closes when it is read, and the card shows the module.",
                "The card keeps the names as the file states them (decisions 14, 15); the picker alone shortens the maker.",
            )),
        row(caption("Sorted: a press on Efficiency sorts the list high to low by it (its arrow down); the module chosen stays chosen",
                    sorted_list(760)),
            notes(
                "Sorting is the table's (the board “Handover, previews”, the cable schedule). A head that sorts is a button across its cell: the module by Module, Wp, Efficiency and Bifacial; the inverter by Inverter, AC kW, MPPT and Max DC V. Size and the MPPT window are two numbers each, and do not sort.",
                "The list opens sorted by power, low to high: Wp (AC kW) is the active head, with its arrow up. A first press on another head sorts by it, the figures high to low and the names A to Z; a second press turns it; a third gives the order by power back.",
                "The heads that sort and are not active carry a quiet mark of up and down in text-3, so that they read as buttons; the active one is in text with its arrow. aria-sort on each.",
                "The order, the filters and the search hold together: the count is of what is shown, in the order chosen. The choice stays when the order changes, and the list keeps it in view.",
            )),
        row(caption("The inverter: 50 – 125 kW and 4 – 10 MPPT; a preliminary file tagged",
                    over_dim(inverter_dialog(760, False, 400, 7, D_INVERTER_COLUMNS, D_INVERTER_NAMES), 840, 940)),
            notes(
                "Three in the first row: the search, the AC power, the MPPT.",
                "The AC power goes by steps, closer at the low end (0.7, 1, 2, 3, 5, 8, 10, 15 … 300, 350 kW), as most of the library is small: 232 of 405 are of 20 kW or less. The MPPT go 1 to 15, one by one.",
                "A row: the model, the maker; the AC kW, the MPPT, the MPPT window and the maximum DC voltage, in mono. A file its maker calls preliminary is tagged “Preliminary”; a superseded file is not in the library.",
                "No inverter is filtered by the system voltage: it is never chosen for the user (rule 3). The maximum DC voltage is shown so that the user can read it against theirs.",
            )),
        row(caption("Nothing matches: the words say so, and how to go on; Use waits; the heads keep their order",
                    over_dim(empty_dialog(760, False, 400, D_INVERTER_COLUMNS, D_INVERTER_NAMES), 840, 940)),
            '<div style="display: flex; flex-direction: column; gap: 32px">'
            + caption("Used: the button reads the file (the ring); the rest waits", reading_foot(560, False))
            + caption("Refused by the engine (it should not happen: every file of the library is read when it is added): the note under the list, in its words; the module of before stays (D32)", refused(560))
            + "</div>"),
    ))
    board("EquipmentPicker.dc.html", "UI fixes · Choose a module or an inverter · desktop 1440", 1552, 56, INTRO.format(size="Desktop 1440."), desktop, 3600)

    stack = lambda *parts: f'<div style="display: flex; flex-direction: column; gap: 40px">{"".join(parts)}</div>'  # noqa: E731
    tablet = stack(
        caption("The module: 680 wide, touch sizes (the search and the slider 44, rows 60, the actions 44); bifaciality leaves the row",
                over_dim(module_dialog(680, True, 392, 6, T_MODULE_COLUMNS, T_MODULE_NAMES, skip=1), 834, 1194)),
        caption("The inverter: the search alone in the first row, the two sliders under it; the maximum DC voltage leaves the row",
                over_dim(inverter_dialog(680, True, 392, 6, T_INVERTER_COLUMNS, T_INVERTER_NAMES), 834, 1194)),
        caption("Nothing matches", over_dim(empty_dialog(680, True, 392, T_INVERTER_COLUMNS, T_INVERTER_NAMES), 834, 1194)),
    )
    board("EquipmentPickerTablet.dc.html", "UI fixes · Choose a module or an inverter · tablet 834", 834, 0,
          INTRO.format(size="Tablet 834: the same dialog at 680, in touch sizes; the heads that sort are 44 high."), tablet, 3960)

    phone = stack(
        caption("The module: the bottom sheet at its full height; the row in three lines; the order a select beside the count (Power, Efficiency, Bifaciality, Model, each both ways)", phone_module()),
        caption("The inverter: the two sliders under each other; the order by AC power, MPPT, Max DC voltage or Model", phone_inverter()),
        caption("Nothing matches", phone_empty()),
    )
    board("EquipmentPickerPhone.dc.html", "UI fixes · Choose a module or an inverter · phone 390", 390, 0,
          INTRO.format(size="Phone 390: the dialog's bottom sheet, at its full height. The actions under each other: Use this module, then the file of one's own; the handle closes."), phone, 3100)
