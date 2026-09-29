"""The demo project."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.services import demo as service

router = APIRouter(tags=["project"])


@router.get("/demo", response_model=schemas.Project, operation_id="getDemo")
def demo() -> schemas.Project:
    """The Pune demo: a 90 x 40 m flat roof with its weather, its module and its inverter, at 1500 V."""
    return service.demo()
