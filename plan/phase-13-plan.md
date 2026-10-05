# Phase 13: plan

Written 2026-10-05 by session 17, after the owner's interview (`plan/reference/phase-13-interview.md`) and before anything of the
phase is built. Scope and acceptance: `plan/phase-13-optimization.md`. The owner keeps, drops or changes each item; the section
"Scoped with the owner" is added when that is done.

## How the phase works (the owner, messages 3, 4, 5 and 7)
- Proven on this machine first, by measurement; the appropriate tests written at the end of each piece of work, not first.
- No endless runs of the browser tests or of the Python suite: the tests a change can reach, and the sentinel.
- Few pull requests, each worth its review.
- The only rule on numbers: **parity with the desktop app's outputs**. Today's engine is the desktop app's at `bf2cb67`, so its
  outputs today are the reference. Its algorithms and its code are not.
- ADR-0014 of `solarlayout` is not binding here: no budgets in the code, no memory gate in the CI.

## Scoped with the owner
2026-10-05, session 17: "keep all, go ahead with PR 1". Every decision, the targets and the three pull requests kept as written;
numbered D64 to D66 in `plan/README.md`.

## What was found at the start

Measured on this machine (M1 Ultra, macOS), 2026-10-05, with scripts in the session's scratchpad; the baseline is
`plan/reference/api-profile.md` (2026-10-04, the same code).

**The roof at the limit today:** 85 s and a peak of 8,548 MB with one thread (Lambda: 117 s, 5,652 MB); the shading 48 s of it
and the options 37 s. The demo: 11.9 s and 2,122 MB.

1. **The obstacles' shading does about 830 times the work it needs** (`shading.py:110`). For every sun position the shadows of
   all casters are joined into one shape, and the tree is asked for the modules its *bounding box* touches. The parapet's shadow
   is a ring round the whole roof, so its box is the whole roof, and every module is intersected at every position. At the limit,
   over 220 positions: **1,669,800 polygon intersections, of which 2,006 touch the shadow**. The demo: 173,800 for 2,171.
   Asking the tree for the modules that truly intersect (`predicate="intersects"`, one argument) gives **the same array to the
   bit**, measured: at the limit **46.6 s → 4.9 s**, the demo 7.4 s → 1.9 s.
2. **The shading is stored as if every module were different, and almost none is.** It is kept as two dense arrays of 8,760 hours
   × modules (`f_lin`, `e_mod`, float32): **507 MB at the limit**, the whole of the owner's 512 MB on its own.
   - The row-to-row part has **3 distinct columns** at the limit and on the demo (10 classes of module by their geometry, 3
     distinct results): every module of a row in the same line is shaded the same.
   - The obstacles' part is nonzero in **0.047 %** of its cells at the limit (31,493 of 66.5 million), 0.69 % on the demo.
   - The sun positions are binned already (1,097 distinct positions, two heights of module): the obstacles' part is a function of
     the position, not of the hour.
3. **Making the shading takes 3.2 GB for a result of 0.5 GB** (tracemalloc 3,155 MB): `row_fraction` builds six float64 arrays
   of hours × modules (`shading.py:66-74`, 532 MB each at the limit) to find 3 distinct columns; `compute` then keeps `f_row`,
   `f_obj`, `f_lin`, `e_row`, `e_obj`, `e_mod` at once (`shading.py:128-134`).
4. **One simulation takes 4.6 GB at the limit** (tracemalloc), which is why each thread adds about 4.5 GB on Lambda. The
   irradiance chain (`simulation.py:193-218`) is worked out per hour per module in float64, about ten arrays of 490 MB alive at
   once; then the modules are averaged into strings (`simulation.py:230-235`). Every step of the chain is linear in the shading,
   so the average over a string's modules can be taken first: the chain per string is 8,760 × 270 strings at the limit, 19 MB an
   array. Two of its terms (the diffuse ones) are an outer product of an hour series and a module series and never needed an array
   of hours × modules.
5. **The module's operating point is solved about twenty times more often than needed** (`simulation.py:242-243`, pvlib's Newton
   over every hour of every string, twice per candidate: 18.6 of the options' 34 s at the limit). Measured over the limit's eight
   calls: **51 % of the points are dark** (irradiance under 1 W/m², solved and then set to zero, `onediode.py:65`), and of the lit
   ones only **7 to 14 % are distinct** (87,315 distinct of 940,720 in the first call): unshaded strings of a row see the same sun.
6. **Each candidate repeats what candidates of its string length share.** The candidates of one series length take a prefix of the
   same ranking of strings (`options.py:90`), so a string's irradiance, temperature and operating point are the same in every one
   of them; only the inverters differ. The limit has 4 candidates of 3 lengths, the demo 7 of 3. And the ranking itself is worked
   out before the cache is looked in (`options.py:150`, `setdefault` evaluates its argument): 7 rankings where 3 do, 1.6 s.
7. **Smaller ones, all at the limit:** the casters' solids and footprints rebuilt at every sun position (`geometry.py:192`, 21,950
   calls on the demo for 10 solids); the sky's view (`geometry.py:241`) builds float64 arrays of modules × points of the casters'
   outlines and scans them 36 times; `annual_string_shade` (`shading.py:153`) is a Python loop over strings; the report's plan
   draws one matplotlib patch per module (`plots.py:63-65, 88`): the pages 5.5 s and the PDF 4.6 s at the limit.
8. **The threads multiply the memory and buy little:** on Lambda one thread was not slower than two (117 s against 124 s, D61).

What `solar-mms-modeller` does (read for message 8): it has no shading engine of modules and obstacles. It treats every row as a
copy of one row and works one analytic profile-angle formula; the GPU's shadow map is only drawn. The ideas that carry over: reduce
the modules to the classes that shade alike, and key the shading to the sun's position rather than the clock. Both are in item 2
above and in decision 2 below.

## Decisions (proposed D64 onwards when kept)

1. **Parity is shown, not assumed.** Before the first change, a snapshot of today's outputs for the demo and the roof at the limit:
   every figure the app shows, the option keys and their order, the loss chain, the months, the 25 years, the strings and their
   inverters and MPPTs, the shade per module, the shade map of a day. Every change is compared with it and the pull request says,
   per figure, *identical* or the largest difference. My bar: keys, order and counts exact; energies within 1e-6 relative;
   percentages within 0.001 points. Anything past the bar goes to the owner before it merges. The demo's comparison runs in pytest
   at no cost (the demo is run once per session already); the limit's is a tool run here (about a minute after the work), not in
   the CI. The desktop app's figures (`test_demo_numbers.py`) stay the sentinel.
2. **The shading is kept by what it depends on, not by hours × modules.** The hour points to its sun position (1,097 and the night);
   the row-to-row part is kept per class of module (the few that are distinct), worked out by the same formula on a few columns
   instead of thousands; the obstacles' part is kept sparse per position (the modules a shadow touches, and how much). The
   electrical rule is applied to these small parts. Nothing of 8,760 × modules is ever made whole: the readers (the simulation, the
   ranking of strings, the shade summary and the shade map) ask for what they need (per string, per module over the year) and the
   shading answers it in blocks. The memo then keeps a few megabytes for a roof at the limit where it keeps 507 MB.
3. **The obstacles' shadows are asked part by part.** The tree is asked with `predicate="intersects"` (finding 1, the same bits),
   and the solids and footprints of the casters are built once per run, not once per position.
4. **The simulation works per string.** The irradiance chain is worked out on the strings' averages and the chain's totals from
   the per-module terms' sums (finding 4); nothing per hour per module. A string length's physics (its irradiance, temperature and
   operating point per string) is worked out once and shared by every candidate of that length (finding 6); a candidate then only
   sums its strings into its inverters. The operating point is solved on the lit, distinct points alone and spread back (finding 5).
   The ranking is worked out once per length.
5. **The threads chosen after the work, by measurement.** With a simulation of a few tens of megabytes, the threads cost little
   memory; whether they buy time at Lambda's share of a CPU is measured. The default stays 1 until then (D61).
6. **Measured here, two ways.** `tools/profile_engine.py` in a fresh process per reading (the process's peak, `ru_maxrss`, and
   tracemalloc's peak per stage), on macOS and inside the API's own image under Docker (Linux, arm64, glibc, as Lambda allocates).
   memray only if the two cannot explain a peak, pinned, in its own commit.
7. **The memo stays in the process** (D6): the API stays stateless, as the owner describes it today. With the shading small, a
   loss edit that lands on another instance costs the run again; at the targets that is a few seconds.
8. **The functions fitted last.** After the engine work, on staging (the owner deploys, D59): the roof at the limit at a few memory
   sizes (the size sets the share of CPU), the size chosen as about 25 % over the peak unless a larger one buys time the owner
   wants; then production the same. D61 is replaced.

## Targets

| | Today, here (one thread) | Target, here | Today, Lambda |
|---|---|---|---|
| Roof at the limit: run | 85 s | under 10 s | 117 s |
| Roof at the limit: peak of the process | 8,548 MB | under 1 GB, aim 512 MB | 5,652 MB |
| Roof at the limit: a loss edit, shading kept | 37 s | under 2 s | |
| Demo: run | 11.9 s | under 2 s | 15 s |
| Demo: peak of the process | 2,122 MB | under 400 MB | 1,348 MB |
| Roof at the limit: report pages | 5.5 s | under 2 s | |

The process holds 187 MB after its imports before any run; the aim of 512 MB leaves about 300 MB for a run at the limit.

## The pull requests

Three, each with its numbers before and after, its tests written once the work is proven, `bun check` (the browser groups only
where a change reaches them: none of these touches the web app but the third).

1. **The measurement, the snapshot and the shading** (decisions 1, 2, 3, 6). The profile script's fresh-process and Linux
   readings; the snapshot and its comparison; the shading's new form and its readers adapted (`simulation`, `options`,
   `shade_summary`, `memo`, the shade map's route). Expected: the shading at the limit from 48 s to a few seconds, its result from
   507 MB to a few MB, its making from 3.2 GB to tens of MB. Tests: the new form against today's dense arrays on the demo and on
   small roofs with obstacles (every cell the same), the readers' answers the same, the snapshot.
2. **The options** (decisions 4, 5). The simulation per string, the physics per string length shared, the operating point on
   distinct lit points, the ranking once. Then the smaller ones of finding 7 that the numbers still show (the sky's view, the report's
   plan as one collection). Expected: a simulation from 4.6 GB to tens of MB, the options at the limit from 37 s to a few seconds.
   Tests: the chain per string against today's per module (the snapshot's bar), the shared physics against a candidate alone, the
   distinct points against all.
3. **The functions fitted, and #98** (decision 8). The memory and threads of both functions from staging's measures, written in
   `infra/aws/` and `docs/deployment.md`; D61 replaced. #98: the Open dialog refuses a file over the Function URL's 6 MB before
   sending it, in our words (a board first if the dialog's refusal has none). The browser group the dialog belongs to.

## Risks
- **The last bits move** where the order of a sum changes (decision 4) or the Newton solve sees other points (scipy's array Newton
  stops when every point has converged). The snapshot says by how much; the owner sees anything past the bar.
- **The shading's new form is the deepest change**: three readers and the memo depend on its shape. Each reader is proven against
  today's dense arrays before the dense arrays go.
- **Lambda's CPU share falls with the memory**: a function fitted to 512 MB has about a third of a CPU. The fitting (decision 8)
  measures time against size; the owner chooses where the money goes.
- **The report's pictures** drawn as one collection may differ in pixels from one patch per module; looked at side by side.
- **macOS's numbers are not Lambda's**: the Linux image gives the allocator's; staging gives the CPU's.

## What done means
The acceptance of `phase-13-optimization.md`: each fix with its numbers before and after; the sentinel green; the snapshot's bar
held (or the owner's yes to each difference); the roof at the limit well under the memory the functions are given; the functions'
memory lowered to fit; the targets met here, or the owner told why not.

## Not in this phase
#99 and #100 (after this phase, the owner); a home for the memo outside the process; anything of ADR-0014's apparatus; a change of
what the engine computes (the physics, the rules of the desktop app's outputs).
