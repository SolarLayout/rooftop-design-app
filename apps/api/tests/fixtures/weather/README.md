# Weather fixtures

Answers of the two weather services, recorded on 2026-09-29 and kept as they came. Tests read them in place
of the network. The `.gz` files are gzip of the body, nothing else changed.

| File | Request | Answer |
|---|---|---|
| `pvgis-tmy-pune.json.gz` | PVGIS 5.3 `/tmy`, lat 18.52, lon 73.86, `outputformat=json` | 200, 8,760 hours |
| `pvgis-horizon-pune.json.gz` | PVGIS 5.3 `/printhorizon`, same site | 200, 49 points (the first and the last are the same bearing) |
| `nasa-power-pune-2023.json.gz` | NASA POWER hourly point, same site, 2023, UTC, the five parameters the engine asks for | 200, 8,760 hours, no fill values |
| `pvgis-over-the-sea.json` | PVGIS 5.3 `/tmy`, lat 10.0, lon 65.0 | 400, with the message PVGIS gives for a site without data |

The PVGIS answer for Pune is the source of the bundled `rooftop_core/samples/pune_weather.json`: read by the
engine it gives the same 8,760 hours and the same horizon. A test holds that.

The browser tests have the API's own answers to `POST /weather` for Pune, `e2e/fixtures/weather-pvgis-pune.json` and
`e2e/fixtures/weather-nasa-pune.json`, made from these recordings by `uv run python -m tests.weather_fixtures` (run in
`apps/api`). `tests/api/test_weather_fixtures.py` holds that they are what the API answers now.

PVGIS: European Commission, Joint Research Centre. NASA POWER: NASA Langley Research Center. Both allow
reuse with the source named.
