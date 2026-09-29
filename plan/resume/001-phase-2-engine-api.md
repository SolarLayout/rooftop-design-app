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

- Session 1 started part 1 with an agent on branch `feat/engine`. If session 1 is still open when that agent
  reports, session 1 reviews and merges part 1, and this prompt starts at step 2.
- The full design run takes about 10 seconds on the demo; that is the engine, not a fault.
- No decision is expected from you in this phase, unless an engine test from the desktop app fails after the
  copy. That would be reported to you at once, not worked around.
