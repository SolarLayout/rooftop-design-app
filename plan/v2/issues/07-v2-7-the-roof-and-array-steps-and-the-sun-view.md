# V2 · 7 · The Roof and Array steps and the Sun view: plain fields in groups, the module card reduced, Spacing in a sentence, the sun's arc kept

Part of the epic **V2** (#207). Board set 7 of the approved V2 design (D103, D109 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 7 of 12. Needs first: #210.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

Every input of the Roof and Array steps in plain words with the trade's term after it, in groups; the module card reduced to what a buyer names; Spacing said in one sentence; the Sun view's figures named for what they are, with the sun's arc over the roof kept and its card closeable; Imagery one toggle; the outline edited in Plan.

## The board

The canvas page **V2**, row 7: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2RoofArray.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2RoofArray.dc.html), [`V2RoofArrayTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2RoofArrayTablet.dc.html), [`V2RoofArrayPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2RoofArrayPhone.dc.html), [`build_v2_roof_array.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_roof_array.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 7 · The Roof and Array steps and the Sun view: plain fields in groups, the module card reduced, Spacing in a sentence · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/8942a70acb0fdd0fa226d65d74eafc0b4df52cb9/v2-boards/V2RoofArray.jpg?raw=true)

Tablet: [V2RoofArrayTablet](https://github.com/SolarLayout/rooftop-design-app/blob/8942a70acb0fdd0fa226d65d74eafc0b4df52cb9/v2-boards/V2RoofArrayTablet.jpg?raw=true) · Phone: [V2RoofArrayPhone](https://github.com/SolarLayout/rooftop-design-app/blob/8942a70acb0fdd0fa226d65d74eafc0b4df52cb9/v2-boards/V2RoofArrayPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-27** (P1) · Edges and access: Parapet, Setback, Walkway, Every (24 mod), Clearance, Albedo in a 2 × 3 grid, no plain words, "Every" with the unit "mod".
- **V2-30** (P1) · The module card: "INA-144MHC-TF-560 · INSOLATION GREEN ENERGY PVT.
- **V2-33** (P2) · The Sun lens tiles: "Near, linear · Electrical, beyond linear · Far, horizon · Kept clear" with percentages.
- **V2-34** (P2) · Spacing's lines: "Shade-free · GCR 0.57 · profile angle 29.8°"; "The ridges run square to the roof edge closest to the equator".
- **V2-35** (P2) · The Layers popover: A popover with one switch, "Satellite imagery · Off: the plain grid".
- **V2-53** (P3) · "mod" and "h" as abbreviations: in obstacle rows ("5.0 × 4.0 · h 3.0 m").
- **V2-59** (P1) · Edit the outline leaves the Studio: Location's Edit goes back to Find; the design's modules vanish while the outline is edited and return on Build.
- **V2-61** (P2) · One value in two places: Albedo in Edges and access and in Performance's assumptions as Roof albedo; the design day in Array's Spacing and in Sun's Day; Degradation in the 25 years card and the assumptions.
- **V2-70** (P2) · The 3D stage's dimension labels: ("90.0 m" ×2, "40.0 m" ×2) are permanent and sit on the roof's edges where the obstacles are.
- **V2-73** (P3) · Two button styles for the same weight: "Change" (outline) on the cards, "Edit" (outline) on Location, "Add" (outline with plus) on obstacles.
- **V2-107** (P1) · The spacing scale is used at its small end only: Between siblings in the inspectors the measured gaps are 2, 6, 10 and 22 px; on Performance 0 px (15 pairs of rows touching), 6 and 20.
- **V2-113** (P2) · Values heavier than their labels: In the input panels the label is Geist 14 regular in `text-2` and the value Geist Mono 14 medium in `text`: the value is darker and heavier than the thing it belongs to, so the eye lands on "0.90 m" and must look back for "Parapet".

## Scope in

1. Edges and access (`RoofInspector.tsx`, `lib/studio/roof-fields.ts`): three groups: `At the edges` (Parapet height, `Default · measure it on site`; Edge margin (setback), `Default · usually 0.5 to 1.5 m`), `Access` (Walkway width; `Walkway every` … `modules`, `Default · one across each row`), `Round obstacles` (Clearance, `Default · kept free on every side`); 8 apart inside a group, 24 between groups; the label in primary text at the value's weight.
2. Roof albedo leaves the Roof step (one home: Performance's Assumptions, issue 8); the Roof step shows `Roof albedo 0.20 · in Performance, Assumptions` as a link.
3. Obstacles (`ObstaclePanel.tsx`): one line each in words (`AC units · 4 boxes · 1.5 × 1.0 m · 1.2 m high`, `Water tank · Tank · 2.5 m across · 2.0 m high`), `Add one: choose its kind, then drag on the roof.` with Box, Tank, Wall, Tree.
4. The outline: `Outline · Pune · 3,600 m² · Edit it in Plan`: the stage turns to Plan with the outline's corners as handles; Find only for a new roof.
5. The roof's dimension labels on the Roof step alone, once per pair of edges.
6. The module card (`ModuleCard.tsx`, `lib/studio/module-card.ts`): model, maker as people know it (D75), power, size, `Change`; `Details` opens Open-circuit voltage (Voc), Short-circuit current (Isc), Bifacial, rear gain, Voc coefficient; the file's name leaves the card.
7. Mounting (`ArrayMounting.tsx`): Tilt (`Default · low for wind on a flat roof`), Orientation Portrait · Landscape, Modules in tilt (a stepper of 44 on touch; `Default · rows of 2 modules, one above the other`), Clearance under the lower edge.
8. Spacing (`ArraySpacing.tsx`): `Rows stand 6.45 m apart so that they do not shade each other from 09:00 to 16:00 on 21 Dec.`; the switch `Row spacing from the shade-free hours` (`Off: type the spacing yourself`); Shade-free hours; Design day 21 Dec · 21 Jun · 21 Mar with `The day the rows are spaced for. 21 Dec has the longest shadows.`; Direction (azimuth) (`Default · faces south, square to the roof's south edge`); `Allow shaded positions` (`Off: positions shaded in the shade-free hours stay empty`). GCR and the profile angle move to the help.
9. The Sun view (issue 2's toggle), drawn at 16:00 on board 7's frames 5 and 6 and on touch: over the roof, the sun's arc for the day as the Sun lens draws it today (Phase 6, decision 10; `components/scene/SunPath.tsx`, `lib/scene/sun-path.ts`, kept): the day's arc, its shade-free hours thicker, the hour marks (12:00, sunrise, sunset), the sun at the time with the shadows it casts; it shows in the Sun view on every step (`showsSunPathOf` follows the Sun view, not the lens). A card at the stage's top left, `Shade over the year` with a close button (×, `Close Shade over the year`) at its top right, `The energy lost to shade, by its cause.`, Rows and obstacles 0.35 %, Strings 0.56 %, Horizon 0.01 %, Area kept clear 150 m², and `On the roof` with four switches: `Sun path` (on, `The arc the sun follows on this day`), `Shade-free hours` (on, `The thick part of the arc, 09:00 to 16:00`), `Shadow outlines` (off, `The shadows the app computed, dashed, to compare`), `Shade map on the modules` (off, `Each module coloured by its loss to shade`). Closed, the card folds to a chip at its place, `Shade over the year 0.92 %` with a chevron, that opens it again; the arc and the timeline stay; folded or open is remembered on the device (the view store). On touch the card's content is the sheet's while the Sun view is on (no ×: the sheet has its stops), the step's primary at its foot. The timeline at the stage's foot (Play, `21 Dec · 16:00 solar time`, the track from `06:33 sunrise` to `sunset 17:27`, `Sun 18.0° high, from 237° (south-west)`; on phone Play, the time and the track), here alone. The Day of the Sun lens reads the design day (one value, one home: V2-61). D109.
10. Layers becomes one toggle in the view controls, `Imagery` (`ViewControls.tsx`; the popover removed); the setting of the view as D57/D70.
11. One secondary style and one verb (Change) for the cards' actions.

## Scope out

- What the fields do in the engine.
- The shade map's colours (Phase 6, decision 11).
- Move and turn on Find (D79).

## Where the code is

- `apps/web/components/studio/RoofInspector.tsx`, `ObstaclePanel.tsx`, `ArrayInspector.tsx`, `ArrayMounting.tsx`, `ArraySpacing.tsx`, `ModuleCard.tsx`, `ModulePicker.tsx`, `SunInspector.tsx`, `SunShading.tsx`, `ShadeLegend.tsx`, `Time.tsx`, `ViewControls.tsx`, `Labels.tsx`
- `apps/web/components/scene/SunPath.tsx`, `apps/web/lib/scene/sun-path.ts` (kept; shown by the Sun view)
- `apps/web/lib/studio/roof-fields.ts`, `array-fields.ts`, `array-view.ts`, `module-card.ts`, `sun-figures.ts`
- `apps/web/lib/stores/view-store.ts`

## Words

As in Scope in; the vocabulary's rows of "The roof and the array" (board 12).

## Help to keep true

`studio/section/edges-and-access.mdx`, `location.mdx`, `mounting.mdx`, `spacing.mdx`, `shade-free-window.mdx`, `module.mdx`, `day.mdx`, `sun-at-the-hour.mdx`, `shade-map.mdx`, `shading-over-the-year.mdx`, `on-the-roof.mdx`, `app/section/obstacles.mdx`.

## Tests, written first

- `roof-fields`: the groups, labels and hints.
- `array-fields`: the Spacing sentence from the layout's readouts.
- `sun-figures`: the four plain tiles; the folded chip's total.
- The view store: the Sun view shows the sun path on every step; the card folded or open, remembered.
- The module card's lines and Details.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] Edges and access reads in three groups of plain words; Roof albedo is a link to Performance.
- [ ] The module card shows model, maker, power, size and Change; Details opens the electrical figures.
- [ ] Spacing opens with the one sentence; no GCR or profile angle on screen.
- [ ] Sun in the view controls shows the sun's arc over the roof (shade-free hours thicker, the sun at the time), the shade card and the timeline; no time anywhere else.
- [ ] The card's × folds it to its chip; the chip opens it again; the arc stays. On the roof's switches turn the arc, the thick part, the outlines and the shade map on and off.
- [ ] Imagery is one toggle; Edit it in Plan edits the outline on the stage.

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

- Title `V2 · 7 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #214`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
