"""The boards "In-app help" on desktop 1440, tablet 834 and phone 390 (the canvas page "In-App Help").

The owner (session 19): the section headings of the input panels get a small "?", a disc with the shading, light and colour
of the primary action; the help itself slides in as a sheet on desktop, suited to tablet and phone; the core of the help
system is the solarlayout repo's (packages/help: keyed topics in MDX, a typed registry, a panel with Back, related topics,
?help= in the address), the look and the IA ours. Each frame is the app caught in the browser (in_app_help/) with a
prototype of the disc and the sheet drawn by the app itself (branch design/in-app-help, never merged), numbered callouts
over it and explained beside it; the topics' words are checked against the code. The canvas's copies show the same images
uploaded to it (--canvas).
Usage: python3 -I build_in_app_help.py [--canvas]
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import ACCENT, ACCENT_INK, GROUND, LINE, LINE_STRONG, SURFACE_1, TEXT, TEXT_2, TEXT_3  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
FOLDER = "in_app_help"
CANVAS: dict[str, str] = json.loads((HERE / FOLDER / "canvas.json").read_text()) if (HERE / FOLDER / "canvas.json").exists() else {}


def src(name: str, canvas: bool) -> str:
    return CANVAS[name] if canvas and name in CANVAS else f"{FOLDER}/{name}"


def callout(n: int, x: float, y: float, lx: float, ly: float) -> str:
    """A numbered dot at the place, a leader to its number, which the list beside the frame explains."""
    return (
        f'<line x1="{x}" y1="{y}" x2="{lx}" y2="{ly}" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 3"/>'
        f'<circle cx="{x}" cy="{y}" r="4" fill="#FFFFFF"/>'
        f'<circle cx="{lx}" cy="{ly}" r="13" fill="{ACCENT}" stroke="#05070A" stroke-width="2"/>'
        f'<text x="{lx}" y="{ly + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="{ACCENT_INK}" font-family="Geist, sans-serif">{n}</text>'
    )


def frame(image: str, width: int, height: int, shown: int, overlay: str, canvas: bool) -> str:
    """The shot at its own size with the callouts over it, shown at *shown* wide."""
    scale = shown / width
    return (
        f'<div style="position: relative; width: {shown}px; height: {round(height * scale)}px; flex-shrink: 0; overflow: hidden; border: 1px solid {LINE}; border-radius: 12px">'
        f'<div style="position: absolute; left: 0; top: 0; width: {width}px; height: {height}px; transform: scale({scale:.4f}); transform-origin: 0 0">'
        f'<img src="{src(image, canvas)}" alt="" style="position: absolute; inset: 0; width: {width}px; height: {height}px">'
        f'<svg style="position: absolute; inset: 0" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{overlay}</svg></div></div>'
    )


def explained(title: str, the_frame: str, items: list[str], side: bool) -> str:
    rows = "".join(
        f'<li style="display: flex; gap: 10px"><span style="flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: {ACCENT}; color: {ACCENT_INK}; '
        f'font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center">{i}</span><span>{item}</span></li>'
        for i, item in enumerate(items, start=1)
    )
    words = f'<ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; font-size: 14px; color: {TEXT_2}; max-width: 420px">{rows}</ol>'
    layout = "flex-direction: row; gap: 32px; align-items: flex-start" if side else "flex-direction: column; gap: 16px"
    return (
        f'<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; {DISPLAY}; font-size: 20px; line-height: 26px">{title}</h2>'
        f'<div style="display: flex; {layout}">{the_frame}{words}</div></section>'
    )


def states(canvas: bool, shown: int) -> str:
    """The disc beside a heading in its five states, three times the screen."""
    image = f'<img src="{src("disc-states.png", canvas)}" alt="The disc at rest, hovered, focused, pressed, and held in while its help is open" style="display: block; width: {shown}px; border: 1px solid {LINE}; border-radius: 12px">'
    words = [
        "Beside every section heading of the input panels, 6 after its words: a disc of the primary action, its orange, its light from above and its "
        "shadow, a ? in its ink. 16 on desktop in a press of 24; 20 on touch in a press of 44. It is there only where the section has a topic.",
        "Hover lifts it as the primary buttons lift; the focus ring is the app's; pressed it sinks. While its help is open it stays held in, ringed, "
        "so the eye goes back to what is being explained.",
        "A real button: \"Help: System voltage\", it says it opens a dialog and whether it is open. The heading's own glow is untouched.",
    ]
    return explained("1 · A ? beside each section heading (three times the screen)", image, words, side=False)


DESK = ("1440", 1440, 900)


def tooltip(canvas: bool, shown: int) -> str:
    overlay = callout(1, 1207, 298, 1270, 330) + callout(2, 1200, 210, 1110, 160)
    words = [
        "On desktop, the pointer over the disc shows the topic's summary, one or two lines, and \"Click for more\". Touch has no hover: a press opens the sheet.",
        "The summary is the topic's own (140 characters at most): the same words lead the sheet, so nothing is said twice in two ways.",
    ]
    return explained("2 · Hover tells, a click opens", frame("desktop-2-tooltip.jpg", 1440, 900, shown, overlay, canvas), words, side=True)


def drawer(canvas: bool, shown: int) -> str:
    overlay = (callout(1, 1128, 23, 960, 60) + callout(2, 1132, 82, 960, 120) + callout(3, 1224, 266, 960, 266)
               + callout(4, 1119, 399, 960, 399) + callout(5, 1069, 765, 960, 765))
    words = [
        "A sheet slides in from the right edge, the whole height of the window, over the top bar and the inspector, 420 wide; the screen is dimmed "
        "behind it and waits. Escape, the ×, or a click beside it close it, and the focus goes back to the disc.",
        "The title and the summary, as the tooltip said them.",
        "Where a section is one choice, its options, each with what it means; the user's own marked \"Your choice\". Nothing is chosen for the user (the system voltage is never preselected).",
        "The topic's body: short headings, plain words, a value in the user's own on-screen words in mono, a note in the note's colours, and links to other topics.",
        "Related topics as rows, each with its summary, so that what is behind a link is known before it is followed.",
    ]
    return explained("3 · The help sheet (desktop)", frame("desktop-3-drawer.jpg", 1440, 900, shown, overlay, canvas), words, side=True)


def related(canvas: bool, shown: int) -> str:
    overlay = callout(1, 1046, 23, 960, 60)
    words = [
        "A related topic or a link followed opens in the sheet; Back (‹) returns, as many steps as were taken. A disc pressed starts afresh. The topic shown "
        "is in the address (?help=studio.section.modules-in-series), so a link to it can be shared and opens it.",
    ]
    return explained("4 · Following a topic, and back", frame("desktop-4-related.jpg", 1440, 900, shown, overlay, canvas), words, side=True)


def find(canvas: bool, shown: int) -> str:
    overlay = callout(1, 1128, 23, 960, 60)
    words = [
        "On Find the headings of the panel have their discs too: Edges, Obstacles, Roof type (and Place and Shape when the roof is entered by hand). "
        "The same sheet opens: where it was opened, its title, its body, its related topics.",
    ]
    return explained("5 · On Find", frame("desktop-6-find-drawer.jpg", 1440, 900, shown, overlay, canvas), words, side=True)


PLACES = [
    ("First: the section headings of the input panels (this work)", [
        "Find, outline: Edges · Roof type · Obstacles; by hand: Place · Shape",
        "Studio, Roof lens: Location · Roof type · Edges and access · Obstacles",
        "Studio, Array lens: Module · Mounting · Spacing · Shade-free window",
        "Studio, Sun lens: Day · Sun at the hour · On the roof · Shading over the year · Shade map",
        "Studio, Strings lens: Inverter · System voltage (and its \"Waiting for your choice\") · Modules in series · Options · MPPT loading",
        "23 headings; one topic where the meaning is the same (Roof type and Obstacles, on Find and in the Roof lens): about 21 topics",
    ]),
    ("Next, in this order, when you say", [
        "The sections that fold: Sizing temperatures, the inverter's limits and cabling (Strings lens)",
        "Each field, a setting: tilt, azimuth, row pitch, setback, modules in tilt, albedo, the Voc coefficient… a ? beside the field's label",
        "The numbers that come back: the vitals (Energy, DC and AC capacity, DC/AC, Modules, PR, Yield); Performance's figures, each step of the loss chain, the charts, the assumptions",
        "Handover: each deliverable (the report, the single-line diagram, the bill of materials, the cable schedule, the CAD layout, the Google Earth model, the hourly data, the project file)",
        "Tools and modes: Find's tools (Corners, Rectangle, Detect building, Box, Tank, Wall, Building), Square the corners, the picker's filters, Layers, the strings' colours",
        "Ideas linked from topics, with no disc of their own: solar time, Voc at the coldest, the MPPT window, the shade-free window, P50 and P90",
    ]),
]


def places() -> str:
    blocks = "".join(
        f'<div style="display: flex; flex-direction: column; gap: 8px; flex: 1"><h3 style="margin: 0; font-size: 15px; font-weight: 600">{title}</h3>'
        f'<ul style="margin: 0; padding: 0 0 0 18px; display: flex; flex-direction: column; gap: 6px; color: {TEXT_2}">'
        + "".join(f"<li>{item}</li>" for item in items) + "</ul></div>"
        for title, items in PLACES
    )
    return (f'<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; {DISPLAY}; font-size: 20px; line-height: 26px">'
            f'6 · Where help goes</h2><div style="display: flex; gap: 40px; padding: 20px 24px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px">{blocks}</div></section>')


def touch_frames(size: str, canvas: bool, shown: int) -> str:
    if size == "tablet":
        w, h = 834, 1194
        discs = explained("2 · The discs on tablet", frame("tablet-1-discs.jpg", w, h, shown, callout(1, 149, 932, 260, 900), canvas),
                          ["The same disc, 20 in a press of 44, beside each heading of the inspector under the stage. A press opens the sheet; touch has no tooltip."], side=False)
        sheet = explained("3 · The sheet from the right, the screen dimmed", frame("tablet-3-drawer.jpg", w, h, shown,
                          callout(1, 520, 24, 380, 60) + callout(2, 600, 260, 380, 260) + callout(3, 200, 600, 120, 560), canvas),
                          ["As on desktop: a sheet from the right edge, the whole height over the top bar, 420 wide, the screen dimmed; a press beside it, the ×, or Escape closes it.",
                           "Its parts as on desktop: options with \"Your choice\", the body, the related topics, Back after a link is followed.",
                           "The page under it is dimmed and waits."], side=False)
        found = explained("4 · On Find", frame("tablet-6-find-drawer.jpg", w, h, shown, "", canvas),
                          ["The same sheet over Find, the map dimmed behind it."], side=False)
        return discs + sheet + found
    w, h = 390, 844
    discs = explained("2 · The discs on phone", frame("phone-1-discs.jpg", w, h, shown, callout(1, 95, 549, 200, 520) + callout(2, 143, 749, 250, 720), canvas),
                      ["The inspector's sheet holds the discs: 20 in a press of 44.", "System voltage, Modules in series, Options… each heading of the lens."], side=False)
    sheet = explained("3 · The sheet from the bottom, the whole height", frame("phone-3-drawer.jpg", w, h, shown,
                      callout(1, 194, 58, 300, 40) + callout(2, 220, 330, 330, 300), canvas),
                      ["As the notes and the equipment picker do on phone: from the bottom, up to 48 under the top, with the grip; dragged down or the × closes it.",
                       "Scrolls as one: the options, the body, the related topics."], side=False)
    back = explained("4 · Following a topic", frame("phone-4-related.jpg", w, h, shown, callout(1, 24, 88, 200, 40), canvas),
                     ["Back (‹) appears once a related topic or a link is followed."], side=False)
    found = explained("5 · On Find", frame("phone-6-find-drawer.jpg", w, h, shown, "", canvas),
                      ["Find's headings in its sheet have their discs; the sheet comes up over the sheet and the map."], side=False)
    return discs + sheet + back + found


INTRO = ("A ? beside each section heading of the input panels opens help on what the section is, its choices and what they do, in "
         "the app's own words. The core is the help system of the solarlayout app (topics in MDX, each with a key; a typed registry checked by tests; a sheet "
         "with Back and related topics; the topic in the address); the look and the places are this app's. The disc and the sheet are drawn here by a "
         "prototype in the app itself; the words of the sample topics are checked against the engine.")

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
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>body{{margin:0;font-family:Geist,system-ui,sans-serif;background:#0B0E13;color:#F2F4F7}}</style>
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


def board(file: str, title: str, width: int, pad: str, sections: str, height: int, note: str) -> None:
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'In-app help</h1><p style="margin: 0; max-width: 1000px; color: {TEXT_2}">{INTRO} {note}</p></div>{sections}</div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("InAppHelp.dc.html", "In-App Help · The ? and the help sheet · desktop 1440", 1552, "40px 56px",
          states(canvas, 1000) + tooltip(canvas, 980) + drawer(canvas, 980) + related(canvas, 980) + find(canvas, 980) + places(), 3840,
          "Desktop: a sheet at the right edge, the whole height, the screen dimmed behind it.")
    board("InAppHelpTablet.dc.html", "In-App Help · The ? and the help sheet · tablet 834", 834, "40px 24px",
          states(canvas, 786) + touch_frames("tablet", canvas, 786), 4580,
          "Tablet: the same sheet at the right edge, the whole height, the screen dimmed.")
    board("InAppHelpPhone.dc.html", "In-App Help · The ? and the help sheet · phone 390", 390, "40px 16px",
          states(canvas, 358) + touch_frames("phone", canvas, 358), 4620,
          "Phone: a sheet from the bottom, the whole height but 48, with the grip.")
