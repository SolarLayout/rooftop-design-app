# V2 · 12 · The vocabulary: one name per thing on every screen, the strings' inventory as the worklist

Part of the epic **V2** (#207). Board set 12 of the approved V2 design (D108 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 11 of 12. Needs first: #210, #211, #212, #213, #214, #215, #216, #217.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

One name per thing, on every screen and in the API's words that reach the screen: every rename of board 12 applied, the words that never appear gone, the strings' inventory worked through. (Present's words are #220's.)

## The board

The canvas page **V2**, row 12: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Vocabulary.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Vocabulary.dc.html), [`V2VocabularyTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2VocabularyTablet.dc.html), [`V2VocabularyPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2VocabularyPhone.dc.html), [`build_v2_vocabulary.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_vocabulary.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 12 · The vocabulary: one name per thing on every screen, the strings' inventory as the worklist · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2Vocabulary.jpg?raw=true)

Tablet: [V2VocabularyTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2VocabularyTablet.jpg?raw=true) · Phone: [V2VocabularyPhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2VocabularyPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-37** (P0) · The engine's terms as the interface's words: Parapet, Setback, Albedo, Every (mod), Walkway, Clearance; GCR, profile angle, azimuth, row pitch; Voc, Vmp, Isc, Imp, MPPT, Voc cold, cell rise, Voc coefficient, one-diode model, open rack; PAN, OND, DC/AC, PR, kWh/kWp, P50/P90, σ, IAM, LID, STC, ohmic, in-plane, transposition, clipping, horizon, GHI, beam, diffuse, UTC, TMY; INV-1, ACDB, LT panel, SLD, R2010, KMZ/KML/DXF, .rtd, placemark, polyline, WebGL, IndexedDB, HTTP.
- **V2-38** (P0) · One thing, several names: By hand is "Enter dimensions by hand", "Enter the roof by hand", "Enter dimensions by hand instead", "Entered by hand", "By hand".
- **V2-39** (P1) · Sentences where a label does: "Boxed values are yours to change"; "Capacity and energy come with the run in the Studio"; "Designs you save appear here.
- **V2-40** (P1) · Flowery, dramatic or cute: "The map flies to it"; "The search understands"; "The roof rises in the Studio; the array fills it at once"; "From sunlight to the grid"; "On its way"; "The sun's day is on its way"; "A step too far"; Present's captions (those are #220's); Find's "Find the building first: the map flies to it, close enough to outline its roof."
- **V2-41** (P1) · "The engine": "The engine's shadows", "summed up by the engine", "The PNG is the engine's drawing on A4", "as the engine lists it", "in the engine's order", "It decides how the engine lays out the rows", "as the engine's sun has none".
- **V2-42** (P1) · Tautology and restatement: "Energy was not computed · There are no values yet"; "The files were not made · There are no files yet"; "The pages were not made · There is no preview yet"; "Nothing to review · Every check of the design fits."; "No string length fits this inverter · No string length fits: at least 14 modules are needed …"; "Not made · the run failed" under a heading that says the run failed.
- **V2-43** (P1) · Instructions that narrate the mechanism: "Its height is asked right after." (four tools); "The drawing does not say where the roof is.
- **V2-44** (P1) · Passive, impersonal verbs: "is asked", "is taken", "is read", "is kept", "were set", "is drawn", "is proposed", "are averaged" throughout.
- **V2-45** (P1) · The import dialog's intro: Five sentences, 70 words, on how a KMZ, KML and DXF are read, before the drop zone.
- **V2-46** (P2) · Abbreviations with "(s)": "1 inverter(s)", "1 hour(s) is/are there more than once", "position(s)".
- **V2-47** (P2) · The number as a word: "Three at least", "Two at least", "the first of them", "six of them".
- **V2-48** (P2) · "the design before", "the hour's start", "what stands on it", "the thing on the roof": Direction: plain nouns: "the last result", "start of the hour", "obstacles".
- **V2-49** (P2) · Mixed register in one screen: Handover: "Everything the installer, the client and the utility need" (a tagline) above "A4 landscape · 6 pages" (a spec).
- **V2-51** (P2) · Units as labels: "mod", "W/m²K", "%/°C", "t/MWh", "kWh/kWp" stand beside fields with no word.
- **V2-52** (P2) · Help summaries that start with "The": Every topic's summary is a noun phrase with a trailing clause ("The parapet, the setback from the edges, the walkways, the clearance around obstacles and the roof's albedo.").
- **V2-53** (P3) · "mod" and "h" as abbreviations: in obstacle rows ("5.0 × 4.0 · h 3.0 m").
- **V2-54** (P3) · The middle dot as the universal joiner: "29 × 22 · 357.28 · 1.30"; "Metres · one layer per string"; "Not made · the run failed".
- **V2-99** (P1) · The screen reader's lines narrate the engine: ("The engine's shadow outlines at 10:30: 4 polygons"; "The strings follow the design run").

## Scope in

1. Every row of board 12 (and `plan/v2/voice.md` §6) applied wherever the thing appears, in `apps/web` and in the API's user-facing sentences (`apps/api/src/rooftop_api`, and `rooftop_core`'s sentences that reach the screen).
2. The worklist: `plan/v2/strings-inventory.md`, every string with its file and line; each one either changed to the voice or marked as already right; the inventory updated as the record.
3. The words that never appear (§6) gone: a test scans the user-facing strings for them.
4. Sentences where a label does (V2-39), flowery or dramatic words (V2-40; Present's captions are #220's, built with Present), "the engine" (V2-41), tautology (V2-42), narration of the mechanism (V2-43), passive verbs with an agent (V2-44), the import dialog's intro (V2-45: the drop zone first, what is read as a summary of the file), "(s)" (V2-46), numbers as words (V2-47), units as labels (V2-51), the middle dot between a fact and a sentence (V2-54).
5. The screen reader's lines (V2-99): the same words as the sighted user's.
6. Sentence case everywhere; the trade's abbreviations keep theirs.

## Scope out

- The help's topics (issue 12, #219, next, in these words).
- Present's words (#220).
- The docs site (another repository; it takes the voice when V2 lands).
- Numbers and the engine's behaviour.

## Where the code is

- All of `apps/web` that holds user-facing strings (the inventory lists them by file and line)
- `apps/api/src/rooftop_api/*` (refusals, errors), `apps/api/src/rooftop_core` (sentences that reach the screen: notes, verdicts, captions)
- `plan/v2/strings-inventory.md`

## Words

The board and §6 are the rule; §10's checklist is answered in the pull request.

## Help to keep true

The help is rewritten in issue 12 (#219) right after; here, only topics whose quoted control names change are fixed so the gate passes.

## Tests, written first

- A test that scans the web app's user-facing strings (and the API's messages) for the never-words, "(s)", and the old names of board 12.
- The API's parity snapshots: a change of words, not of numbers (D64); a snapshot that changes words is renewed with the reason.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] Searching the app for each old name of board 12 finds none on screen.
- [ ] No never-word, no "(s)", no "engine" on any screen.
- [ ] The inventory records every string's state.

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

- Title `V2 · 12 · <what it does>` (the board's number, as this issue's title); body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #218`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md) · [`plan/v2/strings-inventory.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/strings-inventory.md)
