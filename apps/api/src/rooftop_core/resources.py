# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Bundled files (sample PAN/OND, demo weather). They are package data, next to this module."""

from __future__ import annotations

from pathlib import Path

# The module and the inverter of the demo, and of a project that names none (decision D24).
SAMPLE_PAN = "insolation-ina-144mhc-tf-560.PAN"
SAMPLE_OND = "wattpower-wp-330ktl-h1.OND"


def samples_dir() -> Path:
    return Path(__file__).resolve().parent / "samples"


def sample_path(name: str) -> str:
    return str(samples_dir() / name)
