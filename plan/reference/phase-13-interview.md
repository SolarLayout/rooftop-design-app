# Phase 13: the owner's interview, by theme

Session 17, 2026-10-05. The owner's words are in `plan/sessions/017/owner-messages.md`; this is their summary by theme,
read back to him at the end for corrections.

## Where the bad code comes from, and what he suspects
- The engine (`rooftop_core`) was copied from the desktop app `rooftop-design` (PyQt5), a proof of concept written by
  someone who is not a software developer, which in turn took much of its code from PVlayout_advance: unsound algorithms,
  not production quality (message 2).
- He puts the memory and the time down to those algorithms and to unoptimised code.
- His yardstick: SolarLayout's cloud product (Studio) runs utility-scale plants of thousands of acres in Lambdas that
  do not blow their box. A roof at the 30,000 m² limit should compute "in a flash", in well under 512 MB, done right.
- The standard to read: ADR-0014 in the `solarlayout` repository (algorithmic soundness and scale discipline).

## The discipline: not ADR-0014
- ADR-0014 is **not binding** on rooftop (message 3). It fits SolarLayout's MVP and Studio, which carry a database and
  heavy infrastructure; rooftop is a pure stateless API, a simpler architecture on purpose. The product is free for all
  for now, as marketing; it will later become paid and production-grade, with server-side state, persistence, a
  database and stored projects. Full ADR-0014 now would take an extended period of architecture, design and development.
- No `SCALE-BUDGET` annotations.
- No memory-gate test: the CI is not to grow.
- The scale case is the roof at the 30,000 m² limit, rooftop's own limit; testing at it here is enough.
- The optimisation and the measurement of memory are done **on this machine**.

## What must not change
- Not the owner's question to answer in the abstract (message 4): the session tries, shows him the numbers, and suggests.
  He suspects bad optimisation, bad algorithms and wrong complexities are "devastating the engine".
- What the session decided, to show him: today's engine's outputs are frozen first as a snapshot (the demo and the roof
  at the limit: every figure the app shows, the option keys and order, the loss chain, the months, the strings, the
  shade per module); each change shows its difference from the snapshot in numbers. The desktop app's figures
  (`test_demo_numbers.py`) stay the sentinel. Where a change moves anything past the last bit, the plan says by how much,
  and the owner sees it before it is merged.
- **The rule (message 5): parity with the desktop app's outputs, and only that.** What must match is the functional
  result; the algorithms, the engineering and the programming of the desktop app are not to be kept. Today's engine
  was copied from the desktop app at `bf2cb67` and gives its numbers, so the snapshot of today's outputs is the desktop
  app's outputs.

## Phase 12's leftovers
- #99 (the operator's guide and the dry run) and #100 (the production guards) wait until Phase 13 is done (message 5).

## The rest, decided by the session (message 6: "cover the rest yourself")
- **Targets** (aims to be measured against, not promises): the roof at the limit, one thread, peak under 1 GB with
  512 MB as the aim, and the run under 10 s on this machine (today 5,652 MB on Lambda, 8,548 MB and 85 s here); the demo
  under 400 MB and under 2 s (today 2,122 MB and 11.9 s here). A loss edit at the limit (the shading kept) under 2 s.
- **How it is measured, on this machine**: `tools/profile_engine.py`, each reading in a fresh process; the process's
  peak (`ru_maxrss`) and `tracemalloc`'s peak per stage. The same script also in the API's own image under Docker
  (Linux, arm64, glibc: Lambda's allocator), so the numbers that size a function are Linux's. `memray` only if the two
  readings cannot explain a peak, as a pinned dev dependency in its own commit.
- **Parity, proven**: today's outputs frozen for the demo and the roof at the limit before the first change; the demo's
  comparison runs in pytest at no extra cost (the demo is already run once per session); the limit's is a tool run here,
  not in the CI. Every pull request shows the largest difference per figure.
- **The order**: the measurement and the snapshot first; then the shading (it holds the result that is over 512 MB
  alone, and three quarters of the time at the limit); then the options' simulations (the memory per thread); then what
  is left; last, the functions fitted on staging (the owner deploys) and #98.
- **Pull requests**: a few, split at clean seams, each step a commit, each with its numbers before and after.
- **Not in scope**: an external home for the memo (the API stays stateless, as the owner described it); ADR-0014's
  apparatus.

## How the work is done (message 7, after the read-back: "looks good")
- The session optimises its own work: no endless runs of the browser tests or of the Python suite, which take long.
- Things are proven locally first, by measurement; the appropriate tests are written at the end of the work (for this
  phase, in place of test-first).
- Not many pull requests: few, each worth its review.
