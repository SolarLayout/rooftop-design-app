"""The bundled samples are package data: they sit inside rooftop_core, so they are there when installed."""

from pathlib import Path

import pytest

import rooftop_core
from rooftop_core.resources import SAMPLE_OND, SAMPLE_PAN, sample_path, samples_dir


def test_samples_sit_inside_the_package():
    assert samples_dir() == Path(rooftop_core.__file__).resolve().parent / "samples"


@pytest.mark.parametrize("name", [SAMPLE_PAN, SAMPLE_OND, "pune_weather.json"])
def test_every_sample_is_there(name):
    assert Path(sample_path(name)).is_file()


def test_the_samples_are_the_equipment_of_the_demo_and_its_weather():
    assert (SAMPLE_PAN, SAMPLE_OND) == ("waaree-bin-08-580.PAN", "wattpower-wp-330ktl-h1.OND")
    assert sorted(path.name for path in samples_dir().iterdir() if not path.name.startswith(".")) == [
        "pune_weather.json",
        "waaree-bin-08-580.PAN",
        "wattpower-wp-330ktl-h1.OND",
    ]
