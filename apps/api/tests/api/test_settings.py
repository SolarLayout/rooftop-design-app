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
