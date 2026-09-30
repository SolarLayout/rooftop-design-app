"""The sentinel: one file of tests that runs in every pytest run, whatever pytest-testmon selects.

Testmon deselects the tests whose code has not changed, and does not even collect a file whose tests are
all unchanged. The numbers of the engine (`tests/engine/test_demo_numbers.py`, named by the ini option
`always_run`) are the check that the selection is never wrong: they run every time, and testmon records
them as forced. Without selection (plain pytest, `--testmon-noselect`) this plugin changes nothing.
"""

from collections.abc import Generator
from pathlib import Path

import pytest


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addini(
        "always_run", "A test file, relative to the rootdir, that runs whatever pytest-testmon selects."
    )


def _selecting(config: pytest.Config) -> bool:
    testmon = getattr(config, "testmon_config", None)
    return bool(testmon and getattr(testmon, "select", False))


def _sentinel(config: pytest.Config) -> Path | None:
    name = config.getini("always_run")
    return (config.rootpath / name).resolve() if name else None


@pytest.hookimpl(wrapper=True)
def pytest_ignore_collect(
    collection_path: Path, config: pytest.Config
) -> Generator[None, bool | None, bool | None]:
    """Testmon ignores a file whose tests are all unchanged; the sentinel's file is collected anyway."""
    ignored = yield
    if ignored and _selecting(config) and collection_path.resolve() == _sentinel(config):
        return False
    return ignored


@pytest.hookimpl(wrapper=True)
def pytest_collection_modifyitems(
    session: pytest.Session, config: pytest.Config, items: list[pytest.Item]
) -> Generator[None, None, None]:
    """Testmon deselects the sentinel's tests with the rest; they are put back, and the count corrected."""
    sentinel = _sentinel(config)
    before = [item for item in items if sentinel is not None and item.path.resolve() == sentinel]
    yield
    if not _selecting(config) or not before:
        return
    kept = {id(item) for item in items}
    missing = [item for item in before if id(item) not in kept]
    if not missing:
        return
    items.extend(missing)
    # Testmon reported them deselected already; the summary must count them as run, not as deselected.
    reporter = config.pluginmanager.get_plugin("terminalreporter")
    deselected = reporter.stats.get("deselected") if reporter is not None else None
    if deselected:
        del deselected[-len(missing) :]
