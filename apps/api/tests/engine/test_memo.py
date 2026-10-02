"""Results that are kept between runs (decision D6): with them a run is faster, and nothing else."""

from concurrent.futures import ThreadPoolExecutor

import pytest

from rooftop_core import memo
from rooftop_core import shading as shading_mod
from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Obstacle, Roof
from rooftop_core.project import Design, Project
from tests.engine.same import assert_same_results
from tests.equipment import fixture_path

pytestmark = pytest.mark.slow

OTHER_MODULE = "tests/fixtures/equipment/emmvee-e620hcbg132-t.PAN"


def small_project(system_voltage: float | None = 1500.0) -> Project:
    """A 30 x 14 m roof at the site of the demo, with its weather: a run takes a second or two."""
    project = demo_project()
    project.roof = Roof(outline=rectangle(30.0, 14.0), lat=project.roof.lat, lon=project.roof.lon)
    project.roof.obstacles = [Obstacle("Tank", "cylinder", x=8.0, y=7.0, diameter=2.0, height=2.0)]
    project.system_voltage = system_voltage
    return project


def run(project: Project, kept: memo.Memo | None) -> Design:
    design = Design(project, memo=kept)
    design.run_options()
    return design


class Counted:
    """Counts the calls of a function of the engine, and lets them through."""

    def __init__(self, monkeypatch, module, name: str):
        self.calls = 0
        self._real = getattr(module, name)
        monkeypatch.setattr(module, name, self)

    def __call__(self, *args, **kwargs):
        self.calls += 1
        return self._real(*args, **kwargs)


@pytest.fixture
def shading_runs(monkeypatch) -> Counted:
    return Counted(monkeypatch, shading_mod, "compute")


@pytest.fixture
def simulations(monkeypatch) -> Counted:
    from rooftop_core import options

    return Counted(monkeypatch, options, "simulate")


# ── the store ────────────────────────────────────────────────────────────────
def test_what_was_kept_comes_back_and_is_not_worked_out_again():
    store = memo.Store(max_bytes=100, size_of=len)
    made = []

    def make() -> str:
        made.append(1)
        return "x" * 10

    assert store.get_or_make("a", make) == "x" * 10
    assert store.get_or_make("a", make) == "x" * 10
    assert len(made) == 1
    assert (store.entries, store.bytes) == (1, 10)


def test_the_entry_used_longest_ago_goes_when_the_store_is_full():
    store = memo.Store(max_bytes=30, size_of=len)
    for key in "abc":
        store.get_or_make(key, lambda: "x" * 10)
    store.get_or_make("a", lambda: "never made")

    store.get_or_make("d", lambda: "x" * 10)

    assert store.keys() == ["c", "a", "d"]
    assert store.bytes == 30


def test_what_is_larger_than_the_store_is_handed_out_and_not_kept():
    store = memo.Store(max_bytes=30, size_of=len)
    store.get_or_make("a", lambda: "x" * 10)

    assert store.get_or_make("large", lambda: "x" * 31) == "x" * 31

    assert store.keys() == ["a"]


def test_a_store_of_no_size_keeps_nothing():
    store = memo.Store(max_bytes=0, size_of=len)

    store.get_or_make("a", lambda: "x")

    assert store.entries == 0


def test_a_fault_while_making_is_passed_on_and_nothing_is_kept():
    store = memo.Store(max_bytes=30, size_of=len)

    def fails() -> str:
        raise ValueError("no")

    with pytest.raises(ValueError, match="no"):
        store.get_or_make("a", fails)
    assert store.get_or_make("a", lambda: "now") == "now"


def test_the_store_can_be_used_by_many_at_once():
    store = memo.Store(max_bytes=50, size_of=len)

    def use(number: int) -> None:
        for turn in range(300):
            key = f"k{(number * 7 + turn) % 11}"
            assert store.get_or_make(key, lambda key=key: key * 3) == key * 3

    with ThreadPoolExecutor(max_workers=8) as pool:
        for done in [pool.submit(use, number) for number in range(8)]:
            done.result()

    assert store.bytes <= 50 and store.bytes == sum(len(key) * 3 for key in store.keys())


# ── the keys ─────────────────────────────────────────────────────────────────
def _keys(project: Project) -> tuple[str, str]:
    design = Design(project)
    design.generate_layout()
    design.load_weather()
    return memo.shading_key(design), memo.options_key(design)


def _changed(change) -> tuple[bool, bool]:
    """(the shading key changed, the options key changed) after *change* was made to the small project."""
    before = _keys(small_project())
    project = small_project()
    change(project)
    after = _keys(project)
    return before[0] != after[0], before[1] != after[1]


def _set(path: str, value):
    def change(project: Project) -> None:
        target = project
        *parents, name = path.split(".")
        for parent in parents:
            target = getattr(target, parent)
        assert getattr(target, name) != value, f"{path} is {value} already"
        setattr(target, name, value)

    return change


def _other_module(project: Project) -> None:
    project.pan_path = OTHER_MODULE
    project.pan_text = open(OTHER_MODULE, encoding="utf-8-sig").read()


def _other_inverter(project: Project) -> None:
    text = open(fixture_path("Test-S.ond"), encoding="latin-1").read()
    project.ond_path, project.ond_text = "Test-S.ond", text.replace("VMppMin=500", "VMppMin=550")


def _weather(change):
    def apply(project: Project) -> None:
        project.weather_json = dict(project.weather_json)
        change(project.weather_json)

    return apply


def _warmer(weather: dict) -> None:
    weather["temp_air"] = [value + 1.0 for value in weather["temp_air"]]


def _brighter(weather: dict) -> None:
    weather["dni"] = [value * 1.01 for value in weather["dni"]]


def _no_horizon(weather: dict) -> None:
    weather["horizon"] = []


def _a_year_later(weather: dict) -> None:
    weather["time"] = [time.replace("2019", "2021") for time in weather["time"]]


def _taller_tank(project: Project) -> None:
    project.roof.obstacles[0].height = 3.0


def _moved_tank(project: Project) -> None:
    project.roof.obstacles[0].x = 9.0


def _another_site(project: Project) -> None:
    project.roof.lat = 18.5205
    project.weather_json = {**project.weather_json, "lat": 18.5205}


NEITHER, OPTIONS_ONLY, BOTH = (False, False), (False, True), (True, True)


@pytest.mark.parametrize(
    ("what", "change", "expected"),
    [
        ("the name of the project", _set("name", "Another name"), NEITHER),
        ("the chosen option", _set("chosen_option", "26x2x1"), NEITHER),
        ("the AC cable", _set("ac_cable_m", 50.0), NEITHER),
        ("how the roof was entered", _set("roof_input", {"mode": "corners"}), NEITHER),
        ("the albedo", _set("roof.albedo", 0.6), OPTIONS_ONLY),
        ("the soiling", _set("losses.soiling_pct", 3.0), OPTIONS_ONLY),
        ("the rear gain", _set("losses.bifacial", False), OPTIONS_ONLY),
        ("the exceedance levels", _set("losses.p_levels", (50, 90, 99)), NEITHER),
        ("the degradation", _set("losses.degradation_pct", 0.7), NEITHER),
        ("the CO2 factor", _set("losses.co2_t_per_mwh", 0.8), NEITHER),
        ("the weather uncertainty", _set("losses.weather_sigma_pct", 5.0), NEITHER),
        ("the model uncertainty", _set("losses.model_sigma_pct", 1.0), NEITHER),
        ("the thermal factor", _set("losses.uc", 25.0), OPTIONS_ONLY),
        ("the system voltage", _set("system_voltage", 1000.0), OPTIONS_ONLY),
        ("the lowest temperature", _set("t_min_override", 0.0), OPTIONS_ONLY),
        ("the highest temperature", _set("t_max_override", 45.0), OPTIONS_ONLY),
        ("the rise of the cell", _set("cell_rise_c", 30.0), OPTIONS_ONLY),
        ("the current per MPPT", _set("imax_mppt_override", 30.0), OPTIONS_ONLY),
        ("a custom option", _set("custom", (20, 2, 1)), NEITHER),
        ("the Voc coefficient", _set("voc_coefficient_pct", -0.29), OPTIONS_ONLY),
        ("the inverter", _other_inverter, OPTIONS_ONLY),
        ("the air temperature", _weather(_warmer), OPTIONS_ONLY),
        ("the beam irradiance", _weather(_brighter), OPTIONS_ONLY),
        ("the horizon", _weather(_no_horizon), BOTH),
        ("the hours of the weather", _weather(_a_year_later), BOTH),
        ("the site", _another_site, BOTH),
        ("the height of an obstacle", _taller_tank, BOTH),
        ("the place of an obstacle", _moved_tank, BOTH),
        ("the parapet", _set("roof.parapet_h", 1.2), BOTH),
        ("the setback", _set("roof.setback_m", 1.5), BOTH),
        ("the walkway", _set("roof.walkway_m", 0.8), BOTH),
        ("the clearance of obstacles", _set("roof.obstacle_clearance_m", 0.8), BOTH),
        ("the roof type", _set("roof.roof_type", "flat_ew"), BOTH),
        ("the outline", _set("roof.outline", rectangle(30.0, 15.0)), BOTH),
        ("the tilt", _set("array.tilt_deg", 10.0), BOTH),
        ("the orientation", _set("array.orientation", "landscape"), BOTH),
        ("the pitch", _set("array.row_pitch_m", 7.0), BOTH),
        ("the window", _set("array.window_end_h", 15.0), BOTH),
        ("shaded positions", _set("array.allow_shaded", True), BOTH),
        ("the design day", _set("array.design_doy", 172), BOTH),
        ("the module", _other_module, BOTH),
    ],
)
def test_a_key_changes_with_what_its_stage_depends_on_and_with_nothing_else(what, change, expected):
    assert _changed(change) == expected, what


def _custom_key(project: Project) -> str:
    design = Design(project)
    design.generate_layout()
    design.load_weather()
    return memo.custom_key(design)


def _with_custom(custom, change=lambda project: None) -> Project:
    project = small_project()
    project.custom = custom
    change(project)
    return project


def test_the_custom_option_has_a_key_of_its_own_beside_the_options():
    """Decision 10: the options are kept without the custom, the custom by the options' key and itself."""
    key = _custom_key(_with_custom((20, 2, 1)))

    assert key == _custom_key(_with_custom((20, 2, 1)))
    assert key == _custom_key(_with_custom((20, 2, 1), _set("chosen_option", "custom")))
    assert key != _custom_key(_with_custom((20, 3, 1)))
    assert key != _custom_key(_with_custom((20, 2, 1), _set("losses.soiling_pct", 3.0)))
    assert key != _custom_key(_with_custom((20, 2, 1), _set("roof.parapet_h", 1.2)))
    assert key not in _keys(_with_custom((20, 2, 1)))


def test_the_same_project_has_the_same_keys_in_another_run():
    assert _keys(small_project()) == _keys(small_project())


def test_a_key_is_a_short_text():
    shading, options = _keys(small_project())

    assert len(shading) == len(options) == 64 and shading != options
    assert all(character in "0123456789abcdef" for character in shading + options)


# ── the design ───────────────────────────────────────────────────────────────
def test_without_a_memo_every_run_works_everything_out(shading_runs, simulations):
    run(small_project(), None)
    first = simulations.calls
    run(small_project(), None)

    assert shading_runs.calls == 2
    assert first > 0 and simulations.calls == 2 * first


def test_the_same_project_again_works_nothing_out(shading_runs, simulations):
    kept = memo.MemoryMemo()
    first = run(small_project(), kept)
    simulated = simulations.calls

    second = run(small_project(), kept)

    assert (shading_runs.calls, simulations.calls) == (1, simulated)
    assert_same_results(first, second)


def test_a_change_of_a_loss_keeps_the_shading_and_simulates_again(shading_runs, simulations):
    kept = memo.MemoryMemo()
    run(small_project(), kept)
    simulated = simulations.calls
    project = small_project()
    project.losses.soiling_pct = 3.0

    changed = run(project, kept)

    assert shading_runs.calls == 1
    assert simulations.calls == 2 * simulated
    assert_same_results(changed, run(project, None))


# The losses that only the figures after the year look at (decision 5 of Phase 8).
AFTER_THE_YEAR = [
    ("losses.degradation_pct", 0.7),
    ("losses.co2_t_per_mwh", 0.8),
    ("losses.p_levels", (50, 90, 99)),
    ("losses.weather_sigma_pct", 5.0),
    ("losses.model_sigma_pct", 1.0),
]


def test_a_change_of_a_figure_after_the_year_simulates_nothing(shading_runs, simulations):
    kept = memo.MemoryMemo()
    run(small_project(), kept)
    simulated = simulations.calls

    for path, value in AFTER_THE_YEAR:
        project = small_project()
        _set(path, value)(project)

        run(project, kept)

        assert (shading_runs.calls, simulations.calls) == (1, simulated), path


def test_the_memo_keeps_the_options_as_simulated_whatever_levels_a_later_run_asks(simulations):
    kept = memo.MemoryMemo()
    first = run(small_project(), kept)
    simulated = simulations.calls
    project = small_project()
    project.losses.p_levels = (50, 90, 99)
    other = run(project, kept)

    again = run(small_project(), kept)

    assert [list(option.result.p_values) for option in other.options] == [[50, 90, 99]] * len(other.options)
    assert simulations.calls == simulated
    assert_same_results(first, again)
    kept_options = kept.option_sets.get_or_make(memo.options_key(first), list)
    assert [option.result.p_values for option in kept_options] == [o.result.p_values for o in first.options]


def test_adding_changing_or_removing_the_custom_option_simulates_it_alone(simulations):
    kept = memo.MemoryMemo()
    run(small_project(), kept)

    for custom, simulated in [((20, 2, 1), 1), ((20, 3, 1), 1), ((20, 2, 1), 0), (None, 0)]:
        before = simulations.calls
        project = _with_custom(custom)

        changed = run(project, kept)

        assert simulations.calls - before == simulated, custom
        assert [option.custom for option in changed.options][-1] is (custom is not None)
        assert_same_results(changed, run(copy_of(project), None))


def test_a_change_of_the_roof_works_the_shading_out_again(shading_runs):
    kept = memo.MemoryMemo()
    run(small_project(), kept)
    project = small_project()
    project.roof.obstacles[0].height = 3.0

    run(project, kept)

    assert shading_runs.calls == 2


def test_without_a_system_voltage_the_shading_is_kept_for_the_run_with_one(shading_runs):
    kept = memo.MemoryMemo()
    waiting = run(small_project(system_voltage=None), kept)

    sized = run(small_project(), kept)

    assert waiting.options == [] and len(sized.options) > 0
    assert shading_runs.calls == 1


def test_what_is_kept_cannot_be_changed_by_who_gets_it():
    kept = memo.MemoryMemo()
    first = run(small_project(), kept)

    with pytest.raises(ValueError, match="read-only"):
        first.pre.shading.f_lin[0, 0] = 1.0
    first.options[0].letter = "Z"
    first.options.clear()

    second = run(small_project(), kept)
    assert second.options[0].letter == "A"


def test_a_chosen_option_is_not_kept_with_the_options():
    kept = memo.MemoryMemo()
    first = run(small_project(), kept)
    project = small_project()
    project.chosen_option = first.options[-1].key

    second = run(project, kept)

    assert first.p.chosen_option == first.options[0].key
    assert second.p.chosen_option == first.options[-1].key
    assert second.chosen.key == first.options[-1].key


# ── the proof: with and without the memo, the same results ───────────────────
EDITS = [
    ("nothing", lambda project: None),
    ("soiling", _set("losses.soiling_pct", 3.0)),
    ("degradation", _set("losses.degradation_pct", 0.7)),
    ("exceedance levels", _set("losses.p_levels", (50, 90, 99))),
    ("albedo", _set("roof.albedo", 0.6)),
    ("system voltage", _set("system_voltage", 1000.0)),
    ("custom option", _set("custom", (20, 2, 1))),
    ("another custom option", _set("custom", (21, 2, 1))),
    ("a custom option that cannot be built", _set("custom", (35, 2, 1))),
    ("taller obstacle", _taller_tank),
    ("east-west", _set("roof.roof_type", "flat_ew")),
    ("no horizon", _weather(_no_horizon)),
    ("module", _other_module),
]
AGAIN = EDITS[:2]  # met a second time, when the memo holds them and the others


def test_dropping_the_memo_changes_nothing_but_the_speed():
    """One memo sees every edit after the other, as a session of a user would. Each result is compared
    with the run that has no memo at all."""
    kept = memo.MemoryMemo()
    for what, change in [*EDITS, *AGAIN]:
        project = small_project()
        change(project)

        with_memo, without = run(project, kept), run(copy_of(project), None)

        try:
            assert_same_results(with_memo, without)
        except AssertionError as error:
            raise AssertionError(f"after the edit of {what}: {error}") from error


def copy_of(project: Project) -> Project:
    return Project.from_json(project.to_json())
