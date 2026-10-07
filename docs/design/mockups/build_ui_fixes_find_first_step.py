"""The boards "UI fixes · Find's first step, a panel that says what to do" on desktop 1440, tablet 834 and phone 390.

The owner (end of session 19): at /find, before a place is found, the panel holds a title and one line, then nothing; "the
user is totally in the dark as what to do next on this page". Proposed: the panel of the first step says what to do and
offers it. Three ways to start as cards (Search for the building, which takes the hand to the search; Use my location;
Enter dimensions by hand, which today shows only from the second step on); what the search understands, four examples that
put themselves into the search when pressed; the three steps, the first lit; a ? beside the title that opens the how-to
"Find the roof" (D81). Without a map, one way (by hand) and steps in its words. Each board is the app caught in the browser
with a prototype on the local branch `design/find-first-step`, never merged (find_first_step/); the canvas's copies show the
same images uploaded to it (--canvas).
Usage: python3 -I build_ui_fixes_find_first_step.py [--canvas]
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import ACCENT, GROUND, LINE, SURFACE_1, TEXT, TEXT_2, TEXT_3  # noqa: E402
from build_ui_fixes_locate_search import HEAD, TAIL  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
HEADING = f"font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: {ACCENT}"
# The images' addresses on the canvas, from the upload of find_first_step/ to its asset store (find_first_step/canvas.json).
CANVAS_FILE = HERE / "find_first_step" / "canvas.json"

INTRO = (
    "Today, before a place is found, the panel holds “Find the roof” and one line, then empty space: the user is left to "
    "guess (the owner, session 19). Proposed: the panel of the first step says what to do and offers it, in the panel's own "
    "parts (section headings, cards of the roof type's look, the marks of the help's steps). Nothing else of Find changes: "
    "the search stays over the map, the steps' pill above it, the sheet of 384 at the bottom on phone and tablet."
)

SPEC = [
    ("Title and lead", "Find the roof, with a ? beside it. “Find the building first: the map flies to it, close enough to outline its roof.”"),
    ("Start here", "Three cards, 52 high (the roof type's look, the icon in the accent). Search for the building: the hand goes to "
     "the search at the top, its field focused and given the accent line of a focused well, which the floating search lacks today (on phone the keyboard opens). Use my location: what the button beside the "
     "search does. Enter dimensions by hand: the roof by its measurements, offered from the first step now, not only the second."),
    ("The search understands", "An address, coordinates, degrees, minutes and seconds, a maps link: four rows, the example in the "
     "figures' type. Pressed, a row puts its example into the search and the search reads it back under the field, as it does "
     "for anything typed; nothing is searched until the user says so."),
    ("Three steps", "Find, Outline, Build, one line each, the first lit with the accent mark. On phone, which has no steps' pill, "
     "this is where the steps are seen."),
    ("The ?", "Opens the how-to “Find the roof” in the help sheet (D81): 1 Search the address, or paste coordinates or a link "
     "(a picture of the field and the places found); 2 Choose the place, and the map flies to it (a picture at roof zoom); "
     "3 Or use your location, or enter the roof by hand. Its pictures are taken by bun help:pictures."),
    ("Without a map", "The lead says the map cannot be shown and the roof can still be entered by its measurements; one card, "
     "Enter dimensions by hand; the steps in its words. A place searched there opens the entry by hand with the place filled, "
     "where today it would step on to an outline that cannot be drawn."),
    ("Once a place is found", "Unchanged: the panel becomes Outline the roof, with its tools, edges and roof type."),
]


def image(name: str, canvas: dict[str, str] | None) -> str:
    return canvas[name] if canvas else f"find_first_step/{name}"


def shot(name: str, caption: str, width: int, canvas: dict[str, str] | None) -> str:
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
        f'<figcaption style="font-size: 13px; line-height: 18px; color: {TEXT_2}">{caption}</figcaption>'
        f'<img src="{image(name, canvas)}" alt="{caption}" style="display: block; width: {width}px; border: 1px solid {LINE}; border-radius: 12px"></figure>'
    )


def spec(columns: int) -> str:
    rows = "".join(
        f'<div style="display: flex; flex-direction: column; gap: 4px"><h3 style="margin: 0; {HEADING}">{head}</h3>'
        f'<p style="margin: 0; color: {TEXT_2}">{words}</p></div>'
        for head, words in SPEC
    )
    return (
        f'<div style="display: grid; grid-template-columns: repeat({columns}, 1fr); gap: 18px 32px; padding: 24px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px">{rows}</div>'
    )


SHOTS = {
    "desktop": [
        ("desktop-0-before.jpg", "Today: the first step, the panel empty under one line"),
        ("desktop-1-start.jpg", "Proposed: the ways to start, what the search understands, the three steps"),
        ("desktop-3-search.jpg", "Search for the building pressed: the search's field focused (built, it also takes the accent line)"),
        ("desktop-4-example.jpg", "An example pressed: in the search, read back under the field"),
        ("desktop-5-nomap.jpg", "Without a map: one way, by hand, and the steps in its words"),
    ],
    "tablet": [
        ("tablet-0-before.jpg", "Today: the sheet empty under one line"),
        ("tablet-1-start.jpg", "Proposed: the ways to start at the top of the sheet"),
        ("tablet-2-scrolled.jpg", "The sheet scrolled: the examples and the three steps"),
        ("tablet-3-search.jpg", "Search for the building pressed: the field focused"),
        ("tablet-4-example.jpg", "An example pressed: in the search, read back"),
        ("tablet-5-nomap.jpg", "Without a map: by hand, and its steps"),
    ],
    "phone": [
        ("phone-0-before.jpg", "Today: the sheet empty under one line"),
        ("phone-1-start.jpg", "Proposed: the ways to start at the top of the sheet"),
        ("phone-2-scrolled.jpg", "The sheet scrolled: the examples and the three steps (phone has no steps' pill)"),
        ("phone-3-search.jpg", "Search for the building pressed: the field focused, the keyboard opens"),
        ("phone-4-example.jpg", "An example pressed: in the search, read back"),
        ("phone-5-nomap.jpg", "Without a map: by hand, and its steps"),
    ],
}


def board(file: str, size: str, title: str, width: int, shotw: int, per_row: int, pad: int, columns: int, height: int, canvas: dict[str, str] | None) -> None:
    shots = "".join(shot(name, caption, shotw, canvas) for name, caption in SHOTS[size])
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 28px; padding: 40px {pad}px; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f"Find's first step: a panel that says what to do</h1><p style=\"margin: 0; max-width: 960px; color: {TEXT_2}\">{INTRO}</p>"
        f'<p style="margin: 0; font-size: 12px; color: {TEXT_3}">The app caught in the browser, with a prototype of the panel; for approval.</p></div>'
        f"{spec(columns)}"
        f'<div style="display: grid; grid-template-columns: repeat({per_row}, {shotw}px); gap: 28px 32px; align-items: start">{shots}</div></div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = json.loads(CANVAS_FILE.read_text(encoding="utf-8")) if "--canvas" in sys.argv else None
    board("FindFirstStep.dc.html", "desktop", "UI fixes · Find's first step · desktop 1440", 1552, 1440, 1, 56, 2, 5520, canvas)
    board("FindFirstStepTablet.dc.html", "tablet", "UI fixes · Find's first step · tablet 834", 834, 369, 2, 24, 1, 2600, canvas)
    board("FindFirstStepPhone.dc.html", "phone", "UI fixes · Find's first step · phone 390", 390, 342, 1, 24, 1, 6380, canvas)
