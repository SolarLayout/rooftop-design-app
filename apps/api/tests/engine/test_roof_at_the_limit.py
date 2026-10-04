"""The measurement at the limit (tools/roof_at_the_limit.py): its roof and its reading of the steps' times."""

import pytest

from rooftop_core.demo import PUNE, demo_project
from rooftop_core.geometry import ROOF_AREA_LIMIT_M2
from rooftop_core.progress import FITTING, LOSSES, OPTIONS, SHADING
from tools.roof_at_the_limit import Heard, project_at_the_limit, seconds_by_step


def test_the_roof_is_the_demo_at_the_limit_without_obstacles():
    project = project_at_the_limit()
    demo = demo_project()

    assert project.roof.area_m2 == ROOF_AREA_LIMIT_M2
    assert (project.roof.lat, project.roof.lon) == PUNE
    assert project.roof.obstacles == []
    assert project.system_voltage == demo.system_voltage == 1500.0
    assert (project.pan_path, project.ond_path) == (demo.pan_path, demo.ond_path)
    assert project.weather_json == demo.weather_json
    assert (project.roof_input["length"], project.roof_input["width"]) == (300.0, 100.0)


def test_each_step_runs_from_its_first_event_to_the_next_steps_first():
    heard = [
        Heard(0.0, FITTING, 0.0),
        Heard(1.5, "Loading PVGIS TMY weather", 0.01),
        Heard(1.6, SHADING, 0.02),
        Heard(20.0, SHADING, 0.3),
        Heard(41.6, LOSSES, 0.65),
        Heard(43.6, OPTIONS, 0.67),
        Heard(60.0, OPTIONS, 0.9),
        Heard(73.6, OPTIONS, 1.0),
    ]

    seconds = seconds_by_step(heard)

    assert list(seconds) == [FITTING, "Loading PVGIS TMY weather", SHADING, LOSSES, OPTIONS]
    assert seconds[FITTING] == pytest.approx(1.5)
    assert seconds[SHADING] == pytest.approx(40.0)
    assert seconds[LOSSES] == pytest.approx(2.0)
    assert seconds[OPTIONS] == pytest.approx(30.0)
