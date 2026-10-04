"""The sun and its shadows."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.errors import OUTLINE_ERROR_RESPONSES
from rooftop_api.services import sun as service

router = APIRouter(tags=["sun"], responses=OUTLINE_ERROR_RESPONSES)


@router.post("/sun", response_model=schemas.SunResponse, operation_id="computeSun")
def sun(request: schemas.SunRequest) -> schemas.SunResponse:
    """Sun positions in solar time for a day, sunrise and sunset, and the shadows at one hour if asked."""
    return service.sun_of_day(request)
