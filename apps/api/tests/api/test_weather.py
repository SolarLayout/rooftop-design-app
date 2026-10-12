"""POST /weather: a year of hours from PVGIS, NASA POWER or a CSV file, with its horizon and a summary."""

import pandas as pd
import pytest
import requests

from rooftop_api.services import weather as service
from tests.api.conftest import error_of

pytestmark = pytest.mark.slow

PUNE = {"lat": 18.52, "lon": 73.86}
FIRST_HOURS = """time,GHI,DNI,DHI,Temp,Wind
2023-01-01 00:00,0,0,0,24.0,1.0
2023-01-01 01:00,0,0,0,23.5,1.2
2023-01-01 02:00,80,120,50,24.5,1.4
2023-01-01 03:00,310,480,90,26.0,1.8
"""


def _hours(first: str, hours: int) -> str:
    """*first* (a header, its rows from 2023-01-01 00:00), then rows of its last values up to *hours*."""
    lines = first.strip().splitlines()
    start = pd.Timestamp("2023-01-01")
    tail = ",".join(lines[-1].split(",")[1:])
    more = [f"{start + pd.Timedelta(hours=h):%Y-%m-%d %H:%M},{tail}" for h in range(len(lines) - 1, hours)]
    return "\n".join(lines + more) + "\n"


CSV = _hours(FIRST_HOURS, 8760)  # a CSV weather is a whole year (#179, item 20)


@pytest.fixture(autouse=True)
def empty_cache(monkeypatch):
    """Every test starts with nothing downloaded."""
    monkeypatch.setattr(service, "CACHE", service.new_cache())


def _csv(text: str, name: str = "site.csv") -> dict:
    return {"source": "csv", **PUNE, "csv_name": name, "csv_text": text}


# ── PVGIS ────────────────────────────────────────────────────────────────────
def test_pvgis_gives_the_weather_of_the_demo(client, services, demo):
    response = client.post("/weather", json={"source": "pvgis", **PUNE})

    assert response.status_code == 200
    assert list(response.json()) == ["weather", "summary", "notes"]
    assert response.json()["weather"] == demo["weather_json"]
    assert response.json()["notes"] == []


def test_the_summary_of_pvgis_for_pune(client, services):
    summary = client.post("/weather", json={"source": "pvgis", **PUNE}).json()["summary"]

    assert summary == {
        "source": "pvgis",
        "label": "PVGIS TMY",
        "hours": 8760,
        "first_hour": "2019-01-01T00:00:00+00:00",
        "last_hour": "2019-12-31T23:00:00+00:00",
        "ghi_kwh_m2": pytest.approx(1822.9, abs=0.05),
        "dni_kwh_m2": pytest.approx(1999.6, abs=0.05),
        "dhi_kwh_m2": pytest.approx(549.9, abs=0.05),
        "t_min_c": 11.93,
        "t_max_c": 39.26,
        "horizon_highest_deg": 2.7,
    }


def test_the_weather_that_comes_back_is_accepted_in_a_project(client, services, demo):
    demo["weather_json"] = client.post("/weather", json={"source": "pvgis", **PUNE}).json()["weather"]

    assert client.post("/layout", json=demo).status_code == 200


def test_a_site_is_downloaded_once(client, services):
    first = client.post("/weather", json={"source": "pvgis", **PUNE})
    asked = len(services.asked)
    second = client.post("/weather", json={"source": "pvgis", **PUNE})

    assert asked == 2  # the hours and the horizon
    assert len(services.asked) == asked
    assert second.json() == first.json()


def test_without_the_cache_the_answer_is_the_same(client, services, monkeypatch):
    kept = client.post("/weather", json={"source": "pvgis", **PUNE}).json()
    from_the_cache = client.post("/weather", json={"source": "pvgis", **PUNE}).json()

    monkeypatch.setattr(service, "CACHE", service.new_cache())
    fresh = client.post("/weather", json={"source": "pvgis", **PUNE}).json()

    assert from_the_cache == kept and fresh == kept
    assert len(services.asked) == 4


def test_pvgis_without_data_for_the_site_is_passed_on(client, services):
    response = client.post("/weather", json={"source": "pvgis", "lat": 10.0, "lon": 65.0})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "no_weather_for_site",
        "message": "PVGIS TMY has no weather for 10.0000, 65.0000: Location over the sea. Please, select "
        "another location. Check the site, or choose another weather source.",
        "field": None,
    }


def test_a_service_that_fails_is_named_with_what_it_answered(client, monkeypatch):
    from tests.recorded import Answer

    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: Answer(503, {"message": "maintenance"}))

    response = client.post("/weather", json={"source": "pvgis", **PUNE})

    assert response.status_code == 502
    assert error_of(response) == {
        "code": "weather_source_failed",
        "message": "PVGIS TMY failed: it answered 503. Try again later, or choose another weather source.",
        "field": "source",
    }


def test_a_service_that_cannot_be_reached_is_named(client, monkeypatch):
    def unreachable(*args, **kwargs):
        raise requests.ConnectionError("no route to host")

    monkeypatch.setattr(requests, "get", unreachable)

    response = client.post("/weather", json={"source": "nasa", **PUNE})

    assert response.status_code == 502
    assert error_of(response) == {
        "code": "weather_source_unreachable",
        "message": "NASA POWER could not be reached. Check the connection and try again, or choose "
        "another weather source.",
        "field": "source",
    }


def test_an_answer_that_cannot_be_read_is_not_a_server_fault(client, monkeypatch):
    from tests.recorded import Answer

    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: Answer(200, {"outputs": {}}))

    response = client.post("/weather", json={"source": "pvgis", **PUNE})

    assert response.status_code == 502
    assert error_of(response) == {
        "code": "weather_source_failed",
        "message": "PVGIS TMY answered in a form that cannot be read. Try again later, or choose another "
        "weather source.",
        "field": "source",
    }


# ── NASA POWER ───────────────────────────────────────────────────────────────
def test_nasa_gives_a_year_without_a_horizon(client, services):
    body = client.post("/weather", json={"source": "nasa", **PUNE}).json()

    assert body["weather"]["horizon"] == []
    assert (body["weather"]["source"], body["weather"]["label"]) == ("nasa", "NASA POWER 2023")
    assert body["summary"]["hours"] == 8760 and len(body["weather"]["ghi"]) == 8760
    assert body["summary"]["horizon_highest_deg"] is None
    assert body["summary"]["ghi_kwh_m2"] == pytest.approx(sum(body["weather"]["ghi"]) / 1000)
    assert body["summary"]["t_min_c"] == min(body["weather"]["temp_air"])
    assert body["summary"]["t_max_c"] == max(body["weather"]["temp_air"])
    assert body["notes"] == []


# ── CSV ──────────────────────────────────────────────────────────────────────
def test_csv_text_is_read_without_a_download(client):
    body = client.post("/weather", json=_csv(CSV)).json()

    assert (body["weather"]["source"], body["weather"]["label"]) == ("csv", "site.csv")
    assert body["weather"]["time"][:2] == ["2023-01-01T00:00:00+00:00", "2023-01-01T01:00:00+00:00"]
    assert body["weather"]["ghi"][:4] == [0, 0, 80, 310]
    assert body["weather"]["dni"][:4] == [0, 0, 120, 480]
    assert (body["weather"]["lat"], body["weather"]["lon"]) == (18.52, 73.86)
    assert body["summary"]["hours"] == 8760
    assert body["notes"] == []


def test_a_csv_that_is_not_a_whole_year_is_refused(client):
    response = client.post("/weather", json=_csv(FIRST_HOURS))

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "not_a_weather_csv",
        "message": "site.csv has 4 hours. A year has 8,760, a leap year 8,784. Give a whole year.",
        "field": "csv_text",
    }


def test_a_csv_of_time_and_irradiance_alone_says_what_was_taken_for_the_rest(client):
    text = "\n".join(",".join(line.split(",")[:2]) for line in CSV.splitlines())

    body = client.post("/weather", json=_csv(text)).json()

    assert sum(body["weather"]["dni"]) > 0 and sum(body["weather"]["dhi"]) > 0
    assert body["notes"] == [
        "site.csv has no beam and diffuse irradiance. The app works them out from the global irradiance, "
        "less exactly than a measurement (Erbs model).",
        "site.csv has no air temperature. The app takes 25 °C for every hour and sizes the strings for "
        "25 °C. In the Strings step, enter the site's lowest and highest ambient.",
        "site.csv has no wind speed. The app takes 1 m/s for every hour.",
    ]


def test_a_csv_without_a_name_is_called_a_csv_file(client):
    body = client.post("/weather", json={"source": "csv", **PUNE, "csv_text": CSV}).json()

    assert body["weather"]["label"] == "CSV file"


def test_a_path_as_name_is_cut_to_the_name_of_the_file(client):
    body = client.post("/weather", json=_csv(CSV, name="C:\\Users\\someone\\site.csv")).json()

    assert body["weather"]["label"] == "site.csv"


@pytest.mark.parametrize(
    ("text", "code", "message"),
    [
        ("", "csv_missing", "Choose a CSV weather file."),
        (
            "time,Temp\n2023-06-01 00:00,24.0\n",
            "not_a_weather_csv",
            "site.csv: no column named any of ghi, g(h), gh, global_horizontal, allsky_sfc_sw_dwn, "
            "irradiance",
        ),
        (
            "hello world",
            "not_a_weather_csv",
            "site.csv: no column named any of time, time(utc), datetime, date, timestamp, date/time",
        ),
        (
            "time,ghi\n",
            "not_a_weather_csv",
            "site.csv has a header and no rows of hours.",
        ),
        (
            "time,ghi\nyesterday,100\n2023-06-01 01:00,200\nlater,300\n",
            "not_a_weather_csv",
            "site.csv: the app cannot read the time in 2 rows. The first is on line 2: yesterday. "
            "Write it as 2023-06-01 13:00, in UTC.",
        ),
        (
            "time,ghi\n2023-06-01 00:00,100\n2023-06-01 01:00,200\n2023-06-01 00:00,300\n",
            "not_a_weather_csv",
            "site.csv: 1 hour appears more than once. The first is 2023-06-01 00:00. Keep each hour once.",
        ),
        (
            "time,ghi,wind\n2023-06-01 00:00,100,\n2023-06-01 01:00,200,2\n",
            "not_a_weather_csv",
            "site.csv: wind is empty in 1 row. The first is on line 2. Fill the gaps, or "
            "leave the column out.",
        ),
    ],
)
def test_a_csv_that_cannot_be_used_is_refused_with_the_reason(client, text, code, message):
    response = client.post("/weather", json=_csv(text))

    assert response.status_code == 422
    assert error_of(response) == {"code": code, "message": message, "field": "csv_text"}


# ── downloads off (decision 13 of Phase 8: the test stack never reaches PVGIS or NASA) ──────
@pytest.fixture
def downloads_off(monkeypatch):
    from rooftop_api import settings

    monkeypatch.setenv(settings.WEATHER_DOWNLOADS, "off")


@pytest.mark.parametrize(
    ("source", "label"), [("pvgis", "PVGIS TMY"), ("nasa", "NASA POWER")], ids=["pvgis", "nasa"]
)
def test_with_downloads_off_a_download_is_refused_in_words(client, services, downloads_off, source, label):
    response = client.post("/weather", json={"source": source, **PUNE})

    assert response.status_code == 422
    assert error_of(response) == {
        "code": "weather_downloads_off",
        "message": f"Downloads of weather are off on this server: {label} was not asked. Load a CSV "
        "file, or turn downloads on.",
        "field": "source",
    }
    assert services.asked == []


def test_with_downloads_off_a_csv_is_still_read(client, services, downloads_off):
    body = client.post("/weather", json=_csv(CSV)).json()

    assert body["weather"]["label"] == "site.csv" and body["summary"]["hours"] == 8760
    assert services.asked == []


# ── the request ──────────────────────────────────────────────────────────────
def test_a_source_that_is_none_of_the_three_is_refused(client):
    response = client.post("/weather", json={"source": "meteonorm", **PUNE})

    assert response.status_code == 422
    assert error_of(response)["field"] == "source"


def test_a_site_off_the_globe_is_refused(client):
    response = client.post("/weather", json={"source": "pvgis", "lat": 91, "lon": 73.86})

    assert response.status_code == 422
    assert error_of(response)["field"] == "lat"
