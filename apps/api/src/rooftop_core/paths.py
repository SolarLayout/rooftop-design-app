"""Names of files in paths that may have been written on another system."""

from __future__ import annotations


def file_name(path: str) -> str:
    """The last part of a path, whether it was written with "/" or, on Windows, with a backslash."""
    return path.replace("\\", "/").rsplit("/", 1)[-1]
