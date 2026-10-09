"""The sky a module loses, and the part of it that is the far horizon's (issue 179, item 24): the loss
chain books the horizon's part under far shading, and only the rest under near shading."""

import numpy as np
import pytest

from rooftop_core.geometry import Obstacle, horizon_sky_loss, sky_loss_sectors

A_RIDGE_TO_THE_EAST = [(0.0, 0.0), (60.0, 0.0), (90.0, 20.0), (120.0, 0.0), (360.0, 0.0)]


def test_no_horizon_hides_no_sky():
    assert horizon_sky_loss(None) == 0.0
    assert horizon_sky_loss([]) == 0.0


def test_a_level_horizon_hides_sin_squared_of_its_height():
    assert horizon_sky_loss([(0.0, 10.0), (180.0, 10.0)]) == pytest.approx(np.sin(np.radians(10.0)) ** 2)


def test_with_nothing_on_the_roof_every_point_loses_the_horizon_s_sky_alone():
    points = np.array([[0.0, 0.0], [5.0, 3.0]])

    lost = sky_loss_sectors(points, np.zeros(2), [], A_RIDGE_TO_THE_EAST)

    assert lost == pytest.approx([horizon_sky_loss(A_RIDGE_TO_THE_EAST)] * 2, abs=1e-12)
    assert horizon_sky_loss(A_RIDGE_TO_THE_EAST) > 0.0


def test_an_obstacle_adds_to_the_horizon_s_sky_never_takes_from_it():
    points = np.array([[0.0, 0.0], [40.0, 0.0]])
    tank = Obstacle("Tank", "cylinder", x=2.0, y=0.0, diameter=2.0, height=3.0)

    lost = sky_loss_sectors(points, np.zeros(2), [tank], A_RIDGE_TO_THE_EAST)

    assert lost[0] > horizon_sky_loss(A_RIDGE_TO_THE_EAST)
    assert lost[1] >= horizon_sky_loss(A_RIDGE_TO_THE_EAST)
