"""The inverter in the CAD layout (issue 179, item 28): drawn at the size its OND file gives, width by
depth, or, where the file gives none, as a 2 × 1.2 m block marked a symbol, not to scale."""

import io
from dataclasses import replace

import ezdxf
import pytest

from rooftop_core.export import files
from rooftop_core.io.pvsyst import parse_ond
from tests.equipment import fixture_text

pytestmark = pytest.mark.slow


def _inverters(dxf: bytes) -> tuple[list[tuple[float, float]], list[str]]:
    """The sizes (x, y) of the outlines on the layer INVERTERS, and every text that names an inverter."""
    msp = ezdxf.read(io.StringIO(dxf.decode("utf-8"))).modelspace()
    sizes = []
    for outline in msp.query('LWPOLYLINE[layer=="INVERTERS"]'):
        xs, ys = zip(*[(x, y) for x, y, *_ in outline.get_points()], strict=True)
        sizes.append((round(max(xs) - min(xs), 3), round(max(ys) - min(ys), 3)))
    names = [text.dxf.text for text in msp.query("TEXT") if text.dxf.text.startswith("INV-")]
    return sizes, names


def test_an_ond_gives_its_width_and_depth():
    inverter = parse_ond(fixture_text("Test-S.ond"), "Test-S.ond")

    assert (inverter.width_m, inverter.depth_m) == (1.048, 0.395)


def test_an_ond_without_a_size_gives_none():
    inverter = parse_ond(fixture_text("sungrow-sg3300ud-20.OND"), "sungrow-sg3300ud-20.OND")

    assert (inverter.width_m, inverter.depth_m) == (0.0, 0.0)


def test_the_demo_s_inverter_is_drawn_at_its_size(demo_design):
    sizes, names = _inverters(files.export_dxf_bytes(demo_design))

    assert sizes == [(1.048, 0.395)]
    assert names == ["INV-1"]


def test_an_inverter_of_no_size_is_a_block_marked_a_symbol(demo_design, monkeypatch):
    monkeypatch.setattr(demo_design, "inverter", replace(demo_design.inverter, width_m=0.0, depth_m=0.0))

    sizes, names = _inverters(files.export_dxf_bytes(demo_design))

    assert sizes == [(2.0, 1.2)]
    assert names == ["INV-1 (symbol, not to scale)"]
