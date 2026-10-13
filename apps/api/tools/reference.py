"""The engine's reference case: the Pune demo with the module file the desktop app ran it with (D64).

That file, tests/fixtures/equipment/insolation-ina-144mhc-tf-560.PAN, was the demo's module until D117.
Its temperature figures are not a real module's: power -0.210 %/°C and muGamma +0.0008, outside all the
makers' files of the library, and no Voc coefficient, so the one-diode model's is -0.164 %/°C. It is no
longer bundled. The desktop app's figures, the parity snapshots and the numbers the tests pin were taken
with it, so the reference keeps it: they check the engine's arithmetic against those, not the module.
"""

from __future__ import annotations

from pathlib import Path

from rooftop_core.demo import demo_project
from rooftop_core.io.pvsyst import decode_pvsyst
from rooftop_core.project import Project

REFERENCE_PAN = (
    Path(__file__).resolve().parent.parent
    / "tests"
    / "fixtures"
    / "equipment"
    / "insolation-ina-144mhc-tf-560.PAN"
)


def with_the_reference_module(project: Project) -> Project:
    """*project* with the reference module embedded under the name of its file."""
    project.pan_path = REFERENCE_PAN.name
    project.pan_text = decode_pvsyst(REFERENCE_PAN.read_bytes())
    return project


def reference_demo() -> Project:
    """The Pune demo as the references were taken: its roof, weather and inverter, the reference module."""
    return with_the_reference_module(demo_project())


def reference_at_the_limit() -> Project:
    """The roof at the limit as its parity snapshot was taken: with the reference module."""
    from tools.roof_at_the_limit import project_at_the_limit

    return with_the_reference_module(project_at_the_limit())
