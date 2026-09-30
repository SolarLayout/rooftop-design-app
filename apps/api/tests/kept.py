"""The results that the tests of one session share (decision D6): a design whose inputs a test ran
earlier is not worked out again. The API keeps its results here too, so an engine test and an API test
of the same design share one shading. A test that counts the work makes a memo of its own, or none.
"""

from rooftop_core import memo

KEPT = memo.MemoryMemo()
