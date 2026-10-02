# Phase 8: Performance

**Status:** done (session 12: #58 to #61). **Depends on:** phases 2, 3 and 7.

## Goal
One screen that proves the energy number and lets the user test assumptions in place.

## Scope
- Header: option switch (A to E, custom) with status marks, weather source (PVGIS TMY, NASA POWER, CSV upload)
  with GHI, temperature range and horizon summary.
- KPIs: energy year 1, P-values at the chosen levels with sigma, PR, specific yield, capacity factor AC and DC,
  in-plane irradiation, 25-year total, CO2 avoided.
- Loss chain as a cascade, 21 steps in the engine's order, two totals (array nominal, energy to grid).
  Editable steps carry their input in the row: soiling, module quality, LID (PAN or own value), mismatch,
  DC ohmic, AC ohmic, availability, rear gain on or off. Hover or tap gives value and running total.
- Monthly energy: bars with a table view (MWh and kWh/kWp).
- 25 years: line with degradation input; table for years 1, 5, 10, 15, 20, 25 and the total.
- Assumptions: thermal Uc (default by roof type shown), rear shading and mismatch, albedo, weather variability,
  model and data uncertainty, exceedance levels, grid CO2 factor.
- Summary table (the 14 rows of the desktop summary).
- Re-run on a loss edit reuses shading (D6), so the number settles in about 3 s; progress shows on the number.
- Charts are hand-built SVG: one axis each, direct labels on extremes only, tooltips, table alternative.

## Responsive
Phone: KPIs as a 2-column grid, loss chain full width with the input under the label, charts stacked.

## Acceptance
- Every figure matches the API to the displayed precision.
- Changing soiling from 2 to 3 changes energy and the chain; the layout is not recomputed.
- Playwright on three viewports with screenshot baselines; axe clean.

## As built

Built in session 12 (2026-10-02 to 2026-10-03): the plan (`phase-08-plan.md`), six boards, four pull requests: #58 (the header, the
KPIs, the summary, the states; the engine's figures after the year), #59 (the loss chain), #60 (the charts), #61 (the weather
source, a CSV with its notes, weather for a design without any, the assumptions). Every part was built by an agent in a worktree from a written brief; the session reviewed each,
ran the browser for it and made the baselines.

### What exists

| Part | Where | Pull request |
|---|---|---|
| The figures after the year (the uncertainty, the exceedance values, the 25 years, the CO2) worked out from the year's energy after the options come from the memo; the options' key leaves out degradation, the CO2 factor, the levels and both sigmas: a change of one of them answers in 0.28 s, before 4.0 s | `rooftop_core/simulation.py` (`after_the_year`), `memo.py` (`AFTER_THE_YEAR`), `project.py` | #58 |
| The Performance page: the header (the line of the run, the option switch with the marks of the verdicts, a select on phone; a press chooses from the run's answer with no request), the KPIs (the lead tile with the P-values, six tiles), the summary table (cards on phone), the states (before options the API's words leading to the Strings lens; the first load; a run on its way; a run that failed) | `components/performance/Performance.tsx`, `PerformanceHeader.tsx`, `OptionSwitch.tsx`, `Kpis.tsx`, `SummaryTable.tsx`, `UnderTheTitle.tsx`, `NoOptionsCard.tsx`; `lib/performance/header.ts`, `kpis.ts`, `summary.ts`, `page-view.ts`; `lib/format/performance.ts` | #58 |
| `Segmented` and `Select` take a mark on a choice; `Stat` gains the looks `hero` and `figure` and a quieter figure after the unit; `Table` gains a column of words (`words`), the value under the title on a card | `components/ui/Segmented.tsx`, `Select.tsx`, `Stat.tsx`, `Table.tsx`, `table-cells.ts` | #58 |
| The loss chain as a cascade with its legend, the 21 rows in the engine's order and words, the editable steps (soiling, module quality, LID with "Use the PAN's", mismatch, DC and AC ohmic, availability, the rear gain as a switch, dim with a monofacial module), the readout under the pointer, on a tap and with the focus; the roof's albedo asks the run and not the layout | `components/performance/LossChain.tsx`, `LossRow.tsx`, `use-readout.ts`; `lib/performance/loss-fields.ts`, `cascade.ts`, `loss-chain.ts`; `lib/flow/edit-parts.ts`; `NumberField` `form="chain"` and `placeholder` | #59 |
| The candidates simulated in threads (`SIMULATION_THREADS` 8), bit-identical to one after the other: a loss edit answers in 1.7 s on this machine, before 4.1 s | `rooftop_core/options.py` (`build_options`, `workers_for`) | #59 |
| Weather for a design that has none: a run refused with `weather_not_loaded` loads the weather of the document's source for its site, puts it into the document of that edit without a step of undo (`amend`) and runs again, once per edit; the step "Loading PVGIS TMY weather" | `lib/flow/design-flow.ts`, `lib/stores/project-store.ts` (`amend`), `lib/performance/weather-source.ts` | #61 |
| The test stack's API with downloads off (`ROOFTOP_WEATHER_DOWNLOADS=off`, refused in words); `/api/weather` for PVGIS and NASA at Pune answered in the browser tests from the API's own recorded answers, written by `tests.weather_fixtures` and held equal by a pytest, keyed into turbo and testmon | `rooftop_api/settings.py`, `services/weather.py`; `tools/lib/profiles.ts` (`apiEnvOf`); `e2e/fixtures.ts`, `e2e/fixtures/weather-*.json`; `apps/api/tests/weather_fixtures.py` | #61 |
| The weather select (PVGIS TMY · NASA POWER 2023 · CSV file) with a ring while the hours come, one edit when they do, a failure in the API's words under it; the CSV dialog with the file's summary and notes before Use, a refused file in the API's words; the engine's two notes for a CSV without air temperature or wind; the notes under the line of the run | `components/performance/WeatherSelect.tsx`, `use-weather-load.ts`, `WeatherCsvDialog.tsx`, `NoteLine.tsx`; `lib/performance/weather-csv.ts`; `rooftop_core/csv_weather.py`; `Select` `valueShown` and `busy`, `FileDrop` "read" | #61 |
| The assumptions: Uc (empty for the roof type's, "Use the roof type's"), rear shading and mismatch, roof albedo, weather variability, model and data, the three exceedance levels (sorted, each once), the grid CO2 factor; chips, rows on phone; shown before a voltage too. Undo by key on Performance | `components/performance/Assumptions.tsx`; `lib/performance/assumption-fields.ts`; `NumberField` `form="chip"`, `Button` size `xs` | #61 |
| Energy to grid by month: bars from one baseline, the extremes labelled, a tooltip under the pointer, a finger and the focus, the Table tab with the year; 25 years: the line with its wash, the six years, a crosshair snapping to the nearest year, the keyboard moving it, the degradation field in the head, the Table tab with the total; `Tabs` take a head, `Table` a total row, `ValueTooltip` the tooltip of a value in a chart | `components/performance/MonthlyChart.tsx`, `YearsChart.tsx`, `chart-card.ts`; `components/ui/ValueTooltip.tsx`, `use-size.ts`; `lib/performance/month-bars.ts`, `year-line.ts`, `degradation.ts` | #60 |

### Acceptance

| Asked | Met by |
|---|---|
| Every figure equals the API's to the precision shown | `e2e/tests/performance.e2e.ts` (the line, the KPIs, the summary), `performance-chain.e2e.ts` (the 21 rows at two decimals), `performance-charts.e2e.ts` (the months, the years, the totals), `performance-weather.e2e.ts` (after a change of weather or of an assumption), every number read from the run's answer, on three sizes |
| Soiling 2 to 3 changes the energy and the chain; the layout is not computed again | `performance-chain.e2e.ts`: one `/api/design`, no `/api/layout`, the energy and the row of the new run; `tests/engine/test_demo_soiling.py`: 613.61 MWh with the shading from the memo |
| Playwright on three viewports with baselines; axe clean | 33 screens of Performance beside the boards; axe in the design state, before a voltage, with the Chart and the Table tabs, with the select open, the dialog with its file, and on the assumptions |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Decision 2: "8,760 hours of PVGIS TMY weather" | "PVGIS weather", the approved board's words | "PVGIS TMY weather" wraps the line at 1440 |
| Decision 17: the threads only if under 3 s | Adopted: 1.7 s, bit-identical | Measured |
| The plan's "about 3 s" for a loss edit | 1.7 s | The threads |
| Step 17: `tools/weather-fixtures.ts` | `apps/api/tests/weather_fixtures.py`, the API's own answers through `TestClient`, held by a pytest | The recordings and `Services` live in the pytest package |
| "Night consumption" −0.00 % as the board | 0.00 % | A change under half a hundredth is shown without a sign |
| The chain's phone layout as the phone board (the field, the track and the total on one line) | As the parts board: the label line; the field, the change and the total; the track across | The two boards differed; the parts board was drawn for it |

### Found on the way

- The approved board's hand-typed running totals differed from the engine's in the last decimal (1,997.9 for 1,998.0); the boards are
  drawn from the engine's numbers now (`performance_data.json`).
- `--update-snapshots` leaves a baseline whose difference is under the 50 pixels allowed: a changed placeholder stayed in eight
  pictures until the files were deleted and written afresh. A picture that must change is deleted first.
- An agent that extends a shared component can move every screen that uses it: `Segmented` laid out as a flex row for its mark left
  the words of a width-filling control at the left (55 screens); `Stat` wrapping its value row for the phone's "more" line put the
  vitals' ring on a second line (3 screens and a menu that closed with the page). The kit and the screens of the Studio are run before
  the full check when a component in `components/ui` changed.
- A closed popover is `display: none` by the browser's own stylesheet, which an author class (`flex`) overrides: a closed tooltip
  counted as shown. It is `invisible` while closed.
- A touch pointer leaves the moment the finger lifts: a readout shown on a tap went with the pointer's leave.
- On tablet and phone the Performance page scrolls inside its frame: a tap at a chart below the window lands nowhere, and the focus
  scrolling the chart into view hides a tooltip that takes a moving page as a reason to go. The tests scroll first.
- Tests that fail under the load of a full check and pass alone: the wall's menu on phone, closed when the top bar says the notes
  (fixed: the test waits for it); `build.e2e.ts` "Edit shows the design's outline" on tablet (a 5 s wait on a navigation; a watch
  item); the charts' keyboard tests on tablet, where the focus can scroll the frame and the moving page takes the tooltip away by
  design (they run on desktop alone now, where the keyboard is the way in).
- `page.unroute(pattern)` takes every handler of the pattern, the fixtures' too: a test unroutes its own handler.
- To the browser's tooling an `aria-disabled` button is not enabled: a test presses it with `force`.
- The full check is 29 minutes now (1,680 browser tests; the Performance page is long and its weather tests run the demo twice).
- A loss edit was measured in parts: 3.7 of the 4.0 s were the seven simulations, 0.5 s each, one after the other.
