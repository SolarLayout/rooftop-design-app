# V2 · 2 · The progression: one row of steps, a primary per step, the result in the top bar, the panel that hides

Part of the epic **V2** (#207). Board set 2 of the approved V2 design (D95, D96, D99 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 2 of 12. Needs first: #208.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

Replace the switch of workspaces and the rail of lenses with one order of work: Roof, Array, Strings, Performance, Handover, in the top bar (the tab bar on phone), each step with its state, each with one primary that leads to the next. Sun becomes a view of the stage. Export and Present leave the top bar. The result is one figure at the top bar's right. On desktop the work column can be hidden. The app's own words are explained in one line where they are met.

## The board

The canvas page **V2**, row 2: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Progression.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Progression.dc.html), [`V2ProgressionTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2ProgressionTablet.dc.html), [`V2ProgressionPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2ProgressionPhone.dc.html), [`build_v2_progression.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_progression.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 2 · The progression: one row of steps, a primary per step, the result in the top bar, the panel that hides · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Progression.jpg?raw=true)

Tablet: [V2ProgressionTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2ProgressionTablet.jpg?raw=true) · Phone: [V2ProgressionPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2ProgressionPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-55** (P1) · Two navigations on one screen: The top bar switches workspaces (Studio · Performance · Handover) and the rail switches lenses (Roof · Array · Sun · Strings).
- **V2-56** (P1) · The Sun lens is a view, not a step: It changes nothing in the design (its day, its switches are "what you see"); it sits between Array and Strings as if it were a step.
- **V2-57** (P1) · Export and Present as the top bar's primary: Export is the one amber button on every workspace screen, including the first open of a fresh design, when there is nothing to export.
- **V2-58** (P1) · Find's steps pill says 1 · 2 · 3 and the panel says "Step 2 of 3": Two counters for one thing.
- **V2-104** (P1) · The eye's path is broken on every Studio lens: The title is at the top left of the stage (x 96, y 77), the inputs at the right (the first field at x 1,149, y 365), the figures at the bottom left (the vitals), the primary at the top right (Export, x 1,320).
- **V2-105** (P1) · The primary is the smallest important thing: Export is 100 × 36 px at the top right; an obstacle row is 46 px, an option card 52 px, Build this roof on Find 330 × 56.

## Scope in

1. A `StepNav` (`components/shell`): five links, Roof → `/studio/roof`, Array → `/studio/array`, Strings → `/studio/strings`, Performance → `/performance`, Handover → `/handover`; each with its mark: a tick (done), the note mark (needs you), its number (to do); the current one pressed (`aria-current="step"`). It replaces `WorkspaceNav` and `LensNav` on desktop and tablet; on phone the tab bar (`TabBar`) becomes the five steps with their marks.
2. Step states as pure logic (`lib/flow/steps.ts`): done when the user has continued past it and nothing in it waits for review; needs you when a note or a choice of it waits (no option fits, a note to review of its section); to do otherwise. Remembered per design on the device with the design.
3. Find is the first part of Roof: on `/find` the step Roof is current; the other steps are dim and not links until a design exists. The steps pill of Find (`components/find/Steps.tsx`) and "Step 2 of 3" are removed.
4. Sun becomes a view: a `Sun` toggle in the view controls of every Studio step (`components/studio/ViewControls.tsx`); the Sun lens's content (`SunInspector`, the time, the sun's arc over the roof (`SunPath`, D72 and Phase 6 decision 10, kept: never lost in the move), the shade map) shows as the Sun view over the stage of the step in hand (its card and timeline are drawn on board 7; this issue moves the route and the toggle). `/studio/sun` redirects to the last step with the Sun view on.
5. One primary per step at the foot of the work column, named for the next step (`Continue to Array`, `Continue to Strings`, `Continue to Performance`); on Performance `Continue to Handover` and on Handover `Download all` at the head of the page; `Next: <step>, <its line>` under it until that step has been opened once (D96).
6. The top bar: the logo (a link to Home), the design's name with its saved mark (D74 kept), the steps, the result chip, Docs. Export is removed from the top bar (the zip is Handover's `Download all`, issue 9); Present becomes a secondary button with its word at the head of Performance and Handover.
7. The result chip at the top bar's right on desktop and phone: the energy of year 1 (`617.8 MWh a year`), with the note mark and `N to review` when something waits; pressed, it opens the summary (seven figures in plain names: Energy in year 1, Modules, DC capacity, AC capacity, DC/AC ratio, Performance ratio (PR), Yield) with `Open Performance`. The vitals bar over the stage (`components/shell/Vitals.tsx`) is removed. (The chip's six states and the problems are issue 5; this issue draws computing, the result, and to review.)
8. Hide panel (D99): a button at the work column's top right and ⌘ \ hide it; the stage takes the width; `Show panel` beside the view controls; the step's primary floats at the stage's foot while hidden; the column is shown on a design's first open, when a step needs the user, and when an object on the roof is selected; remembered on the device (the view store).
9. The app's own words (D96): one module (`lib/words/explain.ts`) with the approved lines (Roof, Array, Strings, Performance, Handover, Sun, Options, Your own option, To review, Project file, Design day, Present); a step's tooltip on desktop; the line under a page's title the first time the user meets it on this device (a per-device set of words met), then behind the ?.
10. Tablet: the steps in the top bar (compact), the stage 440, the work column under it, the primary at the screen's foot. Phone: the tab bar is the steps, the result in the top bar.
11. The documents: `information-architecture.md` (the places, the navigation), `components.md` (Top bar and navigation, Lens rail removed, Vitals bar removed, the result chip, the panel), `guidelines.md` (Responsive rules for the top bar).

## Scope out

- The work column's content per step (issues 3, 6, 7); the problems' look (issue 5); Performance's and Handover's pages (8, 9).
- The Sun view's card and timeline as drawn (issue 7); this issue moves the route and adds the toggle.
- Present itself (#220); this issue moves its button.
- Routes: the addresses stay as they are, Sun's redirects.

## Where the code is

- `apps/web/components/shell/TopBar.tsx`, `WorkspaceNav.tsx`, `LensNav.tsx`, `Shell.tsx`, `Vitals.tsx`, `vitals-view.ts`, `stores.tsx`
- `apps/web/components/studio/Studio.tsx`, `ViewControls.tsx`, `Stage.tsx`
- `apps/web/components/scene/Scene.tsx`, `SunPath.tsx` (the sun path follows the Sun view)
- `apps/web/components/find/Steps.tsx`, `Find.tsx`
- `apps/web/lib/routes.ts`, `lib/stores/view-store.ts`, new `lib/flow/steps.ts`, `lib/words/explain.ts`
- `apps/web/app/(workspaces)/studio/[lens]`

## Words

`Continue to <step>`; `Next: <step>, <its line>`; `Hide panel`, `Show panel`; `<n> to review`; `MWh a year`; the explained lines as approved (board 2, "The app's own words, explained").

## Help to keep true

Topics that name the lenses or the workspaces or the Sun lens (search `lens`, `workspace`, `Sun lens`, `Export`, `Present`): their words follow the steps. New topic only if a section heading is added (D80's coverage gate says).

## Tests, written first

- `steps.test.ts`: the state of each step from a design's facts (visited, notes, no options).
- `explain.test.ts`: every word has one line under 20 words; the first-meeting set.
- The view store: hide panel, its shortcut's action, the rules that show it again; the Sun view on any step shows the sun path.
- The result chip's view (`vitals-view.ts` successor): its words for computing, the result, to review.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] The top bar shows the five steps with their marks; the current is pressed; clicking a step goes there.
- [ ] No lens rail, no workspace switch, no vitals bar over the roof, no Export in the top bar.
- [ ] Each Studio step has one primary at the column's foot naming the next step; Performance and Handover have theirs at the head.
- [ ] The result chip shows 617.8 MWh a year on the demo; pressed, the summary in plain names.
- [ ] ⌘ \ hides and shows the panel; while hidden the primary floats at the stage's foot.
- [ ] Sun is a toggle in the view controls on every step, and the Sun view draws the sun's arc over the roof as the Sun lens does today; `/studio/sun` lands on a step with the Sun view on.
- [ ] On phone the tab bar is the five steps; on tablet the steps fit the top bar.

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

- Title `V2 · 2 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #209`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
