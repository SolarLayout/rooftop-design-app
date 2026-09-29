"""The PAN and OND files of tests/fixtures/equipment."""

from pathlib import Path

FIXTURES = Path(__file__).parent / "fixtures" / "equipment"


def fixture_path(name: str) -> str:
    """The path of an equipment file of the tests, as the readers of the engine take it."""
    path = FIXTURES / name
    assert path.is_file(), f"{name} is not in {FIXTURES}"
    return str(path)


def fixture_text(name: str) -> str:
    """The content of an equipment file of the tests, as it travels in a project."""
    from rooftop_core.io.pvsyst import decode_pvsyst

    return decode_pvsyst(Path(fixture_path(name)).read_bytes())
