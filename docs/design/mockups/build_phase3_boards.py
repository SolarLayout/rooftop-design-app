"""Writes the boards of Phase 3: Controls2.dc.html, ShellStates.dc.html and Tabs.dc.html.

The boards show what Phase 3 needs and the first fourteen boards do not: the controls that had no
design, and the states of the shell. Every value is one of docs/design/design-tokens.md. The words of
the engine and the numbers of the Pune demo are the real ones (plan/reference/demo-numbers.md).

Run it in this folder: python3 build_phase3_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

from pathlib import Path

HERE = Path(__file__).parent

# Tokens, by the names of docs/design/design-tokens.md.
GROUND, CHROME, SURFACE_1, SURFACE_2 = "#0B0E13", "#0E1218", "#12161D", "#181D26"
CONTROL, CONTROL_ACTIVE, WELL = "#151A22", "#232A36", "#090C10"
LINE_SUBTLE, LINE, LINE_STRONG, LINE_HOVER = "#1C222C", "#232A36", "#2F3847", "#3B4658"
TEXT, TEXT_2, TEXT_3 = "#F2F4F7", "#A9B2C0", "#7C8696"
ACCENT, ACCENT_INK, NOTE_SURFACE, NOTE_LINE, OK = "#FFB020", "#1A1204", "#1E1A10", "#3A3220", "#3DD6A0"
DATA_GAIN = "#3987E5"

SHADOW_RAISED = "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)"
SHADOW_PRIMARY = (
    "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.18), "
    "0 1px 2px rgba(0,0,0,0.5), 0 8px 22px rgba(255,176,32,0.24)"
)
SHADOW_WELL = "inset 0 1px 3px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.04)"
SHADOW_CARD = "inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.28)"
SHADOW_FLOAT = "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.5)"
SHADOW_PANEL = "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.55)"
HALO_SELECTED = "0 0 0 3px rgba(255,176,32,0.14)"

# The boards are as high as what is on them.
CONTROLS_HEIGHT = 1512
SHELL_HEIGHT = 1996
TABS_HEIGHT = 908

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
MONO = "font-family: 'Geist Mono', monospace"

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
a{{color:#A9B2C0;text-decoration:none}}a:hover{{color:#F2F4F7}}
button,input{{font:inherit;color:inherit}}
code{{font-family:'Geist Mono',ui-monospace,monospace}}
table{{border-collapse:collapse}}
button,a,input{{transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s ease,background-color .16s ease,filter .16s ease}}
button:hover{{filter:brightness(1.14)}}
button:active{{transform:translateY(1px) scale(.985)}}
button:focus-visible,a:focus-visible,input:focus-visible{{outline:2px solid #FFB020;outline-offset:2px}}
@keyframes live{{0%,100%{{box-shadow:0 0 0 0 rgba(61,214,160,.5)}}50%{{box-shadow:0 0 0 5px rgba(61,214,160,0)}}}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
@keyframes wait{{0%,100%{{opacity:1}}50%{{opacity:.55}}}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important}}}}
</style>
</helmet>
<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 28px; padding: 48px 56px; background: #0B0E13; color: #F2F4F7; overflow: hidden; font-size: 14px; line-height: 20px">
<div style="display: flex; align-items: flex-end; gap: 40px">
<h1 style="margin: 0; {display}; font-size: 44px; line-height: 48px; letter-spacing: -0.03em">{heading}</h1>
<p style="margin: 0 0 4px; max-width: 560px; color: #A9B2C0">{lead}</p>
</div>
"""

FOOT = """</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{width},"height":{height}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""


def icon(path: str, size: int = 16, colour: str = "currentColor", width: float = 2) -> str:
    return (
        f'<svg style="flex-shrink: 0" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{colour}" '
        f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>'
    )


CHEVRON = '<path d="m6 9 6 6 6-6"/>'
TICK = '<path d="m5 12 5 5 9-10"/>'
NOTE = '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>'
UPLOAD = '<path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"/>'
FOLDER = '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
HOME = '<path d="m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>'
PLUS = '<path d="M12 5v14M5 12h14"/>'
CLOSE = '<path d="M6 6l12 12M18 6 6 18"/>'
DOWNLOAD = '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16"/>'
ARROW = '<path d="M5 12h14m0 0-6-6m6 6-6 6"/>'


def tick(size: int = 16) -> str:
    return icon(TICK, size, OK, 2.4)


def note(size: int = 18) -> str:
    return icon(NOTE, size, ACCENT)


def ring(size: int = 16, line: float = 2) -> str:
    """The turning ring of the first kit board: how far is not known."""
    return (
        f'<span style="flex-shrink: 0; width: {size}px; height: {size}px; box-sizing: border-box; border-radius: 50%; '
        f"border: {line}px solid {LINE_STRONG}; border-top-color: {ACCENT}; animation: spin 0.9s linear infinite\"></span>"
    )


def ring_of(fraction: float, size: int = 20, line: float = 2.5, label: str = "") -> str:
    """A ring that says how far: the arc begins at the top and grows clockwise."""
    radius = 12 - line * 24 / size / 2 - 0.5
    around = 2 * 3.14159265 * radius
    width = line * 24 / size
    name = f' role="img" aria-label="{label}"' if label else ' aria-hidden="true"'
    return (
        f'<svg style="flex-shrink: 0; transform: rotate(-90deg)" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none"{name}>'
        f'<circle cx="12" cy="12" r="{radius:.2f}" stroke="{LINE_STRONG}" stroke-width="{width:.2f}"/>'
        f'<circle cx="12" cy="12" r="{radius:.2f}" stroke="{ACCENT}" stroke-width="{width:.2f}" stroke-linecap="round" '
        f'stroke-dasharray="{around * fraction:.2f} {around:.2f}"/></svg>'
    )


def card(title: str, body: str, gap: int = 14, extra: str = "") -> str:
    return (
        f'<section style="display: flex; flex-direction: column; gap: {gap}px; padding: 24px; background: {SURFACE_1}; '
        f'border: 1px solid {LINE}; border-radius: 18px; box-shadow: {SHADOW_CARD}{extra}">'
        f"{section(title)}{body}</section>\n"
    )


def section(title: str, top: int = 0) -> str:
    return (
        f'<h2 style="margin: {top}px 0 0; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; '
        f'text-transform: uppercase; color: {TEXT_3}">{title}</h2>'
    )


def state(caption: str, body: str, gap: int = 6) -> str:
    return (
        f'<div style="display: flex; flex-direction: column; gap: {gap}px">'
        f'<span style="font-size: 12px; color: {TEXT_2}">{caption}</span>{body}</div>'
    )


def primary(label: str, height: int = 40, before: str = "") -> str:
    return (
        f'<button style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 8px; height: {height}px; white-space: nowrap; '
        f"padding: 0 16px; background: {ACCENT}; color: {ACCENT_INK}; border: 0; border-radius: 10px; font-weight: 600; "
        f'cursor: pointer; box-shadow: {SHADOW_PRIMARY}">{before}{label}</button>'
    )


def secondary(label: str, height: int = 40, before: str = "") -> str:
    return (
        f'<button style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 8px; height: {height}px; white-space: nowrap; '
        f"padding: 0 14px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 10px; font-weight: 500; "
        f'cursor: pointer; box-shadow: {SHADOW_RAISED}">{before}{label}</button>'
    )


def quiet(label: str, height: int = 40) -> str:
    return (
        f'<button style="height: {height}px; padding: 0 14px; background: transparent; border: 0; border-radius: 10px; '
        f'color: {TEXT_2}; cursor: pointer">{label}</button>'
    )


def icon_button(label: str, path: str, side: int = 38, colour: str = TEXT_2) -> str:
    return (
        f'<button aria-label="{label}" style="flex-shrink: 0; width: {side}px; height: {side}px; display: flex; '
        f"align-items: center; justify-content: center; background: transparent; border: 0; border-radius: 10px; "
        f'color: {colour}; cursor: pointer">{icon(path, 18)}</button>'
    )


# ---------------------------------------------------------------------------------------------------
# Board 1: the controls that had no design
# ---------------------------------------------------------------------------------------------------


def select_trigger(open_: bool = False, disabled: bool = False) -> str:
    look = (
        f"background: #10141A; border: 1px solid {LINE_STRONG}; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5)"
        if open_
        else f"background: {CONTROL}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}"
    )
    if disabled:
        look = f"background: {CONTROL}; border: 1px solid {LINE}; opacity: 0.45"
    expanded = "true" if open_ else "false"
    off = " disabled" if disabled else ""
    turn = "; transform: rotate(180deg)" if open_ else ""
    return (
        f'<button aria-haspopup="listbox" aria-expanded="{expanded}"{off} style="align-self: flex-start; display: flex; '
        f'align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 10px; white-space: nowrap; cursor: pointer; {look}">'
        f'<span style="color: {TEXT_2}">Weather</span><span style="font-weight: 500">PVGIS TMY</span>'
        f'<span style="display: flex{turn}">{icon(CHEVRON, 16, TEXT_3)}</span></button>'
    )


def option(name: str, fact: str, selected: bool = False, under_pointer: bool = False) -> str:
    ground = SURFACE_2 if under_pointer else "transparent"
    weight = "500" if selected else "400"
    mark = icon(TICK, 16, ACCENT, 2.4) if selected else '<span style="width: 16px"></span>'
    chosen = "true" if selected else "false"
    return (
        f'<li role="option" aria-selected="{chosen}" style="display: flex; align-items: center; gap: 10px; height: 40px; '
        f'padding: 0 10px; border-radius: 8px; background: {ground}; cursor: pointer">{mark}'
        f'<span style="flex-grow: 1; font-weight: {weight}">{name}</span>'
        f'<span style="font-size: 12px; color: {TEXT_3}">{fact}</span></li>'
    )


def menu(body: str, width: int = 320, label: str = "Weather") -> str:
    return (
        f'<ul role="listbox" aria-label="{label}" style="list-style: none; margin: 0; width: {width}px; box-sizing: border-box; '
        f"display: flex; flex-direction: column; gap: 2px; padding: 6px; background: {SURFACE_1}; "
        f'border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">{body}</ul>'
    )


def select_card() -> str:
    options = (
        option("PVGIS TMY", "Typical year", selected=True)
        + option("NASA POWER", "The year 2023", under_pointer=True)
        + option("CSV file", "Your own hours")
    )
    body = (
        '<div style="display: flex; gap: 20px">'
        + state("Rest", select_trigger())
        + state("Cannot be used", select_trigger(disabled=True))
        + "</div>"
        + state("Open, the pointer on the second choice", select_trigger(open_=True) + menu(options), gap=6)
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">On phone and tablet the list is a bottom sheet, its rows 52 high.</p>'
    )
    return card("Select", body)


def drop(look: str, inside: str, height: int = 88) -> str:
    return (
        f'<div style="display: flex; align-items: center; gap: 14px; height: {height}px; box-sizing: border-box; '
        f'padding: 0 18px; border-radius: 12px; {look}">{inside}</div>'
    )


def file_drop_card() -> str:
    words = (
        '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px">'
        '<span style="font-weight: 500">{title}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">{{detail}}</span></span>'
    )
    rest = drop(
        f"border: 1px dashed {LINE_STRONG}",
        icon(UPLOAD, 20, TEXT_2, 1.8)
        + words.format(title="Drop the module file here", detail="A PAN file of PVsyst")
        + secondary("Choose a file", 36),
    )
    over = drop(
        f"background: {NOTE_SURFACE}; border: 1px dashed {ACCENT}; box-shadow: {HALO_SELECTED}",
        icon(UPLOAD, 20, ACCENT, 1.8) + words.format(title="Let go to load the file", detail="It replaces INA-144MHC-TF-560"),
    )
    reading = drop(
        f"background: {WELL}; border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}",
        ring(20, 2.5)
        + '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px">'
        '<span style="font-weight: 500">Reading the file</span>'
        f'<code style="font-size: 12px; color: {TEXT_2}">insolation-ina-144mhc-tf-560.PAN</code></span>',
    )
    refused = drop(
        f"background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}",
        note(20)
        + '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px">'
        '<span style="font-weight: 500">This file was not loaded</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">datasheet.PAN: not a PVsyst module file (PNom, Voc or Isc missing)</span></span>'
        + secondary("Choose another", 36),
    )
    body = (
        state("Rest", rest)
        + state("A file is held over it", over)
        + state("Reading", reading)
        + state("Refused, in the words of the engine. The module of before stays", refused)
    )
    return card("File drop", body)


def dialog_card() -> str:
    panel = (
        f'<div role="dialog" aria-labelledby="dlg-t" aria-describedby="dlg-d" style="width: 340px; box-sizing: border-box; '
        f"display: flex; flex-direction: column; gap: 10px; padding: 22px 22px 20px; background: {SURFACE_1}; "
        f'border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="dlg-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Open another project?</h3>'
        + icon_button("Close", CLOSE, 32)
        + "</div>"
        f'<p id="dlg-d" style="margin: 0; color: {TEXT_2}">Pune demo roof has changes that are not saved on this device. '
        "Save a copy first, or they are lost.</p>"
        '<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px">'
        + quiet("Cancel")
        + secondary("Save a copy")
        + primary("Open")
        + "</div></div>"
    )
    stage = (
        f'<div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; min-height: 300px; '
        f'border-radius: 12px; background: rgba(5,7,10,0.72); border: 1px solid {LINE_SUBTLE}">{panel}</div>'
    )
    sheet = (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 8px 16px 16px; background: {CHROME}; '
        f'border: 1px solid {LINE}; border-bottom: 0; border-radius: 22px 22px 0 0">'
        f'<div style="display: flex; justify-content: center; padding: 0 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        f'<div style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Open another project?</div>'
        f'<div style="font-size: 15px; color: {TEXT_2}">Pune demo roof has changes that are not saved on this device.</div>'
        '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px">'
        + primary("Open", 48)
        + secondary("Save a copy", 48)
        + quiet("Cancel", 44)
        + "</div></div>"
    )
    body = (
        state("Desktop and tablet: over a dimmed screen, in its middle", stage)
        + state("Phone: a bottom sheet, the first action on top", f'<div style="width: 340px; align-self: center">{sheet}</div>')
    )
    return card("Dialog", body)


def tooltip(text: str, key: str = "") -> str:
    short = (
        f'<code style="padding: 0 5px; border: 1px solid {LINE_STRONG}; border-radius: 4px; font-size: 11px; color: {TEXT_2}">{key}</code>'
        if key
        else ""
    )
    return (
        f'<span role="tooltip" style="display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; '
        f"background: {CONTROL_ACTIVE}; border: 1px solid {LINE_STRONG}; border-radius: 8px; font-size: 12px; "
        f'box-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)">{text}{short}</span>'
    )


def toast(mark: str, text: str, action: str = "", close: bool = False) -> str:
    end = ""
    if action:
        end += (
            f'<button style="height: 32px; padding: 0 10px; background: transparent; border: 0; border-radius: 8px; '
            f'color: {ACCENT}; font-weight: 500; cursor: pointer">{action}</button>'
        )
    if close:
        end += icon_button("Close", CLOSE, 32)
    return (
        f'<div role="status" style="align-self: flex-start; display: flex; align-items: center; gap: 10px; min-height: 48px; '
        f"box-sizing: border-box; max-width: 100%; padding: 8px 8px 8px 14px; background: {SURFACE_1}; "
        f'border: 1px solid {LINE_STRONG}; border-radius: 12px; box-shadow: {SHADOW_FLOAT}">{mark}'
        f'<span style="flex-grow: 1; padding-right: 6px">{text}</span>{end}</div>'
    )


def tooltip_toast_card() -> str:
    fit = (
        f'<button style="height: 38px; padding: 0 14px; background: #1B212B; border: 1px solid #3B4658; border-radius: 10px; '
        f'font-size: 13px; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), 0 2px 4px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)">Fit</button>'
    )
    tips = (
        '<div style="display: flex; align-items: flex-end; gap: 28px">'
        f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px">{tooltip("Fit the roof to the view", "F")}{fit}</div>'
        f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px">{tooltip("North up")}'
        f'<button aria-label="North up" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: {CONTROL}; border: 1px solid {LINE}; border-radius: 10px; cursor: pointer; box-shadow: {SHADOW_RAISED}">'
        f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5 15 9H9z" fill="{ACCENT}"/><path d="M9.5 19v-7l5 7v-7" stroke="{TEXT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>'
        "</div>"
    )
    body = (
        state("Tooltip: the name of a control that shows an icon or one word", tips, gap=10)
        + section("Toast", top=8)
        + state("Done", toast(tick(18), "pune-demo-roof.rtd was saved"))
        + state("Done, and it can be undone", toast(tick(18), "Stair room was removed", "Undo"))
        + state("A note. It stays until it is closed", toast(note(20), "The map was not loaded. Enter the dimensions by hand.", "", True))
    )
    return card("Tooltip", body)


def table_card() -> str:
    head_cell = f"padding: 0 8px; height: 36px; white-space: nowrap; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}; border-bottom: 1px solid {LINE}"
    rows = [
        ("A", "29 × 22", "638", "357.28", "1.30", "617.8", True, True),
        ("B", "26 × 24", "624", "349.44", "1.27", "607.7", True, False),
        ("C", "28 × 22", "616", "344.96", "1.25", "602.9", True, False),
        ("D", "26 × 27", "702", "393.12", "0.71", "700.9", False, False),
        ("E", "28 × 25", "700", "392.00", "0.71", "700.5", False, False),
    ]
    out = (
        '<table style="width: 100%"><caption style="caption-side: bottom; padding-top: 10px; text-align: left; font-size: 12px; '
        f'color: {TEXT_2}">Stringing options at 1500 V</caption><thead><tr>'
        f'<th scope="col" style="{head_cell}; text-align: left">Option</th>'
        f'<th scope="col" style="{head_cell}; text-align: left">Strings</th>'
        f'<th scope="col" style="{head_cell}; text-align: right">kWp</th>'
        f'<th scope="col" style="{head_cell}; text-align: right">DC/AC</th>'
        f'<th scope="col" style="{head_cell}; text-align: right">MWh</th>'
        "</tr></thead><tbody>"
    )
    for name, strings, _modules, kwp, ratio, energy, fits, chosen in rows:
        ground = f"background: {SURFACE_2}" if chosen else "background: transparent"
        cell = f"padding: 0 8px; height: 44px; white-space: nowrap; border-bottom: 1px solid {LINE_SUBTLE}"
        number = f"{cell}; text-align: right; {MONO}; font-size: 13px"
        mark = (
            icon(TICK, 16, OK, 2.4).replace('aria-hidden="true"', 'role="img" aria-label="In target"')
            if fits
            else icon(NOTE, 16, ACCENT).replace('aria-hidden="true"', 'role="img" aria-label="Below the DC/AC target"')
        )
        out += (
            f'<tr style="{ground}"><th scope="row" style="{cell}; text-align: left; font-weight: 500">{name}</th>'
            f'<td style="{cell}; {MONO}; font-size: 13px">{strings}</td>'
            f'<td style="{number}">{kwp}</td>'
            f'<td style="{number}"><span style="display: inline-flex; align-items: center; gap: 6px">{ratio}{mark}</span></td>'
            f'<td style="{number}">{energy}</td></tr>'
        )
    out += "</tbody></table>"

    phone = (
        f'<div style="width: 300px; display: flex; flex-direction: column; gap: 10px; padding: 14px; background: {SURFACE_2}; border-radius: 12px">'
        '<div style="display: flex; align-items: center; gap: 8px"><span style="flex-grow: 1; font-weight: 600; font-size: 16px">Option D</span>'
        + icon(NOTE, 18, ACCENT).replace('aria-hidden="true"', 'role="img" aria-label="Below the DC/AC target"')
        + "</div>"
        '<dl style="margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 8px">'
        + "".join(
            f'<div style="display: flex; flex-direction: column; gap: 2px"><dt style="font-size: 12px; color: {TEXT_2}">{label}</dt>'
            f'<dd style="margin: 0; {MONO}; font-weight: 500; font-size: 15px">{value}</dd></div>'
            for label, value in [("Strings", "26 × 27"), ("Modules", "702"), ("kWp", "393.12"), ("DC/AC", "0.71"), ("MWh", "700.9")]
        )
        + "</dl></div>"
    )
    body = state("Desktop and tablet. The chosen row is on surface 2", out) + state("Phone: each row is a card", phone)
    return card("Table", body)


def bone(width: int, height: int, radius: int = 6) -> str:
    return (
        f'<span style="display: block; width: {width}px; height: {height}px; border-radius: {radius}px; '
        f'background: {SURFACE_2}; animation: wait 1.6s ease-in-out infinite"></span>'
    )


def waiting_card() -> str:
    rings = (
        '<div style="display: flex; align-items: center; gap: 28px">'
        + state("16, beside a value", ring(16), gap=10)
        + state("20, how far", ring_of(0.62, 20, 2.5, "62 percent"), gap=10)
        + state(
            "44, on the stage",
            '<span style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px">'
            + f'<span style="position: absolute; inset: 0; display: flex">{ring_of(0.62, 44, 3, "62 percent")}</span>'
            + f'<code style="font-size: 11px; font-weight: 500">62</code></span>',
            gap=10,
        )
        + "</div>"
    )
    run = (
        f'<div style="display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 14px; background: {SURFACE_2}; border-radius: 12px">'
        + ring_of(0.62, 20, 2.5)
        + '<span style="flex-grow: 1">Computing hourly shading for every module</span>'
        + f'<code style="font-size: 13px; color: {TEXT_2}">62 %</code></div>'
    )
    bones = (
        f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); height: 78px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px">'
        + "".join(
            f'<div style="display: flex; flex-direction: column; justify-content: center; gap: 10px; padding: 0 18px{edge}">{bone(width, 10, 5)}{bone(value, 18)}</div>'
            for width, value, edge in [(74, 112, ""), (64, 92, f"; border-left: 1px solid {LINE}"), (52, 70, f"; border-left: 1px solid {LINE}")]
        )
        + "</div>"
    )
    lines = f'<div style="display: flex; flex-direction: column; gap: 10px">{bone(220, 12)}{bone(300, 12)}{bone(160, 12)}</div>'
    body = (
        state("Turning: how far is not known. A ring with an arc: how far, from the engine", rings, gap=12)
        + state("A run, with the step of the engine", run)
        + section("Skeleton", top=8)
        + state("In the place of values that were never there. It breathes, 1.6 s; it stands still under reduced motion", bones)
        + state("In the place of text", lines)
    )
    return card("Progress ring", body)


def controls_board() -> str:
    width, height = 1440, CONTROLS_HEIGHT
    column = '<div style="display: flex; flex-direction: column; gap: 16px">\n'
    grid = (
        '<div style="flex-grow: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start">\n'
        + column + select_card() + tooltip_toast_card() + "</div>\n"
        + column + file_drop_card() + table_card() + "</div>\n"
        + column + dialog_card() + waiting_card() + "</div>\n"
        + "</div>\n"
    )
    return (
        HEAD.format(
            title="Controls, part 2",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Controls, part 2",
            lead="What opens, what waits and what answers. The same depth: a list that opens floats, a field that takes a file is cut in.",
        )
        + grid
        + FOOT.format(width=width, height=height)
    )


# ---------------------------------------------------------------------------------------------------
# Board 2: the states of the shell
# ---------------------------------------------------------------------------------------------------


def cell(label: str, value: str, unit: str = "", lead: bool = False, dim: bool = False, after: str = "", first: bool = False) -> str:
    edge = "" if first else f"; border-left: 1px solid {LINE}"
    fade = "; opacity: 0.55" if dim else ""
    if lead:
        number = (
            f'<div style="display: flex; align-items: center; gap: 10px"><span style="{DISPLAY}; font-size: 26px; line-height: 30px; letter-spacing: -0.02em{fade}">{value} '
            f'<span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 13px; color: {TEXT_2}; letter-spacing: 0">{unit}</span></span>{after}</div>'
        )
        gap, pad = 2, 18
    else:
        number = (
            f'<div style="display: flex; align-items: center; gap: 6px; {MONO}; font-weight: 500; font-size: 16px{fade}">{value}'
            + (f' <span style="font-family: Geist, sans-serif; font-size: 12px; color: {TEXT_2}; font-weight: 400">{unit}</span>' if unit else "")
            + f"{after}</div>"
        )
        gap, pad = 4, 14
    return (
        f'<div style="display: flex; flex-direction: column; justify-content: center; gap: {gap}px; padding: 0 {pad}px{edge}">'
        f'<div style="font-size: 12px; color: {TEXT_2}">{label}</div>{number}</div>'
    )


BAR = (
    f"height: 78px; box-sizing: border-box; display: grid; white-space: nowrap; background: {SURFACE_1}; "
    f"border: 1px solid {LINE}; border-radius: 16px; box-shadow: {SHADOW_FLOAT}"
)
COLUMNS = "grid-template-columns: 1.25fr 1.15fr 0.85fr 0.85fr 1fr 0.8fr 1.25fr 1.55fr"


def cells(dim: bool, ring_beside: bool) -> str:
    return (
        cell("Energy, year 1", "617.8", "MWh", lead=True, dim=dim, after=ring(16) if ring_beside else "", first=True)
        + cell("DC capacity", "357.28", "kWp", dim=dim)
        + cell("AC capacity", "275", "kW", dim=dim)
        + cell("DC/AC", "1.30", dim=dim, after=icon(TICK, 16, OK, 2.4).replace('aria-hidden="true"', 'role="img" aria-label="In target"'))
        + cell("Modules", "638", "of 790", dim=dim)
        + cell("PR", "86.6", "%", dim=dim)
        + cell("Yield", "1,729", "kWh/kWp", dim=dim)
    )


def last_cell(look: str, inside: str) -> str:
    return f'<div style="display: flex; align-items: center; gap: 10px; padding: 0 16px; border-radius: 0 15px 15px 0; {look}">{inside}</div>'


def two_lines(first: str, second: str) -> str:
    return (
        '<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
        f'<span style="font-size: 13px; font-weight: 500">{first}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}; overflow: hidden; text-overflow: ellipsis">{second}</span></span>'
    )


def vitals_desktop() -> str:
    updating = (
        f'<section aria-label="Design vitals, updating" style="{BAR}; {COLUMNS}">'
        + cells(dim=True, ring_beside=True)
        + last_cell(f"border-left: 1px solid {LINE}", ring_of(0.62, 20, 2.5, "62 percent") + two_lines("Updating energy", "Computing hourly shading"))
        + "</section>"
    )
    first = (
        f'<section aria-label="Design vitals, loading" style="{BAR}; {COLUMNS}">'
        + "".join(
            f'<div style="display: flex; flex-direction: column; justify-content: center; gap: 10px; padding: 0 {18 if index == 0 else 14}px{"" if index == 0 else f"; border-left: 1px solid {LINE}"}">{bone(label, 10, 5)}{bone(value, 18 if index else 22)}</div>'
            for index, (label, value) in enumerate([(78, 118), (66, 96), (66, 60), (40, 58), (50, 84), (20, 60), (34, 110)])
        )
        + last_cell(f"border-left: 1px solid {LINE}", ring_of(0.08, 20, 2.5, "8 percent") + two_lines("Opening Pune demo roof", "Loading PVGIS TMY weather"))
        + "</section>"
    )
    failed = (
        f'<section aria-label="Design vitals, not updated" style="{BAR}; {COLUMNS}">'
        + cells(dim=False, ring_beside=False)
        + f'<button style="display: flex; align-items: center; gap: 10px; padding: 0 16px; background: {NOTE_SURFACE}; border: 0; border-left: 1px solid {NOTE_LINE}; border-radius: 0 15px 15px 0; text-align: left; cursor: pointer">'
        + note(22)
        + two_lines("Energy was not updated", "Values are of the design before · Try again")
        + "</button></section>"
    )
    return (
        state("Updating: the values of before stay, dimmed; a ring beside the energy; the last cell says the step and how far", updating, gap=8)
        + state("First load: no value was ever there", first, gap=8)
        + state("The run failed: the last good values stay, not dimmed. The cell opens the notes, where the reason is", failed, gap=8)
    )


def small_cell(label: str, value: str, unit: str, height: int = 72, edge: str = "") -> str:
    return (
        f'<div style="display: flex; flex-direction: column; justify-content: center; gap: 4px; height: {height}px; padding: 0 18px{edge}">'
        f'<div style="font-size: 12px; color: {TEXT_2}">{label}</div>'
        f'<div style="{MONO}; font-weight: 500; font-size: 17px">{value} <span style="font-family: Geist, sans-serif; font-size: 12px; color: {TEXT_2}; font-weight: 400">{unit}</span></div></div>'
    )


def vitals_waiting() -> str:
    tablet = (
        f'<section aria-label="Design vitals" style="width: 794px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px; white-space: nowrap; font-size: 15px; box-shadow: {SHADOW_CARD}">'
        + small_cell("Roof", "3,600", "m²")
        + small_cell("Positions", "790", "modules", edge=f"; border-left: 1px solid {LINE}")
        + small_cell("If all were used", "442.40", "kWp", edge=f"; border-left: 1px solid {LINE}")
        + f'<a href="StringsLensNoVoltage.dc.html" style="grid-column: span 3; display: flex; align-items: center; gap: 12px; height: 72px; padding: 0 18px; background: {NOTE_SURFACE}; border-top: 1px solid {NOTE_LINE}; border-radius: 0 0 15px 15px; color: {TEXT}">'
        + note(22)
        + '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">Energy is waiting for the system voltage</span>'
        + f'<span style="font-size: 13px; color: {TEXT_2}">Choose 600, 1000 or 1500 V in the Strings lens</span></span>'
        + icon(ARROW, 18, TEXT_2)
        + "</a></section>"
    )

    def phone_card(label: str, value: str, unit: str) -> str:
        return (
            f'<div style="flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; height: 64px; padding: 0 16px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_CARD}">'
            f'<div style="font-size: 12px; color: {TEXT_2}">{label}</div>'
            f'<div style="{MONO}; font-weight: 500; font-size: 16px">{value} <span style="font-family: Geist, sans-serif; font-size: 12px; color: {TEXT_2}; font-weight: 400">{unit}</span></div></div>'
        )

    phone = (
        f'<section aria-label="Design vitals" style="width: 390px; box-sizing: border-box; display: flex; gap: 8px; padding: 0 0 14px 16px; overflow: hidden; white-space: nowrap; font-size: 15px; background: {GROUND}; border-radius: 12px">'
        f'<a href="StringsLensNoVoltage.dc.html" style="flex-shrink: 0; display: flex; align-items: center; gap: 10px; height: 64px; box-sizing: border-box; padding: 0 14px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 14px; color: {TEXT}">'
        + note(22)
        + '<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 13px; font-weight: 500">Energy is waiting</span>'
        + f'<span style="font-size: 12px; color: {TEXT_2}">Choose a system voltage</span></span></a>'
        + phone_card("Roof", "3,600", "m²")
        + phone_card("Positions", "790", "modules")
        + phone_card("If all were used", "442.40", "kWp")
        + "</section>"
    )
    return (
        '<div style="display: flex; align-items: flex-start; gap: 40px">'
        + state("Tablet 834: three cells, and the note across the width. It leads to the Strings lens", tablet, gap=8)
        + state("Phone 390: the note comes first in the row", phone, gap=8)
        + "</div>"
    )


def note_item(title: str, reason: str, where: str, go: str) -> str:
    return (
        f'<li style="display: flex; gap: 12px; padding: 14px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 12px">'
        + f'<span style="display: flex; padding-top: 1px">{note(20)}</span>'
        + '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px">'
        + f'<span style="font-weight: 500">{title}</span>'
        + f'<span style="font-size: 13px; color: {TEXT_2}">{reason}</span>'
        + f'<span style="display: flex; align-items: center; gap: 10px; margin-top: 6px"><span style="flex-grow: 1; font-size: 12px; color: {TEXT_3}">{where}</span>'
        + secondary(go, 36)
        + "</span></span></li>"
    )


VOC_NOTE = note_item(
    "Voc coefficient",
    "Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C. Check the datasheet.",
    "Module · Array lens",
    "Open Array",
)


def drawer(width: int, body: str, count: str, sheet: bool = False) -> str:
    shape = (
        f"border: 1px solid {LINE}; border-bottom: 0; border-radius: 22px 22px 0 0"
        if sheet
        else f"border-left: 1px solid {LINE}; box-shadow: -16px 0 40px rgba(0,0,0,0.5)"
    )
    handle = (
        f'<div style="display: flex; justify-content: center; padding: 8px 0 0"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        if sheet
        else ""
    )
    side = 16 if sheet else 20
    return (
        f'<aside aria-label="Notes to review" style="width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; background: {CHROME}; {shape}">{handle}'
        f'<div style="display: flex; align-items: center; gap: 10px; padding: {12 if sheet else 18}px {side - 6}px 12px {side}px">'
        f'<h3 style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Notes to review</h3>'
        f'<code style="font-size: 13px; color: {TEXT_2}">{count}</code>'
        + icon_button("Close", CLOSE, 44 if sheet else 38)
        + f'</div><ul style="list-style: none; margin: 0; display: flex; flex-direction: column; gap: 10px; padding: 4px {side}px {side}px">{body}</ul></aside>'
    )


def notes() -> str:
    failed = note_item(
        "Energy was not updated",
        "The server cannot be reached. Check the connection and try again.",
        "The values shown are of the design before",
        "Try again",
    )
    nothing = (
        f'<li style="display: flex; align-items: center; gap: 12px; padding: 14px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 12px">'
        + tick(20)
        + f'<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">Nothing to review</span><span style="font-size: 13px; color: {TEXT_2}">Every check of the design fits.</span></span></li>'
    )
    return (
        '<div style="display: flex; align-items: flex-start; gap: 40px">'
        + state("Desktop and tablet: a drawer from the right, 384 wide, over the inspector", drawer(384, VOC_NOTE + failed, "2"), gap=8)
        + state("Nothing to review", drawer(384, nothing, "0"), gap=8)
        + state("Phone: a bottom sheet", f'<div style="font-size: 15px">{drawer(390, VOC_NOTE, "1", sheet=True)}</div>', gap=8)
        + "</div>"
    )


def saved(mark: str, words: str, colour: str = TEXT_2) -> str:
    return f'<div style="display: flex; align-items: center; gap: 8px; height: 36px; color: {colour}; font-size: 13px">{mark}{words}</div>'


def save_states() -> str:
    dot = f'<span style="width: 7px; height: 7px; border-radius: 50%; background: {OK}; animation: live 2.4s ease-in-out infinite"></span>'
    hollow = f'<span style="width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {TEXT_3}"></span>'
    return (
        '<div style="display: flex; align-items: flex-start; gap: 36px">'
        + state("Saved", saved(dot, "Saved on this device"))
        + state("Saving", saved(ring(12, 1.5), "Saving"))
        + state("The demo, and a design before Phase 10", saved(hollow, "Not kept on this device"))
        + state("Could not be saved: it opens the notes", f'<button style="display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px; margin-left: -10px; background: transparent; border: 0; border-radius: 10px; font-size: 13px; cursor: pointer">{note(16)}Not saved</button>')
        + "</div>"
    )


def menu_row(path: str, title: str, fact: str = "", under_pointer: bool = False) -> str:
    ground = SURFACE_2 if under_pointer else "transparent"
    second = f'<span style="font-size: 12px; color: {TEXT_3}">{fact}</span>' if fact else ""
    return (
        f'<li><a href="Home.dc.html" style="display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 10px; border-radius: 8px; background: {ground}; color: {TEXT}">'
        + icon(path, 18, TEXT_2, 1.8)
        + f'<span style="flex-grow: 1">{title}</span>{second}</a></li>'
    )


def switcher() -> str:
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
        + menu_row(PLUS, "New design", "Find the roof", under_pointer=True)
        + menu_row(FOLDER, "Open a project", ".rtd")
        + menu_row(UPLOAD, "Import a drawing", "KMZ, KML, DXF")
        + menu_row(DOWNLOAD, "Save a copy", ".rtd")
        + menu_row(HOME, "Home")
        + "</ul></div>"
    )
    return state("Open. On phone and tablet it is a bottom sheet, and the state of saving is said here only", trigger + panel, gap=6)


def shell_board() -> str:
    width, height = 1440, SHELL_HEIGHT
    body = (
        '<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 16px">\n'
        + card("Vitals while the energy is on its way · desktop", vitals_desktop(), gap=16)
        + card("Vitals before a system voltage is chosen · tablet and phone", vitals_waiting(), gap=16)
        + card("Notes to review", notes(), gap=16)
        + '<div style="display: grid; grid-template-columns: 440px minmax(0, 1fr); gap: 16px; align-items: start">\n'
        + card("Project switcher", switcher(), gap=14)
        + card("State of saving, in the top bar on desktop", save_states(), gap=14)
        + "</div></div>\n"
    )
    return (
        HEAD.format(
            title="Shell states",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Shell states",
            lead="What the vitals, the notes and the project switcher show while a result is on its way, when there is none yet, and when it did not come.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# ---------------------------------------------------------------------------------------------------
# Board 3: tabs
# ---------------------------------------------------------------------------------------------------

RING = f"outline: 2px solid {ACCENT}; outline-offset: 2px"


def tab(
    label: str,
    taken: bool = False,
    under_pointer: bool = False,
    focus: bool = False,
    disabled: bool = False,
    count: str = "",
    touch: bool = False,
) -> str:
    """One tab. The line under it lies on the line of the row."""
    height, size, side = (44, 15, 16) if touch else (40, 13, 14)
    colour = TEXT if taken or under_pointer else TEXT_2
    weight = "font-weight: 500; " if taken else ""
    line = ACCENT if taken else LINE_HOVER if under_pointer else ""
    under = (
        f'<span style="position: absolute; left: {side}px; right: {side}px; bottom: -1px; height: 2px; border-radius: 1px; background: {line}"></span>'
        if line
        else ""
    )
    number = (
        f'<span style="display: flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 9px; background: {SURFACE_2}; '
        f'{MONO}; font-size: 12px; font-weight: 400; color: {TEXT_2}">{count}</span>'
        if count
        else ""
    )
    return (
        f'<button role="tab" aria-selected="{"true" if taken else "false"}"{" disabled" if disabled else ""} '
        f'style="position: relative; flex-shrink: 0; display: flex; align-items: center; gap: 6px; height: {height}px; padding: 0 {side}px; '
        f"background: transparent; border: 0; border-radius: 6px; white-space: nowrap; font-size: {size}px; {weight}color: {colour}; "
        f'cursor: {"default" if disabled else "pointer"}{"; opacity: 0.45" if disabled else ""}{"; " + RING if focus else ""}">'
        f"{label}{number}{under}</button>"
    )


def tab_row(tabs: str, label: str, extra: str = "") -> str:
    return (
        f'<div role="tablist" aria-label="{label}" style="display: flex; gap: 4px; border-bottom: 1px solid {LINE}{extra}">{tabs}</div>'
    )


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTHLY_MWH = [62.0, 58.8, 68.4, 64.1, 54.9, 46.9, 31.5, 38.5, 37.5, 53.4, 53.5, 48.5]


def monthly_chart() -> str:
    highest, lowest = max(MONTHLY_MWH), min(MONTHLY_MWH)
    bars = ""
    for month, energy in zip(MONTHS, MONTHLY_MWH):
        said = (
            f'<span style="{MONO}; font-size: 11px; color: {TEXT_2}">{energy:.1f}</span>'
            if energy in (highest, lowest)
            else ""
        )
        bars += (
            '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px">'
            f'{said}<div style="width: 100%; height: {round(energy / highest * 104)}px; border-radius: 4px 4px 0 0; background: {DATA_GAIN}"></div>'
            f'<span style="{MONO}; font-size: 11px; color: {TEXT_3}">{month}</span></div>'
        )
    return f'<div style="display: flex; align-items: flex-end; gap: 2px; height: 156px">{bars}</div>'


def monthly_table() -> str:
    head = f"padding: 0 8px; height: 36px; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}; border-bottom: 1px solid {LINE}"
    cell = f"padding: 0 8px; height: 44px; border-bottom: 1px solid {LINE_SUBTLE}"
    rows = "".join(
        f'<tr><th scope="row" style="{cell}; text-align: left; font-weight: 500">{month}</th>'
        f'<td style="{cell}; text-align: right; {MONO}; font-size: 13px">{energy:.1f}</td></tr>'
        for month, energy in list(zip(MONTHS, MONTHLY_MWH))[:3]
    )
    return (
        f'<table style="width: 100%"><thead><tr><th scope="col" style="{head}; text-align: left">Month</th>'
        f'<th scope="col" style="{head}; text-align: right">MWh</th></tr></thead><tbody>{rows}</tbody></table>'
    )


def panel_card(taken: str) -> str:
    """A card of Performance whose content has two parts: the chart, and the same numbers as a table."""
    tabs = tab("Chart", taken=taken == "Chart") + tab("Table", taken=taken == "Table")
    inside = monthly_chart() if taken == "Chart" else monthly_table()
    return (
        f'<div style="display: flex; flex-direction: column; gap: 16px; padding: 14px; background: {SURFACE_2}; border-radius: 12px">'
        f'<div style="display: flex; align-items: baseline; gap: 10px"><span style="font-weight: 600; font-size: 16px">Monthly energy</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">617.8 MWh in year 1</span></div>'
        + tab_row(tabs, "Monthly energy")
        + f'<div role="tabpanel" aria-label="{taken}">{inside}</div></div>'
    )


def tabs_card() -> str:
    states = (
        '<div style="display: flex; gap: 28px; flex-wrap: wrap">'
        + state("Rest: the first is taken", tab_row(tab("Losses", taken=True) + tab("Monthly") + tab("25 years"), "Rest"))
        + state("The pointer on the second", tab_row(tab("Losses", taken=True) + tab("Monthly", under_pointer=True) + tab("25 years"), "Pointer"))
        + "</div>"
        '<div style="display: flex; gap: 28px; flex-wrap: wrap">'
        + state("The keyboard focus on the one that is taken", tab_row(tab("Losses", taken=True, focus=True) + tab("Monthly") + tab("25 years"), "Focus"))
        + state("One cannot be taken", tab_row(tab("Losses", taken=True) + tab("Monthly") + tab("25 years", disabled=True), "Disabled"))
        + "</div>"
        + state("With a count, in mono 12 on surface 2", tab_row(tab("Notes", taken=True, count="2") + tab("Assumptions", count="14") + tab("Weather"), "Count"))
    )
    facts = (
        f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Height 40, padding 0 14, 4 apart, text 13 in text-2. The one that is taken: text, '
        "Geist 500, a line of 2 in accent on the line of the row. Under the pointer: text, the line in line-hover. "
        "Cannot be taken: opacity 0.45. The panel begins 16 under the row.</p>"
    )
    return card("Tabs", states + facts, gap=18)


def tabs_in_use_card() -> str:
    body = (
        state("In a card of Performance: the chart, and its numbers as a table", panel_card("Chart"), gap=8)
        + state("The second tab is taken: the panel is another, the card is the same", panel_card("Table"), gap=8)
    )
    return card("In use", body, gap=18)


def tabs_touch_card() -> str:
    names = ["Summary", "Losses", "Monthly", "25 years", "Assumptions", "Weather"]
    row = "".join(tab(name, taken=name == "Losses", touch=True) for name in names)
    phone = (
        f'<div style="width: 358px; overflow: hidden; border-radius: 12px; background: {GROUND}; border: 1px solid {LINE}">'
        + tab_row(row, "Performance", extra="; padding: 0 0 0 4px")
        + f'<div role="tabpanel" aria-label="Losses" style="display: flex; flex-direction: column; gap: 8px; padding: 16px">'
        + bone(120, 12)
        + bone(300, 12)
        + bone(260, 12)
        + "</div></div>"
    )
    body = (
        state("Phone 390: height 44, text 15, padding 0 16. A row that is too long scrolls sideways; part of the next tab is seen", phone, gap=8)
        + section("When tabs, when a segmented control", top=6)
        + f'<p style="margin: 0; color: {TEXT_2}">Tabs divide the content of one card or one panel into parts: two to six of them, '
        "named by what is in them. Every part is there at once; a tab shows one. "
        "A segmented control sets a value of the design or the view of the stage: 3D or Plan, Portrait or Landscape.</p>"
        + section("Keyboard and names", top=6)
        + f'<p style="margin: 0; color: {TEXT_2}">The keyboard stops at the row once, at the tab that is taken. The arrows left and right '
        "go to the neighbour and around the ends, Home and End to the first and the last; each takes the tab it goes to, and a tab that "
        "cannot be taken is passed over. Tab leads into the panel. To a screen reader: "
        f'<code style="font-size: 13px; color: {TEXT}">tablist</code>, <code style="font-size: 13px; color: {TEXT}">tab</code>, '
        f'<code style="font-size: 13px; color: {TEXT}">tabpanel</code>, the panel named by its tab.</p>'
    )
    return card("On phone and tablet", body, gap=14)


def tabs_board() -> str:
    width, height = 1440, TABS_HEIGHT
    column = '<div style="display: flex; flex-direction: column; gap: 16px">\n'
    grid = (
        '<div style="flex-grow: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start">\n'
        + column + tabs_card() + "</div>\n"
        + column + tabs_in_use_card() + "</div>\n"
        + column + tabs_touch_card() + "</div>\n"
        + "</div>\n"
    )
    return (
        HEAD.format(
            title="Tabs",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Tabs",
            lead="Parts of one card or one panel, of which one is shown. Flat, on a line: what is taken carries the accent.",
        )
        + grid
        + FOOT.format(width=width, height=height)
    )


if __name__ == "__main__":
    (HERE / "Controls2.dc.html").write_text(controls_board(), encoding="utf-8")
    (HERE / "ShellStates.dc.html").write_text(shell_board(), encoding="utf-8")
    (HERE / "Tabs.dc.html").write_text(tabs_board(), encoding="utf-8")
    print("Controls2.dc.html, ShellStates.dc.html, Tabs.dc.html")
