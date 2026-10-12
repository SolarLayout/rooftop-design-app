# V2 · 10 · Phone and tablet: the sheet holds the step at every stop, targets of 44, pickers search first

Part of the epic **V2** (#207). Board set 10 of the approved V2 design (D106 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 10 of 12. Needs first: #210, #211, #212, #213, #214, #215, #216.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

On phone the sheet holds the step at every stop with its primary at the foot, the stage keeps 40 % at half, targets are 44 × 44, the pickers search first; on tablet the stage is 440, the result a row, the column in two halves by the step.

## The board

The canvas page **V2**, row 10: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Touch.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Touch.dc.html), [`V2TouchTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2TouchTablet.dc.html), [`V2TouchPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2TouchPhone.dc.html), [`build_v2_touch.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_touch.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 10 · Phone and tablet: the sheet holds the step at every stop, targets of 44, pickers search first · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Touch.jpg?raw=true)

Tablet: [V2TouchTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2TouchTablet.jpg?raw=true) · Phone: [V2TouchPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2TouchPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-72** (P3) · The equipment pickers' sliders: (AC power 0.7 to 350 kW, MPPT 1 to 15, Max DC 420 to 1,500 V) take a third of the dialog for filters most users never move.
- **V2-75** (P0) · Phone: the Studio's bottom sheet: The inspector is a sheet over a 252 px stage with the vitals row between; at the half stop a section's heading and one field show.
- **V2-76** (P1) · Tablet: the inspector under the vitals: At 834 the stage takes 508 px, the vitals grid 140 px, and the inspector starts at 740 of 1,194; the Strings options are at about 1,000.
- **V2-78** (P1) · Phone: the Strings legend: covers the roof's foot (fixed in #199 to one entry per colour, still a band).
- **V2-79** (P1) · The top bar at 834: drops Present's word (an icon alone, a play triangle that reads as "run"), the coordinates and the save state.
- **V2-80** (P2) · Phone: the vitals row scrolls sideways: with seven cells; the note chip is the eighth, off screen.
- **V2-81** (P2) · Phone: the equipment pickers' table: becomes a list with an "Order" select; the filters are three sliders stacked.
- **V2-102** (P2) · Icon-only buttons: (Present at 834, the view controls' north and layers, the card's "⋮") rely on aria names; the visible affordance is the icon.
- **V2-116** (P2) · Touch targets on phone: The help discs are 16 px wide by 44 high (nine of them on the Studio's sheet); the Array lens's tilt stepper is 26 × 26; the fields' inputs 64 × 20 inside a 44 box that is not all tappable.
- **V2-118** (P2) · The stage's proportions: Desktop: rail 72, stage 984, inspector 384 (5 : 68 : 27 of the width); the top bar 57 and the vitals 78 take 15 % of the height, so the roof has 708 px.

## Scope in

1. The Studio's sheet (`components/ui/Sheet.tsx`, `sheet-stops.ts`): peek shows the handle, the step's instruction and its primary (the roof has the screen); half leaves the stage 40 % of the height; full leaves a strip of the roof (about 120); the primary pinned at the sheet's foot at every stop; Find's sheet the same with Build.
2. No row scrolls sideways: the result in the phone's top bar (issue 2); the legend in the sheet's head on Strings (issue 6).
3. Targets: every target 44 × 44 on touch: the ? disc (20 drawn), the stepper's buttons, the icon buttons; the whole field row (label, hint, box) focuses its input.
4. The equipment pickers (`EquipmentPicker.tsx`, `ModulePicker.tsx`, `InverterPicker.tsx`, `PickerSearch.tsx`): the search (`Maker, model or power`) and the list first, `<n> modules from <m> makers, or your own module file (PAN)`; the sliders behind `Filter`; on phone a sheet from the bottom.
5. Words on every action but close and zoom; Present with its word on tablet.
6. Tablet: the stage 440, the result row of 56 under it, the column in two halves ordered by the step (the step's head and the open section left, the summaries right), the primary in a foot bar.

## Scope out

- Desktop layouts (issues 2 to 9).
- The sheet's gesture mechanics (`use-sheet-drag.ts`) beyond its stops.

## Where the code is

- `apps/web/components/ui/Sheet.tsx`, `SheetGrip.tsx`, `sheet-stops.ts`, `Stepper.tsx`, `NumberField.tsx`, `IconButton.tsx`
- `apps/web/components/studio/Studio.tsx`, `EquipmentPicker.tsx`, `ModulePicker.tsx`, `InverterPicker.tsx`, `PickerSearch.tsx`
- `apps/web/components/find/Find.tsx` (its sheet)

## Words

`Maker, model or power`; `Filter`; `<n> modules from <m> makers, or your own module file (PAN)`.

## Help to keep true

Topics that describe the sheet or the pickers (search `sheet`, `slider`, `filter`, `Order`).

## Tests, written first

- `sheet-stops`: the three stops for a phone of 844 (stage 40 % at half) and of other heights.
- The picker's first view and Filter's state.
- A target-size rule for touch in the button and field looks.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] On a 390 × 844 phone, the step's primary is visible at peek, half and full; at half the stage is 40 % of the height.
- [ ] Every target measures at least 44 × 44 on touch.
- [ ] The pickers open on their search and list; the sliders are behind Filter.
- [ ] On a 834 × 1194 tablet the stage is 440, the result a row, the column two halves.

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

- Title `V2 · 10 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #217`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
