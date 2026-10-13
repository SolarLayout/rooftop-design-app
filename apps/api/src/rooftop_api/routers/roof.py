"""Roof files."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.errors import OUTLINE_ERROR_RESPONSES
from rooftop_api.services import roof_files, roof_map

router = APIRouter(prefix="/roof", tags=["roof"], responses=OUTLINE_ERROR_RESPONSES)


@router.post("/import", response_model=schemas.ImportedRoof, operation_id="importRoof")
def import_roof(file: schemas.RoofFile) -> schemas.ImportedRoof:
    """Read a KMZ, KML or DXF: the largest outline is the roof, the other shapes are obstacles."""
    return roof_files.import_roof(file)


@router.post("/from-map", response_model=schemas.Project, operation_id="roofFromMap")
def roof_from_map(drawn: schemas.OutlineOnMap) -> schemas.Project:
    """A new project from a roof outlined on the map: the outline and the obstacles in local metres around
    the roof's centroid, through the engine's projection; everything else at its default."""
    return roof_map.from_map(drawn)
