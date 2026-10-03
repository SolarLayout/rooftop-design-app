"""Writes the three boards of the Handover workspace of Phase 9 (plan/phase-09-plan.md, step 0):
Handover.dc.html, "Handover · desktop 1440" (in the place of the board drawn by hand, its list, its rows, its head, its
paper frame and its thumbnails kept as approved); HandoverTablet.dc.html, "Handover · tablet 834"; and
HandoverPhone.dc.html, "Handover · phone 390", two screens side by side: the list and the report pushed.

Each shows the demo at 1500 V with option A chosen, the report open at its first page. The desktop board is the approved
one with the changes of the plan: "Download all" as a secondary button at the right of the title with its facts "6 files
· one zip" under it (decision 10); the engine's page 1 in the paper frame in place of the page drawn by hand, the paper as
high as the page (decision 4); the six thumbnails the engine's pages scaled down, with their titles (decision 5); the
project file named as the API writes it (decision 9). The tablet is two columns: the list 300 wide with the facts of a
row allowed a second line, the preview beside it with the thumbnails as a row under the page (decision 3). The phone is
the list as the screen with no row open (nothing stands beside it), the project file card at its end, and the report pushed: a back row "Handover", the title with
the download as an icon button of 44, the page across the width, previous and next with "Page 1 of 6 · Summary" between,
the thumbnails as a row that scrolls sideways (decision 3). The frames are those of the approved boards: the top bar of
Main.dc.html and StudioTablet.dc.html, the header and the tab bar of StudioPhone.dc.html, with Handover the workspace
open.

What the engine answered is read from handover_data.json beside this file (option A's system, BOM and cable schedule,
the equipment, the weather's hours, the API's file names, the report's pages): the facts of every row are computed from
it (decision 14), never typed. The pages are the engine's own images for the demo in handover_pages/, 1754 × 1240 each,
drawn with the day 2026-10-03. Every colour is one of docs/design/design-tokens.md.

Run it in this folder: python3 build_phase9_handover_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    CONTROL,
    CONTROL_ACTIVE,
    DISPLAY,
    DOWNLOAD,
    GROUND,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE_LINE,
    SHADOW_CARD,
    SHADOW_PANEL,
    SHADOW_PRIMARY,
    SHADOW_RAISED,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    icon,
)
from build_phase5_roof_boards import PHONE, TABLET, frame, piece
from build_phase8_performance_boards import swap_workspace

MAIN = (HERE / "Main.dc.html").read_text(encoding="utf-8")
DATA = json.loads((HERE / "handover_data.json").read_text(encoding="utf-8"))

# Tokens not in the shared builders.
PAPER = "#FBFAF7"  # color-paper: the sheet of the report

# The icons of the rows and the navigation of the pages.
CHEVRON_RIGHT = '<path d="m9 6 6 6-6 6"/>'
CHEVRON_LEFT = '<path d="m15 6-6 6 6 6"/>'

# The boards are as high as what is on them (measured once from a render). The desktop and the tablet are the screen;
# the phone list is drawn whole, since its rows do not fit in 844, and the report fits a screen of 844.
DESKTOP_HEIGHT = 900
TABLET_HEIGHT = 1194
PHONE_SCREEN = 844
PHONE_LIST_HEIGHT = 932
PHONE_CAPTION = 44  # the strip of ground under a frame that says what the frame is
PHONE_GAP = 40

# --------------------------------------------------------------------------------------------------
# What the engine answered: the rows and their facts (decision 14)
# --------------------------------------------------------------------------------------------------

OPTION = DATA["option"]
SYSTEM = OPTION["system"]
BOM = {line["item"]: line for line in OPTION["bom"]}
SCHEDULE = OPTION["cable_schedule"]
MODULE = DATA["equipment"]["module"]
INVERTER = DATA["equipment"]["inverter"]
WEATHER = DATA["weather"]
FILES = DATA["files"]
PAGES = DATA["pages"]
PAGE_RATIO = PAGES[0]["height"] / PAGES[0]["width"]  # A4 landscape at 150 dpi: 1240 over 1754
ZIP_FILES = len(FILES["names"]) - 1  # the five exports and the project file; the zip holds them, not itself


def number(value: float, digits: int = 0) -> str:
    return f"{value:,.{digits}f}"


def plural(count: int, word: str) -> str:
    return f"{count} {word}" if count == 1 else f"{count} {word}s"


ITEMS = [
    ("PDF", "Design report", f"A4 landscape · {plural(len(PAGES), 'page')}", False),
    (
        "PNG",
        "Single-line diagram",
        f"{SYSTEM['n_strings']} strings of {SYSTEM['n_series']} × {number(MODULE['pnom_w'])} Wp · "
        f"{plural(SYSTEM['n_inverters'], 'inverter')}, {INVERTER['n_mppt']} MPPT",
        False,
    ),
    (
        "BOM",
        "Bill of materials",
        f"{number(BOM['PV module']['qty'])} modules · {number(BOM['Mounting structure']['qty'])} tables · "
        f"{number(BOM['DC cable']['qty'])} m DC cable",
        True,
    ),
    ("DC", "DC cable schedule", f"{len(SCHEDULE)} strings · Voc cold {number(max(row['voc_cold_v'] for row in SCHEDULE))} V", True),
    ("DXF", "CAD layout", "Metres · one layer per string", False),
    ("KMZ", "Google Earth model", f"Roof, obstacles with heights, {SYSTEM['n_modules']} modules", False),
    ("CSV", "Hourly data", f"{WEATHER['hours']:,} rows · irradiance, temperature, power", False),
]
PROJECT_FACTS = f"{FILES['names']['rtd']} · opens offline"
ZIP_FACTS = f"{ZIP_FILES} files · one zip"
SUBTITLE = "Everything the installer, the client and the utility need"
PAGE_WORDS = f"Page {PAGES[0]['number']} of {len(PAGES)} · {PAGES[0]['title']}"

# --------------------------------------------------------------------------------------------------
# The frames: the top bar, the phone header and the tab bar of the approved boards, with Handover open
# --------------------------------------------------------------------------------------------------


def with_handover(html: str) -> str:
    nav = piece(html, '<nav aria-label="Workspaces"', "</nav>")
    return html.replace(nav, swap_workspace(nav, 2))


# --------------------------------------------------------------------------------------------------
# Controls
# --------------------------------------------------------------------------------------------------


def download_icon(size: int = 16, colour: str = ACCENT_INK) -> str:
    return icon(DOWNLOAD, size, colour)


def primary(label: str, height: int, radius: int, before: str = "") -> str:
    return (
        f'<button style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 8px; height: {height}px; padding: 0 16px; '
        f"background: {ACCENT}; color: {ACCENT_INK}; border: 0; border-radius: {radius}px; font-weight: 600; white-space: nowrap; cursor: pointer; "
        f'box-shadow: {SHADOW_PRIMARY}">{before}{label}</button>'
    )


def secondary(label: str, height: int, radius: int, before: str = "", full: bool = False) -> str:
    width = "width: 100%; box-sizing: border-box; " if full else ""
    return (
        f'<button style="{width}flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 8px; height: {height}px; padding: 0 14px; '
        f"background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: {radius}px; font-weight: 500; white-space: nowrap; cursor: pointer; "
        f'box-shadow: {SHADOW_RAISED}">{before}{label}</button>'
    )


def page_button(label: str, path: str, side: int, radius: int, colour: str) -> str:
    """Previous or next: a secondary icon button, its border `line` (components.md, "Buttons")."""
    return (
        f'<button aria-label="{label}" style="flex-shrink: 0; width: {side}px; height: {side}px; display: flex; align-items: center; justify-content: center; '
        f'background: {CONTROL}; border: 1px solid {LINE}; border-radius: {radius}px; cursor: pointer; box-shadow: {SHADOW_RAISED}">{icon(path, 16, colour)}</button>'
    )


def download_all(height: int, radius: int, full: bool = False) -> str:
    return secondary("Download all", height, radius, download_icon(16, TEXT), full)


def facts(words: str, colour: str = TEXT_2, extra: str = "") -> str:
    return f'<span style="font-size: 12px; color: {colour}{extra}">{words}</span>'


# --------------------------------------------------------------------------------------------------
# The list: the title, the rows of 64, the project file card (components.md, "Deliverable row (Handover)")
# --------------------------------------------------------------------------------------------------


def badge(words: str, selected: bool) -> str:
    look = f"background: {ACCENT}; color: {ACCENT_INK}" if selected else f"background: {CONTROL_ACTIVE}"
    return (
        f'<span style="width: 44px; height: 28px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; {look}; '
        f'border-radius: 6px; {MONO}; font-size: 11px; font-weight: 500">{words}</span>'
    )


def row(item: tuple[str, str, str, bool], selected: bool = False, touch: bool = False, chevron: bool = False) -> str:
    """A row of 64: the badge, the title, one line of facts (two where the column is narrow), a download icon or a
    chevron. The row that is open is on surface-2 with the line of a note, and its icon in text."""
    format_, title, words, opens = item
    look = f"background: {SURFACE_2}; border: 1px solid {NOTE_LINE}" if selected else "background: transparent; border: 1px solid transparent"
    pressed = ' aria-pressed="true"' if selected else ""
    colour = TEXT if selected else TEXT_3
    end = icon(CHEVRON_RIGHT, 18, colour) if opens or chevron else icon(DOWNLOAD, 18, colour)
    size = 15 if touch else 14
    return (
        f'<button{pressed} style="display: flex; align-items: center; gap: 14px; min-height: 64px; box-sizing: border-box; padding: 0 14px; {look}; border-radius: 14px; '
        f'text-align: left; font-size: {size}px; cursor: pointer">{badge(format_, selected)}'
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">{title}</span>{facts(words)}</span>{end}</button>'
    )


def rows(touch: bool = False, chevrons: bool = False, open_: bool = True) -> str:
    """The seven rows; the first is the one that is open, where a preview stands beside the list."""
    return '<div style="display: flex; flex-direction: column; gap: 6px">' + "".join(
        row(item, selected=open_ and n == 0, touch=touch, chevron=chevrons) for n, item in enumerate(ITEMS)
    ) + "</div>"


def project_card(touch: bool = False, extra: str = "", stacked: bool = False) -> str:
    """The project file at the end of the list: its name as the API writes it, and Save a copy."""
    height, radius = (44, 12) if touch else (40, 10)
    size = 15 if touch else 14
    words = (
        f'<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">Project file</span>{facts(PROJECT_FACTS)}</div>'
    )
    button = secondary("Save a copy", height, radius, full=stacked)
    direction = "flex-direction: column; gap: 14px" if stacked else "align-items: center; gap: 14px"
    return (
        f'<div style="display: flex; {direction}; padding: 16px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 14px; '
        f'font-size: {size}px; box-shadow: {SHADOW_CARD}{extra}">{words}{button}</div>'
    )


def title_block(size: int, line: int, under_size: int = 14) -> str:
    return (
        f'<div style="display: flex; flex-direction: column; gap: 4px"><h1 style="margin: 0; {DISPLAY}; font-size: {size}px; line-height: {line}px; letter-spacing: -0.02em">Handover</h1>'
        f'<div style="font-size: {under_size}px; color: {TEXT_2}">{SUBTITLE}</div></div>'
    )


# --------------------------------------------------------------------------------------------------
# The preview: the head, the paper with the engine's page, the thumbnails (components.md, "Paper preview")
# --------------------------------------------------------------------------------------------------


def page_image(page: dict, width: int, radius: int = 6) -> str:
    height = round(width * PAGE_RATIO)
    return (
        f'<img src="{page["file"]}" alt="Page {page["number"]} of {len(PAGES)} · {page["title"]}, as the engine draws it" width="{width}" height="{height}" '
        f'style="display: block; width: {width}px; height: {height}px; border-radius: {radius}px">'
    )


def paper(width: int) -> str:
    """The sheet: color-paper, radius 6, shadow-panel, as high as the page it shows."""
    return (
        f'<article aria-label="{PAGE_WORDS}" style="width: {width}px; flex-shrink: 0; overflow: hidden; background: {PAPER}; border-radius: 6px; box-shadow: {SHADOW_PANEL}">'
        f"{page_image(PAGES[0], width, 0)}</article>"
    )


def thumbnail(page: dict, current: bool, width: int, slot: int, padding: int, caption: str, caption_size: int = 12, align: str = "flex-start") -> str:
    """A page scaled down, the current one with the accent border. The page fits the slot's height whole; where the
    slot is wider than the page it stands in the middle."""
    inner = width - 2 - 2 * padding
    image_height = slot
    image_width = round(slot / PAGE_RATIO)
    if image_width > inner:
        image_width, image_height = inner, round(inner * PAGE_RATIO)
    look = f"background: {SURFACE_2}; border: 1px solid {ACCENT}" if current else f"background: transparent; border: 1px solid {LINE}"
    pressed = ' aria-pressed="true"' if current else ""
    colour = TEXT if current else TEXT_2
    return (
        f'<button{pressed} aria-label="Page {page["number"]} · {page["title"]}" style="width: {width}px; box-sizing: border-box; flex-shrink: 0; display: flex; flex-direction: column; align-items: {align}; gap: 6px; '
        f'padding: {padding}px; {look}; border-radius: 10px; text-align: left; cursor: pointer">'
        f'<span style="align-self: center; display: flex; height: {slot}px; align-items: center">'
        f'<img src="{page["file"]}" alt="" width="{image_width}" height="{image_height}" style="display: block; width: {image_width}px; height: {image_height}px; border-radius: 3px"></span>'
        f'<span style="max-width: 100%; font-size: {caption_size}px; color: {colour}; white-space: nowrap">{caption}</span></button>'
    )


def head(touch: bool, radius: int) -> str:
    """The head of the report's preview: the title and the page, previous and next, Download PDF."""
    side = 44 if touch else 40
    size = 15 if touch else 14
    return (
        f'<div style="display: flex; align-items: center; gap: 12px; font-size: {size}px">'
        f'<div style="display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 600; font-size: 16px">Design report</span>{facts(PAGE_WORDS)}</div>'
        '<div style="margin-left: auto; display: flex; align-items: center; gap: 8px">'
        f'{page_button("Previous page", CHEVRON_LEFT, side, radius, TEXT_3)}{page_button("Next page", CHEVRON_RIGHT, side, radius, TEXT)}'
        f'{primary("Download PDF", side, radius, download_icon())}</div></div>'
    )


# --------------------------------------------------------------------------------------------------
# Board 1: desktop, 1440 by 900; the approved board with the changes of the plan
# --------------------------------------------------------------------------------------------------

DESKTOP_LIST = 440  # size-handover-list
DESKTOP_THUMBNAIL = 132  # the thumbnails at the right, as approved
DESKTOP_SLOT = 70  # the page inside a thumbnail: six of them, 8 apart, in the height the paper's row has (734)


def desktop_list() -> str:
    title = (
        '<div style="display: flex; align-items: flex-start; gap: 16px">'
        f"{title_block(30, 36)}"
        f'<div style="margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 4px">{download_all(40, 10)}{facts(ZIP_FACTS)}</div></div>'
    )
    return (
        f'<aside style="width: {DESKTOP_LIST}px; flex-shrink: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; padding: 28px 24px 24px 40px; border-right: 1px solid {LINE_SUBTLE}">'
        f"\n{title}\n{rows()}\n{project_card(extra='; margin-top: auto')}\n</aside>"
    )


def desktop_preview() -> str:
    width = 1440 - DESKTOP_LIST - 32 - 40 - 16 - DESKTOP_THUMBNAIL
    thumbnails = "".join(
        thumbnail(page, n == 0, DESKTOP_THUMBNAIL, DESKTOP_SLOT, 8, f"{page['number']} · {page['title']}") for n, page in enumerate(PAGES)
    )
    return (
        f'<main style="flex-grow: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; padding: 28px 40px 24px 32px; background: {GROUND}">'
        f"\n{head(False, 10)}\n"
        '<div style="flex-grow: 1; min-height: 0; display: flex; align-items: flex-start; gap: 16px">'
        f'{paper(width)}<nav aria-label="Report pages" style="width: {DESKTOP_THUMBNAIL}px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px">{thumbnails}</nav></div>'
        "\n</main>"
    )


def desktop_board() -> str:
    width, height = 1440, DESKTOP_HEIGHT
    header = with_handover(piece(MAIN, "<header", "</header>"))
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">\n'
        f'{header}\n<div style="flex-grow: 1; min-height: 0; display: flex">\n{desktop_list()}\n{desktop_preview()}\n</div>\n</div>'
    )
    return frame("Handover · desktop 1440", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 2: tablet, 834 by 1194; two columns, the list 300 wide (decision 3)
# --------------------------------------------------------------------------------------------------

TABLET_LIST = 300
TABLET_PAD = 24
TABLET_GAP = 20
TABLET_PREVIEW = 834 - TABLET_PAD - TABLET_LIST - TABLET_GAP - TABLET_PAD
TABLET_THUMBNAIL_GAP = 6


def tablet_list() -> str:
    title = (
        f'<div style="display: flex; flex-direction: column; gap: 14px">{title_block(30, 36, 15)}'
        f'<div style="display: flex; align-items: center; gap: 12px">{download_all(44, 12)}{facts(ZIP_FACTS)}</div></div>'
    )
    return (
        f'<aside style="width: {TABLET_LIST}px; flex-shrink: 0; display: flex; flex-direction: column; gap: 18px">'
        f"\n{title}\n{rows(touch=True)}\n{project_card(touch=True, stacked=True)}\n</aside>"
    )


def tablet_preview() -> str:
    width = (TABLET_PREVIEW - 5 * TABLET_THUMBNAIL_GAP) // 6
    thumbnails = "".join(
        thumbnail(page, n == 0, width, 45, 4, f"{page['number']} · {page['title']}", 11, "center") for n, page in enumerate(PAGES)
    )
    return (
        f'<main style="width: {TABLET_PREVIEW}px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px">'
        f"\n{head(True, 12)}\n{paper(TABLET_PREVIEW)}\n"
        f'<nav aria-label="Report pages" style="display: flex; gap: {TABLET_THUMBNAIL_GAP}px">{thumbnails}</nav>\n</main>'
    )


def tablet_board() -> str:
    width, height = 834, TABLET_HEIGHT
    header = with_handover(piece(TABLET, "<header", "</header>"))
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">\n'
        f'{header}\n<div style="flex-grow: 1; min-height: 0; display: flex; gap: {TABLET_GAP}px; padding: {TABLET_PAD}px">\n{tablet_list()}\n{tablet_preview()}\n</div>\n</div>'
    )
    return frame("Handover · tablet 834", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 3: phone, 390 wide; the list as the screen and the report pushed, side by side (decision 3)
# --------------------------------------------------------------------------------------------------

PHONE_WIDTH = 390
PHONE_PAGE = PHONE_WIDTH - 2 * 16  # the page across the width, inside the padding of 16
PHONE_THUMBNAIL = 56
PHONE_THUMBNAIL_GAP = 4


def phone_screen(inside: str, height: int, label: str) -> str:
    """A phone of 390: the header of StudioPhone.dc.html, the page in one column with its padding of 16, the tab bar
    with Handover open; a frame with the line of a card around it."""
    header = piece(PHONE, "<header", "</header>")
    tabs = with_handover(piece(PHONE, '<nav aria-label="Workspaces"', "</nav>"))
    return (
        f'<div aria-label="{label}" style="width: {PHONE_WIDTH}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; '
        f'border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f'{header}<main style="flex-grow: 1; min-height: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 8px 16px 20px">{inside}</main>{tabs}</div>'
    )


def phone_list() -> str:
    title = title_block(22, 28, 13)
    all_ = f'<div style="display: flex; flex-direction: column; gap: 4px">{download_all(44, 12, full=True)}{facts(ZIP_FACTS)}</div>'
    return title + all_ + rows(touch=True, chevrons=True, open_=False) + project_card(touch=True, stacked=True)


def phone_report() -> str:
    back = (
        f'<button style="align-self: flex-start; display: flex; align-items: center; gap: 6px; height: 44px; margin-left: -10px; padding: 0 10px; background: transparent; border: 0; '
        f'border-radius: 12px; color: {TEXT_2}; font-size: 15px; cursor: pointer">{icon(CHEVRON_LEFT, 18, TEXT_2)}Handover</button>'
    )
    title = (
        '<div style="display: flex; align-items: center; gap: 12px">'
        f'<div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px"><h1 style="margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Design report</h1>{facts(PAGE_WORDS)}</div>'
        f'<button aria-label="Download PDF" style="flex-shrink: 0; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: {ACCENT}; border: 0; '
        f'border-radius: 12px; cursor: pointer; box-shadow: {SHADOW_PRIMARY}">{download_icon(18)}</button></div>'
    )
    pages = (
        '<div style="display: flex; align-items: center; gap: 12px">'
        f'{page_button("Previous page", CHEVRON_LEFT, 44, 12, TEXT_3)}'
        f'<span style="flex-grow: 1; text-align: center; font-size: 13px; color: {TEXT_2}">{PAGE_WORDS}</span>'
        f'{page_button("Next page", CHEVRON_RIGHT, 44, 12, TEXT)}</div>'
    )
    thumbnails = "".join(
        thumbnail(page, n == 0, PHONE_THUMBNAIL, 35, 3, f'<code>{page["number"]}</code>', 11, "center") for n, page in enumerate(PAGES)
    )
    nav = f'<nav aria-label="Report pages" style="display: flex; gap: {PHONE_THUMBNAIL_GAP}px; overflow-x: auto">{thumbnails}</nav>'
    return back + title + paper(PHONE_PAGE) + pages + nav


def caption(words: str) -> str:
    return f'<p style="margin: 0; height: {PHONE_CAPTION}px; box-sizing: border-box; padding: 12px 4px 0; font-size: 12px; color: {TEXT_2}">{words}</p>'


def phone_board() -> str:
    width = 2 * PHONE_WIDTH + PHONE_GAP
    height = max(PHONE_LIST_HEIGHT, PHONE_SCREEN) + PHONE_CAPTION
    first = (
        f'<div style="display: flex; flex-direction: column">{phone_screen(phone_list(), PHONE_LIST_HEIGHT, "The list, at /handover")}'
        f'{caption("The list, drawn whole; on the phone it scrolls under the tab bar.")}</div>'
    )
    second = (
        f'<div style="display: flex; flex-direction: column">{phone_screen(phone_report(), PHONE_SCREEN, "The report, pushed")}'
        f'{caption("The report, pushed over the list; the back row leads back to it.")}</div>'
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; display: flex; align-items: flex-start; gap: {PHONE_GAP}px; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">'
        f"\n{first}\n{second}\n</div>"
    )
    return frame("Handover · phone 390", width, height, root)


if __name__ == "__main__":
    for name, html in (("Handover.dc.html", desktop_board()), ("HandoverTablet.dc.html", tablet_board()), ("HandoverPhone.dc.html", phone_board())):
        for _, title, words, _ in ITEMS:
            assert title in html and words in html, (name, title)
        assert PROJECT_FACTS in html and ZIP_FACTS in html and PAGE_WORDS in html, name
        assert "bankable" not in html.lower(), name
        (HERE / name).write_text(html, encoding="utf-8")
        print(name)
