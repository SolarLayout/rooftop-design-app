"""The options simulated per string (D66): the strings' hours worked out once per length and shared, the loss
chain from the strings' means, the operating point solved once for each distinct lit pair."""

import numpy as np
import pytest

from rooftop_core import simulation
from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Obstacle, Roof
from rooftop_core.options import of_length
from rooftop_core.project import Design
from rooftop_core.stringing import PVString, assign, form_strings

pytestmark = pytest.mark.slow


def a_shaded_design() -> Design:
    """A 30 x 14 m roof at the demo's site with a tank: shaded and unshaded strings."""
    project = demo_project()
    project.roof = Roof(outline=rectangle(30.0, 14.0), lat=project.roof.lat, lon=project.roof.lon)
    project.roof.obstacles = [Obstacle("Tank", "cylinder", x=8.0, y=7.0, diameter=2.0, height=2.0)]
    design = Design(project)
    design.prepare()
    return design


@pytest.fixture(scope="module")
def design() -> Design:
    return a_shaded_design()


def physics_of(design: Design, strings: list[PVString]) -> simulation.StringPhysics:
    p = design.p
    return simulation.string_physics(design.pre, design.module, design.mm, strings, p.losses, p.roof)


def test_the_chain_s_irradiation_is_that_of_every_module_and_hour(design):
    """The desktop app's chain, per module and hour, summed: the strings' means give the same totals."""
    pre, losses, module = design.pre, design.p.losses, design.module
    strings = form_strings(design.layout, 10)
    physics = physics_of(design, strings)
    used = np.array([m for s in strings for m in s.modules])
    sh = pre.shading
    soil = 1.0 - losses.soiling_pct / 100.0
    rear_k = module.bifaciality * (1.0 - losses.rear_loss_pct / 100.0)
    sums = dict.fromkeys(simulation.CHAIN, 0.0)
    for gi, g in enumerate(pre.groups.values()):
        m_idx = used[pre.group_of[used] == gi]
        if not len(m_idx):
            continue
        beam, sky, gnd = g["beam"][:, None], g["sky"][:, None], g["gnd"][:, None]
        f, sk = sh.f_lin_of(m_idx).astype(float), sh.sky_loss[m_idx][None, :].astype(float)
        beam_far = beam * ~sh.far_block[:, None]
        b_iam = beam_far * (1 - f) * g["iam_b"][:, None]
        d_iam = sky * (1 - sk) * g["iam_d"] + gnd * (1 - sk) * g["iam_g"]
        sums["nom"] += float(np.broadcast_to(beam + sky + gnd, f.shape).sum())
        sums["far"] += float(np.broadcast_to(beam_far + sky + gnd, f.shape).sum())
        sums["lin"] += float((beam_far * (1 - f) + (sky + gnd) * (1 - sk)).sum())
        sums["iam"] += float((b_iam + d_iam).sum())
        sums["soil"] += float(((b_iam + d_iam) * soil).sum())
        sums["eff"] += float(((b_iam + d_iam) * soil + g["rear"][:, None] * rear_k).sum())

    for i, name in enumerate(simulation.CHAIN):
        assert physics.chain[i].sum() == pytest.approx(sums[name], rel=1e-9), name  # the modules in float32


def test_a_candidate_from_shared_hours_is_the_candidate_alone(design):
    held = of_length(design.pre, design.layout, design.module, design.mm, design.p.losses, design.p.roof, 10)
    system = assign(held.ranked[:3], 10, 1, design.inverter, design.layout)
    args = (
        design.pre,
        design.layout,
        design.module,
        design.mm,
        design.inverter,
        system,
        design.p.losses,
        design.p.roof,
    )

    shared, alone = simulation.simulate(*args, held.physics), simulation.simulate(*args)

    assert shared.energy_mwh == alone.energy_mwh
    assert shared.steps == alone.steps
    np.testing.assert_array_equal(shared.per_string_shade, alone.per_string_shade)


def test_the_operating_point_of_distinct_pairs_is_that_of_every_pair(design, monkeypatch):
    g = np.array([[0.0, 0.5, 800.0, 800.0], [800.0, 300.0, 300.0, 1000.0], [1.0, 999.9, 800.0, 0.9]])
    t = np.array([[25.0, 25.0, 40.0, 40.0], [40.0, 30.0, 30.0, 45.0], [20.0, 44.0, 41.0, 20.0]])
    monkeypatch.setattr(simulation, "MPP_CHUNK", 2)

    got = simulation._at_distinct(design.mm, g, t)
    every = design.mm.mpp(g.ravel(), t.ravel())

    for mine, theirs in zip(got, every, strict=True):
        np.testing.assert_allclose(mine.ravel(), theirs, rtol=1e-9, atol=0)
    assert got[0][0, 0] == 0.0 and got[0][2, 3] == 0.0  # dark: under 1 W/m²


def test_a_string_across_two_orientations_is_refused(design):
    first, other = design.layout.modules[0], design.layout.modules[1]
    design.pre.group_of = design.pre.group_of.copy()
    design.pre.group_of[other.idx] = design.pre.group_of[first.idx] + 1
    try:
        with pytest.raises(ValueError, match="two orientations"):
            physics_of(design, [PVString([first.idx, other.idx], 0, first.azimuth, first.center, 1.0)])
    finally:
        design.pre.group_of[other.idx] = design.pre.group_of[first.idx]
