"""The bundled samples are package data: they sit inside rooftop_core, so they are there when installed."""

from pathlib import Path

import pytest

import rooftop_core
from rooftop_core.resources import sample_path, samples_dir


def test_samples_sit_inside_the_package():
    assert samples_dir() == Path(rooftop_core.__file__).resolve().parent / "samples"


@pytest.mark.parametrize("name", ["Test.PAN", "Test-S.ond", "pune_weather.json"])
def test_every_sample_is_there(name):
    assert Path(sample_path(name)).is_file()
