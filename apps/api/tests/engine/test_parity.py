"""The demo gives what the engine as copied from the desktop app gave (D64).

The snapshot is tools/parity.py's (tests/fixtures/parity/demo.json.gz), taken on the owner's machine before
Phase 13 changed the engine. On that machine a change that keeps the arithmetic is identical to the bit
(`tools.parity check` says so); on another (GitHub's runners: Linux, x86-64, another BLAS and maths library)
the last bit of a sum may round otherwise, so this test holds every figure to D64's bar. The design is run
with the memo the tests share, so it costs nothing the other demo tests have not paid; the roof at the limit
is compared by the tool, here, not in the check.
"""

import pytest

from rooftop_core.project import Design
from tests.kept import KEPT
from tools import parity
from tools.reference import reference_demo

pytestmark = pytest.mark.slow


def test_the_demo_is_the_snapshot_within_the_bar():
    now = parity.snapshot_of(Design(reference_demo(), memo=KEPT))
    moved = parity.differences(parity.saved("demo"), now)

    past = [m for m in moved if not parity.within_the_bar(m)]

    assert past == [], parity.report(past)
