"""Progress of a design run: which step runs, and how far the whole run is.

The step names are those the desktop app showed while it worked. The fractions are shares of the time
a run takes on the Pune demo, where the hourly shading is two thirds of it and the options the rest.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

FITTING = "Fitting modules on the roof"
SHADING = "Computing hourly shading for every module"
LOSSES = "Applying the losses"
OPTIONS = "Sizing strings and simulating the options"

# Where each step of Design.prepare begins, as a fraction of prepare.
FITTING_AT = 0.0
WEATHER_AT = 0.01
SHADING_AT = 0.02
LOSSES_AT = 0.98
# Where the options begin, as a fraction of Design.run_options; prepare fills what comes before.
OPTIONS_AT = 0.67
# Inside a step a report is sent when the run has come this much further: fifty in a run at most.
SMALLEST_STEP = 0.02


def loading_weather(source_label: str) -> str:
    """The name of the weather step for a source, as in "Loading PVGIS TMY weather"."""
    return f"Loading {source_label} weather"


@dataclass(frozen=True)
class ProgressEvent:
    step: str  # what the engine is doing, in words for the user
    fraction: float  # 0 to 1 of the whole run; 1 only when the run is over


ProgressCallback = Callable[[ProgressEvent], None]
# Hears how far a step is: so many of its parts are over, of so many.
PartCallback = Callable[[int, int], None]


class Reporter:
    """Hands the steps of one run to the listener, if there is one."""

    def __init__(self, on_progress: ProgressCallback | None):
        self._on_progress = on_progress
        self._step = ""
        self._from = self._until = self._told = 0.0

    def begin(self, step: str, fraction: float, until: float | None = None) -> None:
        """A step begins at *fraction* of the run. With *until*, where it ends, its parts can be told."""
        self._step = step
        self._from = self._told = fraction
        self._until = fraction if until is None else until
        self._send(step, fraction)

    def part(self, done: int, total: int) -> None:
        """*done* of the *total* parts of the step that began last are over.

        Told only when the run has come further by SMALLEST_STEP, and never as the end of the run.
        """
        if total <= 0:
            return
        fraction = self._from + (self._until - self._from) * min(done, total) / total
        if fraction - self._told >= SMALLEST_STEP - 1e-12 and fraction < 1.0:
            self._told = fraction
            self._send(self._step, fraction)

    def finish(self, step_when_nothing_ran: str) -> None:
        """The run is over. Named after the last step that ran, or the one given when all was there."""
        self._send(self._step or step_when_nothing_ran, 1.0)

    def _send(self, step: str, fraction: float) -> None:
        if self._on_progress is not None:
            self._on_progress(ProgressEvent(step, fraction))
