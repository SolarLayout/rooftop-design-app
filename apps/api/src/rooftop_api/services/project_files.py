"""A project read from a .rtd file of the user, by the engine's own reader."""

import json
from typing import Any

from pydantic import ValidationError

from rooftop_api import convert, schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError, validation_message
from rooftop_core import geometry, project

NOT_A_PROJECT_FILE = "The file is not a project file (.rtd): "
CANNOT_BE_OPENED = "The project file cannot be opened: "


def open_project(file: schemas.ProjectFile) -> schemas.OpenedProject:
    """The project of the file, and a note for every file it names by path without its text.

    The engine reads the file (formats 1 and 2); a format it does not read is refused in its words.
    What comes out is validated as a request is, so that the web app can send it back as one.
    """
    read = _read(_json_of(file.text))
    # The one check of the limit for a project file: the field is the outline's path in the file, as the
    # format's and a value's out of range are named by theirs.
    geometry.require_roof_within_limit(read.roof.outline, "roof.outline")
    return schemas.OpenedProject(project=_as_a_request(read), notes=notes_of(read))


def notes_of(p: project.Project) -> list[str]:
    """The engine's words for every file the project names by path without its text, in the order the
    design would ask for them: the module, the inverter, then the weather when its source is a CSV."""
    notes = []
    if p.pan_path and not p.pan_text:
        notes.append(project.not_included("module", p.pan_path, "PAN"))
    if p.ond_path and not p.ond_text:
        notes.append(project.not_included("inverter", p.ond_path, "OND"))
    if p.weather_source == "csv" and p.weather_csv and not p.weather_csv_text:
        notes.append(project.not_included("CSV weather", p.weather_csv))
    return notes


def _json_of(text: str) -> dict[str, Any]:
    try:
        read = json.loads(text)
    except ValueError as error:
        raise _unreadable("it is not JSON.") from error
    if not isinstance(read, dict):
        raise _unreadable("its JSON is not an object.")
    return read


def _read(read: dict[str, Any]) -> project.Project:
    """The project as the engine reads it. An engine error (the format) passes through to its handler."""
    try:
        return project.Project.from_json(read)
    except KeyError as error:
        raise _unreadable(f"it has no {error.args[0]}.") from error
    except (TypeError, ValueError) as error:
        raise _unreadable(f"it cannot be read as one ({error}).") from error


def _as_a_request(p: project.Project) -> schemas.Project:
    try:
        return schemas.Project.model_validate(convert.project_from_engine(p).model_dump())
    except ValidationError as error:
        message, field = validation_message(error.errors())
        raise ApiError(UNPROCESSABLE, "project_file_unreadable", CANNOT_BE_OPENED + message, field) from error


def _unreadable(why: str) -> ApiError:
    return ApiError(UNPROCESSABLE, "project_file_unreadable", NOT_A_PROJECT_FILE + why, "text")
