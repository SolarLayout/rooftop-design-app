# Session 8: record

2026-09-30. One session, started with the resume prompt `plan/resume/007-phase-4-5-test-caching.md`: Phase 4.5,
the caching of the checks. The plan was written first (`plan/phase-04b-plan.md`), then three pull requests. What
is built is in `plan/phase-04b-test-caching.md`, "As built"; the state is in `plan/STATE.md`. Neither is repeated
here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: git, pull requests, stacks; `bun check` on `main` green, timed (491 s) | |
| 2 | Measured: each step here and on GitHub; turbo's view of the tasks (`--dry=json`); pytest-testmon on a worktree (full run traced, unchanged, one function changed, `sys.monitoring`, the sentinel alone); the cost of hashing | scratchpad |
| 3 | The plan: what was found, the numbers, three pull requests, fifteen decisions, the risks, done | `plan/phase-04b-plan.md`, `956b01f` |
| 4 | The owner's decisions: 1, 4 and 11 asked one at a time; the Python question answered honestly | |
| 5 | Pull request 1: every step of the check a turbo task, the toolchain in the hash, the summary, `--fresh`, the proofs in a worktree | #39 |
| 6 | Pull request 2: pytest-testmon pinned (D53), the key of its data, the sentinel plugin, the runner, the Python proofs | #40 |
| 7 | Pull request 3: the browser step as a root task on all it can see; the cache restored and saved on GitHub; pytest whole and untraced there | #41 |
| 8 | The close: "As built" with the numbers, the status, the state, this record; resume 007 used | `main` |

## How the owner steered the session

| He was asked | He said | What was done |
|---|---|---|
| Decision 1: turbo as the one cache of the check | "what's your reco and why?", then "agreed. will go with your reco" | Built so |
| (his own question) whether turbo for a Python task is "the blessed or most adopted standard way" | Told no: testmon is the standard inside pytest; a whole-task cache for Python has no standard tool below Bazel or Pants; path filters are the CI convention. "will go with your reco" | turbo for the Python tasks, testmon inside pytest |
| Decision 4: testmon here, not on GitHub | "yes" | `ROOFTOP_CHECK_SELECT=0` in the workflow |
| Decision 11: `.env.local` by size and modification time | "you suggest best. will go with your reco" | Built differently, and said so: turbo hashes the file itself as an input of the browser task; no code of ours reads it. More correct than a stat, under the same rule |

## Why things are the way they are

- **One cache, turbo's**, for every step including ruff, import-linter, pytest and the browser tests: one hash
  to prove, one thing to keep on GitHub. The check reads what turbo did from the run summary it writes
  (`--summarize`), so the reason of a skip is turbo's own hash and the commit the entry was made at.
- **The toolchain is one variable in every hash** (`ROOFTOP_TOOLCHAIN`), because turbo hashes `engines.node`
  of `package.json` and not the Node that runs. `tools/check.ts` and `tools/check/**` are global dependencies:
  while the check's own code changes, nothing is trusted.
- **A cached task prints no old log** (`--output-logs=new-only`): a "550 passed" of an earlier run would be a
  pass that did not happen.
- **The browser step is a root task**, because a package's inputs cannot reach outside the package and the
  browser tests see the web app, the API, the types, the fixtures and the tools that start the stack. A root
  task's globs include ignored files, so `node_modules`, `.turbo`, `__pycache__`, `.next*`, `test-results` are
  excluded by name, and `apps/web/.env.local` is included on purpose.
- **Testmon here, not on GitHub**: tracing costs about 18 % here (139 s against 118 s) and more on the slow
  runners of GitHub (327 s in one run), where the data would never be kept anyway. On GitHub turbo caches the
  pytest task whole, which is what a push that leaves `apps/api` alone needs.
- **The sentinel is a hook of ours** (`tests/always_run.py`): testmon has no option for "always run this", and a
  second pytest session would compute the demo's shading twice. The file is collected whatever testmon says,
  its tests are put back after the deselection, and the count of deselected tests is corrected.
- **Testmon's data has a key beside it** over what testmon does not track: every non-Python file of `apps/api`,
  the Python version, the versions of testmon and coverage, the platform. Testmon drops the patch versions of
  packages; `uv.lock` in the key catches those.
- **The proofs run in a worktree** of `HEAD` with the working tree's changes applied, under the real path of the
  temporary directory (git reports real paths; on macOS the temporary directory is a symbolic link). The Python
  proofs run the worktree's sources on the repo's environment with `UV_NO_SYNC` and the worktree's `src` first
  on the path: nothing is installed, nothing is fetched. On GitHub a `uv sync --offline` in the worktree had
  failed, because setup-uv prunes pre-built wheels from its cache.
- **Coverage on `sys.monitoring` was rejected**: it made the full traced run as cheap as an untraced one, but
  testmon attributes lines by coverage's dynamic contexts, which that core does not support: it selected 2 of
  the 25 tests the default tracer selected. Measured, not guessed.
- **A comment changes nothing for testmon**: it fingerprints the syntax tree. The proofs change statements.
- **Undoing a change is a change**: the tests run once more after a revert, then settle.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| `--testmon-forceselect` for the sentinel | It is an intersection of selection and selectors; node ids and `-k` switch selection off |
| `COVERAGE_CORE=sysmon` | Wrong selection (2 of 25) |
| `uv sync --frozen --offline` in the proofs' worktree | Works here (0.5 s), fails on GitHub: setup-uv prunes the wheels |
| bun's `readonly` open of testmon's sqlite file | Refused: the file is in WAL mode. Opened plainly, only read |
| Inputs with `../` in a package's turbo task | Turbo adds nothing from outside the package (verified by a dry run) |
| A stat of `.env.local` in the browser key (decision 11) | Turbo hashes the file itself as an input; no code of ours reads it |
| A first measurement of the traced run at 197 s (+63 %) | Disturbed by tsc and eslint measured at the same time; the clean figure is 139 s (+18 %) |

## What the owner should look at

1. **`bun check` twice**: the second run says every step `skipped: inputs unchanged, cached at <commit>` in
   under 2 s. Then change one line inside a function of `apps/api/src/rooftop_core/geo.py` and run it again:
   pytest runs the tests through it and the sentinel; the summary says how many were not run.
2. **The proofs**: `bun check --only=proofs` (about 45 s): the turbo proofs and the Python proofs, in a worktree
   that goes away.
3. **On GitHub**: the runs of #41 (the second, a document alone, 25 s in all) and the run on `main` after the
   merge (`--fresh`, everything).
4. **D53** in `plan/README.md`; the deviation on decision 11 above.

## Agents used

None. Every part was built and checked by the session itself.

## What was left on the owner's machine

- No stack running (`bun status`). No worktree beside the repo (`git worktree list`).
- Testmon's data `apps/api/.testmondata` and its key, ignored by git; turbo's cache in `.turbo/`.
- The scratchpad of the session holds the logs of every check, the measuring scripts and the drafts. Outside the
  repo.

## Where the rest of session 8 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/008/owner-messages.md` | One page |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/7faf2734-efdd-443d-aee6-4cc9962245f7.jsonl` | Never read it whole. Search it as `plan/sessions/001/record.md` shows |

The log is on the owner's machine only.
