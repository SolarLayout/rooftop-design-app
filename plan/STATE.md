# State of the work

The single place that says where the project stands. Every session reads it first and updates it last.
Keep it short and true. History belongs in git and in the phase files, not here.

**Last updated:** 2026-09-29, end of session 1, after Phase 2 part 1 was merged.

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 0 Design | Direction approved. 14 boards drawn | More screens to draw, listed in `phase-00-design.md` |
| 1 Foundation | Done, merged (PR #1) | |
| 2 Engine and API | Part 1 done, merged (PR #7). Part 2 not started | What exists and what remains: `phase-02-engine-api.md`, "As built, part 1" |
| 3 to 11 | Not started | |

## In flight

Nothing. `main` is green and there is no open branch or pull request.

## Next, in order

1. Phase 2, part 2. Work order: `plan/resume/001-phase-2-engine-api.md` (it starts at its step 2).
   - Done: CSV weather with GHI alone; the design run at the desktop app's speed (about 11.5 s)
   - Done: `POST /weather`
   - Done: `POST /design` with progress over SSE
   - Done: `POST /export/{pdf,dxf,kmz,csv,sld}`
   - Done: a KMZ exported by the app comes back as the roof it was
   - Done: memoisation (decision D6)
   - The typed client in `apps/web/lib/api`
   - Done: decision D24, the demo bundles the real equipment files
   - Tests with the equipment fixtures
   - Then mark Phase 2 done
2. Phase 3: design system as code and the app shell.
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
| starlette warns that httpx with its TestClient is deprecated in favour of `httpx2` | Phase 2 |
| Esri's imagery tile host answered one request without a referrer; the key is scoped, not secret. Watch usage on the Esri dashboard | Phase 4 |
| The key needs the production address added to its referrers when the app gets one | Deployment |
| `tools/imagery-preview/` is a throwaway test page on port 4700; remove it when Phase 4 lands | Phase 4 |
| Option captions "Fills the inverter" and "Lower clipping" in the Strings mockup are derived in the web app; the engine does not produce them | Phase 7 |
| String placement on the roof in the Strings mockup is illustrative | Phase 7 uses the engine's strings |
| Heights cannot come from a DXF: a layer name may hold neither `=` nor `:`. Every DXF obstacle gets 1.0 m and is listed as missing | Phase 5, with the owner |
| `/layout` has no size limit: a roof of 2 km by 1 km takes 29 s | Phase 11 |
| Progress of a design run has fixed shares and no progress inside the options step | Phase 2, part 2 |
| Real PAN and OND files are in `apps/api/tests/fixtures/equipment/` with a README; no test uses them yet | Phase 2, part 2 |
| The engine places the sun at the middle of the hour for every source. The bundled PVGIS hours agree with the sun at the time stamp itself (GHI, DNI and DHI close to 0.8 W/m2 there, 43.6 W/m2 half an hour later). Not changed; a question for Prasanta | Owner and domain expert |
| A CSV with GHI alone is split by Erbs: on the Pune year beam 1,435 and diffuse 823 kWh/m2, where PVGIS has 2,000 and 550. Say so where a CSV is loaded? | Phase 8, with the owner |

## Past sessions

| # | Date | Record |
|---|---|---|
| 1 | 2026-09-29 | `plan/sessions/001/record.md`, `plan/sessions/001/owner-messages.md` |

## Closed, do not reopen

- Legal check on the map stack: approved by the owner (D18).
- Map provider: Esri plus Overture (D13).
- The old desktop app's layout and look: rejected. Never a reference.
- DC cable label: by the system voltage as chosen (D25).
