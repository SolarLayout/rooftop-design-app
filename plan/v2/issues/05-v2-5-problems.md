# V2 · 5 · Problems: one shape, one place, a remedy that is a button, the detail behind Details

Part of the epic **V2** (#207). Board set 5 of the approved V2 design (D101 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 5 of 12. Needs first: #210.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

Every problem the app shows has the same shape (the note mark and a title, the cause, the remedy, a button per remedy, Details) and one place: the result chip for a problem of the result, the step's head for a problem of a step (its likeliest remedy the step's primary), a toast with Undo for what the app did for the user, the dialog for a refused file. A note to review holds its field.

## The board

The canvas page **V2**, row 5: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Problems.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Problems.dc.html), [`V2ProblemsTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2ProblemsTablet.dc.html), [`V2ProblemsPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2ProblemsPhone.dc.html), [`build_v2_problems.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_problems.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 5 · Problems: one shape, one place, a remedy that is a button, the detail behind Details · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Problems.jpg?raw=true)

Tablet: [V2ProblemsTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2ProblemsTablet.jpg?raw=true) · Phone: [V2ProblemsPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2ProblemsPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-16** (P0) · The run fails: When the design run fails the vitals say "Energy was not computed · There are no values yet · Try again"; the Performance page says the same in a card and adds "The server cannot be reached.
- **V2-17** (P0) · The decision card: When no option fits, a card "Change the system voltage, the inverter or the sizing temperatures" stands where the options were, and the vitals' chip says "No string length fits this inverter".
- **V2-18** (P1) · Notes to review: The chip says "1 note to review · Voc coefficient".
- **V2-19** (P1) · "Energy was not updated · Values are of the design before": The stale state uses "before" as an adjective in four places (vitals, notes, Handover, report preview).
- **V2-20** (P1) · Errors that expose the machinery: "Something went wrong in the app: ${what}.
- **V2-21** (P1) · The empty Strings lens: A new design shows "790 positions ready · no strings yet" under the title and the options area blank while the run is on its way; there is no ring or step name on the lens itself.
- **V2-23** (P2) · Refusals of the CSV: The weather CSV's refusals are precise and good, but they are shown in a toast that closes.
- **V2-24** (P2) · "Choose another" toast: When the chosen stringing no longer fits, a toast "The stringing you chose, 29 in series × 22 strings on 1 inverters, no longer fits this design.

## Scope in

1. A `Problem` component (`components/ui`): note mark 18, title (strong), cause and remedy in one paragraph (`text-2`), the buttons, `Details` as a disclosure with the technical text in mono; `role="alert"`.
2. Error words as pure logic (`lib/errors/problem-of.ts`): every error the app or the API gives mapped to title, cause, remedy, action and details; no HTTP, JSON, IndexedDB, WebGL, key, engine or request in the first two lines (voice §5): `Energy not computed · The server could not be reached. Check your connection, then try again. · Try again · Details: 503 …`; `The app could not finish this step. · Try again · Details`; `Address search is not available. Paste coordinates or a maps link.`; `The module library did not load. · Try again · Details: 500`.
3. The result chip's six states (with issue 2's chip): computing, the result, updating (the value dimmed with the ring), `1 to review` with the result, `Energy not computed` (failed, nothing before), `Showing the last result` (failed after a change: the value dimmed). Pressed, a failed or stale chip opens the problem with its remedy.
4. No string length fits (`NoOptionsCard.tsx` and the Strings step): the problem at the step's head, `No string length fits at 600 V · This inverter needs at least 14 modules in a string. At 600 V a string holds at most 11.`, with `Choose another inverter` and `Change the sizing temperatures` as buttons, and the likeliest remedy (`Use 1000 V`, the voltage words of D87/D88: the user's choice, an edit undone in one step) as the step's primary with `Allowed on most commercial roofs. Check the site's code first.`; on other steps the step mark says needs you.
5. Notes to review (`NotesDrawer.tsx`, `notes-view.ts`): `1 to review` on the chip; pressed, the list `Values outside the usual range. Each one says how to fix it.`; each note's title, its usual range, `Enter the datasheet's value.` and the field itself in the note (the Voc coefficient), or `Keep <value>`.
6. The stale state: `Energy not updated · The server could not be reached after <the change>. The result shown is from before the change.` at the step's head where the change was made, with Try again; everywhere else `Showing the last result` (replacing `Values are of the design before`).
7. A choice of stringing that no longer fits (D77): a toast `Your stringing no longer fits. Option A is used.` with `Undo` and `Choose another`.
8. The weather CSV's refusals (`WeatherCsvDialog.tsx`): in the dialog until the file changes: `This file cannot be used · It has 8,000 hours. A year has 8,760. Fill the gaps in the irradiance column, or choose another file.`, the detail behind Details.
9. The Strings step while the strings are sized: the options' skeleton and `Sizing the strings · a few seconds` (replacing `790 positions ready · no strings yet`).

## Scope out

- The demo's module data: changing its Voc coefficient so the demo opens clean (the audit's V2-18 direction) would change the Pune demo's numbers, the parity reference (D64, closed). The demo keeps its note; the note is fixed in place.
- The engine's messages' text in `rooftop_core` beyond mapping them (the vocabulary sweep, issue 11, rewords what reaches the screen).
- Handover's failed state (D93) beyond its words ("Not made: the run failed").

## Where the code is

- `apps/web/components/shell/NoOptionsCard.tsx`, `NotesDrawer.tsx`, `notes-view.ts`, `use-says-choice-gone.ts`, `Vitals.tsx` successor (the chip)
- `apps/web/lib/flow/no-options.ts`, `choice-gone.ts`, `design-flow.ts`; `lib/api` (errors)
- `apps/web/components/studio/StringsInspector.tsx`, `StringOptions.tsx`
- `apps/web/components/performance/WeatherCsvDialog.tsx`
- new `apps/web/lib/errors/problem-of.ts`

## Words

As in Scope in. Voice §5 is the rule; its table of today and V2 is the worklist for these messages.

## Help to keep true

`studio/section/system-voltage.mdx`, `modules-in-series.mdx`, `options.mdx`, `module.mdx` (the Voc note), and any topic that quotes a problem's words.

## Tests, written first

- `problem-of.test.ts`: each known error to its five parts; no machine word in the first two lines.
- The chip's state from the run's state (computing, result, updating, review, failed, stale).
- No-options remedies in order of likelihood, with the voltage rules of D87/D88.
- The note's field and Keep.
- The CSV refusal's words from the API's refusal.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] Stopping the API mid-run: the chip says Energy not computed; pressed, the cause, the remedy, Try again and Details.
- [ ] A design in the United States at 600 V: the Strings step shows the problem at its head and Use 1000 V as its primary.
- [ ] On the demo, 1 to review opens the note with the Voc coefficient field in it.
- [ ] A change that fails after a good run: Showing the last result, the value dimmed.
- [ ] A refused CSV stays in its dialog with the reason and Details.
- [ ] No word of the machine in any problem's first two lines.

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

- Title `V2 · 5 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #212`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
