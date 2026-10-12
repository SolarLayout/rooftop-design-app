# V2 · UX audit of SolarLayout Rooftop

The first deliverable of the V2 project (`plan/v2/README.md`). The whole app was walked and read, screen by screen, at
desktop 1440 × 900, tablet 834 × 1194 and phone 390 × 844, on the test stack at `main` dc34cf4 (2026-10-12): Home, Find
in every state, the by-hand path, the four lenses of the Studio with their pickers, menus and help, Performance,
Handover's eight items, Present, a run that failed, and Home with designs on the device. Beside the walk, every
user-facing string of the web app and the API was inventoried and read against the bar set for V2. The measurements
quoted (what is in view, what scrolls) are from the walk's own script.

The second deliverable, the voice, is `plan/v2/voice.md`. Every language issue below points to a rule there.

## How to read it

**Priority**

| Level | Meaning |
|---|---|
| P0 | Stops or misleads a new user on the main path. Fix first. |
| P1 | Confuses most new users or hides the next step. Fix in V2's first release. |
| P2 | Friction for everyone; the user recovers. |
| P3 | Polish. |

**Categories** A to K below. Each issue has an id (V2-nn), a priority, where it is, what is wrong, and the direction.
The direction is a proposal to design against, not a decision: V2's screens are designed and approved before they
are built, as every screen of this product is.

## Summary

| Category | P0 | P1 | P2 | P3 | Total |
|---|---|---|---|---|---|
| A · The first ten minutes | 3 | 4 | 2 | 0 | 9 |
| B · Primary action and the fold | 2 | 3 | 1 | 0 | 6 |
| C · What to do when something is wrong | 2 | 5 | 2 | 0 | 9 |
| D · Progressive disclosure in the Studio | 1 | 7 | 4 | 0 | 12 |
| E · Language | 2 | 7 | 7 | 2 | 18 |
| F · Information architecture and navigation | 0 | 5 | 3 | 1 | 9 |
| G · Visual design | 0 | 2 | 6 | 3 | 11 |
| H · Tablet and phone | 1 | 4 | 3 | 0 | 8 |
| I · Help | 0 | 2 | 3 | 0 | 5 |
| J · Performance, Handover and Present | 0 | 3 | 6 | 2 | 11 |
| K · Accessibility | 0 | 1 | 3 | 1 | 5 |
| Total | 11 | 43 | 40 | 9 | 103 |

**The ten that matter most**, in order:

1. The Studio opens as a wall of settings and numbers; nothing says "you are done" or "do this next" (V2-01, V2-25).
2. The run can fail and the user is told "Energy was not computed · There are no values yet" with no cause and a
   bare Try again (V2-16).
3. Find's first step is a page of explanation where a search box should be, and the panel's words change with the
   tool in hand instead of with the step (V2-02, V2-04).
4. The next step is below the fold on the sizes people use: Build this roof on a 900 px desktop by hand, on every
   tablet and phone; Add your own and MPPT loading on the Strings lens (V2-10 to V2-13).
5. The language is the engine's: Parapet, Setback, Albedo, Every 24 mod, GCR, Voc, Imp, Isc, MPPT, OND, PAN, PR,
   P90 · σ, with no plain word beside them (V2-37).
6. The same thing is called by different names in different places: by hand three ways, saving four ways,
   "Remove" meaning Cancel (V2-38).
7. Every field of every section is open at once; defaults are not distinguished from choices; a new user cannot
   tell what they must set from what they may (V2-25, V2-26).
8. The Strings lens reads as five options of numbers with a verdict in physics ("Voc at 11.9 °C is 1,480 V (limit
   1500 V); Vmp at 64.3 °C cell is 1,097 V") where it should say "29 modules per string fits. A is the best." (V2-28).
9. The notes to review say "1 note to review · Voc coefficient" and the note itself needs a datasheet to act on;
   there is no path from a note to its fix in one step for most notes (V2-18).
10. Home sells ("Find your roof. Design it in 3D.") to a user who has already arrived, and the search placeholder
    is cut short at 1440 (V2-03, V2-05).

**What already works and should be kept:** one project, three workspaces and the lenses are the right skeleton; the
roof as the interface, no Run button, old values marked as updating; one accent and the dark chrome; ticks and
exclamation marks with a reason; the help disc on every heading with a sheet that names the section; the equipment
pickers; the deliverables as a list with a preview; Present. V2 is a re-layering of this, not a replacement.

## A · The first ten minutes

**V2-01 · P0 · Studio, first open.** A roof built from Find opens on the Roof lens with the inspector's six sections,
the vitals' seven numbers and a time pill, all at once. Nothing says the array is on the roof already, that the
energy is being computed, or what the user should do now (choose a module, check the obstacles, go to Strings).
Direction: a first-open state with one line of status and one next action ("The array is on the roof. Energy is
computing. Next: check the module and the voltage."), the sections collapsed to their summaries (D · V2-25).

**V2-02 · P0 · Find, first step.** The panel "Find the roof" holds a lead sentence, a heading "Start here", three
cards, "The search understands" with four example chips, and "Three steps" with three rows: 14 controls, about 600
px of reading, before the search field is used. The search field is in the top bar, away from the panel that
explains it. Direction: the search field in the panel, first; the three ways as one row of three; examples as the
placeholder and the empty state of the search; "Three steps" dropped (the steps pill already says it).

**V2-03 · P0 · Home.** The headline "Find your roof. Design it in 3D." and the lead "Search the map, outline your
roof, and get layout, shading, stringing and 8,760-hour energy yield on one live model." are a product page. The
user is in the product. The lead has three terms a new user does not know (stringing, 8,760-hour, live model).
Direction: Home is a start screen: the search, the two other ways in, the demo, the designs on this device. One
line of what the app does, in plain words, if any (E · voice §2).

**V2-04 · P1 · Find, outline closed.** Once the outline is closed the panel's title stays "Outline the roof" but its
lead switches to the tool in hand: "Drag a box across the thing on the roof, then turn it by its handle. Its height
is asked right after." The user has just finished the roof and is told to draw a box. Direction: the lead follows the
step, not the tool: "The roof is outlined: 913 m², 4 corners. Add what stands on it, or build." The tool's own
instruction lives on the tool (tooltip, or a line in the toolbar).

**V2-05 · P1 · Home, search.** The placeholder "Search an address or paste coordinates" is cut to "Search an address
or p…" at 1440 because the button sits in the field. Direction: the placeholder "Address or coordinates"; the
button outside the field, or the field wider than the button needs.

**V2-06 · P1 · Find, tips.** On closing the outline a card "Move or turn the roof" with five rows of key hints, a
link "Show me how" and a button "Got it" covers the top left of the map, over the roof the user is looking at; on phone it fills the sheet, the edges and
the obstacles below it.
Direction: no card. The roof shows its own handle once closed; a single hint line in the toolbar ("Drag the roof to
move it · ◯ turns it") for the first outline only.

**V2-07 · P1 · Find, roof type before the roof.** The roof type segmented control (Tilted rows · East-west · Sloped)
and Build this roof are in the panel from the first corner, before there is a roof. Direction: they appear with the
closed outline, and the roof type is a question with a default ("Flat roof, rows facing south") and a plain name
for each type.

**V2-08 · P2 · Find, obstacle height.** The dialog "Height of the box" says "The imagery cannot give it. Enter its
height above the roof surface." and its dismiss is "Remove". A new user does not know what "the imagery" is or why
it is mentioned. Direction: "Height above the roof" as the field's label, nothing else; Cancel and Add.

**V2-09 · P2 · Home, demo card.** The demo card says "Capacity and energy come with the run in the Studio" until the
demo has run once. A sentence about an internal step where a user expects a number. Direction: the two figures
blank with their labels, or the card without figures until it has them.

## B · Primary action and the fold

**V2-10 · P0 · Find, by hand, desktop.** The panel "Enter the roof by hand" is 952 px tall in an 858 px scroller at
1440 × 900; Build this roof sits at 839 to 895, the last 60 px of the window. On a laptop (about 1440 × 800 of
usable height) it is off screen, below Length, Width, Long side faces, three read-outs and the roof type. Direction:
the primary action pinned to the panel's foot at every size; what is above it shortened (A · V2-07).

**V2-11 · P0 · Find, tablet and phone.** Build this roof is in the panel's scroll at 834 and 390, under the fields,
the three read-outs, the roof type and (by hand) "Draw on the map instead". The sheet is half open by default and
the button is not in it. Direction: the primary action pinned to the sheet's foot, visible at every stop of the
sheet, with the step's count ("Build this roof · 913 m²").

**V2-12 · P1 · Strings lens, desktop.** The inspector is 1,487 px in 843 (1,828 with Sizing temperatures open, 2,021
with Inverter limits). Add your own is at 1,052; MPPT loading, Sizing temperatures and Inverter limits are never
in view at once with the options. Direction: D · V2-25; the options as the lens's first thing; what is below as
summaries.

**V2-13 · P1 · Performance.** The page scrolls 2,025 px in 843 (2,473 with the month table). The loss chain, the
25 years and the assumptions are under the fold; the option switch and the weather are at the top right, away from
the title. Direction: J · V2-88.

**V2-14 · P1 · Home with designs.** With one design on the device the page is 1,409 px; the Find my roof button is
scrolled out when the user looks at their designs, and the designs are under the demo. Direction: the designs on the
device first, above the demo, when there are any; the search stays at the top at every scroll.

**V2-15 · P2 · Studio, inspector foot.** Every inspector scrolls (Roof 902, Array 1,096, Strings 1,487 in 843) with no
sign at its foot that it does: the last row is cut at the window's edge. Direction: a fade at the foot of a panel
that scrolls, and the scroll bar as the guidelines say.

## C · What to do when something is wrong

**V2-16 · P0 · The run fails.** When the design run fails the vitals say "Energy was not computed · There are no
values yet · Try again"; the Performance page says the same in a card and adds "The server cannot be reached. Check
the connection and try again."; Handover's rows say "Not made · the run failed". The cause and the remedy are in the
third place, not the first; "There are no values yet" is the consequence restated. On phone the chip is cut to
"There are no values yet · Try ag…": the one action is the part that does not fit. Direction: one failure state with
the cause first: "The server could not be reached. Check your connection, then try again." In the vitals: "Energy
not computed · Try again"; the reason on the chip's tap.

**V2-17 · P0 · The decision card.** When no option fits, a card "Change the system voltage, the inverter or the
sizing temperatures" stands where the options were, and the vitals' chip says "No string length fits this inverter".
Three remedies in one line, none of them actionable from the card, and the most likely one (the voltage) is already
on the screen with its own suggestion ("Use 1000 V"). The card's button in other workspaces says "Open the Strings
lens" even when the fix is on the Roof lens (`NoOptionsCard.tsx`). Direction: one remedy per card, ordered by
likelihood, each a button: "Use 1000 V" · "Choose another inverter" · "Change the sizing temperatures"; the card's
button named for where it goes.

**V2-18 · P1 · Notes to review.** The chip says "1 note to review · Voc coefficient". The note's text: "Voc
coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and
enter it if it differs." A new user does not know Voc, a coefficient or a datasheet, and the note offers no field
to enter it in. The demo opens with this note on; the first thing a new user is asked to review is the one thing
they cannot. Direction: every note has one action that goes to its field; the demo's module has a plausible
coefficient so the demo opens clean; the note's words per voice §5.

**V2-19 · P1 · "Energy was not updated · Values are of the design before".** The stale state uses "before" as an
adjective in four places (vitals, notes, Handover, report preview). Direction: "Showing the last result" with a time
or the change that is waiting ("Showing the result before the parapet changed").

**V2-20 · P1 · Errors that expose the machinery.** "Something went wrong in the app: ${what}. Try again; if it fails
again, report it."; "The server answered 503 in a form that cannot be read."; "The search answered 404."; "this
browser has no IndexedDB"; "The equipment catalog could not be loaded (HTTP 500)". Direction: voice §5: what
happened in the user's terms, what to do, and the technical detail behind a "Details" disclosure.

**V2-21 · P1 · The empty Strings lens.** A new design shows "790 positions ready · no strings yet" under the title and
the options area blank while the run is on its way; there is no ring or step name on the lens itself. Direction: the
options area shows its skeleton and the run's step ("Sizing the strings"), per the guidelines' states table.

**V2-22 · P1 · Map not available.** "This app has no key for the imagery. The roof can still be entered by its
measurements." names a key. Direction: "The map is not available. Enter the roof's measurements instead." and the
by-hand panel open.

**V2-23 · P2 · Refusals of the CSV.** The weather CSV's refusals are precise and good, but they are shown in a toast
that closes. Direction: a refusal that needs the user to change a file stays in the dialog until dismissed.

**V2-24 · P2 · "Choose another" toast.** When the chosen stringing no longer fits, a toast "The stringing you chose,
29 in series × 22 strings on 1 inverters, no longer fits this design. Option A, Recommended, is used instead: …"
runs to three lines. Direction: "Your stringing no longer fits. Option A is used instead." with Undo.

## D · Progressive disclosure in the Studio

**V2-25 · P0 · Every section open, every field visible.** The Roof inspector shows Location, Roof type, Edges and
access (six fields), Obstacles (six rows); Array shows Module, Mounting (six fields), Spacing (five fields and two
switches); Strings shows Inverter, Voltage, Modules in series, Options, a paragraph of rules, MPPT loading (six
rows), Sizing temperatures (four fields), Inverter limits. A new user meets about 40 settings on their first visit
and cannot tell which three matter. Direction: each section is a summary line that opens ("Edges and access · parapet
0.9 m · setback 1.0 m"); the sections a new user must see are open (Module, Voltage, Options); the rest open on
demand and remember it.

**V2-26 · P1 · Defaults and choices look the same.** A field set by the app (from the weather, by roof type, from the
file) and one the user typed look alike; only Sizing temperatures and the voltage say "from the weather" or "Your
choice". Direction: one treatment for "set by the app, change it if you know better" and one for "yours", in every
section (the help's badges "Your choice · Set for India" extended to the fields).

**V2-27 · P1 · Edges and access.** Parapet, Setback, Walkway, Every (24 mod), Clearance, Albedo in a 2 × 3 grid, no
plain words, "Every" with the unit "mod". Direction: labels in plain words with the term after ("Edge margin
(setback)"; "Walkway every 24 modules"); Albedo moved to Performance's assumptions where its effect is (it is there
already as "Roof albedo": the same value in two places, V2-61).

**V2-28 · P1 · Modules in series and the verdict.** The bar "14 · MPPT minimum … 29 · Voc limit" and the verdict
"Voc at 11.9 °C is 1,480 V (limit 1500 V); Vmp at 64.3 °C cell is 1,097 V (MPPT minimum 500 V). 22 strings on 1
inverter(s), DC/AC 1.30." are the engine's proof, shown as the lens's lead. Direction: the lead is the result ("14 to
29 modules per string fit · 29 chosen"); the proof behind "Why".

**V2-29 · P1 · The options' rules paragraph.** Under the options: "Target DC/AC 1.10–1.30, warning above 1.40. At most
4 strings per MPPT (4 × 13.58 A ≤ 65.0 A), so one inverter takes 24 strings. The least shaded strings in a row are
used first, then those across rows." then "D: DC/AC 0.80, below target; E: DC/AC 0.80, below target." Direction:
behind "How the options are made"; each option's own caption carries its own reason (D already says "Below target, 2
inverters").

**V2-30 · P1 · The module card.** "INA-144MHC-TF-560 · INSOLATION GREEN ENERGY PVT. LTD. · 560 Wp · 2.28 × 1.13 m ·
bifacial 0.80 · Voc 50.5 V · Isc 14.1 A · 3 diodes · Coefficients (one-diode): Voc −0.164, Vmp …, Pmpp … %/°C" plus
the warning in full. Direction: name, maker, power, size, and Change; the electrical figures behind "Details".

**V2-31 · P1 · Vitals.** Seven numbers (Energy, DC capacity, AC capacity, DC/AC, Modules, PR, Yield) plus the note
chip, at every lens, in a bar over the roof. A new user reads one of them. Direction: Energy and the modules used, the
note chip, and the rest on the Performance workspace or behind the bar's expansion; DC/AC and PR named in words
where they stay (voice §6).

**V2-32 · P1 · The time pill on every lens.** "21 Dec · 10:30 · solar time" with Play floats over the stage on the
Roof, Array and Strings lenses, where the time changes nothing the lens is about. Direction: on the Sun lens only;
the other lenses show the shadows of the design day's noon, still.

**V2-33 · P2 · The Sun lens tiles.** "Near, linear · Electrical, beyond linear · Far, horizon · Kept clear" with
percentages. Direction: "Rows and obstacles · Strings · Horizon · Area kept clear", and the term in the help.

**V2-34 · P2 · Spacing's lines.** "Shade-free · GCR 0.57 · profile angle 29.8°"; "The ridges run square to the roof
edge closest to the equator". Direction: "Rows 4.2 m apart so they do not shade each other from 09:00 to 15:00 on 21
Dec"; GCR and the profile angle in the help.

**V2-35 · P2 · The Layers popover.** A popover with one switch, "Satellite imagery · Off: the plain grid". Direction:
one toggle button in the view controls, no popover.

**V2-36 · P2 · The project menu.** "This design · Pune demo roof · Saved on this device" with a pencil; "On this
device · Pune demo roof · 439.04 kWp"; then New design, Open a project, Import a drawing, Save a copy, Home, Docs.
The same design is listed twice (as this design and as a device entry). Direction: the open design once, with its
state; the others under "Open"; Home and Docs in the top bar, not the menu.

## E · Language

The inventory (every string of the web app and the API) is the evidence; the rules are in `plan/v2/voice.md`.

**V2-37 · P0 · The engine's terms as the interface's words.** Parapet, Setback, Albedo, Every (mod), Walkway,
Clearance; GCR, profile angle, azimuth, row pitch; Voc, Vmp, Isc, Imp, MPPT, Voc cold, cell rise, Voc coefficient,
one-diode model, open rack; PAN, OND, DC/AC, PR, kWh/kWp, P50/P90, σ, IAM, LID, STC, ohmic, in-plane, transposition,
clipping, horizon, GHI, beam, diffuse, UTC, TMY; INV-1, ACDB, LT panel, SLD, R2010, KMZ/KML/DXF, .rtd, placemark,
polyline, WebGL, IndexedDB, HTTP. Some of these are the right word for a solar engineer and must stay (MPPT, Voc,
kWp). None may stand alone where a new user first meets it. Direction: voice §6, the vocabulary: each term has its
plain name, where the plain name leads and where the term leads.

**V2-38 · P0 · One thing, several names.** By hand is "Enter dimensions by hand", "Enter the roof by hand", "Enter
dimensions by hand instead", "Entered by hand", "By hand". Saving is "Saved on this device", "Saving", "Not kept on
this device", "Not saved", "Not saved on this device", "Your designs are kept on this device", "It is kept on this
device alone". The stale state is "of the design before" and "the design before". The height dialog's Cancel is
"Remove". The outline's edge is "the roof edge closest to the equator" in one line and "the edge of the roof closest
to the equator" in another. Direction: voice §6, one name per thing.

**V2-39 · P1 · Sentences where a label does.** "Boxed values are yours to change"; "Capacity and energy come with the
run in the Studio"; "Designs you save appear here. Your designs are kept on this device."; "It is read, and becomes
the weather of this design when you use it"; "It is read, and opens as a new design on this device"; "The engine's
shadows, drawn over what you see"; "Everything the installer, the client and the utility need"; "The energy to grid
of every month, and of the year"; "Every year is in the chart; the table says six of them and the total." Direction:
voice §3; the label alone, the sentence in the help.

**V2-40 · P1 · Flowery, dramatic or cute.** "The map flies to it"; "The search understands"; "The roof rises in the
Studio; the array fills it at once"; "From sunlight to the grid"; "On its way"; "The sun's day is on its way"; "A
step too far"; Present's captions "The satellite from above tilts into 3D", "The building and the obstacles rise",
"The day plays with its shadows", "The strings light up by MPPT", "The energy counts up"; Find's "Find the building
first: the map flies to it, close enough to outline its roof." Direction: voice §2; Present's captions may keep a
little life, as the one screen that is a show, but in plain verbs ("The roof in 3D", "The array", "Shadows over the
day", "The strings", "Energy over the year").

**V2-41 · P1 · "The engine".** "The engine's shadows", "summed up by the engine", "The PNG is the engine's drawing on
A4", "as the engine lists it", "in the engine's order", "It decides how the engine lays out the rows", "as the
engine's sun has none". A user never met the engine. Direction: "the app", or nothing: "The shadows as computed",
"Summary", "The bill of materials of option A".

**V2-42 · P1 · Tautology and restatement.** "Energy was not computed · There are no values yet"; "The files were not
made · There are no files yet"; "The pages were not made · There is no preview yet"; "Nothing to review · Every check
of the design fits."; "No string length fits this inverter · No string length fits: at least 14 modules are needed
…"; "Not made · the run failed" under a heading that says the run failed. Direction: voice §3; say it once.

**V2-43 · P1 · Instructions that narrate the mechanism.** "Its height is asked right after." (four tools); "The
drawing does not say where the roof is. Search the place, or type its coordinates"; "From the search above, or
typed. Five decimals; north and east are positive."; "The search reads the maker, the model and the file's name. A
PAN file of your own is taken below."; "A height in a name, as h=2.5, is read. A KMZ or KML says where the roof is;
a DXF does not, so its place is asked." Direction: voice §4; tell the user what to do, not what the app will do.

**V2-44 · P1 · Passive, impersonal verbs.** "is asked", "is taken", "is read", "is kept", "were set", "is drawn",
"is proposed", "are averaged" throughout. The app does things to the user's data without a subject. Direction: voice
§2; active voice, the app or the user as the subject, or the imperative.

**V2-45 · P1 · The import dialog's intro.** Five sentences, 70 words, on how a KMZ, KML and DXF are read, before the
drop zone. Direction: the drop zone first ("Drop a KMZ, KML or DXF"); what is read in three bullets after the file
is chosen, as a summary of that file ("Roof: the largest shape, 913 m² · 4 obstacles · 1 wall").

**V2-46 · P2 · Abbreviations with "(s)".** "1 inverter(s)", "1 hour(s) is/are there more than once", "position(s)".
Direction: the plural by count, always.

**V2-47 · P2 · The number as a word.** "Three at least", "Two at least", "the first of them", "six of them". Direction:
"At least 3 corners".

**V2-48 · P2 · "the design before", "the hour's start", "what stands on it", "the thing on the roof".** Direction:
plain nouns: "the last result", "start of the hour", "obstacles".

**V2-49 · P2 · Mixed register in one screen.** Handover: "Everything the installer, the client and the utility need"
(a tagline) above "A4 landscape · 6 pages" (a spec). Performance: "From sunlight to the grid" (a headline) above
"Transposition to plane (15°)" (a term). Direction: one register, the plain one.

**V2-50 · P2 · Section labels in uppercase with a question disc.** LOCATION ?, ROOF TYPE ?, EDGES AND ACCESS ?,
OBSTACLES · 6 ?, in amber. Six amber labels per inspector compete with the one amber action. Direction: G · V2-65.

**V2-51 · P2 · Units as labels.** "mod", "W/m²K", "%/°C", "t/MWh", "kWh/kWp" stand beside fields with no word.
Direction: voice §7; the unit stays, the label says the thing.

**V2-52 · P2 · Help summaries that start with "The".** Every topic's summary is a noun phrase with a trailing clause
("The parapet, the setback from the edges, the walkways, the clearance around obstacles and the roof's albedo.").
Direction: voice §8; the summary says what the thing does for the user in one sentence.

**V2-53 · P3 · "mod" and "h" as abbreviations** in obstacle rows ("5.0 × 4.0 · h 3.0 m"). Direction: "5.0 × 4.0 m ·
3.0 m high".

**V2-54 · P3 · The middle dot as the universal joiner.** "29 × 22 · 357.28 · 1.30"; "Metres · one layer per string";
"Not made · the run failed". It is fine between facts and wrong between a fact and a sentence. Direction: voice §7.

## F · Information architecture and navigation

**V2-55 · P1 · Two navigations on one screen.** The top bar switches workspaces (Studio · Performance · Handover) and
the rail switches lenses (Roof · Array · Sun · Strings). A new user does not know which of the seven is "next", and
the order of work (roof → array → strings → performance → handover) is not visible as an order. Direction: one
progression, shown as such, with a state per step (done, waiting, needs you); Performance and Handover as the end of
it, not peers of the Studio.

**V2-56 · P1 · The Sun lens is a view, not a step.** It changes nothing in the design (its day, its switches are
"what you see"); it sits between Array and Strings as if it were a step. Direction: Sun as a mode of the stage
(shadows, shade map) available in every lens, or last.

**V2-57 · P1 · Export and Present as the top bar's primary.** Export is the one amber button on every workspace
screen, including the first open of a fresh design, when there is nothing to export. Direction: the primary follows
the step (on the Studio: the next lens or "Done · see the handover"); Export lives on Handover.

**V2-58 · P1 · Find's steps pill says 1 · 2 · 3 and the panel says "Step 2 of 3".** Two counters for one thing. The
"Build" step has no screen of its own: it is a button. Direction: two steps (Find, Outline) and a primary action; or
the pill alone.

**V2-59 · P1 · Edit the outline leaves the Studio.** Location's Edit goes back to Find; the design's modules vanish
while the outline is edited and return on Build. A user who adds one obstacle in the wrong place has to leave the 3D
roof. Direction: obstacles and the outline edited on the stage in plan view; Find only for a new roof.

**V2-60 · P2 · Home and the project menu both list the device's designs**, with different cards and menus (Home has
Rename, Duplicate, Save a copy, Delete; the menu has none). Direction: one list, one card, one menu.

**V2-61 · P2 · One value in two places.** Albedo in Edges and access and in Performance's assumptions as Roof albedo;
the design day in Array's Spacing and in Sun's Day; Degradation in the 25 years card and the assumptions. Direction:
each value has one home; the other place shows it as a fact that links there.

**V2-62 · P2 · Handover's "Save a copy" is in four places** (the top bar's Export, the project menu, the Project file
card, Home's card menu) with "Export" meaning the same zip as "Download all". Direction: one name (Download), one
place for the project file.

**V2-63 · P3 · Docs opens a new tab** from Home and the menu without saying it beyond the icon. Direction: fine, keep
the icon; drop Docs from the project menu (it is not a project action).

## G · Visual design

**V2-64 · P1 · No hierarchy inside the inspector.** Every section is the same weight: amber uppercase label, a card
or a grid, the same spacing. The one thing that needs the user (the voltage, a note) does not stand out. Direction:
three weights: the step's question (open, with its action), the facts (summary lines), the details (collapsed).

**V2-65 · P1 · Amber is used for five things.** The primary button, the section labels, the help discs, the note
chip's icon, the selected option's ring, the sun, the "Add" and "Edit" of obstacles. The guidelines say one accent for
the sun, the primary action, selection, focus and notes; the section labels and the discs are beyond that. Direction:
section labels in the muted text token, discs in the line token, amber for the one action and the notes.

**V2-66 · P2 · The vitals bar hides the roof.** On desktop it covers the stage's lower 80 px plus the time pill above
it; on the Strings lens the legend and the time pill stack under the roof's near corner. Direction: the vitals as a
row of the page, not an overlay; the legend at a fixed place with the view controls.

**V2-67 · P2 · Monospace for every figure, in every size.** "18.52000° N, 73.86000° E", "65.0 A per MPPT · 28
inputs", the file name "wattpower-wp-330ktl-h1.OND", "0.90 m" in fields. The mono reads as code. Direction: tabular
figures in Geist for figures in text; mono in tables and fields only; file names never shown as a line of their own
(V2-30).

**V2-68 · P2 · The read-out tiles** (Area · Faces · Corners on Find; Roof · Positions · If all were used in the
vitals) repeat what the panel's fields already show. Direction: once.

**V2-69 · P2 · Cards in cards.** The location card is a card inside a section inside the panel; the custom option is
a card inside the options inside a section. Direction: a flat panel with rows; a card only for a thing the user picks
(the options).

**V2-70 · P2 · The 3D stage's dimension labels** ("90.0 m" ×2, "40.0 m" ×2) are permanent and sit on the roof's
edges where the obstacles are. Direction: on hover or on the Roof lens only, once per edge pair.

**V2-71 · P2 · Charts.** The month chart labels only the highest and lowest bar; the 25-year chart has no axis
labels; the table toggles are in the card's head, right, small. Direction: the guidelines' chart rules are right;
apply them and label the axis.

**V2-72 · P3 · The equipment pickers' sliders** (AC power 0.7 to 350 kW, MPPT 1 to 15, Max DC 420 to 1,500 V) take a
third of the dialog for filters most users never move. Direction: search first; filters behind "Filter".

**V2-73 · P3 · Two button styles for the same weight**: "Change" (outline) on the cards, "Edit" (outline) on Location,
"Add" (outline with plus) on obstacles. Direction: one secondary style, verbs consistent (Change).

**V2-74 · P3 · The logo's wordmark "SolarLayout Rooftop"** in two weights reads as two words of different rank.
Direction: keep it; it is not a V2 matter beyond the top bar's room (H · V2-79).

## H · Tablet and phone

**V2-75 · P0 · Phone: the Studio's bottom sheet.** The inspector is a sheet over a 252 px stage with the vitals row
between; at the half stop a section's heading and one field show. The primary action of the step is in the sheet's
scroll. Direction: B · V2-11 and D · V2-25 together: the sheet opens on the step's question with its action at the
foot.

**V2-76 · P1 · Tablet: the inspector under the vitals.** At 834 the stage takes 508 px, the vitals grid 140 px, and the
inspector starts at 740 of 1,194; the Strings options are at about 1,000. Direction: the stage shorter when the
inspector has a question (320 px is a useful roof); the inspector's two columns ordered by step, not by section.

**V2-77 · P1 · Tablet: the outline's lead and Build.** At 834 the panel's lead (V2-04) and the Build button are below
the map's foot; the sheet is half open and must be dragged. Direction: V2-11.

**V2-78 · P1 · Phone: the Strings legend** covers the roof's foot (fixed in #199 to one entry per colour, still a
band). Direction: the legend in the sheet's head on phone; the roof's colours alone on the stage.

**V2-79 · P1 · The top bar at 834** drops Present's word (an icon alone, a play triangle that reads as "run"), the
coordinates and the save state. Direction: Present's icon has a label or leaves the bar; the save state goes to the
project name's line.

**V2-80 · P2 · Phone: the vitals row scrolls sideways** with seven cells; the note chip is the eighth, off screen.
Direction: V2-31; Energy and the note alone on phone.

**V2-81 · P2 · Phone: the equipment pickers' table** becomes a list with an "Order" select; the filters are three
sliders stacked. Direction: V2-72.

**V2-82 · P2 · Tablet: the Find panel at the half stop** shows the lead and the first card, with "Step 1 of 3" at the
right. The three ways in are a scroll. Direction: V2-02; the search in the sheet's head.

## I · Help

**V2-83 · P1 · Help explains the engine, not the task.** The topics open with what the control is ("The parapet, the
setback from the edges…"), then how it behaves; the question a new user has ("what should I put here?") is answered
last or not at all. Direction: each topic starts with the one-line answer and the usual value; the mechanism after.

**V2-84 · P1 · A disc on every heading.** Nine discs on the Roof inspector, each the same amber circle. The disc is
the loudest element after the primary button. Direction: V2-65; a quiet disc; and the first-line answer in the field's
own hint so most users never need the sheet.

**V2-85 · P2 · The help sheet's pictures** are blank in this environment (a loading state with no words). Direction:
check on production; if they fail there, the picture's slot says why.

**V2-86 · P2 · The tips card and "Show me how"** are a third help channel beside the disc and the docs. Direction: one
channel in the app (the sheet), one out (the docs).

**V2-87 · P2 · The help's "Related" and "In the docs"** are two lists of links at the sheet's foot with the same
names. Direction: one list.

## J · Performance, Handover and Present

**V2-88 · P1 · Performance's order.** The option switch and the weather are at the top right, small, after the
title; the one number is left; six KPI tiles follow with terms (Performance ratio, Specific yield, Capacity factor
AC · 19.7 % DC, In-plane irradiation, CO₂ avoided). The loss chain is a 21-row table with editable boxes marked only
by a border. Direction: the lead number with its option and weather as its subtitle; three KPIs a buyer reads (energy,
yield, PR in words); the chain as "Where the energy goes" with the editable rows marked as such and the rest behind
"All 21 steps".

**V2-89 · P1 · The P-values.** "P50 617.8 · P75 600.2 · P90 · σ 4.24 % 584.2" under the lead number. Direction: "Likely
617.8 · Conservative (P90) 584.2" and σ in the assumptions.

**V2-90 · P1 · Handover's list and preview.** The list's facts are specs ("28 strings of 28 × 560 Wp · 2 inverters, 6
MPPT"; "Metres · one layer per string"; "8,760 rows · irradiance, temperature, power"); the badges are formats (PDF,
PNG, BOM, DC, DXF, KMZ, CSV, RTD) where BOM and DC are not formats. Direction: each item says who it is for and what
they do with it ("Design report · for the client · 6 pages"); badges are formats only.

**V2-91 · P2 · The bill of materials' caption** "The bill of materials of option D, as the engine lists it" and the
schedule's "in the engine's order, by string". Direction: V2-41; drop.

**V2-92 · P2 · The CAD layout's layer list** (ROOF, SETBACK, KEEPOUT, MODULES_UNUSED, STRING_S01 to STRING_S28, "R2010 ·
metres · x east, y north") is the DXF's internals shown as the preview's facts. Direction: the drawing's preview with
"What is in the file" collapsed.

**V2-93 · P2 · The Google Earth model's "Not in the file"** list ("Heights as shapes · everything lies flat, the
heights are in the names, as the import reads them"). Direction: one line: "Heights are in the names; Google Earth
draws the shapes flat."

**V2-94 · P2 · The hourly data's columns** (time_utc_hour_start, ghi_w_m2, poa_eff_w_m2, t_cell_c, p_dc_kw, p_ac_kw)
as the preview's first thing. Direction: the plain names first, the column name after.

**V2-95 · P2 · The report's first page** is a table of 15 rows of specs in 10 px type. Direction: a report design is
its own V2 task; the preview is not the audit's matter beyond the words.

**V2-96 · P2 · Present's panel** "2 · THE ROOF · Obstacles 3 of 6 · Roof 90.0 × 40.0 m · Parapet 0.9 m" counts
obstacles as they rise, a number no viewer needs. Direction: the scene's one figure.

**V2-97 · P3 · The weather select's facts** ("Typical year · PVGIS horizon", "The year 2023 · no horizon", "Hourly or
finer · times read as UTC"). Direction: "Typical year", "2023, measured", "Your file".

**V2-98 · P3 · "Copy as table"** copies HTML with a toast "Bill of materials copied as a table". Direction: "Copy";
"Copied".

## K · Accessibility

**V2-99 · P1 · The screen reader's lines narrate the engine** ("The engine's shadow outlines at 10:30: 4 polygons";
"The strings follow the design run"). Direction: the same words as the sighted user's (voice §9).

**V2-100 · P2 · Contrast of the muted figures** ("65.0 A per MPPT · 28 inputs", the file name, the chart's axis) is
near the 4.5:1 floor on the raised surface. Direction: check every muted token on every surface in V2's tokens.

**V2-101 · P2 · Focus order on Find** goes top bar, map buttons, toolbar, then the panel; the panel's primary is last.
Direction: the panel before the map's controls.

**V2-102 · P2 · Icon-only buttons** (Present at 834, the view controls' north and layers, the card's "⋮") rely on
aria names; the visible affordance is the icon. Direction: a label on hover and focus for every icon button.

**V2-103 · P3 · Reduced motion** stops the sun's play but the Present tour still moves the camera. Direction: Present
under reduced motion shows the scenes as stills.

## What was not audited

- The PDF report's pages beyond their words (a design task of its own).
- The docs site (another repository; its writing guide should take `plan/v2/voice.md` when V2 lands).
- The browser tests (set aside by the owner, 2026-10-11).
- Loading times; the walk ran on the test stack with downloads off.

## Method

- Walk: a Playwright script in the scratchpad, run against the test stack, 57 states at 1440, the same at 834 and
  390; for each state a picture, the primary buttons' position against the window, the scrollers' visible and total
  height, the controls in view, the headings and the page's text.
- Copy: every string of `apps/web` (components, lib, content/help) and of `apps/api/src` that reaches the user,
  marked for jargon, sentence-where-a-label-does, flowery, tautological, inconsistent.
- The bar: the owner's words of 2026-10-12 ("standard, direct; not tautological, flowery, emotional, dramatic,
  sentimental; the bar of Stripe and Vercel") and `docs/design/guidelines.md`.
