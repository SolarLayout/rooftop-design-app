# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
import json
import zipfile

from shapely.geometry import Polygon

from rooftop_core.export import files
from rooftop_core.io.roof_import import read_dxf, read_kmz
from rooftop_core.project import Project


def test_project_round_trip(demo_design, tmp_path):
    f = tmp_path / "p.rtd"
    demo_design.p.save(f)
    q = Project.load(f)
    assert q.roof.outline == demo_design.p.roof.outline
    assert q.roof.obstacles[0].name == "Stair room" and q.system_voltage == 1500
    assert q.losses.p_levels == (50, 75, 90)


def test_the_text_of_a_project_is_what_save_writes(demo_design, tmp_path):
    f = tmp_path / "p.rtd"
    demo_design.p.save(f)
    text = demo_design.p.to_text()
    assert text == f.read_text()
    assert text.startswith("{\n \"name\": ")  # one writer of the format: json.dumps with indent=1
    assert Project.from_json(json.loads(text)) == demo_design.p


def test_exports_write_and_reimport(demo_design, tmp_path):
    for fn, ext in ((files.export_pdf, "pdf"), (files.export_dxf, "dxf"), (files.export_kmz, "kmz"),
                    (files.export_csv, "csv"), (files.export_sld, "png")):
        p = tmp_path / f"out.{ext}"
        fn(demo_design, p)
        assert p.stat().st_size > 1000, ext
    k = read_kmz(tmp_path / "out.kmz")
    assert abs(Polygon(k.outline).area - 3600) < 1 and abs(k.lat - 18.52) < 1e-4
    assert any(o.name == "Stair room" and o.height == 3.0 for o in k.obstacles)
    x = read_dxf(tmp_path / "out.dxf", "m", 18.52, 73.86)
    assert abs(Polygon(x.outline).area - 3600) < 1
    assert zipfile.is_zipfile(tmp_path / "out.kmz")


def test_kmz_heights_from_names(tmp_path):
    kml = """<kml xmlns='http://www.opengis.net/kml/2.2'><Document>
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
    f = tmp_path / "roof.kml"
    f.write_text(kml)
    r = read_kmz(f)
    tank = next(o for o in r.obstacles if o.name == "Tank")
    assert tank.height == 2.5 and r.missing_heights == ["Vent"]
