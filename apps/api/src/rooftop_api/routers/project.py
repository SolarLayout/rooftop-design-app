"""Project files."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.errors import OUTLINE_ERROR_RESPONSES
from rooftop_api.services import project_files

router = APIRouter(prefix="/project", tags=["project"], responses=OUTLINE_ERROR_RESPONSES)


@router.post("/open", response_model=schemas.OpenedProject, operation_id="openProject")
def open_project(file: schemas.ProjectFile) -> schemas.OpenedProject:
    """Read a project file (.rtd) of format 1 or 2 with the engine's own reader.

    The project comes back as a request carries it, in the current format. A file of format 1 names its
    PAN, its OND and its CSV weather by path without their text: a note per file, in the engine's words,
    says that the design asks for it again until it is chosen. A text that is not JSON, a JSON that is no
    project and a format this version does not read are refused in words.
    """
    return project_files.open_project(file)
