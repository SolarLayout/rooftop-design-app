# V2 · Voice: the standard for every word the user meets

The second deliverable of the V2 project. It applies to the app's interface, its help, its errors, the engine's
sentences that reach the screen, the deliverables' captions, and Present. The docs site takes it too when V2 lands.
It replaces the "Writing" section of `docs/design/guidelines.md` once V2's first screens are approved; until then
both hold, this one where they differ.

The bar: Stripe and Vercel. Their words are plain, short, in the present tense, in the active voice, and say the
one thing the reader needs where they need it. Nothing sells, nothing performs, nothing apologises.

## 1 · The five rules

1. **Say what it is or what to do. Nothing else.** A label names the thing. A button says what pressing it does.
   A note says what is wrong and what to do. Everything else goes in the help.
2. **Active voice, present tense.** The user, the app or the thing is the subject. Instructions are imperatives.
3. **Plain words first, the term after.** The term a solar engineer uses stays, because it is the correct word, but
   the first time a screen shows it a plain word stands beside it, and the help defines it.
4. **One name per thing.** The same thing is called the same word on every screen, in the help and in the docs.
5. **Nothing flowery, dramatic, emotional or cute.** No metaphor, no personification, no idiom, no exclamation mark,
   no emoji, no "simply", no "just", no "please", no "oops", no "great".

## 2 · Tone

| | Yes | No |
|---|---|---|
| Register | A colleague who knows the work, in a hurry, being precise | A brochure, a tutor, a friend |
| Subject | "You", the app, or the thing ("The roof is outlined") | "We", "our", "the engine", "the system" |
| Mood | Imperative for instructions; indicative for facts | Conditional ("you may want to"), hedged ("should") |
| Tense | Present | Future ("will be asked"), past where the present does ("was set") |
| Length | The shortest sentence that is still a sentence | A clause chain joined with semicolons and commas |
| Feeling | None. The facts carry it | Reassurance, enthusiasm, apology |

Examples, from the app as it is, to what it becomes:

| Today | V2 |
|---|---|
| Find your roof. Design it in 3D. | Rooftop PV design |
| Find the building first: the map flies to it, close enough to outline its roof. | Search for the building. |
| The roof rises in the Studio; the array fills it at once. | Opens the roof in 3D with the array on it. |
| The search understands | Examples |
| On its way | Preparing |
| The sun's day is on its way | Loading the sun's path |
| From sunlight to the grid | Where the energy goes |
| Everything the installer, the client and the utility need | Files for the installer, the client and the utility |
| The day plays with its shadows | Shadows over the day |
| A step too far: ⌘ Z takes it back. | Undo: ⌘ Z |

## 3 · Say it once

- No restating. "Energy was not computed · There are no values yet" says one thing twice. "Energy not computed" is
  enough; the reason is the second line, not the consequence.
- No tagline above a spec. "Everything the installer, the client and the utility need" over "A4 landscape · 6
  pages" is two registers. Keep the spec.
- No sentence where a label does. "Boxed values are yours to change" is a tooltip on the first box, "Editable".
  "Designs you save appear here." is "No designs yet". "It is read, and opens as a new design on this device" is
  nothing: the button says "Open".
- No narration of the mechanism. "Its height is asked right after." is dropped: the dialog asks. "The drawing does
  not say where the roof is. Search the place, or type its coordinates" is "Where is the roof?" with the search.
- No "(s)". The plural follows the count: "1 inverter", "2 inverters".

## 4 · Instructions

Every instruction, in the app and in the help, has this shape:

| Part | Rule | "Connect the modules in series to make a string." |
|---|---|---|
| Mood | Imperative: a direct instruction or a step | Connect … |
| Voice | Active | the modules are acted on, by you |
| Subject | "You", implied, never written | (you) Connect |
| First word | The base verb | Connect |
| Object | What the verb acts on, with "the" | the modules |
| Purpose | An infinitive, "to …", when the goal is not obvious from the step | to make a string |

- The purpose clause is there to say why, when the why is not the step itself. "Press Enter to close the outline"
  needs it; "Choose a module" does not ("Choose a module to choose a module"). Leave it out when it only repeats
  the verb.
- Use the plain verb: make, not construct; choose, not select; type, not enter (unless the field is "Enter"); drag,
  press, click, tap by the device (the app already chooses "Click" or "Press" by pointer). Never "utilise",
  "configure", "specify", "navigate".
- One instruction per sentence. A sequence is a numbered list, each step one imperative.
- The condition before the instruction: "If the roof has a parapet, type its height." Never "Type its height if …".
- The place before the action when the user must go somewhere: "In the Strings lens, choose 1000 V."
- What the app does after is a fact in the present, after the instruction, only when the user must know it to
  continue: "Press the first corner again to close the outline. The edges show their lengths."

| Today | V2 |
|---|---|
| Click each corner. Drag a corner to adjust it, or type a length you have measured. | Click each corner of the roof. To adjust one, drag it or type its edge's length. |
| Drag from the middle of the tank to its edge. Its height is asked right after. | Drag from the tank's centre to its edge, then type its height. |
| Type what you have measured. The roof is drawn as you type; Faces is where its long side looks. | Type the roof's length and width. "Long side faces" is the direction of its long side. |
| Check the datasheet and enter it if it differs. | Enter the Voc coefficient from the module's datasheet. |
| Fill the gaps: an hour without its irradiance is not an hour of none. | Fill the gaps in the irradiance column, or leave the column out. |
| Metres east and north of the middle of the roof, in order around it. Three at least. | Type each corner in metres east and north of the roof's centre, in order. At least 3. |

**Passive is wrong when there is an agent.** "The height is asked", "600 V is taken", "the file is read", "the
roof is drawn as you type" all have one: the app. Write "The app asks for the height", or better, the imperative
that makes the app's step the user's: "Type its height." The passive stays only where the agent is unknown or does
not matter and the thing is the point: "The outline is closed" (a state), "No module fits" (a result).

## 5 · Problems: errors, refusals, notes

A problem has three lines at most, in this order: what happened, what to do, where to do it. The user's words, not
the machine's. The detail that only a developer reads goes behind "Details".

| Part | Rule | Example |
|---|---|---|
| Title | The thing and its state, no verb, no "error" | Energy not computed |
| Cause | One sentence, the agent named, present tense | The server could not be reached. |
| Remedy | Imperative, the first thing to try | Check your connection, then try again. |
| Action | A button for the remedy, named for what it does | Try again |
| Details | The status, the file's line, the parser's text, behind a disclosure | Details: HTTP 503 |

- The cause before the consequence. "The server could not be reached" first, "No values yet" never.
- A refusal says what was expected and what was found: "The file has 8,000 hours. A year has 8,760."
- A note (exclamation mark) says what is outside the usual and offers the field: "Voc coefficient −0.164 %/°C is
  outside the usual −0.35 to −0.20. Enter the datasheet's value." with the field beside it.
- Never blame the user, never apologise, never reassure. Not "Oops", not "Sorry", not "Don't worry".
- Never "report it" without a way to report. Never "if it fails again".
- Never a technical word in the first two lines: not "HTTP", "status", "JSON", "IndexedDB", "WebGL", "key", "the
  engine", "the request", "the catalog". "The map is not available" replaces "This app has no key for the imagery".
- The last good result stays on screen, marked: "Showing the last result".

| Today | V2 |
|---|---|
| Energy was not computed · There are no values yet · Try again | Energy not computed · The server could not be reached. Check your connection. · Try again |
| Something went wrong in the app: TypeError … Try again; if it fails again, report it. | The app could not finish this step. · Try again · Details |
| The server answered 503 in a form that cannot be read. Try again; if it fails again, report it. | The server did not answer. Try again in a moment. · Details: 503 |
| Words cannot be searched for without a map key. Paste coordinates or a maps link instead. | Address search is not available. Paste coordinates or a maps link. |
| No string length fits this inverter · Change the system voltage, the inverter or the sizing temperatures | No string length fits at 600 V. · Use 1000 V · Choose another inverter |
| The stringing you chose, 29 in series × 22 strings on 1 inverters, no longer fits this design. Option A, Recommended, is used instead. | Your stringing no longer fits. Option A is used. · Undo |
| The equipment catalog could not be loaded (HTTP 500). Try again. | The module library did not load. · Try again · Details: 500 |

## 6 · Vocabulary: one name per thing

**The rule.** A term the trade uses is kept where the trade reads it (tables, the schedule, the single-line diagram,
the report). Where a new user first meets it, the plain name leads and the term follows in the help or after a
middle dot. Never two names for one thing.

| Thing | Name everywhere | Not |
|---|---|---|
| The roof's outline on the map | Outline | Footprint (except Overture's "footprint found"), shape, polygon |
| Typing the roof's measurements | By hand ("Enter the roof by hand") | Enter dimensions by hand, Entered by hand, measurements |
| What stands on the roof | Obstacle (box, tank, wall, tree, building) | Thing, feature, object |
| The low wall at the edge | Parapet | Edge wall |
| The strip kept free at the edge | Edge margin · setback | Setback alone |
| Space kept free around an obstacle | Clearance | Buffer, offset |
| A path between rows | Walkway, every N rows | Every (mod) |
| How reflective the roof is | Roof albedo | Albedo alone |
| Module rows' spacing | Row spacing · row pitch | Pitch alone (pitch is the slope's) |
| The slope of a sloped roof | Roof pitch | Slope, inclination |
| Which way rows face | Direction · azimuth | Orientation (that is portrait or landscape) |
| Portrait or landscape | Orientation | Rotation |
| The hours rows must not shade each other | Shade-free hours | Shade-free window |
| The day the layout is designed for | Design day | Reference day |
| Rows and obstacles shading modules | Near shading | Near, linear |
| Mountains and buildings far away | Horizon shading | Far shading |
| Loss when a shaded module drags its string | String shading loss · electrical | Electrical, beyond linear |
| Module | Module | Panel |
| Module data file | Module file (PAN) | PAN alone |
| Inverter data file | Inverter file (OND) | OND alone |
| Inverter input that tracks a group of strings | MPPT | Tracker, input |
| Modules per string | Modules per string · in series | Series, string length |
| The highest DC voltage allowed | System voltage | Max voltage |
| Open-circuit voltage | Voc | Open-circuit voltage alone (the trade reads Voc) |
| DC to AC ratio | DC/AC ratio | DC/AC alone in the vitals; "sizing ratio" |
| Performance ratio | Performance ratio (PR) | PR alone in the vitals |
| Energy per kWp | Yield, kWh/kWp | Specific yield |
| The run's A to E | Options (A, B, C, D, E; Your own) | Stringings, configurations |
| The stringing the user adds | Your own option | Custom |
| Weather data | Weather (Typical year, 2023, Your file) | PVGIS TMY, NASA POWER 2023, CSV file as names |
| Expected energy with chances | Likely (P50), Conservative (P90) | P-values, exceedance |
| The design's saved state | Saved on this device · Not saved | Kept, Not kept |
| A saved design's file | Project file (.rtd) | .rtd alone, "a project saved by this app" |
| A drawing of the roof | Drawing (KMZ, KML or DXF) | File |
| The last result while a new one is computed | Showing the last result | Values of the design before |
| The computation | The run (verb: runs) | The engine, the simulation, the design run |
| The company's software | The app | SolarLayout Rooftop (except the logo and the page title), the system, the tool |
| The three places of a design | Studio, Performance, Handover | Workspaces (internal word) |
| The Studio's four views | Roof, Array, Sun, Strings | Lenses (internal word; "the Roof lens" in the help is fine) |

**Words that never appear:** bankable (hard rule 5), engine, simply, just, please, easy, powerful, seamless, smart,
intelligent, magic, beautiful, oops, sorry, great, awesome, enjoy, journey, experience, leverage, utilise, robust,
feel free, note that, in order to, as well as, a number of, "and more".

**Case.** Sentence case everywhere: titles, buttons, section labels, table heads, menu items. Proper names keep
their case (PVGIS, Google Earth, Overture Maps). Terms are lowercase (parapet, setback, albedo); abbreviations keep
theirs (MPPT, Voc, DC/AC, PR, kWp).

## 7 · Numbers, units, punctuation

- The number and the unit, a space between, except the degree sign: "617.8 MWh", "15°", "11.9 °C".
- The unit after the number, never as the label: "Walkway every 24 modules", not "Every · 24 · mod".
- A label is the thing, not the unit: "Grid CO₂ per MWh" not "Grid CO₂ · t/MWh" alone.
- The count as a figure, always: "At least 3 corners", not "Three at least".
- The middle dot joins facts of one kind: "29 × 22 · 357.28 kWp · 1.30". It never joins a fact to a sentence
  ("Not made · the run failed" is "Not made: the run failed") and never stands between a label and a value in prose.
- A colon introduces; a full stop ends. No semicolons in the interface. Commas in the help as in print.
- Ranges with "to" in prose ("14 to 29 fit"), with the en dash in tables and chips ("1.10–1.30").
- The minus is U+2212 in display text. Thousands take a comma.
- Dates "21 Dec", "12 Oct 2026"; time 24-hour, "10:30". "Solar time" said once, in the control's label.
- Capitals for the trade's abbreviations only. No full stops in abbreviations: "kWp", "MPPT", "Wp".
- No parentheses in the interface except the term after the plain name: "Edge margin (setback)". In the help,
  sparingly.
- No quotation marks around a control's name in the interface; in the help the control's name is in code
  formatting, as the help's own rules say.

## 8 · By element

| Element | Shape | Example |
|---|---|---|
| Page title | A noun | Performance · Handover · Find the roof |
| Section label | A noun or a noun phrase, two words where one does | Module · Edges and access · Options |
| Field label | The thing, plain, the term after | Edge margin (setback) · Row spacing |
| Field hint | The default's source or the usual value, no verb | From the weather · Usually 0.5 to 1 m |
| Button | Verb + object, what pressing it does | Build this roof · Use 1000 V · Download PDF |
| Secondary button | The same, never "OK", "Submit", "Done" alone | Choose another · Cancel |
| Destructive | The verb, named for the thing, confirmed by the thing's name | Delete "Pune demo roof" |
| Toggle | The thing it turns on, as a noun phrase | Satellite imagery · Shaded positions |
| Segmented control | Nouns, parallel | 600 V · 1000 V · 1500 V |
| Empty state | What goes here and the one action | No obstacles yet. · Add an obstacle |
| Loading | The step, as a noun phrase, present participle allowed | Sizing the strings · Loading the weather |
| Updating | The last result marked | Showing the last result |
| Success | The thing and its state; a toast only when nothing on screen shows it | Copied · Saved |
| Status line under a title | Facts joined by middle dots | 22 strings of 29 · 1 inverter · 152 positions free |
| Card caption (an option) | Why it is there, two or three words | Recommended · Fills the inverter · Below target |
| Tooltip | A noun phrase or the shortcut | Fit the roof · Undo (⌘ Z) |
| Help disc summary | One sentence: what it does for the user and the usual value | How far rows stand apart. Set by the shade-free hours unless you type it. |
| Help topic | Answer first, then the mechanism, then the edges | What to set → What it changes → When to change it |
| Note (exclamation) | What is outside the usual, the field to fix it | Voc coefficient is outside the usual range. · Enter it |
| Error | Title, cause, remedy, action, details | §5 |
| Present caption | A noun phrase, no verb of drama | The array · Shadows over the day |
| Deliverable row | Name, who it is for, size | Design report · for the client · 6 pages |
| Screen-reader text | The same words as the sighted user's, plus what the picture shows | "Roof, 4 corners, 913 m²" |

## 9 · Help

- The first sentence answers "what do I put here?" or "what does this do?". The mechanism comes second. The edge
  cases last.
- Imperatives for steps (§4), numbered. One step, one action.
- A term is defined where it first appears, in the same sentence, in plain words: "Albedo, how much light the roof
  reflects, from 0 to 1."
- The app is the subject when the app acts: "The app spaces the rows so that they do not shade each other." Never
  "the engine".
- No "you may", "you can", "you might want to". Either the user does it, or the app does it.
- No "note that", "please note", "it is worth". Say the thing.
- The summary in the front matter is one sentence, under 20 words, the thing's job: "How many modules one string
  holds, and the lengths that fit at your voltage."
- Pictures and clips show the step the text names; the caption is the step's imperative.

## 10 · Checklist for a pull request

Every pull request that adds or changes a word the user meets answers these under "How it was checked":

1. Every instruction is an imperative in the active voice, the base verb first (§4).
2. Every problem has its cause before its consequence and a remedy that is a button (§5).
3. Every term a new user may not know has its plain name beside it or in the field's hint (§6).
4. Every thing is called by its one name (§6's table); the table is extended when a new thing is named.
5. No word from the "never" list; no exclamation mark; no emoji; no "(s)".
6. No sentence where a label does (§3). No narration of what the app will do.
7. Numbers, units and punctuation as §7.
8. The help's topic for the changed control says the same words as the control (`docs/help-upkeep.md`).

## 11 · The register, in three screens

**Find, first step, today:** "Find the roof · Find the building first: the map flies to it, close enough to outline
its roof. · Start here · Search for the building · An address, coordinates or a maps link · Use my location · When
you are at the building · Enter dimensions by hand · The roof is measured already · The search understands · Address
· Coordinates · Degrees · Maps link · Press one to put it in the search. · Three steps · Find · the map flies to the
building · Outline · trace the roof, then what stands on it · Build · the Studio opens, the array on the roof"

**V2:** "Find the roof · [Address or coordinates] · Use my location · Enter the roof by hand"

**A note, today:** "1 note to review · Voc coefficient" → "Voc coefficient −0.164 %/°C is outside the usual −0.35 to
−0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs."

**V2:** "1 to review · Voc coefficient outside the usual range · Enter the datasheet's value [field] · Why"

**A run that failed, today:** "Energy was not computed · There are no values yet · Try again" and, elsewhere, "The
server cannot be reached. Check the connection and try again."

**V2:** "Energy not computed · The server could not be reached. Check your connection. · Try again"
