# Phase 11: hardening for the tradeshow

**Status:** in progress (session 14, 2026-10-04): scoped with the owner (`phase-11-plan.md`, "Scoped with the owner"); #78, #79, #80, #81, #82, #83, #84 merged; the Layers button (pull request 3) in flight; the close waits for it. **Depends on:** all earlier phases.

## Goal
Nothing surprising happens in front of an audience.

## Scope
- Parity audit: walk `reference/functional-inventory.md` line by line against the running app; every row is
  ticked or has a written reason.
- Numbers audit: demo and two other roofs (east-west, sloped flush) compared with the desktop app to the
  displayed precision.
- End-to-end suite: full journey (locate roof, add obstacle, array, voltage, option, losses, export) on
  phone, tablet and desktop. Runs in CI.
- Performance: web vitals budget for the shell; 3D frame budget; API timings logged; large roof
  (5,000 positions) stays usable.
- Resilience: API unreachable, slow weather download, bad PAN/OND/KMZ/DXF/CSV, WebGL unavailable or context
  lost (fall back to the plan view with a note), browser storage full.
- Offline demo: the demo project and its weather are bundled so the stand works without a network.
- Accessibility: keyboard path through every screen, focus order, labels, contrast, reduced motion.
- Browsers: current Chrome, Safari (macOS, iPadOS, iOS), Edge, Firefox.
- One-page operator guide for the stand: start, reset to demo, Present mode.

## Acceptance
- `bun check` green including the full e2e suite.
- Parity and numbers audits signed off by the owner.
- A dry run on the actual tradeshow hardware.

## As built

Built in session 14 (2026-10-04). The plan (`phase-11-plan.md`) was written first and then scoped with the owner item by item in plain
words: what stands and what went to issues #73 to #77 is in its section "Scoped with the owner". Two facts reshaped the phase on the way:
the stand demos from live production (`rooftop.solarlayout.app`; deployment is Phase 12, `phase-12-deployment.md`), and from the middle of
the session no browser test ran on this machine (D56): the fast lane was the gate, the browser suites were written and reviewed by reading,
and the pictures that change wait for one run of the whole suite at the close, on the owner's say. Every part was built by an agent in a
worktree from a written brief, reviewed and checked by the session.

### What exists

| Part | Where | Pull request |
|---|---|---|
| `bun start`: the start profile of the stack: the web app built once (9 s) into `apps/web/.next-start` and served by `next start`, uvicorn without reload, on the dev ports; dev and start never run together (the second refused by name); `--built` for any profile; the pid file and `bun status` say built | `tools/dev.ts`, `tools/lib/profiles.ts`, `tools/lib/commands.ts`; `README.md` | #78 |
| The rewrite's drops found at their two causes and fixed: every answer of the API closes its connection (Next's proxy tore down freed sockets under the next request); the drawn report pages kept per project and day and drawn once per key under asks at once; the proxy waits 120 s | `rooftop_api/connections.py`, `services/export.py` (`PAGES`, `_one_at_a_time`), `apps/web/next.config.ts`; the probe `tools/proxy-drops.ts` | #78, #80 |
| One log line per request with its time, `timing method=POST path=/design status=200 ms=12034`, on stderr beside uvicorn's | `rooftop_api/timing.py` | #78 |
| A pending save written when the page is left (`flush` on `pagehide`); `keptDesignsOf` in the browser tests | `lib/device/saving.ts`, `components/shell/Shell.tsx`, `e2e/device.ts` | #80 |
| The browser tests cheaper: each workspace's pictures in its group's screens suite, a baseline owned by the group its name begins with, the kit on phone and desktop, Present's frames on desktop alone | `e2e/tests/*-screens.e2e.ts`, `tools/check/e2e-groups.ts` (`groupOfBaseline`), `e2e/playwright.config.ts`; `docs/checks.md` | #79 |
| One roof at a time, up to 30,000 m²: refused at every route that takes an outline, in words that say the area, the limit and what to do; shown at Build; the measurement at the limit | `rooftop_core/geometry.py` (`require_roof_within_limit`), `errors.py` (`RoofTooLarge`), `rooftop_api/convert.py`, `services/roof_map.py`, `roof_files.py`, `project_files.py`; `apps/api/tools/roof_at_the_limit.py` | #81 |
| The base imports nothing of the groups' folders, held by the import walk; 52 files moved to where they are shared: `lib/places` (the search, Esri), `lib/geometry` (the metres and the palette), `lib/flow/deliverables` (Handover's names), `lib/stores`, `components/shell` | `tools/check/e2e-group-imports.ts`; `apps/web/lib/places`, `lib/geometry`, `lib/flow`, `lib/stores`, `components/shell`, `components/studio/Studio.tsx` | #82 |
| The engine's profile for #76: time by step and peak memory for the demo and the roof at the limit, the hot spots | `plan/reference/api-profile.md`, `apps/api/tools/profile_engine.py` | #83 |
| The polish: the notes drawer's motion, the assumption rows on phone, the inverter chip off the edge labels, the report's page count from the start, the wheel over a handle, the Sun lens framing the whole sun path, Uc's default beside the entered value (`Sizing.uc_default`) | `app/globals.css` (`drawer-motion`), `components/performance/Assumptions.tsx`, `components/studio/Labels.tsx`, `lib/scene/chip-place.ts`, `lib/handover/page-view.ts`, `lib/scene/wheel-forward.ts`, `lib/scene/camera.ts` (`framedRadiusOf`), `rooftop_api/schemas`, `services/design.py` | #84 |

### Acceptance, read with D55 and D56

| Asked | Met by |
|---|---|
| `bun check` green including the full e2e suite | The fast lane green on every pull request here and on GitHub. The whole browser suite runs once at the close when the owner says (D56; decision 18 of the plan); the pictures of the Sun lens, the Studio's view controls, Handover on phone and the Performance phone pictures change and are renewed then, looked at beside their boards |
| Parity and numbers audits signed off | Deferred to #73 at the owner's decision: he tests end to end by hand first |
| A dry run on the actual tradeshow hardware | The stand demos from production; the dry run follows Phase 12 |
| End-to-end suite in CI | Deferred to #74 |
| Performance: API timings logged; large roof stays usable | The timing line (#78); the limit of 30,000 m² and the measurement at it: 7,590 positions, 61 s (#81); the profile (#83) |
| Resilience | The roof too large refused in words; the pending save flushed; the API stopped and started again was covered already by `shell-vitals.e2e.ts` (the connection refused on the demo and on a run shows the board's words, Try again works) |
| Offline demo, accessibility, browsers, operator's guide | Dropped or deferred with the owner: the stand demos from production (offline moot); #77 (keyboard, reduced motion, WebKit and Firefox); #73 (the guide, once production exists) |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Decision 5: `bun stand`, the stand on the laptop | `bun start`; the stand demos from production; the laptop is the fallback | The owner, 2026-10-04 |
| Decision 6 and 7: the test stack switched to the build if it pays; a relay of our own if the build still drops | `next dev` stays (the build saved a tenth of a group's time once the drops were fixed, and a built stack left running serves stale code); no relay: the drops' two causes fixed in the API and the config | Measured in #78 |
| Decision 11: 100,000 m² | 30,000 m², with words that say the area, the limit and what to do | The owner: realistic rooftop sizes |
| Decision 4: eleven crossings | 21 crossings once the moved files' own imports were counted; nine pure geometry and palette files to `lib/geometry`, the deliverables' names to `lib/flow/deliverables` | Decided by the session |
| Step 29: the pages drawn once per pytest session; step 28: the BLAS threads pinned | Both tried and taken out: 180 s before, 179 s after here; 454 s for 745 tests without the pinning, 473 s for 787 and 459 s for 783 with it on GitHub | Decision 17: what does not pay comes out |
| Step 33: "Use the roof type's 29 W/m²K" | "29 by roof type" beside the entered value | The board "Weather and assumptions" wins |
| Step 33: the Sun lens framed lower | The Sun lens frames the path's dome (radius × 1.3) while the path is shown | Framing lower pushed sunset off the bottom; the residual (the marker behind the desktop timeline near sunset) is an item for the owner's eye |
| Steps 13 to 19, 22 in part, 23 in part, 25 to 27, 30 to 32 | Issues #73, #74, #75, #77; the strings in the plan without WebGL and the storage-full words dropped | The owner, item by item |

### Found on the way

- The production build drops exactly as `next dev` does; the drops had two causes, neither the proxy's mode: Next's proxy frees the
  upstream socket of a streamed answer and tears it down under the request that took it (11 of 20 asks of the pages right after a design
  run, 0 of 20 straight at the API); and under a group's load the report's pages queued behind the drawing lock to 33 s at the median while
  the proxy gave up at 30 s. Three sizes asking the same pages at once drew them three times each (23 to 133 s at the API).
- The saving store wrote a landed run's facts 600 ms after it landed and nothing flushed a pending write when the page was left: a reload in
  that window lost them; the device test's hard navigation raced it under load.
- Under pytest the root logger has handlers, and a logger installed "when nobody configured logging" judged that as a configuration: one
  test passed alone and failed in the whole suite, found by the fresh clone's check.
- The proofs copy the working tree and met the harness's agent worktrees under `.claude/` as files: `.claude/` is ignored now.
- A clean 300 by 100 m rectangle at the limit holds 4.2 MWp, not the demo's density's 3; the words say "about 3 MWp".
- A DXF in millimetres read as metres (800 km²) is refused as too large naming its area, which tells the user the units are wrong.
- The demo's design run peaks at 3.5 GB of process memory for 56 MB of memoised result, the roof at the limit at 19 GB; a Lambda of 10 GB
  does not fit the roof at the limit as the code stands (#76).
- The handover group's first tries on phone and tablet under load were the pages' drawing, not the tests; the shell group's first tries
  on phone (`device.e2e.ts`, three pictures) remain a watch item under load.
