"""Design.prepare and Design.run_options tell the caller which step runs and how far the run is."""

from dataclasses import FrozenInstanceError

import pytest

from rooftop_core.demo import rectangle
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
from tools.reference import reference_demo

pytestmark = pytest.mark.slow

WEATHER = "Loading PVGIS TMY weather"


def small_project(system_voltage: float | None = 1500.0) -> Project:
    """A 30 x 14 m roof at the site of the demo, with its weather: a run takes a second or two."""
    project = reference_demo()
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
    def order(self) -> list[str]:
        """The steps in the order they began: a step that reports again is named once."""
        return [step for n, step in enumerate(self.steps) if n == 0 or step != self.steps[n - 1]]

    @property
    def fractions(self) -> list[float]:
        return [event.fraction for event in self.events]

    def of(self, step: str) -> list[float]:
        return [event.fraction for event in self.events if event.step == step]


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
    assert SHADING == "Computing the hourly shading of the modules"
    assert LOSSES == "Applying the losses"
    assert OPTIONS == "Sizing strings and simulating the options"


def test_a_full_run_reports_every_step_in_order():
    listener = Listener()
    design = Design(small_project())

    options = design.run_options(on_progress=listener)

    assert options
    assert listener.order == [FITTING, WEATHER, SHADING, LOSSES, OPTIONS]
    assert listener.fractions[0] == 0.0
    assert_runs_forward_to_the_end(listener)


def test_prepare_reports_its_steps_and_ends_at_one():
    listener = Listener()
    design = Design(small_project())

    design.prepare(on_progress=listener)

    assert listener.order == [FITTING, WEATHER, SHADING, LOSSES]
    assert_runs_forward_to_the_end(listener)


def test_what_is_already_there_is_not_reported_again():
    design = Design(small_project())
    design.generate_layout()
    first, second, third = Listener(), Listener(), Listener()

    design.prepare(on_progress=first)
    design.prepare(on_progress=second)
    design.run_options(on_progress=third)

    assert first.order == [WEATHER, SHADING, LOSSES]
    assert second.events == [ProgressEvent(LOSSES, 1.0)]
    assert third.order == [OPTIONS]
    for listener in (first, second, third):
        assert_runs_forward_to_the_end(listener)


def test_without_a_system_voltage_the_run_ends_after_the_losses():
    listener = Listener()
    design = Design(small_project(system_voltage=None))

    options = design.run_options(on_progress=listener)

    assert options == []
    assert listener.order == [FITTING, WEATHER, SHADING, LOSSES]
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


# ── inside the two long steps ────────────────────────────────────────────────
def test_the_shading_tells_how_far_it_is():
    listener = Listener()

    Design(small_project()).run_options(on_progress=listener)

    shading = listener.of(SHADING)
    assert len(shading) >= 10
    assert shading == sorted(set(shading)), "every report is further than the one before"
    assert shading[0] == pytest.approx(0.02 * 0.67)
    assert shading[-1] <= 0.98 * 0.67 < listener.of(LOSSES)[0] + 1e-9
    assert shading[-1] > 0.9 * 0.67, "at its end the step has come close to the next"


@pytest.fixture
def simulations(monkeypatch) -> list[int]:
    """One entry for every simulation of a year that runs."""
    from rooftop_core import options

    runs: list[int] = []
    real = options.simulate

    def counted(*args, **kwargs):
        runs.append(1)
        return real(*args, **kwargs)

    monkeypatch.setattr(options, "simulate", counted)
    return runs


def test_the_options_tell_how_many_of_them_are_simulated(simulations):
    listener = Listener()

    Design(small_project()).run_options(on_progress=listener)

    reports, simulated = listener.of(OPTIONS), len(simulations)
    assert simulated >= 3
    assert len(reports) == simulated + 1, "the beginning, one after every simulation but the last, the end"
    assert reports[0] == 0.67 and reports[-1] == 1.0
    steps = [later - earlier for earlier, later in zip(reports, reports[1:], strict=False)]
    assert steps == pytest.approx([0.33 / simulated] * simulated)


def test_a_custom_option_is_one_more_to_simulate(simulations):
    project = small_project()
    project.custom = (20, 2, 1)
    listener = Listener()

    options = Design(project).run_options(on_progress=listener)

    assert options[-1].custom
    assert len(listener.of(OPTIONS)) == len(simulations) + 1


def test_a_run_does_not_report_more_often_than_every_fiftieth_of_it():
    listener = Listener()

    Design(small_project()).run_options(on_progress=listener)

    assert len(listener.events) <= 60
    shading = listener.of(SHADING)
    gaps = [later - earlier for earlier, later in zip(shading, shading[1:], strict=False)]
    assert min(gaps) >= 0.02 - 1e-9


def test_shading_that_was_kept_has_nothing_to_report_but_its_beginning():
    from rooftop_core import memo

    kept = memo.MemoryMemo()
    Design(small_project(), memo=kept).run_options()
    listener = Listener()

    Design(small_project(), memo=kept).run_options(on_progress=listener)

    assert listener.order == [FITTING, WEATHER, SHADING, LOSSES, OPTIONS]
    assert listener.of(SHADING) == [pytest.approx(0.02 * 0.67)]
    assert listener.of(OPTIONS) == [0.67, 1.0]
    assert_runs_forward_to_the_end(listener)


def test_the_parts_of_a_step_are_told_without_a_run():
    from rooftop_core.progress import Reporter

    listener = Listener()
    reporter = Reporter(listener)

    reporter.begin("Counting", 0.2, until=0.6)
    for done in range(1, 101):
        reporter.part(done, 100)
    reporter.part(5, 0)

    assert listener.steps == ["Counting"] * len(listener.events)
    assert listener.fractions[0] == 0.2 and listener.fractions[-1] == pytest.approx(0.6)
    assert listener.fractions == sorted(listener.fractions)
    assert len(listener.events) == 21


def test_a_step_that_ends_the_run_leaves_the_end_to_the_end():
    from rooftop_core.progress import Reporter

    listener = Listener()
    reporter = Reporter(listener)

    reporter.begin("Last", 0.5, until=1.0)
    reporter.part(1, 1)
    reporter.finish("Last")

    assert listener.fractions == [0.5, 1.0]
