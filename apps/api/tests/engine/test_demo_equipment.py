"""The demo's equipment. D24: it is bundled under its real names. D117: its module is Waaree's BiN-08-580,
no longer the Insolation file the desktop app ran with, whose temperature figures are not a real module's.

That file stays with the tests as the engine's reference module (tools/reference.py): it is the desktop
app's Test.PAN under its real names, and with Test-S.ond (the bundled inverter under its) every number is
the same."""

import re
from dataclasses import asdict
from pathlib import Path

import pytest

from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Obstacle, Roof
from rooftop_core.io.pvsyst import read_ond, read_pan
from rooftop_core.onediode import ModuleModel
from rooftop_core.project import Design, Project
from rooftop_core.resources import SAMPLE_OND, SAMPLE_PAN, sample_path
from tests.engine.same import assert_same_results
from tests.equipment import fixture_path, fixture_text
from tests.kept import KEPT
from tools.reference import REFERENCE_PAN, with_the_reference_module

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

    assert (design.module.manufacturer, design.module.model) == ("Waaree Energies Ltd.", "BiN-08-580")
    assert (design.inverter.manufacturer, design.inverter.model) == (
        "WattPower Systems Pvt.Ltd",
        "WP-330KTL-H1",
    )


def test_the_bundled_module_states_real_temperature_figures():
    """D117: the file gives its Voc coefficient, inside the usual range, so no note is shown."""
    module = read_pan(sample_path(SAMPLE_PAN))
    coefficients = ModuleModel(module).coefficients()

    assert (module.pnom_w, module.length_m, module.width_m) == (580.0, 2.278, 1.134)
    assert not coefficients.derived and coefficients.warning == ""
    assert round(coefficients.mu_voc_pct, 3) == -0.26


def test_the_reference_module_is_that_of_the_desktop_app_but_for_its_names():
    real, test = read_pan(REFERENCE_PAN), read_pan(fixture_path("Test.PAN"))

    assert _data(real) == _data(test)
    assert (real.manufacturer, real.model) == ("INSOLATION GREEN ENERGY PVT. LTD.", "INA-144MHC-TF-560")
    assert (test.manufacturer, test.model) == ("Test", "Test")


def test_the_inverter_is_that_of_the_desktop_app_but_for_its_names():
    real, test = read_ond(sample_path(SAMPLE_OND)), read_ond(fixture_path("Test-S.ond"))

    assert _data(real) == _data(test)
    assert (test.manufacturer, test.model) == ("Test-S", "Test-S")


def test_both_pairs_give_the_same_results():
    """The reference module with the bundled inverter, and the desktop app's pair, the same to the bit."""
    bundled = Design(with_the_reference_module(small_project()), memo=KEPT)
    project = small_project()
    project.pan_path, project.pan_text = "Test.PAN", fixture_text("Test.PAN")
    project.ond_path, project.ond_text = "Test-S.ond", fixture_text("Test-S.ond")
    desktop = Design(project, memo=KEPT)

    bundled.run_options()
    desktop.run_options()

    assert desktop.module.model == "Test" and bundled.module.model == "INA-144MHC-TF-560"
    assert bundled.inverter.model == "WP-330KTL-H1"
    assert len(bundled.options) > 0
    assert_same_results(bundled, desktop)


def test_the_bill_of_materials_names_the_real_equipment(demo_design):
    from rooftop_core import readouts

    lines = readouts.bill_of_materials(demo_design, demo_design.options[0])

    assert lines[0].spec == "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80"
    assert lines[1].spec == "WattPower Systems Pvt.Ltd WP-330KTL-H1, 275 kW, 6 MPPT"


def test_the_bundled_demo_recommends_an_option_in_the_target():
    """The demo as the app opens it (D117): 790 positions, one inverter, strings of 25 at 1500 V."""
    design = Design(demo_project(), memo=KEPT)
    design.generate_layout()
    options = design.run_options()

    assert len(design.layout.modules) == 790
    assert options[0].recommended and options[0].key == "25x24x1"
    assert options[0].result.energy_mwh == pytest.approx(586.4, abs=0.05)


HOME_VIEW = Path(__file__).resolve().parents[3] / "web" / "lib" / "home" / "home-view.ts"


def test_home_says_the_bundled_demos_figures():
    """Home's demo row and card (D120) quote the demo's capacity and energy as text: they are the engine's."""
    design = Design(demo_project(), memo=KEPT)
    options = design.run_options()
    view = HOME_VIEW.read_text(encoding="utf-8")
    kwp = re.search(r'kwp: "([\d.,]+)"', view).group(1)
    mwh = re.search(r'mwh: "([\d.,]+)"', view).group(1)

    assert kwp == f"{options[0].n_modules * design.module.pnom_w / 1000:.2f}"
    assert mwh == f"{options[0].result.energy_mwh:.1f}"
