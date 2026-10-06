"""The boards "UI fixes · The state of saving, a mark before the name" on desktop 1440, tablet 834 and phone 390.

The owner (session 18): the words of the state of saving changed width in the top bar and moved what stood beside
them; the words are of no use there; the light is good, before the name. Each top bar of the approved boards (Main,
StudioTablet, StudioPhone) in each of the four states: the words gone from the desktop's bar, and on every size a
slot of 12 before the design's name in the project switcher, holding the state's mark. Written beside this script:
SaveStateMark.dc.html, SaveStateMarkTablet.dc.html, SaveStateMarkPhone.dc.html.
Usage: python3 -I build_ui_fixes_save_state.py
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import ACCENT, GROUND, LINE, TEXT, TEXT_2, TEXT_3, note, ring  # noqa: E402

OK = "#3DD6A0"
SURFACE_1 = "#12161D"
DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"

STATES = [
    ("saved", "Saved on this device", "The dot of 7 in color-ok, pulsing"),
    ("saving", "Saving", "A ring of 12, turning, 600 ms after the last edit"),
    ("not_kept", "Not kept on this device", "The demo, until it is edited: a hollow dot"),
    ("not_saved", "Not saved", "Could not be saved: the note's exclamation; the switcher says why and opens the notes"),
]


def mark(kind: str) -> str:
    """The mark in its slot of 12: whatever the state, the name after it stands where it stood."""
    inner = {
        "saved": f'<span style="width: 7px; height: 7px; border-radius: 50%; background: {OK}; animation: live 2.4s ease-in-out infinite"></span>',
        "saving": ring(12, 1.5),
        "not_kept": f'<span style="width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {TEXT_3}"></span>',
        "not_saved": note(12),
    }[kind]
    return f'<span aria-hidden="true" style="width: 12px; height: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center">{inner}</span>'


def header_of(board: str) -> str:
    s = (HERE / board).read_text(encoding="utf-8")
    return s[s.index("<header"): s.index("</header>") + len("</header>")]


def piece(text: str, start: str, end: str) -> str:
    i = text.index(start)
    return text[i: text.index(end, i) + len(end)]


def desktop_bar(kind: str, words: str, tip: bool) -> str:
    header = header_of("Main.dc.html")
    # The words at the right go; the mark goes before the name, in the switcher's button.
    header = header.replace(piece(header, '<div style="display: flex; align-items: center; gap: 8px; color: #A9B2C0; font-size: 13px">', "Saved on this device</div>"), "")
    name = '<span style="font-weight: 500">Pune demo roof</span>'
    tooltip = (
        f'<span role="tooltip" style="position: absolute; left: 0; top: 46px; padding: 6px 10px; background: {SURFACE_1}; border: 1px solid {LINE}; '
        f'border-radius: 8px; font-size: 12px; color: {TEXT}; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)">{words}</span>'
        if tip else ""
    )
    header = header.replace(name, f'<span style="position: relative; display: flex; align-items: center; gap: 8px">{mark(kind)}{name}{tooltip}</span>', 1)
    return f'<div style="width: 1440px; overflow: visible; border: 1px solid {LINE}; border-radius: 12px">{header}</div>'


def touch_bar(board: str, width: int, kind: str) -> str:
    header = header_of(board)
    header = header.replace("cursor: pointer\">Pune demo roof<svg", f"cursor: pointer\">{mark(kind)}Pune demo roof<svg", 1)
    return f'<div style="width: {width}px; box-sizing: border-box; overflow: hidden; border: 1px solid {LINE}; border-radius: 12px; background: {GROUND}">{header}</div>'


def row(caption: str, bar: str) -> str:
    return f'<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 13px; color: {TEXT_2}">{caption}</span>{bar}</div>'


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
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
body{{margin:0;font-family:Geist,system-ui,sans-serif;background:#0B0E13;color:#F2F4F7}}
a{{color:#A9B2C0;text-decoration:none}}a:hover{{color:#F2F4F7}}
button,input{{font:inherit;color:inherit}}
@keyframes live{{0%,100%{{box-shadow:0 0 0 0 rgba(61,214,160,.5)}}50%{{box-shadow:0 0 0 5px rgba(61,214,160,0)}}}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important}}}}
</style>
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


def board(file: str, title: str, width: int, pad: int, intro: str, rows: str, height: int) -> None:
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px; padding: 40px {pad}px; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'The state of saving, a mark before the name</h1><p style="margin: 0; max-width: 900px; color: {TEXT_2}">{intro}</p></div>{rows}</div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


INTRO = (
    "The words of the state of saving leave the top bar: they changed width as the state changed and moved what stood beside "
    "them. Its mark stays, in a slot of 12 before the design's name in the project switcher, on every size, so that "
    "nothing moves when the state changes. The words are the mark's name (its tooltip on desktop, what a screen reader says), "
    "and the switcher's menu keeps them under the name, as today, with Not saved opening the notes. {size}"
)

if __name__ == "__main__":
    desktop_rows = "".join(row(f"{caption}" + (" · its tooltip, under the pointer or the focus" if kind == "saved" else ""), desktop_bar(kind, words, kind == "saved"))
                           for kind, words, caption in STATES)
    board("SaveStateMark.dc.html", "UI fixes · The state of saving, a mark before the name · desktop 1440", 1552, 56,
          INTRO.format(size="Desktop 1440: the bar of the Studio in the four states."), desktop_rows, 720)
    tablet_rows = "".join(row(caption, touch_bar("StudioTablet.dc.html", 834, kind)) for kind, _, caption in STATES)
    board("SaveStateMarkTablet.dc.html", "UI fixes · The state of saving, a mark before the name · tablet 834", 834, 0,
          INTRO.format(size="Tablet 834: the words were in the switcher alone; the mark is added before the name."), tablet_rows, 760)
    phone_rows = "".join(row(caption, touch_bar("StudioPhone.dc.html", 390, kind)) for kind, _, caption in STATES)
    board("SaveStateMarkPhone.dc.html", "UI fixes · The state of saving, a mark before the name · phone 390", 390, 0,
          INTRO.format(size="Phone 390: as on tablet."), phone_rows, 880)
