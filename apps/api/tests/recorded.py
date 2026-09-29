"""Answers of the weather services as recorded in tests/fixtures/weather, in place of the network."""

import gzip
import json
from pathlib import Path
from typing import Any

from rooftop_core import weather as wx

FIXTURES = Path(__file__).parent / "fixtures" / "weather"
PUNE = (18.52, 73.86)
OVER_THE_SEA = (10.0, 65.0)


def recorded(name: str) -> dict[str, Any]:
    """The body of a recorded answer, read from its file."""
    raw = (FIXTURES / name).read_bytes()
    return json.loads(gzip.decompress(raw) if name.endswith(".gz") else raw)


class Answer:
    """What requests.get gives back, as far as the engine looks at it."""

    def __init__(self, status_code: int, body: dict[str, Any]):
        self.status_code = status_code
        self.text = json.dumps(body, separators=(",", ":"))

    def json(self) -> dict[str, Any]:
        return json.loads(self.text)


class Services:
    """Stands in for requests.get: answers what was recorded, and keeps what was asked."""

    def __init__(self) -> None:
        self.asked: list[tuple[str, dict[str, Any]]] = []

    def __call__(self, url: str, params: dict[str, Any], timeout: float) -> Answer:
        self.asked.append((url, dict(params)))
        site = (params.get("lat", params.get("latitude")), params.get("lon", params.get("longitude")))
        if url == wx.NASA and site == PUNE and params["start"] == "20230101":
            return Answer(200, recorded("nasa-power-pune-2023.json.gz"))
        if url == f"{wx.PVGIS}/tmy" and site == PUNE:
            return Answer(200, recorded("pvgis-tmy-pune.json.gz"))
        if url == f"{wx.PVGIS}/printhorizon" and site == PUNE:
            return Answer(200, recorded("pvgis-horizon-pune.json.gz"))
        if url.startswith(wx.PVGIS) and site == OVER_THE_SEA:
            return Answer(400, recorded("pvgis-over-the-sea.json"))
        raise AssertionError(f"nothing was recorded for {url} with {params}")
