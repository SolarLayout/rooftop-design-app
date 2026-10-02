"""The candidates of the stringing options are simulated in threads (plan/phase-08-plan.md, decision 17): the
answer is the same to the bit as one candidate after the other, in the same order, and every option is still
heard, in order, by the caller's thread. Measured on the demo with the shading from the memo: 3.8 s in turn,
0.9 s in eight threads (session 12)."""

import threading

import pytest

from rooftop_core import options as options_mod
from rooftop_core import progress
from rooftop_core.project import Design
from tests.engine.same import assert_same_results
from tests.engine.test_memo import small_project

pytestmark = pytest.mark.slow


def run(threads: int, monkeypatch: pytest.MonkeyPatch, heard: list | None = None) -> Design:
    monkeypatch.setattr(options_mod, "SIMULATION_THREADS", threads)
    design = Design(small_project())
    design.generate_layout()
    design.load_weather()

    def listen(event) -> None:
        heard.append((event.step, event.fraction, threading.get_ident()))

    design.run_options(None if heard is None else listen)
    return design


def test_in_threads_the_options_are_the_same_to_the_bit_as_one_after_the_other(monkeypatch):
    in_turn = run(1, monkeypatch)
    in_threads = run(8, monkeypatch)

    assert len(in_turn.options) > 1
    assert_same_results(in_turn, in_threads)


def test_every_option_is_heard_in_order_by_the_thread_that_asked(monkeypatch):
    heard: list = []

    design = run(8, monkeypatch, heard)

    of_the_options = [(fraction, thread) for step, fraction, thread in heard if step == progress.OPTIONS]
    assert len(of_the_options) >= len(design.options)
    assert [fraction for fraction, _ in of_the_options] == sorted(fraction for fraction, _ in of_the_options)
    assert {thread for _, thread in of_the_options} == {threading.get_ident()}
    assert heard[-1][1] == 1.0


def test_the_threads_are_a_few_and_never_more_than_the_candidates():
    assert 1 < options_mod.SIMULATION_THREADS <= 8
    assert options_mod.workers_for(3) == 3
    assert options_mod.workers_for(20) == options_mod.SIMULATION_THREADS
    assert options_mod.workers_for(0) == 1
