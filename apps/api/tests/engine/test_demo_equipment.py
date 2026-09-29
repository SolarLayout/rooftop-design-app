"""Decision D24: the demo bundles its equipment under its real names. The data is that of the desktop
app's Test.PAN and Test-S.ond, which stay with the tests: every number must be the same with both."""

from dataclasses import asdict

import pytest

from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Obstacle, Roof
from rooftop_core.io.pvsyst import read_ond, read_pan
from rooftop_core.project import Design, Project
from rooftop_core.resources import SAMPLE_OND, SAMPLE_PAN, sample_path
from tests.engine.same import assert_same_results
from tests.equipment import fixture_path, fixture_text

pytestmark = pytest.mark.slow

NAMES = ("manufacturer", "model", "source")


def small_project() -> Project:
    project = demo_project()
    project.roof = Roof(outline=rectangle(30.0, 14.0), lat=project.roof.lat, lon=project.roof.lon)
    project.roof.obstacles = [Obstacle("Tank", "cylinder", x=8.0, y=7.0, diameter=2.0, height=2.0)]
    project.system_voltage = 1500.0
    return project


def _data(equipment) -> dict:
    return {name: value for name, value in asdict(equipment).items() if name not in NAMES}


def test_the_demo_runs_on_the_bundled_equipment_under_its_real_names():
    design = Design(demo_project())

    assert (design.module.manufacturer, design.module.model) == (
        "INSOLATION GREEN ENERGY PVT. LTD.",
        "INA-144MHC-TF-560",
    )
    assert (design.inverter.manufacturer, design.inverter.model) == (
        "WattPower Systems Pvt.Ltd",
        "WP-330KTL-H1",
    )


def test_the_module_is_that_of_the_desktop_app_but_for_its_names():
    real, test = read_pan(sample_path(SAMPLE_PAN)), read_pan(fixture_path("Test.PAN"))

    assert _data(real) == _data(test)
    assert (test.manufacturer, test.model) == ("Test", "Test")


def test_the_inverter_is_that_of_the_desktop_app_but_for_its_names():
    real, test = read_ond(sample_path(SAMPLE_OND)), read_ond(fixture_path("Test-S.ond"))

    assert _data(real) == _data(test)
    assert (test.manufacturer, test.model) == ("Test-S", "Test-S")


def test_both_pairs_give_the_same_results():
    bundled = Design(small_project())
    project = small_project()
    project.pan_path, project.pan_text = "Test.PAN", fixture_text("Test.PAN")
    project.ond_path, project.ond_text = "Test-S.ond", fixture_text("Test-S.ond")
    desktop = Design(project)

    bundled.run_options()
    desktop.run_options()

    assert desktop.module.model == "Test" and bundled.module.model == "INA-144MHC-TF-560"
    assert len(bundled.options) > 0
    assert_same_results(bundled, desktop)


def test_the_bill_of_materials_names_the_real_equipment(demo_design):
    from rooftop_core import readouts

    lines = readouts.bill_of_materials(demo_design, demo_design.options[0])

    assert lines[0].spec == "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80"
    assert lines[1].spec == "WattPower Systems Pvt.Ltd WP-330KTL-H1, 275 kW, 6 MPPT"
