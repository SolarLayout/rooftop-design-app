"""POST /export/{kind}: the files of a design, as the desktop app wrote them, and the project file."""

import base64
import io
import json
import zipfile
from datetime import date

import ezdxf
import pandas as pd
import pytest
from pypdf import PdfReader

from rooftop_api import convert, schemas
from rooftop_api.services import design as design_service
from rooftop_core.project import Project
from tests.api.conftest import error_of
from tests.api.events import result_of

pytestmark = pytest.mark.slow

PNG = b"\x89PNG\r\n\x1a\n"
# The files of the design: each needs the option the project has chosen.
OF_THE_DESIGN = {
    "pdf": ("application/pdf", "Pune-demo-report.pdf"),
    "dxf": ("image/vnd.dxf", "Pune-demo-layout.dxf"),
    "kmz": ("application/vnd.google-earth.kmz", "Pune-demo.kmz"),
    "csv": ("text/csv; charset=utf-8", "Pune-demo-hourly.csv"),
    "sld": ("image/png", "Pune-demo-single-line-diagram.png"),
    "zip": ("application/zip", "Pune-demo.zip"),
}
# The project file is of the request alone.
KINDS = {**OF_THE_DESIGN, "rtd": ("application/json", "Pune-demo.rtd")}
# What the zip holds, in its order: the five files of the design and the project file.
IN_THE_ZIP = ["pdf", "dxf", "kmz", "csv", "sld", "rtd"]


@pytest.fixture
def chosen(demo):
    """The demo with option A chosen, as the project is after a design run."""
    demo["name"] = "Pune demo"
    demo["chosen_option"] = "29x22x1"
    return demo


@pytest.fixture(scope="module")
def exported(client, _demo):
    """Every export of the demo with option A, made once."""
    project = {**_demo, "name": "Pune demo", "chosen_option": "29x22x1"}
    return {kind: client.post(f"/export/{kind}", json=project) for kind in KINDS}


# ── the six files ────────────────────────────────────────────────────────────
@pytest.mark.parametrize("kind", KINDS)
def test_an_export_is_a_file_to_download_with_its_type_and_name(exported, kind):
    response = exported[kind]
    media_type, name = KINDS[kind]

    assert response.status_code == 200
    assert response.headers["content-type"] == media_type
    assert response.headers["content-disposition"] == f'attachment; filename="{name}"'
    assert int(response.headers["content-length"]) == len(response.content) > 0


def test_the_pdf_has_six_pages_and_the_numbers_of_the_demo(exported):
    pages = _pages(exported["pdf"].content)

    assert exported["pdf"].content.startswith(b"%PDF-")
    assert len(pages) == 6
    assert "Pune demo · rooftop PV design" in pages[0]
    assert "357.28 kWp (638 modules)" in pages[0]
    assert "P50 617.8 MWh" in pages[0]
    assert "4 mm² Cu, 1500 V DC" in pages[4]
    assert "Single-line diagram" in pages[5]


def test_the_dxf_has_the_layers_of_the_desktop_app(exported):
    drawing = ezdxf.read(io.StringIO(exported["dxf"].content.decode("utf-8")))

    layers = {layer.dxf.name for layer in drawing.layers}
    assert {"ROOF", "SETBACK", "OBSTACLES", "KEEPOUT", "MODULES_UNUSED", "INVERTERS", "TEXT"} <= layers
    assert {f"STRING_S{n:02d}" for n in range(1, 23)} <= layers
    assert "STRING_S23" not in layers
    modules = [e for e in drawing.modelspace() if e.dxf.layer.startswith(("STRING_S", "MODULES_UNUSED"))]
    assert len(modules) == 790
    assert sum(1 for e in modules if e.dxf.layer == "MODULES_UNUSED") == 790 - 638


def test_the_kmz_comes_back_through_the_import_with_its_heights(client, exported):
    file = {"name": "Pune-demo.kmz", "base64": base64.b64encode(exported["kmz"].content).decode("ascii")}

    roof = client.post("/roof/import", json=file).json()

    assert zipfile.is_zipfile(io.BytesIO(exported["kmz"].content))
    heights = {obstacle["name"]: obstacle["height"] for obstacle in roof["obstacles"]}
    assert heights == {
        "Stair room": 3.0,
        "Water tank": 2.0,
        "AC unit 1": 1.2,
        "AC unit 2": 1.2,
        "AC unit 3": 1.2,
        "AC unit 4": 1.2,
    }
    assert roof["missing_heights"] == [] and roof["notes"] == []
    assert (roof["lat"], roof["lon"]) == (pytest.approx(18.52, abs=1e-4), pytest.approx(73.86, abs=1e-4))


def test_the_csv_has_the_8760_hours_and_their_columns(exported):
    table = pd.read_csv(io.BytesIO(exported["csv"].content))

    assert list(table.columns) == [
        "time_utc_hour_start",
        "ghi_w_m2",
        "poa_eff_w_m2",
        "t_cell_c",
        "p_dc_kw",
        "p_ac_kw",
    ]
    assert len(table) == 8760
    assert table["p_ac_kw"].sum() / 1000 == pytest.approx(617.84, abs=0.01)


def test_the_single_line_diagram_is_a_png_of_a4_at_200_dpi(exported):
    content = exported["sld"].content

    assert content.startswith(PNG)
    width, height = (int.from_bytes(content[at : at + 4], "big") for at in (16, 20))
    assert (width, height) == (2338, 1654)


def test_the_export_is_that_of_the_option_chosen(client, chosen):
    chosen["chosen_option"] = "26x24x1"

    table = pd.read_csv(io.BytesIO(client.post("/export/csv", json=chosen).content))

    assert table["p_ac_kw"].sum() / 1000 == pytest.approx(607.7, abs=0.05)


# ── the day of the report ────────────────────────────────────────────────────
def test_the_report_prints_the_day_it_is_asked_for(client, chosen):
    page = _pages(client.post("/export/pdf?day=2025-01-31", json=chosen).content)[0]

    assert "SolarLayout Rooftop · 31 Jan 2025" in page


def test_the_report_prints_the_server_day_when_none_is_asked_for(exported):
    page = _pages(exported["pdf"].content)[0]

    assert f"SolarLayout Rooftop · {date.today():%d %b %Y}" in page


def test_a_day_that_is_not_a_date_is_refused_by_its_field(client, chosen):
    response = client.post("/export/pdf?day=yesterday", json=chosen)

    assert response.status_code == 422
    error = error_of(response)
    assert error["code"] == "invalid_request"
    assert error["field"] == "day"
    assert error["message"].startswith("day: ")


@pytest.mark.parametrize("kind", KINDS)
def test_every_kind_takes_the_day(client, chosen, kind):
    assert client.post(f"/export/{kind}?day=2026-10-03", json=chosen).status_code == 200


# ── the project file ─────────────────────────────────────────────────────────
def _rtd(content: bytes) -> dict:
    return json.loads(content.decode("utf-8"))


def _as_the_engine_has_it(request: dict) -> Project:
    return convert.project_to_engine(schemas.Project.model_validate(request))


def test_the_rtd_is_the_project_of_the_request_as_the_engine_writes_it(chosen, exported):
    written = _rtd(exported["rtd"].content)

    assert written["format"] == 2
    assert Project.from_json(written) == _as_the_engine_has_it(chosen)
    assert exported["rtd"].content == json.dumps(written, indent=1).encode("utf-8")


def test_the_rtd_is_written_before_a_system_voltage_is_chosen(client, demo):
    demo["system_voltage"] = None
    demo["chosen_option"] = ""

    response = client.post("/export/rtd", json=demo)

    assert response.status_code == 200
    written = _rtd(response.content)
    assert written["system_voltage"] is None and written["chosen_option"] == ""
    assert Project.from_json(written) == _as_the_engine_has_it(demo)


def test_the_rtd_is_written_without_weather(client, light_demo):
    response = client.post("/export/rtd", json=light_demo)

    assert response.status_code == 200
    assert _rtd(response.content)["weather_json"] is None


def test_the_rtd_needs_no_design_run(client, chosen, monkeypatch):
    def no_run(project):
        raise AssertionError("the project file needs nothing of the design prepared or run")

    monkeypatch.setattr(design_service, "prepare", no_run)

    response = client.post("/export/rtd", json=chosen)

    assert response.status_code == 200
    assert response.headers["content-disposition"] == 'attachment; filename="Pune-demo.rtd"'


def _drawn(dxf: bytes) -> list[tuple]:
    """What a DXF draws: every outline with its layer, every text with its place."""
    found = []
    for entity in ezdxf.read(io.StringIO(dxf.decode("utf-8"))).modelspace():
        if entity.dxftype() == "LWPOLYLINE":
            found.append((entity.dxf.layer, [tuple(point) for point in entity.get_points("xy")]))
        else:
            found.append((entity.dxf.layer, entity.dxf.text, tuple(entity.dxf.insert)))
    return found


def _kml(kmz: bytes) -> bytes:
    with zipfile.ZipFile(io.BytesIO(kmz)) as archive:
        assert archive.namelist() == ["doc.kml"]
        return archive.read("doc.kml")


def _pages(pdf: bytes) -> list[str]:
    return [page.extract_text() for page in PdfReader(io.BytesIO(pdf)).pages]


@pytest.fixture(scope="module")
def exported_again(client, _demo, exported):
    project = {**_demo, "name": "Pune demo", "chosen_option": "29x22x1"}
    return {kind: client.post(f"/export/{kind}", json=project).content for kind in KINDS}


@pytest.mark.parametrize("kind", ["csv", "sld", "rtd"])
def test_the_same_request_gives_the_same_file_byte_for_byte(exported, exported_again, kind):
    assert exported_again[kind] == exported[kind].content


def test_the_same_request_gives_the_same_content_in_the_files_that_bear_the_time_they_were_made(
    exported, exported_again
):
    assert _drawn(exported_again["dxf"]) == _drawn(exported["dxf"].content)
    assert len(_drawn(exported["dxf"].content)) > 790
    assert _kml(exported_again["kmz"]) == _kml(exported["kmz"].content)
    assert _pages(exported_again["pdf"]) == _pages(exported["pdf"].content)


# ── the zip ──────────────────────────────────────────────────────────────────
def _archive(content: bytes) -> zipfile.ZipFile:
    return zipfile.ZipFile(io.BytesIO(content))


def test_the_zip_holds_the_six_files_each_named_as_its_own_download(exported):
    with _archive(exported["zip"].content) as archive:
        assert archive.namelist() == [KINDS[kind][1] for kind in IN_THE_ZIP]
        assert all(entry.compress_type == zipfile.ZIP_DEFLATED for entry in archive.infolist())
        assert all(entry.file_size > 0 for entry in archive.infolist())


def test_each_file_in_the_zip_is_its_own_export(exported):
    with _archive(exported["zip"].content) as archive:
        inside = {kind: archive.read(KINDS[kind][1]) for kind in IN_THE_ZIP}

    for kind in ("csv", "sld", "rtd"):
        assert inside[kind] == exported[kind].content, kind
    assert _pages(inside["pdf"]) == _pages(exported["pdf"].content)
    assert _drawn(inside["dxf"]) == _drawn(exported["dxf"].content)
    assert _kml(inside["kmz"]) == _kml(exported["kmz"].content)


def test_the_report_in_the_zip_prints_the_day_asked_for(client, chosen):
    with _archive(client.post("/export/zip?day=2025-01-31", json=chosen).content) as archive:
        page = _pages(archive.read("Pune-demo-report.pdf"))[0]

    assert "SolarLayout Rooftop · 31 Jan 2025" in page


def test_the_project_file_in_the_zip_is_of_the_request_as_the_rtd_is(client, chosen):
    chosen["name"] = "Block B"

    with _archive(client.post("/export/zip", json=chosen).content) as archive:
        written = _rtd(archive.read("Block-B.rtd"))

    assert Project.from_json(written) == _as_the_engine_has_it(chosen)
    assert written["name"] == "Block B"


# ── the name of the file ─────────────────────────────────────────────────────
@pytest.mark.parametrize(("kind", "ending"), [("csv", "-hourly.csv"), ("rtd", ".rtd")])
@pytest.mark.parametrize(
    ("project", "stem"),
    [
        ("Pune demo", "Pune-demo"),
        ("  Warehouse 7 / Block B  ", "Warehouse-7-Block-B"),
        ("roof_v2.final", "roof_v2.final"),
        ("../../etc/passwd", "etc-passwd"),
        ('say "hello"', "say-hello"),
        ("...", "rooftop-design"),
        ("", "rooftop-design"),
    ],
)
def test_the_file_is_named_after_the_project(client, chosen, project, stem, kind, ending):
    chosen["name"] = project

    response = client.post(f"/export/{kind}", json=chosen)

    assert response.headers["content-disposition"] == f'attachment; filename="{stem}{ending}"'


def test_a_name_in_another_script_is_kept_for_those_who_can_read_it(client, chosen):
    chosen["name"] = "पुणे छत"

    disposition = client.post("/export/csv", json=chosen).headers["content-disposition"]

    assert disposition == (
        'attachment; filename="rooftop-design-hourly.csv"; '
        "filename*=UTF-8''%E0%A4%AA%E0%A5%81%E0%A4%A3%E0%A5%87-%E0%A4%9B%E0%A4%A4-hourly.csv"
    )


# ── what cannot be exported ──────────────────────────────────────────────────
@pytest.mark.parametrize("kind", OF_THE_DESIGN)
def test_without_a_chosen_option_nothing_is_exported(client, demo, kind):
    demo["chosen_option"] = ""

    response = client.post(f"/export/{kind}", json=demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "no_option_chosen",
        "message": "Choose a stringing option first. This design has 29x22x1, 26x24x1, 28x22x1, 26x27x2 "
        "and 28x25x2.",
        "field": "chosen_option",
    }


def test_an_option_that_the_design_does_not_have_is_not_exported(client, chosen):
    chosen["chosen_option"] = "30x20x1"

    response = client.post("/export/pdf", json=chosen)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "option_not_in_design",
        "message": "This design has no option 30x20x1. It has 29x22x1, 26x24x1, 28x22x1, 26x27x2 and "
        "28x25x2. Choose one of them.",
        "field": "chosen_option",
    }


def test_without_a_system_voltage_the_export_says_what_is_missing(client, chosen):
    chosen["system_voltage"] = None

    response = client.post("/export/pdf", json=chosen)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "system_voltage_missing",
        "message": "Choose a system voltage to size the strings. 600, 1000 or 1500 V. Nothing is sized "
        "until you choose.",
        "field": "system_voltage",
    }


def test_a_project_without_weather_is_refused_as_by_the_design_run(client, chosen):
    chosen["weather_json"] = None

    response = client.post("/export/csv", json=chosen)

    assert response.status_code == 422
    assert error_of(response)["code"] == "weather_not_loaded"


def test_a_kind_that_is_none_of_the_seven_is_refused(client, chosen):
    response = client.post("/export/xlsx", json=chosen)

    assert response.status_code == 422
    assert error_of(response)["field"] == "kind"


def test_the_options_of_the_design_run_can_each_be_exported(client, chosen):
    keys = [option["key"] for option in result_of(client.post("/design", json=chosen))["options"]]

    for key in keys:
        chosen["chosen_option"] = key
        assert client.post("/export/csv", json=chosen).status_code == 200, key


def test_drawings_asked_for_at_the_same_time_do_not_disturb_each_other(client, chosen, exported):
    from concurrent.futures import ThreadPoolExecutor

    kinds = ["sld", "pdf", "sld", "pdf", "sld", "sld"]

    with ThreadPoolExecutor(max_workers=6) as pool:
        answers = list(pool.map(lambda kind: client.post(f"/export/{kind}", json=chosen), kinds))

    assert [answer.status_code for answer in answers] == [200] * 6
    for kind, answer in zip(kinds, answers, strict=True):
        if kind == "sld":
            assert answer.content == exported["sld"].content
        else:
            assert _pages(answer.content) == _pages(exported["pdf"].content)
