# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
from rooftop_core.io.pvsyst import read_ond, read_pan
from tests.equipment import fixture_path


def test_pan_reads_one_diode_parameters():
    m = read_pan(fixture_path("Test.PAN"))
    assert m.pnom_w == 560 and m.n_cells_series == 72 and m.half_cell
    assert (m.length_m, m.width_m) == (2.277, 1.133)
    assert m.r_series == 0.207 and m.gamma == 1.018 and m.bifaciality == 0.8
    assert m.lid_loss_pct == 0.2
    assert m.mu_voc_mv == 0  # not in this file: derived by the one-diode model
    assert len(m.iam_profile) == 9


def test_ond_reads_curves_and_limits():
    inv = read_ond(fixture_path("Test-S.ond"))
    assert inv.pnom_kw == 275 and inv.n_mppt == 6 and inv.n_inputs == 28
    assert (inv.vmpp_min, inv.vmpp_max, inv.vmpp_nom, inv.vabs_max) == (500, 1500, 1080, 1500)
    assert sorted(inv.curves) == [930.0, 1189.0, 1300.0]
    assert inv.mppt_current_limit == 65.0  # IMaxDC 390 A over 6 MPPT (decision F2)
