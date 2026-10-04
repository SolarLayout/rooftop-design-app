"""The measurement at the limit (plan/phase-11-plan.md, step 21, the engine's part).

A flat roof of 300 by 100 m, 30,000 m², at the demo's place with the demo's equipment, weather and voltage:
the layout and the whole design run once, without a memo, and the time of every step printed as the
engine's progress events tell it. Run from apps/api: uv run python tools/roof_at_the_limit.py
"""

from __future__ import annotations

import time
from collections.abc import Iterable
from dataclasses import dataclass

from rooftop_core.demo import demo_project, rectangle
from rooftop_core.geometry import Roof, require_roof_within_limit
from rooftop_core.progress import ProgressEvent
from rooftop_core.project import Design, Project

LENGTH_M = 300.0
WIDTH_M = 100.0


def project_at_the_limit() -> Project:
    """The demo with its roof swapped for the rectangle at the limit, without obstacles."""
    p = demo_project()
    p.name = "Roof at the limit"
    p.roof = Roof(outline=rectangle(LENGTH_M, WIDTH_M), lat=p.roof.lat, lon=p.roof.lon)
    p.roof_input = {**p.roof_input, "length": LENGTH_M, "width": WIDTH_M}
    require_roof_within_limit(p.roof.outline)
    return p


@dataclass(frozen=True)
class Heard:
    """A progress event with the second of the run it came at."""

    at: float
    step: str
    fraction: float


def seconds_by_step(heard: Iterable[Heard]) -> dict[str, float]:
    """How long each step ran: from its first event to the next step's first, the last to the run's end."""
    events = list(heard)
    begins = [(h.at, h.step) for n, h in enumerate(events) if n == 0 or h.step != events[n - 1].step]
    ends = [at for at, _ in begins[1:]] + [events[-1].at]
    return {step: end - at for (at, step), end in zip(begins, ends, strict=True)}


def measure(project: Project) -> tuple[Design, dict[str, float], float]:
    """The design run whole, with no memo: (the design, the seconds of each step, the seconds in all)."""
    design = Design(project)
    heard: list[Heard] = []
    started = time.perf_counter()

    def on_progress(event: ProgressEvent) -> None:
        heard.append(Heard(time.perf_counter() - started, event.step, event.fraction))

    design.run_options(on_progress)
    return design, seconds_by_step(heard), time.perf_counter() - started


def main() -> None:
    design, seconds, total = measure(project_at_the_limit())
    layout, chosen = design.layout, design.chosen
    print(
        f"Roof {LENGTH_M:.0f} x {WIDTH_M:.0f} m, {design.p.roof.area_m2:,.0f} m², at {design.p.roof.lat}, "
        f"{design.p.roof.lon}, {design.p.system_voltage:.0f} V"
    )
    print(
        f"Positions {layout.n_modules:,} in {layout.n_rows} rows, {layout.table_count} tables, "
        f"pitch {layout.pitch:.2f} m"
    )
    print(f"Options {len(design.options)}: {', '.join(o.key for o in design.options)}")
    if chosen is not None:
        print(
            f"Chosen {chosen.key}: {chosen.n_modules:,} modules, {chosen.dc_kwp:,.1f} kWp, "
            f"{chosen.result.energy_mwh:,.1f} MWh/yr"
        )
    for step, took in seconds.items():
        print(f"{took:8.1f} s  {step}")
    print(f"{total:8.1f} s  in all")


if __name__ == "__main__":
    main()
