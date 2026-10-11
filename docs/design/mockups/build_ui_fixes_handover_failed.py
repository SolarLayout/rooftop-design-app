"""The boards "UI fixes · Handover after a first run that failed" on desktop 1440, tablet 834 and phone 390.

Issue 179, after item 25 (#205): once a design's first run fails, Handover's previews show the note "The files were not
made" alone, but the rows' facts keep their loading bars as if the run were on its way, and on phone the list shows no
note and no Try again at all. Proposed: each row that waits, and the preview's head, say "Not made · the run failed",
the download icon dim as before options; on phone the note with Try again stands under the list's head. Each board is
Handover caught in the browser with the demo's run answered 503 (handover_failed/): today and as proposed. The proposal
was drawn by the app itself from a prototype on the local branch `design/handover-first-run-failed`, never merged. The
canvas's copies show the same images uploaded to it (--canvas), written into the folder given after it.
Usage: python3 -I build_ui_fixes_handover_failed.py [--canvas <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_phase3_boards import GROUND, LINE, TEXT, TEXT_2  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
# The uploads of handover_failed/ to the canvas, by file name.
CANVAS = {
    "desktop-1.png": "/_blob/e82c59ad6b779f2981bb281ecbc545c7", "desktop-2.png": "/_blob/73856f039e7dc354bfaea30e4ab9129b",
    "tablet-1.png": "/_blob/24b0991d742072e73bfc50d2decba927", "tablet-2.png": "/_blob/8bb006f02f6e2657469b93f7d1a399a1",
    "phone-1.png": "/_blob/da73e531a8b29d2239680a11199eb7cc", "phone-2.png": "/_blob/9e0bde4b36a948d63d42c7cf79581cd1",
    "phone-3.png": "/_blob/4ab931b8cc6814d637c36890188961c0",
}
STATES = {
    "desktop": ("Today: the rows' facts keep their loading bars", "Proposed: each row says Not made · the run failed"),
    "tablet": ("Today: the rows' facts keep their loading bars", "Proposed: each row says Not made · the run failed"),
    "phone": (
        "Today: the list, no note, no Try again, the loading bars",
        "Proposed: the note with Try again under the head; each row says why",
        "Proposed: an item, its head saying why, the note alone",
    ),
}
WORDS = (
    "When a design's first run fails, Handover has no files to show. Its previews now show the note \u201cThe files were "
    "not made \u00b7 There are no files yet \u00b7 Try again\u201d alone (#205), but each row's facts still breathe as if "
    "the run were on its way, and on phone, where the list is the whole page, there is no note and no Try again. "
    "Proposed, as before options, where each row carries the API's title: each row that waits says \u201cNot made "
    "\u00b7 the run failed\u201d, its download icon dim; the preview's head says the same. On phone the note with Try again "
    "stands under the list's head, as it stands under the head of an item."
)
WHEN = (
    "When: the run failed and there is no design of before. A run that fails after one that worked keeps the files of "
    "before and their facts, as today. The project file is never waiting: it keeps its own facts."
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
    src = CANVAS[name] if canvas else f"handover_failed/{name}"
    words = STATES[size][at - 1]
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
        f'<figcaption style="padding: {inset}; color: {TEXT_2}">{at} \u00b7 {words}</figcaption>'
        f'<img src="{src}" alt="{words}, {size}" style="display: block; width: {width}px; border: 1px solid {LINE}; '
        f'border-radius: 12px; box-sizing: border-box"></figure>'
    )


def board(file: str, size: str, title: str, width: int, pad: str, words: str, columns: int, shot: int, gap: int,
          height: int, canvas: bool, note: str) -> None:
    states = "".join(state(size, at, shot, canvas, words) for at in range(1, len(STATES[size]) + 1))
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: {words}"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'Handover after a first run that failed</h1><p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WORDS}</p>'
        f'<p style="margin: 0; max-width: 960px; color: {TEXT_2}">{WHEN} {note}</p></div>'
        f'<div style="display: grid; grid-template-columns: repeat({columns}, {shot}px); gap: {gap}px">{states}</div></div>\n'
    )
    (OUT / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("HandoverFailed.dc.html", "desktop", "UI fixes \u00b7 Handover after a first run that failed \u00b7 desktop 1440", 1552,
          "40px 56px", "0", 2, 708, 24, 820, canvas, "Desktop: the list beside the first item.")
    board("HandoverFailedTablet.dc.html", "tablet", "UI fixes \u00b7 Handover after a first run that failed \u00b7 tablet 834", 834,
          "40px 16px", "0", 2, 391, 20, 920, canvas, "Tablet: the list beside the first item.")
    board("HandoverFailedPhone.dc.html", "phone", "UI fixes \u00b7 Handover after a first run that failed \u00b7 phone 390", 390,
          "40px 0", "0 16px", 1, 390, 24, 3280, canvas, "Phone: the list, then an item pushed over it.")
