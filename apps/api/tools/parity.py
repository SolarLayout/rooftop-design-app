"""Parity with the desktop app's outputs (D64): a snapshot of what the engine gives, and its comparison.

The snapshot of a roof is what the API answers for its design run (every figure the app shows: the
layout's counts, the shading, the sizing, the options with their loss chains, months, years and strings)
and the hours of every option (the hourly CSV). It was taken with the engine as copied from the desktop
app, before Phase 13 changed it; a change of the engine is compared with it, and the comparison says, per
figure, identical or by how much it moved.
Run from apps/api:
  uv run python -m tools.parity save [demo|limit]    the snapshot, into tests/fixtures/parity (once)
  uv run python -m tools.parity check [demo|limit]   today's engine against it
  uv run python -m tools.parity renew [demo|limit]   after a change of behaviour the owner asked for: what
                                                     moved past the bar is taken from today, the rest kept
"""

from __future__ import annotations

import gzip
import json
import math
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from rooftop_api.services import design as design_service
from rooftop_core.demo import demo_project
from rooftop_core.project import Design, Project
from tools.roof_at_the_limit import project_at_the_limit

HERE = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "parity"
ROOFS = {"demo": demo_project, "limit": project_at_the_limit}
RELATIVE = 1e-6  # energies, powers, irradiations: the bar of D64
ABSOLUTE = 1e-6  # in the figure's own unit (kW, W/m², °C, MWh): near zero a relative bar says nothing
PERCENT_POINTS = 1e-3  # a figure in percent may move this much


def snapshot(project: Project) -> dict[str, Any]:
    """What the API answers for the design run of *project*, with no memo, and every option's hours."""
    return snapshot_of(Design(project))


def snapshot_of(design: Design) -> dict[str, Any]:
    """What the API answers for the design run of *design*, and every option's hours, as JSON reads them."""
    result = design_service.result(design_service.Run(design, []))
    taken = {
        "result": result.model_dump(mode="json"),
        "hourly": {
            option.key: {name: [float(v) for v in column] for name, column in option.result.hourly.items()}
            for option in design.options
        },
    }
    return portable(json.loads(json.dumps(taken)))


def saved(roof: str) -> dict[str, Any]:
    with gzip.open(path_of(roof), "rt", encoding="utf-8") as f:
        return portable(json.load(f))


def portable(taken: dict[str, Any]) -> dict[str, Any]:
    """The snapshot without what belongs to the machine: the equipment's files by name, not by path."""
    for item in taken["result"].get("equipment", {}).values():
        if isinstance(item, dict) and item.get("source"):
            item["source"] = Path(item["source"]).name
    return taken


@dataclass
class Moved:
    path: str
    was: Any
    now: Any

    @property
    def relative(self) -> float:
        if isinstance(self.was, float) and isinstance(self.now, float):
            return abs(self.now - self.was) / max(abs(self.was), 1e-12)
        return math.inf


def differences(was: Any, now: Any, path: str = "") -> list[Moved]:
    """Every leaf that is not the same, by its path."""
    if isinstance(was, dict) and isinstance(now, dict):
        out: list[Moved] = []
        for key in sorted(set(was) | set(now)):
            out += differences(was.get(key), now.get(key), f"{path}.{key}" if path else str(key))
        return out
    if isinstance(was, list) and isinstance(now, list):
        if len(was) != len(now):
            return [Moved(f"{path} (length)", len(was), len(now))]
        out = []
        for i, (a, b) in enumerate(zip(was, now, strict=True)):
            out += differences(a, b, f"{path}[{i}]")
        return out
    if isinstance(was, int | float) and isinstance(now, int | float) and not isinstance(was, bool):
        if float(was) == float(now):
            return []
        return [Moved(path, float(was), float(now))]
    return [] if was == now else [Moved(path, was, now)]


def within_the_bar(moved: Moved) -> bool:
    if not (isinstance(moved.was, float) and isinstance(moved.now, float)):
        return False
    if "pct" in moved.path.rsplit(".", 1)[-1] and abs(moved.now - moved.was) <= PERCENT_POINTS:
        return True
    return moved.relative <= RELATIVE or abs(moved.now - moved.was) <= ABSOLUTE


def renewed(was: Any, now: Any) -> Any:
    """The snapshot with today's figures where they moved past the bar, and its own wherever they did not.

    An option whose key changed is another option: it is taken whole. What today has not is dropped.
    """
    if isinstance(was, dict) and isinstance(now, dict):
        if "key" in was and "key" in now and was["key"] != now["key"]:
            return now
        return {key: renewed(was[key], value) if key in was else value for key, value in now.items()}
    if isinstance(was, list) and isinstance(now, list):
        if len(was) != len(now):
            return now
        return [renewed(a, b) for a, b in zip(was, now, strict=True)]
    return was if all(within_the_bar(m) for m in differences(was, now)) else now


def family(path: str) -> str:
    """The path with its list indices dropped: one line per kind of figure."""
    out, depth = [], 0
    for ch in path:
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
        elif depth == 0:
            out.append(ch)
    return "".join(out)


def report(moved: list[Moved]) -> str:
    if not moved:
        return "Identical to the snapshot, every figure to the bit."
    by_family: dict[str, list[Moved]] = {}
    for m in moved:
        by_family.setdefault(family(m.path), []).append(m)
    past = sum(not within_the_bar(m) for m in moved)
    lines = [
        f"{len(moved):,} figures differ from the snapshot; past the bar: {past:,}.",
        "",
        "| Figure | Count | Largest relative | Example (was → now) | Within the bar |",
        "|---|---|---|---|---|",
    ]
    for name, ms in sorted(by_family.items()):
        worst = max(ms, key=lambda m: m.relative)
        ok = all(within_the_bar(m) for m in ms)
        example = f"{worst.was!r} → {worst.now!r}"
        lines.append(f"| {name} | {len(ms):,} | {worst.relative:.2e} | {example} | {'yes' if ok else 'NO'} |")
    return "\n".join(lines)


def path_of(roof: str) -> Path:
    return HERE / f"{roof}.json.gz"


def main(args: list[str]) -> None:
    action = args[0] if args else "check"
    wanted = [a for a in args[1:] if a in ROOFS] or list(ROOFS)
    for roof in wanted:
        began = time.perf_counter()
        now = snapshot(ROOFS[roof]())
        seconds = time.perf_counter() - began
        if action == "save":
            HERE.mkdir(parents=True, exist_ok=True)
            with gzip.open(path_of(roof), "wt", encoding="utf-8") as f:
                json.dump(now, f, sort_keys=True, separators=(",", ":"))
            print(f"{roof}: saved {path_of(roof)} ({seconds:.1f} s)")
            continue
        if action == "renew":
            was = saved(roof)
            with gzip.open(path_of(roof), "wt", encoding="utf-8") as f:
                json.dump(renewed(was, now), f, sort_keys=True, separators=(",", ":"))
            past = [m for m in differences(was, now) if not within_the_bar(m)]
            print(f"\n## {roof}: renewed ({seconds:.1f} s)\n\n{report(past)}")
            continue
        print(f"\n## {roof} ({seconds:.1f} s)\n\n{report(differences(saved(roof), now))}")


if __name__ == "__main__":
    main(sys.argv[1:])
