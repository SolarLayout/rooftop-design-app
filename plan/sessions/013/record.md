# Session 13: record

2026-10-03. Started with the work order `plan/resume/012-phase-9-handover.md`: Phase 9, Handover and exports. The plan was written first
(`plan/phase-09-plan.md`), then four boards, then the four pull requests of the plan; on the way the browser step of `bun check` was split
into groups and the fast check made the gate. What is built is in `plan/phase-09-handover.md`, "As built"; the state is in `plan/STATE.md`.
Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: the documents, git, the stacks; `bun check` on `main` green from the cache | |
| 2 | Probes of the API: what each export costs and weighs, a page as an image at 150 dpi, the zip, the `.rtd` | scratchpad |
| 3 | The plan: what was found, four boards, four pull requests, 22 steps, 16 decisions, the risks; approved | `plan/phase-09-plan.md`, `2c4867c` |
| 4 | The data of the boards from the engine (`handover_data.json`, the six page images); four boards by two agents; approved | `docs/design/mockups`, `7ac164d` |
| 5 | Pull request 1 by two agents (the API's `.rtd` and day; the web frame); four full checks lost one test each to a 5 s wait under load; three fixes of tests | #62 |
| 6 | The browser step split into six groups keyed on what each can see, an import walk refusing a crossing, one retry, `docs/checks.md`, D54 and D55 (the owner's rule: the fast check is the gate) | #63 |
| 7 | Pull request 2 by two agents (the report's pages in the engine and the API; the paper preview); the option shown handed to the exports, the rewrite's dropped answers found | #64 |
| 8 | A trial of hardware WebGL for the browser tests: five to six times faster a picture, the satellite ground missing in later runs; dropped at the owner's steer | scratchpad, `plan/STATE.md` |
| 9 | Pull request 3 by an agent (the SLD, the tables); the chart tooltips found at the screen's corner since Phase 8 and fixed | #65 |
| 10 | Pull request 4 by an agent (the zip, the file previews, Download all) | #66 |
| 11 | The close: "As built", the state, this record; Phase 10 begun unattended at the owner's pre-approval | `main` |

## How the owner steered the session

| He said | What was done |
|---|---|
| "approved" to the plan and to the boards | Built as planned |
| The full check of 29 minutes should not run what need not run; "i tend to agree. yes." to the split | The browser step in six groups (#63) |
| "totally untenable to wait for so long"; "Surely there is a problem with our setup/approach" | The rule D55: the fast check and the groups the change reaches are the gate; the whole suite never runs by itself, here or on GitHub |
| "don't fight with the e2e tests ... just the ones that we write in this session"; "focus on the actual core PRs" | The hardware WebGL trial stopped; pull requests 2 to 4 checked with their own tests alone |
| Phase 10 pre-approved to plan, draw, build and merge unattended; stop after the Phase 11 resume prompt | Begun at the end of this session |
| "ensure the screenshots actually meet expectations of the design" | Every baseline looked at beside its board before a pull request; two misses caught that way (pictures taken before the run landed; tablet captions truncated) |

## Why things are the way they are

- **The `.rtd` is the engine's writing and needs no option**: one writer of the format (D7); a design before a voltage can be saved.
- **The report's preview is the engine's page as an image**: the PDF and the preview are one drawing; the day comes from the browser so
  they agree, and the screens test fixes the clock so the picture does not move with the calendar.
- **A file of the design is asked for the option the run shows**: the API refuses a file without a chosen option, and the document names
  one only once the user picks; the project file stays the document as it is.
- **The browser step is six groups**: a feature pull request paid 31 minutes for one folder; a Handover change pays about 11 now.
- **The fast check is the gate (D55)**: four full runs each lost one test to a wait under the suite's own load. The whole suite runs only when
  the owner says.
- **Software rendering stays**: the GPU drew the Studio five to six times faster but the satellite ground went missing in later runs; the
  cause was not found and the priority was the core pull requests.
- **The exports are asked up to three times**: the rewrite in `next dev` drops the report's pages now and then; from the shell it never did.
  The cause is Phase 11's (a production build and a proxy).

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| Fixing the load timeouts one test at a time | A different test failed in each full run; the expectation's wait is 15 s now and a test is retried once |
| Hardware WebGL for the browser tests | The satellite ground missing in later runs; the owner's priority |
| Dimming a waiting row's words | Contrast (axe); the icon alone is dim |
| Both the facts and the page's words in the report's head | The board draws the page's words alone there |

## What the owner should look at

1. **`/handover` on the demo**: the report's pages and Download PDF; the SLD under the pointer; the schedule sorted and copied; the CAD
   layout's plan; Download all.
2. **The name** typed in the project file's preview or the switcher, in the top bar and in the files' names.
3. **`docs/checks.md`** and D55: how a pull request is checked now.

## Where the rest of session 13 is kept

The full log of the session is on the owner's machine, in `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/`, the
newest file of 2026-10-03. Never read it whole; search it as `plan/sessions/001/record.md` shows.
