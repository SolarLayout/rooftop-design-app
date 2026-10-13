"""The roof type's long name (D112): as Find asks, the rows facing the equator of the roof's hemisphere."""

import pytest

from rooftop_core.geometry import roof_type_name


@pytest.mark.parametrize(
    ("roof_type", "lat", "name"),
    [
        ("flat_tilted", 18.52, "Flat, rows facing south"),
        ("flat_tilted", -33.9, "Flat, rows facing north"),
        ("flat_ew", 18.52, "Flat, rows facing east and west"),
        ("sloped_flush", -33.9, "Sloped"),
    ],
)
def test_the_roof_types_long_name(roof_type, lat, name):
    assert roof_type_name(roof_type, lat) == name
