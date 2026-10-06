"""PAN and OND files are read from text or bytes as well as from a path: a browser has no file path."""

from dataclasses import replace
from pathlib import Path

import pytest

from rooftop_core.io.pvsyst import decode_pvsyst, parse_ond, parse_pan, read_ond, read_pan
from tests.equipment import fixture_path

PAN_PATH = Path(fixture_path("Test.PAN"))
OND_PATH = Path(fixture_path("Test-S.ond"))


def test_parse_pan_gives_what_read_pan_gives():
    from_path = read_pan(PAN_PATH)
    from_text = parse_pan(PAN_PATH.read_text(encoding="utf-8"), "Test.PAN")

    assert from_text.source == "Test.PAN"
    assert replace(from_text, source="") == replace(from_path, source="")


def test_parse_ond_gives_what_read_ond_gives():
    from_path = read_ond(OND_PATH)
    from_text = parse_ond(OND_PATH.read_text(encoding="utf-8"), "Test-S.ond")

    assert from_text.source == "Test-S.ond"
    assert replace(from_text, source="") == replace(from_path, source="")
    assert from_text.curve_euro_pct == from_path.curve_euro_pct


def test_read_pan_keeps_the_path_as_the_source():
    assert read_pan(PAN_PATH).source == str(PAN_PATH)
    assert read_pan(str(PAN_PATH)).source == str(PAN_PATH)


@pytest.mark.parametrize("as_bytes", [False, True])
def test_read_pan_accepts_the_text_of_the_file(as_bytes):
    content = PAN_PATH.read_bytes() if as_bytes else PAN_PATH.read_text(encoding="utf-8")

    assert replace(read_pan(content), source="") == replace(read_pan(PAN_PATH), source="")


@pytest.mark.parametrize("as_bytes", [False, True])
def test_read_ond_accepts_the_text_of_the_file(as_bytes):
    content = OND_PATH.read_bytes() if as_bytes else OND_PATH.read_text(encoding="utf-8")

    assert replace(read_ond(content), source="") == replace(read_ond(OND_PATH), source="")


def test_decode_reads_utf8():
    assert decode_pvsyst("Manufacturer=Süd Solar\n".encode()) == "Manufacturer=Süd Solar\n"


def test_decode_falls_back_to_latin1():
    data = "Manufacturer=Süd Solar\n".encode("latin-1")

    with pytest.raises(UnicodeDecodeError):
        data.decode("utf-8")
    assert decode_pvsyst(data) == "Manufacturer=Süd Solar\n"


def test_a_latin1_pan_is_read_from_bytes():
    text = PAN_PATH.read_text(encoding="utf-8").replace("Manufacturer=", "Manufacturer=Süd ", 1)

    module = read_pan(text.encode("latin-1"))

    assert module.manufacturer.startswith("Süd ")
    assert module.pnom_w == 560


def test_text_that_is_not_a_pan_is_refused_by_name():
    with pytest.raises(ValueError) as error:
        parse_pan("Hello\nthis is not a module file\n", "notes.PAN")

    assert str(error.value) == "notes.PAN: not a PVsyst module file (PNom, Voc or Isc missing)"


def test_text_that_is_not_an_ond_is_refused_by_name():
    with pytest.raises(ValueError) as error:
        parse_ond("Hello\nthis is not an inverter file\n", "notes.ond")

    assert str(error.value) == "notes.ond: not a PVsyst inverter file (PNomConv or VMPPMax missing)"


def test_an_ond_given_as_a_pan_is_refused():
    with pytest.raises(ValueError, match="not a PVsyst module file"):
        parse_pan(OND_PATH.read_text(encoding="utf-8"), "Test-S.ond")


def test_a_file_without_a_name_is_still_refused_in_words():
    with pytest.raises(ValueError) as error:
        parse_pan("nothing useful\n")

    assert str(error.value) == "The file: not a PVsyst module file (PNom, Voc or Isc missing)"


def test_the_power_of_an_ond_is_in_kilowatts_whatever_its_display_unit():
    """UnitAffEnum is the unit PVsyst shows the power in; PNomConv is in kW all the same. 30 of the
    405 OND files the app's library holds say W (the small Solis, the FIMER PVS-100), and were read
    as a thousandth of their power."""
    text = Path(fixture_path("Test-S.ond")).read_text(encoding="utf-8")
    shown_in_watts = text.replace("UnitAffEnum=kW", "UnitAffEnum=W")
    assert shown_in_watts != text

    inverter = parse_ond(shown_in_watts, "Test-S.ond")

    assert (inverter.pnom_kw, inverter.pmax_kw) == (parse_ond(text).pnom_kw, parse_ond(text).pmax_kw)
    assert inverter.pnom_kw == 275.0
