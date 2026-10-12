"""The boards "V2 · 9 · Handover and Home" on desktop 1440, tablet 834 and phone 390.

Handover as the list of who gets what, and Home as a start screen (plan/v2/audit.md: V2-03, V2-05, V2-09, V2-14, V2-36, V2-60,
V2-62, V2-90 to V2-94, V2-98, V2-108, V2-115). Today Handover's rows carry specs and badges that are not formats, its preview
leaves half the width empty, and Export, Save a copy and Download all name one zip three ways; Home sells the product to a user
already in it, its search's placeholder is cut, and the designs on the device come after the demo. V2: Handover's files grouped
by who they are for, each with what it is and its size, formats as badges, the preview the rest of the width, Download all the
one primary; Home a start screen: one title, one line of what the app does, the search the largest thing, the other ways in
under it, the designs on this device first when there are any, the demo after, one design card for Home and the project menu.
Every name, file name and size is the API's for the Pune demo (handover_data.json, home_data.json).
Usage: python3 -I build_v2_handover_home.py [--out <folder>]
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, ACCENT_INK, CHROME, CONTROL, CONTROL_ACTIVE, DISPLAY_FAMILY, ICON, LINE, LINE_STRONG, LINE_SUBTLE, LOGO, OK,
    RADIUS, SHADOW_FLOAT, SHADOW_WELL, STEP_ICON, SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, board_head, button,
    changes, explained, frame, icon, mark, section_title, style, tab_bar, text, top_bar, write_board,
)
from build_v2_strings import plan_svg  # noqa: E402

H = json.loads((HERE / "handover_data.json").read_text(encoding="utf-8"))
ISSUES = "Answers V2-03 · V2-05 · V2-09 · V2-14 · V2-36 · V2-60 · V2-62 · V2-90 to V2-94 · V2-98 · V2-108 · V2-115"
LINES = [
    "Handover lists the files by who they are for: the client, the utility, the installer, and you. Each says what it is "
    "and its size; the badge is its format alone. The preview takes the rest of the width. Download all is the one "
    "primary; each file has its own Download. Export and Save a copy are gone: the project file is a file of the list.",
    "Home is a start screen. One title, one line of what the app does, then the search, the largest thing on the page, "
    "with the other ways in under it. When there are designs on this device they come first, under the search, which stays "
    "at the top as the page scrolls; the demo follows. The design card is the same on Home and in the project menu.",
]
ALL_DONE = {"Roof": "done", "Array": "done", "Strings": "done", "Performance": "done"}
KB = lambda n: f"{n / 1024:,.0f} KB"
B = H["files"]["bytes"]
GROUPS = [
    ("For the client", [("Design report", "6 pages, A4 landscape", "PDF", KB(B["pdf"]), "report")]),
    ("For the utility", [("Single-line diagram", "1 inverter, 6 MPPT, 22 strings", "PNG", KB(B["sld"]), "sld")]),
    ("For the installer", [("Bill of materials", "638 modules, 1 inverter, 9 lines", "CSV", "2 KB", "bom"),
                           ("Cable schedule", "22 strings, 1,681 m of DC cable", "CSV", "3 KB", "cables"),
                           ("CAD layout", "The roof and every string, in metres", "DXF", KB(B["dxf"]), "dxf")]),
    ("For you", [("Project file", "The whole design, to open again in the app", "RTD", KB(B["rtd"]), "rtd"),
                 ("Hourly data", "8,760 hours of sunlight, temperature and power", "CSV", KB(B["csv"]), "csv"),
                 ("Google Earth model", "The roof and the modules on the map", "KMZ", KB(B["kmz"]), "kmz")]),
]


def handover_list(selected: str, touch: bool) -> str:
    out = ""
    for g, items in GROUPS:
        rows = ""
        for name, what, fmt, size, key in items:
            sel = key == selected
            look = f"background: {SURFACE_2}; border: 1px solid {LINE_STRONG}" if sel else "border: 1px solid transparent"
            rows += (f'<div style="display: flex; align-items: center; gap: 12px; min-height: {64 if touch else 60}px; padding: 0 12px; '
                     f'border-radius: {RADIUS["row"]}px; {look}"><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
                     f'{text("strong", name, touch)}{text("body", what + " · " + size, touch, TEXT_2)}</span>'
                     f'<span style="padding: 2px 6px; border: 1px solid {LINE}; border-radius: 6px; {style("unit", False, TEXT_2)}">{fmt}</span>'
                     f'<button type="button" aria-label="Download {name}" style="width: 40px; height: 40px; display: inline-flex; align-items: center; '
                     f'justify-content: center; background: transparent; border: 0">{icon(ICON["download"], 18, TEXT_2)}</button></div>')
        out += f'<div style="display: flex; flex-direction: column; gap: 4px">{text("strong", g, touch, TEXT_2, "h3", "padding: 0 12px")}{rows}</div>'
    return f'<div style="display: flex; flex-direction: column; gap: 24px">{out}</div>'


def preview_report(w: int) -> str:
    thumbs = "".join(f'<img src="handover_pages/page-{i}.png" alt="Page {i}" style="width: 96px; border-radius: 4px; border: 1px solid '
                     f'{LINE_STRONG if i == 1 else LINE}; opacity: {1 if i == 1 else .7}">' for i in range(1, 7))
    return (f'<div style="display: flex; flex-direction: column; gap: 16px">'
            f'<div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px">'
            f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Design report")}'
            f'{text("body", "For the client · 6 pages · A4 landscape · " + KB(B["pdf"]), False, TEXT_2)}</div>'
            f'{button("Download PDF", "secondary", "standard", False, icon(ICON["download"], 16, TEXT_2))}</div>'
            f'<img src="handover_pages/page-1.png" alt="Page 1 of the design report: the summary" style="width: {w}px; border-radius: 8px; '
            f'box-shadow: 0 16px 40px rgba(0,0,0,.4)"><div style="display: flex; gap: 8px">{thumbs}</div></div>')


def preview_csv(w: int) -> str:
    names = [("Hour", "UTC"), ("Sunlight on the ground", "W/m²"), ("Sunlight on the modules", "W/m²"), ("Cell temperature", "°C"),
             ("DC power", "kW"), ("AC power", "kW")]
    cols = H["csv_head"][0].split(",")
    head = "".join(f'<th style="text-align: {"left" if i == 0 else "right"}; padding: 8px 12px; vertical-align: bottom">'
                   f'{text("strong", n)}<br>{text("unit", u + " · " + cols[i], False, TEXT_3)}</th>' for i, (n, u) in enumerate(names))
    body = ""
    for line in H["csv_head"][1:6]:
        v = line.split(",")
        v[0] = v[0][5:16].replace("-", " ").replace(" ", "-", 1)
        v[0] = "1 Jan " + line[11:16]
        body += "<tr>" + "".join(f'<td style="padding: 8px 12px; border-top: 1px solid {LINE_SUBTLE}; text-align: {"left" if i == 0 else "right"}; '
                                 f'{style("mono", False)}">{x if i == 0 else f"{max(float(x), 0):,.1f}"}</td>' for i, x in enumerate(v)) + "</tr>"
    return (f'<div style="display: flex; flex-direction: column; gap: 16px">'
            f'<div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 16px">'
            f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Hourly data")}'
            f'{text("body", "For you · 8,760 hours · " + KB(B["csv"]), False, TEXT_2)}</div>'
            f'{button("Download CSV", "secondary", "standard", False, icon(ICON["download"], 16, TEXT_2))}</div>'
            f'<div style="border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; overflow: hidden; width: {w}px">'
            f'<table style="border-collapse: collapse; width: 100%"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'
            f'{text("body", "The first 5 of 8,760 hours. Each column is named in the file as under its name here.", False, TEXT_2)}</div>')


def handover_desktop(selected: str = "report") -> str:
    bar = top_bar(ALL_DONE, "Handover", 1440)
    head = (f'<div style="position: absolute; left: 0; top: 56px; width: 1440px; padding: 32px 40px 0; box-sizing: border-box; display: flex; '
            f'justify-content: space-between; align-items: flex-start"><div style="display: flex; flex-direction: column; gap: 4px">'
            f'{text("title", "Handover", False, TEXT, "h1")}{explained("Handover")}</div><div style="display: flex; gap: 12px">'
            f'{button("Present", "secondary", "standard", False, icon(ICON["play"], 14, TEXT))}'
            f'{button("Download all · " + KB(H["files"]["bytes"]["zip"]), "primary", "primary", False, icon(ICON["download"], 18, ACCENT_INK))}</div></div>')
    lst = (f'<div style="position: absolute; left: 28px; top: 190px; width: 420px">{handover_list(selected, False)}</div>')
    pv = preview_report(860) if selected == "report" else preview_csv(820)
    prev = (f'<div style="position: absolute; left: 488px; top: 190px; right: 40px; padding: 24px; box-sizing: border-box; background: {SURFACE_1}; '
            f'border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px">{pv}</div>')
    return bar + head + lst + prev


# ---- Home ----

def home_bar(width: int, size: str) -> str:
    h = {"desktop": 56, "tablet": 60, "phone": 56}[size]
    word = (f'<span style="font-family: {DISPLAY_FAMILY}; font-weight: 600; font-size: 17px; color: {TEXT}">SolarLayout Rooftop</span>'
            if size != "phone" else "")
    return (f'<header style="height: {h}px; padding: 0 {16 if size == "phone" else 24}px; box-sizing: border-box; display: flex; align-items: center; '
            f'justify-content: space-between; background: {CHROME}; border-bottom: 1px solid {LINE_SUBTLE}">'
            f'<span style="display: inline-flex; align-items: center; gap: 10px">{LOGO}{word}</span>'
            f'{button("Docs", "quiet", "standard", size != "desktop", icon(STEP_ICON["book"], 16, TEXT_2))}</header>')


def search_block(touch: bool, width: int) -> str:
    field_ = (f'<label style="flex: 1; display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 16px; box-sizing: border-box; '
              f'background: {WELL}; border: 1px solid {LINE_STRONG}; border-radius: {RADIUS["row"]}px; box-shadow: {SHADOW_WELL}; min-width: 0">'
              f'{icon(ICON["search"], 20, TEXT_2)}{text("body", "Address or coordinates", touch, TEXT_3)}</label>')
    btn = button("Find the roof", "primary", "primary", touch, extra="height: 56px")
    row = (f'<div style="display: flex; gap: 12px; width: {width}px; max-width: 100%; flex-wrap: {"wrap" if touch and width < 500 else "nowrap"}">'
           f'{field_}{btn if not (touch and width < 500) else ""}</div>' + (f'<div style="width: 100%">{button("Find the roof", "primary", "primary", True, full=True)}</div>' if touch and width < 500 else ""))
    ways = [("location", "Use my location"), ("pencil", "Enter the roof by hand"), ("layers", "Import a drawing"), ("download", "Open a project file")]
    links = "".join(f'<a href="#" style="display: inline-flex; align-items: center; gap: 8px; min-height: {44 if touch else 40}px; padding: 0 4px; '
                    f'text-decoration: none; {style("strong", touch)}">{icon(ICON[k], 16, TEXT_2)}{w}</a>' for k, w in ways)
    return (f'<div style="display: flex; flex-direction: column; gap: 12px">{row}'
            f'<div style="display: flex; flex-wrap: wrap; gap: 4px 20px">{links}</div></div>')


def design_card(name: str, facts: str, when: str, figures: str, touch: bool, w: int, thumb: bool = True) -> str:
    th = (f'<div style="position: relative; height: {round(w * 0.5)}px; background: #12161D; border-bottom: 1px solid {LINE}; overflow: hidden">'
          f'{plan_svg(w, round(w * 0.5))}</div>' if thumb else
          f'<div style="height: {round(w * 0.5)}px; background: #12161D; border-bottom: 1px solid {LINE}; display: flex; align-items: center; '
          f'justify-content: center">{text("body", "Not built yet", touch, TEXT_3)}</div>')
    return (f'<article style="width: {w}px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; overflow: hidden">'
            f'{th}<div style="padding: 16px; display: flex; flex-direction: column; gap: 4px">'
            f'<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px">{text("strong", name, touch)}'
            f'<button type="button" aria-label="More for {name}" style="width: 32px; height: 32px; margin: -6px -8px 0 0; background: transparent; border: 0; '
            f'color: {TEXT_2}; font-size: 18px; line-height: 18px">⋯</button></div>'
            f'{text("body", facts, touch, TEXT_2)}{text("body", figures, touch) if figures else ""}{text("unit", when, False, TEXT_3)}</div></article>')


def designs(touch: bool, cols: int, w: int) -> str:
    cards = [("Pune demo roof", "90 × 40 m flat industrial roof", "Edited 2 hours ago", "617.8 MWh a year · 357.28 kWp", True),
             ("Hinjewadi Phase 2, Pune", "62 × 28 m flat roof", "Edited yesterday", "", False),
             ("Warehouse 7, Block B", "120 × 45 m, rows facing east and west", "Edited 3 days ago", "", False)]
    cw = (w - (cols - 1) * 16) // cols
    grid = "".join(design_card(a, b, c, d, touch, cw, e) for a, b, c, d, e in cards)
    return (f'<section style="display: flex; flex-direction: column; gap: 12px"><div style="display: flex; justify-content: space-between; align-items: baseline">'
            f'{section_title("Your designs · on this device", touch)}{text("body", "3 designs", touch, TEXT_2)}</div>'
            f'<div style="display: grid; grid-template-columns: repeat({cols}, {cw}px); gap: 16px">{grid}</div></section>')


def demo(touch: bool, w: int, compact: bool = False) -> str:
    inner = (f'<div style="display: flex; flex-direction: column; gap: 4px; flex: 1">{text("section", "Try the demo", touch)}'
             f'{text("body", "A finished design on a 90 × 40 m roof in Pune, to look around before you start your own.", touch, TEXT_2)}</div>'
             f'{button("Open the demo", "secondary", "standard", touch)}')
    return (f'<section style="display: flex; align-items: center; gap: 24px; padding: 20px; width: {w}px; box-sizing: border-box; background: {SURFACE_1}; '
            f'border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; flex-wrap: wrap">{inner}</section>')


def home_desktop(with_designs: bool) -> str:
    title = (f'<div style="display: flex; flex-direction: column; gap: 8px">{text("title", "Rooftop PV design", False, TEXT, "h1")}'
             f'{text("body", "Outline a roof on the map. The app lays out the modules, the shade, the strings and the energy of a year.", False, TEXT_2, "p")}</div>')
    body = (f'<div style="position: absolute; left: 0; top: 56px; width: 1440px; padding: 64px 0 0; box-sizing: border-box; display: flex; justify-content: center">'
            f'<div style="width: 960px; display: flex; flex-direction: column; gap: 40px">{title}{search_block(False, 960)}'
            + (designs(False, 3, 960) + demo(False, 960) if with_designs else demo(False, 960)) + '</div></div>')
    return home_bar(1440, "desktop") + body


CHANGES = [
    ("Handover · the list", "Specs as facts; badges PDF, PNG, BOM, DC, DXF, KMZ, CSV, RTD",
     "Grouped by who it is for; what it is and its size; the badge its format alone", "V2-90"),
    ("Handover · the preview", "Half the width empty under the bill of materials", "The rest of the width, the file as it is, its own Download", "V2-108"),
    ("Handover · words", "As the engine lists it; in the engine's order; layers and columns as the file names them",
     "No engine; the columns by plain name, the file's name under it; what is in a DXF behind a line", "V2-91, V2-92, V2-94"),
    ("Export, Save a copy, Download all", "Three names in four places for one zip and the project file",
     "Download all, Handover's primary; the project file a file of the list; Download in its card's menu", "V2-62"),
    ("Home · the head", "Find your roof. Design it in 3D. 72 px over an 18 px lead",
     "Rooftop PV design, the title at 26; one line of what the app does; the search the largest thing", "V2-03, V2-115"),
    ("Home · the search", "Search an address or p… cut by the button inside the field", "Address or coordinates; Find the roof beside the field", "V2-05"),
    ("Home · designs", "Under the demo; the search scrolled away", "First, under the search, which stays at the top; the demo after", "V2-14"),
    ("Home · the demo card", "Capacity and energy come with the run in the Studio", "Try the demo: one line of what it is, Open the demo", "V2-09"),
    ("Design card", "One card on Home, another in the project menu", "One card and one menu (Open, Rename, Duplicate, Download the project file, Delete) in both", "V2-36, V2-60"),
]


def build_desktop() -> None:
    w = 1440
    hd = board_head("V2 · 9 · Handover and Home", LINES, False, ISSUES)
    screens = (frame("1 · Handover: the files by who they are for; the design report in the rest of the width; Download all the one primary",
                     handover_desktop("report"), w, 1100)
               + frame("2 · Hourly data: its columns by their plain names, the file's own name under each", handover_desktop("csv"), w, 1100)
               + frame("3 · Home, the first visit: the title, one line, the search, the other ways in, the demo", home_desktop(False), w, 560)
               + frame("4 · Home with designs on this device: the designs first, under the search; the demo after", home_desktop(True), w, 940))
    body = f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{hd}{screens}{changes(CHANGES)}</div>'
    write_board(OUT, "V2HandoverHome.dc.html", "V2 · 9 · Handover and Home · desktop 1440", 1520, 4880, body)


def touch_handover(size: str) -> str:
    w, h = (834, 1194) if size == "tablet" else (390, 844)
    side = 20 if size == "tablet" else 16
    bar = top_bar(ALL_DONE, "Handover", w, size)
    page = (f'<div style="position: absolute; left: 0; top: {60 if size == "tablet" else 56}px; width: {w}px; padding: 24px {side - 12}px; box-sizing: border-box; '
            f'display: flex; flex-direction: column; gap: 16px"><div style="padding: 0 12px; display: flex; flex-direction: column; gap: 4px">'
            f'{text("title", "Handover", True, TEXT, "h1")}{explained("Handover", True)}</div>{handover_list("", True)}</div>')
    prim = (f'<div style="position: absolute; left: 0; bottom: {72 if size == "phone" else 0}px; width: {w}px; padding: 12px {side}px; box-sizing: border-box; '
            f'background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}; display: flex; justify-content: flex-end; gap: 12px">'
            + (button("Present", "secondary", "standard", True, icon(ICON["play"], 14, TEXT)) if size == "tablet" else "")
            + button("Download all · " + KB(H["files"]["bytes"]["zip"]), "primary", "primary", True, icon(ICON["download"], 18, ACCENT_INK), full=size == "phone") + '</div>')
    tb = f'<div style="position: absolute; left: 0; bottom: 0; width: {w}px">{tab_bar(ALL_DONE, "Handover")}</div>' if size == "phone" else ""
    return bar + page + prim + tb


def touch_home(size: str) -> str:
    w = 834 if size == "tablet" else 390
    side = 20 if size == "tablet" else 16
    cw = w - 2 * side
    title = (f'<div style="display: flex; flex-direction: column; gap: 8px">{text("title", "Rooftop PV design", True, TEXT, "h1")}'
             f'{text("body", "Outline a roof on the map. The app lays out the modules, the shade, the strings and the energy of a year.", True, TEXT_2, "p")}</div>')
    body = (f'<div style="position: absolute; left: 0; top: {60 if size == "tablet" else 56}px; width: {w}px; padding: 32px {side}px; box-sizing: border-box; '
            f'display: flex; flex-direction: column; gap: 32px">{title}{search_block(True, cw)}{designs(True, 2 if size == "tablet" else 1, cw)}{demo(True, cw)}</div>')
    return home_bar(w, size) + body


def build_touch(size: str) -> None:
    w = 834 if size == "tablet" else 390
    h = 1194 if size == "tablet" else 844
    side = 20 if size == "tablet" else 16
    hd = board_head("V2 · 9 · Handover and Home", LINES, True, ISSUES)
    screens = (frame("Handover: the list by who it is for is the page; Download all pinned at the foot; a file opens pushed over the list", touch_handover(size), w, h)
               + frame("Home with designs: the search first, the designs under it, the demo after", touch_home(size), w, 1500 if size == "tablet" else 2300))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 {side}px">{hd}</div>'
            f'{screens}<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, f"V2HandoverHome{size.capitalize()}.dc.html", f"V2 · 9 · Handover and Home · {size} {w}", w, 4380 if size == "tablet" else 5390, body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
