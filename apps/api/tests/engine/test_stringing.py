# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
import dataclasses

import pytest

from rooftop_core.io.pvsyst import read_ond, read_pan
from rooftop_core.onediode import ModuleModel
from rooftop_core.stringing import max_strings_per_inverter, series_range, strings_per_mppt
from tests.equipment import fixture_path


def _parts():
    m = read_pan(fixture_path("Test.PAN"))
    return m, read_ond(fixture_path("Test-S.ond")), ModuleModel(m)


def test_series_range_pune_1500v():
    m, inv, mm = _parts()
    r = series_range(mm, inv, 1500, 11.93, 39.26, 25)
    assert (r.n_min, r.n_max, r.n_nominal) == (14, 29, 26)
    assert 29 * r.voc_cold < 1500 < 30 * r.voc_cold


def test_an_entered_voc_coefficient_sizes_the_strings():
    _, inv, mm = _parts()
    model = series_range(mm, inv, 1500, 11.93, 39.26, 25)

    r = series_range(mm, inv, 1500, 11.93, 39.26, 25, mu_voc_pct=-0.29)

    assert r.voc_cold == pytest.approx(51.84, abs=0.01)
    assert (r.n_min, r.n_max_voc, r.n_max) == (14, 28, 28)
    assert (r.vmp_cold, r.vmp_hot, r.vmp_stc) == (model.vmp_cold, model.vmp_hot, model.vmp_stc)


def test_without_an_entered_coefficient_the_model_s_voc_sizes_the_strings():
    _, inv, mm = _parts()

    r = series_range(mm, inv, 1500, 11.93, 39.26, 25, mu_voc_pct=None)

    assert r.voc_cold == pytest.approx(51.04, abs=0.005)
    assert (r.n_max_voc, r.n_max) == (29, 29)


def test_series_range_1000v():
    _, inv, mm = _parts()
    assert series_range(mm, inv, 1000, 11.93, 39.26, 25).n_max == 19


def test_mppt_parallel_limit():
    m, inv, _ = _parts()
    assert strings_per_mppt(m, inv) == 4          # 4 × 13.58 A ≤ 65 A < 5 × 13.58 A
    assert max_strings_per_inverter(m, inv) == 24


def test_where_the_mppt_maximum_binds_the_message_names_it():
    """Found in V2 · 12: "At most N fit under 1500 V" named the voltage where the MPPT maximum bound."""
    _, inv, mm = _parts()
    narrow = dataclasses.replace(inv, vmpp_min=900.0, vmpp_max=950.0)

    r = series_range(mm, narrow, 1500, 11.93, 39.26, 25)

    assert r.n_max_mppt < r.n_max_voc and not r.ok
    assert r.message.endswith(f"At most {r.n_max} fit the inverter's 950 V MPPT maximum.")


def test_where_the_voltage_binds_the_message_names_it():
    _, inv, mm = _parts()
    high = dataclasses.replace(inv, vmpp_min=1400.0, vmpp_max=4000.0)

    r = series_range(mm, high, 1500, 11.93, 39.26, 25)

    assert r.n_max_voc <= r.n_max_mppt and not r.ok
    assert r.message.endswith(f"At most {r.n_max} fit under 1500 V.")
