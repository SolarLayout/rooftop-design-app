# Phase 8: Performance

**Status:** not started. **Depends on:** phases 2, 3 and 7.

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
