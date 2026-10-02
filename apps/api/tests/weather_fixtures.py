"""The API's answers to POST /weather for Pune, as the fixtures of the browser tests.

The browser tests answer /api/weather for PVGIS and NASA from e2e/fixtures/weather-*.json
(e2e/fixtures.ts), so that no test reaches the test stack's API for a download (plan/phase-08-plan.md,
decision 13). The files are the API's own answers, made here from the recordings of
tests/fixtures/weather in place of the network:

    cd apps/api && uv run python -m tests.weather_fixtures

tests/api/test_weather_fixtures.py holds that the files are what the API answers now.
"""

import json
from functools import cache
from pathlib import Path
from typing import Any
from unittest import mock

import requests
from fastapi.testclient import TestClient

from rooftop_api.main import app
from rooftop_api.services import weather as service
from tests.recorded import PUNE, Services

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURES = REPO_ROOT / "e2e" / "fixtures"
SOURCES = ("pvgis", "nasa")


def path_of(source: str, directory: Path = FIXTURES) -> Path:
    return directory / f"weather-{source}-pune.json"


@cache
def answer(source: str) -> dict[str, Any]:
    """What the API answers for *source* at Pune, from the recorded services and nothing cached."""
    lat, lon = PUNE
    with (
        mock.patch.object(requests, "get", Services()),
        mock.patch.object(service, "CACHE", service.new_cache()),
    ):
        response = TestClient(app).post("/weather", json={"source": source, "lat": lat, "lon": lon})
    if response.status_code != 200:
        raise RuntimeError(f"/weather answered {response.status_code} for {source}: {response.text}")
    return response.json()


def text_of(source: str) -> str:
    """The file's text: compact JSON with sorted keys on one line, so that the file is the answer alone."""
    return json.dumps(answer(source), sort_keys=True, separators=(",", ":")) + "\n"


def write(directory: Path = FIXTURES) -> list[Path]:
    """Writes the fixture of every source into *directory*; the paths written, in the order of SOURCES."""
    written = []
    for source in SOURCES:
        path = path_of(source, directory)
        path.write_text(text_of(source), encoding="utf-8")
        written.append(path)
    return written


def main() -> None:
    for path in write():
        print(f"{path.relative_to(REPO_ROOT)}  {path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
