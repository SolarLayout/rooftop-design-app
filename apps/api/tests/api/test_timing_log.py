"""One line per request in the log, with its time (plan/phase-11-plan.md, step 4)."""

import logging
import re
from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.testclient import TestClient

from rooftop_api.timing import HANDLER_NAME, install_timing_log, logger, timing_line

LINE = re.compile(
    r"^timing method=(?P<method>[A-Z]+) path=(?P<path>\S+) status=(?P<status>\d+|none) ms=(?P<ms>\d+)$"
)


class Heard(logging.Handler):
    """The lines the timing logger wrote, read from the logger itself: it passes nothing up to the root."""

    def __init__(self) -> None:
        super().__init__(level=logging.INFO)
        self.messages: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(record.getMessage())


@pytest.fixture
def heard() -> Iterator[Heard]:
    handler = Heard()
    logger.addHandler(handler)
    try:
        yield handler
    finally:
        logger.removeHandler(handler)


def _lines(heard: Heard) -> list[re.Match[str]]:
    matches = [LINE.match(message) for message in heard.messages]
    assert all(matches), heard.messages
    return [match for match in matches if match]


def test_the_line_has_the_method_the_path_the_status_and_whole_milliseconds():
    line = timing_line("POST", "/design", 200, 12034.4)
    assert line == "timing method=POST path=/design status=200 ms=12034"
    assert timing_line("GET", "/health", None, 0.2) == "timing method=GET path=/health status=none ms=0"


def test_a_request_of_the_api_leaves_one_line_with_its_status(client, heard):
    client.get("/health")
    client.post("/layout", json={"not": "a project"})

    lines = _lines(heard)
    seen = [(line["method"], line["path"], line["status"]) for line in lines]
    assert seen == [("GET", "/health", "200"), ("POST", "/layout", "422")]
    assert all(int(line["ms"]) >= 0 for line in lines)


def test_the_query_string_is_not_in_the_line(client, heard):
    client.get("/health?day=2026-10-04")

    assert [line["path"] for line in _lines(heard)] == ["/health"]


def test_a_streamed_answer_is_timed_to_its_last_chunk(heard):
    app = FastAPI()
    install_timing_log(app)

    @app.get("/stream")
    def stream() -> StreamingResponse:
        def chunks() -> Iterator[bytes]:
            import time

            yield b"first\n"
            time.sleep(0.05)
            yield b"last\n"

        return StreamingResponse(chunks(), media_type="text/plain")

    response = TestClient(app).get("/stream")

    assert response.text == "first\nlast\n"
    (line,) = _lines(heard)
    assert line["path"] == "/stream" and line["status"] == "200"
    # The line is written once, after the last chunk: at least the 50 ms the stream took.
    assert int(line["ms"]) >= 50


def test_the_timing_logger_writes_to_stderr_through_one_handler_of_its_own_and_does_not_pass_records_up():
    install_timing_log(FastAPI())
    install_timing_log(FastAPI())

    ours = [handler for handler in logger.handlers if handler.get_name() == HANDLER_NAME]
    assert len(ours) == 1
    assert isinstance(ours[0], logging.StreamHandler)
    assert logger.level == logging.INFO
    assert logger.propagate is False
