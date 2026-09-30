# Phase 4.5: plan

Written 2026-09-30 by session 8, before anything of the phase is built, as the work order asks
(`plan/resume/007-phase-4-5-test-caching.md`). Scope, what correct means and the acceptance:
`plan/phase-04b-test-caching.md`. This file says what was found and measured, how the caching is built, in
which order, what is decided unless the owner says otherwise, what the risks are, and what done means.

## What was found at the start of the session

- `main` is clean and matches `plan/STATE.md`: no branch, no open pull request, no stack running. `bun check` on
  `main` is green: 491 s in all (the table below).
- **The check does not use turbo today.** `tools/check.ts` runs `bun run typecheck` inside `apps/web` (that is
  `next typegen && tsc --noEmit`) and `bun run lint` there, never `turbo run`. The root scripts `bun typecheck`
  and `bun lint` do go through turbo, but the check never calls them. `.turbo/cache` holds entries of 29 Sep
  from those scripts; a dry run of turbo today shows every task as a miss. The phase file's "the check already
  benefits from turbo for typecheck and lint on a second run" was not so. typecheck takes 3 s here because
  tsc's own incremental file (`apps/web/tsconfig.tsbuildinfo`, ignored by git) is warm; 10.6 s on GitHub.
- `apps/api` is a turbo workspace already (`apps/api/package.json` has the scripts `lint`, `imports`, `test`
  that run ruff, import-linter and pytest); the check does not use them either.
- **turbo 2.11.5, what its hash holds** (from `--dry=json`): the package's files (tracked, and untracked but
  not ignored), the task's definition and the package's `package.json`, the hashes of the tasks named in
  `dependsOn`, the lockfile's external dependencies, `globalDependencies`, the values of the variables named in
  `env` and `globalEnv` (strict mode: nothing else of the environment), and the `engines.node` field of the
  root `package.json`, not the Node that actually runs. A task's `inputs` cannot reach outside its package:
  `../../apps/web/lib/api/**` added to e2e's typecheck added nothing (verified). A root task (`//#name`) takes
  inputs anywhere in the repo. `e2e/tests/api-client.e2e.ts` imports `apps/web/lib/api/*`, which turbo does
  not see from `e2e` today.
- **pytest-testmon 2.2.0** (December 2025; wants pytest below 10 and coverage below 8; coverage 7.16.2 would
  come with it; neither is in `uv.lock` today). How it selects: coverage is measured per test; a file's
  fingerprint for a test is the set of checksums of the code blocks the test executed, where a block is a
  function body or the module body. The module body's block spans the whole file, so any change at module
  level (an import, a constant, a signature, a decorator) re-runs every test that touched the file; a change
  inside one function re-runs the tests that executed it. Tests whose fingerprints all match are deselected;
  a file whose tests are all stable is not even collected. Tests that failed last time run again. Its own
  environment key holds the Python version (major.minor.micro) and the installed packages **without their
  patch versions**: a patch upgrade of a dependency does not invalidate its data. It does not track: data
  files read at run time, configuration outside Python (`pyproject.toml`'s pytest options), environment
  variables, files outside the project. Passing node ids or `-k` switches selection off; `--testmon-forceselect`
  is an intersection of selection and selectors, so there is no built-in way to always run one file.
- **What the Python tests read besides code:** `tests/fixtures/**` (5 equipment files, 4 weather recordings,
  two READMEs), the samples of `rooftop_core` (the PAN, the OND, `pune_weather.json`). No environment variable
  is read anywhere in `apps/api/src` or `apps/api/tests` (grep for `environ` and `getenv`: nothing).
- **The memo of the session and selection:** `KEPT` is shared for speed only. `test_kept.py` asserts identity;
  `test_memo.py` and `test_progress.py` make their own memo. No test expects a result kept by an earlier test
  (every use of `KEPT` read): a selection cannot break a test through the memo.
- **bun test:** at the root 765 tests in 54 files; in `apps/web` alone 707 in 50; `bun test tools` 58 in 4;
  `e2e` has none. A file named outside `*.test.ts` runs only when given as `./path`.
- Playwright's `--only-changed` follows the imports of the test files only: not used.
- Hashing inputs is cheap: the 139 files of `apps/api` in 25 ms, the 392 files the browser tests can see in
  40 ms (contents, through `git ls-files --cached --others --exclude-standard`).
- `uv sync --frozen --offline` in a fresh worktree of the repo takes 0.5 s (hard links from uv's cache): a
  worktree is a cheap place for the proofs.
- GitHub: `actions/cache` keys are immutable; `restore-keys` by prefix restores the most recent entry made on
  the branch or on `main`. The workflow needs no git history: every key here is a hash of contents, never a
  diff against a ref.

## What was measured

| What | Here | On GitHub (`ubuntu-latest`) |
|---|---|---|
| `bun check` on `main`, everything | 491 s | 297 to 304 s for the check step, plus 30 s of setup (four runs of today) |
| typecheck (web, tools, e2e) | 3.2 s (tsc warm); 4.5 s cold through turbo | 10.6 s |
| eslint (web) | 3.4 s | 11.0 s |
| ruff; import-linter | 0.1 s; 0.1 s | 0.1 s; 0.4 s |
| pytest, 550 tests | 121 s | 273 s |
| bun test, 765 tests | 0.4 s | 0.8 s |
| Playwright, 1,179 tests | 362 s | not run (D20) |
| **A second check on an unchanged tree today** | **491 s: nothing is skipped** | **297 s** |
| turbo, typecheck and lint of web, e2e, api-types, everything cached | 0.6 s | |
| `pytest --testmon`, first run, everything traced | 197 s (63 % over the plain run) | not measured; about 440 s by the same ratio |
| `pytest --testmon`, unchanged tree | 2.7 s, "no tests ran" | |
| `pytest --testmon` after one line added inside `geo.lonlat_to_local` | 25 tests in 25 s (roof-map API, roof import, the exports); the other 525 not collected | |
| The same with coverage on `sys.monitoring` (`COVERAGE_CORE=sysmon`) | the full run 124 s, but the selection wrong: 2 tests of the 25. Rejected | |
| The sentinel `test_demo_numbers.py` alone, 8 tests | 13 s; 21 s traced | |

## How the work goes

Three pull requests, split where nothing of the earlier depends on the later; each leaves the check green
and honest on its own.

1. `feat/check-on-turbo`: **the frame and the TypeScript side.** Every step of the check becomes a turbo task
   with its inputs declared, the toolchain in the hash, the summary that says what ran and what was skipped
   and why, `--fresh`, the proofs in a worktree for the TypeScript tasks. Steps 1 to 6.
2. `feat/pytest-selection`: **the Python side.** pytest-testmon inside the pytest task, the key of its data,
   the sentinel, the count of what was not run, the proofs for Python. Steps 7 to 11.
3. `feat/check-cache-ci`: **the browser step and GitHub.** The browser step keyed on everything it can see;
   the caches restored and saved on GitHub; `main` runs everything. Steps 12 to 15, and the close.

Every step is one commit; a draft pull request after the first step of each, merged after its last on a green
check. Test first, seen failing. `plan/STATE.md` is brought up to date on `main` after each merge.

## Steps

| # | Step | What is built | How it is tested |
|---|---|---|---|
| 1 | The toolchain in the hash | `tools/check/toolchain.ts`: one string of the versions of Node (the one `resolveNode` picks), bun, uv, Python (`apps/api/.python-version`) and the platform, exported as `ROOFTOP_TOOLCHAIN`; `turbo.json` names it in `globalEnv`, and `bunfig.toml`, `.nvmrc`, `tsconfig.json` in `globalDependencies` | `toolchain.test.ts`: the string holds each version; a dry run of turbo shows the variable among the configured ones |
| 2 | The TypeScript tasks | `typecheck` per package with `^typecheck`; `e2e` gets `@rooftop/web` as a workspace dependency (it imports its code) so its hash follows the web app's; root tasks `//#typecheck:tools`, `//#test:tools` with inputs `tools/**`, `tsconfig.json`, `package.json`; `@rooftop/web#test` is `bun test` in `apps/web`; `lint`, `imports` as they are. `bun test` at the root stays for a developer's hand | Dry runs: the inputs of each task are the files expected and no other; a change in `apps/web/lib/api` changes e2e's hash |
| 3 | The Python tasks, whole | `@rooftop/api#lint` (ruff), `#imports`, `#test` (pytest, whole) as turbo tasks on the package's files (src, tests, `pyproject.toml`, `uv.lock`, `.python-version`) and the toolchain | Dry runs as in 2 |
| 4 | The check on turbo | `tools/check.ts` keeps its steps and order and runs each through `turbo run <task> --filter=...` with `--output-logs=new-only --summarize`; reads the run summary turbo writes (`.turbo/runs/*.json`) for each task's hash and cache status; a hit is a step `skipped: inputs unchanged (turbo hash 1a2b3c4d)`, a miss `ran`; `--fresh` adds `--force`; `--only` and `--skip` as before; a skipped step never stops the check, a failure does | `check.test.ts` on the pure parts: the reading of a run summary, the wording of each outcome, the flags |
| 5 | The proofs, TypeScript | `tools/check/proofs/worktree.ts`: a worktree of `HEAD` in the scratchpad or `os.tmpdir()`, with the working tree's uncommitted changes applied and its untracked files copied, removed afterwards whatever happens. `tools/check/proofs/turbo.proof.ts`: in the worktree, dry runs of turbo before and after a change; a root task `//#proofs` runs them last with inputs the check's code, `turbo.json`, `package.json`, `bun.lock`, the workflow, and the files the proofs change | The proofs themselves: an unchanged tree gives the same hashes; a change to `apps/web/lib/outline/snap.ts` changes web's typecheck, lint and test and e2e's typecheck, not tools'; a change to `tools/lib/ports.ts` changes the root tasks only; a change to `packages/api-types/src/index.ts` changes web's and e2e's typecheck; `bun.lock` or `turbo.json` or `tools/check.ts` changes every hash; a change to `plan/README.md` changes none; a different `ROOFTOP_TOOLCHAIN` changes every hash |
| 6 | Close of pull request 1 | `CLAUDE.md` commands table, `plan/SESSIONS.md`, `plan/STATE.md` say how the cache works and how to bypass it | `bun check` green twice: the second run reports every step but the browser one as skipped |
| 7 | pytest-testmon pinned | `pytest-testmon==2.2.0` and `coverage==7.16.2` in the dev group, `uv.lock`; `.testmondata` ignored by git; D53 in `plan/README.md` | `uv run --locked pytest --testmon-noselect` runs the suite |
| 8 | The sentinel | `apps/api/tests/always_run.py`, a plugin loaded by `conftest.py`: when testmon selects, the tests of `tests/engine/test_demo_numbers.py` are collected and run whatever testmon decided, and the count of deselected tests is corrected by their number | A pytester test: a small project with testmon and the plugin; on the second run the sentinel runs and the others are deselected; the summary counts are right |
| 9 | The key of testmon's data | `tools/check/pytest-data-key.ts`: the hash of every non-Python file of `apps/api` (fixtures, samples, `pyproject.toml`, `uv.lock`, `.python-version`), the Python version, the versions of testmon and coverage from `uv.lock`, the platform; kept beside the data as `.testmondata.key`. When it differs, or `--fresh`, the data is deleted and pytest runs whole with `--testmon-noselect`; otherwise `--testmon` | `pytest-data-key.test.ts`: which files count and which do not; a changed fixture changes the key; a changed `.py` does not |
| 10 | The pytest task selects | `@rooftop/api#test` runs `bun ../../tools/check/pytest-selected.ts`: the key of step 9, then pytest; the check's summary reads pytest's last line and says `ran 25 of 550; 525 not run: unaffected by the change (pytest-testmon), 8 of them the sentinel that always runs` | `pytest-selected.test.ts` on the parsing of pytest's summary and the wording |
| 11 | The proofs, Python, and the close of pull request 2 | `tools/check/proofs/pytest.proof.ts` in the worktree: `uv sync --frozen --offline`, then testmon's data seeded with a subset of the suite (`tests/api/test_roof_map.py`, `tests/engine/test_roof_import_bytes.py`, `tests/engine/test_export_bytes.py`, the sentinel), then one change at a time | The proofs: unchanged, nothing but the sentinel runs; a line inside `geo.lonlat_to_local` runs the roof-map and import tests and the sentinel and not the memo tests; a changed fixture under `tests/fixtures` runs everything; a changed `pyproject.toml`, `uv.lock` or `conftest.py` runs everything; a test that failed runs again although nothing changed |
| 12 | The browser step's key | A root task `//#e2e` whose inputs are everything the browser tests can see: `apps/web/**` (less its ignored directories), `packages/api-types/**`, `apps/api/src/**`, `apps/api/pyproject.toml`, `apps/api/uv.lock`, `apps/api/.python-version`, `e2e/**`, `tools/dev.ts`, `tools/lib/**`, `bun.lock`, `.nvmrc`; in `env` the toolchain, `ROOFTOP_ENV_LOCAL` (the size and modification time of `apps/web/.env.local`, never its content) and the platform. If turbo's root inputs cannot express this (ignored files, or the globs), the check keys this one step itself with the same rule (contents through `git ls-files`, the toolchain, the stat), kept in `.turbo/check/e2e.json` | Dry runs and proofs as in 5: a change under `apps/web/components/find` or `e2e/fixtures` or `apps/api/src/rooftop_api/routers` changes the hash; `plan/**` does not; the stat of `.env.local` counts |
| 13 | GitHub, the caches | `check.yml`: `actions/cache/restore` of `.turbo/cache` before the check, keyed `check-${{ runner.os }}-${{ hashFiles('bun.lock', 'apps/api/uv.lock') }}-${{ github.run_id }}` with the prefix as `restore-keys`; `actions/cache/save` after it, on success or failure, never on cancel. On `pull_request`: `bun check --skip=e2e`. On `push` to `main`: `bun check --skip=e2e --fresh`. No `fetch-depth`: nothing diffs | The first push of a pull request restores from `main` and saves; the workflow's log shows the hits |
| 14 | GitHub, measured | The pull request of this step pushed twice: once with code, once with a document alone | The second run: every step a hit, under 2 min; the push to `main` after the merge runs everything |
| 15 | Close | "As built" in `plan/phase-04b-test-caching.md` with the numbers before and after; status in `plan/README.md`; `plan/STATE.md`; `plan/sessions/008`; resume 007 set to used | |

## Decisions I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | **turbo is the one cache of the check, for every step**: typecheck, lint and unit tests per package, ruff, import-linter and pytest as tasks of `apps/api`, the browser step as a root task (or, failing that, one key of the same shape kept by the check). No second cache of the check's own for what turbo can key | It is in the repo (D2, pinned 2.11.5), it is the standard for this, its hash holds the files and the lockfile by itself, and one mechanism is one thing to prove and one thing to cache on GitHub |
| 2 | **The toolchain is in every hash** as one variable, `ROOFTOP_TOOLCHAIN` (Node, bun, uv, Python, platform), computed by the check and declared in `globalEnv`; `bunfig.toml`, `.nvmrc` and the root `tsconfig.json` in `globalDependencies` | turbo hashes `engines.node` of `package.json`, not the Node that runs; the rule is "the versions of the tools and runtimes" |
| 3 | **`e2e` depends on `@rooftop/web` in its `package.json`** and its typecheck task on `^typecheck` | Its tests import the web app's client; turbo cannot take inputs from another package, and a dependency is the true statement |
| 4 | **pytest-testmon 2.2.0 and coverage 7.16.2 join the pinned set** (D4, as D53). **Selection runs here, not on GitHub.** On GitHub the pytest task is whole, cached by turbo: a push that leaves `apps/api` untouched runs no Python test; a push that touches it runs them all, untraced, as today | Tracing costs 63 % on a full run (197 s against 121 s here). On GitHub that is about 440 s, and the runners vary two-fold: a push to `main`, which must run everything, would stand near the 10-minute limit. Here a developer edits one module and runs the check many times: a leaf module runs in 25 s instead of 121 s. Testmon on GitHub is one flag away and is the owner's call (below) |
| 5 | **Testmon's data has a key of its own** beside it: every non-Python file of `apps/api`, the Python version, the versions of testmon and coverage, the platform. A different key deletes the data and runs the suite whole | Testmon tracks Python code and the package list without patch versions; the data files, the pytest options in `pyproject.toml`, `uv.lock` and the runtime are what it misses. Deleting is the miss that "runs the whole step" |
| 6 | **The sentinel runs by a hook of ours** (`tests/always_run.py`), not by a second pytest session: the sentinel's file is collected whatever testmon says, its tests are put back after testmon's deselection, and the deselected count is corrected by their number | One session shares the memo `KEPT`: a selected test that runs the demo and the sentinel work the shading out once (13 s alone). Two sessions would cost the demo twice and two starts. Testmon has no option for it: node ids and `-k` switch selection off |
| 7 | **`bun check --fresh`** ignores every cache and rebuilds them: `--force` for turbo, the testmon data deleted. **A push to `main` runs `--fresh`** | The acceptance names the flag; `main` is never judged by a cache |
| 8 | **A cached task prints no old log** (`--output-logs=new-only`); the check's summary says `skipped: inputs unchanged (turbo hash ...)`. For pytest the summary says how many ran, how many were not run and why, and that the sentinel ran | A replayed "550 passed" from an earlier run would be a pass that did not happen. A skipped test is reported as not run, never as passed |
| 9 | **The proofs run in a worktree of `HEAD` with the working tree's changes applied**, made under the scratchpad or the system's temporary directory, removed afterwards, `uv sync --frozen --offline` inside (0.5 s). They are a root task `//#proofs`, last, keyed on the check's code, `turbo.json`, `package.json`, `bun.lock`, the workflow, the pytest configuration and the files the proofs change | The rule: the tests of the caching change files, never in the working tree; the acceptance says they run last and are part of the check. Keyed, so that an unchanged tree skips them too; keyed on the files they change, so that a change to a subject re-runs them |
| 10 | **The Python proofs seed testmon's data with a subset** of the suite (the roof-map, roof import and export tests, the sentinel), not the whole | A whole traced run is 197 s; the mechanism is the same on three files, and the proofs are about the mechanism |
| 11 | **`apps/web/.env.local` counts by its size and modification time**, never by its content | The file is never read (the rule). The key it holds is baked into the page, and the browser tests answer every request to Esri from a fixture, so the value cannot change an outcome; the stat is there so that a changed file is never a hit by accident |
| 12 | **On GitHub, `actions/cache` keeps `.turbo/cache` alone**, keyed on the lockfiles and the run, restored by prefix from the branch or `main`, saved on success and on failure, not on cancel. No `fetch-depth` | Turbo's entries are the whole cache once every step is a task; the lockfiles in the key start a fresh store when dependencies change, so the store does not grow without end (GitHub evicts at 10 GB); a cancelled run has nothing to save |
| 13 | **pytest-xdist stays out of this phase** | The open item says: after the owner's yes, as a pull request of its own. Measured in session 7 at 66 s for four workers; traced it would be about 105 s |
| 14 | **The steps and their order stay** (typecheck, eslint, ruff, imports, pytest, unit, e2e, then the proofs); a skipped step never stops the check, a failed one does, and the steps after it are "not run" | The check's shape is known to every session; the acceptance asks that a skipped step never hides one that would have failed after it |
| 15 | **The record of the caches lives in `.turbo/`** (turbo's own `cache/` and `runs/`, and `check/` for what the check keeps itself, if anything); testmon's data in `apps/api/.testmondata` with its key beside it. All ignored by git | Nothing of the caches is committed; nothing new to ignore but two files |

## Risks

| Risk | What is done about it |
|---|---|
| Tracing makes a full local pytest run 197 s instead of 121 s: the first run after this phase, every change to `pyproject.toml`, `uv.lock`, a `conftest.py` or a fixture, and a change to a module nearly every test touches (`project.py`, `shading.py`) | Said in the documents with the numbers. The turbo hit is the common case (nothing of `apps/api` changed: 0 s); a leaf module is the next most common (25 s). If the owner finds the trade poor, `--no-select` for the pytest task is a flag |
| turbo's root-task inputs may not express the browser step (ignored files under `apps/web`, the globs) | Verified by a dry run in step 12 before anything else of the step; the fallback is decided (decision 1) |
| turbo does not hash the Node version | Decision 2. A run of `bun typecheck` by hand, without the variable, hashes differently from the check's run: two entries, both correct |
| testmon and the threads of the API's test client | Verified today: the change in `geo.py` selected the API's roof-map tests, which run through `TestClient` |
| The proofs cost 60 to 120 s when they run | They run only when the check's code, its configuration or their subjects change; keyed like every other step |
| A push to `main` cancelled by the next push saves no cache | The next pull request restores the last saved entry; correctness does not depend on the cache |
| The proofs' worktree left behind after a crash | Made under a directory of their own with a name of this repo; removed in a `finally`; at the start the proofs remove any worktree of theirs that is still registered |
| Testmon's data written by an interrupted run | Fingerprints are compared by content, not by time: a test not recorded is new and runs; a test recorded with a stale fingerprint runs. Nothing is trusted that was not measured |
| `bun test` in `apps/web` alone behaves differently from the root | Verified: 707 there and 58 in `tools` make the root's 765 |

## What done means

Against the acceptance of `plan/phase-04b-test-caching.md`:

| Acceptance | Done when |
|---|---|
| A second `bun check` on an unchanged tree finishes in under 45 s and reports every step as skipped with its reason | Measured and written in "As built": eight steps, all `skipped: inputs unchanged (turbo hash ...)`, the check's own time |
| One module of `rooftop_core` runs the pytest tests that use it and the sentinel, and no other | The Python proof of step 11 (a line inside `geo.lonlat_to_local`) passes in `bun check` |
| A TypeScript module of `apps/web/lib` runs the unit tests that import it | With turbo the unit tests of `apps/web` run as one task: a change in `apps/web/lib` runs the 707 tests of the web app (0.3 s) and not the 58 of `tools`. Said as a deviation: bun test has no selection and a finer key would cost more than the 0.3 s it saves |
| A change to `apps/web/components/find` runs the browser tests | The proof of step 12 |
| A lockfile, `pyproject.toml`, `turbo.json`, `tools/check.ts` or a `conftest.py` runs everything | The proofs of steps 5 and 11 |
| On GitHub, the second push of a pull request that changes a document alone runs no tests, under 2 min; a push to `main` runs everything | Step 14, with the run's numbers in "As built" |
| The proofs pass; the pytest, unit and browser tests pass with the caches and without (`--fresh`) | `bun check --fresh` green, then `bun check` green, on `main` after the third merge |
| The documents are brought up to date | `CLAUDE.md`, `plan/SESSIONS.md`, `plan/STATE.md`, the phase file's "As built", D53 in `plan/README.md` |

## What needs the owner

| What | When | Default |
|---|---|---|
| A yes or an overruling to each decision above, one at a time | Before step 1 | |
| Testmon on GitHub too (selection traced on pull requests, `main` whole and untraced), against decision 4 | Any time; one flag in the workflow | No |
| pytest-xdist as a pull request of its own after this phase (decision 13) | After the phase | Not now |
