# Phase 13: optimization

**Status:** done (session 17, 2026-10-05): #102 to #106; both functions at 1,769 MB, deployed and smoked. The owner: "we are
done with perf. i am happy with results".
**Depends on:** Phase 12 (the app deployed, so the numbers are Lambda's).

## Goal
The engine lean in time and memory on AWS Lambda, every unsound algorithm found and fixed, the engine's numbers unchanged to the
bit; the functions then fitted to what runs, and the hosted app's limits said in its own words.

## Scope, as known today
- **#96, the memory of a design run.** At the roof limit (30,000 m²) one more simulation thread adds about 4.5 GB; 10,215 MB with
  two threads, 5,652 MB with one (D61). Explain the peak array by array (`tracemalloc`, `memray`), find the unsound parts (frames
  materialised whole, float64, Python loops, O(n²) steps, work every candidate repeats), fix them with a test each.
- **#76, the API lean for Lambda**: time per endpoint at Lambda's CPU share, the memo's home (per instance today), the cold start
  (a fresh image's first start 3.5 s since async init, #95; later ones 2 to 4 s).
- **Fitting the functions** (`plan/phase-12-plan.md`, decision 3): after #96, the memory set to the measured peak with about 25 %
  over and the run's time checked at that size; the simulation threads chosen with it.
- **#98, a project file over the Function URL's 6 MB**: the Open dialog refuses it in words; compression only if real files come
  near.

## Acceptance
Each fix with its before-and-after numbers on staging; the sentinel of the engine's numbers green; a roof at the limit well under
the memory the functions are given; the functions' memory lowered to fit.

## As built (so far)

Session 17, 2026-10-05. The owner's interview first (`plan/reference/phase-13-interview.md`), then the plan, then four pull
requests. Measured in the API's own image under Docker (Linux, arm64, glibc as on Lambda), one thread, nothing kept
(`apps/api/tools/profile_engine.py`); Lambda's numbers on staging.

| | Before | After #102 | After #103 | After #104 | Target |
|---|---|---|---|---|---|
| Roof at the limit: the run | 132 s | 71 s | 5.15 s | **4.4 s** | under 10 s |
| — peak of the run | 5,475 MB | 5,022 MB | 663 MB | **664 MB** | under 1 GB, aim 512 |
| — a soiling edit, the shading kept | about 80 s | 65 s | 3.5 s | **2.7 s** | under 2 s |
| — the report's pages | 6.8 s | 6.7 s | 3.6 s | **3.5 s** | under 2 s |
| Demo: the run | 15.6 s | 9.4 s | 2.75 s | **1.99 s** | under 2 s |
| — peak | 703 MB | 668 MB | 263 MB | **261 MB** | under 400 MB |
| What the memo keeps of the limit's shading | 507 MB | 1.2 MB | | | |

On Lambda (staging at #103, 10,240 MB): the limit 6.3 to 6.5 s (117 s before), a soiling edit 4.7 s, `Max Memory Used` 926 MB
(5,652 MB before); the demo about 3 s.

### What exists

| Part | Where | Pull request |
|---|---|---|
| The parity snapshot of the desktop app's outputs (the demo, the limit) and its comparison (D64) | `apps/api/tools/parity.py`, `tests/fixtures/parity/`, `tests/engine/test_parity.py` | #102 |
| The shading kept by what it depends on: per class of module, and the cells an obstacle shades (D65); the tree asked with each part of a shadow; every prism's shadow at a position in one call; the sky in blocks and one pass | `rooftop_core/shading.py`, `geometry.py` (`Prisms`, `prisms_shadow`, `sky_loss_sectors`) | #102, #103, #104 |
| The options per string: a length's hours once (`StringPhysics`, `of_length`), one length at a time, the operating point once per distinct lit pair in float32, the 25 °C power from a spline, the chain in place (D66) | `rooftop_core/simulation.py`, `options.py` | #103, #104 |
| The report's plan as one collection | `rooftop_core/plots.py` | #103 |
| The memo held to 128 MB; one thread for 1,769 MB (D67) | `rooftop_core/memo.py`, `apps/api/Dockerfile` | #105 |
| A CSV with rows under an hour averaged into hours | `rooftop_core/weather.py` (`parse_csv`, `minutes_between_rows`), `csv_weather.py` | #105 |
| A file over 6 MiB refused in the Open dialog's words (#98) | `apps/web/lib/flow/open-project.ts`, `components/shell/OpenProject.tsx` | #105 |
| The memo keeps the operating points, keyed by the module and the exact pairs: a loss edit that leaves the irradiance solves nothing | `rooftop_core/memo.py` (`operating_points`, `points_key`), `simulation.py` (`KeptPoints`) | #106 |
| The placed modules turned back in one transform | `rooftop_core/placement.py` (`rotate_all`) | #106 |
| matplotlib loaded with the first report or file, not at the start | `rooftop_core/export/summary.py`, `rooftop_api/services/export.py`, `tests/test_startup.py` | #106 |

### Parity
#102 and #104 keep every figure of the demo and the limit to the bit. #103 moves energies by at most 2.95e-9 relative, the hours
by 7e-7 (the desktop app rounded each module's irradiance to float32; the strings' means are now taken in float64): within D64's
bar, which gained an absolute floor of 1e-6 in a figure's own unit (a relative bar says nothing near zero). Keys, order, strings
unchanged. The report's two plan pages differ by at most 4 levels of 255 on 0.6 % of their pixels.

### Found on the way
- **The bounding box of a ring**: the parapet's shadow is a ring round the roof; asking the tree with its box, or even with the
  ring and a predicate, tests every module. Asked with each wall's own shadow, 2,006 intersections where there were 1.67 million.
- **Three distinct columns of 7,590**: the row shading is a function of the row's geometry; the obstacles' part is nonzero in
  0.047 % of its cells.
- **float32 merged what float64 keeps apart**: with each string's sky in float64, strings differing in the eighth digit were
  distinct operating points (750,000 a solve); keyed in float32, as the desktop app carried them, the solve count fell five-fold.
- **A table does not beat the solve**: pvlib's Newton is about 1 µs a point; a 2-D spline costs the same to evaluate. Only the
  25 °C power (one dimension) is read off a spline.
- **A sub-hourly CSV gave four times the energy** (the demo 2,464 MWh/yr for its 618): the simulation takes a row as an hour.
  The desktop app does the same. Averaged into hours now (the owner).
- **BLAS rounds by width**: `beam @ lit` may differ in its last bit for another width of matrix; numpy's 2-D sums too. The tests
  that need exact equality sum each row alone.
- **The snapshot held this machine's paths** (the PAN and OND): the parity test failed on GitHub; the snapshot keeps names.
- **GitHub hiccups**: a deploy waited 17 minutes for a runner and was started again; a push to a pull request started no check
  and the pull request was reopened.

### After #106, and on Lambda
In the image: the limit 4.1 s; a quality, mismatch, availability or DC-ohmic edit at the limit 1.76 s (target 2 s); a soiling
edit 2.45 s (it changes the irradiance: solved again); the demo 2.01 s; a start of the API 1.20 s and 175 MB here (1.51 s and
212 MB with matplotlib). Every endpoint at the limit after a run: `/layout` 0.5 s, the report's pages 4.2 s (then kept), the
PDF 3.1 s, KMZ 1.8 s, DXF 0.9 s, SLD 0.6 s, CSV 0.4 s, the zip 5.6 s; the container's peak 630 MB.

On Lambda at 1,769 MB (staging, `d95224d`): the limit 7.4 to 7.6 s, a soiling edit 5.5 s, the demo 3.4 s, `Max Memory Used`
921 MB. At 10,240 MB the same code would be about 5.5 s: numpy's BLAS uses the other cores of a larger function. The owner chose
1,769 MB for the price (a sixth of 10,240's per second), and the 10 s target holds.

### Not done, by the owner's word ("we are done with perf")
- A soiling edit at the limit under 2 s (2.45 s here); the report's pages at the limit under 2 s (4.2 s the first time).
- The aim of 512 MB at the limit (664 MB here; 921 MB on Lambda).
- The report drawn without matplotlib (the owner asked why it is needed: the PDF, its pages, the SLD's PNG); not filed.
