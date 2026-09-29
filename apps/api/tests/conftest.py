"""Shared test setup. Tests never touch the network; weather comes from the bundled Pune sample."""

import json
import socket
from collections.abc import Iterator
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from rooftop_core.project import Design
    from rooftop_core.weather import Weather
    from tests.recorded import Services

# Names and addresses a test may talk to. "testserver" and "testclient" are the fake hosts of the
# FastAPI TestClient, which never opens a real socket anyway.
ALLOWED_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "testserver", "testclient"})


class NetworkBlockedError(RuntimeError):
    """A test tried to reach a host other than this machine."""


def _check_host(host: object) -> None:
    if isinstance(host, bytes):
        host = host.decode("ascii", "replace")
    if host is None or host == "":
        return
    if str(host).lower() not in ALLOWED_HOSTS:
        raise NetworkBlockedError(f"network blocked in tests: {host!r}")


def _check_address(sock: socket.socket, address: object) -> None:
    # Only internet sockets carry a host. Unix sockets and socket pairs stay usable.
    if sock.family in (socket.AF_INET, socket.AF_INET6) and isinstance(address, tuple) and address:
        _check_host(address[0])


def _block_network(monkeypatch: pytest.MonkeyPatch) -> None:
    """Block every connection and name lookup that leaves this machine, and every `requests.get`."""
    import requests

    real_connect = socket.socket.connect
    real_connect_ex = socket.socket.connect_ex
    real_sendto = socket.socket.sendto
    real_getaddrinfo = socket.getaddrinfo

    def connect(self: socket.socket, address: object):
        _check_address(self, address)
        return real_connect(self, address)

    def connect_ex(self: socket.socket, address: object):
        _check_address(self, address)
        return real_connect_ex(self, address)

    def sendto(self: socket.socket, *args: object):
        _check_address(self, args[-1])
        return real_sendto(self, *args)

    def getaddrinfo(host: object, *args: object, **kwargs: object):
        _check_host(host)
        return real_getaddrinfo(host, *args, **kwargs)

    def get(url: object, *args: object, **kwargs: object):
        # The engine downloads weather from PVGIS and NASA POWER with requests.get.
        raise NetworkBlockedError(f"network blocked in tests: requests.get({url!r})")

    monkeypatch.setattr(socket.socket, "connect", connect)
    monkeypatch.setattr(socket.socket, "connect_ex", connect_ex)
    monkeypatch.setattr(socket.socket, "sendto", sendto)
    monkeypatch.setattr(socket, "getaddrinfo", getaddrinfo)
    monkeypatch.setattr(requests, "get", get)


@pytest.fixture(scope="session", autouse=True)
def _no_network_in_session_fixtures() -> Iterator[None]:
    """The same guard for the whole run, so fixtures shared by many tests are covered as well."""
    with pytest.MonkeyPatch.context() as monkeypatch:
        _block_network(monkeypatch)
        yield


@pytest.fixture(autouse=True)
def _no_network(monkeypatch: pytest.MonkeyPatch) -> None:
    """Block every connection and name lookup that leaves this machine."""
    _block_network(monkeypatch)


@pytest.fixture(scope="session")
def demo_design() -> "Design":
    """The Pune demo run once: layout, bundled weather, shading, options. Read only: never change it."""
    from rooftop_core.demo import demo_project
    from rooftop_core.project import Design

    design = Design(demo_project())
    design.generate_layout()
    design.run_options()
    return design


@pytest.fixture(scope="session")
def pune_weather() -> "Weather":
    """The bundled PVGIS weather of the Pune demo."""
    from rooftop_core.resources import sample_path
    from rooftop_core.weather import Weather

    return Weather.from_json(json.loads(Path(sample_path("pune_weather.json")).read_text(encoding="utf-8")))


@pytest.fixture
def services(monkeypatch: pytest.MonkeyPatch) -> "Services":
    """PVGIS and NASA POWER answer from the recordings in tests/fixtures/weather."""
    import requests

    from tests.recorded import Services

    answering = Services()
    monkeypatch.setattr(requests, "get", answering)
    return answering
