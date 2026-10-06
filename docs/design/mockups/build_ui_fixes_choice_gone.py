"""The boards "UI fixes · A choice of stringing that no longer fits" on desktop 1440, tablet 834 and phone 390.

The owner (session 18) opened his IKEA design in Handover and read "This design has no option 18x84x7. It has 23x67x7,
24x64x7, 24x102x7 and 23x102x7. Choose one of them.", and "had zero clue of what's going on": the stringing chosen
before the module and the inverter changed was no longer one of the design's options. Now the design takes the option
the screens show, and a note says so in plain words, with the way to the options. Each board is the app caught in the
browser as the IKEA design is opened (choice_gone/); the canvas's copies show the same images uploaded to it (--canvas).
Usage: python3 -I build_ui_fixes_choice_gone.py [--canvas]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import GROUND, LINE, TEXT, TEXT_2  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
CANVAS = {"note-desktop.png": "/_blob/7e1f380378664b4e041dc24c3cd862d2", "note-tablet.png": "/_blob/1561a0afcf2b61046c56400f1642e3af",
          "note-phone.png": "/_blob/11a84d8fad7586f0f3d3d0a6efc7c959"}
WORDS = (
    "The note, a toast that stays until it is closed: “The stringing you chose, 18 in series × 84 strings on 7 inverters, "
    "no longer fits this design. Option A, Recommended, is used instead: 23 in series × 67 strings on 7 inverters.” "
    "Choose another leads to the options of the Strings lens."
)
WHEN = (
    "When: a run lands and the design's chosen option is not among its options (another module, inverter, voltage or roof "
    "changed them), or a design is opened whose choice no longer fits. The design takes the option shown, as part of the "
    "edit that changed it: nothing to undo, nothing run again; undo gives the edit and its choice back. Nothing is said for "
    "a choice that still fits, nor twice for the same."
)

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
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
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


def board(file: str, size: str, title: str, width: int, shot: int, pad: str, height: int, canvas: bool, note: str) -> None:
    name = f"note-{size}.png"
    src = CANVAS[name] if canvas else f"choice_gone/{name}"
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'A choice of stringing that no longer fits</h1><p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WORDS}</p>'
        f'<p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WHEN} {note}</p></div>'
        f'<img src="{src}" alt="The note, {size}" style="display: block; width: {shot}px; border: 1px solid {LINE}; border-radius: 12px"></div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("ChoiceGone.dc.html", "desktop", "UI fixes · A choice of stringing that no longer fits · desktop 1440", 1552, 1440, "40px 56px", 1180, canvas,
          "Desktop: the toast at the bottom of the screen, the action and the close beside the words.")
    board("ChoiceGoneTablet.dc.html", "tablet", "UI fixes · A choice of stringing that no longer fits · tablet 834", 834, 834, "40px 0", 1500, canvas,
          "Tablet: the same, across the width.")
    board("ChoiceGonePhone.dc.html", "phone", "UI fixes · A choice of stringing that no longer fits · phone 390", 390, 390, "40px 0", 1350, canvas,
          "Phone: above the tab bar; the words take the toast's width and the action stands under them at the right (every toast with an action, from now).")
