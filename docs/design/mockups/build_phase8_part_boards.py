"""Writes four boards of Phase 8, step 0 (plan/phase-08-plan.md): PerformanceLossChain.dc.html, "Loss chain, edited";
PerformanceCharts.dc.html, "Charts, tooltip and table"; PerformanceWeather.dc.html, "Weather and assumptions"; and
PerformanceStates.dc.html, "Performance, states".

The first draws the chain "From sunlight to the grid" edited: soiling entered at 3.0 with the run on its way, then
landed with every changed figure; LID from the PAN and LID entered, given back with "Use the PAN's"; the rear gain off,
and a monofacial module; a row under the pointer with its value and running total; a value out of range brought to the
limit (D31); the chain on phone with the input under the label. The second draws the two charts: the month under the
pointer with MWh and kWh/kWp, the table of the months with the year's total, the 25 years under the pointer and their
table, the degradation entered at 0.70 %/yr; on phone. The third draws the weather select open, NASA POWER loading and
landed with "no horizon", the CSV dialog with a file of GHI alone and its notes (two of them drafted for decision 14),
a file refused, a download refused in the API's words, and the assumptions as fields with Uc entered and the exceedance
levels changed; on phone. The fourth draws the page before a system voltage (D37), the first load, a run on its way and
a run failed; on phone.

Every number comes from performance_data.json beside this file, written from the engine for the Pune demo: the run of
option A, the same with soiling 3 %, with degradation 0.7 %/yr, with the rear gain off, with Uc 25 and the levels 50,
90, 99; the run on NASA POWER 2023 and on a CSV of GHI alone with their weather summaries and notes; the run before a
voltage; the API's words for a download refused, a file refused and a design without weather; the engine's step names.
Every colour is a token of docs/design/design-tokens.md; the chain's bars are the cascade of decision 10, fitted to the
extremes of each run. The chain's labels are the engine's, word for word (decision 3).

Run it in this folder: python3 build_phase8_part_boards.py
It is kept so that the boards can be written again; it is not part of the product.
"""

import json
import re

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    ARROW,
    CHEVRON,
    CHROME,
    CLOSE,
    CONTROL,
    CONTROL_ACTIVE,
    DATA_GAIN,
    DISPLAY,
    FOOT,
    GROUND,
    HEAD,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE,
    NOTE_LINE,
    NOTE_SURFACE,
    OK,
    SHADOW_CARD,
    SHADOW_PANEL,
    SHADOW_PRIMARY,
    SHADOW_RAISED,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    TICK,
    UPLOAD,
    WELL,
    bone,
    card,
    drop,
    icon,
    icon_button,
    menu,
    note,
    option,
    quiet,
    ring,
    ring_of,
    secondary,
    state,
    tab,
    tab_row,
)
from build_phase4_obstacles_by_hand import POINTER
from build_phase5_roof_boards import PHONE, piece
from build_phase6_state_boards import notes, two_columns
from build_phase7_state_boards import FILE, HALO_FOCUS, MINUS, SHADOW_SEGMENT

DATA = json.loads((HERE / "performance_data.json").read_text(encoding="utf-8"))

# Tokens this file needs beyond the earlier builders': the data colours of the chain, the shadow of a tooltip, the
# halo of a decision card, the dimming of a value on its way and of a control that cannot be used.
DATA_LOSS = "#D95926"
DATA_ZERO = "#7C8696"
SHADOW_TOOLTIP = "0 1px 2px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)"
SHADOW_KNOB = "0 1px 3px rgba(0,0,0,0.5)"
SHADOW_TRACK = "inset 0 1px 3px rgba(0,0,0,0.45)"
HALO_DECISION = "0 0 0 4px rgba(255,176,32,0.14)"
DIM = "opacity: 0.55"
DISABLED = "opacity: 0.45"
PRESSED = f"background: #10141A; border: 1px solid {LINE_STRONG}; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5)"

LOSS_CHAIN_HEIGHT = 5310
CHARTS_HEIGHT = 3838
WEATHER_HEIGHT = 4358
STATES_HEIGHT = 3846

CHAIN_WIDTH = 786  # the chain card, 7 of 12 columns at 1440
CHART_WIDTH = 554  # a chart card, 5 of 12 columns at 1440
PAGE_WIDTH = 1240  # the page inside a window of 1320: what a board of 1440 can hold of the desktop
TRACK = 232  # the track of the chain on desktop
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
SIX_YEARS = (1, 5, 10, 15, 20, 25)

# The project's losses: the API's defaults, as the document holds them.
LOSSES = {"Soiling": "2.0 %", "Module quality": "0.0 %", "Mismatch": "1.0 %", "DC ohmic": "1.5 %", "AC ohmic": "1.0 %", "Availability": "99.5 %"}
IDS = {"Soiling": "l-soil", "Module quality": "l-qual", "LID": "l-lid", "LID (PAN)": "l-lid", "Mismatch": "l-mis", "DC ohmic": "l-dc", "AC ohmic": "l-ac", "Availability": "l-av"}

PROGRESS = DATA["progress_steps"]
STEP_SHADING, STEP_SIZING, STEP_FITTING = PROGRESS[2], PROGRESS[4], PROGRESS[0]

# The words this file drafts (decision 14 and decision 19): the owner approves them.
NOTE_NO_TEMPERATURE = (
    "pune-ghi.csv has no air temperature. 25 °C was taken for every hour, so the strings are sized for 25 °C. "
    "Enter the site's lowest and highest ambient in the Strings lens."
)
NOTE_NO_WIND = "pune-ghi.csv has no wind speed. 1 m/s was taken for every hour."
SOURCE_FACTS = {"PVGIS TMY": "Typical year · PVGIS horizon", "NASA POWER 2023": "The year 2023 · no horizon", "CSV file": "Hourly · times read as UTC"}


# --------------------------------------------------------------------------------------------------
# The runs and their numbers
# --------------------------------------------------------------------------------------------------


def chosen(run: dict) -> dict:
    return next(o for o in run["options"] if o["key"] == run["chosen_option"])


DEMO, SOILING_3, DEGRADATION_0_7, REAR_OFF, LEVELS_UC = (DATA[k] for k in ("demo", "soiling_3", "degradation_0_7", "rear_gain_off", "levels_50_90_99_uc_25"))
NASA, CSV, NO_VOLTAGE = DATA["nasa"], DATA["csv_ghi_only"], DATA["no_voltage"]
A = chosen(DEMO)
E = A["energy"]


def n1(v: float) -> str:
    return f"{v:,.1f}"


def n0(v: float) -> str:
    return f"{v:,.0f}"


def pct2(p: float) -> str:
    """A change of the chain: two decimals, a sign, the true minus; a step of nothing reads 0.00 %."""
    words = f"{p:+.2f}"
    if words == "+0.00":
        words = "0.00"
    return words.replace("-", MINUS) + " %"


def kwh_kwp(mwh: float, dc_kwp: float) -> str:
    return n0(mwh * 1000 / dc_kwp)


def run_line(run: dict) -> str:
    """The line under the title (decision 2), from the run's numbers."""
    o, w = chosen(run), run["weather"]
    horizon = f"horizon up to {w['horizon_highest_deg']:.1f}°" if w["horizon_highest_deg"] is not None else "no horizon"
    inverters = "1 inverter" if o["n_inverters"] == 1 else f"{o['n_inverters']} inverters"
    return f"{o['n_series']} modules in series × {o['n_strings']} strings on {inverters} · {w['hours']:,} hours of {w['label']} weather, {w['t_min_c']:.1f} to {w['t_max_c']:.1f} °C, {horizon}"


def no_options_line(run: dict) -> str:
    w = run["weather"]
    horizon = f"horizon up to {w['horizon_highest_deg']:.1f}°" if w["horizon_highest_deg"] is not None else "no horizon"
    return f"{run['readouts']['positions']} positions ready · {w['hours']:,} hours of {w['label']} weather, {w['t_min_c']:.1f} to {w['t_max_c']:.1f} °C, {horizon}"


# --------------------------------------------------------------------------------------------------
# Small pieces: tooltips, fields, switches, the frames of the crops
# --------------------------------------------------------------------------------------------------


def value_tip(value: str, label: str) -> str:
    """The tooltip of a value (decision 18, components.md "Tooltip"): the value first, in the text, the label after
    it in text-2."""
    return (
        f'<span role="tooltip" style="display: inline-flex; flex-direction: column; padding: 4px 10px; background: {CONTROL_ACTIVE}; border: 1px solid {LINE_STRONG}; '
        f'border-radius: 8px; font-size: 12px; line-height: 16px; white-space: nowrap; box-shadow: {SHADOW_TOOLTIP}">'
        f'<code style="font-weight: 500; color: {TEXT}">{value}</code><span style="color: {TEXT_2}">{label}</span></span>'
    )


def small_input(id_: str, value: str, width: str = "100%", focus: bool = False, height: int = 22, size: int = 12, radius: int = 6, label: str = "") -> str:
    """The input of the chain and of an assumption chip: 22 high, radius xs, recessed."""
    look = f"border: 1px solid {ACCENT}; box-shadow: {HALO_FOCUS}" if focus else f"border: 1px solid {LINE_STRONG}; box-shadow: {SHADOW_WELL}"
    name = f' aria-label="{label}"' if label else ""
    return (
        f'<input id="{id_}" value="{value}" inputmode="decimal"{name} style="width: {width}; height: {height}px; box-sizing: border-box; padding: 0 8px; background: {GROUND}; '
        f'border-radius: {radius}px; text-align: right; {MONO}; font-size: {size}px; {look}">'
    )


def pan_button(words: str, height: int = 22, size: int = 12) -> str:
    """The approved look of a value that is the PAN's: a raised button, pressed to enter one's own."""
    return (
        f'<button style="height: {height}px; padding: 0 8px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 6px; {MONO}; font-size: {size}px; '
        f'text-align: right; cursor: pointer; box-shadow: {SHADOW_RAISED}">{words}</button>'
    )


def switch(on: bool, disabled: bool = False, label: str = "Bifacial rear gain", touch: bool = False) -> str:
    """The switch of components.md: 44 by 26, knob 20 inset 3; on touch 52 by 30 in a hit area of 44."""
    w, h, knob = (52, 30, 24) if touch else (44, 26, 20)
    track = ACCENT if on else LINE_STRONG
    knob_colour = ACCENT_INK if on else TEXT_2
    left = w - knob - 3 if on else 3
    look = f"; {DISABLED}" if disabled else ""
    off = " disabled" if disabled else ""
    return (
        f'<button role="switch" aria-checked="{"true" if on else "false"}" aria-label="{label}"{off} style="position: relative; flex-shrink: 0; width: {w}px; height: {h}px; padding: 0; '
        f'background: {track}; border: 0; border-radius: {h}px; cursor: pointer; box-shadow: {SHADOW_TRACK}{look}">'
        f'<span style="position: absolute; left: {left}px; top: 3px; width: {knob}px; height: {knob}px; border-radius: 50%; background: {knob_colour}; box-shadow: {SHADOW_KNOB}"></span></button>'
    )


def mark(ok: bool, size: int = 14) -> str:
    if ok:
        return icon(TICK, size, OK, 2.6).replace('aria-hidden="true"', 'role="img" aria-label="In target"')
    return icon(NOTE, size, ACCENT, 2.4).replace('aria-hidden="true"', 'role="img" aria-label="Below the DC/AC target"')


def small_quiet(words: str, height: int = 26, size: int = 12) -> str:
    return f'<button style="height: {height}px; padding: 0 8px; background: transparent; border: 0; border-radius: 8px; color: {TEXT_2}; font-size: {size}px; cursor: pointer; white-space: nowrap">{words}</button>'


def caption_line(words: str, colour: str = TEXT_2) -> str:
    return f'<span style="font-size: 12px; color: {colour}">{words}</span>'


def panel(inside: str, width: int | str, pad: str = "22px 24px", gap: int = 10, extra: str = "") -> str:
    """A card of the page (surface-1, radius 18, shadow-card), at the width it has on the page."""
    w = f"width: {width}px; " if isinstance(width, int) else f"{width}; "
    return (
        f'<section style="{w}box-sizing: border-box; display: flex; flex-direction: column; gap: {gap}px; padding: {pad}; background: {SURFACE_1}; '
        f'border: 1px solid {LINE}; border-radius: 18px; box-shadow: {SHADOW_CARD}{extra}">{inside}</section>'
    )


def screen(inside: str, width: int = PAGE_WIDTH, gap: int = 20) -> str:
    """A crop of the page on the ground, its padding 20: what a window of {width + 80} shows of the page."""
    return (
        f'<div style="width: {width + 40}px; box-sizing: border-box; display: flex; flex-direction: column; gap: {gap}px; padding: 20px; border-radius: 12px; '
        f'border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px">{inside}</div>'
    )


def ground(inside: str, pad: str = "20px") -> str:
    return f'<div style="align-self: flex-start; display: flex; flex-direction: column; gap: 20px; padding: {pad}; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px">{inside}</div>'


def dimmed_stage(inside: str, height: int = 560) -> str:
    return f'<div style="display: flex; align-items: center; justify-content: center; height: {height}px; border-radius: 12px; background: rgba(5,7,10,0.72); border: 1px solid {LINE_SUBTLE}">{inside}</div>'


# --------------------------------------------------------------------------------------------------
# The header of the page: the title, the line of the run, the weather select, the option switch
# --------------------------------------------------------------------------------------------------


def weather_trigger(value: str = "PVGIS TMY", open_: bool = False, loading: bool = False, touch: bool = False) -> str:
    look = PRESSED if open_ else f"background: {CONTROL}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}"
    turn = "; transform: rotate(180deg)" if open_ else ""
    end = ring(16) if loading else f'<span style="display: flex{turn}">{icon(CHEVRON, 16, TEXT_3)}</span>'
    height, radius, size = (44, 12, 15) if touch else (40, 10, 14)
    grow = "width: 100%; " if touch else ""
    end_ = f'<span style="margin-left: auto; display: flex">{end}</span>' if touch else end
    return (
        f'<button aria-haspopup="listbox" aria-expanded="{"true" if open_ else "false"}" style="{grow}flex-shrink: 0; display: flex; align-items: center; gap: 8px; height: {height}px; padding: 0 14px; '
        f'border-radius: {radius}px; white-space: nowrap; font-size: {size}px; cursor: pointer; {look}"><span style="color: {TEXT_2}">Weather</span><span style="font-weight: 500">{value}</span>{end_}</button>'
    )


def option_switch(run: dict, dim: bool = False) -> str:
    """The option switch (decision 4): the run's options with the letter, the caption of the chosen one and the
    mark of the verdict."""
    buttons = ""
    for o in run["options"]:
        on = o["key"] == run["chosen_option"]
        words = o["title"] if on else o["letter"]
        look = f"background: {CONTROL_ACTIVE}; font-weight: 500; box-shadow: {SHADOW_SEGMENT}" if on else f"background: transparent; color: {TEXT_2}"
        name = "" if o["ok"] else f' aria-label="Option {o["letter"]}, below the DC/AC target"'
        buttons += (
            f'<button aria-pressed="{"true" if on else "false"}"{name} style="display: flex; align-items: center; gap: {8 if on else 6}px; height: 34px; padding: 0 14px; border: 0; border-radius: 9px; white-space: nowrap; cursor: pointer; {look}">'
            f"{words}{mark(o['ok'])}</button>"
        )
    fade = f"; {DIM}" if dim else ""
    return (
        f'<div role="group" aria-label="Stringing option" style="display: flex; gap: 2px; padding: 3px; background: {WELL}; border: 1px solid {LINE}; border-radius: 12px; box-shadow: {SHADOW_WELL}{fade}">{buttons}</div>'
    )


def step_row(first: str, step: str, fraction: float | None, touch: bool = False) -> str:
    """The row of a run on its way, as the vitals say it: the ring of 20 with its arc, the words, the step. On phone
    the step takes the next line."""
    ring_ = ring_of(fraction, 20, 2.5, f"{round(fraction * 100)} percent") if fraction is not None else ring(20, 2.5)
    if touch:
        return (
            f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 2px 0"><div style="display: flex; align-items: center; gap: 10px; height: 24px">{ring_}<span style="font-size: 14px; font-weight: 500">{first}</span></div>'
            f'<span style="padding-left: 30px; font-size: 13px; color: {TEXT_2}">{step}</span></div>'
        )
    return (
        f'<div style="display: flex; align-items: center; gap: 10px; height: 28px">{ring_}<span style="font-size: 13px; font-weight: 500; white-space: nowrap">{first}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">{step}</span></div>'
    )


def failed_row(detail: str) -> str:
    """A run failed (components.md "Vitals: states"): the note, the words, Try again; the API's message as the detail."""
    return (
        f'<div style="display: flex; align-items: flex-start; gap: 10px; margin-top: 2px; padding: 8px 12px 8px 10px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 10px">'
        f'<span style="display: flex; padding-top: 2px">{note(20)}</span><span style="display: flex; flex-direction: column; gap: 2px">'
        f'<span style="display: flex; align-items: center; gap: 10px; height: 24px"><span style="font-size: 13px; font-weight: 500">Energy was not updated</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">Values are of the design before ·</span>{small_quiet("Try again", 24, 12).replace("padding: 0 8px", "padding: 0 6px; margin-left: -8px").replace(f"color: {TEXT_2}", f"color: {TEXT}; font-weight: 500")}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">{detail}</span></span></div>'
    )


def page_header(line: str, right: str, under: str = "", dim_line: bool = False, line_skeleton: bool = False) -> str:
    fade = f"; {DIM}" if dim_line else ""
    line_html = bone(560, 12) if line_skeleton else f'<div style="color: {TEXT_2}{fade}">{line}</div>'
    return (
        '<div style="display: flex; align-items: flex-end; gap: 16px">'
        f'<div style="min-width: 0; display: flex; flex-direction: column; gap: 4px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Performance</h1>{line_html}{under}</div>'
        f'<div style="margin-left: auto; flex-shrink: 0; display: flex; align-items: center; gap: 12px">{right}</div></div>'
    )


# --------------------------------------------------------------------------------------------------
# The KPIs: the lead tile with its P-values, the six tiles
# --------------------------------------------------------------------------------------------------


def lead_number(value: str, dim: bool = False, ring_: bool = False, size: int = 76, line: int = 80, unit_size: int = 22) -> str:
    fade = f"; {DIM}" if dim else ""
    after = f'<span style="display: flex">{ring(16)}</span>' if ring_ else ""
    return (
        f'<div style="display: flex; align-items: center; gap: 14px"><span style="{DISPLAY}; font-size: {size}px; line-height: {line}px; letter-spacing: -0.03em{fade}">{value} '
        f'<span style="font-family: Geist, sans-serif; font-weight: 400; font-size: {unit_size}px; color: {TEXT_2}; letter-spacing: 0">MWh</span></span>{after}</div>'
    )


def p_cells(energy: dict, dim: bool = False, skeleton: bool = False, touch: bool = False) -> str:
    cells = ""
    levels = energy["p_values"]
    for i, p in enumerate(levels):
        label = f"P{p['level']}" + (f" · σ {energy['sigma_pct']:.2f} %" if i == len(levels) - 1 else "")
        size = 11 if touch and i == len(levels) - 1 else 12
        inside = (
            bone(28, 10, 5).replace(SURFACE_2, CONTROL_ACTIVE) + bone(64, 18).replace(SURFACE_2, CONTROL_ACTIVE)
            if skeleton
            else f'<span style="font-size: {size}px; color: {TEXT_2}; white-space: nowrap">{label}</span><code style="font-size: 16px; font-weight: 500{"; " + DIM if dim else ""}">{n1(p["mwh"])}</code>'
        )
        cells += f'<div style="display: flex; flex-direction: column; gap: {6 if skeleton else 2}px; padding: 10px {10 if touch else 14}px; background: {SURFACE_2}; border-radius: 12px">{inside}</div>'
    return f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{cells}</div>'


def lead_tile(energy: dict, dim: bool = False, ring_: bool = False, skeleton: bool = False, width: int | str = "grid-column: span 5", top_only: bool = False) -> str:
    if skeleton:
        head = f'<div style="display: flex; flex-direction: column; gap: 12px">{bone(140, 10, 5)}{bone(230, 22)}</div>'
    else:
        head = f'<div style="display: flex; flex-direction: column; gap: 2px"><div style="color: {TEXT_2}">Energy to grid, year 1</div>{lead_number(n1(energy["energy_mwh"]), dim, ring_)}</div>'
    body = head if top_only else head + p_cells(energy, dim, skeleton)
    return panel(body, width, pad="24px", gap=16, extra="; justify-content: space-between")


def tiles(energy: dict, dim: bool = False, skeleton: bool = False) -> str:
    fade = f"; {DIM}" if dim else ""
    rows = [
        ("Performance ratio", f"{energy['pr'] * 100:.1f}", "%"),
        ("Specific yield", n0(energy["specific_yield"]), "kWh/kWp"),
        ("Capacity factor, AC", f"{energy['cuf_ac_pct']:.1f}", f"% · {energy['cuf_dc_pct']:.1f} % DC"),
        ("In-plane irradiation", n0(energy["poa_kwh_m2"]), "kWh/m²"),
        ("Energy over 25 years", n0(energy["total_25_years_mwh"]), "MWh"),
        ("CO₂ avoided", f"{energy['co2_t']:.1f}", "t/yr"),
    ]
    out = ""
    for i, (label, value, unit) in enumerate(rows):
        if skeleton:
            inside = bone(100 + (i % 3) * 14, 10, 5) + bone(72 + (i % 2) * 36, 18)
        else:
            inside = (
                f'<span style="color: {TEXT_2}">{label}</span><span style="{DISPLAY}; font-size: 34px; line-height: 38px; letter-spacing: -0.02em{fade}">{value} '
                f'<span style="font-family: Geist, sans-serif; font-weight: 400; font-size: 14px; color: {TEXT_2}; letter-spacing: 0">{unit}</span></span>'
            )
        out += (
            f'<div style="display: flex; flex-direction: column; justify-content: center; gap: {10 if skeleton else 6}px; min-height: 108px; padding: 0 22px; background: {SURFACE_1}; border: 1px solid {LINE}; '
            f'border-radius: 18px; box-shadow: {SHADOW_CARD}">{inside}</div>'
        )
    return f'<section style="grid-column: span 7; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">{out}</section>'


def kpi_row(energy: dict, dim: bool = False, ring_: bool = False, skeleton: bool = False) -> str:
    return f'<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px">{lead_tile(energy, dim, ring_, skeleton)}{tiles(energy, dim, skeleton)}</div>'


# --------------------------------------------------------------------------------------------------
# The loss chain: the cascade of decision 10
# --------------------------------------------------------------------------------------------------

COLS = "210px 84px 64px 232px minmax(0, 1fr)"


def spans(steps: list[dict]) -> list[tuple[float, float]]:
    """Where each step runs on one relative scale: the GHI is 1, each step multiplies by its change, the energy
    steps continue from the irradiance's end; a total stands where the chain is."""
    at, out = 1.0, []
    for s in steps:
        if s["kind"] in ("irr", "energy"):
            before = at
            at = at * (1 + s["pct"] / 100)
            out.append((before, at))
        else:
            out.append((at, at))
    return out


def scale_of(spans_: list[tuple[float, float]], track: int, pad_left: int = 10, pad_right: int = 7):
    lo = min(min(a, b) for a, b in spans_)
    hi = max(max(a, b) for a, b in spans_)
    return lambda c: pad_left + (c - lo) / (hi - lo) * (track - pad_left - pad_right)


def bar(step: dict, span: tuple[float, float], x, height: int, total: bool) -> str:
    """The step's bar on the track: from its running total before to the one after; gain blue, loss orange, a
    step of nothing a tick in data-zero; a total a 2 px marker."""
    if total:
        return f'<span style="position: absolute; left: {x(span[0]):.0f}px; top: {(height - 20) // 2}px; width: 2px; height: 20px; background: {TEXT}"></span>'
    x0, x1 = sorted((x(span[0]), x(span[1])))
    width = max(2, round(x1 - x0))
    colour = DATA_GAIN if step["pct"] > 0.005 else DATA_LOSS if step["pct"] < -0.005 else DATA_ZERO
    radius = 3 if width >= 6 else 2 if width >= 4 else 1
    return f'<span style="position: absolute; left: {x0:.0f}px; top: {(height - 12) // 2}px; width: {width}px; height: 12px; border-radius: {radius}px; background: {colour}"></span>'


def unit_of(step: dict) -> str:
    return "kWh/m²" if step["kind"].startswith("irr") else "MWh"


def chain_control(step: dict, controls: dict) -> str:
    """What stands in the second column: the document's field where the step is the user's, else nothing."""
    label = step["label"]
    if label in controls:
        return controls[label]
    if label in LOSSES:
        return small_input(IDS[label], LOSSES[label], label=label)
    if label == "LID (PAN)":
        return pan_button("PAN 0.2 %")
    if label == "Bifacial rear gain":
        return switch(True)
    return "<span></span>"


def chain_row(step: dict, span: tuple[float, float], x, controls: dict, dim: bool = False, hover: bool = False, label_override: str | None = None) -> str:
    total = step["kind"] in ("irr_total", "energy_total", "result")
    height = 32 if total else 29
    fade = f"; {DIM}" if dim else ""
    label = label_override or step["label"]
    if total:
        label_html = f'<span style="font-weight: 600">{label}</span>'
        change = "<span></span>"
        value = f'<code style="display: flex; justify-content: flex-end; gap: 6px; font-weight: 500{fade}">{n1(step["value"])} <span style="color: {TEXT_2}; font-weight: 400">{unit_of(step)}</span></code>'
        edge = f"; border-top: 1px solid {LINE}"
    else:
        label_html = f'<label for="{IDS.get(label, "")}" style="color: {TEXT_2}">{label}</label>' if label in IDS else f'<span style="color: {TEXT_2}">{label}</span>'
        change = f'<code style="text-align: right{fade}">{pct2(step["pct"])}</code>'
        value = f'<code style="text-align: right; color: {TEXT_2}{fade}">{n1(step["value"])}</code>'
        edge = ""
    track = f'<span style="position: relative; height: {height}px; display: block{fade}">{bar(step, span, x, height, total)}</span>'
    look = f"; margin: 0 -8px; padding: 0 8px; background: {SURFACE_2}; border-radius: 6px" if hover else ""
    return (
        f'<div style="display: grid; grid-template-columns: {COLS}; column-gap: 10px; align-items: center; height: {height}px; box-sizing: border-box; font-size: 13px; white-space: nowrap{edge}{look}">'
        f"{label_html}{chain_control(step, controls)}{change}{track}{value}</div>"
    )


def under_row(inside: str) -> str:
    """A line under a row of the chain, in the columns of the field and after: a detail, a note, an action."""
    return f'<div style="display: grid; grid-template-columns: {COLS}; column-gap: 10px; align-items: center; min-height: 24px; font-size: 12px"><span></span><div style="grid-column: 2 / 6; display: flex; align-items: center; gap: 8px">{inside}</div></div>'


def chain_legend() -> str:
    def swatch(colour: str, words: str) -> str:
        return f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {colour}"></span>{words}</span>'

    return (
        '<div style="display: flex; align-items: center; gap: 16px">'
        '<h2 style="margin: 0; font-size: 16px; font-weight: 600">From sunlight to the grid</h2>'
        f'<div style="margin-left: auto; display: flex; align-items: center; gap: 16px; font-size: 12px; color: {TEXT_2}">{swatch(DATA_GAIN, "Gain")}{swatch(DATA_LOSS, "Loss")}<span>Boxed values are yours to change</span></div></div>'
    )


def chain_rows(run: dict, controls: dict | None = None, dim: bool = False, hover: str | None = None, only: tuple[int, int] | None = None, extra: dict | None = None, labels: dict | None = None) -> str:
    """The rows of the chain for a run: every step of the engine in its order and words. *controls* puts another
    control in a row, *extra* a line under one, *only* keeps a slice of the rows, *labels* words one otherwise."""
    steps = chosen(run)["energy"]["steps"]
    sp = spans(steps)
    x = scale_of(sp, TRACK)
    controls = controls or {}
    extra = extra or {}
    labels = labels or {}
    rows = ""
    lo, hi = only or (0, len(steps))
    for i in range(lo, hi):
        s = steps[i]
        rows += chain_row(s, sp[i], x, controls, dim=dim, hover=s["label"] == hover, label_override=labels.get(s["label"]))
        if s["label"] in extra:
            rows += under_row(extra[s["label"]])
    return rows


def chain_card(run: dict, **kw) -> str:
    return panel(chain_legend() + f'<div style="display: flex; flex-direction: column">{chain_rows(run, **kw)}</div>', CHAIN_WIDTH)


def chain_slice(rows: str, pad_top: int = 10) -> str:
    """A few rows of the chain in a slice of the card, cut above and below."""
    return panel(f'<div style="display: flex; flex-direction: column">{rows}</div>', CHAIN_WIDTH, pad=f"{pad_top}px 24px 10px", gap=0)


def title_block(line: str, under: str = "", dim_line: bool = False) -> str:
    fade = f"; {DIM}" if dim_line else ""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 4px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Performance</h1>'
        f'<div style="color: {TEXT_2}{fade}">{line}</div>{under}</div>'
    )


def changed_rows(before: dict, after: dict) -> list[str]:
    a, b = chosen(before)["energy"]["steps"], chosen(after)["energy"]["steps"]
    return [s["label"] for s, t in zip(a, b) if pct2(s["pct"]) != pct2(t["pct"])]


def first_changed_total(before: dict, after: dict) -> str:
    a, b = chosen(before)["energy"]["steps"], chosen(after)["energy"]["steps"]
    return next(s["label"] for s, t in zip(a, b) if n1(s["value"]) != n1(t["value"]))


# --------------------------------------------------------------------------------------------------
# Board 1: Loss chain, edited
# --------------------------------------------------------------------------------------------------


def soiling_running_card() -> str:
    controls = {"Soiling": small_input("l-soil", "3.0 %", focus=True, label="Soiling")}
    crop = ground(
        title_block(run_line(DEMO), step_row("Updating energy", STEP_SIZING, 0.8), dim_line=True)
        + lead_tile(E, dim=True, ring_=True, width=CHART_WIDTH, top_only=True)
        + chain_card(DEMO, controls=controls, dim=True)
    )
    side = notes(
        "Soiling 2.0 was changed to 3.0 and committed with Enter: the field keeps the focus look (accent border, the halo), and the run is on its way. Nothing is computed again on the roof: "
        "the shading is kept, the seven candidates are simulated again, about 4 s (the plan, “What an edit costs”).",
        "While it runs, every figure of the chain is dimmed to opacity 0.55 (opacity-updating); the labels and the fields stay as they are. The lead energy is dimmed with the turning ring of 16 beside it, as the "
        "vitals dim theirs. Under the title the step of the engine stands in a row with the ring of 20 and its arc: “Updating energy” in Geist 500, the step in text-caption, word for word from the engine.",
        f"The line under the title is dimmed too: it carries the run's numbers. The figures are the demo's: {n1(E['energy_mwh'])} MWh, soiling {pct2(-2.0)}.",
    )
    return card("Soiling entered: the run on its way", two_columns(state("Desktop, the chain's width, 786: soiling 3.0 committed, the run on its way", crop), side), gap=14)


def soiling_landed_card() -> str:
    s3 = chosen(SOILING_3)["energy"]
    controls = {"Soiling": small_input("l-soil", "3.0 %", label="Soiling")}
    crop = ground(lead_tile(s3, width=CHART_WIDTH, top_only=True) + chain_card(SOILING_3, controls=controls))
    changed = changed_rows(DEMO, SOILING_3)
    soil = next(s for s in s3["steps"] if s["label"] == "Soiling")
    rear = next(s for s in s3["steps"] if s["label"] == "Bifacial rear gain")
    clip = next(s for s in s3["steps"] if s["label"] == "Inverter clipping")
    side = notes(
        f"The run landed: {n1(s3['energy_mwh'])} MWh in place of {n1(E['energy_mwh'])}, the figures full again, the ring gone. The field holds 3.0 % without the focus.",
        f"The changes that moved, at two decimals: {', '.join(changed)}. Soiling is now {pct2(soil['pct'])}; the rear gain {pct2(rear['pct'])} (a gain of the same rear irradiance on a smaller front); "
        f"the clipping {pct2(clip['pct'])}, since fewer hours reach the inverter's limit. Every other change stays within its two decimals.",
        f"Every running total from {first_changed_total(DEMO, SOILING_3)} down moves: {n1(soil['value'])} kWh/m² after soiling, the array's nominal energy {n1(next(s for s in s3['steps'] if s['kind'] == 'energy_total')['value'])} MWh, "
        f"the grid's end {n1(s3['energy_mwh'])}. The bars are the cascade fitted to this run (decision 10), so the whole chain is drawn anew to its own extremes.",
        "The figures roll from the old value to the new one when they land (guidelines, “Numbers and units”).",
    )
    return card("Landed: soiling 3 %", two_columns(state(f"Desktop: the chain of the run with soiling 3 %, {n1(s3['energy_mwh'])} MWh", crop), side), gap=14)


def lid_rows_card() -> str:
    steps = E["steps"]
    i_lid = next(i for i, s in enumerate(steps) if s["label"].startswith("LID"))
    i_rear = next(i for i, s in enumerate(steps) if s["label"] == "Bifacial rear gain")
    i_temp = next(i for i, s in enumerate(steps) if s["label"] == "Temperature")
    i_soil = next(i for i, s in enumerate(steps) if s["label"] == "Soiling")
    temp = steps[i_temp]
    rear_off = chosen(REAR_OFF)["energy"]

    pan = chain_slice(chain_rows(DEMO, only=(i_lid - 1, i_lid + 2)))
    entered = chain_slice(
        chain_rows(
            DEMO,
            only=(i_lid - 1, i_lid + 2),
            dim=True,
            controls={"LID (PAN)": small_input("l-lid", "1.0 %", label="LID")},
            labels={"LID (PAN)": "LID"},
            extra={"LID (PAN)": caption_line("PAN gives 0.2 %", TEXT_3) + small_quiet("Use the PAN's")},
        )
    )
    rear_crop = ground(
        lead_tile(rear_off, width=CHART_WIDTH, top_only=True)
        + chain_card(REAR_OFF, controls={"Bifacial rear gain": switch(False)}),
    )
    mono = chain_slice(
        chain_rows(DEMO, only=(i_rear - 1, i_rear + 1), controls={"Bifacial rear gain": switch(False, disabled=True)}, extra={"Bifacial rear gain": caption_line("The module is monofacial: no rear gain.")})
    )
    hover_rows = chain_rows(DEMO, only=(i_temp - 1, i_temp + 2), hover="Temperature")
    tip = value_tip(f"{n1(temp['value'])} MWh · {pct2(temp['pct'])}", "Temperature")
    hover = chain_slice(
        f'<div style="position: relative">{hover_rows}'
        f'<div style="position: absolute; left: 318px; top: -14px; transform: translateX(-50%)">{tip}</div>'
        f'<div style="position: absolute; left: 296px; top: 44px">{POINTER}</div></div>',
        pad_top=52,
    )
    out_of_range = chain_slice(
        chain_rows(
            DEMO,
            only=(i_soil - 1, i_soil + 1),
            dim=True,
            controls={"Soiling": small_input("l-soil", "30.0 %", label="Soiling")},
            extra={"Soiling": caption_line("30.0 % is the highest that can be set.")},
        )
    )
    left = (
        state("LID from the PAN, as approved: the value is a press", pan)
        + state("LID entered, 1.0 %: the field holds it; under it the PAN's value and “Use the PAN's”. No run with LID 1.0 is in the data: the figures of before are dimmed, as while the run is on its way", entered)
        + state("A monofacial module: the switch cannot be used, and the desktop's words stand under the row", mono)
        + state("Under the pointer: the Temperature row, its value and running total in a tooltip (decision 18)", hover)
        + state("Out of range: 35 entered in Soiling becomes 30.0 %, the highest, and the field says so (D31); the run follows with 30 %", out_of_range)
    )
    side = notes(
        "LID is empty while it is the PAN's and says so in the field, “PAN 0.2 %”, as the approved board draws it; the engine labels the step “LID (PAN)” then. A value entered takes the field: the label is “LID”, "
        "the field holds 1.0 %, and under it the PAN's value, “PAN gives 0.2 %”, with the quiet press “Use the PAN's”, which sets the document's LID back to none (decision 6). Thermal Uc behaves the same with "
        "“Use the roof type's” (the board “Weather and assumptions”).",
        f"The rear gain is a switch (components.md “Switch”, 44 by 26): on, the accent track; off, line-strong. With a monofacial module (bifaciality 0 in the PAN) it cannot be used, opacity 0.45, and the row says the "
        f"desktop's sentence. The demo's module is bifacial 0.80.",
        f"Under the pointer the whole row is the target and takes surface-2; the tooltip stands over the row's middle, 8 above, the value first in the text, the label after it in text-2: “{n1(temp['value'])} MWh · "
        f"{pct2(temp['pct'])}”, then “Temperature”. On touch a tap shows it. The table of the chain is the chain itself: nothing is said in the tooltip alone.",
        "A number outside the range, 0 to 30 % for soiling (inventory 1.7), is brought to the nearest limit and the field says so under itself in text-caption; the next good entry takes the words away.",
    )
    body = (
        two_columns(f'<div style="display: flex; flex-direction: column; gap: 14px">{left}</div>', side)
        + two_columns(
            state(f"The rear gain off: the switch Off, the rear gain row {pct2(0.0)} with a tick of data-zero, the energy {n1(rear_off['energy_mwh'])} MWh", rear_crop),
            notes(
                f"The switch off sets bifacial to false in the document. The run has no rear gain: the row is {pct2(0.0)}, a 2 px tick in data-zero on the track, the running total unchanged at "
                f"{n1(next(s for s in rear_off['steps'] if s['label'] == 'Soiling')['value'])} kWh/m²; the energy is {n1(rear_off['energy_mwh'])} MWh, {n1(E['energy_mwh'] - rear_off['energy_mwh'])} less. "
                f"The clipping falls to {pct2(rear_off['clipping_pct'] * -1)}, since less reaches the inverter.",
                "The cascade is fitted to this run's extremes, so the GHI's marker moves right: the irradiance never rises above the transposition's end.",
            ),
        )
    )
    return card("LID, the rear gain, under the pointer, out of range", body, gap=14)


def phone_chain_row(step: dict, span: tuple[float, float], x, control: str = "", total: bool = False) -> str:
    """A row of the chain on phone: the label on its line; under it the input, if any, at the left, the change and
    the running total at the right; the track across the width."""
    if total:
        label = f'<span style="font-weight: 600">{step["label"]}</span>'
        right = f'<code style="font-weight: 500; white-space: nowrap">{n1(step["value"])} <span style="color: {TEXT_2}; font-weight: 400; font-size: 12px">{unit_of(step)}</span></code>'
        head = f'<div style="display: flex; flex-direction: column; gap: 2px; padding-top: 6px; border-top: 1px solid {LINE}">{label}<div style="display: flex; justify-content: flex-end">{right}</div></div>'
        track = f'<span style="position: relative; display: block; height: 20px">{bar(step, span, x, 20, True)}</span>'
        return f'<div style="display: flex; flex-direction: column; gap: 2px">{head}{track}</div>'
    label = f'<span style="color: {TEXT_2}">{step["label"]}</span>'
    figures = (
        f'<span style="display: flex; gap: 14px; white-space: nowrap"><code style="font-size: 14px">{pct2(step["pct"])}</code>'
        f'<code style="font-size: 14px; color: {TEXT_2}; min-width: 56px; text-align: right">{n1(step["value"])}</code></span>'
    )
    second = f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: {44 if control else 24}px">{control or "<span></span>"}{figures}</div>'
    track = f'<span style="position: relative; display: block; height: 12px; margin-top: 2px">{bar(step, span, x, 12, False)}</span>'
    return f'<div style="display: flex; flex-direction: column; gap: 2px; padding: 4px 0">{label}{second}{track}</div>'


def phone_chain(run: dict, only: tuple[int, int], controls: dict | None = None) -> str:
    steps = chosen(run)["energy"]["steps"]
    sp = spans(steps)
    x = scale_of(sp, 326, 8, 6)
    controls = controls or {}
    rows = ""
    for i in range(*only):
        s = steps[i]
        total = s["kind"] in ("irr_total", "energy_total", "result")
        control = controls.get(s["label"], "")
        if not control and not total:
            if s["label"] in LOSSES:
                control = small_input(IDS[s["label"]], LOSSES[s["label"]], width="96px", height=44, size=15, radius=10, label=s["label"])
            elif s["label"] == "LID (PAN)":
                control = pan_button("PAN 0.2 %", 44, 15)
            elif s["label"] == "Bifacial rear gain":
                control = switch(True, touch=True)
        rows += phone_chain_row(s, sp[i], x, control, total)
    return rows


NAV = piece(PHONE, '<nav aria-label="Workspaces"', "</nav>")
NAV_ICONS = re.findall(r"<svg.*?</svg>", NAV, re.S)


def tab_bar() -> str:
    """The tab bar of the phone (StudioPhone.dc.html), Performance the current page."""
    items = ""
    for (name, href), svg in zip((("Studio", "StudioPhone.dc.html"), ("Performance", "PerformancePhone.dc.html"), ("Handover", "Handover.dc.html")), NAV_ICONS):
        on = name == "Performance"
        look = f"; color: {ACCENT}; font-weight: 500" if on else ""
        current = ' aria-current="page"' if on else ""
        items += f'<a href="{href}"{current} style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px{look}">{svg}{name}</a>'
    return (
        f'<nav aria-label="Workspaces" style="height: 72px; flex-shrink: 0; box-sizing: border-box; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 6px 12px 10px; '
        f'background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}">{items}</nav>'
    )


def phone(inside: str, gap: int = 14) -> str:
    """A phone of 390: the header of StudioPhone.dc.html, the page in one column with its padding of 16, the tab bar."""
    header = piece(PHONE, "<header", "</header>")
    return (
        f'<div style="width: 390px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        f'{header}<div style="flex-grow: 1; display: flex; flex-direction: column; gap: {gap}px; padding: 8px 16px 20px">{inside}</div>{tab_bar()}</div>'
    )


def phone_title(line: str, under: str = "", dim_line: bool = False) -> str:
    fade = f"; {DIM}" if dim_line else ""
    return (
        f'<div style="display: flex; flex-direction: column; gap: 4px"><h1 style="margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Performance</h1>'
        f'<div style="font-size: 13px; color: {TEXT_2}{fade}">{line}</div>{under}</div>'
    )


def phone_panel(inside: str, gap: int = 10) -> str:
    return panel(inside, "width: 358px", pad="16px", gap=gap)


def chain_phone_card() -> str:
    steps = E["steps"]
    i_nominal = next(i for i, s in enumerate(steps) if s["kind"] == "energy_total")
    head = (
        '<div style="display: flex; flex-direction: column; gap: 6px"><h2 style="margin: 0; font-size: 16px; font-weight: 600">From sunlight to the grid</h2>'
        f'<div style="display: flex; align-items: center; gap: 14px; font-size: 12px; color: {TEXT_2}">'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {DATA_GAIN}"></span>Gain</span>'
        f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 10px; height: 10px; border-radius: 3px; background: {DATA_LOSS}"></span>Loss</span>'
        "<span>Boxed values are yours to change</span></div></div>"
    )
    rows = phone_chain(DEMO, (0, i_nominal + 1), controls={"Soiling": small_input("l-soil", "3.0 %", width="96px", height=44, size=15, radius=10, focus=True, label="Soiling")})
    screen_ = phone(phone_title(run_line(DEMO)) + phone_panel(head + f'<div style="display: flex; flex-direction: column">{rows}</div>'))
    side = notes(
        "On phone the chain takes the width, 358: a row is the label on a line of its own (Geist 15), then, where the step is the user's, the boxed input at the left, 44 high, with the change and the running "
        "total at the right in mono; then the track across the width, 12 high. A row without an input has the change and the total alone on its second line. Totals are 600 with a line over them and the 2 px marker.",
        f"The first eight rows are shown, from the GHI to the array's nominal energy; the rest follow the same way down to the grid's end. Soiling is being entered: 3.0 with the focus look; the run follows on commit "
        f"and dims the figures as on desktop.",
        "The legend wraps under the title. The switch of the rear gain is 52 by 30 in a hit area of 44, the PAN's LID a press of 44. The tooltip of a row comes on a tap.",
    )
    return card("On phone", two_columns(state("Phone 390: the chain with the input under the label, soiling being entered", screen_), side), gap=14)


def loss_chain_board() -> str:
    width, height = 1440, LOSS_CHAIN_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + soiling_running_card() + soiling_landed_card() + lid_rows_card() + chain_phone_card() + "</div>"
    return (
        HEAD.format(
            title="Loss chain, edited",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Loss chain, edited",
            lead="The chain as it is edited: soiling entered and the run on its way, then landed; LID from the PAN and entered; the rear gain off and a monofacial module; a row under the pointer; a value out of range; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Board 2: Charts, tooltip and table
# --------------------------------------------------------------------------------------------------

TH = f"padding: 0 8px; height: 36px; white-space: nowrap; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}; border-bottom: 1px solid {LINE}"
TD = f"padding: 0 8px; height: 44px; white-space: nowrap; border-bottom: 1px solid {LINE_SUBTLE}"


def month_bars(energy: dict, hover: str | None = None, width: int = 506, height: int = 176, gap: int = 10, side: int = 4, labels_size: int = 12) -> str:
    """The bars of the months on one axis, the extremes labelled, a hovered bar lifted with its tooltip beside it."""
    monthly = energy["monthly_mwh"]
    highest, lowest = max(monthly), min(monthly)
    top = height - 20
    bars = ""
    columns = (width - 2 * side - gap * 11) / 12
    tip = ""
    for i, (m, v) in enumerate(zip(MONTHS, monthly)):
        h = round(v / highest * top)
        said = f'<code style="position: absolute; left: -10px; right: -10px; top: -18px; text-align: center; font-size: {labels_size}px">{n1(v)}</code>' if v in (highest, lowest) and m != hover else ""
        lift = "; filter: brightness(1.14)" if m == hover else ""
        bars += f'<div style="position: relative; height: {h}px; border-radius: 4px 4px 0 0; background: {DATA_GAIN}{lift}">{said}</div>'
        if m == hover:
            x = side + i * (columns + gap) + columns
            y = height - h
            tip = (
                f'<div style="position: absolute; left: {x + 8:.0f}px; top: {y:.0f}px">{value_tip(f"{n1(v)} MWh · {kwh_kwp(v, A["dc_kwp"])} kWh/kWp", m)}</div>'
                f'<div style="position: absolute; left: {x - columns / 2 - 2:.0f}px; top: {y + 18:.0f}px">{POINTER}</div>'
            )
    label = ", ".join(f"{m} {n1(v)}" for m, v in zip(MONTHS, monthly))
    chart = (
        f'<div role="img" aria-label="Monthly energy in MWh: {label}" style="position: relative; height: {height}px">'
        f'<div style="position: absolute; left: 0; right: 0; top: 16px; height: 1px; background: {LINE_SUBTLE}"></div>'
        f'<div style="position: absolute; left: 0; right: 0; top: {height // 2 + 8}px; height: 1px; background: {LINE_SUBTLE}"></div>'
        f'<div style="position: absolute; left: 0; right: 0; top: {height}px; height: 1px; background: {LINE_STRONG}"></div>'
        f'<div style="position: absolute; left: 0; right: 0; bottom: 0; height: {height}px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: {gap}px; align-items: end; padding: 0 {side}px">{bars}</div>{tip}</div>'
    )
    names = "".join(f"<span>{m}</span>" for m in MONTHS)
    axis = f'<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: {gap}px; padding: 0 {side}px; font-size: {labels_size - 1 if labels_size < 12 else 12}px; color: {TEXT_2}; text-align: center">{names}</div>'
    return f'<div style="display: flex; flex-direction: column; gap: 14px">{chart}{axis}</div>'


def month_table(energy: dict, dc_kwp: float) -> str:
    rows = "".join(
        f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 500">{m}</th><td style="{TD}; text-align: right; {MONO}; font-size: 13px">{n1(v)}</td>'
        f'<td style="{TD}; text-align: right; {MONO}; font-size: 13px">{kwh_kwp(v, dc_kwp)}</td></tr>'
        for m, v in zip(MONTHS, energy["monthly_mwh"])
    )
    year = (
        f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 600; border-top: 1px solid {LINE}; border-bottom: 0">Year</th>'
        f'<td style="{TD}; text-align: right; {MONO}; font-size: 13px; font-weight: 500; border-top: 1px solid {LINE}; border-bottom: 0">{n1(energy["energy_mwh"])}</td>'
        f'<td style="{TD}; text-align: right; {MONO}; font-size: 13px; font-weight: 500; border-top: 1px solid {LINE}; border-bottom: 0">{n0(energy["specific_yield"])}</td></tr>'
    )
    return (
        f'<table style="width: 100%"><thead><tr><th scope="col" style="{TH}; text-align: left">Month</th><th scope="col" style="{TH}; text-align: right">MWh</th>'
        f'<th scope="col" style="{TH}; text-align: right">kWh/kWp</th></tr></thead><tbody>{rows}{year}</tbody></table>'
    )


def chart_head(title: str, right: str) -> str:
    return f'<div style="display: flex; align-items: center; gap: 12px"><h2 style="margin: 0; font-size: 16px; font-weight: 600">{title}</h2><span style="margin-left: auto; display: flex; align-items: center; gap: 12px">{right}</span></div>'


def tabs_of(taken: str, label: str, touch: bool = False) -> str:
    return tab_row(tab("Chart", taken=taken == "Chart", touch=touch) + tab("Table", taken=taken == "Table", touch=touch), label)


def months_card(taken: str, hover: str | None = None, width: int = CHART_WIDTH, touch: bool = False) -> str:
    energy = E
    inner = width - 48 if not touch else width - 32
    if taken == "Chart":
        body = month_bars(energy, hover, width=inner, height=176 if not touch else 150, gap=10 if not touch else 6, side=4 if not touch else 2, labels_size=12 if not touch else 11)
    else:
        body = month_table(energy, A["dc_kwp"])
    inside = chart_head("Energy to grid by month", caption_line("MWh" if taken == "Chart" else "of option A")) + tabs_of(taken, "Energy to grid by month", touch) + f'<div role="tabpanel" aria-label="{taken}" style="margin-top: 2px">{body}</div>'
    return panel(inside, width, pad="22px 24px" if not touch else "16px", gap=14)


def years_line(years: list[float], width: int, hover_year: int | None = None, tag: str = "y") -> str:
    """The 25 years as a line of 2 with a wash under it; the year under the pointer has a hairline, its marker and
    its tooltip."""
    height = 72
    hi, lo = max(years), min(years)
    pts = [((i / 24) * width, 14 + (hi - v) / (hi - lo) * 45) for i, v in enumerate(years)]
    line = " ".join(f"L{x:.1f} {y:.1f}" for x, y in pts[1:])
    path = f"M{pts[0][0]:.1f} {pts[0][1]:.1f} {line}"
    svg = (
        f'<svg viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="Yearly energy falls from {n1(years[0])} MWh in year 1 to {n1(years[-1])} MWh in year 25" style="display: block; overflow: visible">'
        f'<path d="{path} L{width} {height} L0 {height} Z" fill="{DATA_GAIN}" fill-opacity="0.14"/>'
        f'<path d="{path}" fill="none" stroke="{DATA_GAIN}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    )
    tip = ""
    if hover_year:
        x, y = pts[hover_year - 1]
        svg += (
            f'<line x1="{x:.1f}" y1="0" x2="{x:.1f}" y2="{height}" stroke="{LINE_STRONG}" stroke-width="1"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="6" fill="{SURFACE_1}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="{DATA_GAIN}"/>'
        )
        tip = (
            f'<div style="position: absolute; right: {width - x + 10:.0f}px; top: {y + 6:.0f}px">{value_tip(f"{n1(years[hover_year - 1])} MWh", f"Year {hover_year}")}</div>'
            f'<div style="position: absolute; left: {x + 2:.0f}px; top: {y + 4:.0f}px">{POINTER}</div>'
        )
    svg += "</svg>"
    return f'<div style="position: relative">{svg}{tip}</div>'


def six_years(years: list[float]) -> str:
    cells = ""
    for n, y in enumerate(SIX_YEARS):
        align = "; text-align: right" if n == len(SIX_YEARS) - 1 else ""
        cells += f'<div style="display: flex; flex-direction: column; gap: 2px{align}"><span style="font-size: 12px; color: {TEXT_2}">{"Year 1" if y == 1 else y}</span><code style="font-size: 13px">{n1(years[y - 1])}</code></div>'
    return f'<div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">{cells}</div>'


def years_table(energy: dict) -> str:
    years = energy["years_mwh"]
    rows = "".join(f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 500">Year {y}</th><td style="{TD}; text-align: right; {MONO}; font-size: 13px">{n1(years[y - 1])}</td></tr>' for y in SIX_YEARS)
    total = (
        f'<tr><th scope="row" style="{TD}; text-align: left; font-weight: 600; border-top: 1px solid {LINE}; border-bottom: 0">Total, 25 years</th>'
        f'<td style="{TD}; text-align: right; {MONO}; font-size: 13px; font-weight: 500; border-top: 1px solid {LINE}; border-bottom: 0">{n0(energy["total_25_years_mwh"])}</td></tr>'
    )
    return (
        f'<table style="width: 100%"><thead><tr><th scope="col" style="{TH}; text-align: left">Year</th><th scope="col" style="{TH}; text-align: right">MWh</th></tr></thead><tbody>{rows}{total}</tbody></table>'
        f'<div style="padding-top: 10px; font-size: 12px; color: {TEXT_2}">Every year is in the chart; the table says six of them and the total.</div>'
    )


def degradation_field(value: str = "0.50 %/yr", focus: bool = False, touch: bool = False) -> str:
    return (
        f'<label for="deg" style="font-size: 12px; color: {TEXT_2}">Degradation</label>'
        + small_input("deg", value, width="92px" if not touch else "120px", focus=focus, height=29 if not touch else 44, size=12 if not touch else 15, radius=6 if not touch else 10)
    )


def years_card(run: dict, taken: str, hover_year: int | None = None, degradation: str = "0.50 %/yr", focus: bool = False, width: int = CHART_WIDTH, touch: bool = False) -> str:
    energy = chosen(run)["energy"]
    inner = width - 48 if not touch else width - 32
    if taken == "Chart":
        body = f'<div style="display: flex; flex-direction: column; gap: 12px">{years_line(energy["years_mwh"], inner, hover_year)}{six_years(energy["years_mwh"])}</div>'
    else:
        body = years_table(energy)
    if touch:
        head = chart_head("25 years", caption_line("MWh")) + f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: -2px">{degradation_field(degradation, focus, touch=True)}</div>'
    else:
        head = chart_head("25 years", degradation_field(degradation, focus))
    inside = head + tabs_of(taken, "25 years", touch) + f'<div role="tabpanel" aria-label="{taken}" style="margin-top: 2px">{body}</div>'
    return panel(inside, width, pad="22px 24px" if not touch else "16px", gap=14)


def months_board_card() -> str:
    mar = E["monthly_mwh"][2]
    body = (
        f'<div style="display: grid; grid-template-columns: {CHART_WIDTH}px {CHART_WIDTH}px; gap: 24px; align-items: start">'
        + state("The Chart tab, March under the pointer: the bar lifts, the tooltip says MWh and kWh/kWp", ground(months_card("Chart", hover="Mar")))
        + state("The Table tab taken: the twelve months, MWh and kWh/kWp, and the year", ground(months_card("Table")))
        + "</div>"
        + notes(
            f"The card has Chart and Table as tabs in its head (decision 9, the board “Tabs”). The bars are the run's monthly_mwh on one axis, the extremes labelled: March {n1(max(E['monthly_mwh']))}, July "
            f"{n1(min(E['monthly_mwh']))}. Under the pointer the bar is the target and lifts (brightness 1.14, the hover of every control); its tooltip stands beside its top, the value first: "
            f"“{n1(mar)} MWh · {kwh_kwp(mar, A['dc_kwp'])} kWh/kWp”, then “Mar”. The month's kWh/kWp is its MWh × 1,000 over the DC capacity, {A['dc_kwp']:.2f} kWp. The extreme's label gives way to the tooltip while it is shown.",
            f"The table is the same numbers (components.md “Table”): Month in Geist 500, MWh and kWh/kWp in mono 13 at the right, 12 rows of 44, and the year as a last row in Geist 600 over a line: "
            f"{n1(E['energy_mwh'])} MWh and {n0(E['specific_yield'])} kWh/kWp, the run's energy and specific yield. The head says what option it is of.",
            "The tooltip is never the only place: the table holds every value (decision 18, guidelines “Charts”). On touch a tap on a bar shows it.",
        )
    )
    return card("Energy to grid by month", body, gap=14)


def years_board_card() -> str:
    years = E["years_mwh"]
    body = (
        f'<div style="display: grid; grid-template-columns: {CHART_WIDTH}px {CHART_WIDTH}px; gap: 24px; align-items: start">'
        + state("The Chart tab, year 10 under the pointer: a hairline, the marker, the tooltip", ground(years_card(DEMO, "Chart", hover_year=10)))
        + state("The Table tab: years 1, 5, 10, 15, 20, 25 and the total", ground(years_card(DEMO, "Table")))
        + "</div>"
        + notes(
            f"The line of 2 in data-gain with a wash of 14 % under it, the 25 years from {n1(years[0])} to {n1(years[-1])} MWh, fitted to the run's own extremes. Under the pointer a hairline in line-strong finds the "
            f"nearest year, a marker of 8 with a ring of the surface stands on the line, and the tooltip says “{n1(years[9])} MWh” then “Year 10”. Under the line the six years, as approved.",
            f"The table: six rows and “Total, 25 years” in Geist 600 over a line, {n0(E['total_25_years_mwh'])} MWh, the run's total_25_years_mwh, which the tile “Energy over 25 years” says too.",
        )
    )
    return card("25 years", body, gap=14)


def degradation_card() -> str:
    d7 = chosen(DEGRADATION_0_7)["energy"]
    body = (
        f'<div style="display: grid; grid-template-columns: {CHART_WIDTH}px {CHART_WIDTH}px; gap: 24px; align-items: start">'
        + state("Degradation entered, 0.70 %/yr: the field with the focus look, the line and the six years of that run", ground(years_card(DEGRADATION_0_7, "Chart", degradation="0.70 %/yr", focus=True)))
        + state("Its table", ground(years_card(DEGRADATION_0_7, "Table", degradation="0.70 %/yr")))
        + "</div>"
        + notes(
            f"Degradation is a field of the document, 0 to 3 %/yr (inventory 1.7), in the head of the card. At 0.70 the energy of year 1 is unchanged, {n1(d7['years_mwh'][0])} MWh; year 25 is "
            f"{n1(d7['years_mwh'][-1])} in place of {n1(years_of(DEMO)[-1])}, and the total {n0(d7['total_25_years_mwh'])} MWh in place of {n0(E['total_25_years_mwh'])}. The tile of the 25 years follows.",
            "The answer comes in about a quarter of a second: the degradation touches no hour, so the figures after the year are worked out from the year's energy without simulating again (decision 5). "
            "The line is fitted to the new extremes, so it falls across the same height; the numbers say how much.",
        )
    )
    return card("Degradation entered", body, gap=14)


def years_of(run: dict) -> list[float]:
    return chosen(run)["energy"]["years_mwh"]


def charts_phone_card() -> str:
    screen_ = phone(phone_title(run_line(DEMO)) + months_card("Chart", width=358, touch=True) + years_card(DEMO, "Chart", width=358, touch=True))
    side = notes(
        "On phone the two cards stand one under the other at 358 (the page is one column). The months keep their labels at 11 px, the bars 6 apart; the tabs are 44 high. The year's card puts the "
        "degradation field on a line of its own under the title, 44 high, since the title and the tabs leave it no room beside them.",
        "A tap on a bar or on the line shows the tooltip; the Table tab is where every value is read without it.",
    )
    return card("On phone", two_columns(state("Phone 390: the two chart cards, Chart taken", screen_), side), gap=14)


def charts_board() -> str:
    width, height = 1440, CHARTS_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + months_board_card() + years_board_card() + degradation_card() + charts_phone_card() + "</div>"
    return (
        HEAD.format(
            title="Charts, tooltip and table",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Charts, tooltip and table",
            lead="The month under the pointer with MWh and kWh/kWp and the table of the months; the 25 years under the pointer and their table; the degradation entered at 0.70 %/yr; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Board 3: Weather and assumptions
# --------------------------------------------------------------------------------------------------


def weather_menu(selected: str = "PVGIS TMY", under_pointer: str | None = None) -> str:
    items = "".join(
        option(name, fact, selected=name == selected, under_pointer=name == under_pointer)
        .replace('<span style="flex-grow: 1;', '<span style="flex-grow: 1; white-space: nowrap;')
        .replace(f'<span style="font-size: 12px; color: {TEXT_3}">', f'<span style="font-size: 12px; color: {TEXT_3}; white-space: nowrap">')
        for name, fact in SOURCE_FACTS.items()
    )
    return menu(items)


def header_right(run: dict, trigger: str, dim_switch: bool = False) -> str:
    return trigger + option_switch(run, dim=dim_switch)


def select_open_card() -> str:
    crop = ground(
        f'<div style="display: flex; align-items: flex-start; gap: 12px"><div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px">{weather_trigger(open_=True)}{weather_menu(under_pointer="NASA POWER 2023")}</div>{option_switch(DEMO)}</div>'
    )
    side = notes(
        "The weather is a select in the header (decision 12, components.md “Select”): the trigger pressed and its chevron turned, the list 320 wide 6 under it, their left edges in line. Three sources: PVGIS TMY, "
        "taken, with a tick in accent; NASA POWER 2023 under the pointer, on surface-2; CSV file. Each has one fact at the right in text-caption: what year it is and whether it brings a horizon, or how a file is read. "
        "The words of the facts are drafted here for the owner's yes (decision 19: NASA stays the year 2023, a CSV's times stay UTC).",
        "PVGIS or NASA chosen asks /weather first and edits the document once with the source and its hours when they come; CSV file opens the dialog below. Taking the source that is taken changes nothing.",
    )
    return card("The weather select, open", two_columns(state("Desktop: the select open, the option switch beside it", crop), side), gap=14)


def nasa_card() -> str:
    loading = screen(page_header(run_line(DEMO), header_right(DEMO, weather_trigger("NASA POWER 2023", loading=True)), under=step_row("Loading NASA POWER 2023 weather", "", None), dim_line=True))
    landed_energy = chosen(NASA)["energy"]
    landed = screen(page_header(run_line(NASA), header_right(NASA, weather_trigger("NASA POWER 2023"))) + kpi_row(landed_energy))
    w = NASA["weather"]
    body = (
        state("NASA POWER 2023 chosen: the trigger shows it with the turning ring of 16 while the hours are downloaded; the line of the run is dimmed", loading)
        + state(f"Landed: the line says {w['hours']:,} hours of NASA POWER 2023 weather, {w['t_min_c']:.1f} to {w['t_max_c']:.1f} °C, no horizon; the KPIs are of the run on it", landed)
        + notes(
            f"The trigger takes the new name at once and the ring stands where the chevron was; the line under the title is dimmed, since it carries the weather that is being replaced; the row under it says what is "
            f"loaded. When the hours come the document is edited once with the source and its weather, and the run follows: a new source computes the shading again, 11 to 12 s, and the number shows its steps.",
            f"Landed, the line is the run's (decision 2): {run_line(NASA)}. NASA has no horizon profile, so the line says “no horizon” and the engine's far shading note reads “{NASA['far_shading_note']}”. "
            f"The energy on this weather is {n1(landed_energy['energy_mwh'])} MWh, PR {landed_energy['pr'] * 100:.1f} %, {n0(landed_energy['specific_yield'])} kWh/kWp; the in-plane irradiation {n0(landed_energy['poa_kwh_m2'])} kWh/m², "
            f"below the GHI's {n0(landed_energy['ghi_kwh_m2'])}: NASA's diffuse share is high, and the transposition to the tilted plane loses {pct2(landed_energy['steps'][1]['pct'])}.",
            "The page is drawn at a window of 1320 here, 1240 inside, so that it fits the board; at 1440 the header is one line as approved.",
        )
    )
    return card("NASA POWER, loading and landed", body, gap=14)


def note_line(words: str, size: int = 13) -> str:
    return f'<div style="display: flex; align-items: flex-start; gap: 10px; font-size: {size}px; color: {TEXT_2}"><span style="display: flex; padding-top: 1px">{note(18)}</span><span>{words}</span></div>'


def csv_summary_lines(summary: dict) -> tuple[str, str, str]:
    """The weather summary of the API in three lines, as the file's card has room for them beside its button."""
    first = f"{summary['hours']:,} hours · GHI {n1(summary['ghi_kwh_m2'])} kWh/m²"
    second = f"beam {n1(summary['dni_kwh_m2'])} · diffuse {n1(summary['dhi_kwh_m2'])} kWh/m²"
    third = f"{summary['t_min_c']:.1f} to {summary['t_max_c']:.1f} °C"
    return first, second, third


def csv_dialog(drop_html: str, notes_html: str = "", can_use: bool = True) -> str:
    use = f'<button style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; height: 40px; white-space: nowrap; padding: 0 16px; background: {ACCENT}; color: {ACCENT_INK}; border: 0; border-radius: 10px; font-weight: 600; cursor: pointer; box-shadow: {SHADOW_PRIMARY}{"" if can_use else "; " + DISABLED + "; box-shadow: none"}"{"" if can_use else " disabled"}>Use this weather</button>'
    return (
        f'<div role="dialog" aria-labelledby="csv-t" aria-describedby="csv-d" style="width: 440px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 22px 22px 20px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="csv-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Load weather from a CSV</h3>'
        + icon_button("Close", CLOSE, 32)
        + "</div>"
        f'<p id="csv-d" style="margin: 0; color: {TEXT_2}">Hourly values of a year: a time column, global irradiance, and, if you have them, beam, diffuse, air temperature and wind. Times are read as UTC.</p>'
        + drop_html
        + notes_html
        + f'<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px">{quiet("Cancel")}{use}</div></div>'
    )


def csv_read_drop() -> str:
    first, second, third = csv_summary_lines(DATA["csv_ghi_only_weather"]["summary"])
    return (
        f'<div role="status" style="display: flex; align-items: flex-start; gap: 14px; box-sizing: border-box; padding: 16px 18px; border-radius: 12px; background: {SURFACE_2}; border: 1px solid {LINE}">'
        f'<span style="display: flex; padding-top: 2px">{icon(FILE, 20, ACCENT, 1.8)}</span>'
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><code style="font-size: 13px; font-weight: 500; color: {TEXT}">pune-ghi.csv</code>'
        f'<span style="font-size: 12px; color: {TEXT_2}; white-space: nowrap">{first}</span><span style="font-size: 12px; color: {TEXT_2}; white-space: nowrap">{second}</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}">{third}</span></span>{secondary("Choose another", 36)}</div>'
    )


def csv_refused_drop() -> str:
    return drop(
        f"background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}",
        note(20)
        + '<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font-weight: 500">This file was not loaded</span>'
        f'<span style="font-size: 12px; color: {TEXT_2}; white-space: normal">{DATA["csv_refused"]["message"]}</span></span>'
        + secondary("Choose another", 36),
        height=96,
    )


def csv_card() -> str:
    erbs = DATA["csv_ghi_only_weather"]["notes"][0]
    notes_html = f'<div role="status" style="display: flex; flex-direction: column; gap: 8px; padding: 2px 0 0">{note_line(erbs)}{note_line(NOTE_NO_TEMPERATURE)}{note_line(NOTE_NO_WIND)}</div>'
    read = dimmed_stage(csv_dialog(csv_read_drop(), notes_html), 640)
    refused = dimmed_stage(csv_dialog(csv_refused_drop(), can_use=False), 640)
    body = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start">'
        + state("CSV file chosen: the dialog, the file pune-ghi.csv read by /weather, its summary and its three notes before Use", read)
        + state("A file that is no weather CSV, refused in the API's words; the weather of before is kept (D32)", refused)
        + "</div>"
        + notes(
            "The dialog is the module's and the inverter's (components.md “Dialog”): the title in the display face, one sentence of what a file holds and that times are read as UTC (decision 19), the file drop of the kit, "
            "the actions at the right, Cancel quiet and “Use this weather” primary. The file is read by /weather as text; nothing is committed until Use, which puts the source, the file's name and text and the hours "
            "into the document in one edit.",
            f"Read, the drop becomes the file's card: the name in mono, then the weather summary of the API in three lines, “{' · '.join(csv_summary_lines(DATA['csv_ghi_only_weather']['summary'])[:2])}” and "
            f"“{csv_summary_lines(DATA['csv_ghi_only_weather']['summary'])[2]}”: the file has no temperature, so its lowest and highest are both the 25 °C the engine takes. Under it the notes, each with a note mark. "
            f"The first is the engine's today, word for word: “{erbs}”",
            f"The next two are drafted for decision 14 and the engine will say them; the owner approves the words. Without air temperature: “{NOTE_NO_TEMPERATURE}” Without wind speed: “{NOTE_NO_WIND}” "
            "No number changes; after Use the same notes stand in the header's notes of the run.",
            f"Refused: the drop takes the note surface and says the API's words under “This file was not loaded”: “{DATA['csv_refused']['message']}”. Use cannot be pressed; Cancel leaves the weather of before.",
        )
    )
    return card("Load weather from a CSV", body, gap=14)


def refused_download_card() -> str:
    message = DATA["pvgis_refused"]["message"]
    right = (
        f'<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px"><div style="display: flex; align-items: center; gap: 12px">{weather_trigger("PVGIS TMY")}{option_switch(DEMO)}</div>'
        f'<div role="status" style="display: flex; align-items: flex-start; gap: 10px; width: 560px; box-sizing: border-box; padding: 10px 12px; background: {NOTE_SURFACE}; border: 1px solid {NOTE_LINE}; border-radius: 10px; font-size: 13px; color: {TEXT_2}">'
        f'<span style="display: flex; padding-top: 1px">{note(18)}</span><span><span style="display: block; color: {TEXT}; font-weight: 500">The weather was not loaded</span>{message}</span></div></div>'
    )
    crop = screen(
        '<div style="display: flex; align-items: flex-start; gap: 16px">'
        f'<div style="display: flex; flex-direction: column; gap: 4px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Performance</h1><div style="color: {TEXT_2}">{run_line(DEMO)}</div></div>'
        f'<div style="margin-left: auto">{right}</div></div>'
    )
    side = notes(
        f"A download that failed says the API's words under the select, in a note: “{message}” The source of before stays in the trigger and in the document, its hours untouched, and the run's figures stand "
        "as they were (decision 12). The note goes with the next choice.",
        "The message is the API's for a site PVGIS does not cover, the one recorded for the tests; a server that cannot be reached says so in the same place.",
    )
    return card("A download that failed", state("Desktop: the API's words under the select; PVGIS TMY still the source", crop) + side, gap=14)


def chip(label: str, inside: str) -> str:
    return (
        f'<div style="display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 6px 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 9px; font-size: 13px; '
        f'box-shadow: {SHADOW_RAISED}"><span style="color: {TEXT_2}; white-space: nowrap">{label}</span>{inside}</div>'
    )


def levels_fields(levels: tuple[int, ...]) -> str:
    out = ""
    for i, p in enumerate(levels):
        out += ('<span style="color: ' + TEXT_3 + '">·</span>' if i else "") + f'<span style="display: flex; align-items: center; gap: 2px"><span style="{MONO}; font-size: 12px; color: {TEXT_2}">P</span>{small_input(f"p{i}", str(p), width="40px", label=f"Exceedance level {i + 1}")}</span>'
    return f'<span style="display: flex; align-items: center; gap: 6px">{out}</span>'


def assumptions_fields(uc: str | None = None, levels: tuple[int, ...] = (50, 75, 90), sizing: dict | None = None) -> str:
    sizing = sizing or DEMO["sizing"]
    if uc is None:
        uc_inside = small_input("uc", "", width="84px", label="Thermal Uc") + caption_line(f"{sizing['uc']:.0f} W/m²K by roof type", TEXT_3)
    else:
        uc_inside = small_input("uc", uc, width="84px", label="Thermal Uc") + caption_line(f"{DEMO['sizing']['uc']:.0f} by roof type", TEXT_3) + small_quiet("Use the roof type's")
    return (
        chip("Thermal Uc", uc_inside)
        + chip("Rear shading and mismatch", small_input("rear", "10 %", width="64px", label="Rear shading and mismatch"))
        + chip("Roof albedo", small_input("alb", "0.20", width="60px", label="Roof albedo"))
        + chip("Weather variability", small_input("wsig", "3.0 %", width="64px", label="Weather variability"))
        + chip("Model and data", small_input("msig", "3.0 %", width="64px", label="Model and data"))
        + chip("Exceedance levels", levels_fields(levels))
        + chip("Grid CO₂", small_input("co2", "0.716 t/MWh", width="104px", label="Grid CO₂"))
    )


def assumptions_card(width: int | str, uc: str | None = None, levels: tuple[int, ...] = (50, 75, 90)) -> str:
    inside = '<h2 style="margin: 0; font-size: 16px; font-weight: 600">Assumptions</h2>' + f'<div style="display: flex; flex-wrap: wrap; gap: 8px">{assumptions_fields(uc, levels)}</div>'
    return panel(inside, width, gap=12)


def assumptions_entered_card() -> str:
    energy = chosen(LEVELS_UC)["energy"]
    crop = screen(
        f'<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px">{lead_tile(energy)}{assumptions_card("grid-column: span 7", uc="25 W/m²K", levels=(50, 90, 99))}</div>'
    )
    p = {v["level"]: v["mwh"] for v in energy["p_values"]}
    side = notes(
        f"Every assumption is a field in its chip (decisions 6 and 8), with the range of inventory 1.7: Uc 5 to 60 W/m²K, the rear shading and mismatch 0 to 50 %, the albedo 0.05 to 0.90, the sigmas 0 to 20 %, the "
        f"levels 50 to 99, the CO₂ factor 0 to 2 t/MWh. Uc is empty while it is the roof type's and says “29 W/m²K by roof type” beside it; entered, 25 here, it holds the value with “29 by roof type” and the quiet press "
        f"“Use the roof type's”, which gives it back.",
        f"The exceedance levels are three small fields; on commit they are sorted and each kept once. Changed to 50, 90, 99, the lead tile's cells follow: P50 {n1(p[50])}, P90 {n1(p[90])}, P99 {n1(p[99])} MWh, "
        f"σ {energy['sigma_pct']:.2f} % on the last. The energy with Uc 25 is {n1(energy['energy_mwh'])} MWh: a lower Uc, warmer cells, {pct2(energy['steps'][9]['pct'])} of temperature in the chain.",
        "The levels, the sigmas and the CO₂ factor answer in a quarter of a second (decision 5); Uc, the rear loss and the albedo simulate the options again, about 4 s, with the ring on the energy. An edit of the albedo "
        "asks the run and not the layout (decision 7).",
    )
    return card("Assumptions, Uc entered and the levels changed", state(f"Desktop: the lead tile with P50 · P90 · P99, {n1(energy['energy_mwh'])} MWh, and the assumptions as fields", crop) + side, gap=14)


def phone_select(label: str, value: str, after: str = "") -> str:
    return (
        f'<button aria-haspopup="listbox" aria-expanded="false" style="display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px; background: {CONTROL}; border: 1px solid {LINE}; border-radius: 12px; '
        f'cursor: pointer; box-shadow: {SHADOW_RAISED}; font-size: 15px; white-space: nowrap"><span style="color: {TEXT_2}">{label}</span><span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis">{value}</span>{after}'
        f'<span style="margin-left: auto; display: flex">{icon(CHEVRON, 16, TEXT_3)}</span></button>'
    )


def phone_assumption_row(id_: str, label: str, value: str, detail: str = "", width: int = 132) -> str:
    detail_ = f'<span style="font-size: 12px; color: {TEXT_3}">{detail}</span>' if detail else ""
    return (
        f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px">'
        f'<label for="{id_}" style="display: flex; flex-direction: column; color: {TEXT_2}">{label}{detail_}</label>{small_input(id_, value, width=f"{width}px", height=44, size=15, radius=10)}</div>'
    )


def phone_assumptions(uc: str = "", levels: tuple[int, ...] = (50, 75, 90)) -> str:
    levels_ = "".join(
        ('<span style="color: ' + TEXT_3 + '">·</span>' if i else "") + f'<span style="display: flex; align-items: center; gap: 2px"><span style="{MONO}; font-size: 13px; color: {TEXT_2}">P</span>{small_input(f"p{i}", str(p), width="52px", height=44, size=15, radius=10)}</span>'
        for i, p in enumerate(levels)
    )
    rows = (
        phone_assumption_row("uc", "Thermal Uc", uc, "29 W/m²K by roof type" if not uc else "29 by roof type")
        + phone_assumption_row("rear", "Rear shading and mismatch", "10 %")
        + phone_assumption_row("alb", "Roof albedo", "0.20")
        + phone_assumption_row("wsig", "Weather variability", "3.0 %")
        + phone_assumption_row("msig", "Model and data", "3.0 %")
        + f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px"><span style="color: {TEXT_2}">Exceedance levels</span><span style="display: flex; align-items: center; gap: 6px">{levels_}</span></div>'
        + phone_assumption_row("co2", "Grid CO₂", "0.716 t/MWh", width=148)
    )
    return phone_panel('<h2 style="margin: 0; font-size: 16px; font-weight: 600">Assumptions</h2>' + f'<div style="display: flex; flex-direction: column">{rows}</div>', gap=6)


def weather_phone_card() -> str:
    screen_ = phone(
        phone_title(run_line(DEMO))
        + f'<div style="display: flex; flex-direction: column; gap: 8px">{phone_select("Weather", "PVGIS TMY")}{phone_select("Option", A["title"], mark(True))}</div>'
        + phone_assumptions()
    )
    side = notes(
        "On phone the option switch and the weather are two selects across the width, 44 high (decision 4): the option's shows the chosen one's title and its mark; each opens as a bottom sheet with rows of 52.",
        "The assumptions are rows: the label at the left with its source under it where there is one, the boxed value at the right, 44 high; the three levels in one row. Uc is empty while it is the roof type's.",
    )
    return card("On phone", two_columns(state("Phone 390: the two selects stacked; the assumptions as rows", screen_), side), gap=14)


def weather_board() -> str:
    width, height = 1440, WEATHER_HEIGHT
    body = (
        '<div style="display: flex; flex-direction: column; gap: 16px">'
        + select_open_card()
        + nasa_card()
        + csv_card()
        + refused_download_card()
        + assumptions_entered_card()
        + weather_phone_card()
        + "</div>"
    )
    return (
        HEAD.format(
            title="Weather and assumptions",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Weather and assumptions",
            lead="The weather select open; NASA POWER loading, then chosen; the CSV dialog with a file of GHI alone and its notes; a download that failed; the assumptions as fields, Uc entered and the levels changed; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Board 4: Performance, states
# --------------------------------------------------------------------------------------------------


def no_options_card(no: dict, touch: bool = False) -> str:
    """Before options (decision 15, D37): the API's title and message on the note surface, leading to the Strings lens."""
    size, t_size = (15, 17) if touch else (14, 16)
    link = (
        f'<a href="StringsLensNoVoltage.dc.html" style="flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: {44 if touch else 40}px; padding: 0 16px; background: {CONTROL}; '
        f'border: 1px solid {LINE_STRONG}; border-radius: 10px; color: {TEXT}; font-weight: 500; box-shadow: {SHADOW_RAISED}; white-space: nowrap">Open the Strings lens{icon(ARROW, 16, TEXT_2)}</a>'
    )
    words = (
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><span style="font-size: {t_size}px; font-weight: 600">{no["title"]}</span>'
        f'<span style="font-size: {size}px; color: {TEXT_2}">{no["message"]}</span></span>'
    )
    if touch:
        inside = f'<div style="display: flex; align-items: flex-start; gap: 12px"><span style="display: flex; padding-top: 1px">{note(22)}</span>{words}</div>{link}'
        return f'<section aria-label="What energy waits for" style="display: flex; flex-direction: column; gap: 14px; padding: 18px 16px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; border-radius: 18px; box-shadow: {HALO_DECISION}">{inside}</section>'
    return (
        f'<section aria-label="What energy waits for" style="display: flex; align-items: center; gap: 16px; padding: 22px 24px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; border-radius: 18px; box-shadow: {HALO_DECISION}">'
        f"{note(22)}{words}{link}</section>"
    )


def before_voltage_card() -> str:
    crop = screen(page_header(no_options_line(NO_VOLTAGE), weather_trigger()) + no_options_card(NO_VOLTAGE["no_options"]) + assumptions_card("width: 100%"))
    side = notes(
        f"Before a system voltage there are no options and no energy: the page shows the API's title and message of no_options (D37), “{NO_VOLTAGE['no_options']['title']}”, "
        f"“{NO_VOLTAGE['no_options']['message']}”, on the note surface with the accent line and halo of a decision, and a button to the Strings lens, where the voltage is chosen. No voltage is offered here: "
        "the choice is made once, in the Strings lens, and never preselected.",
        f"The header keeps the weather select and says what is ready: the positions of the layout, {NO_VOLTAGE['readouts']['positions']}, and the weather's hours, temperatures and horizon. There is no option switch, "
        "no KPI, no chain, no chart and no summary: a value that cannot exist yet is absent with its reason, never 0. The assumptions stay, as fields: they are inputs and can be set before the voltage.",
        "The same page serves the other reasons of no_options (no positions, no string length that fits, too few positions), each in the API's words.",
    )
    return card("Before a system voltage", state("Desktop, a window of 1320: the header, the API's words in place of the KPIs, the assumptions", crop) + side, gap=14)


def first_load_card() -> str:
    crop = screen(page_header("", weather_trigger() + option_switch(DEMO, dim=True), under=step_row("Opening Pune demo roof", STEP_FITTING, 0.08), line_skeleton=True) + kpi_row(E, skeleton=True))
    side = notes(
        "The first load: no value was ever there, so every place of a value holds a skeleton (components.md “Skeleton”): the line under the title a bar of 12, the lead tile a label of 10 and a value of 22, "
        "the P cells on surface-2 their blocks in control-active, the six tiles a label of 10 and a value of 18. They breathe over 1.6 s and stand still under reduced motion.",
        f"Under the title the ring of 20 with its arc, “Opening Pune demo roof”, and the step of the engine, “{STEP_FITTING}”. The weather select stands as it is; the option switch is dimmed until the options come.",
        "No skeleton ever replaces a value that was there: a value of before stays, dimmed (the next card).",
    )
    return card("The first load", state("Desktop: skeletons in every place of a value; the ring and the step under the title", crop) + side, gap=14)


def updating_card() -> str:
    crop = screen(page_header(run_line(DEMO), weather_trigger() + option_switch(DEMO), under=step_row("Updating energy", STEP_SHADING, 0.4), dim_line=True) + kpi_row(E, dim=True, ring_=True))
    side = notes(
        "A run on its way after an edit: every value of before stays and is dimmed to opacity 0.55, the labels and the units full; the turning ring of 16 stands beside the lead energy, the number that is updating. "
        f"Under the title the ring of 20 with its arc at 40 %, “Updating energy” and the step of the engine, “{STEP_SHADING}”, as the vitals say it (components.md “Vitals: states”).",
        "The chain, the charts and the summary below are dimmed the same way (the board “Loss chain, edited”). When the result lands, the values roll to the new ones and the row goes.",
    )
    return card("A run on its way", state("Desktop: the values dimmed, the ring on the energy, the step under the title", crop) + side, gap=14)


def failed_card() -> str:
    message = DATA["weather_not_loaded"]["message"]
    crop = screen(page_header(run_line(DEMO), weather_trigger() + option_switch(DEMO), under=failed_row(message)) + kpi_row(E))
    side = notes(
        "A run that failed keeps the last good values, not dimmed, and says so under the title in a note: “Energy was not updated”, “Values are of the design before · Try again”, Try again a quiet press that "
        "runs again. Under them the reason in the API's words, so that what to do is clear.",
        f"The message here is the API's for a design whose document holds no weather for its site: “{message}” In the running app this refusal is answered by loading the weather and running again (decision 11); "
        "any other failure stands here in the same words the API gives.",
        "The notes drawer of the shell lists the same note; the page says it where the value is.",
    )
    return card("A run failed", state("Desktop: the values of before, the note with Try again and the API's message", crop) + side, gap=14)


def states_phone_card() -> str:
    before = phone(
        phone_title(no_options_line(NO_VOLTAGE))
        + phone_select("Weather", "PVGIS TMY")
        + no_options_card(NO_VOLTAGE["no_options"], touch=True)
        + phone_assumptions()
    )
    running = phone(
        phone_title(run_line(DEMO), under=step_row("Updating energy", STEP_SHADING, 0.4, touch=True), dim_line=True)
        + f'<div style="display: flex; flex-direction: column; gap: 8px">{phone_select("Weather", "PVGIS TMY")}{phone_select("Option", A["title"], mark(True))}</div>'
        + panel(
            f'<div style="display: flex; flex-direction: column; gap: 2px"><div style="color: {TEXT_2}; font-size: 13px">Energy to grid, year 1</div>{lead_number(n1(E["energy_mwh"]), dim=True, ring_=True, size=56, line=60, unit_size=18)}</div>'
            + p_cells(E, dim=True, touch=True),
            "width: 358px",
            pad="18px 16px",
            gap=14,
        )
    )
    body = (
        '<div style="display: grid; grid-template-columns: 390px 390px minmax(0, 1fr); gap: 24px; align-items: start">'
        + state("Phone: before a system voltage", before)
        + state("Phone: a run on its way, the header and the lead tile", running)
        + notes(
            "Before a voltage on phone: the title and its line, the weather select alone (no option to choose from), the API's words in a card across the width with the button under them, 44 high, then the assumptions as rows.",
            "A run on its way: the step row under the title, 15 for the words; the two selects; the lead tile at 358 with the energy at 56 (the number-tile size on phone) dimmed, the ring of 16 beside it, the P cells dimmed. "
            "The tiles follow two to a row under it (the board “Performance, tablet and phone”).",
        )
        + "</div>"
    )
    return card("On phone", body, gap=14)


def states_board() -> str:
    width, height = 1440, STATES_HEIGHT
    body = '<div style="display: flex; flex-direction: column; gap: 16px">' + before_voltage_card() + first_load_card() + updating_card() + failed_card() + states_phone_card() + "</div>"
    return (
        HEAD.format(
            title="Performance, states",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Performance, states",
            lead="Before a system voltage, in the API's words, leading to the Strings lens; the first load with its skeletons; a run on its way, dimmed with the ring on the energy; a run failed, with the values of before and Try again; on phone.",
        )
        + body
        + FOOT.format(width=width, height=height)
    )


BOARDS = {
    "PerformanceLossChain.dc.html": loss_chain_board,
    "PerformanceCharts.dc.html": charts_board,
    "PerformanceWeather.dc.html": weather_board,
    "PerformanceStates.dc.html": states_board,
}


if __name__ == "__main__":
    for name, build in BOARDS.items():
        html = build()
        (HERE / name).write_text(html, encoding="utf-8")
    print(", ".join(BOARDS))
