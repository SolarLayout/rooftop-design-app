# Session 4: record

2026-09-29. One session in this repo, started with the resume prompt
`plan/resume/003-phase-3-components-stores-shell.md`. It built the components of Phase 3: parts 1 and 2 of
the work order and steps 3 to 9 and T of the plan. The phase is not complete: the stores, the data flow, the
routes and the shell remain, and are the work of session 5. The state of the project is in `plan/STATE.md`;
what was built is in `plan/phase-03-design-system-shell.md`, "As built, so far"; how the rest is built is in
`plan/phase-03-rest-plan.md`. None of them is repeated here.

## What the session did, in order

| # | What | Pull request |
|---|---|---|
| 1 | Start of the session: git, pull requests, stacks, `bun check` green | |
| 2 | The board of Tabs drawn, as a proposal | straight to `main` |
| 3 | The guard against raw values reads `*.ts` | #30 |
| 4 | Slider, RangeSlider; `measures()`; the guard refuses a line width given as a number | #31 |
| 5 | The plan of the rest of the phase, asked for by the owner | straight to `main` |
| 6 | Sheet, and the second page of the kit | #32 |
| 7 | ProgressRing, RunStep, Skeleton | #32 |
| 8 | Tooltip, Toast, Toaster; the numbers in code | #32 |
| 9 | Select, FloatingPanel | #32 |
| 10 | Dialog, SheetGrip | #32 |
| 11 | FileDrop | #32 |
| 12 | Table | #32 |
| 13 | Tabs | #32 |
| 14 | State, phase file, decisions D34 to D36, this record, resume prompt 004 | straight to `main` |

## How the owner steered the session

The owner wrote seven times while the session worked (`owner-messages.md`). What came of it:

| He said | What was done |
|---|---|
| The whole of Phase 3 in this session | Taken on. Overruled later by himself (the last row but one) |
| One pull request, not many | #31 was open already and was merged as it was. Everything after it went into one branch. Decision D34 |
| A plan first | `plan/phase-03-rest-plan.md`, with the steps, nine decisions, the risks |
| "all approved" | Read as: the plan, its decisions, and the board of Tabs. Decision D35 |
| Split if the pull request gets too large; up to the session | Split after the components, where nothing of the first half depends on the second. The second half in a new session. Decision D36 |
| A resume prompt, the state, the memory; no loss of context | This record, `STATE.md`, resume prompt 004 |

## Why things are the way they are

Reasons that are not obvious from the code or the plan.

- **`measures()` is the only inline style.** Where a handle is, how far a sheet is dragged and where a list
  floats follow the data and cannot be classes. They go through one function that writes numbers into
  variables (`--at`, `--span`, `--x`, `--y`), and a utility makes a place of them. The guard lets
  `style={measures(` through and nothing else. A size, a colour or a shadow never comes this way.
- **Numbers that code needs are not CSS tokens.** A store without React cannot read a variable of the
  stylesheet. Times and gaps are in `design-numbers.ts`, written in the token document under "Numbers in
  code", and a test holds the two equal, as `globals.test.ts` does for the tokens.
- **The top layer of the browser, not z-index.** A tooltip and a list are `popover`, a dialog is `dialog`.
  The inspector will scroll, and a list inside it would be cut off; a dialog of the browser keeps the focus
  by itself. The toasts are the exception: a live region must be in the page before it speaks, so their
  place is always there, in the layer `z-toast`.
- **On phone and tablet what opens is a bottom sheet** (Select; on phone the Dialog). It is the same
  element as on desktop, laid out by the breakpoint, not a second component.
- **Two kinds of sheet.** `Sheet` has stops, stands in a room and is for the inspector. What opens over the
  screen (`FloatingPanel`, `Dialog`) has the handle `SheetGrip`, which closes.
- **The slider's handle stays inside the track.** The mockup puts the middle of the handle on the end of
  the track, which puts half a handle outside the panel.
- **The kit has pages.** One page with everything would be 20 screens high on phone. The list of the pages
  is in `components/kit/Pages.tsx` and in `e2e/tests/kit.e2e.ts`; a new page is added to both.
- **The pull request was split after the components**, not where the owner's message came. Nothing of the
  first half depends on the second, so it could be merged and looked at by itself.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| A `ref` of the rail of a slider, given back inside the object of the hook | `react-hooks/refs` takes an object that holds a ref for a ref, and refuses every read of it while rendering. The rail is found from the event; where a ref is needed, the hook gives it back beside its state (`useFloating` gives back a pair) |
| `autoFocus` on the first action of a dialog | React focuses at the mount, when the dialog is not open yet. The focus is set after `showModal()` |
| The panel of a popover hidden by a class until it is placed | What is not seen cannot take the focus. `open:flex` shows the panel while it is open, and the browser hides it while it is closed |
| `hidden` on a button that has `inline-flex` | The two have the same weight, and the later one in the stylesheet wins. What hides goes on an element of its own |
| The box of a ring that turns, to test its size | The box turns with the ring. The size is tested by its style |
| The clock of Playwright, installed and left running | A test of 390 ms passed or failed by the speed of the machine. `pauseAt` after the page is there lets the time stand still |
| The pointer of a test placed by the place of an element that is not in view | The press went nowhere. An example is brought into view first |
| Publishing the board of Tabs to the design canvas | Refused by the permission system ("Expose Local Services"), although the owner had approved the board. Not worked around. It waits for the owner |
| Browser tests seen failing, for every component | The tests of the Sheet, of tooltip and toast and of the FileDrop were first run after their components. Said in pull request #32 |

## What the owner should look at

1. **The board of Tabs is not on the canvas.** It is approved and in the repo. To publish it, the owner
   allows the publish to the artifact in his settings, as he did in session 3, or publishes it himself:
   two files, `docs/design/mockups/Tabs.dc.html` as `project/Tabs.dc.html` and
   `docs/design/mockups/canvas.json` as `project/canvas.json`.
2. **The check of the pull request** took between 3 min 33 s and 6 min 27 s in this session, on the same
   code of the API. The mark for the shading memo is 6 min 30 s.
3. **The components on the kit**: `/kit` and `/kit/part-2` on the test stack, or the baselines in
   `e2e/baselines/darwin`.

## Agents used

None. Every part was built and checked by the session itself.

## What was left on the owner's machine

- Nothing runs on ports 4700 to 4719.
- The scratchpad of the session holds the pictures it looked at and three small scripts (a board rendered
  with the fonts of the repo and no network; a part of a page on the three sizes; a page after some steps).
  They are outside the repo and are not needed again: resume prompt 004 says how to look at a screen.

## Where the rest of session 4 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/004/owner-messages.md` | One page |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/b3a2361b-c69b-45cc-be92-e7022515469c.jsonl` | 15 MB. Never read it whole. Search it as `plan/sessions/001/record.md` shows |

The log is on the owner's machine only.
