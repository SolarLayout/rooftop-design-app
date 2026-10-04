"""The layout of the modules."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.errors import OUTLINE_ERROR_RESPONSES
from rooftop_api.services import layouts as service

router = APIRouter(tags=["layout"], responses=OUTLINE_ERROR_RESPONSES)


@router.post("/layout", response_model=schemas.LayoutResponse, operation_id="computeLayout")
def layout(project: schemas.Project) -> schemas.LayoutResponse:
    """Fit the modules on the roof of the project. Needs no weather and no system voltage."""
    return service.lay_out(project)
