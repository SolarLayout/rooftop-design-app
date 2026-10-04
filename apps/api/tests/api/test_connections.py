"""Every answer closes its connection (plan/phase-11-plan.md, step 3), so that a proxy in front never reuses
a socket the API is about to lose: Next's rewrite tore down freed sockets under the next request (session 14).
"""

import pytest


@pytest.mark.parametrize(
    "ask",
    [
        lambda client, demo: client.get("/health"),
        lambda client, demo: client.post("/layout", json={"not": "a project"}),
        lambda client, demo: client.post("/design", json=demo),
    ],
    ids=["a plain answer", "a refusal", "the design stream"],
)
def test_the_answer_says_the_connection_closes(client, demo, ask):
    response = ask(client, demo)

    assert response.headers["connection"] == "close"
    assert response.headers.get_list("connection") == ["close"]
