"""The shading kept by what it depends on (D65) holds every value the dense arrays of the desktop app held.

The reference is the desktop app's algorithm as it was copied (rooftop-design at bf2cb67): hours × modules,
the obstacles' shadows met with every module their bounding box touches. It is kept here, and only here,
to prove the new form against it, cell for cell and bit for bit.
"""

import numpy as np
import pytest
import shapely

from rooftop_core import geometry, shading
from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Obstacle, Roof, casters_shadow, sky_loss_sectors
from rooftop_core.project import Design
from rooftop_core.weather import solar_position

pytestmark = pytest.mark.slow


def a_shaded_roof(orientation: str = "portrait") -> Design:
    """A 30 x 14 m roof at the demo's site with a parapet, a tank, a wall and a tree: shade of every kind."""
    project = demo_project()
    project.roof = Roof(outline=rectangle(30.0, 14.0), lat=project.roof.lat, lon=project.roof.lon)
    project.roof.obstacles = [
        Obstacle("Tank", "cylinder", x=8.0, y=7.0, diameter=2.0, height=2.0),
        Obstacle("Wall", "wall", points=[(20.0, 3.0), (24.0, 3.0), (24.0, 6.0)], height=1.5),
        Obstacle("Tree", "tree", x=27.0, y=11.0, diameter=2.5, height=4.0),
    ]
    project.array.orientation = orientation
    design = Design(project)
    design.generate_layout()
    design.load_weather()
    return design


def the_sun(design: Design, every: int = 3) -> tuple[np.ndarray, np.ndarray]:
    sun = solar_position(design.weather)
    return sun["apparent_elevation"].to_numpy()[::every], sun["azimuth"].to_numpy()[::every]


# ── the desktop app's algorithm, as copied ───────────────────────────────────
def desktop_object_fraction(layout, roof, elev, az) -> np.ndarray:
    mods = layout.modules
    out = np.zeros((len(elev), len(mods)), dtype=np.float32)
    casters = roof.all_casters()
    polys = np.array([m.poly for m in mods], dtype=object)
    areas = shapely.area(polys)
    tree = shapely.STRtree(polys)
    zkey = np.round(np.array([m.z_mid for m in mods]) / 0.05) * 0.05
    zgroups = {z: np.where(zkey == z)[0] for z in np.unique(zkey)}
    eb = np.round(elev / shading.EL_BIN).astype(int)
    ab = np.round(az / shading.AZ_BIN).astype(int)
    cache: dict = {}
    for h in np.where(elev > 0)[0]:
        key = (eb[h], ab[h])
        row = cache.get(key)
        if row is None:
            row = np.zeros(len(mods), dtype=np.float32)
            el_c, az_c = max(key[0] * shading.EL_BIN, 0.5), key[1] * shading.AZ_BIN
            for z, members in zgroups.items():
                sh = casters_shadow(casters, float(z), el_c, az_c)
                if sh is None or sh.is_empty:
                    continue
                cand = np.intersect1d(tree.query(sh), members, assume_unique=False)
                if len(cand):
                    row[cand] = shapely.area(shapely.intersection(polys[cand], sh)) / areas[cand]
            cache[key] = row
        out[h] = row
    return out


def desktop_row_fraction(layout, elev, az) -> np.ndarray:
    mods = layout.modules
    out = np.zeros((len(elev), len(mods)), dtype=np.float32)
    idx = [m.idx for m in mods if m.front is not None]
    sel = np.array(idx)
    H = np.array([mods[i].front[0] for i in idx])
    D = np.array([mods[i].front[1] for i in idx])
    beta = np.radians([mods[i].tilt for i in idx])
    gam = np.array([mods[i].azimuth for i in idx])
    u0 = np.array([mods[i].span[0] for i in idx])
    u1 = np.array([mods[i].span[1] for i in idx])
    L = np.array([mods[i].slope_len for i in idx])
    el = np.radians(np.clip(elev, 0.0, 90.0))[:, None]
    cosrel = np.cos(np.radians(az[:, None] - gam[None, :]))
    with np.errstate(divide="ignore", invalid="ignore"):
        tanpsi = np.where(cosrel > 1e-6, np.tan(el) / cosrel, np.inf)
        ustar = (H - D * tanpsi) / (np.sin(beta) + np.cos(beta) * tanpsi)
    ustar = np.clip(np.nan_to_num(ustar, nan=0.0, neginf=0.0, posinf=0.0), 0.0, L)
    frac = np.clip((ustar - u0) / (u1 - u0), 0.0, 1.0)
    out[:, sel] = np.where((elev[:, None] > 0) & (cosrel > 1e-6), frac, 0.0)
    return out


def desktop_dense(design: Design, elev, az) -> tuple[np.ndarray, np.ndarray]:
    """(f_lin, e_mod) as the desktop app kept them."""
    m, orientation = design.module, design.p.array.orientation
    f_row = desktop_row_fraction(design.layout, elev, az)
    f_obj = desktop_object_fraction(design.layout, design.p.roof, elev, az)
    f_lin = 1.0 - (1.0 - f_row) * (1.0 - f_obj)
    e_row = shading.electrical_rule(f_row, orientation, m.half_cell, m.n_diodes)
    e_obj = shading.electrical_rule(f_obj, orientation, m.half_cell, m.n_diodes)
    e_mod = np.maximum((1.0 - (1.0 - e_row) * (1.0 - e_obj)).astype(np.float32), f_lin)
    return f_lin.astype(np.float32), e_mod


def kept(design: Design, elev, az) -> shading.ShadingResult:
    return shading.compute(design.layout, design.p.roof, design.module, design.p.array.orientation, elev, az)


# ── the proofs ───────────────────────────────────────────────────────────────
@pytest.mark.parametrize("orientation", ["portrait", "landscape"])
def test_every_value_is_the_desktop_app_s_to_the_bit(orientation):
    design = a_shaded_roof(orientation)
    elev, az = the_sun(design)
    f_lin, e_mod = desktop_dense(design, elev, az)

    result = kept(design, elev, az)

    assert result.cell_hour.size > 0 and result.f_lin_class.max() > 0  # both kinds of shade are there
    np.testing.assert_array_equal(result.f_lin_of(), f_lin)
    np.testing.assert_array_equal(result.e_mod_of(), e_mod)


def test_what_is_kept_is_a_small_part_of_the_hours_by_modules():
    design = a_shaded_roof()
    elev, az = the_sun(design, every=1)

    result = kept(design, elev, az)

    dense = 2 * len(elev) * design.layout.n_modules * 4  # f_lin and e_mod as float32
    assert result.nbytes < dense / 5  # a small roof with three obstacles; at the limit a thousandth
    assert result.f_lin_class.shape[1] < 10  # a few classes of row, not one per module


def test_any_modules_in_any_order_are_the_columns_of_all():
    design = a_shaded_roof()
    elev, az = the_sun(design)
    result = kept(design, elev, az)
    chosen = [17, 3, 40, 2, 39]

    np.testing.assert_array_equal(result.f_lin_of(chosen), result.f_lin_of()[:, chosen])
    np.testing.assert_array_equal(result.e_mod_of(chosen), result.e_mod_of()[:, chosen])


def test_blocks_of_modules_give_what_all_at_once_gives(monkeypatch):
    design = a_shaded_roof()
    elev, az = the_sun(design)
    result = kept(design, elev, az)
    everyone = np.arange(result.n_modules)
    weights = np.linspace(0.0, 1.0, len(elev))[:, None]

    def by_column(e: np.ndarray) -> np.ndarray:
        # Each module's hours summed as a row of their own: the same bits whatever the width. (numpy's sums
        # down a 2-D axis, and BLAS's `weights @ e`, may round the last bit differently for another width;
        # the shade summary's `beam @ lit` is within D64's bar either way, and identical at BLOCK's width.)
        return np.ascontiguousarray((e.astype(float) * weights).T).sum(axis=1)

    whole = by_column(result.e_mod_of())

    monkeypatch.setattr(shading, "BLOCK", 7)

    np.testing.assert_array_equal(result.by_blocks(everyone, by_column, electrical=True), whole)


def test_the_sky_seen_in_blocks_of_points_is_the_sky_seen_at_once(monkeypatch):
    design = a_shaded_roof()
    points = np.array([m.center for m in design.layout.modules])
    z = np.array([m.z_mid for m in design.layout.modules])
    casters = design.p.roof.all_casters()
    at_once = sky_loss_sectors(points, z, casters)

    monkeypatch.setattr(geometry, "SKY_BLOCK", 5)

    np.testing.assert_array_equal(sky_loss_sectors(points, z, casters), at_once)


def test_the_shadows_of_all_prisms_at_once_are_each_prism_s_own():
    design = a_shaded_roof()
    solids = geometry.solids_of(design.p.roof.all_casters())
    prisms = geometry.prisms_of(solids)

    for z, elev, az in [(0.6, 35.0, 120.0), (1.2, 12.5, 250.0), (3.0, 60.0, 180.0), (0.6, -2.0, 90.0)]:
        vx, vy = geometry.shadow_vector(elev, az)
        alone = [
            s for fp, z0, z1 in solids if (s := geometry.prism_shadow(fp, z0, z1, z, vx, vy)) is not None
        ]
        at_once = geometry.prisms_shadow(prisms, z, elev, az)

        if elev <= 0:
            assert len(at_once) == 0
            continue
        assert len(at_once) == len(alone) > 0
        for mine, theirs in zip(at_once, alone, strict=True):
            assert mine.equals(theirs)  # the same shape (the hull may start at another corner)
