# State of the work

The single place that says where the project stands. Every session reads it first and updates it last.
Keep it short and true. History belongs in git and in the phase files, not here.

**Last updated:** 2026-09-29, end of session 2, after Phase 2 was closed.

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 0 Design | Direction approved. 14 boards drawn | More screens to draw, listed in `phase-00-design.md` |
| 1 Foundation | Done, merged (PR #1) | |
| 2 Engine and API | Done (PR #7, PRs #11 to #23) | What exists, what was decided, what was found: `phase-02-engine-api.md`, "As built" |
| 3 to 11 | Not started | |

## In flight

Nothing. `main` is green and there is no open branch or pull request.

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

1. Three questions for the owner and Prasanta, listed under "Open items" as "Owner and domain expert". None
   blocks Phase 3.
2. Phase 3: design system as code and the app shell. No resume prompt is written yet; the owner asks for one.
3. Phase 4: find the roof on the map and outline it (the flagship).
4. In parallel with any phase: the screens still to draw (Phase 0).

## Facts about this machine and setup

| Thing | Value |
|---|---|
| Repo | `/Users/arunkpatra/codebase/rooftop-design-app`, GitHub `SolarLayout/rooftop-design-app` (private) |
| Desktop app to copy from (read-only) | `/Users/arunkpatra/codebase/rooftop-design`, commit `bf2cb67`. GitHub `SolarLayout/rooftop-design` |
| 3D reference project (read-only) | `/Users/arunkpatra/codebase/solar-mms-modeller`. GitHub `SolarLayout/solar-mms-modeller` |
| Access to those two | They are outside this repo. A session can read them only after the owner adds them with `/add-dir`. Ask for that when the slice needs them |
| Node | 26.10.0 at `/opt/homebrew/bin/node` (`.nvmrc`) |
| bun, uv, Python | bun 1.3.14; uv; Python 3.12.13, the build that uv manages (`apps/api/.python-version`, `apps/api/pyproject.toml`) |
| Playwright | `@playwright/test` 1.52.0; its browser (chromium-1169) is already installed |
| Esri key | In `apps/web/.env.local` as `NEXT_PUBLIC_ESRI_API_KEY`. Never read, print or commit the file. Referrers: `http://localhost:4700`, `http://127.0.0.1:4700`. Expires about 28 Sep 2027 |
| Design canvas | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open to anyone with the link) |
| Design system | `docs/design/` |

## Open items (not blocking)

| Item | Where it belongs |
|---|---|
| `.github/workflows/e2e.yml` has never been run | Phase 11, or when browser tests are wanted in CI |
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
| pytest takes 157 s here and the pull request check 3 to 6 minutes, of the 10 it may take. Most of it is design runs of 1.5 s each; they could share their shading through a memo | When the check passes 7 minutes |
| The `/api` rewrite passes the events of a design run on as they come in `next dev`. A production build (`next start`) and a proxy in front of it have not been tried | Phase 11, deployment |
| One design run keeps a worker thread busy for 12 s and the process holds up to 576 MB of kept results. How many runs at once a server must carry is not decided | Phase 11 |

## Past sessions

| # | Date | Record |
|---|---|---|
| 1 | 2026-09-29 | `plan/sessions/001/record.md`, `plan/sessions/001/owner-messages.md` |
| 2 | 2026-09-29 | `plan/sessions/002/record.md`, `plan/sessions/002/owner-messages.md` |

## Closed, do not reopen

- Legal check on the map stack: approved by the owner (D18).
- Map provider: Esri plus Overture (D13).
- The old desktop app's layout and look: rejected. Never a reference.
- DC cable label: by the system voltage as chosen (D25).
