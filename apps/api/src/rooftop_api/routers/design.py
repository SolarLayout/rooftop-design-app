"""The design run."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from fastapi.sse import EventSourceResponse, ServerSentEvent

from rooftop_api import schemas
from rooftop_api.errors import JSON_ERROR_RESPONSES
from rooftop_api.services import design as service

router = APIRouter(tags=["design"], responses=JSON_ERROR_RESPONSES)


# The stream's connection is closed when it ends, so that a proxy in front of the API never reuses it.
# Next's rewrite (dev and production alike) frees the upstream socket of a streamed answer and then tears
# it down; a request that had taken the socket meanwhile died with "socket hang up" (a bare 500 to the
# browser) while the API had answered 200: 11 of 20 asks of the report's pages right after a design run,
# none straight at the API (session 14, 2026-10-04, tools/proxy-drops.ts --after-design). A new connection
# per run costs nothing beside the run. Set by a dependency: FastAPI adds the sub-response's headers to the
# stream before the first event, where the generator's own body runs too late.
CLOSE_WHEN_DONE = {"connection": "close"}


def close_when_done(response: Response) -> None:
    response.headers.update(CLOSE_WHEN_DONE)


@router.post(
    "/design",
    response_class=EventSourceResponse,
    operation_id="runDesign",
    dependencies=[Depends(close_when_done)],
)
def design(run: Annotated[service.Run, Depends(service.prepare)]) -> Iterator[schemas.DesignEvent]:
    """Run the whole design of a project and tell how far it is on the way.

    The answer is a stream of events. "progress" names the step and the fraction of the run, as often
    as a step begins. The last event is "result", or "error" when the run failed. A project that cannot
    be run at all is refused with 422 before the stream begins.

    Without a system voltage the run stops after the shading: the result has the layout and the
    shading, no options, nothing chosen, and no_options says what it waits for.
    """
    events: Iterator[ServerSentEvent] = service.events(run)
    yield from events
