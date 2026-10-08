"""The Pune demo gives the numbers of plan/reference/demo-numbers.md (desktop engine, commit bf2cb67)."""

import pytest

from rooftop_core.demo import demo_project
from rooftop_core.project import Design
from tests.kept import KEPT

pytestmark = pytest.mark.slow

OPTION_KEYS = ["29x22x1", "26x24x1", "28x22x1", "28x28x2", "29x27x2"]
MONTHLY_MWH = [62.0, 58.8, 68.4, 64.1, 54.9, 46.9, 31.5, 38.5, 37.5, 53.4, 53.5, 48.5]
P_VALUES_MWH = {50: 617.8, 75: 600.2, 90: 584.2}
# A value printed with one decimal is at most half a step away from the value it was rounded from.
ONE_DECIMAL = 0.05


def test_demo_runs_at_1500_v(demo_design):
    assert demo_design.p.system_voltage == 1500


def test_layout_of_the_demo(demo_design):
    layout = demo_design.layout

    assert layout.n_modules == 790
    assert layout.n_rows == 6
    assert layout.table_count == 28
    assert layout.pitch == pytest.approx(6.45, abs=1e-9)


def test_the_five_options_in_order(demo_design):
    assert [option.key for option in demo_design.options] == OPTION_KEYS


def test_option_a_is_recommended_and_chosen(demo_design):
    option = demo_design.options[0]

    assert demo_design.chosen is option
    assert option.recommended
    assert (option.n_series, option.n_strings, option.n_inverters) == (29, 22, 1)
    assert option.dc_kwp == pytest.approx(357.28, abs=1e-6)
    assert option.dcac == pytest.approx(1.30, abs=0.005)


def test_energy_of_option_a(demo_design):
    result = demo_design.options[0].result

    assert result.energy_mwh == pytest.approx(617.8, abs=0.1)
    assert result.pr * 100 == pytest.approx(86.6, abs=0.1)


def test_monthly_energy_of_option_a(demo_design):
    monthly = demo_design.options[0].result.monthly_mwh

    assert len(monthly) == 12
    for month, (got, expected) in enumerate(zip(monthly, MONTHLY_MWH, strict=True), start=1):
        assert got == pytest.approx(expected, abs=ONE_DECIMAL), f"month {month}"


def test_exceedance_values_of_option_a(demo_design):
    p_values = demo_design.options[0].result.p_values

    assert list(p_values) == [50, 75, 90]
    for level, expected in P_VALUES_MWH.items():
        assert p_values[level] == pytest.approx(expected, abs=ONE_DECIMAL), f"P{level}"


def test_without_a_system_voltage_nothing_is_sized_or_chosen():
    project = demo_project()
    project.system_voltage = None
    design = Design(project, memo=KEPT)

    layout = design.generate_layout()
    precomputed = design.prepare()

    assert layout.n_modules == 790
    assert (precomputed.shading.n_hours, precomputed.shading.n_modules) == (8760, 790)
    assert design.size_series() is None
    assert design.run_options() == []
    assert design.options == []
    assert design.chosen is None
    assert project.chosen_option == ""
    assert project.system_voltage is None
