"""The figures after the year (Phase 8, decision 5): the uncertainty, the exceedance values, the 25 years
and the CO2 follow from the year's energy and nothing of the hours. They are worked out after the options
come from the memo, so a change of one of them simulates nothing, and answers what a simulation would.
"""

import dataclasses

import pytest

from rooftop_core import memo
from rooftop_core.demo import demo_project
from rooftop_core.project import Design, Project
from rooftop_core.simulation import after_the_year, simulate
from tests.engine.same import assert_same_results
from tests.kept import KEPT

pytestmark = pytest.mark.slow

CHANGES = [
    ("degradation_pct", 0.7),
    ("co2_t_per_mwh", 0.8),
    ("p_levels", (50, 90, 99)),
    ("weather_sigma_pct", 5.0),
    ("model_sigma_pct", 1.0),
]
# A value printed with one decimal is at most half a step away from the value it was rounded from.
ONE_DECIMAL = 0.05


def demo_with(name: str, value) -> Project:
    project = demo_project()
    assert getattr(project.losses, name) != value, f"{name} is {value} already"
    setattr(project.losses, name, value)
    return project


def run(project: Project, kept: memo.Memo) -> Design:
    design = Design(project, memo=kept)
    design.run_options()
    return design


@pytest.fixture(scope="module")
def simulating() -> memo.MemoryMemo:
    """A memo with the shading of the session and room for no options: every option is simulated."""
    every_time = memo.MemoryMemo(options_bytes=0)
    every_time.shadings = KEPT.shadings
    return every_time


# ── the same answer with the memo and with every option simulated ────────────
@pytest.mark.parametrize(("name", "value"), CHANGES, ids=[name for name, _ in CHANGES])
def test_a_change_answers_from_the_memo_what_a_simulation_gives(demo_design, simulating, name, value):
    from_the_memo = run(demo_with(name, value), KEPT)

    assert_same_results(from_the_memo, run(demo_with(name, value), simulating))


def test_after_the_year_on_a_result_straight_from_simulate_changes_nothing(demo_design):
    design, option = demo_design, demo_design.options[0]
    fresh = simulate(
        design.pre,
        design.layout,
        design.module,
        design.mm,
        design.inverter,
        option.system,
        design.p.losses,
        design.p.roof,
    )

    again = after_the_year(fresh, design.p.losses)

    assert again is not fresh
    for name in ("sigma_pct", "p_values", "years", "co2_t"):
        assert getattr(again, name) == getattr(fresh, name) == getattr(option.result, name), name
    assert dataclasses.replace(again, hourly=None) == dataclasses.replace(fresh, hourly=None)
    assert again.hourly is fresh.hourly


# ── the figures of the demo ──────────────────────────────────────────────────
def test_the_figures_after_the_year_of_option_a(demo_design):
    result = demo_design.options[0].result

    assert result.sigma_pct == pytest.approx(4.2426, abs=0.00005)
    assert result.co2_t == pytest.approx(442.37, abs=0.005)
    assert result.years[-1] == pytest.approx(547.8, abs=ONE_DECIMAL)
    assert sum(result.years) == pytest.approx(14553.8, abs=ONE_DECIMAL)


@pytest.mark.parametrize(
    ("name", "value", "figure", "expected"),
    [
        ("degradation_pct", 0.7, lambda result: result.years[-1], 522.0),
        ("degradation_pct", 0.7, lambda result: sum(result.years), 14215.6),
        ("co2_t_per_mwh", 0.8, lambda result: result.co2_t, 494.3),
        ("p_levels", (50, 90, 99), lambda result: result.p_values[99], 556.9),
        ("weather_sigma_pct", 5.0, lambda result: result.p_values[75], 593.5),
        ("weather_sigma_pct", 5.0, lambda result: result.p_values[90], 571.7),
        ("model_sigma_pct", 1.0, lambda result: result.sigma_pct, 3.1623),
    ],
    ids=["year 25", "25 years", "CO2", "P99", "P75", "P90", "sigma"],
)
def test_the_figures_of_option_a_after_a_change(demo_design, name, value, figure, expected):
    result = run(demo_with(name, value), KEPT).options[0].result

    assert result.energy_mwh == demo_design.options[0].result.energy_mwh
    assert figure(result) == pytest.approx(expected, abs=ONE_DECIMAL)
