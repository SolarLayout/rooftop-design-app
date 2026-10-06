"""The boards "UI fixes · Section headings, three ways" on desktop 1440, tablet 834 and phone 390.

The owner (session 18): the section headings of the input panels stand out in the primary action's orange at weight 600
(color-heading); a line under them was tried, then: "loose the underline temporarily ... or better reduce the spacing
between the section header text and the border ... show me in the design canvas first so that i can choose", then "loose the border
below the section header text, and drop a slight shadow below". Each board shows the Strings lens's inspector as the
app draws it, caught in the browser three ways: A without the line, D with a dark shadow under the words, E with a soft
glow of the heading's orange under them (the first round's B and C, the line close and as built, are in section_headings/). The shots are in section_headings/; the
canvas's copies show the same images uploaded to it (--canvas).
Usage: python3 -I build_ui_fixes_section_headings.py [--canvas]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import GROUND, LINE, TEXT, TEXT_2  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
CANVAS = {
    "cut-desktop-a.png": "/_blob/040f6f8c38467e7ea126a718840d15eb", "cut-desktop-b.png": "/_blob/8b6f919dac7848434d4f9743d6a03650",
    "cut-desktop-c.png": "/_blob/4ae9aedbe53501fe6883e2d56fbe0aa9", "cut-tablet-a.png": "/_blob/9d8217c34ab27fe870bd2cce2cbc7558",
    "cut-tablet-b.png": "/_blob/f6f363994f68ee4b2f29dbd7e3d3ae1f", "cut-tablet-c.png": "/_blob/8ad82879b7c9ea2e09bc1947f15e3deb",
    "cut-phone-a.png": "/_blob/b999044bced8124e4fa382d05a9a1bb4", "cut-phone-b.png": "/_blob/4774d7c4ba6695f9a5544d1ee7efb7e3",
    "cut-phone-c.png": "/_blob/c12980f58f7be45621415aba80942df1",
    "cut-desktop-d.png": "/_blob/570f6f193793db5d438d0e27d56adf1a", "cut-desktop-e.png": "/_blob/47c2ef5b8c1c38d7bd761b9e8f52d15d",
    "cut-tablet-d.png": "/_blob/2b6a2c608b640572279a9c12cd2fa8e2", "cut-tablet-e.png": "/_blob/cc61b83634fcab8057987a7a65a43187",
    "cut-phone-d.png": "/_blob/1b655631d4860ba60e67aada13db248b", "cut-phone-e.png": "/_blob/ef7b4a68038037c18baea7b003f42fa1",
}
WAYS = [("a", "A · No line, no shadow", "The heading in color-heading at 600, nothing under it"),
        ("d", "D · No line, a dark shadow", "text-shadow 0 2px 3px, black at 95 %: on this ground it barely shows"),
        ("e", "E · No line, a soft orange glow", "text-shadow 0 2px 8px, the heading's orange at 35 %")]

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


def src(name: str, canvas: bool) -> str:
    return CANVAS[name] if canvas else f"section_headings/{name}"


def way(size: str, key: str, title: str, note: str, width: int, canvas: bool) -> str:
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
        f'<figcaption style="display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 600; font-size: 15px">{title}</span>'
        f'<span style="font-size: 13px; color: {TEXT_2}">{note}</span></figcaption>'
        f'<img src="{src(f"cut-{size}-{key}.png", canvas)}" alt="{title}, {size}" style="display: block; width: {width}px; border: 1px solid {LINE}; border-radius: 12px"></figure>'
    )


def board(file: str, size: str, title: str, width: int, shot: int, row: bool, height: int, canvas: bool) -> None:
    ways = "".join(way(size, key, name, note, shot, canvas) for key, name, note in WAYS)
    layout = "flex-direction: row; gap: 40px" if row else "flex-direction: column; gap: 32px"
    pad = "40px 56px" if row else "40px 0"
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 32px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'Section headings, three ways</h1><p style="margin: 0; max-width: 900px; color: {TEXT_2}">The headings of the input panels in the '
        f'primary action\'s orange at weight 600. No line under them; which shadow: none, a dark one, or a soft glow of their orange. '
        f'The Strings lens as the app draws it, {size}.</p></div>'
        f'<div style="display: flex; {layout}">{ways}</div></div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("SectionHeadings.dc.html", "desktop", "UI fixes · Section headings, three ways · desktop 1440", 1552, 382, True, 900, canvas)
    board("SectionHeadingsTablet.dc.html", "tablet", "UI fixes · Section headings, three ways · tablet 834", 834, 834, False, 1880, canvas)
    board("SectionHeadingsPhone.dc.html", "phone", "UI fixes · Section headings, three ways · phone 390", 390, 390, False, 1180, canvas)
