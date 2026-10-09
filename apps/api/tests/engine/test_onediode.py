# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
import pytest

from rooftop_core.io.pvsyst import read_pan
from rooftop_core.onediode import ModuleModel
from tests.equipment import fixture_path


@pytest.fixture(scope="module")
def mm():
    return ModuleModel(read_pan(fixture_path("Test.PAN")))


def test_reproduces_stc(mm):
    p, v, _ = mm.mpp(1000, 25)
    assert p[0] == pytest.approx(560.0, abs=0.5)
    assert mm.voc(1000, 25)[0] == pytest.approx(49.95, abs=0.01)


def test_derived_coefficients_match_the_pan_target(mm):
    c = mm.coefficients()
    assert c.derived
    assert c.mu_pmpp_pct == pytest.approx(-0.21, abs=0.01)   # PAN muPmpReq −0.210
    assert c.mu_voc_pct == pytest.approx(-0.164, abs=0.003)
    assert c.warning  # outside −0.35 … −0.20 %/°C (decision O1)


def test_an_entered_voc_coefficient_is_the_coefficient_and_has_no_warning(mm):
    model = mm.coefficients()

    c = mm.coefficients(mu_voc_pct=-0.29)

    assert c.entered and not c.derived
    assert c.mu_voc_pct == -0.29
    assert c.mu_voc_mv == pytest.approx(-0.29 / 100 * 49.95 * 1000)
    assert c.warning == ""
    assert (c.mu_vmp_pct, c.mu_pmpp_pct) == (model.mu_vmp_pct, model.mu_pmpp_pct)


def test_without_an_entered_coefficient_nothing_is_entered(mm):
    assert not mm.coefficients().entered


def test_voc_cold_is_the_model_s_or_the_datasheet_s_with_an_entered_coefficient(mm):
    assert mm.voc_cold(11.93) == pytest.approx(float(mm.voc(1000, 11.93)[0]))
    assert mm.voc_cold(11.93) == pytest.approx(51.04, abs=0.005)
    # IEC 62548-1 Annex F: Voc(Tmin) = Voc,STC × (1 + μ/100 × (Tmin − 25)).
    assert mm.voc_cold(11.93, mu_voc_pct=-0.29) == pytest.approx(49.95 * (1 + -0.29 / 100 * (11.93 - 25)))
    assert mm.voc_cold(11.93, mu_voc_pct=-0.29) == pytest.approx(51.84, abs=0.01)


def test_the_coefficient_that_sizes_is_the_model_s_even_when_the_file_states_one(mm):
    # #179, item 15: cold Voc is the one-diode model's unless one is entered, so the coefficient the strings
    # are sized with is the model's, whatever the PAN states for the module card.
    from dataclasses import replace

    stated = ModuleModel(replace(mm.m, mu_voc_mv=-0.28 / 100 * 49.95 * 1000))

    assert stated.coefficients().mu_voc_pct == pytest.approx(-0.28)  # the card shows the file's
    assert stated.sizing_voc_coefficient_pct() == pytest.approx(-0.164, abs=0.003)  # the strings are sized so
    assert stated.sizing_voc_coefficient_pct(-0.29) == -0.29  # an entered one sizes them
