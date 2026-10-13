"""The inverter a design's roof is given when the app chooses it (D118): of Waaree's on-grid inverters,
the one that keeps the most modules within the DC/AC target on the fewest inverters, without a simulation."""

import hashlib
import json
from pathlib import Path

import pytest

from rooftop_core import readouts
from rooftop_core.demo import PUNE, demo_project, rectangle
from rooftop_core.geometry import Roof
from rooftop_core.inverter_for_the_roof import (
    NEAR_THE_MOST,
    inverter_for_the_roof,
    pool_folder,
    roof_inverters,
)
from rooftop_core.placement import ArraySpec
from rooftop_core.project import Design, Project
from tests.kept import KEPT

LIBRARY = Path(__file__).resolve().parents[3] / "web" / "public" / "equipment"


def new_design(length: float, width: float, volts: float, inverter_by: str | None = "app") -> Project:
    """A flat roof at Pune as Find builds it: a new design's array, the demo's weather, no inverter file."""
    p = demo_project()
    p.roof = Roof(outline=rectangle(length, width), lat=PUNE[0], lon=PUNE[1])
    p.array = ArraySpec()
    p.system_voltage, p.system_voltage_by = volts, "app"
    p.inverter_by = inverter_by
    return p


def fit_of(length: float, width: float, volts: float):
    design = Design(new_design(length, width, volts))
    design.load_weather()
    design.generate_layout()
    return design, inverter_for_the_roof(design)


# ── the pool ─────────────────────────────────────────────────────────────────
def test_the_pool_is_waarees_on_grid_inverters_as_the_library_holds_them():
    pool = roof_inverters()
    catalog = json.loads((LIBRARY / "catalog.json").read_text())["inverters"]
    waaree = {entry["file"]: entry["sha256"] for entry in catalog if entry["maker"] == "Waaree Energies Ltd."}

    assert [name for name, _ in pool] == sorted(waaree)
    assert len(pool) == 38
    for name, _ in pool:
        bundled = (pool_folder() / name).read_bytes()
        assert hashlib.sha256(bundled).hexdigest() == waaree[name], name


# ── the choice ───────────────────────────────────────────────────────────────
def test_a_roof_of_40_by_30_m_at_1000_v_takes_one_waaree_3p_136k_with_every_position():
    design, fit = fit_of(40, 30, 1000.0)

    assert design.layout.n_modules == 288
    assert fit.file == "Waaree_3P-136K_75-136kW.OND"
    assert (fit.n_series * fit.n_strings, fit.n_inverters) == (288, 1)
    assert fit.dcac == pytest.approx(1.23, abs=0.005)


def test_at_600_v_the_same_roof_takes_two_smaller_inverters_within_the_target():
    _, fit = fit_of(40, 30, 600.0)

    assert fit.file == "Waaree_3P-75K_75-136kW.OND"
    assert fit.n_inverters == 2
    assert 1.10 <= fit.dcac <= 1.30


def test_a_large_roof_takes_few_large_inverters_not_many_small_ones():
    design, fit = fit_of(100, 80, 1000.0)

    assert fit.inverter.pnom_kw >= 100
    assert fit.n_inverters <= 10
    assert fit.n_series * fit.n_strings >= NEAR_THE_MOST * design.layout.n_modules


def test_a_small_roof_takes_a_small_inverter():
    _, fit = fit_of(12, 10, 1000.0)

    assert fit.inverter.pnom_kw < 10
    assert fit.n_inverters == 1


def test_a_roof_too_small_for_a_string_has_no_inverter_for_it():
    _, fit = fit_of(6, 5, 1000.0)

    assert fit is None


def test_without_a_system_voltage_nothing_is_chosen():
    design = Design(new_design(40, 30, 1000.0))
    design.p.system_voltage = None
    design.load_weather()
    design.generate_layout()

    assert inverter_for_the_roof(design) is None


# ── the run ──────────────────────────────────────────────────────────────────
@pytest.mark.slow
def test_a_design_whose_inverter_the_app_sets_runs_with_the_one_for_its_roof_and_opens_recommended():
    design = Design(new_design(40, 30, 1000.0), memo=KEPT)
    design.run_options()

    assert design.inverter.model == "3P-136K (75-136 kW)"
    assert design.inverter.source == "Waaree_3P-136K_75-136kW.OND"
    assert design.roof_fit is not None and design.inverter_is_the_roofs
    assert design.options[0].recommended


@pytest.mark.slow
def test_an_inverter_of_the_users_is_kept_and_the_roofs_is_offered_when_no_option_reaches_the_target():
    design = Design(new_design(40, 30, 1000.0, inverter_by="user"), memo=KEPT)
    design.run_options()

    assert design.inverter.model == "WP-330KTL-H1"
    assert not any(option.ok for option in design.options)
    assert design.roof_fit.file == "Waaree_3P-136K_75-136kW.OND"
    assert not design.inverter_is_the_roofs


@pytest.mark.slow
def test_an_inverter_of_the_users_within_the_target_is_offered_nothing():
    design = Design(demo_project(), memo=KEPT)
    design.run_options()

    assert design.inverter.model == "WP-330KTL-H1"
    assert design.roof_fit is None


def test_who_set_the_inverter_travels_in_the_file_and_a_file_of_before_is_the_users():
    written = new_design(40, 30, 1000.0).to_json()
    assert Project.from_json(written).inverter_by == "app"

    del written["inverter_by"]
    assert Project.from_json(written).inverter_by is None


# ── the words when no option reaches the target ──────────────────────────────
@pytest.mark.slow
def test_below_the_target_on_an_inverter_larger_than_the_roofs_array_says_so_and_the_power_that_suits_it():
    design = Design(new_design(40, 30, 1000.0, inverter_by="user"), memo=KEPT)
    design.run_options()

    below = readouts.below_target(design)

    assert below.title == "No option within the DC/AC target"
    assert below.message == (
        "This inverter's 275 kW is more than the roof's 167.04 kWp can fill: the best option "
        "reaches 0.61, and the target is 1.10 to 1.30."
    )
    assert (below.ac_kw_from, below.ac_kw_to) == pytest.approx((167.04 / 1.30, 167.04 / 1.10))


@pytest.mark.slow
def test_below_the_target_on_an_inverter_full_of_strings_says_how_many_it_takes():
    design = Design(new_design(100, 80, 1000.0, inverter_by="user"), memo=KEPT)
    design.run_options()

    below = readouts.below_target(design)

    assert below.message == (
        "This inverter takes at most 24 strings, 250.56 kWp, for its 275 kW: the best option "
        "reaches 0.91, and the target is 1.10 to 1.30."
    )


@pytest.mark.slow
def test_an_option_within_the_target_has_nothing_to_say():
    design = Design(new_design(40, 30, 1000.0), memo=KEPT)
    design.run_options()

    assert readouts.below_target(design) is None
