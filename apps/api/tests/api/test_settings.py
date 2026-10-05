"""What the server is told through its environment (rooftop_api.settings)."""

import pytest

from rooftop_api import settings


def test_downloads_are_on_when_nothing_is_said(monkeypatch):
    monkeypatch.delenv(settings.WEATHER_DOWNLOADS, raising=False)

    assert settings.weather_downloads_on() is True


@pytest.mark.parametrize("value", ["off", "OFF", " off "])
def test_off_turns_downloads_off_however_it_is_written(monkeypatch, value):
    monkeypatch.setenv(settings.WEATHER_DOWNLOADS, value)

    assert settings.weather_downloads_on() is False


@pytest.mark.parametrize("value", ["on", "", "0", "false"])
def test_any_other_word_leaves_downloads_on(monkeypatch, value):
    monkeypatch.setenv(settings.WEATHER_DOWNLOADS, value)

    assert settings.weather_downloads_on() is True


def test_the_environment_can_be_given():
    assert settings.weather_downloads_on({settings.WEATHER_DOWNLOADS: "off"}) is False
    assert settings.weather_downloads_on({}) is True


def test_simulation_threads_are_the_engines_own_when_nothing_is_said():
    assert settings.simulation_threads({}) is None
    assert settings.simulation_threads({settings.SIMULATION_THREADS: " "}) is None


@pytest.mark.parametrize(("value", "threads"), [("1", 1), (" 2 ", 2), ("16", 16)])
def test_simulation_threads_are_a_whole_number(value, threads):
    assert settings.simulation_threads({settings.SIMULATION_THREADS: value}) == threads


@pytest.mark.parametrize("value", ["0", "-1", "two", "1.5"])
def test_simulation_threads_that_are_not_a_count_are_refused_in_words(value):
    refusal = r"ROOFTOP_SIMULATION_THREADS must be a whole number of 1 or more, got"
    with pytest.raises(ValueError, match=refusal):
        settings.simulation_threads({settings.SIMULATION_THREADS: value})


def test_the_commit_is_none_when_nothing_is_said():
    assert settings.commit({}) is None
    assert settings.commit({settings.COMMIT: ""}) is None


def test_the_commit_is_what_the_build_said():
    assert settings.commit({settings.COMMIT: " 8a4b246 \n"}) == "8a4b246"
