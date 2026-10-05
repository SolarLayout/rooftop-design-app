"""A design run's stream stays open through a long silent step: while no event comes, the server sends a
comment that keeps the line alive. In production the browser reaches the API through Vercel's CDN, which drops
an answer that sends nothing for 120 s; the shading of a roof at the limit is one step of about a minute here
and longer on a Lambda's share of a CPU (plan/phase-12-plan.md). FastAPI sends the comment every 15 s; the
test makes it shorter."""

import time
from collections.abc import Iterator

import fastapi.routing
from fastapi.sse import ServerSentEvent
from fastapi.testclient import TestClient

from rooftop_api.main import app
from rooftop_api.services import design as service

PING = ": ping"


def silent_run(_run: object) -> Iterator[ServerSentEvent]:
    """A run with one step that says nothing for a while, as the shading does."""
    shading = {"step": "Computing hourly shading for every module", "fraction": 0.1}
    yield ServerSentEvent(event="progress", data=shading)
    time.sleep(0.5)
    yield ServerSentEvent(event="result", data={})


def test_a_silent_step_is_kept_alive_with_comments(monkeypatch):
    monkeypatch.setattr(fastapi.routing, "_PING_INTERVAL", 0.05)
    monkeypatch.setattr(service, "events", silent_run)
    app.dependency_overrides[service.prepare] = lambda: object()
    try:
        response = TestClient(app).post("/design")
    finally:
        app.dependency_overrides.pop(service.prepare)

    lines = response.text.splitlines()
    first, last = lines.index("event: progress"), lines.index("event: result")
    assert response.status_code == 200
    assert PING in lines[first:last]


def test_a_step_that_speaks_in_time_needs_no_comment(monkeypatch):
    monkeypatch.setattr(service, "events", silent_run)
    app.dependency_overrides[service.prepare] = lambda: object()
    try:
        response = TestClient(app).post("/design")
    finally:
        app.dependency_overrides.pop(service.prepare)

    assert PING not in response.text.splitlines()
