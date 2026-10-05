# Phase 13: optimization

**Status:** filed 2026-10-05 (session 16) on the owner's word: "The optimization is phase 13". Its plan is written when it
begins, as the phases before it.
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
