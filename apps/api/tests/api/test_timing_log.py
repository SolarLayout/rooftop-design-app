"""One line per request in the log, with its time (plan/phase-11-plan.md, step 4)."""

import logging
import re
from collections.abc import Iterator

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.testclient import TestClient

from rooftop_api.timing import install_timing_log, timing_line

LINE = re.compile(
    r"^timing method=(?P<method>[A-Z]+) path=(?P<path>\S+) status=(?P<status>\d+|none) ms=(?P<ms>\d+)$"
)


def _lines(caplog) -> list[re.Match[str]]:
    ours = [record.getMessage() for record in caplog.records if record.name == "rooftop_api.timing"]
    matches = [LINE.match(message) for message in ours]
    assert all(matches), ours
    return [match for match in matches if match]


def test_the_line_has_the_method_the_path_the_status_and_whole_milliseconds():
    line = timing_line("POST", "/design", 200, 12034.4)
    assert line == "timing method=POST path=/design status=200 ms=12034"
    assert timing_line("GET", "/health", None, 0.2) == "timing method=GET path=/health status=none ms=0"


def test_a_request_of_the_api_leaves_one_line_with_its_status(client, caplog):
    with caplog.at_level(logging.INFO, logger="rooftop_api.timing"):
        client.get("/health")
        client.post("/layout", json={"not": "a project"})

    lines = _lines(caplog)
    seen = [(line["method"], line["path"], line["status"]) for line in lines]
    assert seen == [("GET", "/health", "200"), ("POST", "/layout", "422")]
    assert all(int(line["ms"]) >= 0 for line in lines)


def test_the_query_string_is_not_in_the_line(client, caplog):
    with caplog.at_level(logging.INFO, logger="rooftop_api.timing"):
        client.get("/health?day=2026-10-04")

    assert [line["path"] for line in _lines(caplog)] == ["/health"]


def test_a_streamed_answer_is_timed_to_its_last_chunk(caplog):
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

    with caplog.at_level(logging.INFO, logger="rooftop_api.timing"):
        response = TestClient(app).get("/stream")

    assert response.text == "first\nlast\n"
    (line,) = _lines(caplog)
    assert line["path"] == "/stream" and line["status"] == "200"
    # The line is written once, after the last chunk: at least the 50 ms the stream took.
    assert int(line["ms"]) >= 50


def test_the_timing_logger_writes_to_stderr_when_nobody_configured_logging():
    app = FastAPI()
    install_timing_log(app)
    logger = logging.getLogger("rooftop_api.timing")

    assert logger.level == logging.INFO
    assert any(isinstance(handler, logging.StreamHandler) for handler in logger.handlers)
