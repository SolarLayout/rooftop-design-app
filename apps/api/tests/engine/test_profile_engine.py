"""The engine's profile (tools/profile_engine.py): its reading of the steps, of the memory and of cProfile."""

import pytest

from rooftop_core.demo import demo_project
from rooftop_core.options import SIMULATION_THREADS
from rooftop_core.progress import FITTING, LOSSES, OPTIONS, SHADING
from tools.profile_engine import (
    END,
    Reading,
    by_step,
    heaviest_of_ours,
    rss_bytes,
    threads_asked,
    with_losses,
)

MB = 2**20


def test_each_step_runs_to_the_next_steps_first_reading_and_ends_at_its_peak():
    readings = [
        Reading(0.0, FITTING, 300 * MB),
        Reading(1.5, SHADING, 310 * MB),
        Reading(20.0, SHADING, 600 * MB),
        Reading(41.5, LOSSES, 900 * MB),
        Reading(43.5, OPTIONS, 920 * MB),
        Reading(73.5, END, 1_000 * MB),
    ]

    steps = by_step(readings)

    assert [step.step for step in steps] == [FITTING, SHADING, LOSSES, OPTIONS]
    assert [step.seconds for step in steps] == pytest.approx([1.5, 40.0, 2.0, 30.0])
    assert [step.peak_bytes for step in steps] == [310 * MB, 900 * MB, 920 * MB, 1_000 * MB]


def test_ru_maxrss_is_bytes_on_macos_and_kibibytes_elsewhere():
    assert rss_bytes(512 * MB, "darwin") == 512 * MB
    assert rss_bytes(512 * 1024, "linux") == 512 * MB


def test_the_heaviest_functions_are_ours_alone_by_cumulative_time_ten_at_most():
    numpy = "/venv/numpy/core/numeric.py"
    orchestration = "/repo/src/rooftop_core/project.py"
    stats = {
        (numpy, 10, "dot"): (1, 500, 9.0, 99.0, {}),
        (orchestration, 283, "run_options"): (1, 1, 0.0, 98.0, {}),
    }
    for n in range(12):
        file = f"/repo/src/rooftop_core/{'shading' if n % 2 else 'simulation'}.py"
        stats[(file, 100 + n, f"f{n}")] = (1, n + 1, 0.1, float(n), {})

    spots = heaviest_of_ours(stats)

    assert len(spots) == 10
    assert [spot.function for spot in spots] == [f"f{n}" for n in range(11, 1, -1)]
    assert spots[0].where == "shading.py:111"
    assert spots[0].calls == 12
    assert spots[0].cumulative_s == 11.0
    assert {"dot", "run_options"}.isdisjoint({spot.function for spot in spots})


def test_the_threads_are_the_engines_unless_asked():
    assert threads_asked(["demo", "--threads", "1"]) == 1
    assert threads_asked(["demo"]) == SIMULATION_THREADS


def test_a_loss_edit_is_a_copy_of_the_project_with_that_loss_changed():
    project = demo_project()

    edited = with_losses(project, soiling_pct=project.losses.soiling_pct + 1.0)

    assert edited.losses.soiling_pct == project.losses.soiling_pct + 1.0
    assert edited.losses.degradation_pct == project.losses.degradation_pct
    assert edited is not project and edited.roof == project.roof
