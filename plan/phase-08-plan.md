# Phase 8: plan

Written 2026-10-02 by session 12, before anything of the phase is built, as the work order asks
(`plan/resume/011-phase-8-performance.md`). Scope and acceptance: `plan/phase-08-performance.md`. This file says how the
phase is built, in which order, what is decided unless the owner says otherwise, what was found in the code and the API,
what needs the owner, and what done means.

## What was found at the start of the session

- `main` is clean at `ae669dc` and matches `plan/STATE.md`: no open pull request, no stack running, no local branch.
  `bun check` on `main`: green, every step skipped from the cache.
- **The Artifact tool is not available in this session** (Bedrock). The boards are shown from the previews in the repo,
  as in sessions 9 to 11.
- **`/design` already answers every figure of the screen.** Probed on the demo with `rooftop_api` (scratchpad), option A:
  - `Energy`: 617.84 MWh, PR 0.8655, 1,729.3 kWh/kWp, CUF 25.65 % AC and 19.74 % DC, in-plane 1,997.98 kWh/m2, GHI
    1,822.92, clipping 3.36 %, sigma 4.24 %, LID 0.2 %, CO2 442.37 t; `p_values` P50 617.8, P75 600.2, P90 584.2;
    `monthly_mwh` the twelve of `demo-numbers.md`; `years_mwh` 25 values (617.8 to 547.8) and `total_25_years_mwh`
    14,553.8.
  - `steps`: the 21 steps in the engine's order with `kind` (`irr_total`, `irr`, `energy_total`, `energy`, `result`),
    `value` (kWh/m2 for irradiance, MWh for energy) and `pct` against the step before. The engine's labels differ from the
    board's in four places: "Transposition to plane (15°)" (board "Transposition to 15° plane"), "IAM" ("Incidence angle
    (IAM)"), "DC ohmic" ("DC ohmic, at STC"), "AC ohmic" ("AC ohmic, at nominal"). "LID (PAN)" when the LID is the PAN's.
  - `Option.summary`: the 14 rows of the desktop summary, worded by the engine ("29 in series × 22 strings on 1
    inverter(s)", "Clipping 3.4 % · LID 0.20 % · uncertainty σ 4.24 %", "442.4 t/yr at 0.716 t/MWh").
  - `DesignResult.weather` (the `WeatherSummary`: source, label, hours, GHI, DNI, DHI, temperatures, highest horizon),
    `weather_notes`, `far_shading_note` ("Far shading: PVGIS horizon, highest 2.7°"), `sizing.uc` with `uc_from`
    ("roof type", 29 W/m2K on the flat roof).
- **Every assumption of the scope is in the document already.** The API's `Losses` mirrors the engine's field for field,
  `co2_t_per_mwh` included (the work order thought it missing): soiling, LID (null: the PAN's), quality, mismatch, DC and
  AC ohmic, availability, degradation, Uc (null: by roof type), bifacial, rear shading and mismatch, weather variability,
  model and data, the exceedance levels, the grid CO2 factor. The roof's albedo is `Roof.albedo`. Not shown and kept at
  their defaults, as on the desktop: `uv` 0 and `iam_b0` 0.05.
- **What an edit costs** (the demo, the memo warm):

  | Edit | Run | Why |
  |---|---|---|
  | Nothing changed | 0.25 s | Both stages from the memo |
  | Soiling 2 → 3 (any loss of the chain, Uc, bifacial, rear loss) | 4.0 s | The shading kept; the seven candidates simulated again, 0.5 s each |
  | Degradation, the CO2 factor, the exceedance levels, either sigma | 4.0 s | The same, although none of them touches an hour: they are worked out from the year's energy at the end of `simulate` |
  | Another weather source | 11 to 12 s | The hours differ (PVGIS's TMY is stamped 2019, NASA's 2023), so the shading is computed again |

  Soiling at 3 %: 613.61 MWh, the soiling step −3.00 %, the rear gain +3.69 %, the clipping −3.10 %, the chain otherwise
  moved by its own share. The 4 s are the work order's "about 4 s"; the phase file's "about 3 s" is not met today.
- **`/design` never downloads weather.** `services/design.prepare` loads the weather without download: a document whose
  `weather_json` is not of its site and source is refused with `weather_not_loaded` ("This project has no weather for
  18.5200, 73.8600 yet. Load the PVGIS TMY weather first."). The web app never calls `/weather` (`loadWeather` is in the
  client and unused): **a roof built on the map in the running app has no energy today.** The Phase 7 tests gave such a
  design the demo's weather through a route on `/api/roof/from-map`.
- **`/weather`** answers `{weather, summary, notes}` for `pvgis`, `nasa` (by site) and `csv` (by its text). On Pune:
  NASA POWER 2023 has GHI 1,815.7, DNI 1,263.8, DHI 799.0 kWh/m2, 8.87 to 40.32 °C, no horizon, no notes; the demo's
  option A on it gives 559.6 MWh and the far shading note "Far shading: no horizon profile for this weather source". A CSV
  of GHI alone gives the note "pune-ghi.csv has no beam and diffuse irradiance. They were worked out from the global
  irradiance (Erbs model), which is less exact than measured values." (DNI 1,435.4, DHI 822.7) and 606.4 MWh.
- **A CSV without air temperature takes 25 °C for every hour, and wind 1 m/s, without a word** (`weather.parse_csv`):
  the strings are then sized at a lowest ambient of 25 °C, which lets them be longer than the site's cold allows. On the
  demo's roof such a file makes the options 29×22×1, 30×21×1, 26×24×1, 26×27×2, 30×23×1, with strings of 30 that do not
  fit at the site's 11.9 °C. The desktop app does the same.
- **How the tests have weather without the network.** pytest stands in for `requests.get` with the answers recorded in
  `tests/fixtures/weather` (`tests/recorded.py`: PVGIS TMY and horizon and NASA POWER 2023, all for Pune at 18.52, 73.86;
  PVGIS over the sea refused). The browser tests stop what leaves the browser (`e2e/fixtures.ts`), but the test stack's
  API is a real server: a `/weather` that reached it for PVGIS or NASA would go to the network unseen.
- **The roof's albedo is a field of `roof`**, and `edit-parts.ts` asks a layout for any change of `roof`: an albedo
  entered asks a layout the layout does not read (the engine's memo leaves it out of the shading too, `NOT_FOR_SHADING`).
- **The approved board** (`Performance.dc.html`, desktop 1440 × 1160) draws: the title and a line of the run ("29 modules
  in series × 22 strings on 1 inverter · 8,760 hours of PVGIS weather, 11.9 to 39.3 °C, horizon up to 2.7°"), the weather
  select, the option switch A to E with their marks; the lead tile of the energy with P50, P75 and P90 · σ; six tiles
  (PR, yield, capacity factor AC with DC, in-plane, 25 years, CO2); the chain "From sunlight to the grid" with its legend
  and eight boxed inputs; "Energy to grid by month" with the extremes labelled; "25 years" with Degradation and the six
  years under the line; "Assumptions" as seven chips. It stops at 1160: **no summary table, no table view of a chart, no
  tooltip, no tablet or phone, no state.** The board "Tabs" (D35) draws the monthly card with Chart and Table as tabs, and,
  as an example of a long row on phone, Performance's parts as tabs.
- **Performance has no vitals bar** (D38): `Vitals.tsx` is the Studio's. The page is `NotBuiltYet`. The shell scrolls a
  workspace inside `data-workspace-frame`, so long pictures use `expectWholeScreen`.
- **The option chosen** is the Studio's: `chosen_option` committed, nothing asked, the results store takes it from the
  run's answer (`optionChosen`, `withTheChoice`). `StringOptions.tsx` and `lib/studio/option-cards.ts` have the letter,
  the caption and the mark of every option.

## How the work goes

- **Step 0, the boards**, drawn and approved before anything is built (below). Then **four pull requests**, split where
  nothing of the earlier depends on the later; each builds its part on three sizes, with its states, and carries its
  pictures beside the boards:
  1. `feat/phase-8-kpis`: the page in place of "Not built yet"; the header (title, the line of the run, the option switch,
     the weather shown); the KPIs with the P-values; the summary table; the states of the page (before a voltage and the
     other reasons for no options, the first load, a run on its way, a run failed); the figures after the year taken out
     of the memo's key. Steps 1 to 6.
  2. `feat/phase-8-loss-chain`: the chain as a cascade with its legend; its editable steps; the value and running total
     under the pointer or the finger; the acceptance's soiling. Steps 7 to 11.
  3. `feat/phase-8-charts`: energy by month and the 25 years, each with its table, its tooltip and its extremes; the
     degradation. Steps 12 to 15.
  4. `feat/phase-8-weather-assumptions`: weather for a design that has none; the weather source switched; a CSV with its
     notes; the engine's notes for a CSV without temperature or wind; the test stack without downloads and the weather
     fixtures; the assumptions; the close of the phase. Steps 16 to 22.
- Every step is one commit (two when a token is new: the document first). A draft pull request after its first step,
  merged after its last, on a green check at its head (`bun check`, gated on its exit code, as a job of its own).
- Test first, seen failing. Logic is a pure function or a store without React, tested with `bun test`; the engine and
  the API with pytest; what is seen with Playwright on 390, 834 and 1440, with baselines. Numbers in browser tests are
  read from the run's answer, never written into the test; the acceptance's numbers are compared with `demo-numbers.md`
  once, in pytest.
- Agents build in worktrees under `$TMPDIR` with written briefs, independent parts in parallel (the engine's steps beside
  the web's; the charts beside the chain once pull request 1 has merged the page); every result is reviewed and run
  before it is merged. The session runs the browser for them. Baselines are made in the main working tree.
- `plan/STATE.md` is brought up to date on `main` after each pull request, from a worktree when a branch is open.

## Step 0: the boards

Drawn with two builders, `docs/design/mockups/build_phase8_performance_boards.py` (the screen on three sizes) and
`build_phase8_part_boards.py` (its parts and states), from the helpers of the earlier builders; every number from the
engine's answer for the demo, kept in `mockups/performance_data.json` (option A; A with soiling 3 %; NASA POWER; a CSV of
GHI alone; the run before a voltage), so that the boards can be written again without the engine. The chart boards are
drawn after the dataviz skill is read. Rendered as before, listed in `docs/design/README.md`. Approval before step 1.

| Board | What it draws |
|---|---|
| **Performance** (replaces `Performance.dc.html`; the top as approved) | Desktop, the whole screen: the approved header, KPIs, chain, months, years and assumptions, with the engine's labels of the chain (decision 3), Chart and Table as tabs on the two chart cards (decision 9), and under them the summary table of 14 rows (decision 16) |
| **Performance, tablet and phone** | Tablet 834: the header on two lines, the lead tile across with the six tiles 3 by 2, the chain across the width, the two charts side by side, the assumptions and the summary across. Phone 390: the option switch and the weather as two selects, the KPIs two to a row, the chain full width with its input under the label, the charts stacked, the summary as cards |
| **Loss chain, edited** (desktop, phone in parts) | Soiling entered at 3.0 and the run on its way: the chain dimmed, the ring and the step; after it lands, every changed figure; LID from the PAN and LID entered ("Use the PAN's"); the rear gain off, and a monofacial module (the switch dim, the desktop's words); the value and the running total under the pointer; a value out of range brought to the limit (D31) |
| **Charts, tooltip and table** (desktop, phone in parts) | The month under the pointer (MWh and kWh/kWp); the table view of the months (MWh, kWh/kWp, the year's total); the 25 years under the pointer and its table (years 1, 5, 10, 15, 20, 25 and the total); the degradation entered at 0.70 %/yr |
| **Weather and assumptions** (desktop, phone in parts) | The weather select open (PVGIS TMY, NASA POWER 2023, CSV file); NASA loading, then chosen, with "no horizon"; the CSV dialog with a file of GHI alone and the Erbs note before Use; a download that failed, in the API's words; the assumptions with Uc entered ("Use the roof type's"), the exceedance levels changed to P50 · P90 · P99 |
| **Performance, states** (desktop, phone in parts) | Before a system voltage: the API's title and message (D37) leading to the Strings lens, the weather shown, no energy anywhere; the first load (skeletons); a run on its way (dimmed, the ring on the energy, the step); a run failed (the values of before, "Energy was not updated", Try again) |

Two agents draw them in parallel (the first two boards; the last four), from a brief that names the helpers, the tokens,
the data file and the engine's words.

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 1 | The figures after the year | The engine works out the P-values, the 25 years and the CO2 from the year's energy after the options come from the memo (`simulation.after_the_year`), and the options' key leaves out degradation, the CO2 factor, the levels and both sigmas (decision 5) | pytest: the same answers with and without the memo, for each of the five fields changed; a change of one simulates nothing (counted); the time before and after, written in "As built" | |
| 2 | The page and its header | `app/(workspaces)/performance/page.tsx` with `components/performance/Performance.tsx`; the title, the line of the run (decision 2), the option switch (decision 4), the weather shown (its label; the select comes in step 18) | `lib/performance/header.test.ts`: the line from the run; the switch's items, marks and the one chosen | The line and the items equal the run's; a press on B chooses it with no request (counted), the KPIs show B's energy |
| 3 | The KPIs | The lead tile (energy, P-values at the document's levels, σ on the last), PR, yield, capacity factor AC with DC, in-plane, 25 years, CO2, with the formats of `guidelines.md` (decision 3) | `lib/performance/kpis.test.ts`: each tile's words and number from an option; levels P50, P90, P99 | Every tile equals the run's chosen option at the precision shown, on three sizes |
| 4 | The summary table | `Table` of the 14 rows of `Option.summary`, the engine's words (decision 16); cards on phone | `summary.test.ts`: the rows | The rows equal the run's |
| 5 | The states | Before options: the API's `no_options` title and message, a link to the Strings lens, the weather shown, nothing of energy (decision 15); the first load: skeletons; a run on its way: the values dimmed, the ring beside the energy with the engine's step; failed: the values of before, the note and Try again | `lib/performance/page-view.test.ts`: each state from the results and their status | A design built by hand (no voltage): the API's words, no MWh anywhere; a run held by a route: dimmed with the step; a run failed by a route: the values of before |
| 6 | Close of pull request 1 | Baselines; the state | | The pictures beside the boards |
| 7 | The edit of a loss | `lib/performance/loss-fields.ts`: each editable step's field from the document and the run, its range (inventory 1.7), its default and where it comes from; the edit of the document (decision 6). `edit-parts.ts`: the albedo leaves the layout's parts (decision 7) | `loss-fields.test.ts`: LID empty for the PAN's with "PAN 0.2 %", entered, given back; the rest; `edit-parts.test.ts`: an albedo asks the run, not the layout | |
| 8 | The cascade | `lib/performance/cascade.ts`: each step's bar from the running total before to after on one relative scale fitted to the track, gain or loss or zero, the totals' markers (decision 10) | `cascade.test.ts`: the demo's 21 steps: the transposition a gain of 9.60 %, the grid's end 5.1 % under the GHI, a zero step its colour | |
| 9 | The chain | `LossChain.tsx`: label, the input where the step is the user's, the change in %, the track, the running total; the legend; the rows of the engine in its order and words (decision 3); inside the chain a number field of 22 on desktop, the input under the label on phone | `loss-chain.test.ts`: the rows' words and numbers from the run | The 21 rows equal the run's steps at two decimals; the inputs show the document's |
| 10 | Value and running total | Under the pointer (a row is the target) and on a tap, a tooltip with the step's value and the running total (decision 18) | The words of the tooltip | Hover a row: its value; a tap on phone |
| 11 | Soiling; close of pull request 2 | The acceptance: soiling 2 → 3 commits `losses.soiling_pct`, the run follows after the pause with no `/api/layout`, the energy and the chain change. The simulation of the options in parallel, measured (decision 17). Baselines | pytest: the demo with soiling 3 % (613.6 MWh) in `demo-numbers.md` | Soiling 3: one `/api/design`, no `/api/layout`; the energy and the soiling row equal the new run's and differ from the first |
| 12 | The chart's shapes | `lib/performance/month-bars.ts` and `year-line.ts`: bars and the line on one axis, the extremes labelled, the hit areas larger than the marks (guidelines "Charts") | `month-bars.test.ts`, `year-line.test.ts`: heights, the extremes (Mar 68.4, Jul 31.5), the six years | |
| 13 | Energy by month | `MonthlyChart.tsx` (hand-built SVG) with Chart and Table as tabs (decision 9); the tooltip with MWh and kWh/kWp; the table of the months with the year's total | `monthly.test.ts`: the rows | The bars' labels and the table equal the run's `monthly_mwh`; the tooltip on hover and on tap |
| 14 | The 25 years | `YearsChart.tsx`: the line, years 1, 5, 10, 15, 20, 25 under it, the degradation field in its head (`losses.degradation_pct`, 0 to 3 %/yr); the table with the total | `years.test.ts` | The six years and the total equal the run's; degradation 0.7 answers in well under a second (step 1) and changes them |
| 15 | Close of pull request 3 | Baselines | | |
| 16 | Weather for a design that has none | `design-flow.ts`: a run refused with `weather_not_loaded` loads the weather of the document's source for its site (`/weather`), puts it into the document of that edit without a step of undo, and runs again; the step "Loading PVGIS TMY weather" (decision 11) | `design-flow.test.ts`: the refusal, the load, the run again with the weather; a load that fails is the run's failure in the API's words; an edit while it loads gives it up | A roof built by hand gets energy (the Phase 7 route on `/roof/from-map` taken away) |
| 17 | No downloads in the tests | The test stack's API starts with downloads off (`ROOFTOP_WEATHER_DOWNLOADS=off`, read in `rooftop_api`): a download refused in words. `e2e/fixtures/weather-*.json`: the API's own answers to PVGIS and NASA for Pune, made by `tools/weather-fixtures.ts` from the recorded services; the fixtures of `e2e/fixtures.ts` answer `/api/weather` from them (decision 13) | pytest: downloads off refuses PVGIS and NASA with the words, and reads a CSV; `tools` test: the fixtures equal what the tool makes | Every test that loads weather is answered from the fixture |
| 18 | The weather source | The select in the header: PVGIS TMY, NASA POWER 2023, CSV file (decision 12); PVGIS or NASA: `/weather` first, then one edit of the source and its weather; loading and failure in the API's words; the line of the run and the far shading note follow | `lib/performance/weather.test.ts`: the select's items, the edit of the document, undo back to the weather of before | NASA chosen: the run with NASA's weather, the line says "no horizon", the energy the run's; a failure held by a route: the API's words, the source of before kept |
| 19 | A CSV with its notes | The CSV dialog (`FileDrop` in a `Dialog`, as the PAN's): read by `/weather`, the summary and the notes before Use; a file refused in the API's words (D32); Use commits the source, the file's name and text, and the weather. The engine's new notes for a CSV without air temperature or without wind (decision 14) | pytest: the notes, word for word; a CSV with every column has none; `weather.test.ts`: the dialog's view | A CSV of GHI alone: the Erbs note in the dialog and in the header's notes after the run; a CSV of nothing refused in the API's words |
| 20 | The assumptions | `Assumptions.tsx`: Uc (empty for the roof type's, its value and "by roof type"), rear shading and mismatch, roof albedo, weather variability, model and data, the three exceedance levels, the grid CO2 factor; each a field in a chip; ranges of inventory 1.7 (decisions 6, 8) | `assumption-fields.test.ts`: each field, the levels sorted and once each | Uc 25 changes the energy; the levels P50 · P90 · P99 change the tiles; CO2 0.8 changes the CO2 tile, each read from the run |
| 21 | Axe and the sizes | Axe on the page in each state; the phone and the tablet looked at again | | Axe clean on three sizes |
| 22 | Close of pull request 4 and the phase | Baselines; "As built" with the deviations and what was found; the status; the state | | |
| C | Close | "As built" in the phase file, status in `README.md`, `STATE.md`, the record of session 12, resume 011 set to used | | |

## Decisions I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | Performance has no vitals bar; its header and its KPIs are where the values stand (D38). Nothing of the Studio's stage is on the page | D38; the board |
| 2 | The line under the title is made of the run's numbers in the board's words: "29 modules in series × 22 strings on 1 inverter · 8,760 hours of PVGIS TMY weather, 11.9 to 39.3 °C, horizon up to 2.7°"; with no horizon "no horizon"; before options the strings' part is the API's title | The board; the web counts, it does not judge |
| 3 | Every figure is the run's chosen option's, formatted by `guidelines.md` ("Numbers and units"): the chain's changes with two decimals and the true minus, the running totals with one and their unit on the totals. The chain's labels are the engine's, word for word ("IAM", "DC ohmic", "Transposition to plane (15°)"); the board is redrawn with them | The engine's words are not reworded (Phase 7's deviation); the acceptance's "to the precision shown" |
| 4 | The option switch is the Studio's choice: a press commits `chosen_option` and asks nothing; its items are the run's options with the letter, the caption of the chosen one ("A · Recommended"), and the mark of the verdict (tick or exclamation mark, words to a screen reader). Your own appears as "Your own" when it was simulated; a refused one is not an item (it has no energy). On phone it is a select | Phase 7, decision 3; the board; no energy for what cannot be built |
| 5 | The P-values, the 25 years and the CO2 are worked out from the year's energy after the memo: the options' key leaves out degradation, the CO2 factor, the levels and both sigmas, so a change of them settles in about 0.25 s instead of 4 | They touch no hour; D6: dropping the memo changes nothing but speed |
| 6 | A loss is a field of the document (`losses.*`) with the inventory's range (1.7). LID and Uc are empty while their default holds and say it ("PAN 0.2 %", "29 by roof type"), and are given back with "Use the PAN's", "Use the roof type's"; the others hold their value, as the API's defaults do. The rear gain is a switch; with a monofacial module it is dim and says the desktop's "The module is monofacial: no rear gain." An entry outside the range goes to the limit and says so (D31) | Inventory 1.7; the desktop's controls (`main_window.py`, "Losses", "Bifacial and albedo"); Phase 7, decision 7 for the defaults |
| 7 | An edit of the roof's albedo asks the run and not the layout: `edit-parts.ts` compares the roof without its albedo | The layout does not read it; the engine leaves it out of the shading (`memo.NOT_FOR_SHADING`) |
| 8 | The exceedance levels are three fields from P50 to P99; on commit they are sorted and each kept once, as on the desktop | The desktop (`main_window.py`, `_losses_changed`) |
| 9 | Each chart card has Chart and Table as tabs in its head (the board "Tabs", "In use"). On phone the page is one column, the charts stacked (the phase file, `information-architecture.md`); the board "Tabs"' row of Performance's parts on phone was an example of a long row and is not the page | The phase file and the IA say one column; the tab row hides what the page is for, proving the number |
| 10 | The chain's track is a cascade on one relative scale: each step's bar runs from the running total before it to the one after, in percent of the GHI chained through the steps (the energy steps continue from the irradiance's end); the scale is fitted to the extremes of the run, so the bars of the board come out as drawn. Gain blue, loss orange, a zero step a tick in `data-zero`; the totals a 2 px marker | The board's bars are exactly that (the grid's end 5.1 % left of the GHI); `components.md`, "Loss chain" |
| 11 | A run refused with `weather_not_loaded` makes the flow load the weather of the document's source for its site, put it into the document of that edit (it is the document's, D7, and no step of undo), and run again. The web judges no weather itself: the API says when it is missing | A roof built on the map has no energy today; the engine's rule (`_embedded_weather_fits`) is written once |
| 12 | The weather source is a select: PVGIS TMY, NASA POWER 2023, CSV file. PVGIS or NASA: `/weather` is asked first and the document is edited once with the source and its weather when it comes; a failure says the API's words under the select and leaves the weather of before. A CSV opens a dialog: the file read by `/weather`, its summary and notes shown, Use commits the source, the name, the text and the weather. Undo gives back the weather of before. A new source computes the shading again: the run takes 11 to 12 s and says its steps | The weather is embedded so the design opens offline (D7); an edit that cannot be run is not committed (D32: a refused file leaves what was) |
| 13 | In the browser tests `/api/weather` for PVGIS and NASA is answered from fixtures that are the API's own answers, made by a tool from the recordings of pytest; CSV goes to the API, which reads text. The test stack's API starts with downloads off, so a route missed fails in words and never reaches PVGIS | Rule 6: the browser's guard cannot see the API's own calls |
| 14 | The engine adds two notes to a CSV: without air temperature, that 25 °C was taken for every hour, so the strings are sized for 25 °C and the site's lowest and highest ambient should be entered in the Strings lens; without wind, that 1 m/s was taken. No number changes. The words are mine, shown on the board for the owner's yes | Strings sized at 25 °C can be longer than the site's cold allows, without a word; a note says what is wrong and what to do |
| 15 | Before options (no voltage, no positions, no length fits, too few positions) the page shows the API's `no_options` title and message (D37) with a link to the Strings lens, the weather and its line, the assumptions as fields (they are inputs), and no figure of energy: no KPI, no chain, no chart, no summary. A run on its way dims the values with the ring beside the energy and the engine's step; a failure keeps the values of before with "Energy was not updated" and Try again; the first load shows skeletons | D10, D37, `guidelines.md` "States"; the vitals' words (`components.md`, "Vitals: states") |
| 16 | The summary is a table of the 14 rows of `Option.summary` in the engine's words, under the charts, across the page; cards on phone | Inventory 2.6; the desktop summary |
| 17 | The options are simulated in parallel threads only if the answers are the same to the bit and a loss edit falls under 3 s on this machine; else it stays as it is and "As built" says the time | The phase file's 3 s; 0.5 s of numpy per candidate, seven of them in turn |
| 18 | The value and the running total of a step, a month or a year show under the pointer (the whole row or column is the target) and on a tap; never on the only path: the table holds them too | `guidelines.md`, "Charts" and "Accessibility" |
| 19 | NASA POWER stays the year 2023 and a CSV's times stay UTC, as on the desktop; the select says "NASA POWER 2023" and the CSV dialog says the times are read as UTC | The open item; nothing in a request sets them, and the phase does not add it |

## What was found in the code and the API, for the steps

| Step | Fact |
|---|---|
| 1 | `simulate` ends with `pvals`, `years` and `co2_t` from `e_grid` and the losses; `memo.options_key` lists `p.losses` whole |
| 2 | `withTheChoice` and `optionChosen` choose without a run; `option-cards.ts` words the cards; `Shell.tsx` has `data-workspace-frame` |
| 5 | `noOptionsOf` gives the API's reason; `vitalsOf` the words of a run on its way and of a failure; `designStatusOf`, `progressOf` |
| 7 | `partsOfAnEdit` asks a layout for any change of `roof`; `roof-fields.ts` edits the albedo in the Roof lens |
| 11 | `test_demo_numbers.py` runs in every pytest run; the demo with soiling 3 % is 613.61 MWh |
| 16 | `prepare` raises `WeatherNotLoaded` (field `weather_json`) before the stream; `loadWeather` is in the client |
| 17 | `tests/recorded.py` answers for (18.52, 73.86) only; `tools/dev.ts` sets the API's environment |
| 19 | `csv_weather._notes` has the Erbs note and the hours' note; `weather.parse_csv` fills 25 °C and 1 m/s |

## What needs the owner

| What | When | Blocks |
|---|---|---|
| A yes or no to each decision above | Before step 0 | Everything |
| The six boards of step 0, with the words of decision 14 | Before step 1 | Pull request 1 |

## Risks

| Risk | What I do |
|---|---|
| A loss edit stays at 4 s, over the phase file's 3 | Step 11 measures the options in parallel (decision 17); the number shows its ring and step while it settles; "As built" says the time |
| Taking the figures after the year out of the memo's key changes an answer | The answers with and without the memo compared field by field for each of the five fields (step 1); the demo's numbers test in every run |
| A test reaches PVGIS through the test stack's API | Downloads off in the test stack (step 17); the fixtures answer `/api/weather` |
| The flow's second run after a weather load hides a real failure | Only `weather_not_loaded` is answered so, once per edit; any other failure is the run's, in the API's words |
| A new source costs 11 to 12 s | The steps of the engine on the number; the source of before stays shown until the run lands |
| The browser tests grow past 22 minutes | Performance draws no 3D: its tests are light; one baseline per state |
| A long page on tablet and phone scrolls inside its frame | `expectWholeScreen` for every picture of the page |
| Four pull requests and step 0 are more than one session | The state is written after each pull request; each session ends at a merge |

## Done means

The acceptance of `plan/phase-08-performance.md`, point by point:

- Every figure equals the API's to the precision shown: the header, the KPIs, the chain's 21 rows, the months, the years,
  the summary, compared in the browser with the run's answer on three sizes (steps 2 to 4, 9, 13, 14).
- Soiling from 2 to 3 changes the energy and the chain, and the layout is not computed again: one `/api/design`, no
  `/api/layout` (step 11); in pytest, 613.6 MWh with the shading taken from the memo.
- Playwright on three viewports with baselines beside the boards; axe clean (step 21).

And beyond it: the boards of step 0 approved and in the repo; a roof built on the map gets its weather and its energy;
the weather source switched and a CSV read with its notes; the figures after the year in a quarter of a second; "As
built" written.
