"""Write the OpenAPI document of the app to a file, without starting a server.

Usage: python -m rooftop_api.export_openapi <output path>
"""

import json
import sys
from pathlib import Path

from rooftop_api.main import app


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: python -m rooftop_api.export_openapi <output path>", file=sys.stderr)
        return 2
    out = Path(argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
