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
| pytest (api) | `@rooftop/api#test` | the API's files, the weather fixtures of `e2e`, the library's catalog (`apps/web/public/equipment/catalog.json`: the pool of the inverter for the roof is held to it, D118), Home's view (`apps/web/lib/home/home-view.ts`: its demo figures are held to the engine's, D120) | a Python file changed; inside the task pytest-testmon runs only the tests whose code changed, plus the sentinel `tests/engine/test_demo_numbers.py` |
| bun test (web, tools) | `@rooftop/web#test`, `//#test:tools` | the package's files; for the tools' tests also `apps/web/**` and `e2e/**`, which the groups' tests read (session 18: a crossing import passed a pull request as cached and failed on `main`) | the same |
| Playwright | `//#e2e:<group>`, eight tasks | the base and the group's own inputs (below) | something the group's suites can see changed |
| proofs of the caching | `//#proofs` | the check's code, `turbo.json`, the files the proofs change | the check itself changed |

Every task also keys on the lockfile, the toolchain (`ROOFTOP_TOOLCHAIN`, set by the check from the versions of Node, bun,
uv and Python), `turbo.json` and the check's own code (`tools/check.ts`, `tools/check/**`): a change to the check runs
everything once. The caches are `.turbo/` here and `.turbo/cache` on GitHub, never committed. On GitHub the browser step is
left out (`--skip=e2e`); a push to `main` runs `--fresh`. There pytest runs whole and untraced (`ROOFTOP_CHECK_SELECT=0`),
in one process: the 730 tests take about eight minutes of a job allowed fifteen, and a job that hits its limit is cancelled
before the cache is saved, so that the next run starts cold again. pytest-xdist was tried (#68) and taken out (#70): the
runner's two cores are saturated by one process, two workers took the same eight minutes, and the test that times
`/layout` ("well under a second") failed beside a worker. Pinning numpy's BLAS threads to one (`OMP_NUM_THREADS`, `OPENBLAS_NUM_THREADS`,
`MKL_NUM_THREADS`) was tried in Phase 11 (#83) and taken out (decision 17 of the plan: what does not pay comes out): pytest took
473 s for 787 tests and 459 s for 783 with the pinning against 454 s for 745 without, the same 0.6 s a test. Drawing the demo's report pages once per pytest session was tried in the same pull request and taken out: the
whole suite took 180 s before and 179 s after here, since each file drew them once already and the design behind them is shared.

## The browser tests in groups

The 1,750 browser tests are eight turbo tasks, run one after the other by the check (eight Playwright runs at once would
overload the machine), the test stack started once by the check when a group is going to run and stopped after. The
groups are data, `tools/check/e2e-groups.ts`; `turbo.json` and the root scripts `e2e:<group>` are held equal to it by
`tools/check/e2e-groups.test.ts`. After a group's folders change, `bun tools/check/write-e2e-inputs.ts` writes the tasks'
inputs into `turbo.json` from the groups.

| Group | Suites, by file name in `e2e/tests` | Own inputs, beside the base |
|---|---|---|
| kit | `kit.e2e.ts`, `kit-*.e2e.ts` | `components/kit`, the pictures `kit*.png` |
| find | `find`, `find-screens`, `outline`, `by-hand`, `obstacles` | `components/find`, `lib/map`, `lib/outline`, the help's picture and clip runs `e2e/help-pictures` and `e2e/help-clips` (run by hand, never by the check), the pictures `find*.png` |
| studio | `array-lens`, `build`, `history`, `lens-switches`, `manipulation`, `modules`, `roof-lens`, `selection`, `shade-map`, `shadow-outlines`, `shell-vitals`, `stage`, `strings-*`, `studio-screens`, `sun-*`, `time` | `components/studio`, `components/scene`, `lib/scene`, `lib/studio`, find's folders (Build and the Roof lens's Edit cross into Find), the pictures `studio*.png` |
| performance | `performance*` (`performance-screens` among them) | `components/performance`, `lib/performance`, studio's and find's folders (a voltage is chosen in the Strings lens; a roof is built on the map), the pictures `performance*.png` |
| handover | `handover*` (`handover-screens` among them) | `components/handover`, `lib/handover`, the pictures `handover*.png` |
| home | `home*` (`home-screens` among them) | `components/home`, `lib/home`, find's folders ("Find my roof" leads to the map at the place), the pictures `home*.png` |
| present | `present*` (`present-screens` among them) | `components/present`, `lib/present`, the soak `e2e/soak` (run by hand, never by the check), studio's folders (Present reuses the Studio's stage), the pictures `present*.png` |
| shell | `api-client`, `device*`, `fonts`, `routes`, `screens`, `shell`, `smoke`, `tokens` | every other group's folders, and the pictures `shell*.png` |

A group's pictures are taken by its screens suite (`<group>-screens.e2e.ts`; the shell's by `screens.e2e.ts`, the kit's by
`kit.e2e.ts`) and belong to it by name: a group's folders are composed apart from its pictures, so that `find*.png` is find's
alone though the Studio, Performance, Home and Present see Find's folders. The kit's suites run on phone and desktop (the tablet
project ignores them, `e2e/playwright.config.ts`: the kit's components lay out as on desktop at 834 but for the sheet, which the
workspaces' tablet pictures show). Present's tests that run the tour forward frame by frame run on desktop alone (`present.e2e.ts`:
the tour's logic has no size); what opens Present, reads its words, leaves it and runs axe, and the pictures of Present, run on
desktop and tablet.

**The base**, an input of every group: `apps/web/app`, `components/shell`, `components/ui`, the files at the roots of
`components` and `lib` (named one by one, since turbo takes an exclusion out of every input of a task), `lib/api`,
`lib/stores`, `lib/flow` (with `lib/flow/deliverables`: the deliverables' names, file names, day and saved blob, which
the downloads store needs on every page), `lib/format`, `lib/places` (the search for a place and its provider: Find's,
Home's and Import a drawing's), `lib/geometry` (the engine's metres and the 3D palette: Find's, the Studio's, the stores'
and the device's thumbnails' alike), `lib/device` (the designs kept on the device: the shell saves and opens them on
every page), `lib/help` and `content` (the in-app help, D80: its registry and topics, opened from every workspace's headings), `lib/docs` (the docs' address and pages, D91: the help sheet, the project menu and Home link to them), `lib/brand` (the installed app's name, colours, mark and icons: the manifest and every page's head, #147), `lib/words` (the words of the work explained in a line, D96: the steps of the top bar and every workspace's titles), `lib/errors` (the words of every problem, V2 · 5, D101: the result chip, the steps' heads, the dialogs), `public`, the web's configuration files, `packages/api-types`, the API's sources and configuration, the
helpers and fixtures of `e2e`, the tools that start the stack, the lockfile, `.nvmrc`.

**What a change runs** (proved by `tools/check/proofs/turbo.proof.ts`):

| Changed | Groups that run |
|---|---|
| `components/handover`, `lib/handover` | handover, shell |
| `components/home`, `lib/home` | home, shell |
| `components/present`, `lib/present` | present, shell |
| `components/performance`, `lib/performance` | performance, shell |
| `components/studio`, `components/scene`, `lib/scene`, `lib/studio` | studio, performance, present, shell |
| `components/find`, `lib/map`, `lib/outline` | find, studio, performance, home, present, shell |
| `components/kit` | kit |
| a suite of `e2e/tests` | its group alone |
| a baseline, by the group its name begins with (`kit.png`, `find.png`, `handover.png`, `shell-*.png`) | its group alone (kit, find, handover, shell) |
| the base: the shell, `components/ui`, the stores, the flow, `lib/places`, `lib/geometry`, `lib/device`, the API client, the API, the generated types, the tools, the lockfile | every group |
| a document | nothing |

The shell group runs whenever anything of the web changed (its suites open every workspace): it is the floor every web
change pays, with the shell's own pictures alone (`shell*.png`: the project switcher, Saved on this device, Import a drawing)
since each workspace's pictures moved into its group (Phase 11, pull request 2). Measured on 2026-10-04 after that move, each
group run alone, one after another, on this machine (the owner's `bun dev` running beside): kit 1.7 minutes (on phone and
desktop), find 2.4, handover 5.0 (with its 17 pictures), home 3.7, present 4.6 (its frames on desktop alone; 10 before), performance
6.0, shell 6.7 (13 to 16 before), studio 18.5 (with its 24 pictures; 12 before, without them). Before the move, measured on 2026-10-03 from a full run over 10 workers:
kit about 2.5 minutes on three sizes, find 2, studio 12, performance 4, handover 1.5, shell 9.5; everything 31 minutes under the
check's own load; home about 5, present 10. A Handover change pays handover and shell now, about 12 minutes, where it paid 11 to 16
for the shell's pictures of everything; a Home change about 10.

## Rules the split makes necessary

1. **A new suite is placed by its name.** `groupOf` refuses a file of `e2e/tests` that no group claims, and `bun test
   tools` fails until the suite is named in `tools/check/e2e-groups.ts`. Choose the group whose inputs the suite can see;
   a suite that opens two workspaces belongs to the one that sees the other's folders (performance sees the Studio's, home
   sees Find's).
2. **A new folder of the web app is placed.** A file of `apps/web` that no group's inputs match fails the test "some
   group sees every file of the web app". A folder of one workspace goes to that group's own inputs; a folder every page
   uses goes to the base.
3. **Imports must not cross groups.** `tools/check/e2e-group-imports.test.ts` walks the value imports of each group's own
   folders up to the base and refuses a file reached outside the group's inputs. The base is walked too, and imports
   nothing of the groups' own folders, `app/**` (the pages are the workspaces' entry points and import their workspace's
   component) and the base's own `*.test.ts` files (run by bun, reached by no page) excepted. The reason: a change to a
   shared file must run the groups it reaches through the base, and the walk cannot see through the base otherwise, since
   it stops there. A part two workspaces share lives where every group sees it: `components/shell` for a component,
   `lib/flow` or `lib/stores` for logic of the document or the results, `lib/places` for the search, `lib/geometry` for
   the engine's metres. Never widen a group's inputs to let an import through.
4. **Baselines belong to the group whose name they begin with.** `kit*.png` to kit, `find*.png` to find, `studio*.png` to
   studio, and so on; `shell*.png` to shell. A picture is taken by its group's screens suite (`<group>-screens.e2e.ts`; the
   shell's by `screens.e2e.ts`, the kit's by `kit.e2e.ts`) and named for that group, so that a changed picture runs its group
   alone. `groupOfBaseline` refuses a picture no group's name begins, and `bun test tools` fails until it is named for its
   group. A suite other than a screens suite must not take pictures without the groups being changed.
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

- The web app's rewrite in front of the API dropped a request now and then with a bare "Internal Server Error" (socket hang up,
  ECONNRESET) while the API answered 200; mostly the report's pages, `/layout` too. Found and fixed in session 14 (2026-10-04,
  `feat/start`), two causes: Next's proxy (dev and production alike) frees the upstream socket of a streamed answer and then tears it
  down under the request that took it, so every answer of the API now closes its connection (`rooftop_api/connections.py`; nothing of
  the API's is ever pooled); and under a group's load the report's pages queued behind the drawing lock to 33 s at the median while the
  proxy gave up at 30 s, so the drawn pages are kept per project and day (`services/export.py`, `PAGES`) and the proxy waits 120 s
  (`next.config.ts`, `proxyTimeout`). The handover group: 204 s and 0 drops where it had been 325 s and 40. The phone's report tests
  can still need their retry on a cold API under the group's load (the first drawing of the pages behind the other exports' lock);
  they pass on it and are listed as flaky. `bun tools/proxy-drops.ts --after-design` is the probe that found the first cause.
- The test stack runs `next dev`, as before. Measured with the fixes (session 14): the handover group 227 s in dev mode and 204 s on the
  production build (`bun dev:bg --profile test --built`, a build of 9 s), 0 drops in both. The build was not adopted for the check: a
  built stack left running serves stale code after an edit, where `next dev` reloads it, and the gain is a tenth of a group's time.
- A suite that changed runs whole: Playwright has no selection by test, as pytest has with testmon.
