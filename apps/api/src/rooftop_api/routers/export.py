"""The files of a design."""

from typing import Literal

from fastapi import APIRouter, Response

from rooftop_api import schemas
from rooftop_api.errors import JSON_ERROR_RESPONSES
from rooftop_api.services import export as service

ExportKind = Literal["pdf", "dxf", "kmz", "csv", "sld"]
FILE = {"schema": {"type": "string", "format": "binary"}}
FILES = {
    200: {
        "description": "The file, to download under the name of the project.",
        "content": {kind.media_type.split(";")[0]: FILE for kind in service.KINDS.values()},
    }
}

router = APIRouter(tags=["export"], responses={**JSON_ERROR_RESPONSES, **FILES})


@router.post("/export/{kind}", response_class=Response, operation_id="exportDesign")
def export(kind: ExportKind, project: schemas.Project) -> Response:
    """A file of the design, for the option the project has chosen.

    pdf: the report, A4 landscape. dxf: the layout, R2010 in metres, a layer for every string.
    kmz: roof, obstacles and the modules in use, for Google Earth. csv: the 8,760 hours.
    sld: the single-line diagram as a PNG.

    The project must name its chosen option, and the design must have it.
    """
    file = service.export(kind, project)
    return Response(
        content=file.content,
        media_type=file.media_type,
        headers={"Content-Disposition": file.content_disposition},
    )
