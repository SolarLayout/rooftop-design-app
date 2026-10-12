"""The boards "V2 · 6 · The Strings step" on desktop 1440, tablet 834 and phone 390.

The Strings lens re-layered (plan/v2/audit.md: V2-12, V2-28, V2-29, V2-78; voice §6). Today the lens leads with the engine's
proof (the series bar, "Voc at 11.9 °C is 1,480 V …"), a paragraph of rules sits under the options, and Add your own, MPPT
loading and the sizing temperatures are below the fold. V2: the options first, each saying why it is there in two or three
words; the chosen one says that it fits, with Why behind it for the proof; the rules behind How the options are made; Add your
own in view; the inverter, the voltage, the MPPT loading and the sizing as lines that open; the legend at a fixed place.
The strings, the options and every figure are the engine's for the Pune demo at 1500 V (strings_lens_data.json); the roof is
drawn in plan, north up, as the stage's Plan view draws it.
Usage: python3 -I build_v2_strings.py [--out <folder>]
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, ACCENT_INK, CHROME, CONTROL_ACTIVE, EXPLAIN, HALO_SELECTED, ICON, LINE, LINE_STRONG, LINE_SUBTLE, NOTE_SURFACE,
    OK, RADIUS, SERIES, SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, UNUSED, WELL, board_head, button, changes, explained,
    field, frame, icon, mark, section_title, segmented, style, summary_row, tab_bar, text, top_bar, work_column, write_board,
)
from build_v2_progression import view_controls  # noqa: E402

DATA = json.loads((HERE / "strings_lens_data.json").read_text(encoding="utf-8"))
OPTIONS = DATA["at_1500"]["options"]
A = OPTIONS[0]
ISSUES = "Answers V2-12 · V2-21 · V2-28 · V2-29 · V2-46 · V2-54 · V2-78"
LINES = [
    "The Strings step leads with what the user decides: the options, best first. Each says why it is there in two or three "
    "words. The chosen one says it fits; its proof (the voltages at the coldest and hottest hours) is behind Why.",
    "The rules the options are made by move behind How the options are made, in three plain lines. Add your own option "
    "stands under the options, in view. The inverter, the system voltage, the MPPT loading and the sizing temperatures are "
    "lines of facts that open, each saying who set it.",
    "The strings are drawn on the roof in the colour of their MPPT. The legend stands at a fixed place, at the stage's "
    "foot on desktop and tablet, at the sheet's head on phone, never over the roof.",
]
DONE = {"Roof": "done", "Array": "done"}
CAPTIONS = {"A": "Recommended", "B": "Less clipping", "C": "Least clipping", "D": "Below target", "E": "Below target"}


# ---- The roof in plan, the modules by MPPT ----

def plan_svg(w: int, h: int, colour_by: str = "mppt", traced: str = "") -> str:
    s = min((w - 48) / 90, (h - 48) / 40)
    ox, oy = (w - 90 * s) / 2, (h - 40 * s) / 2
    xy = lambda x, y: (ox + x * s, oy + (40 - y) * s)
    colour = {}
    for st in A["strings"]:
        key = st["mppt"] if colour_by == "mppt" else int(st["label"][1:])
        for m in st["modules"]:
            colour[m] = (SERIES[(key - 1) % 6], st["label"])
    parts = [f'<rect x="{ox:.1f}" y="{oy:.1f}" width="{90 * s:.1f}" height="{40 * s:.1f}" fill="#D3D6DB" stroke="#ECEEF0" stroke-width="2"></rect>']
    for m in DATA["modules"]:
        pts = " ".join(f"{a:.1f},{b:.1f}" for a, b in (xy(*p) for p in m["outline"]))
        c, label = colour.get(m["idx"], (UNUSED, ""))
        op = 1 if (not traced or label == traced) else 0.35
        parts.append(f'<polygon points="{pts}" fill="{c}" fill-opacity="{op}" stroke="#0B0E13" stroke-width="0.6"></polygon>')
    for cx, cy, bw, bh in [(22.5, 18, 5, 4), (70.75, 3.5, 1.5, 1), (73.75, 3.5, 1.5, 1), (76.75, 3.5, 1.5, 1), (79.75, 3.5, 1.5, 1)]:
        x, y = xy(cx - bw / 2, cy + bh / 2)
        parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw * s:.1f}" height="{bh * s:.1f}" fill="#F1F2F4" stroke="#868D99"></rect>')
    tx, ty = xy(62, 24)
    parts.append(f'<circle cx="{tx:.1f}" cy="{ty:.1f}" r="{1.25 * s:.1f}" fill="#F1F2F4" stroke="#868D99"></circle>')
    ix, iy = xy(45, 0.5)
    parts.append(f'<rect x="{ix - 7:.1f}" y="{iy - 5:.1f}" width="14" height="10" rx="2" fill="{ACCENT}" stroke="#0B0E13"></rect>')
    if traced:
        st = next(x for x in A["strings"] if x["label"] == traced)
        mods = {m["idx"]: m for m in DATA["modules"]}
        cs = [xy(sum(p[0] for p in mods[i]["outline"]) / 4, sum(p[1] for p in mods[i]["outline"]) / 4) for i in st["modules"]]
        parts.append(f'<polyline points="{" ".join(f"{a:.1f},{b:.1f}" for a, b in cs)}" fill="none" stroke="#FFFFFF" stroke-width="2"></polyline>')
    return (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Plan of the Pune demo roof, north up: '
            f'22 strings of 29 modules, coloured by their MPPT" style="position: absolute; left: 0; top: 0">{"".join(parts)}</svg>')


def legend(touch: bool, compact: bool = False, short: bool = False) -> str:
    entries = "".join(f'<span style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap">'
                      f'<span style="width: 10px; height: 10px; border-radius: 3px; background: {SERIES[i]}"></span>'
                      f'{text("body", ("" if (compact or short) else "MPPT ") + str(i + 1), touch, TEXT_2)}</span>' for i in range(6))
    unused = (f'<span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; '
              f'background: {UNUSED}"></span>{text("body", "Not used", touch, TEXT_2)}</span>')
    by = segmented(["String", "MPPT", "Inverter"], 1, touch) if not compact else ""
    return (f'<div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap">{by}'
            f'<div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">{entries}{unused}</div></div>')


# ---- The column ----

def option(o: dict, selected: bool, touch: bool, why_open: bool = False) -> str:
    letter = o["letter"]
    look = (f"background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; box-shadow: {HALO_SELECTED}" if selected
            else f"background: {SURFACE_1}; border: 1px solid {LINE}")
    facts = f'{o["n_series"]} × {o["n_strings"]} · {o["dc_kwp"]:.2f} kWp' + (f' · {o["n_inverters"]} inverters' if o["n_inverters"] > 1 else "")
    badge = (f'<span style="width: 24px; height: 24px; border-radius: 6px; flex: none; display: inline-flex; align-items: center; justify-content: center; '
             f'background: {ACCENT if selected else CONTROL_ACTIVE}; {style("strong", False, ACCENT_INK if selected else TEXT)}">{letter}</span>')
    row = (f'<div style="display: flex; align-items: center; gap: 12px; min-height: {64 if touch else 56}px">{badge}'
           f'<div style="flex: 1; min-width: 0; display: flex; flex-direction: column">{text("strong", CAPTIONS[letter], touch)}'
           f'{text("body", facts, touch, TEXT_2)}</div>{text("strong", f"{o['energy_mwh']:.1f}", touch)}{text("unit", "MWh", False, TEXT_2)}'
           f'{mark("fits" if o["ok"] else "note", 16)}</div>')
    extra = ""
    if selected:
        extra = (f'<div style="display: flex; align-items: center; gap: 8px; padding: 0 0 12px 36px">{mark("fits", 14)}'
                 f'{text("body", "29 modules a string fits at 1500 V", touch)}'
                 f'<a href="#" style="margin-left: auto; display: inline-flex; align-items: center; gap: 2px; text-decoration: none; {style("strong", touch, TEXT_2)}">Why'
                 f'{icon(ICON["chevron-down" if why_open else "chevron-right"], 14, TEXT_2)}</a></div>')
        if why_open:
            extra += why(touch)
    return f'<div style="padding: 0 12px; border-radius: {RADIUS["row"]}px; {look}">{row}{extra}</div>'


def why(touch: bool) -> str:
    """The proof, behind Why: the lengths that fit at this voltage, and the two voltages that bound them."""
    sr = DATA["at_1500"]["series_range"]
    lo, hi, top = sr["n_min"], sr["n_max"], 35
    band = (f'<div style="position: relative; height: 8px; border-radius: 4px; background: {WELL}; margin: 8px 0 4px">'
            f'<span style="position: absolute; left: {(lo - 1) / top * 100:.1f}%; width: {(hi - lo) / top * 100:.1f}%; top: 0; height: 8px; '
            f'border-radius: 4px; background: {OK}; opacity: .55"></span>'
            f'<span style="position: absolute; left: calc({(29 - 1) / top * 100:.1f}% - 2px); top: -4px; width: 4px; height: 16px; border-radius: 2px; background: {ACCENT}"></span></div>'
            f'<div style="display: flex; justify-content: space-between">{text("unit", "14 at least", False, TEXT_2)}{text("unit", "29 at most", False, TEXT_2)}</div>')
    lines = [("On the coldest morning, 11.9 °C", "A string of 29 reaches 1,480 V, under the 1500 V limit"),
             ("On the hottest afternoon, 64.3 °C in the cell", "It gives 1,097 V, over the inverter's 500 V minimum")]
    rows = "".join(f'<div style="display: flex; flex-direction: column; gap: 2px">{text("body", a, touch, TEXT_2)}{text("body", b, touch)}</div>' for a, b in lines)
    return (f'<div style="margin: 0 0 12px 36px; padding: 12px; background: {SURFACE_2}; border-radius: {RADIUS["control"]}px; display: flex; flex-direction: column; gap: 12px">'
            f'<div>{text("body", "Modules a string can hold at 1500 V", touch, TEXT_2)}{band}</div>{rows}</div>')


def options_section(touch: bool, why_open: bool = False, all_open: bool = False) -> str:
    shown = OPTIONS if all_open else OPTIONS[:3]
    cards = "".join(option(o, o["letter"] == "A", touch, why_open) for o in shown)
    more = "" if all_open else (f'<a href="#" style="display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; text-decoration: none; '
                                f'{style("body", touch, TEXT_2)}">{mark("note", 14)}2 more, below the DC/AC target{icon(ICON["chevron-down"], 14, TEXT_2)}</a>')
    own = (f'<button type="button" style="display: flex; align-items: center; justify-content: center; gap: 8px; height: {44 if touch else 40}px; '
           f'border: 1px dashed {LINE_STRONG}; border-radius: {RADIUS["row"]}px; background: transparent; {style("strong", touch)}">'
           f'{icon(ICON["plus"], 16, TEXT_2)}Add your own option</button>')
    how = (f'<a href="#" style="display: inline-flex; align-items: center; gap: 4px; text-decoration: none; {style("body", touch, TEXT_2)}">'
           f'How the options are made{icon(ICON["chevron-right"], 14, TEXT_2)}</a>')
    return (f'<div style="display: flex; flex-direction: column; gap: 8px">{section_title("Options", touch)}{cards}{more}{own}{how}</div>')


def summaries(touch: bool) -> str:
    return ("<div>" + summary_row("Inverter", "WattPower WP-330KTL-H1 · 275 kW · 6 MPPT", touch, state="Default")
            + summary_row("System voltage", "1500 V", touch, state="Yours")
            + summary_row("MPPT loading", "4, 4, 4, 4, 3 and 3 strings · within limits", touch)
            + summary_row("Sizing temperatures", "11.9 °C to 64.3 °C in the cell", touch, state="From the weather") + "</div>")


def head(touch: bool) -> str:
    return (f'<div style="display: flex; flex-direction: column; gap: 4px">{text("heading", "Check the strings", touch, TEXT, "h2")}'
            f'{explained("Strings", touch)}</div>')


def foot(touch: bool) -> str:
    arrow = icon(ICON["arrow-right"], 18, ACCENT_INK)
    return button("Continue to Performance " + arrow, "primary", "primary", touch, full=True)


def stage(w: int, h: int, top: int, touch: bool, traced: str = "", legend_at: str = "foot") -> str:
    plan = plan_svg(w, h - (72 if legend_at == "foot" else 0), traced=traced)
    title = (f'<div style="position: absolute; left: {40 if w > 1000 else 20}px; top: {32 if w > 1000 else 20}px; display: flex; flex-direction: column; gap: 4px; z-index: 1">'
             f'{text("title", "Strings", touch)}{text("body", "22 strings of 29 · 1 inverter · 152 positions not used", touch, TEXT_2)}</div>')
    ctl = f'<div style="position: absolute; right: {24 if w > 1000 else 20}px; top: {32 if w > 1000 else 20}px; z-index: 1">{view_controls(touch, plan=True)}</div>' if w > 500 else ""
    leg = (f'<div style="position: absolute; left: 0; bottom: 0; width: {w}px; height: 72px; box-sizing: border-box; padding: 0 {40 if w > 1000 else 20}px; '
           f'display: flex; align-items: center; border-top: 1px solid {LINE_SUBTLE}">{legend(touch, short=w < 1000)}</div>') if legend_at == "foot" else ""
    tip = ""
    if traced:
        tip = (f'<div style="position: absolute; left: 470px; top: 600px; padding: 10px 14px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; '
               f'border-radius: {RADIUS["row"]}px; display: flex; flex-direction: column; gap: 2px; z-index: 1">{text("strong", "String S1 · MPPT 1")}'
               f'{text("body", "29 modules · 0.0 % shaded", False, TEXT_2)}</div>')
    return (f'<div style="position: absolute; left: 0; top: {top}px; width: {w}px; height: {h}px; overflow: hidden">'
            f'<div style="position: absolute; left: 0; top: 0; width: {w}px; height: {h - 72 if legend_at == "foot" else h}px">{plan}</div>{title}{ctl}{leg}{tip}</div>')


def desktop_screen(why_open: bool = False, traced: str = "") -> str:
    bar = top_bar(DONE, "Strings", 1440)
    return bar + stage(1056, 844, 56, False, traced) + work_column(head(False) + options_section(False, why_open) + summaries(False), foot(False))


def panel_crop(title: str, inner: str) -> str:
    return (f'<div style="width: 384px; padding: 24px; box-sizing: border-box; background: {CHROME}; border: 1px solid {LINE}; '
            f'border-radius: {RADIUS["row"]}px; display: flex; flex-direction: column; gap: 16px">{text("unit", title, False, TEXT_3)}{inner}</div>')


def how_made(touch: bool) -> str:
    rules = ["Each option keeps the DC/AC ratio between 1.10 and 1.30. Above 1.40 it is marked.",
             "An MPPT takes at most 4 strings: 4 strings of 13.58 A stay under its 65.0 A.",
             "The least shaded strings are used first."]
    lis = "".join(f'<li style="margin: 0 0 8px; {style("body", touch)}">{r}</li>' for r in rules)
    return (f'{section_title("How the options are made", touch)}<ol style="margin: 0; padding-left: 20px">{lis}</ol>'
            f'{text("body", "D and E fill two inverters, so their DC/AC ratio is 0.71, under the target.", touch, TEXT_2, "p")}')


def own_form(touch: bool) -> str:
    return (f'{section_title("Your own option", touch)}{explained("Your own option", touch)}'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{field("Modules a string", "26", "", "14 to 29 fit", touch, 96)}'
            f'{field("Strings", "24", "", "Up to 24 on this inverter", touch, 96)}{field("Inverters", "1", "", "", touch, 96)}</div>'
            f'<div style="display: flex; align-items: center; gap: 8px">{mark("fits", 16)}{text("body", "Fits · 349.44 kWp · DC/AC ratio 1.27", touch)}</div>'
            f'<div style="display: flex; justify-content: flex-end; gap: 8px">{button("Cancel", "quiet", "standard", touch)}{button("Add option", "secondary", "standard", touch)}</div>')


def mppt_open(touch: bool) -> str:
    loads = A["mppt_loads"]
    rows = "".join(f'<div style="display: flex; align-items: center; gap: 12px; min-height: 40px; border-top: 1px solid {LINE_SUBTLE}">'
                   f'<span style="width: 10px; height: 10px; border-radius: 3px; background: {SERIES[i]}"></span>{text("body", "MPPT " + str(l["mppt"]), touch)}'
                   f'<span style="margin-left: auto">{text("body", str(l["strings"]) + " strings", touch)}</span>'
                   f'{text("body", f"{l['imp_a']:.1f} of {l['imp_limit_a']:.0f} A", touch, TEXT_2)}{mark("fits", 14)}</div>' for i, l in enumerate(loads))
    return (f'{section_title("MPPT loading", touch)}{text("body", "The current each MPPT takes, against what it allows.", touch, TEXT_2)}<div>{rows}</div>')


CHANGES = [
    ("components.md · Series range bar", "The bar and the engine's sentence lead the lens",
     "The chosen option says it fits; the bar and the two voltages behind Why, in plain words", "V2-28"),
    ("components.md · Option card", "A letter, a title or a verdict, a mono line of specs",
     "A letter, why it is there (Recommended, Less clipping, Below target), the facts, the energy; D and E behind 2 more", "V2-28, V2-54"),
    ("Strings lens · the rules paragraph", "Target DC/AC 1.10–1.30 … (4 × 13.58 A ≤ 65.0 A) … under the options",
     "Behind How the options are made, three numbered lines", "V2-29"),
    ("Strings lens · order", "Inverter, voltage, series, options, rules, MPPT loading, sizing, limits",
     "Options and Add your own first; inverter, voltage, MPPT loading, sizing as lines that open", "V2-12"),
    ("Strings on the roof · legend", "A card over the roof's near corner; on phone a band over the roof",
     "At the stage's foot on desktop and tablet; at the sheet's head on phone", "V2-66, V2-78"),
    ("Wording", "1 inverter(s); 29 × 22 · 357.28 · 1.30", "1 inverter, 2 inverters; 29 × 22 · 357.28 kWp", "V2-46, V2-54"),
]


def build_desktop() -> None:
    w = 1440
    hd = board_head("V2 · 6 · The Strings step", LINES, False, ISSUES)
    crops = (f'<div style="display: grid; grid-template-columns: repeat(3, 384px); gap: 24px">'
             + panel_crop("How the options are made, opened", how_made(False))
             + panel_crop("Add your own option, pressed", own_form(False))
             + panel_crop("MPPT loading, opened", mppt_open(False)) + '</div>')
    screens = (frame("1 · The Strings step: the options first, A chosen and saying it fits; Add your own in view; the rest as lines that open; the legend at the stage's foot",
                     desktop_screen(), w, 900)
               + frame("2 · Why, opened: the lengths that fit at 1500 V, and the coldest and hottest hours in plain words; a string traced on the roof",
                       desktop_screen(True, "S1"), w, 900)
               + f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px">{text("body", "3 · What opens from the column", False, TEXT_2)}{crops}</figure>')
    body = (f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{hd}{screens}{changes(CHANGES)}</div>')
    write_board(OUT, "V2Strings.dc.html", "V2 · 6 · The Strings step · desktop 1440", 1520, 3200, body)


def tablet_screen() -> str:
    bar = top_bar(DONE, "Strings", 834, "tablet")
    st = stage(834, 440, 60, True, legend_at="foot")
    result = (f'<div style="position: absolute; left: 0; top: 500px; width: 834px; height: 56px; padding: 0 20px; box-sizing: border-box; display: flex; '
              f'align-items: center; gap: 10px; background: {SURFACE_1}; border-bottom: 1px solid {LINE_SUBTLE}">{text("strong", "617.8", True)}'
              f'{text("body", "MWh a year · 357.28 kWp · 1 inverter", True, TEXT_2)}</div>')
    col = (f'<div style="position: absolute; left: 0; top: 556px; width: 834px; height: 538px; background: {CHROME}; padding: 24px 20px; '
           f'box-sizing: border-box; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; overflow: hidden">'
           f'<div style="display: flex; flex-direction: column; gap: 16px">{head(True)}{options_section(True)}</div><div>{summaries(True)}</div></div>')
    ft = (f'<div style="position: absolute; left: 0; bottom: 0; width: 834px; height: 100px; background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}; '
          f'padding: 0 20px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between">'
          f'{text("body", "Next: Performance, the energy in a year.", True, TEXT_2)}{button("Continue to Performance " + icon(ICON["arrow-right"], 18, ACCENT_INK), "primary", "primary", True)}</div>')
    return bar + st + result + col + ft


def phone_screen() -> str:
    bar = top_bar(DONE, "Strings", 390, "phone")
    st = (f'<div style="position: absolute; left: 0; top: 56px; width: 390px; height: 330px; overflow: hidden">{plan_svg(390, 330)}'
          f'<div style="position: absolute; left: 16px; top: 12px">{text("title", "Strings", True)}</div></div>')
    sheet = (f'<div style="position: absolute; left: 0; top: 370px; width: 390px; height: 402px; background: {CHROME}; border-top: 1px solid {LINE}; '
             f'border-radius: 24px 24px 0 0; box-sizing: border-box; display: flex; flex-direction: column">'
             f'<span style="align-self: center; width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}; margin: 8px 0 4px"></span>'
             f'<div style="padding: 4px 16px 8px; border-bottom: 1px solid {LINE_SUBTLE}">{legend(True, compact=True)}</div>'
             f'<div style="flex: 1; padding: 12px 16px 0; display: flex; flex-direction: column; gap: 12px; overflow: hidden">{head(True)}{options_section(True)}</div>'
             f'<div style="padding: 12px 16px 16px; border-top: 1px solid {LINE_SUBTLE}">{foot(True)}</div></div>')
    return bar + st + sheet + f'<div style="position: absolute; left: 0; bottom: 0; width: 390px">{tab_bar(DONE, "Strings")}</div>'


def build_touch(size: str) -> None:
    w = 834 if size == "tablet" else 390
    h = 1194 if size == "tablet" else 844
    side = 20 if size == "tablet" else 16
    hd = board_head("V2 · 6 · The Strings step", LINES, True, ISSUES)
    sc = tablet_screen() if size == "tablet" else phone_screen()
    words = ("The stage 440 with the legend at its foot; the result row; the column in two halves, the options first; the primary at the foot"
             if size == "tablet" else "The legend at the sheet's head, the roof's colours alone on the stage; the options first; the primary at the sheet's foot")
    extra = "" if size == "tablet" else (f'<div style="padding: 0 {side}px; display: flex; flex-direction: column; gap: 24px">'
                                         f'{panel_crop("Why, opened", options_section(True, True)).replace("width: 384px", "width: 100%")}</div>')
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 {side}px">{hd}</div>'
            f'{frame(words, sc, w, h)}{extra}<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    name = "V2StringsTablet.dc.html" if size == "tablet" else "V2StringsPhone.dc.html"
    write_board(OUT, name, f"V2 · 6 · The Strings step · {size} {w}", w, 2460 if size == "tablet" else 3380, body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
