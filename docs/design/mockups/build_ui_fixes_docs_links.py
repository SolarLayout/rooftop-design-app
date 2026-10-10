"""The boards "UI fixes · The docs from the app" on desktop 1440, tablet 834 and phone 390 (#193).

The Rooftop docs (solarlayout.app/docs/rooftop) are live, but nothing in the app leads to them. Three ways in, each opening
the docs in a new tab so the design stays open: Docs at the right of Home's header; a Docs row at the foot of the project
menu, on every page; and, in the help sheet, under a topic's Related topics, "In the docs" with the page and section that
tell more. Two new icons: a book for the docs, and the mark of a link that leaves the app. Each board is the app caught in
the browser with a prototype on the local branch design/docs-links, never merged (docs_links/). The canvas's copies show
the same images uploaded to it (--canvas), written into the folder given after it.
Usage: python3 -I build_ui_fixes_docs_links.py [--canvas <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_phase3_boards import GROUND, LINE, TEXT, TEXT_2  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
CANVAS = {
    "desktop-1.png": "/_blob/0ef275bac70d8fd50eb2dcd63c2648a2", "desktop-2.png": "/_blob/e55b63a12fde3248d66ba0899e666f44", "desktop-3.png": "/_blob/39af15118e54554de4ab24b75f95bec4",
    "tablet-1.png": "/_blob/bbd794d44a65e2b5bbcc0c52fe717e24", "tablet-2.png": "/_blob/c4329980df4147dfd8a139c02250166e", "tablet-3.png": "/_blob/e76d642a6adc78f4dd632be27d522f5d",
    "phone-1.png": "/_blob/1bfd6966a6a72aff4bfeec02a3859231", "phone-2.png": "/_blob/c190ad541b6e76e454321d7fa1d71c87", "phone-3.png": "/_blob/0212f2405b1a4d399e9d71b2275392e2",
}
STATES = (
    "Home: Docs at the right of the header",
    "The project menu: Docs, the last row, on every page",
    "The help sheet: In the docs, under Related",
)
WORDS = (
    "The Rooftop docs are live at solarlayout.app/docs/rooftop, and nothing in the app leads to them. Three ways in, each "
    "opening the docs in a new tab so the design stays open, each marked with the arrow out of a box that says the link "
    "leaves the app. Home has Docs at the right of its header: Home is outside the shell and has no project menu. The "
    "project menu, on every page and size, ends with a Docs row, to the docs' first page. The help sheet ends every topic "
    "with In the docs: the docs page and section that tell more (here Shading over the year opens The Sun lens at its "
    "section), after the Related topics, which stay in the app."
)
WHEN = (
    "Two new icons: a book for the docs, and the arrow out of a box. Every topic names its page in its front matter, "
    "checked by the help gate as Related is. The address comes from one setting per environment: staging's app opens "
    "staging's docs."
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
    src = CANVAS[name] if canvas else f"docs_links/{name}"
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
        f'<figcaption style="padding: {inset}; color: {TEXT_2}">{at} · {STATES[at - 1]}</figcaption>'
        f'<img src="{src}" alt="{STATES[at - 1]}, {size}" style="display: block; width: {width}px; border: 1px solid {LINE}; '
        f'border-radius: 12px; box-sizing: border-box"></figure>'
    )


def board(file: str, size: str, title: str, width: int, pad: str, words: str, columns: int, shot: int, gap: int,
          height: int, canvas: bool, note: str) -> None:
    states = "".join(state(size, at, shot, canvas, words) for at in range(1, 4))
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: {words}"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'The docs from the app</h1><p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WORDS}</p>'
        f'<p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WHEN} {note}</p></div>'
        f'<div style="display: grid; grid-template-columns: repeat({columns}, {shot}px); gap: {gap}px">{states}</div></div>\n'
    )
    (OUT / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("DocsLinks.dc.html", "desktop", "UI fixes · The docs from the app · desktop 1440", 1552,
          "40px 56px", "0", 2, 708, 24, 1320, canvas,
          "Desktop: the project menu drops from the design's name; the help sheet stands at the right.")
    board("DocsLinksTablet.dc.html", "tablet", "UI fixes · The docs from the app · tablet 834", 834,
          "40px 16px", "0", 2, 391, 20, 1560, canvas,
          "Tablet: the project menu is a bottom sheet; the help sheet stands at the right.")
    board("DocsLinksPhone.dc.html", "phone", "UI fixes · The docs from the app · phone 390", 390,
          "40px 0", "0 16px", 1, 390, 24, 3240, canvas,
          "Phone: the project menu and the help sheet are bottom sheets.")
