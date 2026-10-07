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


# The how-tos of Find's tools (the owner, session 19: numbered steps with pictures and callouts in the sheet, videos later),
# drawn by the prototype on the branch design/find-tools-help, never merged.

def entry(size: str, canvas: bool, shown: int) -> str:
    frames = {
        "desktop": ("steps-desktop-1-entry.jpg", 1440, 900, callout(1, 1273, 60, 1340, 60) + callout(2, 77, 274, 200, 300)),
        "tablet": ("steps-tablet-1-entry.jpg", 834, 1194, callout(1, 199, 848, 300, 800) + callout(2, 78, 309, 230, 330)),
        "phone": ("steps-phone-1-entry.jpg", 390, 844, callout(1, 195, 499, 250, 455) + callout(2, 74, 774, 210, 745) + callout(3, 360, 499, 340, 440)),
    }
    image, w, h, overlay = frames[size]
    words = [
        "Beside the panel's title, a ? opens the how-to of what the hand can do now: with the roof open, the outline tool chosen (Corners, Rectangle, Detect "
        "building); once it is closed, the obstacle tool chosen (Box, Tank, Wall, Building); with the roof or an obstacle picked, how to move, turn or delete it.",
        "A tip gets Show me how: the same how-to, at the moment its move becomes possible. Got it stays as it is.",
    ]
    if size == "phone":
        words.append("For you to decide: the title has room for one ?. Proposed: the disc takes the place of the toolbar's \"Show the tips\" ?, "
                     "and each how-to ends with \"Show the tips on the map again\".")
    return explained("1 · Where a how-to opens", frame(image, w, h, shown, overlay, canvas), words, side=size == "desktop")


def how_to(size: str, canvas: bool, shown: int) -> str:
    frames = {
        "desktop": ("steps-desktop-2-sheet.jpg", 1440, 900, callout(1, 1166, 81, 960, 81) + callout(2, 1053, 172, 960, 172) + callout(3, 1150, 305, 960, 305) + callout(4, 1181, 431, 960, 431)),
        "tablet": ("steps-tablet-2-sheet.jpg", 834, 1194, callout(1, 537, 79, 380, 79) + callout(2, 447, 168, 380, 168) + callout(3, 546, 303, 380, 303) + callout(4, 585, 433, 380, 433)),
        "phone": ("steps-phone-2-sheet.jpg", 390, 844, callout(1, 128, 145, 300, 110) + callout(2, 33, 233, 20, 190) + callout(3, 126, 361, 40, 300) + callout(4, 170, 482, 330, 520)),
    }
    image, w, h, overlay = frames[size]
    words = [
        "The sheet as for every topic: where it was opened (Tool · Find), the title and the summary.",
        "The steps, numbered in the disc's orange, a line joining them; each a short title, what to do, and a sentence or two in the words of the hand in use.",
        "A picture of the app itself, cut to the part that matters. What to act on is ringed in the accent and glows; numbered callouts sit on it.",
        "The callouts' words under the picture, by their numbers: they are read without zooming into it.",
    ]
    return explained("2 · A how-to: numbered steps, each with its picture", frame(image, w, h, shown, overlay, canvas), words, side=size == "desktop")


def further(size: str, canvas: bool, shown: int) -> str:
    if size == "desktop":
        image, w, h = "steps-desktop-3-sheet.jpg", 1440, 900
        overlay = callout(1, 1251, 149, 960, 149) + callout(2, 1116, 215, 960, 230) + callout(3, 1370, 508, 960, 508) + callout(4, 1059, 755, 960, 755)
    else:
        image, w, h = "steps-phone-4-sheet.jpg", 390, 844
        overlay = callout(1, 260, 583, 350, 640) + callout(2, 160, 230, 330, 200) + callout(3, 332, 295, 360, 360) + callout(4, 39, 533, 200, 525)
    words = [
        "Words for the hand in use: click, drag and keys with a mouse; press, one finger and two on touch. A key or a gesture in the chip of the tips.",
        "Up to three callouts on a picture; a ring only round the thing to act on.",
        "The picture holds the moment: caught mid-drag or mid-turn, with how far or how much as the app writes it beside the roof.",
        "Then: what follows (nothing changes in the Studio until Build this roof), how to take a step back, and the related topics.",
    ]
    return explained("3 · The hand in use, the moment caught, what follows", frame(image, w, h, shown, overlay, canvas), words, side=size == "desktop")


def text_block(title: str, items: list[str]) -> str:
    return (f'<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; {DISPLAY}; font-size: 20px; line-height: 26px">{title}</h2>'
            f'<ul style="margin: 0; padding: 20px 24px 20px 40px; display: flex; flex-direction: column; gap: 8px; color: {TEXT_2}; background: {SURFACE_1}; '
            f'border: 1px solid {LINE_STRONG}; border-radius: 14px">' + "".join(f"<li>{item}</li>" for item in items) + "</ul></section>")


def pictures() -> str:
    return text_block("4 · The pictures", [
        "Taken from the app by a script, on the demo roof at twice the screen's pixels, so that they show the screen as it is; taken again when it changes "
        "(<code>bun help:pictures</code>), and the change is seen in the pull request.",
        "On a plain ground in place of the satellite imagery: no licence to clear for the imagery, nothing behind the roof to distract, a small file "
        "(60 kB a picture).",
        "The callouts are drawn by the sheet over the picture, not into it: crisp at every size, and kept as numbers in the topic. The gate checks that every "
        "picture is there, has words for a screen reader, and its callouts fall inside it.",
        "On phone and tablet a picture pressed opens at the width of the screen, and pinches; Back or × returns to the step.",
    ])


def clip(canvas: bool, shown: int) -> str:
    w, h = 1038, 544
    scale = shown / w
    play = (
        f'<div style="position: relative; width: {shown}px; height: {round(h * scale)}px; flex-shrink: 0; overflow: hidden; border: 1px solid {LINE}; border-radius: 12px">'
        f'<img src="{src("steps-video-frame.jpg", canvas)}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.7)">'
        f'<div style="position: absolute; left: 50%; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%; background: {ACCENT}; '
        f'box-shadow: 0 6px 18px rgba(255,176,32,.45); display: flex; align-items: center; justify-content: center">'
        f'<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="{ACCENT_INK}"/></svg></div>'
        f'<span style="position: absolute; right: 12px; bottom: 12px; padding: 2px 8px; border-radius: 6px; background: rgba(5,7,10,.8); color: {TEXT}; '
        f'font-family: \'Geist Mono\', monospace; font-size: 12px">0:09</span></div>'
    )
    words = [
        "Later, a step may show a short clip in the same frame: its first frame with a play button and its length; it plays in place, muted, never by itself, "
        "and loops. The step's words stay as its caption, the callouts as the clip's marks.",
        "A picture first, always; a clip only where a gesture is hard to see still (turning, a drag that snaps). Nothing in this work waits for clips.",
    ]
    return explained("5 · Later: a short clip in the same frame", play, words, side=shown > 500)


def find_how_tos() -> str:
    return text_block("6 · The how-tos of Find (about ten topics, find.tool.…)", [
        "Outline by its corners (Corners): click each corner, close on the first or with Enter; drag a corner, add one on an edge, remove one; Square the corners.",
        "Draw a rectangle (Rectangle): drag across the roof, then turn it by its handle.",
        "Detect the building (Detect building): click inside it, then accept the outline proposed or adjust it.",
        "Move or turn the roof: the sample on this board.",
        "A box, a tank, a wall, a building beside the roof: how each is drawn, and its height asked right after.",
        "Move, turn or delete an obstacle; its height in the list.",
        "Undo, redo and clear, and what Build this roof keeps.",
        "Each is written as these: numbered steps, a picture for each, pointer and touch in their own words; the sentences checked against the code.",
    ])


STEPS_INTRO = ("Help for Find's tools, as you asked: numbered steps, each with a picture of the app and callouts on it, in the same help sheet; "
               "built so that a short clip can take a picture's place later. Drawn by a prototype in the app (one topic, \"Move or turn the roof\", "
               "and its two ways in).")


def steps_board(file: str, title: str, width: int, pad: str, sections: str, height: int) -> None:
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'How-tos with pictures</h1><p style="margin: 0; max-width: 1000px; color: {TEXT_2}">{STEPS_INTRO}</p></div>{sections}</div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


# The clips of the how-tos (Phase 15; D82 to D84): a short clip in a step's frame, drawn by a prototype on the branch
# design/help-clips, never merged, from the spike's clip of "Move or turn the roof".

def clip_entry(size: str, canvas: bool, shown: int) -> str:
    frames = {
        "desktop": ("clips-desktop-1-poster.jpg", 1440, 900, callout(1, 1198, 456, 960, 456) + callout(2, 1380, 548, 1380, 610) + callout(3, 1236, 408, 960, 380)),
        "tablet": ("clips-tablet-1-poster.jpg", 834, 1194, ""),
        "phone": ("clips-phone-1-poster.jpg", 390, 844, ""),
    }
    image, w, h, overlay = frames[size]
    words = [
        "A step that shows a gesture holds a clip in its picture's frame. At rest it is the step's picture, as before, with a play button "
        "of the accent in its middle; nothing of the clip is loaded until it is pressed.",
        "The clip's length, in its lower right.",
        "The picture's callouts and their words stay as they are while it rests; they step aside while the clip plays, and their words stay under it.",
    ]
    return explained("1 · A clip in a step", frame(image, w, h, shown, overlay, canvas), words if size == "desktop" else [words[0]], side=size == "desktop")


def clip_states(canvas: bool, shown: int, columns: int) -> str:
    states = [
        ("clips-state-1-poster.jpg", "At rest: the picture, play, its length"),
        ("clips-state-2-loading.jpg", "Pressed: a ring in the button while the clip comes"),
        ("clips-state-3-playing.jpg", "Playing: muted, looping; a line of the accent at the foot shows how far; a press pauses it"),
        ("clips-state-4-paused.jpg", "Paused: where it stopped, play again"),
        ("clips-state-5-failed.jpg", "Failed: the picture, its callouts, and \"The clip did not load. The picture shows the step.\""),
        ("clips-pointer-press.jpg", "Inside a clip: the hand as a dot, white, the accent while it presses"),
    ]
    width = (shown - 16 * (columns - 1)) // columns
    cells = "".join(
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
        f'<img src="{src(name, canvas)}" alt="" style="display: block; width: {width}px; border: 1px solid {LINE}; border-radius: 12px">'
        f'<figcaption style="font-size: 13px; color: {TEXT_2}">{words}</figcaption></figure>'
        for name, words in states
    )
    return (f'<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; {DISPLAY}; font-size: 20px; line-height: 26px">'
            f'2 · Its states</h2><div style="display: flex; flex-wrap: wrap; gap: 20px 16px; width: {shown}px">{cells}</div></section>')


def clip_sizes(size: str, canvas: bool, shown: int) -> str:
    if size == "desktop":
        return ""
    image = f"clips-{size}-3-playing.jpg"
    w, h = (834, 1194) if size == "tablet" else (390, 844)
    return explained("3 · Playing, on " + size, frame(image, w, h, shown, "", canvas),
                     ["The same frame in the sheet. On touch a press plays and pauses; the magnifier in its corner opens it at the width of the screen, "
                      "where it plays as the picture opens large, pinched to look closer."], side=False)


def clip_rules() -> str:
    return text_block("4 · How a clip behaves, and how it is made", [
        "Never by itself: it plays when pressed, muted (there is no sound), and loops until pressed again or the sheet closes. Under "
        "<code>prefers-reduced-motion</code> it plays once and stops on its last frame.",
        "Every step keeps its picture: a clip is added to a step whose gesture a still shows least (D84: moving and turning the roof, a "
        "rectangle, corners, an obstacle). Where a clip cannot play, the picture shows the step.",
        "Made by a script from the app, as the pictures are (<code>bun help:clips</code>): the hand's acts at a readable pace, a frame at a "
        "time, 30 a second, at twice the pixels; H.264 in MP4 (D83), about 250 kB for 9 s, 500 kB at most a clip and 6 MB in all, beside "
        "the pictures (D82). A README beside the run, the guide's \"Clips\" and a row in CLAUDE.md say how.",
        "A screen reader hears a button, \"Play the clip: \" and the picture's words, then \"Pause the clip\"; the step's words say what it shows.",
    ])


CLIPS_INTRO = ("Phase 15: a step that shows a gesture can play a short clip in its picture's frame, made from the app by a script. "
               "Drawn by a prototype in the app with the spike's clip of \"Move or turn the roof\".")


def clips_board(file: str, title: str, width: int, pad: str, sections: str, height: int) -> None:
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'Clips in the help</h1><p style="margin: 0; max-width: 1000px; color: {TEXT_2}">{CLIPS_INTRO}</p></div>{sections}</div>\n'
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
    steps_board("InAppHelpSteps.dc.html", "In-App Help · How-tos with pictures · desktop 1440", 1552, "40px 56px",
                entry("desktop", canvas, 980) + how_to("desktop", canvas, 980) + further("desktop", canvas, 980) + pictures() + clip(canvas, 700) + find_how_tos(), 3300)
    steps_board("InAppHelpStepsTablet.dc.html", "In-App Help · How-tos with pictures · tablet 834", 834, "40px 24px",
                entry("tablet", canvas, 786) + how_to("tablet", canvas, 786) + pictures() + clip(canvas, 786) + find_how_tos(), 4940)
    steps_board("InAppHelpStepsPhone.dc.html", "In-App Help · How-tos with pictures · phone 390", 390, "40px 16px",
                entry("phone", canvas, 358) + how_to("phone", canvas, 358) + further("phone", canvas, 358) + pictures() + clip(canvas, 358) + find_how_tos(), 5300)
    clips_board("InAppHelpClips.dc.html", "In-App Help · Clips · desktop 1440", 1552, "40px 56px",
                clip_entry("desktop", canvas, 980) + clip_states(canvas, 1440, 3) + clip_rules(), 1840)
    clips_board("InAppHelpClipsTablet.dc.html", "In-App Help · Clips · tablet 834", 834, "40px 24px",
                clip_entry("tablet", canvas, 786) + clip_states(canvas, 786, 2) + clip_sizes("tablet", canvas, 786) + clip_rules(), 4020)
    clips_board("InAppHelpClipsPhone.dc.html", "In-App Help · Clips · phone 390", 390, "40px 16px",
                clip_entry("phone", canvas, 358) + clip_states(canvas, 358, 1) + clip_sizes("phone", canvas, 358) + clip_rules(), 4340)
