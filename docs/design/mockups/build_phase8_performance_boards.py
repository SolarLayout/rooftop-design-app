"""Writes the three boards of the Performance workspace of Phase 8 (plan/phase-08-plan.md, step 0):
Performance.dc.html, "Performance · desktop 1440" (in the place of the board drawn by hand, its top kept);
PerformanceTablet.dc.html, "Performance · tablet 834"; and PerformancePhone.dc.html, "Performance · phone 390".

Each shows the demo at 1500 V with option A chosen: the title and the line of the run (decision 2), the weather
select and the option switch with the marks of the verdicts (decision 4), the lead tile of the energy with the
P-values, the six tiles, the chain "From sunlight to the grid" as a cascade on one relative scale (decision 10)
with the engine's labels word for word (decision 3) and its eight boxed inputs, the two chart cards with Chart
and Table as tabs (decision 9), the assumptions, and under them the summary of 14 rows in the engine's words
(decision 16). The desktop board keeps the approved header, KPIs, chain, charts and assumptions as drawn by
hand, apart from what the plan changes. The tablet lays the lead tile across with the six tiles 3 by 2, the
chain across, the charts side by side; the phone is one column with the option switch and the weather as two
selects, the KPIs two to a row, the input of a step under its label, the charts stacked, the assumptions as rows
and the summary as cards. The frames are those of the approved boards: the top bar of Main.dc.html and
StudioTablet.dc.html, the header and the tab bar of StudioPhone.dc.html, with Performance the workspace open.

What the engine answered is read from performance_data.json (demo.options[0], the weather, the sizing): the
energy and its figures, the 21 steps of the chain with their labels, values and changes, the twelve months, the
P-values, the 25 years, the summary rows. The losses of the document are the API's defaults (LOSSES below, the
roof's albedo beside them): the data file holds the answer, not the request. Every colour is one of
docs/design/design-tokens.md.

Run it in this folder: python3 build_phase8_performance_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json
import re

from build_phase3_boards import (
    ACCENT,
    CHEVRON,
    CONTROL,
    CONTROL_ACTIVE,
    DATA_GAIN,
    DISPLAY,
    GROUND,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE,
    OK,
    SHADOW_CARD,
    SHADOW_RAISED,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    TICK,
    WELL,
    icon,
    tab,
    tab_row,
)
from build_phase5_roof_boards import PHONE, TABLET, frame, piece
from build_phase7_lens_boards import SHADOW_SEGMENT

MAIN = (HERE / "Main.dc.html").read_text(encoding="utf-8")
DATA = json.loads((HERE / "performance_data.json").read_text(encoding="utf-8"))

# Tokens not in the shared builders.
DATA_LOSS = "#D95926"
DATA_ZERO = "#7C8696"

# The losses of the document: the API's defaults, as the approved board shows them. null means the engine's own
# value holds (the PAN's LID, the Uc of the roof type). The roof's albedo is a field of the roof.
LOSSES = {
    "soiling_pct": 2.0,
    "lid_pct": None,
    "quality_pct": 0.0,
    "mismatch_pct": 1.0,
    "dc_ohmic_pct": 1.5,
    "ac_ohmic_pct": 1.0,
    "availability_pct": 99.5,
    "degradation_pct": 0.5,
    "uc": None,
    "bifacial": True,
    "rear_loss_pct": 10,
    "weather_sigma_pct": 3.0,
    "model_sigma_pct": 3.0,
    "p_levels": [50, 75, 90],
    "co2_t_per_mwh": 0.716,
}
ALBEDO = 0.20

# The boards are as high as what is on them (measured once from a render).
DESKTOP_HEIGHT = 2024
TABLET_HEIGHT = 3181
PHONE_HEIGHT = 4641
PHONE_CAPTION = 44  # the strip of ground under the frame that says the page is drawn whole

# --------------------------------------------------------------------------------------------------
# What the engine answered
# --------------------------------------------------------------------------------------------------

DEMO = DATA["demo"]
OPTIONS = DEMO["options"]
CHOSEN = OPTIONS[0]
ENERGY = CHOSEN["energy"]
STEPS = ENERGY["steps"]
WEATHER = DEMO["weather"]
SIZING = DEMO["sizing"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
SHOWN_YEARS = [1, 5, 10, 15, 20, 25]


def number(value: float, digits: int = 0) -> str:
    return f"{value:,.{digits}f}"


def signed_pct(pct: float) -> str:
    """A change of the chain: two decimals, a plus for a gain, the true minus for a loss, no sign for zero."""
    if pct == 0:
        return "0.00 %"
    return f"+{pct:.2f} %" if pct > 0 else f"−{-pct:.2f} %"


# The line of the run names the weather's source as the approved board does ("PVGIS weather"): with the whole
# label ("PVGIS TMY weather") the line no longer fits beside the controls at 1440.
SOURCE_NAME = {"pvgis": "PVGIS", "nasa": "NASA POWER", "csv": "CSV"}[WEATHER["source"]]
RUN_LINE = (
    f"{CHOSEN['n_series']} modules in series × {CHOSEN['n_strings']} strings on {CHOSEN['n_inverters']} "
    f"{'inverter' if CHOSEN['n_inverters'] == 1 else 'inverters'} · {WEATHER['hours']:,} hours of {SOURCE_NAME} weather, "
    f"{WEATHER['t_min_c']:.1f} to {WEATHER['t_max_c']:.1f} °C, horizon up to {WEATHER['horizon_highest_deg']}°"
)
SIGMA = f"σ {ENERGY['sigma_pct']:.2f} %"
P_VALUES = [(f"P{p['level']}", number(p["mwh"], 1)) for p in ENERGY["p_values"]]
TILES = [
    ("Performance ratio", number(ENERGY["pr"] * 100, 1), "%"),
    ("Specific yield", number(ENERGY["specific_yield"]), "kWh/kWp"),
    ("Capacity factor, AC", number(ENERGY["cuf_ac_pct"], 1), f"% · {number(ENERGY['cuf_dc_pct'], 1)} % DC"),
    ("In-plane irradiation", number(ENERGY["poa_kwh_m2"]), "kWh/m²"),
    ("Energy over 25 years", number(ENERGY["total_25_years_mwh"]), "MWh"),
    ("CO₂ avoided", number(ENERGY["co2_t"], 1), "t/yr"),
]
UC_WORDS = f"{SIZING['uc']:.0f} W/m²K" if LOSSES["uc"] is None else f"{LOSSES['uc']:.0f} W/m²K"
ASSUMPTIONS = [
    ("Thermal Uc", UC_WORDS),
    ("Rear shading and mismatch", f"{LOSSES['rear_loss_pct']:.0f} %"),
    ("Roof albedo", f"{ALBEDO:.2f}"),
    ("Weather variability", f"{LOSSES['weather_sigma_pct']:.1f} %"),
    ("Model and data", f"{LOSSES['model_sigma_pct']:.1f} %"),
    ("Exceedance levels", " · ".join(f"P{level}" for level in LOSSES["p_levels"])),
    ("Grid CO₂", f"{LOSSES['co2_t_per_mwh']:.3f} t/MWh"),
]
DEGRADATION = f"{LOSSES['degradation_pct']:.2f} %/yr"
SUMMARY = [(row["label"], row["value"]) for row in CHOSEN["summary"]]

# --------------------------------------------------------------------------------------------------
# The frames: the top bar, the phone header and the tab bar of the approved boards, with Performance open
# --------------------------------------------------------------------------------------------------


def swap_workspace(nav: str, active: int) -> str:
    """The workspace navigation of an approved board with another workspace open: the tags of its links are
    swapped, each keeping its own address."""
    tags = re.findall(r"<a [^>]*>", nav)[:3]
    on = next(t for t in tags if "aria-current" in t)
    off = next(t for t in tags if "aria-current" not in t)
    parts = nav
    for t in tags:
        parts = parts.replace(t, "@@LINK@@", 1)
    split = parts.split("@@LINK@@")
    out = ""
    for n in range(3):
        href = re.search(r'href="[^"]*"', tags[n]).group(0)
        tag = re.sub(r'href="[^"]*"', href, on if n == active else off)
        out += split[n] + tag
    return out + split[3]


def with_performance(header: str) -> str:
    nav = piece(header, '<nav aria-label="Workspaces"', "</nav>")
    return header.replace(nav, swap_workspace(nav, 1))


# --------------------------------------------------------------------------------------------------
# Marks and controls
# --------------------------------------------------------------------------------------------------


def mark(ok: bool, size: int = 14) -> str:
    return icon(TICK, size, OK, 2.6) if ok else icon(NOTE, size, ACCENT, 2.4)


def h2(words: str) -> str:
    return f'<h2 style="margin: 0; font-size: 16px; font-weight: 600">{words}</h2>'


def card_style(padding: str, gap: int, extra: str = "") -> str:
    return (
        f"display: flex; flex-direction: column; gap: {gap}px; padding: {padding}; background: {SURFACE_1}; "
        f"border: 1px solid {LINE}; border-radius: 18px; box-shadow: {SHADOW_CARD}{extra}"
    )


def weather_select(touch: bool, full: bool = False) -> str:
    """The weather source as a select's trigger; across the width where it stands alone (phone)."""
    height = 44 if touch else 40
    width = "width: 100%; box-sizing: border-box; " if full else ""
    return (
        f'<button style="{width}display: flex; align-items: center; gap: 8px; height: {height}px; padding: 0 14px; background: {CONTROL}; '
        f'border: 1px solid {LINE}; border-radius: 10px; white-space: nowrap; cursor: pointer; box-shadow: {SHADOW_RAISED}">'
        f'<span style="color: {TEXT_2}">Weather</span><span style="font-weight: 500">{WEATHER["label"]}</span>{icon(CHEVRON, 16, TEXT_3)}</button>'
    )


def option_switch(touch: bool) -> str:
    """The stringing options as a segmented control: the letter, the caption of the chosen one, the mark of
    the verdict."""
    height, size = (44, 15) if touch else (34, 14)
    buttons = ""
    for option in OPTIONS:
        ok = option["verdict"]["ok"]
        chosen = option["key"] == DEMO["chosen_option"]
        words = f"{option['letter']} · {option['caption']}" if chosen else option["letter"]
        name = "" if ok else f' aria-label="Option {option["letter"]}: {option["caption"]}"'
        if chosen:
            buttons += (
                f'<button aria-pressed="true" style="display: flex; align-items: center; gap: 8px; height: {height}px; padding: 0 14px; '
                f"background: {CONTROL_ACTIVE}; border: 0; border-radius: 9px; font-size: {size}px; font-weight: 500; white-space: nowrap; cursor: pointer; "
                f'box-shadow: {SHADOW_SEGMENT}">{words}{mark(ok)}</button>'
            )
        else:
            buttons += (
                f'<button{name} style="display: flex; align-items: center; gap: 6px; height: {height}px; padding: 0 14px; background: transparent; '
                f'border: 0; border-radius: 9px; color: {TEXT_2}; font-size: {size}px; white-space: nowrap; cursor: pointer">{words}{mark(ok)}</button>'
            )
    return (
        f'<div role="group" aria-label="Stringing option" style="display: flex; gap: 2px; padding: 3px; background: {WELL}; '
        f'border: 1px solid {LINE}; border-radius: 12px; box-shadow: {SHADOW_WELL}">{buttons}</div>'
    )


def option_select() -> str:
    """The option switch on phone: a select whose trigger says the chosen option with its mark."""
    ok = CHOSEN["verdict"]["ok"]
    return (
        f'<button aria-haspopup="listbox" style="display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px; background: {CONTROL}; '
        f'border: 1px solid {LINE}; border-radius: 10px; cursor: pointer; box-shadow: {SHADOW_RAISED}">'
        f'<span style="color: {TEXT_2}">Option</span><span style="font-weight: 500">{CHOSEN["letter"]} · {CHOSEN["caption"]}</span>{mark(ok, 16)}'
        f'<span style="margin-left: auto; display: flex">{icon(CHEVRON, 16, TEXT_3)}</span></button>'
    )


def chain_input(id_: str, value: str, height: int = 22, width: str = "", size: int = 12) -> str:
    wide = f"width: {width}; " if width else ""
    return (
        f'<input id="{id_}" value="{value}" inputmode="decimal" style="{wide}height: {height}px; box-sizing: border-box; padding: 0 8px; background: {GROUND}; '
        f"border: 1px solid {LINE_STRONG}; border-radius: 6px; text-align: right; {MONO}; font-size: {size}px; box-shadow: {SHADOW_WELL}\">"
    )


def chain_button(words: str, height: int = 22, size: int = 12) -> str:
    return (
        f'<button style="height: {height}px; padding: 0 8px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 6px; '
        f'{MONO}; font-size: {size}px; text-align: right; cursor: pointer; box-shadow: {SHADOW_RAISED}">{words}</button>'
    )


# --------------------------------------------------------------------------------------------------
# The chain as a cascade (decision 10)
# --------------------------------------------------------------------------------------------------


def cascade() -> list[tuple[float, float]]:
    """For each step, the running total before and after it, in percent of the GHI chained through the steps:
    the irradiance steps against the GHI; the energy steps continue from where the irradiance ended, each
    scaled by its share of the array's nominal energy."""
    ghi = STEPS[0]["value"]
    run = 100.0
    anchor = base = None
    ends = []
    for step in STEPS:
        kind = step["kind"]
        if kind == "irr":
            before, run = run, step["value"] / ghi * 100
            ends.append((before, run))
        elif kind == "energy_total":
            anchor, base = run, step["value"]
            ends.append((run, run))
        elif kind == "energy":
            before, run = run, anchor * step["value"] / base
            ends.append((before, run))
        else:
            ends.append((run, run))
    return ends


ENDS = cascade()
LOWEST = min(min(e) for e in ENDS)
HIGHEST = max(max(e) for e in ENDS)


def track_x(pct: float, track: int, left: int, right: int) -> float:
    return left + (pct - LOWEST) / (HIGHEST - LOWEST) * (track - left - right)


def bar(step: dict, ends: tuple[float, float], track: int, bar_height: int, top: int, left: int = 10, right: int = 7) -> str:
    """One step's bar from its running total before to the one after; a zero step a tick of 1 in data-zero."""
    x0, x1 = track_x(ends[0], track, left, right), track_x(ends[1], track, left, right)
    if step["pct"] == 0:
        return f'<span style="position: absolute; left: {round(x1)}px; top: {top}px; width: 1px; height: {bar_height}px; background: {DATA_ZERO}"></span>'
    width = max(2, round(abs(x1 - x0)))
    radius = 1 if width < 4 else 2 if width < 10 else 3
    colour = DATA_GAIN if ends[1] > ends[0] else DATA_LOSS
    return (
        f'<span style="position: absolute; left: {round(min(x0, x1))}px; top: {top}px; width: {width}px; height: {bar_height}px; '
        f'border-radius: {radius}px; background: {colour}"></span>'
    )


def marker(ends: tuple[float, float], track: int, height: int, top: int, left: int = 10, right: int = 7) -> str:
    return f'<span style="position: absolute; left: {round(track_x(ends[1], track, left, right))}px; top: {top}px; width: 2px; height: {height}px; background: {TEXT}"></span>'


def control_of(step: dict, height: int, size: int, width: str = "") -> str:
    """The control of a step that is the user's; nothing for the engine's own steps."""
    label = step["label"]
    fields = {
        "Soiling": ("l-soil", f"{LOSSES['soiling_pct']:.1f} %"),
        "Module quality": ("l-qual", f"{LOSSES['quality_pct']:.1f} %"),
        "Mismatch": ("l-mis", f"{LOSSES['mismatch_pct']:.1f} %"),
        "DC ohmic": ("l-dc", f"{LOSSES['dc_ohmic_pct']:.1f} %"),
        "AC ohmic": ("l-ac", f"{LOSSES['ac_ohmic_pct']:.1f} %"),
        "Availability": ("l-av", f"{LOSSES['availability_pct']:.1f} %"),
    }
    if label in fields:
        return chain_input(fields[label][0], fields[label][1], height, width, size)
    if label == "Bifacial rear gain":
        return chain_button("On" if LOSSES["bifacial"] else "Off", height, size)
    if label.startswith("LID"):
        words = f"PAN {ENERGY['lid_pct']:.1f} %" if LOSSES["lid_pct"] is None else f"{LOSSES['lid_pct']:.1f} %"
        return chain_button(words, height, size)
    return ""


def total_words(step: dict) -> tuple[str, str]:
    unit = "kWh/m²" if step["kind"].startswith("irr") else "MWh"
    return number(step["value"], 1), unit


def chain_legend(size: int = 12) -> str:
    return (
        f'<div style="margin-left: auto; display: flex; align-items: center; gap: 16px; font-size: {size}px; color: {TEXT_2}">'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {DATA_GAIN}"></span>Gain</span>'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {DATA_LOSS}"></span>Loss</span>'
        "<span>Boxed values are yours to change</span></div>"
    )


def chain_grid(columns: str, track: int, row: int, total_row: int, bar_height: int, input_height: int, size: int, input_width: str = "") -> str:
    """The chain as a grid of label, control, change, track, running total (components.md, "Loss chain")."""
    bar_top = (row - bar_height) // 2
    marker_top = (total_row - 20) // 2
    out = (
        f'<div style="display: grid; grid-template-columns: {columns}; column-gap: 10px; align-items: center; font-size: {size}px; white-space: nowrap">\n'
    )
    for step, ends in zip(STEPS, ENDS):
        if step["kind"] in ("irr_total", "energy_total", "result"):
            edge = f"height: {total_row}px; border-top: 1px solid {LINE}" if step["kind"] != "irr_total" else f"height: {total_row - 3}px"
            value, unit = total_words(step)
            out += (
                f'<span style="{edge}; display: flex; align-items: center; font-weight: 600">{step["label"]}</span>'
                f'<span style="{edge}"></span><span style="{edge}"></span>'
                f'<span style="position: relative; {edge}">{marker(ends, track, 20, marker_top if step["kind"] != "irr_total" else (total_row - 3 - 20) // 2)}</span>'
                f'<code style="{edge}; display: flex; align-items: center; justify-content: flex-end; gap: 6px; font-weight: 500">{value} '
                f'<span style="color: {TEXT_2}; font-weight: 400">{unit}</span></code>\n'
            )
            continue
        control = control_of(step, input_height, size - 1, input_width)
        tag = "label" if control.startswith("<input") else "span"
        for_ = f' for="{re.search(r"id=.([a-z-]+).", control).group(1)}"' if tag == "label" else ""
        out += (
            f'<{tag}{for_} style="height: {row}px; display: flex; align-items: center; color: {TEXT_2}">{step["label"]}</{tag}>'
            f"{control or '<span></span>'}"
            f'<code style="text-align: right">{signed_pct(step["pct"])}</code>'
            f'<span style="position: relative; height: {row}px">{bar(step, ends, track, bar_height, bar_top)}</span>'
            f'<code style="text-align: right; color: {TEXT_2}">{number(step["value"], 1)}</code>\n'
        )
    return out + "</div>"


def chain_card(touch: bool, extra: str = "") -> str:
    if touch:
        grid = chain_grid("230px 96px 72px 196px minmax(0, 1fr)", 196, 44, 48, 14, 40, 14, "96px")
    else:
        grid = chain_grid("210px 84px 64px 232px minmax(0, 1fr)", 232, 29, 32, 12, 22, 13)
    head = f'<div style="display: flex; align-items: center; gap: 16px">{h2("From sunlight to the grid")}{chain_legend()}</div>'
    return f'<section style="{card_style("22px 24px", 10, extra)}">\n{head}\n{grid}\n</section>'


# --------------------------------------------------------------------------------------------------
# The charts (guidelines.md, "Charts"): one axis, direct labels on the extremes, Chart and Table as tabs
# --------------------------------------------------------------------------------------------------


def chart_tabs(name: str, touch: bool) -> str:
    return tab_row(tab("Chart", taken=True, touch=touch) + tab("Table", touch=touch), name)


def months_chart(height: int, gap: int, label_size: int = 12) -> str:
    monthly = ENERGY["monthly_mwh"]
    highest, lowest = max(monthly), min(monthly)
    plot = height - 20
    said = ", ".join(f"{m} {v:.1f}" for m, v in zip(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], monthly))
    bars = ""
    for value in monthly:
        tall = round(value / highest * plot)
        if value in (highest, lowest):
            bars += (
                f'<div style="position: relative; height: {tall}px; border-radius: 4px 4px 0 0; background: {DATA_GAIN}">'
                f'<code style="position: absolute; left: -12px; right: -12px; top: -18px; text-align: center; font-size: {label_size}px">{value:.1f}</code></div>'
            )
        else:
            bars += f'<div style="height: {tall}px; border-radius: 4px 4px 0 0; background: {DATA_GAIN}"></div>'
    grid_lines = "".join(
        f'<div style="position: absolute; left: 0; right: 0; top: {top}px; height: 1px; background: {colour}"></div>'
        for top, colour in ((16, LINE_SUBTLE), (height // 2 + 8, LINE_SUBTLE), (height, LINE_STRONG))
    )
    labels = "".join(f"<span>{m}</span>" for m in MONTHS)
    return (
        f'<div role="img" aria-label="Monthly energy in MWh: {said}" style="position: relative; height: {height}px">{grid_lines}'
        f'<div style="position: absolute; left: 0; right: 0; bottom: 0; height: {height}px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: {gap}px; align-items: end; padding: 0 4px">{bars}</div></div>'
        f'<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: {gap}px; padding: 0 4px; font-size: {label_size}px; color: {TEXT_2}; text-align: center">{labels}</div>'
    )


def months_card(touch: bool, height: int = 176, gap: int = 10, padding: str = "22px 24px") -> str:
    """On desktop the tabs stand in the head line, before the unit; on touch, where the head has no room for
    them, the row stands under the title as the board "Tabs" draws it."""
    unit = f'<span style="font-size: 12px; color: {TEXT_2}">MWh</span>'
    if touch:
        head = f'<div style="display: flex; align-items: baseline; gap: 12px">{h2("Energy to grid by month")}<span style="margin-left: auto"></span>{unit}</div>\n{chart_tabs("Energy to grid by month", touch)}'
    else:
        head = f'<div style="display: flex; align-items: center; gap: 12px">{h2("Energy to grid by month")}<span style="margin-left: auto"></span>{chart_tabs("Energy to grid by month", touch)}{unit}</div>'
    panel = f'<div role="tabpanel" aria-label="Chart" style="display: flex; flex-direction: column; gap: 14px">{months_chart(height, gap, 12 if not touch else 11)}</div>'
    return f'<section style="{card_style(padding, 14)}">\n{head}\n{panel}\n</section>'


def years_svg() -> str:
    years = ENERGY["years_mwh"]
    first, last = years[0], years[-1]
    points = [((year - 1) / 24 * 480, 14 + (first - years[year - 1]) / (first - last) * 45) for year in SHOWN_YEARS]
    line = " ".join(f"{'M' if n == 0 else 'L'}{x:.0f} {y:.0f}" for n, (x, y) in enumerate(points))
    return (
        f'<svg viewBox="0 0 480 72" width="100%" height="72" preserveAspectRatio="none" role="img" '
        f'aria-label="Yearly energy falls from {first:.1f} MWh in year 1 to {last:.1f} MWh in year 25">'
        f'<path d="{line} L480 72 L0 72 Z" fill="{DATA_GAIN}" fill-opacity="0.14"/>'
        f'<path d="{line}" fill="none" stroke="{DATA_GAIN}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'
    )


def years_labels(size: int = 13) -> str:
    years = ENERGY["years_mwh"]
    cells = ""
    for n, year in enumerate(SHOWN_YEARS):
        align = "; text-align: right" if n == len(SHOWN_YEARS) - 1 else ""
        cells += (
            f'<div style="display: flex; flex-direction: column; gap: 2px{align}"><span style="font-size: 12px; color: {TEXT_2}">{"Year 1" if year == 1 else year}</span>'
            f'<code style="font-size: {size}px">{years[year - 1]:.1f}</code></div>'
        )
    return f'<div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">{cells}</div>'


def years_card(touch: bool, padding: str = "22px 24px") -> str:
    field_height = 36 if touch else 29
    field = f'<label for="deg" style="font-size: 12px; color: {TEXT_2}">Degradation</label>{chain_input("deg", DEGRADATION, field_height, "92px")}'
    if touch:
        head = f'<div style="display: flex; align-items: center; gap: 12px">{h2("25 years")}<span style="margin-left: auto"></span>{field}</div>\n{chart_tabs("25 years", touch)}'
    else:
        head = f'<div style="display: flex; align-items: center; gap: 12px">{h2("25 years")}<span style="margin-left: auto"></span>{chart_tabs("25 years", touch)}{field}</div>'
    panel = f'<div role="tabpanel" aria-label="Chart" style="display: flex; flex-direction: column; gap: 12px">{years_svg()}{years_labels()}</div>'
    return f'<section style="{card_style(padding, 12)}">\n{head}\n{panel}\n</section>'


# --------------------------------------------------------------------------------------------------
# KPIs, assumptions, summary
# --------------------------------------------------------------------------------------------------


def p_cells(size: int = 16) -> str:
    cells = ""
    for n, (level, value) in enumerate(P_VALUES):
        words = f"{level} · {SIGMA}" if n == len(P_VALUES) - 1 else level
        cells += (
            f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; background: {SURFACE_2}; border-radius: 12px">'
            f'<span style="font-size: 12px; color: {TEXT_2}">{words}</span><code style="font-size: {size}px; font-weight: 500">{value}</code></div>'
        )
    return f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{cells}</div>'


def lead_tile(extra: str = "", gap: int = 16) -> str:
    return (
        f'<section style="{card_style("24px", gap, "; justify-content: space-between" + extra)}">'
        f'<div style="display: flex; flex-direction: column; gap: 2px"><div style="color: {TEXT_2}">Energy to grid, year 1</div>'
        f'<div style="{DISPLAY}; font-size: 76px; line-height: 80px; letter-spacing: -0.03em">{number(ENERGY["energy_mwh"], 1)} '
        f'<span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 22px; color: {TEXT_2}; letter-spacing: 0">MWh</span></div></div>'
        f"{p_cells()}</section>"
    )


def tile(label: str, value: str, unit: str, padding: str = "0 22px", size: int = 34, line: int = 38, unit_size: int = 14) -> str:
    return (
        f'<div style="display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: {padding}; background: {SURFACE_1}; '
        f'border: 1px solid {LINE}; border-radius: 18px; box-shadow: {SHADOW_CARD}"><span style="color: {TEXT_2}">{label}</span>'
        f'<span style="{DISPLAY}; font-size: {size}px; line-height: {line}px; letter-spacing: -0.02em">{value} '
        f'<span style="font-family: Geist, sans-serif; font-weight: 400; font-size: {unit_size}px; color: {TEXT_2}; letter-spacing: 0">{unit}</span></span></div>'
    )


def assumption_chips(touch: bool) -> str:
    height, size = (44, 15) if touch else (34, 13)
    chips = "".join(
        f'<button style="display: flex; align-items: center; gap: 8px; height: {height}px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; '
        f'border-radius: 9px; font-size: {size}px; cursor: pointer; box-shadow: {SHADOW_RAISED}"><span style="color: {TEXT_2}">{label}</span><code>{value}</code></button>'
        for label, value in ASSUMPTIONS
    )
    return f'<div style="display: flex; flex-wrap: wrap; gap: 8px">{chips}</div>'


def assumptions_card(touch: bool, extra: str = "") -> str:
    return f'<section style="{card_style("22px 24px", 12, extra)}">{h2("Assumptions")}{assumption_chips(touch)}</section>'


def summary_table(size: int = 14, label_width: int = 220) -> str:
    head = f"padding: 0 8px; height: 36px; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}; border-bottom: 1px solid {LINE}"
    cell = f"padding: 0 8px; height: 44px; border-bottom: 1px solid {LINE_SUBTLE}; font-size: {size}px"
    rows = "".join(
        f'<tr><th scope="row" style="{cell}; width: {label_width}px; text-align: left; font-weight: 500">{label}</th>'
        f'<td style="{cell}; text-align: left">{value}</td></tr>'
        for label, value in SUMMARY
    )
    return (
        f'<table style="width: 100%"><thead><tr><th scope="col" style="{head}; text-align: left">Item</th>'
        f'<th scope="col" style="{head}; text-align: left">Value</th></tr></thead><tbody>{rows}</tbody></table>'
    )


def summary_card(size: int = 14, label_width: int = 220) -> str:
    return f'<section style="{card_style("22px 24px", 10)}">{h2("Summary")}{summary_table(size, label_width)}</section>'


# --------------------------------------------------------------------------------------------------
# Board 1: desktop, 1440 wide; the approved top, the chain's words and bars of the plan, the tabs, the summary
# --------------------------------------------------------------------------------------------------


def desktop_board() -> str:
    width, height = 1440, DESKTOP_HEIGHT
    header = with_performance(piece(MAIN, "<header", "</header>"))
    title = (
        '<div style="display: flex; align-items: flex-end; gap: 16px">'
        f'<div style="display: flex; flex-direction: column; gap: 4px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Performance</h1>'
        f'<div style="color: {TEXT_2}">{RUN_LINE}</div></div>'
        f'<div style="margin-left: auto; display: flex; align-items: center; gap: 12px">{weather_select(False)}{option_switch(False)}</div></div>'
    )
    kpis = (
        '<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px">'
        + lead_tile("; grid-column: span 5")
        + '<section style="grid-column: span 7; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">'
        + "".join(tile(*t) for t in TILES)
        + "</section></div>"
    )
    row = (
        '<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px">\n'
        + chain_card(False, "; grid-column: span 7")
        + '\n<div style="grid-column: span 5; display: flex; flex-direction: column; gap: 16px; min-height: 0">\n'
        + months_card(False)
        + "\n"
        + years_card(False)
        + "\n"
        + assumptions_card(False, "; flex-grow: 1")
        + "\n</div>\n</div>"
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">\n'
        f"{header}\n"
        '<main style="box-sizing: border-box; display: flex; flex-direction: column; gap: 20px; padding: 28px 40px 32px">\n'
        f"{title}\n{kpis}\n{row}\n{summary_card()}\n</main>\n</div>"
    )
    return frame("Performance · desktop 1440", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 2: tablet, 834 wide
# --------------------------------------------------------------------------------------------------


def tablet_board() -> str:
    width, height = 834, TABLET_HEIGHT
    header = with_performance(piece(TABLET, "<header", "</header>"))
    title = (
        '<div style="display: flex; flex-direction: column; gap: 4px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Performance</h1>'
        f'<div style="color: {TEXT_2}">{RUN_LINE}</div></div>'
        f'<div style="display: flex; align-items: center; gap: 12px">{option_switch(True)}{weather_select(True)}</div>'
    )
    tiles = (
        '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">'
        + "".join(tile(label, value, unit, padding="18px 22px") for label, value, unit in TILES)
        + "</div>"
    )
    charts = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px">\n'
        + months_card(True, gap=6, padding="20px 20px")
        + "\n"
        + years_card(True, padding="20px 20px")
        + "\n</div>"
    )
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">\n'
        f"{header}\n"
        '<main style="box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; padding: 24px 20px 32px">\n'
        f"{title}\n{lead_tile()}\n{tiles}\n{chain_card(True)}\n{charts}\n{assumptions_card(True)}\n{summary_card(15)}\n</main>\n</div>"
    )
    return frame("Performance · tablet 834", width, height, root)


# --------------------------------------------------------------------------------------------------
# Board 3: phone, 390 wide; the page drawn whole, the header over it and the tab bar under it
# --------------------------------------------------------------------------------------------------

PHONE_INPUT_COLUMN = 104  # the width of the input under a step's label; the track begins after it
PHONE_TRACK = 138  # the track on phone: the same width in every row, so that the cascade reads down the page


def phone_chain_card() -> str:
    """The chain on phone: each step on two lines. The first: the label and the change. The second: the input
    under the label where the step is the user's, the track, and the running total. A total has its value and
    unit on the first line and its marker on the second."""
    rows = ""
    for step, ends in zip(STEPS, ENDS):
        if step["kind"] in ("irr_total", "energy_total", "result"):
            value, unit = total_words(step)
            edge = f"border-top: 1px solid {LINE}; padding-top: 8px" if step["kind"] != "irr_total" else ""
            rows += (
                f'<div style="display: flex; flex-direction: column; gap: 4px; {edge}">'
                f'<div style="display: flex; align-items: center; gap: 10px"><span style="font-weight: 600">{step["label"]}</span>'
                f'<code style="margin-left: auto; font-weight: 500; white-space: nowrap">{value} <span style="color: {TEXT_2}; font-weight: 400">{unit}</span></code></div>'
                f'<div style="display: flex; gap: 10px"><span style="width: {PHONE_INPUT_COLUMN}px; flex-shrink: 0"></span>'
                f'<span style="position: relative; width: {PHONE_TRACK}px; flex-shrink: 0; height: 20px">{marker(ends, PHONE_TRACK, 20, 0)}</span></div></div>'
            )
            continue
        control = control_of(step, 36, 14, f"{PHONE_INPUT_COLUMN}px")
        tag = "label" if control.startswith("<input") else "span"
        for_ = f' for="{re.search(r"id=.([a-z-]+).", control).group(1)}"' if tag == "label" else ""
        second_height = 36 if control else 12
        rows += (
            '<div style="display: flex; flex-direction: column; gap: 4px">'
            f'<div style="display: flex; align-items: center; gap: 10px"><{tag}{for_} style="color: {TEXT_2}; white-space: nowrap">{step["label"]}</{tag}>'
            f'<code style="margin-left: auto; font-size: 14px">{signed_pct(step["pct"])}</code></div>'
            f'<div style="display: flex; align-items: center; gap: 10px"><span style="width: {PHONE_INPUT_COLUMN}px; flex-shrink: 0; display: flex">{control}</span>'
            f'<span style="position: relative; width: {PHONE_TRACK}px; flex-shrink: 0; height: {second_height}px">{bar(step, ends, PHONE_TRACK, 12, (second_height - 12) // 2)}</span>'
            f'<code style="flex-grow: 1; text-align: right; font-size: 14px; color: {TEXT_2}">{number(step["value"], 1)}</code></div></div>'
        )
    legend = (
        f'<div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: {TEXT_2}">'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {DATA_GAIN}"></span>Gain</span>'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {DATA_LOSS}"></span>Loss</span>'
        "<span>Boxed values are yours to change</span></div>"
    )
    return (
        f'<section style="{card_style("18px 16px", 8)}">{h2("From sunlight to the grid")}{legend}'
        f'<div style="display: flex; flex-direction: column; gap: 8px; padding-top: 4px; font-size: 14px">{rows}</div></section>'
    )


def phone_tile(label: str, value: str, unit: str, second: str = "") -> str:
    under = f'<span style="font-size: 12px; color: {TEXT_2}">{second}</span>' if second else ""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 16px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 18px; box-shadow: {SHADOW_CARD}">'
        f'<span style="font-size: 13px; color: {TEXT_2}">{label}</span>'
        f'<span style="{DISPLAY}; font-size: 26px; line-height: 30px; letter-spacing: -0.02em; white-space: nowrap">{value} '
        f'<span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 13px; color: {TEXT_2}; letter-spacing: 0">{unit}</span></span>{under}</div>'
    )


def phone_lead_tile() -> str:
    cells = ""
    for n, (level, value) in enumerate(P_VALUES):
        words = f"{level} · {SIGMA}" if n == len(P_VALUES) - 1 else level
        cells += (
            f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; background: {SURFACE_2}; border-radius: 12px">'
            f'<span style="font-size: 12px; color: {TEXT_2}; white-space: nowrap">{words}</span><code style="font-size: 15px; font-weight: 500">{value}</code></div>'
        )
    return (
        f'<section style="{card_style("20px", 14)}">'
        f'<div style="display: flex; flex-direction: column; gap: 2px"><div style="color: {TEXT_2}">Energy to grid, year 1</div>'
        f'<div style="{DISPLAY}; font-size: 76px; line-height: 80px; letter-spacing: -0.03em">{number(ENERGY["energy_mwh"], 1)} '
        f'<span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 22px; color: {TEXT_2}; letter-spacing: 0">MWh</span></div></div>'
        f'<div style="display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 8px">{cells}</div></section>'
    )


def phone_tiles() -> str:
    pr, yield_, cf, poa, years, co2 = TILES
    tiles = (
        phone_tile(*pr)
        + phone_tile(*yield_)
        + phone_tile(cf[0], cf[1], "%", f"{number(ENERGY['cuf_dc_pct'], 1)} % DC")
        + phone_tile(*poa)
        + phone_tile(*years)
        + phone_tile(*co2)
    )
    return f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">{tiles}</div>'


def phone_assumptions() -> str:
    rows = "".join(
        f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 48px">'
        f'<span style="color: {TEXT_2}">{label}</span>'
        f'<button style="display: flex; align-items: center; justify-content: flex-end; height: 44px; min-width: 96px; box-sizing: border-box; padding: 0 12px; background: {CONTROL}; '
        f'border: 1px solid {LINE_STRONG}; border-radius: 10px; cursor: pointer; box-shadow: {SHADOW_RAISED}"><code style="font-size: 14px">{value}</code></button></div>'
        for label, value in ASSUMPTIONS
    )
    return f'<section style="{card_style("18px 16px", 6)}">{h2("Assumptions")}<div style="display: flex; flex-direction: column">{rows}</div></section>'


def phone_summary() -> str:
    cards = "".join(
        f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 14px; background: {SURFACE_2}; border-radius: 12px">'
        f'<span style="font-size: 16px; font-weight: 600">{label}</span><span style="color: {TEXT_2}">{value}</span></div>'
        for label, value in SUMMARY
    )
    return (
        f'<section style="{card_style("18px 16px", 12)}">{h2("Summary")}'
        f'<div role="list" aria-label="Summary" style="display: flex; flex-direction: column; gap: 8px">{cards}</div></section>'
    )


def phone_board() -> str:
    width = 390
    header = piece(PHONE, "<header", "</header>")
    tabs = with_performance(piece(PHONE, '<nav aria-label="Workspaces"', "</nav>"))
    title = (
        '<div style="display: flex; flex-direction: column; gap: 4px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Performance</h1>'
        f'<div style="font-size: 13px; color: {TEXT_2}">{RUN_LINE}</div></div>'
    )
    selects = f'<div style="display: flex; flex-direction: column; gap: 8px">{option_select()}{weather_select(True, full=True)}</div>'
    page = (
        '<main style="box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; padding: 8px 16px 24px">\n'
        f"{title}\n{selects}\n{phone_lead_tile()}\n{phone_tiles()}\n{phone_chain_card()}\n"
        f'{months_card(True, height=150, gap=4, padding="18px 16px")}\n{years_card(True, padding="18px 16px")}\n{phone_assumptions()}\n{phone_summary()}\n</main>'
    )
    screen = (
        f'<div style="width: {width}px; height: {PHONE_HEIGHT}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 15px; line-height: 20px">\n'
        f"{header}\n{page}\n{tabs}\n</div>"
    )
    caption = (
        f'<p style="margin: 0; height: {PHONE_CAPTION}px; box-sizing: border-box; padding: 12px 16px 0; font-size: 12px; color: {TEXT_2}">'
        "The page is drawn whole; on the phone it scrolls between the header and the tab bar.</p>"
    )
    root = f'<div style="width: {width}px; height: {PHONE_HEIGHT + PHONE_CAPTION}px; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden">{screen}\n{caption}</div>'
    return frame("Performance · phone 390", width, PHONE_HEIGHT + PHONE_CAPTION, root)


if __name__ == "__main__":
    for name, html in (("Performance.dc.html", desktop_board()), ("PerformanceTablet.dc.html", tablet_board()), ("PerformancePhone.dc.html", phone_board())):
        for step in STEPS:
            assert step["label"] in html, (name, step["label"])
        (HERE / name).write_text(html, encoding="utf-8")
        print(name)
