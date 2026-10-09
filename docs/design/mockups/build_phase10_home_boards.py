"""Writes three boards of Phase 10 (plan/phase-10-plan.md, step 0): HomeTablet.dc.html, "Home · tablet 834";
HomePhone.dc.html, "Home · phone 390"; and HomeDesigns.dc.html, "Home, designs on this device", a board of parts with
captions, desktop and phone.

Home on tablet and phone is the approved desktop board (Home.dc.html) laid out again in one column (decision 5): the
logo at the top left, the headline and the subtitle, the search with "Find my roof" as its primary action, Import a
drawing and Open a project as the two rows, the demo's card, "On this device". The pieces are cut from the approved
board, never redrawn: the logo, the search well, the two rows, the demo's card and the 3D illustration are its own. On
tablet the illustration stands as a strip under the subtitle; on phone there is none.

The designs on this device (decisions 5 to 7): three cards in a row of three on desktop, each with the plan of the kept
layout as its thumbnail (decision 6), the name, the roof's words, the capacity and the energy as a stat pair, "Edited …",
and a menu of 32 at the top right (Open, Rename, Duplicate, Save a copy, Delete); the Delete dialog; a card renamed in
place; the project switcher with "On this device" listing the three; the state of saving in its four states; the cards
and the switcher's sheet on phone. The words and the numbers are read from home_data.json beside this file: the demo's
card, the three kept designs (the third has no numbers and none are typed for it), the states of saving, the delete
question. The plan of a thumbnail is drawn by build_phase7_state_boards.plan_svg from the engine's positions for the
demo (strings_lens_data.json), 320 by 180 in its own units, scaled to the tile. Every colour is one of
docs/design/design-tokens.md.

Run it in this folder: python3 build_phase10_home_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json

from build_phase3_boards import (
    ACCENT,
    ARROW,
    CHEVRON,
    CHROME,
    CLOSE,
    CONTROL,
    DISPLAY,
    DOWNLOAD,
    FOLDER,
    FOOT,
    GROUND,
    HEAD,
    HERE,
    HOME,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    OK,
    PLUS,
    SHADOW_CARD,
    SHADOW_FLOAT,
    SHADOW_PANEL,
    SHADOW_RAISED,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    TICK,
    UPLOAD,
    WELL,
    card,
    icon,
    icon_button,
    menu_row,
    note,
    primary,
    quiet,
    ring,
    saved,
    state,
)
from build_phase4_obstacles_by_hand import BIN
from build_phase5_roof_boards import PHONE, frame, piece
from build_phase6_state_boards import notes
from build_phase7_state_boards import HALO_FOCUS, plan_svg
from build_phase9_part_boards import COPY

HOME_BOARD = (HERE / "Home.dc.html").read_text(encoding="utf-8")
MAIN = (HERE / "Main.dc.html").read_text(encoding="utf-8")
DATA = json.loads((HERE / "home_data.json").read_text(encoding="utf-8"))

DEMO = DATA["demo_card"]
KEPT = DATA["kept"]
WORDS = DATA["words"]
SAVING = WORDS["saving"]

# Tokens not in the shared builders.
DIM = "rgba(5,7,10,0.72)"  # color-dim

# The icons of the card's menu.
MORE = '<path d="M12 5v.01M12 12v.01M12 19v.01"/>'
PENCIL = '<path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16z"/><path d="m13.5 6.5 4 4"/>'

# The boards are as high as what is on them (measured once from a render).
TABLET_WIDTH, TABLET_HEIGHT = 834, 1194
PHONE_WIDTH, PHONE_HEIGHT = 390, 980
DESIGNS_HEIGHT = 4811

PLAN_REGION = (-3.0, -3.0, 93.0, 43.0)  # the roof of 90 by 40 with 3 m of ground about it, as the plan of the Array lens
THUMBNAIL = (320, 180)  # the kept thumbnail (decision 6)


def kwp(value: float) -> str:
    return f"{value:.2f} kWp"


def mwh(value: float) -> str:
    return f"{value:.1f} MWh"


# --------------------------------------------------------------------------------------------------
# The pieces of the approved Home board
# --------------------------------------------------------------------------------------------------

LOGO = piece(HOME_BOARD, '<svg width="30" height="30"', "</svg>")
WORDMARK = piece(HOME_BOARD, '<div style="font-family: \'Bricolage Grotesque\', Geist, sans-serif; font-weight: 600; font-size: 19px', "</div>")
ILLUSTRATION = piece(HOME_BOARD, '<svg viewBox="0 50 940 480"', "</svg>")
HEADLINE = piece(HOME_BOARD, "<h1", "</h1>")
SUBTITLE = piece(HOME_BOARD, '<p style="margin: 0; max-width: 470px', "</p>")
SEARCH = piece(HOME_BOARD, '<div style="display: flex; align-items: center; gap: 12px; height: 76px;', "</div>")
SEARCH_ICON = piece(SEARCH, '<svg width="22"', "</svg>")
SEARCH_INPUT = piece(SEARCH, "<input", ">")
FIND = piece(SEARCH, '<a href="Locate.dc.html"', "</a>")
ROWS = piece(HOME_BOARD, '<a href="Main.dc.html" style="display: flex; align-items: center; gap: 16px; height: 76px;', '<a href="Main.dc.html" style="position: absolute; right: 64px', keep_end=False)
ROWS = ROWS[: ROWS.rindex("</a>") + 4]
DEMO_CARD = piece(HOME_BOARD, '<a href="Main.dc.html" style="position: absolute; right: 64px; bottom: 56px;', "</a>")
OPEN_DEMO = piece(DEMO_CARD, '<span style="display: flex; align-items: center; gap: 8px; height: 44px;', "</span>")

SECTION_LABEL = f"font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}"
ON_THIS_DEVICE = "Designs you save appear here. Your designs are kept on this device."


def logo_header(height: int, padding: int, logo_size: int, word_size: int) -> str:
    """Home has no top bar: the logo and the name at the top left, as the approved board has them."""
    logo = LOGO.replace('width="30" height="30"', f'width="{logo_size}" height="{logo_size}"')
    words = WORDMARK.replace("font-size: 19px", f"font-size: {word_size}px")
    return (
        f'<header style="height: {height}px; flex-shrink: 0; box-sizing: border-box; display: flex; align-items: center; gap: 12px; padding: 0 {padding}px">'
        f"{logo}{words}</header>"
    )


def on_this_device(size: int = 14, body: str = "") -> str:
    inside = body or f'<div style="font-size: {size}px; color: {TEXT_2}">{ON_THIS_DEVICE}</div>'
    return f'<section aria-label="On this device" style="display: flex; flex-direction: column; gap: 6px"><div style="{SECTION_LABEL}">On this device</div>{inside}</section>'


def stat(label: str, value: str, size: int = 16) -> str:
    return (
        f'<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: {TEXT_2}">{label}</span>'
        f'<code style="font-size: {size}px; font-weight: 500">{value}</code></span>'
    )


def demo_words(size: int = 16) -> str:
    return (
        f'<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: {TEXT_2}">{DEMO["label"]}</span>'
        f'<span style="font-weight: 600; font-size: {size}px">{DEMO["name"]}</span><span style="font-size: 13px; color: {TEXT_2}">{DEMO["roof_words"]}</span></span>'
    )


# --------------------------------------------------------------------------------------------------
# Board 1: Home on tablet, 834 wide, one column of 786
# --------------------------------------------------------------------------------------------------

TABLET_PAD = 24
TABLET_COLUMN = TABLET_WIDTH - 2 * TABLET_PAD
STRIP_VIEW = (0, 140, 940, 380)  # the roof whole, the far ground cut: the illustration as a strip under the subtitle
STRIP_HEIGHT = round(TABLET_COLUMN * STRIP_VIEW[3] / STRIP_VIEW[2])
STRIP_FADE = 72  # the strip's top edge fades into the ground, as the stage's vignette does


def illustration_strip() -> str:
    svg = ILLUSTRATION.replace('viewBox="0 50 940 480" width="1040" height="531"', f'viewBox="{" ".join(str(v) for v in STRIP_VIEW)}" width="{TABLET_COLUMN}" height="{STRIP_HEIGHT}"')
    fade = f'<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 0; height: {STRIP_FADE}px; background: linear-gradient({GROUND}, rgba(11,14,19,0))"></div>'
    return f'<div style="position: relative; width: {TABLET_COLUMN}px; height: {STRIP_HEIGHT}px; overflow: hidden">{svg}{fade}</div>'


def tablet_board() -> str:
    width, height = TABLET_WIDTH, TABLET_HEIGHT
    headline = HEADLINE  # text-hero, 72 / 74: each line fits the column of 786 whole
    subtitle = SUBTITLE.replace("max-width: 470px", "max-width: 560px")
    search = SEARCH.replace("gap: 12px; height: 76px", "gap: 12px; height: 76px; width: 100%")
    demo = DEMO_CARD.replace("position: absolute; right: 64px; bottom: 56px; ", "").replace("gap: 28px; padding: 18px 22px", "gap: 28px; padding: 18px 22px; box-shadow: none")
    demo = demo.replace(
        '<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: #A9B2C0">Demo project</span>',
        '<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; color: #A9B2C0">Demo project</span>',
        1,
    )
    main = (
        f'<main style="flex-grow: 1; box-sizing: border-box; display: flex; flex-direction: column; padding: 28px {TABLET_PAD}px 48px">'
        f'<div style="display: flex; flex-direction: column; gap: 22px">{headline}{subtitle}</div>'
        f'<div style="margin-top: 16px">{illustration_strip()}</div>'
        f'<div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px">{search}{ROWS}</div>'
        f'<div style="margin-top: 20px">{demo}</div>'
        f'<div style="margin-top: 28px">{on_this_device()}</div>'
        "</main>"
    )
    root = (
        f'<div style="position: relative; width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 22px">'
        f"\n{logo_header(72, TABLET_PAD, 30, 19)}\n{main}\n</div>"
    )
    return frame("Home, tablet", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 2: Home on phone, 390 wide
# --------------------------------------------------------------------------------------------------

PHONE_PAD = 16
PHONE_COLUMN = PHONE_WIDTH - 2 * PHONE_PAD


def phone_search() -> str:
    """The search well with the button under it, as wide as the column, 48 high."""
    well = (
        f'<div style="display: flex; align-items: center; gap: 12px; height: 56px; box-sizing: border-box; padding: 0 16px; background: {WELL}; '
        f'border: 1px solid {LINE_STRONG}; border-radius: 16px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.04)">'
        f'{SEARCH_ICON.replace(chr(34) + "22" + chr(34), chr(34) + "20" + chr(34))}{SEARCH_INPUT}</div>'
    )
    button = FIND.replace("flex-shrink: 0; display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 20px", "display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 20px")
    return f'<div style="display: flex; flex-direction: column; gap: 10px">{well}{button}</div>'


def phone_rows() -> str:
    return ROWS.replace("height: 76px", "min-height: 76px; padding-top: 14px; padding-bottom: 14px").replace("padding: 0 20px", "padding: 14px 20px")


def phone_demo_card() -> str:
    """The demo's card stacked: the words, the two stats side by side, Open the demo as wide as the card, 44 high."""
    stats = f'<span style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">{stat("Capacity", kwp(DEMO["dc_kwp"]))}{stat("Energy, year 1", mwh(DEMO["energy_mwh"]))}</span>'
    open_ = OPEN_DEMO.replace("display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px", "display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 16px; border-radius: 12px")
    return (
        f'<a href="Main.dc.html" style="display: flex; flex-direction: column; gap: 16px; padding: 18px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 18px; color: {TEXT}">'
        f"{demo_words()}{stats}{open_}</a>"
    )


def phone_board() -> str:
    width, height = PHONE_WIDTH, PHONE_HEIGHT
    headline = HEADLINE.replace("font-size: 72px; line-height: 74px; letter-spacing: -0.035em", "font-size: 30px; line-height: 36px; letter-spacing: -0.02em")  # text-page
    subtitle = SUBTITLE.replace("max-width: 470px; font-size: 18px; line-height: 27px", "font-size: 15px; line-height: 22px")
    main = (
        f'<main style="flex-grow: 1; box-sizing: border-box; display: flex; flex-direction: column; padding: 20px {PHONE_PAD}px 40px">'
        f'<div style="display: flex; flex-direction: column; gap: 12px">{headline}{subtitle}</div>'
        f'<div style="margin-top: 24px; display: flex; flex-direction: column; gap: 10px">{phone_search()}{phone_rows()}</div>'
        f'<div style="margin-top: 24px">{phone_demo_card()}</div>'
        f'<div style="margin-top: 32px">{on_this_device(15)}</div>'
        "</main>"
    )
    root = (
        f'<div style="position: relative; width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 22px">'
        f"\n{logo_header(56, PHONE_PAD, 28, 17)}\n{main}\n</div>"
    )
    return frame("Home, phone", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 3: the designs on this device, parts with captions
# --------------------------------------------------------------------------------------------------

CARD_PAD = 14  # space-card-compact: the thumbnail wants the width
CARD_RADIUS = 18
TILE_RADIUS = 12  # radius-row: a tile inside a card
DESKTOP_CARD = 416  # three in a row inside the board's card: (1280 − 2 × 16) / 3
PHONE_CARD = PHONE_COLUMN
MENU_WIDTH = 240


def thumbnail(tag: str, width: int) -> str:
    """The kept thumbnail: the plan of the layout, 320 by 180 in its own units (decision 6), scaled to the tile across
    the card, on surface-2."""
    w, h = THUMBNAIL
    height = round(width * h / w)
    svg, _, _ = plan_svg(w, h, PLAN_REGION, tag, "The plan of the layout, north up: the roof, its obstacles and the module rows", {})
    svg = svg.replace(f'width="{w}" height="{h}"', f'width="{width}" height="{height}"', 1).replace(f'fill="{GROUND}"', f'fill="{SURFACE_2}"', 1)
    return f'<div style="position: relative; width: {width}px; height: {height}px; overflow: hidden; border-radius: {TILE_RADIUS}px; background: {SURFACE_2}">{svg}</div>'


def menu_button(open_: bool = False) -> str:
    look = f"background: {SURFACE_2}; border: 1px solid {LINE_STRONG}; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5)" if open_ else f"background: {CONTROL}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}"
    return (
        f'<button aria-label="Menu" aria-haspopup="menu" aria-expanded="{"true" if open_ else "false"}" style="position: absolute; right: 8px; top: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; '
        f'border-radius: 10px; cursor: pointer; {look}">{icon(MORE, 18, TEXT, 2.6)}</button>'
    )


def card_menu() -> str:
    """The card's menu open: rows of 44 as the switcher's, under the button, their right edges in line."""
    rows = (
        menu_row(ARROW, "Open", under_pointer=True)
        + menu_row(PENCIL, "Rename")
        + menu_row(COPY, "Duplicate")
        + menu_row(DOWNLOAD, "Save a copy", ".rtd")
        + menu_row(BIN, "Delete")
    )
    return (
        f'<ul role="menu" aria-label="{KEPT[0]["name"]}" style="position: absolute; z-index: 1; right: 8px; top: 46px; width: {MENU_WIDTH}px; box-sizing: border-box; list-style: none; margin: 0; '
        f'display: flex; flex-direction: column; gap: 2px; padding: 6px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">{rows}</ul>'
    )


def name_field(value: str, touch: bool = False) -> str:
    """The name renamed in place: the text field with the focus and the caret (components.md, "Text field")."""
    height = 44 if touch else 40
    caret = f'<span aria-hidden="true" style="display: inline-block; width: 1px; height: 18px; margin-left: 1px; vertical-align: text-bottom; background: {TEXT}"></span>'
    return (
        f'<span role="textbox" aria-label="Name" style="display: flex; align-items: center; height: {height}px; box-sizing: border-box; padding: 0 12px; background: {WELL}; border: 1px solid {ACCENT}; '
        f'border-radius: 10px; font-size: {15 if touch else 14}px; font-weight: 500; box-shadow: {HALO_FOCUS}">{value}{caret}</span>'
    )


def card_stats(design: dict, size: int = 16) -> str:
    """The stat pair in mono; a design without numbers says what waits, in words."""
    if design["dc_kwp"] is None:
        words = "Waiting for a system voltage" if "voltage" in design.get("note", "") else "Not run yet"
        return f'<div style="display: flex; align-items: center; min-height: 42px; font-size: 13px; color: {TEXT_2}">{words}</div>'
    return f'<div style="display: flex; gap: 28px">{stat("Capacity", kwp(design["dc_kwp"]), size)}{stat("Energy, year 1", mwh(design["energy_mwh"]), size)}</div>'


def design_card(design: dict, tag: str, width: int = DESKTOP_CARD, menu: bool = False, renamed: str = "", touch: bool = False) -> str:
    inner = width - 2 * CARD_PAD - 2
    name = name_field(renamed, touch) if renamed else f'<span style="font-weight: 600; font-size: 16px; line-height: 20px">{design["name"]}</span>'
    return (
        f'<article aria-label="{design["name"]}" style="position: relative; width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: {CARD_PAD}px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: {CARD_RADIUS}px; box-shadow: {SHADOW_CARD}; color: {TEXT}; font-size: {15 if touch else 14}px; line-height: 20px">'
        f'<div style="position: relative">{thumbnail(tag, inner)}{menu_button(menu)}{card_menu() if menu else ""}</div>'
        f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 0 4px">{name}<span style="font-size: 12px; color: {TEXT_2}">{design["roof_words"]}</span></div>'
        f'<div style="padding: 0 4px">{card_stats(design)}</div>'
        f'<div style="padding: 0 4px; font-size: 12px; color: {TEXT_3}">{design["edited"]}</div>'
        "</article>"
    )


def cards_row(tags: str, menu_on_first: bool = False) -> str:
    return (
        f'<div style="display: grid; grid-template-columns: repeat(3, {DESKTOP_CARD}px); gap: 16px; align-items: start">'
        + "".join(design_card(d, f"{tags}{n}", menu=menu_on_first and n == 0) for n, d in enumerate(KEPT))
        + "</div>"
    )


def home_section(tags: str, menu_on_first: bool = False) -> str:
    """The section "On this device" of the approved board with the cards in the place of its sentence."""
    return on_this_device(body=f'<div style="font-size: 14px; color: {TEXT_2}">Your designs are kept on this device.</div><div style="margin-top: 10px">{cards_row(tags, menu_on_first)}</div>')


def cards_card() -> str:
    body = (
        state("Desktop 1440: three cards of 416 in a row; the first card's menu open", home_section("a", menu_on_first=True), gap=10)
        + notes(
            "A card: the plan of the kept layout as its thumbnail (decision 6: 320 by 180 in its own units, scaled across the card on surface-2; every card here shows the demo's plan, since the data "
            "holds no layout of the other two), the name in text-title, the roof's words in text-caption, the capacity and the energy as a stat pair in mono, “Edited …” in text-caption text-3. "
            "A press on the card opens the design.",
            "The menu button of 32 stands at the top right of the card, over the thumbnail; its list is the switcher's: rows of 44 with an icon of 18 and a fact at the right, 240 wide, 6 under the "
            f"button. Duplicate makes “Copy of {KEPT[0]['name']}” and opens it; Save a copy is the .rtd of Phase 9; Delete asks (decision 7). The second card has no numbers: before a system voltage it says what waits. The third has "
            "not run: “Not run yet”; a value that cannot exist yet is absent with its reason (guidelines.md), never 0.",
        )
    )
    return card("On this device, the cards", body, gap=14)


def delete_dialog(touch: bool = False) -> str:
    question, body = WORDS["delete_question"].split("? ", 1)
    if touch:
        return (
            f'<div role="dialog" aria-label="{question}?" style="display: flex; flex-direction: column; gap: 10px; padding: 8px 16px 16px; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0">'
            f'<div style="display: flex; justify-content: center; padding: 0 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
            f'<div style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">{question}?</div>'
            f'<div style="font-size: 15px; color: {TEXT_2}">{body}</div>'
            f'<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px">{primary("Delete", 48)}{quiet("Cancel", 44)}</div></div>'
        )
    return (
        f'<div role="dialog" aria-labelledby="del-t" aria-describedby="del-d" style="width: 400px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; padding: 22px 22px 20px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="del-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">{question}?</h3>{icon_button("Close", CLOSE, 32)}</div>'
        f'<p id="del-d" style="margin: 0; color: {TEXT_2}">{body}</p>'
        f'<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px">{quiet("Cancel")}{primary("Delete")}</div></div>'
    )


def dimmed_over(inside: str, over: str) -> str:
    return (
        f'<div style="position: relative; border-radius: 12px; overflow: hidden">{inside}'
        f'<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: {DIM}">{over}</div></div>'
    )


def delete_card() -> str:
    screen = f'<div style="padding: 20px; background: {GROUND}; border: 1px solid {LINE}; border-radius: 12px">{home_section("d")}</div>'
    body = (
        state("Desktop: Delete asks in a dialog over the dimmed screen", dimmed_over(screen, delete_dialog()), gap=10)
        + notes(
            f"The question is the data's, word for word: the first sentence as the title, the second as the body. Cancel is the quiet action and takes the focus first, so that Enter by mistake does "
            "no harm; Delete is the primary one. On phone the dialog is a bottom sheet with Delete on top (components.md, “Dialog”). Nothing is lost without a word (D32).",
        )
    )
    return card("Delete", body, gap=14)


def rename_card() -> str:
    typed = f"{KEPT[0]['name']}, block B"
    body = (
        f'<div style="display: grid; grid-template-columns: {DESKTOP_CARD}px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Desktop: a card renamed in place, the name as a text field with the caret", design_card(KEPT[0], "r", renamed=typed), gap=10)
        + notes(
            "Rename turns the name into the text field of components.md, across the card, 40 high (44 on touch), with the focus: accent border and the halo. Enter or leaving the field commits the "
            "name, trimmed, 200 characters at most; Escape gives the name of before back; an empty name is not committed and the field says “A name is needed” under itself.",
            "The committed name is the design's everywhere at once: the card, the switcher, the top bar, the file name of every download.",
        )
        + "</div>"
    )
    return card("Rename", body, gap=14)


# The project switcher with the designs on this device.


def saving_line(kind: str, size: int = 12) -> str:
    marks = {
        "saved": f'<span style="width: 7px; height: 7px; border-radius: 50%; background: {OK}; animation: live 2.4s ease-in-out infinite"></span>',
        "saving": ring(12, 1.5),
        "not_kept": f'<span style="width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {TEXT_3}"></span>',
        "not_saved": note(16),
    }
    return f'<span style="display: flex; align-items: center; gap: 8px; font-size: {size}px; color: {TEXT_2}">{marks[kind]}{SAVING[kind]}</span>'


def device_row(design: dict, open_: bool, touch: bool = False) -> str:
    """A design kept on the device: a row of 44 with its name and a fact under it (the capacity, or the roof's words);
    the open one with the tick in accent."""
    fact = kwp(design["dc_kwp"]) if design["dc_kwp"] is not None else design["roof_words"]
    fact_ = f'<code style="font-size: 12px; line-height: 16px; color: {TEXT_3}">{fact}</code>' if design["dc_kwp"] is not None else f'<span style="font-size: 12px; line-height: 16px; color: {TEXT_3}">{fact}</span>'
    mark = icon(TICK, 16, ACCENT, 2.4) if open_ else '<span style="width: 16px; flex-shrink: 0"></span>'
    weight = 500 if open_ else 400
    return (
        f'<li><a href="Main.dc.html" aria-current="{"true" if open_ else "false"}" style="display: flex; align-items: center; gap: 10px; min-height: {48 if touch else 44}px; box-sizing: border-box; padding: 4px 10px; border-radius: 8px; color: {TEXT}">'
        f'{mark}<span style="min-width: 0; display: flex; flex-direction: column"><span style="font-weight: {weight}; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{design["name"]}</span>{fact_}</span></a></li>'
    )


def switcher_inside(touch: bool = False) -> str:
    label = f"padding: 8px 10px 4px; {SECTION_LABEL}"
    this_design = (
        f'<div style="display: flex; align-items: center; gap: 10px; padding: 6px 10px 10px">{icon(TICK, 16, ACCENT, 2.4)}'
        f'<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">{KEPT[0]["name"]}</span>{saving_line("saved")}</span>'
        f'<button aria-label="Rename" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}; cursor: pointer">{icon(PENCIL, 18, TEXT_2, 1.8)}</button></div>'
    )
    designs = '<ul aria-label="On this device" style="list-style: none; margin: 0; padding: 0 0 4px; display: flex; flex-direction: column; gap: 2px">' + "".join(device_row(d, n == 0, touch) for n, d in enumerate(KEPT)) + "</ul>"
    actions = (
        '<ul role="menu" aria-label="Project" style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px">'
        + menu_row(PLUS, "New design", "Find the roof")
        + menu_row(FOLDER, "Open a project", ".rtd")
        + menu_row(UPLOAD, "Import a drawing", "KMZ, KML, DXF")
        + menu_row(DOWNLOAD, "Save a copy", ".rtd")
        + menu_row(HOME, "Home")
        + "</ul>"
    )
    return (
        f'<div style="{label}">This design</div>{this_design}'
        f'<div style="height: 1px; margin: 0 4px; background: {LINE}"></div>'
        f'<div style="{label}">On this device</div>{designs}'
        f'<div style="height: 1px; margin: 0 4px 4px; background: {LINE}"></div>{actions}'
    )


def switcher_desktop() -> str:
    trigger = (
        f'<button aria-haspopup="menu" aria-expanded="true" style="align-self: flex-start; display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; background: {SURFACE_2}; border: 1px solid {LINE}; border-radius: 10px; cursor: pointer">'
        f'<span style="font-weight: 500">{KEPT[0]["name"]}</span><span style="color: {TEXT_3}; {MONO}; font-size: 12px">18.52° N · 73.86° E</span>'
        f'<span style="display: flex; transform: rotate(180deg)">{icon(CHEVRON, 16, TEXT_3)}</span></button>'
    )
    panel = (
        f'<div style="width: 340px; box-sizing: border-box; display: flex; flex-direction: column; padding: 6px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">'
        f"{switcher_inside()}</div>"
    )
    return f'<div style="display: flex; flex-direction: column; gap: 6px">{trigger}{panel}</div>'


def switcher_sheet() -> str:
    return (
        f'<div style="display: flex; flex-direction: column; padding: 8px 10px 16px; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0">'
        f'<div style="display: flex; justify-content: center; padding: 0 0 8px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        f"{switcher_inside(touch=True)}</div>"
    )


def switcher_card() -> str:
    body = (
        '<div style="display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Desktop: the project switcher open, the three designs under “On this device”", switcher_desktop(), gap=6)
        + notes(
            "“This design” is the demo edited and kept: the tick in accent, “Saved on this device” with its dot, and Rename. “On this device” lists the designs kept here, newest first, rows of 44: the name, "
            "and under it the capacity in mono where a run has come, else the roof's words. The fact stands under the name rather than at its right, since the names and the roof's words are long and the "
            "panel is 340. The open design carries the tick; a press on another row opens it.",
            "Open a project is live now (Phase 10, step 9). On phone and tablet the switcher is a bottom sheet over the dimmed screen, the state of saving said here only.",
        )
        + "</div>"
    )
    return card("Project switcher, the designs on this device", body, gap=14)


# The state of saving in the top bar.


def saving_mark(kind: str) -> str:
    if kind == "not_saved":
        return f'<button style="display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px; margin-left: -10px; background: transparent; border: 0; border-radius: 10px; font-size: 13px; cursor: pointer">{note(16)}{SAVING[kind]}</button>'
    marks = {
        "saved": f'<span style="width: 7px; height: 7px; border-radius: 50%; background: {OK}; animation: live 2.4s ease-in-out infinite"></span>',
        "saving": ring(12, 1.5),
        "not_kept": f'<span style="width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid {TEXT_3}"></span>',
    }
    return saved(marks[kind], SAVING[kind])


def top_bar_with(kind: str) -> str:
    """The top bar of Main.dc.html at its width of 1440 with the state of saving swapped in."""
    header = piece(MAIN, "<header", "</header>")
    saved_ = piece(header, '<div style="display: flex; align-items: center; gap: 8px; color: #A9B2C0; font-size: 13px">', "Saved on this device</div>")
    swapped = header.replace(saved_, saving_mark(kind)).replace(f"border-bottom: 1px solid {LINE_SUBTLE}", f"border-top: 1px solid {LINE_SUBTLE}; border-bottom: 1px solid {LINE_SUBTLE}")
    return f'<div style="width: 1440px; margin: 0 -56px">{swapped}</div>'


def saving_card() -> str:
    captions = {
        "saved": "Saved: the dot of 7 in color-ok, pulsing",
        "saving": "Saving: a ring of 12 turning",
        "not_kept": "The demo, until it is edited: a hollow dot",
        "not_saved": "Could not be saved: a note of 16; a button that opens the notes",
    }
    side_by_side = '<div style="display: flex; align-items: flex-start; gap: 36px">' + "".join(state(captions[k], saving_mark(k)) for k in SAVING) + "</div>"
    body = side_by_side + notes(
        "The words are the plan's (decision 3): a design is saved 600 ms after the last committed edit and says Saving, then Saved; the demo is not kept until it is edited, then it is a design named "
        "“Pune demo roof” like any other; a failure says Not saved and opens the notes with the words. On tablet and phone the state is said in the project switcher only. Under the card: the top bar "
        "of the Studio at its width of 1440 with each state in its place.",
    )
    bars = "".join(f'<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 12px; color: {TEXT_2}">In the top bar · {SAVING[k]}</span>{top_bar_with(k)}</div>' for k in SAVING)
    return card("State of saving, in the top bar on desktop", body, gap=16) + f'<div style="display: flex; flex-direction: column; gap: 16px">{bars}</div>'


# Phone: the cards stacked, the switcher's sheet.


def phone_frame(inside: str, header: str) -> str:
    return (
        f'<div style="width: {PHONE_WIDTH}px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f"{header}{inside}</div>"
    )


def phone_cards() -> str:
    cards = "".join(design_card(d, f"p{n}", PHONE_CARD, touch=True) for n, d in enumerate(KEPT))
    body = f'<div style="font-size: 15px; color: {TEXT_2}">Your designs are kept on this device.</div><div style="margin-top: 12px; display: flex; flex-direction: column; gap: 12px">{cards}</div>'
    main = f'<main style="display: flex; flex-direction: column; padding: 8px {PHONE_PAD}px 24px">{on_this_device(body=body)}</main>'
    return phone_frame(main, logo_header(56, PHONE_PAD, 28, 17))


def phone_switcher() -> str:
    header = piece(PHONE, "<header", "</header>")
    main = f'<div style="display: flex; flex-direction: column; justify-content: flex-end; background: {DIM}"><div style="height: 120px"></div>{switcher_sheet()}</div>'
    return phone_frame(main, header)


def phone_card() -> str:
    body = (
        f'<div style="display: grid; grid-template-columns: {PHONE_WIDTH}px {PHONE_WIDTH}px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Phone 390: the cards stacked, one per row, the thumbnail across the card", phone_cards(), gap=10)
        + state("Phone 390: the switcher's sheet with the three designs", phone_switcher(), gap=10)
        + notes(
            "On phone Home is one column: “On this device” after the demo's card, each design a card across the column with its thumbnail across the card, the stats side by side, the menu button at the "
            "top right as on desktop; its list is a bottom sheet with rows of 52.",
            "The switcher's sheet comes over the dimmed screen from the top bar's name: “This design” with the state of saving, the designs on this device as rows of 48, the actions. The field of a "
            "rename is 44 high here.",
        )
        + "</div>"
    )
    return card("On phone", body, gap=14)


def designs_board() -> str:
    width, height = 1440, DESIGNS_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + cards_card() + delete_card() + rename_card() + switcher_card() + saving_card() + phone_card() + "</div>"
    return (
        HEAD.format(
            title="Home, designs on this device",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Home, designs on this device",
            lead="The cards of the designs kept on this device with their menu; Delete asked; a design renamed in place; the project switcher with the same three; the state of saving in its four states; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


BOARDS = {
    "HomeTablet.dc.html": tablet_board,
    "HomePhone.dc.html": phone_board,
    "HomeDesigns.dc.html": designs_board,
}


if __name__ == "__main__":
    for name, build in BOARDS.items():
        html = build()
        assert "bankable" not in html.lower(), name
        words = (DEMO["name"], DEMO["roof_words"], kwp(DEMO["dc_kwp"]), mwh(DEMO["energy_mwh"]), "On this device", "Open a project")
        if name == "HomeDesigns.dc.html":
            words += tuple(d["name"] for d in KEPT) + tuple(d["edited"] for d in KEPT) + tuple(SAVING.values()) + (WORDS["delete_question"].split("? ")[1],)
        else:
            words += ("Find my roof", "Import a drawing", ON_THIS_DEVICE)
        for word in words:
            assert word in html, (name, word)
        (HERE / name).write_text(html, encoding="utf-8")
    print(", ".join(BOARDS))
