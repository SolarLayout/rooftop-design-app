"""The .rtd project: format 2 embeds the PAN, OND and CSV text; format 1 files still open."""

import json
import shutil
from dataclasses import asdict
from pathlib import Path

import pytest

from rooftop_core.demo import demo_project
from rooftop_core.errors import MissingEquipmentFile, UnsupportedProjectFormat, WeatherNotLoaded
from rooftop_core.project import FORMAT_VERSION, Design, Project
from rooftop_core.resources import SAMPLE_OND, SAMPLE_PAN
from tests.equipment import fixture_path

PAN_TEXT = Path(fixture_path("Test.PAN")).read_text(encoding="utf-8")
OND_TEXT = Path(fixture_path("Test-S.ond")).read_text(encoding="utf-8")
ADDED_IN_FORMAT_2 = ("pan_text", "ond_text", "weather_csv_text")


def _through_a_file(project: Project) -> Project:
    """What comes back after the project was written as JSON text and read again."""
    return Project.from_json(json.loads(json.dumps(project.to_json())))


def _format_1(project: Project) -> dict:
    """The project as the desktop app (format 1) wrote it."""
    written = asdict(project)
    for name in ADDED_IN_FORMAT_2:
        del written[name]
    written["format"] = 1
    return json.loads(json.dumps(written))


def _light_project(**changes) -> Project:
    """The demo without its weather, which no test here needs."""
    project = demo_project()
    project.weather_json = None
    for name, value in changes.items():
        setattr(project, name, value)
    return project


# ── format 2 ─────────────────────────────────────────────────────────────────
def test_a_new_project_embeds_nothing_yet():
    project = Project()

    assert (project.pan_text, project.ond_text, project.weather_csv_text) == ("", "", "")


def test_a_project_is_written_as_format_2():
    written = Project().to_json()

    assert FORMAT_VERSION == 2
    assert written["format"] == 2
    assert all(name in written for name in ADDED_IN_FORMAT_2)


def test_format_2_comes_back_as_it_was_written():
    project = demo_project()
    project.pan_path, project.pan_text = "Test.PAN", PAN_TEXT
    project.ond_path, project.ond_text = "Test-S.ond", OND_TEXT
    project.weather_csv, project.weather_csv_text = "site.csv", "time,GHI\n2023-01-01 00:00,0\n"

    assert _through_a_file(project) == project


def test_a_saved_project_comes_back_from_its_file(tmp_path):
    project = _light_project(pan_path="Test.PAN", pan_text=PAN_TEXT)
    path = tmp_path / "roof.rtd"

    project.save(path)

    assert json.loads(path.read_text())["format"] == 2
    assert Project.load(path) == project


def test_saved_overrides_come_back_exactly():
    project = _light_project(
        t_min_override=7.25,
        t_max_override=43.5,
        custom=(27, 20, 1),
        cell_rise_c=25.0,
        imax_mppt_override=32.5,
        voc_coefficient_pct=-0.29,
    )

    back = _through_a_file(project)

    assert back.t_min_override == 7.25
    assert back.t_max_override == 43.5
    assert back.custom == (27, 20, 1) and isinstance(back.custom, tuple)
    assert back.cell_rise_c == 25.0
    assert back.imax_mppt_override == 32.5
    assert back.voc_coefficient_pct == -0.29


def test_overrides_that_were_not_set_stay_unset():
    back = _through_a_file(_light_project())

    assert back.t_min_override is None and back.t_max_override is None
    assert back.custom is None and back.cell_rise_c is None and back.imax_mppt_override is None
    assert back.voc_coefficient_pct is None


def test_restored_overrides_reach_the_design():
    project = _light_project(
        t_min_override=7.25,
        t_max_override=43.5,
        cell_rise_c=30.0,
        imax_mppt_override=32.5,
        voc_coefficient_pct=-0.29,
    )

    design = Design(_through_a_file(project))

    assert (design.t_min, design.t_max, design.cell_rise) == (7.25, 43.5, 30.0)
    assert design.inverter.mppt_current_limit == 32.5
    assert design.coeffs.entered and design.coeffs.mu_voc_pct == -0.29


@pytest.mark.parametrize("fmt", [1, 2])
def test_a_file_written_before_the_voc_coefficient_opens_without_one(fmt):
    written = json.loads(json.dumps(_light_project().to_json()))
    del written["voc_coefficient_pct"]
    written["format"] = fmt

    back = Project.from_json(written)

    assert back.voc_coefficient_pct is None
    assert not Design(back).coeffs.entered


# ── the place's name (D114) ──────────────────────────────────────────────────
def test_the_places_name_comes_back_from_the_file():
    project = _light_project()
    project.place_name = "Pune"

    assert Project.from_json(json.loads(project.to_text())).place_name == "Pune"


@pytest.mark.parametrize("fmt", [1, 2])
def test_a_file_written_before_the_places_name_opens_without_one(fmt):
    written = json.loads(json.dumps(_light_project().to_json()))
    del written["place_name"]
    written["format"] = fmt

    assert Project.from_json(written).place_name == ""


def test_the_demo_is_in_pune():
    assert demo_project().place_name == "Pune"


# ── who set the voltage ──────────────────────────────────────────────────────
@pytest.mark.parametrize("by", ["app", "user"])
def test_who_set_the_voltage_comes_back_from_the_file(by):
    back = _through_a_file(_light_project(system_voltage=1000.0, system_voltage_by=by))

    assert (back.system_voltage, back.system_voltage_by) == (1000.0, by)


@pytest.mark.parametrize("fmt", [1, 2])
def test_a_voltage_in_a_file_of_before_was_the_users_choice(fmt):
    written = json.loads(json.dumps(_light_project(system_voltage=600.0).to_json()))
    del written["system_voltage_by"]
    written["format"] = fmt

    back = Project.from_json(written)

    assert (back.system_voltage, back.system_voltage_by) == (600.0, "user")


def test_a_file_of_before_without_a_voltage_names_no_one():
    written = json.loads(json.dumps(_light_project(system_voltage=None).to_json()))
    del written["system_voltage_by"]

    assert Project.from_json(written).system_voltage_by is None


def test_the_demo_voltage_is_the_users():
    assert (demo_project().system_voltage, demo_project().system_voltage_by) == (1500.0, "user")


# ── format 1 ─────────────────────────────────────────────────────────────────
def test_format_1_opens():
    project = demo_project()
    project.custom = (27, 20, 1)

    back = Project.from_json(_format_1(project))

    assert back == project
    assert (back.pan_text, back.ond_text, back.weather_csv_text) == ("", "", "")


def test_a_file_without_a_format_is_read_as_format_1():
    written = _format_1(_light_project())
    del written["format"]

    assert Project.from_json(written) == _light_project()


def test_a_format_from_the_future_is_refused_in_words():
    written = _light_project().to_json()
    written["format"] = 3

    with pytest.raises(UnsupportedProjectFormat) as error:
        Project.from_json(written)

    assert str(error.value) == (
        "This project file is format 3. This version reads formats 1 and 2. "
        "Open it with a newer version of the app."
    )
    assert error.value.field == "format"


def test_format_1_with_paths_of_another_machine_still_loads():
    written = _format_1(
        _light_project(pan_path="C:\\Users\\prasanta\\PAN\\Big.PAN", ond_path="/home/p/Inv.ond")
    )

    project = Project.from_json(written)

    assert project.pan_path == "C:\\Users\\prasanta\\PAN\\Big.PAN"
    assert project.ond_path == "/home/p/Inv.ond"


# ── equipment of the design ──────────────────────────────────────────────────
def test_a_module_file_that_is_not_here_must_be_chosen_again():
    project = _light_project(pan_path="C:\\Users\\prasanta\\PAN\\Big.PAN")

    with pytest.raises(MissingEquipmentFile) as error:
        Design(project)

    assert (
        str(error.value) == "The module file Big.PAN (PAN) is not included in this project. Choose it again."
    )
    assert error.value.field == "pan_path"


def test_an_inverter_file_that_is_not_here_must_be_chosen_again():
    project = _light_project(ond_path="/home/p/Inv.ond")

    with pytest.raises(MissingEquipmentFile) as error:
        Design(project)

    assert (
        str(error.value)
        == "The inverter file Inv.ond (OND) is not included in this project. Choose it again."
    )
    assert error.value.field == "ond_path"


def test_nothing_is_put_in_the_place_of_a_missing_file():
    project = _light_project(pan_path="/nowhere/Big.PAN", ond_path="/nowhere/Inv.ond")

    with pytest.raises(MissingEquipmentFile, match="Big.PAN"):
        Design(project)


def test_empty_paths_mean_the_bundled_samples_named_by_their_files_alone():
    design = Design(_light_project())

    # The user is shown the file's name; where the server keeps it is none of theirs.
    assert design.module.pnom_w == 580 and design.module.source == SAMPLE_PAN
    assert design.inverter.pnom_kw == 275 and design.inverter.source == SAMPLE_OND


def test_embedded_text_is_used_and_the_path_only_names_it():
    bigger = PAN_TEXT.replace("PNom=560", "PNom=565")
    assert bigger != PAN_TEXT
    project = _light_project(
        pan_path="C:\\Users\\prasanta\\PAN\\Big.PAN",
        pan_text=bigger,
        ond_path="/home/p/Inv.ond",
        ond_text=OND_TEXT,
    )

    design = Design(project)

    assert design.module.pnom_w == 565 and design.module.source == "Big.PAN"
    assert design.inverter.pnom_kw == 275 and design.inverter.source == "Inv.ond"


def test_embedded_text_wins_over_a_file_that_is_here(tmp_path):
    here = tmp_path / "Test.PAN"
    shutil.copy(fixture_path("Test.PAN"), here)
    project = _light_project(pan_path=str(here), pan_text=PAN_TEXT.replace("PNom=560", "PNom=565"))

    assert Design(project).module.pnom_w == 565


def test_a_path_that_is_here_is_read_as_on_the_desktop(tmp_path):
    here = tmp_path / "Test.PAN"
    shutil.copy(fixture_path("Test.PAN"), here)

    design = Design(_light_project(pan_path=str(here)))

    assert design.module.pnom_w == 560 and design.module.source == str(here)


# ── a server reads no files of its own machine ───────────────────────────────
def test_a_server_does_not_read_a_pan_from_its_own_disk(tmp_path):
    here = tmp_path / "Test.PAN"
    shutil.copy(fixture_path("Test.PAN"), here)

    with pytest.raises(MissingEquipmentFile) as error:
        Design(_light_project(pan_path=str(here)), local_files=False)

    assert (
        str(error.value) == "The module file Test.PAN (PAN) is not included in this project. Choose it again."
    )
    assert error.value.field == "pan_path"


def test_a_server_does_not_read_an_ond_from_its_own_disk(tmp_path):
    here = tmp_path / "Test-S.ond"
    shutil.copy(fixture_path("Test-S.ond"), here)

    with pytest.raises(MissingEquipmentFile) as error:
        Design(_light_project(ond_path=str(here)), local_files=False)

    assert error.value.field == "ond_path"


def test_a_server_still_has_the_bundled_samples_and_the_embedded_text():
    sample = Design(_light_project(), local_files=False)
    embedded = Design(_light_project(pan_path="Big.PAN", pan_text=PAN_TEXT), local_files=False)

    assert sample.module.pnom_w == 580
    assert embedded.module.source == "Big.PAN"


def test_a_server_does_not_read_csv_weather_from_its_own_disk(tmp_path):
    here = tmp_path / "site.csv"
    here.write_text("time,GHI,DNI,DHI\n2023-01-01 00:00,0,0,0\n", encoding="utf-8")
    project = _light_project(weather_source="csv", weather_csv=str(here))

    with pytest.raises(WeatherNotLoaded) as error:
        Design(project, local_files=False).load_weather()

    assert str(error.value) == (
        "The CSV weather file site.csv is not included in this project. Choose it again."
    )
    assert error.value.field == "weather_csv"


def test_on_the_desktop_csv_weather_is_read_from_its_path(tmp_path):
    here = tmp_path / "site.csv"
    here.write_text("time,GHI,DNI,DHI\n2023-01-01 00:00,0,0,0\n", encoding="utf-8")
    project = _light_project(weather_source="csv", weather_csv=str(here))

    assert Design(project).load_weather().label == "site.csv"
