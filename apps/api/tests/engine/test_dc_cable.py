"""Each string's DC cable is sized for itself (issue 179, item 27): the smallest of 4, 6 and 10 mm² copper
that carries 1.25 times the module's Isc and drops no more than 1 % of the string's voltage at its maximum
power point."""

import pytest

from rooftop_core.bom import DC_CABLE_SIZES_MM2, CableRow, dc_cable_for, dc_cable_lines


def test_the_sizes_are_4_6_and_10_mm2():
    assert DC_CABLE_SIZES_MM2 == (4.0, 6.0, 10.0)


def test_a_short_run_takes_the_smallest_size():
    cable = dc_cable_for(length_m=40.0, isc_a=14.0, imp_a=13.2, vmp_v=1000.0)

    assert cable.mm2 == 4.0
    assert cable.drop_pct == pytest.approx(13.2 * 40.0 * 5.09e-3 * (1 + 0.00393 * 50) / 1000.0 * 100)
    assert cable.drop_pct < 1.0


def test_a_run_whose_drop_passes_1_pct_takes_the_next_size():
    four = dc_cable_for(length_m=140.0, isc_a=14.0, imp_a=13.2, vmp_v=1000.0)

    assert four.mm2 == 6.0
    assert four.drop_pct <= 1.0
    assert dc_cable_for(length_m=200.0, isc_a=14.0, imp_a=13.2, vmp_v=1000.0).mm2 == 10.0


def test_a_current_over_a_size_s_rating_takes_the_next_size():
    """1.25 × Isc against EN 50618's rating of two cables side by side on a surface: 44, 57 and 79 A."""
    assert dc_cable_for(length_m=10.0, isc_a=35.0, imp_a=33.0, vmp_v=1000.0).mm2 == 4.0
    assert dc_cable_for(length_m=10.0, isc_a=36.0, imp_a=34.0, vmp_v=1000.0).mm2 == 6.0
    assert dc_cable_for(length_m=10.0, isc_a=46.0, imp_a=44.0, vmp_v=1000.0).mm2 == 10.0


def test_a_run_no_size_holds_to_1_pct_takes_the_largest_and_says_its_drop():
    cable = dc_cable_for(length_m=400.0, isc_a=14.0, imp_a=13.2, vmp_v=1000.0)

    assert cable.mm2 == 10.0
    assert cable.drop_pct > 1.0


def test_the_bill_of_materials_sums_the_cable_of_each_size():
    def row(mm2: float, length_m: float) -> CableRow:
        return CableRow("S1", "INV-1", 1, 26, 1327.0, 14.3, length_m, f"{mm2:g} mm² Cu, 1000 V DC", mm2, 0.5)

    assert dc_cable_lines([row(6.0, 140.2), row(4.0, 40.4), row(4.0, 60.3)]) == [(4.0, 101), (6.0, 140)]
