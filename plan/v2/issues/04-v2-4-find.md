# V2 · 4 · Find: the search first, the instruction by the step, the tools with their words, Build pinned

Part of the epic **V2** (#207). Board set 4 of the approved V2 design (D98 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 4 of 12. Needs first: #209.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

Find has one job: an outline of the roof, then Build. It takes the Studio's work column, its instruction follows the step (Find the roof, Outline the roof, Add what stands on the roof, Enter the roof by hand), the search is the first thing in it, the roof type is a question once the outline is closed, and Build this roof stays pinned at the foot at every size. No tips card.

## The board

The canvas page **V2**, row 4: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Find.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Find.dc.html), [`V2FindTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2FindTablet.dc.html), [`V2FindPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2FindPhone.dc.html), [`build_v2_find.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_find.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 4 · Find: the search first, the instruction by the step, the tools with their words, Build pinned · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Find.jpg?raw=true)

Tablet: [V2FindTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2FindTablet.jpg?raw=true) · Phone: [V2FindPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2FindPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-02** (P0) · Find, first step: The panel "Find the roof" holds a lead sentence, a heading "Start here", three cards, "The search understands" with four example chips, and "Three steps" with three rows: 14 controls, about 600 px of reading, before the search field is used.
- **V2-04** (P1) · Find, outline closed: Once the outline is closed the panel's title stays "Outline the roof" but its lead switches to the tool in hand: "Drag a box across the thing on the roof, then turn it by its handle.
- **V2-06** (P1) · Find, tips: On closing the outline a card "Move or turn the roof" with five rows of key hints, a link "Show me how" and a button "Got it" covers the top left of the map, over the roof the user is looking at; on phone it fills the sheet, the edges and the obstacles below it.
- **V2-07** (P1) · Find, roof type before the roof: The roof type segmented control (Tilted rows · East-west · Sloped) and Build this roof are in the panel from the first corner, before there is a roof.
- **V2-08** (P2) · Find, obstacle height: The dialog "Height of the box" says "The imagery cannot give it.
- **V2-10** (P0) · Find, by hand, desktop: The panel "Enter the roof by hand" is 952 px tall in an 858 px scroller at 1440 × 900; Build this roof sits at 839 to 895, the last 60 px of the window.
- **V2-11** (P0) · Find, tablet and phone: Build this roof is in the panel's scroll at 834 and 390, under the fields, the three read-outs, the roof type and (by hand) "Draw on the map instead".
- **V2-22** (P1) · Map not available: "This app has no key for the imagery.
- **V2-58** (P1) · Find's steps pill says 1 · 2 · 3 and the panel says "Step 2 of 3": Two counters for one thing.
- **V2-77** (P1) · Tablet: the outline's lead and Build: At 834 the panel's lead (V2-04) and the Build button are below the map's foot; the sheet is half open and must be dragged.
- **V2-82** (P2) · Tablet: the Find panel at the half stop: shows the lead and the first card, with "Step 1 of 3" at the right.
- **V2-101** (P2) · Focus order on Find: goes top bar, map buttons, toolbar, then the panel; the panel's primary is last.
- **V2-117** (P2) · Icon-only controls at the eye's entry: At 1440 Find shows 11 icon-only buttons (back, north, zoom in, zoom out, undo, redo, clear, square the corners, three help discs) and the Studio 8 (north, Layers, Play, the time, four discs); on tablet Present is a bare triangle.

## Scope in

1. The first step (`components/find/FirstStep.tsx`): `Find the roof`, `Search for the building, then outline its roof on the map.`, the search field first (48 high, `Address or coordinates`, the examples in its list while empty: an address, coordinates, a maps link), then `Use my location` (When you are at the building) and `Enter the roof by hand` (Type its length and width) as rows. The lead, Start here, the three cards, The search understands and Three steps are removed; the search leaves the top bar on Find.
2. Outlining (`OutlinePanel.tsx`, `OutlineTools.tsx`): `Outline the roof`, `Click each corner of the roof. Click the first corner again to close the outline.` (Press on touch); the tools as a row with their words: Corners, Rectangle, Detect building; `<n> corners`; Undo and Clear with their words. The instruction follows the step, not the tool.
3. The outline closed: `Add what stands on the roof`, `The roof is outlined: <area> m², <n> corners. Add its obstacles, choose its type, then build.`; Obstacles · n with `Choose a kind, then drag over it on the map.` and Box, Tank, Wall, Tree with their words; the list of obstacles in words (`Stair room · Box · 5.0 × 4.0 m · 3.0 m high`); Roof type as a question with a default and a line each: `Flat, rows facing south` (Default, Tilted rows, the usual for a flat roof), `Flat, rows facing east and west` (Low rows back to back: more modules, less from each), `Sloped` (Modules flush on the slope).
4. Build this roof · <area> pinned at the column's foot (the sheet's foot on touch, at every stop) from the closed outline on, with `Opens the roof in 3D with the array on it.` under it; not shown before the outline closes.
5. No tips card (`components/ui/Tip.tsx` leaves Find; D79's moves stay): the roof's own handles; one line on the map for the first outline only: `Drag the roof to move it · drag ○ to turn it`.
6. The obstacle's height (`HeightDialog.tsx`): beside the obstacle, `Height above the roof` with its field, Cancel and Add.
7. By hand (`ByHandPanel.tsx`): `Enter the roof by hand`, `Type the roof's length and width. Add its obstacles in the Studio.`, Length, Width, `The long side faces` South · East · North · West, the roof type, Build pinned, `Draw on the map instead`.
8. Without a map (`NoMap.tsx`): `The map is not available` · `Enter the roof's measurements instead.` with the by-hand column open.
9. Focus order: the column first, its primary last in it, then the map's controls. Words on Undo and Clear; icons alone only for zoom and north.

## Scope out

- Move and turn (D79) as built.
- The map's provider, the search's parsing (D68), Detect building's engine.
- Editing the outline from the Studio (Plan, issue 7).

## Where the code is

- `apps/web/components/find/*`: `Find.tsx`, `FirstStep.tsx`, `OutlinePanel.tsx`, `OutlineTools.tsx`, `RoofTypeChoice.tsx`, `ObstacleList.tsx`, `HeightDialog.tsx`, `ByHandPanel.tsx`, `NoMap.tsx`, `MapButtons.tsx`, `Steps.tsx`
- `apps/web/components/shell/Search.tsx`
- `apps/web/components/ui/Tip.tsx`

## Words

As in Scope in, word for word; `Press` on touch, `Click` with a pointer (the app's existing choice).

## Help to keep true

Every topic of `apps/web/content/help/find/*` and `app/section/roof-type.mdx`, `app/section/obstacles.mdx`: read and changed where the words or the order of the steps changed; the how-tos' pictures and clips of Find are retaken in issue 12 (help).

## Tests, written first

- The panel's head per step (`lib/outline` or a new `find-step.ts`): find, outlining, closed, by hand, no map.
- The roof type's choices and default.
- The obstacle's line in words.
- Build's label with the area.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] Find opens with the search field first in the column and the two other ways under it; no cards.
- [ ] While outlining, the column's instruction is the step's; the tools carry their words.
- [ ] With the outline closed, Build this roof · <area> is in view at every size without scrolling.
- [ ] No tips card; one line on the map for the first outline.
- [ ] The height of an obstacle is asked beside it with Cancel and Add.
- [ ] Without a map, the by-hand column opens with the plain words.

## Rules that hold for this work

- Build to the board; tokens only (hard rule 9, the V2 tokens of D94). A missing value becomes a token first.
- Test first: the pure logic of every behaviour in "Scope in" in a `*.test.ts` that fails before the change. No new
  browser suites and none run (the owner, 2026-10-11); the screens are checked by hand at three sizes.
- Every word the user meets follows `plan/v2/voice.md`; the app's own words are explained once, as D96 says (`EXPLAIN` in
  `docs/design/mockups/build_v2_parts.py` holds the approved lines; the app keeps them in one module).
- Never a red cross, never "bankable" (hard rules 4, 5); the system voltage rules of D87 and D88 hold.
- `bun check --skip=e2e` green before every commit; `bun gen:api` after a change to the API's routes or models.

## The pull request

One pull request for this issue, from a branch reset to `origin/main`, never stacked (`plan/v2/build.md`, "The loop").

- Title `V2 · 4 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #211`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
