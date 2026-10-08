"""Renewing the parity snapshot after a change of the engine's behaviour: what moved past D64's bar is taken
from today's engine, everything else stays as the desktop's engine gave it."""

from tools import parity


def test_a_figure_within_the_bar_keeps_the_snapshot_s_value():
    was = {"energy_mwh": 617.8000000001}

    assert parity.renewed(was, {"energy_mwh": 617.8000000002}) == was


def test_a_figure_past_the_bar_takes_today_s_value():
    now = {"strings": 27, "pr": 0.86}

    assert parity.renewed({"strings": 23, "pr": 0.86}, now) == now


def test_an_option_with_another_key_is_today_s_whole():
    was = {"key": "26x27x2", "dcac": 0.71, "pr": 0.861}
    now = {"key": "28x28x2", "dcac": 0.80, "pr": 0.861000000001}

    assert parity.renewed(was, now) == now


def test_what_today_has_not_is_dropped_and_what_it_has_anew_is_taken():
    was = {"hourly": {"29x22x1": [1.0], "26x27x2": [2.0]}}
    now = {"hourly": {"29x22x1": [1.0], "28x28x2": [3.0]}}

    assert parity.renewed(was, now) == now


def test_a_list_of_another_length_is_today_s():
    now = {"strings": [1.0, 2.0, 3.0]}

    assert parity.renewed({"strings": [1.0, 2.0]}, now) == now


def test_the_renewed_snapshot_is_today_s_within_the_bar():
    was = {"options": [{"key": "a", "e": 1.0, "n": 3}, {"key": "b", "e": 2.0}]}
    now = {"options": [{"key": "a", "e": 1.0000000001, "n": 4}, {"key": "c", "e": 5.0}]}

    renewed = parity.renewed(was, now)

    assert all(parity.within_the_bar(m) for m in parity.differences(renewed, now))
    assert renewed["options"][0]["e"] == 1.0
