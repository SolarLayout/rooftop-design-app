"""The boards "UI fixes · Where the picker opens" on desktop 1440, tablet 834 and phone 390.

The owner (session 18), after the boards of the picker: where is it opened from? From the module card of the Array lens
and the inverter card of the Strings lens, where Replace opened the file drop. The button becomes Change and opens the
picker; a module or an inverter taken from the library says so under its card. The numbers of the cards after a choice
are what the API read from the two files (Heliene 144HC-560 M10 NTYP SL Bifacial, Solis S5-GC125K-HV). Written beside
this script: EquipmentEntry.dc.html, EquipmentEntryTablet.dc.html, EquipmentEntryPhone.dc.html.
Usage: python3 -I build_ui_fixes_equipment_entry.py
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import (  # noqa: E402
    CHROME, CONTROL, GROUND, LINE, LINE_STRONG, LINE_SUBTLE, NOTE_LINE, NOTE_SURFACE, SHADOW_CARD, SHADOW_RAISED, SURFACE_1,
    SURFACE_2, TEXT, TEXT_2, TEXT_3, ACCENT, note, tooltip,
)

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
MONO = "font-family: 'Geist Mono', monospace"
GLASS, FRAME = "#16294D", "#33558C"
LIBRARY = '<path d="M4 19V5M9 19V5M14 19 18 5.5M19.5 19l.5-1"/>'

MODULE_GLYPH = (
    f'<div aria-hidden="true" style="width: 44px; height: 60px; flex-shrink: 0; border-radius: 4px; background: {GLASS}; border: 2px solid {FRAME}; '
    'box-sizing: border-box; display: grid; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 2px; padding: 2px"><div style="background: #1F3A69"></div><div style="background: #1F3A69"></div></div>'
)
INVERTER_GLYPH = (
    f'<div aria-hidden="true" style="width: 44px; height: 56px; flex-shrink: 0; box-sizing: border-box; border-radius: 6px; background: {SURFACE_2}; border: 2px solid {LINE_STRONG}; '
    'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px">'
    f'<span style="width: 22px; height: 3px; border-radius: 2px; background: {ACCENT}"></span><span style="width: 22px; height: 3px; border-radius: 2px; background: {LINE_STRONG}"></span>'
    f'<span style="width: 22px; height: 3px; border-radius: 2px; background: {LINE_STRONG}"></span></div>'
)

DEMO_MODULE = {
    "model": "INA-144MHC-TF-560", "maker": "INSOLATION GREEN ENERGY PVT.&nbsp;LTD. · 560&nbsp;Wp", "size": "2.277 × 1.133 m · bifacial 0.80",
    "facts": "Voc 49.95&nbsp;V · Isc 14.30&nbsp;A · 3 diodes · twin&nbsp;half-cell",
    "coefficients": "Coefficients (one-diode model): Voc −0.164, Vmp −0.228, Pmpp −0.212 %/°C",
    "note": "Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.",
    "file": "insolation-ina-144mhc-tf-560.PAN", "library": False,
}
LIBRARY_MODULE = {
    "model": "144HC-560 M10 NTYP SL Bifacial", "maker": "Heliene Inc · 560&nbsp;Wp", "size": "2.279 × 1.134 m · bifacial 0.80",
    "facts": "Voc 51.09&nbsp;V · Isc 13.95&nbsp;A · 3 diodes · twin&nbsp;half-cell",
    "coefficients": "Coefficients (PAN file): Voc −0.270, Vmp −0.327, Pmpp −0.301 %/°C", "note": "",
    "file": "Heliene_144HC-560-M10-NTYP-SL-Bifacial.PAN", "library": True,
}
DEMO_INVERTER = {"model": "WP-330KTL-H1", "line": "WattPower Systems Pvt.Ltd · 275 kW · 6 MPPT", "facts": "65.0 A per MPPT · 28 inputs",
                 "file": "wattpower-wp-330ktl-h1.OND", "library": False}
LIBRARY_INVERTER = {"model": "S5-GC125K-HV", "line": "Ginlong Technologies · 125 kW · 10 MPPT", "facts": "32.0 A per MPPT · 20 inputs",
                    "file": "Solis_S5-GC125K-HV.OND", "library": True}


def change(touch: bool, pressed: bool = False) -> str:
    """The card's button: Change, secondary, 36 high (44 on touch). Pressed, it shows the press while the picker opens."""
    look = "background: #10141A; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5)" if pressed else f"background: {CONTROL}; box-shadow: {SHADOW_RAISED}"
    return (
        f'<button aria-haspopup="dialog" style="flex-shrink: 0; height: {44 if touch else 36}px; padding: 0 {14 if touch else 12}px; {look}; border: 1px solid {LINE_STRONG}; '
        f'border-radius: 9px; font-size: {15 if touch else 13}px; font-weight: 500; cursor: pointer">Change</button>'
    )


def file_line(file: str, library: bool) -> str:
    """The file's name, as today; from the library it says so after the name."""
    mark = (
        f'<span style="flex-shrink: 0; display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border: 1px solid {LINE_STRONG}; border-radius: 6px; '
        f'font-size: 11px; font-weight: 500; color: {TEXT_2}">From the app</span>'
        if library
        else ""
    )
    return (
        f'<div style="display: flex; align-items: center; gap: 8px; min-width: 0"><code style="min-width: 0; font-size: 12px; color: {TEXT_3}; white-space: nowrap; '
        f'overflow: hidden; text-overflow: ellipsis">{file}</code>{mark}</div>'
    )


def module_card(m: dict, touch: bool, tip: str = "", pressed: bool = False) -> str:
    small = "13px" if touch else "12px"
    coefficients = (
        f'<div style="display: flex; align-items: flex-start; gap: 8px; font-size: {small}; color: {TEXT_2}"><span style="display: flex; padding-top: 3px">{note(14)}</span><span>{m["coefficients"]}</span></div>'
        if m["note"]
        else f'<div style="font-size: {small}; color: {TEXT_2}">{m["coefficients"]}</div>'
    )
    flag = f'<div style="padding: 8px 10px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 8px; font-size: {small}; color: {TEXT_2}">{m["note"]}</div>' if m["note"] else ""
    button = (
        f'<div style="position: relative; display: flex; justify-content: flex-end">{change(touch, pressed)}'
        + (f'<div style="position: absolute; right: 0; bottom: calc(100% + 8px); white-space: nowrap">{tooltip(tip)}</div>' if tip else "")
        + "</div>"
    )
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
        f'<div style="display: flex; gap: 14px">{MODULE_GLYPH}<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
        f'<div style="font-weight: 600">{m["model"]}</div><div style="font-size: {small}; color: {TEXT_2}">{m["maker"]}</div>'
        f'<div style="font-size: {small}; color: {TEXT_3}">{m["size"]}</div></div></div>'
        f'<code style="font-size: 12px; color: {TEXT_2}">{m["facts"]}</code>{coefficients}{flag}{file_line(m["file"], m["library"])}{button}</div>'
    )


def inverter_card(i: dict, touch: bool, tip: str = "", pressed: bool = False) -> str:
    small = "13px" if touch else "12px"
    button = (
        f'<div style="position: relative">{change(touch, pressed)}'
        + (f'<div style="position: absolute; right: 0; bottom: calc(100% + 8px); white-space: nowrap">{tooltip(tip)}</div>' if tip else "")
        + "</div>"
    )
    return (
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        f'<div style="display: flex; align-items: center; gap: 14px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
        f'{INVERTER_GLYPH}<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><div style="font-weight: 600; white-space: nowrap">{i["model"]}</div>'
        f'<div style="font-size: {small}; color: {TEXT_2}">{i["line"]}</div><div style="{MONO}; font-size: {small}; color: {TEXT_3}">{i["facts"]}</div></div>{button}</div>'
        f'{file_line(i["file"], i["library"])}</div>'
    )


def inspector(inner: str, width: int, title: str = "") -> str:
    """The column the card stands in: the inspector on desktop, the lens's panel on tablet, the sheet on phone."""
    head = f'<div style="font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}">{title}</div>' if title else ""
    return (
        f'<div style="width: {width}px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 20px; background: {CHROME}; '
        f'border: 1px solid {LINE_SUBTLE}; border-radius: 12px">{head}{inner}</div>'
    )


def caption(text: str, inner: str, width: int = 0) -> str:
    size = f"width: {width}px; flex-shrink: 0" if width else "min-width: 0"
    return f'<div style="display: flex; flex-direction: column; gap: 8px; {size}"><span style="font-size: 13px; color: {TEXT_2}">{text}</span>{inner}</div>'


def notes(*lines: str) -> str:
    return '<div style="display: flex; flex-direction: column; gap: 10px; max-width: 520px">' + "".join(
        f'<p style="margin: 0; font-size: 13px; color: {TEXT_2}">{line}</p>' for line in lines) + "</div>"


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
button{{font:inherit;color:inherit}}
code{{font-family:'Geist Mono',monospace}}
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


def board(file: str, title: str, width: int, pad: int, intro: str, rows: str, height: int) -> None:
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px; padding: 40px {pad}px; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'Where the picker opens</h1><p style="margin: 0; max-width: 980px; color: {TEXT_2}">{intro}</p></div>{rows}</div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


INTRO = (
    "The picker opens from the two cards that hold the equipment: the module card of the Array lens and the inverter card of "
    "the Strings lens. Their button Replace, which opened the file drop, becomes Change, in the same place, and opens the "
    "picker; the file of one's own is in the picker. After a choice the card is the new module or inverter, as a file read "
    "makes it today, and under it the file's name says “From the app” when it came from the library. {size}"
)
MODULE_TIP = "Choose from 119 modules, or use a PAN file"
INVERTER_TIP = "Choose from 405 inverters, or use an OND file"

if __name__ == "__main__":
    row = lambda *parts: f'<div style="display: flex; gap: 32px; align-items: flex-start">{"".join(parts)}</div>'  # noqa: E731
    desktop = "".join((
        row(caption("Array lens, the inspector (384): the module card, Change under the pointer with its tooltip",
                    inspector(module_card(DEMO_MODULE, False, tip=MODULE_TIP), 384)),
            caption("After a module of the library is used: the card is the module read; its file says “From the app”",
                    inspector(module_card(LIBRARY_MODULE, False), 384)),
            notes(
                "Change is the card's button, where Replace stood: secondary, 36 high, at the right under the facts. It opens “Choose a module” (the boards “Choose a module or an inverter”). Its tooltip, after the pointer rests on it, says what it does: “Choose from 119 modules, or use a PAN file”; the count is the library's.",
                "The picker opens on the module of the design when it is one of the library, tagged “In this design” and in view; else at the top of the list, sorted by power.",
                "Used, the card shows the module as the engine read it, as a dropped file does today: the names as the file states them (Heliene Inc), the facts, the coefficients and where they come from, the notes if any. The layout and the energy run again.",
                "Under the card the file's name, as today; when the file came from the library, a quiet tag “From the app” after it. A file of one's own has no tag. Nothing else on the card changes.",
            )),
        row(caption("Strings lens, the inspector: the inverter card, Change with its tooltip",
                    inspector(inverter_card(DEMO_INVERTER, False, tip=INVERTER_TIP), 384)),
            caption("After an inverter of the library is used",
                    inspector(inverter_card(LIBRARY_INVERTER, False), 384)),
            notes(
                "Change opens “Choose an inverter”. Its tooltip: “Choose from 405 inverters, or use an OND file”.",
                "Used, the card is the inverter of the file (Ginlong Technologies, as the file names Solis); its current per MPPT is the file's IMaxDC over its MPPT count, as for any OND without one, and the strings, the options and the energy follow. An entered current per MPPT is cleared, as a new OND clears it today.",
                "The system voltage is not touched: it stays the user's choice (rule 3).",
            )),
    ))
    board("EquipmentEntry.dc.html", "UI fixes · Where the picker opens · desktop 1440", 1552, 56, INTRO.format(size="Desktop 1440."), desktop, 1140)

    stack = lambda *parts: f'<div style="display: flex; flex-direction: column; gap: 32px">{"".join(parts)}</div>'  # noqa: E731
    pair = lambda *parts: f'<div style="display: flex; gap: 24px; align-items: flex-start">{"".join(parts)}</div>'  # noqa: E731
    tablet = stack(
        pair(caption("Array lens, the panel under the stage (375): Change 44 high; a press opens the picker, no tooltip on touch",
                     inspector(module_card(DEMO_MODULE, True, pressed=True), 395), 395),
             caption("After a module of the library is used", inspector(module_card(LIBRARY_MODULE, True), 395), 395)),
        pair(caption("Strings lens: the inverter card", inspector(inverter_card(DEMO_INVERTER, True), 395), 395),
             caption("After an inverter of the library is used", inspector(inverter_card(LIBRARY_INVERTER, True), 395), 395)),
    )
    board("EquipmentEntryTablet.dc.html", "UI fixes · Where the picker opens · tablet 834", 834, 0,
          INTRO.format(size="Tablet 834: the cards in the lens's panel under the stage, in touch sizes."), tablet, 1020)

    phone = stack(
        caption("Array lens, in the sheet: the module card, Change 44 high", inspector(module_card(DEMO_MODULE, True), 390)),
        caption("After a module of the library is used", inspector(module_card(LIBRARY_MODULE, True), 390)),
        caption("Strings lens: the inverter card", inspector(inverter_card(DEMO_INVERTER, True), 390)),
        caption("After an inverter of the library is used", inspector(inverter_card(LIBRARY_INVERTER, True), 390)),
    )
    board("EquipmentEntryPhone.dc.html", "UI fixes · Where the picker opens · phone 390", 390, 0,
          INTRO.format(size="Phone 390: the cards in the sheet; Change opens the picker's bottom sheet over it."), phone, 1720)
