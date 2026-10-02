"""The user's own option (decision 8): one at most, keyed "custom", simulated only when it can be built."""

import pytest

from rooftop_core import readouts
from rooftop_core.demo import demo_project
from rooftop_core.project import Design
from rooftop_core.resources import SAMPLE_OND, sample_path
from tests.kept import KEPT

pytestmark = pytest.mark.slow

OFFERED = ["29x22x1", "26x24x1", "28x22x1", "26x27x2", "28x25x2"]


def demo_with(custom, system_voltage: float | None = 1500.0, chosen: str = "") -> Design:
    project = demo_project()
    project.custom, project.system_voltage, project.chosen_option = custom, system_voltage, chosen
    design = Design(project, memo=KEPT)
    design.run_options()
    return design


@pytest.fixture(scope="module")
def same_as_b():
    return demo_with((26, 24, 1), chosen="custom")


# ── the key ──────────────────────────────────────────────────────────────────
def test_a_custom_equal_to_an_offered_option_is_a_sixth_option_keyed_custom(same_as_b):
    keys = [option.key for option in same_as_b.options]

    assert keys == [*OFFERED, "custom"]
    own = same_as_b.options[-1]
    assert (own.letter, own.custom, own.recommended) == ("F", True, False)
    assert (own.n_series, own.n_strings, own.n_inverters) == (26, 24, 1)
    assert not same_as_b.options[1].custom


def test_custom_chooses_the_custom_and_not_the_offered_option_it_equals(same_as_b):
    assert same_as_b.chosen is same_as_b.options[-1]
    assert same_as_b.p.chosen_option == "custom"


def test_a_custom_that_can_be_built_is_not_refused(same_as_b):
    assert same_as_b.custom_misfit is None
    assert readouts.custom_refused(same_as_b) is None


# ── refused ──────────────────────────────────────────────────────────────────
def test_a_custom_over_the_voc_limit_is_not_simulated_and_says_why():
    design = demo_with((35, 10, 1))

    assert [option.key for option in design.options] == OFFERED
    assert readouts.custom_refused(design) == readouts.Verdict(
        ok=False,
        title="35 in series does not fit at 1500 V",
        detail="At most 29 fit: Voc at 11.9 °C is 1,786 V, over the limit of 1500 V. "
        "Change your option or remove it.",
    )


def test_a_custom_kept_after_the_voltage_went_to_1000_v_is_refused_in_the_words_of_the_board():
    design = demo_with((29, 22, 1), system_voltage=1000.0, chosen="custom")

    assert not any(option.custom for option in design.options)
    assert readouts.custom_refused(design) == readouts.Verdict(
        ok=False,
        title="29 in series does not fit at 1000 V",
        detail="At most 19 fit: Voc at 11.9 °C is 1,480 V, over the limit of 1000 V. "
        "Change your option or remove it.",
    )


def test_a_refused_custom_that_was_chosen_leaves_the_first_option_chosen():
    design = demo_with((35, 10, 1), chosen="custom")

    assert design.p.chosen_option == "29x22x1"
    assert design.chosen is design.options[0]


def test_a_custom_under_the_mppt_minimum_is_refused():
    design = demo_with((12, 20, 1))

    assert [option.key for option in design.options] == OFFERED
    assert readouts.custom_refused(design) == readouts.Verdict(
        ok=False,
        title="12 in series does not fit at 1500 V",
        detail="At least 14 are needed: Vmp at 64.3 °C cell is 454 V, under the MPPT minimum of 500 V. "
        "Change your option or remove it.",
    )


def test_a_custom_with_fewer_strings_than_inverters_is_refused():
    design = demo_with((26, 3, 4))

    assert [option.key for option in design.options] == OFFERED
    assert readouts.custom_refused(design) == readouts.Verdict(
        ok=False,
        title="3 strings cannot fill 4 inverters",
        detail="Each inverter needs a string at least. Change your option or remove it.",
    )


def test_strings_beyond_what_the_roof_holds_are_cut_to_what_fits_before_they_are_counted():
    design = demo_with((29, 500, 30))

    assert readouts.custom_refused(design).title == "23 strings cannot fill 30 inverters"


def test_one_string_on_two_inverters_is_said_in_the_singular():
    design = demo_with((26, 1, 2))

    assert readouts.custom_refused(design).title == "1 string cannot fill 2 inverters"


def test_a_custom_over_the_mppt_maximum_is_refused_when_the_mppt_maximum_sets_the_longest_string():
    project = demo_project()
    text = open(sample_path(SAMPLE_OND), encoding="latin-1").read()
    assert "VMPPMax=1500" in text
    project.ond_path, project.ond_text = SAMPLE_OND, text.replace("VMPPMax=1500", "VMPPMax=1100")
    project.custom = (27, 10, 1)
    design = Design(project, memo=KEPT)
    design.run_options()

    assert design.range.n_max == design.range.n_max_mppt == 25 < design.range.n_max_voc
    assert not any(option.custom for option in design.options)
    assert readouts.custom_refused(design) == readouts.Verdict(
        ok=False,
        title="27 in series does not fit at 1500 V",
        detail="At most 25 fit: Vmp at 11.9 °C is 1,151 V, over the inverter's MPPT maximum of 1100 V. "
        "Change your option or remove it.",
    )


def test_when_no_length_fits_nothing_is_said_of_the_custom_and_it_is_not_simulated():
    design = demo_with((29, 22, 1), system_voltage=600.0)

    assert design.options == []
    assert design.custom_misfit is None
    assert readouts.custom_refused(design) is None


def test_without_a_voltage_nothing_is_said_of_the_custom():
    design = demo_with((29, 22, 1), system_voltage=None)

    assert design.options == [] and readouts.custom_refused(design) is None


# ── the strings the roof holds of each length ────────────────────────────────
def test_the_roof_of_the_demo_holds_so_many_strings_of_each_length_in_the_range(demo_design):
    held = readouts.strings_by_series(demo_design)

    assert [length.n_series for length in held] == list(range(14, 30))
    by_length = {length.n_series: length.strings for length in held}
    assert (by_length[29], by_length[26], by_length[14]) == (23, 27, 53)


def test_no_lengths_without_a_voltage_or_when_no_length_fits():
    assert readouts.strings_by_series(demo_with(None, system_voltage=None)) == []
    assert readouts.strings_by_series(demo_with(None, system_voltage=600.0)) == []
