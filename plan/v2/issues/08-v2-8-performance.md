# V2 · 8 · Performance: one screen at first sight, four tabs under it

Part of the epic **V2** (#207). Board set 8 of the approved V2 design (D104 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 8 of 12. Needs first: #209, #212.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

Performance answers one question at first sight, how much energy and how good the system is, on one screen with no scroll; everything else waits under it in four tabs, one view at a time.

## The board

The canvas page **V2**, row 8: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Performance.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Performance.dc.html), [`V2PerformanceTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2PerformanceTablet.dc.html), [`V2PerformancePhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2PerformancePhone.dc.html), [`build_v2_performance.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_performance.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 8 · Performance: one screen at first sight, four tabs under it · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Performance.jpg?raw=true)

Tablet: [V2PerformanceTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2PerformanceTablet.jpg?raw=true) · Phone: [V2PerformancePhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2PerformancePhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-13** (P1) · Performance: The page scrolls 2,025 px in 843 (2,473 with the month table).
- **V2-61** (P2) · One value in two places: Albedo in Edges and access and in Performance's assumptions as Roof albedo; the design day in Array's Spacing and in Sun's Day; Degradation in the 25 years card and the assumptions.
- **V2-71** (P2) · Charts: The month chart labels only the highest and lowest bar; the 25-year chart has no axis labels; the table toggles are in the card's head, right, small.
- **V2-88** (P1) · Performance's order: The option switch and the weather are at the top right, small, after the title; the one number is left; six KPI tiles follow with terms (Performance ratio, Specific yield, Capacity factor AC · 19.7 % DC, In-plane irradiation, CO₂ avoided).
- **V2-89** (P1) · The P-values: "P50 617.8 · P75 600.2 · P90 · σ 4.24 % 584.2" under the lead number.
- **V2-97** (P3) · The weather select's facts: ("Typical year · PVGIS horizon", "The year 2023 · no horizon", "Hourly or finer · times read as UTC").
- **V2-108** (P1) · Density, by region: Characters per 1,000 px² in view: the Roof inspector 1.4, the Array 2.5, the Strings 4.6 (desktop); the phone's Studio main region 8.8 to 10.8, the Find sheet 4.2 at the half stop.
- **V2-114** (P2) · Lines too long and too short: Performance's subtitle runs to 101 characters at 14 px on one line (1,360 px); the Find lead on tablet to 106 characters at 15 px; the Esri attribution wraps at 32 characters at 11 px.
- **V2-119** (P2) · Low contrast in the charts: The month chart's value labels (11 px, white on the gain blue) measure 3.3 : 1, under the 4.5 floor for text that size; the shade map's lightest step over the stage and the loss chain's zero marks are near the line.

## Scope in

1. The head (`PerformanceHeader.tsx`): `Performance`, its line (D96), Present and `Continue to Handover` (issue 2).
2. The lead: `Energy to the grid in year 1`, the figure in `display` with `MWh`, `Likely <P50> MWh · Conservative (P90) <P90> MWh · 9 years in 10 at least`; Option and Weather as selects beside it (`OptionSwitch.tsx`, `WeatherSelect.tsx`), on touch side by side under it (Option's value the letter alone on phone). The weather's names: Typical year · 2023, measured · Your file.
3. Three figures (`Kpis.tsx`): System size (`<kWp> kWp`, `<kW> kW of inverter`), Yield (`<n> kWh/kWp`, `A year, for each kWp`), Performance ratio (PR) (`<n> %`, `Of its rated output, in this sunlight`); tiles on desktop and tablet, a list on phone. Capacity factor, sunlight on the modules and CO₂ avoided leave the page (they are in the result's summary, issue 2).
4. Four tabs (`components/ui/Tabs.tsx`, D35's design with D94's colours): By month, Over 25 years, Where the energy goes, Assumptions; one view at a time; the last opened remembered on the device. The whole page within 1440 × 900 at first sight.
5. By month (`MonthlyChart.tsx`): `Energy to the grid each month of year 1`, the MWh axis labelled, the highest and lowest labelled beside their bars in the text colour, Chart · Table.
6. Over 25 years (`YearsChart.tsx`): `Energy each year`, `14,554 MWh in all · 0.7 % less each year`, axes labelled.
7. Where the energy goes (`LossChain.tsx`, `LossRow.tsx`): eleven plain steps in two columns, Before the modules (Sunlight on the tilted modules, Shade from rows, obstacles and the horizon, Dirt on the glass (soiling), Light reflected off the glass, Light on the back of the modules → The modules' rated output) and In the system (Heat, Low light and module quality, Shade on a string, Cables, Inverter, Downtime → To the grid); fields where the user may change them with who set them; `All 21 steps` opens the engine's chain as today's table.
8. Assumptions (`Assumptions.tsx`): Weather, Roof albedo (its one home), Ageing (degradation), Uncertainty (sets Likely and Conservative), Grid CO₂ per MWh (Set for India), as summary rows in two columns.
9. A changed value updates the number where it stands (the updating state of issue 5).

## Scope out

- The engine's chain and its 21 steps' computation.
- The report's pages (audit V2-95, its own task).

## Where the code is

- `apps/web/components/performance/*`
- `apps/web/lib/performance/*` (the grouping of the chain into eleven steps as pure logic)
- `apps/web/components/ui/Tabs.tsx`

## Words

As in Scope in; the vocabulary's rows of "Results".

## Help to keep true

Topics of Performance's sections (the gate lists them): read and rewritten for the tabs and the eleven steps; the chain's topic names each plain step with its engine step.

## Tests, written first

- `lib/performance`: the eleven steps from the 21 (their percentages compose to the engine's), Likely and Conservative from the P-values.
- The tab remembered.
- The KPIs' words.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] At 1440 × 900 the page shows the number, its selects, Likely and Conservative, three figures and the open tab, without scrolling.
- [ ] Each tab shows one view; Where the energy goes in two columns; All 21 steps opens the full table.
- [ ] Changing Dirt on the glass updates the number in place.
- [ ] Phone: the figures as a list, Continue to Handover over the tab bar.

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

- Title `V2 · 8 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #215`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
