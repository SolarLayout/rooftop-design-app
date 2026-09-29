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
