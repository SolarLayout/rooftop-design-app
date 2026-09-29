"""The FastAPI application. Served by uvicorn on 127.0.0.1:4701 in development."""

from fastapi import FastAPI

from rooftop_api import __version__
from rooftop_api.errors import install_error_handlers
from rooftop_api.routers import demo, equipment, layout, meta, roof, sun, weather

app = FastAPI(
    title="SolarLayout Rooftop API",
    version=__version__,
    description="Stateless: every response is a pure function of the request.",
)
install_error_handlers(app)
for module in (meta, demo, equipment, roof, layout, sun, weather):
    app.include_router(module.router)
