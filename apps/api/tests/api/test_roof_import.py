"""POST /roof/import: a roof and its obstacles from a KMZ, KML or DXF file."""

import base64
import io
import zipfile

import ezdxf
import pytest
from shapely.geometry import Polygon

from tests.api.conftest import error_of

HEIGHT_NOTE = "The file has no height for these obstacles. The app uses 1.0 m."
KML = """<?xml version='1.0' encoding='UTF-8'?>
<kml xmlns='http://www.opengis.net/kml/2.2'><Document>
<Placemark><name>Roof</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
73.8600,18.5200,0 73.8603,18.5200,0 73.8603,18.5202,0 73.8600,18.5202,0 73.8600,18.5200,0
</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
<Placemark><name>Tank h=2.5</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
73.86010,18.52010,0 73.86012,18.52010,0 73.86012,18.52012,0 73.86010,18.52012,0 73.86010,18.52010,0
</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
<Placemark><name>Vent</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
73.86002,18.52002,0 73.86003,18.52002,0 73.86003,18.52003,0 73.86002,18.52003,0 73.86002,18.52002,0
</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
</Document></kml>"""


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _kmz(kml: str) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("doc.kml", kml)
    return buffer.getvalue()


def _dxf() -> bytes:
    """A 40 x 20 m roof with a round tank, drawn in millimetres."""
    doc = ezdxf.new("R2010")
    space = doc.modelspace()
    space.add_lwpolyline(
        [(0, 0), (40000, 0), (40000, 20000), (0, 20000)], close=True, dxfattribs={"layer": "ROOF"}
    )
    space.add_circle((10000, 10000), 1500, dxfattribs={"layer": "TANK"})
    stream = io.StringIO()
    doc.write(stream)
    return stream.getvalue().encode("utf-8")


def test_a_kml_gives_the_roof_its_place_and_its_obstacles(client):
    response = client.post("/roof/import", json={"name": "roof.kml", "base64": _b64(KML.encode())})

    assert response.status_code == 200
    body = response.json()
    assert (body["source"], body["file"]) == ("kmz", "roof.kml")
    assert len(body["outline"]) == 4
    assert Polygon(body["outline"]).area == pytest.approx(31.8 * 22.1, rel=0.02)
    assert body["lat"] == pytest.approx(18.5201, abs=1e-5)
    assert body["lon"] == pytest.approx(73.86015, abs=1e-5)
    assert [(o["name"], o["kind"], o["height"]) for o in body["obstacles"]] == [
        ("Tank", "box", 2.5),
        ("Vent", "box", 1.0),
    ]


def test_obstacles_without_a_height_are_listed_with_the_note_of_the_desktop_app(client):
    body = client.post("/roof/import", json={"name": "roof.kml", "base64": _b64(KML.encode())}).json()

    assert body["missing_heights"] == ["Vent"]
    assert body["notes"] == [HEIGHT_NOTE]


def test_a_kmz_gives_what_its_kml_gives(client):
    from_kml = client.post("/roof/import", json={"name": "roof.kml", "base64": _b64(KML.encode())}).json()
    from_kmz = client.post("/roof/import", json={"name": "roof.kmz", "base64": _b64(_kmz(KML))}).json()

    project = {**from_kml["project"], "roof_input": {**from_kml["project"]["roof_input"], "file": "roof.kmz"}}
    assert from_kmz == {**from_kml, "file": "roof.kmz", "project": project}


def test_the_place_of_a_kml_comes_from_the_file_not_from_the_request(client):
    request = {"name": "roof.kml", "base64": _b64(KML.encode()), "lat": -33.87, "lon": 151.21}

    body = client.post("/roof/import", json=request).json()

    assert body["lat"] == pytest.approx(18.5201, abs=1e-5)


def test_a_dxf_in_millimetres_is_read_at_the_place_given(client):
    request = {"name": "roof.dxf", "base64": _b64(_dxf()), "units": "mm", "lat": 18.52, "lon": 73.86}

    response = client.post("/roof/import", json=request)

    assert response.status_code == 200
    body = response.json()
    assert (body["source"], body["lat"], body["lon"]) == ("dxf", 18.52, 73.86)
    assert Polygon(body["outline"]).area == pytest.approx(800.0)
    (tank,) = body["obstacles"]
    assert (tank["name"], tank["kind"], tank["diameter"], tank["height"]) == ("TANK", "cylinder", 3.0, 1.0)
    assert (tank["x"], tank["y"]) == (-10.0, 0.0)
    assert body["missing_heights"] == ["TANK"] and body["notes"] == [HEIGHT_NOTE]


def test_a_dxf_read_in_the_wrong_units_is_refused_as_too_large_naming_its_area(client):
    """Drawn in millimetres, read in metres: a thousand times larger each way, so 800 km², and the
    area in the refusal is what tells the user to choose the right units."""
    request = {"name": "roof.dxf", "base64": _b64(_dxf()), "lat": 18.52, "lon": 73.86}

    response = client.post("/roof/import", json=request)

    assert response.status_code == 422
    error = error_of(response)
    assert (error["code"], error["field"]) == ("roof_too_large", "base64")
    assert error["message"].startswith("This outline covers 800,000,000 m². ")


def test_when_every_height_is_in_the_file_there_is_no_note(client):
    kml = KML.replace("<name>Vent</name>", "<name>Vent</name><description>steel, h: 0.8 m</description>")

    body = client.post("/roof/import", json={"name": "roof.kml", "base64": _b64(kml.encode())}).json()

    assert [(o["name"], o["height"]) for o in body["obstacles"]] == [("Tank", 2.5), ("Vent", 0.8)]
    assert body["missing_heights"] == [] and body["notes"] == []


@pytest.mark.parametrize("place", [{}, {"lat": 18.52}, {"lon": 73.86}])
def test_a_dxf_needs_the_place_of_the_roof(client, place):
    response = client.post("/roof/import", json={"name": "roof.dxf", "base64": _b64(_dxf()), **place})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "site_missing",
        "message": "A DXF drawing does not say where the roof is. Give its latitude and longitude.",
        "field": "lon" if "lat" in place else "lat",
    }


def test_a_file_of_another_kind_is_refused(client):
    response = client.post("/roof/import", json={"name": "roof.pdf", "base64": _b64(b"%PDF-1.4")})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "unsupported_file",
        "message": "roof.pdf is not a KMZ, KML or DXF file. Choose a file with one of these endings.",
        "field": "name",
    }


def test_a_kml_that_cannot_be_read_is_refused_in_the_words_of_the_engine(client):
    response = client.post("/roof/import", json={"name": "roof.kml", "base64": _b64(b"not a roof")})

    assert response.status_code == 422
    error = error_of(response)
    assert (error["code"], error["field"]) == ("roof_file_unreadable", "base64")
    assert error["message"].startswith("roof.kml is not a KML file that can be read: ")


def test_a_kml_without_a_polygon_is_refused_in_the_words_of_the_engine(client):
    kml = "<kml xmlns='http://www.opengis.net/kml/2.2'><Document></Document></kml>"

    response = client.post("/roof/import", json={"name": "empty.kml", "base64": _b64(kml.encode())})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "roof_file_unreadable",
        "message": "empty.kml has no polygon to use as the roof.",
        "field": "base64",
    }


def test_a_dxf_that_cannot_be_read_is_refused(client):
    request = {"name": "roof.dxf", "base64": _b64(b"not a drawing"), "lat": 18.52, "lon": 73.86}

    response = client.post("/roof/import", json=request)

    assert response.status_code == 422
    assert error_of(response)["message"].startswith("roof.dxf is not a DXF file that can be read")


def test_base64_that_is_none_is_refused(client):
    response = client.post("/roof/import", json={"name": "roof.kml", "base64": "@@@"})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "invalid_base64",
        "message": "The content of roof.kml is not valid base64.",
        "field": "base64",
    }


def test_an_imported_roof_can_be_laid_out(client, light_demo):
    imported = client.post("/roof/import", json={"name": "roof.kml", "base64": _b64(KML.encode())}).json()
    roof = {
        **light_demo["roof"],
        **{k: imported[k] for k in ("outline", "lat", "lon", "obstacles", "source")},
    }

    response = client.post("/layout", json={**light_demo, "roof": roof})

    assert response.status_code == 200
    assert response.json()["readouts"]["positions"] > 50


# The whole document of an imported roof (plan/phase-05-plan.md, decision 13), made as /roof/from-map makes
# one: the roof from the file, everything else at the API's defaults, named after the file.
def test_an_import_answers_the_whole_project_named_after_the_file(client):
    body = client.post(
        "/roof/import", json={"name": "warehouse-roof.kml", "base64": _b64(KML.encode())}
    ).json()

    project = body["project"]
    assert project["name"] == "warehouse-roof"
    assert project["roof"]["outline"] == body["outline"]
    assert (project["roof"]["lat"], project["roof"]["lon"]) == (body["lat"], body["lon"])
    assert project["roof"]["source"] == "kmz"
    assert [o["name"] for o in project["roof"]["obstacles"]] == ["Tank", "Vent"]
    assert project["system_voltage"] is None
    assert project["roof_input"]["mode"] == "corners"
    assert project["roof_input"]["file"] == "warehouse-roof.kml"


def test_the_project_of_an_import_can_be_laid_out_as_it_is(client):
    body = client.post("/roof/import", json={"name": "roof.kml", "base64": _b64(KML.encode())}).json()

    response = client.post("/layout", json=body["project"])

    assert response.status_code == 200
    assert response.json()["readouts"]["positions"] > 50
