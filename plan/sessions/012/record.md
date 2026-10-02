# Session 12: record

2026-10-02 to 2026-10-03. Started with the work order `plan/resume/011-phase-8-performance.md`: Phase 8, Performance. The plan was
written first (`plan/phase-08-plan.md`), then six boards, then the four pull requests of the plan. What is built is in
`plan/phase-08-performance.md`, "As built"; the state is in `plan/STATE.md`. Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: the documents, git, the stacks; `bun check` on `main` green | |
| 2 | Probes of the engine: every figure of the screen in `/design`; what each edit costs (0.25 s, 4 s, 12 s); the weather sources on Pune; a CSV without temperature at 25 °C; `/design` never downloads | scratchpad |
| 3 | The plan: what was found, six boards, four pull requests, 22 steps, 19 decisions, the risks; approved | `plan/phase-08-plan.md`, `db4d507` |
| 4 | The data of the boards from the engine (`performance_data.json`); six boards by two agents; approved with the words of decision 14 | `docs/design/mockups`, `d279b16` |
| 5 | Pull request 1 by two agents (the engine's figures after the year; the page, the KPIs, the summary, the states); two regressions of shared components found by the full check and fixed | #58 |
| 6 | The engine and test-stack parts of pull request 4 by an agent (downloads off, the weather fixtures, the two CSV notes), reviewed and parked | `feat/phase-8-weather-assumptions` |
| 7 | Pull request 2 by an agent (the loss chain; the candidates in threads), the browser run here; the tapped readout, the LID placeholder and the phone's well fixed | #59 |
| 8 | Pull request 3 by an agent (the charts), the browser run here; the closed tooltip, the tablet months, the plot below the window fixed | #60 |
| 9 | Pull request 4's web part by an agent (the flow's weather, the select, the CSV dialog, the assumptions), the browser run here; the notes' list, the fixture's handler, the forced press, the header's row fixed | #61 |
| 10 | The state and the phase's "As built" kept on `main` after each merge | `cf3e38b`, `89b5a97`, `995b87c` |

## How the owner steered the session

| He said | What was done |
|---|---|
| "approved" to the plan | The boards were drawn; step 1 of pull request 1 began in parallel, since it did not depend on them |
| "approved" to the boards and the words of decision 14 | The boards were committed; the four pull requests were built |

## Why things are the way they are

- **The figures after the year are out of the memo's key**: the uncertainty, the exceedance values, the 25 years and the CO2 touch
  no hour; a change of one answers in a quarter of a second. Dropping the memo changes nothing but speed (D6).
- **The candidates are simulated in threads**: numpy releases the interpreter and the seven are independent; the answers are the
  same to the bit, and a loss edit answers in 1.7 s instead of 4.
- **The chain's labels are the engine's**: the approved board had reworded four of them; the engine's words are not reworded.
- **A design without weather gets it from the flow, once per edit, under the same edit**: the API says when weather is missing;
  the web judges nothing itself, and the loaded hours are the document's (D7) without a step of undo.
- **The test stack's API has downloads off**: the browser's guard cannot see what the API asks; a route a test misses is refused
  in words instead of reaching PVGIS unseen. The browser tests answer `/api/weather` from the API's own recorded answers.
- **Every number on the boards is the engine's**: the hand-typed running totals of the approved board were off in the last decimal.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| Hiding the unit beside a placeholder in a number field | The placeholder was still too long for the phone's well; the placeholder says the number before its unit instead |
| "PVGIS TMY weather" in the line of the run (decision 2) | Wraps at 1440; the approved board's "PVGIS weather" kept |
| `--update-snapshots` to renew a baseline that changed little | It leaves a picture whose difference is under the threshold; the file is deleted first |

## What the owner should look at

1. **`/performance` on the demo**: soiling 2 → 3 and the chain's cascade; the rear gain off; LID entered and "Use the PAN's"; the
   readout under the pointer.
2. **The charts**: the Table tabs; degradation 0.70 answering at once; the crosshair on the 25 years.
3. **The weather**: NASA POWER 2023 chosen (12 s, "no horizon"); a CSV of GHI alone with its three notes; the assumptions, P50 · P90
   · P99.
4. **A roof built on the map** now gets its energy on Performance without a route.

## Where the rest of session 12 is kept

The full log of the session is on the owner's machine, in `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/`,
the newest file of 2026-10-02. Never read it whole; search it as `plan/sessions/001/record.md` shows.
