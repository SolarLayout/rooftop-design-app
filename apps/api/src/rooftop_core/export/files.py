# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Exports: PDF report, DXF layout, KMZ, hourly CSV, the SLD (decision 18), and the bill of materials and
the cable schedule as CSV (V2 · 9).

Every export comes in two forms: ``export_x_bytes(design)`` returns the file as
bytes, ``export_x(design, path)`` writes those bytes to a file.
"""

from __future__ import annotations

import csv
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
from ..geo import local_to_lonlat  # noqa: E402
from ..io.pvsyst import Inverter  # noqa: E402
from ..project import Design  # noqa: E402
from ..readouts import bill_of_materials, cables  # noqa: E402
from .report import A4_L, need_option, report_pages  # noqa: E402
from .report import schedule_pages as schedule_pages  # noqa: E402
from .summary import structure_label as structure_label  # noqa: E402
from .summary import summary_rows as summary_rows  # noqa: E402


def export_pdf(d: Design, path: str | Path, day: date | None = None) -> None:
    Path(path).write_bytes(export_pdf_bytes(d, day))


def export_pdf_bytes(d: Design, day: date | None = None) -> bytes:
    """The report: its pages (report.report_pages) saved one after the other. *day* is the day printed
    on page 1, the reader's; None prints today's."""
    out = io.BytesIO()
    with PdfPages(out) as pdf:
        for page in report_pages(d, day):
            fig = page.draw()
            pdf.savefig(fig)
            plt.close(fig)
    return out.getvalue()


def export_sld(d: Design, path: str | Path) -> None:
    Path(path).write_bytes(export_sld_bytes(d))


def export_sld_bytes(d: Design) -> bytes:
    """The single-line diagram as a PNG, A4 landscape at 200 dpi."""
    o = need_option(d)
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
    o = need_option(d)
    df = o.result.hourly.copy()
    df.index.name = "time_utc_hour_start"
    return df.round(3).to_csv(lineterminator="\n").encode("utf-8")


def _csv_bytes(head: list[str], rows: list[list[object]]) -> bytes:
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(head)
    writer.writerows(rows)
    return out.getvalue().encode("utf-8")


def export_bom_bytes(d: Design) -> bytes:
    """The bill of materials of the chosen option, one line an item, as Handover's table lists it."""
    o = need_option(d)
    lines = bill_of_materials(d, o)
    return _csv_bytes(["Item", "Specification", "Quantity", "Unit"], [[ln.item, ln.spec, f"{ln.qty:g}", ln.unit] for ln in lines])


def export_cables_bytes(d: Design) -> bytes:
    """The cable schedule of the chosen option, one row a string, as Handover's table lists it."""
    o = need_option(d)
    head = ["String", "Inverter", "MPPT", "Modules", "Voc cold (V)", "Isc (A)", "DC cable (m)", "Drop (%)", "Cable"]
    rows = [[r.string, r.inverter, r.mppt, r.modules, f"{r.voc_cold_v:.1f}", f"{r.isc_a:.2f}", f"{r.length_m:.1f}",
             f"{r.drop_pct:.2f}", r.size] for r in cables(d, o)]
    return _csv_bytes(head, rows)


def export_dxf(d: Design, path: str | Path) -> None:
    Path(path).write_bytes(export_dxf_bytes(d))


SYMBOL_M = (2.0, 1.2)  # the inverter's block where its file gives no size


def inverter_outline(inverter: Inverter) -> tuple[float, float, str]:
    """The inverter on plan, width by depth in metres, as its OND file gives them; else SYMBOL_M, and the words
    that say it is a symbol."""
    if inverter.width_m > 0 and inverter.depth_m > 0:
        return inverter.width_m, inverter.depth_m, ""
    return *SYMBOL_M, " (symbol, not to scale)"


def export_dxf_bytes(d: Design) -> bytes:
    import ezdxf

    o = need_option(d)
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
    width, depth, marked = inverter_outline(d.inverter)
    for i, (x, y) in enumerate(o.system.inverter_xy):
        w, h = width / 2, depth / 2
        poly([(x - w, y - h), (x + w, y - h), (x + w, y + h), (x - w, y + h)], "INVERTERS")
        msp.add_text(f"INV-{i + 1}{marked}", height=0.5, dxfattribs={"layer": "TEXT"}).set_placement((x, y + h + 0.2))
    text = io.StringIO()
    doc.write(text)
    return doc.encode(text.getvalue())


def export_kmz(d: Design, path: str | Path) -> None:
    Path(path).write_bytes(export_kmz_bytes(d))


def export_kmz_bytes(d: Design) -> bytes:
    o = need_option(d)
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
