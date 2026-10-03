# The check, and what runs again

`bun check` is the one gate of this repo: a commit is pushed and a pull request merged only on its exit code. It runs
eight steps in a fixed order and stops at the first failure. Every step is one or more turbo tasks keyed on their inputs:
a task whose inputs have not changed since it was last green is skipped, and the summary says so. This document says
how the keying works, how the browser tests are split so that a change runs only the suites that can see it, and the
mistakes the split makes easy. Read it before you add a test, a folder of the web app or an input of a task. How it was
built, and the numbers before and after: `plan/phase-04b-test-caching.md`.

## The rule (D55)

The gate of a pull request is the fast check: typecheck, lint, the unit tests, the selected Python tests, and the
browser groups the change can reach. The whole browser suite is never a gate and never runs by itself:

- On GitHub the `check` workflow runs everything but the browser (`--skip=e2e`); the `e2e` workflow runs the browser
  suite when a person starts it (Actions, e2e, Run workflow), never on a push: the minutes cost money.
- On a developer's machine the whole suite runs only when the owner says, with nobody working. Never start it on
  your own; never start a second run because the first lost one test to a wait.
- A change that reaches every group (the shell, `components/ui`, the stores, the flow, the API, the generated types,
  the tools, the lockfile) is checked with `bun check --skip=e2e` and the groups most at risk run by hand
  (`bun run e2e:<group>`), named in the pull request with what was run and what was not.
- A browser test that fails under load and passes alone is a watch item in `plan/STATE.md`, not a wall in front of a
  merge: the retry keeps the run, the flaky list keeps the test in sight.

Why: on 2026-10-03 four full runs of 31 minutes each were lost to one load timeout apiece, a different test each time,
while the suite saturated the machine's twenty cores. A CI-scale job is not an inner loop.

## The steps

| Step | Task | Keyed on | Runs again when |
|---|---|---|---|
| typecheck (web, tools, e2e) | `typecheck` per package, `//#typecheck:tools` | the package's files; the tools' files | a file of that package changed |
| eslint (web), ruff and import-linter (api) | `lint`, `imports` | the package's files | the same |
| pytest (api) | `@rooftop/api#test` | the API's files, the weather fixtures of `e2e` | a Python file changed; inside the task pytest-testmon runs only the tests whose code changed, plus the sentinel `tests/engine/test_demo_numbers.py` |
| bun test (web, tools) | `@rooftop/web#test`, `//#test:tools` | the package's files | the same |
| Playwright | `//#e2e:<group>`, six tasks | the base and the group's own inputs (below) | something the group's suites can see changed |
| proofs of the caching | `//#proofs` | the check's code, `turbo.json`, the files the proofs change | the check itself changed |

Every task also keys on the lockfile, the toolchain (`ROOFTOP_TOOLCHAIN`, set by the check from the versions of Node, bun,
uv and Python), `turbo.json` and the check's own code (`tools/check.ts`, `tools/check/**`): a change to the check runs
everything once. The caches are `.turbo/` here and `.turbo/cache` on GitHub, never committed. On GitHub the browser step is
left out (`--skip=e2e`); a push to `main` runs `--fresh`.

## The browser tests in groups

The 1,700 browser tests are six turbo tasks, run one after the other by the check (six Playwright runs at once would
overload the machine), the test stack started once by the check when a group is going to run and stopped after. The
groups are data, `tools/check/e2e-groups.ts`; `turbo.json` and the root scripts `e2e:<group>` are held equal to it by
`tools/check/e2e-groups.test.ts`.

| Group | Suites, by file name in `e2e/tests` | Own inputs, beside the base |
|---|---|---|
| kit | `kit.e2e.ts`, `kit-*.e2e.ts` | `components/kit`, the baselines `kit*.png` |
| find | `find`, `outline`, `by-hand`, `obstacles` | `components/find`, `lib/map`, `lib/outline` |
| studio | `array-lens`, `build`, `history`, `lens-switches`, `manipulation`, `modules`, `roof-lens`, `selection`, `shade-map`, `shadow-outlines`, `shell-vitals`, `stage`, `strings-*`, `sun-*`, `time` | `components/studio`, `components/scene`, `lib/scene`, `lib/studio`, `lib/roof-card.ts`, `lib/scene-palette.ts`, and find's (Build and the Roof lens's Edit cross into Find) |
| performance | `performance*` | `components/performance`, `lib/performance`, and studio's and find's (a voltage is chosen in the Strings lens; a roof is built on the map) |
| handover | `handover*` | `components/handover`, `lib/handover` |
| shell | `api-client`, `fonts`, `routes`, `screens`, `shell`, `smoke`, `tokens` | every other group's, and every baseline but the kit's |

**The base**, an input of every group: `apps/web/app`, `components/shell`, `components/ui`, the files at the roots of
`components` and `lib` (named one by one, since turbo takes an exclusion out of every input of a task), `lib/api`,
`lib/stores`, `lib/flow`, `lib/format`, `public`, the web's configuration files, `packages/api-types`, the API's sources
and configuration, the helpers and fixtures of `e2e`, the tools that start the stack, the lockfile, `.nvmrc`.

**What a change runs** (proved by `tools/check/proofs/turbo.proof.ts`):

| Changed | Groups that run |
|---|---|
| `components/handover`, `lib/handover` | handover, shell |
| `components/performance`, `lib/performance` | performance, shell |
| `components/studio`, `components/scene`, `lib/scene`, `lib/studio` | studio, performance, shell |
| `components/find`, `lib/map`, `lib/outline` | find, studio, performance, shell |
| `components/kit` or a `kit*.png` baseline | kit |
| a suite of `e2e/tests` | its group alone |
| any other baseline | shell |
| the base: the shell, `components/ui`, the stores, the flow, the API client, the API, the generated types, the tools, the lockfile | every group |
| a document | nothing |

The shell group pictures every page (`screens.e2e.ts`) and runs whenever anything of the web changed: it is the floor
every web change pays. Measured on 2026-10-03, from the test times of a full run over 10 workers: kit about 2.5 minutes
alone, find 2, studio 12, performance 4, handover 1.5, shell 9.5; everything 31 minutes under the check's own load.

## Rules the split makes necessary

1. **A new suite is placed by its name.** `groupOf` refuses a file of `e2e/tests` that no group claims, and `bun test
   tools` fails until the suite is named in `tools/check/e2e-groups.ts`. Choose the group whose inputs the suite can see;
   a suite that opens two workspaces belongs to the one that sees the other's folders (performance sees the Studio's).
2. **A new folder of the web app is placed.** A file of `apps/web` that no group's inputs match fails the test "some
   group sees every file of the web app". A folder of one workspace goes to that group's own inputs; a folder every page
   uses goes to the base.
3. **Imports must not cross groups.** `tools/check/e2e-group-imports.test.ts` walks the value imports of each group's own
   folders up to the base and refuses a file reached outside the group's inputs. A part two workspaces share lives where
   every group sees it: `components/shell` for a component, `lib/flow` or `lib/stores` for logic of the document or the
   results. Never widen a group's inputs to let an import through.
4. **Baselines belong to the suite that takes them.** The kit's pictures (`kit*.png`) to kit, every other picture to
   shell. A suite other than `screens.e2e.ts` and `kit.e2e.ts` must not take pictures without the groups being changed.
5. **Before the check, run the group.** `bun tools/e2e-group.ts handover` (or `bun run e2e:handover`; any Playwright
   argument after it, as `--project=desktop` or `-g "a row pressed"`) runs one group against the test stack
   (`bun dev:bg --profile test`). The check then runs the same suites again under the load of everything else: a test
   that passes alone and fails there is load-sensitive. An expectation waits 15 s (`e2e/playwright.config.ts`), not
   Playwright's 5, for that reason; a step that takes longer by nature (a design run, the map, a scene) is given its own
   time (`RUN`, `A_MAP`, `A_SCENE`). A test that fails is run once more (`retries: 1`) and listed as **flaky** at the end
   of the run when it then passes: a flaky test is a fault to look at, not a run to discard; it goes into
   `plan/STATE.md`'s watch items with what it waited for.
6. **Never edit `apps/web` or `apps/api` while the check runs.** The test stack reloads them live and the browser tests
   would see the half-made change; while the proofs run (the last step), edit nothing, since they copy the working tree.
7. **A picture that must change is deleted first**, then written afresh (`--update-snapshots` leaves a picture whose
   difference is under the 50 pixels allowed). Renewing a baseline moves only its group's task.

## Reading the summary

```
  skipped  eslint (web)                            0.2 s  inputs unchanged, cached at 51f48e2 (turbo hash 0d7ca072)
  ok       pytest (api)                          179.1 s  ran 335 of 660 tests, the sentinel among them; 325 not run, unaffected
  partly   Playwright (phone, tablet, desktop)   612.3 s  ran handover, shell; 4 unchanged, cached at 7ac164d
```

`skipped`: every task of the step was in the cache. `partly`: some tasks ran, the rest were cached; for the browser step
the groups are named. `ok`: every task ran. The pytest line is testmon's account. `bun check --fresh` ignores and rebuilds
every cache; `--only=e2e` and `--skip=e2e` take steps by id.

## Known limits

- The web app's rewrite in front of the API (`next dev`) drops a request now and then with a bare "Internal Server Error"
  (socket hang up, ECONNRESET) while the API answered 200; seen on the report's pages. The stack's uvicorn keeps a
  connection alive 75 s now, and an export is asked once more by the client; a test that reads an answer waits for the good
  one. A production build and a proxy in front of it are untried (Phase 11).
- The shared state reaches into the workspaces' `lib` folders (`components/shell/stores.tsx` imports
  `lib/handover/downloads-store.ts`, `lib/scene/sun-day.ts`, `lib/studio/play.ts`; `lib/flow/design-flow.ts` imports
  `lib/performance/weather-source.ts`, `lib/studio/sun-time.ts`; `lib/stores/results-store.ts` imports
  `lib/scene/string-colours.ts`; `lib/stores/view-store.ts` imports `lib/scene/drag.ts`). The base is not walked, so a
  change to one of those files runs its folder's groups and shell, not the other workspaces' interaction suites. The fix is
  Phase 11's: the shared state's helpers moved beside the stores, or a rule-test that the base imports nothing of the
  groups' folders (`plan/phase-04b-test-caching.md`, the open item).
- The screens suite pictures every page in one file, so shell runs for every web change. Pictures of one workspace could
  move into its group's suite; then a Handover change would pay about 3 minutes of browser tests, not 11.
- A suite that changed runs whole: Playwright has no selection by test, as pytest has with testmon.
