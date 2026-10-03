# State of the work

The single place that says where the project stands. Every session reads it first and updates it last.
Keep it short and true. History belongs in git and in the phase files, not here.

**Last updated:** 2026-10-03, session 12, at the close of Phase 8: #58 (the page, the KPIs, the summary, the states; the figures
after the year), #59 (the loss chain; the candidates in threads), #60 (the charts) and #61 (the weather source, a CSV with its
notes, weather for a design without any, the assumptions) are merged. `main` is green.

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 0 Design | Direction approved. 32 boards in the repo, all approved | More screens to draw, listed in `phase-00-design.md`. The canvas at claude.ai holds 27 of them (`docs/design/README.md`) |
| 1 Foundation | Done, merged (PR #1) | |
| 2 Engine and API | Done (PR #7, PRs #11 to #23) | What exists, what was decided, what was found: `phase-02-engine-api.md`, "As built" |
| 3 Design system and shell | Done (PRs #24 to #33) | What exists, what was decided, what was found: `phase-03-design-system-shell.md`, "As built". How its second half was built: `phase-03-rest-plan.md` |
| 4 Find and outline | Done (sessions 6 and 7: #35, #36, #38; the memo #37) | What exists, what was decided, what was found: `phase-04-find-and-outline.md`, "As built". How it was built: `phase-04-plan.md` |
| 4.5 Caching of the checks | Done (session 8: #39, #40, #41) | What exists, the numbers before and after, what was found: `phase-04b-test-caching.md`, "As built". How it was built: `phase-04b-plan.md` |
| 5 Studio, 3D roof, Roof and Array lenses | Done (session 9: #42 to #47) | What exists, what was decided, what was found: `phase-05-studio-roof-array.md`, "As built". How it was built: `phase-05-plan.md` |
| 6 Studio, Sun lens | Done (session 10: #48 to #52) | What exists, what was decided, what was found: `phase-06-studio-sun.md`, "As built". How it was built: `phase-06-plan.md` |
| 7 Studio, Strings lens | Done (session 11: #53 to #57) | What exists, what was decided, what was found: `phase-07-studio-strings.md`, "As built". How it was built: `phase-07-plan.md` |
| 8 Performance | Done (session 12: #58 to #61) | What exists, what was decided, what was found: `phase-08-performance.md`, "As built". How it was built: `phase-08-plan.md` |
| 9 to 11 | Not started | |

## In flight

Nothing. No branch stands on `main`; `main` is green.

## What the web app has today

| Thing | Where |
|---|---|
| Fonts, from the repo | `apps/web/app/fonts` |
| Design tokens, and Tailwind made of them alone | `apps/web/app/globals.css`; the document is `docs/design/design-tokens.md` |
| Numbers of the design that code needs (times, gaps, the pause before a run) | `apps/web/components/ui/design-numbers.ts`; the document is the same, "Numbers in code" |
| Components: Button, ButtonLink, IconButton, Icon, StatusMark, Card, Stat, Segmented, Switch, NumberField, Stepper, Slider, RangeSlider, Sheet, SheetGrip, ProgressRing, RunStep, Skeleton, Tooltip, Toast, Toaster, Select, FloatingPanel, Dialog, FileDrop, Table, Tabs | `apps/web/components/ui` |
| The kit: every component and every part of the shell in every state, development only | `/kit`, `/kit/part-2`, `/kit/shell`; `apps/web/app/kit`, `apps/web/components/kit` |
| The typed client of the API | `apps/web/lib/api` |
| Stores without React: the project, the results, the view | `apps/web/lib/stores` |
| The data flow: what follows a committed edit; opening the demo | `apps/web/lib/flow/design-flow.ts` |
| Formats: the quantities of the vitals, the place of a design | `apps/web/lib/format` |
| The places that have an address: workspaces, lenses, items of Handover | `apps/web/lib/routes.ts` |
| The shell: top bar, navigation, project switcher, state of saving, vitals, notes; the frame of the Studio | `apps/web/components/shell`; around `apps/web/app/(workspaces)` |
| The stores for React, and the hooks that read them | `apps/web/components/shell/stores.tsx` |
| Routes | `/` (a placeholder with "Find my roof"), `/find` (the map, the search, the outline), `/studio/[lens]` (Roof, Array, Sun and Strings built), `/performance` (built), `/handover/[item]` (the shell, with placeholders inside) |
| The map: the provider, Esri, the search's reading of what is typed, the scale bar, the states without a map | `apps/web/lib/map` |
| The outline: the frame of metres, the measures, snapping, typed lengths, the rectangle, the history, the nudge, the obstacles, the roof by hand, the reducer | `apps/web/lib/outline` |
| Find and outline: the screen, the map (MapLibre), the search, the outline drawn on the map, the panel, the tools (the ways to outline while the roof is open; the obstacles once it is closed), the height dialog, the obstacle list, the roof type, Build; the roof by hand and the plan drawn without a map | `apps/web/components/find` |
| The 3D scene: the canvas, the building, the obstacles, the ground of imagery, the camera and its presets, the modules instanced, the kept-clear areas, the sun light, the projector that places DOM over the canvas, the pointer (selection, hover, the drag) | `apps/web/components/scene`; the maths apart in `apps/web/lib/scene` (the adapter of the engine's metres, pick, drag, handles, projection, the stage store) |
| The Studio: the stage (title, read-outs, text equivalent, the plan without WebGL, labels, callout, handles, the chip of a failed layout), the view controls, the Roof lens inspector (the roof, the obstacles, the heights to review), the Array lens inspector (the module card, mounting, spacing, the window), undo and redo by key | `apps/web/components/studio`; the words and the fields in `apps/web/lib/studio`; `apps/web/lib/roof-card.ts` |
| The Sun lens: the time on the stage of every lens (the pill) and the timeline, play, the keys, the day; the Sun at the time; shading over the year; the shade map and its legend; On the roof; the states | `components/studio/Time.tsx`, `SunInspector.tsx`, `SunShading.tsx`, `ShadeLegend.tsx`, `SunMarks.tsx`; `lib/studio/sun-time.ts`, `play.ts`, `sun-figures.ts` |
| The scene's sun: the day of `/sun` looked up at the view's hour; the light held to the engine's shadows (the bias) and to the palette (no tone mapping, the sun and the sky to π); the sun path; the engine's shadow outlines; the modules coloured per instance by the shade map | `components/scene/SunLight.tsx`, `SunPath.tsx`, `ShadowOutlines.tsx`, `use-sun.ts`, `use-shade-map.ts`; `lib/scene/sun-day.ts`, `sun-light.ts`, `sun-path.ts`, `sun-marks.ts`, `shadow-outlines.ts`, `shade-map.ts` |
| The Strings lens: the inverter (Replace from an OND, its limits and cabling), the system voltage (a decision card before one), modules in series, the options and your own, the MPPT loading, the sizing temperatures and the Voc coefficient; its states | `components/studio/StringsInspector.tsx`, `InverterCard.tsx`, `SystemVoltage.tsx`, `SeriesRange.tsx`, `StringOptions.tsx`, `MpptTable.tsx`, `SizingTemperatures.tsx`, `InverterLimits.tsx`; `lib/studio/strings-view.ts`, `series-bar.ts`, `option-cards.ts`, `custom-fields.ts`, `sizing-fields.ts`, `inverter-fields.ts`, `mppt-table.ts` |
| The strings on the roof: the glass by string, MPPT or inverter, the legend, the inverters, a string traced and selected | `lib/scene/string-colours.ts`, `string-legend.ts`, `inverter-markers.ts`; `components/scene/InverterMarkers.tsx`; `components/studio/StringLegend.tsx`, `InverterChips.tsx` |
| What an edit asks for: the layout only for the roof, the array or the module (not its albedo); nothing for an option chosen | `lib/flow/edit-parts.ts` |
| Performance: the header (the line of the run, the option switch, the weather select), the KPIs with the P-values, the loss chain as a cascade with its editable steps and its readout, the energy by month and the 25 years with their tables and tooltips, the degradation, the assumptions, the summary; the states | `apps/web/components/performance`; the logic in `apps/web/lib/performance` |
| Weather for a design that has none, loaded by the flow once per edit into the document of that edit (`amend`); the weather source switched; a CSV read with its notes | `lib/flow/design-flow.ts`, `lib/stores/project-store.ts`, `lib/performance/weather-source.ts`, `components/performance/WeatherSelect.tsx`, `WeatherCsvDialog.tsx` |
| Charts: `ValueTooltip`, `Tabs` with a head, `Table` with a total row and a column of words, `Stat` looks `hero` and `figure`, `Segmented` and `Select` with marks, `NumberField` inside the chain and a chip | `apps/web/components/ui` |
| Import a drawing (KMZ, KML, DXF with its units and its place) from the project switcher | `apps/web/components/shell/ImportDrawing.tsx`; `apps/web/lib/studio/import-drawing.ts` |
| Overture's footprints: the pinned release, the ring of a footprint | `apps/web/lib/map/overture.ts`; the extract tool `tools/footprints.ts`; the fixture `e2e/fixtures/footprints-pune.pmtiles` |
| MapLibre's worker, served by the app | `apps/web/public/maplibre-gl`, copied by `tools/vendor-maplibre.ts` |

A workspace opens the demo when no design is open, runs it, and shows its numbers in the vitals of the
Studio. A roof found on the map and outlined, with its obstacles and their heights, or typed by its measurements
with or without a map, becomes the design that is open (Build), and the Studio opens on the Roof lens; its roof
type is the first committed edit of the app, and Edit leads back to the map with the outline and the obstacles
shown. Until Phase 10 keeps designs on the device, a reload of the Studio loses a roof built on
the map and opens the demo (D44).

## What the API gives today

| Method and path | Client function (`apps/web/lib/api`) |
|---|---|
| `GET /health`, `GET /demo` | `getHealth`, `getDemo` |
| `POST /equipment/module`, `/equipment/inverter` | `parseModule`, `parseInverter` |
| `POST /roof/import` | `importRoof` |
| `POST /roof/from-map`, `POST /roof/on-map` | `roofFromMap`, `roofOnMap` |
| `POST /layout`, `POST /sun` | `computeLayout`, `computeSun` |
| `POST /weather` | `loadWeather` |
| `POST /design`, progress as events | `runDesign` |
| `POST /export/{pdf,dxf,kmz,csv,sld}` | `exportDesign` |

On the demo: a design run takes 12 s, also after a change of the weather source (the shading computed again); 1.7 s after a
change of a loss, of Uc or of the voltage (the candidates simulated in threads); 0.28 s after a change of degradation, the CO2
factor, the exceedance levels or a sigma (worked out after the memo); 0.2 s when nothing changed; an export 0.2 to 0.9 s after a
run. The test stack's API starts with downloads of weather off (`ROOFTOP_WEATHER_DOWNLOADS=off`); the dev stack downloads.

## Next, in order

1. Phase 9, Handover and exports (`plan/phase-09-handover.md`): the plan first, the way `phase-08-plan.md` was written, then the
   boards it lacks (Handover on tablet and phone, the previews, the states), then the pull requests. Work order:
   `plan/resume/012-phase-9-handover.md`.
2. Three questions for the owner and Prasanta, listed under "Open items" as "Owner and domain expert".
3. In parallel with any phase: the screens still to draw (Phase 0).

## Facts about this machine and setup

| Thing | Value |
|---|---|
| Repo | `/Users/arunkpatra/codebase/rooftop-design-app`, GitHub `SolarLayout/rooftop-design-app` (private) |
| Desktop app to copy from (read-only) | `/Users/arunkpatra/codebase/rooftop-design`, commit `bf2cb67`. GitHub `SolarLayout/rooftop-design` |
| 3D reference project (read-only) | `/Users/arunkpatra/codebase/solar-mms-modeller`. GitHub `SolarLayout/solar-mms-modeller` |
| Access to those two | They are outside this repo. A session can read them only after the owner adds them with `/add-dir`. Ask for that when the slice needs them |
| Node | 26.10.0 at `/opt/homebrew/bin/node` (`.nvmrc`) |
| bun, uv, Python | bun 1.3.14; uv; Python 3.12.13, the build that uv manages (`apps/api/.python-version`, `apps/api/pyproject.toml`) |
| Playwright | `@playwright/test` 1.52.0; its browser (chromium-1169) is already installed. `@axe-core/playwright` 4.13.0 |
| Baselines of the screens | `e2e/baselines/darwin`, made on this machine. Renew with `bun tools/with-node.ts playwright test <name> --update-snapshots` in `e2e/`, after looking at the new picture |
| `bun check` | Every step a turbo task, skipped when its inputs have not changed since it was last green (`.turbo/`); the summary says which and why. Unchanged tree: under 2 s. Everything changed, or `--fresh`: about 29 minutes here (1,680 browser tests since Phase 8; 20 to 22 with the 1,544 of Phase 7) (pytest 118 s untraced, 139 s when testmon's data is rebuilt; the browser tests 814 s, 1,345 of them, since the Studio draws in software WebGL on three sizes at once). Inside pytest, testmon runs only the tests a change can have changed, plus the sentinel `test_demo_numbers.py`; a change to the check's own code (`tools/check.ts`, `tools/check/**`) runs everything. While the browser tests run, nothing of `apps/web` or `apps/api` may be edited: the test stack reloads them live, and the browser tests would see the half-made change; while the proofs run (the last step), nothing at all, because they copy the working tree into their worktree. Drafts go to the scratchpad until it ends. Details: `phase-04b-test-caching.md`, "As built" |
| The check on GitHub | `.turbo/cache` restored from the most recent run of the branch or of `main`, saved by every run; a push to `main` runs `--fresh`; pytest runs whole and untraced there (`ROOFTOP_CHECK_SELECT=0`). A push that changes a document alone: about 25 s in all |
| Esri key | In `apps/web/.env.local` as `NEXT_PUBLIC_ESRI_API_KEY`. Never read, print or commit the file. Referrers: `http://localhost:4700`, `http://127.0.0.1:4700`. Expires about 28 Sep 2027 |
| Design canvas | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy. 21 boards, the same as `docs/design/mockups`. To add or change a board: read the canvas itself (not only a file of it), then publish from a folder shaped `project/<name>` in the scratchpad: `root` that folder, `file_path` its `project/canvas.json`, the boards in `files` by their `project/` paths. A `file_path` outside such a folder lands at the root of the artifact, not under `project/`. The publish is refused by the permission system while the canvas is shared with the link; the owner made it private for the publishes of 2026-09-30 and shares it again after |
| Design system | `docs/design/` |

## Open items (not blocking)

| Item | Where it belongs |
|---|---|
| Shown and cannot be used, each until its phase: Present (Phase 10); in the project switcher New design and Import a drawing (Phase 4), Open a project and Save a copy (Phase 9 or 10) | The phase that builds each makes it a link or a button |
| The shell has no toaster: nothing says anything yet. `Toaster` takes a `className`; on phone the toasts stand above the tab bar (`bottom-tabbar`) | The first phase that has something to say |
| The drawer of the notes comes and goes without motion; the tokens have 240 ms for panels | Phase 11, or when the owner asks |
| The obstacle list of Find shows each height and does not edit it (the Roof lens does); trees are not drawn on the map; the by-hand roof's corners are not dragged on the map | Phase 11, or when the owner asks |
| The Esri key is baked into the page at build time: the "no key" state is seen only on a build without it, and the tests reach the no-map states through "no WebGL" | Phase 11 |
| The Layers button of the rail is not there | Phase 11 |
| A mouse wheel over a DOM handle of the selected obstacle does not reach the canvas: zooming with the pointer exactly on a handle does nothing; the roof beside it zooms | Phase 11, or when the owner asks |
| The frame rate with 1,068 modules on this machine's GPU: 56 fps while orbiting (the mark was 60), 60.1 while the timeline is dragged, 58.3 while the day plays; a mid laptop has not been measured | When the owner has one at hand |
| On Bedrock the session has no Artifact tool: the design canvas at claude.ai cannot be read or published from here. The boards are approved from the previews in `docs/design/previews`, and the canvas is behind the repo by ImportHeights with the DXF's place, the six boards of Phase 6 and the six of Phase 7 (the redrawn Sun and Strings lenses and ten new) | When a session has the tool again: publish the repo's boards |
| On phone the chip "INV-1" can stand over an edge label of the roof (the demo's 90.0 m) | Phase 11, or when the owner asks |
| The plan drawn without WebGL shows no strings: the Strings lens there has its inspector alone | Phase 11 |
| The option captions follow the engine's rule of decision 11 (`phase-07-plan.md`); "Fills the inverter" and "Lower clipping" were the old board's words, kept | The owner may give others |
| A desktop `.rtd` whose chosen option was its custom one by "n×s×k" opens with the offered option of that key, its custom kept (the custom's key is "custom") | Known |
| `.github/workflows/e2e.yml` has never been run. It runs on Linux, and the screens have baselines for `darwin` only: its first run will write its own and fail | Phase 11, or when browser tests are wanted in CI |
| A fresh clone has not been tried | Phase 11 |
| The sun path's arc reaches the top of the stage at noon, and at 10:30 its marker is off the canvas on desktop: the stage's camera frames the roof lower than the boards' projection. The marker's callout shows only while the marker is on the canvas | Phase 11, or when the owner asks (a framing of the Sun lens) |
| The scene's shadows read softer than the boards' at a low sun: a shadow is the sky's light alone, a third darker, as set (#51) | When the owner asks |
| The permission system refuses an agent `bun dev:bg --profile test` ("Interfere With Workloads"): agents write code and unit tests; the session runs the browser for them | Known |
| Esri's imagery tile host answers with the key from the test stack's port 4710 too, which is not among the key's referrers: the key is scoped, not secret. Watch usage on the Esri dashboard | Deployment |
| MapLibre counts its zoom on tiles of 512: its zoom 18 is the native zoom 19 of Esri's tiles of 256. A press on the map stops its flight: the map says `aria-busy` while it moves, and a test waits for it | Known; written in the plan |
| A colour token named like a width utility (`--color-handle` beside `border-handle`) makes Tailwind read the width as a colour: the colour is `--color-handle-fill` | Known; a trap for the next token |
| The key needs the production address added to its referrers when the app gets one | Deployment |
| Heights cannot come from a DXF: a layer name may hold neither `=` nor `:`. Every DXF obstacle gets 1.0 m and is listed to review in the Roof lens | Done in #44 as a list to review; a DXF convention for heights is the owner's call |
| `/layout` has no size limit: a roof of 2 km by 1 km takes 29 s | Phase 11 |
| The engine places the sun at the middle of the hour for every source. The bundled PVGIS hours agree with the sun at the time stamp itself (GHI, DNI and DHI close to 0.8 W/m2 there, 43.6 W/m2 half an hour later). Not changed; a question for Prasanta | Owner and domain expert |
| A CSV with GHI alone is split by Erbs: on the Pune year beam 1,435 and diffuse 823 kWh/m2, where PVGIS has 2,000 and 550. The API says so in a note when such a file is loaded, and Performance shows it (Phase 8); a CSV without air temperature takes 25 °C, and the note says to enter the site's ambient | Owner and domain expert |
| The names of the demo's equipment are shown as the files state them: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560", "WattPower Systems Pvt.Ltd WP-330KTL-H1". The mockups show "Insolation INA-144MHC-TF-560". The module card of the Array lens shows the PAN's names as they are (Phase 5, decision 14) | The owner gives the names to show; the Strings lens follows the files too (Phase 7, decision 15) |
| NASA POWER is asked for the year 2023 and the times of a CSV are read as UTC, as on the desktop; neither can be set in a request. The select says "NASA POWER 2023" and the CSV dialog says the times are read as UTC (Phase 8, decision 19) | Phase 11, or when the owner asks |
| The report (PDF) prints the date of the server's day | Phase 9 |
| The memo for the shading in the tests (#37, session 7). Measured before: pytest 151 s here; 66 hourly shadings for 15 distinct inputs and 208 simulations for 66; the repeats cost 76 s and 10 s, of which 48 s are the proofs of the memo, of progress reporting and of a fresh server, which must stay without a memo. Now one memo (`apps/api/tests/kept.py`) serves the whole pytest session, the engine tests and the API alike: pytest 122 s here, the demo's shading computed once. On GitHub the same code took 155 s in one run and 279 s in the next, and 274 s after the memo: the runners vary two-fold, so the mark of 6 min 30 s is a poor rule there; the checks of #37 and #38 took 5 min 38 s and 5 min 33 s. Four workers with pytest-xdist would give 66 s here (measured, not adopted: a dependency and a change of its own) | If a check passes the mark again: pytest-xdist, pinned, as a pull request of its own, after the owner's yes. Since Phase 4.5 the mark matters only when `apps/api` changed: a push that leaves it alone skips pytest |
| `build.e2e.ts` "Edit shows the design's outline on the map" failed once on tablet in a full check (a 5 s wait on Edit's navigation under load) and passes alone | Watch. If it fails again: make the test wait for the navigation with the run's timeout, as a pull request of its own |
| The charts' keyboard tests run on desktop alone: on tablet the focus can scroll the frame and the moving page takes the tooltip away by design; one run in eighteen failed so | Known; written in the phase file |
| The Performance line of the run says "PVGIS weather", not "PVGIS TMY weather" (decision 2 of the plan): the longer form wraps at 1440 | The owner may prefer the longer words and a two-line header |
| On phone the assumptions row "Rear shading and mismatch" wraps its label and puts its field on the next line | Phase 11, or when the owner asks |
| Uc entered shows "Use the roof type's" without the roof type's value: once entered, that value is in no answer of the API | Phase 11, or when the owner asks (the API could say the default beside the value) |
| One browser test failed once in a full run and passes alone, five times of five: `kit-sheet.e2e.ts`, "and by keyboard: the keyboard stops at what scrolls", on desktop. The key End was pressed and the sheet did not scroll. It did not fail again in the nine full runs after | Watch. If it fails again: make the test wait until the content can scroll before the key, as a pull request of its own |
| In session 6, with a load average above 50 from Chrome, Cursor and the desktop app, full runs of the browser tests took 310 to 340 s and one kit test failed at a time, a different one each run (the toast's place on tablet, the tabs' arrows on phone, the number field on phone); each passed alone, and the runs of the map's own suites passed | Watch. The tests are sound alone; the machine's load is the owner's. If a run on a quiet machine fails one, make that test wait for its result, as a pull request of its own |
| The browser tests of the shell run the design of the demo on the server of the tests, on three sizes at once. On 2026-09-30 eight phone tests waited more than 90 s on a cold server; since #34 the global setup runs the demo once before the tests begin | Done in #34. Watch that it stays steady |
| A push was refused once with "Permission denied (publickey)" and went through when tried again | Watch; nothing to do |
| The `/api` rewrite passes the events of a design run on as they come in `next dev`. A production build (`next start`) and a proxy in front of it have not been tried | Phase 11, deployment |
| One design run keeps a worker thread busy for 12 s and the process holds up to 576 MB of kept results. How many runs at once a server must carry is not decided | Phase 11 |

## Past sessions

| # | Date | Record |
|---|---|---|
| 1 | 2026-09-29 | `plan/sessions/001/record.md`, `plan/sessions/001/owner-messages.md` |
| 2 | 2026-09-29 | `plan/sessions/002/record.md`, `plan/sessions/002/owner-messages.md` |
| 3 | 2026-09-29 | `plan/sessions/003/record.md`, `plan/sessions/003/owner-messages.md` |
| 4 | 2026-09-29 | `plan/sessions/004/record.md`, `plan/sessions/004/owner-messages.md` |
| 5 | 2026-09-30 | `plan/sessions/005/record.md`, `plan/sessions/005/owner-messages.md` |
| 6 | 2026-09-30 | `plan/sessions/006/record.md`, `plan/sessions/006/owner-messages.md` |
| 7 | 2026-09-30 | `plan/sessions/007/record.md`, `plan/sessions/007/owner-messages.md` |
| 8 | 2026-09-30 | `plan/sessions/008/record.md`, `plan/sessions/008/owner-messages.md` |
| 9 | 2026-09-30 to 2026-10-02 | `plan/sessions/009/record.md`, `plan/sessions/009/owner-messages.md` |
| 10 | 2026-10-02 | `plan/sessions/010/record.md`, `plan/sessions/010/owner-messages.md` |
| 11 | 2026-10-02 | `plan/sessions/011/record.md`, `plan/sessions/011/owner-messages.md` |
| 12 | 2026-10-02 to 2026-10-03 | `plan/sessions/012/record.md`, `plan/sessions/012/owner-messages.md` |

## Closed, do not reopen

- Documents alone go to `main` directly; code goes through a pull request (D26).
- Legal check on the map stack: approved by the owner (D18).
- Map provider: Esri plus Overture (D13).
- The old desktop app's layout and look: rejected. Never a reference.
- DC cable label: by the system voltage as chosen (D25).
- Fonts come from the repo, never from Google (D27).
- Tailwind is made of the design tokens alone (D28).
- The design of Tabs (D35).
- The rest of Phase 3 was two pull requests, split after the components; inside each, every step a commit (D34, D36).
- Before a system voltage the vitals speak in the words of the API (D37).
- The vitals bar is in the Studio only (D38); the two widths where the top bar gives way (D39).
- The check's cache is turbo's, for every step; pytest-testmon selects here and not on GitHub; pytest-xdist waits for
  the owner's yes (session 8, `phase-04b-plan.md` decisions 1, 4, 13; D53).
- The figures after the year are worked out after the memo; the candidates are simulated in threads (Phase 8, decisions 5 and 17).
