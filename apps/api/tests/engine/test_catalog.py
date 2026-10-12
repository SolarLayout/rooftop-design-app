"""The catalog of the app's library of PAN and OND files is written by the engine's own readers (D75)."""

import hashlib
import json
from pathlib import Path

import pytest

from rooftop_core.catalog import catalog_of, inverter_entry, main, module_entry
from rooftop_core.io.pvsyst import parse_ond, parse_pan
from tests.equipment import fixture_path

PAN = Path(fixture_path("Test.PAN")).read_bytes()
OND = Path(fixture_path("Test-S.ond")).read_bytes()


def test_a_module_entry_is_what_the_reader_reads_of_the_file():
    entry = module_entry("Maker_Model.PAN", PAN)
    module = parse_pan(PAN.decode("utf-8"), "Maker_Model.PAN")

    assert entry.file == "Maker_Model.PAN"
    assert entry.sha256 == hashlib.sha256(PAN).hexdigest()
    assert (entry.maker, entry.model) == (module.manufacturer, module.model)
    assert entry.wp == module.pnom_w
    assert (entry.length_m, entry.width_m) == (module.length_m, module.width_m)
    assert entry.efficiency_pct == round(module.efficiency * 100, 2)
    assert entry.bifaciality == (module.bifaciality or None)


def test_an_entry_carries_the_files_data_source():
    assert module_entry("A.PAN", PAN).data_source == "Test"
    assert (
        module_entry("A.PAN", PAN.replace(b"DataSource=Test", b"DataSource=TUV SUD")).data_source == "TUV SUD"
    )
    assert inverter_entry("A.OND", OND).data_source == "Manufacturer 2023"


def test_a_file_that_is_no_pan_is_refused_in_the_readers_words():
    with pytest.raises(ValueError, match=r"is not a module file \(PAN\)"):
        module_entry("notes.PAN", b"hello\nworld\n")


def test_a_module_without_its_size_is_refused():
    text = "\n".join(
        line
        for line in PAN.decode("utf-8").splitlines()
        if not line.strip().startswith(("Width=", "Height="))
    )

    with pytest.raises(ValueError, match="no size of the module"):
        module_entry("NoSize.PAN", text.encode("utf-8"))


def test_an_inverter_entry_is_what_the_reader_reads_of_the_file():
    entry = inverter_entry("Maker_Inverter.OND", OND)
    inverter = parse_ond(OND.decode("utf-8"), "Maker_Inverter.OND")

    assert entry.sha256 == hashlib.sha256(OND).hexdigest()
    assert (entry.maker, entry.model) == (inverter.manufacturer, inverter.model)
    assert (entry.ac_kw, entry.mppt) == (inverter.pnom_kw, inverter.n_mppt)
    assert (entry.vmpp_min_v, entry.vmpp_max_v, entry.vdc_max_v) == (
        inverter.vmpp_min,
        inverter.vmpp_max,
        inverter.vabs_max,
    )
    assert entry.preliminary is False


def test_an_inverter_its_maker_calls_preliminary_says_so():
    assert inverter_entry("Fronius_Argeno-125-Preliminary.OND", OND).preliminary is True
    assert (
        inverter_entry("Fronius_Argeno-125.OND", OND.replace(b"Model=", b"Model=Preliminary ", 1)).preliminary
        is True
    )


def test_a_file_that_is_no_ond_is_refused_in_the_readers_words():
    with pytest.raises(ValueError, match=r"is not an inverter file \(OND\)"):
        inverter_entry("notes.OND", b"hello\n")


def library(tmp_path: Path) -> Path:
    (tmp_path / "modules").mkdir()
    (tmp_path / "inverters").mkdir()
    (tmp_path / "modules" / "B.PAN").write_bytes(PAN)
    (tmp_path / "modules" / "A.PAN").write_bytes(PAN)
    (tmp_path / "modules" / "Broken.PAN").write_bytes(b"nothing\n")
    (tmp_path / "modules" / "README.md").write_text("not a module")
    (tmp_path / "inverters" / "One.OND").write_bytes(OND)
    return tmp_path


def test_the_catalog_lists_every_file_read_sorted_and_names_the_files_refused(tmp_path):
    catalog, refused = catalog_of(library(tmp_path))

    assert [entry["file"] for entry in catalog["modules"]] == ["A.PAN", "B.PAN"]
    assert [entry["file"] for entry in catalog["inverters"]] == ["One.OND"]
    assert [(r.file, "is not a module file (PAN)" in r.reason) for r in refused] == [
        ("modules/Broken.PAN", True)
    ]


def test_main_writes_the_catalog_beside_the_files_and_fails_when_a_file_is_refused(tmp_path, capsys):
    root = library(tmp_path)

    assert main([str(root)]) == 1
    written = json.loads((root / "catalog.json").read_text(encoding="utf-8"))
    assert len(written["modules"]) == 2
    assert "modules/Broken.PAN" in capsys.readouterr().err

    (root / "modules" / "Broken.PAN").unlink()
    assert main([str(root)]) == 0
