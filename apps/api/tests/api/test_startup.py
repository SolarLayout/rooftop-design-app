"""What the server does once as it starts: the threads of the simulations from its environment."""

import pytest
from fastapi.testclient import TestClient

from rooftop_api import settings
from rooftop_api.main import app
from rooftop_core import options


def test_the_simulation_threads_follow_the_environment(monkeypatch):
    monkeypatch.setattr(options, "SIMULATION_THREADS", options.SIMULATION_THREADS)
    monkeypatch.setenv(settings.SIMULATION_THREADS, "2")

    with TestClient(app):
        assert options.SIMULATION_THREADS == 2


def test_the_simulation_threads_stay_the_engines_when_nothing_is_said(monkeypatch):
    engine_threads = options.SIMULATION_THREADS
    monkeypatch.delenv(settings.SIMULATION_THREADS, raising=False)

    with TestClient(app):
        assert options.SIMULATION_THREADS == engine_threads


def test_a_wrong_count_stops_the_server_in_words(monkeypatch):
    monkeypatch.setattr(options, "SIMULATION_THREADS", options.SIMULATION_THREADS)
    monkeypatch.setenv(settings.SIMULATION_THREADS, "many")

    with pytest.raises(ValueError, match="ROOFTOP_SIMULATION_THREADS"), TestClient(app):
        pass
