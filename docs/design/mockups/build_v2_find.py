"""The boards "V2 · 4 · Find" on desktop 1440, tablet 834 and phone 390.

Find redesigned around its one job: get a roof outline, then build (plan/v2/audit.md: V2-02, V2-04 to V2-08, V2-10, V2-11,
V2-22, V2-58, V2-77, V2-82, V2-101, V2-117). Today the search is in the top bar while a panel of explanation fills the
right; the panel's words follow the tool, not the step; the roof type and Build stand there before there is a roof; a
card of tips covers the roof; Build is under the fold on most sizes. V2: the work column of the Studio on Find too, its
instruction by the step (find, outline, add obstacles and build), the search the first thing in it, the tools with their
words, the roof type a question with a default once the outline is closed, Build this roof pinned at its foot, no card.
Drawn with build_v2_parts.py over the approved boards' imagery illustration, the Pune demo roof (90 × 40 m).
Usage: python3 -I build_v2_find.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, CHROME, CONTROL, CONTROL_ACTIVE, ICON, LINE, LINE_STRONG, LINE_SUBTLE, NOTE_SURFACE, RADIUS, ROOF,
    SHADOW_FLOAT, SHADOW_RAISED, SHADOW_SEGMENT, SHADOW_WELL, SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, Map,
    board_head, button, changes, field, frame, icon, mark, segmented, style, summary_row, tab_bar, text, top_bar,
    write_board,
)

ISSUES = "Answers V2-02 · V2-04 · V2-05 · V2-06 · V2-07 · V2-08 · V2-10 · V2-11 · V2-22 · V2-58 · V2-77 · V2-82 · V2-101 · V2-117"
LINES = [
    "Find has one job: an outline of the roof, then Build. It takes the Studio's work column: the instruction at the "
    "head, what to do under it, the primary at the foot. The instruction follows the step, never the tool in hand.",
    "The first step is a search field, the first thing in the column, with its two other ways under it: Use my "
    "location and Enter the roof by hand. Examples show in the field's list when it is empty. No cards, no Three steps.",
    "Outlining: the tools with their words, Undo and Clear with theirs. Once the outline closes, the column says what "
    "the roof is and asks what is left: the obstacles and the roof type, a question with a default. Build this roof "
    "stands pinned at the foot from then on, at every size. The roof shows its own handles; no card of tips.",
]
TOOLS = [("Corners", '<path d="M5 19L9 5l10 4-4 10z"></path>'), ("Rectangle", '<rect x="4" y="6" width="16" height="12" rx="1"></rect>'),
         ("Detect building", '<path d="M4 20V9l8-5 8 5v11z"></path><path d="M9 20v-6h6v6"></path>')]
OBSTACLES = [("Box", '<rect x="5" y="5" width="14" height="14" rx="1"></rect>'), ("Tank", '<circle cx="12" cy="12" r="7"></circle>'),
             ("Wall", '<path d="M4 12h16"></path><path d="M4 9h16"></path>'), ("Tree", '<circle cx="12" cy="10" r="6"></circle><path d="M12 16v4"></path>')]
ROOF_TYPES = [("Flat, rows facing south", "Tilted rows, the usual for a flat roof", "Default"),
              ("Flat, rows facing east and west", "Low rows back to back: more modules, less from each", ""),
              ("Sloped", "Modules flush on the slope", "")]


def tool_row(items: list, active: int, touch: bool) -> str:
    """Tools as a segmented row with their words: the icon and the name, never an icon alone."""
    h = 44 if touch else 40
    cells = "".join(
        f'<span style="flex: 1; height: {h - 8}px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; '
        f'border-radius: {RADIUS["control"]}px; '
        + (f'background: {CONTROL_ACTIVE}; box-shadow: {SHADOW_SEGMENT}; {style("strong", touch)}' if i == active else style("body", touch, TEXT_2))
        + f'; white-space: nowrap">{icon(p, 16, TEXT if i == active else TEXT_2)}{n}</span>'
        for i, (n, p) in enumerate(items))
    return (f'<div style="display: flex; padding: 4px; height: {h}px; box-sizing: border-box; background: {WELL}; border: 1px solid {LINE}; '
            f'border-radius: {RADIUS["row"]}px; box-shadow: {SHADOW_WELL}">{cells}</div>')


def search_field(touch: bool, value: str = "", focused: bool = False) -> str:
    border = ACCENT if focused else LINE_STRONG
    halo = ", 0 0 0 3px rgba(255,176,32,.18)" if focused else ""
    words = text("body", value, touch) if value else text("body", "Address or coordinates", touch, TEXT_3)
    return (f'<label style="display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px; box-sizing: border-box; '
            f'background: {WELL}; border: 1px solid {border}; border-radius: {RADIUS["control"]}px; box-shadow: {SHADOW_WELL}{halo}">'
            f'{icon(ICON["search"], 18, TEXT_2)}<span style="flex: 1">{words}</span></label>')


def ways(touch: bool) -> str:
    def row(ic: str, a: str, b: str) -> str:
        return (f'<a href="#" style="display: flex; align-items: center; gap: 12px; min-height: {56 if touch else 52}px; text-decoration: none; '
                f'border-top: 1px solid {LINE_SUBTLE}">{icon(ic, 18, TEXT_2)}<span style="flex: 1; display: flex; flex-direction: column">'
                f'{text("strong", a, touch)}{text("body", b, touch, TEXT_2)}</span>{icon(ICON["chevron-right"], 16, TEXT_2)}</a>')
    return (f'<div>{row(ICON["location"], "Use my location", "When you are at the building")}'
            f'{row(ICON["pencil"], "Enter the roof by hand", "Type its length and width")}</div>')


def suggestions(touch: bool) -> str:
    """The search's list while the field is empty: examples, each one fills the field."""
    ex = [("Shivajinagar, Pune", "An address"), ("18.52042, 73.85674", "Coordinates"), ("maps.app.goo.gl/…", "A maps link")]
    rows = "".join(f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: {RADIUS["control"]}px">'
                   f'{text("body", a, touch)}{text("body", b, touch, TEXT_3)}</div>' for a, b in ex)
    return (f'<div style="margin-top: 6px; padding: 6px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: {RADIUS["card"]}px; '
            f'box-shadow: {SHADOW_FLOAT}">{text("unit", "Examples", False, TEXT_3, "p", "padding: 6px 12px 2px")}{rows}</div>')


def col_find(touch: bool, focused: bool = True) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Find the roof", touch, TEXT, "h2")}'
            f'{text("body", "Search for the building, then outline its roof on the map.", touch, TEXT_2, "p")}</div>'
            f'<div>{search_field(touch, focused=focused)}{suggestions(touch) if focused else ""}</div>{ways(touch)}')


def undo_clear(touch: bool) -> str:
    return (f'<div style="display: flex; gap: 8px">{button("Undo", "quiet", "standard", touch, icon(ICON["undo"], 16, TEXT_2))}'
            f'{button("Clear", "quiet", "standard", touch, icon(ICON["close"], 16, TEXT_2))}</div>')


def col_outline(touch: bool) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Outline the roof", touch, TEXT, "h2")}'
            f'{text("body", "Click each corner of the roof. Click the first corner again to close the outline.", touch, TEXT_2, "p")}</div>'
            f'{tool_row(TOOLS, 0, touch)}'
            f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">'
            f'{text("body", "3 corners", touch, TEXT_2)}{undo_clear(touch)}</div>')


def roof_type(touch: bool) -> str:
    rows = ""
    for i, (a, b, tag) in enumerate(ROOF_TYPES):
        on = i == 0
        dot = (f'<span style="width: 18px; height: 18px; border-radius: 50%; border: {"5px solid " + TEXT if on else "1.5px solid " + LINE_STRONG}; '
               f'box-sizing: border-box; flex: none; margin-top: 1px"></span>')
        rows += (f'<label style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: {RADIUS["row"]}px; '
                 f'{"background: " + SURFACE_2 + "; " if on else ""}">{dot}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px">'
                 f'{text("strong" if on else "body", a, touch)}{text("body", b, touch, TEXT_2)}</span>'
                 f'{text("unit", tag, False, TEXT_3) if tag else ""}</label>')
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{text("section", "Roof type", touch)}'
            f'<div role="radiogroup" style="display: flex; flex-direction: column; gap: 2px">{rows}</div></div>')


def obstacles(touch: bool, listed: bool) -> str:
    tools = tool_row(OBSTACLES, -1, touch)
    lst = ""
    if listed:
        items = [("Stair room", "Box · 5.0 × 4.0 m · 3.0 m high"), ("Water tank", "Tank · 2.5 m across · 2.0 m high")]
        lst = "".join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 52px; border-top: 1px solid {LINE_SUBTLE}">'
                      f'<span style="flex: 1; display: flex; flex-direction: column">{text("strong", a, touch)}{text("body", b, touch, TEXT_2)}</span>'
                      f'{icon(ICON["chevron-right"], 16, TEXT_2)}</div>' for a, b in items)
    hint = text("body", "Choose a kind, then drag over it on the map.", touch, TEXT_2)
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{text("section", "Obstacles · " + ("2" if listed else "0"), touch)}'
            f'{hint}{tools}<div>{lst}</div></div>')


def col_closed(touch: bool, listed: bool = False) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Add what stands on the roof", touch, TEXT, "h2")}'
            f'{text("body", "The roof is outlined: 3,600 m², 4 corners. Add its obstacles, choose its type, then build.", touch, TEXT_2, "p")}</div>'
            f'{obstacles(touch, listed)}{roof_type(touch)}')


def build_foot(touch: bool, words: str = "Opens the roof in 3D with the array on it.") -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{button("Build this roof · 3,600 m²", "primary", "primary", touch, full=True)}'
            f'{text("body", words, touch, TEXT_2)}</div>')


def col_by_hand(touch: bool, no_map: bool) -> str:
    lead = ('<div style="display: flex; gap: 10px; align-items: flex-start; padding: 12px; background: ' + SURFACE_1 + '; border: 1px solid '
            + LINE + f'; border-radius: {RADIUS["row"]}px">{mark("note", 16)}<span style="display: flex; flex-direction: column; gap: 2px">'
            + text("strong", "The map is not available", touch) + text("body", "Enter the roof's measurements instead.", touch, TEXT_2)
            + '</span></div>') if no_map else ""
    faces = segmented(["South", "East", "North", "West"], 0, touch, fill=True)
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Enter the roof by hand", touch, TEXT, "h2")}'
            f'{text("body", "Type the roof's length and width. Add its obstacles in the Studio.", touch, TEXT_2, "p")}</div>{lead}'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{field("Length", "90.0", "m", "", touch, 112)}'
            f'{field("Width", "40.0", "m", "", touch, 112)}</div>'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", "The long side faces", touch)}{faces}</div>'
            f'{roof_type(touch)}'
            + ("" if no_map else f'<a href="#" style="{style("strong", touch)}; text-decoration: none">Draw on the map instead</a>'))


def map_controls(touch: bool) -> str:
    sz = 44 if touch else 40
    b = lambda p, name: (f'<button type="button" aria-label="{name}" style="width: {sz}px; height: {sz}px; display: inline-flex; align-items: center; '
                         f'justify-content: center; background: {CONTROL}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}; '
                         f'border-radius: {RADIUS["control"]}px">{icon(p, 18, TEXT)}</button>')
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{b(ICON["plus"], "Zoom in")}{b(chr(60) + "path d=" + chr(34) + "M5 12h14" + chr(34) + ">" + chr(60) + "/path>", "Zoom out")}'
            f'{b("<path d=\"M12 3l4 9h-8z\" fill=\"currentColor\" stroke=\"none\"></path><path d=\"M12 21l-4-9h8z\"></path>", "North")}</div>')


def hint_chip(words: str) -> str:
    return (f'<span style="display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; background: rgba(14,18,24,.86); '
            f'border: 1px solid {LINE}; border-radius: 9999px; {style("body", False)}">{words}</span>')


def desk_map(state: str) -> str:
    if state == "find":
        m = Map(1056, 844, 4.2, 70, 20)
        return m.svg(dim=0.35)
    m = Map(1056, 844, 6.2)
    if state == "outline":
        m.outline([(0, 0), (90, 0), (90, 40)], False, cursor=(1, 39)).length((0, 0), (90, 0), "90.0 m", (0, 22)).length((90, 0), (90, 40), "40.0 m", (40, 0))
    elif state in ("closed", "height"):
        m.outline(ROOF, True).length((0, 0), (90, 0), "90.0 m", (0, 22)).length((90, 0), (90, 40), "40.0 m", (40, 0)).turn_handle(45, 40)
        if state == "height":
            m.box(22.5, 18, 5, 4).tank(62, 24, 2.5).box(75.25, 3.5, 10.5, 1.0, True)
    elif state == "hand":
        return (f'<div style="position: absolute; inset: 0; background: #12161D; '
                f'background-image: linear-gradient(#1B222D 1px, transparent 1px), linear-gradient(90deg, #1B222D 1px, transparent 1px); '
                f'background-size: 31px 31px"></div>' + Map(1056, 844, 6.2).outline(ROOF, True).length((0, 0), (90, 0), "90.0 m", (0, 22))
                .length((90, 0), (90, 40), "40.0 m", (40, 0)).svg().replace('filter="url(#soft)">', 'filter="url(#soft)" opacity="0">')
                .replace('<rect width="1056" height="844" filter="url(#grain)" opacity="0.8"></rect>', ''))
    return m.svg()


def height_popover() -> str:
    """V2-08: the height of a box just drawn, asked beside it in plain words."""
    return (f'<div style="width: 260px; padding: 16px; box-sizing: border-box; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; '
            f'border-radius: {RADIUS["card"]}px; box-shadow: {SHADOW_FLOAT}; display: flex; flex-direction: column; gap: 12px">'
            f'{text("section", "Box")}{field("Height above the roof", "1.2", "m", "", False, 96)}'
            f'<div style="display: flex; justify-content: flex-end; gap: 8px">{button("Cancel", "quiet")}{button("Add", "secondary")}</div></div>')


def desk_screen(state: str) -> str:
    bar = top_bar({}, "Roof", 1440, result=None, name="New design")
    mp = f'<div style="position: absolute; left: 0; top: 56px; width: 1056px; height: 844px; overflow: hidden">{desk_map(state)}'
    if state != "hand":
        mp += f'<div style="position: absolute; right: 16px; bottom: 40px">{map_controls(False)}</div>'
        mp += (f'<div style="position: absolute; left: 16px; bottom: 12px; {style("unit", False, "#D5DAE2")}; '
               f'text-shadow: 0 1px 3px rgba(0,0,0,.9)">Esri, Maxar, Earthstar Geographics · 20 m</div>')
    if state == "closed":
        mp += f'<div style="position: absolute; left: 50%; top: 24px; transform: translateX(-50%)">{hint_chip("Drag the roof to move it · drag ○ to turn it")}</div>'
    if state == "height":
        x, y = Map(1056, 844, 6.2).xy(80.5, 4)
        mp += f'<div style="position: absolute; left: {x + 16:.0f}px; top: {y - 150:.0f}px">{height_popover()}</div>'
    mp += '</div>'
    body = {"find": col_find(False), "outline": col_outline(False), "closed": col_closed(False),
            "height": col_closed(False, True), "hand": col_by_hand(False, True)}[state]
    foot = build_foot(False) if state in ("closed", "height", "hand") else ""
    col = (f'<aside style="position: absolute; right: 0; top: 56px; width: 384px; height: 844px; background: {CHROME}; '
           f'border-left: 1px solid {LINE_SUBTLE}; display: flex; flex-direction: column; box-sizing: border-box">'
           f'<div style="flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 24px; overflow: hidden">{body}</div>'
           + (f'<div style="padding: 24px; border-top: 1px solid {LINE_SUBTLE}">{foot}</div>' if foot else "") + '</aside>')
    return bar + mp + col


CHANGES = [
    ("Find's first step (D85)", "A lead, Start here, three cards, The search understands, Three steps; the search in the top bar",
     "The search field first in the column, its two other ways under it, examples in its empty list", "V2-02, V2-05, V2-82"),
    ("components.md · Map outline tools", "Icon buttons on the map; the panel's lead follows the tool",
     "The tools with their words in the column; the instruction follows the step", "V2-04, V2-117"),
    ("Find and outline · roof type and Build", "In the panel from the first corner",
     "With the closed outline: the roof type a question with a default and a line each; Build pinned at the foot", "V2-07, V2-10, V2-11"),
    ("components.md · Tip (D79)", "A card of five key hints over the roof, Show me how, Got it",
     "No card: the roof's own handles, and one line on the map for the first outline alone", "V2-06, V2-86"),
    ("Obstacles on the map · the height dialog", "Height of the box; The imagery cannot give it; Remove",
     "Height above the roof, beside the box; Cancel and Add", "V2-08"),
    ("guidelines.md · Offline or no map key", "This app has no key for the imagery",
     "The map is not available. Enter the roof's measurements instead. The by-hand column open", "V2-22"),
    ("Accessibility · focus order on Find", "Top bar, map buttons, toolbar, then the panel",
     "The column first, its primary last in it, then the map's controls", "V2-101"),
]


def build_desktop() -> None:
    w = 1440
    head = board_head("V2 · 4 · Find", LINES, False, ISSUES)
    screens = (frame("1 · The first step: the search first, focused, its examples in its list; the two other ways under it", desk_screen("find"), w, 900)
               + frame("2 · Outlining: the instruction for the step, the tools with their words, the edges' lengths on the map", desk_screen("outline"), w, 900)
               + frame("3 · The outline closed: what is left to do; the roof type with its default; Build pinned; one line on the map, no card", desk_screen("closed"), w, 900)
               + frame("4 · An obstacle drawn: its height asked beside it in plain words; the list in the column", desk_screen("height"), w, 900)
               + frame("5 · By hand, here because the map is not available: the fields, the direction in words, Build pinned", desk_screen("hand"), w, 900))
    body = (f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{head}{screens}{changes(CHANGES)}</div>')
    write_board(OUT, "V2Find.dc.html", "V2 · 4 · Find · desktop 1440", 1520, 5660, body)


def touch_screen(size: str, state: str) -> str:
    w, h = (834, 1194) if size == "tablet" else (390, 844)
    touch = True
    bar_h = 60 if size == "tablet" else 56
    bar = top_bar({}, "Roof", w, size, result=None, name="New design")
    tab = 72 if size == "phone" else 0
    map_h = {"tablet": 520, "phone": 330}[size]
    if state == "find":
        m = Map(w, map_h, 3.2, 70, 20).svg(dim=0.35)
    else:
        m = Map(w, map_h, 6.2 if size == "tablet" else 3.6).outline(ROOF, True).turn_handle(45, 40).svg()
    mp = f'<div style="position: absolute; left: 0; top: {bar_h}px; width: {w}px; height: {map_h}px; overflow: hidden">{m}</div>'
    sheet_top = bar_h + map_h - 16
    sheet_h = h - sheet_top - tab
    body = col_find(touch, focused=False) if state == "find" else col_closed(touch)
    foot = "" if state == "find" else (f'<div style="padding: 12px {16 if size == "phone" else 20}px 16px; border-top: 1px solid {LINE_SUBTLE}">'
                                        f'{button("Build this roof · 3,600 m²", "primary", "primary", True, full=True)}</div>')
    side = 16 if size == "phone" else 20
    sheet = (f'<div style="position: absolute; left: 0; top: {sheet_top}px; width: {w}px; height: {sheet_h}px; background: {CHROME}; '
             f'border-top: 1px solid {LINE}; border-radius: 24px 24px 0 0; box-sizing: border-box; display: flex; flex-direction: column">'
             f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}; margin: 8px 0 4px"></span>'
             f'<div style="flex: 1; padding: 12px {side}px 0; display: flex; flex-direction: column; gap: 20px; overflow: hidden">{body}</div>{foot}</div>')
    tb = f'<div style="position: absolute; left: 0; bottom: 0; width: {w}px">{tab_bar({}, "Roof")}</div>' if size == "phone" else ""
    return bar + mp + sheet + tb


def build_touch(size: str) -> None:
    w = 834 if size == "tablet" else 390
    h = 1194 if size == "tablet" else 844
    side = 20 if size == "tablet" else 16
    head = board_head("V2 · 4 · Find", LINES, True, ISSUES)
    screens = (frame("The first step: the search at the sheet's head, its two other ways under it", touch_screen(size, "find"), w, h)
               + frame("The outline closed: Build this roof pinned at the sheet's foot at every stop of the sheet", touch_screen(size, "closed"), w, h))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px">'
            f'<div style="padding: 0 {side}px">{head}</div>{screens}<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    name = "V2FindTablet.dc.html" if size == "tablet" else "V2FindPhone.dc.html"
    write_board(OUT, name, f"V2 · 4 · Find · {size} {w}", w, 3870 if size == "tablet" else 3640, body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
