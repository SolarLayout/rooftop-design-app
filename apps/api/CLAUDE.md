# apps/api: Claude Code context

The engine (`rooftop_core`) and the API (`rooftop_api`). Read the root `CLAUDE.md` first; its rules apply here.

## A change the user meets
What the engine decides or works out, and every rule or limit of the API, is told to the user in the in-app help
(`apps/web/content/help`). No test fails when it goes stale. In the same pull request, keep it true:
`docs/help-upkeep.md`, and say what was read and changed under "How it was checked".

## Time and memory
The app is near-real time and runs on AWS Lambda at 1,769 MB, one vCPU, the options in one thread (D67). An engine change
must not make a design run slower or larger without the owner knowing: measure it before the merge and put the numbers in
the pull request.
- Inside the API's own image (Linux, arm64, as Lambda allocates), main against the branch:
  `docker buildx build --platform linux/arm64 --provenance=false -t rooftop-api:<name> --load apps/api`, then
  `docker run --rm --platform linux/arm64 --entrypoint python -v "$PWD/apps/api/tools:/work/tools:ro" -w /work -e PYTHONPATH=/work rooftop-api:<name> -m tools.profile_engine demo --threads 1`
  (and `limit`, the roof at the limit, the worst case). Three runs each after a cold one. macOS's numbers are not Lambda's.
- Realistic cases only: an inverter that suits the roof, not a pairing no designer would make.
- What Lambda really uses: the `Max Memory Used` of the functions' REPORT lines (`aws logs filter-log-events`, profile
  `journium-dev`, read only).
- D67 keeps the size about 25 % over the peak. If a change puts that margin at risk, open an issue.

## Request limits
What a request may carry is set in `src/rooftop_api/schemas/limits.py` so that the largest project the API takes still fits
one request to the deployed API, to run it and to open its file (D89, `tests/api/test_request_limits.py`). A field that
adds to a project's size is added to that test.
