"""The files of a design, and the project file."""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Response

from rooftop_api import schemas
from rooftop_api.errors import JSON_ERROR_RESPONSES
from rooftop_api.services import export as service

ExportKind = Literal["pdf", "dxf", "kmz", "csv", "sld", "rtd"]
FILE = {"schema": {"type": "string", "format": "binary"}}
FILES = {
    200: {
        "description": "The file, to download under the name of the project.",
        "content": {kind.media_type.split(";")[0]: FILE for kind in service.KINDS.values()},
    }
}

router = APIRouter(tags=["export"], responses={**JSON_ERROR_RESPONSES, **FILES})


@router.post("/export/{kind}", response_class=Response, operation_id="exportDesign")
def export(kind: ExportKind, project: schemas.Project, day: date | None = None) -> Response:
    """A file of the design, for the option the project has chosen; or the project file.

    pdf: the report, A4 landscape. dxf: the layout, R2010 in metres, a layer for every string.
    kmz: roof, obstacles and the modules in use, for Google Earth. csv: the 8,760 hours.
    sld: the single-line diagram as a PNG. rtd: the project file, format 2, as the desktop app reads
    it: the request as the engine holds it, and nothing of the design.

    day: the reader's day (YYYY-MM-DD), printed on page 1 of the report; without it the server's
    today. Every kind takes it; the report reads it.

    For every kind but rtd the project must name its chosen option, and the design must have it.
    rtd needs no chosen option, no system voltage, no weather and no run.
    """
    file = service.export(kind, project, day)
    return Response(
        content=file.content,
        media_type=file.media_type,
        headers={"Content-Disposition": file.content_disposition},
    )
