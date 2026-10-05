"""The demo gives what the engine as copied from the desktop app gave, to the bit (D64).

The snapshot is tools/parity.py's (tests/fixtures/parity/demo.json.gz), taken before Phase 13 changed the
engine. The design is run with the memo the tests share, so it costs nothing the other demo tests have not
paid; the roof at the limit is compared by the tool, here, not in the check.
"""

import pytest

from rooftop_core.demo import demo_project
from rooftop_core.project import Design
from tests.kept import KEPT
from tools import parity

pytestmark = pytest.mark.slow


def test_the_demo_is_the_snapshot_to_the_bit():
    now = parity.snapshot_of(Design(demo_project(), memo=KEPT))

    assert parity.differences(parity.saved("demo"), now) == []
