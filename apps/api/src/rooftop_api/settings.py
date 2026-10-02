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
