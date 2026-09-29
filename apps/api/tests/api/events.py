"""Reading a stream of server-sent events as a test sees it: whole, after the request is over."""

import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Event:
    name: str
    data: dict[str, Any]


def events_of(response) -> list[Event]:
    """The events of an answer in the order they were sent. Comments that keep the line open are left out."""
    assert response.headers["content-type"].startswith("text/event-stream"), response.text[:300]
    found = []
    for block in response.text.replace("\r\n", "\n").split("\n\n"):
        lines = [line for line in block.split("\n") if line and not line.startswith(":")]
        if not lines:
            continue
        name = next(line[len("event: ") :] for line in lines if line.startswith("event: "))
        data = "\n".join(line[len("data: ") :] for line in lines if line.startswith("data: "))
        found.append(Event(name, json.loads(data)))
    return found


def result_of(response) -> dict[str, Any]:
    """The result of a design run: its last event."""
    assert response.status_code == 200, response.text[:300]
    last = events_of(response)[-1]
    assert last.name == "result", last
    return last.data["result"]
