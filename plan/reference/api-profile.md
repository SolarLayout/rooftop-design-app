# The engine's profile

> **Phase 13 (2026-10-05) changed these numbers.** The tables below are the engine as copied from the desktop app. After
> #102 to #104, in the API's Linux image with one thread: the roof at the limit 4.4 s and 664 MB (132 s and 5,475 MB
> there before), the demo 1.99 s and 261 MB; on Lambda the limit 6.3 s and 926 MB. The detail is in
> `plan/phase-13-optimization.md`, "As built". The profile is now taken in the image:
> `docker run --rm -v "$PWD/tools:/work/tools:ro" -w /work rooftop-api python -m tools.profile_engine limit --threads 1`
> from `apps/api`, after building the image (`apps/api/Dockerfile`).

Phase 11, step 36, for issue #76 (the API lean in time and memory for AWS Lambda). The demo and the roof at the 30,000 m²
limit, each run as the API runs a design and with no memo: the time by step, the peak memory, what the memo would hold, the
report drawn once, what a loss edit costs, and the hot spots. Every number is from a run on 2026-10-04, by the command given
with it; nothing is estimated unless it says so.

## How it was measured

- The machine: Apple M1 Ultra, 20 cores, 64 GB, macOS 27.0.1; uv's CPython 3.12.13 (`apps/api/.python-version`). Not a
  Lambda: a Lambda's share of a CPU at a given memory, its allocator (glibc on Amazon Linux) and its cold start are not
  measured here and are said so below.
- The script: `apps/api/tools/profile_engine.py`, run from `apps/api` with `uv run python -m tools.profile_engine
  [demo|limit] [--hot-spots] [--threads N]`. Its reading is tested in `tests/engine/test_profile_engine.py`. The roof at
  the limit is `tools/roof_at_the_limit.py`'s: 300 by 100 m, the demo's place, equipment, weather and 1500 V, no obstacles
  (the parapet is there).
- The steps are timed from the engine's progress events (`rooftop_core/progress.py`), each from its first event to the next
  step's first, as `roof_at_the_limit.py` times them. The figures after the year (`simulation.after_the_year`) send no
  event: they are worked out once more over the options after the run and timed apart.
- Memory, two readings, both given because they say different things:
  - **Peak memory of the process** is `resource.getrusage(RUSAGE_SELF).ru_maxrss` read right after each step: the process's
    high-water mark, which never falls. It is what a Lambda is billed and killed on. It includes the interpreter and the
    imports (numpy, pandas, scipy, shapely, pyproj, matplotlib, pvlib: 187 MB before any run).
  - **Peak of the stage's allocations** is `tracemalloc`'s peak over one stage run alone, in a second run of that stage. It
    counts what Python and numpy allocate and nothing else (numpy reports its arrays to tracemalloc), so it says what the
    stage itself takes, where `ru_maxrss` only says how high the process has been.
- The options are simulated in threads (`options.SIMULATION_THREADS`, 8). `--threads 1` runs them one after the other, to
  show what the threads cost in memory. The hot spots are profiled one after the other in any case: cProfile sees the main
  thread alone.
- The memo's sizes are those `rooftop_core/memo.py` keeps: the shading's four arrays' `nbytes`, the options' hourly frames
  and per-string shade.

## The demo

`uv run python -m tools.profile_engine demo --hot-spots` and `... demo --threads 1`. 3,600 m², 790 positions in 6 rows,
five options, 29x22x1 chosen, 617.8 MWh/yr.

| Step | Seconds, 8 threads | Seconds, 1 thread | Peak memory of the process after the step, 8 threads | 1 thread |
|---|---|---|---|---|
| Fitting modules on the roof | 0.05 | 0.06 | 190 MB | 191 MB |
| Loading PVGIS TMY weather | 0.01 | 0.01 | 190 MB | 191 MB |
| Computing hourly shading for every module | 7.40 | 7.72 | 511 MB | 510 MB |
| Applying the losses | 0.03 | 0.03 | 518 MB | 520 MB |
| Sizing strings and simulating the options (7 candidates) | 0.88 | 4.08 | 3,465 MB | 2,122 MB |
| The figures after the year | 0.00 | 0.00 | 3,465 MB | 2,122 MB |
| The run in all | 8.37 | 11.90 | | |

- What the memo would hold for the demo: the shading 55,375,120 bytes (53 MB), the options 3,424,520 bytes (3 MB).
- The report: the six pages as PNGs at 150 dpi 0.93 s (707,230 bytes in all), the PDF 0.62 s.
- Peak of the stage's own allocations (tracemalloc, one thread): the shading and the losses 279 MB; the options 436 MB.

## The roof at the limit

`uv run python -m tools.profile_engine limit --hot-spots` and `... limit --threads 1`. 30,000 m², 7,590 positions in 15
rows, four options (candidates), 28x270x12 chosen, 7,350.4 MWh/yr.

| Step | Seconds, 8 threads | Seconds, 1 thread | Peak memory of the process after the step, 8 threads | 1 thread |
|---|---|---|---|---|
| Fitting modules on the roof | 0.26 | 0.26 | 196 MB | 196 MB |
| Loading PVGIS TMY weather | 0.01 | 0.01 | 196 MB | 196 MB |
| Computing hourly shading for every module | 48.31 | 48.57 | 3,606 MB | 3,606 MB |
| Applying the losses | 0.04 | 0.04 | 3,606 MB | 3,606 MB |
| Sizing strings and simulating the options (4 candidates) | 12.60 | 36.51 | 19,149 MB | 8,548 MB |
| The figures after the year | 0.00 | 0.00 | 19,149 MB | 8,548 MB |
| The run in all | 61.20 | 85.38 | | |

- What the memo would hold at the limit: the shading 531,946,320 bytes (507 MB), the options 2,746,968 bytes (3 MB). The
  memo's room for shadings is 512 MB (`memo.SHADING_BYTES`): one roof at the limit fills it, and the next one pushes it
  out.
- The report: the pages as PNGs 5.53 s (2,916,131 bytes), the PDF 4.62 s. The time is the layout and the shadows pages,
  which draw every one of the 7,590 modules.
- Peak of the stage's own allocations (tracemalloc, one thread): the shading and the losses 3,155 MB; the options 4,608 MB.

## Where the memory goes

The two readings together say this, with the arithmetic that fits them; a measurement on Linux would confirm it.

- **The shading** holds arrays of hours by modules: 8,760 by 7,590 at the limit, 266 MB each as float32 and 532 MB as
  float64. `shading.compute` keeps `f_row`, `f_obj`, `f_lin`, `e_row`, `e_obj`, `e_mod` at once and makes float64
  temporaries between them (`1.0 - (1.0 - f_row) * (1.0 - f_obj)`, the electrical rule): about 3 GB (tracemalloc 3,155 MB).
  What is kept is 507 MB. A gain: float32 throughout with in-place operations, and `f_row`, `f_obj` dropped once `f_lin` is
  made; the arithmetic says a third of the peak, perhaps a quarter. Nothing of this is measured yet.
- **One simulation** (`simulation.simulate`) is the heavier one. It makes float64 arrays of hours by used modules for the
  irradiance chain (`nom`, `b_lin`, `d_lin`, `b_iam`, `d_iam`, `front`, `tot` and their sums): 8,760 by about 7,000 at the
  limit is 490 MB each, and about ten are alive at once; tracemalloc's peak of 4,608 MB for the options stage fits that. For
  the demo: 8,760 by 638 is 45 MB each, tracemalloc 436 MB. The chain's sums are totals over hours and modules
  (`sums[...] += float(...sum())`), so the arrays are only needed to reach `g_eff` and `beam_pre` (float32); the same chain
  in float32, in place, or in blocks of hours would cut the stage's allocations by most of their size. The gain is
  arithmetic, not measured; the numbers must stay the same to the displayed precision, which float32 summation would have
  to be shown to keep (the sums could stay float64 while the arrays are float32).
- **The threads multiply it.** Eight threads simulate up to eight candidates at once, each with its own temporaries. The
  demo peaks at 3,465 MB with the threads and 2,122 MB without; the roof at the limit at 19,149 MB and 8,548 MB. The time
  the threads save is 3.2 s of 11.9 for the demo and 24 s of 85 at the limit.
- **A gap not explained.** The process's peak rises by about 1.6 GB during the demo's options with one thread (520 to 2,122
  MB), where tracemalloc's peak for the stage is 436 MB. Freed arrays that macOS's allocator keeps, or memory outside
  Python's allocators, would both look like this; the two readings cannot tell them apart. The peak does not rise over the
  three further runs of the options that follow in the same process (the loss edits), so it is not a leak. A run on Linux,
  reading the current resident size after each step, would settle it; the Lambda number is the Linux one.
- **Before any run** the process holds 187 MB: the interpreter and the imports.

## Hot spots

`--hot-spots`: each stage once under cProfile, the ten heaviest functions of `rooftop_core` by cumulative time; the
`Design`'s own methods (`project.py`, which only call the stages) are left out. The options one after the other.

### The shading (and the losses, which take 0.03 s)

| Function | Where | Calls | Cumulative s, demo | Calls | Cumulative s, limit |
|---|---|---|---|---|---|
| compute | shading.py:122 | 1 | 7.87 | 1 | 48.80 |
| object_fraction | shading.py:79 | 1 | 7.72 | 1 | 46.30 |
| casters_shadow | geometry.py:192 | 2,194 | 1.65 | 2,194 | 0.66 |
| prism_shadow | geometry.py:181 | 21,940 | 0.83 | 8,776 | 0.29 |
| solids | geometry.py:64 | 21,950 | 0.57 | 8,780 | 0.29 |
| footprint | geometry.py:50 | 21,950 | 0.56 | 8,780 | 0.28 |
| row_fraction | shading.py:50 | 1 | 0.08 | 1 | 1.38 |
| sky_loss_sectors | geometry.py:241 | 1 | 0.03 | 1 | 0.74 |
| _rect | geometry.py:89 | 10,975 | 0.22 | | |
| solar_position | weather.py:310 | 2 | 0.04 | | |
| electrical_rule | shading.py:40 | | | 2 | 0.21 |
| center | placement.py:67 | | | 7,590 | 0.05 |

- **`object_fraction`** is the shading: 7.7 of 7.9 s for the demo, 46.3 of 48.8 s at the limit. For every distinct position of
  the sun (the hours binned by elevation and azimuth: 2,194 positions for Pune's year) it builds the shadow the casters throw
  on the module plane (`casters_shadow`), asks the STRtree for the modules the shadow's bounding box touches, and intersects
  each candidate's polygon with the shadow (`shapely.intersection`, `shapely.area`). The casters take 1.65 s of the demo's
  7.7 and 0.66 of the limit's 46.3; the rest, which cProfile books to shapely, is the intersections. At the limit the only
  caster is the parapet, whose shadow is a ring along the whole roof's edge: its bounding box is the whole roof, so every
  one of the 7,590 modules is a candidate at every position, 2,194 times 7,590 is 16.7 million polygon intersections for a
  shadow that touches the few rows along the edge. The demo has the same parapet (1.7 million intersections for 790
  modules). This is the arithmetic that fits the times; the candidate counts are not yet printed by the code. A gain: query
  the tree with each part of the shadow (each side of the parapet, each obstacle's prism) instead of the union, or test
  `shapely.intersects` before intersecting; if the candidates fall to the rows the shadow touches, the step could drop by an
  order of magnitude at the limit and by a half or more on the demo. Uncertain until the candidate count is measured.
- **`casters_shadow`, `prism_shadow`, `solids`, `footprint`, `_rect`**: the shadow of every solid is rebuilt for every sun
  position, and with it the solids and footprints of every obstacle (21,950 calls for the demo's ten solids), though
  neither depends on the sun. Building them once per caster saves about 0.6 s of the demo's 7.9 (8 %); the shadow itself
  must be rebuilt, since it moves with the sun. Small and sure.
- **`row_fraction`** (1.4 s at the limit), **`sky_loss_sectors`** (0.7 s) and **`electrical_rule`** (0.2 s) are numpy over
  hours by modules; they grow with the roof and are not worth a change before the two above.

### The options

| Function | Where | Calls | Cumulative s, demo (7 candidates) | Calls | Cumulative s, limit (4 candidates) |
|---|---|---|---|---|---|
| build_options | options.py:110 | 1 | 3.93 | 1 | 36.99 |
| make_option | options.py:89 | 7 | 3.81 | 4 | 34.19 |
| simulate | simulation.py:177 | 7 | 3.81 | 4 | 34.15 |
| mpp | onediode.py:60 | 15 | 2.99 | 9 | 18.62 |
| ranked_strings | options.py:80 | 10 | 0.11 | 7 | 2.78 |
| annual_string_shade | shading.py:153 | 10 | 0.06 | 7 | 2.37 |
| form_strings | stringing.py:92 | 10 | 0.06 | 7 | 0.41 |
| emit | stringing.py:102 | 250 | 0.05 | 1,830 | 0.38 |
| params | onediode.py:51 | 16 | 0.05 | 10 | 0.33 |
| center | placement.py:67 | 7,157 | 0.05 | 52,650 | 0.36 |

- **`mpp`** (`onediode.py`, pvlib's `max_power_point` by Newton's method) is 3.0 of the demo's 3.8 s and 18.6 of the limit's
  34 s. `simulate` calls it twice per candidate over every hour of every string: once at the cell temperature for the
  power, once at 25 °C for the temperature-loss line of the chain. The 25 °C call solves 8,760 times the number of strings
  points of a curve that depends on the irradiance alone: a table of a thousand irradiances interpolated would do the same
  work in a few milliseconds, saving nearly half of `mpp` (about 1.4 s of the demo's 3.8 one after the other, 9 s of the
  limit's 34). Whether the interpolation keeps the chain's percentage to the displayed precision has to be shown; the
  Newton solve at cell temperature stays. Another half is in the solve itself, which is pvlib's.
- **The rest of `simulate`** (0.8 s of the demo's 3.8, 15.5 s of the limit's 34) is the irradiance chain over hours by
  modules described above under memory: float64 temporaries whose sums alone are kept. The change that cuts the memory cuts
  this time too; by how much is not measured.
- **`ranked_strings` and `annual_string_shade`** (2.8 s at the limit, 7 calls; 0.1 s on the demo, 10 calls) form the
  strings for a series length and order them by their beam-weighted annual shade, a sum over hours for every string. The
  roof at the limit has three series lengths and four candidates, so three calls would do; the other four come from
  `build_options`, where `ranked_cache.setdefault(n, ranked_strings(pre, layout, n))` works the ranking out before
  `setdefault` looks in the cache, for every candidate. Looking first saves about 1.6 s of the limit's 34 one after the
  other. Small and sure; the ranking of a length is the same every time, so nothing changes.
- **The figures after the year** cost 0.00 s on both roofs: nothing to gain.

## The report

The pages (`report.report_pages` then `report.page_png` at 150 dpi for each) and the PDF (`files.export_pdf_bytes`), each
drawn once, in the same runs as above: the demo 0.93 s and 0.62 s (707 KB of PNGs); the roof at the limit 5.53 s and 4.62 s
(2.9 MB). The pages are drawn under one lock in the API (`services/export.py`, `DRAWING`) and kept per project and day
(`PAGES`, 32 MB), so a second visit to the report costs nothing; the first one at the limit costs five seconds behind the
lock.

## What issue #76 asks

- **The cold start** cannot be measured here: there is no Lambda, and the container image is not built. What this machine
  can say: the process holds 187 MB after the imports (numpy, pandas, scipy, shapely, pyproj, matplotlib, pvlib) before
  anything runs; the imports themselves were not timed, since a warm file cache here would not say what a cold container
  does.
- **What one run holds.** The memo keeps the shading and the options: 53 MB and 3 MB for the demo, 507 MB and 3 MB at the
  limit, in a store allowed 512 MB and 64 MB. The run itself needs far more while it runs: the process peaks at 3.5 GB for
  the demo and 19 GB at the limit with the threads, 2.1 GB and 8.5 GB without (the table above); the stage's own
  allocations peak at 436 MB and 4.6 GB (one simulation). A Lambda's limit is 10 GB: the roof at the limit does not run
  there as the code stands, and the demo with eight threads asks for 3.5 GB where the memo and the result need 60 MB. The
  memory changes under "Where the memory goes" come before any memo question.
- **A loss edit, with and without the memo.** As the API does it, a new `Design` on the edited project against the memo of
  the process (`measure_loss_edits`):

  | | Demo, 8 threads | Demo, 1 thread | Limit, 8 threads | Limit, 1 thread |
  |---|---|---|---|---|
  | The first run (the memo empty; the same as no memo) | 8.40 s | 11.21 s | 62.34 s | 86.20 s |
  | A soiling edit: the shading kept, the candidates simulated again | 1.01 s | 3.86 s | 13.04 s | 37.31 s |
  | A degradation edit: everything kept but the figures after the year | 0.09 s | 0.09 s | 0.33 s | 0.33 s |

  Without the memo every edit costs the first run's time. On Lambda the memo is per instance and lost between invocations
  (#76): a soiling edit that lands on a cold instance costs 8.4 s for the demo and 62 s at the limit; one that lands on the
  instance that ran the design costs 1 s and 13 s.

## What this profile does not say

- Nothing here is measured on Linux or on a Lambda's CPU share. The times are an M1 Ultra's; a Lambda at 1,769 MB has about
  one vCPU, and the engine's threads buy nothing there. The memory peaks are macOS's `ru_maxrss`; glibc's allocator behaves
  differently, and the gap between the process's peak and tracemalloc's is unexplained (above).
- The hot spots are from one profiled run each; cProfile adds its own overhead to the times (the demo's shading 7.9 s under
  it, 7.4 s without).
- The gains are arithmetic from the code and the counts, not measurements of a change. Each change of #76 is to be made with
  its test and its before-and-after numbers from this script.
