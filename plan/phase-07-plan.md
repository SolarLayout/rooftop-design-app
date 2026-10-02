# Phase 7: plan

Written 2026-10-02 by session 11, before anything of the phase is built, as the work order asks
(`plan/resume/010-phase-7-studio-strings.md`). Scope and acceptance: `plan/phase-07-studio-strings.md`. This file says
how the phase is built, in which order, what is decided unless the owner says otherwise, what was found in the code and
the API, what needs the owner, and what done means.

## What was found at the start of the session

- `main` is clean at `2a8c59a` and matches `plan/STATE.md`: no open pull request, no stack running, no local branch.
  `bun check` on `main`: green, every step skipped from the cache. Twenty merged branches are still on `origin`; they
  are left alone.
- **The Artifact tool is not available in this session** (Bedrock). The canvas cannot be read or published from here:
  the boards are shown from the previews in the repo, as in sessions 9 and 10.
- **`/design` already answers nearly everything the lens shows.** Probed on the demo with `rooftop_api` (scratchpad):
  - `series_range`: 14 to 29, nominal 26, `upper_limit` "Voc limit", Voc cold 51.04 V a module, the limit note "Limit
    1500 V: the lowest of the system, module (1500 V) and inverter (1500 V) ratings."
  - `options`: A to E exactly as `demo-numbers.md` (29×22×1 recommended, 617.8 MWh; D and E "below target"), each with
    its `verdict` in the desktop's words, `system.strings` (22 for A, labelled S1 to S22 in order along the roof, each
    with its modules by layout idx in wired order, `inverter`, `mppt`, `shade_pct`), `system.inverters` (A: INV-1 at
    (31.04, 39.0), on the north edge inside the setback), `mppt_loads` (A: 4, 4, 4, 4, 3, 3 strings, Imp 54.3 of 65.0 A),
    `cable_schedule` (Voc cold and the metres of cable of every string) and `bom` (the AC cable 30 m per inverter).
    152 positions are not used by A.
  - `options_note` with the target, the strings per MPPT and the options that miss it; `sizing` with the temperatures,
    where each comes from, and the cell rise by roof type (25 °C on the flat roof).
  - At 1000 V: range 14 to 19, options 18×42×2, 19×37×2, 19×24×1, 18×24×1 (the acceptance's 19). At 600 V:
    `no_options` "No string length fits this inverter", "No string length fits: at least 14 modules are needed for the
    500 V MPPT minimum, but at most 11 fit under 600 V." Without a voltage: `system_voltage_missing`, nothing chosen.
- **Choosing an option needs no run.** `chosen_option` is not in the memo's key of the options: a run with another
  option chosen takes 0.2 s and answers the same options. Every option already carries its full results. The flow today
  runs the design after every committed edit (`design-flow.ts`, `follow`), and asks the layout too.
- **A voltage, a temperature, the custom option or the current per MPPT asks the layout as well**, which does not
  depend on them. The new layout's edit is newer than the run's, so the shade map, and strings drawn the same way,
  would vanish for the 3 to 4 s of the run.
- **The custom option has two faults in the engine.**
  1. Its key is `n×s×k` like the others: a custom of 26×24×1 is a second "26x24x1" beside B, and `chosen_option` by key
     finds B.
  2. Its series length is not checked against the range: 35×10×1 at 1500 V (Voc cold 1,786 V over the 1500 V limit)
     gets the verdict "35 in series fits: Vmp 1,448 V at STC" with a tick when its DC/AC is in target.
  Also: strings asked beyond what the roof holds are cut to what fits without a word (20×500×1 becomes 20×37×1), and 37
  strings on an inverter that takes 24 put 7 on each MPPT, 95 A over a limit of 65 A, while the verdict speaks of DC/AC
  alone.
- **A custom option costs 4.5 s**, against 3 s for a change of voltage: `custom` is in the memo's key of the options, so
  the five options are simulated again with it.
- **No field holds a Voc coefficient.** The strings are sized with the Voc of the one-diode model at the lowest ambient
  (`mm.voc`); the coefficient shown (`Coefficients`) is the PAN's when it states one, else the model's. The demo's PAN
  states none: the model gives −0.164 %/°C and the note "Voc coefficient −0.164 %/°C is outside the usual −0.35 to
  −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs." is the demo's one note.
- **The cell rise, the temperatures, the current per MPPT and the AC cable are in the document already**
  (`cell_rise_c`, `t_min_override`, `t_max_override`, `imax_mppt_override`, `ac_cable_m`, metres per inverter in the
  BOM). Nothing of the API is missing for them; the lens has no field yet.
- **An OND without a current limit**: `tests/fixtures/equipment/sungrow-sg3300ud-20.OND` (3.3 MW, 3 MPPT, no IMaxDC):
  `max_current_per_mppt` "not in the OND", every MPPT load `imp_limit_a` null and `ok` false, and the options note asks
  for the datasheet value. A central inverter on this roof makes eight of them; the demo's OND with its IMaxDC taken out
  makes the same options as the demo with every limit unknown, a better example.
- **`/equipment/inverter` exists** and answers the inverter, its current per MPPT with the source and the note, and the
  text to embed (`ond_text`). The web app does not call it yet (`parseInverter` is in the client).
- **The glass takes a colour per instance** (`Modules.tsx`, `glassColoursOf`), written apart from the matrices, and the
  shade map is shown only while the run is of the layout shown (`shadeMapOf`). Colour by string, MPPT or inverter is the
  same road with another colour per position. The callout of a module in the shade map already finds its string.
- **The approved Strings board** (`StringsLens.dc.html`) draws the inspector: the inverter card with Replace, System
  voltage with "Your choice", Modules in series with the bar and the verdict, Options A to E and "Add your own", a closed
  row "Sizing temperatures 11.9 to 39.3 °C". The stage colours by MPPT with the switch String, MPPT, Inverter and the
  legend, a string's callout ("String 12 · INV-1, MPPT 3", "29 modules · Voc cold 1,480 V · 63 m of cable") and the
  marker INV-1. Its strings are drawn by hand, and it has no time pill, which every lens's stage has since Phase 6. No
  board draws the lens on tablet or phone, the custom option, "No string length fits", the MPPT table, the inverter
  replaced, the current per MPPT, the cell rise, the Voc coefficient or the AC cable.
- **The demo's document holds 1500 V** (`rooftop_core/demo.py`), as the desktop's demo did: it is a design whose
  voltage was chosen. A roof built on the map or by hand has none. `guidelines.md` says "Do not preselect the system
  voltage, in any state, demo included": the app never fills one in; the demo shows the one its document holds.

## How the work goes

- **Step 0, the boards**, drawn and approved before anything is built (below). Then **five pull requests**, split where
  nothing of the earlier depends on the later; each builds its screens on three sizes and carries its pictures beside
  the boards:
  1. `feat/phase-7-voltage`: the lens's inspector in place of "Not built yet"; the decision card before a voltage and the
     voltage after; the flow asks only the run for an electrical edit; the series range bar, the verdict and the limit
     note; "No string length fits"; the sizing temperatures, the cell rise and the Voc coefficient (the API's new
     field); the line under the title. Steps 1 to 6.
  2. `feat/phase-7-options`: the custom option's faults fixed in the engine, the strings that fit per length, the custom
     simulated apart; an option chosen without a run; the option cards; Add your own, replace, remove. Steps 7 to 11.
  3. `feat/phase-7-strings-on-roof`: the glass by string, MPPT or inverter, positions not used, the legend, the inverter
     markers, a string traced and selected, the text equivalent. Steps 12 to 16.
  4. `feat/phase-7-inverter`: the inverter replaced from an OND; the current per MPPT; the AC cable per inverter; the
     MPPT table with its limits; the verdict that counts the MPPT loads. Steps 17 to 20.
  5. `feat/phase-7-states`: a run on its way, a run failed, a layout newer than the run, too few positions, no
     positions, a choice made while a run is on its way; the phone's sheet looked at again; the frame rate; the close.
     Steps 21 to 24.
- Every step is one commit (two when a token is new: the document first). A draft pull request after its first step,
  merged after its last, on a green check. `bun check` green before every commit, gated on its exit code.
- Test first, seen failing. Logic is a pure function or a store without React, tested with `bun test`; the engine and
  the API with pytest; what is seen with Playwright on 390, 834 and 1440, with baselines. Numbers in browser tests are
  read from the run's answer, never written into the test; the acceptance's numbers are compared with
  `demo-numbers.md` once, in pytest.
- Agents build in worktrees under `$TMPDIR` with written briefs, independent parts in parallel (the engine's steps of
  pull request 2 beside the web's of pull request 1; the strings' colours beside the inverter's dialog); every result is
  reviewed and run before it is merged. The session runs the browser for them (the permission system refuses agents the
  test stack). Baselines with the imagery are made in the main working tree.
- `plan/STATE.md` is brought up to date on `main` after each pull request, from a worktree when a branch is open.

## Step 0: the boards

Drawn with two builders, `docs/design/mockups/build_phase7_lens_boards.py` and `build_phase7_state_boards.py`, from the helpers and the projection of Phase 5's
and 6's builders; the strings, the inverters, the MPPT loads and the figures from the engine's answer for the demo,
kept in `mockups/strings_lens_data.json`, so that the boards can be written again without the engine. Rendered as
before, listed in `docs/design/README.md`. Approval before step 1.

| Board | What it draws |
|---|---|
| **Studio, Strings lens** (replaces `StringsLens.dc.html`; the inspector as approved) | Desktop at 1500 V, option A chosen, coloured by MPPT: the engine's 22 strings, the 152 positions not used in `moduleUnused`, INV-1 where the engine places it, the time pill (Phase 6); the inspector of the approved board, with the MPPT table and the AC cable under the options (decisions 16, 17) |
| **Studio, Strings lens, tablet and phone** | Tablet: the stage of 508, the colour switch and legend at its bottom, the inspector in two columns under the vitals. Phone: the stage of 252 with the time at its top, the colour switch in the sheet, the inspector as rows |
| **Strings on the roof** (desktop in parts) | The engine's strings of A coloured by string, by MPPT and by inverter (D's two inverters for the last), each with its legend; a string traced under the pointer and a string selected (white, decision 13) with its callout; the inverter markers; the plan view |
| **Options and your own** (desktop, phone in parts) | Add your own open (series, strings, inverters, bounded by what fits, decision 9); your own chosen among A to E; your own refused at 1000 V in the engine's words with Change and Remove; "No string length fits" at 600 V: the bar without a band, the verdict, no options, what can change it |
| **Inverter and sizing** (desktop, phone in parts) | The MPPT table of A, and with the limit not known (the demo's OND without IMaxDC); Replace the inverter: the dialog, a file refused, the card after; the current per MPPT entered; the sizing temperatures open with the cell rise; the Voc coefficient's note and the value entered, the range moving from 29 to 28 |

Two agents draw them in parallel (the first two boards; the last three), from a brief that names the helpers, the
tokens, the data file and the engine's words. Every number is the engine's for the demo.

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 1 | What an edit changes | `lib/flow/edit-parts.ts`: a pure function of the document before and after: whether the layout is asked (the roof, the array, the module changed), whether the run is (anything but the chosen option), or nothing (the chosen option alone) (decision 2). `design-flow.ts` follows it | `edit-parts.test.ts`: each field of `Project` in its part; `design-flow.test.ts`: a voltage asks the run and not the layout; a roof type both; a choice neither; undo of a choice neither | |
| 2 | The Voc coefficient in the API | `Project.voc_coefficient_pct` (−1 to 0, null for none) in the API and the engine; when entered, Voc at the lowest ambient is Voc at STC × (1 + μ × (t_min − 25)), the coefficient's source "entered", no note on it; in the memo's key; `bun gen:api` (decision 6) | pytest: the demo with −0.29: Voc cold 51.84 V, the range 14 to 28; without: 51.04 and 29, unchanged; the note gone when entered; a `.rtd` of format 1 opens without it | |
| 3 | The lens's inspector and the voltage | `StringsInspector.tsx` in place of `NotBuiltYet`. Before a voltage: the decision card (components.md) with the three choices of 52, the limit's line in the API's words, Waiting for your choice and Already done (the board). After: the inverter card (step 17 makes Replace work), System voltage as a segmented control with "Your choice". A choice commits `system_voltage` (decision 1) | `strings-view.test.ts`: the lists of what waits and what is done from the results; no voltage, no choice shown | A new design built by hand: no voltage chosen, the vitals and the Sun lens without energy; 1500 V pressed: the run is asked once, after the pause, with no `/layout` |
| 4 | The series range and the verdict | `SeriesRange.tsx`: the bar of components.md (track, band from n_min to n_max, the chosen option's length as the marker, the ends' labels with what sets them, "14 to 29 fit"), the verdict with a tick or a note and the engine's sentence, the limit note | `series-range.test.ts`: the band and the marker as shares of the track; the labels ("29 · Voc limit", "19 · MPPT max") | At 1000 V the band ends at the run's `n_max` (19 on the demo), read from the answer |
| 5 | No string length fits | The bar without a band, the verdict with its note in the engine's words, no options, a line of what can change it (the voltage, the inverter, the temperatures), as the board draws it | `strings-view.test.ts`: the state from `no_options.code` | The demo at 600 V: the engine's sentence, no option, the vitals say it (D37) |
| 6 | The sizing; close of pull request 1 | Sizing temperatures (closed row, opened in place): Lowest and Highest ambient, empty for the weather's with "from the weather" and its value, a value entered with "Use the weather's"; Cell rise with its default "by roof type"; the Voc coefficient with the model's or the PAN's value, the note, the field (decisions 6, 7). The line under the title (decision 14). Baselines | `sizing-fields.test.ts`: the fields from `Sizing` and the document, the ranges of the inventory, empty back to null | Entering −0.29 moves the range's end to the run's new `n_max`; the note leaves the vitals |
| 7 | The custom option in the engine | The custom option's key is `custom`; one whose series length is outside the range, or with fewer strings than inverters, is not simulated: `DesignResult.custom_refused` says why in words (decision 8). `DesignResult.strings_by_series`: how many strings of each length in the range the roof holds. `bun gen:api` | pytest: a custom equal to B is a sixth option with the key `custom`; 35×10×1 at 1500 V refused with "35 in series does not fit…"; 29×22×1 kept after the voltage goes to 1000 V refused; the strings per length (A's 29: 23) | |
| 8 | The custom simulated apart | The memo keeps the options without the custom and the custom by its own key: adding, changing or removing it simulates it alone (decision 10) | pytest: the same answers with and without the memo; a second custom simulates one option (counted); the time measured before and after, written in "As built" | |
| 9 | An option chosen without a run | `chosenOptionOf` takes the document's `chosen_option` when the run has it, else the run's; the vitals, the notes, the shade map's callout read it. A press on a card commits `chosen_option`; nothing is asked (decision 3) | `results-store.test.ts`, `vitals-view.test.ts`: the document's choice wins when the run has it; a run without it falls back; `design-flow.test.ts`: no request | A card pressed: the vitals show its energy at once, no request to `/api/design` (counted by a route) |
| 10 | The option cards | `OptionCard.tsx` (components.md): the letter, the caption (decision 11), "29 × 22 · 357.28 · 1.30", the energy, the mark of the verdict; selected as the selected card; the options note under them | `option-caption.test.ts` or the engine's (decision 11): A Recommended, B Fills the inverter, C Lower clipping, D and E "Below target, 2 inverters" | Five cards with the run's numbers; a press selects; keys (a radio group) |
| 11 | Your own; close of pull request 2 | Add your own opens three fields (series, strings, inverters), prefilled with the chosen option, bounded by the range and `strings_by_series`; Add commits `custom` and chooses it; the card of your own has Change and Remove; refused, the card says the engine's words (decision 9). Baselines | `custom-fields.test.ts`: the bounds, the prefill, the edit of the document (add, replace, remove; removing the chosen one chooses the run's first) | Add 26 × 24 × 1: a sixth card, chosen, its numbers the run's; Remove: back to five; 1000 V with your own of 29: the card refused in the engine's words |
| 12 | The series colours in the scene | `design-tokens.md` first: the palette's `series1` to `series6`, equal to `--color-series-1` to `-6`, and `stringSelected` (white) and `inverterMarker` (decision 13); `scene-palette.ts`, held equal by the tests | The tests of the tokens and the palette | |
| 13 | The strings' colours | `lib/scene/string-colours.ts`: the colour of every position by string (`S12` takes the series colour of 12 in the fixed order, decision 12), by MPPT or by inverter, `moduleUnused` for what the option does not use; `glassColoursOf` takes a colour per position from the shade map or from the strings; only while the run is of the layout shown. The Strings lens's colour switch in the view store, MPPT first (the board) | `string-colours.test.ts`: S1 and S7 the same colour, S1 and S2 not; the colour of a string the same whatever its rank among the least shaded; MPPT 3 of INV-2 the colour of MPPT 3; the 152 unused grey; none for a run of another layout | The colour of a module of S12 read at its centre is the series colour of 12; switching the option keeps a string's colour with its label; `data-module-writes` unchanged by the switch |
| 14 | The legend and the markers | `StringLegend.tsx` on the stage with the switch String, MPPT, Inverter (the board); the inverter markers at the engine's `InverterPlace` as DOM by the Projector, with a small box in `inverterMarker` on the roof | `string-legend.test.ts`: the legend's entries by colouring (by string: the colours in turn and "Not used") | The marker INV-1 stands where the engine's position projects; D's two |
| 15 | A string traced and selected | Under the pointer (pointer devices) a string is traced: its glass white, the rest dimmed, a line through its modules in wired order; a press selects it, with the callout "String 12 · INV-1, MPPT 3", "29 modules · Voc cold 1,480 V · 63 m of cable" from the cable schedule; on touch a tap selects (decision 13). The hover reads the instance under the pointer at most once a frame | `pick.test.ts`: the string of a position, the callout's words; `string-colours.test.ts`: the traced colours | Hover a module: its string white (pixels), the callout on press with the run's numbers; a tap on phone |
| 16 | The text equivalent; close of pull request 3 | "On the roof" says the strings, what they are coloured by with each colour's count, the unused positions, the inverters and the string selected. Baselines | `stage-view.test.ts`: the words | The words equal the run's counts |
| 17 | Replace the inverter | `ReplaceInverterDialog.tsx` as the module's: an OND read by `/equipment/inverter`; Replace commits `ond_text`, `ond_path` and clears `imax_mppt_override` (inventory 1.4); a refused file leaves the inverter of before with the engine's words (D32); the card shows the file read until the run with it lands. The names as the file states them (decision 15) | `inverter-card.test.ts`: the card's lines from the run and from a file read; the edit of the document | A file of the fixtures replaces the inverter; a PAN given as OND is refused in the engine's words |
| 18 | The current per MPPT and the AC cable | In the row "Inverter limits and cabling": Current per MPPT with its source and the API's note, a value entered (`imax_mppt_override`) with "Use the file's"; AC cable per inverter in metres (`ac_cable_m`, 1 to 2000) (decision 16) | `inverter-fields.test.ts`: the field from `max_current_per_mppt` and the document | Entering 60 A changes the strings per MPPT in the options note, read from the run |
| 19 | The MPPT table | `MpptTable.tsx` with `Table`: inverter and MPPT, strings, Imp of its limit, Isc of its limit, kWp, the mark; a limit not known says so and leads to the current per MPPT; phone as cards (decision 17) | `mppt-table.test.ts`: the rows of A; the rows with no limit | The rows equal the run's `mppt_loads`; the demo's OND without IMaxDC (a fixture): every row a note |
| 20 | The verdict counts the MPPT loads; close of pull request 4 | `readouts.verdict`: an option with an MPPT over its limit is not ok and says which; with a limit not known it says so (decision 18). Baselines | pytest: A unchanged; the custom 20×37×1 not ok with the MPPTs named; the OND without IMaxDC | The card of such an option has a note |
| 21 | The states | A run on its way: the options, the bar and the table dimmed with the ring, the strings of before drawn; a run failed: the values of before and the notes; a layout newer than the run: the modules plain and the legend says the strings follow the run; too few positions and no positions: the API's words in the inspector (the board); a choice made while a run is on its way holds when it lands | `strings-view.test.ts`, `string-colours.test.ts`: each state | Each state on three sizes, held back by a route where it needs a request on its way |
| 22 | The phone | The sheet's rows and the stage's top on phone looked at again with the switch and the legend; the callout of a string under the time | `projection.test.ts` | The phone's pictures with a string selected |
| 23 | The frame rate | Played by hand with 1,068 modules on the sloped roof coloured by string, a string traced under a moving pointer; measured as in Phase 6 | | |
| 24 | Close of pull request 5 | Baselines; "As built" with the deviations and what was found; the status; the state | | |
| C | Close | "As built" in the phase file, status in `README.md`, `STATE.md`, the record of session 11, resume 010 set to used | | |

## Decisions I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | The voltage is chosen with three buttons of the decision card while there is none, then with a segmented control of three that says "Your choice". Nothing is ever filled in: a new design has none, the demo has the 1500 V its document holds. A choice commits `system_voltage` and runs the design after the pause; it cannot be taken back to none | D10, rule 3; the approved boards draw both; the demo is a design whose voltage was chosen |
| 2 | The flow asks the layout only when the roof, the array or the module changed, and the run for anything but the chosen option; the chosen option alone asks nothing | The layout depends on those three alone; a newer layout would take the strings and the shade map off the roof for the length of a run |
| 3 | An option is chosen by committing `chosen_option`, so it is in the document (`.rtd`, undo and redo), and shown from the run's answer at once: the option is the document's when the run has it, else the run's. No request | The phase file: "Selecting one is instant (results are already in the response)"; the desktop did the same |
| 4 | Before a voltage nothing of energy is shown anywhere: the vitals as D37, the Sun lens's electrical figure waiting, the options and the strings absent. Tested on a design built by hand, which has no voltage | The acceptance; the demo has one |
| 5 | The series range bar's marker is the chosen option's series length; before an option, none. The band is n_min to n_max; the labels say what sets each end (`upper_limit` of the API) | components.md, "Series range bar"; the board |
| 6 | The Voc coefficient is a field of the document, `voc_coefficient_pct`, entered in %/°C. Entered, it sizes the strings: Voc at the lowest ambient = Voc at STC × (1 + μ/100 × (t_min − 25)), the datasheet's way (the handbook, chapter 19, "The cold limit", Equation string-cold, after IEC 62548-1:2023 Annex F and the IFC's guide); Vmp and the energy stay the model's. Entered, the note on it goes, and the field says "entered". Without it the strings are sized with the one-diode model's Voc, as the desktop app does (`stringing.py`, `series_range`) and as PVsyst does by default, also when the PAN states a coefficient: PVsyst's help ("Temperature behaviour correction") says the model cannot reproduce a stated muVoc and muPmax at once, that the model "sometimes results in higher Voc(Tmin) than design software using the specified muVoc", and that "you can choose to use this value instead of the PVsyst value during your design". The field is that choice; the demo's numbers stay | The desktop asked for the value and had no field (inventory, gap 2); the user's datasheet value must change what it is asked for; the default is the desktop's and PVsyst's, so nothing is relitigated |
| 7 | The sizing temperatures and the cell rise are fields that are empty for the default (the weather's, the roof type's), show the default beside them, and keep a value entered even when it equals the default; "Use the weather's" sets them back to none. Ranges of the inventory: −50 to 40, 0 to 60, 0 to 60 | Inventory 1.5 and gap 4: a value equal to the default could not be pinned |
| 8 | The custom option's key is `custom` (there is one at most), so choosing it, changing it and the key of B never mix. A custom whose series length is outside the range (also after the voltage changed) or with fewer strings than inverters is not simulated: the API says why in words in `custom_refused`, and the card of your own shows it with a note, Change and Remove. No energy is shown for what cannot be built | The two faults found; an energy of a string over the Voc limit would be a wrong claim |
| 9 | Add your own opens three fields prefilled with the chosen option's numbers, bounded by the range (series), by what the roof holds of that length (`strings_by_series`) and by at least one string per inverter; Add chooses it. Change opens the same fields; Remove takes it out of the document, and the run's first option is chosen if it was | The inventory's 26, 24, 1 are the desktop's defaults; the chosen option is where a user starts from |
| 10 | The memo keeps the five options apart from the custom option: adding, changing or removing it simulates it alone | 4.5 s now for one option more; the answers stay the same (D6) |
| 11 | The options' captions come from the engine, in readouts beside the verdict: "Recommended"; for an option outside the target its note, and its inverters when there are more than one ("Below target, 2 inverters"); for one in target "Fills the inverter" when it takes all the strings its inverters take, "Lower clipping" when its clipping is below the recommended one's; the custom option "Your own"; else none. The web writes no caption of its own | The open item: the board's captions are not the engine's. The web app writes no rule of the engine a second time (notes-view.ts) |
| 12 | A string's colour is the series colour of its number (S1 the first, S7 the first again, in the fixed order of six), so its colour follows the string and never its rank among the least shaded; by MPPT the colour of its MPPT within its inverter, by inverter the inverter's. Positions not used are `moduleUnused`. The colouring is the Strings lens's, MPPT at first, as the board; leaving the lens takes it off | The phase's acceptance; guidelines.md "Categories ... keep their colour"; the engine numbers strings along the roof, so neighbours differ |
| 13 | A string under the pointer is traced: its glass white (`stringSelected`, design-tokens.md: "A selected string is white"), the others dimmed, a line through its modules in the order they are wired. A press selects it and the callout says its string, inverter and MPPT, its modules, its Voc cold and its metres of cable from the cable schedule. On touch a tap selects. The inverter is a small box on the roof in a new `inverterMarker` and a label "INV-1" placed by the Projector | The phase file; the board's callout; labels on the stage are few (guidelines.md) |
| 14 | The line under the title: "22 strings of 29 modules · 1 inverter, 6 MPPT · 152 positions not used"; before a voltage "790 positions ready · no strings yet"; when no length fits "790 positions ready · no string length fits" | The approved boards' lines |
| 15 | The inverter card shows the names as the OND states them ("WP-330KTL-H1", "WattPower Systems Pvt.Ltd · 275 kW · 6 MPPT"), as the module card does (Phase 5, decision 14) | D24 and the open item: the files' names, until the owner gives others |
| 16 | The current per MPPT and the AC cable per inverter stand in a closed row "Inverter limits and cabling" at the end of the inspector, as "Sizing temperatures" does, so that the approved top stays as drawn: the current with its source and the API's note, a value entered with "Use the file's"; a new OND clears the value entered. The AC cable in metres, 30 from the document | Both are the inverter's; inventory 1.4 and 1.5 |
| 17 | The MPPT table stands under the options, for the chosen option: a row per MPPT that has strings, Imp and Isc each against its limit, kWp and the mark; a limit not known is "not known" with a note that leads to the current per MPPT. On phone the rows are cards (`Table`) | Inventory 2.5; the table component of the kit |
| 18 | The verdict of an option counts its MPPT loads: over a limit it is not ok and names the MPPTs; with a limit not known it says to enter the current per MPPT. The option card's mark is the verdict's; the DC/AC mark of the vitals stays the DC/AC's | A custom of 37 strings on one inverter was a tick with 95 A on a limit of 65 A |

## What was found in the code and the API, for the steps

| Step | Fact |
|---|---|
| 1 | `follow` asks the layout, the sun, the shadows and the run for every edit; `results.layout.edit` newer than `design.edit` takes the shade map off (`shadeMapOf`) |
| 2 | `ModuleModel.coefficients` takes the PAN's `mu_voc_mv` when it has one; `series_range` takes `mm.voc(1000, t_min)` whatever the coefficient; `options_key` lists the voltage, the temperatures, the cell rise and the custom |
| 3 | `Studio.tsx` chooses the inspector by the lens; `NotBuiltYet` stands for the Strings lens. `vitalsOf` leads the note of `no_options` to `pathOfLens("strings")` |
| 7 | `custom_option` cuts the strings to what is ranked and takes the letter after the others; `DesignResult.chosen_option` is the engine's key; `services/design.result` clears the chosen option without a voltage |
| 9 | `chosenOptionOf` (results store) and `chosenOf` (vitals) read `design.chosen_option`; `noteOfTheOption` (notes) the same |
| 13 | `glassColoursOf(positions, steps)` gives the blue or a step's colour; `useShadeMapShown` is keyed on the view's tab; the palette's test reads names with figures since #50 |
| 15 | `Modules` hears `onPointerOver` per mesh, not per module; `onPressModule` gets the instance; `calloutOfModule` and `shadeCalloutOf` (pick, shade map) word a module |
| 17 | `ReplaceModuleDialog` and `moduleShownOf` are the pattern; `Project.ond_text`, `ond_path`; `CurrentPerMppt` of the API is the file's, whatever was entered |
| 19 | `Table` takes columns of a name, a text or a number and gives cards on phone (`table-cells.ts`) |

## What needs the owner

| What | When | Blocks |
|---|---|---|
| A yes or no to each decision above | Before step 0 | Everything |
| The five boards of step 0 | Before step 1 | Pull request 1 |

## Risks

| Risk | What I do |
|---|---|
| A change of the engine moves the demo's numbers | The demo's numbers test (`test_demo_numbers.py`) runs in every pytest run; every engine change is tested with the demo unchanged and with the case it is for |
| The custom's key `custom` is not what a desktop `.rtd` of a custom option holds | Such a file opens with the run's first option chosen and its custom kept; said in "As built" |
| Tracing under the pointer raycasts 1,068 instances per move | At most one raycast a frame, only in the Strings lens; measured in step 23 against the 56 fps of the orbit |
| Six colours on 22 strings repeat: two strings of one colour may meet across rows | The engine numbers strings along each row, so neighbours in a row differ; the legend and the trace tell them apart; the board shows it |
| The browser tests are 814 s; more pictures on three sizes | One baseline per new state; the rest read text and pixels from the run's answer |
| A run of 3 to 4 s after a voltage or a temperature | The strings of before stay drawn and dimmed (step 21); the layout is not asked again (decision 2) |
| Changes of the API's models in two pull requests | `bun gen:api` and `packages/api-types` in the same commit as each change |
| The phase is five pull requests and step 0, more than one session | The state is written after each pull request; each session ends at a merge |

## Done means

The acceptance of `plan/phase-07-studio-strings.md`, point by point:

- The demo at 1500 V reproduces the five options of `demo-numbers.md` (pytest, as today, and the cards in the browser
  equal the run's answer); at 1000 V the longest string is 19 (pytest and the bar in the browser, read from the answer).
- With no voltage chosen nothing is preselected and no energy is shown anywhere: a design built by hand, in the Strings
  lens, the vitals and the Sun lens (step 3).
- Playwright: choose a voltage (step 3), switch the option (step 9), add your own (step 11); the colours follow the
  string, not its rank (step 13); three viewports (every step), baselines beside the boards.

And beyond it: the boards of step 0 approved and in the repo; the custom option's faults fixed; the Voc coefficient's
field; the MPPT table and the current per MPPT; the inverter replaced from an OND; "As built" written.
