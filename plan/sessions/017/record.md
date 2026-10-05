# Session 17: record

2026-10-05. Phase 13 (optimization) from the owner's interview to both environments fitted. What exists is in
`plan/phase-13-optimization.md`, "As built"; the interview in `plan/reference/phase-13-interview.md`; the plan in
`plan/phase-13-plan.md`; the decisions D64 to D67 in `plan/README.md`. Not repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Read the state, the issues (#96, #76, #98) and the engine's hot paths; both environments on `666368a` | — |
| 2 | The owner's interview, one question at a time; ADR-0014 of `solarlayout` read and set aside by him (not binding on rooftop) | `phase-13-interview.md` |
| 3 | Probes before the plan: 1.67 M polygon intersections where 2,006 touch; 3 distinct row-shading columns of 7,590; 0.047 % of obstacle cells nonzero; 51 % of the solved points dark, 7 to 14 % of the lit distinct; `solar-mms-modeller` read for ideas (one row for all, keyed by sun position) | `phase-13-plan.md` |
| 4 | The plan, kept whole: D64 to D66 | `phase-13-plan.md` |
| 5 | #102: the parity snapshot; the shading per class of module plus the cells an obstacle shades; the tree asked with intersects; the sky in blocks. To the bit | #102 |
| 6 | #102's CI failed: the snapshot held this machine's paths, and the test asked for bits across platforms. Fixed before merge | #102 |
| 7 | #103: the options per string, a length's hours shared, one length at a time, operating points per distinct pair in float32, the chain in place, the shadows by part, the sky in one pass, the report's plan as one collection. Within the bar (energies 2.95e-9) | #103 |
| 8 | Staging deployed (the first deploy stuck 17 minutes for a runner, restarted); the limit 6.3 s and 926 MB on Lambda | — |
| 9 | #104 (the owner: "push for the 10 s target"): the 25 °C power from a spline, the prisms' shadows at once | #104 |
| 10 | #105: 1,769 MB and one thread (D67), the memo held to 128 MB, a file over 6 MiB refused in our words (#98). The owner asked what file sizes are real; the measurement found a sub-hourly CSV gave four times the energy; the owner chose to average to hourly | #105 |
| 11 | The owner had the session run the memory change itself; staging at 1,769 MB measured 7.5 s at the limit (slower than 10,240 MB: the BLAS uses the other cores); the owner chose 1,769; production set and deployed | — |
| 12 | #106: the operating points kept by the memo, the modules turned in one transform, matplotlib on first use; every endpoint re-profiled at the limit | #106 |

## Why things are as they are
- **Parity, not bits, across machines.** The snapshot was taken here; another platform's BLAS rounds a sum's last bit
  otherwise. On this machine `tools.parity check` says whether a change kept the bits.
- **1,769 MB.** The peak fits a fifth of 10,240; 1,769 is one whole vCPU. It is not as fast as 10,240 (7.5 s against
  about 5.5 s at the limit), and the owner chose the price.
- **float32 keys for the solve.** The desktop app carried a module's irradiance in float32; keyed so, strings whose
  sky differs in the eighth digit share a solve, which is five times fewer solves.
- **The memo of operating points keyed by the pairs themselves**, so a hit gives the very bits a solve would (D6).

## Mistakes, and what was done about them
- **The parity test across platforms** asked for bits and held paths: CI failed on #102; fixed in the same pull request.
- **"One thread gains nothing above one vCPU"** was said and was wrong: 1,769 MB was 35 % slower than expected. Said so,
  and the owner chose.
- **A rebase with the wrong base** replayed #102's commits; aborted at once, redone with the right one.
- **A probe's step arithmetic** read pandas 3's second-resolution times as nanoseconds ("every 0.06 minutes"); caught
  before commit.
- **GitHub dropped events twice**: a deploy queued for a runner 17 minutes; two pull requests started no check until
  reopened.

## Where the log is
This conversation; the pull requests #102 to #106; the `deploy` runs on GitHub; the functions' CloudWatch logs.
