# Session 15: record

2026-10-05. The owner said to close D56: run the whole browser suite here once, renew the pictures Phase 11 changed, and say up front if it
would take long (it was estimated at 1.5 to 2 hours; it took about 3). What Phase 11 built is in `plan/phase-11-hardening.md`, "As built";
the state is in `plan/STATE.md`. Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | The estimate before the start: the eight groups' measured times, about 50 minutes for one run, 1.5 to 2 hours in all with the pictures | — |
| 2 | `bun check`: the shell group failed on 7 pictures (the Layers button in the view controls) | the check's log |
| 3 | The shell's pictures renewed and looked at beside "Stage, Layers"; the shell green | `e2e/baselines` |
| 4 | The studio group: 67 pictures and 4 tests on phone. Four agents found the four causes by reading and one test each; every one was the test's, not the app's. The fixes run alone on every size with no retries | #89 |
| 5 | The test stack's `next dev` broke mid-session ("Could not find the module … in the React Client Manifest", `@swc/helpers` missing): `apps/web/.next-test` removed and the stack started again | — |
| 6 | The Studio's 67 pictures renewed, looked at on contact sheets per size and the Sun lens and the imported roof beside their boards | #89 |
| 7 | Handover: 17 pictures; whether a picture held "· 6 pages" depended on time, since #84 made only the list's picture wait for the count. Every picture that holds the list waits now | #89 |
| 8 | Home: 4 pictures of Open a project (the Layers button behind the dialog); "Edited just now" pinned by fixing the clock at the demo's edit | #89 |
| 9 | Kit: #84's test of the drawer's motion, three faults in it (see the commit) | #89 |
| 10 | Performance: 12 pictures (#84's assumption rows on phone, Uc's default beside the entered value), the wrap test's label locator | #89 |
| 11 | The proofs of the caching failed on the uncommitted 105 MB patch of pictures (a hook of 5 s); committed first, they passed | `plan/STATE.md`, watch items |
| 12 | Issues #87 and #88 filed; #89 merged on a green check here and on GitHub; the documents | `main` |

## How the owner steered the session

| He said | What was done |
|---|---|
| "D56 - we will close it. run the browser suite here, then teh pictures... If its going to take a considerable amount of time, tell me upfronts first" | The estimate first, then the run on his "yes" |
| "are you running with GPU or without it?" | Without: software WebGL (SwiftShader), as decided in Phase 11 (decision 3) |
| "how far are we? ETA?", "what's the status?" | The groups green so far and the minutes left, each time |

## Why things are the way they are

- **Every failing behaviour was fixed in the test**: each was traced to its cause in the app's code and the boards first; the app did what
  the board and `components.md` say each time. A test fixed is run alone on its sizes with `--retries=0`, the drawer's and the stage's three
  times over.
- **The glass of the stage is sampled where no edge label covers it**, rather than at another fixed distance: the framing differs by lens and
  size, and a fixed point broke once already with #84.
- **The drawer's way out is sampled by the page on every frame**: a closed dialog leaves the accessibility tree at once, and Playwright's
  polling cannot see a motion of 240 ms reliably.
- **Pictures renewed with `--update-snapshots=changed`, then one run without**: only the pictures that differ are written, and the second
  run shows they stand still.
- **The flaky first tries are not fixed here**: they pass alone and on their retry; the worst (#87) may be a real stall and needs a run
  under load with the trace on, which is work of its own.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| The stage's glass sampled at 20 m east instead of 30 m | Passes today, breaks the same way at the next framing change; the point is chosen clear of the labels instead |
| Expecting `none` for the open drawer's translate, then a value in pixels on the way out | The browser computes `translate: 0 0` as `0px`, and the way out in percent, and leaves out a y of 0 |

## What the owner should look at

1. **The Sun lens on desktop** (`e2e/baselines/darwin/desktop/studio-sun.png`): the whole arc is in the frame; the chip "sunset 17:27" is
   half hidden between the timeline and the vitals. Say whether it stays.
2. **#88**: the black rectangle behind the building on phone, in software WebGL.
3. **#87**: under load the energy of a reopened design can stay on "Opening"; whether a run should end in "Try again" after a time.

## Where the rest of session 15 is kept

The full log of the session is on the owner's machine, in `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/`, the file
`77eeceb7-14c5-4f48-b5da-204b204c79c1.jsonl`. Never read it whole; search it as `plan/sessions/001/record.md` shows.
