"""POST /equipment/module and /equipment/inverter: a PAN or OND file read for the user."""

import base64
from pathlib import Path

import pytest

from tests.api.conftest import error_of
from tests.equipment import fixture_path

PAN = Path(fixture_path("Test.PAN")).read_bytes()
OND = Path(fixture_path("Test-S.ond")).read_bytes()
PAN_TEXT, OND_TEXT = PAN.decode("utf-8"), OND.decode("utf-8")
VOC_NOTE = (
    "Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon. "
    "Check the datasheet and enter it if it differs."
)


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _insert(text: str, line: str, after: str) -> str:
    """The text of a file with one more line, put after the line that starts with *after*."""
    lines = text.splitlines()
    at = next(i for i, existing in enumerate(lines) if existing.strip().startswith(after))
    return "\r\n".join(lines[: at + 1] + [f"  {line}"] + lines[at + 1 :]) + "\r\n"


# ── module ───────────────────────────────────────────────────────────────────
def test_a_pan_given_as_text_is_read(client):
    response = client.post("/equipment/module", json={"name": "Test.PAN", "text": PAN_TEXT})

    assert response.status_code == 200
    body = response.json()
    module = body["module"]
    assert body["file"] == "Test.PAN"
    assert (module["manufacturer"], module["model"], module["pnom_w"]) == ("Test", "Test", 560)
    assert (module["length_m"], module["width_m"]) == (2.277, 1.133)
    assert (module["voc"], module["isc"], module["vmp"], module["imp"]) == (49.95, 14.3, 41.24, 13.58)
    assert (module["n_diodes"], module["bifaciality"], module["half_cell"]) == (3, 0.8, True)
    assert module["lid_loss_pct"] == 0.2
    assert module["source"] == "Test.PAN"
    assert module["is_bifacial"] is True
    assert body["text"] == PAN_TEXT


def test_the_coefficients_come_from_the_one_diode_model_and_the_voc_note_fires(client):
    body = client.post("/equipment/module", json={"name": "Test.PAN", "text": PAN_TEXT}).json()

    coefficients = body["coefficients"]
    assert coefficients["source"] == "one-diode model"
    assert coefficients["mu_voc_pct"] == pytest.approx(-0.164, abs=0.0005)
    assert coefficients["mu_vmp_pct"] == pytest.approx(-0.228, abs=0.0005)
    assert coefficients["mu_pmpp_pct"] == pytest.approx(-0.212, abs=0.0005)
    assert body["notes"] == [VOC_NOTE]


def test_a_pan_given_as_base64_gives_the_same_answer(client):
    as_text = client.post("/equipment/module", json={"name": "Test.PAN", "text": PAN_TEXT})
    as_bytes = client.post("/equipment/module", json={"name": "Test.PAN", "base64": _b64(PAN)})

    assert as_bytes.status_code == 200
    assert as_bytes.json() == as_text.json()


def test_bytes_in_a_windows_code_page_are_read(client):
    text = PAN_TEXT.replace("Manufacturer=", "Manufacturer=Süd ", 1)

    response = client.post(
        "/equipment/module", json={"name": "Test.PAN", "base64": _b64(text.encode("latin-1"))}
    )

    assert response.status_code == 200
    assert response.json()["module"]["manufacturer"].startswith("Süd ")
    assert response.json()["text"] == text


def test_a_voc_coefficient_in_the_file_is_used_and_needs_no_note(client):
    text = _insert(PAN_TEXT, "muVocSpec=-130.0", "Voc=")

    body = client.post("/equipment/module", json={"name": "Test.PAN", "text": text}).json()

    assert body["coefficients"]["source"] == "PAN file"
    assert body["coefficients"]["mu_voc_mv"] == -130.0
    assert body["coefficients"]["mu_voc_pct"] == pytest.approx(-0.260, abs=0.001)
    assert body["notes"] == []


def test_a_pan_without_the_size_of_the_module_is_read_with_a_note(client):
    without = [line for line in PAN_TEXT.splitlines() if not line.strip().startswith(("Width=", "Height="))]

    response = client.post("/equipment/module", json={"name": "NoSize.PAN", "text": "\r\n".join(without)})

    assert response.status_code == 200
    body = response.json()
    assert (body["module"]["length_m"], body["module"]["width_m"]) == (0, 0)
    assert body["notes"] == [
        VOC_NOTE,
        "NoSize.PAN gives no size of the module (Width and Height). "
        "The layout needs it: choose a PAN file that has it.",
    ]


def test_only_the_name_of_the_file_is_kept_of_a_path(client):
    body = client.post(
        "/equipment/module", json={"name": "C:\\Users\\p\\PAN\\Test.PAN", "text": PAN_TEXT}
    ).json()

    assert body["file"] == "Test.PAN" and body["module"]["source"] == "Test.PAN"


@pytest.mark.parametrize(
    ("content", "field"),
    [({"text": "Hello\nnot a module\n"}, "text"), ({"base64": _b64(b"Hello\nnot a module\n")}, "base64")],
)
def test_a_file_that_is_not_a_pan_is_refused_in_the_words_of_the_engine(client, content, field):
    response = client.post("/equipment/module", json={"name": "notes.PAN", **content})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "not_a_pan_file",
        "message": "notes.PAN is not a module file (PAN): PNom, Voc or Isc is missing.",
        "field": field,
    }


def test_an_ond_sent_as_a_module_is_refused(client):
    response = client.post("/equipment/module", json={"name": "Test-S.ond", "text": OND_TEXT})

    assert response.status_code == 422
    assert error_of(response)["code"] == "not_a_pan_file"


@pytest.mark.parametrize("content", [{}, {"text": PAN_TEXT, "base64": _b64(PAN)}])
def test_the_content_comes_once(client, content):
    response = client.post("/equipment/module", json={"name": "Test.PAN", **content})

    assert response.status_code == 422
    error = error_of(response)
    assert error["code"] == "invalid_request"
    assert "either as text or as base64" in error["message"]


def test_base64_that_is_none_is_refused(client):
    response = client.post("/equipment/module", json={"name": "Test.PAN", "base64": "@@@ not base64 @@@"})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "invalid_base64",
        "message": "The content of Test.PAN is not valid base64.",
        "field": "base64",
    }


def test_a_file_without_a_name_is_refused(client):
    response = client.post("/equipment/module", json={"name": "", "text": PAN_TEXT})

    assert response.status_code == 422
    assert error_of(response)["field"] == "name"


# ── inverter ─────────────────────────────────────────────────────────────────
def test_an_ond_given_as_text_is_read(client):
    response = client.post("/equipment/inverter", json={"name": "Test-S.ond", "text": OND_TEXT})

    assert response.status_code == 200
    body = response.json()
    inverter = body["inverter"]
    assert body["file"] == "Test-S.ond"
    assert (inverter["pnom_kw"], inverter["n_mppt"], inverter["n_inputs"]) == (275, 6, 28)
    assert (inverter["vmpp_min"], inverter["vmpp_max"]) == (500, 1500)
    assert (inverter["vmpp_nom"], inverter["vabs_max"]) == (1080, 1500)
    assert inverter["idc_max_a"] == 390
    assert [curve["voltage"] for curve in inverter["curves"]] == [930.0, 1189.0, 1300.0]
    assert all(len(curve["points"]) >= 3 for curve in inverter["curves"])
    assert body["text"] == OND_TEXT


def test_the_current_per_mppt_is_worked_out_when_the_ond_lacks_it(client):
    body = client.post("/equipment/inverter", json={"name": "Test-S.ond", "text": OND_TEXT}).json()

    assert body["max_current_per_mppt"] == {
        "value_a": 65.0,
        "source": "IMaxDC over the MPPT count",
        "note": "Not in the OND: IMaxDC 390 A ÷ 6 MPPT. Enter the datasheet value if it differs.",
    }


def test_the_current_per_mppt_of_the_ond_is_used_when_it_is_there(client):
    text = _insert(OND_TEXT, "IMaxMPPT=30.0", "IMaxDC=")

    body = client.post("/equipment/inverter", json={"name": "Test-S.ond", "text": text}).json()

    assert body["max_current_per_mppt"] == {
        "value_a": 30.0,
        "source": "OND file",
        "note": "From the OND file.",
    }
    assert body["inverter"]["imax_mppt_a"] == 30.0


def test_an_ond_without_any_current_says_so_and_picks_nothing(client):
    text = (
        "\r\n".join(line for line in OND_TEXT.splitlines() if not line.strip().startswith("IMaxDC=")) + "\r\n"
    )
    assert text != OND_TEXT

    body = client.post("/equipment/inverter", json={"name": "Test-S.ond", "text": text}).json()

    assert body["max_current_per_mppt"] == {
        "value_a": None,
        "source": "not in the OND",
        "note": "Not in the OND, and the OND has no IMaxDC to work it out from. Enter the datasheet value.",
    }


def test_an_ond_given_as_base64_gives_the_same_answer(client):
    as_text = client.post("/equipment/inverter", json={"name": "Test-S.ond", "text": OND_TEXT})
    as_bytes = client.post("/equipment/inverter", json={"name": "Test-S.ond", "base64": _b64(OND)})

    assert as_bytes.json() == as_text.json()


def test_a_file_that_is_not_an_ond_is_refused_in_the_words_of_the_engine(client):
    response = client.post("/equipment/inverter", json={"name": "Test.PAN", "text": PAN_TEXT})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "not_an_ond_file",
        "message": "Test.PAN is not an inverter file (OND): PNomConv or VMPPMax is missing.",
        "field": "text",
    }
