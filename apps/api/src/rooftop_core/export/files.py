# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Exports: PDF report, DXF layout, KMZ, hourly CSV and the SLD (decision 18).

Every export comes in two forms: ``export_x_bytes(design)`` returns the file as
bytes, ``export_x(design, path)`` writes those bytes to a file.
"""

from __future__ import annotations

import io
import zipfile
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

import matplotlib

matplotlib.use("Agg", force=False)
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.backends.backend_pdf import PdfPages  # noqa: E402

from .. import plots  # noqa: E402
from ..bom import CableRow, bom, cable_schedule  # noqa: E402
from ..geo import local_to_lonlat  # noqa: E402
from ..geometry import ROOF_TYPE_LABELS  # noqa: E402
from ..project import Design  # noqa: E402

A4_L = (11.69, 8.27)
SCHEDULE_ROWS_WITH_BOM = 28      # the first page of the schedule also holds the bill of materials
SCHEDULE_ROWS_PER_PAGE = 40      # a page with the schedule alone
SCHEDULE_WIDTHS = [0.07, 0.09, 0.07, 0.09, 0.14, 0.1, 0.12, 0.32]
SCHEDULE_HEADER = ["String", "Inverter", "MPPT", "Modules", "Voc cold, V", "Isc, A", "DC cable, m", "Cable"]


def _need(d: Design):
    o = d.chosen
    if d.layout is None or o is None:
        raise ValueError("Generate the layout and choose a stringing option first.")
    return o


def structure_label(d: Design) -> str:
    a, r = d.p.array, d.p.roof
    if r.roof_type == "flat_tilted":
        return f"Fixed tilt {a.tilt_deg:g}°, {a.modules_in_tilt}{'P' if a.orientation == 'portrait' else 'L'}, lower edge {a.clearance_m:g} m"
    if r.roof_type == "flat_ew":
        return f"East-west {a.ew_tilt_deg:g}°, 1L back-to-back, ridge gap {a.ew_ridge_gap_m:g} m"
    return f"Flush rails at the roof pitch {r.slope_deg:g}°"


def summary_rows(d: Design) -> list[tuple[str, str]]:
    o = d.chosen
    r = o.result
    p = d.p
    rows = [
        ("Site", f"{p.roof.lat:.5f}° {'N' if p.roof.lat >= 0 else 'S'}, {p.roof.lon:.5f}° {'E' if p.roof.lon >= 0 else 'W'}"),
        ("Roof", f"{ROOF_TYPE_LABELS[p.roof.roof_type]} · {p.roof.area_m2:,.0f} m² · usable {d.layout.usable.area:,.0f} m²"),
        ("Structure", structure_label(d)),
        ("Module", f"{d.module.manufacturer} {d.module.model} · {d.module.pnom_w:g} Wp"),
        ("Inverter", f"{d.inverter.manufacturer} {d.inverter.model} · {d.inverter.pnom_kw:g} kW · {d.inverter.n_mppt} MPPT"),
        ("Stringing", f"{o.n_series} in series × {o.n_strings} strings on {o.n_inverters} inverter(s)"),
        ("DC capacity", f"{r.dc_kwp:,.2f} kWp ({o.n_modules} modules)"),
        ("AC capacity", f"{r.ac_kw:,.0f} kW · DC/AC {o.dcac:.2f}"),
        ("Weather", f"{d.weather.label} · GHI {r.ghi_kwh_m2:,.1f} kWh/m² · in-plane {r.poa_kwh_m2:,.1f} kWh/m²"),
        ("Energy, year 1", " · ".join(f"P{k} {v:,.1f} MWh" for k, v in r.p_values.items())),
        ("Specific yield", f"{r.specific_yield:,.0f} kWh/kWp · PR {r.pr * 100:.1f} % · CUF {r.cuf_ac_pct:.1f} % AC"),
        ("Module area", f"{o.n_modules * d.module.area_m2:,.0f} m² · {o.n_modules * d.module.area_m2 / p.roof.area_m2 * 100:.1f} % of the roof"),
        ("CO₂ avoided", f"{r.co2_t:,.1f} t/yr at {p.losses.co2_t_per_mwh:g} t/MWh"),
    ]
    return rows


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


def schedule_pages(rows: list[CableRow]) -> list[list[CableRow]]:
    """The cable schedule cut into pages: the first shares its page with the bill of materials."""
    pages = [rows[:SCHEDULE_ROWS_WITH_BOM]]
    rest = rows[SCHEDULE_ROWS_WITH_BOM:]
    pages += [rest[i:i + SCHEDULE_ROWS_PER_PAGE] for i in range(0, len(rest), SCHEDULE_ROWS_PER_PAGE)]
    return pages


def _schedule_table(ax, rows: list[CableRow]) -> None:
    cells = [[c.string, c.inverter, c.mppt, c.modules, f"{c.voc_cold_v:,.0f}", f"{c.isc_a:.2f}", f"{c.length_m:,.1f}", c.size]
             for c in rows]
    _table(ax, cells, SCHEDULE_WIDTHS, fs=7, header=SCHEDULE_HEADER)


def _schedule_continued(pdf: PdfPages, rows: list[CableRow]) -> None:
    fig = plt.figure(figsize=A4_L)
    fig.text(0.05, 0.94, f"String schedule, continued: {rows[0].string} to {rows[-1].string}", fontsize=14,
             color=plots.TEXT, fontweight="bold")
    _schedule_table(fig.add_axes([0.05, 0.05, 0.9, 0.85]), rows)
    pdf.savefig(fig)
    plt.close(fig)


def export_pdf(d: Design, path: str | Path, day: date | None = None) -> None:
    Path(path).write_bytes(export_pdf_bytes(d, day))


def export_pdf_bytes(d: Design, day: date | None = None) -> bytes:
    """The report. *day* is the day printed on page 1, the reader's; None prints today's."""
    o = _need(d)
    r = o.result
    p = d.p
    out = io.BytesIO()
    with PdfPages(out) as pdf:
        # 1 · summary
        fig = plt.figure(figsize=A4_L)
        fig.text(0.05, 0.93, f"{p.name} · rooftop PV design", fontsize=18, color=plots.TEXT, fontweight="bold")
        fig.text(0.05, 0.895, f"SolarLayout Rooftop · {day or date.today():%d %b %Y}", fontsize=9, color=plots.MUTED)
        ax = fig.add_axes([0.05, 0.08, 0.9, 0.78])
        _table(ax, summary_rows(d), [0.22, 0.78], fs=9)
        if d.coeffs.warning:
            fig.text(0.05, 0.04, "Note: " + d.coeffs.warning, fontsize=8, color="#6b4700")
        pdf.savefig(fig)
        plt.close(fig)
        # 2 · layout
        fig = plt.figure(figsize=A4_L)
        fig.text(0.05, 0.94, "Layout and strings", fontsize=14, color=plots.TEXT, fontweight="bold")
        ax = fig.add_axes([0.03, 0.05, 0.94, 0.86])
        plots.draw_plan(ax, p.roof, d.layout, o.system, fs=6)
        pdf.savefig(fig)
        plt.close(fig)
        # 3 · shading
        fig = plt.figure(figsize=A4_L)
        a = p.array
        fig.text(0.05, 0.94, f"Shadows at {a.window_end_h:g}:00 solar time on the design day (window "
                 f"{a.window_start_h:g}:00–{a.window_end_h:g}:00)", fontsize=14, color=plots.TEXT, fontweight="bold")
        ax = fig.add_axes([0.03, 0.12, 0.94, 0.78])
        plots.draw_plan(ax, p.roof, d.layout, o.system, shadow_hour=a.window_end_h, dim=True, labels=False)
        lin = next(s for s in r.steps if s.label.startswith("Near shading")).pct
        ele = next(s for s in r.steps if s.label.startswith("Electrical")).pct
        far = next(s for s in r.steps if s.label.startswith("Far")).pct
        fig.text(0.05, 0.06, f"Near shading, linear {lin:+.2f} % · electrical beyond linear {ele:+.2f} % · far "
                 f"(horizon) {far:+.2f} % · keep-out left empty {d.layout.keepout_area_in_roof:,.0f} m²",
                 fontsize=10, color=plots.TEXT)
        pdf.savefig(fig)
        plt.close(fig)
        # 4 · losses + monthly
        fig = plt.figure(figsize=A4_L)
        ax = fig.add_axes([0.04, 0.05, 0.46, 0.9])
        plots.draw_loss(ax, r.steps, fs=8)
        ax2 = fig.add_axes([0.58, 0.55, 0.38, 0.35])
        plots.draw_monthly(ax2, r.monthly_mwh)
        ax2.set_title("Monthly energy to grid", fontsize=10, color=plots.TEXT, loc="left")
        ax3 = fig.add_axes([0.56, 0.08, 0.40, 0.36])
        yrs = [1, 5, 10, 15, 20, 25]
        _table(ax3, [[f"Year {y}", f"{r.years[y - 1]:,.1f}"] for y in yrs] +
               [["25-year total", f"{sum(r.years):,.0f}"]] +
               [[f"P{k}", f"{v:,.1f}"] for k, v in r.p_values.items()],
               [0.5, 0.5], fs=8.5, header=["Energy", "MWh"])
        pdf.savefig(fig)
        plt.close(fig)
        # 5 · strings + BOM
        fig = plt.figure(figsize=A4_L)
        fig.text(0.05, 0.94, "String schedule and bill of materials", fontsize=14, color=plots.TEXT, fontweight="bold")
        first, *more = schedule_pages(cable_schedule(d.layout, o.system, d.module, d.range.voc_cold, p.system_voltage))
        _schedule_table(fig.add_axes([0.05, 0.40, 0.9, 0.5]), first)
        ax = fig.add_axes([0.05, 0.03, 0.9, 0.33])
        b = bom(d.layout, o.system, d.module, d.inverter, d.range.voc_cold, structure_label(d), p.ac_cable_m,
                p.system_voltage)
        _table(ax, [[x.item, x.spec, f"{x.qty:,.0f}", x.unit] for x in b], [0.2, 0.58, 0.1, 0.12], fs=8,
               header=["Item", "Specification", "Qty", "Unit"])
        pdf.savefig(fig)
        plt.close(fig)
        for rows in more:
            _schedule_continued(pdf, rows)
        # 6 · SLD
        fig = plt.figure(figsize=A4_L)
        ax = fig.add_axes([0.03, 0.05, 0.94, 0.88])
        plots.draw_sld(ax, o.system, f"{d.module.pnom_w:g} Wp", f"{d.inverter.pnom_kw:g} kW · {d.inverter.n_mppt} MPPT",
                       d.inverter.n_mppt)
        pdf.savefig(fig)
        plt.close(fig)
    return out.getvalue()


def export_sld(d: Design, path: str | Path) -> None:
    Path(path).write_bytes(export_sld_bytes(d))


def export_sld_bytes(d: Design) -> bytes:
    """The single-line diagram as a PNG, A4 landscape at 200 dpi."""
    o = _need(d)
    fig = plt.figure(figsize=A4_L)
    ax = fig.add_axes([0.03, 0.05, 0.94, 0.88])
    plots.draw_sld(ax, o.system, f"{d.module.pnom_w:g} Wp", f"{d.inverter.pnom_kw:g} kW · {d.inverter.n_mppt} MPPT",
                   d.inverter.n_mppt)
    out = io.BytesIO()
    fig.savefig(out, dpi=200, format="png")
    plt.close(fig)
    return out.getvalue()


def export_csv(d: Design, path: str | Path) -> None:
    Path(path).write_bytes(export_csv_bytes(d))


def export_csv_bytes(d: Design) -> bytes:
    o = _need(d)
    df = o.result.hourly.copy()
    df.index.name = "time_utc_hour_start"
    return df.round(3).to_csv(lineterminator="\n").encode("utf-8")


def export_dxf(d: Design, path: str | Path) -> None:
    Path(path).write_bytes(export_dxf_bytes(d))


def export_dxf_bytes(d: Design) -> bytes:
    import ezdxf

    o = _need(d)
    doc = ezdxf.new("R2010", setup=True)
    doc.units = ezdxf.units.M
    msp = doc.modelspace()
    for name, color in (("ROOF", 7), ("SETBACK", 8), ("OBSTACLES", 1), ("KEEPOUT", 30), ("MODULES_UNUSED", 9),
                        ("INVERTERS", 40), ("TEXT", 7)):
        doc.layers.add(name, color=color)

    def poly(pts, layer):
        msp.add_lwpolyline([(float(x), float(y)) for x, y in pts], close=True, dxfattribs={"layer": layer})

    roof = d.p.roof
    poly(list(roof.polygon.exterior.coords)[:-1], "ROOF")
    inner = roof.inner()
    if not inner.is_empty:
        poly(list(inner.exterior.coords)[:-1], "SETBACK")
    for ob in roof.obstacles:
        fp = ob.footprint()
        poly(list(fp.exterior.coords)[:-1], "OBSTACLES")
        c = fp.centroid
        msp.add_text(f"{ob.name} h={ob.height:g}", height=0.4, dxfattribs={"layer": "TEXT"}).set_placement((c.x, c.y))
    for g in plots._polys(d.layout.keepout.intersection(roof.polygon)):
        poly(list(g.exterior.coords)[:-1], "KEEPOUT")
    used = {}
    for s, st in enumerate(o.system.strings):
        layer = f"STRING_S{s + 1:02d}"
        doc.layers.add(layer, color=(s % 6) + 2)
        for i in st.modules:
            used[i] = layer
    for m in d.layout.modules:
        poly(list(m.poly.exterior.coords)[:-1], used.get(m.idx, "MODULES_UNUSED"))
    for i, (x, y) in enumerate(o.system.inverter_xy):
        poly([(x - 1, y - 0.6), (x + 1, y - 0.6), (x + 1, y + 0.6), (x - 1, y + 0.6)], "INVERTERS")
        msp.add_text(f"INV-{i + 1}", height=0.5, dxfattribs={"layer": "TEXT"}).set_placement((x, y + 0.8))
    text = io.StringIO()
    doc.write(text)
    return doc.encode(text.getvalue())


def export_kmz(d: Design, path: str | Path) -> None:
    Path(path).write_bytes(export_kmz_bytes(d))


def export_kmz_bytes(d: Design) -> bytes:
    o = _need(d)
    roof = d.p.roof
    c = roof.polygon.centroid

    def ll(pts):
        return " ".join(f"{lo:.8f},{la:.8f},0" for lo, la in local_to_lonlat(list(pts), roof.lat, roof.lon, c.x, c.y))

    def pm(name, pts, style):
        return (f"<Placemark><name>{escape(name)}</name><styleUrl>#{style}</styleUrl><Polygon><outerBoundaryIs>"
                f"<LinearRing><coordinates>{ll(pts)}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>")

    parts = [pm("Roof", roof.polygon.exterior.coords, "roof")]
    for ob in roof.obstacles:
        parts.append(pm(f"{ob.name} h={ob.height:g}", ob.footprint().exterior.coords, "obst"))
    used = {i for st in o.system.strings for i in st.modules}
    mods = [pm(f"Module {m.idx + 1}", m.poly.exterior.coords, "mod") for m in d.layout.modules if m.idx in used]
    styles = ("<Style id='roof'><LineStyle><color>ff5c6773</color><width>2</width></LineStyle><PolyStyle>"
              "<color>40f2f4f3</color></PolyStyle></Style><Style id='obst'><PolyStyle><color>cc6d6156</color>"
              "</PolyStyle></Style><Style id='mod'><LineStyle><color>ffffffff</color><width>0.5</width></LineStyle>"
              "<PolyStyle><color>ffa55f18</color></PolyStyle></Style>")
    kml = ("<?xml version='1.0' encoding='UTF-8'?><kml xmlns='http://www.opengis.net/kml/2.2'><Document>"
           f"<name>{escape(d.p.name)}</name>{styles}<Folder><name>Roof</name>{''.join(parts)}</Folder>"
           f"<Folder><name>Modules ({len(mods)})</name>{''.join(mods)}</Folder></Document></kml>")
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("doc.kml", kml)
    return out.getvalue()
