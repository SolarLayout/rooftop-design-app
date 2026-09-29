# Phase 2: engine and stateless API

**Status:** in progress. Part 1 is merged (PR #7, 2026-09-29: engine, format 2, first endpoints);
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
10. The DC cable label names the system voltage as it is, also at 600 V. Confirmed by the owner (D25).
11. `pypdf` is a development dependency: tests read the text of the PDF.

### Known faults, not fixed here
- **Heights cannot come from a DXF.** The height is read from `h=2.5` in the name, and a DXF layer name may
  hold neither `=` nor `:`. Every obstacle of a DXF gets 1.0 m and is listed as missing.
- **Large roofs are slow.** 2 km x 1 km (inside the range of the desktop controls) takes 29 s in `/layout`
  and gives 526,070 positions. Limits belong to phase 11.

## As built, part 2

### What exists
| Method and path | Operation | Measured |
|---|---|---|
| `POST /weather` | `loadWeather` | PVGIS 5.8 s and NASA POWER 2.3 s from the services, 0.03 s from the cache; CSV 0.01 s; 477 kB |
| `POST /design` | `runDesign` | Demo at 1500 V: 12 s, result 0.30 MB. Events arrive as they happen, also through the web app's `/api` rewrite |
| `POST /export/{kind}` | `exportDesign` | After a design run of the same project: PDF 0.9 s (100 kB), DXF 0.2 s (260 kB), KMZ 0.2 s (20 kB), SLD 0.2 s (64 kB), CSV 0.2 s (493 kB). Without that run before: 12 s more |

- **`POST /weather`** takes the source, the site and, for CSV, the text of the file. It answers with the
  weather as a project carries it (`weather_json`), a summary of those hours, and notes for the user.
  Downloads are kept per process for 64 sites (D6); the answer is the same with and without them, tested.
- **CSV weather is checked** (`rooftop_core/csv_weather.py`) before the reader runs. The reader lets through
  a time it cannot read, a gap in the wind, an hour that is there twice and a file without rows; each is
  now refused with the row and what to do. Notes, not refusals: fewer hours than a year; beam and diffuse
  worked out from GHI.
- **Errors of the services**: a refusal of the site (PVGIS over the sea) is 422 `no_weather_for_site` with
  the words of the service; a service that fails or cannot be reached is 502, in the one error shape.
- **Recorded answers** of PVGIS and NASA POWER for Pune are in `apps/api/tests/fixtures/weather`. The
  recorded PVGIS answer, read by the engine, is the bundled `pune_weather.json`, hour by hour.
- The weather cache of the engine takes a lock: a server answers several requests at a time.

- **`POST /design`** answers with a stream of server-sent events: `progress` (step and fraction) as often as
  a step begins, then `result`, or `error` when the run failed. Each event carries its `type` in its data, so
  the generated types tell them apart. A project that cannot be run (no weather, a file not included, a roof
  that crosses itself, an unusable CSV) is refused with 422 as JSON before the stream begins.
- **The result** has the layout and its read-outs, the weather summary, the shading over all positions and
  per position, the equipment with its notes, the sizing temperatures and where they come from, the series
  range, and every option with its full results: energy, loss chain, monthly, P-values, 25 years, strings
  with inverter and MPPT, load of every MPPT, bill of materials, cable schedule, summary, verdict. Choosing
  another option needs no request. The 8,760 hours are not in it: they are the CSV export.
- **Without options the result says why** (`no_options`): no system voltage, no string length fits, no
  position on the roof, too few positions for a string. Without a system voltage nothing is chosen, also
  when the project names an option.
- **New in the engine**: `readouts.py` (verdict, notes, load of every MPPT, summary for any option; the
  wording of the desktop window, which built them itself) and `shade_summary.py` (near and far shading for
  any positions). The shading summary gives the figures of the loss chain for the modules of each of the
  five options of the demo to 0.001 %.

- **Memoisation (D6)**, `rooftop_core/memo.py`. Two stages are kept per process: the hourly shading (two
  thirds of a run; up to 512 MB, the demo takes 55 MB) and the options with their simulations (up to
  64 MB, the demo takes 4 MB). The layout is not kept: it takes 0.06 s. A key is the fingerprint of what
  its stage depends on. The shading does not depend on irradiance, losses, albedo, inverter or voltage, so
  an edit of those reuses it. What is kept is handed out read-only.

  | Request on the demo | Time |
  |---|---|
  | Without a system voltage, nothing kept | 8.1 s |
  | Then 1500 V chosen | 4.1 s |
  | The same request again | 0.2 s |
  | Soiling changed from 2 to 3 % | 4.0 s |

  Proof that dropping it changes nothing but speed: `tests/engine/test_memo.py`. One memo sees eleven edits
  one after the other; each result is compared, to the last bit, with a run that has no memo. A second
  test holds, for 36 inputs, which of the two keys each one changes.

- **`POST /export/{pdf,dxf,kmz,csv,sld}`** takes the project and answers with the file, named after the
  project (`Pune-demo-report.pdf`). The project must name its chosen option and the design must have it;
  the engine alone would take the first option in silence. Without a system voltage the answer says so.
  Drawings (PDF, SLD) are made one at a time: matplotlib keeps its figure in one place per process.
- **The same request gives the same content.** CSV and SLD are the same byte for byte. PDF, DXF and KMZ
  bear the time they were made (and the DXF two identifiers made by chance), as such files do; what they
  draw and say is the same. The PDF prints the date of the day.

- **Decision D24**: the engine bundles the module and the inverter of the demo under their real names,
  `insolation-ina-144mhc-tf-560.PAN` and `wattpower-wp-330ktl-h1.OND`, as the owner supplied them. A project
  that names no module or inverter gets these two. `Test.PAN` and `Test-S.ond` of the desktop app are now
  in `apps/api/tests/fixtures/equipment`; the tests copied from the desktop app run on them. The two pairs
  differ in names only, and a run with either gives the same results to the last bit. The names are shown as
  the files state them: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560" and "WattPower Systems
  Pvt.Ltd WP-330KTL-H1". A shorter name on a screen is for the screen to make.

- **The test client runs on `httpx2`** (development dependency, in place of `httpx`): starlette gives up
  `httpx` for its test client and warned in every run. The warning is now an error of the check.

- **Designs with the real equipment files** (`tests/engine/test_real_equipment.py`): a monofacial module
  (no rear gain), a module that is not twin half-cell (a shaded module is lost whole), a Voc coefficient
  that the file states, a module without a LID value (1.5 %), a central inverter (series range 25 to 29 by
  its MPPT minimum of 938 V; every option far below target), an inverter without any current limit, an
  inverter that states its current per MPPT, and a module or an inverter rated for 1000 V in a 1500 V
  system. Variants are made in the test from a real file with one line changed.
- **A current limit that is not known is not shown as zero.** With an OND that has neither a current per
  MPPT nor `IMaxDC`, the desktop wording said "1 × 13.58 A ≤ 0.0 A" and the table showed a limit of 0.0 A.
  The note now says that the OND gives no limit and asks for the datasheet value; the limit in the table is
  empty, with an exclamation mark.
- **Decision D25 is pinned** for 600, 1000 and 1500 V on the cable schedule and the bill of materials, and
  with equipment rated below the system voltage: the label names the system voltage as chosen.

- **Progress inside the two long steps.** The shading reports after every fiftieth of the run it has come
  further (it counts the distinct positions of the sun it has worked out: 1,097 on the demo); the options
  report after every simulation. A run sends 60 events at most. Shading that was kept has nothing to
  report but its beginning, so a run that finds its results kept sends fewer events; its result is the same.
  `shading.compute` and `options.build_options` take a listener; no calculation changed.

### Left as in the desktop app
- NASA POWER is asked for the year 2023; the times of a CSV are read as UTC (inventory, section 5, gap 7).
  Neither can be set in a request yet.

### Fixed in part 2
- **CSV weather with GHI alone is read.** The split into DNI and DHI (Erbs) failed because the sun positions
  carried an index half an hour later than the irradiance. The values now go in without that index; the sun
  stays at the middle of the hour. CSV with DNI and DHI, PVGIS and NASA weather do not pass through the
  changed line. Tests: `tests/engine/test_weather_sources.py`.

- **The design run is as fast as in the desktop app.** It took about 16 s here and about 11 s there. The
  cause was the build of Python, not numpy or scipy. Measured on the demo, same engine:

  | Python | numpy, scipy | Design run |
  |---|---|---|
  | 3.12.8 from python.org (what this repo ran on) | 2.5.3, 1.18.1 | 16.2 s |
  | 3.12.8 from python.org | 2.4.6, 1.17.1 | 16.3 s |
  | 3.12.8 managed by uv | 2.5.3, 1.18.1 | 11.9 s |
  | 3.12.13 managed by uv | 2.4.6, 1.17.1 | 12.0 s |
  | 3.12.13 managed by uv | 2.5.3, 1.18.1 | 11.2 s |
  | 3.11.11 managed by uv, the desktop app's environment | 2.4.6, 1.17.1 | 11.4 s |

  The repo now pins Python 3.12.13 (`apps/api/.python-version`; uv does not read one above the project) and uv takes only the Python it manages
  (`python-preference` in `apps/api/pyproject.toml`). After the change: 11.7 s. No result changed.

- **A KMZ exported by the app comes back as the roof it was.** The export holds the modules in use as
  placemarks, and the import took every outline but the largest for an obstacle: the demo came back with
  638 obstacles of 1.0 m named "Module n". The import now leaves out the folder the export puts them in
  ("Modules" with their number). An outline named "Module" anywhere else is an obstacle as before.

### Found in part 2, for the domain expert (continued below)
- **The strings are sized with the Voc of the one-diode model, also when the PAN states a coefficient.**
  ABi AB340-72PHC states -0.286 %/degC; the model gives -0.334 %/degC. At 11.9 degC: Voc 47.85 V by the
  model, 47.57 V by the stated coefficient. The screen shows the stated one. Here the model is the more
  careful. For Emmvee both agree (-0.224 and -0.225). As in the desktop app; not changed.

### Found in part 2, for the domain expert
- **The split of Erbs is not what PVGIS has.** The Pune year given as GHI alone comes back with beam
  1,435.4 and diffuse 822.7 kWh/m2; PVGIS has 1,999.6 and 549.9 for the same hours. The model differs, not
  the timing. Energy from a CSV with GHI alone will differ from the same site with measured DNI and DHI.
- **The bundled PVGIS hours agree with the sun at the time stamp, not half an hour later.** GHI, DNI and DHI
  of `pune_weather.json` close to 0.8 W/m2 (rms) with the sun at the time stamp, and to 43.6 W/m2 with the
  sun at the middle of the hour, where the engine places it for every source. Nothing was changed: the
  numbers of the engine are as confirmed on the desktop app.

### What remains of this phase
- The typed client in `apps/web/lib/api`.
