"""Strings across rows: once each row gives its whole strings, the modules left at the rows' ends are wired
into strings that run on into the next rows of the same orientation, so the roof's positions are used."""

import pytest
from shapely.geometry import Polygon, box

from rooftop_core.options import of_length
from rooftop_core.placement import Layout, PlacedModule
from rooftop_core.stringing import form_strings

WIDTH, DEPTH, PITCH = 1.1, 2.3, 4.0


def a_layout(rows: list[int], lines: int = 1, tilts: list[float] | None = None) -> Layout:
    """Rows of the given lengths, one above the other, each *lines* modules up the table."""
    modules: list[PlacedModule] = []
    for row, length in enumerate(rows):
        tilt = tilts[row] if tilts else 15.0
        for line in range(lines):
            for col in range(length):
                x, y = col * WIDTH, row * PITCH + line * DEPTH
                footprint = box(x, y, x + WIDTH, y + DEPTH)
                modules.append(
                    PlacedModule(len(modules), footprint, row, col, line, tilt, 180.0, 0.5, 1.0, x, y)
                )
    roof = box(-1.0, -1.0, max(rows) * WIDTH + 1.0, len(rows) * PITCH + 1.0)
    return Layout(
        kind="flat_tilted",
        modules=modules,
        azimuth=180.0,
        tilt=15.0,
        pitch=PITCH,
        gcr=0.5,
        slope_len=DEPTH * lines,
        table_count=len(rows),
        n_rows=len(rows),
        inner=roof,
        usable=roof,
        keepout=Polygon(),
        obstacle_zone=Polygon(),
        design_doy=355,
    )


def rows_of(layout: Layout, modules: list[int]) -> list[int]:
    return [layout.modules[i].row for i in modules]


def test_the_modules_left_in_the_rows_make_more_strings():
    layout = a_layout([15] * 13)

    strings = form_strings(layout, 10)

    assert len(strings) == 19  # 195 positions: 13 in their rows, 6 across rows
    assert len({i for s in strings for i in s.modules}) == 190
    assert all(len(s.modules) == 10 for s in strings)


def test_each_row_gives_its_whole_strings_first():
    layout = a_layout([15] * 13)

    strings = form_strings(layout, 10)

    for row, string in enumerate(strings[:13]):
        assert rows_of(layout, string.modules) == [row] * 10
        assert [layout.modules[i].col for i in string.modules] == list(range(10))


def test_a_string_across_rows_runs_on_into_the_next_row_and_turns_back():
    layout = a_layout([15] * 13)

    joined = form_strings(layout, 10)[13]

    assert rows_of(layout, joined.modules) == [0] * 5 + [1] * 5
    assert [layout.modules[i].col for i in joined.modules] == [10, 11, 12, 13, 14, 14, 13, 12, 11, 10]
    assert joined.row == 0


def test_rows_that_hold_whole_strings_alone_are_not_changed():
    layout = a_layout([20] * 3)

    strings = form_strings(layout, 10)

    assert len(strings) == 6
    assert all(len(set(rows_of(layout, s.modules))) == 1 for s in strings)


def test_rows_of_two_orientations_are_never_joined():
    layout = a_layout([15, 15, 15, 15], tilts=[15.0, 10.0, 15.0, 10.0])

    strings = form_strings(layout, 10)

    assert len(strings) == 6
    for string in strings:
        assert len({layout.modules[i].tilt for i in string.modules}) == 1


def test_a_table_of_two_lines_wires_what_is_left_out_on_the_top_line_and_back_on_the_bottom():
    layout = a_layout([8, 8], lines=2)

    strings = form_strings(layout, 10)

    assert len(strings) == 3  # one of 5 columns in each row, one of what is left of both
    at = layout.modules
    places = [(at[i].row, at[i].line, at[i].col) for i in strings[2].modules]
    assert places == [
        (0, 1, 5),
        (0, 1, 6),
        (0, 1, 7),
        (0, 0, 7),
        (0, 0, 6),
        (0, 0, 5),
        (1, 0, 5),
        (1, 0, 6),
        (1, 0, 7),
        (1, 1, 7),
    ]


def test_a_string_across_rows_says_so_and_one_in_its_row_does_not():
    layout = a_layout([15] * 13)

    strings = form_strings(layout, 10)

    assert [s.across_rows for s in strings] == [False] * 13 + [True] * 6


@pytest.mark.slow
def test_the_strings_in_their_rows_are_used_before_those_across_rows(demo_design):
    d = demo_design

    held = of_length(d.pre, d.layout, d.module, d.mm, d.p.losses, d.p.roof, 29)

    # On the demo's roof, strings of 29 across rows are less shaded than some in their rows: still last.
    assert [s.across_rows for s in held.ranked] == [False] * 23 + [True] * 4
