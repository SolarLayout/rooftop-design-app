"""What near and far shading cost over the year, for every position and for a choice of them."""

import numpy as np
import pytest

from rooftop_core import shade_summary

pytestmark = pytest.mark.slow


def _step(option, label: str) -> float:
    return next(step.pct for step in option.result.steps if step.label.startswith(label))


def test_the_modules_of_an_option_lose_what_its_loss_chain_says(demo_design):
    for option in demo_design.options:
        used = option.system.module_indices()

        summary = shade_summary.summarise(demo_design.pre, used)

        assert -summary.near_pct == pytest.approx(_step(option, "Near shading"), abs=1e-3), option.key
        assert -summary.far_pct == pytest.approx(_step(option, "Far shading"), abs=1e-3), option.key


def test_option_a_of_the_demo_loses_what_the_reference_says(demo_design):
    summary = shade_summary.summarise(demo_design.pre, demo_design.options[0].system.module_indices())

    assert summary.near_pct == pytest.approx(0.35, abs=0.005)
    assert summary.far_pct == pytest.approx(0.01, abs=0.005)


def test_every_position_has_its_own_loss(demo_design):
    summary = shade_summary.summarise(demo_design.pre)

    assert summary.modules == list(range(790))
    assert summary.near_pct_by_module.shape == (790,)
    assert np.isfinite(summary.near_pct_by_module).all()
    assert (summary.near_pct_by_module >= 0).all() and (summary.near_pct_by_module < 100).all()
    assert summary.near_pct_by_module.min() < summary.near_pct < summary.near_pct_by_module.max()


def test_all_positions_lose_more_than_the_least_shaded_strings(demo_design):
    everywhere = shade_summary.summarise(demo_design.pre)
    chosen = shade_summary.summarise(demo_design.pre, demo_design.options[0].system.module_indices())

    assert everywhere.near_pct > chosen.near_pct
    assert everywhere.far_pct == pytest.approx(chosen.far_pct, abs=1e-3), "the horizon is the same for all"


def test_a_position_next_to_the_stair_room_loses_more_than_one_in_the_open(demo_design):
    losses = shade_summary.summarise(demo_design.pre).near_pct_by_module
    centres = np.array([module.center for module in demo_design.layout.modules])
    stair_room = np.array([22.5, 18.0])
    distance = np.hypot(*(centres - stair_room).T)

    assert losses[distance < 6.0].mean() > 2 * losses[distance > 20.0].mean()


def test_the_loss_of_a_choice_is_that_of_its_positions(demo_design):
    everywhere = shade_summary.summarise(demo_design.pre)
    some = shade_summary.summarise(demo_design.pre, [5, 6, 400])

    assert some.modules == [5, 6, 400]
    assert some.near_pct_by_module == pytest.approx(everywhere.near_pct_by_module[[5, 6, 400]])


def test_no_positions_lose_nothing(demo_design):
    summary = shade_summary.summarise(demo_design.pre, [])

    assert (summary.near_pct, summary.far_pct, len(summary.near_pct_by_module)) == (0.0, 0.0, 0)
