# 018: Find's first step: a panel that tells the user what to do
Written: 2026-10-07, by session 19. Status: used by session 20, 2026-10-07.

## Paste this

```
You are resuming work on SolarLayout Rooftop (web) in this repo. Read CLAUDE.md, then plan/STATE.md (check it against
git, gh pr list and the code), then plan/SESSIONS.md, then plan/sessions/019/record.md and the last part of
plan/sessions/019/owner-messages.md. Follow the owner's standing instructions (sessions 18 and 19): no browser test suites
are run and no new UI tests are written; logic is tested first with bun test; every change is checked by hand in the browser
with the Playwright MCP tools on the test stack (bun dev:bg --profile test; never touch the dev profile on 4700); every pull
request that changes what is seen embeds its screenshots, at each size, and its page is opened to see them show
(docs/screenshots.md, bun tools/pr-shots.ts); every board for approval comes in three sizes on the canvas
https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (page "UI fixes"); the tools and scripts you write are committed with a
README or a guide linked from CLAUDE.md; once a design is approved you run solo: open the pull requests, merge each on a
green check (bun check --skip=e2e before every commit), go on to the next; documents go to main on their own (D26).

The work (the owner, end of session 19): Find's first step is "blank-ish". At /find, before a place is found, the map shows
the whole region and the right-hand panel holds only "Find the roof" and one line ("Search an address or a place, or paste
coordinates or a maps link. The map flies to it."), then empty space down to the foot. The owner: "the user is totally in
the dark as what to do next on this page". His screenshot: /Users/arunkpatra/Desktop/Screenshot 2026-10-07 at 5.32.24 PM.png.
The panel should hold the instructions and friendly cues.

1. Look first, at 1440, 834 and 390, on the test stack: /find opened fresh (no ?edit, no place), then after a search, then
   with no map (NoMap). Read components/find/Find.tsx (WORDS, the panel: everything below the title is gated on
   step === "outline"), Steps.tsx, NoMap.tsx, components/shell/Search.tsx, and the approved boards of Find
   (docs/design/README.md: Locate*.dc.html, LocateStates.dc.html; components.md "Map outline tools", "Enter dimensions by
   hand", "Tip"). Note what the user can do at that moment and what the screen does not tell them.
2. Propose, then design: what the first step's panel says and offers (for example: the three ways to start, with the search
   field itself or a pointer to it; what a search accepts, with examples of an address, coordinates in decimal and DMS, a
   maps link; "Use my location"; "Enter dimensions by hand instead", which today appears only at step 2; what happens next,
   the three steps; a ? opening a how-to of finding the roof, built as the help's how-tos are, D81). Keep the IA and the
   design language; the phone's panel is a sheet of 384 at the bottom. Draw the boards in three sizes on the canvas (a new
   section of the page "UI fixes"), with a prototype on a local branch if it helps, and ask the owner to approve before
   building. Ask him one question at a time, only for decisions that are his.
3. Build in small pull requests, each checked at three sizes with screenshots; update the help (a topic or how-to for this
   step: bun help:gen, bun help:pictures) if the design adds one.
Before stopping: plan/STATE.md, the session's record in plan/sessions/020/, and this prompt's status in plan/resume/README.md.
```

## Notes for the owner

- Expect a look at the page first, then a proposal and boards for approval before any code.
- One likely question: whether "Enter dimensions by hand" belongs in the first step too (today it shows only once a place
  is found, at step 2), and whether the first step offers a how-to with pictures, as Find's tools now do.
