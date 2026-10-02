# Session 11: record

2026-10-02. Started with the work order `plan/resume/010-phase-7-studio-strings.md`: Phase 7, the Studio's Strings lens. The
plan was written first (`plan/phase-07-plan.md`), then six boards, then the five pull requests of the plan. What is built is
in `plan/phase-07-studio-strings.md`, "As built"; the state is in `plan/STATE.md`. Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: the documents, git, the stacks; `bun check` on `main` green | |
| 2 | Probes of the engine: the options at 1500, 1000 and 600 V; the custom option's two faults; what a choice and a custom cost | scratchpad |
| 3 | The plan: what was found, five pull requests, 24 steps, 18 decisions, the risks; approved in principle | `plan/phase-07-plan.md`, `4615b93` |
| 4 | The Voc coefficient researched (the desktop app, PVsyst's help, the handbook) and closed: decision 6 with its sources | `090aa58` |
| 5 | The data of the boards from the engine; six boards by two agents; three fixes; approved | `docs/design/mockups`, `ee8134c` |
| 6 | Part 1, the voltage, the series range, the sizing; the engine's Voc field by an agent | #53 |
| 7 | Part 2, the options and your own; the engine's custom option, strings per length, memo and captions by an agent | #54 |
| 8 | Part 3, the strings on the roof, by an agent; the browser and two test fixes by the session | #55 |
| 9 | Part 4, the inverter and the MPPT loading, by an agent; the table's width, the card's wrap, the tablet pictures whole | #56 |
| 10 | Part 5, the states, the phone callout, the frame rate by hand; the close | #57, `main` |

## How the owner steered the session

| He said | What was done |
|---|---|
| Research the Voc coefficient question from authoritative sources; do not ask what research can answer | The desktop app's code, PVsyst's help and the handbook (chapter 19) were read; decision 6 cites them |
| Why the question arose at all, and whether it had to be relitigated | It need not be: the default stays the desktop's and PVsyst's; the field the phase asks for is PVsyst's own choice of a stated value. The open item was closed |
| A shell had been running long; it was a git command | It was `bun check`, after a commit, in one shell line; the check and the git step now run as separate jobs |
| The tablet pictures of the PR did not show the roof | On tablet the Studio scrolls inside its frame; the pictures of the Strings lens are taken with the window grown by what scrolls (#56) |

## Why things are the way they are

- **Choosing an option asks nothing**: every option is in the run's answer; the choice is the document's (undo, `.rtd`) and
  the results take it at once, also when a run lands after it.
- **An edit asks for what it changes**: a voltage or a temperature never asks for a layout, so the strings stay on the roof
  while the run is on its way.
- **The custom option is keyed `custom` and is refused when it cannot be built**: an energy for a string over the Voc
  limit would be a wrong claim.
- **A string's colour follows its label**: the engine numbers strings along the rows, so neighbours differ and a string
  keeps its colour from option to option.
- **The Voc coefficient's default is the model's**, as on the desktop and in PVsyst; a value entered sizes the strings the
  datasheet's way.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| The options note as the engine writes it, with " ! " | The desktop's marker; the options outside the target stand after a note mark instead |
| "54.3 A of not known" as the board | Twelve pixels too wide for the inspector |
| A phone callout under its dot always | A dot low on the stage of 252 put it under the legend |
| A check per commit | 15 to 22 minutes each; each pull request merged on a green check at its head |

## What the owner should look at

1. **`/studio/strings` on the demo**: the strings coloured by MPPT, then by string and by inverter; hover a string, press
   it; choose B, then add your own and remove it.
2. **The voltage**: 1000 V (the longest string 19), 600 V (no length fits); a roof built on the map has none chosen.
3. **The inverter**: Replace with an OND without IMaxDC, and see the MPPT loading say the limit is not known.

## Where the rest of session 11 is kept

The full log of the session is on the owner's machine, in `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/`,
the newest file of 2026-10-02. Never read it whole; search it as `plan/sessions/001/record.md` shows.
