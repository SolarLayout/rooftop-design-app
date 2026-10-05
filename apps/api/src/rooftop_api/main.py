"""The FastAPI application. Served by uvicorn on 127.0.0.1:4701 in development."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from rooftop_api import __version__, settings
from rooftop_api.connections import install_close_connections
from rooftop_api.errors import install_error_handlers
from rooftop_api.routers import demo, design, equipment, export, layout, meta, project, roof, sun, weather
from rooftop_api.timing import install_timing_log
from rooftop_core import options


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Once, as the server starts: the threads of the simulations, if its environment names them."""
    threads = settings.simulation_threads()
    if threads is not None:
        options.SIMULATION_THREADS = threads
    yield


app = FastAPI(
    title="SolarLayout Rooftop API",
    version=__version__,
    description="Stateless: every response is a pure function of the request.",
    lifespan=lifespan,
)
install_error_handlers(app)
install_timing_log(app)
install_close_connections(app)
for module in (meta, demo, project, equipment, roof, layout, sun, weather, design, export):
    app.include_router(module.router)
