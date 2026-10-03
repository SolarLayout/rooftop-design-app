"""Every export comes as bytes, for a server without a file system to write to."""

import io
import zipfile
from datetime import date

import pandas as pd
import pytest
from pypdf import PdfReader
from shapely.geometry import Polygon

from rooftop_core.bom import CableRow, bom, cable_schedule
from rooftop_core.export import files
from rooftop_core.io.roof_import import read_dxf, read_kmz
from rooftop_core.options import custom_option

pytestmark = pytest.mark.slow

WRITERS = [
    ("export_pdf", "export_pdf_bytes"),
    ("export_dxf", "export_dxf_bytes"),
    ("export_kmz", "export_kmz_bytes"),
    ("export_csv", "export_csv_bytes"),
    ("export_sld", "export_sld_bytes"),
]


def _pages(pdf: bytes) -> list[str]:
    return [page.extract_text() for page in PdfReader(io.BytesIO(pdf)).pages]


def _row(number: int) -> CableRow:
    return CableRow(f"S{number}", "INV-1", 1, 26, 1327.0, 14.3, 40.0, "4 mm² Cu, 1500 V DC")


@pytest.fixture
def design_with_40_strings(demo_design, monkeypatch):
    """The demo with a custom option of 40 short strings on two inverters, for this test only."""
    d = demo_design
    option = custom_option(d.pre, d.layout, d.module, d.mm, d.inverter, d.p.losses, d.p.roof, 14, 40, 2, "F")
    assert option.n_strings == 40
    monkeypatch.setattr(d, "options", [option])
    monkeypatch.setattr(d.p, "chosen_option", option.key)
    return d


@pytest.fixture
def design_at_1000_v(demo_design, monkeypatch):
    """The demo as it was run, with the system voltage of the project changed for the labels only."""
    monkeypatch.setattr(demo_design.p, "system_voltage", 1000.0)
    return demo_design


# ── bytes ────────────────────────────────────────────────────────────────────
def test_pdf_bytes_are_a_pdf_of_six_pages(demo_design):
    pdf = files.export_pdf_bytes(demo_design)

    assert pdf.startswith(b"%PDF-")
    assert len(_pages(pdf)) == 6


def test_sld_bytes_are_a_png(demo_design):
    assert files.export_sld_bytes(demo_design).startswith(b"\x89PNG\r\n\x1a\n")


def test_csv_bytes_hold_the_8760_hours(demo_design):
    table = pd.read_csv(io.BytesIO(files.export_csv_bytes(demo_design)))

    assert list(table.columns) == [
        "time_utc_hour_start",
        "ghi_w_m2",
        "poa_eff_w_m2",
        "t_cell_c",
        "p_dc_kw",
        "p_ac_kw",
    ]
    assert len(table) == 8760
    assert table["p_ac_kw"].sum() / 1000 == pytest.approx(demo_design.chosen.result.energy_mwh, abs=0.01)


def test_kmz_bytes_come_back_as_the_roof(demo_design):
    kmz = files.export_kmz_bytes(demo_design)

    assert zipfile.is_zipfile(io.BytesIO(kmz))
    roof = read_kmz(kmz)
    assert Polygon(roof.outline).area == pytest.approx(3600, abs=1)
    assert any(o.name == "Stair room" and o.height == 3.0 for o in roof.obstacles)


def test_kmz_bytes_come_back_without_the_modules_as_obstacles(demo_design):
    roof = read_kmz(files.export_kmz_bytes(demo_design))

    assert [o.name for o in roof.obstacles] == [o.name for o in demo_design.p.roof.obstacles]
    assert [o.height for o in roof.obstacles] == [o.height for o in demo_design.p.roof.obstacles]
    assert roof.missing_heights == []


def test_dxf_bytes_come_back_as_the_roof(demo_design):
    roof = read_dxf(files.export_dxf_bytes(demo_design), "m", 18.52, 73.86)

    assert Polygon(roof.outline).area == pytest.approx(3600, abs=1)


@pytest.mark.parametrize(("writer", "source"), WRITERS)
def test_the_path_form_writes_what_the_bytes_form_returns(writer, source, demo_design, tmp_path, monkeypatch):
    monkeypatch.setattr(files, source, lambda design, *given: b"the bytes of " + source.encode())
    path = tmp_path / "out.bin"

    getattr(files, writer)(demo_design, path)

    assert path.read_bytes() == b"the bytes of " + source.encode()


def test_the_path_form_of_the_pdf_passes_the_day_on(demo_design, tmp_path, monkeypatch):
    monkeypatch.setattr(files, "export_pdf_bytes", lambda design, day: f"the report of {day}".encode())

    files.export_pdf(demo_design, tmp_path / "out.pdf", day=date(2026, 10, 3))

    assert (tmp_path / "out.pdf").read_bytes() == b"the report of 2026-10-03"


# ── the day of the report ────────────────────────────────────────────────────
def test_the_pdf_prints_the_day_it_is_given(demo_design):
    page = _pages(files.export_pdf_bytes(demo_design, day=date(2025, 1, 31)))[0]

    assert "SolarLayout Rooftop · 31 Jan 2025" in page


def test_the_pdf_prints_today_without_a_day(demo_design):
    page = _pages(files.export_pdf_bytes(demo_design))[0]

    assert f"SolarLayout Rooftop · {date.today():%d %b %Y}" in page


@pytest.mark.parametrize(("writer", "source"), WRITERS)
def test_nothing_is_exported_before_an_option_is_chosen(writer, source, demo_design, monkeypatch):
    monkeypatch.setattr(demo_design, "options", [])

    with pytest.raises(ValueError, match="Generate the layout and choose a stringing option first."):
        getattr(files, source)(demo_design)


# ── the cable schedule in the PDF ────────────────────────────────────────────
def test_a_schedule_of_28_strings_fits_the_page_of_the_bill_of_materials():
    rows = [_row(n) for n in range(1, 29)]

    assert files.schedule_pages(rows) == [rows]


def test_a_longer_schedule_continues_on_pages_of_its_own():
    rows = [_row(n) for n in range(1, 111)]

    pages = files.schedule_pages(rows)

    assert [len(page) for page in pages] == [28, 40, 40, 2]
    assert [row for page in pages for row in page] == rows


def test_the_pdf_lists_every_string_of_a_design_with_more_than_28(design_with_40_strings):
    pages = _pages(files.export_pdf_bytes(design_with_40_strings))

    assert len(pages) == 7
    schedule = pages[4] + pages[5]
    listed = [line.split()[0] for line in schedule.splitlines() if line.startswith("S") and " INV-" in line]
    assert listed == [f"S{n}" for n in range(1, 41)]
    assert "String schedule, continued: S29 to S40" in pages[5]
    assert "PV module" in pages[4] and "PV module" not in pages[5]
    assert "Single-line diagram" in pages[6]


def test_the_pdf_of_the_demo_lists_its_22_strings_on_one_page(demo_design):
    pages = _pages(files.export_pdf_bytes(demo_design))

    listed = [line.split()[0] for line in pages[4].splitlines() if line.startswith("S") and " INV-" in line]
    assert listed == [f"S{n}" for n in range(1, 23)]


# ── the DC cable label ───────────────────────────────────────────────────────
@pytest.mark.parametrize("volts", [600.0, 1000.0, 1500.0])
def test_the_cable_schedule_names_the_system_voltage(demo_design, volts):
    d = demo_design

    rows = cable_schedule(d.layout, d.chosen.system, d.module, d.range.voc_cold, volts)

    assert {row.size for row in rows} == {f"4 mm² Cu, {volts:.0f} V DC"}


@pytest.mark.parametrize("volts", [600.0, 1000.0, 1500.0])
def test_the_bill_of_materials_names_the_system_voltage(demo_design, volts):
    d = demo_design

    lines = bom(d.layout, d.chosen.system, d.module, d.inverter, d.range.voc_cold, "Fixed tilt", 30.0, volts)

    cable = next(line for line in lines if line.item == "DC cable")
    assert cable.spec == f"4 mm² Cu, {volts:.0f} V DC, red + black"


def test_the_pdf_names_the_system_voltage_of_the_project(design_at_1000_v):
    page = _pages(files.export_pdf_bytes(design_at_1000_v))[4]

    assert "4 mm² Cu, 1000 V DC" in page
    assert "1500 V DC" not in page
