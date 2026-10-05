"""Health of the API."""

from fastapi import APIRouter

from rooftop_api import __version__, schemas, settings

router = APIRouter(tags=["meta"])


@router.get("/health", response_model=schemas.Health, operation_id="getHealth")
def health() -> schemas.Health:
    """Tell the caller that the API is up, which version it is, and the commit it was built from."""
    return schemas.Health(status="ok", version=__version__, commit=settings.commit())
