# V2 · 6 · The Strings step: options first, the proof behind Why, the rules behind a link, Add your own in view

Part of the epic **V2** (#207). Board set 6 of the approved V2 design (D102 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 6 of 12. Needs first: #210, #212.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

The Strings step leads with what the user decides: the options, best first, each saying why it is there. The chosen one says that it fits; its proof is behind Why. The rules the options are made by are behind How the options are made. Add your own option stands in view. The rest are lines that open. The legend has a fixed place.

## The board

The canvas page **V2**, row 6: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Strings.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Strings.dc.html), [`V2StringsTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2StringsTablet.dc.html), [`V2StringsPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2StringsPhone.dc.html), [`build_v2_strings.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_strings.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 6 · The Strings step: options first, the proof behind Why, the rules behind a link, Add your own in view · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Strings.jpg?raw=true)

Tablet: [V2StringsTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2StringsTablet.jpg?raw=true) · Phone: [V2StringsPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2StringsPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-12** (P1) · Strings lens, desktop: The inspector is 1,487 px in 843 (1,828 with Sizing temperatures open, 2,021 with Inverter limits).
- **V2-21** (P1) · The empty Strings lens: A new design shows "790 positions ready · no strings yet" under the title and the options area blank while the run is on its way; there is no ring or step name on the lens itself.
- **V2-28** (P1) · Modules in series and the verdict: The bar "14 · MPPT minimum … 29 · Voc limit" and the verdict "Voc at 11.9 °C is 1,480 V (limit 1500 V); Vmp at 64.3 °C cell is 1,097 V (MPPT minimum 500 V).
- **V2-29** (P1) · The options' rules paragraph: Under the options: "Target DC/AC 1.10–1.30, warning above 1.40.
- **V2-46** (P2) · Abbreviations with "(s)": "1 inverter(s)", "1 hour(s) is/are there more than once", "position(s)".
- **V2-54** (P3) · The middle dot as the universal joiner: "29 × 22 · 357.28 · 1.30"; "Metres · one layer per string"; "Not made · the run failed".
- **V2-78** (P1) · Phone: the Strings legend: covers the roof's foot (fixed in #199 to one entry per colour, still a band).

## Scope in

1. The step's head: `Check the strings` and its line (D96: `How the modules are wired to the inverter.` on first meeting).
2. Options first (`StringOptions.tsx`, `lib/studio/option-cards.ts`): each card a letter, why it is there in two or three words (the engine's caption in the vocabulary: Recommended, Less clipping, Least clipping, Fills the inverter, Below target, Your own), the facts (`29 × 22 · 357.28 kWp`, `· 2 inverters` when more than one), the energy in MWh, the mark; the options below the DC/AC target folded under `2 more, below the DC/AC target`.
3. The chosen option says it fits: `29 modules a string fits at 1500 V`, with `Why` opening the proof (`SeriesRange.tsx` restyled): the lengths that fit at the voltage (`14 at least`, `29 at most`) and two plain lines: `On the coldest morning, 11.9 °C · A string of 29 reaches 1,480 V, under the 1500 V limit` and `On the hottest afternoon, 64.3 °C in the cell · It gives 1,097 V, over the inverter's 500 V minimum`.
4. The rules paragraph leaves: `How the options are made` opens three numbered lines (the DC/AC target, the strings per MPPT with its current, the least shaded strings first) and one line for the options below target.
5. `Add your own option` under the options, in view, a dashed button; its form: `Modules a string` (with its range), `Strings` (with its limit), `Inverters`, the verdict before Add (`Fits · 349.44 kWp · DC/AC ratio 1.27`), Cancel and `Add option`.
6. Summaries (issue 3's rows): Inverter (model · kW · MPPT, who set it), System voltage (D87/D88 words), MPPT loading (`4, 4, 4, 4, 3 and 3 strings · within limits`; opened: each MPPT's strings and current of its limit with its mark), Sizing temperatures (`From the weather`).
7. The legend (`StringLegend.tsx`, D92 kept): at the stage's foot on desktop and tablet, with String · MPPT · Inverter; at the sheet's head on phone; never over the roof. Tracing a string shows `String S1 · MPPT 1 · 29 modules · 0.0 % shaded`.
8. The Strings step opens in Plan, where the strings read best; 3D stays one press away.
9. Plurals by count everywhere on the step (`1 inverter`, `2 inverters`); units on every figure.

## Scope out

- How the engine makes the options and their captions' logic.
- The inverter picker's filters (issue 10).
- The voltage's rules (D87, D88).

## Where the code is

- `apps/web/components/studio/StringsInspector.tsx`, `StringOptions.tsx`, `SeriesRange.tsx`, `MpptTable.tsx`, `SizingTemperatures.tsx`, `InverterCard.tsx`, `InverterLimits.tsx`, `SystemVoltage.tsx`, `StringLegend.tsx`
- `apps/web/lib/studio/strings-view.ts`, `series-bar.ts`, `option-cards.ts`, `custom-fields.ts`, `mppt-table.ts`, `inverter-card.ts`

## Words

As in Scope in; the captions per the vocabulary (board 12).

## Help to keep true

`studio/section/options.mdx`, `modules-in-series.mdx`, `mppt-loading.mdx`, `inverter.mdx`, `system-voltage.mdx`, `on-the-roof.mdx` (the legend).

## Tests, written first

- Option cards' captions and facts from the run's options.
- The fit line and Why's two lines from the series range.
- How the options are made: the three lines from the run's note.
- The legend's place per size; the traced string's line.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] The Strings step shows the options first; D and E fold under one line.
- [ ] The chosen option says it fits; Why opens the proof in plain words.
- [ ] No paragraph of rules under the options; How the options are made opens them.
- [ ] Add your own option is in view at 1440 × 900 without scrolling.
- [ ] The legend sits at the stage's foot (desktop, tablet) or the sheet's head (phone).

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

- Title `V2 · 6 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #213`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
