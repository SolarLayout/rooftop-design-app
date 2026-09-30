# Session 6: record

2026-09-30. One session, started with the resume prompt `plan/resume/005-phase-4-find-and-outline.md`. It
wrote the plan of Phase 4 (`plan/phase-04-plan.md`), drew the two boards the phase lacked, and built steps 1 to
11 of the plan in two pull requests: #35 (the map, the search, the route `/find`) and #36 (the outline three
ways, Build, the Roof lens's card). The acceptance of the phase is met by the tests of #36. Steps 13 to 15
(obstacles on the map with their heights, entry by hand) are the third pull request and remain. What is built
is in `plan/phase-04-find-and-outline.md`, "As built"; the state is in `plan/STATE.md`. Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: git, pull requests, stacks; `bun check` on `main` failed eight phone tests on a cold server | |
| 2 | A spike: MapLibre 6 renders in the browser of the tests, software WebGL, desktop and phone | scratchpad |
| 3 | The plan of the phase | `plan/phase-04-plan.md`, straight to `main` |
| 4 | The demo run once before the browser tests begin, the remedy `STATE.md` prescribed | #34 |
| 5 | Step 0: the boards "Find and outline, tablet" and "Find and outline, states and tools" | `docs/design`, straight to `main` |
| 6 | Steps 1 to 4: the API's endpoints, the stores at the root, the map, the search | #35 |
| 7 | Step 5: #35 merged (its check 6 min 26 s) | |
| 8 | Steps 6 to 11: the geometry, corners, rectangle, the loupe, Detect building, Build and the Roof lens | #36 |
| 9 | The state after steps 2, 8 and 11; "As built" so far; this record | straight to `main` |

## How the owner steered the session

| He was asked | He said | What was done |
|---|---|---|
| (not asked) | "check earlier work and see how ESRI was used and tested. Did the plan specifically ask for Overture?" | Answered from the repo: Esri tested live in session 1 with the real key, never by an automated test; Overture asked for by the owner in session 1 (D13), named in the phase file and the work order |
| (not asked) | "Are ESRI and Overture mutually exclusive or both are needed." | Both, for different jobs: Esri the imagery and the search, Overture the footprints of Detect building alone |
| A yes to the plan and to the two boards of step 0 | "go according to your plan and use ESRI / Overture as needed - both is required. Test and prove the setup when the time comes. PR must include screenshots" | Built in the plan's order; the real imagery with the key was looked at on the test stack; every pull request carries its baselines as screenshots |

## Why things are the way they are

- **The plan came first, with the facts of the code and the API in it**, as the work order asked; the decisions
  it takes are numbered D40 to D49 in `plan/README.md` by the pull requests that acted on them.
- **The local metres of a document come from the API alone** (D41). The browser's flat frame is for the live
  numbers only; the two differ by the scale of the projection and the convergence of the grid, found in step 6.
- **The stores live at the root of the app** (D44), so that a roof outlined on `/find` is the design the
  workspaces show. The shell alone opens the demo; `/find` never does.
- **MapLibre's worker is served by the app** (D40): under Next's bundler the worker gets the page's own address.
- **The tests never touch the network** (D47): one fixture tile for every address of the imagery, a fixture of
  the geocoder, one tile of Overture's release served by the ranges the reader asks for, the location from
  Playwright. The network guard of `e2e/fixtures.ts` stops the rest.
- **Every rule of drawing is in a reducer** (`lib/outline/outline-state.ts`), tested without a browser; the map
  draws what it holds and reports presses.
- **The map says `aria-busy` while it moves.** A press stops its flight where it is: the first rectangle of a test
  came out at two thirds, and the second at half, before the zoom was counted as MapLibre counts it.
- **The tools have one name on every size.** The word shown on phone is shorter.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| A sphere's metres per degree for the frame of the map | 0.5 % out in latitude at Pune, 0.24 m on 40 m; the ellipsoid's series |
| Snapping a corner at the pointer's distance along the snapped line | The foot of the pointer on the line keeps what the pointer meant; CAD snaps that way |
| The rectangle tool's drag handlers registered anew whenever the corners changed | The first move made corners and dropped the drag midway; the handlers stay while the tool is in hand |
| `--color-handle` as the colour of a corner's handle | Tailwind read the slider's `border-handle` as that colour; `--color-handle-fill` |
| The kit's tests as the proof of the phone's Redo and Clear being hidden | A button's own `inline-flex` wins over `hidden` in the same class; a wrapper hides them |
| Reading a field's value with `textContent` in a test | An input has a value, not text |
| The test box of the footprints' fixture across a tile edge | Two tiles of 1.3 MB; one tile of 0.9 MB holds the demo's place |

## What the owner should look at

1. **The flagship on the test stack**: `bun dev:bg --profile test`, then `/find` on the port of
   `.dev/test/pids.json`; the real imagery with the key renders there. Or `bun dev` on 4700.
2. **The baselines** in `e2e/baselines/darwin/<size>/`: `find`, `find-outline`, `studio-roof`.
3. **Decisions D40 to D49** in `plan/README.md`, taken by the session under his "go according to your plan".
4. **The load of the machine**: full runs of the browser tests took 310 to 367 s with a load average above 50
   from Chrome, Cursor and the desktop app, and one kit test failed at a time, a different one each run; each
   passed alone (`STATE.md`, "Open items").

## Agents used

None. Every part was built and checked by the session itself.

## What was left on the owner's machine

- The test stack may still run on 4710 and 4711 when the session ends; `bun stop --profile test` stops it.
- No worktree beside the repo itself.
- The scratchpad of the session holds the spike of MapLibre, the pictures looked at, the logs of the checks and
  the scripts that took the pictures (`boxes.mjs`, `search.mjs`, `box.mjs`, `loupe.mjs`, `buildings.mjs`) and
  rendered the boards (`boards/board.mjs`, the way `plan/sessions/005/record.md` describes). They are outside
  the repo.

## Where the rest of session 6 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/006/owner-messages.md` | One page |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/ea501fff-6630-44fd-b067-409d8d06181e.jsonl` | Never read it whole. Search it as `plan/sessions/001/record.md` shows |

The log is on the owner's machine only.
