"""The boards "System voltage · Set by the user's country" on desktop 1440, tablet 834 and phone 390 (Phase 16, D87).

The owner (session 22): the voltage had no default and every new design waited for a choice, "a constant cause of friction
for the user". Now a new design gets 600 V in the United States and Canada, 1000 V elsewhere (India when the country cannot
be found); the user can change it. The equipment never moves the voltage (D88): the strings are sized to the lower rating; for the
app's value a plain line says so, for the user's an exclamation mark and a one-press way to match. The app never raises
the voltage by itself. The third state was first drawn as the app's value lowered to a class; replaced by D88 and taken
again from the build (#155). Each board is the app caught in the browser with a prototype on the local branch
`design/system-voltage`, never merged (system_voltage/); the canvas's copies show the same images uploaded to it (--canvas).
Usage: python3 -I build_system_voltage.py [--canvas]
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
# The images' addresses on the canvas, from the upload of system_voltage/ to its asset store (system_voltage/canvas.json).
CANVAS_FILE = HERE / "system_voltage" / "canvas.json"

INTRO = (
    "Today a new design waits for a system voltage: the Strings lens opens on a decision card and nothing is sized until "
    "one is chosen. Proposed (D87): a new design starts with the voltage of the user's country, 600 V in the United States "
    "and Canada (the limit for homes: NEC 690.7, CE Code Section 64), 1000 V everywhere else, and India when the country "
    "cannot be found. The first run brings strings, options and energy. The choice stays the user's: the same three, one "
    "press away. Shown on the Pune demo with the country given to the prototype."
)

SPEC = [
    ("Where it comes from", "Beside the heading, “Set for India” (the app) or “Your choice” (the user). Under the choice, one "
     "line: “1000 V, the usual limit for rooftops in India. Change it if the site needs another.”; in the United States "
     "“600 V, the limit for homes in the United States (NEC 690.7). Change it if the site allows more.”"),
    ("The country", "From the request (Vercel's country), else the browser's time zone, else India. Nothing is asked and "
     "nothing is kept but the voltage and who set it."),
    ("Set by the app, equipment rated under it (D88)", "The value is kept; the strings are sized to the rating, and a plain "
     "line says so: “Strings sized to 800 V, this inverter's limit.” With an inverter of 800 V, 15 in series fit where "
     "lowering the value to 600 V would have allowed 11."),
    ("Your choice, equipment rated under it", "Never moved. A note with the exclamation mark: “Strings sized to 1100 V, this "
     "inverter's limit. Your system is set to 1500 V.” and Use 1000 V, an edit like any other, undone in one step."),
    ("Equipment rated over it", "Never raised by the app, whoever set it: the value may be the legal ceiling of the place. "
     "One line and a button: “This inverter takes up to 1500 V. Raise it only if the site's code allows.” Use 1500 V. "
     "Where no string length fits, the line says the lowest voltage at which one would (the United States board)."),
    ("The picker", "An inverter rated under the voltage set carries the exclamation mark and its reason under its maker: "
     "“Up to 800 V: strings sized under the 1000 V set”. Nothing is hidden; the rest carry nothing."),
    ("What leaves a new design", "The decision card “Choose a system voltage”, the list of what waits for it, and the vitals' "
     "waiting state. A project without a voltage (a call to the API) still waits and says so; a design of before gets the "
     "default when it is opened."),
    ("Help", "The topic “System voltage” says how the default is set, with the references, and drops “Nothing is chosen for you”."),
]

SHOTS = {
    "desktop": [
        ("desktop-1-india.jpg", "India: 1000 V, set by the app; the demo's inverter takes 1500 V, offered"),
        ("desktop-2-us.jpg", "The United States: 600 V; no string length fits the demo's inverter under it, 1000 V offered"),
        ("desktop-5-picker.jpg", "The picker at 1000 V: the inverters rated 800 V marked"),
        ("desktop-3-sized.jpg", "An inverter of 800 V chosen: the app's 1000 V kept, the strings sized to 800 V (D88)"),
        ("desktop-4-yours.jpg", "Your 1500 V, then an inverter of 1100 V: never moved; the note and Use 1000 V"),
    ],
    "tablet": [
        ("tablet-1-india.jpg", "India: 1000 V, set by the app, 1500 V offered"),
        ("tablet-2-us.jpg", "The United States: 600 V, 1000 V offered"),
        ("tablet-5-picker.jpg", "The picker: the inverters rated under the voltage marked"),
        ("tablet-3-sized.jpg", "An inverter of 800 V: the app's 1000 V kept, sized to 800 V"),
        ("tablet-4-yours.jpg", "Your 1500 V, an inverter of 1100 V: the note"),
    ],
    "phone": [
        ("phone-1-india.jpg", "India: 1000 V, set by the app"),
        ("phone-2-us.jpg", "The United States: 600 V, 1000 V offered"),
        ("phone-5-picker.jpg", "The picker: rated under, marked"),
        ("phone-3-sized.jpg", "An inverter of 800 V: sized to 800 V"),
        ("phone-4-yours.jpg", "Your 1500 V, an inverter of 1100 V: the note"),
    ],
}


def image(name: str, canvas: dict[str, str] | None) -> str:
    return canvas[name] if canvas else f"system_voltage/{name}"


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


def board(file: str, size: str, title: str, width: int, shotw: int, per_row: int, pad: int, columns: int, height: int, canvas: dict[str, str] | None) -> None:
    shots = "".join(shot(name, caption, shotw, canvas) for name, caption in SHOTS[size])
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 28px; padding: 40px {pad}px; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f"System voltage: set by the user's country</h1><p style=\"margin: 0; max-width: 960px; color: {TEXT_2}\">{INTRO}</p>"
        f'<p style="margin: 0; font-size: 12px; color: {TEXT_3}">The app caught in the browser, with a prototype of the Strings lens, approved on 2026-10-08; the third state from the build.</p></div>'
        f"{spec(columns)}"
        f'<div style="display: grid; grid-template-columns: repeat({per_row}, {shotw}px); gap: 28px 32px; align-items: start">{shots}</div></div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = json.loads(CANVAS_FILE.read_text(encoding="utf-8")) if "--canvas" in sys.argv else None
    board("SystemVoltage.dc.html", "desktop", "System voltage · Set by the user's country · desktop 1440", 1552, 1440, 1, 56, 2, 5480, canvas)
    board("SystemVoltageTablet.dc.html", "tablet", "System voltage · Set by the user's country · tablet 834", 834, 369, 2, 24, 1, 2740, canvas)
    board("SystemVoltagePhone.dc.html", "phone", "System voltage · Set by the user's country · phone 390", 390, 342, 1, 24, 1, 5660, canvas)
