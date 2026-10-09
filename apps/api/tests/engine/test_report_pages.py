"""The report page by page: each page drawn alone, as the PDF saves it and as a PNG for the screen.

The guard of the cut: the words of every page of the PDF, as it was before the pages were cut out
of export_pdf_bytes (recorded from the code of main on 2026-10-03 for the demo and the 40-string
design), are still on the same pages.
"""

import io
from dataclasses import FrozenInstanceError
from datetime import date

import pytest
from matplotlib.figure import Figure
from pypdf import PdfReader

from rooftop_core.export import files, report
from rooftop_core.options import custom_option

pytestmark = pytest.mark.slow

DAY = date(2026, 10, 3)
PNG = b"\x89PNG\r\n\x1a\n"
TITLES = ["Summary", "Layout", "Shadows", "Energy", "Schedule", "SLD"]

# The demo's PDF before the cut, page by page: the words that matter, every one a line of the text
# pypdf reads from the page.
DEMO_PAGE_1_TABLE = [
    "Site 18.52000° N, 73.86000° E",
    "Roof Flat · tilted rows · 3,600 m² · usable 3,184 m²",
    "Structure Fixed tilt 15°, 2P, lower edge 0.5 m",
    "Module INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560 · 560 Wp",
    "Inverter WattPower Systems Pvt.Ltd WP-330KTL-H1 · 275 kW · 6 MPPT",
    "Stringing 29 in series × 22 strings on 1 inverter(s)",
    "DC capacity 357.28 kWp (638 modules)",
    "AC capacity 275 kW · DC/AC 1.30",
    "Weather PVGIS TMY · GHI 1,822.9 kWh/m² · in-plane 1,998.0 kWh/m²",
    "Energy, year 1 P50 617.8 MWh · P75 600.2 MWh · P90 584.2 MWh",
    "Specific yield 1,729 kWh/kWp · PR 86.6 % · CUF 25.6 % AC",
    "Module area 1,646 m² · 45.7 % of the roof",
    "CO₂ avoided 442.4 t/yr at 0.716 t/MWh",
]
DEMO_PAGE_1_HEAD = [
    "Pune demo roof · rooftop PV design",
    "SolarLayout Rooftop · 03 Oct 2026",
    "Note: Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon. "
    "Check the datasheet and enter it if it differs.",
]
DEMO_PAGE_2 = [
    "Layout and strings",
    "INV-1",
    "Stair room · h 3 m",
    "Water tank · h 2 m",
    "AC unit 1–4 · h 1.2 m",
]
DEMO_PAGE_3 = [
    "Shadows at 16:00 solar time on the design day (window 9:00–16:00)",
    "Near shading, linear -0.33 % · electrical beyond linear -0.56 % · far (horizon) -0.04 % · "
    "keep-out left empty 150 m²",
]
DEMO_PAGE_4 = [
    "Loss diagram · year 1",
    "Global horizontal irradiation 1,822.9 kWh/m²",
    "Array nominal energy at STC 706.4 MWh",
    "Energy to grid 617.8 MWh",
    "Monthly energy to grid",
    "Energy MWh",
    "Year 1 617.8",
    "Year 5 605.6",
    "Year 10 590.6",
    "Year 15 576.0",
    "Year 20 561.7",
    "Year 25 547.8",
    "25-year total 14,554",
    "P50 617.8",
    "P75 600.2",
    "P90 584.2",
]
# (string, MPPT, DC cable m, drop %) of the demo's 22 strings; each is a line of the schedule such as
# "S1 INV-1 1 29 1,480 14.30 131.9 0.91 4 mm² Cu, 1500 V DC"
DEMO_STRINGS = [
    (1, 1, "131.9", "0.91"), (2, 1, "97.3", "0.67"), (3, 1, "85.2", "0.59"), (4, 1, "119.8", "0.83"),
    (5, 2, "119.0", "0.82"), (6, 2, "84.4", "0.58"), (7, 2, "72.3", "0.50"), (8, 2, "106.9", "0.74"),
    (9, 3, "47.9", "0.33"), (10, 3, "82.5", "0.57"), (11, 3, "118.2", "0.82"), (12, 3, "93.2", "0.64"),
    (13, 4, "41.9", "0.29"), (14, 4, "76.5", "0.53"), (15, 4, "80.3", "0.56"), (16, 4, "45.7", "0.32"),
    (17, 5, "33.6", "0.23"), (18, 5, "68.2", "0.47"), (19, 5, "67.4", "0.47"),
    (20, 6, "32.8", "0.23"), (21, 6, "20.7", "0.14"), (22, 6, "55.3", "0.38"),
]  # fmt: skip
DEMO_PAGE_5 = [
    "String schedule and bill of materials",
    "String Inverter MPPT Modules Voc cold, V Isc, A DC cable, m Drop, % Cable",
    *(
        f"S{n} INV-1 {mppt} 29 1,480 14.30 {length} {drop} 4 mm² Cu, 1500 V DC"
        for n, mppt, length, drop in DEMO_STRINGS
    ),
    "Item Specification Qty Unit",
    "PV module INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80 638 pcs",
    "String inverter WattPower Systems Pvt.Ltd WP-330KTL-H1, 275 kW, 6 MPPT 1 pcs",
    "Mounting structure Fixed tilt 15°, 2P, lower edge 0.5 m 27 tables",
    "DC cable 4 mm² Cu, 1500 V DC, red + black 1,681 m",
    "DC connector pair MC4-compatible, matched to the module 44 pairs",
    "AC cable Inverter to ACDB, sized for 240 A at 800 V AC 30 m",
    "AC distribution board 1 incomer(s), 1 outgoing 1 pcs",
]
DEMO_PAGE_6 = [
    "Single-line diagram · 22 strings of 29 × 560 Wp",
    "INV-1",
    "275 kW · 6 MPPT",
    *(f"MPPT {n} · DC" for n in range(1, 7)),
    "AC",
    "ACDB",
    "Net meter",
    "kWh",
    "Grid /",
    "LT panel",
]
DEMO_PAGES = [
    DEMO_PAGE_1_TABLE + DEMO_PAGE_1_HEAD,
    DEMO_PAGE_2,
    DEMO_PAGE_3,
    DEMO_PAGE_4,
    DEMO_PAGE_5,
    DEMO_PAGE_6,
]
# The 40-string design's PDF before the cut: seven pages, the schedule continued on the sixth.
FORTY_PAGE_1 = [
    "Stringing 14 in series × 40 strings on 2 inverter(s)",
    "DC capacity 313.60 kWp (560 modules)",
    "Pune demo roof · rooftop PV design",
    "SolarLayout Rooftop · 03 Oct 2026",
]
FORTY_PAGE_5_ENDS = [
    "String schedule and bill of materials",
    "S1 INV-1 1 14 715 14.30 80.1 0.76 6 mm² Cu, 1500 V DC",
    "S28 INV-2 2 14 715 14.30 53.6 0.77 4 mm² Cu, 1500 V DC",
    "PV module INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80 560 pcs",
    "String inverter WattPower Systems Pvt.Ltd WP-330KTL-H1, 275 kW, 6 MPPT 2 pcs",
    "DC cable 4 mm² Cu, 1500 V DC, red + black 1,044 m",
    "DC cable 6 mm² Cu, 1500 V DC, red + black 1,211 m",
    "DC cable 10 mm² Cu, 1500 V DC, red + black 228 m",
    "AC distribution board 2 incomer(s), 1 outgoing 1 pcs",
]
FORTY_PAGE_6_ENDS = [
    "String schedule, continued: S29 to S40",
    "String Inverter MPPT Modules Voc cold, V Isc, A DC cable, m Drop, % Cable",
    "S29 INV-2 3 14 715 14.30 36.3 0.52 4 mm² Cu, 1500 V DC",
    "S40 INV-2 6 14 715 14.30 76.2 0.73 6 mm² Cu, 1500 V DC",
]
FORTY_PAGE_7 = ["Single-line diagram · 40 strings of 14 × 560 Wp", "INV-1", "INV-2"]


def _pages(pdf: bytes) -> list[str]:
    return [page.extract_text() for page in PdfReader(io.BytesIO(pdf)).pages]


def _lines(text: str) -> list[str]:
    return text.splitlines()


def _strings_listed(text: str) -> list[str]:
    return [line.split()[0] for line in _lines(text) if line.startswith("S") and " INV-" in line]


def _png_size(png: bytes) -> tuple[int, int]:
    assert png.startswith(PNG)
    return tuple(int.from_bytes(png[at : at + 4], "big") for at in (16, 20))


@pytest.fixture
def design_with_40_strings(demo_design, monkeypatch):
    """The demo with a custom option of 40 short strings on two inverters, for this test only."""
    d = demo_design
    option = custom_option(d.pre, d.layout, d.module, d.mm, d.inverter, d.p.losses, d.p.roof, 14, 40, 2, "F")
    assert option.n_strings == 40
    monkeypatch.setattr(d, "options", [option])
    monkeypatch.setattr(d.p, "chosen_option", option.key)
    return d


@pytest.fixture(scope="module")
def demo_pages(demo_design) -> list[report.Page]:
    return report.report_pages(demo_design, DAY)


@pytest.fixture(scope="module")
def demo_pdf(demo_design) -> bytes:
    return files.export_pdf_bytes(demo_design, DAY)


@pytest.fixture(scope="module")
def demo_pdf_texts(demo_pdf) -> list[str]:
    return _pages(demo_pdf)


# ── the pages ────────────────────────────────────────────────────────────────
def test_the_demo_has_six_pages_with_the_titles_of_the_board(demo_pages):
    assert [page.title for page in demo_pages] == TITLES
    assert [page.number for page in demo_pages] == [1, 2, 3, 4, 5, 6]


def test_a_long_schedule_continues_on_a_page_of_its_own(design_with_40_strings):
    pages = report.report_pages(design_with_40_strings, DAY)

    assert [page.title for page in pages] == TITLES[:5] + ["Schedule (continued)", "SLD"]
    assert [page.number for page in pages] == [1, 2, 3, 4, 5, 6, 7]


def test_a_page_is_not_changed_after_it_is_made(demo_pages):
    with pytest.raises(FrozenInstanceError):
        demo_pages[0].title = "Something else"


def test_each_page_draws_a_figure_of_a4_landscape(demo_pages):
    for page in demo_pages:
        figure = page.draw()
        assert isinstance(figure, Figure), page.title
        assert tuple(figure.get_size_inches()) == pytest.approx((11.69, 8.27)), page.title
        report.close(figure)


def test_no_page_is_drawn_before_an_option_is_chosen(demo_design, monkeypatch):
    monkeypatch.setattr(demo_design, "options", [])

    with pytest.raises(ValueError, match="Generate the layout and choose a stringing option first."):
        report.report_pages(demo_design, DAY)


# ── the pages as PNGs ────────────────────────────────────────────────────────
def test_every_page_at_150_dpi_is_a_png_of_1753_by_1240(demo_pages):
    # A4 landscape, 11.69 × 8.27 inches, at 150 dpi: 1753.5 × 1240.5 points, which matplotlib rounds down.
    for page in demo_pages:
        assert _png_size(report.page_png(page, 150)) == (1753, 1240), page.title


def test_the_dpi_sets_the_size_of_the_png(demo_pages):
    assert _png_size(report.page_png(demo_pages[5], 72)) == (841, 595)


def test_the_first_page_bears_the_day_it_is_drawn_for(demo_design):
    one_day = report.report_pages(demo_design, date(2025, 1, 31))[0]
    another = report.report_pages(demo_design, date(2026, 10, 3))[0]

    assert report.page_png(one_day, 72) != report.page_png(another, 72)


def test_the_first_page_without_a_day_is_the_pdf_of_today(demo_design):
    pdf = io.BytesIO()
    page = report.report_pages(demo_design)[0]
    figure = page.draw()
    figure.savefig(pdf, format="pdf")
    report.close(figure)

    assert f"SolarLayout Rooftop · {date.today():%d %b %Y}" in _pages(pdf.getvalue())[0]


# ── the guard of the cut: the PDF is the pages, and the pages say what the PDF said ──────────────
def test_the_pdf_is_the_pages_saved_one_by_one(demo_pages, demo_pdf_texts):
    from matplotlib.backends.backend_pdf import PdfPages

    out = io.BytesIO()
    with PdfPages(out) as pdf:
        for page in demo_pages:
            figure = page.draw()
            pdf.savefig(figure)
            report.close(figure)

    assert _pages(out.getvalue()) == demo_pdf_texts


@pytest.mark.parametrize("number", [1, 2, 3, 4, 5, 6])
def test_every_page_of_the_demo_says_what_it_said_before_the_cut(demo_pdf_texts, number):
    lines = _lines(demo_pdf_texts[number - 1])

    for line in DEMO_PAGES[number - 1]:
        assert line in lines, f"page {number} has lost the line {line!r}"


def test_the_first_page_of_the_demo_is_its_table_in_order(demo_pdf_texts):
    assert _lines(demo_pdf_texts[0])[:13] == DEMO_PAGE_1_TABLE


def test_the_fifth_page_of_the_demo_lists_the_22_strings_in_order(demo_pdf_texts):
    assert _strings_listed(demo_pdf_texts[4]) == [f"S{n}" for n in range(1, 23)]


def test_the_pages_of_the_40_string_design_say_what_they_said_before_the_cut(design_with_40_strings):
    texts = _pages(files.export_pdf_bytes(design_with_40_strings, DAY))

    assert len(texts) == 7
    recorded = {1: FORTY_PAGE_1, 5: FORTY_PAGE_5_ENDS, 6: FORTY_PAGE_6_ENDS, 7: FORTY_PAGE_7}
    for number, lines in recorded.items():
        for line in lines:
            assert line in _lines(texts[number - 1]), f"page {number} has lost the line {line!r}"
    assert "Layout and strings" in _lines(texts[1])
    assert _strings_listed(texts[4]) + _strings_listed(texts[5]) == [f"S{n}" for n in range(1, 41)]
    assert "PV module" not in texts[5]
