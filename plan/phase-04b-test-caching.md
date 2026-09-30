# Phase 4.5: caching of the checks, so that what has not changed does not run again

**Status:** done, session 8, 2026-09-30 (#39, #40, #41). How it was built: `phase-04b-plan.md`. Asked for by the owner on 2026-09-30, after Phase 4, to be done before Phase 5. Not a
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

Built by session 8 on 2026-09-30, in three pull requests, as `phase-04b-plan.md` laid out. The owner took
decisions 1, 4 and 11 of that plan; the rest were the session's.

### What exists

| Thing | Where |
|---|---|
| Every step of the check a turbo task, keyed on its inputs, the lockfile and the toolchain; the summary that says what ran, what was skipped and why (`skipped: inputs unchanged, cached at <commit> (turbo hash ...)`); `--fresh` | `tools/check.ts`, `tools/check/flags.ts`, `tools/check/run-summary.ts`, `turbo.json` |
| The toolchain (Node, bun, uv, Python, platform) as `ROOFTOP_TOOLCHAIN`, named in `globalEnv`; `bunfig.toml`, `.nvmrc`, the root `tsconfig.json`, `tools/check.ts` and `tools/check/**` as global dependencies | `tools/check/toolchain.ts`, `turbo.json` |
| The tasks: `typecheck` (web, e2e, api-types, and `//#typecheck:tools`), `lint` (web's eslint, api's ruff), `imports` (api), `test` (web's `bun test`, api's pytest, `//#test:tools`), `//#e2e` (the browser tests on all they can see), `//#proofs` | `turbo.json`, the `scripts` of `package.json`, `apps/web/package.json`, `apps/api/package.json` |
| `e2e` depends on `@rooftop/web`, whose client it imports | `e2e/package.json` |
| pytest-testmon 2.2.0 and coverage 7.16.2, pinned (D53); the runner that keeps testmon's data valid by a key over what testmon does not track, runs pytest with the selection, and reports what ran; `ROOFTOP_CHECK_SELECT=0` for a whole, untraced run | `apps/api/pyproject.toml`, `tools/check/pytest-selected.ts`, `tools/check/pytest-data-key.ts`, `tools/check/pytest-summary.ts`, `tools/check/pytest-selected-report.ts` |
| The sentinel: `tests/engine/test_demo_numbers.py` runs in every pytest run whatever testmon selects (ini option `always_run`) | `apps/api/tests/always_run.py`, `apps/api/tests/test_always_run.py` (pytester) |
| The proofs, last in the check, in a worktree of `HEAD` with the working tree's changes, removed afterwards: the tasks turbo re-runs after each change; what pytest re-runs on a quick subset | `tools/check/proofs/worktree.ts`, `turbo-hashes.ts`, `turbo.proof.ts`, `pytest.proof.ts` |
| On GitHub: `.turbo/cache` restored from the most recent run of the branch or of `main`, saved after every run (success or failure, not cancel), keyed on the lockfiles and the run; `main` runs `--fresh`; pytest whole and untraced | `.github/workflows/check.yml` |
| The caches: `.turbo/` (turbo's entries and run summaries), `apps/api/.testmondata` with `.testmondata.key` beside it. Ignored by git | `.gitignore` |

### The numbers, before and after

| What | Before | After |
|---|---|---|
| `bun check` here, everything changed (or `--fresh`) | 491 s | 429 s with selection warm; a first run with testmon's data rebuilt costs pytest 139 s instead of 118 s (tracing, about 18 %) |
| `bun check` here, unchanged tree | 491 s: nothing skipped | 1.7 s: every step skipped with its reason |
| pytest here after one line inside `geo.lonlat_to_local` | 121 s (everything) | the tests through it and the sentinel; on the proofs' subset, the roof-map tests and the sentinel. Nothing of `apps/api` changed: 13 s, the sentinel alone (8 of 555) |
| `bun check --skip=e2e` here, unchanged | about 130 s | about 2 s |
| GitHub, a push with code | 297 to 304 s of check, plus about 30 s of setup | the same when everything changed (pytest 187 to 327 s, the runners vary); a push that leaves `apps/api` alone skips pytest |
| GitHub, a second push of a pull request that changes a document alone | about 300 s | 25 s for the whole job, the check step 1 s, every step skipped (#41, run 36710754373) |
| GitHub, a push to `main` | about 300 s | everything, `--fresh`: 6 min 34 s for the job, the check step 6 min 9 s, pytest 279 s whole and untraced (run 36710853739, a slow runner). A run on `main` restores nothing: GitHub shows a branch the caches of that branch and of `main`, so `main` sees only its own, and ignores them anyway; what it saves is what the pull requests restore |
| The proofs | none | 14 turbo proofs in 5 s; 9 Python proofs in 35 to 45 s; skipped like any step when nothing of theirs changed |

### Against the acceptance

| Acceptance | Result |
|---|---|
| A second `bun check` on an unchanged tree under 45 s, every step skipped with its reason | 1.7 s, eight steps skipped, each with the commit and the turbo hash |
| One module of `rooftop_core` runs the pytest tests that use it and the sentinel, and no other | Proved (`pytest.proof.ts`): a statement inside `geo.lonlat_to_local` runs the roof-map tests and the sentinel |
| A TypeScript module of `apps/web/lib` runs the unit tests that import it | The 707 unit tests of the web app run as one task (0.3 s) and the 58 of `tools` do not. Deviation, said in the plan: bun test has no selection, and a finer key would cost more than it saves |
| A change to `apps/web/components/find` runs the browser tests | Proved (`turbo.proof.ts`) |
| A lockfile, `pyproject.toml`, `turbo.json`, `tools/check.ts` or a `conftest.py` runs everything | Proved: the lockfile, `turbo.json` and the check's code change every hash; `pyproject.toml` runs the Python tasks and the browser tests; a `conftest.py` runs every pytest test (a module-level statement) |
| GitHub: the second push of a pull request that changes a document alone runs no tests, under 2 min; a push to `main` runs everything | 25 s; `main` runs `--fresh` |
| The proofs pass; the suites pass with the caches and without | Every check of the three pull requests green; `--fresh` proved in the Python proofs and by the push to `main` |
| The documents | `CLAUDE.md` (the commands table, the working rules), `plan/SESSIONS.md`, `plan/STATE.md`, D53 |

### Deviations and what was found

- **Decision 11**: `apps/web/.env.local` is an input of the browser task, hashed by turbo itself, not a stat.
  No code of ours reads the file; a root task's inputs may name an ignored file. More correct under the same
  rule; said to the owner in the close.
- **Turbo's root-task globs include ignored files**: `node_modules`, `.turbo`, `__pycache__`, `.next*`,
  `test-results`, `playwright-report` are excluded by name in `//#e2e`.
- **Testmon's "changed files"** are the test files whose tests are affected, not the files that changed; the
  runner says "test files affected". A comment changes nothing for testmon (syntax tree). Undoing a change is a
  change. Testmon keeps its data in WAL mode; bun's read-only open refuses it, so the runner opens it plainly.
- **Coverage on `sys.monitoring`** would make tracing free but breaks testmon's attribution (2 of 25 selected).
  Not used; measured.
- **The proofs' worktree** runs the worktree's Python on the repo's environment (`UV_NO_SYNC`, the worktree's
  `src` first on the path): `uv sync --offline` fails on GitHub, where setup-uv prunes the wheels.
- **The tracing cost** is about 18 % on a full run here (139 s against 118 s), not the 63 % first measured with
  other tools running at the same time.
- **The phase file's "what the check runs today"** said the check benefited from turbo for typecheck and lint;
  it did not: the check never called turbo. typecheck was 3 s here because tsc's own incremental file was warm.
