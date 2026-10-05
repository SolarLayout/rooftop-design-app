"""What a start of the API loads: matplotlib waits for the first report or file drawn (Phase 13), so that a
cold start on Lambda does not pay for it."""

import subprocess
import sys


def test_starting_the_api_does_not_load_matplotlib():
    probe = "import sys, rooftop_api.main; print('matplotlib' in sys.modules)"

    started = subprocess.run([sys.executable, "-c", probe], capture_output=True, text=True, check=True)

    assert started.stdout.strip() == "False"
