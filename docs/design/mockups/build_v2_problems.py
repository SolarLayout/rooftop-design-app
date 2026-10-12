"""The boards "V2 · 5 · Problems" on desktop 1440, tablet 834 and phone 390.

Every problem the app shows has one shape and one place (plan/v2/audit.md: V2-16 to V2-24; plan/v2/voice.md §5): what
happened, why, what to do as a button, the technical detail behind Details; the last good result stays, marked. Drawn: the
shape; the result in its states; no string length fits at 600 V; the run that failed; a note to review fixed in place; the
last result shown while a new one fails; a choice of stringing that no longer fits; a file refused inside its dialog; the
Strings step while the strings are sized. Drawn with build_v2_parts.py and the Pune demo's numbers (at 600 V a string holds
at most 11 of its modules; the inverter needs 14).
Usage: python3 -I build_v2_problems.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    section_title,
    work_column,
    ACCENT, CHROME, CONTROL_ACTIVE, ICON, LINE, LINE_STRONG, LINE_SUBTLE, NOTE_LINE, NOTE_SURFACE, RADIUS,
    SHADOW_FLOAT, SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, board_head, button, changes, field, frame, icon,
    mark, ring, roof_svg, style, summary_row, tab_bar, text, top_bar, write_board,
)
from build_v2_progression import view_controls  # noqa: E402

ISSUES = "Answers V2-16 · V2-17 · V2-18 · V2-19 · V2-20 · V2-21 · V2-22 · V2-23 · V2-24 · voice §5"
LINES = [
    "A problem has one shape everywhere: what happened, as a title; why, in one sentence; what to do, as a button; the "
    "technical detail behind Details. The cause comes before the consequence. No word of the machine in the first two "
    "lines: not HTTP, not the engine, not a key.",
    "It has one place. A problem of the result shows on the result in the top bar. A problem of a step shows at the "
    "head of that step's column, and its first remedy becomes the step's primary. Something done for the user shows "
    "once, as a toast with Undo. A refused file stays in its dialog. The last good result stays on screen, marked.",
    "A note to review is fixed where it is read: the field is in the note.",
]
STRINGS_DONE = {"Roof": "done", "Array": "done"}


def problem(title: str, cause: str, remedy: str = "", buttons: str = "", details: str = "", touch: bool = False,
            open_details: bool = False) -> str:
    """The one shape of a problem: the note mark and the title, the cause, the remedy, the buttons, Details."""
    det = ""
    if details:
        chev = icon(ICON["chevron-down" if open_details else "chevron-right"], 14, TEXT_2)
        det = (f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="display: inline-flex; align-items: center; gap: 4px; '
               f'{style("strong", touch, TEXT_2)}">Details {chev}</span>'
               + (text("mono", details, touch, TEXT_2, "p", f"padding: 8px 12px; background: {WELL}; border-radius: {RADIUS['control']}px; "
                       "font-size: 13px; white-space: pre-wrap") if open_details else "") + '</div>')
    return (f'<div role="alert" style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: {NOTE_SURFACE}; '
            f'border: 1px solid {NOTE_LINE}; border-radius: {RADIUS["row"]}px">'
            f'<div style="display: flex; gap: 10px; align-items: flex-start"><span style="padding-top: 2px; display: inline-flex">{mark("note", 18)}</span>'
            f'<div style="display: flex; flex-direction: column; gap: 4px">{text("strong", title, touch)}'
            f'{text("body", cause + (" " + remedy if remedy else ""), touch, TEXT_2)}</div></div>'
            + (f'<div style="display: flex; flex-wrap: wrap; gap: 8px; padding-left: 28px">{buttons}</div>' if buttons else "")
            + (f'<div style="padding-left: 28px">{det}</div>' if det else "") + '</div>')


def chip(state: str) -> str:
    """The result in the top bar, in each of its states."""
    base = (f'display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; background: transparent; '
            f'border: 1px solid {LINE}; border-radius: {RADIUS["control"]}px; white-space: nowrap')
    inner = {
        "computing": ring() + text("body", "Computing the energy", False, TEXT_2),
        "current": text("strong", "617.8") + text("body", "MWh a year", False, TEXT_2),
        "updating": ring() + f'<span style="opacity: .55; display: inline-flex; gap: 8px">{text("strong", "617.8")}{text("body", "MWh a year", False, TEXT_2)}</span>',
        "review": mark("note", 16) + text("strong", "1 to review") + f'<span style="width: 1px; height: 16px; background: {LINE}"></span>'
                  + text("strong", "617.8") + text("body", "MWh a year", False, TEXT_2),
        "failed": mark("note", 16) + text("strong", "Energy not computed"),
        "stale": mark("note", 16) + f'<span style="opacity: .55; display: inline-flex; gap: 8px">{text("strong", "617.8")}{text("body", "MWh", False, TEXT_2)}</span>'
                 + text("body", "Showing the last result", False, TEXT_2),
    }[state]
    return f'<button type="button" style="{base}">{inner}{icon(ICON["chevron-down"], 14, TEXT_2)}</button>'


CHIP_STATES = [("computing", "Computing: after a change, the first run"), ("current", "The result"),
               ("updating", "Updating: the last value dimmed, the ring"), ("review", "Something to review, and the result"),
               ("failed", "The run failed with no result before it"), ("stale", "A run failed after a change: the last result stays, marked")]


def anatomy(touch: bool) -> str:
    parts = [("Title", "The thing and its state. No verb, no Error", "Energy not computed"),
             ("Cause", "One sentence, the agent named, the present or the past", "The server could not be reached."),
             ("Remedy", "An imperative: the first thing to try", "Check your connection, then try again."),
             ("Action", "A button for the remedy, named for what it does", "Try again"),
             ("Details", "What only a developer reads, closed", "503 · 12 Oct 2026, 10:42")]
    rows = "".join(f'<div style="display: grid; grid-template-columns: {"1fr" if touch else "120px 1fr 1fr"}; gap: {4 if touch else 16}px; '
                   f'padding: 10px 0; border-top: 1px solid {LINE_SUBTLE}">{text("strong", a, touch)}{text("body", b, touch, TEXT_2)}'
                   f'{text("body", c, touch)}</div>' for a, b, c in parts)
    example = problem("Energy not computed", "The server could not be reached.", "Check your connection, then try again.",
                      button("Try again", "secondary", "standard", touch), "503 · 12 Oct 2026, 10:42", touch, True)
    cols = "1fr" if touch else "minmax(0, 1.4fr) minmax(0, 1fr)"
    return (f'<section style="display: flex; flex-direction: column; gap: 16px">{text("heading", "The shape of a problem", touch, TEXT, "h2")}'
            f'<div style="display: grid; grid-template-columns: {cols}; gap: 32px; align-items: start"><div>{rows}</div>{example}</div></section>')


def chip_strip(touch: bool) -> str:
    rows = "".join(f'<div style="display: flex; flex-direction: column; gap: 8px; min-width: 0">{text("body", w, touch, TEXT_2)}'
                   f'<div>{chip(s)}</div></div>' for s, w in CHIP_STATES)
    cols = "1fr" if touch else "repeat(3, minmax(0, 1fr))"
    return (f'<section style="display: flex; flex-direction: column; gap: 16px">{text("heading", "The result, in its states", touch, TEXT, "h2")}'
            f'{text("body", "Pressed, each opens the summary, or the problem with its remedy.", touch, TEXT_2)}'
            f'<div style="display: grid; grid-template-columns: {cols}; gap: 24px">{rows}</div></section>')


def strings_column(touch: bool) -> str:
    fix = problem("No string length fits at 600 V",
                  "This inverter needs at least 14 modules in a string. At 600 V a string holds at most 11.", "",
                  button("Choose another inverter", "secondary", "standard", touch)
                  + button("Change the sizing temperatures", "quiet", "standard", touch), touch=touch)
    rows = (summary_row("Inverter", "WattPower WP-330KTL-H1 · 275 kW · 6 MPPT", touch)
            + summary_row("System voltage", "600 V · Set for the United States", touch, state="Set for US")
            + summary_row("Sizing temperatures", "From the weather · 11.9 °C to 64.3 °C", touch, state="From the weather"))
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Check the strings", touch, TEXT, "h2")}'
            f'{text("body", "How the modules are wired to the inverter.", touch, TEXT_2, "p")}</div>{fix}<div>{rows}</div>')


def strings_foot(touch: bool) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{button("Use 1000 V", "primary", "primary", touch, full=True)}'
            f'{text("body", "Allowed on most commercial roofs. Check the site's code first.", touch, TEXT_2)}</div>')


def screen(column: str, foot: str, chip_state: str, step: str, states: dict, overlay: str = "", stage_title: str = "Strings",
           stage_facts: str = "790 positions · no strings yet") -> str:
    bar = top_bar(states, step, 1440, result="617.8")
    bar = bar.replace(bar[bar.find('<button type="button" aria-label="Result'):bar.find('</button>', bar.find('aria-label="Result')) + 9], chip(chip_state)) \
        if 'aria-label="Result' in bar else bar
    st = (f'<div style="position: absolute; left: 0; top: 56px; width: 1056px; height: 844px; overflow: hidden">'
          f'<div style="position: absolute; left: 40px; top: 32px; display: flex; flex-direction: column; gap: 4px">'
          f'{text("title", stage_title)}{text("body", stage_facts, False, TEXT_2)}</div>'
          f'<div style="position: absolute; right: 24px; top: 32px">{view_controls(False)}</div>'
          f'<div style="position: absolute; left: 48px; top: 190px">{roof_svg(960, label="3D view of the Pune demo roof")}</div></div>')
    col = work_column(column, foot)
    return bar + st + col + overlay


def popover(inner: str, right: int = 96, top: int = 52, width: int = 360) -> str:
    return (f'<div style="position: absolute; right: {right}px; top: {top}px; width: {width}px; padding: 16px; box-sizing: border-box; '
            f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: {RADIUS["card"]}px; box-shadow: {SHADOW_FLOAT}; '
            f'display: flex; flex-direction: column; gap: 12px">{inner}</div>')


def array_column(touch: bool) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Choose the module", touch, TEXT, "h2")}</div>'
            + summary_row("Module", "INA-144MHC-TF-560 · Insolation · 560 Wp", touch, state="Default")
            + summary_row("Mounting", "Tilt 15° · Portrait · 2 modules in tilt", touch)
            + summary_row("Spacing", "Rows 6.45 m apart · shade-free 09:00 to 16:00", touch))


def array_foot(touch: bool) -> str:
    return button("Continue to Strings " + icon(ICON["arrow-right"], 18, "#1A1204"), "primary", "primary", touch, full=True)


def failed_popover(touch: bool) -> str:
    return popover(f'{problem("Energy not computed", "The server could not be reached.", "Check your connection, then try again.", button("Try again", "secondary", "standard", touch), "503 · 12 Oct 2026, 10:42", touch)}'
                   .replace(f"background: {NOTE_SURFACE}", "background: transparent").replace(f"border: 1px solid {NOTE_LINE}", "border: 0")
                   .replace("padding: 16px; background: transparent", "padding: 0; background: transparent"))


def review_popover(touch: bool) -> str:
    inner = (f'{text("section", "1 to review", touch)}{text("body", "Values outside the usual range. Each one says how to fix it.", touch, TEXT_2)}'
             f'<div style="display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid {LINE_SUBTLE}">'
             f'<div style="display: flex; gap: 10px">{mark("note", 18)}<div style="display: flex; flex-direction: column; gap: 4px">'
             f'{text("strong", "Voc coefficient outside the usual range", touch)}'
             f'{text("body", "Usually −0.35 to −0.20 %/°C for this kind of module. Enter the datasheet's value.", touch, TEXT_2)}</div></div>'
             f'<div style="padding-left: 28px">{field("Voc coefficient", "−0.164", "%/°C", "From the module file · Array, Module", touch, 132)}</div>'
             f'<div style="padding-left: 28px; display: flex; gap: 8px">{button("Keep −0.164", "quiet", "standard", touch)}</div></div>')
    return popover(inner, width=380)


def stale_column(touch: bool) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Check the roof", touch, TEXT, "h2")}</div>'
            + problem("Energy not updated", "The server could not be reached after the parapet changed to 1.20 m. "
                      "The result shown is from before the change.", "",
                      button("Try again", "secondary", "standard", touch), "503 · 12 Oct 2026, 10:51", touch)
            + summary_row("Edges and access", "Parapet 1.20 m · margin 1.0 m", touch, state="Yours")
            + summary_row("Obstacles · 6", "Stair room, water tank, 4 AC units", touch, state="Yours"))


def toast(words: str, actions: str) -> str:
    return (f'<div role="status" style="display: inline-flex; align-items: center; gap: 16px; padding: 8px 8px 8px 16px; background: {SURFACE_2}; '
            f'border: 1px solid {LINE_STRONG}; border-radius: {RADIUS["card"]}px; box-shadow: {SHADOW_FLOAT}">'
            f'{text("body", words)}<span style="display: inline-flex; gap: 4px">{actions}</span></div>')


def csv_dialog(touch: bool) -> str:
    drop = (f'<div style="display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px dashed {LINE_STRONG}; '
            f'border-radius: {RADIUS["row"]}px">{icon(ICON["download"], 20, TEXT_2)}<div style="display: flex; flex-direction: column">'
            f'{text("strong", "pune-2023-hourly.csv", touch)}{text("body", "8,000 rows · 412 KB", touch, TEXT_2)}</div>'
            f'<span style="margin-left: auto">{button("Choose another", "quiet", "standard", touch)}</span></div>')
    refused = problem("This file cannot be used", "It has 8,000 hours. A year has 8,760.",
                      "Fill the gaps in the irradiance column, or choose another file.", "",
                      "Missing: 1 Jul 00:00 to 1 Aug 15:00 (760 hours)", touch, True)
    return (f'<div role="dialog" style="width: 520px; padding: 24px; box-sizing: border-box; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; '
            f'border-radius: {RADIUS["panel"]}px; box-shadow: {SHADOW_FLOAT}; display: flex; flex-direction: column; gap: 16px">'
            f'{text("heading", "Use your weather file")}{text("body", "A CSV of one year, hour by hour, with the irradiance on the ground.", touch, TEXT_2)}'
            f'{drop}{refused}<div style="display: flex; justify-content: flex-end; gap: 8px">{button("Cancel", "quiet")}'
            f'<span style="opacity: .45">{button("Use this file", "primary", "standard")}</span></div></div>')


def sizing_column(touch: bool) -> str:
    sk = lambda h: f'<span style="display: block; height: {h}px; border-radius: {RADIUS["row"]}px; background: {SURFACE_2}; opacity: .7"></span>'
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Check the strings", touch, TEXT, "h2")}</div>'
            f'<div style="display: flex; align-items: center; gap: 10px">{ring(18)}{text("body", "Sizing the strings · a few seconds", touch, TEXT_2)}</div>'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{section_title("Options", touch)}{sk(56)}{sk(56)}{sk(56)}</div>')


CHANGES = [
    ("guidelines.md · States: Failure", "What failed in the engine's words; the cause in the third place",
     "Title, cause, remedy, a button, Details; the cause first; no machine words in the first two lines", "V2-16, V2-20"),
    ("components.md · Decision card (no option fits)", "Change the system voltage, the inverter or the sizing temperatures",
     "One problem at the step's head, a button per remedy, the likeliest the step's primary", "V2-17"),
    ("components.md · Notes to review, the drawer", "1 note to review · Voc coefficient; the note needs a datasheet",
     "The result's chip says 1 to review; the note holds its field; the demo's module opens clean", "V2-18"),
    ("components.md · Vitals: states (updating, stale)", "Energy was not updated · Values are of the design before",
     "Showing the last result, the value dimmed; the change that waits named", "V2-19"),
    ("D77 · A choice that no longer fits", "A toast of three lines naming the stringing",
     "Your stringing no longer fits. Option A is used. Undo · Choose another", "V2-24"),
    ("Weather CSV refusals", "A toast that closes", "The refusal in its dialog until the file changes, its detail behind Details", "V2-23"),
    ("Strings, while sized", "790 positions ready · no strings yet, the options blank", "The skeleton of the options and the step: Sizing the strings", "V2-21"),
]


def build_desktop() -> None:
    w = 1440
    head = board_head("V2 · 5 · Problems", LINES, False, ISSUES)
    us = {"Roof": "done", "Array": "done", "Strings": "needs"}
    screens = (
        frame("1 · No string length fits at 600 V (a design in the United States): the problem at the step's head, the likeliest remedy the primary",
              screen(strings_column(False), strings_foot(False), "failed", "Strings", us), w, 900)
        + frame("2 · The run failed and there is no result before it: the result says so; pressed, the cause, the remedy, Try again, Details",
                screen(array_column(False), array_foot(False), "failed", "Array", STRINGS_DONE, failed_popover(False),
                       "Array", "790 positions · 28 tables · 6 rows"), w, 900)
        + frame("3 · A note to review, fixed where it is read: the field in the note; Keep when the value is right",
                screen(array_column(False), array_foot(False), "review", "Array", STRINGS_DONE, review_popover(False),
                       "Array", "790 positions · 28 tables · 6 rows"), w, 900)
        + frame("4 · A run failed after a change: the last result stays, marked; the step names the change that waits",
                screen(stale_column(False), array_foot(False).replace("Strings", "Array"), "stale", "Roof", {},
                       stage_title="Roof", stage_facts="3,600 m² · 6 obstacles"), w, 900)
        + frame("5 · A choice of stringing that an edit took away: one line, Undo, Choose another",
                screen(array_column(False), array_foot(False), "current", "Array", STRINGS_DONE,
                       f'<div style="position: absolute; left: 528px; bottom: 32px; transform: translateX(-50%)">'
                       f'{toast("Your stringing no longer fits. Option A is used.", button("Undo", "quiet", "compact") + button("Choose another", "quiet", "compact"))}</div>',
                       "Array", "790 positions · 28 tables · 6 rows"), w, 900)
        + frame("6 · A file refused: the refusal stays in its dialog, what was expected and what was found, the detail behind Details",
                f'<div style="position: absolute; inset: 0; background: rgba(5,7,10,.72)"></div>'
                f'<div style="position: absolute; left: 50%; top: 80px; transform: translateX(-50%)">{csv_dialog(False)}</div>', w, 700)
        + frame("7 · The Strings step while the strings are sized: the options' skeleton and the step's name",
                screen(sizing_column(False), "", "computing", "Strings", STRINGS_DONE, "", "Strings", "790 positions · sizing the strings"), w, 900))
    body = (f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{head}{anatomy(False)}{chip_strip(False)}'
            f'{screens}{changes(CHANGES)}</div>')
    write_board(OUT, "V2Problems.dc.html", "V2 · 5 · Problems · desktop 1440", 1520, 7960, body)


def phone_screen(kind: str) -> str:
    us = {"Roof": "done", "Array": "done", "Strings": "needs"}
    if kind == "strings":
        bar = top_bar(us, "Strings", 390, "phone", result="617.8")
        bar = bar.replace(bar[bar.find('<button type="button" aria-label="Result'):bar.find('</button>', bar.find('aria-label="Result')) + 9],
                          f'<span style="display: inline-flex; align-items: center; gap: 6px">{mark("note", 16)}{text("strong", "No energy", True)}</span>')
        body, foot, states, step = strings_column(True), strings_foot(True), us, "Strings"
    else:
        bar = top_bar(STRINGS_DONE, "Array", 390, "phone", result="617.8")
        bar = bar.replace(bar[bar.find('<button type="button" aria-label="Result'):bar.find('</button>', bar.find('aria-label="Result')) + 9],
                          f'<span style="display: inline-flex; align-items: center; gap: 6px">{mark("note", 16)}{text("strong", "1 to review", True)}</span>')
        body, foot, states, step = "", "", STRINGS_DONE, "Array"
    st = (f'<div style="position: absolute; left: 0; top: 56px; width: 390px; height: 340px; overflow: hidden">'
          f'<div style="position: absolute; left: 16px; top: 12px">{text("title", step, True)}</div>'
          f'<div style="position: absolute; left: 0; top: 110px">{roof_svg(390, label="3D view of the Pune demo roof")}</div></div>')
    if kind == "strings":
        sheet = (f'<div style="position: absolute; left: 0; top: 380px; width: 390px; height: 392px; background: {CHROME}; '
                 f'border-top: 1px solid {LINE}; border-radius: 24px 24px 0 0; box-sizing: border-box; display: flex; flex-direction: column">'
                 f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}; margin: 8px 0 4px"></span>'
                 f'<div style="flex: 1; padding: 12px 16px 0; display: flex; flex-direction: column; gap: 16px; overflow: hidden">{body}</div>'
                 f'<div style="padding: 12px 16px 16px; border-top: 1px solid {LINE_SUBTLE}">{button("Use 1000 V", "primary", "primary", True, full=True)}</div></div>')
        return bar + st + sheet + f'<div style="position: absolute; left: 0; bottom: 0; width: 390px">{tab_bar(states, step)}</div>'
    inner = review_popover(True)
    inner = inner[inner.find('>') + 1:inner.rfind('</div>')]
    sheet = (f'<div style="position: absolute; inset: 0; background: rgba(5,7,10,.72)"></div>'
             f'<div style="position: absolute; left: 0; bottom: 0; width: 390px; background: {CHROME}; border-radius: 24px 24px 0 0; '
             f'border-top: 1px solid {LINE}; padding: 12px 16px 32px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px">'
             f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></span>{inner}</div>')
    return bar + st + sheet


def tablet_screen() -> str:
    us = {"Roof": "done", "Array": "done", "Strings": "needs"}
    bar = top_bar(us, "Strings", 834, "tablet")
    st = (f'<div style="position: absolute; left: 0; top: 60px; width: 834px; height: 440px; overflow: hidden">'
          f'<div style="position: absolute; left: 20px; top: 20px">{text("title", "Strings", True)}</div>'
          f'<div style="position: absolute; left: 40px; top: 96px">{roof_svg(740, label="3D view of the Pune demo roof")}</div></div>')
    result = (f'<div style="position: absolute; left: 0; top: 500px; width: 834px; height: 56px; padding: 0 20px; box-sizing: border-box; '
              f'display: flex; align-items: center; gap: 10px; background: {SURFACE_1}; border-top: 1px solid {LINE_SUBTLE}; '
              f'border-bottom: 1px solid {LINE_SUBTLE}">{mark("note", 16)}{text("strong", "Energy not computed", True)}'
              f'{text("body", "· no string length fits", True, TEXT_2)}</div>')
    col = (f'<div style="position: absolute; left: 0; top: 556px; width: 834px; height: 538px; background: {CHROME}; padding: 24px 20px; '
           f'box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; overflow: hidden">{strings_column(True)}</div>')
    foot = (f'<div style="position: absolute; left: 0; bottom: 0; width: 834px; height: 100px; background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}; '
            f'padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 16px">'
            f'{text("body", "Allowed on most commercial roofs. Check the site's code.", True, TEXT_2)}{button("Use 1000 V", "primary", "primary", True)}</div>')
    return bar + st + result + col + foot


def build_touch(size: str) -> None:
    w = 834 if size == "tablet" else 390
    side = 20 if size == "tablet" else 16
    head = board_head("V2 · 5 · Problems", LINES, True, ISSUES)
    if size == "tablet":
        screens = frame("No string length fits at 600 V: the problem in the column's head, Use 1000 V the primary at the foot; the result row says why", tablet_screen(), w, 1194)
    else:
        screens = (frame("No string length fits at 600 V: the problem at the sheet's head, Use 1000 V at its foot", phone_screen("strings"), w, 844)
                   + frame("1 to review, pressed: the note with its field, in a sheet", phone_screen("review"), w, 844))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px">'
            f'<div style="padding: 0 {side}px; display: flex; flex-direction: column; gap: 40px">{head}{anatomy(True)}{chip_strip(True)}</div>'
            f'{screens}<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    name = "V2ProblemsTablet.dc.html" if size == "tablet" else "V2ProblemsPhone.dc.html"
    write_board(OUT, name, f"V2 · 5 · Problems · {size} {w}", w, 4030 if size == "tablet" else 5130, body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
