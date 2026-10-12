"""The boards "V2 · 10 · Phone and tablet" on desktop 1440 (an overview), tablet 834 and phone 390.

How V2 works in the hand (plan/v2/audit.md: V2-72, V2-75, V2-76, V2-78 to V2-81, V2-102, V2-116, V2-118). Today on phone the
stage is 252 of 844, the step's action is in the sheet's scroll, the vitals row scrolls sideways with the note off screen,
the help discs are 16 wide and the tilt stepper 26; on tablet the inspector starts at 740 of 1194. V2: the sheet opens on the
step's instruction with its primary at its foot at every stop; at half the stage keeps 40 % of the height; full leaves a
strip of the roof; every target 44 × 44, the whole field box focusing its input; the equipment pickers search first with
their filters behind Filter; on tablet the stage 440, the result a row, the column in two halves ordered by the step.
Drawn with build_v2_parts.py and the Pune demo's numbers; the library's rows are equipment_picker_data.json's.
Usage: python3 -I build_v2_touch.py [--out <folder>]
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    STEP_ICON, ACCENT, ACCENT_INK, CHROME, CONTROL, ICON, LINE, LINE_STRONG, LINE_SUBTLE, RADIUS, SHADOW_WELL, SURFACE_1,
    SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, board_head, button, changes, field, frame, help_disc, icon, mark, roof_svg,
    section_title, segmented, style, summary_row, tab_bar, text, top_bar, write_board,
)

EQ = json.loads((HERE / "equipment_picker_data.json").read_text(encoding="utf-8"))
ISSUES = "Answers V2-72 · V2-75 · V2-76 · V2-78 · V2-79 · V2-80 · V2-81 · V2-102 · V2-116 · V2-118"
LINES = [
    "On phone the sheet holds the step: its instruction at the head, its primary at the foot, at every stop. At peek the "
    "roof has the screen and the instruction and the primary stay. At half the stage keeps 40 % of the height. At full a "
    "strip of the roof stays, so the user still sees what they change. The result is in the top bar; nothing scrolls sideways.",
    "Every target is 44 × 44: the ? disc draws 20 in a target of 44, the whole field box focuses its input, a stepper's "
    "buttons are 44. Icons alone only where they are universal (close, zoom); everything else carries its word.",
    "The equipment pickers open on their search and their list; the sliders of their filters are behind Filter. On tablet "
    "the stage is 440, the result is a row under it, and the column is two halves in the step's order.",
]
DONE = {"Roof": "done"}


def sheet(top: int, h: int, body: str, primary: str) -> str:
    return (f'<div style="position: absolute; left: 0; top: {top}px; width: 390px; height: {h}px; background: {CHROME}; border-top: 1px solid {LINE}; '
            f'border-radius: 24px 24px 0 0; box-sizing: border-box; display: flex; flex-direction: column; box-shadow: 0 -16px 40px rgba(0,0,0,.4)">'
            f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}; margin: 8px 0 4px"></span>'
            f'<div style="flex: 1; padding: 8px 16px 0; display: flex; flex-direction: column; gap: 16px; overflow: hidden">{body}</div>'
            f'<div style="padding: 12px 16px 16px; border-top: 1px solid {LINE_SUBTLE}">{primary}</div></div>')


def phone_stop(stop: str) -> str:
    bar = top_bar(DONE, "Array", 390, "phone")
    stage_h = {"peek": 560, "half": 338, "full": 120}[stop]
    roof_w = {"peek": 390, "half": 390, "full": 150}[stop]
    st = (f'<div style="position: absolute; left: 0; top: 56px; width: 390px; height: {stage_h}px; overflow: hidden">'
          f'<div style="position: absolute; left: 16px; top: 12px">{text("title", "Array", True)}</div>'
          f'<div style="position: absolute; right: 16px; top: 8px">{button("Sun", "secondary", "compact", True, icon(STEP_ICON["Sun"], 16, TEXT_2))}</div>'
          f'<div style="position: absolute; left: {(390 - roof_w) // 2 if stop != "full" else 120}px; top: {200 if stop == "peek" else (100 if stop == "half" else 20)}px">'
          f'{roof_svg(roof_w, label="3D view of the Pune demo roof")}</div></div>')
    head = (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Choose the module", True, TEXT, "h2")}'
            + (text("body", "The array is on the roof: 638 of 790 positions used.", True, TEXT_2, "p") if stop != "peek" else "") + '</div>')
    card = (f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px">'
            f'<span style="width: 36px; height: 46px; border-radius: 4px; background: #16294D; border: 1px solid #33558C; flex: none"></span>'
            f'<div style="flex: 1; display: flex; flex-direction: column">{text("strong", "INA-144MHC-TF-560", True)}{text("body", "Insolation · 560 Wp", True, TEXT_2)}</div>'
            f'{button("Change", "secondary", "standard", True)}</div>')
    body = head
    if stop == "half":
        body += card + summary_row("Mounting", "Tilt 15° · Portrait · 2 in tilt", True, state="Default")
    if stop == "full":
        body += (card + summary_row("Mounting", "Tilt 15° · Portrait · 2 in tilt", True, True, "Default")
                 + field("Tilt", "15", "°", "Default", True, 96) + f'<div style="display: flex; align-items: center; justify-content: space-between">'
                 f'{text("body", "Orientation", True)}{segmented(["Portrait", "Landscape"], 0, True)}</div>'
                 + stepper("Modules in tilt", "2") + summary_row("Spacing", "Rows 6.45 m apart", True, state="Default"))
    prim = button("Continue to Strings " + icon(ICON["arrow-right"], 18, ACCENT_INK), "primary", "primary", True, full=True)
    top = 56 + stage_h - 16
    return bar + st + sheet(top, 844 - 72 - top, body, prim) + f'<div style="position: absolute; left: 0; bottom: 0; width: 390px">{tab_bar(DONE, "Array")}</div>'


def stepper(label: str, value: str) -> str:
    b = lambda s, n: (f'<button type="button" aria-label="{n}" style="width: 44px; height: 44px; border: 0; background: {CONTROL}; color: {TEXT}; '
                      f'font-size: 20px; border-radius: {RADIUS["control"]}px">{s}</button>')
    return (f'<div style="display: flex; align-items: center; justify-content: space-between">{text("body", label, True)}'
            f'<span style="display: inline-flex; align-items: center; gap: 4px; padding: 0; background: {WELL}; border: 1px solid {LINE_STRONG}; '
            f'border-radius: {RADIUS["row"]}px">{b("−", "One fewer")}<span style="width: 40px; text-align: center; {style("mono", True)}">{value}</span>{b("+", "One more")}</span></div>')


def picker(filters_open: bool = False) -> str:
    rows = [m for m in EQ["modules"]][:6]
    sel = (f'<div style="display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 0 12px; border-radius: {RADIUS["row"]}px; '
           f'background: {SURFACE_2}; border: 1px solid {LINE_STRONG}"><div style="flex: 1; display: flex; flex-direction: column">'
           f'{text("strong", "INA-144MHC-TF-560", True)}{text("body", "Insolation · 560 Wp · bifacial · in use", True, TEXT_2)}</div>{mark("fits", 18)}</div>')
    lst = sel + "".join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 0 12px; border-bottom: 1px solid {LINE_SUBTLE}">'
                        f'<div style="flex: 1; display: flex; flex-direction: column">{text("strong", m["model"], True)}'
                        f'{text("body", f"{m['maker'].split()[0]} · {m['wp']:.0f} Wp · {m['eff']:.1f} % · bifacial", True, TEXT_2)}</div></div>' for m in rows[2:6])
    search = (f'<label style="flex: 1; display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px; box-sizing: border-box; background: {WELL}; '
              f'border: 1px solid {LINE_STRONG}; border-radius: {RADIUS["control"]}px; box-shadow: {SHADOW_WELL}">{icon(ICON["search"], 18, TEXT_2)}'
              f'{text("body", "Maker, model or power", True, TEXT_3)}</label>')
    filt = button("Filter", "secondary", "standard", True, icon('<path d="M4 6h16"></path><path d="M7 12h10"></path><path d="M10 18h4"></path>', 16, TEXT_2), "height: 48px")
    body = (f'<div style="position: absolute; inset: 0; background: rgba(5,7,10,.72)"></div>'
            f'<div style="position: absolute; left: 0; top: 40px; width: 390px; height: 804px; background: {CHROME}; border-radius: 24px 24px 0 0; '
            f'border-top: 1px solid {LINE}; box-sizing: border-box; padding: 16px; display: flex; flex-direction: column; gap: 16px">'
            f'<div style="display: flex; justify-content: space-between; align-items: center">{text("heading", "Choose a module", True)}'
            f'<button type="button" aria-label="Close" style="width: 44px; height: 44px; background: transparent; border: 0">{icon(ICON["close"], 20, TEXT_2)}</button></div>'
            f'<div style="display: flex; gap: 8px">{search}{filt}</div>{text("body", "119 modules from 5 makers, or your own module file (PAN)", True, TEXT_2)}'
            f'<div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden">{lst}</div></div>')
    return top_bar(DONE, "Array", 390, "phone") + body


def targets() -> str:
    def box(inner: str, words: str, w: int = 44, h: int = 44) -> str:
        return (f'<div style="display: flex; align-items: center; gap: 16px"><span style="position: relative; width: {w}px; height: {h}px; display: inline-flex; '
                f'align-items: center; justify-content: center; outline: 1px dashed {ACCENT}; outline-offset: 0; flex: none">{inner}</span>'
                f'{text("body", words, True, TEXT_2)}</div>')
    disc = (f'<span style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid {LINE_STRONG}; color: {TEXT_3}; font-size: 12px; line-height: 18px; '
            f'text-align: center; box-sizing: border-box">?</span>')
    fld = (f'<div style="position: relative; padding: 0; outline: 1px dashed {ACCENT}">{field("Edge margin (setback)", "1.00", "m", "Default", True, 112)}</div>')
    return (f'<div style="display: flex; flex-direction: column; gap: 16px">{section_title("Targets of 44 × 44", True)}'
            f'{box(disc, "The ? disc: 20 drawn, 44 to touch")}'
            f'{box(button("", "secondary", "standard", True, icon(ICON["plus"], 18, TEXT), "width: 44px; padding: 0"), "A stepper button: 44, was 26")}'
            f'{fld}{text("body", "The whole row focuses the field: label, hint and box. The dashed line is the target.", True, TEXT_2)}</div>')


def tablet_screen() -> str:
    bar = top_bar(DONE, "Array", 834, "tablet")
    st = (f'<div style="position: absolute; left: 0; top: 60px; width: 834px; height: 440px; overflow: hidden">'
          f'<div style="position: absolute; left: 20px; top: 20px">{text("title", "Array", True)}</div>'
          f'<div style="position: absolute; left: 47px; top: 96px">{roof_svg(740, label="3D view of the Pune demo roof")}</div></div>')
    result = (f'<div style="position: absolute; left: 0; top: 500px; width: 834px; height: 56px; padding: 0 20px; box-sizing: border-box; display: flex; '
              f'align-items: center; gap: 10px; background: {SURFACE_1}; border-bottom: 1px solid {LINE_SUBTLE}">{text("strong", "617.8", True)}'
              f'{text("body", "MWh a year · 638 of 790 modules · 357.28 kWp", True, TEXT_2)}</div>')
    left = (f'<div style="display: flex; flex-direction: column; gap: 16px">{text("heading", "Choose the module", True, TEXT, "h2")}'
            f'{text("body", "The array is on the roof: 638 of 790 positions used.", True, TEXT_2)}'
            f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px">'
            f'<div style="flex: 1; display: flex; flex-direction: column">{text("strong", "INA-144MHC-TF-560", True)}{text("body", "Insolation · 560 Wp", True, TEXT_2)}</div>'
            f'{button("Change", "secondary", "standard", True)}</div></div>')
    right = ("<div>" + summary_row("Mounting", "Tilt 15° · Portrait · 2 in tilt", True, state="Default")
             + summary_row("Spacing", "Rows 6.45 m apart · shade-free 09:00 to 16:00", True, state="Default") + "</div>")
    col = (f'<div style="position: absolute; left: 0; top: 556px; width: 834px; height: 538px; background: {CHROME}; padding: 24px 20px; box-sizing: border-box; '
           f'display: grid; grid-template-columns: 1fr 1fr; gap: 24px">{left}{right}</div>')
    ft = (f'<div style="position: absolute; left: 0; bottom: 0; width: 834px; height: 100px; background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}; '
          f'padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between">'
          f'{text("body", "Next: Strings, how the modules are wired to the inverter.", True, TEXT_2)}'
          f'{button("Continue to Strings " + icon(ICON["arrow-right"], 18, ACCENT_INK), "primary", "primary", True)}</div>')
    return bar + st + result + col + ft


CHANGES = [
    ("components.md · Bottom sheet", "Peek shows the handle and the lens switch; the step's action in the scroll",
     "Every stop shows the step's instruction and its primary at the foot; half keeps the stage 40 %; full a strip of roof", "V2-75, V2-118"),
    ("Vitals on phone", "A row of seven cells that scrolls sideways, the note off screen", "The result in the top bar; the summary in a sheet", "V2-80"),
    ("Studio on tablet", "Stage 508, a vitals grid 140, the inspector from 740", "Stage 440, the result a row of 56, the column in two halves by step", "V2-76"),
    ("Touch targets", "Discs 16 wide, a stepper 26, a field's input 64 × 20", "44 × 44 for every target; the whole field row focuses its input", "V2-116"),
    ("Equipment pickers on phone", "Three sliders stacked over the list, an Order select", "Search and list first; the filters behind Filter", "V2-72, V2-81"),
    ("Icon buttons", "Icons alone at the eye's entry; Present a bare triangle on tablet", "Words on every action but close and zoom; Present with its word", "V2-79, V2-102, V2-117"),
]


def build_desktop() -> None:
    hd = board_head("V2 · 10 · Phone and tablet", LINES, False, ISSUES)
    phones = "".join(f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", w, False, TEXT_2)}'
                     f'<div style="position: relative; width: 390px; height: 844px; overflow: hidden; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; '
                     f'background: #0B0E13">{s}</div></div>'
                     for w, s in (("Peek: the roof has the screen; the instruction and the primary stay", phone_stop("peek")),
                                  ("Half: the stage keeps 40 % of the height", phone_stop("half")),
                                  ("Full: a strip of the roof stays; the primary stays", phone_stop("full"))))
    row1 = f'<div style="display: grid; grid-template-columns: repeat(3, 390px); gap: 40px">{phones}</div>'
    row2 = (f'<div style="display: grid; grid-template-columns: 390px 390px 1fr; gap: 40px; align-items: start">'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", "Choose a module: search and list first, the filters behind Filter", False, TEXT_2)}'
            f'<div style="position: relative; width: 390px; height: 844px; overflow: hidden; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px">{picker()}</div></div>'
            f'<div style="padding: 24px; background: {CHROME}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px">{targets()}</div><div></div></div>')
    tab = frame("Tablet: the stage 440, the result a row, the column in two halves by the step, the primary at the foot", tablet_screen(), 834, 1194)
    body = f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{hd}{row1}{row2}{tab}{changes(CHANGES)}</div>'
    write_board(OUT, "V2Touch.dc.html", "V2 · 10 · Phone and tablet · overview 1440", 1520, 3860, body)


def build_tablet() -> None:
    hd = board_head("V2 · 10 · Phone and tablet", LINES, True, ISSUES)
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 20px">{hd}</div>'
            f'{frame("The Array step on tablet", tablet_screen(), 834, 1194)}<div style="padding: 0 20px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, "V2TouchTablet.dc.html", "V2 · 10 · Phone and tablet · tablet 834", 834, 2460, body)


def build_phone() -> None:
    hd = board_head("V2 · 10 · Phone and tablet", LINES, True, ISSUES)
    screens = (frame("Peek", phone_stop("peek"), 390, 844) + frame("Half", phone_stop("half"), 390, 844)
               + frame("Full", phone_stop("full"), 390, 844) + frame("Choose a module", picker(), 390, 844))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 16px">{hd}</div>{screens}'
            f'<div style="padding: 0 16px">{targets()}</div><div style="padding: 0 16px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, "V2TouchPhone.dc.html", "V2 · 10 · Phone and tablet · phone 390", 390, 5610, body)


if __name__ == "__main__":
    build_desktop()
    build_tablet()
    build_phone()
