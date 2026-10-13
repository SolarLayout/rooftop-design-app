"""POST /design and the inverter for the roof (D118): the one the app sets, the one offered, and why no option
reaches the target."""

import copy

import pytest

from tests.api.events import result_of

pytestmark = pytest.mark.slow


def new_roof(project: dict, inverter_by: str) -> dict:
    """The demo on a flat roof of 40 x 30 m with a new design's array at 1000 V, as Find builds it."""
    project = copy.deepcopy(project)
    project["roof"]["outline"] = [[0, 0], [40, 0], [40, 30], [0, 30]]
    project["roof"]["obstacles"] = []
    project["array"]["modules_in_tilt"] = 1
    project["system_voltage"], project["system_voltage_by"] = 1000, "app"
    project["inverter_by"] = inverter_by
    return project


def test_an_inverter_the_app_sets_is_the_roofs_and_its_first_option_is_recommended(client, _demo):
    result = result_of(client.post("/design", json=new_roof(_demo, "app")))

    assert result["equipment"]["inverter"]["model"] == "3P-136K (75-136 kW)"
    assert result["equipment"]["inverter"]["source"] == "Waaree_3P-136K_75-136kW.OND"
    roof = result["roof_inverter"]
    assert (roof["file"], roof["in_use"], roof["n_inverters"]) == ("Waaree_3P-136K_75-136kW.OND", True, 1)
    assert result["options"][0]["caption"] == "Recommended"
    assert result["below_target"] is None


def test_an_inverter_of_the_users_below_the_target_is_kept_with_the_roofs_offered_and_why(client, _demo):
    result = result_of(client.post("/design", json=new_roof(_demo, "user")))

    assert result["equipment"]["inverter"]["model"] == "WP-330KTL-H1"
    roof = result["roof_inverter"]
    assert (roof["inverter"]["model"], roof["in_use"]) == ("3P-136K (75-136 kW)", False)
    kwp = 288 * result["equipment"]["module"]["pnom_w"] / 1000
    below = result["below_target"]
    assert below["title"] == "No option within the DC/AC target"
    fill = f"This inverter's 275 kW is more than the roof's {kwp:.2f} kWp can fill"
    assert below["message"].startswith(fill)
    assert (below["ac_kw_from"], below["ac_kw_to"]) == pytest.approx((kwp / 1.30, kwp / 1.10))


def test_an_inverter_set_by_someone_unknown_is_refused(client, _demo):
    project = new_roof(_demo, "app")
    project["inverter_by"] = "the roof"

    response = client.post("/design", json=project)

    assert response.status_code == 422
    assert "inverter_by" in response.text
