# 007: Phase 4.5, caching of the checks

Written: 2026-09-30, by session 7, at the owner's request. Status: open.

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session is Phase 4.5: caching of the checks, so
that tests and steps whose inputs have not changed do not run again, here and on GitHub, for Python and for
TypeScript. It is not a product phase: nothing of it is seen by a user. The owner asked for it on 2026-09-30,
in these words: "Use proper caching techniques so that tests that haven't changed do not run unnecessarily.
this should also be done in CI. high quality industry standard caching techniques that are correct should be
built, both for dev machines and CI - both for python and TS. caching infra should be robust, safe and
correct. [...] to save time you can run tests selectively as you see fit."

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, plan/STATE.md (where the work stands, the open items, the facts of the
machine), plan/SESSIONS.md, plan/README.md (every decision; D19 to D21 are the standard, the check and the
merge), plan/phase-04b-test-caching.md (the goal, what the check runs today and what it costs, the scope, what
correct means here, the acceptance; the whole of it is your brief), plan/sessions/007/record.md (the memo of
the tests, the measuring of pytest, how bun check was run and what went wrong when the app was edited during
it). Then the code of the check: tools/check.ts (the steps, --only and --skip), tools/lib/node.ts and
tools/with-node.ts (Node for the tools), tools/dev.ts (the test stack the browser tests use),
.github/workflows/check.yml and e2e.yml, turbo.json, package.json (the scripts), apps/api/pyproject.toml
(pytest's options and markers), apps/api/tests/conftest.py and tests/kept.py (the network guard, the memo of
the session), e2e/playwright.config.ts and e2e/global-setup.ts (the projects, the stack, the demo run once),
e2e/fixtures.ts (the network guard of the browser tests). Then follow "Start of a session" in plan/SESSIONS.md:
git, open pull requests, the stacks, bun install, uv sync, and a green `bun check` on main.

Then, before you build, write the plan of the phase as plan/phase-04b-plan.md, the way plan/phase-04-plan.md
was written for Phase 4: what you found (the caches that exist already: turbo's local one, uv's on GitHub; what
each tool can and cannot select, with the version pinned in the repo), the steps in order, the decisions you
take unless the owner says otherwise (each with its why), the risks, and what done means, point by point
against the acceptance of the phase file. Measure before you decide: how long each step takes here and on
GitHub, and what a second run on an unchanged tree costs today. Commit the plan to main (documents alone go
straight to main, D26) and tell the owner in a few lines; the owner answers the decisions with a yes or an
overruling, one at a time. Build only after that.

What matters most, in this order: correct, then honest, then fast. A cache that could skip a test that would
have failed is wrong, however fast. Every key holds every input (sources, tests, fixtures and data, lockfiles,
configuration, the versions of the tools and runtimes, the environment the tool reads); a miss runs the whole
step; main runs everything on every push; the engine's numbers (tests/engine/test_demo_numbers.py) run in
every pytest run as a sentinel; a skipped test is reported as skipped, never as passed; the summary of a check
says what it skipped and why. The caches are proven by tests of their own that change one file in a worktree
and assert what then runs; those tests are part of bun check.

Things to know at handover:
  - Python: pytest-testmon is the industry's selection by coverage; check what it tracks and what it does not
    (data files read at run time, environment variables, the version of Python), and add what it misses to
    the key yourself. The tests of the engine read files under apps/api/tests/fixtures and the samples of
    rooftop_core; the API's tests share one memo per session (tests/kept.py), which a selection must not
    break: a test that expects a shading kept by an earlier test in the run cannot exist (check that none
    does). The check on GitHub runs pytest in 155 to 280 s for the same code: the runners vary two-fold, so
    measure by what runs, not by seconds.
  - TypeScript: bun test has no selection; turbo caches a task on the inputs of its package, all or nothing.
    The unit tests are *.test.ts beside their code in apps/web, tools and e2e (bun test at the root runs them
    all). Playwright 1.52 has --only-changed, which follows the imports of the test files, not the app's
    source: alone it is not safe. The browser tests see the web app, the API (its routes, the types in
    packages/api-types, the demo), the fixtures in e2e/fixtures, the baselines and the config: their key holds
    all of that. The check's browser step is local only (D20).
  - CI: actions/cache for what turbo and testmon keep, restored from the last run on main, saved by each run;
    the workflow's own checkout must have the history it needs (fetch-depth) for a diff against main. A push
    to main runs everything.
  - Versions are pinned exactly (D4): a new tool joins pinned, in the lockfile, and named in
    plan/README.md as a decision.
  - Never edit apps/web or apps/api while bun check runs: the test stack reloads them live and the browser
    tests see the half-made change (plan/STATE.md, "Facts"). Never git stash while the test stack runs.
  - The tests of the caching change files: do it in a worktree of the repo, never in the working tree, and
    leave nothing behind.
  - The check stops at the first failure; a step that is skipped must not hide a step that would have failed
    after it.

Rules for the whole session: production grade, test first and seen failing, bun and uv only, versions pinned
exactly, never read or commit apps/web/.env.local, use the test stack only (bun dev:bg --profile test). You
may commit, push and merge pull requests once the check is green; a change to documents only goes to main
directly (D26). One change per pull request; expect two or three: the Python side, the TypeScript side, CI.
Update plan/STATE.md before you stop, write "As built" in plan/phase-04b-test-caching.md with the numbers before
and after, set this prompt to used in plan/resume/README.md, write plan/sessions/008. Be brief, decide small
things yourself, ask only for major decisions, one at a time, and show me each finished part. Past two thirds
of your context, finish the step in hand, update the state and hand over.

Start by telling me what you found at the start of the session and the numbers you measured, then the plan.
```

## Notes for the owner

- The session writes a plan first and waits for your yes to its decisions, as Phase 4 did. Expect that
  message within the first hour, with the measurements.
- A new dependency or two is likely (pytest-testmon for Python; possibly a plugin for the summary). Each will
  be pinned and named as a decision for you.
- Nothing to add with `/add-dir`.
- GitHub's runners vary two-fold in speed on the same code; the session is told to measure by what runs, not
  by seconds. A pull request's check on GitHub may still take a few minutes on a full run.
- The `e2e` workflow (browser tests on GitHub) stays out of this phase (D20; Phase 11).
