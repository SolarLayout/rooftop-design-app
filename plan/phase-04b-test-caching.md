# Phase 4.5: caching of the checks, so that what has not changed does not run again

**Status:** not started. Asked for by the owner on 2026-09-30, after Phase 4, to be done before Phase 5. Not a
product phase: nothing of it is seen by a user. **Depends on:** nothing; it touches `tools/check.ts`,
`.github/workflows/check.yml`, `turbo.json`, `apps/api/pyproject.toml`, `e2e/` and the documents that describe them.

The owner's words: "Use proper caching techniques so that tests that haven't changed do not run unnecessarily.
this should also be done in CI. high quality industry standard caching techniques that are correct should be
built, both for dev machines and CI - both for python and TS. caching infra should be robust, safe and correct.
[...] to save time you can run tests selectively as you see fit."

## Goal

A check (`bun check` here, the `check` workflow on GitHub) runs only what a change can have changed, and says
what it skipped and why. A check that skips is never wrong: whatever it does not run, it would have passed.

## What the check runs today, and what it costs

| Step | Here | On GitHub (`ubuntu-latest`, 2 to 4 cores, varies two-fold run to run) |
|---|---|---|
| typecheck (web, tools, e2e), through turbo for the web | about 20 s | about 10 s |
| eslint (web), through turbo | about 10 s | about 8 s |
| ruff, import-linter (api) | about 1 s | about 1 s |
| pytest (api), 549 tests, with the memo of the session (#37) | 120 s | 155 to 280 s |
| bun test (root), 723 tests | about 5 s | about 3 s |
| Playwright, 1,179 tests on three sizes, with the test stack started for it | 350 s | not in CI (D20); the `e2e` workflow is started by hand and has never been run |
| The whole | about 6 min | 5 min 30 s to 5 min 40 s, of which about 40 s is setup |

The facts behind it: `tools/check.ts` runs the steps in order and stops at the first failure; `bun check
--only=` and `--skip=` choose steps. `turbo.json` has the tasks `build`, `typecheck`, `lint` and `test`, and
turbo keeps a local cache in `.turbo`, keyed on the inputs of a task, which the check already benefits from
for typecheck and lint on a second run here; nothing of that cache is kept on GitHub. `uv` has its cache on
GitHub (`setup-uv` with `enable-cache`). The tests of the engine share one memo per pytest session
(`apps/api/tests/kept.py`). Playwright 1.52 has `--only-changed`, which runs the test files that changed
since a git ref and the test files that import them, but knows nothing of the app's source. pytest has no
selection of its own; `pytest-testmon` selects by the coverage of each test, with a data file to keep.

## Scope

- **Python.** Only the tests whose code changed, or whose dependencies changed, run: the engine's modules, the
  API, the fixtures and data files they read (`tests/fixtures/**`, the samples of `rooftop_core`), the
  `conftest` files, `pyproject.toml` and `uv.lock`. A change in any of the last four runs everything.
- **TypeScript.** Unit tests, typecheck and lint keyed on their inputs, skipped when nothing of them changed,
  per package (`apps/web`, `tools`, `e2e`); the browser tests keyed on everything they can see (the web app,
  its configuration, the API's routes and types, the fixtures, the tests themselves), skipped only when none
  of it changed.
- **CI.** The same on GitHub: the caches restored from the last run on `main` and saved by each run, so that a
  pull request's second push runs what its second push changed. A push to `main` always runs everything: the
  cache is never the judge there.
- **Dev machines.** `bun check` uses the caches by default; `bun check --fresh` (or a name the session picks)
  runs everything and rebuilds them.
- **What is said.** The summary of a check names each step as run, skipped or partly run, with the count of
  tests skipped and the key or reason ("nothing of `apps/api` changed since `a9fafc0`"). A skipped test is
  reported as skipped, never as passed.
- **The documents.** `CLAUDE.md` (the commands table), `plan/SESSIONS.md` and `plan/STATE.md` say how the
  caches work, where they live, how to bypass them, and what invalidates them.

## What correct means here

1. Every key holds everything the result depends on: the sources, the tests, the fixtures and data, the
   lockfiles, the configuration of the tool, the version of the tool and of the runtime (Python, Node, bun),
   the environment variables the tool reads. A cache that misses one of these is wrong and is not built.
2. A miss runs the whole step. There is no partial credit from a stale key.
3. The cache is never trusted alone: `main` runs everything on every push, and the numbers of the engine
   (`tests/engine/test_demo_numbers.py`) run in every pytest run whatever changed, as a sentinel.
4. The caches are proven by tests of their own: a test that changes one file in a worktree of the repo and
   asserts which tests the check then runs, for each of the invalidations above, and one that shows a tree
   unchanged since a green check runs nothing. These tests are part of `bun check`, run in the last position,
   and are the thing that makes the caching safe to keep.
5. Nothing of the caches is committed; nothing of them leaves the machine but to GitHub's own cache.

## Acceptance

- Here: a second `bun check` on an unchanged tree finishes in under 45 s (the test stack's start included, if
  the browser step needs it to decide) and reports every step as skipped with its reason.
- Here: a change to one module of `rooftop_core` runs the pytest tests that use it and the sentinel, and no
  other; a change to a TypeScript module of `apps/web/lib` runs the unit tests that import it; a change to
  `apps/web/components/find` runs the browser tests; a change to a lockfile, `pyproject.toml`, `turbo.json`,
  `tools/check.ts` or a `conftest.py` runs everything.
- On GitHub: the second push of a pull request that changes a document alone runs no tests and finishes in
  under 2 min; a push to `main` runs everything.
- The tests of point 4 above pass, and the pytest, unit and browser tests pass as before with the caches in
  place and without them (`--fresh`).
- The documents are brought up to date.

## Out of scope

Parallel workers for pytest (pytest-xdist, measured at 66 s here in session 7) unless the session finds it
is the honest way to a shorter check; a remote cache service that needs an account (Vercel's for turbo, or
another); the `e2e` workflow on GitHub (Phase 11).

## As built

(Written by the session that does the work.)
