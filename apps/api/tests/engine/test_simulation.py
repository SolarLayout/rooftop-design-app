# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
import numpy as np
import pytest
from pvlib import irradiance, solarposition

from rooftop_core.simulation import Losses
from tests.equipment import fixture_path


def test_perez_matches_pvgis_in_plane(pune_weather):
    """Transposition within 1 % of PVGIS's own 2,003.4 kWh/m² at 15° south, Pune."""
    d = pune_weather.data
    import pandas as pd

    sp = solarposition.get_solarposition(d.index + pd.Timedelta(minutes=30), pune_weather.lat, pune_weather.lon)
    z, a = sp["apparent_zenith"].to_numpy(), sp["azimuth"].to_numpy()
    from pvlib import atmosphere

    poa = irradiance.get_total_irradiance(15, 180, z, a, d.dni.to_numpy(), d.ghi.to_numpy(), d.dhi.to_numpy(),
                                          dni_extra=irradiance.get_extra_radiation(d.index).to_numpy(),
                                          airmass=atmosphere.get_relative_airmass(z), albedo=0.2, model="perez")
    assert np.nansum(poa["poa_global"]) / 1000 == pytest.approx(2003.4, rel=0.01)


def test_demo_options_and_result(demo_design):
    d = demo_design
    o = d.chosen
    assert o.recommended and o.ok
    assert 1.10 <= o.dcac <= 1.30
    assert o.n_strings <= 24                          # MPPT current limit
    r = o.result
    assert 1600 < r.specific_yield < 1850
    assert 0.80 < r.pr < 0.92
    assert r.poa_kwh_m2 == pytest.approx(1998.0, abs=5)
    assert sum(r.monthly_mwh) == pytest.approx(r.energy_mwh, rel=1e-6)
    assert r.p_values[50] > r.p_values[75] > r.p_values[90]
    assert r.p_values[90] == pytest.approx(r.energy_mwh * (1 - 1.2816 * 0.0424), rel=1e-3)


def test_loss_chain_is_consistent(demo_design):
    steps = demo_design.chosen.result.steps
    energy = [s for s in steps if s.kind in ("energy_total", "energy")]
    for a, b in zip(energy, energy[1:], strict=False):
        if b.kind == "energy":
            assert b.value == pytest.approx(a.value * (1 + b.pct / 100), rel=1e-9)
    assert steps[-1].value == pytest.approx(demo_design.chosen.result.energy_mwh)


def test_lid_from_pan_by_default():
    from rooftop_core.io.pvsyst import read_pan

    m = read_pan(fixture_path("Test.PAN"))
    assert Losses().lid(m) == 0.2
    assert Losses(lid_pct=1.5).lid(m) == 1.5
