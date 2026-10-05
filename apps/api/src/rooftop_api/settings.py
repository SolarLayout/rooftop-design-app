"""What the server is told through its environment.

Each setting is read when it is asked for, never at import, so that a test can set the environment
and the answer follows.
"""

import os
from collections.abc import Mapping

# "off" turns the downloads of weather from PVGIS and NASA POWER off; anything else, or nothing, leaves
# them on. The test stack starts its API with it off (tools/dev.ts), so that a browser test which missed
# a route is refused in words instead of reaching PVGIS unseen (plan/phase-08-plan.md, decision 13).
WEATHER_DOWNLOADS = "ROOFTOP_WEATHER_DOWNLOADS"
OFF = "off"


def weather_downloads_on(environ: Mapping[str, str] | None = None) -> bool:
    """Whether this server downloads weather. The process's environment unless *environ* is given."""
    value = (os.environ if environ is None else environ).get(WEATHER_DOWNLOADS, "")
    return value.strip().lower() != OFF


# How many threads simulate the stringing options at once. Unset, the engine's own count
# (rooftop_core.options.SIMULATION_THREADS). On AWS Lambda the memory sets the CPU share, and every thread
# holds its simulation's arrays at once: fewer threads, less memory (plan/phase-12-plan.md, decision 3).
SIMULATION_THREADS = "ROOFTOP_SIMULATION_THREADS"

# The commit the server was built from, set by the image's build (apps/api/Dockerfile). Unset in development.
COMMIT = "ROOFTOP_COMMIT"


def simulation_threads(environ: Mapping[str, str] | None = None) -> int | None:
    """The threads asked for, or None for the engine's own. Anything but a count of 1 or more is refused."""
    value = (os.environ if environ is None else environ).get(SIMULATION_THREADS, "").strip()
    if not value:
        return None
    if not value.isdigit() or int(value) < 1:
        raise ValueError(f"{SIMULATION_THREADS} must be a whole number of 1 or more, got {value!r}.")
    return int(value)


def commit(environ: Mapping[str, str] | None = None) -> str | None:
    """The commit the server was built from, or None when the build did not say."""
    value = (os.environ if environ is None else environ).get(COMMIT, "").strip()
    return value or None
