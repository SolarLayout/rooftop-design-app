"""The boards "V2 · 8 · Performance" on desktop 1440, tablet 834 and phone 390.

Performance redesigned as the page a buyer reads (plan/v2/audit.md: V2-13, V2-61, V2-71, V2-88, V2-89, V2-97, V2-114, V2-119).
Today the option and the weather are small at the top right, away from the number they change; six KPI tiles carry terms
(Specific yield, Capacity factor, In-plane irradiation); the P-values read "P50 · P75 · P90 · σ"; the loss chain is a table of
21 engine steps; the charts label two bars and no axis. V2: the lead number with its option and weather as its subtitle,
Likely and Conservative in place of P-values, three figures a buyer reads, the chain as Where the energy goes in eleven plain
steps with the ones the user may change marked as fields, All 21 steps behind a link, the charts with their axes and labels
beside the marks. Every figure is the engine's for the Pune demo, option A (plan/reference/demo-numbers.md).
Usage: python3 -I build_v2_performance.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT_INK, CHROME, CONTROL, GAIN, ICON, LINE, LINE_STRONG, LINE_SUBTLE, LOSS, RADIUS, SHADOW_RAISED, SHADOW_WELL,
    SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, board_head, button, changes, explained, frame, icon, mark, ring,
    section_title, segmented, style, summary_row, tab_bar, text, top_bar, write_board,
)

ISSUES = "Answers V2-13 · V2-61 · V2-71 · V2-88 · V2-89 · V2-97 · V2-114 · V2-119"
LINES = [
    "Performance leads with the one number and what it depends on: 617.8 MWh in year 1, with the option and the weather "
    "as its subtitle, each a select beside it. Under it Likely and Conservative, the P-values' plain names, and three "
    "figures a buyer reads: the system's size, the yield and the performance ratio, each with one line of what it means.",
    "The loss chain becomes Where the energy goes: eleven steps in plain words, from the sunlight on the modules to the "
    "grid, each a bar. The steps the user may change are fields, with who set them. The 21 steps of the engine are behind "
    "All 21 steps. The charts label their axes; the values stand beside the bars, in the text colour.",
]
DONE = {"Roof": "done", "Array": "done", "Strings": "done"}
MONTHS = [("Jan", 62.0), ("Feb", 58.8), ("Mar", 68.4), ("Apr", 64.1), ("May", 54.9), ("Jun", 46.9), ("Jul", 31.5),
          ("Aug", 38.5), ("Sep", 37.5), ("Oct", 53.4), ("Nov", 53.5), ("Dec", 48.5)]
YEARS = [(1, 617.8), (5, 605.6), (10, 590.6), (15, 576.0), (20, 561.7), (25, 547.8)]
# Where the energy goes: plain step, change %, the field (value, who set it) where the user may change it.
CHAIN = [("Sunlight on the tilted modules", "+9.60 %", "1,998 kWh/m² a year, 9.6 % more than on flat ground", None),
         ("Shade from rows, obstacles and the horizon", "−0.36 %", "", None),
         ("Dirt on the glass (soiling)", "−2.00 %", "", ("2.00", "Default")),
         ("Light reflected off the glass", "−2.22 %", "", None),
         ("Light on the back of the modules", "+3.65 %", "Bifacial modules, roof albedo 0.20", None),
         ("Heat", "−4.08 %", "Modules lose output as they warm", None),
         ("Low light and module quality", "−1.68 %", "", ("1.00", "Default")),
         ("Shade on a string", "−0.56 %", "A shaded module holds back its string", None),
         ("Cables", "−1.71 %", "", None),
         ("Inverter", "−4.69 %", "Its efficiency, and 3.36 % clipped at 275 kW", None),
         ("Downtime", "−0.50 %", "", ("0.50", "Default"))]


def select(label: str, value: str, touch: bool) -> str:
    return (f'<label style="display: flex; flex-direction: column; gap: 4px">{text("body", label, touch, TEXT_2)}'
            f'<span style="display: inline-flex; align-items: center; justify-content: space-between; gap: 12px; height: {44 if touch else 40}px; '
            f'padding: 0 12px; min-width: 200px; box-sizing: border-box; background: {CONTROL}; border: 1px solid {LINE_STRONG}; '
            f'border-radius: {RADIUS["control"]}px; box-shadow: {SHADOW_RAISED}">{text("strong", value, touch)}{icon(ICON["chevron-down"], 16, TEXT_2)}</span></label>')


def lead(touch: bool, updating: bool = False) -> str:
    value = "613.6" if updating else "617.8"
    big = (f'<div style="display: flex; align-items: baseline; gap: 10px; {"opacity: .55" if updating else ""}">{text("display", value, touch)}'
           f'{text("heading", "MWh", touch, TEXT_2)}</div>')
    likely = (f'<div style="display: flex; flex-wrap: wrap; gap: 4px 16px; align-items: center">'
              f'{text("body", "Likely", touch, TEXT_2)}{text("strong", ("613.6" if updating else "617.8") + " MWh", touch)}'
              f'{text("body", "Conservative (P90)", touch, TEXT_2)}{text("strong", ("580.3" if updating else "584.2") + " MWh", touch)}'
              f'<span style="display: inline-flex; align-items: center; gap: 4px">{text("body", "9 years in 10 at least", touch, TEXT_3)}</span></div>')
    sels = (f'<div style="display: flex; gap: 12px; flex-wrap: wrap">{select("Option", "A · Recommended", touch)}'
            f'{select("Weather", "Typical year", touch)}</div>')
    head = (f'<div style="display: flex; align-items: center; gap: 8px">{text("body", "Energy to the grid in year 1", touch, TEXT_2)}'
            + (ring(14) + text("body", "Updating", touch, TEXT_2) if updating else "") + '</div>')
    if touch:
        return f'<div style="display: flex; flex-direction: column; gap: 12px">{head}{big}{likely}{sels}</div>'
    return (f'<div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px">'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{head}{big}{likely}</div>{sels}</div>')


def kpis(touch: bool, cols: int) -> str:
    items = [("System size", "357.28", "kWp", "275 kW of inverter · DC/AC ratio 1.30"),
             ("Yield", "1,729", "kWh/kWp", "Energy a year for each kWp installed"),
             ("Performance ratio (PR)", "86.6", "%", "How much of its rated output the system gives in this sunlight")]
    tiles = "".join(f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 16px; background: {SURFACE_1}; border: 1px solid {LINE}; '
                    f'border-radius: {RADIUS["row"]}px; min-width: 0">{text("body", a, touch, TEXT_2)}'
                    f'<div style="display: flex; align-items: baseline; gap: 6px">{text("figure", b, touch)}{text("body", u, touch, TEXT_2)}</div>'
                    f'{text("body", d, touch, TEXT_2)}</div>' for a, b, u, d in items)
    more = (f'<a href="#" style="display: inline-flex; align-items: center; gap: 4px; text-decoration: none; {style("strong", touch, TEXT_2)}">'
            f'All figures: capacity factor, sunlight on the modules, CO₂ avoided{icon(ICON["chevron-right"], 14, TEXT_2)}</a>')
    return (f'<div style="display: flex; flex-direction: column; gap: 12px"><div style="display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); '
            f'gap: 16px">{tiles}</div>{more}</div>')


def chain(touch: bool, edited: bool = False) -> str:
    rows = ""
    for name, change, note, fld in CHAIN:
        if edited and name.startswith("Dirt"):
            change, fld = "−3.00 %", ("3.00", "Yours · default 2.00 · Reset")
        pct = float(change.replace("−", "-").replace("+", "").replace(" %", ""))
        gain = pct > 0
        w = min(abs(pct) / 10, 1) * (120 if touch else 160)
        bar = (f'<span style="display: inline-block; width: {120 if touch else 160}px; height: 8px; border-radius: 4px; background: {WELL}; position: relative; flex: none">'
               f'<span style="position: absolute; left: 0; top: 0; height: 8px; width: {w:.0f}px; border-radius: 4px; background: {GAIN if gain else LOSS}"></span></span>')
        field_html = ""
        if fld:
            v, who = fld
            field_html = (f'<span style="display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; background: {WELL}; '
                          f'border: 1px solid {LINE_STRONG}; border-radius: {RADIUS["control"]}px; box-shadow: {SHADOW_WELL}">'
                          f'{text("mono", v, touch)}{text("unit", "%", False, TEXT_2)}</span>{text("unit", who, False, TEXT_3)}')
        sub = text("body", note, touch, TEXT_2) if note else ""
        right = (f'<div style="display: flex; align-items: center; gap: 12px; flex: none">{field_html}'
                 f'<span style="width: 64px; text-align: right; {style("strong", touch)}">{change}</span>{bar}</div>')
        if touch:
            rows += (f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}">'
                     f'{text("body", name, touch)}{sub}{right}</div>')
        else:
            rows += (f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; padding: 6px 0; '
                     f'border-top: 1px solid {LINE_SUBTLE}"><div style="display: flex; flex-direction: column; gap: 2px; min-width: 0">'
                     f'{text("body", name, touch)}{sub}</div>{right}</div>')
        if name.startswith("Light on the back"):
            rows += (f'<div style="display: flex; justify-content: space-between; padding: 10px 12px; margin: 4px 0; background: {SURFACE_2}; '
                     f'border-radius: {RADIUS["control"]}px">{text("strong", "The modules\' rated output", touch)}{text("strong", "706.4 MWh", touch)}</div>')
    total = (f'<div style="display: flex; justify-content: space-between; padding: 12px; margin-top: 4px; background: {SURFACE_2}; '
             f'border-radius: {RADIUS["control"]}px">{text("strong", "To the grid", touch)}{text("strong", ("613.6" if edited else "617.8") + " MWh", touch)}</div>')
    link = (f'<a href="#" style="display: inline-flex; align-items: center; gap: 4px; text-decoration: none; margin-top: 8px; {style("strong", touch, TEXT_2)}">'
            f'All 21 steps{icon(ICON["chevron-right"], 14, TEXT_2)}</a>')
    return (f'<section style="display: flex; flex-direction: column; gap: 4px">{section_title("Where the energy goes", touch)}'
            f'{text("body", "From the sunlight on the modules to the grid. Fields are yours to change.", touch, TEXT_2, "p", "margin-bottom: 8px")}{rows}{total}{link}</section>')


def month_chart(w: int, touch: bool) -> str:
    h, left, bottom, top = 210, 36, 24, 30
    pw = w - left
    bw = pw / 12
    mx = 80
    y = lambda v: top + (h - top - bottom) * (1 - v / mx)
    grid = "".join(f'<line x1="{left}" x2="{w}" y1="{y(t):.1f}" y2="{y(t):.1f}" stroke="{LINE}" stroke-width="1"></line>'
                   f'<text x="{left - 8}" y="{y(t) + 4:.1f}" text-anchor="end" font-family="Geist, sans-serif" font-size="12" fill="{TEXT_3}">{t}</text>'
                   for t in (0, 20, 40, 60, 80))
    bars = ""
    hi, lo = max(v for _, v in MONTHS), min(v for _, v in MONTHS)
    for i, (m, v) in enumerate(MONTHS):
        x = left + i * bw + bw * 0.18
        bars += (f'<rect x="{x:.1f}" y="{y(v):.1f}" width="{bw * 0.64:.1f}" height="{y(0) - y(v):.1f}" rx="3" fill="{GAIN}"></rect>'
                 f'<text x="{x + bw * 0.32:.1f}" y="{h - 6}" text-anchor="middle" font-family="Geist, sans-serif" font-size="12" fill="{TEXT_2}">{m[0] if touch else m}</text>')
        if v in (hi, lo):
            bars += (f'<text x="{x + bw * 0.32:.1f}" y="{y(v) - 6:.1f}" text-anchor="middle" font-family="Geist, sans-serif" font-size="12" '
                     f'font-weight="500" fill="{TEXT}">{v}</text>')
    svg = (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Energy by month, MWh: highest March 68.4, lowest July 31.5">'
           f'{grid}{bars}<text x="0" y="12" font-family="Geist, sans-serif" font-size="12" fill="{TEXT_3}">MWh</text></svg>')
    return (f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; align-items: center">'
            f'{section_title("Energy by month", touch)}{segmented(["Chart", "Table"], 0, touch)}</div>{svg}</section>')


def years_chart(w: int, touch: bool) -> str:
    h, left, bottom, top = 170, 44, 24, 28
    lo, hi = 520, 640
    x = lambda yr: left + (w - left - 8) * (yr - 1) / 24
    y = lambda v: top + (h - top - bottom) * (1 - (v - lo) / (hi - lo))
    pts = " ".join(f"{x(a):.1f},{y(b):.1f}" for a, b in YEARS)
    grid = "".join(f'<line x1="{left}" x2="{w}" y1="{y(t):.1f}" y2="{y(t):.1f}" stroke="{LINE}"></line>'
                   f'<text x="{left - 8}" y="{y(t) + 4:.1f}" text-anchor="end" font-family="Geist, sans-serif" font-size="12" fill="{TEXT_3}">{t}</text>'
                   for t in (520, 560, 600, 640))
    ticks = "".join(f'<text x="{x(a):.1f}" y="{h - 6}" text-anchor="middle" font-family="Geist, sans-serif" font-size="12" fill="{TEXT_2}">{a}</text>' for a, _ in YEARS)
    svg = (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Energy each year falls from 617.8 MWh in year 1 to 547.8 MWh in year 25">'
           f'{grid}<polyline points="{pts}" fill="none" stroke="{GAIN}" stroke-width="2"></polyline>{ticks}'
           f'<text x="{x(1) + 6:.1f}" y="{y(617.8) - 8:.1f}" font-family="Geist, sans-serif" font-size="12" font-weight="500" fill="{TEXT}">617.8</text>'
           f'<text x="{x(25) - 4:.1f}" y="{y(547.8) - 8:.1f}" text-anchor="end" font-family="Geist, sans-serif" font-size="12" font-weight="500" fill="{TEXT}">547.8</text>'
           f'<text x="0" y="12" font-family="Geist, sans-serif" font-size="12" fill="{TEXT_3}">MWh</text></svg>')
    return (f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; align-items: baseline">'
            f'{section_title("25 years", touch)}{text("body", "14,554 MWh in all · 0.7 % less each year", touch, TEXT_2)}</div>{svg}'
            f'{text("unit", "Year", False, TEXT_3)}</section>')


def assumptions(touch: bool) -> str:
    return (f'<section>{section_title("Assumptions", touch)}'
            + summary_row("Weather", "Typical year · PVGIS · 1,822.9 kWh/m² on the ground", touch, state="Default")
            + summary_row("Roof albedo", "0.20 · how much light the roof reflects", touch, state="Default")
            + summary_row("Ageing", "0.7 % less each year", touch, state="Default")
            + summary_row("Uncertainty", "4.24 % · sets Likely and Conservative", touch, state="Default")
            + summary_row("Grid CO₂ per MWh", "0.716 t · India's grid", touch, state="Set for India") + '</section>')


def page_head(touch: bool, phone: bool = False) -> str:
    present = button("Present", "secondary", "standard", touch, icon(ICON["play"], 14, TEXT))
    prim = button("Continue to Handover " + icon(ICON["arrow-right"], 18, ACCENT_INK), "primary", "primary", touch)
    acts = "" if phone else f'<div style="display: flex; gap: 12px; align-items: center">{present}{prim}</div>'
    return (f'<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px">'
            f'<div style="display: flex; flex-direction: column; gap: 4px">{text("title", "Performance", touch, TEXT, "h1")}{explained("Performance", touch)}</div>{acts}</div>')


def desktop_page(edited: bool = False) -> str:
    body = (f'<div style="position: absolute; left: 0; top: 56px; width: 1440px; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px">'
            f'{page_head(False)}{lead(False, edited)}{kpis(False, 3)}'
            f'<div style="display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 40px; align-items: start">'
            f'{chain(False, edited)}<div style="display: flex; flex-direction: column; gap: 40px">{month_chart(560, False)}{years_chart(560, False)}{assumptions(False)}</div></div></div>')
    return top_bar(DONE, "Performance", 1440, result="613.6" if edited else "617.8") + body


CHANGES = [
    ("Performance · header", "The option switch and the weather small at the top right, after the title",
     "Under the lead number, as its subtitle: Option and Weather, each a select of 40", "V2-88"),
    ("Performance · the P-values", "P50 617.8 · P75 600.2 · P90 · σ 4.24 % 584.2", "Likely 617.8 · Conservative (P90) 584.2, 9 years in 10 at least; σ in the assumptions", "V2-89"),
    ("Performance · KPIs", "Six tiles: PR, Specific yield, Capacity factor AC · 19.7 % DC, In-plane, CO₂ …",
     "Three: System size, Yield, Performance ratio (PR), each with its line; the rest behind All figures", "V2-88"),
    ("components.md · Loss chain", "21 engine steps in a table, the editable ones marked by a border",
     "Where the energy goes: eleven plain steps with bars, fields where the user may change, who set them; All 21 steps", "V2-88"),
    ("guidelines.md · Charts", "Labels on the extremes only, no axis; labels on the bar in white",
     "Axes labelled; values beside the marks in the text colour; Chart and Table at the chart's head", "V2-71, V2-119"),
    ("One value, one home", "Roof albedo on Roof and Performance; degradation in two cards",
     "Roof albedo and Ageing in the assumptions alone", "V2-61"),
    ("Weather select", "Typical year · PVGIS horizon; The year 2023 · no horizon", "Typical year · 2023, measured · Your file", "V2-97"),
]


def build_desktop() -> None:
    w = 1440
    hd = board_head("V2 · 8 · Performance", LINES, False, ISSUES)
    screens = (frame("1 · Performance: the number, what it depends on beside it, three figures, where the energy goes, the year by month and over 25 years",
                     desktop_page(), w, 1560)
               + frame("2 · Dirt on the glass changed to 3.00 %: the field says Yours with its default and Reset; the number updates where it stands",
                       desktop_page(True), w, 820))
    body = f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{hd}{screens}{changes(CHANGES)}</div>'
    write_board(OUT, "V2Performance.dc.html", "V2 · 8 · Performance · desktop 1440", 1520, 3320, body)


def touch_page(size: str) -> str:
    w = 834 if size == "tablet" else 390
    side = 20 if size == "tablet" else 16
    bar = top_bar(DONE, "Performance", w, size)
    phone = size == "phone"
    cw = w - 2 * side
    content = (f'<div style="position: absolute; left: 0; top: {60 if size == "tablet" else 56}px; width: {w}px; padding: 24px {side}px; box-sizing: border-box; '
               f'display: flex; flex-direction: column; gap: 32px">{page_head(True, phone)}{lead(True)}{kpis(True, 1 if phone else 3)}'
               f'{chain(True)}{month_chart(cw, True)}{years_chart(cw, True)}{assumptions(True)}</div>')
    out = bar + content
    if phone:
        out += (f'<div style="position: absolute; left: 0; bottom: 72px; width: 390px; padding: 12px 16px; box-sizing: border-box; background: {CHROME}; '
                f'border-top: 1px solid {LINE_SUBTLE}">{button("Continue to Handover " + icon(ICON["arrow-right"], 18, ACCENT_INK), "primary", "primary", True, full=True)}</div>'
                f'<div style="position: absolute; left: 0; bottom: 0; width: 390px">{tab_bar(DONE, "Performance")}</div>')
    return out


def build_touch(size: str) -> None:
    w = 834 if size == "tablet" else 390
    side = 20 if size == "tablet" else 16
    fh = 2880 if size == "tablet" else 3500
    hd = board_head("V2 · 8 · Performance", LINES, True, ISSUES)
    words = ("The whole page, one column: the number and its selects, the three figures in a row, the chain, the charts"
             if size == "tablet" else "The whole page; Continue to Handover pinned over the tab bar; the chain's rows stacked")
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 {side}px">{hd}</div>'
            f'{frame(words, touch_page(size), w, fh)}<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, f"V2Performance{size.capitalize()}.dc.html", f"V2 · 8 · Performance · {size} {w}", w, fh + (1380 if size == "tablet" else 1810), body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
