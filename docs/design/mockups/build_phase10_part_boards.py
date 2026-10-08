"""Writes two boards of Phase 10, step 0 (plan/phase-10-plan.md): OpenProject.dc.html, "Open a project", and
Present.dc.html, "Present".

The first draws the dialog Open a project (plan decision 4) and its states: over the dimmed Home on desktop with the
file drop at rest and Open waiting; a format 2 file read with its facts; a format 1 file read with the engine's notes
on the files to choose again, word for word; a file refused in the engine's words (not an .rtd; a format this version
does not read); and the dialog as a bottom sheet on phone, at rest and read. The words of the engine come from
home_data.json beside this file (`words`), never typed; the file's name follows the API's file_stem, mirrored in
build_phase9_part_boards.py; the format of a file this app writes is the document's in handover_data.json.

The second draws Present mode (plan decisions 8 to 10): the stage alone on a desktop screen of 1440 by 900, no chrome,
the drawn 3D of Main.dc.html scaled to fill, the words of the moment at the bottom left and the hint at the bottom
right; then the six stages of the tour as frames of 400 by 250 with a caption under each, in two rows of three
(six in a row would be 2,544 wide, more than the board), each drawn from the approved boards' pieces: the imagery of
the Find boards, the 3D of the Sun and Strings builders, the hero number and the cascade of the Performance builders;
and the line on reduced motion. The phone has no Present (the top bar has none), so no phone part is drawn.

Every colour is a token of docs/design/design-tokens.md, by way of the constants of the earlier builders.

Run it in this folder: python3 build_phase10_part_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json

from build_phase3_boards import (
    ACCENT,
    CHROME,
    CLOSE,
    DISPLAY,
    GROUND,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    NOTE_LINE,
    NOTE_SURFACE,
    SHADOW_PANEL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    UPLOAD,
    card,
    drop,
    icon,
    icon_button,
    note,
    primary,
    quiet,
    secondary,
    state,
)
from build_phase4_boards import imagery, scale_and_credit
from build_phase4_obstacles_by_hand import disabled_primary
from build_phase5_roof_boards import frame, piece
from build_phase6_state_boards import (
    AC_UNITS,
    GLASS,
    GRID_LINE,
    PARAPET_CAP,
    PARAPET_H,
    PARAPET_LIT,
    PARAPET_SHADE,
    ROOF,
    STAIR,
    TANK,
    WALL_EDGE_LIT,
    WALL_EDGE_SHADE,
    WALL_LIT,
    WALL_SHADE,
    WALLS,
    cylinder,
    depth,
    fit,
    fmt,
    frame_crop,
    notes,
    pill,
    prism,
    roof_points,
)
from build_phase6_sun_boards import scene as sun_scene
from build_phase7_state_boards import A as OPTION_A
from build_phase7_state_boards import FILE, MODULES, fills_of, strings_scene
from build_phase8_part_boards import E as ENERGY
from build_phase8_part_boards import bar, dimmed_stage, lead_number, n1, scale_of, spans
from build_phase9_handover_boards import secondary as wide_secondary
from build_phase9_part_boards import DOCUMENT, file_stem

DATA = json.loads((HERE / "home_data.json").read_text(encoding="utf-8"))
HOME = (HERE / "Home.dc.html").read_text(encoding="utf-8")
MAIN = (HERE / "Main.dc.html").read_text(encoding="utf-8")


def n2(value: float) -> str:
    return f"{value:,.2f}"


# Tokens this file needs beyond the earlier builders'.
COLOR_DIM = "rgba(5,7,10,0.72)"  # --color-dim: over the screen, under a dialog and under a bottom sheet

SCREEN_W, SCREEN_H = 1440, 900  # the desktop screen at the top of each board

# The boards are as high as what is on them (measured from a render).
OPEN_PROJECT_HEIGHT = 3446
PRESENT_HEIGHT = 1703

# --------------------------------------------------------------------------------------------------
# The words and the facts
# --------------------------------------------------------------------------------------------------

DEMO = DATA["demo_card"]
WORDS = DATA["words"]
FORMAT1_NOTES = WORDS["format1_not_included"]
NAME = DEMO["name"]
RTD_NAME = f"{file_stem(NAME)}.rtd"
FORMAT = DOCUMENT["format"]  # the format this app writes: 2
FACTS = f"{n2(DEMO['dc_kwp'])} kWp · {n1(DEMO['energy_mwh'])} MWh a year"
FORMAT1_NAME = "Test project"  # the desktop app's sample, whose files Test.PAN and Test-S.ond the engine names
FORMAT1_FILE = f"{file_stem(FORMAT1_NAME)}.rtd"
UNREADABLE_NAME = "roof-notes.txt"
FORMAT3_FILE = "Warehouse-7.rtd"
DROP_TITLE = "Drop the project file here"
DROP_DETAIL = "An .rtd file saved by this app"
DIALOG_SENTENCE = "A project saved by this app. It opens in the Studio and runs again here."
NOT_LOADED = "This file was not loaded"
PRESENT_WORDS = WORDS["present_words"]
PRESENT_HINT = WORDS["present_hint"]
REDUCED_MOTION = "Under reduced motion each stage is a cut held for its time."

assert FORMAT == 2, "the format this app writes is 2 (plan phase 9)"
assert PRESENT_WORDS == f"{NAME} · {FACTS}", "the words of the moment are the card's facts"

# --------------------------------------------------------------------------------------------------
# Board 1: Open a project
# --------------------------------------------------------------------------------------------------


def words_of(title: str, detail: str, mono_title: bool = False, lines: tuple[str, ...] = ()) -> str:
    """The words of a file drop: a title (the file's name in mono once it is read) and its lines under it."""
    title_ = f'<code style="font-size: 13px; font-weight: 500; color: {TEXT}">{title}</code>' if mono_title else f'<span style="font-weight: 500">{title}</span>'
    rest = "".join(f'<span style="font-size: 12px; color: {TEXT_2}">{line}</span>' for line in (detail, *lines) if line)
    return f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">{title_}{rest}</span>'


def drop_rest(touch: bool = False) -> str:
    """The file drop at rest (components.md "File drop"): dashed line-strong, the upload icon in text-2."""
    look = f"border: 1px dashed {LINE_STRONG}"
    if touch:
        return phone_drop(look, icon(UPLOAD, 20, TEXT_2, 1.8) + words_of(DROP_TITLE, DROP_DETAIL), "Choose a file")
    return drop(look, icon(UPLOAD, 20, TEXT_2, 1.8) + words_of(DROP_TITLE, DROP_DETAIL) + secondary("Choose a file", 36))


def drop_read(file: str, format_: int, name: str, facts: str, touch: bool = False) -> str:
    """The file read and kept in the dialog: surface-2, the file icon in accent, the name in mono, the lines of what
    was read, "Choose another"."""
    look = f"background: {SURFACE_2}; border: 1px solid {LINE}"
    inside = f'<span style="display: flex; padding-top: 2px">{icon(FILE, 20, ACCENT, 1.8)}</span>' + words_of(file, f"Format {format_} · {name}", mono_title=True, lines=(facts,))
    if touch:
        return phone_drop(look, inside, "Choose another")
    return (
        f'<div role="status" style="display: flex; align-items: flex-start; gap: 14px; box-sizing: border-box; padding: 16px 18px; border-radius: 12px; {look}">'
        f"{inside}{secondary('Choose another', 36)}</div>"
    )


def drop_refused(reason: str, touch: bool = False) -> str:
    """The file refused: note-surface with the note line, the note of 20, the reason in the engine's words."""
    look = f"background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}"
    inside = f'<span style="display: flex; padding-top: 2px">{note(20)}</span>' + words_of(NOT_LOADED, reason)
    if touch:
        return phone_drop(look, inside, "Choose another")
    return (
        f'<div role="status" style="display: flex; align-items: flex-start; gap: 14px; box-sizing: border-box; padding: 16px 18px; border-radius: 12px; {look}">'
        f"{inside}{secondary('Choose another', 36)}</div>"
    )


def phone_drop(look: str, inside: str, button: str) -> str:
    """The file drop on phone: the button under the words, as wide as the field, 44 high (components.md)."""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; padding: 16px 18px; border-radius: 12px; {look}">'
        f'<div style="display: flex; align-items: flex-start; gap: 14px">{inside}</div>{wide_secondary(button, 44, 12, full=True)}</div>'
    )


def engine_notes(sentences: list[str]) -> str:
    """The engine's notes under the field, each a row on note-surface with the note of 16 and the words word for word."""
    rows = "".join(
        f'<div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 10px; font-size: 13px; color: {TEXT_2}">'
        f'<span style="display: flex; padding-top: 2px">{note(16)}</span><span>{words}</span></div>'
        for words in sentences
    )
    return f'<div role="status" style="display: flex; flex-direction: column; gap: 8px">{rows}</div>'


def open_dialog(drop_html: str, notes_html: str = "", can_open: bool = False, tag: str = "op") -> str:
    """The dialog of components.md: 440 wide, the title in the display face, one sentence, the file drop, the notes
    where there are any, Cancel quiet and Open primary, shown as it cannot be pressed until a file is read."""
    actions = quiet("Cancel") + (primary("Open") if can_open else disabled_primary("Open"))
    return (
        f'<div role="dialog" aria-labelledby="{tag}-t" aria-describedby="{tag}-d" style="width: 440px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 22px 22px 20px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="{tag}-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Open a project</h3>'
        + icon_button("Close", CLOSE, 32)
        + "</div>"
        f'<p id="{tag}-d" style="margin: 0; color: {TEXT_2}">{DIALOG_SENTENCE}</p>'
        + drop_html
        + notes_html
        + f'<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px">{actions}</div></div>'
    )


def phone_sheet(drop_html: str, can_open: bool = False) -> str:
    """The dialog on phone: a bottom sheet with the drag handle, the actions under each other, the primary one on top
    (48 high), the quiet one (44) last; no button to close (components.md "Dialog")."""
    open_ = (primary("Open", 48) if can_open else disabled_primary("Open", 48)).replace("flex-shrink: 0;", "width: 100%; box-sizing: border-box;", 1)
    return (
        f'<div role="dialog" aria-label="Open a project" style="display: flex; flex-direction: column; gap: 12px; padding: 8px 16px 16px; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0">'
        f'<div style="display: flex; justify-content: center; padding: 0 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        f'<div style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Open a project</div>'
        f'<div style="font-size: 15px; color: {TEXT_2}">{DIALOG_SENTENCE}</div>'
        f"{drop_html}"
        f'<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px">{open_}{quiet("Cancel", 44)}</div></div>'
    )


def phone_screen(sheet: str, label: str) -> str:
    """A phone of 390: the screen dimmed under the sheet, which stands at the bottom."""
    return (
        f'<div aria-label="{label}" style="width: 390px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; border-radius: 12px; '
        f'border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f'<div style="height: 160px; background: {COLOR_DIM}"></div>{sheet}</div>'
    )


def home_with_dialog(dialog: str) -> str:
    """The approved Home, dimmed in color-dim, with the dialog in the middle of the screen: the desktop screen whole."""
    root = piece(HOME, '<div style="position: relative; width: 1440px; height: 900px', "</x-dc>", keep_end=False)
    return (
        f'<div aria-label="Open a project over Home, desktop" style="position: relative; width: {SCREEN_W}px; height: {SCREEN_H}px; flex-shrink: 0; overflow: hidden; color: {TEXT}; font-size: 15px; line-height: 22px">'
        f'<div style="position: absolute; left: 0; top: 0" aria-hidden="true">{root}</div>'
        f'<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: {COLOR_DIM}; font-size: 14px; line-height: 20px">{dialog}</div></div>'
    )


def over_home_card() -> str:
    side = notes(
        "Above, the screen on desktop 1440 × 900: the dialog of components.md (340 to 440 wide; here 440, as Import a drawing has it), over Home dimmed in color-dim: the title “Open a project” in the display "
        "face, a quiet close button of 32, one sentence of what a project file is and what happens to it, the file drop of the kit at rest (dashed line-strong, the upload icon, “Drop the project file here”, "
        "“An .rtd file saved by this app”, “Choose a file”), then Cancel quiet and Open primary at the right.",
        "Open is shown and cannot be pressed (opacity-disabled, no shadow) until a file is read: the dialog's primary action waits for the field, as the dialog of a height does. The focus goes to Cancel, which "
        "changes nothing. The same dialog opens from Home's card “Open a project” and from the project switcher's row “Open a project (.rtd)”, live with this phase (plan step 9).",
        "The file is read at once when it is dropped or chosen, through POST /project/open with the engine's Project.from_json (decision 4): the web parses no .rtd itself. What comes back is the next card.",
    )
    return card("The dialog over Home", side, gap=14)


def read_card() -> str:
    format2 = dimmed_stage(open_dialog(drop_read(RTD_NAME, FORMAT, NAME, FACTS), can_open=True, tag="op2"), 420)
    format1 = dimmed_stage(
        open_dialog(drop_read(FORMAT1_FILE, 1, FORMAT1_NAME, "Capacity and energy come with the run in the Studio"), engine_notes(FORMAT1_NOTES), can_open=True, tag="op3"),
        540,
    )
    side = notes(
        f"A file read (the drop's state “Read, kept in the dialog”): surface-2 with the line, the file icon in accent, the file's name in mono as the API writes it, “{RTD_NAME}”, then the lines of what was "
        f"read, one under the other: “Format {FORMAT} · {NAME}” and “{FACTS}”. Open is live and opens the document in the Studio at the Roof lens; the design runs again there (/layout, /design), as the "
        "desktop app does: the results are never in the file.",
        f"A format 1 file, written by the desktop app, names its module and inverter files by path without their text. The engine says so, and the dialog shows its two sentences under the field as notes, word "
        f"for word, each on note-surface with the note mark of 16: “{FORMAT1_NOTES[0]}” and “{FORMAT1_NOTES[1]}”. Nothing is added to them. Open stays live: the project opens, and the files are chosen "
        "again in the Array and Strings lenses (Replace).",
        f"A format 1 file carries no capacity and no energy, so its second line says that both come with the run; nothing is typed for it. The name “{FORMAT1_NAME}” is the desktop app's sample, whose "
        "files the engine names in its sentences.",
    )
    return card(
        "A file read",
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start">'
        + state(f"A format {FORMAT} file saved by this app: its name, its format, its facts; Open live", format2)
        + state("A format 1 file of the desktop app: the engine's two notes on the files to choose again; Open live", format1)
        + "</div>"
        + side,
        gap=14,
    )


def refused_card() -> str:
    not_rtd = dimmed_stage(open_dialog(drop_refused(WORDS["not_an_rtd"]), tag="op4"), 420)
    format3 = dimmed_stage(open_dialog(drop_refused(WORDS["unsupported_format"]), tag="op5"), 420)
    side = notes(
        f"A file refused (the drop's state “Refused”): note-surface with the note line, the note of 20, “{NOT_LOADED}” and the reason in the words of the engine. A text file that is no JSON: "
        f"“{WORDS['not_an_rtd']}”. A project file of a format this version does not read: “{WORDS['unsupported_format']}”.",
        "Open cannot be pressed; “Choose another” opens the file chooser again, and Cancel leaves the design that is open as it is (D32: nothing is lost without a word). No red, no cross: the "
        "exclamation mark and the reason.",
    )
    return card(
        "A file refused",
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start">'
        + state(f"{UNREADABLE_NAME} dropped: not a project file, in the engine's words", not_rtd)
        + state(f"{FORMAT3_FILE} dropped: a format 3 file, which this version does not read", format3)
        + "</div>"
        + side,
        gap=14,
    )


def phone_card() -> str:
    rest = phone_screen(phone_sheet(drop_rest(touch=True)), "Open a project on phone, at rest")
    read = phone_screen(phone_sheet(drop_read(RTD_NAME, FORMAT, NAME, FACTS, touch=True), can_open=True), "Open a project on phone, the file read")
    side = notes(
        "On phone the dialog is a bottom sheet over the dimmed screen (components.md “Dialog”, phone): color-chrome, the top corners radius-panel, the drag handle of 40 by 4, the title in the display face "
        "22 / 28, the sentence in body text 15, the file drop with its button under the words, as wide as the field and 44 high, so the field is higher than 88; then the actions under each other, Open 48 "
        "high on top, Cancel quiet 44 last. The handle closes the sheet by a press or a drag downwards; there is no button to close.",
        "The states are the desktop's: at rest with Open waiting; read with the file's name in mono and its lines, Open live. A refusal and a format 1 file's notes stand in the sheet the same way, the "
        "notes between the field and the actions.",
    )
    return card(
        "On phone",
        '<div style="display: grid; grid-template-columns: 390px 390px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Phone 390: the sheet, the drop at rest, Open waiting", rest)
        + state("Phone 390: the file read, Open live", read)
        + side
        + "</div>",
        gap=14,
    )


def open_project_board() -> str:
    width, height = SCREEN_W, OPEN_PROJECT_HEIGHT
    head = (
        '<div style="display: flex; align-items: flex-end; gap: 40px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Open a project</h1>'
        f'<p style="margin: 0 0 2px; max-width: 760px; color: {TEXT_2}">The dialog from Home and from the project switcher: the file drop for an .rtd, a file read with its facts, a format 1 file with the engine\'s notes on the files to '
        "choose again, a file refused in the engine's words, Open the primary action; on phone a bottom sheet.</p></div>"
    )
    cards = '<div style="display: flex; flex-direction: column; gap: 16px">' + over_home_card() + read_card() + refused_card() + phone_card() + "</div>"
    below = f'<section style="display: flex; flex-direction: column; gap: 24px; padding: 36px 56px 48px; border-top: 1px solid {LINE_SUBTLE}">{head}{cards}</section>'
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f"\n{home_with_dialog(open_dialog(drop_rest(), tag='op1'))}\n{below}\n</div>"
    )
    return frame("Open a project", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 2: Present
# --------------------------------------------------------------------------------------------------

FRAME_W, FRAME_H = 400, 250
MAIN_SVG_OPEN = '<svg viewBox="0 50 940 480" width="964" height="492"'
MAIN_FADE = '<rect y="50" width="940" height="480" fill="url(#fade)"/>'


def present_stage() -> str:
    """The stage alone on the whole screen: the drawn 3D of Main.dc.html, its viewBox opened to the screen's shape
    so that the roof is not cut, a dark gradient of the ground at the bottom, the words at the left, the hint at
    the right. Nothing else: no top bar, no rail, no inspector."""
    scale = SCREEN_W / 940
    box_h = SCREEN_H / scale
    box_y = 290 - box_h / 2  # the middle of the approved viewBox (50 + 480 / 2) stays the middle
    svg = piece(MAIN, MAIN_SVG_OPEN, "</svg>")
    assert MAIN_FADE in svg, "the fade of the Main board's 3D is not where it was"
    svg = svg.replace(MAIN_SVG_OPEN, f'<svg viewBox="0 {box_y:.2f} 940 {box_h:.2f}" width="{SCREEN_W}" height="{SCREEN_H}"', 1)
    svg = svg.replace(MAIN_FADE, f'<rect y="{box_y:.2f}" width="940" height="{box_h:.2f}" fill="url(#fade)"/>', 1)
    return (
        f'<main aria-label="Present" style="position: relative; width: {SCREEN_W}px; height: {SCREEN_H}px; flex-shrink: 0; overflow: hidden; background: {GROUND}; color: {TEXT}">'
        f'<div style="position: absolute; inset: 0">{svg}</div>'
        f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 180px; background: linear-gradient(to bottom, rgba(11,14,19,0), rgba(11,14,19,0.88))"></div>'
        f'<div style="position: absolute; left: 40px; bottom: 28px; font-size: 13px; line-height: 20px; color: {TEXT_2}">{PRESENT_WORDS}</div>'
        f'<div style="position: absolute; right: 40px; bottom: 28px; font-size: 12px; line-height: 20px; color: {TEXT_3}">{PRESENT_HINT}</div>'
        "</main>"
    )


# One view for the 3D of the tour's frames, so that every stage frames the roof the same way.
VIEW = fit(roof_points(), FRAME_W, FRAME_H, pad=(0.04, 0.12, 0.04, 0.14))


class Lifted:
    """A view whose roof plane stands at another height: the building while it rises."""

    def __init__(self, view, z0: float):
        self.view, self.z0 = view, z0
        self.width, self.height = view.width, view.height

    def px(self, x: float, y: float, z: float = 0.0) -> tuple[float, float]:
        return self.view.px(x, y, z + self.z0)


def satellite_frame() -> str:
    """Stage 1: the satellite from above with the roof's outline, as Find draws it, before the tilt into 3D."""
    scale = 3.2  # pixels per metre: the roof of 90 by 40 is 288 by 128 in the frame, over the scale and the credit
    ox = (FRAME_W - 90 * scale) / 2
    oy = 40 * scale + 36
    credit = f'<div style="position: absolute; left: 12px; bottom: 10px; width: 376px; color: {TEXT}">{scale_and_credit(round(10 * scale), "10 m")}</div>'
    return frame_crop(FRAME_W, FRAME_H, imagery(FRAME_W, FRAME_H, scale, ox, oy) + credit)


def rising_scene(view, tag: str, label: str, share: float) -> str:
    """Stage 2: the building and the obstacles at a share of their height, the roof plane lifted with them."""
    z0 = -6 + 6 * share
    v = Lifted(view, z0)
    w, h = view.width, view.height
    o = [f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="position: absolute; left: 0; top: 0" role="img" aria-label="{label}">']
    o.append(
        f'<defs><radialGradient id="fade-{tag}" cx="50%" cy="52%" r="62%"><stop offset="55%" stop-color="{GROUND}" stop-opacity="0"/><stop offset="100%" stop-color="{GROUND}" stop-opacity="1"/></radialGradient></defs>'
    )
    grid = []
    for gx in range(-60, 161, 10):
        grid.append(f'<line x1="{view.px(gx, -50, -6)[0]:.1f}" y1="{view.px(gx, -50, -6)[1]:.1f}" x2="{view.px(gx, 110, -6)[0]:.1f}" y2="{view.px(gx, 110, -6)[1]:.1f}"/>')
    for gy in range(-50, 111, 10):
        grid.append(f'<line x1="{view.px(-60, gy, -6)[0]:.1f}" y1="{view.px(-60, gy, -6)[1]:.1f}" x2="{view.px(160, gy, -6)[0]:.1f}" y2="{view.px(160, gy, -6)[1]:.1f}"/>')
    o.append(f'<g stroke="{GRID_LINE}" stroke-width="1">{"".join(grid)}</g>')
    o.append(f'<rect width="{w}" height="{h}" fill="url(#fade-{tag})"/>')
    roof_px = [v.px(0, 0), v.px(90, 0), v.px(90, 40), v.px(0, 40)]
    o.append(f'<polygon points="{fmt(roof_px)}" fill="{ROOF}"/>')
    o.append(f'<polygon points="{fmt([v.px(1, 1), v.px(89, 1), v.px(89, 39), v.px(1, 39)])}" fill="none" stroke="{PARAPET_SHADE}" stroke-width="1" stroke-dasharray="4 3"/>')
    parapet = PARAPET_H * share
    o.append(f'<polygon points="{fmt([v.px(0, 39.8, 0), v.px(90, 39.8, 0), v.px(90, 39.8, parapet), v.px(0, 39.8, parapet)])}" fill="{PARAPET_LIT}"/>')
    o.append(f'<polygon points="{fmt([v.px(89.8, 0, 0), v.px(89.8, 40, 0), v.px(89.8, 40, parapet), v.px(89.8, 0, parapet)])}" fill="{PARAPET_SHADE}"/>')
    for wall in (WALLS[1], WALLS[3]):
        o.append(f'<polygon points="{fmt(v.px(x, y, parapet) for x, y in wall)}" fill="{PARAPET_CAP}"/>')
    items = [(depth(22.5, 18.0), prism(v, STAIR, 3.0 * share))]
    cx, cy, r, th = TANK
    items.append((depth(cx, cy), cylinder(v, cx, cy, r, th * share)))
    for a in AC_UNITS:
        items.append((depth(a[0][0] + 0.75, 3.5), prism(v, a, 1.2 * share)))
    items.sort(key=lambda it: -it[0])
    o.extend(svg for _, svg in items)
    o.append(f'<polygon points="{fmt([view.px(0, 0, -6), view.px(90, 0, -6), v.px(90, 0, parapet), v.px(0, 0, parapet)])}" fill="{WALL_LIT}"/>')
    o.append(f'<polygon points="{fmt([view.px(0, 0, -6), view.px(90, 0, -6), view.px(90, 0, -5.6), view.px(0, 0, -5.6)])}" fill="{WALL_EDGE_LIT}"/>')
    o.append(f'<polygon points="{fmt([view.px(0, 0, -6), view.px(0, 40, -6), v.px(0, 40, parapet), v.px(0, 0, parapet)])}" fill="{WALL_SHADE}"/>')
    o.append(f'<polygon points="{fmt([view.px(0, 0, -6), view.px(0, 40, -6), view.px(0, 40, -5.6), view.px(0, 0, -5.6)])}" fill="{WALL_EDGE_SHADE}"/>')
    for wall in (WALLS[0], WALLS[2]):
        o.append(f'<polygon points="{fmt(v.px(x, y, parapet) for x, y in wall)}" fill="{PARAPET_CAP}"/>')
    o.append("</svg>")
    return "".join(o)


def rising_frame() -> str:
    return frame_crop(FRAME_W, FRAME_H, rising_scene(VIEW, "t2", "The building and the obstacles of the Pune demo roof at half their height, rising from the ground", 0.5))


FILLED_ROWS = 3  # the rows filled when stage 3 is caught: the first three of six, from the south


def filling_frame() -> str:
    """Stage 3: the first rows filled with their glass, the rest the engine's positions as frames alone."""
    fills = {m["idx"]: GLASS if m["row"] < FILLED_ROWS else "none" for m in MODULES}
    scene = strings_scene(VIEW, "t3", f"The Pune demo roof with {FILLED_ROWS} of its 6 rows filled with modules, the other positions empty", fills)
    return frame_crop(FRAME_W, FRAME_H, scene)


def day_frame() -> str:
    """Stage 4: the day played: the engine's shadows at 16:00 on 21 December (the Sun builder's scene), the time pill."""
    scene = sun_scene(VIEW, "t4", "The Pune demo roof at 16:00 on 21 December, the shadows of the parapet, the obstacles and the rows long toward the east")
    pill_ = f'<div style="position: absolute; left: 12px; bottom: 12px">{pill("phone", 16.0, playing=True)}</div>'
    return frame_crop(FRAME_W, FRAME_H, scene + pill_)


def strings_frame() -> str:
    """Stage 5: the strings lit by MPPT, option A's, in the six series colours, the inverter where the engine places it."""
    scene = strings_scene(VIEW, "t5", "The Pune demo roof with every module coloured by its MPPT, option A, in the six series colours; the inverter INV-1 at the north edge", fills_of(OPTION_A, "mppt"), inverters=OPTION_A["inverters"])
    return frame_crop(FRAME_W, FRAME_H, scene)


CASCADE_FROM = next(i for i, s in enumerate(ENERGY["steps"]) if s["kind"] == "energy_total")  # the chain from the array's nominal energy to the grid
CASCADE_TRACK = 150
CASCADE_ROW = 12  # a step's row: the bar of 12
CASCADE_TOTAL_ROW = 20  # a total's row: its marker of 20


def small_cascade() -> str:
    """The chain's cascade drawn small: the energy steps of the run, from the array's nominal energy to the energy to
    grid, each bar from its running total before to the one after, in the colours of gain and loss (the bars of the
    Performance board at their height of 12, the track 150), the first and the last total named."""
    steps = ENERGY["steps"]
    sp = spans(steps)
    x = scale_of(sp[CASCADE_FROM:], CASCADE_TRACK)
    rows = ""
    for step, span in zip(steps[CASCADE_FROM:], sp[CASCADE_FROM:]):
        total = step["kind"] in ("energy_total", "result")
        row = CASCADE_TOTAL_ROW if total else CASCADE_ROW
        rows += f'<span style="position: relative; display: block; width: {CASCADE_TRACK}px; height: {row}px">{bar(step, span, x, row, total)}</span>'
    first, last = steps[CASCADE_FROM], steps[-1]
    label = f"font-size: 12px; line-height: 16px; color: {TEXT_2}; white-space: nowrap"
    return (
        f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="{label}">{first["label"]} <code>{n1(first["value"])}</code></span>'
        f'<div style="display: flex; flex-direction: column">{rows}</div>'
        f'<span style="{label}">{last["label"]} <code>{n1(last["value"])}</code> MWh</span></div>'
    )


def energy_frame() -> str:
    """Stage 6: the stage dimmed under color-dim, the energy as the hero number counting up to the year's MWh, the
    cascade of the chain beside it."""
    scene = strings_scene(VIEW, "t6", "The Pune demo roof dimmed under the energy of the year and the chain of its losses", fills_of(OPTION_A, "mppt"), inverters=OPTION_A["inverters"])
    over = (
        f'<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 24px; background: {COLOR_DIM}">'
        f'<div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: {TEXT_2}">Energy to grid, year 1</span>{lead_number(n1(ENERGY["energy_mwh"]), size=34, line=38, unit_size=14)}</div>'
        f"{small_cascade()}</div>"
    )
    return frame_crop(FRAME_W, FRAME_H, scene + over)


STAGES = [
    ("The satellite from above tilts into 3D", satellite_frame),
    ("The building and the obstacles rise", rising_frame),
    ("The modules fill row by row", filling_frame),
    ("The day plays with its shadows", day_frame),
    ("The strings light up by MPPT", strings_frame),
    ("The energy counts up", energy_frame),
]


def stage_frame(number: int, caption: str, frame_html: str) -> str:
    return (
        f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px">{frame_html}'
        f'<figcaption style="display: flex; align-items: baseline; gap: 10px; font-size: 13px; color: {TEXT_2}"><code style="color: {TEXT_3}">{number}</code>{caption}</figcaption></figure>'
    )


def tour_strip() -> str:
    frames = "".join(stage_frame(n + 1, caption, draw()) for n, (caption, draw) in enumerate(STAGES))
    return f'<div style="display: grid; grid-template-columns: repeat(3, {FRAME_W}px); gap: 28px 24px">{frames}</div>'


def present_board() -> str:
    width, height = SCREEN_W, PRESENT_HEIGHT
    head = (
        '<div style="display: flex; align-items: flex-end; gap: 40px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Present</h1>'
        f'<p style="margin: 0 0 2px; max-width: 760px; color: {TEXT_2}">Above, the screen on desktop 1440 × 900: the stage alone, no top bar, no rail, no inspector; the words of the moment at the bottom left over the dark gradient, the hint at the bottom right, which fades after the first loop. '
        "Below, the six stages of the tour, each caught midway, with its caption. The phone has no Present.</p></div>"
    )
    below = (
        f'<section style="display: flex; flex-direction: column; gap: 24px; padding: 36px 56px 48px; border-top: 1px solid {LINE_SUBTLE}">'
        f"{head}{tour_strip()}"
        f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">{REDUCED_MOTION}</p></section>'
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f"\n{present_stage()}\n{below}\n</div>"
    )
    return frame("Present", width, height, root)


BOARDS = {
    "OpenProject.dc.html": open_project_board,
    "Present.dc.html": present_board,
}


if __name__ == "__main__":
    for name, build in BOARDS.items():
        html = build()
        assert "bankable" not in html.lower(), name
        (HERE / name).write_text(html, encoding="utf-8")
    open_ = (HERE / "OpenProject.dc.html").read_text(encoding="utf-8")
    for words in (DROP_TITLE, DROP_DETAIL, RTD_NAME, FACTS, WORDS["not_an_rtd"], WORDS["unsupported_format"], *FORMAT1_NOTES):
        assert words in open_, words
    present = (HERE / "Present.dc.html").read_text(encoding="utf-8")
    for words in (PRESENT_WORDS, PRESENT_HINT, REDUCED_MOTION, *(caption for caption, _ in STAGES)):
        assert words in present, words
    print(", ".join(BOARDS))
