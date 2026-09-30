# State of the work

The single place that says where the project stands. Every session reads it first and updates it last.
Keep it short and true. History belongs in git and in the phase files, not here.

**Last updated:** 2026-09-30, session 7, after the memo (#37) and the boards of step 13 of Phase 4. The plan of the phase is `plan/phase-04-plan.md`
(three pull requests, fifteen steps). Pull request #35 (the map, the search, the route `/find`; steps 1 to 5)
is merged, and so is the second, #36 (steps 6 to 12: the geometry, the three ways to outline, the loupe, Build,
the Roof lens's card). The acceptance of the phase is met by their tests. The memo for the shading is merged (#37).
The two boards of step 13 are drawn and on `main`; they wait for the owner's yes before steps 14 and 15.

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 0 Design | Direction approved. 17 boards drawn and approved | More screens to draw, listed in `phase-00-design.md`. The canvas and the repo hold the same boards |
| 1 Foundation | Done, merged (PR #1) | |
| 2 Engine and API | Done (PR #7, PRs #11 to #23) | What exists, what was decided, what was found: `phase-02-engine-api.md`, "As built" |
| 3 Design system and shell | Done (PRs #24 to #33) | What exists, what was decided, what was found: `phase-03-design-system-shell.md`, "As built". How its second half was built: `phase-03-rest-plan.md` |
| 4 Find and outline | In progress: steps 0 to 12 done (session 6), the boards of step 13 drawn (session 7); steps 14 and 15 remain | Plan: `phase-04-plan.md`. Merged: #35, #36, #37 (the memo). To come: the obstacles on the map with their heights and the entry by hand (pull request 3), once the boards are approved. "As built": `phase-04-find-and-outline.md` |
| 5 to 11 | Not started | |

## In flight

No open branch and no open pull request. `main` is green. Waiting for the owner: a yes to the two boards of step 13
(`docs/design/previews/find-obstacles.png`, `find-by-hand.png`; on the canvas too).

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
| Routes | `/` (a placeholder with "Find my roof"), `/find` (the map, the search, the outline), `/studio/[lens]`, `/performance`, `/handover/[item]` (the shell, with placeholders inside) |
| The map: the provider, Esri, the search's reading of what is typed, the scale bar, the states without a map | `apps/web/lib/map` |
| The outline: the frame of metres, the measures, snapping, typed lengths, the rectangle, the history, the nudge, the reducer | `apps/web/lib/outline` |
| Find and outline: the screen, the map (MapLibre), the search, the outline drawn on the map, the panel, the tools, the roof type, Build | `apps/web/components/find` |
| The Roof lens's inspector: the card of the roof with Edit, the roof type as a committed edit | `apps/web/components/studio/RoofInspector.tsx`; the words of the card in `apps/web/lib/roof-card.ts` |
| Overture's footprints: the pinned release, the ring of a footprint | `apps/web/lib/map/overture.ts`; the extract tool `tools/footprints.ts`; the fixture `e2e/fixtures/footprints-pune.pmtiles` |
| MapLibre's worker, served by the app | `apps/web/public/maplibre-gl`, copied by `tools/vendor-maplibre.ts` |

A workspace opens the demo when no design is open, runs it, and shows its numbers in the vitals of the
Studio. A roof found on the map and outlined becomes the design that is open (Build), and the Studio opens
on the Roof lens; its roof type is the first committed edit of the app, and Edit leads back to the map with
the outline shown. Until Phase 10 keeps designs on the device, a reload of the Studio loses a roof built on
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

On the demo: a design run takes 12 s, 4 s after a change of a loss or of the voltage, 0.2 s when nothing
changed; an export 0.2 to 0.9 s after a run.

## Next, in order

1. Phase 4, pull request 3: steps 14 and 15 to the boards of step 13, once the owner says yes to them, then the
   close of the phase (`plan/phase-04-plan.md`, "Done means"). Work order: `plan/resume/006-shading-memo-and-phase-4-rest.md`,
   second slice.
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
| `bun check` | About 6 minutes here: pytest 119 s, the browser tests 330 s (1,152 of them) |
| Esri key | In `apps/web/.env.local` as `NEXT_PUBLIC_ESRI_API_KEY`. Never read, print or commit the file. Referrers: `http://localhost:4700`, `http://127.0.0.1:4700`. Expires about 28 Sep 2027 |
| Design canvas | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy. 21 boards, the same as `docs/design/mockups`. To add or change a board: read the canvas itself (not only a file of it), then publish from a folder shaped `project/<name>` in the scratchpad: `root` that folder, `file_path` its `project/canvas.json`, the boards in `files` by their `project/` paths. A `file_path` outside such a folder lands at the root of the artifact, not under `project/`. The publish is refused by the permission system while the canvas is shared with the link; the owner made it private for the publishes of 2026-09-30 and shares it again after |
| Design system | `docs/design/` |

## Open items (not blocking)

| Item | Where it belongs |
|---|---|
| Shown and cannot be used, each until its phase: Present (Phase 10); in the project switcher New design and Import a drawing (Phase 4), Open a project and Save a copy (Phase 9 or 10) | The phase that builds each makes it a link or a button |
| The shell has no toaster: nothing says anything yet. `Toaster` takes a `className`; on phone the toasts stand above the tab bar (`bottom-tabbar`) | The first phase that has something to say |
| The drawer of the notes comes and goes without motion; the tokens have 240 ms for panels | Phase 11, or when the owner asks |
| The inspector of the Studio is a placeholder that stands three times in the page, once for each size | Phase 5 decides how the real one is mounted |
| The Layers button of the rail, the view controls and the time control of the stage are not there | Phase 5 (stage), Phase 6 (time) |
| `.github/workflows/e2e.yml` has never been run. It runs on Linux, and the screens have baselines for `darwin` only: its first run will write its own and fail | Phase 11, or when browser tests are wanted in CI |
| A fresh clone has not been tried | Phase 11 |
| Esri's imagery tile host answers with the key from the test stack's port 4710 too, which is not among the key's referrers: the key is scoped, not secret. Watch usage on the Esri dashboard | Deployment |
| MapLibre counts its zoom on tiles of 512: its zoom 18 is the native zoom 19 of Esri's tiles of 256. A press on the map stops its flight: the map says `aria-busy` while it moves, and a test waits for it | Known; written in the plan |
| A colour token named like a width utility (`--color-handle` beside `border-handle`) makes Tailwind read the width as a colour: the colour is `--color-handle-fill` | Known; a trap for the next token |
| The key needs the production address added to its referrers when the app gets one | Deployment |
| Option captions "Fills the inverter" and "Lower clipping" in the Strings mockup are derived in the web app; the engine does not produce them | Phase 7 |
| String placement on the roof in the Strings mockup is illustrative | Phase 7 uses the engine's strings |
| Heights cannot come from a DXF: a layer name may hold neither `=` nor `:`. Every DXF obstacle gets 1.0 m and is listed as missing | Phase 5, with the owner |
| `/layout` has no size limit: a roof of 2 km by 1 km takes 29 s | Phase 11 |
| The engine places the sun at the middle of the hour for every source. The bundled PVGIS hours agree with the sun at the time stamp itself (GHI, DNI and DHI close to 0.8 W/m2 there, 43.6 W/m2 half an hour later). Not changed; a question for Prasanta | Owner and domain expert |
| A CSV with GHI alone is split by Erbs: on the Pune year beam 1,435 and diffuse 823 kWh/m2, where PVGIS has 2,000 and 550. The API says so in a note when such a file is loaded | Owner and domain expert; Phase 8 shows the note |
| Strings are sized with the Voc of the one-diode model, also when the PAN states a coefficient (ABi: stated -0.286, model -0.334 %/degC). The screen shows the stated one | Owner and domain expert; Phase 7 has the field to enter a value |
| The names of the demo's equipment are shown as the files state them: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560", "WattPower Systems Pvt.Ltd WP-330KTL-H1". The mockups show "Insolation INA-144MHC-TF-560". The files were not touched. The shell shows no equipment | Phase 5 or 7: a shorter name is for the screen to make, or the owner gives the names to show |
| NASA POWER is asked for the year 2023 and the times of a CSV are read as UTC, as on the desktop; neither can be set in a request | Phase 8, with the weather source |
| The report (PDF) prints the date of the server's day | Phase 9 |
| The memo for the shading in the tests (#37, session 7). Measured before: pytest 151 s here; 66 hourly shadings for 15 distinct inputs and 208 simulations for 66; the repeats cost 76 s and 10 s, of which 48 s are the proofs of the memo, of progress reporting and of a fresh server, which must stay without a memo. Now one memo (`apps/api/tests/kept.py`) serves the whole pytest session, the engine tests and the API alike: pytest 122 s here, the demo's shading computed once. On GitHub the same code took 155 s in one run and 279 s in the next, and 274 s after the memo: the runners vary two-fold, so the mark of 6 min 30 s is a poor rule there; the check of #37 took 5 min 38 s. Four workers with pytest-xdist would give 66 s here (measured, not adopted: a dependency and a change of its own) | If a check passes the mark again: pytest-xdist, pinned, as a pull request of its own, after the owner's yes |
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
