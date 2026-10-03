"""The report, page by page: each page is drawn alone, so the PDF can save it and the screen can show it.

``report_pages(design, day)`` gives the pages in order, each with its number, its title and a ``draw``
that makes the figure. ``files.export_pdf_bytes`` saves them one after the other; ``page_png`` draws one
as a PNG.
"""

from __future__ import annotations

import io
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date

import matplotlib

matplotlib.use("Agg", force=False)
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.figure import Figure  # noqa: E402

from .. import plots  # noqa: E402
from ..bom import CableRow, bom, cable_schedule  # noqa: E402
from ..geometry import ROOF_TYPE_LABELS  # noqa: E402
from ..options import StringOption  # noqa: E402
from ..project import Design  # noqa: E402

A4_L = (11.69, 8.27)
SCHEDULE_ROWS_WITH_BOM = 28  # the first page of the schedule also holds the bill of materials
SCHEDULE_ROWS_PER_PAGE = 40  # a page with the schedule alone
SCHEDULE_WIDTHS = [0.07, 0.09, 0.07, 0.09, 0.14, 0.1, 0.12, 0.32]
SCHEDULE_HEADER = ["String", "Inverter", "MPPT", "Modules", "Voc cold, V", "Isc, A", "DC cable, m", "Cable"]
NOTE = "#6b4700"
YEARS_SHOWN = [1, 5, 10, 15, 20, 25]


@dataclass(frozen=True)
class Page:
    """One page of the report. ``draw`` makes its figure, A4 landscape; the caller closes it."""

    number: int
    title: str
    draw: Callable[[], Figure]


def need_option(d: Design) -> StringOption:
    """The option the design has chosen, without which nothing is exported."""
    o = d.chosen
    if d.layout is None or o is None:
        raise ValueError("Generate the layout and choose a stringing option first.")
    return o


def report_pages(d: Design, day: date | None = None) -> list[Page]:
    """The pages of the report in order. *day* is printed on page 1, the reader's; None prints today's."""
    o = need_option(d)
    schedule = schedule_pages(
        cable_schedule(d.layout, o.system, d.module, d.range.voc_cold, d.p.system_voltage)
    )
    first, *more = schedule
    draws: list[tuple[str, Callable[[], Figure]]] = [
        ("Summary", lambda: draw_summary(d, day)),
        ("Layout", lambda: draw_layout(d)),
        ("Shadows", lambda: draw_shadows(d)),
        ("Energy", lambda: draw_energy(d)),
        ("Schedule", lambda: draw_schedule_and_bom(d, first)),
        *(("Schedule (continued)", _continued(rows)) for rows in more),
        ("SLD", lambda: draw_sld(d)),
    ]
    return [Page(number, title, draw) for number, (title, draw) in enumerate(draws, 1)]


def _continued(rows: list[CableRow]) -> Callable[[], Figure]:
    return lambda: draw_schedule_continued(rows)


def page_png(page: Page, dpi: int) -> bytes:
    """One page as a PNG at *dpi*: A4 landscape, 11.69 × 8.27 inches, so 1753 × 1240 at 150 dpi."""
    fig = page.draw()
    out = io.BytesIO()
    fig.savefig(out, dpi=dpi, format="png")
    close(fig)
    return out.getvalue()


def close(fig: Figure) -> None:
    """Let go of a figure a page drew: matplotlib keeps every figure until it is closed."""
    plt.close(fig)


# ── the pages ────────────────────────────────────────────────────────────────
def draw_summary(d: Design, day: date | None) -> Figure:
    """Page 1: the name, the day, the table of the design, the note on the coefficients if any."""
    p = d.p
    fig = plt.figure(figsize=A4_L)
    fig.text(0.05, 0.93, f"{p.name} · rooftop PV design", fontsize=18, color=plots.TEXT, fontweight="bold")
    printed = day or date.today()
    fig.text(0.05, 0.895, f"SolarLayout Rooftop · {printed:%d %b %Y}", fontsize=9, color=plots.MUTED)
    ax = fig.add_axes([0.05, 0.08, 0.9, 0.78])
    _table(ax, summary_rows(d), [0.22, 0.78], fs=9)
    if d.coeffs.warning:
        fig.text(0.05, 0.04, "Note: " + d.coeffs.warning, fontsize=8, color=NOTE)
    return fig


def draw_layout(d: Design) -> Figure:
    """Page 2: the plan with the strings."""
    o = need_option(d)
    fig = plt.figure(figsize=A4_L)
    fig.text(0.05, 0.94, "Layout and strings", fontsize=14, color=plots.TEXT, fontweight="bold")
    ax = fig.add_axes([0.03, 0.05, 0.94, 0.86])
    plots.draw_plan(ax, d.p.roof, d.layout, o.system, fs=6)
    return fig


def draw_shadows(d: Design) -> Figure:
    """Page 3: the plan in shadow at the end of the window, and what shading costs."""
    o = need_option(d)
    r = o.result
    a = d.p.array
    fig = plt.figure(figsize=A4_L)
    fig.text(
        0.05,
        0.94,
        f"Shadows at {a.window_end_h:g}:00 solar time on the design day (window "
        f"{a.window_start_h:g}:00–{a.window_end_h:g}:00)",
        fontsize=14,
        color=plots.TEXT,
        fontweight="bold",
    )
    ax = fig.add_axes([0.03, 0.12, 0.94, 0.78])
    plots.draw_plan(ax, d.p.roof, d.layout, o.system, shadow_hour=a.window_end_h, dim=True, labels=False)
    lin = next(s for s in r.steps if s.label.startswith("Near shading")).pct
    ele = next(s for s in r.steps if s.label.startswith("Electrical")).pct
    far = next(s for s in r.steps if s.label.startswith("Far")).pct
    fig.text(
        0.05,
        0.06,
        f"Near shading, linear {lin:+.2f} % · electrical beyond linear {ele:+.2f} % · far "
        f"(horizon) {far:+.2f} % · keep-out left empty {d.layout.keepout_area_in_roof:,.0f} m²",
        fontsize=10,
        color=plots.TEXT,
    )
    return fig


def draw_energy(d: Design) -> Figure:
    """Page 4: the loss diagram, the monthly energy and the years' table."""
    r = need_option(d).result
    fig = plt.figure(figsize=A4_L)
    ax = fig.add_axes([0.04, 0.05, 0.46, 0.9])
    plots.draw_loss(ax, r.steps, fs=8)
    ax2 = fig.add_axes([0.58, 0.55, 0.38, 0.35])
    plots.draw_monthly(ax2, r.monthly_mwh)
    ax2.set_title("Monthly energy to grid", fontsize=10, color=plots.TEXT, loc="left")
    ax3 = fig.add_axes([0.56, 0.08, 0.40, 0.36])
    rows = (
        [[f"Year {y}", f"{r.years[y - 1]:,.1f}"] for y in YEARS_SHOWN]
        + [["25-year total", f"{sum(r.years):,.0f}"]]
        + [[f"P{k}", f"{v:,.1f}"] for k, v in r.p_values.items()]
    )
    _table(ax3, rows, [0.5, 0.5], fs=8.5, header=["Energy", "MWh"])
    return fig


def draw_schedule_and_bom(d: Design, rows: list[CableRow]) -> Figure:
    """Page 5: the first page of the string schedule, and the bill of materials under it."""
    o = need_option(d)
    p = d.p
    fig = plt.figure(figsize=A4_L)
    title = "String schedule and bill of materials"
    fig.text(0.05, 0.94, title, fontsize=14, color=plots.TEXT, fontweight="bold")
    _schedule_table(fig.add_axes([0.05, 0.40, 0.9, 0.5]), rows)
    ax = fig.add_axes([0.05, 0.03, 0.9, 0.33])
    b = bom(
        d.layout,
        o.system,
        d.module,
        d.inverter,
        d.range.voc_cold,
        structure_label(d),
        p.ac_cable_m,
        p.system_voltage,
    )
    _table(
        ax,
        [[x.item, x.spec, f"{x.qty:,.0f}", x.unit] for x in b],
        [0.2, 0.58, 0.1, 0.12],
        fs=8,
        header=["Item", "Specification", "Qty", "Unit"],
    )
    return fig


def draw_schedule_continued(rows: list[CableRow]) -> Figure:
    """A page of the string schedule alone, after the first."""
    fig = plt.figure(figsize=A4_L)
    fig.text(
        0.05,
        0.94,
        f"String schedule, continued: {rows[0].string} to {rows[-1].string}",
        fontsize=14,
        color=plots.TEXT,
        fontweight="bold",
    )
    _schedule_table(fig.add_axes([0.05, 0.05, 0.9, 0.85]), rows)
    return fig


def draw_sld(d: Design) -> Figure:
    """The last page: the single-line diagram, as export_sld_bytes draws it."""
    o = need_option(d)
    fig = plt.figure(figsize=A4_L)
    ax = fig.add_axes([0.03, 0.05, 0.94, 0.88])
    plots.draw_sld(
        ax,
        o.system,
        f"{d.module.pnom_w:g} Wp",
        f"{d.inverter.pnom_kw:g} kW · {d.inverter.n_mppt} MPPT",
        d.inverter.n_mppt,
    )
    return fig


# ── the words and the tables ─────────────────────────────────────────────────
def structure_label(d: Design) -> str:
    a, r = d.p.array, d.p.roof
    if r.roof_type == "flat_tilted":
        return (
            f"Fixed tilt {a.tilt_deg:g}°, {a.modules_in_tilt}{'P' if a.orientation == 'portrait' else 'L'}, "
            f"lower edge {a.clearance_m:g} m"
        )
    if r.roof_type == "flat_ew":
        return f"East-west {a.ew_tilt_deg:g}°, 1L back-to-back, ridge gap {a.ew_ridge_gap_m:g} m"
    return f"Flush rails at the roof pitch {r.slope_deg:g}°"


def summary_rows(d: Design) -> list[tuple[str, str]]:
    o = d.chosen
    r = o.result
    p = d.p
    m, inv = d.module, d.inverter
    module_area = o.n_modules * m.area_m2
    north_south = "N" if p.roof.lat >= 0 else "S"
    east_west = "E" if p.roof.lon >= 0 else "W"
    return [
        ("Site", f"{p.roof.lat:.5f}° {north_south}, {p.roof.lon:.5f}° {east_west}"),
        (
            "Roof",
            f"{ROOF_TYPE_LABELS[p.roof.roof_type]} · {p.roof.area_m2:,.0f} m² · "
            f"usable {d.layout.usable.area:,.0f} m²",
        ),
        ("Structure", structure_label(d)),
        ("Module", f"{m.manufacturer} {m.model} · {m.pnom_w:g} Wp"),
        ("Inverter", f"{inv.manufacturer} {inv.model} · {inv.pnom_kw:g} kW · {inv.n_mppt} MPPT"),
        ("Stringing", f"{o.n_series} in series × {o.n_strings} strings on {o.n_inverters} inverter(s)"),
        ("DC capacity", f"{r.dc_kwp:,.2f} kWp ({o.n_modules} modules)"),
        ("AC capacity", f"{r.ac_kw:,.0f} kW · DC/AC {o.dcac:.2f}"),
        (
            "Weather",
            f"{d.weather.label} · GHI {r.ghi_kwh_m2:,.1f} kWh/m² · in-plane {r.poa_kwh_m2:,.1f} kWh/m²",
        ),
        ("Energy, year 1", " · ".join(f"P{k} {v:,.1f} MWh" for k, v in r.p_values.items())),
        (
            "Specific yield",
            f"{r.specific_yield:,.0f} kWh/kWp · PR {r.pr * 100:.1f} % · CUF {r.cuf_ac_pct:.1f} % AC",
        ),
        ("Module area", f"{module_area:,.0f} m² · {module_area / p.roof.area_m2 * 100:.1f} % of the roof"),
        ("CO₂ avoided", f"{r.co2_t:,.1f} t/yr at {p.losses.co2_t_per_mwh:g} t/MWh"),
    ]


def schedule_pages(rows: list[CableRow]) -> list[list[CableRow]]:
    """The cable schedule cut into pages: the first shares its page with the bill of materials."""
    pages = [rows[:SCHEDULE_ROWS_WITH_BOM]]
    rest = rows[SCHEDULE_ROWS_WITH_BOM:]
    pages += [rest[i : i + SCHEDULE_ROWS_PER_PAGE] for i in range(0, len(rest), SCHEDULE_ROWS_PER_PAGE)]
    return pages


def _table(ax, rows, col_widths, fs=8, header=None):
    ax.axis("off")
    data = ([header] if header else []) + [list(map(str, r)) for r in rows]
    t = ax.table(cellText=data, colWidths=col_widths, loc="upper left", cellLoc="left")
    t.auto_set_font_size(False)
    t.set_fontsize(fs)
    for (i, _j), cell in t.get_celld().items():
        cell.set_edgecolor("#dfe4ea")
        cell.set_height(0.055 if len(data) < 16 else 0.9 / max(len(data), 1))
        if header and i == 0:
            cell.set_facecolor("#e5eef8")
            cell.set_text_props(fontweight="bold", color=plots.TEXT)
        else:
            cell.set_text_props(color=plots.TEXT)
    return t


def _schedule_cells(c: CableRow) -> list[object]:
    voc, isc, length = f"{c.voc_cold_v:,.0f}", f"{c.isc_a:.2f}", f"{c.length_m:,.1f}"
    return [c.string, c.inverter, c.mppt, c.modules, voc, isc, length, c.size]


def _schedule_table(ax, rows: list[CableRow]) -> None:
    cells = [_schedule_cells(c) for c in rows]
    _table(ax, cells, SCHEDULE_WIDTHS, fs=7, header=SCHEDULE_HEADER)
