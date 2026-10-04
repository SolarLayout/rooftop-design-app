"""POST /export/report-pages: the pages of the report as images, for the preview on the screen."""

import base64
import io
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import pytest
from pypdf import PdfReader

from tests.api.conftest import error_of

pytestmark = pytest.mark.slow

PNG = b"\x89PNG\r\n\x1a\n"
TITLES = ["Summary", "Layout", "Shadows", "Energy", "Schedule", "SLD"]
DAY = "2026-10-03"


@pytest.fixture
def chosen(demo):
    """The demo with option A chosen, as the project is after a design run."""
    demo["name"] = "Pune demo"
    demo["chosen_option"] = "29x22x1"
    return demo


@pytest.fixture(scope="module")
def answered(client, _demo):
    """The pages of the demo with option A, asked for the one day, made once."""
    project = {**_demo, "name": "Pune demo", "chosen_option": "29x22x1"}
    return client.post(f"/export/report-pages?day={DAY}", json=project)


@pytest.fixture(scope="module")
def pages(answered) -> list[dict]:
    return answered.json()["pages"]


def _png_size(png: bytes) -> tuple[int, int]:
    assert png.startswith(PNG)
    return tuple(int.from_bytes(png[at : at + 4], "big") for at in (16, 20))


def _page_count(pdf: bytes) -> int:
    return len(PdfReader(io.BytesIO(pdf)).pages)


# ── kept once drawn ──────────────────────────────────────────────────────────
def test_the_pages_of_a_project_and_a_day_are_drawn_once_and_then_kept(client, chosen, answered, monkeypatch):
    from rooftop_api.services import export

    drawn = []
    monkeypatch.setattr(export.report, "report_pages", lambda *args: drawn.append(args) or [])

    again = client.post(f"/export/report-pages?day={DAY}", json=chosen)

    assert again.status_code == 200
    assert again.json() == answered.json()
    assert drawn == []


def test_another_day_or_another_project_is_drawn_anew(client, chosen):
    from rooftop_api.services import export

    other_day = export.pages_key(schemas_project(chosen), date(2025, 1, 31))
    other_project = export.pages_key(
        schemas_project({**chosen, "name": "Another name"}), date.fromisoformat(DAY)
    )
    same = export.pages_key(schemas_project(chosen), date.fromisoformat(DAY))

    assert len({same, other_day, other_project}) == 3
    assert export.pages_key(schemas_project(chosen), date.fromisoformat(DAY)) == same


def schemas_project(project: dict):
    from rooftop_api import schemas

    return schemas.Project.model_validate(project)


# ── the answer ───────────────────────────────────────────────────────────────
def test_the_pages_come_as_json_with_the_day_and_the_dpi(answered):
    assert answered.status_code == 200
    assert answered.headers["content-type"] == "application/json"
    body = answered.json()
    assert list(body) == ["day", "dpi", "pages"]
    assert body["day"] == DAY
    assert body["dpi"] == 150


def test_the_demo_has_six_pages_with_their_titles_in_order(pages):
    assert [page["title"] for page in pages] == TITLES
    assert [page["number"] for page in pages] == [1, 2, 3, 4, 5, 6]


def test_every_page_is_a_png_of_the_size_it_says(pages):
    for page in pages:
        assert list(page) == ["number", "title", "width", "height", "png"]
        png = base64.b64decode(page["png"], validate=True)
        assert _png_size(png) == (page["width"], page["height"]) == (1753, 1240), page["title"]


def test_without_a_day_the_pages_bear_the_server_day(client, chosen):
    body = client.post("/export/report-pages", json=chosen).json()

    assert body["day"] == date.today().isoformat()


def test_the_pages_are_those_of_the_pdf(client, chosen, answered):
    pdf = client.post(f"/export/pdf?day={DAY}", json=chosen).content

    assert len(answered.json()["pages"]) == _page_count(pdf) == len(TITLES)


# ── what cannot be drawn ─────────────────────────────────────────────────────
def test_without_a_system_voltage_the_pages_say_what_is_missing_as_the_pdf_does(client, chosen):
    chosen["system_voltage"] = None

    pages = client.post("/export/report-pages", json=chosen)
    pdf = client.post("/export/pdf", json=chosen)

    assert pages.status_code == pdf.status_code == 422
    assert error_of(pages) == error_of(pdf)
    assert error_of(pages)["code"] == "system_voltage_missing"
    assert error_of(pages)["field"] == "system_voltage"


def test_without_a_chosen_option_nothing_is_drawn(client, demo):
    demo["chosen_option"] = ""

    response = client.post("/export/report-pages", json=demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "no_option_chosen",
        "message": "Choose a stringing option first. This design has 29x22x1, 26x24x1, 28x22x1, 26x27x2 "
        "and 28x25x2.",
        "field": "chosen_option",
    }


def test_a_day_that_is_not_a_date_is_refused_by_its_field(client, chosen):
    response = client.post("/export/report-pages?day=yesterday", json=chosen)

    assert response.status_code == 422
    error = error_of(response)
    assert error["code"] == "invalid_request"
    assert error["field"] == "day"


# ── the drawing lock ─────────────────────────────────────────────────────────
def test_pages_asked_for_with_other_drawings_at_the_same_time_are_not_disturbed(client, chosen, answered):
    paths = [
        f"/export/report-pages?day={DAY}",
        "/export/pdf",
        f"/export/report-pages?day={DAY}",
        "/export/sld",
        f"/export/report-pages?day={DAY}",
    ]

    with ThreadPoolExecutor(max_workers=len(paths)) as pool:
        answers = list(pool.map(lambda path: client.post(path, json=chosen), paths))

    assert [answer.status_code for answer in answers] == [200] * len(paths)
    for path, answer in zip(paths, answers, strict=True):
        if path.startswith("/export/report-pages"):
            assert answer.json() == answered.json()
