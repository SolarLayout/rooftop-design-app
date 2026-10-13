"""Every route that takes an outline refuses one over 30,000 m² with roof_too_large, before any work is done
(plan/phase-11-plan.md, step 20 and decision 11); a roof at the limit is designed."""

import base64
import json

import pytest

from rooftop_core.demo import rectangle
from rooftop_core.geo import local_to_lonlat
from tests.api.conftest import error_of
from tests.api.test_roof_import import KML

PUNE = (18.52, 73.86)
TOO_LARGE = [list(p) for p in rectangle(485.0, 100.0)]
AT_THE_LIMIT = [list(p) for p in rectangle(300.0, 100.0)]
WORDS = (
    "This outline covers 48,500 m². SolarLayout designs one roof at a time, up to 30,000 m² (about 3 MWp). "
    "For a larger site, outline each building as its own design."
)
# The KML of the import tests with its roof stretched to 485 by 100 m, about its first corner.
TOO_LARGE_KML = KML.replace(
    "73.8600,18.5200,0 73.8603,18.5200,0 73.8603,18.5202,0 73.8600,18.5202,0 73.8600,18.5200,0",
    " ".join(
        f"{lon:.7f},{lat:.7f},0"
        for lon, lat in local_to_lonlat([(0, 0), (485, 0), (485, 100), (0, 100), (0, 0)], *PUNE)
    ),
)


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _too_large(project: dict) -> dict:
    project["roof"]["outline"] = TOO_LARGE
    return project


def assert_refused(response, field: str) -> None:
    assert response.status_code == 422, response.text[:300]
    assert response.headers["content-type"] == "application/json"
    assert error_of(response) == {"code": "roof_too_large", "message": WORDS, "field": field}


# ── the project routes ───────────────────────────────────────────────────────
def test_the_layout_refuses_a_roof_over_the_limit_in_the_words_of_the_decision(client, light_demo):
    response = client.post("/layout", json=_too_large(light_demo))

    assert_refused(response, "roof.outline")


def test_the_design_refuses_it_before_the_stream_begins(client, demo):
    response = client.post("/design", json=_too_large(demo))

    assert_refused(response, "roof.outline")


@pytest.mark.parametrize("kind", ["rtd", "pdf", "zip"])
def test_every_export_refuses_it(client, demo, kind):
    demo["chosen_option"] = "29x22x1"

    response = client.post(f"/export/{kind}", json=_too_large(demo))

    assert_refused(response, "roof.outline")


def test_the_pages_of_the_report_refuse_it(client, demo):
    demo["chosen_option"] = "29x22x1"

    response = client.post("/export/report-pages", json=_too_large(demo))

    assert_refused(response, "roof.outline")


SUN_AT_16H = {"lat": PUNE[0], "lon": PUNE[1], "day": "design_day", "hours": [16.0]}


def test_the_shadows_refuse_it_by_the_place_of_the_roof_in_the_request(client, light_demo):
    roof = _too_large(light_demo)["roof"]

    response = client.post("/sun", json={**SUN_AT_16H, "shadows": {"roof": roof, "hour": 16.0}})

    assert_refused(response, "shadows.roof.outline")


def test_the_sun_without_shadows_takes_no_outline_and_is_not_refused(client):
    response = client.post("/sun", json=SUN_AT_16H)

    assert response.status_code == 200


# ── the map ──────────────────────────────────────────────────────────────────
def test_a_roof_outlined_on_the_map_over_the_limit_is_refused_by_its_outline(client):
    outline = local_to_lonlat([(-242.5, -50), (242.5, -50), (242.5, 50), (-242.5, 50)], *PUNE)

    response = client.post("/roof/from-map", json={"outline": [list(p) for p in outline], "obstacles": []})

    assert response.status_code == 422
    error = error_of(response)
    assert (error["code"], error["field"]) == ("roof_too_large", "outline")
    assert error["message"].startswith("This outline covers 48,")
    assert error["message"].endswith(WORDS[WORDS.index(" m². SolarLayout") :])


# ── the files ────────────────────────────────────────────────────────────────
def test_a_kml_whose_roof_is_over_the_limit_is_refused_by_the_file(client):
    response = client.post("/roof/import", json={"name": "site.kml", "base64": _b64(TOO_LARGE_KML.encode())})

    assert response.status_code == 422
    error = error_of(response)
    assert (error["code"], error["field"]) == ("roof_too_large", "base64")
    assert error["message"].startswith("This outline covers 48,")


def test_a_project_file_whose_roof_is_over_the_limit_is_refused_by_the_outline_in_it(client, light_demo):
    exported = client.post("/export/rtd", json=light_demo)
    assert exported.status_code == 200
    written = json.loads(exported.text)
    written["roof"]["outline"] = TOO_LARGE

    response = client.post("/project/open", json={"name": "site.rtd", "text": json.dumps(written)})

    assert_refused(response, "roof.outline")


# ── at the limit ─────────────────────────────────────────────────────────────
@pytest.mark.slow
def test_a_roof_at_the_limit_is_laid_out(client, light_demo):
    light_demo["roof"]["outline"] = AT_THE_LIMIT
    light_demo["roof"]["obstacles"] = []

    response = client.post("/layout", json=light_demo)

    assert response.status_code == 200
    readouts = response.json()["readouts"]
    assert readouts["roof_area_m2"] == pytest.approx(30_000.0)
    assert readouts["positions"] > 5_000
