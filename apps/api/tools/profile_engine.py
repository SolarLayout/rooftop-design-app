"""The engine's profile (plan/phase-11-plan.md, step 36; issue #76), written to plan/reference/api-profile.md.

The demo and the roof at the limit (tools/roof_at_the_limit.py), each run as the API runs a design and with no
memo: the time of every step of a design run and the peak memory of the process after it, the size of what the
memo would keep, the time to draw the report's pages and the PDF, what a loss edit costs with the memo, and
under cProfile the heaviest functions of ours in the shading and in the options.
Run from apps/api: uv run python -m tools.profile_engine [demo|limit] [--hot-spots]
"""

from __future__ import annotations

import copy
import cProfile
import pstats
import resource
import sys
import time
import tracemalloc
from collections.abc import Iterable
from dataclasses import dataclass, replace

from rooftop_core import memo as memo_mod
from rooftop_core import options as options_mod
from rooftop_core.demo import demo_project
from rooftop_core.export import files, report
from rooftop_core.progress import ProgressEvent
from rooftop_core.project import Design, Project
from rooftop_core.simulation import after_the_year
from tools.roof_at_the_limit import project_at_the_limit

END = "end of the run"
AFTER_THE_YEAR = "the figures after the year"
PAGE_DPI = 150
HOT_SPOTS = 10
OURS = "rooftop_core"
ORCHESTRATION = ("project.py",)  # the Design's methods: they call the stages and do nothing of their own
MEGABYTE = 2**20


@dataclass(frozen=True)
class Reading:
    """A progress event with the second of the run it came at and the process's peak memory then."""

    at: float
    step: str
    rss: int  # bytes


@dataclass(frozen=True)
class StepReading:
    step: str
    seconds: float
    peak_bytes: int  # the process's high-water mark when the step was over


@dataclass(frozen=True)
class HotSpot:
    function: str
    where: str  # the file under rooftop_core and the line
    calls: int
    cumulative_s: float


def rss_bytes(ru_maxrss: int, platform: str = sys.platform) -> int:
    """ru_maxrss in bytes: macOS reports bytes, Linux kibibytes."""
    return ru_maxrss if platform == "darwin" else ru_maxrss * 1024


def peak_rss() -> int:
    return rss_bytes(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)


def by_step(readings: Iterable[Reading]) -> list[StepReading]:
    """Each step from its first reading to the next step's first; the last reading closes the run (END)."""
    events = list(readings)
    begins = [events[n] for n in range(len(events)) if n == 0 or events[n].step != events[n - 1].step]
    ends = begins[1:] + [events[-1]]
    return [
        StepReading(begin.step, end.at - begin.at, end.rss)
        for begin, end in zip(begins, ends, strict=True)
        if begin.step != END
    ]


def heaviest_of_ours(
    stats: dict, n: int = HOT_SPOTS, leaving_out: tuple[str, ...] = ORCHESTRATION
) -> list[HotSpot]:
    """The *n* functions of rooftop_core with the most cumulative time, from a pstats stats dict
    {(file, line, function): (primitive calls, calls, own time, cumulative time, callers)}; the files in
    *leaving_out* (the Design's own methods, which only call the stages) are not listed."""
    ours = [
        HotSpot(function, f"{file.split(OURS + '/', 1)[1]}:{line}", calls, cumulative)
        for (file, line, function), (_, calls, _, cumulative, _) in stats.items()
        if OURS + "/" in file and not file.endswith(leaving_out)
    ]
    return sorted(ours, key=lambda spot: -spot.cumulative_s)[:n]


# ── the measurements ─────────────────────────────────────────────────────────
@dataclass(frozen=True)
class RunProfile:
    design: Design
    steps: list[StepReading]
    total_s: float
    shading_bytes: int
    options_bytes: int


def measure_run(project: Project) -> RunProfile:
    """The design run whole with no memo, each step timed with the process's peak memory after it; then
    the figures after the year worked out once more over the options, timed: the run does not report them."""
    design = Design(project)
    readings: list[Reading] = []
    started = time.perf_counter()

    def on_progress(event: ProgressEvent) -> None:
        readings.append(Reading(time.perf_counter() - started, event.step, peak_rss()))

    design.run_options(on_progress)
    total = time.perf_counter() - started
    readings.append(Reading(total, END, peak_rss()))
    steps = by_step(readings)
    began = time.perf_counter()
    for option in design.options:
        after_the_year(option.result, project.losses)
    steps.append(StepReading(AFTER_THE_YEAR, time.perf_counter() - began, peak_rss()))
    return RunProfile(
        design,
        steps,
        total,
        memo_mod._bytes_of_shading(design.pre.shading),
        memo_mod._bytes_of_options(tuple(design.options)),
    )


def measure_pages(design: Design) -> tuple[float, float, int]:
    """Seconds to draw the report's pages as PNGs at the preview's dpi, seconds to write the PDF, and the
    bytes of the PNGs."""
    began = time.perf_counter()
    pngs = [report.page_png(page, PAGE_DPI) for page in report.report_pages(design)]
    pages_s = time.perf_counter() - began
    began = time.perf_counter()
    files.export_pdf_bytes(design)
    return pages_s, time.perf_counter() - began, sum(len(png) for png in pngs)


def with_losses(project: Project, **changed: float) -> Project:
    """A copy of the project with these losses changed, as an edit in the web app sends it."""
    edited = copy.deepcopy(project)
    edited.losses = replace(edited.losses, **changed)
    return edited


def measure_loss_edits(project: Project) -> dict[str, float]:
    """What a run costs with the memo as the API keeps it: the first run, then a soiling edit (the shading
    kept, the options simulated again) and a degradation edit (everything kept but the figures after the
    year). Each edit is a new Design on the edited project, as every request of the API is."""
    kept = memo_mod.MemoryMemo()
    seconds: dict[str, float] = {}
    for name, edited in [
        ("first run", project),
        ("soiling edit", with_losses(project, soiling_pct=project.losses.soiling_pct + 1.0)),
        ("degradation edit", with_losses(project, degradation_pct=project.losses.degradation_pct + 0.1)),
    ]:
        began = time.perf_counter()
        Design(edited, memo=kept).run_options()
        seconds[name] = time.perf_counter() - began
    return seconds


@dataclass(frozen=True)
class Stage:
    name: str
    spots: list[HotSpot]
    traced_peak_bytes: int  # tracemalloc's peak of what Python and numpy allocated during the stage


def hot_spots(project: Project) -> list[Stage]:
    """Prepare (the shading, then the losses) and the options, each run twice apart from the other: once
    under cProfile for the heaviest functions of ours, once under tracemalloc for the peak of the allocations
    the stage makes (ru_maxrss is the process's high-water mark and never falls; this says what the stage
    itself takes). The options are simulated one after the other here: cProfile sees the main thread alone."""
    design = Design(project)
    design.generate_layout()
    design.load_weather()
    threads = options_mod.SIMULATION_THREADS
    options_mod.SIMULATION_THREADS = 1
    try:
        spots = _profiled(design.prepare)
        design.pre = None
        prepare = Stage("shading and losses (Design.prepare)", spots, _traced_peak(design.prepare))
        spots = _profiled(design.run_options)
        options = Stage("options (Design.run_options after prepare)", spots, _traced_peak(design.run_options))
        return [prepare, options]
    finally:
        options_mod.SIMULATION_THREADS = threads


def _profiled(run) -> list[HotSpot]:
    profiler = cProfile.Profile()
    profiler.enable()
    run()
    profiler.disable()
    return heaviest_of_ours(pstats.Stats(profiler).stats)


def _traced_peak(run) -> int:
    tracemalloc.start()
    try:
        run()
        return tracemalloc.get_traced_memory()[1]
    finally:
        tracemalloc.stop()


# ── the print-out, in the tables of the document ─────────────────────────────
def mb(n: int) -> str:
    return f"{n / MEGABYTE:,.0f} MB"


def print_run(name: str, project: Project, with_hot_spots: bool) -> None:
    print(f"\n## {name}\n")
    print(f"Peak memory after the imports, before the run: {mb(peak_rss())}\n")
    run = measure_run(project)
    layout, chosen = run.design.layout, run.design.chosen
    print(
        f"Roof {run.design.p.roof.area_m2:,.0f} m², {layout.n_modules:,} positions in {layout.n_rows} rows; "
        f"options {len(run.design.options)}"
        + (f"; chosen {chosen.key}, {chosen.result.energy_mwh:,.1f} MWh/yr" if chosen else "")
    )
    print("\n| Step | Seconds | Peak memory of the process after the step |\n|---|---|---|")
    for step in run.steps:
        print(f"| {step.step} | {step.seconds:.2f} | {mb(step.peak_bytes)} |")
    print(f"| the run in all | {run.total_s:.2f} | |")
    print(
        f"\nMemo: shading {mb(run.shading_bytes)} ({run.shading_bytes:,} bytes), "
        f"options {mb(run.options_bytes)} ({run.options_bytes:,} bytes)"
    )
    pages_s, pdf_s, png_bytes = measure_pages(run.design)
    print(
        f"Report: pages as PNGs at {PAGE_DPI} dpi {pages_s:.2f} s ({png_bytes:,} bytes), PDF {pdf_s:.2f} s; "
        f"peak after drawing {mb(peak_rss())}"
    )
    edits = measure_loss_edits(project)
    print("\n| With the memo | Seconds |\n|---|---|")
    for edit, seconds in edits.items():
        print(f"| {edit} | {seconds:.2f} |")
    if with_hot_spots:
        for stage in hot_spots(project):
            print(f"\n### Hot spots: {stage.name}\n")
            print(f"Peak of the allocations of the stage (tracemalloc): {mb(stage.traced_peak_bytes)}\n")
            print("| Function | Where | Calls | Cumulative s |\n|---|---|---|---|")
            for spot in stage.spots:
                print(f"| {spot.function} | {spot.where} | {spot.calls:,} | {spot.cumulative_s:.2f} |")


def threads_asked(args: list[str]) -> int:
    """`--threads N`: how many threads simulate the options; the engine's own number without it."""
    return int(args[args.index("--threads") + 1]) if "--threads" in args else options_mod.SIMULATION_THREADS


def main(args: list[str]) -> None:
    roofs = {"demo": ("The demo", demo_project), "limit": ("The roof at the limit", project_at_the_limit)}
    wanted = [arg for arg in args if arg in roofs] or list(roofs)
    options_mod.SIMULATION_THREADS = threads_asked(args)
    for name in wanted:
        title, make = roofs[name]
        print_run(
            f"{title}, the options in {options_mod.SIMULATION_THREADS} thread(s)",
            make(),
            "--hot-spots" in args,
        )


if __name__ == "__main__":
    main(sys.argv[1:])
