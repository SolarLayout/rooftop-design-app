# 001: Phase 2, engine and API

Written: 2026-09-29, by session 1. Status: open.

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session: Phase 2, engine and API.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, plan/STATE.md, plan/SESSIONS.md, plan/README.md,
plan/phase-02-engine-api.md, plan/reference/functional-inventory.md, plan/reference/demo-numbers.md.
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull
requests, the running stacks and a green `bun check`.

Step 1. Part 1 may be unfinished. Find out which of these is true and act on it:
  a. Part 1 is merged (plan/STATE.md says so and the engine is in apps/api/src/rooftop_core on
     main). Go to step 2.
  b. Branch feat/engine exists, locally or on the remote, and is not merged. It was built by an
     agent and is unreviewed. Review it before anything else:
       - git log --oneline main..feat/engine, and read the "As built, part 1" section of
         plan/phase-02-engine-api.md on that branch.
       - Check it against the scope of part 1 in plan/phase-02-engine-api.md ("Part A", "Part B",
         "Part C" as listed there or in the branch's notes). Note what is missing.
       - Confirm no engine number changed: the Pune demo at 1500 V must give 790 positions,
         option A = 29 x 22 x 1, 357.28 kWp, DC/AC 1.30, 617.8 MWh, PR 86.6 %.
         Without a system voltage: layout and shading run, no options, nothing preselected.
       - Confirm rooftop_core imports no web framework and no PyQt5 (import-linter).
       - Run `bun check`. Fix what fails, test first.
       - Rebase on main if needed, push, open a pull request, merge when the check is green.
  c. There is no such branch and the engine is not on main. Build part 1 from the scope in
     plan/phase-02-engine-api.md, test first, starting by porting the desktop app's tests.

Step 2. Build part 2, each as its own pull request, test first:
  - First: CSV weather with GHI alone fails in the split into DNI and DHI (sun positions are
    indexed half an hour later than the irradiance). The expected failure is in
    apps/api/tests/engine/test_weather_sources.py. Make it pass without changing any result for
    CSV that has DNI and DHI, or for PVGIS and NASA weather.
  - The design run takes about 16 s here and about 11 s in the desktop app's environment. Find
    out why (Python build, numpy, scipy) and close the gap if it is ours to close.
  - POST /weather: PVGIS, NASA POWER and CSV text; returns the 8,760 hours, the horizon and a
    summary. Tests use apps/api's bundled pune_weather.json and never touch the network; the
    fetch functions are covered with recorded responses.
  - POST /design with progress over SSE inside the one request: progress events with the engine's
    step names, then layout, shading summary, series range and the options with full results.
    Without a system voltage it returns layout and shading, no options, and the reason.
  - POST /export/{pdf,dxf,kmz,csv,sld}: file bytes. Exports need a chosen option; otherwise a
    clear error.
  - Memoisation per decision D6: an in-process LRU keyed by a hash of the inputs each stage
    depends on. Dropping the cache must change nothing but speed; prove it with a test.
  - Decision D24: the demo shows its equipment by its real names. Bundle
    apps/api/tests/fixtures/equipment/insolation-ina-144mhc-tf-560.PAN and
    wattpower-wp-330ktl-h1.OND as the demo's module and inverter in place of Test.PAN and
    Test-S.ond. Test first: GET /demo names Insolation INA-144MHC-TF-560 and WattPower
    WP-330KTL-H1, and every number in plan/reference/demo-numbers.md is unchanged. Keep Test.PAN
    and Test-S.ond as fixtures, with a test that both pairs give identical results.
  - Equipment fixtures: apps/api/tests/fixtures/equipment holds real PAN and OND files, with a
    README that says what each covers and which variants to make. Use them to test the paths the
    bundled samples never reach: monofacial module, a module that is not twin half-cell, a stated
    Voc coefficient, a central inverter, missing current limits, a 1000 V equipment limit.
  - Decision D25: DC cable is labelled by the system voltage as chosen. That is what the code
    does; make sure a test pins 600, 1000 and 1500 V.
  - Decide what to do about the httpx deprecation warning from starlette's TestClient.
  - After each change to routes or models: `bun gen:api`, commit packages/api-types.

Step 3. Close the phase: acceptance in plan/phase-02-engine-api.md met and written up under
"As built"; status set in plan/README.md; plan/STATE.md rewritten; this file's status set to
"used" in plan/resume/README.md. Merge that, then tell me the state in a few lines.

Rules for the whole session: production grade, test first, one change per pull request, never
change an engine number, never read or commit apps/web/.env.local, use the test stack only
(`bun dev:bg --profile test`), bun and uv only. You may commit, push and merge once the check is
green. Be brief, decide small things yourself, ask me only for major decisions, one at a time,
and show me each finished part.

Start by telling me which case of step 1 you found and what you will do.
```

## Notes for the owner

- Before pasting, add the desktop app to the session so it can be read for comparison:
  `/add-dir /Users/arunkpatra/codebase/rooftop-design`. The 3D reference project is not needed in this phase.

- Part 1 was reviewed and merged by session 1 (PR #7). The session will find case a in step 1 and go on to
  step 2.
- Part 1 found a fault in the desktop engine: CSV weather with GHI alone cannot be read. It is the first thing
  to fix in part 2, test first.
- The full design run takes about 10 seconds on the demo; that is the engine, not a fault.
- No decision is expected from you in this phase, unless an engine test from the desktop app fails after the
  copy. That would be reported to you at once, not worked around.
