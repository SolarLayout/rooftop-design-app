"""The strings and inverters each length's options are made of: the most strings within the DC/AC target,
adding inverters when the target needs them; the strings that fill those inverters; every string."""

from rooftop_core.options import combos_of

# A 10 kW inverter with 2 inputs, 1 string an MPPT; 560 W modules: a string of 19 is 10.64 kWp, so two on one
# inverter are DC/AC 2.13, over the target, and the target is met by more inverters, not by fewer strings.
SMALL = {"smax": 2, "pac_w": 10_000.0, "module_w": 560.0}


def test_inverters_are_added_until_every_string_is_in_the_target():
    assert combos_of(19, 8, **SMALL)[0] == (19, 8, 7)  # 85.12 kWp on 70 kW: DC/AC 1.22


def test_every_string_in_the_target_on_more_inverters_and_on_the_fewest_that_take_them():
    # 84 kWp: DC/AC 1.20 on 7 inverters; on 5, the fewest whose inputs take 10 strings, 1.68.
    assert combos_of(15, 10, **SMALL) == [(15, 10, 7), (15, 10, 5)]


def test_a_large_inverter_takes_the_most_strings_the_target_allows():
    # The demo's: 275 kW, 24 strings; 22 strings of 29 are DC/AC 1.30, every string on 2 inverters 0.80.
    large = {"smax": 24, "pac_w": 275_000.0, "module_w": 560.0}

    assert combos_of(29, 27, **large) == [(29, 22, 1), (29, 24, 1), (29, 27, 2)]


def test_without_a_count_in_the_target_the_fills_and_every_string_are_offered():
    # 2 strings of 19 on one 10 kW inverter: 1 is 1.06, 2 are 2.13; no count is in the target.
    assert combos_of(19, 2, **SMALL) == [(19, 2, 1)]
