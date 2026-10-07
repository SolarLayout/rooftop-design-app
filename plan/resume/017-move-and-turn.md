# 017: move and turn the roof and its obstacles, the grab cursor, the tips (D79)
Written: 2026-10-07, by session 18. Status: open.

## Paste this

```
You are resuming work on SolarLayout Rooftop (web) in this repo. Read CLAUDE.md, then plan/STATE.md (check it against
git, gh pr list and the code), then plan/SESSIONS.md, then plan/sessions/018/record.md and the last part of
plan/sessions/018/owner-messages.md. Follow the owner's standing instructions of session 18: no browser test suites are
run and no new UI tests are written; logic is tested first with bun test; every change is checked by hand in the browser
with the Playwright MCP tools on the test stack (bun dev:bg --profile test; never touch the dev profile), and its
screenshots go in the pull request (pushed to the orphan branch pr-shots by git plumbing, linked by commit SHA); every
board for approval comes in three sizes on the canvas https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (page "UI fixes");
the owner reviews and merges the pull requests himself; documents go to main on their own (D26).

The work: build D79, approved 2026-10-07. Read it in plan/README.md, the spec in docs/design/components.md ("Move and turn
the roof and its obstacles (Find's map)"), and the boards docs/design/mockups/MoveTurn*.dc.html (previews
docs/design/previews/ui-fixes-move-turn-*.jpg). In order, one pull request each unless they are small:
1. Find's map: once the outline is closed, a press inside the roof (not on a corner) picks it up whole; a drag moves it with
   its obstacles; the arrow keys nudge 0.1 m, Shift 1 m; a turn handle on a stem of 44 square to the north edge's middle
   turns it about its middle, snapping to north within 3°; live labels ("1.6 m E · 0.6 m S", "6.0° · faces 186° S"); each
   move or turn one step of Undo; on touch one finger inside moves, two fingers move the map. Where: the reducer
   apps/web/lib/outline/outline-state.ts (every rule of drawing is there; pure, tested), the geometry beside it
   (lib/outline/rectangle.ts already turns a rectangle with a snap to north; lib/outline/nudge.ts), the map layer
   apps/web/components/find/OutlineLayer.tsx (handles as markers), the panel's Faces.
2. Obstacles on the map: a drag inside a picked obstacle moves it (0.1 m, kept on the roof); boxes and buildings get the
   same turn handle; tanks and walls only move; corners still size them (lib/outline/obstacles.ts and the reducer). The
   Studio's Roof lens already moves and turns obstacles on the roof (components/studio/Handles.tsx): reuse its rules.
3. The cursor: an open hand over the Studio's stage and Find's map at rest with nothing in hand, a closed hand while either
   is dragged; the crosshair while a drawing tool is in hand (lib/scene/stage-store.ts cursorOf, components/studio/Stage.tsx;
   OutlineLayer sets the map canvas's cursor).
4. The tips: one small card at a time at the map's edge, shown when a move becomes possible, never over what is moved; Got
   it closes it for good on the device (localStorage behind try/catch, a per-viewer convenience); it goes by itself once its
   move is done; a ? in the toolbar shows them again. A new component of the kit: write it in components.md first.
Check each step in the browser at 1440, 834 and 390 with the demo roof (Home, Open the demo, Studio, Roof lens, Edit), run
bun check --skip=e2e before every commit, open the pull request with screenshots, and update plan/STATE.md before stopping.
```

## Notes for the owner

- Expect two or three pull requests: the roof (the largest), the obstacles, and the cursor with the tips.
- A decision may come up: whether a press inside the roof should still start a new obstacle when an obstacle tool is in
  hand (the board assumes a press picks the roof only when no drawing tool needs the press; the session will ask if the
  code says otherwise).
