"""One line per request in the log, with its time (plan/phase-11-plan.md, step 4; decision 8).

The line is written by the logger ``rooftop_api.timing`` when the answer is complete: for a streamed answer
(the design run's events) that is after the last chunk, so the time is the whole run's. The shape is
``key=value`` pairs, which a person reads and CloudWatch Logs Insights parses: ``timing method=POST
path=/design status=200 ms=12034``. The query string is left out (the day of an export is not worth a
field); the engine is untouched (import-linter).
"""

from __future__ import annotations

import logging
import time
from collections.abc import Awaitable, Callable, MutableMapping
from typing import Any

from fastapi import FastAPI

logger = logging.getLogger("rooftop_api.timing")
HANDLER_NAME = "rooftop_api.timing.stderr"

Scope = MutableMapping[str, Any]
Message = MutableMapping[str, Any]
Receive = Callable[[], Awaitable[Message]]
Send = Callable[[Message], Awaitable[None]]
App = Callable[[Scope, Receive, Send], Awaitable[None]]


def timing_line(method: str, path: str, status: int | None, ms: float) -> str:
    """The line as logged. *status* None when the request ended before an answer began."""
    return f"timing method={method} path={path} status={status if status is not None else 'none'} ms={ms:.0f}"


class TimingLog:
    """An ASGI middleware, not Starlette's BaseHTTPMiddleware, so that a streamed answer is not buffered."""

    def __init__(self, app: App) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        began = time.perf_counter()
        status: int | None = None

        async def send_and_watch(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = int(message["status"])
            await send(message)
            if message["type"] == "http.response.body" and not message.get("more_body", False):
                ms = (time.perf_counter() - began) * 1000
                logger.info(timing_line(scope["method"], scope["path"], status, ms))

        await self.app(scope, receive, send_and_watch)


def install_timing_log(app: FastAPI) -> None:
    """Every request of *app* gets its line. The logger writes to stderr, where uvicorn's own lines go and
    where a Lambda's log is read from, through a handler of its own, added once; it does not pass its records
    up, so that a root logger configured later does not print them twice."""
    app.add_middleware(TimingLog)
    if not any(getattr(handler, "name", None) == HANDLER_NAME for handler in logger.handlers):
        handler = logging.StreamHandler()
        handler.set_name(HANDLER_NAME)
        handler.setFormatter(logging.Formatter("INFO:     %(message)s"))
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
