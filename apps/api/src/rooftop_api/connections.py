"""Every answer closes its connection (plan/phase-11-plan.md, step 3).

Next's rewrite, in front of the API in development and in `bun start` alike, pools its upstream sockets and
now and then tears one down right after freeing it: a request that had taken the socket meanwhile dies with
"socket hang up", a bare 500 to the browser, while the API answered 200 (session 14, 2026-10-04: the report's
pages right after a design run, 11 of 20; none straight at the API). A connection that is closed after its
answer is never pooled and never reused, so there is nothing to tear down under anyone. The cost is a TCP
handshake per request on the same machine. Hop by hop: a proxy in front (Vercel's, a Lambda URL) keeps its
own.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable, MutableMapping
from typing import Any

from fastapi import FastAPI

Scope = MutableMapping[str, Any]
Message = MutableMapping[str, Any]
Receive = Callable[[], Awaitable[Message]]
Send = Callable[[Message], Awaitable[None]]
App = Callable[[Scope, Receive, Send], Awaitable[None]]

CLOSE = (b"connection", b"close")


class CloseConnections:
    """An ASGI middleware: `Connection: close` on every HTTP answer; uvicorn closes the socket after it."""

    def __init__(self, app: App) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_and_close(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = [pair for pair in message.get("headers", []) if pair[0].lower() != CLOSE[0]]
                headers.append(CLOSE)
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_and_close)


def install_close_connections(app: FastAPI) -> None:
    app.add_middleware(CloseConnections)
