"""The FastAPI application. Served by uvicorn on 127.0.0.1:4701 in development."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

from rooftop_api import __version__

app = FastAPI(
    title="SolarLayout Rooftop API",
    version=__version__,
    description="Stateless: every response is a pure function of the request.",
)


class Health(BaseModel):
    """Answer of the health check."""

    status: Literal["ok"]
    version: str


@app.get("/health", response_model=Health, operation_id="getHealth", tags=["meta"])
def health() -> Health:
    """Tell the caller that the API is up, and which version it is."""
    return Health(status="ok", version=__version__)
