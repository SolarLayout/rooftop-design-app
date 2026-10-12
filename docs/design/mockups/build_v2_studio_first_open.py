"""The boards "V2 · 3 · The Studio's first open" on desktop 1440, tablet 834 and phone 390.

What a new user meets once Build this roof is pressed (plan/v2/audit.md: V2-01, V2-25, V2-26, V2-31, V2-32, V2-64 to V2-66,
V2-118). Today: six open sections, seven figures over the roof, the time on the stage, nothing that says what happened or
what to do. V2: the work column in three weights (the step's instruction with its status and its primary; the sections as
one line of facts that opens; the fields inside), what the app set told apart from what the user set, the result as one
figure that opens the summary, no time on the stage outside Sun. Drawn with build_v2_parts.py and the Pune demo's numbers.
Usage: python3 -I build_v2_studio_first_open.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, CHROME, CONTROL_ACTIVE, EXPLAIN, ICON, LINE, LINE_STRONG, LINE_SUBTLE, OK, RADIUS, SHADOW_FLOAT, SURFACE_1,
    SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, board_head, button, changes, explained, field, frame, icon, mark, ring,
    roof_svg, segmented, style, summary_row, tab_bar, text, top_bar, write_board,
)
from build_v2_progression import view_controls  # noqa: E402

ISSUES = "Answers V2-01 · V2-25 · V2-26 · V2-31 · V2-32 · V2-64 · V2-65 · V2-66 · V2-118"
LINES = [
    "After Build this roof the Studio opens on the Roof step and says what happened: the array is on the roof, the "
    "energy is on its way. Then one instruction, Check the roof, and one primary, Continue to Array.",
    "The work column has three weights. First the step: its instruction, its status, its primary at the foot. Then the "
    "facts: each section one line that opens. Then the details: the fields, inside a section the user opens. The "
    "column remembers what was opened.",
    "What the app set is told apart from what the user set: each section and each field says Default, From the "
    "weather, Set for India, or Yours. A new user sees what to check, not 40 settings.",
    "The result is one figure, the energy of year 1, at the top bar's right on desktop and phone, in a row under the "
    "stage on tablet. It opens the summary. The time leaves the stage: it belongs to Sun.",
]
FIRST = {}  # a new design: the Roof step, nothing done yet


def status(computing: bool, touch: bool) -> str:
    """What happened, first open only: the array on the roof, the energy on its way or in."""
    energy = ((ring(18), "Computing the energy", "Shading every module over the year. A few seconds.") if computing
              else (mark("fits", 18), "617.8 MWh in year 1", "The energy follows each change you make."))
    row = lambda m, a, b: (f'<div style="display: flex; gap: 12px; align-items: flex-start">'
                           f'<span style="padding-top: 1px; display: inline-flex">{m}</span><div style="display: flex; flex-direction: column; gap: 2px">'
                           f'{text("strong", a, touch)}{text("body", b, touch, TEXT_2)}</div></div>')
    return (f'<div style="display: flex; flex-direction: column; gap: 16px; padding: 16px; background: {SURFACE_1}; '
            f'border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px">'
            + row(mark("fits", 18), "The array is on the roof", "638 modules · 357.28 kWp")
            + row(*energy) + '</div>')


def tagged(name: str, facts: str, tag: str, touch: bool, open_: bool = False) -> str:
    return summary_row(name, facts, touch, open_, tag)


def roof_sections(touch: bool, open_edges: bool) -> str:
    rows = tagged("Roof type", "Flat · rows facing south", "Yours", touch)
    if open_edges:
        rows += (tagged("Edges and access", "Parapet 0.9 m · margin 1.0 m", "Default", touch, True)
                 + f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 0 0 24px">'
                 + field("Parapet height", "1.20", "m", "Yours · default 0.90 m · Reset", touch, 112)
                 + field("Edge margin (setback)", "1.00", "m", "Default · usually 0.5 to 1.5 m", touch, 112)
                 + field("Walkway width", "0.60", "m", "Default", touch, 112)
                 + field("Walkway every", "24", "modules", "Default", touch, 132)
                 + field("Clearance round obstacles", "0.50", "m", "Default", touch, 112) + '</div>')
    else:
        rows += tagged("Edges and access", "Parapet 0.9 m · margin 1.0 m", "Default", touch)
    rows += (tagged("Obstacles · 6", "Stair room, water tank, 4 AC units", "Yours", touch)
             + tagged("Location", "Pune · 18.52° N, 73.86° E", "", touch))
    return f'<div>{rows}</div>'


def column_body(computing: bool, open_edges: bool, touch: bool) -> str:
    head = (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Check the roof", touch, TEXT, "h2")}'
            f'{text("body", "Built from your outline. The app set the edges: check the parapet, it shades the first row.", touch, TEXT_2, "p")}</div>')
    parts = [head]
    if not open_edges:
        parts.append(status(computing, touch))
    parts.append(roof_sections(touch, open_edges))
    return "".join(parts)


def column_foot(touch: bool) -> str:
    arrow = icon(ICON["arrow-right"], 18, "#1A1204")
    nxt = "Next: Array, " + EXPLAIN["Array"][0].lower() + EXPLAIN["Array"][1:] + "."
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">'
            f'{button("Continue to Array " + arrow, "primary", "primary", touch, full=True)}{text("body", nxt, touch, TEXT_2)}</div>')


def stage(width: int, height: int, touch: bool, top: int, roof_w: int, roof_left: int, roof_top: int, title_facts: str) -> str:
    controls = view_controls(touch) if width > 500 else button("Sun", "secondary", "compact", True)
    return (f'<div style="position: absolute; left: 0; top: {top}px; width: {width}px; height: {height}px; overflow: hidden">'
            f'<div style="position: absolute; left: {40 if width > 1000 else 16 if width < 500 else 20}px; top: {32 if width > 1000 else 16}px; '
            f'display: flex; flex-direction: column; gap: 4px">{text("title", "Roof", touch)}'
            f'{text("body", title_facts, touch, TEXT_2) if title_facts else ""}</div>'
            f'<div style="position: absolute; right: {24 if width > 1000 else 16}px; top: {32 if width > 1000 else 16}px">{controls}</div>'
            f'<div style="position: absolute; left: {roof_left}px; top: {roof_top}px">{roof_svg(roof_w, label="3D view of the Pune demo roof with its array")}</div></div>')


def desktop_screen(computing: bool, open_edges: bool, summary_open: bool = False) -> str:
    bar = top_bar(FIRST, "Roof", 1440, result="" if computing else "617.8", open_=summary_open)
    st = stage(1056, 844, False, 56, 960, 48, 190, "3,600 m² · 6 obstacles · 90.0 × 40.0 m")
    col = (f'<aside style="position: absolute; right: 0; top: 56px; width: 384px; height: 844px; background: {CHROME}; '
           f'border-left: 1px solid {LINE_SUBTLE}; display: flex; flex-direction: column; box-sizing: border-box">'
           f'<div style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 24px; overflow: hidden">{column_body(computing, open_edges, False)}</div>'
           f'<div style="padding: 24px; border-top: 1px solid {LINE_SUBTLE}">{column_foot(False)}</div></aside>')
    pop = summary_popover(False) if summary_open else ""
    return bar + st + col + (f'<div style="position: absolute; right: 96px; top: 52px">{pop}</div>' if pop else "")


SUMMARY = [
    ("Energy in year 1", "617.8", "MWh", ""), ("Modules", "638", "of 790 positions", ""),
    ("DC capacity", "357.28", "kWp", ""), ("AC capacity", "275", "kW", ""),
    ("DC/AC ratio", "1.30", "", "fits"), ("Performance ratio (PR)", "86.6", "%", ""), ("Yield", "1,729", "kWh/kWp", ""),
]


def summary_popover(touch: bool) -> str:
    rows = "".join(f'<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 8px 0; '
                   f'border-top: {"0" if i == 0 else "1px solid " + LINE_SUBTLE}">{text("body", a, touch, TEXT_2)}'
                   f'<span style="display: inline-flex; align-items: baseline; gap: 4px">{text("strong", b, touch)}'
                   f'{text("unit", c, False, TEXT_2) if c else ""}{mark("fits", 14) if m else ""}</span></div>'
                   for i, (a, b, c, m) in enumerate(SUMMARY))
    return (f'<div role="dialog" aria-label="Summary" style="width: 320px; padding: 16px; box-sizing: border-box; background: {SURFACE_1}; '
            f'border: 1px solid {LINE_STRONG}; border-radius: {RADIUS["card"]}px; box-shadow: {SHADOW_FLOAT}; display: flex; flex-direction: column; gap: 8px">'
            f'{text("section", "Summary · option A", touch)}<div>{rows}</div>'
            f'<a href="#" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none; {style("strong", touch)}">'
            f'Open Performance {icon(ICON["arrow-right"], 14, TEXT_2)}</a></div>')


def weights(touch: bool) -> str:
    def w(n: str, name: str, what: str, sample: str) -> str:
        return (f'<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: {SURFACE_1}; border: 1px solid {LINE}; '
                f'border-radius: {RADIUS["card"]}px; min-width: 0">{text("unit", n, False, TEXT_3)}{text("section", name, touch)}'
                f'{text("body", what, touch, TEXT_2, "p")}<div style="margin-top: 4px">{sample}</div></div>')
    a = text("heading", "Check the roof", touch)
    b = tagged("Edges and access", "Parapet 0.9 m · edge margin 1.0 m", "Default", touch)
    c = field("Parapet height", "1.20", "m", "Yours · default 0.90 m · Reset", touch, 112)
    cols = "1fr" if touch else "repeat(3, minmax(0, 1fr))"
    return (f'<section style="display: flex; flex-direction: column; gap: 16px">{text("heading", "Three weights in the work column", touch, TEXT, "h2")}'
            f'<div style="display: grid; grid-template-columns: {cols}; gap: 16px">'
            + w("1", "The step", "Its instruction at the head, its status, its primary at the foot. Always open.", a)
            + w("2", "The facts", "Each section one line of facts that opens, with who set it at the right.", b)
            + w("3", "The details", "The fields, in a section the user opens. The column remembers it.", c) + '</div></section>')


def sources(touch: bool) -> str:
    items = [("Default", "The app's value. Fine for most roofs; change it if you know the site."),
             ("From the weather", "Read from the site's weather, as the sizing temperatures are."),
             ("Set for India", "The value of the user's country, as the system voltage is (D87)."),
             ("Yours", "Typed or chosen by the user. Reset brings the default back.")]
    rows = "".join(f'<div style="display: flex; gap: 16px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}; flex-wrap: wrap">'
                   f'<span style="width: 140px; flex: none">{text("unit", a, False, TEXT_3 if a != "Yours" else TEXT)}</span>'
                   f'{text("body", b, touch, TEXT_2, "span", "flex: 1; min-width: 200px")}</div>' for a, b in items)
    return (f'<section style="display: flex; flex-direction: column; gap: 8px">{text("heading", "Who set it", touch, TEXT, "h2")}'
            f'{text("body", "The same four words at the right of a section and in a field\'s hint, on every step.", touch, TEXT_2, "p")}<div>{rows}</div></section>')


CHANGES = [
    ("information-architecture.md · Flow for a new design", "The Studio opens on the Roof lens; nothing says what happened",
     "It opens on the Roof step with what happened, one instruction and one primary", "V2-01"),
    ("components.md · Vitals bar", "Seven figures and the notes in a bar over the stage, on every lens",
     "One figure, the energy of year 1, with what waits for review; it opens the summary", "V2-31, V2-66"),
    ("components.md · Inspector sections", "Every section open, every field shown",
     "A line of facts that opens; the step's sections open the first time; remembered", "V2-25, V2-64"),
    ("components.md · System voltage, Sizing (the source words)", "Set for India and From the weather on two sections alone",
     "Default, From the weather, Set for <country>, Yours on every section and field; Reset", "V2-26"),
    ("components.md · Time pill (every lens)", "On the stage of every lens",
     "On Sun alone; the other steps show the design day's noon, still", "V2-32"),
    ("information-architecture.md · Studio on tablet and phone", "Stage 508 and a vitals grid on tablet; stage 252 on phone",
     "Tablet: stage 440 and the result as a row under it. Phone: stage 40 % of the height, the result in the top bar", "V2-118, V2-80"),
]


def build_desktop() -> None:
    w = 1440
    head = board_head("V2 · 3 · The Studio's first open", LINES, False, ISSUES)
    screens = (frame("1 · Seconds after Build this roof: what happened, the energy on its way, one instruction, one primary",
                     desktop_screen(True, False), w, 900)
               + frame("2 · Edges and access opened: the fields, each with who set it; the parapet typed by the user",
                       desktop_screen(False, True), w, 900)
               + frame("3 · The result opened: the summary, in plain names, and the way to Performance",
                       desktop_screen(False, False, True), w, 900))
    body = (f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{head}{weights(False)}{sources(False)}'
            f'{screens}{changes(CHANGES)}</div>')
    write_board(OUT, "V2FirstOpen.dc.html", "V2 · 3 · The Studio's first open · desktop 1440", 1520, 4300, body)


def tablet_screen() -> str:
    bar = top_bar(FIRST, "Roof", 834, "tablet")
    st = stage(834, 440, True, 60, 740, 40, 96, "3,600 m² · 6 obstacles")
    result = (f'<div style="position: absolute; left: 0; top: 500px; width: 834px; height: 56px; padding: 0 20px; box-sizing: border-box; '
              f'display: flex; align-items: center; gap: 12px; background: {SURFACE_1}; border-top: 1px solid {LINE_SUBTLE}; '
              f'border-bottom: 1px solid {LINE_SUBTLE}">{ring(16)}{text("body", "Computing the energy", True, TEXT_2)}'
              f'<span style="margin-left: auto">{text("body", "638 modules · 357.28 kWp", True, TEXT_2)}</span></div>')
    col = (f'<div style="position: absolute; left: 0; top: 556px; width: 834px; height: 538px; background: {CHROME}; '
           f'padding: 24px 20px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; overflow: hidden">'
           f'{column_body(True, False, True)}</div>')
    arrow = icon(ICON["arrow-right"], 18, "#1A1204")
    foot = (f'<div style="position: absolute; left: 0; bottom: 0; width: 834px; height: 100px; background: {CHROME}; '
            f'border-top: 1px solid {LINE_SUBTLE}; padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; '
            f'justify-content: space-between; gap: 16px">{text("body", "Next: Array, the modules on the roof.", True, TEXT_2)}'
            f'{button("Continue to Array " + arrow, "primary", "primary", True)}</div>')
    return bar + st + result + col + foot


def build_tablet() -> None:
    w = 834
    head = board_head("V2 · 3 · The Studio's first open", LINES, True, ISSUES)
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px">'
            f'<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 40px">{head}{weights(True)}{sources(True)}</div>'
            f'{frame("Seconds after Build: the result as a row under the stage; the step in the column; the primary at the foot", tablet_screen(), w, 1194)}'
            f'<div style="padding: 0 20px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, "V2FirstOpenTablet.dc.html", "V2 · 3 · The Studio's first open · tablet 834", 834, 3420, body)


def phone_screen(summary_open: bool = False) -> str:
    bar = top_bar(FIRST, "Roof", 390, "phone", result="617.8" if summary_open else "")
    st = stage(390, 340, True, 56, 390, 0, 110, "")
    arrow = icon(ICON["arrow-right"], 18, "#1A1204")
    sheet = (f'<div style="position: absolute; left: 0; top: 380px; width: 390px; height: 392px; background: {CHROME}; '
             f'border-top: 1px solid {LINE}; border-radius: 24px 24px 0 0; box-sizing: border-box; display: flex; flex-direction: column">'
             f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}; margin: 8px 0 4px"></span>'
             f'<div style="flex: 1; padding: 12px 16px 0; display: flex; flex-direction: column; gap: 16px; overflow: hidden">'
             f'{column_body(True, False, True)}</div>'
             f'<div style="padding: 12px 16px 16px; border-top: 1px solid {LINE_SUBTLE}">{button("Continue to Array " + arrow, "primary", "primary", True, full=True)}</div></div>')
    out = bar + st + sheet + f'<div style="position: absolute; left: 0; bottom: 0; width: 390px">{tab_bar(FIRST, "Roof")}</div>'
    if summary_open:
        out += (f'<div style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; background: rgba(5,7,10,.72)"></div>'
                f'<div style="position: absolute; left: 0; bottom: 0; width: 390px; background: {CHROME}; border-radius: 24px 24px 0 0; '
                f'border-top: 1px solid {LINE}; padding: 12px 16px 32px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px">'
                f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></span>'
                f'{summary_popover(True).replace("width: 320px", "width: 100%").replace(SHADOW_FLOAT, "none").replace("border: 1px solid " + LINE_STRONG, "border: 0")}</div>')
    return out


def build_phone() -> None:
    w = 390
    head = board_head("V2 · 3 · The Studio's first open", LINES, True, ISSUES)
    screens = (frame("Seconds after Build: the stage 40 % of the height, the step in the sheet, the result computing in the top bar",
                     phone_screen(), w, 844)
               + frame("The result pressed: the summary in a sheet", phone_screen(True), w, 844))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px">'
            f'<div style="padding: 0 16px; display: flex; flex-direction: column; gap: 40px">{head}{weights(True)}{sources(True)}</div>'
            f'{screens}<div style="padding: 0 16px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, "V2FirstOpenPhone.dc.html", "V2 · 3 · The Studio's first open · phone 390", 390, 4790, body)


if __name__ == "__main__":
    build_desktop()
    build_tablet()
    build_phone()
