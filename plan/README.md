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
| 0 | IA and visual design (HTML mockups, approval) | `phase-00-design.md` | direction approved; 16 boards approved; more screens to draw |
| 1 | Monorepo, tooling, one-command dev stack | `phase-01-foundation.md` | done |
| 2 | Engine and stateless API | `phase-02-engine-api.md` | done |
| 3 | Design system and app shell | `phase-03-design-system-shell.md` | in progress: fonts, tokens, kit, nine components (PRs #24 to #29) |
| 4 | Find the roof on the map and outline it (flagship) | `phase-04-find-and-outline.md` | not started |
| 5 | Studio: 3D roof, Roof and Array lenses | `phase-05-studio-roof-array.md` | not started |
| 6 | Studio: Sun lens | `phase-06-studio-sun.md` | not started |
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
  reference/
    functional-inventory.md     every input, output, export and message of the desktop app
    r3f-notes.md                3D fixes already paid for in solar-mms-modeller
    map-providers.md            imagery and search providers: terms, cost, recommendation
    demo-numbers.md             expected results of the Pune demo, for tests
```

The design system is in `docs/design/` (index: `docs/design/README.md`), with the mockup sources and previews.
