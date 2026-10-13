"""The acceptance of Phase 8 (plan/phase-08-performance.md; plan/reference/demo-numbers.md, "Option A"): the
demo with soiling 3 % instead of 2 % answers 613.6 MWh, the soiling step −3.00 %, with the shading taken from
the memo and nothing of the roof worked out again. The number is checked here once; the browser compares with
the run."""

import pytest

from rooftop_core import memo
from rooftop_core.project import Design
from tests.kept import KEPT
from tools.reference import reference_demo

pytestmark = pytest.mark.slow

SOILING_3_MWH = 613.61
# A value printed with two decimals is at most half a step away from the value it was rounded from.
TWO_DECIMALS = 0.005


@pytest.fixture(scope="module")
def soiling_3(demo_design) -> Design:
    project = reference_demo()
    project.losses.soiling_pct = 3.0
    design = Design(project, memo=KEPT)
    design.generate_layout()
    design.run_options()
    return design


def test_the_energy_of_option_a_with_soiling_3(soiling_3):
    result = soiling_3.options[0].result

    assert soiling_3.options[0].key == "29x22x1"
    assert result.energy_mwh == pytest.approx(SOILING_3_MWH, abs=TWO_DECIMALS)


def test_the_soiling_step_is_3_percent_and_the_steps_before_it_unchanged(demo_design, soiling_3):
    before = {step.label: step for step in demo_design.options[0].result.steps}
    after = {step.label: step for step in soiling_3.options[0].result.steps}

    assert after["Soiling"].pct == pytest.approx(-3.0, abs=1e-9)
    assert before["Soiling"].pct == pytest.approx(-2.0, abs=1e-9)
    unchanged = (
        "Global horizontal irradiation",
        "Transposition to plane (15°)",
        "Far shading, horizon",
        "Near shading, linear",
        "IAM",
    )
    for label in unchanged:
        assert after[label] == before[label], label
    assert after["Energy to grid"].value < before["Energy to grid"].value


def test_the_shading_is_the_same_and_only_the_options_are_worked_out_again(demo_design, soiling_3):
    assert memo.shading_key(soiling_3) == memo.shading_key(demo_design)
    assert memo.options_key(soiling_3) != memo.options_key(demo_design)
    assert soiling_3.pre.shading is demo_design.pre.shading
