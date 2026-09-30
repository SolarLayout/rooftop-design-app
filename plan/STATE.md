# State of the work

The single place that says where the project stands. Every session reads it first and updates it last.
Keep it short and true. History belongs in git and in the phase files, not here.

**Last updated:** 2026-09-30, end of session 5. Phase 3 is done: the design system as code, the stores, the
data flow, the routes and the shell are merged (pull requests #24 to #33). Phase 4 is next. No resume prompt
is written for it: the owner asks for one when he wants it.

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 0 Design | Direction approved. 17 boards drawn and approved | More screens to draw, listed in `phase-00-design.md`. The canvas and the repo hold the same boards |
| 1 Foundation | Done, merged (PR #1) | |
| 2 Engine and API | Done (PR #7, PRs #11 to #23) | What exists, what was decided, what was found: `phase-02-engine-api.md`, "As built" |
| 3 Design system and shell | Done (PRs #24 to #33) | What exists, what was decided, what was found: `phase-03-design-system-shell.md`, "As built". How its second half was built: `phase-03-rest-plan.md` |
| 4 to 11 | Not started | |

## In flight

No open branch and no open pull request. `main` is green.

One thing waits for the owner, and blocks nothing: a look at decisions D38 and D39, which session 5 took
itself. See "Open items".

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
| Routes | `/` (a placeholder), `/studio/[lens]`, `/performance`, `/handover/[item]` (the shell, with placeholders inside) |

A workspace opens the demo when no design is open, runs it, and shows its numbers in the vitals of the
Studio. Nothing can be edited yet: no screen commits an edit. The flow that follows an edit is there and
tested.

## What the API gives today

| Method and path | Client function (`apps/web/lib/api`) |
|---|---|
| `GET /health`, `GET /demo` | `getHealth`, `getDemo` |
| `POST /equipment/module`, `/equipment/inverter` | `parseModule`, `parseInverter` |
| `POST /roof/import` | `importRoof` |
| `POST /layout`, `POST /sun` | `computeLayout`, `computeSun` |
| `POST /weather` | `loadWeather` |
| `POST /design`, progress as events | `runDesign` |
| `POST /export/{pdf,dxf,kmz,csv,sld}` | `exportDesign` |

On the demo: a design run takes 12 s, 4 s after a change of a loss or of the voltage, 0.2 s when nothing
changed; an export 0.2 to 0.9 s after a run.

## Next, in order

1. Phase 4: find the roof on the map and outline it (the flagship). `plan/phase-04-find-and-outline.md`.
   Before it: the memo for the shading, if a check of a pull request passes 6 min 30 s (see "Open items").
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
| `bun check` | About 7 minutes here: pytest 152 s, the browser tests 240 s (1,025 of them) |
| Esri key | In `apps/web/.env.local` as `NEXT_PUBLIC_ESRI_API_KEY`. Never read, print or commit the file. Referrers: `http://localhost:4700`, `http://127.0.0.1:4700`. Expires about 28 Sep 2027 |
| Design canvas | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open to anyone with the link). 17 boards, the same as `docs/design/mockups`. To add or change a board: read `project/canvas.json` of the canvas, then publish the board and the index to it, from a folder shaped as `project/<name>`. The publish went through on 2026-09-30 when the owner asked for it |
| Design system | `docs/design/` |

## Open items (not blocking)

| Item | Where it belongs |
|---|---|
| Decisions D38 (the vitals bar is in the Studio only) and D39 (two widths where the top bar gives way) were taken by session 5, not by the owner | The owner, when he looks at the shell. If he overrules one, it is changed in `plan/README.md` and in the shell |
| Shown and cannot be used, each until its phase: Present (Phase 10); in the project switcher New design and Import a drawing (Phase 4), Open a project and Save a copy (Phase 9 or 10) | The phase that builds each makes it a link or a button |
| The shell has no toaster: nothing says anything yet. `Toaster` takes a `className`; on phone the toasts stand above the tab bar (`bottom-tabbar`) | The first phase that has something to say |
| The drawer of the notes comes and goes without motion; the tokens have 240 ms for panels | Phase 11, or when the owner asks |
| The inspector of the Studio is a placeholder that stands three times in the page, once for each size | Phase 5 decides how the real one is mounted |
| The Layers button of the rail, the view controls and the time control of the stage are not there | Phase 5 (stage), Phase 6 (time) |
| `.github/workflows/e2e.yml` has never been run. It runs on Linux, and the screens have baselines for `darwin` only: its first run will write its own and fail | Phase 11, or when browser tests are wanted in CI |
| A fresh clone has not been tried | Phase 11 |
| Esri's imagery tile host answered one request without a referrer; the key is scoped, not secret. Watch usage on the Esri dashboard | Phase 4 |
| The key needs the production address added to its referrers when the app gets one | Deployment |
| `tools/imagery-preview/` is a throwaway test page on port 4700; remove it when Phase 4 lands | Phase 4 |
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
| pytest takes 152 s here and the check of a pull request 3 min 33 s to 6 min 43 s (sessions 3 to 5), of the 10 it may take. In session 5 it took 4 min 18 s to 6 min 29 s on the same code of the API: the time is of the machine of the check, not of the change. Most of it is design runs of 1.5 s each; they could share their shading through a memo | When a check passes 6 min 30 s: the memo, as a pull request of its own, before anything else. It came within a second of it three times in session 5 |
| One browser test failed once in a full run and passes alone, five times of five: `kit-sheet.e2e.ts`, "and by keyboard: the keyboard stops at what scrolls", on desktop. The key End was pressed and the sheet did not scroll. It did not fail again in the nine full runs after | Watch. If it fails again: make the test wait until the content can scroll before the key, as a pull request of its own |
| The browser tests of the shell run the design of the demo on the server of the tests, on three sizes at once. A test waits for a result up to 90 s; under that load the layout alone took more than 5 s once | Watch. If they become slow or unsteady: one run before the tests begin, in the global setup, so that the server has kept its results |
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
