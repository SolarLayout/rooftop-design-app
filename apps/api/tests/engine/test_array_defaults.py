"""The array a design starts with, and the demo's own (the owner, session 18, D69)."""

from rooftop_core.demo import demo_array, demo_project
from rooftop_core.placement import ArraySpec


def test_a_new_design_has_one_module_in_tilt():
    assert ArraySpec().modules_in_tilt == 1


def test_the_demo_keeps_its_two_modules_in_tilt_and_the_rest_of_the_defaults():
    assert demo_array() == ArraySpec(modules_in_tilt=2)
    assert demo_project().array == demo_array()
