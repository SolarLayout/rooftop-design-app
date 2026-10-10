"""The site's PVGIS TMY weather, as the API answers /weather, written to a file the recorder serves to the browser: the
test stack's API has downloads off, so the weather is fetched once here, through the API's own service with downloads on.

  cd apps/api && ROOFTOP_WEATHER_DOWNLOADS=on uv run python ../../.claude/skills/product-video/scripts/weather.py <lat> <lon> ../../.claude/skills/product-video/assets/sites/<site>-weather.json
"""
import sys
from pathlib import Path

from rooftop_api import schemas
from rooftop_api.services import weather

if len(sys.argv) != 4:
    raise SystemExit(__doc__)
lat, lon, out = float(sys.argv[1]), float(sys.argv[2]), Path(sys.argv[3])
answer = weather.load(schemas.WeatherRequest(source="pvgis", lat=lat, lon=lon, csv_name="", csv_text=""))
out.write_text(answer.model_dump_json())
print(answer.summary)
print("->", out)
