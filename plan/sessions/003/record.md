# Session 3: record

2026-09-29. One session in this repo, started with the resume prompt
`plan/resume/002-phase-3-design-system-shell.md`. It built the first part of Phase 3: fonts, tokens, the kit
page and nine components, and drew two boards for what had no design. The phase is not complete. The state
of the project is in `plan/STATE.md`; what was built is in `plan/phase-03-design-system-shell.md`, "As built,
so far". Neither is repeated here.

## What the session did, in order

| # | What | Pull request |
|---|---|---|
| 1 | Start of the session: git, pull requests, stacks, `bun check` green | |
| 2 | Step 1 of the work order: what of the scope has a design, one by one | |
| 3 | Fonts from the repo; the network guard for every browser test; baselines of the screens | #24 |
| 4 | The token document made exact | straight to `main` |
| 5 | The tokens as CSS; Tailwind made of them alone | #25 |
| 6 | Button, ButtonLink, IconButton, Icon, `/kit`, the guard against raw values | #26 |
| 7 | StatusMark, Card, Stat | #27 |
| 8 | Two boards as proposals: "Controls, part 2" and "Shell states" | straight to `main` |
| 9 | Segmented, Switch | #28 |
| 10 | NumberField, Stepper | #29 |
| 11 | State, phase file, decisions D27 to D31, this record | straight to `main` |

## Why things are the way they are

Reasons that are not obvious from the code or the plan.

- **Fonts came before tokens**, against the order of the work order: the type tokens name the font families,
  and a family that does not exist makes the whole declaration void.
- **Bricolage Grotesque is the file with two axes** (weight and optical size). The mockups ask Google for
  `opsz 12..96`, so a title at 72 px and the name of the app at 17 px are different cuts. A file with the
  weight alone would have drawn both from one cut.
- **The token document was rewritten before the CSS**, because a test cannot hold "18 to 22" or "15 or 16"
  equal to anything. Every range became one value of the mockups, or two tokens.
- **Line height is 20 px almost everywhere.** The mockups set it once, on the page, and every text inherits
  it. The document had described line heights that no mockup has.
- **`@theme inline reference`.** `inline` alone makes Tailwind write `--color-ground: var(--color-ground)`
  into `:root`, a variable that names itself. With `reference` Tailwind writes no variable at all.
- **Tailwind's own theme is switched off**, so that `bg-red-500` or `text-sm` make no CSS. Utilities that
  take a bare number (`opacity-45`, `z-10`) still exist; the guard test in
  `apps/web/components/tokens-only.test.ts` catches those.
- **The spacing scale is Tailwind's, in steps of 4 px**, with half and quarter steps. Sizes of the mockups
  (30, 38, 3) are steps of it (`7.5`, `9.5`, `0.75`). A unit of 2 px would have made `p-4` mean 8 px, against
  what everyone who knows Tailwind expects.
- **States can be shown without a pointer** (`shownAs`, the variants `hovered:`, `pressed:`, `focused:`).
  The kit board shows rest, hover and pressed side by side; so does `/kit`, and so do its screenshots.
- **A type style for desktop comes after a weight.** `desktop:type-small` sets a weight and wins over
  `font-medium`. Where a weight matters on desktop it is said again (`desktop:font-medium`).
- **Segmented is a radio group**, not a row of pressed buttons as in the mockups: one Tab stop, arrows
  through the choices.
- **The screens have baselines per platform.** Text is drawn differently on each. Only `darwin` exists.
- **The badge of `next dev` is hidden by a style that the test adds**, not by Playwright's `stylePath`. While
  that was tried, a tolerance of 0.2 % of the pixels let a baseline with the badge pass on the tablet; the
  tolerance is 50 pixels now.
- **The two boards are written by a script** (`docs/design/mockups/build_phase3_boards.py`), as the Sun and
  Strings boards were. They were rendered with the browser of the tests to find what ran out of its card.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| The brightness filter of the mockups for hover | The kit board has colours for hover; the filter was the mockups' way to make every button answer. The token is removed |
| `shadow-none` for a disabled button | Tailwind writes five transparent shadows; `flat` writes `box-shadow: none` |
| `git stash` while the test stack ran | The stack lost the new files and did not find them again, even after a restart: `apps/web/.next-test` had to be deleted. Commit first, then merge |
| `git checkout` on a file to undo a trial edit | It took the uncommitted work in the same file with it. The edit was made again before the commit |
| A unit test that the axe check passes | It passed on the 404 page. Every kit test now holds that the page answers 200 |
| Publishing the two boards to the design canvas | Refused by the permission system: the canvas is open to anyone with the link. Left for the owner |
| Unit tests of `number-entry.ts` seen failing first | They were written in one step with the module. Said in pull request #29 |

## What the owner should look at

1. **The two boards**, `docs/design/previews/controls-part-2.png` and `shell-states.png`. Nothing of them is
   built before they are approved. The choices in them are listed in `plan/STATE.md`.
2. **Tabs** is proposed to be dropped from the phase: no screen uses it.
3. **The canvas** does not have the two boards.
4. **The pull request check** took 6 min 43 s on #29, of the 7 minutes after which the shading memo is due.

## Agents used

None. Every part was built and checked by the session itself.

## What was left on the owner's machine

- Nothing runs on ports 4700 to 4719.
- `apps/web/.next-test` was deleted once and is built again by the test stack.
- Two packages of Bricolage Grotesque were downloaded into the session's scratchpad, outside the repo.

## Where the rest of session 3 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/003/owner-messages.md` | One line |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/cc8af9f6-84f1-4f29-92ab-4703c82fce8b.jsonl` | 16 MB. Never read it whole. Search it as `plan/sessions/001/record.md` shows |

The log is on the owner's machine only.
