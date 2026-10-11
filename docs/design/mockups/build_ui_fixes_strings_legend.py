"""The boards "UI fixes · The strings' legend with many MPPT" on desktop 1440, tablet 834 and phone 390.

#114: the legend of the strings on the stage names every MPPT, string or inverter, though the series has six colours.
With an inverter of 10 MPPT (the library's Solis S5-GC125K-HV, three inverters on the demo roof) it runs under the
inspector on desktop; by string, 46 strings, it runs off the stage on desktop and covers the stage on phone. Proposed:
one entry per colour, each naming what it marks. Each board is the Strings lens caught in the browser (strings_legend/):
today by MPPT and by string, as proposed, and the demo as approved, unchanged. The proposal was drawn by the app itself
from a prototype on the local branch `design/strings-legend-many`, never merged. The canvas's copies show the same
images uploaded to it (--canvas), written into the folder given after it.
Usage: python3 -I build_ui_fixes_strings_legend.py [--canvas <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_phase3_boards import GROUND, LINE, TEXT, TEXT_2  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
# The uploads of strings_legend/ to the canvas, by file name: filled when the boards are published there.
CANVAS: dict[str, str] = {}
STATES = (
    "Today · by MPPT, 10 MPPT: one entry per MPPT, past the stage",
    "Today · by string, 46 strings: every string named",
    "Proposed · by MPPT: one entry per colour, MPPT 1 · 7",
    "Proposed · by string: S1 · S7 · S13 … S43",
    "The demo by MPPT, 6 MPPT: as approved, unchanged",
    "The demo by string, 22 strings: as approved, unchanged",
)
WORDS = (
    "The series has six colours, so from the seventh MPPT, string or inverter the colours come round again: MPPT 7 is "
    "MPPT 1's blue. Today the legend still names each one, so with an inverter of 10 MPPT (Solis S5-GC125K-HV, three "
    "inverters on the demo roof) it runs under the inspector on desktop, and by string, 46 strings, it runs off the stage "
    "on desktop and covers the stage on phone. Proposed: one entry per colour, never more than six and Not used, each "
    "naming all that colour marks, as By string already does: MPPT 1 · 7, MPPT 2 · 8, … MPPT 6. A colour that marks more "
    "than four shows the first three, an ellipsis and the last: S1 · S7 · S13 … S43. A screen reader hears every one."
)
WHEN = (
    "Where room is short (tablet, phone) the numbers of a colour stand close, 1·7, and the rule and Not used keep to the "
    "line of the last colour. The legend wraps within the stage if it still does not fit. The library's 15 MPPT give at "
    "most three to a colour (MPPT 1 · 7 · 13). Which of two MPPTs of one colour a string is on: its trace and its callout "
    "say, as by string today. Up to six, the legend is as approved."
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


def state(size: str, at: int, width: int, canvas: bool, inset: str) -> str:
    name = f"{size}-{at}.png"
    src = CANVAS[name] if canvas else f"strings_legend/{name}"
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
        f'<figcaption style="padding: {inset}; color: {TEXT_2}">{at} · {STATES[at - 1]}</figcaption>'
        f'<img src="{src}" alt="{STATES[at - 1]}, {size}" style="display: block; width: {width}px; border: 1px solid {LINE}; '
        f'border-radius: 12px; box-sizing: border-box"></figure>'
    )


def board(file: str, size: str, title: str, width: int, pad: str, words: str, columns: int, shot: int, gap: int,
          height: int, canvas: bool, note: str) -> None:
    states = "".join(state(size, at, shot, canvas, words) for at in range(1, len(STATES) + 1))
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: {words}"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f"The strings' legend with many MPPT</h1><p style=\"margin: 0; max-width: 960px; color: {TEXT_2}\">{WORDS}</p>"
        f'<p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WHEN} {note}</p></div>'
        f'<div style="display: grid; grid-template-columns: repeat({columns}, {shot}px); gap: {gap}px">{states}</div></div>\n'
    )
    (OUT / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("StringsLegend.dc.html", "desktop", "UI fixes · The strings' legend with many MPPT · desktop 1440", 1552,
          "40px 56px", "0", 2, 708, 24, 1840, canvas,
          "Desktop: a card at the stage's bottom left, the switch beside the legend (by string the legend on a line of its own).")
    board("StringsLegendTablet.dc.html", "tablet", "UI fixes · The strings' legend with many MPPT · tablet 834", 834,
          "40px 16px", "0", 2, 391, 20, 2220, canvas,
          "Tablet: the card at the stage's bottom right, the switch over the legend.")
    board("StringsLegendPhone.dc.html", "phone", "UI fixes · The strings' legend with many MPPT · phone 390", 390,
          "40px 0", "0 16px", 1, 390, 24, 6100, canvas,
          "Phone: the legend alone at the stage's bottom, the switch in the sheet.")
