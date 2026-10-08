"""A project file (.rtd) opened by the user, and what comes out of it."""

from typing import Annotated

from pydantic import BaseModel, Field

from rooftop_api.schemas.common import Input
from rooftop_api.schemas.limits import MAX_PROJECT_TEXT
from rooftop_api.schemas.project import Project


class ProjectFile(Input):
    """The file as the text it holds, under its name."""

    name: Annotated[str, Field(min_length=1, max_length=255)]
    text: Annotated[str, Field(max_length=MAX_PROJECT_TEXT)]


class OpenedProject(BaseModel):
    """The project the file holds, as a request carries it, and the notes on what it lacks."""

    project: Project = Field(description="The project of the file, written in the current format")
    notes: list[str] = Field(
        description="One note per PAN, OND or CSV weather the file names by path without its text: the "
        "design asks for that file again, in these words, until it is chosen"
    )
