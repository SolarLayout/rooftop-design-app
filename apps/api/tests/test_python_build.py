"""The interpreter is the one the repository pins, in the build that uv manages.

The pin is apps/api/.python-version: uv reads it next to pyproject.toml and not above it.

The build matters for speed, not for results: the demo design run takes about 16 s on the
python.org build of 3.12 and about 11 s on the uv-managed one, with the same packages.
"""

import sys
import tomllib
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]


def test_the_interpreter_is_the_pinned_version():
    pinned = (API_DIR / ".python-version").read_text(encoding="utf-8").strip()

    assert pinned.count(".") == 2, f".python-version pins {pinned!r}, not a full version"
    assert ".".join(str(part) for part in sys.version_info[:3]) == pinned


def test_uv_takes_only_the_python_it_manages():
    settings = tomllib.loads((API_DIR / "pyproject.toml").read_text(encoding="utf-8"))

    assert settings["tool"]["uv"]["python-preference"] == "only-managed"
