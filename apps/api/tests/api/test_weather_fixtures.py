"""The fixtures of the browser tests for /weather (e2e/fixtures/weather-*.json) are the API's answers now.

A change of the API's answer fails here until the files are written again:
    cd apps/api && uv run python -m tests.weather_fixtures
"""

import json

import pytest

from tests import weather_fixtures

pytestmark = pytest.mark.slow

REWRITE = "Rewrite it: cd apps/api && uv run python -m tests.weather_fixtures"


@pytest.mark.parametrize("source", weather_fixtures.SOURCES)
def test_the_file_on_disk_is_what_the_api_answers_now(source):
    path = weather_fixtures.path_of(source)

    assert path.is_file(), f"{path} is missing. {REWRITE}"
    assert path.read_text(encoding="utf-8") == weather_fixtures.text_of(source), (
        f"{path.name} is not the API's answer any more. {REWRITE}"
    )


def test_the_answer_is_the_whole_response_of_weather(client, services):
    body = json.loads(weather_fixtures.text_of("pvgis"))

    assert body == client.post("/weather", json={"source": "pvgis", "lat": 18.52, "lon": 73.86}).json()
    assert sorted(body) == ["notes", "summary", "weather"]
    assert body["summary"]["hours"] == 8760 and body["summary"]["label"] == "PVGIS TMY"


def test_nasa_is_the_year_without_a_horizon():
    body = json.loads(weather_fixtures.text_of("nasa"))

    assert body["summary"]["label"] == "NASA POWER 2023"
    assert body["weather"]["horizon"] == [] and body["summary"]["horizon_highest_deg"] is None


def test_the_text_is_one_line_of_compact_json_with_sorted_keys():
    text = weather_fixtures.text_of("pvgis")

    assert text.count("\n") == 1 and text.endswith("\n")
    assert text == json.dumps(json.loads(text), sort_keys=True, separators=(",", ":")) + "\n"


def test_the_module_writes_both_files(tmp_path):
    written = weather_fixtures.write(tmp_path)

    assert [path.name for path in written] == ["weather-pvgis-pune.json", "weather-nasa-pune.json"]
    for source, path in zip(weather_fixtures.SOURCES, written, strict=True):
        assert path.read_text(encoding="utf-8") == weather_fixtures.text_of(source)
