"""Designs with real PAN and OND files, for the paths the equipment of the demo never reaches.

The files are in tests/fixtures/equipment; its README says what each covers. A variant is a real file
with the lines named changed, made here in memory.
"""

import numpy as np
import pytest

from rooftop_core import readouts
from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Obstacle, Roof
from rooftop_core.project import Design
from rooftop_core.stringing import max_strings_per_inverter, strings_per_mppt
from tests.equipment import fixture_text
from tests.kept import KEPT

pytestmark = pytest.mark.slow

MONOFACIAL = "abi-ab340-72phc.PAN"  # also: not twin half-cell, states its Voc coefficient, no LID
BIFACIAL = "emmvee-e620hcbg132-t.PAN"  # also: states its Voc coefficient
CENTRAL = "sungrow-sg3300ud-20.OND"  # no current limit of any kind
STRING = "Test-S.ond"


def variant(name: str, line: str, changed: str) -> str:
    """The text of a fixture with one line changed. The line must be there once."""
    text = fixture_text(name)
    assert text.count(line) == 1, f"{line!r} is in {name} {text.count(line)} times"
    return text.replace(line, changed)


def design(pan: str | None = None, ond: str | None = None, volts: float = 1500.0, **texts: str) -> Design:
    """The small roof at the site of the demo with the equipment named, run to the end. Its shading and
    options are kept for the session: the same roof with the same equipment is not worked out again."""
    project = demo_project()
    project.roof = Roof(outline=rectangle(30.0, 14.0), lat=project.roof.lat, lon=project.roof.lon)
    project.roof.obstacles = [Obstacle("Tank", "cylinder", x=8.0, y=7.0, diameter=2.0, height=2.0)]
    project.system_voltage = volts
    if pan:
        project.pan_path, project.pan_text = pan, texts.get("pan_text") or fixture_text(pan)
    if ond:
        project.ond_path, project.ond_text = ond, texts.get("ond_text") or fixture_text(ond)
    run = Design(project, memo=KEPT)
    run.run_options()
    return run


def step(option, label: str):
    return next(s for s in option.result.steps if s.label.startswith(label))


@pytest.fixture(scope="module")
def bundled() -> Design:
    return design()


@pytest.fixture(scope="module")
def monofacial() -> Design:
    return design(pan=MONOFACIAL)


@pytest.fixture(scope="module")
def bifacial() -> Design:
    return design(pan=BIFACIAL)


@pytest.fixture(scope="module")
def central() -> Design:
    return design(ond=CENTRAL)


# ── a monofacial module ──────────────────────────────────────────────────────
def test_a_monofacial_module_has_no_rear_gain(monofacial, bundled):
    assert not monofacial.module.is_bifacial and monofacial.p.losses.bifacial
    assert step(monofacial.options[0], "Bifacial rear gain").pct == 0.0
    assert step(bundled.options[0], "Bifacial rear gain").pct > 3.0


def test_a_bifacial_module_gains_by_its_own_factor(bifacial, bundled):
    assert (bifacial.module.bifaciality, bundled.module.bifaciality) == (0.78, 0.80)
    gain, reference = (step(d.options[0], "Bifacial rear gain").pct for d in (bifacial, bundled))
    assert 0 < gain < reference


def test_switching_the_rear_gain_off_gives_a_bifacial_module_none():
    project_off = design(pan=BIFACIAL).p
    project_off.losses.bifacial = False
    off = Design(project_off, memo=KEPT)
    off.run_options()

    assert step(off.options[0], "Bifacial rear gain").pct == 0.0


# ── a module that is not twin half-cell ──────────────────────────────────────
def _beyond_linear(run: Design) -> np.ndarray:
    """The electrical losses of the hours and modules where they are more than the shaded area."""
    shading = run.pre.shading
    e_mod, f_lin = shading.e_mod_of(), shading.f_lin_of()
    return np.unique(e_mod[e_mod > f_lin + 1e-6])


def test_a_shaded_module_without_half_cells_is_lost_whole(monofacial):
    assert not monofacial.module.half_cell and monofacial.p.array.orientation == "portrait"
    assert list(_beyond_linear(monofacial)) == [1.0]


def test_a_shaded_twin_half_cell_module_is_lost_by_halves(bundled):
    """A half by the row in front and a half by an obstacle leave a quarter: 0.75 is lost."""
    assert bundled.module.half_cell
    assert list(_beyond_linear(bundled)) == [0.5, 0.75, 1.0]


# ── a Voc coefficient that the file states ───────────────────────────────────
@pytest.mark.parametrize(
    ("which", "mv", "pct"), [("monofacial", -131.0, -0.286), ("bifacial", -110.1, -0.224)]
)
def test_a_stated_coefficient_is_shown_as_the_file_has_it(which, mv, pct, request):
    coefficients = request.getfixturevalue(which).coeffs

    assert not coefficients.derived
    assert coefficients.mu_voc_mv == mv
    assert coefficients.mu_voc_pct == pytest.approx(pct, abs=0.0005)
    assert coefficients.warning == ""


def test_a_coefficient_that_is_worked_out_and_unusual_is_noted(bundled):
    assert bundled.coeffs.derived
    assert bundled.coeffs.warning.startswith("Voc coefficient -0.164 %/°C is outside the usual ")


def test_the_strings_are_sized_with_the_model_and_not_with_the_stated_coefficient(monofacial):
    """As in the desktop app. For this module the model is the more careful of the two."""
    module, rng = monofacial.module, monofacial.range
    by_the_stated = module.voc * (1 + monofacial.coeffs.mu_voc_pct / 100 * (rng.t_min - 25))

    assert rng.voc_cold == pytest.approx(47.85, abs=0.005)
    assert by_the_stated == pytest.approx(47.57, abs=0.005)
    assert rng.n_max == int(1500 // rng.voc_cold) == 31


# ── a module without a LID value ─────────────────────────────────────────────
def test_a_module_without_lid_gets_the_default_and_the_chain_does_not_name_the_file(monofacial, bundled):
    assert monofacial.module.lid_loss_pct is None
    assert monofacial.options[0].result.lid_pct == 1.5
    assert step(monofacial.options[0], "LID").label == "LID"
    assert step(monofacial.options[0], "LID").pct == pytest.approx(-1.5, abs=1e-6)
    assert step(bundled.options[0], "LID").label == "LID (PAN)"


# ── a central inverter, and an inverter without any current limit ────────────
def test_a_central_inverter_narrows_the_series_range_by_its_mppt_minimum(central, bundled):
    assert central.inverter.vmpp_min == 938.0
    assert (central.range.n_min, central.range.n_max) == (25, 29)
    assert (bundled.range.n_min, bundled.range.n_max) == (14, 29)
    assert {option.n_series for option in central.options} <= set(range(25, 30))


def test_a_roof_is_far_too_small_for_a_central_inverter_and_every_option_says_so(central):
    assert len(central.options) > 0
    assert all(not option.ok and option.note == "below target" for option in central.options)
    assert all(option.dcac < 0.05 for option in central.options)
    assert not any(option.recommended for option in central.options)
    assert all(option.result.energy_mwh >= 0 for option in central.options)


def test_without_any_current_limit_an_input_takes_one_string(central):
    inverter = central.inverter

    assert (inverter.imax_mppt_a, inverter.isc_max_mppt_a, inverter.idc_max_a) == (0.0, 0.0, 0.0)
    assert (inverter.mppt_current_limit, inverter.mppt_isc_limit) == (0.0, 0.0)
    assert strings_per_mppt(central.module, inverter) == 1
    assert max_strings_per_inverter(central.module, inverter) == 3


def test_a_limit_that_is_not_known_is_not_shown_as_zero(central):
    loads = readouts.mppt_loads(central, central.options[0])

    assert all(load.imp_limit_a is None and load.isc_limit_a is None for load in loads)
    assert all(not load.ok for load in loads), "not known is a matter to look at: an exclamation mark"
    assert all(load.imp_a == pytest.approx(load.strings * 13.58) for load in loads)


def test_the_note_on_the_options_says_that_the_limit_is_not_known(central):
    note = readouts.options_note(central)

    assert note.startswith(
        "Target DC/AC 1.10–1.30, warning above 1.40. The OND gives no current limit per MPPT: one string "
        "for each of its 5 inputs at most, 1 per MPPT, so one inverter takes 3 strings. Enter the "
        "datasheet value of the current per MPPT. The least shaded strings in a row are used first, "
        "then those across rows."
    )
    assert "≤ 0.0 A" not in note


def test_a_limit_entered_by_the_user_takes_the_place_of_the_missing_one():
    project = design(ond=CENTRAL).p
    project.imax_mppt_override = 30.0
    run = Design(project, memo=KEPT)
    run.run_options()

    loads = readouts.mppt_loads(run, run.options[0])
    assert strings_per_mppt(run.module, run.inverter) == 2
    assert all(load.imp_limit_a == 30.0 and load.ok for load in loads)
    assert "(2 × 13.58 A ≤ 30.0 A)" in readouts.options_note(run)


# ── an inverter that states its current per MPPT ─────────────────────────────
def test_a_current_per_mppt_in_the_file_is_the_limit():
    stated = variant(STRING, "    IMaxDC=390.0", "    IMaxDC=390.0\r\n    IMaxMPPT=40.0")

    run = design(ond=STRING, ond_text=stated)

    assert run.inverter.imax_mppt_a == 40.0 and run.inverter.mppt_current_limit == 40.0
    assert strings_per_mppt(run.module, run.inverter) == 2
    assert max_strings_per_inverter(run.module, run.inverter) == 12
    assert "(2 × 13.58 A ≤ 40.0 A), so one inverter takes 12 strings" in readouts.options_note(run)


# ── a voltage limit set by the equipment ─────────────────────────────────────
def test_a_module_rated_for_1000_v_limits_the_strings_of_a_1500_v_system():
    rated = variant("Test.PAN", "  VMaxIEC=1500", "  VMaxIEC=1000")

    run = design(pan="Test.PAN", pan_text=rated)

    assert (run.range.system_v, run.range.limit_v) == (1500.0, 1000.0)
    assert run.range.n_max == 19
    assert readouts.limit_note(run) == (
        "Limit 1000 V: the lowest of the system, module (1000 V) and inverter (1500 V) ratings."
    )
    assert all(option.n_series <= 19 for option in run.options)


def test_an_inverter_rated_for_1000_v_limits_them_as_well():
    rated = variant(STRING, "    VAbsMax=1500", "    VAbsMax=1000")

    run = design(ond=STRING, ond_text=rated)

    assert run.range.limit_v == 1000.0 and run.range.n_max == 19
    assert readouts.limit_note(run) == (
        "Limit 1000 V: the lowest of the system, module (1500 V) and inverter (1000 V) ratings."
    )


def test_the_cable_is_labelled_by_the_system_voltage_as_chosen_not_by_the_limit():
    """Decision D25."""
    rated = variant("Test.PAN", "  VMaxIEC=1500", "  VMaxIEC=1000")

    run = design(pan="Test.PAN", pan_text=rated)

    assert {row.size for row in readouts.cables(run, run.options[0])} == {"4 mm² Cu, 1500 V DC"}
