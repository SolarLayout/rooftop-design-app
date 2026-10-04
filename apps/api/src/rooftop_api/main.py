"""The FastAPI application. Served by uvicorn on 127.0.0.1:4701 in development."""

from fastapi import FastAPI

from rooftop_api import __version__
from rooftop_api.errors import install_error_handlers
from rooftop_api.routers import demo, design, equipment, export, layout, meta, project, roof, sun, weather
from rooftop_api.timing import install_timing_log

app = FastAPI(
    title="SolarLayout Rooftop API",
    version=__version__,
    description="Stateless: every response is a pure function of the request.",
)
install_error_handlers(app)
install_timing_log(app)
for module in (meta, demo, project, equipment, roof, layout, sun, weather, design, export):
    app.include_router(module.router)
