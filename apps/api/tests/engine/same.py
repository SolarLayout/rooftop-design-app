"""Whether two design runs gave the same results, to the last bit."""

from dataclasses import replace

import numpy as np
import pandas as pd

from rooftop_core.project import Design


def assert_same_results(one: Design, other: Design) -> None:
    """Every number of two runs is the same, to the last bit."""
    assert [m.poly.wkt for m in one.layout.modules] == [m.poly.wkt for m in other.layout.modules]
    for name in ("f_lin", "e_mod", "sky_loss", "far_block"):
        np.testing.assert_array_equal(getattr(one.pre.shading, name), getattr(other.pre.shading, name))
    assert [o.key for o in one.options] == [o.key for o in other.options]
    assert one.p.chosen_option == other.p.chosen_option
    for mine, theirs in zip(one.options, other.options, strict=True):
        assert replace(mine, system=None, result=None) == replace(theirs, system=None, result=None)
        assert mine.system == theirs.system
        assert mine.result.energy_mwh == theirs.result.energy_mwh
        assert mine.result.steps == theirs.result.steps
        assert mine.result.monthly_mwh == theirs.result.monthly_mwh
        assert mine.result.p_values == theirs.result.p_values
        assert mine.result.years == theirs.result.years
        np.testing.assert_array_equal(mine.result.per_string_shade, theirs.result.per_string_shade)
        pd.testing.assert_frame_equal(mine.result.hourly, theirs.result.hourly, check_exact=True)
