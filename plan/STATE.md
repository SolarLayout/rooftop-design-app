# State of the work

The single place that says where the project stands. Every session reads it first and updates it last.
Keep it short and true. History belongs in git and in the phase files, not here.

**Last updated:** 2026-09-29, end of session 3. Phase 3 is in progress: fonts, tokens, the kit page and nine
components are merged; the two boards of round 4 are approved and on the canvas; resume prompt 003 is written.

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 0 Design | Direction approved. 16 boards drawn and approved | More screens to draw, listed in `phase-00-design.md`; Tabs is one of them |
| 1 Foundation | Done, merged (PR #1) | |
| 2 Engine and API | Done (PR #7, PRs #11 to #23) | What exists, what was decided, what was found: `phase-02-engine-api.md`, "As built" |
| 3 Design system and shell | In progress (PRs #24 to #29) | What exists, what remains: `phase-03-design-system-shell.md`, "As built, so far" |
| 4 to 11 | Not started | |

## In flight

No open branch and no open pull request. `main` is green.

Nothing waits for the owner. He approved both boards of round 4, with the choices in them (decision D32),
and keeps Tabs in the phase (decision D33). The boards are on the canvas.

One thing to confirm with the owner: when the boards were published, the canvas was reported as private,
readable by its owner only. `CLAUDE.md` and the documents of the design say it is open to anyone with the
link. Nothing was changed in them.

## What the web app has today

| Thing | Where |
|---|---|
| Fonts, from the repo | `apps/web/app/fonts` |
| Design tokens, 223, and Tailwind made of them alone | `apps/web/app/globals.css`; the document is `docs/design/design-tokens.md` |
| Components: Button, ButtonLink, IconButton, Icon, StatusMark, Card, Stat, Segmented, Switch, NumberField, Stepper | `apps/web/components/ui` |
| `/kit`: every component in every state, development only | `apps/web/app/kit` |
| The typed client of the API | `apps/web/lib/api` |
| The home page | A placeholder |

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

Work order: `plan/resume/003-phase-3-components-stores-shell.md`.

1. Phase 3, each part as its own pull request, test first:
   the guard against raw values reads `*.ts` too; Slider and RangeSlider; Sheet; ProgressRing and Skeleton;
   Tooltip and Toast; Select; Dialog; FileDrop; Table; the three stores; the data flow; the routes with
   their placeholders; the shell with the vitals in all their states, the drawer of notes, the project
   switcher and the state of saving; the browser tests of the shell on 390, 834 and 1440.
2. Tabs: draw it, show it to the owner, build it after his approval.
3. Close Phase 3: acceptance, "As built", status, state, record.
4. Three questions for the owner and Prasanta, listed under "Open items" as "Owner and domain expert". None
   blocks Phase 3.
5. Phase 4: find the roof on the map and outline it (the flagship).
6. In parallel with any phase: the screens still to draw (Phase 0).

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
| Esri key | In `apps/web/.env.local` as `NEXT_PUBLIC_ESRI_API_KEY`. Never read, print or commit the file. Referrers: `http://localhost:4700`, `http://127.0.0.1:4700`. Expires about 28 Sep 2027 |
| Design canvas | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy. 16 boards. To add a board: read `project/canvas.json` of the canvas, then publish the board and the index to it |
| Design system | `docs/design/` |

## Open items (not blocking)

| Item | Where it belongs |
|---|---|
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
| The names of the demo's equipment are shown as the files state them: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560", "WattPower Systems Pvt.Ltd WP-330KTL-H1". The mockups show "Insolation INA-144MHC-TF-560". The files were not touched | Phase 5 or 7: a shorter name is for the screen to make, or the owner gives the names to show |
| NASA POWER is asked for the year 2023 and the times of a CSV are read as UTC, as on the desktop; neither can be set in a request | Phase 8, with the weather source |
| The report (PDF) prints the date of the server's day | Phase 9 |
| pytest takes 157 s here and the pull request check 4 min 33 s to 6 min 43 s (session 3), of the 10 it may take. Most of it is design runs of 1.5 s each; they could share their shading through a memo | When the check passes 7 minutes. It is close: do it as the first pull request of the next session if one more check is over 6 min 30 s |
| The guard against raw values reads `*.tsx` in `app` and `components`. `button-look.ts` and `field-look.ts` keep classes in `.ts` files, which it does not read. They hold no raw value today | Phase 3, first pull request of the next session: let the guard read `*.ts` as well, its own test left out |
| A push was refused once with "Permission denied (publickey)" and went through when tried again | Watch; nothing to do |
| The `/api` rewrite passes the events of a design run on as they come in `next dev`. A production build (`next start`) and a proxy in front of it have not been tried | Phase 11, deployment |
| One design run keeps a worker thread busy for 12 s and the process holds up to 576 MB of kept results. How many runs at once a server must carry is not decided | Phase 11 |

## Past sessions

| # | Date | Record |
|---|---|---|
| 1 | 2026-09-29 | `plan/sessions/001/record.md`, `plan/sessions/001/owner-messages.md` |
| 2 | 2026-09-29 | `plan/sessions/002/record.md`, `plan/sessions/002/owner-messages.md` |
| 3 | 2026-09-29 | `plan/sessions/003/record.md`, `plan/sessions/003/owner-messages.md` |

## Closed, do not reopen

- Documents alone go to `main` directly; code goes through a pull request (D26).
- Legal check on the map stack: approved by the owner (D18).
- Map provider: Esri plus Overture (D13).
- The old desktop app's layout and look: rejected. Never a reference.
- DC cable label: by the system voltage as chosen (D25).
- Fonts come from the repo, never from Google (D27).
- Tailwind is made of the design tokens alone (D28).
