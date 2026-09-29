# Phase 7: Studio, Strings lens

**Status:** not started. **Depends on:** phases 2 and 5.

## Goal
The user picks the electrical design with the consequences visible on the roof.

## Scope
- Inverter: OND upload, parsed fields, max current per MPPT with its source note.
- System voltage: 600, 1000, 1500 V, nothing selected at first. Until chosen, the lens explains what is
  waiting on it; vitals show the roof and positions only. Limit note names the lowest of system, module and inverter.
- Sizing temperatures: lowest and highest ambient with "from the weather", cell rise with its default by roof type.
- Series range bar: feasible band, MPPT minimum, Voc or MPPT maximum limit, chosen length.
- Verdict line with tick or exclamation and the exact engine wording. "No string length fits" state.
- Options A to E as cards: series, strings, modules, kWp, inverters, DC/AC, clipping, MWh, kWh/kWp, status,
  recommended badge. Selecting one is instant (results are already in the response).
- Custom option (n, s, k): add, replace, remove.
- Per-MPPT loading table with limits and status.
- On the roof: modules coloured by string, by MPPT or by inverter (fixed categorical order, legend,
  labels on select); unused positions ghosted; inverter markers; hover or tap a string to trace it.
- AC cable per inverter.
- Note for the Voc coefficient warning, with a field to enter the datasheet value (desktop asked for it
  but had no input).

## Acceptance
- Demo at 1500 V reproduces the five options of `reference/demo-numbers.md`; at 1000 V the maximum series is 19.
- With no voltage chosen nothing is preselected and no energy is shown anywhere.
- Playwright: choose voltage, switch option, add custom option; colours follow the string, not its rank;
  three viewports.

## Out of scope
SLD drawing (phase 9).
