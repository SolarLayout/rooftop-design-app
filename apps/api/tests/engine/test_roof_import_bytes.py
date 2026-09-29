"""KMZ, KML and DXF roofs are read from the content of the file as well as from a path."""

import io
import zipfile

import ezdxf
import pytest
from shapely.geometry import Polygon

from rooftop_core.export import files
from rooftop_core.io import roof_import
from rooftop_core.io.roof_import import read_dxf, read_kmz

KML = """<kml xmlns='http://www.opengis.net/kml/2.2'><Document>
<Placemark><name>Roof</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
73.8600,18.5200,0 73.8603,18.5200,0 73.8603,18.5202,0 73.8600,18.5202,0 73.8600,18.5200,0
</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
<Placemark><name>Tank h=2.5</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
73.86010,18.52010,0 73.86012,18.52010,0 73.86012,18.52012,0 73.86010,18.52012,0 73.86010,18.52010,0
</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
<Placemark><name>Vent</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
73.86002,18.52002,0 73.86003,18.52002,0 73.86003,18.52003,0 73.86002,18.52003,0 73.86002,18.52002,0
</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
<Placemark><name>Pipe h=0.4</name><LineString><coordinates>
73.86005,18.52005,0 73.86008,18.52005,0
</coordinates></LineString></Placemark>
</Document></kml>"""


def _kmz(kml: str) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("doc.kml", kml)
    return buffer.getvalue()


def _drawing_in_millimetres() -> ezdxf.document.Drawing:
    """A 40 x 20 m roof, a round tank and a 3 x 2 m plant room, drawn in millimetres."""
    doc = ezdxf.new("R2010")
    space = doc.modelspace()
    space.add_lwpolyline(
        [(0, 0), (40000, 0), (40000, 20000), (0, 20000)], close=True, dxfattribs={"layer": "ROOF"}
    )
    space.add_circle((10000, 10000), 1500, dxfattribs={"layer": "TANK"})
    space.add_lwpolyline(
        [(30000, 5000), (33000, 5000), (33000, 7000), (30000, 7000)],
        close=True,
        dxfattribs={"layer": "PLANT"},
    )
    return doc


def _ascii_dxf(doc: ezdxf.document.Drawing) -> str:
    stream = io.StringIO()
    doc.write(stream)
    return stream.getvalue()


@pytest.fixture
def kml_file(tmp_path):
    path = tmp_path / "roof.kml"
    path.write_text(KML, encoding="utf-8")
    return path


def test_kml_bytes_give_what_the_path_gives(kml_file):
    from_path = read_kmz(kml_file)
    from_bytes = read_kmz(KML.encode(), name="roof.kml")

    assert from_bytes == from_path
    assert [o.name for o in from_bytes.obstacles] == ["Tank", "Vent", "Pipe"]
    assert from_bytes.missing_heights == ["Vent"]


def test_kml_text_gives_what_the_path_gives(kml_file):
    assert read_kmz(KML, name="roof.kml") == read_kmz(kml_file)


def test_kmz_bytes_give_what_the_path_gives(tmp_path):
    path = tmp_path / "roof.kmz"
    path.write_bytes(_kmz(KML))

    assert read_kmz(_kmz(KML), name="roof.kmz") == read_kmz(path)
    assert read_kmz(_kmz(KML)) == read_kmz(KML.encode())


def test_exported_kmz_comes_back_from_its_bytes(demo_design, tmp_path):
    path = tmp_path / "out.kmz"
    files.export_kmz(demo_design, path)

    roof = read_kmz(path.read_bytes(), name="out.kmz")

    assert roof == read_kmz(path)
    assert Polygon(roof.outline).area == pytest.approx(3600, abs=1)
    assert roof.lat == pytest.approx(18.52, abs=1e-4)
    assert any(o.name == "Stair room" and o.height == 3.0 for o in roof.obstacles)


def test_exported_dxf_comes_back_from_its_bytes(demo_design, tmp_path):
    path = tmp_path / "out.dxf"
    files.export_dxf(demo_design, path)

    roof = read_dxf(path.read_bytes(), "m", 18.52, 73.86, name="out.dxf")

    assert roof == read_dxf(path, "m", 18.52, 73.86)
    assert Polygon(roof.outline).area == pytest.approx(3600, abs=1)
    assert (roof.lat, roof.lon) == (18.52, 73.86)


def test_a_drawing_in_millimetres_is_read_from_bytes_and_from_text(tmp_path):
    doc = _drawing_in_millimetres()
    path = tmp_path / "roof.dxf"
    doc.saveas(path)
    from_path = read_dxf(path, "mm", 18.52, 73.86)

    from_bytes = read_dxf(path.read_bytes(), "mm", 18.52, 73.86, name="roof.dxf")
    from_text = read_dxf(_ascii_dxf(doc), "mm", 18.52, 73.86, name="roof.dxf")

    assert from_bytes == from_path
    assert from_text == from_path
    assert Polygon(from_bytes.outline).area == pytest.approx(800.0)
    tank, plant = from_bytes.obstacles
    assert (tank.name, tank.kind, tank.diameter) == ("TANK", "cylinder", pytest.approx(3.0))
    assert (tank.x, tank.y) == (pytest.approx(-10.0), pytest.approx(0.0))
    assert (plant.name, plant.kind) == ("PLANT", "box")
    assert sorted([plant.length, plant.width]) == [pytest.approx(2.0), pytest.approx(3.0)]
    assert from_bytes.missing_heights == ["TANK", "PLANT"]


def test_a_binary_dxf_is_read_from_bytes(tmp_path):
    path = tmp_path / "roof.dxf"
    _drawing_in_millimetres().saveas(path, fmt="bin")

    assert read_dxf(path.read_bytes(), "mm", 18.52, 73.86) == read_dxf(path, "mm", 18.52, 73.86)


def test_kml_without_a_polygon_is_refused_by_name():
    kml = "<kml xmlns='http://www.opengis.net/kml/2.2'><Document></Document></kml>"

    with pytest.raises(ValueError) as error:
        read_kmz(kml.encode(), name="empty.kml")

    assert str(error.value) == "empty.kml has no polygon to use as the roof."


def test_bytes_that_are_not_kml_are_refused_in_words():
    with pytest.raises(ValueError) as error:
        read_kmz(b"this is not a roof", name="notes.kml")

    assert str(error.value).startswith("notes.kml is not a KML file that can be read: ")


def test_a_kmz_without_a_kml_inside_is_refused_in_words():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("readme.txt", "no roof here")

    with pytest.raises(ValueError) as error:
        read_kmz(buffer.getvalue(), name="roof.kmz")

    assert str(error.value) == "roof.kmz has no KML file inside."


def test_a_kmz_with_a_huge_kml_inside_is_refused_before_it_is_unpacked(monkeypatch):
    monkeypatch.setattr(roof_import, "MAX_KML_MB", 0)

    with pytest.raises(ValueError) as error:
        read_kmz(_kmz(KML), name="city.kmz")

    assert str(error.value) == (
        "city.kmz: the KML inside is larger than 0 MB. Export the roof and its obstacles alone."
    )


def test_bytes_that_are_not_dxf_are_refused_in_words():
    with pytest.raises(ValueError) as error:
        read_dxf(b"this is not a drawing", "m", 18.52, 73.86, name="notes.dxf")

    assert str(error.value).startswith("notes.dxf is not a DXF file that can be read")


def test_a_drawing_without_a_closed_polyline_is_refused_by_name():
    doc = ezdxf.new("R2010")
    doc.modelspace().add_line((0, 0), (10, 0))

    with pytest.raises(ValueError) as error:
        read_dxf(_ascii_dxf(doc).encode(), "m", 18.52, 73.86, name="lines.dxf")

    assert str(error.value) == "lines.dxf has no closed polyline to use as the roof."


def test_content_without_a_name_is_called_the_file():
    kml = "<kml xmlns='http://www.opengis.net/kml/2.2'><Document></Document></kml>"

    with pytest.raises(ValueError) as error:
        read_kmz(kml.encode())

    assert str(error.value) == "The file has no polygon to use as the roof."


# ── a KMZ that the app exported ──────────────────────────────────────────────
def _placemark(name: str, west: float, south: float, size: float) -> str:
    east, north = west + size, south + size
    ring = f"{west},{south},0 {east},{south},0 {east},{north},0 {west},{north},0 {west},{south},0"
    return (
        f"<Placemark><name>{name}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>{ring}"
        "</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>"
    )


def _document(*folders: str) -> str:
    return (
        "<?xml version='1.0' encoding='UTF-8'?><kml xmlns='http://www.opengis.net/kml/2.2'><Document>"
        + "".join(folders)
        + "</Document></kml>"
    )


def _folder(name: str, *placemarks: str) -> str:
    return f"<Folder><name>{name}</name>{''.join(placemarks)}</Folder>"


ROOF = _placemark("Roof", 73.8600, 18.5200, 0.0004)
TANK = _placemark("Tank h=2.5", 73.8601, 18.5201, 0.00002)
MODULES = [_placemark(f"Module {n}", 73.8602 + n * 0.00003, 18.5202, 0.00002) for n in (1, 2)]


def test_the_modules_of_an_exported_kmz_are_not_obstacles():
    roof = read_kmz(_document(_folder("Roof", ROOF, TANK), _folder("Modules (2)", *MODULES)))

    assert [o.name for o in roof.obstacles] == ["Tank"]
    assert roof.missing_heights == []


def test_an_outline_named_module_elsewhere_is_an_obstacle_as_any_other():
    roof = read_kmz(_document(_folder("Roof", ROOF, TANK, MODULES[0]), _folder("Plant", MODULES[1])))

    assert sorted(o.name for o in roof.obstacles) == ["Module 1", "Module 2", "Tank"]
    assert sorted(roof.missing_heights) == ["Module 1", "Module 2"]


def test_a_folder_of_modules_alone_has_no_roof():
    with pytest.raises(ValueError, match="has no polygon to use as the roof"):
        read_kmz(_document(_folder("Modules (2)", *MODULES)), name="modules.kml")
