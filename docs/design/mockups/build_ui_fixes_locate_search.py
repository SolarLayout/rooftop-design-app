"""The boards "UI fixes · My location and Search on every size" on desktop 1440, tablet 834 and phone 390.

The owner (session 18): "The pick current location button shows up only in tablet and mobile view. It needs to show in
desktop form factor also and also on home page", and "in desktop mode there is no CTA button that can be clicked after
inputting address" in Find. Beside Find's search one place: before anything is typed, Use my location (the square of 48 the
touch sizes had, now on desktop too, with its tooltip); with something typed, Search (primary, 48 high), which does what
Enter does. Home's well holds Use my location before Find my roof while nothing is typed. Each board is the app caught in
the browser (locate_search/); the canvas's copies show the same images uploaded to it (--canvas).
Usage: python3 -I build_ui_fixes_locate_search.py [--canvas]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import GROUND, LINE, TEXT, TEXT_2  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
CANVAS = {
    "cut-find-desktop-empty.png": "/_blob/2acc61ce046029065d90e8a63cb6862c", "cut-find-desktop-typed.png": "/_blob/090f16c8950a7fbd261c994fb81a3f57",
    "cut-home-desktop.png": "/_blob/1bad47d51eb7240b38ae17395334b03c", "cut-find-tablet-empty.png": "/_blob/f88209be7bef4761a476eb4cd93ea84c",
    "cut-find-tablet-typed.png": "/_blob/f75293a4ecfd82df8ae971202c67b0d8", "cut-home-tablet.png": "/_blob/6e94aeec4f578a18bbec84cb81ba8d4a",
    "cut-find-phone-empty.png": "/_blob/482e27146e3a10c7ebdfbf7b944d86bc", "cut-find-phone-typed.png": "/_blob/9f873c0383bd16ddf03cda5f43a840a7",
    "cut-home-phone.png": "/_blob/958fbb693f45e60c4b6326385aa461de",
}
INTRO = (
    "Beside Find's search, one place. Before anything is typed: Use my location, the square of 48 (now on desktop too, its "
    "tooltip “Use my location”). With something typed: Search, primary, 48 high; it does what Enter does: the words "
    "searched, coordinates or a maps link taken. Once a place is found its name stands in the field, and nothing beside it. "
    "On Home the well holds Use my location (a quiet icon of 44) before Find my roof while nothing is typed; a place found "
    "leads to Find there. Refused or not available, the location says so under the field, as on the touch sizes today."
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


def shot(name: str, caption: str, width: int, canvas: bool) -> str:
    src = CANVAS[name] if canvas else f"locate_search/{name}"
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px"><figcaption style="font-size: 13px; color: {TEXT_2}">{caption}</figcaption>'
        f'<img src="{src}" alt="{caption}" style="display: block; width: {width}px; border: 1px solid {LINE}; border-radius: 12px"></figure>'
    )


def board(file: str, size: str, title: str, width: int, shotw: int, pad: str, height: int, canvas: bool) -> None:
    shots = "".join((
        shot(f"cut-find-{size}-empty.png", "Find, nothing typed: Use my location beside the field", shotw, canvas),
        shot(f"cut-find-{size}-typed.png", "Find, an address typed: Search in its place (Enter does the same)", shotw, canvas),
        shot(f"cut-home-{size}.png", "Home: Use my location in the well, before Find my roof, while nothing is typed", shotw, canvas),
    ))
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'My location and Search on every size</h1><p style="margin: 0; max-width: 960px; color: {TEXT_2}">{INTRO}</p></div>'
        f'<div style="display: flex; flex-direction: column; gap: 28px">{shots}</div></div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("LocateSearch.dc.html", "desktop", "UI fixes · My location and Search on every size · desktop 1440", 1552, 1440, "40px 56px", 2120, canvas)
    board("LocateSearchTablet.dc.html", "tablet", "UI fixes · My location and Search on every size · tablet 834", 834, 834, "40px 0", 2340, canvas)
    board("LocateSearchPhone.dc.html", "phone", "UI fixes · My location and Search on every size · phone 390", 390, 390, "40px 0", 2240, canvas)
