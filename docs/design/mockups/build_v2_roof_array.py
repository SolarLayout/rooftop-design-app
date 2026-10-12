"""The boards "V2 · 7 · The Roof and Array steps, and the Sun view" on desktop 1440, tablet 834 and phone 390.

The inputs of the Roof and Array steps re-written in plain words and grouped, and the Sun view's figures named for what they
are (plan/v2/audit.md: V2-27, V2-30, V2-33, V2-34, V2-35, V2-53, V2-61, V2-70, V2-73, V2-107, V2-113). Today Edges and access
is a grid of six engine words (Parapet, Setback, Walkway, Every · mod, Clearance, Albedo); the module card carries the PAN
file's electrical figures; Spacing speaks in GCR and profile angles; the Sun lens's tiles say "Near, linear" and "Electrical,
beyond linear". V2: labels in plain words with the term after, fields in groups 8 apart and groups 24 apart, the label in
primary text at the value's weight, the module card reduced to what a buyer names, Spacing in one sentence, the Sun view's
figures in plain names. Drawn with build_v2_parts.py and the Pune demo's numbers.
Usage: python3 -I build_v2_roof_array.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, ACCENT_INK, CHROME, CONTROL, ICON, LINE, LINE_STRONG, LINE_SUBTLE, OK, RADIUS, SHADOW_FLOAT, STEP_ICON,
    SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, board_head, button, changes, field, frame, icon, mark, roof_svg,
    section_title, segmented, style, summary_row, tab_bar, text, top_bar, work_column, write_board,
)
from build_v2_progression import view_controls  # noqa: E402

ISSUES = "Answers V2-27 · V2-30 · V2-33 · V2-34 · V2-35 · V2-53 · V2-59 · V2-61 · V2-70 · V2-73 · V2-107 · V2-113"
LINES = [
    "Every field says what it is in plain words, the trade's term after it where there is one: Edge margin (setback), "
    "Walkway every 24 modules. Fields stand in groups of what belongs together, 8 apart inside a group and 24 between "
    "groups. The label is in primary text at the value's weight; the hint under it says who set the value or the usual one.",
    "The module card names the module as a buyer does: model, maker, power, size, and Change. Its electrical figures are "
    "behind Details. Spacing says in one sentence why the rows stand where they do. Roof albedo has one home, Performance's "
    "assumptions; the roof's line here points to it.",
    "The Sun view names its figures for what they are: Rows and obstacles, Strings, Horizon, Area kept clear. The time "
    "and its timeline belong to this view alone. Layers is one toggle, Imagery, in the view controls.",
]
DONE = {"Roof": "done"}


def group(title: str, rows: str, touch: bool) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{text("strong", title, touch, TEXT_2)}{rows}</div>')


def switch(label: str, hint: str, on: bool, touch: bool) -> str:
    track = (f'<span style="width: 40px; height: 24px; border-radius: 9999px; flex: none; position: relative; '
             f'background: {ACCENT if on else WELL}; border: 1px solid {ACCENT if on else LINE_STRONG}; box-sizing: border-box">'
             f'<span style="position: absolute; top: 2px; {"right" if on else "left"}: 2px; width: 18px; height: 18px; border-radius: 50%; '
             f'background: {ACCENT_INK if on else TEXT_2}"></span></span>')
    return (f'<label style="display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: {44 if touch else 40}px">'
            f'<span style="display: flex; flex-direction: column; gap: 4px">{text("body", label, touch)}{text("body", hint, touch, TEXT_2)}</span>{track}</label>')


def edges_open(touch: bool) -> str:
    edges = group("At the edges", field("Parapet height", "0.90", "m", "Default · measure it on site", touch, 112)
                  + field("Edge margin (setback)", "1.00", "m", "Default · usually 0.5 to 1.5 m", touch, 112), touch)
    access = group("Access", field("Walkway width", "0.60", "m", "Default", touch, 112)
                   + field("Walkway every", "24", "modules", "Default · one across each row", touch, 136), touch)
    around = group("Round obstacles", field("Clearance", "0.50", "m", "Default · kept free on every side", touch, 112), touch)
    albedo = (f'<a href="#" style="display: flex; align-items: center; justify-content: space-between; text-decoration: none; padding-top: 8px; '
              f'border-top: 1px solid {LINE_SUBTLE}">{text("body", "Roof albedo 0.20 · in Performance, Assumptions", touch, TEXT_2)}{icon(ICON["arrow-right"], 14, TEXT_2)}</a>')
    return (summary_row("Edges and access", "Parapet 0.9 m · margin 1.0 m", touch, True, "Default")
            + f'<div style="display: flex; flex-direction: column; gap: 24px; padding-bottom: 24px">{edges}{access}{around}{albedo}</div>')


def obstacles_open(touch: bool) -> str:
    items = [("Stair room", "Box · 5.0 × 4.0 m · 3.0 m high", True), ("Water tank", "Tank · 2.5 m across · 2.0 m high", False),
             ("AC units", "4 boxes · 1.5 × 1.0 m · 1.2 m high", False)]
    rows = "".join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 12px; border-radius: {RADIUS["row"]}px; '
                   f'{"background: " + SURFACE_2 + "; border: 1px solid " + ACCENT if sel else "border: 1px solid transparent"}">'
                   f'<span style="flex: 1; display: flex; flex-direction: column">{text("strong", a, touch)}{text("body", b, touch, TEXT_2)}</span>'
                   f'{icon(ICON["chevron-right"], 16, TEXT_2)}</div>' for a, b, sel in items)
    add = (f'<div style="display: flex; gap: 8px; flex-wrap: wrap">'
           + "".join(button(w, "secondary", "standard", touch, icon(ICON["plus"], 14, TEXT_2)) for w in ("Box", "Tank", "Wall", "Tree")) + '</div>')
    return (summary_row("Obstacles · 6", "Stair room, water tank, 4 AC units", touch, True, "Yours")
            + f'<div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 24px">{rows}'
            f'{text("body", "Add one: choose its kind, then drag on the roof.", touch, TEXT_2, "p", "margin-top: 8px")}{add}</div>')


def roof_column(which: str, touch: bool) -> str:
    head = text("heading", "Check the roof", touch, TEXT, "h2")
    rows = summary_row("Roof type", "Flat · rows facing south", touch, state="Yours")
    rows += edges_open(touch) if which == "edges" else summary_row("Edges and access", "Parapet 0.9 m · margin 1.0 m", touch, state="Default")
    rows += obstacles_open(touch) if which == "obstacles" else summary_row("Obstacles · 6", "Stair room, water tank, 4 AC units", touch, state="Yours")
    rows += summary_row("Outline", "Pune · 3,600 m² · Edit it in Plan", touch)
    return head + f'<div>{rows}</div>'


def module_open(touch: bool, details: bool) -> str:
    glyph = (f'<span style="width: 40px; height: 52px; border-radius: 4px; background: #16294D; border: 1px solid #33558C; flex: none"></span>')
    card = (f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: {SURFACE_1}; border: 1px solid {LINE}; '
            f'border-radius: {RADIUS["row"]}px">{glyph}<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
            f'{text("strong", "INA-144MHC-TF-560", touch)}{text("body", "Insolation · 560 Wp · 2.28 × 1.13 m", touch, TEXT_2)}</div>'
            f'{button("Change", "secondary", "standard", touch)}</div>')
    det_rows = [("Open-circuit voltage (Voc)", "49.95 V"), ("Short-circuit current (Isc)", "14.30 A"),
                ("Bifacial, rear gain", "0.80"), ("Voc coefficient", "−0.164 %/°C")]
    det = (f'<div style="display: flex; flex-direction: column; padding: 4px 12px; background: {SURFACE_2}; border-radius: {RADIUS["control"]}px">'
           + "".join(f'<div style="display: flex; justify-content: space-between; min-height: 36px; align-items: center">{text("body", a, touch, TEXT_2)}{text("body", b, touch)}</div>'
                     for a, b in det_rows) + '</div>') if details else ""
    toggle = (f'<a href="#" style="display: inline-flex; align-items: center; gap: 4px; text-decoration: none; {style("strong", touch, TEXT_2)}">'
              f'Details{icon(ICON["chevron-down" if details else "chevron-right"], 14, TEXT_2)}</a>')
    return (f'<div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 24px">{section_title("Module", touch)}{card}{toggle}{det}</div>')


def mounting_open(touch: bool) -> str:
    rows = (field("Tilt", "15", "°", "Default · low for wind on a flat roof", touch, 96)
            + f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px">{text("body", "Orientation", touch)}{segmented(["Portrait", "Landscape"], 0, touch)}</div>'
            + field("Modules in tilt", "2", "", "Default · rows of 2 modules, one above the other", touch, 96)
            + field("Clearance under the lower edge", "0.50", "m", "Default", touch, 112))
    return (summary_row("Mounting", "Tilt 15° · Portrait · 2 modules in tilt", touch, True, "Default")
            + f'<div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 24px">{rows}</div>')


def spacing_open(touch: bool) -> str:
    lead = text("body", "Rows stand 6.45 m apart so that they do not shade each other from 09:00 to 16:00 on 21 Dec.", touch, TEXT, "p")
    rows = (switch("Row spacing from the shade-free hours", "Off: type the spacing yourself", True, touch)
            + f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px">{text("body", "Shade-free hours", touch)}'
              f'<span style="{style("mono", touch)}">09:00 to 16:00</span></div>'
            + f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", "Design day", touch)}{segmented(["21 Dec", "21 Jun", "21 Mar"], 0, touch, fill=True)}'
              f'{text("body", "The day the rows are spaced for. 21 Dec has the longest shadows.", touch, TEXT_2)}</div>'
            + field("Direction (azimuth)", "180", "°", "Default · faces south, square to the roof's south edge", touch, 96)
            + switch("Allow shaded positions", "Off: positions shaded in the shade-free hours stay empty", False, touch))
    return (summary_row("Spacing", "Rows 6.45 m apart · shade-free 09:00 to 16:00", touch, True, "Default")
            + f'<div style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 24px">{lead}{rows}</div>')


def array_column(which: str, touch: bool) -> str:
    head = text("heading", "Choose the module", touch, TEXT, "h2")
    rows = module_open(touch, which == "details") if which in ("module", "details") else summary_row("Module", "INA-144MHC-TF-560 · 560 Wp", touch, state="Default")
    rows += mounting_open(touch) if which == "module" else summary_row("Mounting", "Tilt 15° · Portrait · 2 modules in tilt", touch, state="Default")
    rows += spacing_open(touch) if which == "spacing" else summary_row("Spacing", "Rows 6.45 m apart · shade-free 09:00 to 16:00", touch, state="Default")
    return head + f'<div>{rows}</div>'


def controls_v2(touch: bool, sun: bool = False) -> str:
    """The view controls: 3D or Plan, Fit, Sun, and Imagery as one toggle (no popover)."""
    return view_controls(touch, sun_on=sun)


def stage(step: str, facts: str, sun: bool = False, labels: bool = False) -> str:
    out = (f'<div style="position: absolute; left: 0; top: 56px; width: 1056px; height: 844px; overflow: hidden">'
           f'<div style="position: absolute; left: 40px; top: 32px; display: flex; flex-direction: column; gap: 4px">{text("title", step)}'
           f'{text("body", facts, False, TEXT_2)}</div>'
           f'<div style="position: absolute; right: 24px; top: 32px">{controls_v2(False, sun)}</div>'
           f'<div style="position: absolute; left: 48px; top: 190px">{roof_svg(960, label="3D view of the Pune demo roof")}</div>')
    if labels:
        out += (f'<div style="position: absolute; left: 520px; top: 742px; padding: 2px 8px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; '
                f'border-radius: 6px; {style("body", False)}">90.0 m</div>'
                f'<div style="position: absolute; left: 92px; top: 520px; padding: 2px 8px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; '
                f'border-radius: 6px; {style("body", False)}">40.0 m</div>')
    if sun:
        tiles = [("Rows and obstacles", "0.35 %"), ("Strings", "0.56 %"), ("Horizon", "0.01 %"), ("Area kept clear", "150 m²")]
        t = "".join(f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; background: {SURFACE_2}; border-radius: {RADIUS["control"]}px">'
                    f'{text("body", a, False, TEXT_2)}{text("strong", b)}</div>' for a, b in tiles)
        card = (f'<div style="position: absolute; left: 40px; top: 120px; width: 300px; padding: 16px; box-sizing: border-box; background: {SURFACE_1}; '
                f'border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; box-shadow: {SHADOW_FLOAT}; display: flex; flex-direction: column; gap: 12px">'
                f'{section_title("Shade over the year")}{text("body", "The energy lost to shade, by its cause.", False, TEXT_2)}'
                f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">{t}</div>'
                f'<label style="display: flex; align-items: center; justify-content: space-between">{text("body", "Shade map on the modules")}'
                f'<span style="width: 40px; height: 24px; border-radius: 9999px; background: {WELL}; border: 1px solid {LINE_STRONG}; position: relative">'
                f'<span style="position: absolute; left: 2px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: {TEXT_2}"></span></span></label></div>')
        timeline = (f'<div style="position: absolute; left: 40px; right: 24px; bottom: 24px; height: 64px; padding: 0 16px; box-sizing: border-box; background: {SURFACE_1}; '
                    f'border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; display: flex; align-items: center; gap: 16px">'
                    f'<button type="button" aria-label="Play" style="width: 40px; height: 40px; border-radius: 50%; border: 0; background: {ACCENT}; display: inline-flex; '
                    f'align-items: center; justify-content: center">{icon(ICON["play"], 16, ACCENT_INK)}</button>'
                    f'{text("strong", "21 Dec · 10:30")}{text("body", "solar time", False, TEXT_2)}'
                    f'<span style="flex: 1; position: relative; height: 4px; border-radius: 2px; background: {LINE_STRONG}">'
                    f'<span style="position: absolute; left: 36%; top: -8px; width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF; border: 3px solid {ACCENT}; box-sizing: border-box"></span></span>'
                    f'{text("body", "Sun 42.6° high, from 152° (south-east)", False, TEXT_2)}</div>')
        out += card + timeline
    return out + '</div>'


def foot(next_step: str) -> str:
    return button(f"Continue to {next_step} " + icon(ICON["arrow-right"], 18, ACCENT_INK), "primary", "primary", False, full=True)


def screen(step: str, column: str, next_step: str, states: dict, facts: str, sun: bool = False, labels: bool = False) -> str:
    return top_bar(states, step, 1440) + stage(step, facts, sun, labels) + work_column(column, foot(next_step))


CHANGES = [
    ("Roof lens · Edges and access", "Parapet, Setback, Walkway, Every · mod, Clearance, Albedo in a grid of 2 × 3, 8 apart",
     "Three groups in plain words, the term after: At the edges, Access, Round obstacles; roof albedo in Performance alone", "V2-27, V2-61, V2-107"),
    ("components.md · Number field (in a form)", "Label in text-2 regular, value in mono medium: the value heavier",
     "Label in primary text, value in mono regular: one weight; the hint under the label", "V2-113"),
    ("components.md · Equipment card", "Name, maker, power, size, bifacial, Voc, Isc, diodes, coefficients, the file name",
     "Model, maker, power, size, Change; the electrical figures behind Details in plain names", "V2-30, V2-67"),
    ("Array lens · Spacing", "Shade-free · GCR 0.57 · profile angle 29.8°; The ridges run square to …",
     "One sentence: rows 6.45 m apart so they do not shade each other from 09:00 to 16:00 on 21 Dec; GCR in the help", "V2-34"),
    ("Sun lens · shading tiles", "Near, linear · Electrical, beyond linear · Far, horizon · Kept clear",
     "Rows and obstacles · Strings · Horizon · Area kept clear, in a card of the Sun view", "V2-33"),
    ("components.md · Layers button", "A popover with one switch, Satellite imagery", "One toggle in the view controls, Imagery", "V2-35"),
    ("Stage labels", "The roof's dimensions on every lens", "On the Roof step alone, once per pair of edges", "V2-70"),
    ("Roof lens · Location, Edit", "Edit goes back to Find; the modules vanish", "Outline · Edit it in Plan: the corners on the stage, seen from above", "V2-59"),
]


def build_desktop() -> None:
    w = 1440
    hd = board_head("V2 · 7 · The Roof and Array steps, and the Sun view", LINES, False, ISSUES)
    screens = (frame("1 · Roof, Edges and access opened: three groups in plain words, who set each value, roof albedo pointing to its one home",
                     screen("Roof", roof_column("edges", False), "Array", {}, "3,600 m² · 6 obstacles", labels=True), w, 900)
               + frame("2 · Roof, Obstacles opened: one line each in words; Add with the kind named; the selected one ringed",
                       screen("Roof", roof_column("obstacles", False), "Array", {}, "3,600 m² · 6 obstacles", labels=True), w, 900)
               + frame("3 · Array, Module and Mounting opened: the card a buyer reads, Details closed; mounting in plain words",
                       screen("Array", array_column("module", False), "Strings", DONE, "790 positions · 28 tables · 6 rows"), w, 900)
               + frame("4 · Array, Spacing opened: why the rows stand where they do, in one sentence; the design day explained once",
                       screen("Array", array_column("spacing", False), "Strings", DONE, "790 positions · 28 tables · 6 rows"), w, 900)
               + frame("5 · The Sun view on the Array step: the shade over the year in plain names, the time and its timeline here alone",
                       screen("Array", array_column("details", False), "Strings", DONE, "790 positions · 28 tables · 6 rows", sun=True), w, 900))
    body = f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{hd}{screens}{changes(CHANGES)}</div>'
    write_board(OUT, "V2RoofArray.dc.html", "V2 · 7 · The Roof and Array steps · desktop 1440", 1520, 5740, body)


def touch_screen(size: str, step: str, column: str, next_step: str, states: dict) -> str:
    w, h = (834, 1194) if size == "tablet" else (390, 844)
    bar = top_bar(states, step, w, size)
    stage_h = 440 if size == "tablet" else 330
    top = 60 if size == "tablet" else 56
    side = 20 if size == "tablet" else 16
    roof_w = 740 if size == "tablet" else 390
    st = (f'<div style="position: absolute; left: 0; top: {top}px; width: {w}px; height: {stage_h}px; overflow: hidden">'
          f'<div style="position: absolute; left: {side}px; top: 16px">{text("title", step, True)}</div>'
          f'<div style="position: absolute; left: {(w - roof_w) // 2}px; top: {96 if size == "tablet" else 100}px">{roof_svg(roof_w, label="3D view of the Pune demo roof")}</div></div>')
    tab = 72 if size == "phone" else 0
    sheet_top = top + stage_h - (16 if size == "phone" else 0)
    sheet = (f'<div style="position: absolute; left: 0; top: {sheet_top}px; width: {w}px; height: {h - sheet_top - tab}px; background: {CHROME}; '
             f'border-top: 1px solid {LINE}; {"border-radius: 24px 24px 0 0; " if size == "phone" else ""}box-sizing: border-box; display: flex; flex-direction: column">'
             + (f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}; margin: 8px 0 4px"></span>' if size == "phone" else "")
             + f'<div style="flex: 1; padding: 16px {side}px 0; display: flex; flex-direction: column; gap: 16px; overflow: hidden">{column}</div>'
             f'<div style="padding: 12px {side}px 16px; border-top: 1px solid {LINE_SUBTLE}">{button(f"Continue to {next_step} " + icon(ICON["arrow-right"], 18, ACCENT_INK), "primary", "primary", True, full=True)}</div></div>')
    tb = f'<div style="position: absolute; left: 0; bottom: 0; width: {w}px">{tab_bar(states, step)}</div>' if size == "phone" else ""
    return bar + st + sheet + tb


def build_touch(size: str) -> None:
    w = 834 if size == "tablet" else 390
    h = 1194 if size == "tablet" else 844
    side = 20 if size == "tablet" else 16
    hd = board_head("V2 · 7 · The Roof and Array steps, and the Sun view", LINES, True, ISSUES)
    screens = (frame("Roof, Edges and access opened: the groups and their hints at touch size", touch_screen(size, "Roof", roof_column("edges", True), "Array", {}), w, h)
               + frame("Array, Spacing opened", touch_screen(size, "Array", array_column("spacing", True), "Strings", DONE), w, h))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 {side}px">{hd}</div>'
            f'{screens}<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, f"V2RoofArray{size.capitalize()}.dc.html", f"V2 · 7 · The Roof and Array steps · {size} {w}", w, 4020 if size == "tablet" else 3820, body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
