"""The image's settings that the deployment depends on (apps/api/Dockerfile; plan/phase-12-plan.md). Each one
was found by running on Lambda; losing one breaks production in a way no other test sees."""

import re
from pathlib import Path

DOCKERFILE = Path(__file__).parents[1] / "Dockerfile"


def environment() -> dict[str, str]:
    """The ENV of the image's last stage, as names and values."""
    text = DOCKERFILE.read_text()
    last_stage = text[text.rindex("\nFROM ") :]
    found: dict[str, str] = {}
    for block in re.findall(r"^ENV (.+?)(?<!\\)$", last_stage, flags=re.MULTILINE | re.DOTALL):
        for name, value in re.findall(r"([A-Z_]+)=(\S+)", block):
            found[name] = value
    return found


def test_the_answer_streams_so_the_design_runs_events_arrive_as_they_happen():
    assert environment()["AWS_LWA_INVOKE_MODE"] == "response_stream"


def test_the_adapter_waits_for_the_health_check_before_the_first_request():
    assert environment()["AWS_LWA_READINESS_CHECK_PATH"] == "/health"


def test_a_start_slower_than_lambdas_ten_seconds_is_not_started_over():
    assert environment()["AWS_LWA_ASYNC_INIT"] == "true"


def test_matplotlib_writes_where_lambda_lets_it():
    assert environment()["MPLCONFIGDIR"].startswith("/tmp/")


def test_the_image_says_which_commit_it_was_built_from():
    assert environment()["ROOFTOP_COMMIT"] == "${ROOFTOP_COMMIT}"


def test_the_options_are_simulated_in_one_thread_on_lambda():
    # D61: at the roof limit two threads peaked at 10,215 MB of 10,240, one at 5,652 MB and was not slower (#96).
    assert environment()["ROOFTOP_SIMULATION_THREADS"] == "1"
