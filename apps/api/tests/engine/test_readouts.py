"""The words and tables the desktop app built in its window, now made by the engine."""

from dataclasses import replace
from types import SimpleNamespace

import pytest

from rooftop_core import readouts
from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Roof
from rooftop_core.project import Design
from tests.kept import KEPT

pytestmark = pytest.mark.slow


@pytest.fixture(scope="module")
def option_a(demo_design):
    return demo_design.options[0]


@pytest.fixture(scope="module")
def option_d(demo_design):
    return demo_design.options[3]


# ── waiting for the system voltage ───────────────────────────────────────────
def test_the_words_for_a_missing_system_voltage_are_those_of_the_inventory():
    assert readouts.CHOOSE_VOLTAGE == "Choose a system voltage to size the strings"
    assert readouts.CHOOSE_VOLTAGE_DETAIL == "600, 1000 or 1500 V. Nothing is sized until you choose."


# ── the verdict ──────────────────────────────────────────────────────────────
def test_the_verdict_of_option_a(demo_design, option_a):
    verdict = readouts.verdict(demo_design, option_a)

    assert verdict.ok
    # Vmp is that of the one-diode model (41.36 V), as on the desktop; the PAN file states 41.24 V.
    assert verdict.title == "29 in series fits: Vmp 1,199 V at STC, inverter nominal 1,080 V"
    hot = 29 * demo_design.range.vmp_hot
    assert verdict.detail == (
        f"Voc at 11.9 °C is 1,480 V (limit 1500 V); Vmp at 64.3 °C cell is {hot:,.0f} V (MPPT minimum "
        "500 V). 22 strings on 1 inverter(s), DC/AC 1.30."
    )


def test_the_verdict_of_an_option_below_target_says_so(demo_design, option_d):
    verdict = readouts.verdict(demo_design, option_d)

    assert not verdict.ok
    assert verdict.title.startswith("26 in series fits: Vmp 1,075 V at STC")
    assert verdict.detail.endswith("27 strings on 2 inverter(s), DC/AC 0.71 (below target).")


def test_the_verdict_when_no_length_fits():
    project = demo_project()
    project.roof = Roof(outline=rectangle(30.0, 14.0), lat=project.roof.lat, lon=project.roof.lon)
    project.system_voltage = 600.0
    project.t_max_override = 60.0
    project.ond_path, project.ond_text = "", ""
    design = Design(project)
    design.inverter.vmpp_min = 900.0
    design.generate_layout()
    design.run_options()

    verdict = readouts.verdict(design, None)

    assert design.options == []
    assert not verdict.ok
    assert verdict.title == "No string length fits this inverter"
    assert verdict.detail == design.range.message
    assert verdict.detail.startswith("No string length fits: at least ")
    assert verdict.detail.endswith(" fit under 600 V.")


# ── the captions of the options (decision 11) ────────────────────────────────
def captions(design) -> list[str]:
    return [readouts.caption(design, option) for option in design.options]


def test_the_captions_of_the_demo_at_1500_v(demo_design):
    assert captions(demo_design) == [
        "Recommended",
        "Fills the inverter",
        "Lower clipping",
        "Below target, 2 inverters",
        "Below target, 2 inverters",
    ]


def test_the_captions_of_the_demo_at_1000_v():
    project = demo_project()
    project.system_voltage = 1000.0
    design = Design(project, memo=KEPT)
    design.run_options()

    assert [option.key for option in design.options] == ["18x42x2", "19x37x2", "19x24x1", "18x24x1"]
    assert captions(design) == [
        "Below target, 2 inverters",
        "Below target, 2 inverters",
        "Below target",
        "Below target",
    ]


def test_an_option_outside_the_target_is_captioned_with_its_note(demo_design, option_a):
    heavy = replace(option_a, recommended=False, ok=False, note="heavy clipping")
    above = replace(option_a, recommended=False, ok=False, note="above target", n_inverters=3)

    assert readouts.caption(demo_design, heavy) == "Heavy clipping"
    assert readouts.caption(demo_design, above) == "Above target, 3 inverters"


def test_an_option_that_takes_every_string_its_inverters_take_fills_them(demo_design):
    two = replace(demo_design.options[1], n_strings=48, n_inverters=2)

    assert readouts.caption(demo_design, two) == "Fills the inverters"


def test_lower_clipping_needs_a_recommended_option_to_be_lower_than(demo_design):
    c = demo_design.options[2]
    alone = SimpleNamespace(options=[c], module=demo_design.module, inverter=demo_design.inverter)

    assert readouts.caption(alone, c) == ""


def test_an_option_in_target_with_no_lower_clipping_has_no_caption(demo_design, option_a):
    second = replace(option_a, recommended=False)

    assert readouts.caption(demo_design, second) == ""


# ── notes ────────────────────────────────────────────────────────────────────
def test_the_limit_note_names_the_three_ratings(demo_design):
    assert readouts.limit_note(demo_design) == (
        "Limit 1500 V: the lowest of the system, module (1500 V) and inverter (1500 V) ratings."
    )


def test_the_note_on_the_options(demo_design):
    assert readouts.options_note(demo_design) == (
        "Target DC/AC 1.10–1.30, warning above 1.40. At most 4 strings per MPPT (4 × 13.58 A ≤ 65.0 A), "
        "so one inverter takes 24 strings. The least shaded strings are used first. "
        "! D: DC/AC 0.71, below target; E: DC/AC 0.71, below target."
    )


def test_the_note_on_far_shading(demo_design, pune_weather):
    from dataclasses import replace

    assert readouts.far_shading_note(pune_weather) == "Far shading: PVGIS horizon, highest 2.7°"
    assert readouts.far_shading_note(replace(pune_weather, horizon=[])) == (
        "Far shading: no horizon profile for this weather source"
    )


# ── the load of every MPPT ───────────────────────────────────────────────────
def test_the_mppts_of_option_a(demo_design, option_a):
    loads = readouts.mppt_loads(demo_design, option_a)

    assert [load.label for load in loads] == [f"INV-1 · MPPT {n}" for n in range(1, 7)]
    assert [load.strings for load in loads] == [4, 4, 4, 4, 3, 3]
    assert [(load.inverter, load.mppt) for load in loads] == [(1, n) for n in range(1, 7)]
    first = loads[0]
    assert first.imp_a == pytest.approx(4 * 13.58) and first.imp_limit_a == pytest.approx(65.0)
    assert first.isc_a == pytest.approx(4 * 14.30) and first.isc_limit_a == pytest.approx(65.0)
    assert first.kwp == pytest.approx(4 * 29 * 0.560)
    assert all(load.ok for load in loads)
    assert sum(load.kwp for load in loads) == pytest.approx(357.28)


def test_an_mppt_without_strings_is_left_out(demo_design, option_d):
    loads = readouts.mppt_loads(demo_design, option_d)

    assert sum(load.strings for load in loads) == 27
    assert all(load.strings > 0 for load in loads)
    assert {load.inverter for load in loads} == {1, 2}


# ── bill of materials, cable schedule, summary ───────────────────────────────
def test_the_bill_of_materials_of_option_a(demo_design, option_a):
    lines = readouts.bill_of_materials(demo_design, option_a)

    assert [(line.item, line.qty, line.unit) for line in lines] == [
        ("PV module", 638, "pcs"),
        ("String inverter", 1, "pcs"),
        ("Mounting structure", 27, "tables"),
        ("DC cable", 1681, "m"),
        ("DC connector pair", 44, "pairs"),
        ("AC cable", 30, "m"),
        ("AC distribution board", 1, "pcs"),
    ]


def test_the_cable_schedule_of_option_a(demo_design, option_a):
    rows = readouts.cables(demo_design, option_a)

    assert [row.string for row in rows] == [f"S{n}" for n in range(1, 23)]
    assert {row.inverter for row in rows} == {"INV-1"}
    assert rows[0].voc_cold_v == pytest.approx(1480, abs=0.5)
    assert {row.size for row in rows} == {"4 mm² Cu, 1500 V DC"}


@pytest.fixture(scope="module")
def entered_design():
    """The demo with the Voc coefficient of a datasheet entered: −0.29 %/°C."""
    project = demo_project()
    project.voc_coefficient_pct = -0.29
    design = Design(project, memo=KEPT)
    design.run_options()
    return design


def _longest(design):
    return max(design.options, key=lambda option: option.n_series)


def test_an_entered_voc_coefficient_gives_the_verdict_its_voc(entered_design):
    rng, option = entered_design.range, _longest(entered_design)

    verdict = readouts.verdict(entered_design, option)

    assert rng.voc_cold == pytest.approx(51.84, abs=0.01)
    assert option.n_series == 28
    assert verdict.detail.startswith("Voc at 11.9 °C is 1,452 V (limit 1500 V); ")


def test_an_entered_voc_coefficient_gives_the_cable_schedule_its_voc(entered_design):
    option = _longest(entered_design)

    rows = readouts.cables(entered_design, option)

    assert all(row.voc_cold_v == pytest.approx(28 * 51.84, abs=0.3) for row in rows)
    assert rows[0].voc_cold_v == 28 * entered_design.range.voc_cold


def test_the_summary_has_the_fourteen_rows_of_the_desktop(demo_design, option_a):
    rows = dict(readouts.summary(demo_design, option_a))

    assert list(rows) == [
        "Site",
        "Roof",
        "Structure",
        "Module",
        "Inverter",
        "Stringing",
        "DC capacity",
        "AC capacity",
        "Weather",
        "Losses",
        "Energy, year 1",
        "Specific yield",
        "Module area",
        "CO₂ avoided",
    ]
    assert rows["Stringing"] == "29 in series × 22 strings on 1 inverter(s)"
    assert rows["DC capacity"] == "357.28 kWp (638 modules)"
    assert rows["Losses"] == "Clipping 3.4 % · LID 0.20 % · uncertainty σ 4.24 %"
    assert rows["Energy, year 1"] == "P50 617.8 MWh · P75 600.2 MWh · P90 584.2 MWh"
    assert rows["Module area"] == "1,646 m² · 45.7 % of the roof"
    assert rows["CO₂ avoided"] == "442.4 t/yr at 0.716 t/MWh"


def test_the_read_outs_of_an_option_that_is_not_the_chosen_one(demo_design, option_d):
    chosen_before = demo_design.p.chosen_option

    rows = dict(readouts.summary(demo_design, option_d))
    lines = readouts.bill_of_materials(demo_design, option_d)

    assert rows["Stringing"] == "26 in series × 27 strings on 2 inverter(s)"
    assert rows["DC capacity"] == "393.12 kWp (702 modules)"
    assert (lines[0].qty, lines[1].qty) == (702, 2)
    assert demo_design.p.chosen_option == chosen_before, "the design is only read"
