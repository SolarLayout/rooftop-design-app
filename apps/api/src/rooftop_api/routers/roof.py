"""Roof files."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.errors import ERROR_RESPONSES
from rooftop_api.services import roof_files as service

router = APIRouter(prefix="/roof", tags=["roof"], responses=ERROR_RESPONSES)


@router.post("/import", response_model=schemas.ImportedRoof, operation_id="importRoof")
def import_roof(file: schemas.RoofFile) -> schemas.ImportedRoof:
    """Read a KMZ, KML or DXF: the largest outline is the roof, the other shapes are obstacles."""
    return service.import_roof(file)
