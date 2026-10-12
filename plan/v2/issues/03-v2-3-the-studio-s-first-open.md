# V2 · 3 · The Studio's first open: the work column in three weights, who set each value, the time on Sun alone

Part of the epic **V2** (#207). Board set 3 of the approved V2 design (D97 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 3 of 12. Needs first: #209.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

After Build this roof, say what happened and what to do: the Roof step opens with `Check the roof`, a status of the array and the energy, and one primary. Re-layer every work column in three weights: the step (instruction, status, primary), the facts (sections as one line that opens), the details (fields). Tell defaults from the user's own values on every section and field. Take the time off the stage outside the Sun view.

## The board

The canvas page **V2**, row 3: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2FirstOpen.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2FirstOpen.dc.html), [`V2FirstOpenTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2FirstOpenTablet.dc.html), [`V2FirstOpenPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2FirstOpenPhone.dc.html), [`build_v2_studio_first_open.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_studio_first_open.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 3 · The Studio's first open: the work column in three weights, who set each value, the time on Sun alone · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2FirstOpen.jpg?raw=true)

Tablet: [V2FirstOpenTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2FirstOpenTablet.jpg?raw=true) · Phone: [V2FirstOpenPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2FirstOpenPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-01** (P0) · Studio, first open: A roof built from Find opens on the Roof lens with the inspector's six sections, the vitals' seven numbers and a time pill, all at once.
- **V2-25** (P0) · Every section open, every field visible: The Roof inspector shows Location, Roof type, Edges and access (six fields), Obstacles (six rows); Array shows Module, Mounting (six fields), Spacing (five fields and two switches); Strings shows Inverter, Voltage, Modules in series, Options, a paragraph of rules, MPPT loading (six rows), Sizing temperatures (four fields), Inverter limits.
- **V2-26** (P1) · Defaults and choices look the same: A field set by the app (from the weather, by roof type, from the file) and one the user typed look alike; only Sizing temperatures and the voltage say "from the weather" or "Your choice".
- **V2-31** (P1) · Vitals: Seven numbers (Energy, DC capacity, AC capacity, DC/AC, Modules, PR, Yield) plus the note chip, at every lens, in a bar over the roof.
- **V2-32** (P1) · The time pill on every lens: "21 Dec · 10:30 · solar time" with Play floats over the stage on the Roof, Array and Strings lenses, where the time changes nothing the lens is about.
- **V2-64** (P1) · No hierarchy inside the inspector: Every section is the same weight: amber uppercase label, a card or a grid, the same spacing.
- **V2-65** (P1) · Amber is used for five things: The primary button, the section labels, the help discs, the note chip's icon, the selected option's ring, the sun, the "Add" and "Edit" of obstacles.
- **V2-66** (P2) · The vitals bar hides the roof: On desktop it covers the stage's lower 80 px plus the time pill above it; on the Strings lens the legend and the time pill stack under the roof's near corner.
- **V2-118** (P2) · The stage's proportions: Desktop: rail 72, stage 984, inspector 384 (5 : 68 : 27 of the width); the top bar 57 and the vitals 78 take 15 % of the height, so the roof has 708 px.

## Scope in

1. The work column (`components/studio`): a head (the step's instruction as `heading`, one line under it), the sections, the foot (issue 2's primary).
2. `SummaryRow` (`components/ui` or `components/studio`): a section as one line: its name with its `?`, its facts on one line in `text-2`, who set it at the right (`unit`, `text-3`), a chevron; pressed, it opens its fields in place. 56 high (64 on touch). The step's own sections open the first time; what the user opens or closes is remembered per device.
3. Who set it: pure logic per field (`lib/studio/set-by.ts`): `Default` (the app's value), `From the weather`, `Set for <country>` (D87 words), `Yours` (typed or chosen); a field the user changed shows `Yours · default <value> · Reset`, and Reset brings the default back as one undoable edit. The section's tag is Yours when any of its fields is, else its source.
4. The first-open status (first open of a design only, until the user continues): `The array is on the roof · <modules> modules · <kWp> kWp`, then `Computing the energy · Shading every module over the year. A few seconds.` with the ring, then `<energy> MWh in year 1 · The energy follows each change you make.`
5. The Roof step's head: `Check the roof` and `Built from your outline. The app set the edges: check the parapet, it shades the first row.` (the facts of each section are issue 7's fields; this issue builds the frame and the summaries with today's fields in them).
6. The time pill (`components/studio/Time.tsx`) shows on the Sun view alone; the other steps draw the design day's noon, still.
7. Proportions: tablet stage 440 with the result as a row under it (`617.8 MWh a year · 357.28 kWp`); phone stage 40 % of the height at the sheet's half stop, the result in the top bar.
8. Three weights, spacing per D94: 8 inside a group, 24 between groups, 40 between sections; the accent on the selection and notes only.

## Scope out

- The fields' new words and groups of the Roof and Array steps (issue 7) and of Strings (issue 6).
- The problems shown in the column (issue 5).
- The phone sheet's stops (issue 10).

## Where the code is

- `apps/web/components/studio/RoofInspector.tsx`, `ArrayInspector.tsx`, `StringsInspector.tsx`, `inspector-look.tsx`, `Time.tsx`, `Studio.tsx`
- `apps/web/lib/studio/roof-fields.ts`, `array-fields.ts`, `sizing-fields.ts`, `voltage-words.ts`, new `set-by.ts`
- `apps/web/lib/device` (what is remembered)

## Words

`Check the roof`; `Default`, `From the weather`, `Set for India`, `Yours`, `Reset`; the status lines above.

## Help to keep true

Topics of every section whose heading changes into a summary row (read them for words like "the fields", "below"); `Help: read …`.

## Tests, written first

- `set-by.test.ts`: each field's source and the Yours/Reset words.
- The summary line of each section (`roof-fields`, `array-fields`, …): its facts from the design.
- The first-open status's words in each state.
- What the column remembers (opened sections) per device.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] After Build this roof the Roof step says what happened and what to do, and its primary is `Continue to Array`.
- [ ] Every section is one line that opens; the ones the step needs are open the first time.
- [ ] Each section and field says Default, From the weather, Set for <country> or Yours; Reset works and can be undone.
- [ ] No time pill outside the Sun view.
- [ ] Tablet: the stage 440 and the result row; phone: the stage 40 % at the sheet's half stop.

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

- Title `V2 · 3 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #210`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
