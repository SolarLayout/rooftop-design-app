# Session 20: Find's first step, a panel that says what to do (2026-10-07)

The session began from resume prompt 018 (`plan/resume/018-find-first-step.md`): the owner found Find's first step
"blank-ish", the user "totally in the dark as what to do next on this page". It looked first, proposed and drew the boards,
had them approved, and built them in three pull requests (D85). The owner's words are in `owner-messages.md`. The log:
`~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/2cb905f0-b86f-42e2-a823-7f73780e575b.jsonl`.

## Standing instructions given or kept in this session

- Kept from sessions 18 and 19: no browser test suites and no new UI tests; logic tested first with `bun test`; each
  change checked by hand in the browser on the test stack at 1440, 834 and 390; screenshots in every pull request that
  changes what is seen; boards for approval in three sizes on the canvas; run solo once a design is approved; documents to
  `main` alone (D26).
- **New:** the pull request's page is not opened to see its pictures show. The owner: "no need to physically open the PR to
  check the screenshots. i will flag if i don't see any where it should have been, just nudge me". Each pull request is
  announced with its link and a word that its screenshots are in it. `CLAUDE.md`, `apps/web/CLAUDE.md`,
  `docs/screenshots.md` and the session's memory say so now.

## What was done

| What | Where |
|---|---|
| Looked at `/find` fresh, after a search, and without a map (WebGL refused), at three sizes | the boards' "Today" frames |
| Boards "UI fixes · Find's first step, a panel that says what to do", drawn from a prototype on the local branch `design/find-first-step` (never merged); approved | `0e40391`; `docs/design/mockups/build_ui_fixes_find_first_step.py`, `find_first_step/`; the canvas, page "UI fixes", last row |
| The panel: Start here (three cards), The search understands (four examples a press puts into the search), Three steps; the search's accent line while focused; `Search` gets a handle (`focus`, `put`, `locate`) | #143 (D85) |
| Without a map, a place searched opens the entry by hand with the place filled (before: an outline step with no map to draw on) | #144 |
| The how-to "Find the roof" behind the ? beside the title, its pictures by `bun help:pictures` (a `fresh` start, the act `search`, a top-left crop, a region crop, the scale bar read in km) | #145 |

## Why things are as they are

- The examples put their words into the search and do not search: the user sees how each is read (coordinates and links
  are read back under the field at once) and nothing flies away unasked.
- The panel's headings have no ? of their own: the panel is itself the guide, and its ? stands beside the title (named in
  `WITHOUT_A_DISC`, `tools/help/coverage.ts`).
- The cards' words and the steps live in `lib/outline/first-step.ts`, tested; the component only draws them.
- The board drew three pictures for the how-to. The third (the place chosen) showed only the plain ground and a pill too
  small to read in the 420 sheet, so step 3 is words alone. Picture 2 is cropped to 480 CSS pixels so that it reads.

## Tried and dropped

- Opening the pull request's page in Chrome to see the pictures: the owner said not to (above).
- Picture 2 at 760 wide, then 490: unreadable in the sheet, then the steps pill's edge showed; 480 it is.

## Found on the way

- Next's image cache on the test stack (`apps/web/.next-test/dev/cache/images`) keeps a help picture after the file is taken
  again: the sheet showed the old one until the cache was cleared.
- The `open` command run on the owner's screenshot opened it in Preview on his desktop: read pictures with the Read tool only.

## Left

- The owner's Phase 15 check (clips in Safari on an iPhone or iPad) is still open.
- When the browser suites run again: Find's screens are renewed (the first step changed).
- Local branches never merged, by design: `design/find-first-step` (the prototype of the boards).
