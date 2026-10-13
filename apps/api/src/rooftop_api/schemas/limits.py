"""What a request may carry (#162). Set so that the largest project the API takes still fits one request to
the deployed API, whose Lambda Function URL takes 6,291,456 bytes at most (#98), both to run it and, as its
project file, to open it: a project the app accepted can always be run and opened again. Held to it by
tests/api/test_request_limits.py."""

# A year of weather: hourly, 0.5 to 0.75 MB for 6 to 11 columns; every 15 minutes, 2 to 3 MB.
MAX_CSV_TEXT = 3_000_000
# A module (PAN) or inverter (OND) file: the 507 the app bundles are 3.7 KB at the most.
MAX_EQUIPMENT_TEXT = 256_000
MAX_EQUIPMENT_BASE64 = 4 * -(-MAX_EQUIPMENT_TEXT // 3)  # the same file sent as base64
# A project's name, and the name of its place (D114).
MAX_NAME = 200
# The project file: the largest project the API takes, as the engine writes it.
MAX_PROJECT_TEXT = 5_000_000
