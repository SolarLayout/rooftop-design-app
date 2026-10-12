# V2 · 1 · Principles: the V2 tokens and the base components

Part of the epic **V2** (#207). Board set 1 of the approved V2 design (D94 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 1 of 12. Needs first: nothing.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

Put V2's base in the code: six type sizes and two display sizes in nine styles, seven spacing steps, three control heights, four radii, the accent on the primary, the selection, the notes, the focus and the sun alone, section headings in primary text without the glow (D76 reversed), the quiet help disc. Every later issue builds on these tokens; this one changes the base and the shared components, not the layout of any screen.

## The board

The canvas page **V2**, row 1: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Principles.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Principles.dc.html), [`V2PrinciplesTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2PrinciplesTablet.dc.html), [`V2PrinciplesPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2PrinciplesPhone.dc.html), [`build_v2_principles.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_principles.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 1 · Principles: the V2 tokens and the base components · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Principles.jpg?raw=true)

Tablet: [V2PrinciplesTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2PrinciplesTablet.jpg?raw=true) · Phone: [V2PrinciplesPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2PrinciplesPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-106** (P1) · Eleven control heights on one screen: On the Roof lens at 1440: 20 (a field's input), 24 (help disc), 30 (segment), 32 (workspace tab), 36 (Present, Export, Fit), 38 (north, Layers), 40 (project name), 44, 46 (obstacle row), 52 (option card), 56 (field box).
- **V2-107** (P1) · The spacing scale is used at its small end only: Between siblings in the inspectors the measured gaps are 2, 6, 10 and 22 px; on Performance 0 px (15 pairs of rows touching), 6 and 20.
- **V2-109** (P1) · 12 px is the body: The most frequent text style on every Studio lens is Geist 12 px regular (28 elements on the Roof lens, 25 on Strings, 23 on Array), over 14 px regular (23, 20, 23).
- **V2-110** (P1) · The accent is on 15 to 19 things per lens: Counted at 1440: Roof 15, Array 17, Strings 19 (phone Strings 17): the five section headings in amber with a glow (`--shadow-heading`), the help discs, Export, Play, the sun, the time pill's fill, the selected option's ring, the legend's inverter chip, the obstacles' Add.
- **V2-111** (P1) · Secondary text outnumbers primary: Of the visible text elements, `text-2` (#A9B2C0) is the majority on most screens: Performance 80 to 46, the Roof lens 48 to 43, Find by hand 22 to 10.
- **V2-112** (P1) · Four typographic voices on one screen: Bricolage 600 for the title, Geist 400 and 500 for text, Geist Mono 400 and 500 for figures and file names, and Geist 600 uppercase tracked for the section labels: on the Strings lens 18 distinct family-size-weight combinations in view (Performance 18, Array 16, Roof 15; the phone's Strings 15).
- **V2-120** (P3) · Rounding: Radii 6, 7, 8, 9, 10, 12, 14, 16, 18, 22 and full: eleven, where the nesting of controls in rows in cards in panels needs four (control, row, card, panel) with the inner radius the outer's less the padding.

## Scope in

1. `apps/web/app/globals.css` and `docs/design/design-tokens.md` together (their test holds them equal): the type styles of D94 (`display` 64/68 and 48/52 on touch, `figure` 36/40 and 26/32, `title` 26/32 and 20/26, `heading` 20/28, `section` 16/24 600, `body` 14/20 and 15/22, `strong` 14 and 15 at 500, `mono` 14 and 15, `unit` 12/16), the spacing tokens 4, 8, 12, 16, 24, 40, 64 with their roles (`--space-row` 8, `--space-group` 24, `--space-section` 40), the radii 8, 12, 16, 24 and full.
2. Retire what V2 drops: `--text-section` uppercase and its tracking, `--color-heading` and `--shadow-heading` (`heading-glow`), the one-pixel type steps (11, 13, 15, 17 px styles) once nothing uses them; map every use to its V2 style. No component keeps a retired token.
3. The section heading (`components/shell/help/SectionHeading.tsx`, `components/ui/section-look.ts`): Geist 16 at 600 in primary text, sentence case, no glow (D76 reversed).
4. The help disc (`components/shell/help/HelpDisc.tsx`): 20 drawn in the line colour with `?` in `text-3`, a target of 24 on desktop and 44 on touch; the accent ring only while its sheet is open (the held state of D80 kept).
5. Buttons, icon buttons, fields, segmented controls, selects (`components/ui`): heights 32 compact, 40 standard, 48 primary on desktop; 44, 44, 48 on touch; radius 8 (the segmented track 12, its items 8); one height per row.
6. Text colour: labels and values in primary text; `text-2` for units, sources, hints and summaries' facts; `text-3` for placeholders and chart ticks alone. A form's label at the value's weight; a field's value in mono 400 (V2-113 starts here: the field component).
7. Figures in text in Geist with tabular figures (`font-variant-numeric: tabular-nums`); mono kept for tables, fields and the cable schedule.
8. The kit (`/kit`, `/kit/part-2`, `/kit/shell`) shows every component at the new sizes and states.
9. The documents: `docs/design/design-tokens.md`, `components.md` (Buttons, Segmented control, Number field, Section heading, Help disc), `guidelines.md` (Visual language, Writing: no uppercase; Accent: 3 to 5 a screen) say V2's rules, each change from the board's table "Rules this board changes".

## Scope out

- The layout of any screen: the shell is issue 2, each screen its own issue.
- New words on screens (each screen's issue; the sweep is issue 11, the vocabulary).
- The colours of Dusk, the fonts, the 3D palette: unchanged by D94.

## Where the code is

- `apps/web/app/globals.css`, `apps/web/app/globals.test.ts`
- `apps/web/components/ui/*` (Button, IconButton, Segmented, Select, NumberField, Stepper, TextField, Tabs, Card, `button-look.ts`, `field-look.ts`, `section-look.ts`)
- `apps/web/components/shell/help/SectionHeading.tsx`, `HelpDisc.tsx`
- `apps/web/app/kit`, `apps/web/components/kit`
- `docs/design/design-tokens.md`, `components.md`, `guidelines.md`

## Words

No word changes here beyond the kit's own labels. Section headings are written in sentence case already; the uppercase was a style.

## Help to keep true

The help sheet's look follows the disc and the heading; no topic changes. `Help: no topic describes this` in the pull request, with the search.

## Tests, written first

- `globals.test.ts` holds the new table of `design-tokens.md` and the CSS equal (it fails until both are written).
- A test of `section-look.ts`/the heading's class names: no uppercase, no glow, the primary text colour.
- A test of the button and field looks: the heights per size (compact, standard, primary; touch 44/44/48).
- A test that no component's class uses a retired token (a scan of `apps/web/components` for the retired utility names).

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] Every section heading in every panel reads in white, 16, weight 600, sentence case, no orange, no glow.
- [ ] Every `?` disc is grey and quiet; pressed, it rings in the accent while its sheet is open.
- [ ] Buttons in one row are one height; the top bar's controls are 40 on desktop.
- [ ] The kit shows the new type scale, spacing, heights and radii.
- [ ] Counted on the Roof lens at 1440, the accent is on 5 things or fewer.

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

- Title `V2 · 1 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #208`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
