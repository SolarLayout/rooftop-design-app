"""The sentinel runs in every pytest run, whatever pytest-testmon selects (tests/always_run.py)."""

import os
from pathlib import Path

import pytest

pytestmark = pytest.mark.slow

API_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture
def project(pytester: pytest.Pytester, monkeypatch: pytest.MonkeyPatch) -> pytest.Pytester:
    """A small project: two ordinary tests, one sentinel, testmon on, our plugin loaded."""
    monkeypatch.setenv("PYTHONPATH", str(API_DIR) + os.pathsep + os.environ.get("PYTHONPATH", ""))
    pytester.makeini("[pytest]\naddopts = -p tests.always_run --testmon\nalways_run = test_sentinel.py\n")
    pytester.makepyfile(
        test_ordinary="def test_one():\n    assert 1 + 1 == 2\n\ndef test_two():\n    assert 2 + 2 == 4\n",
        test_sentinel="def test_the_numbers():\n    assert 3 * 3 == 9\n",
    )
    return pytester


def test_the_first_run_runs_everything(project: pytest.Pytester):
    result = project.runpytest_subprocess()
    result.assert_outcomes(passed=3)


def test_an_unchanged_project_runs_the_sentinel_and_nothing_else(project: pytest.Pytester):
    project.runpytest_subprocess().assert_outcomes(passed=3)

    result = project.runpytest_subprocess("-v")

    # A file whose tests are all unchanged is not collected, so nothing counts as deselected either.
    result.assert_outcomes(passed=1, deselected=0)
    result.stdout.fnmatch_lines(
        ["testmon: changed files: 0, unchanged files: 2*", "*test_sentinel.py::test_the_numbers PASSED*"]
    )


def test_a_changed_test_runs_with_the_sentinel_and_the_count_is_right(project: pytest.Pytester):
    project.runpytest_subprocess().assert_outcomes(passed=3)
    project.makepyfile(
        test_ordinary="def test_one():\n    assert 1 + 1 == 3 - 1\n\ndef test_two():\n    assert 2 + 2 == 4\n"
    )

    result = project.runpytest_subprocess("-v")

    # test_one changed and runs; test_two is the one test deselected; the sentinel runs and is not
    # counted as deselected although testmon deselected it first.
    result.assert_outcomes(passed=2, deselected=1)
    result.stdout.fnmatch_lines(
        ["*test_ordinary.py::test_one PASSED*", "*test_sentinel.py::test_the_numbers PASSED*"]
    )


def test_without_selection_the_plugin_does_nothing(project: pytest.Pytester):
    project.runpytest_subprocess().assert_outcomes(passed=3)

    result = project.runpytest_subprocess("--testmon-noselect")

    result.assert_outcomes(passed=3, deselected=0)


def test_the_sentinel_of_this_repo_is_the_numbers_of_the_engine(pytestconfig: pytest.Config):
    assert pytestconfig.getini("always_run") == "tests/engine/test_demo_numbers.py"
    assert (API_DIR / "tests/engine/test_demo_numbers.py").is_file()
