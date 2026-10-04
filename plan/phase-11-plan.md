# Phase 11: plan

Written 2026-10-04 by session 14, before anything of the phase is built, as the work order asks
(`plan/resume/014-phase-11-hardening.md`). Scope and acceptance: `plan/phase-11-hardening.md`. This file says how the phase is
built, in which order, what is decided, what was found in the code, the API and the checks, and what done means. Scoped with the
owner on 2026-10-04, item by item (`plan/sessions/014/owner-messages.md`): the section "Scoped with the owner" says what stands and what
went to an issue; the steps and decisions below are the plan as written and are read through that section.

## What was found at the start

- `main` is green at the close of Phase 10 (`1313347`); no pull request is open; no stack was running. Five merged local branches of
  Phase 9 and of the groups' split lingered and are deleted.
- **The offline demo is nearly there, and unproved.** The demo and its weather are bundled in the engine already
  (`rooftop_core/samples/pune_weather.json`, 529 KB; `demo_project()` reads it; `GET /demo` answers it). Present asks nothing of the
  API (`lib/present/offline.test.ts`). The web app's only requests that leave the machine are Esri's imagery tiles and geocoder
  (`lib/map/esri.ts`, `components/scene/Ground.tsx`); when a tile does not come the scene keeps the plain ground with its grid, and the
  map at `/find` has its states without a map. The fonts and MapLibre's worker are the app's. What is missing is the proof: nobody has
  run the stand's journey (Home, the demo, the Studio, Performance, Handover's downloads, Present's loop) with every outward request
  refused, on the three sizes.
- **No production build exists anywhere.** Both stacks run `next dev` and uvicorn with `--reload`
  (`tools/dev.ts`, `launch`). `apps/web` has `build` and `start` scripts that nothing calls. The rewrite `/api/*` is Next's own; the
  drops of the report's pages (47 of 48 drops, 940 KB each; 5 to 10 of 380 shell tests lost to the wait under the group's own load) have
  been seen in `next dev` alone, because nothing else has been run. The API logs no timings: `main.py` has no middleware, uvicorn's
  access log alone.
- **Nothing limits a roof.** `/layout` and `/design` take an outline of any size (2 km by 1 km took 29 s); `/project/open` stops at
  10 MB and an equipment file at 2 MB.
- **Resilience that exists**: WebGL absent or the context lost falls to the plan with the board's words (`Stage.tsx`, `SceneCanvas.tsx`,
  `PlanFallback.tsx`); every file that is read (PAN, OND, KMZ, KML, DXF, CSV, `.rtd`) is refused in words; a save that fails says
  "Not saved" with the device's words; a weather that fails says so in Performance (`performance-weather-failed`); the board "Shell
  states" has "The server cannot be reached. Check the connection and try again." PVGIS is asked with a timeout of 60 s and NASA POWER
  of 120 s (`weather.py`). **Not there**: the strings in the plan without WebGL (the Strings lens there has its inspector alone); a
  storage that is full is the same "Not saved" as any failure, untested; a test of the API stopped while the app is open.
- **The browser tests**: 1,750 in eight groups, every one in software WebGL at the device's scale (3 on phone, 2 on tablet). The shell
  group pictures 70 screens on three sizes in one suite (`screens.e2e.ts`) and runs for every web change: 13 to 16 minutes. The kit is
  pictured on three sizes (2.5 minutes). Present's suite renders the tour frame by frame on two sizes (10 minutes); the Studio's is 12.
- **The base reaches into the groups' folders in eleven places**, which the import walk does not refuse because it never walks the
  base: `components/shell/Studio.tsx` (the frame) imports the five inspectors, the Stage and two hooks of `components/studio`;
  `Shell.tsx` imports `components/home/OpenProject`; `ImportDrawing.tsx` imports `components/find/Search`, `lib/map/esri` and
  `lib/studio/import-drawing`; `stores.tsx` imports `lib/handover/downloads-store`, `lib/scene/sun-day` and `lib/studio/play`;
  `lib/flow/design-flow.ts` imports `lib/performance/weather-source` and `lib/studio/sun-time`; `lib/stores/results-store.ts` imports
  `lib/scene/string-colours`; `lib/stores/view-store.ts` imports `lib/scene/drag`. Two more are types alone (`NoOptionsCard`,
  `UnderTheTitle` from `lib/performance/page-view`), which the walk rightly ignores.
- **The `e2e` workflow has never run**; the baselines are `darwin`'s only, so its first run would write its own pictures and fail.
- **Present's first scene** draws the roof as a slab on the ground at share 0 (`Building` is scaled from the ground up, `liftOf`,
  `risenScaleOf`; the roof plane is part of it); the board's first frame is the satellite with the accent outline alone. The board's
  ground is an illustration "standing in for live imagery": the imagery under Present is right.
- **The card's thumbnail** draws the keep-out areas as accent dashes (`thumbnail.ts`, `data-part="keepout"`); the board's small plan
  has none.
- **The desktop app** is at `../rooftop-design` with its own `.venv`: its engine can be run from there for the numbers audit without
  writing a byte into it. `plan/reference/demo-numbers.md` holds the desktop's numbers for the demo in full and for the east-west and
  sloped flush roofs in four figures (positions, energy, kWh/kWp, PR).
- **The Layers button** of the rail, an open item since Phase 5, is in the information architecture: it switches the ground between the
  imagery and the plain grid. It is a product question for the owner (below), not a bug.
- **The check on `main` at the start of this session** found the browser step uncached and ran it whole; the shell group failed. The
  test stack's logs of that one run hold 35 drops of the rewrite ("Failed to proxy … socket hang up", ECONNRESET): 32 of the report's
  pages and 3 of `/layout`, while the API answered every one with 200. Two tests failed on both tries under the load (the handover
  pictures on tablet and phone waiting 90 s for the pages; the device test "two designs" on tablet and phone, whose demo run had not
  landed its facts in 15 s), three passed on their retry. Run alone on tablet and phone afterwards, the handover pictures passed and the device test failed again
  on phone and needed its retry on tablet: the saving store writes a landed run's facts 600 ms after it lands (`SAVE_DEBOUNCE`) and
  nothing flushes a pending write when the page is left (`saving.ts`; `Shell.tsx` only asks before leaving while a download is on its
  way), so a reload inside that window loses the facts of the run, and the test's hard navigation to `/find` is such a reload under
  load. A tiny window in the app and a race in the test; both are steps 23 and 24. The drops are not the report's alone: a layout dropped at a stand that runs
  `next dev` shows the chip of a failed layout to the audience. The production build goes first.
- **The acceptance of the phase file** says "`bun check` green including the full e2e suite"; it was written before D55. The full suite
  runs once, at the close of the phase, when the owner says (decision 18).

## Scoped with the owner, 2026-10-04

Two facts came out of the walk-through and reshape the phase. **The stand demos from live production**, `rooftop.solarlayout.app`
(staging `rooftop.staging.solarlayout.app`; the two share nothing): the UI on Vercel, the API most probably on AWS Lambda, in a dedicated
piece of work after this phase, planned when we get there (its known constraints are in issue #76). So the offline demo is moot, the
operator's guide is written once production exists, and the dry run is on production. **The owner tests the app end to end by hand
first** and decides the fate of the audits and the browser journeys on what he finds.

What stands, in order:

| # | Pull request | Steps | In one line |
|---|---|---|---|
| 1 | `feat/start` | 1, 2, 4, 5 | `bun start`: the web app built once and served as production does, the API without reload, on the dev ports; the test stack measured on the same build (drops, time) and switched if it pays; one log line per request with its time; a fresh clone tried. No relay of our own (step 3 dropped: on Vercel the forwarding is Vercel's) |
| 2 | `check/pictures-by-group` | 6 to 9 | The browser tests cheaper: each workspace's pictures in its group, the kit on two sizes, Present's frames on desktop alone |
| 3 | the board, then `feat/layers` | 35 | The Layers button of the rail: a board drawn right after pull request 1 and shown to the owner; built once approved (decision 22 overruled by the owner: "Build it") |
| 4 | `check/base-imports-nothing` | 10 to 12 | The base imports nothing of the groups' folders, held by a test; the fourteen moves |
| 5 | `feat/resilience` | 20, 21, 23 (the flush alone), 24 | A roof over 30,000 m² refused in words that say what to do (decision 11 amended); a roof at the limit measured; a pending save written before the page is left; the API stopped and started again |
| 6 | `check/pytest-on-two-cores` | 28, 29, 36 | The BLAS threads pinned and the pages drawn once, measured; the engine's profile for issue #76 |
| 7 | `feat/polish` | 33 | The seven small items |
| 8 | the close | 34 | "As built", the state, the record; the full browser suite once here when the owner says |

What went to an issue, with the owner's reason:

| Steps | What | Issue | Reason |
|---|---|---|---|
| 13 to 15 | The parity audit, the numbers audit, the operator's guide | #73 | The owner tests end to end by hand first; the guide once production exists |
| 16 to 19 | The two journeys, the `e2e` workflow on Linux | #74 | Low value at this point; the fate of the browser tests decided on value against cost after his testing |
| 25 to 27 | Present's first frame, the thumbnail's dashes, the soak's memory question | #75 | A recorded video of Present serves the stand for now |
| (new) | The API lean in time and memory for Lambda | #76 | A dedicated piece of work, from the profile of step 36 |
| 30 to 32 | The keyboard path, reduced motion, WebKit and Firefox | #77 | Not needed at the moment |
| 22, 23 in part | The strings in the plan without WebGL; the words for a storage that is full | none | Decided by the session on value against probability: a stand machine has WebGL and will not fill 700 KB designs |

Two steps are added: **35, the Layers button** (the board: a toggle in the rail of the stage between the imagery and the plain grid, in
every lens, as the information architecture says; the state kept in the view store; a test of the toggle and a picture of each ground),
and **36, the engine's profile** (the demo and a roof at the 30,000 m² limit: time by step of a design run, peak memory by endpoint, the
hot spots and the gain each would give, as a table in `plan/reference/api-profile.md`, for issue #76).

## How the work goes

**From 2026-10-04 (D56) the gate is the fast lane alone**: `bun check --skip=e2e`; no browser group runs on this machine until the phase is
done, not even by hand; a suite or a picture a pull request changes is reviewed by reading, and the pull request says the groups were not run.
The owner's words: "due to the extremely slow progress - primarily due to e2e tests - we will not run any e2e tests locally for now. only fast
lane would be run. this is in effect till the whole of Phase 11 is done". Decision 18 (the whole suite once at the close) stands.


Each step one commit; a document change a commit of its own, never mixed with code (D26); a draft pull request after the first step,
merged on the fast check and the groups the change reaches (D55), every changed picture looked at beside its board before the pull
request opens. Agents build in worktrees from written briefs; the session runs the browser and makes the baselines. `plan/STATE.md`
after each pull request. The original order and the eleven pull requests of the first draft are kept in git (`0d6d740`).

## Step 0: the boards

None is drawn. Every state the phase touches is on an approved board already, or is no screen:

| State | Board |
|---|---|
| The server cannot be reached | "Shell states" (`shell-states.png`): the words and the Try again |
| Without WebGL, the context lost | "Studio, Array lens, states" (`studio-array-lens-states.png`): the plan with the note |
| Not saved on this device | "Home, designs on this device" (`home-designs.png`): the note in the top bar and the switcher |
| The weather failed, the run failed | "Performance, states" (`performance-states.png`) |
| A file refused | "Open a project" (`open-project.png`), "Import with missing heights", Handover's and Performance's states |
| Present's first frame | "Present" (`present.png`): the satellite with the outline alone |
| The card's thumbnail | "Home, designs on this device": the small plan without the keep-out |
| A roof too large | The API's refusal in words, shown where every refusal of the API is shown (the notes, the chip of a failed layout: "Studio, Array lens, states") |
| The strings in the plan without WebGL | The plan of "Studio, Array lens, states" with the modules in the colours of "Strings on the roof"; no new element |
| The operator's guide, the audits, the journeys | Documents and tests; no screen |

The one screen without a board that the phase could touch is the Layers button of the rail (the owner's question below). If he wants
it, it is drawn and approved first, as a pull request of its own after the phase.

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 1 | The stand's profile | `tools/dev.ts` gains the profile `stand` (`bun stand`, `bun stop --profile stand`): the web app built once (`next build`, `ROOFTOP_DIST_DIR=.next-stand`) and served by `next start`; the API by uvicorn without `--reload`; ports 4700 and 4701 as the dev profile's (the two never run together: `bun stand` refuses while `bun dev` runs, and says so); the mode in `pids.json`; a build that fails stops with the build's words; the weather downloads on | `dev.test.ts` (the profiles, the refusal, the mode); the pid file's shape | `bun stand` on this machine: Home in under a second, the demo's run as before |
| 2 | The test stack measured on the build | The same build offered to the test stack (`bun dev:bg --profile test --built`); measured against `next dev`: 200 asks of the report's pages at four at a time (the drops counted), the time of the shell group and of the handover group, the time of the build. The rule: the test stack is built when the drops are gone and the build's time is under the time it saves in the groups; else `next dev` stays and the proxy question is open | The counting script in `tools/` with its test | The two runs, their numbers in the pull request and in "As built" |
| 3 | The proxy, if the build still drops | Only if step 2 still drops: the web's `/api/*` served by a route handler of Next (`app/api/[...path]/route.ts`) that streams the API's answer, so that Node's own `fetch` carries the body, not the rewrite's proxy; measured the same way. Not built if the drops are gone | The handler's unit test over a fake API | The counting script |
| 4 | The API's timings in its log | A middleware in `rooftop_api/main.py`: one line per request in uvicorn's logger with the method, the path, the status and the milliseconds; the design run's line with its steps' times from the progress events | `tests/api/test_timing_log.py`: the line's shape; the engine untouched (import-linter) | |
| 5 | Close of pull request 1 and the fresh clone | A clone of `main` into the system's temporary directory: `bun install`, `uv sync`, `bun stand`, `bun check --skip=e2e`; what fails is fixed in this pull request; `README.md` says the stand's commands and what a fresh machine needs (the Esri key's referrers for the stand's address); `docs/checks.md` and `plan/STATE.md` | | |
| 6 | The pictures by group | `screens.e2e.ts` keeps the shell's pictures alone (the switcher, Import a drawing, Saved on this device, the kit's stay in `kit.e2e.ts`); each workspace's pictures move, test for test, into `find-screens.e2e.ts`, `studio-screens.e2e.ts`, `performance-screens.e2e.ts`, `handover-screens.e2e.ts`, `home-screens.e2e.ts`, `present-screens.e2e.ts`; the shared helpers stay in `e2e/screens.ts`. `e2e-groups.ts`: the new suites named in their groups; a group's baselines are its own by name (`studio-*.png` to studio, and so on), and the shell's are what is left; the three pictures named for another group are renamed (`open-project*` to `home-open-project*`, `studio-project-switcher*` to `shell-project-switcher*`, `import-dxf` to `shell-import-dxf`). Pictures unchanged: the baselines move with `git mv`, no pixel changes | `e2e-groups.test.ts`: every baseline belongs to one group; a baseline no group claims is refused; the proofs: a Handover change runs handover and shell, and shell no longer sees `handover-*.png` | Each group run once; the pictures equal |
| 7 | The kit on two sizes | The kit's suites run on phone and desktop (`testIgnore` of the tablet project); the tablet's `kit*.png` deleted | `e2e-groups.test.ts` unchanged | The kit group, 2 of 3 |
| 8 | Present's frames on desktop alone | The tests of `present.e2e.ts` that render the tour frame by frame run on desktop (the tour's logic has no size); the pictures of Present stay on desktop and tablet; the suite's tests stay one after the other in their worker | | The present group: about 5 minutes, measured |
| 9 | Close of pull request 2 | `docs/checks.md`: the groups' table, the rules 4 and "what a change runs", the measured times; `plan/STATE.md` | | The times of each group written down |
| 10 | The rule | `tools/check/e2e-group-imports.test.ts` gains the base: a value import from a file of the base (every input of `BASE_INPUTS` under `apps/web`, except `app/**`, whose pages are the entry points of the workspaces) into a group's own folder is refused, naming the file and the import | The test fails on `main` with the eleven crossings named | |
| 11 | The moves | The Studio's frame `components/shell/Studio.tsx` to `components/studio/Studio.tsx` (the page imports it; `use-size`, `use-sun-keys` stay where they are); `components/home/OpenProject.tsx` and `lib/home/open-project.ts` to `components/shell` and `lib/flow` (a dialog the shell opens on every page); `components/find/Search.tsx` to `components/shell/Search.tsx` with the search's logic it needs (`lib/map/search-state.ts`, `place-input.ts`, `provider.ts`, `esri.ts`) to `lib/places/` in the base (Find, Home and Import a drawing share it; the map's own files stay in `lib/map`); `lib/studio/import-drawing.ts` to `lib/flow`; `lib/handover/downloads-store.ts` to `lib/stores`; `lib/scene/sun-day.ts`, `lib/studio/play.ts`, `lib/studio/sun-time.ts`, `lib/performance/weather-source.ts` to `lib/flow`; `lib/scene/string-colours.ts` and `lib/scene/drag.ts` to `lib/stores`. Imports updated, nothing rewritten; the unit tests move with their files | `bun test` whole; the rule-test green | `bun check --skip=e2e`; studio, home, find and shell by hand (the files the Studio, Home and Find lose) |
| 12 | Close of pull request 3 | `e2e-groups.ts`: the inputs that moved; `docs/checks.md`, "Known limits" loses the item, the rules gain it; `plan/STATE.md` | The proofs | |
| 13 | The parity audit | `plan/reference/parity-audit.md`: every row of `functional-inventory.md` (the inputs with their ranges and defaults, the outputs, the messages verbatim, the exports, the gaps decided) as a table: the row, where it lives in the web app (the route and the component), seen working on 2026-10-0x (the session walks the running app, one row at a time), tick or the written reason (not built, decided otherwise with the decision's number, deferred to a phase), and an empty column "Signed" for the owner | | The session's walk, on desktop, and the rows that differ by size noted |
| 14 | The numbers audit | `plan/reference/numbers-audit.md`: the demo, the same roof as flat east-west and as sloped flush (the two of `demo-numbers.md`), the desktop's figure beside the web's at the displayed precision for every number the screens show: the vitals, the Roof and Array lens read-outs, the shading figures at the window's end, the series range, the five options' table, the MPPT loading, Performance's KPIs, P-values, the 21 steps of the chain, the twelve months, the six years, the summary, the BOM's lines, the schedule's first and last string; the desktop's figures from its engine run in `../rooftop-design/.venv` by a script kept in `tools/audit/` (reading its samples, writing nothing there); the web's from `/design` and from the screens. A row that differs beyond the displayed precision is a finding with its cause; a column "Signed" | The script's output checked against `demo-numbers.md` where it overlaps | The screens read for the figures the API does not carry as such (the cascade's rounding) |
| 15 | The operator's guide | `docs/operator-guide.md`, one page: before the show (the machine, the clone, `bun install`, `uv sync`, the key in `.env.local` with the stand's address among its referrers, `bun stand` once to build); at the stand (`bun stand`, the address, Home, "Open the demo"; without a network: what still works and what does not, in two lines); reset to the demo (the visitors' designs deleted from their cards, or the site's data cleared in the browser, three steps); Present (the top bar's Present, any key returns; reduced motion; full screen); if something goes wrong (the API stopped: Try again; `bun stop --profile stand` and `bun stand`; the logs' place) | | Walked once on this machine as written |
| 16 | The stand's journey, offline | `e2e/tests/journey-stand.e2e.ts` (the shell group: it opens every workspace): every request to a host that is not the stack is refused (`page.route`, no fixture tile, no geocoder), the imagery's absence tolerated; Home, Open the demo, the Studio's four lenses with their numbers, Performance, Handover with the PDF and the `.rtd` downloaded on desktop, Present for one loop and back by a key; a reload keeps the kept design; nothing waited on the network; on three sizes (Present on two) | | The suite on three sizes |
| 17 | The visitor's journey | `e2e/tests/journey-visitor.e2e.ts` (the shell group): find the roof by its words (the fixtures), outline it, add an obstacle with its height, Build, the roof type, the Array lens's tilt, the Strings lens's voltage and an option, a loss in the chain, the Handover's zip; the numbers of the vitals follow each step; on three sizes | | The suite on three sizes |
| 18 | The `e2e` workflow on Linux | `.github/workflows/e2e.yml` runs the journeys and the smoke (`bun tools/e2e-group.ts shell -g "journey|smoke"`), by hand as before (D20); the suites that take pictures skip where `process.platform` is not `darwin`, saying so in the report; the workflow run once from this branch and green | `e2e-groups.test.ts`: the journeys are the shell's | The workflow's run |
| 19 | Close of pull request 5 | `docs/checks.md`: the journeys, the workflow; `plan/STATE.md` | | |
| 20 | A roof too large | `/layout`, `/design`, `/sun`, `/roof/from-map`, `/roof/on-map`, `/roof/import`, `/project/open` refuse an outline whose area is over 100,000 m² (decision 11) in words (`roof_too_large`: "This roof is {area} m²; the tool designs roofs up to 10 hectares."); the web shows the refusal where it shows the API's refusals (the chip of a failed layout, the Find panel's note before Build) | pytest: the limit, the words, the OpenAPI document; `bun test`: the client's error | A by-hand roof of 400 by 300 m refused in the panel |
| 21 | 5,000 positions stay usable | A roof of 250 by 100 m (about 5,500 positions on the demo's spacing) measured: `/layout`, `/design`, the stage's frame while orbiting with the machine's graphics (`tools/present-soak.ts` gains a roof), the Strings lens with its strings; what is over the budget (a frame over 33 ms, a layout over 2 s) is fixed or written down with its cause | The engine's times in the pull request | The stage with 5,500 modules on desktop, pictured once (not a baseline) |
| 22 | The strings in the plan without WebGL | `PlanFallback.tsx` colours the modules by the view's colouring (string, MPPT, inverter) with the scene's colours, the legend as on the stage, the selected string marked; nothing new drawn | `plan.test.ts`: the colours per placement | `stage.e2e.ts` without WebGL on the Strings lens, three sizes; a new baseline `studio-strings-plan` looked at beside "Strings on the roof" |
| 23 | A storage that is full; a pending save written before the page is left | `lib/device/saving.ts`: a `QuotaExceededError` says "This device's storage is full. Free some space, or save a copy as a file." with Save a copy in the note; any other failure as before. A write that waits in the debounce is written at once on `pagehide` (the record whole, the facts of a landed run included), so a reload or a closed tab loses nothing; `device.e2e.ts` "two designs" waits for the run's write before it leaves the page | `saving.test.ts` with a fake adapter throwing the quota error; the flush on `pagehide` with a fake clock | The note's words through a page that makes `indexedDB.put` throw (an init script) |
| 24 | The API stopped and started again | While the Studio is open the API is stopped (`page.route('/api/**', abort)`): an edit's layout fails with the board's words, the design kept stays, Try again works once the route is restored; the same from Home (Open the demo); on three sizes | | `shell.e2e.ts` or the stand's journey |
| 25 | Present's first scene | `lib/scene/reveal.ts`: at a building share of 0 the building, its roof plane and its parapet are not drawn and the roof's outline is drawn on the ground as an accent line (`Building.tsx`, a line over the ground at the roof's footprint); from the first part of the share the building rises with its roof as now and the outline stays until the roof covers it; the Studio untouched (share 1 draws no outline) | `reveal.test.ts`: what is drawn at 0, 0.01, 1 | `present.e2e.ts`: the first frame shows the outline and no roof; the baseline `present` renewed and looked at beside the board |
| 26 | The thumbnail without the dashes | `thumbnail.ts` leaves the keep-out out; the setback stays | `thumbnail.test.ts` | `home-designs` renewed, three sizes, beside the board |
| 27 | The soak with the heap settled | `tools/present-soak.ts` forces a garbage collection before each reading (`--js-flags=--expose-gc`, `window.gc()`), so that a step of the heap's size class is told from a leak; a heap snapshot at minute 10 and at minute 30 compared by constructor counts; one run of 30 minutes with the machine's graphics; the numbers in "As built"; a leak found is fixed in this pull request | | The soak's table |
| 28 | The BLAS threads on GitHub | `OMP_NUM_THREADS=1`, `OPENBLAS_NUM_THREADS=1`, `MKL_NUM_THREADS=1` in the `check` workflow's environment; the pytest step's time compared with the last three runs of `main`; kept if it is not slower | | |
| 29 | The drawing tests share their pages | The demo's report pages drawn once per pytest session (a session fixture over `kept.py`'s memo, as the shading is), where `tests/engine/test_report_pages.py` and `tests/api/test_report_pages.py` each draw them per module and `test_export.py` draws the PDF; the time measured here and on GitHub | pytest whole, the same tests green | |
| 30 | The keyboard path | `e2e/tests/keyboard.e2e.ts` (the shell group), desktop: on every page the tab order (the top bar, the navigation, the workspace's first control), every control reachable and operable by key, the focus visible (the ring's token), Escape closes dialogs and menus and returns the focus, the Studio's keys (undo, redo, the sun's keys) once; axe's rules already run in every suite and are not repeated | | The suite |
| 31 | Reduced motion | `page.emulateMedia({ reducedMotion: "reduce" })`: Present's cuts (exists in `present.e2e.ts`; checked), the Studio's play by the hour, the panels without motion, the toasts; one test per place in the suites that own them | | The tests |
| 32 | WebKit and Firefox by hand | `bun run e2e:browsers`: the smoke and the two journeys on WebKit and Firefox against the test stack, desktop and tablet (`e2e/playwright.browsers.config.ts`); the browsers installed once by the owner (`bun x playwright install webkit firefox`, network); run by the session once, the findings fixed or written down; `docs/checks.md` says the command. Safari on iPadOS and iOS and Edge are the dry run's on the hardware | | The run |
| 33 | Polish | Each a commit with its test, in the groups it reaches: the drawer of the notes with the panels' 240 ms; the assumptions row "Rear shading and mismatch" on phone laid out as the board; the chip "INV-1" kept off the edge labels on phone; the report row's facts asked at the workspace's open (the pages' count known before the report is opened); the wheel over a DOM handle reaching the canvas; the Sun lens's framing so the sun path's marker stays on the canvas at 10:30 on desktop (a before and after picture for the owner's eye); Uc's default beside the entered value (the API says the roof type's Uc in the answer) | Unit tests per item | The groups' suites; the pictures that change, beside their boards |
| 34 | Close of the phase | The full browser suite once, with the owner's yes, nobody working (D55); the failures looked at; "As built" with the acceptance met row by row, the deviations and what was found; the status in `plan/README.md`; `plan/STATE.md`; the session's record; the resume prompt the owner asks for. The dry run on the hardware is the owner's, with the operator's guide in hand | | |

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | Each workspace's pictures live in a screens suite of its group (`<group>-screens.e2e.ts`); a baseline belongs to the group its name begins with (`studio-*.png` to studio, `kit*.png` to kit, and so on), the shell's are the rest. A picture of a workspace changed by a change to the shell is still caught: the shell's own inputs see every folder, and the groups whose folders changed run their own pictures | `docs/checks.md`, known limits: a Handover change paid 11 to 16 minutes for the shell's pictures of everything; it pays about 3 after this |
| 2 | The kit is pictured and tested on phone and desktop; the tablet's kit pictures go. The screens of every workspace stay on three sizes | The kit's components lay out as on desktop at 834 but for the sheet, which the workspaces' tablet pictures show; a third of 2.5 minutes for every change to `components/ui` |
| 3 | Software WebGL stays for the browser tests. Present's frame-by-frame tests run on desktop alone (the tour's logic has no size; the pictures of Present stay on two sizes). Hardware WebGL is not tried again in this phase: the trial of 2026-10-03 lost the satellite ground without a cause found, and the owner's steer was the core work | The present group from 10 minutes to about 5 (measured in step 8); the pictures stay what they are |
| 4 | The base imports nothing of the groups' folders, held by the import walk; `app/**` is excepted (the pages are the workspaces' entry points). What two workspaces share moves to the base: the dialogs the switcher opens on every page (`OpenProject`, `ImportDrawing` is there already) to `components/shell`; the search and its logic (Find's, Home's and Import a drawing's) to `components/shell/Search.tsx` and `lib/places/`; the Studio's frame to `components/studio`; the helpers the stores and the flow need to `lib/stores` and `lib/flow`. Nothing is rewritten | `docs/checks.md`, known limits: a change to one of the eleven files runs its folder's groups and shell, not the suites of the workspaces that depend on it through the base; `plan/phase-04b-test-caching.md`, the open item |
| 5 | `bun start` runs the app as production does on this machine: a third profile `start` of `tools/dev.ts`, `next build` once and `next start`, the API without reload, on the dev profile's ports (the two never run at once; `bun start` refuses while `bun dev` runs), the weather downloads on. The dev profile stays `next dev` for the owner's work. The stand itself demos from production (Vercel, Lambda); `bun start` is the laptop fallback and the local proof of the build (the owner, 2026-10-04) | A stand that compiles pages on the first visit, reloads on a file change and runs a proxy known to drop is a surprise in front of an audience; the production build is what Next is for |
| 6 | The test stack is built, not `next dev`, when the measurement of step 2 says the drops are gone and the build's time is under what it saves in the groups; otherwise `next dev` stays and step 3 settles the proxy. The rule is written before the measurement so that the measurement decides, not the mood | The rewrite's drops are seen in `next dev` alone because nothing else was ever run; a build takes about a minute and a shell run saves its own waits |
| 7 | No relay of our own, whatever step 2 measures: on Vercel the `/api/*` forwarding is Vercel's edge proxy, not the Node relay that drops locally, so a relay written here would serve the local run alone. If the build still drops locally, the three tries of the exports stay and the cause is written down (the owner, 2026-10-04; step 3 dropped) | D4: a dependency is a decision; the one origin is a decision of Phase 1 |
| 8 | The API logs one line per request with its time in uvicorn's logger (a middleware in `rooftop_api`; the engine untouched); the design run's line carries the steps' times. No metrics service | The phase file: "API timings logged"; the stand's log is where the operator looks |
| 9 | The journeys are two suites of the shell group, `journey-stand.e2e.ts` (the demo, offline: every request to a host that is not the stack refused) and `journey-visitor.e2e.ts` (the roof found, outlined, built, strung, run, exported), on three sizes. They are the end-to-end suite of the phase file | The shell group is the one that sees every workspace (as `device*.e2e.ts` does); a group of their own would run as often and cost the same |
| 10 | The `e2e` workflow runs the journeys and the smoke on Linux, by hand as before (D20), without pictures: the suites that take pictures skip where the platform is not `darwin` and say so. The whole suite is never run on GitHub (D55). Baselines for Linux are not made | The phase file's "runs in CI" without a second set of 210 pictures to keep; the minutes cost money (D55) |
| 11 | A roof whose outline is over 30,000 m² (about 3 MWp at the demo's density; 173 m square, or 300 m by 100 m; eight demo roofs) is refused by the API at every route that takes an outline, in words that say the area, the limit and what to do: "This outline covers 48,500 m². SolarLayout designs one roof at a time, up to 30,000 m² (about 3 MWp). For a larger site, outline each building as its own design." Shown where the outline is drawn, before Build, and for a file that carries such an outline. A single roof over 3 MWp is rare in practice; the multi-megawatt rooftop sites are many buildings; the run at the limit (about 6,500 positions) is measured in step 21 | The owner, 2026-10-04: realistic rooftop sizes, a polite refusal with the reason and what to do; the desktop's 400 hectares and the first draft's 10 were not rooftop numbers | `/layout` without a limit took 29 s for 200 hectares (`plan/STATE.md`); a stand must never wait on a stray outline |
| 12 | 5,000 positions is measured, not guessed: a roof of 250 by 100 m on the demo's spacing, `/layout`, `/design`, the stage's frame with the machine's graphics, the Strings lens; what is over budget (a frame over 33 ms, a layout over 2 s) is fixed or written down with its cause and the owner's call | The phase file; one measurement is worth the plan's words |
| 13 | A storage that is full says so in its own words with Save a copy in the note; the IndexedDB adapter's other failures keep the words of today | "Not saved" alone leaves the visitor with no way out; the file is the way out (D5) |
| 14 | Present's first frame is the satellite with the accent outline alone: at a building share of 0 nothing of the building is drawn and the outline lies on the ground; the roof rises with the building. The ground stays the imagery (the board says its ground stands in for live imagery) | The board |
| 15 | The thumbnail leaves the keep-out out; the setback stays | The board's small plan |
| 16 | The soak forces a garbage collection before each reading and compares a heap snapshot at minute 10 and 30; the gate of a quarter stands | The step from 35.6 to 61.0 MB at minute 21 (Phase 10) cannot be judged without it |
| 17 | pytest on GitHub: the BLAS threads pinned to one and the report's pages drawn once per session are tried and measured; what does not pay is taken out again, as pytest-xdist was (#70) | `plan/STATE.md`: the runner's two cores saturated by one process; the drawing tests are the heaviest after the shading |
| 18 | The whole browser suite runs once at the close of the phase, when the owner says and nobody works (D55); that run is the acceptance's "`bun check` green including the full e2e suite". Until then every pull request is gated by the fast check and the groups it reaches | The acceptance was written before D55; D55 is closed |
| 19 | WebKit and Firefox are run by hand against the test stack (`bun run e2e:browsers`: the smoke and the journeys), never in the check; the browsers are installed once by the owner. Safari on iPadOS and iOS and Edge are the dry run's on the hardware | The install needs the network; the check stays what it is; the devices are the owner's |
| 20 | The parity and numbers audits are two documents under `plan/reference/`, one row per item, each with an empty "Signed" column for the owner, committed to `main` (D26); a row that fails becomes a step of a pull request of this phase, and the row says which | The phase file: "signed off by the owner, row by row" |
| 21 | The operator's guide is one page in `docs/`, written for someone who has not seen the repo; "reset to the demo" is the deletion of the visitors' cards or the browser's clearing of the site's data, not a feature | One page; nothing to build or draw; the demo itself is never changed on the device (D32: it is kept as a new design at its first edit) |
| 22 | The Layers button of the rail (the ground switched between the imagery and the plain grid, in any lens) is built in this phase: a board first, shown to the owner right after pull request 1, then the toggle (step 35) | The owner, 2026-10-04: "Build it" (the first draft's default was to drop it) |

## Risks

| Risk | What I do |
|---|---|
| Pull request 3 moves fourteen files across the web app and runs every group | The moves are imports alone, no logic; `bun check --skip=e2e` then the groups by hand; one commit per move so a fault is found by bisecting |
| The production build changes what the tests see (no HMR, different error pages, a cached page) and a group fails that passed in `next dev` | Step 2 runs the groups on the build before the stack is switched; a difference is a finding, not a reason to skip the build for the stand |
| The drops have a cause the build does not remove (uvicorn's side, the socket's keep-alive) | Step 3's handler; failing that, the exports' three tries stay and the cause is written down with the trace |
| The numbers audit finds the web and the desktop apart | A finding with its cause in the table; an engine difference would be a defect of Phase 2 and a pull request of its own; a rounding difference is written down |
| The journeys are long tests that fail under load | Each step waits on its own result with the run's time; the tests are placed in the shell group, whose load is lower after pull request 2 |
| WebKit shows what Chromium hides (IndexedDB in private mode, full screen refused, `performance.memory` missing) | The findings are fixed where they are the app's; the guide says which browser the stand uses |
| Seven to nine pull requests in one phase over several sessions | `plan/STATE.md` after each; the resume prompt carries the place; the pull requests are independent after the first two |
| The tradeshow's hardware is unknown | The guide names what the owner tells; the frame budget on a mid laptop stays unmeasured until he has one at hand |

## Questions for the owner

Both answered on 2026-10-04: the Layers button is built (decision 22); the stand demos from live production, `rooftop.solarlayout.app`, with
staging at `rooftop.staging.solarlayout.app`, the two sharing nothing; the UI on Vercel, the API most probably on AWS Lambda, in a dedicated
piece of work after this phase.

## Done means

The pull requests of "Scoped with the owner" merged on the fast check and the groups they reach; the whole browser suite green once at the
close, here, when the owner says (decision 18); `bun start` runs the app as production does with one command; the browser groups lighter by
the numbers written in `docs/checks.md`; the base imports nothing of the groups' folders; a roof over 30,000 m² refused in words and a roof
at the limit measured; the Layers button built to its approved board; the engine's profile written for issue #76; the seven items of polish
done; "As built" written with the deviations and what was found. The audits, the journeys, Present's fixes, the keyboard path and the
browsers wait in issues #73 to #77 on the owner's own end-to-end test; the dry run is on production, after the deployment piece.
