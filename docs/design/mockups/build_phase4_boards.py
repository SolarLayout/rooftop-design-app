"""Writes the boards of Phase 4 that the first fourteen boards lack: LocateTablet.dc.html and
LocateStates.dc.html.

"Find and outline" is drawn for desktop (Locate.dc.html) and phone (LocatePhone.dc.html). This script draws
it for tablet, and the states and tools of the screen that no board shows: the search and its answers,
the rectangle tool, the footprint proposed by Detect building, the loupe of a touch drag, the map without
a key or WebGL or a connection, and the corners as a list for the keyboard. Every value is one of
docs/design/design-tokens.md. It borrows the helpers of build_phase3_boards.py.

Run it in this folder: python3 build_phase4_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import math

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    ARROW,
    CHROME,
    CONTROL,
    CONTROL_ACTIVE,
    DISPLAY,
    FOOT,
    GROUND,
    HEAD,
    LINE,
    LINE_STRONG,
    MONO,
    NOTE_LINE,
    NOTE_SURFACE,
    OK,
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
    WELL,
    HERE,
    card,
    icon,
    note,
    primary,
    quiet,
    ring,
    secondary,
    section,
    state,
)

SHADOW_HANDLE = "0 2px 6px rgba(0,0,0,0.6)"
SHADOW_LABEL = "0 2px 8px rgba(0,0,0,0.5)"
OUTLINE_FILL = "rgba(255,176,32,0.09)"
HANDLE = "#FFFFFF"
TEXT_SHADOW = "text-shadow: 0 1px 3px rgba(0,0,0,0.9)"

BACK = '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>'
SEARCH = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>'
CORNERS = '<path d="M5 19 8 6l11 3-4 10z"/>'
RECT = '<rect x="3.500" y="6.500" width="17" height="11" rx="1"/>'
DETECT = '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/>'
UNDO = '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'
LOCATE = '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>'
TURN = '<path d="M20 12a8 8 0 1 1-2.340-5.660"/><path d="M20 4v4.500h-4.500"/>'
PIN = '<path d="M12 21s6-5.700 6-11a6 6 0 0 0-12 0c0 5.300 6 11 6 11z"/><circle cx="12" cy="10" r="2.200"/>'

STATES_HEIGHT = 2320

# --------------------------------------------------------------------------------------------------
# Pieces of the map
# --------------------------------------------------------------------------------------------------


def imagery(width: int, height: int, scale: float, ox: float, oy: float, roof: bool = True) -> str:
    """A drawing that stands in for the satellite picture, as the two boards of Find have it. The roof of
    the demo (90 by 40 m) has its corner (0, 0) at (ox, oy) in pixels, y up, *scale* pixels per metre."""
    outline = (
        f'<g transform="matrix({scale} 0 0 -{scale} {ox} {oy})"><rect width="90" height="40" fill="{ACCENT}" '
        f'fill-opacity="0.09" stroke="{ACCENT}" stroke-width="{2 / scale:.3f}"/></g>'
        if roof
        else ""
    )
    return (
        f'<svg viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="Satellite view. '
        f'Illustration standing in for live imagery." style="position: absolute; left: 0; top: 0">'
        f'<defs><filter id="grain{width}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" '
        f'baseFrequency="0.85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0.55 -0.12"/></filter></defs>'
        f'<rect width="{width}" height="{height}" fill="#2F342D"/>'
        f'<g transform="matrix({scale} 0 0 -{scale} {ox} {oy})">'
        '<rect x="-80" y="-90" width="260" height="190" fill="#3B4037"/>'
        '<rect x="-80" y="-32" width="260" height="13" fill="#4A4C50"/>'
        '<path d="M -80 -25.500 H 180" stroke="#9A9C9E" stroke-width="0.3" stroke-dasharray="3 4" fill="none"/>'
        '<rect x="-14" y="-12" width="124" height="70" fill="#5B584E"/>'
        '<g fill="#000000" opacity="0.38"><rect x="-16" y="76" width="50" height="30"/><rect x="47" y="73" width="58" height="26"/>'
        '<rect x="-5" y="7" width="90" height="40"/><rect x="-66" y="-72" width="80" height="12"/><rect x="131" y="7" width="60" height="44"/></g>'
        '<rect x="-10" y="70" width="50" height="30" fill="#8B8376"/><rect x="52" y="68" width="58" height="26" fill="#6F7A82"/>'
        '<rect x="-60" y="-70" width="80" height="12" fill="#858A90"/><rect x="34" y="-70" width="46" height="16" fill="#7B6F63"/>'
        '<rect x="136" y="0" width="60" height="44" fill="#94897A"/><rect x="-100" y="-4" width="70" height="36" fill="#7F868E"/>'
        '<rect width="90" height="40" fill="#B4B8BE"/><rect x="0.400" y="0.400" width="89.200" height="39.200" fill="none" stroke="#D5D8DC" stroke-width="0.4"/>'
        '<g fill="#000000" opacity="0.4"><rect x="17.750" y="19" width="5" height="4"/><circle cx="60.500" cy="26" r="1.250"/></g>'
        '<rect x="20" y="16" width="5" height="4" fill="#DADDE1"/><circle cx="62" cy="24" r="1.250" fill="#E4E6E9"/>'
        '<g fill="#DADDE1"><rect x="70" y="3" width="1.500" height="1"/><rect x="73" y="3" width="1.500" height="1"/><rect x="76" y="3" width="1.500" height="1"/><rect x="79" y="3" width="1.500" height="1"/></g>'
        '<g fill="#C9CCD0"><rect x="-8" y="-9" width="4.500" height="1.900"/><rect x="-1" y="-9" width="4.500" height="1.900" fill="#7C2F2A"/><rect x="6" y="-9" width="4.500" height="1.900"/></g>'
        '<g fill="#2F4D33"><circle cx="-12" cy="61" r="3.500"/><circle cx="102" cy="60" r="3.800"/><circle cx="112" cy="-15" r="3.200"/><circle cx="-46" cy="52" r="4.200"/></g>'
        '<g fill="#3A5E3E"><circle cx="-4" cy="62" r="3"/><circle cx="-52" cy="60" r="3.600"/><circle cx="108" cy="52" r="2.600"/></g>'
        "</g>"
        f'<rect width="{width}" height="{height}" filter="url(#grain{width})" opacity="0.8"/>'
        f"{outline}</svg>"
    )


def corner(x: float, y: float, touch: bool = False, live: bool = False) -> str:
    side, line = (22, 5) if touch else (18, 4)
    motion = "animation: pulse 2s ease-in-out infinite" if live else f"box-shadow: {SHADOW_HANDLE}"
    return (
        f'<div aria-hidden="true" style="position: absolute; left: {x - side / 2:.0f}px; top: {y - side / 2:.0f}px; width: {side}px; '
        f'height: {side}px; box-sizing: border-box; border-radius: 50%; background: {HANDLE}; border: {line}px solid {ACCENT}; {motion}"></div>'
    )


def midpoint(x: float, y: float) -> str:
    return (
        f'<div aria-hidden="true" style="position: absolute; left: {x - 5:.0f}px; top: {y - 5:.0f}px; width: 10px; height: 10px; '
        f'border-radius: 50%; background: {ACCENT}; border: 2px solid {ACCENT_INK}; box-sizing: border-box"></div>'
    )


def edge_label(x: float, y: float, words: str) -> str:
    return (
        f'<code style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; padding: 3px 9px; background: {GROUND}; border-radius: 7px; '
        f'font-size: 13px; font-weight: 500; box-shadow: {SHADOW_LABEL}">{words}</code>'
    )


def floating(extra: str = "") -> str:
    return f"background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}{extra}"


def back_button() -> str:
    return (
        f'<a href="Home.dc.html" aria-label="Back to home" style="width: 48px; height: 48px; flex-shrink: 0; display: flex; '
        f'align-items: center; justify-content: center; color: {TEXT}; {floating()}">{icon(BACK, 18)}</a>'
    )


def search_field(value: str, width: str = "400px", beside: str = "", placeholder: bool = False) -> str:
    colour = f"; color: {TEXT_3}" if placeholder else ""
    return (
        f'<div style="display: flex; align-items: center; gap: 12px; width: {width}; min-width: 0; height: 48px; box-sizing: border-box; '
        f'padding: 0 16px; {floating()}">{icon(SEARCH, 18, TEXT_2)}'
        f'<input aria-label="Search an address or paste coordinates" value="{value}" style="flex-grow: 1; min-width: 0; background: transparent; '
        f'border: 0; outline: 0; font-size: 15px{colour}">{beside}</div>'
    )


def steps() -> str:
    return (
        f'<ol aria-label="Steps" style="margin: 0; padding: 5px; list-style: none; display: flex; gap: 4px; height: 48px; box-sizing: border-box; {floating()}">'
        f'<li style="display: flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 9px; color: {TEXT_2}">{icon(TICK, 16, OK, 2.6)}Find</li>'
        f'<li aria-current="step" style="display: flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 9px; background: {CONTROL_ACTIVE}; '
        f'font-weight: 500; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)"><code style="color: {ACCENT}">2</code>Outline</li>'
        f'<li style="display: flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 9px; color: {TEXT_2}"><code>3</code>Build</li></ol>'
    )


def tool(label: str, path: str, active: bool = False, touch: bool = True) -> str:
    height = 44 if touch else 40
    if active:
        return (
            f'<button aria-pressed="true" style="display: flex; align-items: center; gap: 8px; height: {height}px; padding: 0 16px; background: {ACCENT}; '
            f'color: {ACCENT_INK}; border: 0; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: {SHADOW_PRIMARY}">{icon(path, 18, ACCENT_INK)}{label}</button>'
        )
    return (
        f'<button style="display: flex; align-items: center; gap: 8px; height: {height}px; padding: 0 16px; background: transparent; border: 0; '
        f'border-radius: 12px; color: {TEXT}; cursor: pointer">{icon(path, 18)}{label}</button>'
    )


def tool_icon(label: str, path: str, dim: bool = False) -> str:
    fade = "; opacity: 0.45" if dim else ""
    return (
        f'<button aria-label="{label}"{" aria-disabled=" + chr(34) + "true" + chr(34) if dim else ""} style="width: 44px; height: 44px; display: flex; '
        f'align-items: center; justify-content: center; background: transparent; border: 0; border-radius: 12px; color: {TEXT}; cursor: pointer{fade}">{icon(path, 18)}</button>'
    )


def toolbar(active: str = "Corners", redo_dim: bool = True) -> str:
    return (
        f'<div role="toolbar" aria-label="Outline tools" style="display: flex; align-items: center; gap: 4px; padding: 6px; background: {SURFACE_1}; '
        f'border: 1px solid {LINE}; border-radius: 18px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">'
        + tool("Corners", CORNERS, active == "Corners")
        + tool("Rectangle", RECT, active == "Rectangle")
        + tool("Detect building", DETECT, active == "Detect building")
        + f'<div style="width: 1px; height: 24px; margin: 0 4px; background: {LINE_STRONG}"></div>'
        + tool_icon("Undo", UNDO)
        + tool_icon("Redo", '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>', dim=redo_dim)
        + tool_icon("Clear outline", '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>')
        + "</div>"
    )


def map_buttons() -> str:
    return (
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        f'<button aria-label="North up" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; {floating("; border-radius: 12px")}">'
        f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.500 15 9H9z" fill="{ACCENT}"/>'
        f'<path d="M9.500 19v-7l5 7v-7" stroke="{TEXT}" stroke-width="1.600" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
        f'<div style="display: flex; flex-direction: column; {floating("; border-radius: 12px")}">'
        '<button aria-label="Zoom in" style="width: 44px; height: 44px; background: transparent; border: 0; font-size: 20px; cursor: pointer">+</button>'
        f'<div style="height: 1px; background: {LINE}"></div>'
        '<button aria-label="Zoom out" style="width: 44px; height: 44px; background: transparent; border: 0; font-size: 20px; cursor: pointer">−</button>'
        "</div></div>"
    )


def scale_and_credit(scale_px: int, metres: str) -> str:
    return (
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        f'<div style="display: flex; flex-direction: column; gap: 3px"><code style="font-size: 12px; {TEXT_SHADOW}">{metres}</code>'
        f'<div style="width: {scale_px}px; height: 5px; box-sizing: border-box; border: 2px solid {TEXT}; border-top: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8))"></div></div>'
        f'<div style="font-size: 11px; color: {TEXT}; {TEXT_SHADOW}">Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community</div></div>'
    )


def field(label: str, value: str, focus: bool = False) -> str:
    look = (
        f"border: 1px solid {ACCENT}; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)"
        if focus
        else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
    )
    name = label.lower()
    return (
        f'<div style="display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; background: {WELL}; border-radius: 10px; {look}">'
        f'<label for="e-{name}" style="flex-grow: 1; color: {TEXT_2}; font-size: 13px">{label}</label>'
        f'<input id="e-{name}" value="{value}" inputmode="decimal" style="width: 56px; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500">'
        f'<span style="color: {TEXT_2}; font-size: 12px">m</span></div>'
    )


def tile(label: str, value: str, unit: str = "") -> str:
    after = f' <span style="font-family: Geist, sans-serif; font-size: 12px; color: {TEXT_2}; font-weight: 400">{unit}</span>' if unit else ""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; background: {SURFACE_1}; border: 1px solid {LINE}; '
        f'border-radius: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)"><span style="font-size: 12px; color: {TEXT_2}">{label}</span>'
        f'<code style="font-size: 15px; font-weight: 500">{value}{after}</code></div>'
    )


def switch_row() -> str:
    return (
        '<div style="display: flex; align-items: center; gap: 12px; min-height: 44px">'
        f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span>Square the corners</span><span style="font-size: 12px; color: {TEXT_3}">Snaps to 90° when you are within 3°</span></div>'
        f'<button role="switch" aria-checked="true" aria-label="Square the corners" style="width: 44px; height: 26px; flex-shrink: 0; padding: 3px; display: flex; justify-content: flex-end; '
        f'background: {ACCENT}; border: 0; border-radius: 13px; cursor: pointer; box-shadow: inset 0 1px 3px rgba(0,0,0,0.45)"><span style="width: 20px; height: 20px; border-radius: 50%; background: {ACCENT_INK}; box-shadow: 0 1px 3px rgba(0,0,0,0.5)"></span></button></div>'
    )


def roof_type_segmented() -> str:
    return (
        f'<div role="group" aria-label="Roof type" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; padding: 3px; background: {WELL}; '
        f'border: 1px solid {LINE}; border-radius: 13px; box-shadow: {SHADOW_WELL}">'
        f'<button aria-pressed="true" style="height: 44px; background: {CONTROL_ACTIVE}; border: 0; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)">Tilted rows</button>'
        f'<button style="height: 44px; background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}; font-size: 15px; cursor: pointer">East-west</button>'
        f'<button style="height: 44px; background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}; font-size: 15px; cursor: pointer">Sloped</button></div>'
    )


def build_button() -> str:
    return (
        f'<a href="StudioTablet.dc.html" style="display: flex; align-items: center; justify-content: center; gap: 10px; height: 56px; background: {ACCENT}; color: {ACCENT_INK}; '
        f'border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: {SHADOW_PRIMARY}">Build this roof{icon(ARROW, 18, ACCENT_INK)}</a>'
    )


# --------------------------------------------------------------------------------------------------
# Board 1: Find and outline on tablet, 834 by 1194
# --------------------------------------------------------------------------------------------------

TABLET_HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Locate and outline, tablet</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
body{margin:0;font-family:Geist,system-ui,sans-serif;background:#0B0E13;color:#F2F4F7}
a{color:#A9B2C0;text-decoration:none}a:hover{color:#F2F4F7}
button,input{font:inherit;color:inherit}
code{font-family:'Geist Mono',ui-monospace,monospace}
button,a,input{transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s ease,background-color .16s ease,filter .16s ease}
button:active{transform:translateY(1px) scale(.985)}
button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid #FFB020;outline-offset:2px}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,176,32,.55),0 2px 6px rgba(0,0,0,.6)}50%{box-shadow:0 0 0 9px rgba(255,176,32,0),0 2px 6px rgba(0,0,0,.6)}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</helmet>
"""

TABLET_FOOT = """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":834,"height":1194}}'>
class Component extends DCLogic {
renderVals() { return {}; }
}
</script>
</body>
</html>
"""


def tablet_board() -> str:
    width, height, sheet = 834, 1194, 384
    map_height = height - sheet
    scale, ox, oy = 5.0, 192, 560  # 90 m is 450 px; the roof from (192, 360) to (642, 560)
    x0, x1, y0, y1 = ox, ox + 90 * scale, oy - 40 * scale, oy
    stage = (
        f'<div style="position: relative; width: {width}px; height: {height}px; box-sizing: border-box; background: #2F342D; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">'
        + imagery(width, map_height, scale, ox, oy)
        + corner(x0, y1, touch=True)
        + corner(x1, y1, touch=True)
        + corner(x1, y0, touch=True, live=True)
        + corner(x0, y0, touch=True)
        + midpoint((x0 + x1) / 2, y1)
        + midpoint((x0 + x1) / 2, y0)
        + midpoint(x1, (y0 + y1) / 2)
        + midpoint(x0, (y0 + y1) / 2)
        + edge_label((x0 + x1) / 2 - 32, y1 + 12, "90.0 m")
        + edge_label(x1 + 16, (y0 + y1) / 2 - 12, "40.0 m")
        # The top row: back, the search with the label of the place, the steps.
        + '<div style="position: absolute; left: 20px; right: 20px; top: 20px; display: flex; align-items: center; gap: 10px">'
        + back_button()
        + search_field("18.52000, 73.86000", width="auto; flex-grow: 1", beside=f'<span style="font-size: 13px; color: {TEXT_2}; white-space: nowrap">Pune, Maharashtra</span>')
        + steps()
        + "</div>"
        # The toolbar over the map, above the sheet.
        + f'<div style="position: absolute; left: 50%; top: {map_height - 20 - 48 - 16 - 58}px; transform: translateX(-50%)">{toolbar()}</div>'
        + f'<div style="position: absolute; right: 20px; top: {map_height - 20 - 48 - 16 - 142}px">{map_buttons()}</div>'
        + f'<div style="position: absolute; left: 20px; top: {map_height - 20 - 48}px">{scale_and_credit(100, "20 m")}</div>'
        # The sheet.
        + f'<section aria-label="Outline the roof" style="position: absolute; left: 0; right: 0; bottom: 0; height: {sheet}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; '
        f'padding: 8px 20px 20px; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 -16px 40px rgba(0,0,0,0.5)">'
        f'<div style="display: flex; justify-content: center"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        '<div style="display: flex; align-items: baseline; gap: 12px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 26px; line-height: 32px; letter-spacing: -0.02em">Outline the roof</h1>'
        f'<p style="margin: 0; color: {TEXT_2}; font-size: 13px">Tap each corner. Drag a corner to adjust it, or type a length you have measured.</p>'
        f'<span style="margin-left: auto; font-size: 13px; color: {TEXT_2}; white-space: nowrap">Step 2 of 3</span></div>'
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">'
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        + section("Edges")
        + '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
        + field("South", "90.0")
        + field("East", "40.0", focus=True)
        + field("North", "90.0")
        + field("West", "40.0")
        + "</div>"
        + switch_row()
        + "</div>"
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">'
        + tile("Area", "3,600", "m²")
        + tile("Faces", "180° S")
        + tile("Corners", "4")
        + "</div>"
        + section("Roof type", top=4)
        + roof_type_segmented()
        + "</div></div>"
        + f'<div style="margin-top: auto">{build_button()}</div>'
        + "</section></div>"
    )
    return TABLET_HEAD + stage + "\n" + TABLET_FOOT


# --------------------------------------------------------------------------------------------------
# Board 2: the states and the tools of Find and outline
# --------------------------------------------------------------------------------------------------


def fragment(width: int, height: int, inside: str, scale: float = 3.4, ox: float = 40, oy: float = 200, roof: bool = True) -> str:
    return (
        f'<div style="position: relative; width: {width}px; height: {height}px; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; color: {TEXT}">'
        f"{imagery(width, height, scale, ox, oy, roof)}{inside}</div>"
    )


def result_row(place: str, fact: str, under_pointer: bool = False) -> str:
    ground = SURFACE_2 if under_pointer else "transparent"
    return (
        f'<li role="option" style="display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px; border-radius: 8px; background: {ground}; cursor: pointer">'
        f"{icon(PIN, 16, TEXT_3)}<span style=\"flex-grow: 1\">{place}</span><span style=\"font-size: 12px; color: {TEXT_3}\">{fact}</span></li>"
    )


def results_list(rows: str) -> str:
    return (
        f'<ul role="listbox" aria-label="Places found" style="list-style: none; margin: 6px 0 0; width: 400px; box-sizing: border-box; display: flex; flex-direction: column; gap: 2px; '
        f'padding: 6px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">{rows}</ul>'
    )


def search_card() -> str:
    found = search_field("Hinjewadi Phase 2") + results_list(
        result_row("Hinjewadi Phase 2, Pune, Maharashtra", "Locality", under_pointer=True)
        + result_row("Hinjewadi Phase 2 Rd, Hinjewadi, Pune", "Street")
        + result_row("Phase 2, Rajiv Gandhi Infotech Park, Pune", "Place")
    )
    searching = search_field("Hinjewadi Phase 2", beside=ring(16))
    nothing = search_field("xq9 street") + results_list(
        f'<li style="display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px; color: {TEXT_2}">{note(16)}'
        "Nothing found for “xq9 street”. Try a fuller address, or paste coordinates.</li>"
    )
    coordinates = search_field("18.52000, 73.86000", beside=f'<span style="font-size: 13px; color: {TEXT_2}; white-space: nowrap">18.52000° N, 73.86000° E</span>')
    link = search_field("https://maps.app.goo.gl/…/@18.52,73.86,19z", beside=f'<span style="font-size: 13px; color: {TEXT_2}; white-space: nowrap">A maps link</span>')
    mine = (
        f'<div style="display: flex; align-items: center; gap: 8px">{search_field("", width="300px", placeholder=True).replace("value=" + chr(34) + chr(34), "placeholder=" + chr(34) + "Search an address or paste coordinates" + chr(34))}'
        f'<button aria-label="Use my location" style="width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; {floating()}">{icon(LOCATE, 18)}</button></div>'
    )
    body = (
        state("Typing: places found, the pointer on the first. Enter takes it; the map flies to it at roof zoom", found)
        + state("Searching", searching)
        + state("Nothing found: it says so, and what to try", nothing)
        + state("Coordinates typed or pasted: read as they are, no request; the map flies at once", coordinates)
        + state("A maps link pasted: its coordinates are read", link)
        + state("On phone and tablet, before anything is typed: “Use my location” beside the field", mine)
    )
    return card("Search", body, gap=16)


def no_map(title: str, reason: str) -> str:
    return (
        f'<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 200px; border-radius: 12px; '
        f'background: {GROUND}; border: 1px solid {LINE}; text-align: center; padding: 0 40px">'
        f'{note(22)}<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-weight: 500">{title}</span>'
        f'<span style="font-size: 13px; color: {TEXT_2}">{reason}</span></div>{secondary("Enter dimensions by hand instead", 40)}</div>'
    )


def no_map_card() -> str:
    body = (
        state("No map key on this machine", no_map("The map is not available", "This app has no key for the imagery. The roof can still be entered by its measurements."))
        + state("No WebGL in this browser", no_map("This browser cannot draw the map", "It has no WebGL. Try another browser, or enter the roof by its measurements."))
        + state("Offline: the tiles do not come", no_map("The imagery does not load", "Check the connection and try again, or enter the roof by its measurements."))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The search field, the steps and the back button stay. The panel shows “Enter dimensions by hand”: a rectangle by length, width and the direction it faces, or a table of corners, at a place typed or found.</p>'
    )
    return card("No map", body, gap=16)


def turned(dx: float, dy: float, degrees: float) -> tuple[float, float]:
    """A point at (dx, dy) of the centre, after the box is turned by *degrees* on the screen (y down)."""
    a = math.radians(degrees)
    return dx * math.cos(a) - dy * math.sin(a), dx * math.sin(a) + dy * math.cos(a)


def rectangle_card() -> str:
    cx, cy, w, h, turn_by = 193, 132, 306, 136, -4  # the box on the building, turned 4° counter-clockwise, still to be turned back
    x0, y0 = cx - w / 2, cy - h / 2
    box = (
        f'<div style="position: absolute; left: {x0:.0f}px; top: {y0:.0f}px; width: {w}px; height: {h}px; box-sizing: border-box; background: {OUTLINE_FILL}; '
        f'border: 2px solid {ACCENT}; transform: rotate({turn_by}deg); transform-origin: center"></div>'
    )
    corners = [turned(dx, dy, turn_by) for dx, dy in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]
    top_mid = turned(0, -h / 2, turn_by)
    handle_at = turned(0, -h / 2 - 44, turn_by)
    stem = (
        f'<div style="position: absolute; left: {cx - 1:.0f}px; top: {y0 - 44}px; width: 2px; height: 44px; background: {ACCENT}; '
        f'transform: rotate({turn_by}deg); transform-origin: 1px {h / 2 + 44:.0f}px"></div>'
    )
    turn = (
        f'<button aria-label="Turn the rectangle" style="position: absolute; left: {cx + handle_at[0] - 22:.0f}px; top: {cy + handle_at[1] - 22:.0f}px; width: 44px; height: 44px; '
        f'display: flex; align-items: center; justify-content: center; cursor: grab; {floating("; border-radius: 22px; border-color: " + ACCENT)}">{icon(TURN, 18, ACCENT)}</button>'
    )
    right_mid = turned(w / 2, 0, turn_by)
    bottom_mid = turned(0, h / 2, turn_by)
    inside = (
        box
        + stem
        + turn
        + "".join(corner(cx + dx, cy + dy) for dx, dy in corners)
        + edge_label(cx + bottom_mid[0] - 30, cy + bottom_mid[1] + 14, "90.0 m")
        + edge_label(cx + right_mid[0] + 16, cy + right_mid[1] - 12, "40.0 m")
        + edge_label(cx + handle_at[0] + 30, cy + handle_at[1] - 12, "Turned 4°")
        + f'<div style="position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%)">{toolbar("Rectangle")}</div>'
    )
    body = (
        state("Drag a box across the roof; then turn it to the building by the handle above its top edge. The corners drag as in Corners", fragment(640, 380, inside, roof=False))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The result is the same polygon as by corners: four corners, the edges in the panel, Faces from the long side. The turn snaps to north within 3°.</p>'
    )
    return card("Rectangle", body, gap=12)


def callout(x: int, y: int, title: str, detail: str, actions: str = "", width: int = 300) -> str:
    return (
        f'<div style="position: absolute; left: {x}px; top: {y}px; width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; padding: 10px 14px; '
        f'background: {SURFACE_1}; border: 1px solid {NOTE_LINE}; border-radius: 12px; box-shadow: {SHADOW_FLOAT}">'
        f'<span style="font-size: 13px; font-weight: 500">{title}</span><span style="font-size: 12px; color: {TEXT_2}">{detail}</span>{actions}</div>'
    )


def detect_card() -> str:
    faint = (
        f'<svg viewBox="0 0 640 380" width="640" height="380" style="position: absolute; left: 0; top: 0" aria-hidden="true">'
        f'<g fill="none" stroke="{ACCENT}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 3">'
        '<path d="M400 30h110v70H400zM540 120h80v90h-80zM20 300h140v60H20zM480 290h130v70H480z"/></g>'
        f'<path d="M43 62h307v141H43z" fill="{ACCENT}" fill-opacity="0.14" stroke="{ACCENT}" stroke-width="2" stroke-dasharray="6 4"/></svg>'
    )
    proposed = (
        faint
        + corner(43, 62)
        + corner(350, 62)
        + corner(350, 203)
        + corner(43, 203)
        + callout(
            180,
            220,
            "Footprint found · 4 corners · 3,570 m²",
            "Taken as the roof's outline, from Overture Maps, accurate to about 0.6 m. Drag its corners to the roof's edge.",
            f'<div style="display: flex; gap: 8px">{quiet("Undo", 36)}</div>',
            width=340,
        )
        + f'<div style="position: absolute; left: 50%; top: 16px; transform: translateX(-50%)">{toolbar("Detect building")}</div>'
    )
    nothing = (
        f'<svg viewBox="0 0 640 200" width="640" height="200" style="position: absolute; left: 0; top: 0" aria-hidden="true">'
        f'<g fill="none" stroke="{ACCENT}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="4 3"><path d="M20 130h140v60H20zM480 120h130v70H480z"/></g>'
        f'<circle cx="300" cy="90" r="6" fill="{ACCENT}"/></svg>'
        + callout(320, 60, "No footprint known here", "Outline the roof by corners or by a rectangle instead.", width=280)
    )
    body = (
        state("The tool is active: the footprints that are known show faintly. A tap inside a building proposes its outline", fragment(640, 380, proposed, roof=False))
        + state("A tap where nothing is known", fragment(640, 200, nothing, roof=False))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">With the footprints the map carries a second line of attribution: © Overture Maps Foundation, ODbL.</p>'
    )
    return card("Detect building", body, gap=12)


def loupe_card() -> str:
    x, y = 214, 150  # the corner under the finger
    finger = f'<div aria-hidden="true" style="position: absolute; left: {x - 22}px; top: {y - 22}px; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.16)"></div>'
    loupe = (
        f'<div aria-hidden="true" style="position: absolute; left: {x - 52}px; top: {y - 52 - 92}px; width: 104px; height: 104px; box-sizing: border-box; border-radius: 50%; overflow: hidden; '
        f'border: 2px solid {ACCENT}; box-shadow: {SHADOW_FLOAT}; background: #2F342D">'
        f'<div style="position: absolute; left: -{x * 2 - 52}px; top: -{y * 2 - 52}px; width: 716px; height: 640px; transform-origin: 0 0">{imagery(716, 640, 3.4 * 2, 40 * 2, 200 * 2)}</div>'
        f'<div style="position: absolute; left: 51px; top: 0; width: 2px; height: 104px; background: {ACCENT}; opacity: 0.7"></div>'
        f'<div style="position: absolute; left: 0; top: 51px; width: 104px; height: 2px; background: {ACCENT}; opacity: 0.7"></div></div>'
    )
    inside = (
        corner(40, 200 + 0, touch=True)
        + corner(40 + 90 * 3.4, 200, touch=True)
        + corner(x, y, touch=True, live=True)
        + finger
        + loupe
        + edge_label(x + 40, y + 10, "40.2 m")
    )
    body = (
        state("A corner is dragged with a finger: a loupe of 104 px shows twice the imagery above it, with a cross at the corner. It goes when the finger lifts", fragment(358, 320, inside, roof=True))
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Handles are 22 px and take a touch of 44 by 44 around them. Tapping the first corner closes the outline; a tap on the map elsewhere places a corner.</p>'
    )
    return card("The loupe on touch", body, gap=12)


def corner_row(name: str, east: str, north: str, selected: bool = False) -> str:
    ground = f"background: {SURFACE_2}; border: 1px solid {ACCENT}" if selected else f"border: 1px solid transparent"
    return (
        f'<li role="option" aria-selected="{"true" if selected else "false"}" style="display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; height: 36px; padding: 0 10px; border-radius: 8px; {ground}">'
        f'<span style="font-size: 13px">{name}</span><code style="font-size: 13px; color: {TEXT_2}">{east} E</code><code style="font-size: 13px; color: {TEXT_2}">{north} N</code></li>'
    )


def keys_card() -> str:
    def key(text: str) -> str:
        return f'<code style="padding: 1px 6px; border: 1px solid {LINE_STRONG}; border-radius: 4px; font-size: 12px">{text}</code>'

    rows = corner_row("Corner 1", "−45.0", "−20.0") + corner_row("Corner 2", "45.0", "−20.0") + corner_row("Corner 3", "45.0", "20.0", selected=True) + corner_row("Corner 4", "−45.0", "20.0")
    listing = f'<ul role="listbox" aria-label="Corners" style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px">{rows}</ul>'
    hints = (
        '<div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; align-items: center; font-size: 13px">'
        f'<span>{key("Enter")}</span><span style="color: {TEXT_2}">Closes the outline on the first corner</span>'
        f'<span>{key("Esc")}</span><span style="color: {TEXT_2}">Takes the last corner back while drawing</span>'
        f'<span>{key("←")} {key("→")} {key("↑")} {key("↓")}</span><span style="color: {TEXT_2}">Nudge the selected corner 0.1 m</span>'
        f'<span>{key("Shift")} + arrows</span><span style="color: {TEXT_2}">Nudge 1 m</span>'
        f'<span>{key("⌘")} {key("Z")}</span><span style="color: {TEXT_2}">Undo, and with {key("Shift")} redo</span>'
        f'<span>{key("Delete")}</span><span style="color: {TEXT_2}">Removes the selected corner (three stay at least)</span></div>'
    )
    body = (
        state("In the panel, under the edges: every corner in local metres, east and north of the centre. The selected one pulses on the map", listing)
        + section("Keys", top=4)
        + hints
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The map canvas is named “Satellite map”; the outline has a text equivalent in this list, and the tools are a toolbar whose active tool is pressed.</p>'
    )
    return card("Corners by keyboard", body, gap=12)


def states_board() -> str:
    width, height = 1440, STATES_HEIGHT
    column = '<div style="display: flex; flex-direction: column; gap: 16px">\n'
    grid = (
        '<div style="flex-grow: 1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start">\n'
        + column + search_card() + rectangle_card() + loupe_card() + "</div>\n"
        + column + no_map_card() + detect_card() + keys_card() + "</div>\n"
        + "</div>\n"
    )
    return (
        HEAD.format(
            title="Find and outline, states and tools",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Find and outline, states and tools",
            lead="What the two boards of Find do not show: the search and its answers, the rectangle, a footprint proposed, the loupe of a touch drag, the map without a key, WebGL or a connection, the corners for the keyboard.",
        ).replace("@keyframes spin", "@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,176,32,.55),0 2px 6px rgba(0,0,0,.6)}50%{box-shadow:0 0 0 9px rgba(255,176,32,0),0 2px 6px rgba(0,0,0,.6)}}\n@keyframes spin")
        + grid
        + FOOT.format(width=width, height=height)
    )


if __name__ == "__main__":
    (HERE / "LocateTablet.dc.html").write_text(tablet_board(), encoding="utf-8")
    (HERE / "LocateStates.dc.html").write_text(states_board(), encoding="utf-8")
    print("LocateTablet.dc.html, LocateStates.dc.html")
