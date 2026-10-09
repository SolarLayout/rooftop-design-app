"""The boards "UI fixes · Your own when the roof holds too few positions" on desktop 1440, tablet 834 and phone 390.

#171, item 6: a roof too small for the run's options can still hold a string, and the Options section said so ("A string
of 14 would fit: enter it as a custom option.") with no way to enter one. Now Add your own stands under the words, set to
the string that fits, and the words name it as the button does. Each board is the Strings lens caught in the browser on a
12.0 × 10.0 m flat roof (16 positions, the demo's module and inverter), in four states (own_too_few/): today, then Add
your own under the words, its fields opened, the option added. The canvas's copies show the same images uploaded to it
(--canvas), written into the folder given after it.
Usage: python3 -I build_ui_fixes_own_too_few.py [--canvas <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_phase3_boards import GROUND, LINE, TEXT, TEXT_2  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
CANVAS = {
    "desktop-1.png": "/_blob/4b0386979a18e51cafb30134423217e7", "desktop-2.png": "/_blob/6bb04c0d70b31193d24e54f3d13551ec",
    "desktop-3.png": "/_blob/1d0bda624043ab05ed85928eb0abbf2a", "desktop-4.png": "/_blob/8b2f7bc484c0c7a932759672c4bc57cf",
    "tablet-1.png": "/_blob/e0d28049ea805bcdbb87242f05a90237", "tablet-2.png": "/_blob/dc42a5b783303482447e293a3c6abf42",
    "tablet-3.png": "/_blob/6eef4a0d37a5b91801a07f929ad0dbdc", "tablet-4.png": "/_blob/81a55d0095e827e4dd54556235da200f",
    "phone-1.png": "/_blob/c94894e6a3ccbc6881f84b66e2264af9", "phone-2.png": "/_blob/ced473553a9c8a49e7794f86d69b7755",
    "phone-3.png": "/_blob/bb060398e97bc0d443591576713fe71b", "phone-4.png": "/_blob/80567e43923ff6b323268e71afd5ce14",
}
STATES = (
    "Today: the advice, and no way to follow it",
    "Add your own under the words",
    "Opened, set to 14 × 1 × 1",
    "Added: Your own, chosen, and the design runs",
)
WORDS = (
    "On a roof too small for the run's options that still holds a string, Options says “Too few positions for a string. "
    "The roof holds 16 positions, and a string takes 14 to 29 modules. A string of 14 would fit: enter it as a custom "
    "option.”, and shows no way to enter one. Now Add your own stands under the words, as it does under the options, and "
    "opens with Series set to the string that fits. Add saves it and chooses it, and the design runs again. The words end "
    "“add it as your own option”, after the button's name."
)
WHEN = (
    "When: the run has no options because the roof holds too few positions, and a string of a length that fits does fit "
    "on it. Not when no length fits, nor when the roof holds no module: there is nothing to add then, and the section "
    "says so as today."
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
    src = CANVAS[name] if canvas else f"own_too_few/{name}"
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
        f'<figcaption style="padding: {inset}; color: {TEXT_2}">{at} · {STATES[at - 1]}</figcaption>'
        f'<img src="{src}" alt="{STATES[at - 1]}, {size}" style="display: block; width: {width}px; border: 1px solid {LINE}; '
        f'border-radius: 12px; box-sizing: border-box"></figure>'
    )


def board(file: str, size: str, title: str, width: int, pad: str, words: str, columns: int, shot: int, gap: int,
          height: int, canvas: bool, note: str) -> None:
    states = "".join(state(size, at, shot, canvas, words) for at in range(1, 5))
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: {words}"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'Your own when the roof holds too few positions</h1><p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WORDS}</p>'
        f'<p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WHEN} {note}</p></div>'
        f'<div style="display: grid; grid-template-columns: repeat({columns}, {shot}px); gap: {gap}px">{states}</div></div>\n'
    )
    (OUT / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("OwnTooFew.dc.html", "desktop", "UI fixes · Your own when the roof holds too few positions · desktop 1440", 1552,
          "40px 56px", "0", 4, 342, 24, 1100, canvas,
          "Desktop: the inspector, beside the stage, in the four states.")
    board("OwnTooFewTablet.dc.html", "tablet", "UI fixes · Your own when the roof holds too few positions · tablet 834", 834,
          "40px 16px", "0", 2, 391, 20, 1290, canvas,
          "Tablet: the Options column, under the stage and the figures.")
    board("OwnTooFewPhone.dc.html", "phone", "UI fixes · Your own when the roof holds too few positions · phone 390", 390,
          "40px 0", "0 16px", 1, 390, 24, 2620, canvas,
          "Phone: the sheet, over the tab bar.")
