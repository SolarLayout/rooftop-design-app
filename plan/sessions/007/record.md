# Session 7: record

2026-09-30. One session, started with the resume prompt `plan/resume/006-shading-memo-and-phase-4-rest.md`. It
had two slices: the memo for the shading in the tests (#37), then the rest of Phase 4: the two boards of step 13,
steps 14 and 15 in the third pull request (#38), and the close of the phase. What is built is in
`plan/phase-04-find-and-outline.md`, "As built"; the state is in `plan/STATE.md`. Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: git, pull requests, stacks; `bun check` on `main` green (1,152 browser tests, 5.4 min) | |
| 2 | Measured pytest with a plugin that counted the work: 151 s; 66 shadings for 15 distinct inputs, 208 simulations for 66; the repeats 76 s and 10 s, of which 48 s the proofs that must stay without a memo | scratchpad |
| 3 | One memo for the pytest session, shared by the engine tests and the API: pytest 122 s here. GitHub's runners vary two-fold, so there the gain did not show (274 s against 279 s and 155 s before) | #37 |
| 4 | The two boards of step 13, drawn with a builder, rendered, listed; committed to `main` as a proposal | `docs/design`, `86af718` |
| 5 | The state of the memo and the boards; the canvas published (four boards it lacked) once the owner made it private | `main` |
| 6 | Step 14: the obstacles on the map with their heights; step 15: the roof by hand | #38 |
| 7 | The close of the phase: "As built", the status, the state, this record; resume 006 used | `main` |

## How the owner steered the session

| He was asked | He said | What was done |
|---|---|---|
| (not asked) | "You must add those to the design board, did you ? The artifact which has the design" | The publish was tried and refused by the permission system; said so and stopped |
| The permission to publish | "try to publish now - i temporarily made it private to me" | The four boards the canvas lacked (two of session 6, two of this session) and the index published; the canvas holds the 21 boards |
| A yes to the two boards | "approved. did you do the mobile form factor mockups also?" | Built to them; the phone is in each board, at 390 by 844; tablet follows the phone's structure with the room of 834 (D46) |

## Why things are the way they are

- **The memo of the tests is one object for the session** (`apps/api/tests/kept.py`), and the API's memo is made the
  same object by a session fixture: an engine test and an API test of the same design share one shading. The tests
  that count the work (the proofs of the memo, of progress reporting, of a fresh server) keep their own memo or none.
- **The toolbar follows the roof** (D50): open, the ways to outline; closed, the obstacles. It waits for a drag to
  end, because a box dragged across the roof is closed from its first move.
- **The height is a dialog right after the shape** (D51), with nothing preselected: the field is empty and the
  action waits, yet can be pressed so that the press commits the field. Enter in the field commits and adds.
- **Entering by hand is another way to set the same outline** (D52): the fields are the truth; the same tiles, roof
  type and Build follow. With a map the roof stands on the imagery and its corners are shown, not dragged.
- **A roof by hand keeps the source `coordinates`**, through a field of the API's `OutlineOnMap`, so that the Roof
  lens says "Entered by hand", as the desktop app's roofs do.
- **The two boards are of the states-and-tools kind**, each with the phone inside a card, and the by-hand board
  carries the desktop screen at full size at its top.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| The primary action of the height dialog `disabled` until a number | A press on a disabled button does not blur the field, so the number typed never committed: two presses were needed. The action waits (`aria-disabled`) and can be pressed |
| The height dialog inside the layer over the stage | The layer lets pointer events through and the modal dialog inherited that: Enter worked, the mouse did not |
| The tool switched to the obstacles the moment the roof closed | A box dragged across the roof is closed from its first move: the drag's tool vanished under it. The switch waits for the drop |
| A drag with Box in hand from wherever the press began | A press on a handle reached the map too: turning the rectangle drew a box. The press must begin on the canvas |
| The building of the browser test east of the roof, and then 5 m north of it | Off the phone's map; then on the target of the roof's midpoint handle, which reaches 5 m beyond the edge |
| The place fields side by side, as the board drew them | A coordinate with five decimals and its label do not fit two to a row; one per row on every size |
| The corners of the by-hand roof dragged on the map, as the board said | Two truths of one roof; the fields are the truth, "Draw on the map instead" is the way to drag |
| A Bash command with nested triple quotes for a patch | Python refused it; a script file instead |

## What the owner should look at

1. **The flagship complete on the test stack**: `bun dev:bg --profile test`, then `/find`: outline the roof, draw a
   box, a tank, a wall and a building with their heights, build; and "Enter dimensions by hand instead", with and
   without the map.
2. **The baselines** in `e2e/baselines/darwin/<size>/`: `find-outline` (the obstacle tools), `find-obstacles`,
   `find-by-hand`, `studio-roof` (the card counts the obstacles).
3. **Decisions D50 to D52** in `plan/README.md`, taken under the approval of the boards.
4. **The open items** of `plan/STATE.md`: pytest-xdist as the next step if a check passes the mark again; the CI
   runners vary two-fold.

## Agents used

None. Every part was built and checked by the session itself.

## What was left on the owner's machine

- The test stack is stopped at the end of the session (`bun status` shows).
- No worktree beside the repo itself.
- The scratchpad of the session holds the measuring plugin of pytest (`measure_plugin.py`, `measure2.json`), the
  logs of the checks, the renderer of the boards (`boards/board.mjs`, copied from session 6) and the drafts of step
  15. They are outside the repo.

## Where the rest of session 7 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/007/owner-messages.md` | One page |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/18ac142d-2720-4180-8b88-82c6284d458a.jsonl` | Never read it whole. Search it as `plan/sessions/001/record.md` shows |

The log is on the owner's machine only.
