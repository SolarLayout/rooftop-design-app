# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
from rooftop_core.io.pvsyst import read_ond, read_pan
from rooftop_core.onediode import ModuleModel
from rooftop_core.resources import sample_path
from rooftop_core.stringing import max_strings_per_inverter, series_range, strings_per_mppt


def _parts():
    m = read_pan(sample_path("Test.PAN"))
    return m, read_ond(sample_path("Test-S.ond")), ModuleModel(m)


def test_series_range_pune_1500v():
    m, inv, mm = _parts()
    r = series_range(mm, inv, 1500, 11.93, 39.26, 25)
    assert (r.n_min, r.n_max, r.n_nominal) == (14, 29, 26)
    assert 29 * r.voc_cold < 1500 < 30 * r.voc_cold


def test_series_range_1000v():
    _, inv, mm = _parts()
    assert series_range(mm, inv, 1000, 11.93, 39.26, 25).n_max == 19


def test_mppt_parallel_limit():
    m, inv, _ = _parts()
    assert strings_per_mppt(m, inv) == 4          # 4 × 13.58 A ≤ 65 A < 5 × 13.58 A
    assert max_strings_per_inverter(m, inv) == 24
