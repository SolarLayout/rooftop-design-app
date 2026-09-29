# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Bundled files (sample PAN/OND, demo weather). They are package data, next to this module."""

from __future__ import annotations

from pathlib import Path


def samples_dir() -> Path:
    return Path(__file__).resolve().parent / "samples"


def sample_path(name: str) -> str:
    return str(samples_dir() / name)
