# SolarLayout Rooftop (web): build plan

Rebuild of the desktop app at `../rooftop-design` as a browser app: Next.js + React Three Fiber front end,
stateless Python API. One file per phase. Work the phases in order; each one ends with something to show.

## How to resume in a new session

1. Read this file, then the first phase whose status is not `done`.
2. Read `reference/functional-inventory.md` before touching any feature: it is the contract for
   "nothing is lost from the desktop app".
3. Read `reference/r3f-notes.md` before any 3D work.
4. When a phase is finished, set its status here and note anything that changed in its file.

## Phases

| # | Phase | File | Status |
|---|---|---|---|
| 0 | IA and visual design (HTML mockups, approval) | `phase-00-design.md` | direction approved; more screens to draw |
| 1 | Monorepo, tooling, one-command dev stack | `phase-01-foundation.md` | done |
| 2 | Engine and stateless API | `phase-02-engine-api.md` | not started |
| 3 | Design system and app shell | `phase-03-design-system-shell.md` | not started |
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
| D17 | The word "bankable" is not used anywhere in the product; it belongs to utility-scale ground-mount | Owner |

## Open for approval

| # | Question | Default if no answer |
|---|---|---|
| none | | |

## Layout of this folder

```
plan/
  README.md                     this file
  phase-NN-*.md                 one per phase: goal, scope, deliverables, acceptance
  reference/
    functional-inventory.md     every input, output, export and message of the desktop app
    r3f-notes.md                3D fixes already paid for in solar-mms-modeller
    map-providers.md            imagery and search providers: terms, cost, recommendation
    demo-numbers.md             expected results of the Pune demo, for tests
```

The design system is in `docs/design/` (index: `docs/design/README.md`), with the mockup sources and previews.
