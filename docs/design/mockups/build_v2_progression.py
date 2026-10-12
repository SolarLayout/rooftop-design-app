"""The boards "V2 · 2 · The progression" on desktop 1440, tablet 834 and phone 390.

One order of work, Find to Handover, shown as one row of five steps (Roof, Array, Strings, Performance, Handover) in place of
the switch of workspaces and the rail of lenses; each step with its state and one primary action that leads to the next; Sun a
view of the stage, not a step; Export and Present out of the top bar (plan/v2/audit.md: V2-55 to V2-58, V2-104, V2-105).
Drawn with the V2 numbers of build_v2_parts.py and the Pune demo's figures; the roof is the approved boards' drawing.
Usage: python3 -I build_v2_progression.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    section_title,
    work_column, hide_button,
    EXPLAIN, explained, tooltip,
    CHROME, CONTROL, ICON, LINE, LINE_STRONG, LINE_SUBTLE, RADIUS, SHADOW_RAISED, STEP_ICON, SURFACE_1, SURFACE_2,
    TEXT, TEXT_2, TEXT_3, WELL, board_head, button, changes, frame, icon, progression, roof_svg, segmented, step_mark,
    style, summary_row, tab_bar, text, top_bar, write_board,
)

ISSUES = "Answers V2-55 · V2-56 · V2-57 · V2-58 · V2-104 · V2-105"
LINES = [
    "One order of work, Roof to Handover, shown as one row of five steps. It takes the place of the switch of "
    "workspaces and the rail of lenses. Each step shows its state: done, needs you, or still to do. Every step stays a "
    "link: the row shows the order, it does not lock it.",
    "Each step has one primary action, where the eye ends its path: at the foot of the work column on Find and in the "
    "Studio, at the head of the page on Performance and Handover. It leads to the next step. Export leaves the top bar: "
    "Download all is Handover's primary. Present moves to the head of Performance and Handover.",
    "The design's result has one place on desktop: the energy of year 1 at the top bar's right, with what waits for "
    "review. The vitals bar over the roof goes (board 3 draws the result on tablet and phone). "
    "On desktop the work column can be hidden, to give the roof or the map the whole width: Hide panel at its head, "
    "⌘ \\ from anywhere. The primary stays, at the stage's foot, and the result stays in the top bar. The column is open "
    "at a design's first open, comes back when a step needs the user or an object is selected, and is remembered. "
    "Sun is a view of the stage, on every step, not a step between Array and Strings. Find is the first part of Roof: "
    "there is no roof to check before it is outlined.",
]
ORDER = [
    ("Roof", "Find the roof", "Search, outline the roof, add its obstacles", "Build this roof"),
    ("Roof", "Check the roof", "Its edges, its access and its obstacles", "Continue to Array"),
    ("Array", "Choose the module", "The module, how it is mounted, how rows are spaced", "Continue to Strings"),
    ("Strings", "Check the strings", "The inverter, the voltage, the option to use", "Continue to Performance"),
    ("Performance", "Review the energy", "The energy, where it goes, the weather", "Continue to Handover"),
    ("Handover", "Download the files", "Report, drawings, tables and the project file", "Download all"),
]
DONE_TO_ARRAY = {"Roof": "done"}
STATES = [
    ("A new design on Find: the first step is where the user is", {}, "Roof"),
    ("The roof checked, the array in hand", {"Roof": "done"}, "Array"),
    ("A step that needs the user: no string length fits", {"Roof": "done", "Array": "done", "Strings": "needs"}, "Strings"),
    ("All done, the files in hand", {"Roof": "done", "Array": "done", "Strings": "done", "Performance": "done"}, "Handover"),
]


def order_strip(touch: bool, columns: int) -> str:
    cards = ""
    for i, (step, heading, what, primary) in enumerate(ORDER):
        n = min(i, 5) if i else 1
        sub = "Find" if i == 0 else step
        cards += (f'<div style="background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; padding: 16px; '
                  f'display: flex; flex-direction: column; gap: 8px; min-width: 0">'
                  f'<span style="display: flex; align-items: center; gap: 8px">{step_mark("todo", n)}'
                  f'{text("strong", sub + (" · part of Roof" if i == 0 else ""), touch, TEXT_2)}</span>'
                  f'{text("section", heading, touch)}{text("body", what, touch, TEXT_2)}'
                  f'<span style="margin-top: auto; padding-top: 8px; display: inline-flex; align-items: center; gap: 8px">'
                  f'{text("strong", primary, touch)}{icon(ICON["arrow-right"], 16, TEXT_2)}</span></div>')
    sun = (f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px dashed {LINE_STRONG}; '
           f'border-radius: {RADIUS["row"]}px">{icon(STEP_ICON["Sun"], 20, TEXT_2)}'
           f'{text("body", "Sun: a view of the stage on every step, its shadows and shade map. Not a step.", touch, TEXT_2)}</div>')
    return (f'<section style="display: flex; flex-direction: column; gap: 16px">{text("heading", "The order of work", touch, TEXT, "h2")}'
            f'<div style="display: grid; grid-template-columns: repeat({columns}, minmax(0, 1fr)); gap: 16px">{cards}</div>{sun}</section>')


def states_strip(touch: bool) -> str:
    rows = ""
    for words, states, current in STATES:
        rows += (f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}">'
                 f'{text("body", words, touch, TEXT_2)}<div style="overflow: hidden">{progression(states, current, touch)}</div></div>')
    key = (f'<div style="display: flex; flex-wrap: wrap; gap: 24px">'
           f'<span style="display: inline-flex; gap: 8px; align-items: center">{step_mark("done", 1)}{text("body", "Done: continued past, nothing to review", touch, TEXT_2)}</span>'
           f'<span style="display: inline-flex; gap: 8px; align-items: center">{step_mark("needs", 1)}{text("body", "Needs you: a note or a choice waits", touch, TEXT_2)}</span>'
           f'<span style="display: inline-flex; gap: 8px; align-items: center">{step_mark("todo", 3)}{text("body", "To do: its number", touch, TEXT_2)}</span></div>')
    return (f'<section style="display: flex; flex-direction: column; gap: 12px">{text("heading", "The steps and their states", touch, TEXT, "h2")}'
            f'{key}<div>{rows}</div></section>')


def words_strip(touch: bool) -> str:
    """D96: the app's own words, each explained in one line where the user meets it."""
    tip = (f'<div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">'
           f'<div style="overflow: hidden; max-width: 100%">{progression({"Roof": "done", "Array": "done", "Strings": "done"}, "Performance", touch)}</div>'
           f'<div style="padding-left: {0 if touch else 440}px">{tooltip("Handover: " + EXPLAIN["Handover"].lower())}</div></div>')
    rows = "".join(f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}">'
                   f'{text("strong", w, touch)}{text("body", EXPLAIN[w] + ".", touch, TEXT_2)}</div>'
                   for w in ("Roof", "Array", "Strings", "Performance", "Handover", "Sun"))
    where = text("body", "One sentence, in secondary text, never a box on screen by default (D96): the step's tooltip on desktop; "
                 "the line under the page's title the first time the user meets the word, then behind the ? disc; "
                 "Next under the primary until that step has been opened once.", touch, TEXT_2, "p", "max-width: 640px")
    return (f'<section style="display: flex; flex-direction: column; gap: 16px">{text("heading", "The app\'s own words, explained", touch, TEXT, "h2")}'
            f'{where}{tip}<div style="display: grid; grid-template-columns: {"1fr" if touch else "repeat(3, minmax(0, 1fr))"}; column-gap: 24px">{rows}</div></section>')


def view_controls(touch: bool) -> str:
    sun = button("Sun", "secondary", "compact", touch, icon(STEP_ICON["Sun"], 16, TEXT_2))
    layers = button("", "secondary", "compact", touch, icon(ICON["layers"], 16, TEXT_2), "width: %dpx; padding: 0" % (44 if touch else 32))
    seg = segmented(["3D", "Plan"], 0, touch) if touch else (
        f'<span style="display: inline-flex; padding: 3px; height: 32px; box-sizing: border-box; background: {WELL}; border: 1px solid {LINE}; '
        f'border-radius: {RADIUS["control"]}px"><span style="height: 24px; padding: 0 10px; display: inline-flex; align-items: center; '
        f'border-radius: 5px; background: #232A36; {style("strong", False)}">3D</span><span style="height: 24px; padding: 0 10px; '
        f'display: inline-flex; align-items: center; {style("body", False, TEXT_2)}">Plan</span></span>')
    fit = button("Fit", "secondary", "compact", touch)
    return f'<div style="display: flex; gap: 8px; align-items: center">{seg}{fit}{sun}{layers}</div>'


def module_card(touch: bool) -> str:
    glyph = (f'<span style="width: 40px; height: 52px; border-radius: 4px; background: #16294D; border: 1px solid #33558C; '
             f'flex: none; display: inline-block"></span>')
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{section_title("Module", touch)}'
            f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: {SURFACE_1}; '
            f'border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px">{glyph}'
            f'<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
            f'{text("strong", "INA-144MHC-TF-560", touch)}{text("body", "Insolation · 560 Wp · 2.28 × 1.13 m", touch, TEXT_2)}</div>'
            f'{button("Change", "secondary", "standard", touch)}</div></div>')


def work_head(touch: bool) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{text("heading", "Choose the module", touch, TEXT, "h2")}'
            f'{text("body", "The array is on the roof: 638 of 790 positions used. The energy follows each change.", touch, TEXT_2, "p")}</div>')


def foot(touch: bool, next_words: str, primary: str) -> str:
    arrow = icon(ICON["arrow-right"], 18, "#1A1204")
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", next_words, touch, TEXT_2)}'
            f'{button(primary + " " + arrow, "primary", "primary", touch, full=True)}</div>')


def studio_desktop() -> str:
    bar = top_bar(DONE_TO_ARRAY, "Array", 1440)
    stage = (f'<div style="position: absolute; left: 0; top: 56px; width: 1056px; height: 844px">'
             f'<div style="position: absolute; left: 40px; top: 32px; display: flex; flex-direction: column; gap: 4px">'
             f'{text("title", "Array")}{text("body", "790 positions · 28 tables · 6 rows · 1,646 m² of modules", False, TEXT_2)}</div>'
             f'<div style="position: absolute; right: 24px; top: 32px">{view_controls(False)}</div>'
             f'<div style="position: absolute; left: 48px; top: 190px">{roof_svg(960, label="3D view of the Pune demo roof, six rows of modules")}</div></div>')
    column = work_column(f'{work_head(False)}{module_card(False)}<div>'
                         f'{summary_row("Mounting", "Tilt 15° · Portrait · 2 modules in tilt", False)}'
                         f'{summary_row("Spacing", "Rows 6.45 m apart · shade-free 09:00 to 16:00", False)}</div>',
                         foot(False, "Next: Strings, " + EXPLAIN["Strings"][0].lower() + EXPLAIN["Strings"][1:] + ".", "Continue to Strings"))
    return bar + stage + column


def studio_desktop_hidden() -> str:
    """The panel hidden: the stage takes the width; Show panel beside the view controls; the primary floats at the foot."""
    bar = top_bar(DONE_TO_ARRAY, "Array", 1440)
    arrow = icon(ICON["arrow-right"], 18, "#1A1204")
    stage = (f'<div style="position: absolute; left: 0; top: 56px; width: 1440px; height: 844px">'
             f'<div style="position: absolute; left: 40px; top: 32px; display: flex; flex-direction: column; gap: 4px">'
             f'{text("title", "Array")}{text("body", "790 positions · 28 tables · 6 rows · 1,646 m² of modules", False, TEXT_2)}</div>'
             f'<div style="position: absolute; right: 24px; top: 32px; display: flex; gap: 8px">{view_controls(False)}{hide_button(False)}</div>'
             f'<div style="position: absolute; left: 120px; top: 150px">{roof_svg(1200, label="3D view of the Pune demo roof, six rows of modules")}</div>'
             f'<div style="position: absolute; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; '
             f'background: {CHROME}; border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; box-shadow: 0 16px 40px rgba(0,0,0,.5)">'
             f'{text("body", "Next: Strings", False, TEXT_2)}{button("Continue to Strings " + arrow, "primary", "primary")}</div></div>')
    return bar + stage


def page_head(step: str, states: dict, title: str, facts: str, primary: str, primary_icon: str, width: int, size: str) -> str:
    touch = size != "desktop"
    bar = top_bar(states, step, width, size)
    present = button("Present", "secondary", "standard", touch, icon(ICON["play"], 14, TEXT))
    prim = button(primary, "primary", "primary", touch, icon(primary_icon, 18, "#1A1204") if primary_icon else "")
    side = 40 if size == "desktop" else 20
    lead = text("display", "617.8", touch) + text("body", " MWh in year 1", touch, TEXT_2) if step == "Performance" else \
        text("body", "Design report · for the client · 6 pages", touch, TEXT_2)
    return (bar + f'<div style="padding: 40px {side}px 0; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px">'
            f'<div style="display: flex; flex-direction: column; gap: 4px">{text("title", title, touch, TEXT, "h1")}{explained(step, touch)}'
            f'{text("unit", facts, False, TEXT_3, "p", "margin-top: 4px")}</div>'
            f'<div style="display: flex; gap: 12px; align-items: center">{present}{prim}</div></div>'
            f'<div style="padding: 40px {side}px 0; display: flex; align-items: baseline; gap: 8px; opacity: .5">{lead}</div>')


ALL_TO_PERF = {"Roof": "done", "Array": "done", "Strings": "done"}
ALL_TO_HAND = {"Roof": "done", "Array": "done", "Strings": "done", "Performance": "done"}

CHANGES = [
    ("information-architecture.md · The places", "Three workspaces in the top bar; four lenses in a rail",
     "One row of five steps: Roof, Array, Strings, Performance, Handover. Sun a view of the stage", "V2-55, V2-56"),
    ("components.md · Top bar and navigation", "Logo, design, workspaces, saving, Present, Export",
     "Logo (Home), the design's name with its saved mark, the steps, the result (the energy, and what waits for review), Docs", "V2-57, V2-104"),
    ("components.md · Lens rail and lens switch", "A rail of 72 on desktop, a floating row on tablet, a switch in the sheet",
     "Gone: the steps in the top bar; on phone in the tab bar. The stage has the width", "V2-55, V2-118"),
    ("components.md · Buttons, the primary", "Export, the one accent button on every workspace",
     "One per step, named for the next step: at the work column's foot, or at the page's head", "V2-57, V2-105"),
    ("information-architecture.md · Studio, desktop", "The inspector always shown, 384 wide",
     "Hide panel and Show panel (⌘ \\): the stage the whole width, the primary floating at its foot; shown again when a step needs the user", "The owner, 2026-10-12"),
    ("components.md · Present", "A button of the top bar; the icon alone on tablet",
     "A secondary button with its word at the head of Performance and Handover", "V2-57, V2-79"),
    ("voice.md · §12 (new)", "A word of the app's (Handover) stands alone",
     "One line under its title, after Next and in its tooltip says what it is (D96)", "V2-37, V2-83"),
    ("Find's first step (D85) · the steps pill", "1 · 2 · 3 in a pill and Step 2 of 3 in the panel",
     "No counter: Find is the first part of Roof; the panel's title names what to do", "V2-58"),
]


def build_desktop() -> None:
    w = 1440
    head = board_head("V2 · 2 · The progression", LINES, False, ISSUES)
    screens = (frame("The Studio on the Array step: the steps in the top bar, the stage whole, the work column with its question at the head and its primary at the foot",
                     studio_desktop(), w, 900)
               + frame("The panel hidden (⌘ \\ or Hide panel): the stage takes the whole width; Show panel beside the view controls; the step's primary stays, at the stage's foot",
                       studio_desktop_hidden(), w, 900)
               + frame("Performance: the primary and Present at the head of the page", page_head(
                   "Performance", ALL_TO_PERF, "Performance", "Option A · Typical year · 617.8 MWh in year 1", "Continue to Handover", "", w, "desktop"), w, 300)
               + frame("Handover: Download all is the primary; Export is gone from the top bar", page_head(
                   "Handover", ALL_TO_HAND, "Handover", "8 files for option A", "Download all", ICON["download"], w, "desktop"), w, 300))
    body = (f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{head}{order_strip(False, 6)}'
            f'{states_strip(False)}{words_strip(False)}{screens}{changes(CHANGES)}</div>')
    write_board(OUT, "V2Progression.dc.html", "V2 · 2 · The progression · desktop 1440", 1520, 4890, body)


def studio_tablet() -> str:
    bar = top_bar(DONE_TO_ARRAY, "Array", 834, "tablet")
    stage = (f'<div style="position: absolute; left: 0; top: 60px; width: 834px; height: 440px; overflow: hidden">'
             f'<div style="position: absolute; left: 20px; top: 20px; display: flex; flex-direction: column; gap: 4px">'
             f'{text("title", "Array", True)}{text("body", "790 positions · 6 rows", True, TEXT_2)}</div>'
             f'<div style="position: absolute; right: 20px; top: 20px">{view_controls(True)}</div>'
             f'<div style="position: absolute; left: 40px; top: 96px">{roof_svg(740, label="3D view of the Pune demo roof")}</div></div>')
    column = (f'<div style="position: absolute; left: 0; top: 500px; width: 834px; height: 594px; background: {CHROME}; '
              f'border-top: 1px solid {LINE_SUBTLE}; padding: 24px 20px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px">'
              f'{work_head(True)}{module_card(True)}<div>'
              f'{summary_row("Mounting", "Tilt 15° · Portrait · 2 modules in tilt", True)}'
              f'{summary_row("Spacing", "Rows 6.45 m apart · shade-free 09:00 to 16:00", True)}</div></div>')
    arrow = icon(ICON["arrow-right"], 18, "#1A1204")
    footbar = (f'<div style="position: absolute; left: 0; bottom: 0; width: 834px; height: 100px; background: {CHROME}; '
               f'border-top: 1px solid {LINE_SUBTLE}; padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; '
               f'justify-content: space-between; gap: 16px">{text("body", "Next: Strings, " + EXPLAIN["Strings"][0].lower() + EXPLAIN["Strings"][1:] + ".", True, TEXT_2)}'
               f'{button("Continue to Strings " + arrow, "primary", "primary", True)}</div>')
    return bar + stage + column + footbar


def build_tablet() -> None:
    w = 834
    head = board_head("V2 · 2 · The progression", LINES, True, ISSUES)
    screens = (frame("The Studio on the Array step: the steps in the top bar; the stage 440 high; the primary at the screen's foot",
                     studio_tablet(), w, 1194)
               + frame("Performance's head", page_head("Performance", ALL_TO_PERF, "Performance", "Option A · Typical year · 617.8 MWh in year 1",
                                                      "Continue to Handover", "", w, "tablet"), w, 320)
               + frame("Handover's head", page_head("Handover", ALL_TO_HAND, "Handover", "8 files for option A", "Download all",
                                                   ICON["download"], w, "tablet"), w, 320))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px">'
            f'<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 40px">{head}{order_strip(True, 2)}{states_strip(True)}{words_strip(True)}</div>'
            f'{screens}<div style="padding: 0 20px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, "V2ProgressionTablet.dc.html", "V2 · 2 · The progression · tablet 834", 834, 5520, body)


def studio_phone() -> str:
    bar = top_bar(DONE_TO_ARRAY, "Array", 390, "phone")
    stage = (f'<div style="position: absolute; left: 0; top: 56px; width: 390px; height: 340px; overflow: hidden">'
             f'<div style="position: absolute; left: 16px; top: 12px">{text("title", "Array", True)}</div>'
             f'<div style="position: absolute; right: 16px; top: 8px; display: flex; gap: 8px">'
             f'{button("Sun", "secondary", "compact", True, icon(STEP_ICON["Sun"], 16, TEXT_2))}</div>'
             f'<div style="position: absolute; left: 0; top: 96px">{roof_svg(390, label="3D view of the Pune demo roof")}</div></div>')
    arrow = icon(ICON["arrow-right"], 18, "#1A1204")
    sheet = (f'<div style="position: absolute; left: 0; top: 380px; width: 390px; height: 392px; background: {CHROME}; '
             f'border-top: 1px solid {LINE}; border-radius: 24px 24px 0 0; box-sizing: border-box; display: flex; flex-direction: column">'
             f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}; margin: 8px 0 4px"></span>'
             f'<div style="flex: 1; padding: 12px 16px 0; display: flex; flex-direction: column; gap: 16px; overflow: hidden">'
             f'{work_head(True)}{module_card(True)}</div>'
             f'<div style="padding: 12px 16px 16px; border-top: 1px solid {LINE_SUBTLE}">{button("Continue to Strings " + arrow, "primary", "primary", True, full=True)}</div></div>')
    return bar + stage + sheet + f'<div style="position: absolute; left: 0; bottom: 0; width: 390px">{tab_bar(DONE_TO_ARRAY, "Array")}</div>'


def handover_phone() -> str:
    bar = top_bar(ALL_TO_HAND, "Handover", 390, "phone")
    rows = [("Design report", "For the client · 6 pages", "PDF"), ("Single-line diagram", "For the utility · A4", "PDF"),
            ("Bill of materials", "For the installer · 9 lines", "CSV"), ("Cable schedule", "For the installer · 22 strings", "CSV"),
            ("CAD layout", "For the drafter · metres", "DXF")]
    lst = "".join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 64px; border-top: 1px solid {LINE_SUBTLE}">'
                  f'<div style="flex: 1; display: flex; flex-direction: column; gap: 2px">{text("strong", a, True)}{text("body", b, True, TEXT_2)}</div>'
                  f'{text("unit", c, True, TEXT_2)}{icon(ICON["download"], 20, TEXT_2)}</div>' for a, b, c in rows)
    page = (f'<div style="position: absolute; left: 0; top: 56px; width: 390px; padding: 24px 16px; box-sizing: border-box">'
            f'{text("title", "Handover", True, TEXT, "h1")}<div style="margin-top: 4px">{explained("Handover", True)}</div>'
            f'<div style="margin-top: 16px">{lst}</div></div>')
    prim = (f'<div style="position: absolute; left: 0; bottom: 72px; width: 390px; padding: 12px 16px; box-sizing: border-box; '
            f'background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}">'
            f'{button("Download all · 8 files", "primary", "primary", True, icon(ICON["download"], 18, "#1A1204"), full=True)}</div>')
    return bar + page + prim + f'<div style="position: absolute; left: 0; bottom: 0; width: 390px">{tab_bar(ALL_TO_HAND, "Handover")}</div>'


def build_phone() -> None:
    w = 390
    head = board_head("V2 · 2 · The progression", LINES, True, ISSUES)
    states = (f'<section style="display: flex; flex-direction: column; gap: 12px">{text("heading", "The tab bar is the steps", True, TEXT, "h2")}'
              + "".join(f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", words, True, TEXT_2)}'
                        f'<div style="border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; overflow: hidden">{tab_bar(st, cur)}</div></div>'
                        for words, st, cur in STATES) + '</section>')
    screens = (frame("The Array step: the question at the sheet's head, its primary at the sheet's foot, the steps in the tab bar",
                     studio_phone(), w, 844)
               + frame("Handover: Download all over the tab bar. The phone has no Present, as today", handover_phone(), w, 844))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px">'
            f'<div style="padding: 0 16px; display: flex; flex-direction: column; gap: 40px">{head}{order_strip(True, 1)}{states}{words_strip(True)}</div>'
            f'{screens}<div style="padding: 0 16px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, "V2ProgressionPhone.dc.html", "V2 · 2 · The progression · phone 390", 390, 6650, body)


if __name__ == "__main__":
    build_desktop()
    build_tablet()
    build_phone()
