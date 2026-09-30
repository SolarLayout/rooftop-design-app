"""One memo for the session: the engine tests and the API keep their results in the same place."""

from tests.kept import KEPT


def test_the_api_keeps_its_results_where_the_tests_do():
    from rooftop_api.services import design as service

    assert service.MEMO is KEPT


def test_the_demo_of_the_engine_tests_is_kept_there(demo_design):
    assert demo_design.memo is KEPT
