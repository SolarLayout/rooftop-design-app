"""The design run."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.sse import EventSourceResponse, ServerSentEvent

from rooftop_api import schemas
from rooftop_api.errors import STREAM_ERROR_RESPONSES
from rooftop_api.services import design as service

router = APIRouter(tags=["design"], responses=STREAM_ERROR_RESPONSES)


@router.post("/design", response_class=EventSourceResponse, operation_id="runDesign")
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
