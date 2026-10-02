# SolarLayout Rooftop (web): build plan

Rebuild of the desktop app at `../rooftop-design` as a browser app: Next.js + React Three Fiber front end,
stateless Python API. One file per phase. Work the phases in order; each one ends with something to show.

## How to resume in a new session

Paste the resume prompt written for the work, from `resume/` (index in `resume/README.md`). Each one sends
the session to `STATE.md` (where the work stands) and `SESSIONS.md` (how a session starts, works and ends).

Always:
1. Read `reference/functional-inventory.md` before touching any feature: it is the contract for
   "nothing is lost from the desktop app".
2. Read `reference/r3f-notes.md` before any 3D work.
3. When a phase changes status, set it here, in its own file and in `STATE.md`.

## Phases

| # | Phase | File | Status |
|---|---|---|---|
| 0 | IA and visual design (HTML mockups, approval) | `phase-00-design.md` | direction approved; 17 boards approved; more screens to draw |
| 1 | Monorepo, tooling, one-command dev stack | `phase-01-foundation.md` | done |
| 2 | Engine and stateless API | `phase-02-engine-api.md` | done |
| 3 | Design system and app shell | `phase-03-design-system-shell.md` | done |
| 4 | Find the roof on the map and outline it (flagship) | `phase-04-find-and-outline.md` | done (#35, #36, #38) |
| 4.5 | Caching of the checks: what has not changed does not run again, here and on GitHub (not a product phase) | `phase-04b-test-caching.md` | done (#39, #40, #41); how: `phase-04b-plan.md` |
| 5 | Studio: 3D roof, Roof and Array lenses | `phase-05-studio-roof-array.md` | done (#42 to #47); how: `phase-05-plan.md` |
| 6 | Studio: Sun lens | `phase-06-studio-sun.md` | planned; how: `phase-06-plan.md` |
| 7 | Studio: Strings lens | `phase-07-studio-strings.md` | not started |
| 8 | Performance | `phase-08-performance.md` | not started |
| 9 | Handover and exports | `phase-09-handover.md` | not started |
| 10 | Home, projects on the device, Present mode | `phase-10-home-projects-present.md` | not started |
| 11 | Hardening for the tradeshow | `phase-11-hardening.md` | not started |

## Decisions taken (change here if overruled)

| # | Decision | Why |
|---|---|---|
| D1 | Engine stays Python (`rooftop_core` copied in, no link to the old repo) | pvlib, shapely, pyproj, ezdxf have no JS equal; numbers already validated |
| D2 | bun + turbo monorepo: `apps/web` (Next.js App Router), `apps/api` (FastAPI, uv), `packages/api-types` | Asked for; matches solar-mms-modeller |
| D3 | Ports: dev stack web 4700, API 4701; test stack web 4710, API 4711; each falls back to the next free pair in its range of ten | Asked for |
| D4 | Versions pinned to what solar-mms-modeller proved: next 16.2, react 19.2, three 0.185, @react-three/fiber 9.6, drei 10.7, tailwind 4, zustand 5, TypeScript 5.x | Known-good set; R3F 9 needs react < 19.3 |
| D5 | No database, no auth. The project lives in the browser (IndexedDB) and as a `.rtd` file | Asked for |
| D6 | API is a pure function of the request. Long runs stream progress over SSE inside the one request. An in-process LRU keyed by input hash may memoise shading; dropping it changes nothing but speed | Stateless, yet re-runs after a loss edit stay fast |
| D7 | `.rtd` format 2 embeds PAN, OND and CSV weather text. Format 1 files still open | Desktop stored absolute paths, which cannot work in a browser |
| D8 | No Run button. Layout recomputes on every committed edit; energy follows in the background | Core of the new IA |
| D9 | Dark "Dusk" theme ships first; tokens are theme-ready so a light theme is a token swap | Shows best on tradeshow screens |
| D10 | System voltage is never preselected (F7). Results that need it wait and say so | Hard rule carried over |
| D11 | A result that does not fit shows a tick or an exclamation mark, never a red cross | Hard rule carried over |
| D12 | Playwright e2e on three viewports (390, 834, 1440) from phase 3 onward | Asked for; RWD from day zero |
| D14 | IA approved 2026-09-29: Home, Find and outline, Studio (4 lenses), Performance, Handover | Owner |
| D15 | Visual direction "Dusk" approved 2026-09-29, with depth: raised buttons, recessed fields, three elevations, restrained motion | Owner |
| D16 | Finding the roof on a satellite map and outlining it is the flagship capability | Owner |
| D13 | Map stack decided 2026-09-29: Esri World Imagery and Esri geocoding (ArcGIS Location Platform) plus Overture building footprints. The owner creates the Esri account and supplies the API key | Owner; see `reference/map-providers.md` |
| D18 | Legal check on the map stack: approved by the owner 2026-09-29. Closed; do not reopen | Owner |
| D19 | Engineering standard: production grade, test-driven (failing test first). Recorded in `CLAUDE.md` | Owner, 2026-09-29 |
| D20 | CI: the pull request check runs everything except browser tests; browser tests run locally in `bun check` and in the `e2e` workflow, started by hand | Owner, 2026-09-29: the browser install hung in CI |
| D21 | Pull requests are merged by the agent once the check is green | Owner, 2026-09-29 |
| D22 | The design system is documented in `docs/design/` and linked from `CLAUDE.md` and `apps/web/CLAUDE.md`; all UI work complies with it | Owner, 2026-09-29 |
| D23 | The work is done in sessions of one slice each. The repo carries the context: `STATE.md`, `SESSIONS.md`, and resume prompts in `resume/`, each specific to the work resumed and written when the owner asks | Owner, 2026-09-29 |
| D24 | The demo shows its equipment by its real names: module Insolation INA-144MHC-TF-560, inverter WattPower WP-330KTL-H1. Same data as the desktop app's `Test.PAN` and `Test-S.ond`, so no number changes | Owner, 2026-09-29 |
| D25 | DC cable is labelled by the system voltage as chosen (600, 1000 or 1500 V), not by a rating class | Owner, 2026-09-29 |
| D26 | A change to documents only (`plan/`, `docs/`, `README.md`, `CLAUDE.md`) is committed to `main` directly. Code, tests, configuration and generated files go through a pull request, as before | Owner, 2026-09-29 |
| D17 | The word "bankable" is not used anywhere in the product; it belongs to utility-scale ground-mount | Owner |
| D27 | Fonts come from the repo, never from Google at build or run time: Geist and Geist Mono from the pinned package `geist`, Bricolage Grotesque as a file in `apps/web/app/fonts`. All three under the SIL Open Font License 1.1 | Tests never touch the network; session 3, as the work order asked |
| D28 | Tailwind is made of the design tokens alone: its own theme is switched off. `docs/design/design-tokens.md` and `globals.css` are held equal by a test; a value is changed in both or in neither | Rule 9 of `CLAUDE.md`, made to hold by itself; session 3 |
| D29 | The screens have baselines in the repo (`e2e/baselines/<platform>/<size>`), compared in the browser tests; a pull request shows them as its screenshots. A screen may differ by 50 pixels | Rule 7 of `apps/web/CLAUDE.md`; session 3 |
| D30 | A component can be shown in a state without pointer or keyboard (`shownAs`), for `/kit` and its screenshots only | The kit board shows the states side by side; session 3 |
| D31 | In a number field an entry outside the range goes to the nearest limit, an entry that is no number leaves the value; the field says which, in the style of a hint. The arrows step the draft and do not commit | It had no design; session 3 |
| D32 | The boards "Controls, part 2" and "Shell states" are approved, with the choices in them: while the energy is updated every value of the vitals is dimmed and the last cell says the step and how far; the demo says "Not kept on this device"; on tablet and phone the state of saving is said in the project switcher only; a toast with a note stays until closed; a file that is refused leaves the equipment of before | Owner, 2026-09-29 |
| D33 | Tabs stays in Phase 3. It has no design yet: it is drawn and approved first | Owner, 2026-09-29: "we might need it" |
| D34 | The rest of Phase 3, after the sliders (pull request #31), goes into one pull request, each part as a commit of its own. For this phase; "one change per pull request" stands for the phases after it | Owner, 2026-09-29, session 4: "try to do it in one PR not numerous PRs" |
| D35 | The board "Tabs" is approved as drawn: flat, on a line, the tab that is taken with a line of 2 px in accent; 40 high, 44 on touch; a row that is too long scrolls sideways; tabs divide the content of one card or panel, a segmented control sets a value or a view. With it the plan of the rest of the phase and its decisions (`phase-03-rest-plan.md`) | Owner, 2026-09-29, session 4: "all approved" |
| D36 | The rest of Phase 3 is two pull requests, not one, split where nothing of the first depends on the second: #32 holds the components (steps 3 to 9 and Tabs), a second one the stores, the data flow, the routes and the shell (steps 10 to 16). The second is built in a new session. D34 stands inside each of the two: every step a commit of its own | Owner, 2026-09-29, session 4: "Upto you to decide when you want to split if at all". Decided by the session: #32 had 20 commits at step 9, the second half is as much work again, and `SESSIONS.md` asks for one slice in one session |
| D37 | Before a system voltage the vitals say what is waited for in the words of the API: the title and the message of `no_options`; on phone the title alone. The same for the other reasons the API has for no options. The boards "Shell states" and "Strings lens, no system voltage yet" are corrected to match | Owner, 2026-09-30, session 5, asked with the three ways side by side |
| D38 | The vitals bar is in the Studio. Performance and Handover show the values in their own places, as their mockups draw them, and have no bar. `information-architecture.md` said "on every screen" and is corrected | Session 5: the mockup wins over the document (`docs/design/README.md`, "Order of authority"). Approved by the owner, 2026-09-30 |
| D39 | Inside tablet and desktop the top bar has one width each where it gives way: under 820 Present and the word of Export go, under 1360 the place of the design and the state of saving. Nothing is laid out anew, and the three sizes stand | Session 5: at 640 and at 1101 the top bar of the mockups has no room for the name of the design. Approved by the owner, 2026-09-30 |
| D40 | `maplibre-gl` 6.11.2 and `pmtiles` 4.5.0 join the pinned set of D4. MapLibre's worker and the module it shares are served by the app (`apps/web/public/maplibre-gl`, copied by `tools/vendor-maplibre.ts`, held equal to the package by a test), because under Next's bundler the worker cannot find its own file. MapLibre's own controls are not used: zoom, north, the scale bar and the attribution are ours, as the mockup draws them | Session 6, `phase-04-plan.md`, decision 1. The owner: "go according to your plan" |
| D41 | Local metres come from the API alone: `POST /roof/from-map` projects the corners drawn in WGS84 with the engine's projection (`geo.py`), so the engine's is the only one that makes a document. While the user draws, the browser measures in a flat frame around the map's centre for the live numbers only; after Build the panel and the Roof lens show the API's numbers. The two differ by the scale of the projection (lengths within 0.05 m over 100 m) and by the convergence of the grid: the API's y is the grid north of its UTM zone, 0.36° from true north at Pune, so a corner 45 m from the centre differs by up to 0.3 m and the direction a roof faces by under 1° | Session 6, plan decision 2. The flat frame comes with the second pull request |
| D42 | `map` is a source of a roof, beside `coordinates`, `kmz` and `dxf`, in the engine and the API | Session 6, plan decision 3: the Roof lens says "Outlined on satellite" |
| D43 | `/roof/from-map` answers a whole `Project` with the API's defaults; the web app has no default of its own. Building a new roof opens that document; building from the Roof lens's Edit commits its roof into the open design and keeps the rest | Session 6, plan decision 4 |
| D44 | The stores live at the root of the app, so that `/find` and the workspaces share one design. A workspace without a design opens the demo, as before; `/find` never does. Until Phase 10 keeps designs on the device, a reload of the Studio loses a design built on the map | Session 6, plan decision 5 |
| D45 | `/find` is reached from the project switcher ("New design"), from the placeholder Home by one link "Find my roof", and by its address. The board of Home is built in Phase 10 | Session 6, plan decision 7 |
| D46 | On tablet the map is as wide as the screen and the panel is a bottom sheet of 384, as on phone; the phone has no zoom buttons, the map is pinched and turned by hand (the boards "Find and outline, tablet" and "Find and outline, states and tools", drawn by session 6). Before a roof is found the map shows India from far; with a design open it begins at that roof | Session 6, plan decisions 8 and 13; the boards of step 0 |
| D47 | In the browser tests the imagery is one fixture tile for every address (`e2e/fixtures/imagery-tile.png`, served by `page.route`); the geocoder, the footprints and the location come from fixtures the same way. No stand-in server | Session 6, plan decision 9 |
| D48 | Detect building reads Overture's buildings of the pinned release `2026-09-23.1` (`lib/map/overture.ts`), one archive read by ranges through the pmtiles protocol, and shows "© Overture Maps Foundation, ODbL" while they are on the map. The tiles end at zoom 14: a building cut by a tile edge is proposed as the piece under the press, and the UI says a footprint is approximate. `tools/footprints.ts` takes the tiles of a box out of the release into an archive of its own: the fixture of the browser tests now, a mirror of what the app needs when it is deployed (Phase 11) | Session 6, plan decisions 11 and 12 |
| D49 | The name of a new design is the label of the place the roof was found by, when it was found by words ("Hinjewadi Phase 2, Pune, Maharashtra"); for coordinates, a link or the device's location it is the API's "Untitled roof". Renaming comes with the project switcher (Phase 10) | Session 6, plan decision 6 |
| D50 | The toolbar of the map follows the roof: while the outline is open it holds the ways to outline; once it is closed (and no drag is going on) it holds the four obstacles, Box, Tank, Wall and Building, with Box in hand. Obstacles are drawn light over dark, so that the roof stays the amber thing on the screen; the selected one is accent. Trees are entered in the Roof lens (Phase 5), not on the map | Session 7, the board "Obstacles on the map and their heights", approved by the owner |
| D51 | The height of a shape drawn on the map is asked in a dialog right after the shape is done (a sheet on phone), with the name of its kind suggested and the height empty: nothing is preselected, the desktop app's defaults of 1.5, 2, 6 and 8 m are its own. The primary action waits for a number and can still be pressed, so that the press commits the field. A number field may have no value yet | Session 7, the same board; `docs/design/components.md`, "Number field" and "Dialog" |
| D52 | Entering the roof by hand is another way to set the same outline: the fields (the place, then a rectangle by length, width and where its long side faces, or a table of corners) are the truth of it, and everything after is as for a roof drawn. With a map the roof stands on the imagery at the place and its corners are shown, not dragged; without one the stage draws the plan north up. Build sends the source `coordinates` and the API keeps it (`OutlineOnMap.source`): the Roof lens says "Entered by hand" | Session 7, the board "Enter dimensions by hand", approved by the owner |
| D53 | `pytest-testmon` 2.2.0 and `coverage` 7.16.2 join the pinned set of D4, for the selection of the Python tests by what each one executed (Phase 4.5). Selection runs on dev machines; on GitHub pytest runs whole, cached by turbo. The numbers of the engine (`tests/engine/test_demo_numbers.py`) run in every pytest run as a sentinel (`tests/always_run.py`). Testmon's data has a key of its own over what testmon does not track (the data files, `pyproject.toml`, `uv.lock`, the Python version, the platform); a different key deletes the data and runs the suite whole | Session 8, `phase-04b-plan.md`, decisions 4 to 6; the owner's yes to 4 |

## Open for approval

| # | Question | Default if no answer |
|---|---|---|
| none | | |

## Layout of this folder

```
plan/
  README.md                     this file: phases and decisions
  STATE.md                      where the work stands today; read first, update last
  SESSIONS.md                   how a session starts, works and ends
  resume/                       resume prompts, one per resumption, written when the owner asks
  sessions/NNN/                 record of each past session and the owner's messages, word for word
  phase-NN-*.md                 one per phase: goal, scope, deliverables, acceptance
  phase-03-rest-plan.md         how the rest of Phase 3 is built: steps, decisions, what was found
  phase-04-plan.md              how Phase 4 was built: steps, decisions, what was found; the example for a plan
  phase-04b-test-caching.md     Phase 4.5: caching of the checks
  phase-04b-plan.md             how Phase 4.5 is built: what was measured, the steps, the decisions, the risks
  phase-05-plan.md              how Phase 5 is built: what was found, five pull requests, the decisions, the risks
  phase-06-plan.md              how Phase 6 is built: what was found, the boards, four pull requests, the decisions, the risks
  reference/
    functional-inventory.md     every input, output, export and message of the desktop app
    r3f-notes.md                3D fixes already paid for in solar-mms-modeller
    map-providers.md            imagery and search providers: terms, cost, recommendation
    demo-numbers.md             expected results of the Pune demo, for tests
```

The design system is in `docs/design/` (index: `docs/design/README.md`), with the mockup sources and previews.
