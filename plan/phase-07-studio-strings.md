# Phase 7: Studio, Strings lens

**Status:** done (session 11: #53 to #57). **Depends on:** phases 2 and 5.

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

## As built

Built in session 11 (2026-10-02): the plan (`phase-07-plan.md`), six boards, five pull requests: #53 (the voltage, the
series range, the sizing), #54 (the options and your own), #55 (the strings on the roof), #56 (the inverter, its limits,
the MPPT loading), #57 (the states, the phone, the frame rate). Parts 3 and 4 and the engine of part 2 were built by
agents in worktrees from written briefs; the session reviewed them and ran the browser.

### What exists

| Part | Where | Pull request |
|---|---|---|
| An edit asks for what it changes: the layout only for the roof, the array or the module; nothing for the chosen option | `lib/flow/edit-parts.ts`, `design-flow.ts` | #53 |
| The Voc coefficient entered (`Project.voc_coefficient_pct`) sizes the strings the datasheet's way; one Voc cold for the range, the cable schedule and the BOM | `rooftop_core/onediode.py`, `stringing.py`, `bom.py`, `readouts.py`; the API's `Project`, `Coefficients.source` "entered" | #53 |
| The Strings lens's inspector: the inverter card; the decision card before a voltage, what waits and what is done; the voltage as the user's choice; modules in series with its band, ends, marker and the engine's verdict; "No string length fits"; the sizing temperatures, the cell rise and the Voc coefficient; the line under the title | `components/studio/StringsInspector.tsx`, `InverterCard.tsx`, `SystemVoltage.tsx`, `SeriesRange.tsx`, `SizingTemperatures.tsx`; `lib/studio/strings-view.ts`, `series-bar.ts`, `inverter-card.ts`, `sizing-fields.ts`; `stage-view.ts` (`stringsLineOf`) | #53 |
| The custom option keyed `custom`; one that cannot be built not simulated, `custom_refused` in words; `strings_by_series`; the custom simulated apart (0.8 s, before 5.2 s); the captions (`Option.caption`) | `rooftop_core/options.py`, `project.py`, `memo.py`, `readouts.py`; the API's `DesignResult`, `Option` | #54 |
| An option chosen at once from the run's answer, with no request; held when a run lands; the option cards; your own added, changed, removed, bounded by what fits | `lib/stores/results-store.ts` (`optionChosen`, `withTheChoice`); `components/studio/StringOptions.tsx`; `lib/studio/option-cards.ts`, `custom-fields.ts` | #54 |
| The glass by string, MPPT or inverter, a string's colour by its label; the unused grey; the switch and the legend; the inverters' boxes and chips; a string traced under the pointer and selected, with its callout from the cable schedule; the text equivalent | `lib/scene/string-colours.ts`, `string-legend.ts`, `inverter-markers.ts`; `components/scene/Modules.tsx`, `InverterMarkers.tsx`, `Scene.tsx`; `components/studio/StringLegend.tsx`, `InverterChips.tsx`, `Callout.tsx`; the palette's `series1` to `series6`, `stringSelected`, `inverterMarker` | #55 |
| The verdict counts the MPPT loads; Replace the inverter from an OND; the inverter's limits and cabling (the current per MPPT, the AC cable); the MPPT loading, its limit not known | `rooftop_core/readouts.py`; `components/studio/ReplaceInverterDialog.tsx`, `ReplaceEquipmentDialog.tsx`, `InverterLimits.tsx`, `MpptTable.tsx`; `lib/studio/inverter-fields.ts`, `mppt-table.ts`; `Table` (a line under a value, `dense`, `cardColumns`) | #56 |
| The states: a run on its way dims what it will replace, with a ring, also after a change of voltage; a run that failed leaves the values of before; too few positions or none in the API's words. On phone the callout under or over its dot by the room there is, its chip 264 and held inside the stage | `lib/studio/strings-view.ts` (`isOfTheVoltage`), `StringOptions.tsx` (`NothingFits`), `SeriesRange.tsx`; `lib/scene/callout-place.ts` | #57 |
| The tablet pictures of the Strings lens taken whole: the Studio scrolls inside its frame there | `e2e/screens.ts` (`expectWholeScreen`); `Shell.tsx` (`data-workspace-frame`) | #56 |

### Acceptance

| Asked | Met by |
|---|---|
| The demo at 1500 V reproduces the five options of `demo-numbers.md` | `tests/engine/test_demo_numbers.py` (every pytest run), and `e2e/tests/strings-options.e2e.ts`: the cards equal the run's options, on three sizes |
| At 1000 V the maximum series is 19 | `tests/engine/test_stringing.py`; `e2e/tests/strings-lens.e2e.ts`: the band's end is the run's `n_max` |
| With no voltage chosen nothing is preselected and no energy is shown anywhere | `strings-lens.e2e.ts`: a design built on the map has no voltage, no radio checked, no MWh or kWh/kWp anywhere, the Sun lens's electrical figure waiting |
| Playwright: choose a voltage, switch the option, add a custom option | `strings-lens.e2e.ts` (1500 V pressed asks one run and no layout), `strings-options.e2e.ts` (a card and an arrow choose with no request; your own added and removed; refused at 1000 V) |
| Colours follow the string, not its rank | `e2e/tests/strings-on-roof.e2e.ts`: a module of S12 is series 6 by string and its MPPT's colour by MPPT; another option keeps a string's colour with its label; `string-colours.test.ts` |
| Three viewports | Every browser test on 390, 834 and 1440, with baselines beside the boards |
| The frame rate (the plan's risk) | By hand on 2026-10-02, headed Chromium on this machine's GPU (Apple M1 Ultra), the sloped roof's 1,068 modules coloured by string: 60.1 frames a second while the pointer sweeps and traces strings, 60.0 while orbiting |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Step 0: one builder | Two, `build_phase7_lens_boards.py` and `build_phase7_state_boards.py` | Two agents drew in parallel |
| Decision 16: the current per MPPT and the AC cable under the inverter card | In a closed row "Inverter limits and cabling" at the end of the inspector | The approved top of the inspector stays as drawn |
| Decision 11: "Below target, 2 inverters" | The inverters named only when more than one; your own "Your own" | "Below target, 1 inverter" says nothing |
| A current whose limit is not known "54.3 A of not known" (the board) | "54.3 A", the mark "Limit not known" and the note under the table | It did not fit the inspector's 344 px |
| Steps 4 and 5, 10 and 11: a commit each | One commit each pair | They share their files |
| Every commit checked | Steps 1 and 2 checked each; the rest checked at the head of each pull request | A check is 15 to 22 minutes; every pull request merged on a green check at its head |
| "Use the model's −0.164 %/°C" (the board) | "Use the module's" | A run with a value entered no longer says the model's |
| The verdict under the bar as the board writes it | The engine's sentence word for word | The engine's words are not reworded |

### Found on the way

- The custom option shared B's key when equal to it, and a custom over the Voc limit was "fits" with a tick. Adding one cost
  5.2 s, the five options simulated again.
- A voltage, a temperature or a choice asked for a new layout too: the strings and the shade map would have left the roof
  for the length of a run.
- PVsyst sizes with its model's Voc by default and lets the user choose a stated muVoc for the sizing ("Temperature
  behaviour correction"); the desktop app does the first. The field of Phase 7 is that choice.
- Each string runs 15 modules out on a row's upper line and 14 back on the lower: one grey position at a string's end. S12
  crosses the stair room's gap; its cable is 93 m (the old board said 63).
- At 1000 V the engine recommends none of its four options: all are below the DC/AC target.
- On tablet the Studio scrolls inside its frame (1,663 px of content in 1,194): a picture of the inspector's end had
  scrolled the roof away (the owner's finding). The pictures grow the window for that.
- Focusing a control scrolls containers whose overflow is hidden: the shade map's phone picture failed one run in four on
  `main`, and the tablet stage was cut in your own's picture; the tests put every scroll back.
- The DXF import's picture was taken before the run had landed, under load; it waits for the run now.
- The full check is 20 to 22 minutes now (1,544 browser tests); with agents running beside it, a camera turn timed out once.

