"""The Pune demo as a project that carries everything it needs."""

from pathlib import Path

from rooftop_api import convert, schemas
from rooftop_core.demo import demo_project
from rooftop_core.io.pvsyst import decode_pvsyst
from rooftop_core.resources import SAMPLE_OND, SAMPLE_PAN, sample_path


def demo() -> schemas.Project:
    """The demo of the desktop app, with the bundled PAN and OND embedded under the names of their files."""
    project = demo_project()
    project.pan_path, project.pan_text = SAMPLE_PAN, _text(SAMPLE_PAN)
    project.ond_path, project.ond_text = SAMPLE_OND, _text(SAMPLE_OND)
    return convert.project_from_engine(project)


def _text(sample: str) -> str:
    return decode_pvsyst(Path(sample_path(sample)).read_bytes())
