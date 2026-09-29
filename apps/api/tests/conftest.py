"""Shared test setup. Tests never touch the network."""

import socket

import pytest

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


@pytest.fixture(autouse=True)
def _no_network(monkeypatch: pytest.MonkeyPatch) -> None:
    """Block every connection and name lookup that leaves this machine."""
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

    monkeypatch.setattr(socket.socket, "connect", connect)
    monkeypatch.setattr(socket.socket, "connect_ex", connect_ex)
    monkeypatch.setattr(socket.socket, "sendto", sendto)
    monkeypatch.setattr(socket, "getaddrinfo", getaddrinfo)
