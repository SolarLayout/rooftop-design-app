"""POST /design: the whole run in one request, with its progress on the way and the result at the end."""

import copy

import pytest

from tests.api.conftest import error_of
from tests.api.events import events_of, result_of

pytestmark = pytest.mark.slow

FITTING = "Fitting modules on the roof"
WEATHER = "Loading PVGIS TMY weather"
SHADING = "Computing hourly shading for every module"
LOSSES = "Applying the losses"
OPTIONS = "Sizing strings and simulating the options"
ONE_DECIMAL = 0.05


def small(project: dict, system_voltage: int | None = 1500) -> dict:
    """The demo on a roof of 30 x 14 m with one tank: a run takes a second or two."""
    project = copy.deepcopy(project)
    project["roof"]["outline"] = [[0, 0], [30, 0], [30, 14], [0, 14]]
    project["roof"]["obstacles"] = [
        {"name": "Tank", "kind": "cylinder", "x": 8.0, "y": 7.0, "diameter": 2.0, "height": 2.0}
    ]
    project["system_voltage"] = system_voltage
    return project


@pytest.fixture(scope="module")
def demo_run(client, _demo):
    """The demo at 1500 V, run once."""
    response = client.post("/design", json=_demo)
    assert response.status_code == 200
    return response


@pytest.fixture(scope="module")
def demo_result(demo_run):
    return result_of(demo_run)


@pytest.fixture(scope="module")
def option_a(demo_result):
    return demo_result["options"][0]


@pytest.fixture(scope="module")
def waiting_run(client, _demo):
    """The small roof without a system voltage, run once."""
    return client.post("/design", json=small(_demo, system_voltage=None))


@pytest.fixture(scope="module")
def waiting_result(waiting_run):
    return result_of(waiting_run)


# ── the stream ───────────────────────────────────────────────────────────────
def test_the_answer_is_a_stream_of_events_that_ends_with_the_result(demo_run):
    events = events_of(demo_run)

    assert demo_run.headers["content-type"].startswith("text/event-stream")
    assert [event.name for event in events[:-1]] == ["progress"] * (len(events) - 1)
    assert events[-1].name == "result"
    assert list(events[-1].data) == ["type", "result"] and events[-1].data["type"] == "result"


def steps_of(response) -> list[str]:
    """The steps of a run in the order they began: a step that reports again is named once."""
    steps = [event.data["step"] for event in events_of(response) if event.name == "progress"]
    return [step for n, step in enumerate(steps) if n == 0 or step != steps[n - 1]]


def test_progress_names_the_steps_of_the_engine_in_order(demo_run):
    progress = [event.data for event in events_of(demo_run) if event.name == "progress"]

    assert all(list(event) == ["type", "step", "fraction"] for event in progress)
    assert steps_of(demo_run) == [FITTING, SHADING, LOSSES, OPTIONS]
    fractions = [event["fraction"] for event in progress]
    assert fractions == sorted(fractions) and fractions[0] == 0.0 and fractions[-1] == 1.0
    assert all(fraction < 1.0 for fraction in fractions[:-1])


def test_the_weather_of_the_project_is_not_loaded_again(demo_run):
    assert WEATHER not in [event.data.get("step") for event in events_of(demo_run)]


# ── the demo at 1500 V ───────────────────────────────────────────────────────
def test_the_result_has_its_parts(demo_result):
    assert list(demo_result) == [
        "layout",
        "readouts",
        "weather",
        "weather_notes",
        "far_shading_note",
        "shading",
        "equipment",
        "sizing",
        "series_range",
        "strings_by_series",
        "options",
        "options_note",
        "custom_refused",
        "chosen_option",
        "no_options",
    ]


def test_the_layout_is_that_of_the_layout_route(client, demo, demo_result):
    alone = client.post("/layout", json=demo).json()

    assert demo_result["layout"] == alone["layout"]
    assert demo_result["readouts"] == alone["readouts"]


def test_the_five_options_of_the_demo(demo_result):
    options = demo_result["options"]

    assert [o["key"] for o in options] == ["29x22x1", "26x24x1", "28x22x1", "26x27x2", "28x25x2"]
    assert [o["letter"] for o in options] == list("ABCDE")
    assert [o["n_modules"] for o in options] == [638, 624, 616, 702, 700]
    assert [o["dc_kwp"] for o in options] == pytest.approx([357.28, 349.44, 344.96, 393.12, 392.00])
    assert [round(o["dcac"], 2) for o in options] == [1.30, 1.27, 1.25, 0.71, 0.71]
    assert [o["ok"] for o in options] == [True, True, True, False, False]
    assert [o["note"] for o in options] == ["", "", "", "below target", "below target"]
    assert [o["recommended"] for o in options] == [True, False, False, False, False]
    assert [o["custom"] for o in options] == [False] * 5
    energy = [o["energy"]["energy_mwh"] for o in options]
    assert energy == pytest.approx([617.8, 607.7, 602.9, 700.9, 700.5], abs=ONE_DECIMAL)
    assert [o["caption"] for o in options] == [
        "Recommended",
        "Fills the inverter",
        "Lower clipping",
        "Below target, 2 inverters",
        "Below target, 2 inverters",
    ]
    assert [o["title"] for o in options] == [
        "A · Recommended",
        "B",
        "C",
        "D · below target",
        "E · below target",
    ]
    assert demo_result["chosen_option"] == "29x22x1"
    assert demo_result["no_options"] is None
    assert demo_result["custom_refused"] is None


def test_the_strings_the_roof_holds_of_each_length_in_the_range(demo_result):
    held = demo_result["strings_by_series"]

    assert [length["n_series"] for length in held] == list(range(14, 30))
    assert held[-1] == {"n_series": 29, "strings": 23}
    assert held[26 - 14] == {"n_series": 26, "strings": 27}


def test_the_energy_of_option_a(option_a):
    energy = option_a["energy"]

    assert energy["energy_mwh"] == pytest.approx(617.8, abs=ONE_DECIMAL)
    assert energy["pr"] * 100 == pytest.approx(86.6, abs=ONE_DECIMAL)
    assert energy["specific_yield"] == pytest.approx(1729, abs=0.5)
    assert (energy["dc_kwp"], energy["ac_kw"]) == (pytest.approx(357.28), 275)
    assert energy["cuf_ac_pct"] == pytest.approx(25.6, abs=ONE_DECIMAL)
    assert energy["cuf_dc_pct"] == pytest.approx(19.7, abs=ONE_DECIMAL)
    assert energy["poa_kwh_m2"] == pytest.approx(1998.0, abs=ONE_DECIMAL)
    assert energy["ghi_kwh_m2"] == pytest.approx(1822.9, abs=ONE_DECIMAL)
    assert energy["clipping_pct"] == pytest.approx(3.4, abs=ONE_DECIMAL)
    assert energy["sigma_pct"] == pytest.approx(4.24, abs=0.005)
    assert energy["lid_pct"] == 0.2
    assert energy["co2_t"] == pytest.approx(442.4, abs=ONE_DECIMAL)
    assert energy["monthly_mwh"] == pytest.approx(
        [62.0, 58.8, 68.4, 64.1, 54.9, 46.9, 31.5, 38.5, 37.5, 53.4, 53.5, 48.5], abs=ONE_DECIMAL
    )
    assert [(p["level"], round(p["mwh"], 1)) for p in energy["p_values"]] == [
        (50, 617.8),
        (75, 600.2),
        (90, 584.2),
    ]
    assert len(energy["years_mwh"]) == 25
    assert [energy["years_mwh"][year - 1] for year in (1, 5, 10, 15, 20, 25)] == pytest.approx(
        [617.8, 605.6, 590.6, 576.0, 561.7, 547.8], abs=ONE_DECIMAL
    )
    assert energy["total_25_years_mwh"] == pytest.approx(14554, abs=0.5)
    assert "hourly" not in energy, "the hours of the year are an export, not part of every answer"


def test_the_loss_chain_of_option_a(option_a):
    steps = option_a["energy"]["steps"]

    assert [step["label"] for step in steps] == [
        "Global horizontal irradiation",
        "Transposition to plane (15°)",
        "Far shading, horizon",
        "Near shading, linear",
        "IAM",
        "Soiling",
        "Bifacial rear gain",
        "Array nominal energy at STC",
        "Irradiance level",
        "Temperature",
        "Electrical shading",
        "Module quality",
        "LID (PAN)",
        "Mismatch",
        "DC ohmic",
        "Inverter efficiency",
        "Inverter clipping",
        "Night consumption",
        "AC ohmic",
        "Availability",
        "Energy to grid",
    ]
    changes = [round(step["pct"], 2) for step in steps[1:7] + steps[8:20]]
    assert changes == pytest.approx(
        [9.60, -0.01, -0.35, -2.22, -2.00, 3.65]
        + [-0.48, -4.08, -0.56, 0.00, -0.20, -1.00, -0.95, -1.33, -3.36, -0.00, -0.76, -0.50],
        abs=0.0051,
    )
    assert steps[7]["value"] == pytest.approx(706.4, abs=ONE_DECIMAL)
    assert steps[-1]["value"] == pytest.approx(617.84, abs=0.005)
    assert {step["kind"] for step in steps} == {"irr_total", "irr", "energy_total", "energy", "result"}


def test_the_strings_of_option_a(option_a, demo_result):
    system = option_a["system"]

    assert (system["n_series"], system["n_strings"], system["n_inverters"]) == (29, 22, 1)
    assert [string["label"] for string in system["strings"]] == [f"S{n}" for n in range(1, 23)]
    assert all(len(string["modules"]) == 29 for string in system["strings"])
    used = [index for string in system["strings"] for index in string["modules"]]
    assert len(set(used)) == 638 and max(used) < len(demo_result["layout"]["modules"])
    assert [(s["inverter"], s["mppt"]) for s in system["strings"]] == [
        (1, mppt) for mppt, count in zip(range(1, 7), [4, 4, 4, 4, 3, 3], strict=True) for _ in range(count)
    ]
    assert all(0 <= string["shade_pct"] < 100 for string in system["strings"])
    assert [inverter["label"] for inverter in system["inverters"]] == ["INV-1"]
    assert len(system["inverters"][0]["position"]) == 2


def test_the_verdict_and_the_tables_of_option_a(option_a):
    assert option_a["verdict"]["ok"] is True
    assert option_a["verdict"]["title"] == ("29 in series fits: Vmp 1,199 V at STC, inverter nominal 1,080 V")
    assert option_a["verdict"]["detail"].startswith("Voc at 11.9 °C is 1,480 V (limit 1500 V); ")
    assert [load["strings"] for load in option_a["mppt_loads"]] == [4, 4, 4, 4, 3, 3]
    assert [(line["item"], line["qty"], line["unit"]) for line in option_a["bom"]] == [
        ("PV module", 638, "pcs"),
        ("String inverter", 1, "pcs"),
        ("Mounting structure", 27, "tables"),
        ("DC cable", 1681, "m"),
        ("DC connector pair", 44, "pairs"),
        ("AC cable", 30, "m"),
        ("AC distribution board", 1, "pcs"),
    ]
    assert len(option_a["cable_schedule"]) == 22
    assert option_a["cable_schedule"][0]["size"] == "4 mm² Cu, 1500 V DC"
    assert [row["label"] for row in option_a["summary"]][:3] == ["Site", "Roof", "Structure"]
    assert len(option_a["summary"]) == 14
    assert option_a["module_area_m2"] == pytest.approx(1646, abs=0.5)
    assert option_a["roof_covered_pct"] == pytest.approx(45.7, abs=ONE_DECIMAL)


def test_the_series_range_of_the_demo(demo_result):
    series = demo_result["series_range"]

    assert (series["n_min"], series["n_max"], series["n_nominal"]) == (14, 29, 26)
    assert series["ok"] is True and series["message"] == ""
    assert series["voc_cold"] == pytest.approx(51.04, abs=0.005)
    assert series["system_v"] == 1500 and series["limit_v"] == 1500
    assert series["upper_limit"] == "Voc limit"
    assert series["limit_note"] == (
        "Limit 1500 V: the lowest of the system, module (1500 V) and inverter (1500 V) ratings."
    )
    assert demo_result["options_note"].startswith("Target DC/AC 1.10–1.30, warning above 1.40. ")


def test_the_sizing_temperatures_come_from_the_weather(demo_result):
    assert demo_result["sizing"] == {
        "t_min_c": 11.93,
        "t_max_c": 39.26,
        "t_min_from": "weather",
        "t_max_from": "weather",
        "cell_rise_c": 25.0,
        "cell_rise_from": "roof type",
        "uc": 29.0,
        "uc_from": "roof type",
    }


def test_the_weather_and_the_shading_of_the_demo(demo_result):
    assert demo_result["weather"]["label"] == "PVGIS TMY"
    assert demo_result["weather"]["ghi_kwh_m2"] == pytest.approx(1822.9, abs=ONE_DECIMAL)
    assert demo_result["weather"]["horizon_highest_deg"] == 2.7
    assert demo_result["weather_notes"] == []
    assert demo_result["far_shading_note"] == "Far shading: PVGIS horizon, highest 2.7°"
    shading = demo_result["shading"]
    assert list(shading) == ["near_pct", "far_pct", "near_pct_by_module", "keepout_area_m2"]
    assert len(shading["near_pct_by_module"]) == 790
    assert shading["far_pct"] == pytest.approx(0.01, abs=0.005)
    assert shading["near_pct"] > 0.35, "all positions lose more than the least shaded strings of option A"
    assert shading["keepout_area_m2"] == pytest.approx(150, abs=0.5)


def test_the_equipment_of_the_demo(demo_result):
    equipment = demo_result["equipment"]

    assert (equipment["module"]["pnom_w"], equipment["inverter"]["pnom_kw"]) == (560, 275)
    assert equipment["coefficients"]["mu_voc_pct"] == pytest.approx(-0.164, abs=0.0005)
    assert equipment["module_notes"] == [
        "Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon. "
        "Check the datasheet and enter it if it differs."
    ]
    assert equipment["max_current_per_mppt"] == {
        "value_a": 65.0,
        "source": "IMaxDC over the MPPT count",
        "note": "Not in the OND: IMaxDC 390 A ÷ 6 MPPT. Enter the datasheet value if it differs.",
    }


# ── the Voc coefficient of a datasheet ───────────────────────────────────────
@pytest.fixture(scope="module")
def entered_result(client, _demo):
    """The demo at 1500 V with the Voc coefficient of a datasheet entered, run once."""
    project = copy.deepcopy(_demo)
    project["voc_coefficient_pct"] = -0.29
    return result_of(client.post("/design", json=project))


def test_an_entered_voc_coefficient_is_the_coefficient_and_drops_the_note(entered_result):
    equipment = entered_result["equipment"]

    assert equipment["coefficients"]["source"] == "entered"
    assert equipment["coefficients"]["mu_voc_pct"] == -0.29
    assert equipment["coefficients"]["mu_voc_mv"] == pytest.approx(-0.29 / 100 * 49.95 * 1000, abs=0.05)
    assert equipment["module_notes"] == []


def test_an_entered_voc_coefficient_sizes_the_strings(entered_result):
    series = entered_result["series_range"]

    assert (series["n_min"], series["n_max"]) == (14, 28)
    assert series["voc_cold"] == pytest.approx(51.84, abs=0.01)
    assert all(option["n_series"] <= 28 for option in entered_result["options"])
    option_a = entered_result["options"][0]
    assert option_a["cable_schedule"][0]["voc_cold_v"] == pytest.approx(
        option_a["n_series"] * series["voc_cold"]
    )


@pytest.mark.parametrize("value", [0, -1, -1.5, 0.1])
def test_a_voc_coefficient_out_of_its_range_is_refused(client, light_demo, value):
    light_demo["voc_coefficient_pct"] = value

    response = client.post("/design", json=light_demo)

    assert response.status_code == 422
    assert (error_of(response)["code"], error_of(response)["field"]) == (
        "invalid_request",
        "voc_coefficient_pct",
    )


def test_a_run_with_a_voc_coefficient_is_not_the_run_without(client, demo):
    plain = small(demo)
    entered = {**small(demo), "voc_coefficient_pct": -0.29}

    without = result_of(client.post("/design", json=plain))
    with_it = result_of(client.post("/design", json=entered))

    assert (without["series_range"]["n_max"], with_it["series_range"]["n_max"]) == (29, 28)
    assert max(option["n_series"] for option in without["options"]) == 29
    assert max(option["n_series"] for option in with_it["options"]) <= 28


# ── without a system voltage ─────────────────────────────────────────────────
def test_without_a_system_voltage_the_layout_and_the_shading_are_there(waiting_result):
    assert len(waiting_result["layout"]["modules"]) == waiting_result["readouts"]["positions"] > 0
    assert len(waiting_result["shading"]["near_pct_by_module"]) == waiting_result["readouts"]["positions"]
    assert waiting_result["weather"]["hours"] == 8760


def test_without_a_system_voltage_nothing_is_sized_and_nothing_is_chosen(waiting_result):
    assert waiting_result["options"] == []
    assert waiting_result["series_range"] is None
    assert waiting_result["strings_by_series"] == []
    assert waiting_result["options_note"] is None
    assert waiting_result["chosen_option"] is None


def test_without_a_system_voltage_the_answer_says_what_it_waits_for(waiting_result):
    assert waiting_result["no_options"] == {
        "code": "system_voltage_missing",
        "title": "Choose a system voltage to size the strings",
        "message": "600, 1000 or 1500 V. Nothing is sized until you choose.",
    }


def test_without_a_system_voltage_the_options_are_not_a_step(waiting_run):
    assert steps_of(waiting_run) == [FITTING, SHADING, LOSSES]
    assert events_of(waiting_run)[-2].data == {"type": "progress", "step": LOSSES, "fraction": 1.0}


def test_a_chosen_option_of_before_is_not_kept_without_a_system_voltage(client, demo):
    project = small(demo, system_voltage=None)
    project["chosen_option"] = "29x22x1"

    assert result_of(client.post("/design", json=project))["chosen_option"] is None


# ── other outcomes ───────────────────────────────────────────────────────────
def test_the_same_request_gives_the_same_answer(client, demo):
    first = client.post("/design", json=small(demo))
    second = client.post("/design", json=small(demo))

    assert result_of(first) == result_of(second)
    assert steps_of(first) == steps_of(second)
    assert len(result_of(first)["options"]) > 0


def test_a_run_tells_how_far_the_shading_and_the_options_are(client, demo, nothing_kept):
    progress = [e.data for e in events_of(client.post("/design", json=small(demo))) if e.name == "progress"]

    shading = [event["fraction"] for event in progress if event["step"] == SHADING]
    options = [event["fraction"] for event in progress if event["step"] == OPTIONS]
    assert len(shading) >= 10 and shading == sorted(set(shading))
    assert len(options) >= 4 and options == sorted(set(options)) and options[-1] == 1.0
    assert len(progress) <= 60


# ── what is kept between requests (decision D6) ──────────────────────────────
@pytest.fixture
def nothing_kept(monkeypatch):
    """The server as it is freshly started: no result of an earlier request is there."""
    from rooftop_api.services import design as service

    monkeypatch.setattr(service, "MEMO", service.new_memo())


@pytest.fixture
def shading_runs(monkeypatch):
    from rooftop_core import shading

    calls = []
    real = shading.compute

    def counted(*args, **kwargs):
        calls.append(1)
        return real(*args, **kwargs)

    monkeypatch.setattr(shading, "compute", counted)
    return calls


def test_a_freshly_started_server_answers_the_same_twice(client, demo, nothing_kept, shading_runs):
    first = client.post("/design", json=small(demo))
    second = client.post("/design", json=small(demo))

    assert result_of(first) == result_of(second)
    assert steps_of(first) == steps_of(second)
    assert len(shading_runs) == 1, "the second answer came from what the first had worked out"
    assert len(events_of(second)) < len(events_of(first)), "and had less to tell on the way"


def test_dropping_what_is_kept_changes_nothing_in_the_answer(client, demo, monkeypatch, shading_runs):
    from rooftop_api.services import design as service

    monkeypatch.setattr(service, "MEMO", service.new_memo())
    first = client.post("/design", json=small(demo))
    kept = client.post("/design", json=small(demo))

    monkeypatch.setattr(service, "MEMO", service.new_memo())
    dropped = client.post("/design", json=small(demo))

    assert result_of(kept) == result_of(first) and result_of(dropped) == result_of(first)
    assert events_of(dropped) == events_of(first), "two runs that keep nothing tell the same on the way"
    assert len(shading_runs) == 2


def test_a_change_of_a_loss_is_answered_without_working_out_the_shading(
    client, demo, nothing_kept, shading_runs
):
    project = small(demo)
    before = result_of(client.post("/design", json=project))
    project["losses"]["soiling_pct"] = 3.0

    after = result_of(client.post("/design", json=project))

    assert len(shading_runs) == 1
    assert after["shading"] == before["shading"] and after["layout"] == before["layout"]
    assert after["options"][0]["energy"]["energy_mwh"] < before["options"][0]["energy"]["energy_mwh"]


def test_at_1000_v_at_most_19_modules_are_in_series(client, demo):
    result = result_of(client.post("/design", json=small(demo, system_voltage=1000)))

    assert result["series_range"]["n_max"] == 19
    assert all(option["n_series"] <= 19 for option in result["options"])
    assert {row["size"] for row in result["options"][0]["cable_schedule"]} == {"4 mm² Cu, 1000 V DC"}


def test_a_custom_option_is_added_to_those_of_the_engine(client, demo):
    project = small(demo)
    plain = result_of(client.post("/design", json=project))
    project["custom"] = [20, 2, 1]

    result = result_of(client.post("/design", json=project))

    custom = result["options"][-1]
    assert len(result["options"]) == len(plain["options"]) + 1
    assert (custom["key"], custom["custom"], custom["recommended"]) == ("custom", True, False)
    assert (custom["n_series"], custom["n_strings"], custom["n_inverters"]) == (20, 2, 1)
    assert custom["title"] == f"{custom['letter']} · Custom"
    assert custom["energy"]["dc_kwp"] == pytest.approx(20 * 2 * 0.560)
    assert result["custom_refused"] is None


def test_a_custom_equal_to_option_b_is_a_sixth_option_that_custom_chooses(client, demo):
    demo["custom"], demo["chosen_option"] = [26, 24, 1], "custom"

    result = result_of(client.post("/design", json=demo))

    options = result["options"]
    assert [o["key"] for o in options] == ["29x22x1", "26x24x1", "28x22x1", "26x27x2", "28x25x2", "custom"]
    assert [o["custom"] for o in options] == [False] * 5 + [True]
    assert (options[5]["n_series"], options[5]["n_strings"], options[5]["n_inverters"]) == (26, 24, 1)
    assert result["chosen_option"] == "custom"
    assert options[5]["caption"] == "Your own"


def test_a_custom_that_cannot_be_built_is_not_simulated_and_the_answer_says_why(client, demo):
    project = small(demo, system_voltage=1000)
    project["custom"], project["chosen_option"] = [29, 22, 1], "custom"

    result = result_of(client.post("/design", json=project))

    assert not any(option["custom"] for option in result["options"])
    assert result["chosen_option"] == result["options"][0]["key"]
    assert result["custom_refused"] == {
        "ok": False,
        "title": "29 in series does not fit at 1000 V",
        "detail": "At most 19 fit: Voc at 11.9 °C is 1,480 V, over the limit of 1000 V. "
        "Change your option or remove it.",
    }


def test_the_chosen_option_of_the_project_is_kept_when_it_is_there(client, demo):
    project = small(demo)
    keys = [option["key"] for option in result_of(client.post("/design", json=project))["options"]]
    project["chosen_option"] = keys[-1]

    assert result_of(client.post("/design", json=project))["chosen_option"] == keys[-1]


def test_when_no_string_length_fits_the_answer_says_why(client, demo):
    project = small(demo, system_voltage=600)
    project["ond_text"] = project["ond_text"].replace("VMppMin=500", "VMppMin=900")
    assert "VMppMin=900" in project["ond_text"]

    result = result_of(client.post("/design", json=project))

    assert result["options"] == [] and result["chosen_option"] is None
    assert result["series_range"]["ok"] is False
    assert result["strings_by_series"] == []
    assert result["no_options"]["code"] == "no_string_length_fits"
    assert result["no_options"]["title"] == "No string length fits this inverter"
    assert result["no_options"]["message"] == result["series_range"]["message"]
    assert result["no_options"]["message"].startswith("No string length fits: at least ")


def test_a_roof_too_small_for_a_module_has_no_positions_and_says_so(client, demo):
    project = small(demo)
    project["roof"]["outline"] = [[0, 0], [3, 0], [3, 3], [0, 3]]
    project["roof"]["obstacles"] = []

    result = result_of(client.post("/design", json=project))

    assert result["readouts"]["positions"] == 0 and result["options"] == []
    assert result["no_options"] == {
        "code": "no_positions",
        "title": "No module fits on this roof",
        "message": "Inside the edge setback and clear of shadows there is no room for a module. "
        "Check the outline, the setback and the obstacles.",
    }


def test_a_roof_with_fewer_positions_than_a_string_says_so(client, demo):
    project = small(demo)
    project["roof"]["outline"] = [[0, 0], [9, 0], [9, 8], [0, 8]]
    project["roof"]["obstacles"] = []

    result = result_of(client.post("/design", json=project))

    positions = result["readouts"]["positions"]
    assert 0 < positions < 14 and result["options"] == []
    assert result["series_range"]["ok"] is True
    assert result["no_options"] == {
        "code": "too_few_positions",
        "title": "Too few positions for a string",
        "message": f"The roof holds {positions} positions, and a string takes 14 to 29 modules along one "
        "row. No row holds a string of that length.",
    }


# ── what is refused before the run ───────────────────────────────────────────
def test_a_project_without_weather_is_refused_before_the_run(client, light_demo):
    response = client.post("/design", json=light_demo)

    assert response.status_code == 422
    assert response.headers["content-type"] == "application/json"
    assert error_of(response) == {
        "code": "weather_not_loaded",
        "message": "This project has no weather for 18.5200, 73.8600 yet. Load the PVGIS TMY weather first.",
        "field": "weather_json",
    }


def test_weather_of_another_site_is_refused(client, demo):
    demo["roof"]["lat"] = 19.07

    response = client.post("/design", json=demo)

    assert response.status_code == 422
    assert error_of(response)["code"] == "weather_not_loaded"


def test_a_file_that_is_named_but_not_included_is_asked_for_again(client, demo):
    demo["ond_text"] = ""

    response = client.post("/design", json=demo)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "equipment_file_missing",
        "message": "The inverter file wattpower-wp-330ktl-h1.OND (OND) is not included in this project. "
        "Choose it again.",
        "field": "ond_path",
    }


def test_an_ond_that_is_none_is_refused(client, demo):
    demo["ond_text"] = "not an inverter"

    response = client.post("/design", json=demo)

    assert response.status_code == 422
    assert (error_of(response)["code"], error_of(response)["field"]) == ("not_an_ond_file", "ond_text")


def test_a_roof_that_crosses_itself_is_refused(client, demo):
    demo["roof"]["outline"] = [[0, 0], [90, 40], [90, 0], [0, 40]]

    response = client.post("/design", json=demo)

    assert response.status_code == 422
    assert error_of(response)["code"] == "roof_outline_crosses_itself"


def test_csv_weather_in_the_project_is_checked_and_used(client, demo):
    hours = zip(demo["weather_json"]["time"], demo["weather_json"]["ghi"], strict=True)
    project = small(demo, system_voltage=None)
    project["weather_json"] = None
    project["weather_source"] = "csv"
    project["weather_csv"] = "site.csv"
    project["weather_csv_text"] = "time,ghi\n" + "\n".join(f"{t[:16]},{ghi}" for t, ghi in hours)

    response = client.post("/design", json=project)

    result = result_of(response)
    assert (result["weather"]["label"], result["weather"]["hours"]) == ("site.csv", 8760)
    assert result["weather_notes"] == [
        "site.csv has no beam and diffuse irradiance. They were worked out from the global irradiance "
        "(Erbs model), which is less exact than measured values.",
        "site.csv has no air temperature. 25 °C was taken for every hour, so the strings are sized for "
        "25 °C. Enter the site's lowest and highest ambient in the Strings lens.",
        "site.csv has no wind speed. 1 m/s was taken for every hour.",
    ]
    assert "Loading CSV file weather" not in [e.data.get("step") for e in events_of(response)]


def test_csv_weather_that_cannot_be_used_is_refused_before_the_run(client, demo):
    project = small(demo)
    project["weather_json"] = None
    project["weather_source"] = "csv"
    project["weather_csv"] = "site.csv"
    project["weather_csv_text"] = "time,ghi\nnoon,100\n"

    response = client.post("/design", json=project)

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "not_a_weather_csv",
        "message": "site.csv: the time cannot be read in 1 row, the first of them row 1 (noon). "
        "Write it as 2023-06-01 13:00, in UTC.",
        "field": "weather_csv_text",
    }


def test_a_fault_in_the_run_travels_in_the_stream(client, demo, monkeypatch):
    from rooftop_core.project import Design

    def fails(self, on_progress=None):
        raise ZeroDivisionError("a fault of the engine")

    monkeypatch.setattr(Design, "run_options", fails)

    response = client.post("/design", json=small(demo))

    assert response.status_code == 200
    assert [(event.name, event.data) for event in events_of(response)] == [
        (
            "error",
            {
                "type": "error",
                "error": {
                    "code": "internal_error",
                    "message": "The server could not finish this request. Try again; if it fails again, "
                    "report it.",
                    "field": None,
                },
            },
        )
    ]


# ── equipment that the demo does not have ────────────────────────────────────
def test_an_inverter_without_a_current_limit_says_so_and_shows_no_limit_of_zero(client, demo):
    from tests.equipment import fixture_text

    project = small(demo)
    project["ond_path"] = "sungrow-sg3300ud-20.OND"
    project["ond_text"] = fixture_text("sungrow-sg3300ud-20.OND")

    result = result_of(client.post("/design", json=project))

    assert result["equipment"]["max_current_per_mppt"] == {
        "value_a": None,
        "source": "not in the OND",
        "note": "Not in the OND, and the OND has no IMaxDC to work it out from. Enter the datasheet value.",
    }
    loads = result["options"][0]["mppt_loads"]
    assert [(load["imp_limit_a"], load["isc_limit_a"], load["ok"]) for load in loads] == [
        (None, None, False)
    ] * len(loads)
    assert "The OND gives no current limit per MPPT" in result["options_note"]
    assert [option["ok"] for option in result["options"]] == [False] * len(result["options"])


def test_a_monofacial_module_with_a_stated_coefficient_has_no_note_and_no_rear_gain(client, demo):
    from tests.equipment import fixture_text

    project = small(demo)
    project["pan_path"] = "abi-ab340-72phc.PAN"
    project["pan_text"] = fixture_text("abi-ab340-72phc.PAN")

    result = result_of(client.post("/design", json=project))

    assert result["equipment"]["module"]["is_bifacial"] is False
    assert result["equipment"]["coefficients"]["source"] == "PAN file"
    assert result["equipment"]["module_notes"] == []
    rear = next(s for s in result["options"][0]["energy"]["steps"] if s["label"] == "Bifacial rear gain")
    assert rear["pct"] == 0.0
