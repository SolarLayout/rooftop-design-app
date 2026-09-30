# Session 5: record

2026-09-29 and 2026-09-30. One session in this repo, started with the resume prompt
`plan/resume/004-phase-3-stores-data-flow-shell.md`. It built steps 10 to 16 of the rest of Phase 3, in one
pull request (#33), and closed the phase. The state of the project is in `plan/STATE.md`; what was built is in
`plan/phase-03-design-system-shell.md`, "As built". Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start of the session: git, pull requests, stacks, `bun check` green on `main` | |
| 2 | Step 10, the three stores | #33, `4f4cf42` |
| 3 | Step 11, the data flow; the pause as a number in code | #33, `7b8f846`, `f23438f` |
| 4 | Step 12, the formats of the vitals | #33, `ab84418` |
| 5 | The state, after step 12 | straight to `main` |
| 6 | Step 13, the routes with their placeholders | #33, `789a4cc` |
| 7 | Step 14, the shell and the third page of the kit; its tokens; decisions D37 to D39 | #33, `e220a32`, `0226e1c`, `16042db` |
| 8 | The state, after step 14 | straight to `main` |
| 9 | Step 15, the vitals with the numbers of the demo from the API | #33, `8032add` |
| 10 | Step 16, the browser tests of the shell and its baselines | #33, `4484739`, `3faa653` |
| 11 | The previews of the two boards that D37 changed | #33, `0c24a20` |
| 12 | The close of the phase: "As built", status, state, this record | straight to `main` |

## How the owner steered the session

The owner wrote twice (`owner-messages.md`): the work order, and one answer.

| He was asked | He said | What was done |
|---|---|---|
| Which words the vitals show before a system voltage: the API's, the board's, or the board's first line over the API's title. Asked with the three side by side, after the question had stood in the report of step 11 | The API's words | Decision D37. The two boards and their previews were corrected |

## Why things are the way they are

Reasons that are not obvious from the code or the plan.

- **A late answer is dropped twice.** The flow gives up what was overtaken by its signal and passes nothing
  on from a call that was given up. The store of the results drops an answer to an edit that is not the one
  asked for last, whoever brings it. The rule holds without the flow.
- **The project counts its edits.** Being opened counts, a committed edit that changes the document counts,
  one that changes nothing does not. A result carries the number of its edit; "newer" is a comparison of
  two numbers.
- **The flow is made without side effects and started in an effect.** `createDesignFlow` listens to nothing
  until `start()`. React makes it while rendering and starts it after.
- **A design that is opened runs at once.** The pause of 500 ms is for edits; nobody edits what was just
  opened.
- **The shell is as high as the screen and scrolls inside.** The top bar and the tab bar are in the flow of
  a column, not fixed; what is between them scrolls. A picture of the whole page is a picture of the screen.
- **Workspaces and lenses are links, not radios.** Each is a place with an address. They look as the
  segmented control and the rail of the mockups and say which is open by `aria-current`.
- **Present is `aria-disabled`, not `disabled`.** A disabled button takes no focus and shows no tooltip: a
  keyboard would never find it nor hear why. The states `hovered:` and `pressed:` leave such a control alone.
- **The vitals are one element for three sizes.** A row of cards, a grid and a bar are the same `section`,
  laid out by the breakpoint. On phone the order of the cards is set by `order`, and the last cell comes
  first.
- **The words of the vitals are made in `vitals-view.ts`, the notes in `notes-view.ts`.** The components
  draw what they are given. The kit makes its examples the same way, of answers of the API.
- **Two widths inside tablet and desktop (D39).** At 640 and at 1101 the top bar of the mockups has no room
  for the name of the design. What is said elsewhere goes first.
- **The drawer of the notes is a modal dialog under the top bar.** The top layer of the browser, as every
  thing that opens (session 4). The first picture showed it over the top bar; it begins under it.
- **The unit of a dimmed value has the colour of its number.** At opacity 0.55 text-2 has 3.3:1 on
  surface-1, and axe refuses it. The number and its unit are dimmed as one: 5.6:1.
- **The inspector stands three times in the page**, once for each size, because it is a placeholder. How the
  real one is mounted is decided with it, in Phase 5.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| A row that wraps, of which the first line is seen, so that a thing is shown whole or not at all (for the place of the design, the state of saving, Present) | The width that a thing gives up stays with it: a flex item is sized before its content wraps. At 1101 the word of Export went although there was room. Two breakpoints as tokens do it plainly (D39) |
| `disabled` on Present | No focus, no tooltip. `aria-disabled` |
| `text-accent` on an `IconButton` whose kind sets a colour | Two utilities of the same weight: the one later in the stylesheet wins, not the one later in the class. The colour goes on the icon |
| The border of 1.5 px tested by its computed width | The browser of the tests reports a line in whole pixels, on every size. The test reads the token and the width that is drawn |
| `getByRole("banner")` on the kit | A `header` inside `main` is no banner. On the kit the top bar is found as `header`; on the routes it is the banner |
| Reading the vitals right after the run failed | The layout answers in its own time, and late while the server runs designs for other tests. The test waits for the values, with the time of a run |
| The top bar of the kit inside its card | It was narrower than the screen and cut the name short. It stands out of the card, as wide as the screen |
| A commit of documents made after `git mv` | `git mv` stages. The commit held the renamed pages. It was taken back and made again, before it was pushed |

## What the owner should look at

1. **The shell**: `bun dev`, then `/studio/array`, `/performance`, `/handover/report`; and `/kit/shell` for
   every state. Or the baselines in `e2e/baselines/darwin/<size>/`.
2. **Decisions D38 and D39** were taken by the session and can be overruled: the vitals bar in the Studio
   only; the two widths where the top bar gives way.
3. **What is shown and cannot be used**: Present, and four of the five actions of the project switcher (New
   design, Open a project, Import a drawing, Save a copy). Each waits for its phase.
4. **The check of a pull request** took 4 min 27 s to 6 min 29 s in this session; the mark is 6 min 30 s.
   See `plan/STATE.md`, "Open items".
5. **The design canvas** shows three things of before: the board of Tabs is missing, and the boards "Shell
   states" and "Strings lens, no system voltage yet" have the words of before D37. A publish needs the
   owner's permission.

## Agents used

None. Every part was built and checked by the session itself.

## What was left on the owner's machine

- Nothing runs on ports 4700 to 4719.
- No worktree beside the repo itself.
- The scratchpad of the session holds the pictures it looked at, the logs of its checks and three small
  scripts: a page of the test stack on the three sizes (`shot.mjs`), the top bar at several widths
  (`shot-width.mjs`), a board rendered with the fonts of the repo and no network (`board.mjs`). They are
  outside the repo. The third is worth keeping when a board changes again: it is written down below.

## How a preview of a board is rendered

The boards load their fonts from Google and a script of the canvas; a test machine has neither. The session
took what is inside `<x-dc>` of the board, left the `<helmet>` out but for its `<style>`, put three
`@font-face` rules before it (Bricolage Grotesque from `apps/web/app/fonts`, Geist and Geist Mono from the
package `geist`, as data), stopped every request that is not a file, and took the picture with the browser
of the tests at the size of the board (`$preview` at the end of the board).

## Where the rest of session 5 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/005/owner-messages.md` | One page |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/6826d105-99d8-49f8-8b11-9d6e80a1b87c.jsonl` | About 20 MB. Never read it whole. Search it as `plan/sessions/001/record.md` shows |

The log is on the owner's machine only.
