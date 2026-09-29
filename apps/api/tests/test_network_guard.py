"""The guard in conftest.py is itself under test: a rule nobody checks is a rule nobody keeps."""

import socket

import pytest

from tests.conftest import NetworkBlockedError


def test_connecting_to_a_public_address_is_blocked():
    # 192.0.2.1 is a documentation address (RFC 5737); the guard stops the call before any packet leaves.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        with pytest.raises(NetworkBlockedError):
            sock.connect(("192.0.2.1", 80))


def test_looking_up_a_public_name_is_blocked():
    with pytest.raises(NetworkBlockedError):
        socket.getaddrinfo("example.com", 443)


def test_this_machine_stays_reachable():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.bind(("127.0.0.1", 0))
        server.listen(1)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect(server.getsockname())
