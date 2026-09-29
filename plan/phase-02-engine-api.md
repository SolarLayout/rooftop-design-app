# Phase 2: engine and stateless API

**Status:** in progress. Part 1 is built on branch `feat/engine` (engine, format 2, first endpoints);
weather, `/design` over SSE, exports and memoisation remain. **Depends on:** phase 1.

## Goal
Every calculation of the desktop app is reachable over HTTP, with the same numbers, and no server state.

## Scope
- Copy `rooftop_core` and `samples/` from `../rooftop-design` (commit `bf2cb67`) into `apps/api/src/rooftop_core`.
  Each file keeps a header naming its source. No import from, or path to, the old repo.
- Copy the engine tests; they must pass unchanged.
- Engine changes needed for the web (keep them small, each with a test):
  - `read_pan`, `read_ond`, `read_kmz`, `read_dxf`, CSV weather: accept text or bytes, not only a path.
  - Weather download cache moves from `~/.rooftop_design` to an in-process cache; tests stay offline.
  - Progress callback on `Design.prepare()` and `run_options()`.
  - Export writers return bytes.
- `.rtd` format 2: embeds PAN, OND and CSV text. Format 1 opens; absolute paths in it are reported as
  "file not included, choose it again".
- Fix while here (found by the inventory, see section 7 there): saved overrides restored on open;
  cable label follows the system voltage; PDF cable schedule paginates instead of stopping at 28 strings.

## Endpoints (all POST bodies carry the whole project; nothing is remembered between calls)

| Method and path | Returns | Typical time |
|---|---|---|
| `GET /health` | version | |
| `GET /demo` | the Pune demo project | |
| `POST /equipment/module`, `/equipment/inverter` | parsed PAN / OND fields, derived coefficients, notes | ms |
| `POST /roof/import` | roof outline, obstacles, heights that were missing | ms |
| `POST /layout` | modules (footprint, row, tilt, z), keep-out polygons with the obstacle that causes each, usable area, pitch, GCR, profile angle | 50 ms |
| `POST /sun` | sun positions for a day; shadow polygons for a time | ms |
| `POST /weather` | 8,760 h weather, horizon, summary | network |
| `POST /design` (SSE) | progress events, then layout + shading summary + series range + options with full results | about 10 s |
| `POST /export/{pdf,dxf,kmz,csv,sld}` | file bytes | 1 to 3 s |

- Pydantic models mirror the dataclasses. OpenAPI is the source for `packages/api-types` (`bun gen:api`).
- Memoisation per D6: LRU keyed by a hash of the inputs each stage depends on (layout, weather, shading).
- Errors: 422 with a field path for bad input; engine messages pass through verbatim (they are user-facing).

## Deliverables
- API with tests; `packages/api-types` generated and used by a typed client in `apps/web/lib/api`.
- `reference/demo-numbers.md` values asserted in an API test.

## Acceptance
- `pytest` green, no network. import-linter: `rooftop_core` imports neither FastAPI nor any web code.
- `/design` on the demo returns option A = 29 x 22 x 1, 357.28 kWp, 617.8 MWh, PR 86.6 %.
- Without `system_voltage` the response has the layout and shading, no options, and the reason.
- Two identical requests to a freshly started server give identical results.

## Out of scope
UI. Multi-user concerns. Persistence.

## As built, part 1

### What exists
- **Engine** `apps/api/src/rooftop_core`, copied from `rooftop-design` at `bf2cb67`. Every copied module names
  its source in its first line. The samples (`Test.PAN`, `Test-S.ond`, `pune_weather.json`) are package data in
  `rooftop_core/samples`, byte for byte.
- **Tests** `apps/api/tests/engine`: the six desktop test files that need no Qt, unchanged, and new ones for
  everything below. `test_demo_numbers.py` asserts `reference/demo-numbers.md`.
- **Files without a file system**: `parse_pan`, `parse_ond`, `decode_pvsyst`; `read_kmz` and `read_dxf` take
  bytes or text; `parse_csv`; every export has a `*_bytes` form.
- **Weather**: downloads are cached in an object the caller can replace (`WeatherCache`, default
  `MemoryWeatherCache`, sixteen sites). Nothing is written to the home directory. `Design.load_weather`
  downloads only with `download=True`; otherwise a project without weather raises `WeatherNotLoaded`.
- **Project format 2**: `pan_text`, `ond_text`, `weather_csv_text`. Formats 1 and 2 are read, others refused
  (`UnsupportedProjectFormat`). A PAN or OND path that is not there raises `MissingEquipmentFile` in `Design`.
  `Design(project, local_files=False)` never opens a path, which is what the API uses.
- **Progress**: `Design.prepare(on_progress)` and `Design.run_options(on_progress)` with `ProgressEvent(step,
  fraction)`; step names as in the inventory, section 2.8.
- **Fixed** (inventory, section 5): the PDF cable schedule continues on further pages (28 rows next to the bill
  of materials, then 40 per page); the DC cable label names the system voltage. Saved overrides already came
  back through `to_json` and `from_json`; tests now pin it.
- **New engine modules** (no copied numerical code changed): `errors`, `paths`, `progress`, `keepout_parts`
  (keep-out by obstacle), `sunpath` (sun positions, sunrise, sunset).
- **API** `apps/api/src/rooftop_api`: `schemas/` (Pydantic), `convert.py`, `errors.py` (the one error shape),
  `services/` (the work), `routers/` (HTTP only).

| Method and path | Operation | Measured on the demo |
|---|---|---|
| `GET /health` | `getHealth` | |
| `GET /demo` | `getDemo` | 8 ms, 484 kB |
| `POST /equipment/module` | `parseModule` | ms |
| `POST /equipment/inverter` | `parseInverter` | ms |
| `POST /roof/import` | `importRoof` | ms |
| `POST /layout` | `computeLayout` | 0.12 s with the weather in the body, 194 kB |
| `POST /sun` | `computeSun` | ms |

### Deviations and decisions to confirm
1. The copied engine files and the six ported test files keep the layout of their source: `ruff format`
   leaves them out and the line length is not checked in them (`apps/api/pyproject.toml`). Every other lint
   rule applies. New modules are formatted and checked in full. Formatting the copies later is one command.
2. `Design.load_weather` no longer downloads on its own (see above). The desktop app did.
3. `prepare` computes the hourly shading itself and hands it to `precompute`, so that "Computing hourly
   shading" and "Applying the losses" can be reported apart. Same inputs, same results.
4. A KMZ is recognised by its content, not by the ending of its name. Files that cannot be read raise a
   `ValueError` that names the file. A KML of more than 20 MB inside a KMZ is refused.
5. `GET /demo` embeds the text of the bundled PAN and OND under their names, so the project carries all it
   needs. `demo_project()` of the engine is as on the desktop.
6. Conversion goes both ways for what a request carries (roof, obstacle, array, losses, project). Module,
   inverter and layout only come back from the engine: no request carries them.
7. The API checks that numbers are finite and physically possible (latitude, percentages, sizes above zero).
   The narrower ranges of the desktop controls (inventory, section 1) are left to the screens.
8. Coordinates in answers are rounded to a micrometre.
9. `/layout` refuses a roof outline that crosses itself and a PAN without the size of the module. The engine
   lays out part of such a roof in silence (130 positions on the demo roof drawn as a bow tie), and 448,220
   positions of no area for a module without size.
10. The DC cable label names the system voltage as it is, also at 600 V.
11. `pypdf` is a development dependency: tests read the text of the PDF.

### Known faults, not fixed here
- **CSV weather with GHI alone cannot be read.** The split into DNI and DHI fails (`ValueError` from pandas:
  the sun positions are indexed half an hour later than the irradiance). Copied as it is from `bf2cb67`;
  recorded as a strict `xfail` in `tests/engine/test_weather_sources.py`. CSV with DNI and DHI works. To fix
  before `POST /weather` takes CSV.
- **Heights cannot come from a DXF.** The height is read from `h=2.5` in the name, and a DXF layer name may
  hold neither `=` nor `:`. Every obstacle of a DXF gets 1.0 m and is listed as missing.
- **Large roofs are slow.** 2 km x 1 km (inside the range of the desktop controls) takes 29 s in `/layout`
  and gives 526,070 positions. Limits belong to phase 11.

### What remains of this phase
- `POST /weather` (PVGIS, NASA POWER, CSV), with the cache per D6.
- `POST /design` over SSE: progress events, then layout, shading summary, series range and options.
- `POST /export/{pdf,dxf,kmz,csv,sld}` on the `*_bytes` writers.
- Memoisation per D6 (layout, weather, shading).
- The typed client in `apps/web/lib/api`.
- The acceptance test "two identical requests to a freshly started server give identical results" for
  `/design`; for `/demo` and `/layout` it is tested.
