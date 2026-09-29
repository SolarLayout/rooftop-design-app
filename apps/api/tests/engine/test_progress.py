"""Design.prepare and Design.run_options tell the caller which step runs and how far the run is."""

from dataclasses import FrozenInstanceError

import pytest

from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Obstacle, Roof
from rooftop_core.progress import (
    FITTING,
    LOSSES,
    OPTIONS,
    SHADING,
    ProgressEvent,
    loading_weather,
)
from rooftop_core.project import Design, Project

pytestmark = pytest.mark.slow

WEATHER = "Loading PVGIS TMY weather"


def small_project(system_voltage: float | None = 1500.0) -> Project:
    """A 30 x 14 m roof at the site of the demo, with its weather: a run takes a second or two."""
    project = demo_project()
    project.roof = Roof(outline=rectangle(30.0, 14.0), lat=project.roof.lat, lon=project.roof.lon)
    project.roof.obstacles = [Obstacle("Tank", "cylinder", x=8.0, y=7.0, diameter=2.0, height=2.0)]
    project.system_voltage = system_voltage
    return project


class Listener:
    def __init__(self):
        self.events: list[ProgressEvent] = []

    def __call__(self, event: ProgressEvent) -> None:
        self.events.append(event)

    @property
    def steps(self) -> list[str]:
        return [event.step for event in self.events]

    @property
    def fractions(self) -> list[float]:
        return [event.fraction for event in self.events]


def assert_runs_forward_to_the_end(listener: Listener) -> None:
    fractions = listener.fractions
    assert fractions == sorted(fractions), "a fraction went back"
    assert all(0.0 <= fraction <= 1.0 for fraction in fractions)
    assert fractions[-1] == 1.0
    assert all(fraction < 1.0 for fraction in fractions[:-1]), "only the last event says the run is over"


def test_an_event_names_a_step_and_a_fraction_and_cannot_be_changed():
    event = ProgressEvent(step=FITTING, fraction=0.25)

    assert (event.step, event.fraction) == ("Fitting modules on the roof", 0.25)
    with pytest.raises(FrozenInstanceError):
        event.fraction = 0.5


def test_the_steps_are_named_as_the_desktop_app_named_them():
    assert FITTING == "Fitting modules on the roof"
    assert loading_weather("PVGIS TMY") == "Loading PVGIS TMY weather"
    assert SHADING == "Computing hourly shading for every module"
    assert LOSSES == "Applying the losses"
    assert OPTIONS == "Sizing strings and simulating the options"


def test_a_full_run_reports_every_step_in_order():
    listener = Listener()
    design = Design(small_project())

    options = design.run_options(on_progress=listener)

    assert options
    assert listener.steps == [FITTING, WEATHER, SHADING, LOSSES, OPTIONS, OPTIONS]
    assert listener.fractions[0] == 0.0
    assert_runs_forward_to_the_end(listener)


def test_prepare_reports_its_steps_and_ends_at_one():
    listener = Listener()
    design = Design(small_project())

    design.prepare(on_progress=listener)

    assert listener.steps == [FITTING, WEATHER, SHADING, LOSSES, LOSSES]
    assert_runs_forward_to_the_end(listener)


def test_what_is_already_there_is_not_reported_again():
    design = Design(small_project())
    design.generate_layout()
    first, second, third = Listener(), Listener(), Listener()

    design.prepare(on_progress=first)
    design.prepare(on_progress=second)
    design.run_options(on_progress=third)

    assert first.steps == [WEATHER, SHADING, LOSSES, LOSSES]
    assert second.events == [ProgressEvent(LOSSES, 1.0)]
    assert third.steps == [OPTIONS, OPTIONS]
    for listener in (first, second, third):
        assert_runs_forward_to_the_end(listener)


def test_without_a_system_voltage_the_run_ends_after_the_losses():
    listener = Listener()
    design = Design(small_project(system_voltage=None))

    options = design.run_options(on_progress=listener)

    assert options == []
    assert listener.steps == [FITTING, WEATHER, SHADING, LOSSES, LOSSES]
    assert OPTIONS not in listener.steps
    assert_runs_forward_to_the_end(listener)


def test_listening_does_not_change_the_result():
    heard, unheard = Design(small_project()), Design(small_project())

    heard.run_options(on_progress=Listener())
    unheard.run_options()

    assert [o.key for o in heard.options] == [o.key for o in unheard.options]
    assert [o.result.energy_mwh for o in heard.options] == [o.result.energy_mwh for o in unheard.options]


def test_the_weather_step_names_the_source_of_the_project():
    project = small_project()
    project.weather_source = "csv"
    project.weather_json["source"] = "csv"
    listener = Listener()

    Design(project).prepare(on_progress=listener)

    assert listener.steps[1] == "Loading CSV file weather"
