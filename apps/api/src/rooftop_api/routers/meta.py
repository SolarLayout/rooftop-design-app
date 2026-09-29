"""Health of the API."""

from fastapi import APIRouter

from rooftop_api import __version__, schemas

router = APIRouter(tags=["meta"])


@router.get("/health", response_model=schemas.Health, operation_id="getHealth")
def health() -> schemas.Health:
    """Tell the caller that the API is up, and which version it is."""
    return schemas.Health(status="ok", version=__version__)
