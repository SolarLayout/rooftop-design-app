# Components

Anatomy, sizes and states of each control and pattern. Values are token names from `design-tokens.md`.
The live reference is the "Controls, depth and motion" board (`mockups/Kit.dc.html`).

Every control is a real element (`button`, `a`, `input` with a `label`), reachable by keyboard, with a visible
focus ring. An icon-only button has an `aria-label`.

## Buttons

V2 (D94): three heights on desktop, 32 compact, 40 standard, 48 primary; on phone and tablet 44, 44 and 48. One row, one
height. Every button has the control's radius, 8.

| Kind | Height | Surface | Text | Shadow | Use |
|---|---|---|---|---|---|
| Primary | 48 for the one action of a step or a page; 40 in a bar | accent | accent-ink, Geist 600 | primary | One per view: Continue to …, Build this roof, Download all |
| Secondary | 32 or 40 (44 on touch) | control, border line-strong | text, Geist 500 | raised | Change, Add, Present |
| Quiet | 32 or 40 (44 on touch) | none | text-2 (text on hover) | none | Undo, Clear, Cancel, a tool beside a primary tool |
| Icon | 32 or 40 square (44 on touch) | as secondary or quiet | icon 16 to 20 | as kind | Close, zoom, north; any other action carries its word (V2-117) |
| Round | 40 to 48 | accent | icon accent-ink | primary | Play |

States: rest; hover (raised 1 px, brighter, `shadow-*-hover`); pressed (lowered 1 px, `shadow-pressed`, scale
0.985); focus (focus ring); disabled (opacity 0.45, no shadow, no pointer).

In code (`apps/web/components/ui`): `Button`, `ButtonLink` (a link that looks like a button) and `IconButton`
(`button-look.ts`).

| Size | Button, height on desktop | Icon button, side on desktop | On phone and tablet |
|---|---|---|---|
| `xs` | 32 | 32 | 44 |
| `s` | 32 | 40 | 44 |
| `m` | 40 | 40 | 44 |
| `l` | 40 | 44 | 44 |
| `xl` | 48, its label in `type-section` | | 48 |
| `sheet` | 40, the actions of a dialog | | 44 on tablet; 48 on phone, a quiet one 44 |

Padding at the sides: 16 primary, 14 secondary and quiet, 20 for `xl`. Icon to label: `space-inline`.
The border of a secondary button is `line-strong`; of a secondary icon button `line`.
An icon button takes its name from `label`, which it cannot be without.
The kit shows a state without a pointer or a keyboard by `shownAs`; a screen never sets it.

## Segmented control
Track: `color-well`, border `line`, `shadow-well`, padding 4, radius `radius-row` (12).
Items: height 32 on desktop, so that the track is 40, the standard height (44 on touch), radius `radius-control` (8); active item `control-active`, `shadow-segment`, text, Geist
500; others transparent, text-2. Use for 2 to 4 exclusive choices with short labels: 3D or Plan, Portrait or
Landscape, design day, roof type, system voltage, colour by.

A choice the user must make is not a segmented control with nothing selected: it is a decision card (below). The system
voltage is not such a choice any more: a design the app makes has the voltage of the user's country from the start (D87),
and the segmented control shows it with its words (see "System voltage").

In code: `Segmented`. It is a group of radio buttons to a screen reader (`radiogroup`, `radio`). The keyboard
stops at it once, at the choice that is taken; the arrows go through the choices and around the ends, Home and
End to the first and the last; each takes the choice it goes to. A choice that cannot be taken is dim and is
passed over. On phone and tablet the items are 44 and the text `type-body-touch`. With `fill` the choices share the width in equal parts. With
`disabled` the whole control is dim and takes neither pointer nor key; only then may nothing be taken
(`value` null), where the choice does not apply yet: the units of a drawing before the file is a DXF.
A choice may carry a status mark after its label (`mark`: a tick or a note of 14, never a cross), where the
choices are results with a verdict: the stringing options of Performance, "A · Recommended" with a tick, "D"
with a note. The mark's words go into the choice's `name` for a screen reader ("D, below the DC/AC target").

## Section heading
V2 (D94; D76 reversed): a section's name in `type-section` (Geist 16 at 600) in `text`, sentence case, nothing glowing, no
line under it; its ? beside it (the help disc, quiet). In code: `SECTION` (`components/ui/section-look.ts`) and
`SectionHeading` (`components/shell/help`).

## Tabs
The board "Tabs" (`mockups/Tabs.dc.html`), approved on 2026-09-29 (decision D35).
Row: on a line `line`, tabs 4 apart. Tab: height 40 (44 on touch), padding 0 14 (0 16 on touch), radius
`radius-xs`, `type-body` (body text on touch) in text-2, no surface. The tab that is taken: text, Geist 500,
a line of `border-tab` in accent that lies on the line of the row and is as wide as the words. Under the
pointer: text, the line in `line-hover`. Cannot be taken: opacity 0.45. A count may follow the words: mono 12
in text-2 on `surface-2`, 18 high, radius full. The panel begins 16 under the row.

Tabs divide the content of one card or one panel into parts, two to six of them, named by what is in them.
A segmented control sets a value of the design or the view of the stage.

In code: `Tabs`. It shares the keys of `Segmented` (`choice-keys.ts`).

- `tablist`, `tab`, `tabpanel`; the panel is named by its tab. One panel is in the page: that of the tab
  that is taken.
- The keyboard stops at the row once, at the tab that is taken. The arrows left and right go to the
  neighbour and around the ends, Home and End to the first and the last; each takes the tab it goes to, and
  a tab that cannot be taken is passed over. The arrows up and down are left to the page. Tab leads into
  the panel.
- A row that is too long scrolls sideways and shows no bar; part of the next tab is seen. The tab that is
  taken is brought into view.
- The row can stand in the line of a title (`head`: the title, and what stands after the row, as a unit or a
  field): on desktop the title at the left, the row at the right with the rest after it; on phone and tablet the
  title's line holds the rest, and the row stands under it across the width (the chart cards of Performance).

## Switch
44 by 26, radius full. On: accent track, knob accent-ink. Off: line-strong track, knob text-2. Knob 20, inset 3,
`shadow-knob`. On touch the hit area is 52 by 44 around a 52 by 30 switch. Always beside a label and, where it
helps, one line of hint. `role="switch"` with `aria-checked`. The track has `shadow-track`.

In code: `Switch`. Its name is its `label`. The knob slides in `duration-press`.

## Slider and range slider
Track 4 high, `color-line`, radius full; the filled part accent. Handle 18 round (26 on touch), `color-text`
with an accent border of `border-handle` (3; `border-handle-touch`, 4, on touch), `shadow-handle`. The value
is shown above the track in `type-mono` (`type-mono-touch` on touch) with its unit, never only on the handle;
a slider has its label at the left of the value. One line of hint may follow under the track, in
`type-body`, text-3. Ticks in `type-unit`, text-3, each under its value. The range slider (shade-free
window) has two handles and fills between them; its two values stand at the left, a note ("solar time") at
the right.

In code: `Slider` and `RangeSlider`; their numbers in `slider-steps.ts`. `useSlide` may hear what is shown while a
handle moves (`onShow`), and the values again when a drag is given up, for what follows a slider live: the time of the
sun. `SliderTrack` may fill a span of the scale instead of up to the handle (`fill`: the shade-free window on the
timeline), and a tick at an end of the track may stand from that end inward (`align`), in text-2 when `strong`.

- The slider is 20 high on desktop and 44 on touch, and all of it takes the pointer: a press brings the
  nearest handle there, and a drag goes on from it.
- The middle of a handle stays half a handle away from the ends of the track: a handle never stands out
  over them.
- A drag or a key changes what is shown. The value is committed when the drag ends, when the key is
  released, or when the focus leaves. A drag that is broken off is given up.
- Keys: the arrows one step, Page Up and Page Down a tenth of the scale in whole steps, Home and End to the
  ends.
- The two handles of a range never pass each other: one step stays between them, or what `apart` says.
  Home and End of a handle lead as far as the other lets it.
- `role="slider"` with its value in words ("15°", "09:00 solar time"); the handles of a range are a group
  and are named "from" and "to".
- Cannot be used: opacity 0.45, and neither pointer nor key moves it.

## Number field
Recessed: `color-well`, border `line`, `shadow-well`, radius `radius-control`, height 40 (44 on touch, 22 inside
the loss chain). Label left in `text`, at the value's weight (D94); value right in `type-mono` (400), unit after the value in
text-2.
Focus: accent border and `halo-focus`. The value commits on Enter or blur, not on every key.
A stepper is a number field with minus and plus buttons of 32 (44 on touch).

In code: `NumberField` and `Stepper`; their numbers in `number-entry.ts`.

| Form | Height on desktop | On phone and tablet | Use |
|---|---|---|---|
| The label inside, at the left | 44 | 44 | A field of its own, as on the kit board |
| The label before the field | 40 | 44 | A row of the work column |
| Stepper | 40: buttons of 32 in a well with padding 4, radius row | 52: buttons of 44 | A few whole steps |
| Inside the loss chain | 22, radius control, mono | Tablet 40, phone 44, radius control | A step of the chain that is the user's; the row's label is its name |
| Inside a chip | 22, radius control, mono | Tablet 32, phone 44, radius control | An assumption of Performance; the chip's label is its name |

- What is typed is a draft. Enter or leaving the field commits it; Escape gives it up. The arrows up and down
  step the draft and do not commit. Plus and minus of a stepper commit at once, and cannot be pressed at the
  end of the range.
- A field that has no value yet (the height of an obstacle drawn on the map) is empty, with its label and its
  unit, and says nothing until a number is typed; nothing is preselected. In code: `value` null.
- A number outside the range is brought to the nearest limit. What is no number leaves the value as it was.
  In both cases the field says under itself what happened, in `type-body`, text-2: "5.00 m is the highest that can
  be set.", "Enter a number, from 0.00 to 5.00 m.". The next good entry takes the words away.
- The field shows its number with the decimals of the quantity, a comma between thousands and a true minus
  sign; it reads either minus sign and the comma.
- With the focus inside: accent border and `shadow-well-focus`. The input has no ring of its own.
- Where the label stands before the field, a line under the label may say where the value comes from, in
  `type-body`, text-2: "11.9 °C from the weather", "entered" (the board "Inverter and sizing"). In code: `detail`.
- Inside the loss chain there is no line under the label: a field that is empty for its default says the
  default inside itself, in text-3 ("PAN 0.2 %"). In code: `placeholder`.
- Inside a chip the field is a cell of the chip, as in the chain (`form="chip"`); what it says of an entry it
  changed takes a line of its own under the chip's row, at the right.

## Text field
The number field's well for words (the boards "Handover, previews", the name of the project file, and "Handover, states",
the name edited; plan phase 9, step 6). Recessed as the number field: `color-well`, border `line`, `shadow-well`, radius
`radius-control`, height 40 on desktop, 44 on touch. The label stands before the field in text-2, 72 wide; the words in
Geist at the left, in the size of body text. Focus: accent border and `shadow-well-focus`; the input has no ring of its
own. The value commits on Enter or blur, not on every key.

In code: `TextField`; its words in `text-entry.ts`.

| Form | Height on desktop | On phone and tablet | Use |
|---|---|---|---|
| The label before the field | 40 | 44 | The name of the project file |
| The label for the screen reader alone | 40 | 44 | The name in the project switcher, where "This design" names the row |

- What is typed is a draft. Enter or leaving the field commits it, trimmed and cut to `maxLength`; Escape gives the
  value back.
- An empty or blank entry is not committed: the field gives the value of before back and says why under itself, in
  `type-body`, in the caller's words ("A name is needed"). The next good entry takes the words away.
- A hint may stand under the field in the same style (`detail`): what the words are for. What the field says stands in
  its place while there is something to say.
- `maxLength` is the input's too, so nothing longer can be typed.
- With the focus inside: accent border and `shadow-well-focus`. The kit shows it by `shownAs`.

## Cards
`surface-1`, border `line`, radius `radius-card`, `shadow-card`, padding `space-card`.
Equipment card (module, inverter): glyph 44 by 56 to 60, name in Geist 600, one or two lines of facts in
`type-body`, file name in Geist Mono, a secondary button (Change, which opens the picker of "Choose a module or an
inverter"; its tooltip on desktop "Choose from 119 modules, or use a PAN file", the count the library's). The maker is
named as people know it (`makerOf`, D75). In its step the card stands under a section heading, Module or Inverter (D76).
Selected card: `note-surface`, accent border, `halo-selected`.
Compact card: radius `radius-card-s`, padding `space-card-compact`.

## Stat tile and vitals cell
Label in `type-body`, text-2. Value in `type-mono-touch` (or a display size for the lead value) with its unit.
A status mark may follow the value. Tiles inside a card are flat: `surface-2`, radius `radius-row`, padding
10 by 14.

In code: `Stats` is the list, `Stat` one label with its value. Looks: `cell` (vitals: value 16, 17 on tablet),
`lead` (the energy: display 26, 22 on phone), `tile`, `hero` (the energy on Performance: display 76, its unit
`type-heading`, the label in body text) and `figure` (a KPI tile of Performance, a card of its own: display 34,
26 on phone, the label in body text), `scene` (the lead figure of a panel of Present: `type-figure`, 44 on
desktop, 40 on tablet, the label in `type-body`) and `scene-small` (the panel's other figures: display 22). A
quieter figure may follow the unit (`more`: "· 19.7 % DC"); on phone it takes a line under the value. A value that
counts toward a final one (`holds`) stands from the start in the final one's width, at its right, in tabular
figures: it neither wiggles nor pushes what is beside it.

## Present, the panel of a scene
The boards "UI fixes · Present, the figures of each scene" (`mockups/PresentStats.dc.html`,
`mockups/PresentStatsTablet.dc.html`; D72). In each of the tour's six scenes one panel at the stage's top left (24 on
tablet, 40 on desktop), the stage seen through it: `color-dim-panel` over `backdrop-blur-panel`, the edge
`line-glass`, `radius-card`, `shadow-float`, padding 18 by 22; 304 wide on tablet, 340 on desktop, the energy's 580
there with the chain beside its figures (under them on tablet). The scene's number and name in `text-section` text-3
("4 · The sun, 21 December"); the lead figure in the look `scene`, counting over the first three quarters of its
scene in the place of its final value; two figures in the look `scene-small` beside each other. Place: the roof's
area, its latitude and longitude. Roof: the obstacles as they rise, the roof's length by width (its corners for a roof
drawn), the parapet. Array: the positions as the rows fill, the rows, the tilt and the orientation. Sun: the solar
time, the sun's height and bearing; the stage draws the sun path and the sun along it with the hour marks of the Sun
view, without its callout. Strings: the DC capacity, strings × modules in series, inverters × kW. Energy: the energy
of year 1, the specific yield, the PR, and the chain's cascade from the array's nominal energy to the grid. A scene
whose facts are not there yet has no panel. It fades in with its scene (`appearing`). Through the whole tour the
camera frames the sun path's dome, and on a canvas taller than wide it stands back by the aspect.

## The result (top bar)
V2 (D95; the board "V2 · 2"): the vitals bar over the stage is gone. The result is a chip at the top bar's right on
desktop and phone, a row under the stage on tablet: the energy of year 1 in `type-strong` with `MWh a year` (`MWh` on
phone) in `text-2`; beside it, after a line, the note mark and `N to review` when notes wait. While a new result comes the
figure is dimmed with the ring beside it; before the first, the ring and `Computing the energy`; a run that failed, or no
option that fits, the note mark and its title. Pressed, a card under it: `The result`, seven figures in plain names, the
notes' button when some wait, `Open Performance`. In code: `ResultChip`, its words from `resultChipOf` and `summaryOf`
(`components/shell/result-view.ts`).

## Status marks
Tick: `color-ok`, stroke 2.4. Note: exclamation mark in a circle, accent. Size 14 to 22. Each has a text
alternative ("Fits", "Below the DC/AC target"). There is no cross and no red.

In code: `StatusMark`, of the kind `fits` or `note`. It cannot be without its words (`label`): they stand
beside the mark, or, where there is no room (`wordsShown={false}`), the mark says them to a screen reader.

## Decision card
For a choice only the user can make. `note-surface`, accent border, 4 px accent halo, note icon, a title that
is an instruction, one sentence of why, the choices as large raised buttons (52 high), one line of context. Nothing is
preselected. Below it, the list of what is waiting and what is done. Its one use, the system voltage, went with D87
(Phase 16): the pattern is kept for a choice that comes to need it, and is in no screen today.

## System voltage
The Strings step\'s section (the boards "System voltage · Set by the user's country"; D87, D88). The heading with its
? disc, and at the right in `type-body` `text-3` who set the voltage: `Set for <country>` (the app, for the user's
country), `Set by the app` (the app's value is not the default of the country the user is in now), `Your choice`. Under
it the segmented control of 600, 1000 and 1500 V, filling the width. Then, each only when it applies:
- for the app's value, one line in `type-body` `text-2`: where it comes from ("1000 V, the usual limit for rooftops in
  India. Change it if the site needs another.");
- for the app's value with equipment rated under it, a second line, plain, no mark: "Strings sized to 800 V, this
  inverter's limit.";
- for the user's value with equipment rated under it, a note: `surface-1`, border `note-line`, `radius-row`, padding 12
  by 16, the note mark of 16, a title in Geist 500 and the detail in `type-body` `text-2`, then a small secondary
  button `Use <n> V` (the highest of the three at or under the rating, where there is one);
- an offer, where the equipment takes more: the words in `type-body` `text-2` with a small secondary button
  `Use <n> V` at the right ("This inverter takes up to 1500 V. Raise it only if the site's code allows."; where no
  length fits, the lowest voltage at which one does).
The app never moves the value; every button is the user's choice, an edit undone in one step. Numbers and their unit stay
on one line (a no-break space).

In code: `SystemVoltage` draws what `voltageWordsOf` (`lib/studio/voltage-words.ts`) gives; the country from
`lib/country`. In the inverter picker an inverter rated under the voltage set carries, under its maker, the note mark of
14 and "Up to 800 V: strings sized under the 1000 V set" (`ratedUnderOf`, `lib/equipment/rows.ts`); its row grows to hold
the third line.

## Callout on the stage
Floating chip: `surface-1`, border `note-line` (or `line-strong`), `radius-row`, `shadow-float`, padding 10 by
14. Title line in Geist 500, 13; detail in 12, text-2. Joined to its object by a 1 px line and a 9 px dot.
The chip stands over its dot on a line of 40; where it would rise into the stage's top 160 (the title, the view
controls, on phone the time) it hangs under the dot. On phone there is none while the selected obstacle's handles
stand, as the board "Obstacle edited on the roof" draws it: the handles and the time fill the top of a stage of 252.

## Bottom sheet (phone)
`color-chrome`, top radius `radius-panel`, top border `line`, drag handle 40 by 4 in `line-strong`, 8 over it
and 4 under it. Holds the step's sections and its primary as a list of rows 64 to 68 high divided by
`line-subtle`. Three stops: peek, half, full.

In code: `Sheet`; its stops in `sheet-stops.ts`. It stands at the bottom of the room it is put into.

- Peek is `size-sheet-peek` high: the handle and the top of the step. Half is half the room, full all of it.
  A sheet may be given another share of the room for half: the Studio's sheet at half meets the foot of the stage on
  a phone of any height (the boards draw it so at 844; #148, the owner's choice of 2026-10-08), the stage staying 252.
- The sheet follows a drag of its handle. Let go, it goes to the nearest stop, and to the next one in the
  direction of the drag when the drag went a quarter of the way there. It goes in `duration-panel`.
- A press on the handle opens the sheet one stop further, and closes it from full.
- The handle takes the pointer 44 high. To a screen reader it is a `separator` that can be moved, with the
  stop in words: "Closed", "Half open", "Open".
- Keys on the handle: arrow up and down to the next stop, Home to peek, End to full, Enter and the space bar
  as a press.
- What is in the sheet scrolls inside it.

## Option card (stringing options)
Row 52 high, radius `radius-row`. Letter badge 26, title (Recommended, or the verdict), one mono line
"series x strings, kWp, DC/AC", energy at the right in `type-mono-touch`, then the status mark. Selected: as the
selected card. "Add your own" is a dashed quiet button. With no options because the roof holds too few positions, yet
one string fits on it, the button stands under the engine's words, its fields set to that string
(the board "UI fixes · Your own when the roof holds too few positions").

## Series range bar
Track 8 high in `color-well`; feasible band in `color-ok` at 55 %; chosen length as a 4 px accent marker with a
halo; labels under the ends in `type-unit` ("14, MPPT minimum", "29, Voc limit"). The verdict follows with a
tick or a note and the engine's sentence.

## Loss chain
Grid of label, editable input (where the step is a user input), change in %, track, running total
(`columns-loss-chain`). Rows 29 high; totals 32 high, Geist 600, with a 2 px marker on the track. Bars 12
high, radius `radius-swatch`, gain and loss colours; a step of nothing a tick of 1 in `data-zero`. A legend
names gain and loss and says that boxed values can be changed. The labels are the engine's, word for word.

In code: `LossChain`, of rows `LossRow`; the bars in `lib/performance/cascade.ts`, the fields in
`loss-fields.ts`, the rows' words in `loss-chain.ts`.

- The track is a cascade on one relative scale: each bar runs from the running total before the step to the
  one after, in percent of the GHI chained through the steps (the energy steps continue from where the
  irradiance ended), fitted to the extremes of the run, with 10 px free at the left of the track and 7 at the
  right. A bar is 2 px wide at the least.
- A step that is the user's has its field in the second column, 22 high (Number field, "inside the loss
  chain"); the rear gain a Switch. A field that is empty for its default says the default inside itself
  ("PAN 0.2 %"); entered, the line under the row says the default and gives the field back ("PAN gives 0.2 %",
  "Use the PAN's"). What a field says of an entry it changed stands in the same line under the row. With a
  monofacial module the switch cannot be used and the line under the row says why.
- On tablet rows are 44 and totals 48, bars 14, the field 40 (`columns-loss-chain-tablet`). On phone a row is
  the label on a line of its own, then the field at the left (44 high) with the change and the running total
  at the right, then the track across the width (`columns-loss-chain-phone`).
- The whole row is the target of the pointer and takes surface-2 under it. A readout in the tooltip's look
  stands 8 over the middle of the row: the running total with its unit and the change on one line, the label
  under them in text-2. It comes after 400 ms under the pointer, at once with the keyboard focus in the row's
  field, and on a tap; it goes with the pointer or the focus leaving, with Escape, and with another tap. It
  is never the only place: the row says every figure itself.
- While a run is on its way the figures and the bars are dimmed (`opacity-updating`); the labels and the
  fields stay as they are.

## Assumptions (Performance)
The card "Assumptions" (the boards "Performance" and "Weather and assumptions"): every assumption a field in a
chip, the chips wrapped with 8 between them. Chip: height 34 (44 on tablet), padding 0 6 0 12, `control`,
border `line-strong`, radius `radius-chip`, text 13 (15 on tablet), `shadow-raised`; the label in text-2, then
the field (Number field, "inside a chip"), its unit after the value. The thermal Uc is empty while the roof
type's holds and a caption in text-3 says it ("29 W/m²K by roof type"); entered, a quiet press of 26 gives it
back ("Use the roof type's"). The exceedance levels are three fields of 40 in one chip, each with "P" before it
in mono and a dot between them; on commit they are sorted and each kept once. The grid CO₂ factor says its unit,
t/MWh.
On phone the assumptions are rows of 52: the label at the left with its caption under it, the field at the
right, 44 high, 132 wide (148 for the CO₂ factor, 52 for each level).

In code: `Assumptions`, of fields `assumption-fields.ts`. The card stands before the summary, and when the run
has no options under the API's words: the assumptions are inputs and can be set before (decision 15).

## Timeline (Sun view)
Floating bar 64 high, `surface-1`, border `line`, radius `radius-bar`, `shadow-float`: round play button 44, time
in `type-title-touch` over "solar time", the slider of the time over the day's hours with the
shade-free window filled in accent, handle at the time, ticks at sunrise, the window's ends (text-2), noon and
sunset; sunrise and sunset stand from the ends of the track inward ("06:33 sunrise", "sunset 17:27"). On tablet
they stand beside the track instead, their time over their word, after a line of 36. On phone the timeline is
the top of the sheet, without the bar: play and the time with "Shade-free 09:00 – 16:00" at the right, the track
under them with ticks at sunrise, noon and sunset. The boards "Studio, Sun lens" and "Time on the stage".

- The time is held to the day's hours, sunrise to sunset taken to the quarter hour inside them; a step is a
  quarter hour, Page Up and Page Down an hour. The light follows the handle live; the time is the view's, not the
  design's.
- Play moves a quarter hour every 250 ms to sunset and stops; Play at sunset begins at sunrise; under reduced motion
  an hour a second. A drag, a key or Pause stops it; while it plays the button is Pause, two bars of
  `--stroke-pause`.
- Keys in every step, not while a field, a slider or a menu has the focus: `,` and `.` an hour, `[` and `]` a day.
  The tooltip of the track names them (`Tooltip` with `shortcuts`).
- A day the sun stays up or down runs from 00:00 to 24:00, and the line under the time says which.

## Sun path on the stage (Sun view)
The board "Sun path and shadow outlines". The day's positions of `/sun` on a dome of 1.3 times the roof's radius about
its centroid, from the horizon at sunrise to the horizon at sunset: a line of 2 px in the scene's `sun` (1.5 on phone),
the shade-free window's part 5 px (4 on phone), unlit. The marker at the view's hour is DOM placed by projection: a
disc of 20 (14 on phone) in the accent with a core of `sun-core` half its size and the glow `halo-sun`. Hour marks on
tablet and desktop: a ring of 10 at sunrise and sunset on the horizon, at the window's ends and noon on the arc, each
with a chip in the look of the stage's labels ("06:33 sunrise", "09:00", "12:00", "16:00", "sunset 17:27"). The
marker's callout ("16:00 · end of the shade-free window", "Sun 18.0° high, 56.6° W of south") stands to its right,
to its left past 60 % of the stage, under it while the marker is in the stage's top 140, and only while the marker
is on the canvas; the mark at the marker's hour gives way to it; the callout of what is selected wins over it.
Nothing is drawn below the horizon. In the Sun view alone, while the switch Sun path is on; the window's part while
Shade-free window is on.

## Shadow outlines (Sun view)
The engine's shadows of the parapet and the obstacles on the roof surface at the view's time (`/sun` with `shadows`,
the roof alone), dashed in `keepOutLine` without a fill, on the roof under the modules and over the rendered
shadows: where the two agree, the view is true. Asked once the time has stood still for `TIME_REST`, shown only while
the time is the one they are of; off at first.

## Shade map (Sun view)
The board "Shade map". The Sun view's tab Shade map colours the glass of every position by its near shading over the
year (`Shading.near_pct_by_module` of the design run), in the five steps of `--color-shade-1` to `-5` from 0 to the
next round value over the largest loss (1, 2, 5, 10, 20 %); the frames stay. Only while the run is of the layout
shown; otherwise the modules are their blue and the legend says "The shade map follows the design run" with the
ring. The legend on the stage, 12 over the timeline (at the stage's bottom left on phone): "Near shading over the
year", five swatches of 40 by 10 (24 on phone) with the marks of the scale under them, the unit after the last
("0 1 2 3 4 5 %"; on phone the ends alone), and "Of all 790 positions". The inspector in the tab: what the map
colours ("Select a module for its value", "Tap" on touch) and each step with its range and its count, then Shading
over the year. A module selected says its loss and its string's: "Position 423 · row 4", "Near shading 3.57 % over
the year · string S12, 5.00 %", or "· not used by option A"; without an option no string. Leaving the Sun view takes
the map off.

## Strings on the roof (Strings step)
The boards "Strings on the roof" and "Studio, Strings lens" on three sizes. The Strings step colours the glass of
every position by the chosen option's strings (`system.strings` of the design run): by string, by MPPT (at first)
or by inverter, in the series colours in their fixed order; the positions the option does not use `moduleUnused`;
the frames stay. Only while the run is of the layout shown; otherwise the modules are their blue and the legend says
"The strings follow the design run" with the ring. Leaving the Strings step takes the colours off.

The colour switch is a Segmented control "Colour the strings by": String, MPPT, Inverter. On desktop it stands with
the legend in a card of 48 (`surface-1`, border `line`, `radius-card-s`, `shadow-float`) at the stage's bottom left,
12 over the time pill; by string the legend takes a second line under it, after "By string: six colours in turn
along the rows". On tablet the card is 384 wide at the bottom right, 28 over the stage's bottom, the switch filling
it, the compact legend under it. On phone the switch is the first thing of the Strings inspector in the sheet, and
the compact legend stands at the stage's bottom left, 28 over its bottom. The legend has one entry per series colour
(D92): by MPPT "MPPT 1" to "MPPT 6", and from the seventh the MPPTs of a colour together ("MPPT 1 · 7"); by inverter
"INV-1", "INV-2", the same way ("INV-1 · 7"); by string the six colours, each with the strings it marks ("S1 · S7 · S13
· S19"); past four in a colour the first three, an ellipsis and the last ("S1 · S7 · S13 … S43"), the screen reader's
words naming them all; then "Not used" while positions are not used. Compact: "MPPT" (or "INV") and the numbers of each
colour close beside its swatch ("1·7"), or the strings as the entries name them; the rule and "Not used" keep to the
line of the last colour. On desktop the card is held 24 from both sides of the stage, as wide as its legend, and wraps
within the stage. Swatches of 12 (10 compact), radius 3; the words text-2, never a series colour.

Each inverter of the option is a small box on the roof in `inverterMarker` where the engine places it, with a chip
"INV-1" over it (accent, `accent-ink`, mono 11, `radius-xs`), placed by the Projector; a chip that would cover an edge
label moves off it by the smallest shift, up before sideways (`chip-place.ts`). On a pointer device the
pointer over a used position traces its string: its glass `stringSelected`, every other position mixed
`DIM_TOWARD_STAGE` % toward the stage, a line of 2 in white on a casing of 4 in the stage's colour through its
modules in the order they are wired. A press selects it, a tap on touch: the callout says "String 12 · INV-1, MPPT 3"
with a swatch of the string's colour of the moment, and "29 modules · Voc cold 1,480 V · 93 m of cable" in mono from
the cable schedule; its line and dot in the accent. Escape clears it. A press on a position not used selects the
module. The text equivalent says the strings, what they are coloured by with each colour's strings, the positions
not used, the inverters and where, and the string selected.

## Shading over the year (Sun view)
Four stat tiles, two to a row: Near, linear; Electrical, beyond linear; Far, horizon (in %); Kept clear (m²). With an
option they are its loss chain's ("Of the 638 modules of option A"); without, near and far over all positions ("Of
all 790 positions") and Electrical says what it waits for, in the API's words. Under them the engine's note on the
horizon as it says it. Before any run, skeletons on the tiles.

## Time pill (every step)
The time on the stage of the Roof, Array and Strings steps, as the approved Array boards draw it: a pill of 44
(48 on tablet), `surface-1`, border `line`, `shadow-raised`: round play 32 (36 on tablet), the day and the time in
mono ("21 Dec · 10:30"), a short slider of the time (180, 200 on tablet) filled to the time, and "solar time" on
desktop. Desktop at the bottom left over the vitals, tablet at the bottom left of the stage. On phone it is the
play button alone, at the top left of the stage, `control`: a press plays and pauses; the time is moved on the
timeline of the Sun view. In the Sun view the timeline stands instead, on tablet and desktop.

## Find's first step (D85)
The panel of Find before a place is found (`components/find/FirstStep.tsx`, the words in `lib/outline/first-step.ts`).
Under the title and lead, three sections in the section headings' look, no ? on them (the ? stands beside the title):
**Start here**, the ways to start as cards 52 high in the roof type's look (`bg-control`, raised, the icon 18 in the accent,
a chevron at the right): Search for the building focuses the search over the map, Use my location does what the button
beside the search does, Enter dimensions by hand opens the entry by hand; **The search understands**, four rows (44 on
touch, 36 on desktop) of a name in `type-body` and its example in the figures' mono, a press puts the example into the
search, which reads it back under the field; **Three steps**, the help's step marks (24), the first lit in the accent, the
others `surface-2`. Without a map only the card by hand and the steps in its words. The floating search takes
`border-accent` while it holds the focus.

## Map outline tools (Find and outline)
Corner handle 18 (22 on touch), white with accent border; the corner being edited pulses. Midpoint handle 10,
accent. Edge label: mono 13 on `color-ground`, radius 7. Outline: 2 px accent, fill accent at 9 %.
Toolbar: floating, radius 18, the active tool is a primary button.

In code (`apps/web/components/find`): `OutlineLayer` draws on the map (MapLibre layers painted in the tokens of
the container; handles, midpoints and labels as markers), `OutlineTools` is the toolbar, `OutlinePanel` the
edges, the switch and the tiles, `RoofTypeChoice` the roof type (cards on desktop, a segmented control on
touch), `DetectedCallout` the callout of Detect building. Every rule of drawing is in
`apps/web/lib/outline/outline-state.ts`, a reducer.
- Every handle takes a press of 44 by 44 around it; the tools have one name on every size, the word shown may
  be shorter on phone. The phone has no zoom buttons and no scale bar; its toolbar shows Corners, Rectangle,
  Detect and Undo.
- The handle that turns a rectangle stands 44 px above the middle of its top edge, on a stem; the turn snaps to
  north within 3°.
- On a coarse pointer a corner dragged has a loupe of 104 px, 92 above the finger, twice the imagery, a cross at
  the corner.
- The footprints that are known show at `--opacity-hint` while Detect building is the tool, with "© Overture
  Maps Foundation, ODbL" under the imagery's attribution; the callout stands at the press.
- The map says `aria-busy` while it moves; the panel's title and lead follow the step and the tool.
- The toolbar follows the state of the roof (the board "Obstacles on the map and their heights"). While the
  outline is open it holds Corners, Rectangle and Detect building; once it is closed it holds the four obstacles,
  Box, Tank, Wall and Building, with Box in hand. Undo, Redo and Clear stay; Clear takes the obstacles with the
  roof, and the outline opened again brings the outline tools back. A box is dragged across the thing and kept a
  rectangle when a corner is dragged; a tank is dragged from its middle to its edge; a wall is pressed point by
  point and ended by a press on the last point or Enter; a building beside the roof is pressed corner by corner and
  closed on the first. Each asks its height right after, in a dialog (a sheet on phone): the name of its kind
  suggested, the height empty, Remove takes the shape off the map.
- Obstacles are drawn light over dark (`--color-obstacle-line`, `--color-obstacle-fill`), so that the roof stays
  the amber thing on the screen; the selected one and the one being drawn are accent. Each carries a label with
  its name and its height under its lowest point. The selected one has handles: its corners, or the edge of a
  tank; Delete removes it. The panel lists them under the measurements, "Obstacles · n", each with its size (a
  box by its sides, a tank by its diameter, a wall by its length, a building by its area) and its height, a press
  on a row selects it, Remove takes it. The card of the Roof step counts them. In code: `ObstacleList`,
  `HeightDialog`, the obstacles in `lib/outline/obstacles.ts` and the reducer.

## Move and turn the roof and its obstacles (Find's map) — approved, built
The boards "UI fixes · Move and turn the roof and its obstacles" (D79). Once the outline is closed, a press inside the roof
(not on a corner) picks it up whole: the line 3 px with a glow, the fill a shade stronger; where it was stays dashed until it
is let go. A drag moves it and its obstacles, the label saying how far ("1.6 m E · 0.6 m S"); the arrow keys nudge 0.1 m, 1 m
with Shift. The turn handle (32 round, 44 on touch, the turn icon, on a stem of 44 square to the north edge's middle) turns it
about its middle, snapping to north within 3°, the label saying the turn and where it faces ("6.0° · faces 186° S"); the
panel's Faces follows. Each move or turn is one step of Undo. An obstacle picked on the map moves by a drag inside it (0.1 m,
kept on the roof), and a box or a building has the same turn handle north of it; a tank and a wall only move; its corners
still size it. On touch one finger inside what is picked moves it, two fingers move the map; handles take a press of 44. On desktop the handles of an obstacle picked take a press of 24, so that a press inside a small one (a tank of 2.5 m is about 30 px across, zoomed in twice) moves it rather than sizing it; a tank moves and is sized by its one edge handle, never turned.
Cursor: an open hand over the Studio's stage and Find's map at rest with nothing in hand, a closed hand while either is
dragged; the crosshair while a drawing tool is in hand; over an obstacle or a handle, theirs. Tips: a card at the map's edge
(`surface-1`, border `line-strong`, radius 14, `shadow-float`), its title with an accent dot, two to four rows of a key
or gesture in a bordered chip and what it does, Got it; one at a time, when a move becomes possible, never over what is
moved; Got it closes it for good on the device, it goes by itself once its move is done; the toolbar's ? shows them again.

## Help disc and help sheet (the in-app help, D80)
The boards "In-App Help · The ? and the help sheet" (the canvas page "In-App Help"). Help on what a section of an input panel
is, its choices and what they do, in the app's own words; the core is solarlayout's `packages/help` (topics in MDX keyed by
their path, a typed manifest, a gate of tests), the look and the places ours.

**The disc.** Beside a section heading, 6 after its words, vertically on their middle (V2, D94: quiet). A ring of 20 in `line-strong`, no fill, a ? in `text-3` drawn as a stroke of 3, in a press of 24 on desktop and 44 on touch. Hover lifts the ring to `text-3` and the ? to `text-2`; the focus ring is the app's. While its topic is shown it rings in the accent: the ring and the ? in `accent`, with a ring of the accent at 45 % two away (`shadow-help-held`). In code its look is `help-disc-look.ts`. A disc is drawn only where its topic exists (its key is a type). A real
button: "Help: <title>", `aria-haspopup="dialog"`, `aria-expanded` while its topic is shown. On a pointer device the Tooltip
"with a summary" says the topic's summary and "Click for more"; touch has none, a press opens the sheet.

**The sheet.** Desktop and tablet: from the right edge, the whole height of the window over the top bar, 420 wide,
`chrome`, a line of `line` on its left, `shadow-drawer`; the screen under it dimmed (`dim`) and waiting. Phone: from the
bottom, the whole height but 48, `rounded-t-panel`, with the grip. It comes and goes as the drawers do (`drawer-motion`); it
holds the focus; Escape, the ×, a press beside it close it, and the focus goes back to the disc.
- The head, 48 high, a line of `line-subtle` under it: Back (‹, quiet, only once a link was followed), where it was opened in
  `type-body` `text-2` ("Section · Strings lens"), Close (×).
- Then, 20 in, 18 down, with 16 between: the title (`type-title`, `type-title-touch` on touch, in `text`; D94), the summary (`text-2`); for a
  one-choice section its options in a bordered list (`radius-row`), each its label (500) and what it means (`type-body`,
  `text-2`), the section's own on `note-surface` with "Your choice" (`accent` on `accent-ink`, 11 at 600), or the words the section
  gives of who set it (the system voltage: `Set for India`, `Set by the app`; D87, #159); the body: headings
  (`type-section`, `text`), words (`text-2`), the user's own on-screen words in mono on `surface-2`, a note (`note-surface`, the note
  mark), a link to another topic in the accent, underlined; while the body loads, three lines of skeleton; when it cannot
  load, "This part of the help did not load. Check the connection and try again." and Try again. Then "Related" (a section heading:
  `type-section`, `text`) and a row per topic: its title (500), its summary in two lines at most (`type-body`, `text-2`), a chevron.
  Last, "In the docs" (the same heading) and one row: a book (18, light), the docs page's title (500), the section under it
  (`type-body`, `text-2`), and the mark of a link that leaves the app (`external`, 16, `text-3`); it opens the docs at that section
  in a new tab (D91, the boards "UI fixes · The docs from the app").
- A related topic or a link opens in the sheet; Back returns, as many steps as were taken; a disc pressed starts afresh.
- The topic shown is in the address (`?help=<key>`), read when the page opens, so a shared link opens it; nothing else of the
  address is touched.

In code: the topics in `apps/web/content/help` (one `.mdx` each, its key its path: place.kind.name), `bun help:gen` writes
`lib/help/manifest.gen.ts`, the gate is `tools/help/content.test.ts`; `components/shell/help`: `HelpProvider` (once per screen:
the shell and Find), `HelpDisc`, `HelpSheet`, `HelpBody` and the components a body is drawn with (`help-kit.tsx`).

## How-to steps and pictures (in a help topic, D81)

A how-to in the help sheet: numbered steps, each with a picture of the app and callouts on it (the boards "In-App Help ·
How-tos with pictures").

- **Steps:** an ordered list. Each step: its number in a mark of the accent, 24 (`accent` on `accent-ink`, `type-unit`
  at 600, `shadow-primary`), a line of `line` 1 wide down from it to the next step; beside it, 12 apart, the step's title
  (600, `text`) and, 8 under it, its words (`text-2`) and its picture. 24 between steps.
- **Picture:** the app as it is (`docs/help-content.md`, "Pictures"), the width of the step's column, its height by its
  own proportions; `radius-row`, a border of `line`, on `surface-2`. Over it, at most three callouts: a mark of the accent,
  20, at the place, its number in it; where it marks what to act on, a ring of 40 round the place (2 of `accent`,
  `shadow-help-ring`) with the mark at its lower right. Under the picture, 8 apart, the callouts' words, each after a mark
  of 16 with its number (`type-body`, `text-2`). The picture has its words for a screen reader; the marks are not read,
  their words are.
- **Opened large (touch):** on phone and tablet a picture is a button, a magnifier in a round chip of `surface-1` at its
  lower right (28, `shadow-float`). Pressed, it opens over the sheet, the whole screen on `ground`: a head with "Pinch to
  look closer" (`type-body`, `text-3`) and ×; the picture the screen's width, in the middle, pinched up to three times and
  moved with a finger, its callouts scaling with it; their words under it. × or Escape returns to the step, the sheet as it
  was.
- **Pointer and touch:** a step says what the hand in use does, the words of a mouse where the pointer is fine, of touch
  where it is coarse; a key or a gesture in the chip of the tips (`radius-xs`, a border of `line-strong`,
  `type-unit` at 600).
- **The ways in (Find):** a ? disc beside the panel's title (6 after its words) opens the how-to of what the hand can do
  now: with the roof open, the outline tool in hand; closed, the obstacle tool in hand; the roof picked, moving it; an
  obstacle picked, moving it (`lib/outline/how-to.ts`; the first that has a topic, none while none has). A tip's Show me how
  opens its move's. A how-to of Find ends with "Show the tips on the map again".
- **A clip (Phase 15; the boards "In-App Help · Clips"):** a picture may play a short clip of its step in its frame. At rest
  it is the picture, its callouts and their words, with a play button of the accent in its middle (48, `shadow-primary`, the
  play icon in `accent-ink`) and the clip's length in its lower right (`type-unit` on `ground` at 80 %); nothing of
  the clip loads until it is pressed. Pressed: a ring in the button while it comes; playing, muted and looping, a line of
  the accent along its foot shows how far, and a press pauses it; the callouts step aside while it plays, their words stay
  under it. Paused: the play button again. Failed: the picture and its callouts, an exclamation mark in the button, and
  "The clip did not load. The picture shows the step." (`type-body`, `text-3`). Under `prefers-reduced-motion` it plays
  once and stops on its last frame, play again. The whole frame is one button: "Play the clip: " or "Pause the clip: " and
  the picture's words. On touch, a magnifier in a round chip of `surface-1` at its upper right (28 in a press of
  44, `shadow-float`; "Open the clip larger: " and the picture's words) opens the clip over the sheet at the width of the
  screen, as a picture opens large: playing from its start, pinched to look closer, its callouts' words under it; × or
  Escape returns to the step.

## Tip (a card of help over the map, D79)
A small card that shows how to do a move the screen has just made possible (the boards "UI fixes · Move and turn the roof
and its obstacles"). `surface-1`, border `line-strong`, radius `card-s` (14), `shadow-float`, padding 14 (12 under), rows 10
apart; 300 wide on desktop and tablet, the width of the sheet on phone. The head: an accent dot of 8, the title
in 14 at 600, and a quiet close (×) at the right, a press of 44 on touch. Two to four rows, each a key or a gesture in a
bordered chip (`line-strong`, radius 6, 11 at 600, at least 62 wide, centred) and what it does in 13, `text-2`. The foot:
Show me how at the left where the move has a how-to (D81: a link in the accent, `type-body` at 500), Got it, a secondary
button, small, at the right.

- One tip at a time. It shows when its move becomes possible, and never over what is moved: on desktop and tablet at the
  map's edge, top left under the search (20 in, 88 down); on phone at the top of the sheet, under the lead, the width of the
  sheet. The phone's map above the sheet is about 460 high, and a card of four rows took half of it, the roof with it (the
  owner left the phone to the best sense, session 19; the board drew the card floating above the sheet).
- **Got it** closes it for good on the device (localStorage, a per-viewer convenience; a storage that refuses only means it
  shows again). It also goes for good by itself once its move is done. The × hides the tips, this one and those after it, until the screen is opened again
  or the ? is pressed.
- The toolbar's **?** ("Show the tips") shows them again, from the first. On phone, where the toolbar has room for Undo
  alone, the ? disc beside the panel's title opens the how-to of what the hand can do now (D81), and each how-to of Find
  ends with "Show the tips on the map again", which closes the help and shows them.
- **Show me how** opens the how-to of the tip's move in the help sheet (D81).
- It is a `role="note"` with its title as its name; Got it and × are buttons; it takes no focus when it appears.

Find's two tips, the words by device (a press on touch, a click with a pointer):

| Tip | Shows when | Rows (desktop) | Rows (touch) | Done when |
|---|---|---|---|---|
| Move or turn the roof | the roof is closed | Click · inside the roof to pick it up; Drag · inside it to move it; ◯ · drag the round handle to turn it; ← ↑ → ↓ · nudge 0.1 m, with Shift 1 m | Press · inside the roof to pick it up; Drag · with one finger inside it to move it; ◯ · drag the round handle to turn it; 2 fingers · move the map, as always | the roof is moved or turned |
| Move or turn an obstacle | the roof's tip is gone and there is an obstacle | Click · an obstacle to pick it; Drag · it to move it; ◯ · turns a box or a building; Delete · removes it | Press · an obstacle to pick it; Drag · it to move it; ◯ · turns a box or a building | an obstacle is moved or turned |

In code: `components/ui/Tip.tsx` (the card); which tip shows and when one is done in `lib/outline/tips.ts`; what the device
remembers in `lib/device/tips-seen.ts`.

## Obstacles on the roof (Studio, Roof step)
The board "Obstacle edited on the roof". The obstacles of the document are edited on the 3D roof and in the list of
the Roof step, which share one selection. A press selects (the roof, an obstacle, a kept-clear area, a module);
hover is a lighter outline on pointer devices; Escape clears; the parapet is not selectable. The selected obstacle
has an accent outline (2 px on its silhouette, 1.5 px on the edges of its top), its callout ("Stair room · selected",
"5.0 × 4.0 m · 3.0 m high · drag to move") anchored by the 9 px dot at the middle of the east edge of its top, and
handles: a corner handle (18, 22 on touch, white with an accent border) at each corner of its top for the size, the
turn handle (32 round, 44 on touch, with the turn icon) on a stem of 44 due north off its north edge, the height
handle on a vertical stem of 40 (52 on touch) from the middle of its top. A tank has one handle at its edge for its
diameter. The handles are away while it is dragged; a drag moves it on the roof plane snapped to 0.1 m with the
live place beside the pointer ("East 27.5 m · North 18.0 m") and the old place as a dashed accent ghost; the drop
commits the edit. On phone every handle takes a press of 44 by 44.
The list: "Obstacles · n" with Add; a row per obstacle (icon, name, its size and height in mono), the selected one
open as a card (`note-surface`, accent border, `halo-selected`) with its name editable in the head, its kind and
Remove, and its fields two to a row by its kind (functional-inventory.md, 1.2): a box Length, Width, Height,
Rotation, East, North; a tank Diameter, Height, East, North; a tree Crown ⌀, Height, Crown starts at (a full row),
East, North; a wall and a building their points as the corner table of "Enter dimensions by hand", a wall its
thickness too. "Parapet, all edges · h 0.9 m" is a read-only row at the end when there is a parapet. Add opens a
menu of the kinds (Box, Tank, Wall, Tree, Building, each with the size a new one gets); the new obstacle stands at the
centre of the roof as a dashed accent footprint with the callout "Box 7 · draft", its card open with the Height
empty and the focus in it and the primary "Add the box" waiting: nothing is preselected, it joins the design when
its height is typed; Add then a tap on the roof places it there.

## Enter dimensions by hand (Find and outline)
The way on when there is no map key, no WebGL or no connection, and a way for anyone who has measured the roof
(the board "Enter dimensions by hand"). "Enter dimensions by hand instead", under Build and in the place of the map
when there is none, switches the panel to fields: Place (latitude and longitude, five decimals, north and east
positive, filled by the search or typed), Shape (a segmented control, Rectangle or Corners), then Length, Width
and "Long side faces" (metres with two decimals; degrees clockwise from north, whole), or the corner table (a row
per corner, metres east and north of the middle of the roof, Add a corner, Remove, three at least); then the same
tiles, roof type and Build as for a roof drawn on the map. Nothing is preselected: the fields are empty, the tiles
say nothing and Build waits until the place and the shape are there.

The roof is drawn as it is typed. With a map it stands on the imagery at the place, turned to where it faces, and
its corners are shown, not dragged: the fields are the truth of it; "Draw on the map instead" goes back to the
tools. Without a map the stage draws the plan: north up, on a grid of 10 m, the outline in the accent with its edge
labels, a north mark, the scale bar, and the reason there is no map where the attribution stands. Build sends the
corners in WGS84 about the place, as for a roof drawn, with the source "coordinates": the card of the Roof step
says "Entered by hand". Obstacles by hand come with the Roof step.

In code (`apps/web/components/find`): `ByHandPanel` the fields, `PlanView` the plan, the rectangle and the table in
`apps/web/lib/outline/by-hand.ts`, the roof entered as one event of the reducer (`entered`).

## Import a drawing (the project switcher)
The board "Import with missing heights". A dialog of 440 ("Import a drawing"), one sentence of what is read, the file
drop ("Drop the drawing here", "KMZ, KML or DXF"), a state with the file held before it is read (`surface-2`, border
`line`, the file icon in accent, the name in mono, "DXF · 48 KB · read when the roof is opened", "Choose another"),
"DXF units" as a segmented control m or mm with nothing pressed and at `opacity-disabled` until the file is a DXF, then
m suggested. A DXF holds nothing of where the roof is, and the place sets the sun, the shadows and the weather, so for a
DXF the dialog asks "Place": the search field of Find (an address, coordinates or a maps link), then Latitude and
Longitude, empty, filled by the search or typed, as the roof entered by hand has them; nothing is guessed (the desktop
app put every DXF at its own default). A KMZ or KML carries its place and shows no Place block. "Open the roof" waits
until a file is there, and for a DXF until its place is too. After the import the Roof step\'s card says "From a file · 6
corners · 4 obstacles" with the file name in mono; a note under it (`note-surface`, accent border, the note mark)
carries the engine's sentence "These obstacles have no height in the file and were set to 1.0 m.", "3 to review" and
Review; the open card of an obstacle to review has the hint "Enter the real height. The file gave none; 1.0 m stands
until you do" and a quiet Next in its foot; the rows still to review carry a note mark after their height. A typed
height takes the obstacle off the list; the note goes when it is empty. On the roof what is not yet real is dashed.

## Open a project (the project switcher and Home)
The board "Open a project" (plan phase 10, step 9, decision 4). A dialog of 440 ("Open a project"), one sentence ("A
project saved by this app. It opens in the Studio and runs again here."), the file drop at rest ("Drop
the project file here", "An .rtd file saved by this app", "Choose a file"), Cancel quiet and Open
primary, Open shown as it cannot be pressed until a file is read. A file of another ending is refused in the field in the
dialog's own words, "Choose a project file (.rtd).", without a request. A file dropped or chosen is read at once: the
browser reads it as text and sends it to the API, where the engine's one reader reads it (the web parses no `.rtd` itself,
D7); meanwhile the field is in its reading state ("Reading the file", the ring, the name in mono). Read, the field is the
drop's "Read, kept in the dialog": `surface-2`, the file icon in accent, the file's name in mono, and under it the project's
name from the answer and "Capacity and energy come with the run in the Studio" (for every file: the answer carries no
capacity and no energy, and its format is the current one, not the file's, so no format is shown; the board's "Format 2"
line is not drawn). The engine's notes on the files a format 1 file names without their text stand under the field as rows,
word for word, each on `note-surface` with the border `note-line` and the note mark of 16 ("The module file Test.PAN (PAN)
is not included in this project. Choose it again.", the inverter's, the CSV weather's); nothing is added to them, and
Open stays live. Open keeps the project on this device as a new design under a new id and opens it in the Studio at its
last step with no second request; it runs again there, as the results are never in the file (D5). A file the API refuses
is the drop's "Refused" state at drop time: `note-surface`, the note of 20, "This file was not loaded", the API's words
("The file is not a project file (.rtd): it is not JSON.", "This project file is format 3. This version reads formats 1
and 2. Open it with a newer version of the app."), "Choose another"; Open waits, and the design that is open stays as it
is (D32). An API that was not reached is refused the same way with Try again under the field, which reads the same file
again. A second file chosen replaces the first, whatever the first's answer. On phone the dialog is the bottom sheet of
"Dialog". It is pictured over the Studio (`home-open-project*.png`); Home opens the same dialog from its row.

In code: `OpenProject` (`components/shell`), opened from the project switcher's row "Open a project" on every workspace
and from Home; `lib/flow/open-project.ts` holds the pure parts (the file by its ending, the request from a `File`, the
lines of a file read, the refusal from an error); the design is kept by `keepAndOpen` of the saving store.

## Choose a module or an inverter (the equipment picker)
The boards "UI fixes · Choose a module or an inverter" and "UI fixes · Where the picker opens" (D75). Change on the module
card (Array step) opens "Choose a module"; on the inverter card (Strings lens) "Choose an inverter". The dialog is the kit's,
wide: 760 on desktop, 680 on tablet; on phone the bottom sheet at its full height, 48 under the top of the screen. In it:
the title, the filters, the count, the list, the file of one's own, the foot; no sentence under the title (the owner: "not
needed").

- Filters: a search ("Maker or model") over the maker as the file states it and as people know it, the model and the file's
  name, and range sliders of the kit, each with its name at the left and its span at the right: the module's Power (300
  to 650 Wp, the library's ends, steps of 5); the inverter's AC power (0.7 to 350 kW, by steps closer at the low end: 0.7,
  1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350), MPPT (1 to 15) and Max DC (the
  voltages the library holds, 420 to 1,500 V). At rest the handles stand at the ends; they may meet, for one value. The
  module's search and slider share one row on desktop; the inverter's search has its own row and the three sliders the
  next (one under the other on phone, where the sliders have no ticks).
- The count ("20 of 119 modules") with "Clear the filters" when a filter or the search is set (`role="status"`).
- The list, a listbox of 52 rows (60 on touch, three lines on phone): the model in Geist 500 with its tags, under it the
  maker as people know it (and the file's data source when one model comes in two files), then the numbers in mono at the
  right. Module: Wp, efficiency %, size m, bifacial (tablet: no bifacial). Inverter: AC kW, MPPT, MPPT V (the window),
  Max DC V (tablet: no Max DC V). Tags: "In this design" for the design's own when it is of the library (the list opens on
  it), "Preliminary" (note colours) for a file its maker calls so. The chosen row: `control-active`, an accent edge of 2
  inside at the left, the tick. A press chooses; the arrows move the choice, Enter uses it.
- Sorting: a head of a column that holds one value is a button (the table's sorting); the others are words. The list opens
  sorted by power, upwards: Wp (AC kW) is the active head with its arrow up. A first press on another head sorts the figures
  downwards and the names A to Z; a second turns it; a third gives the order by power back. A head that sorts and is not
  active has a quiet mark of up and down (12, text-3). On phone, with no heads, a select beside the count holds the orders.
- Nothing found: in the list, "No inverter in the app matches “huawei”." and how to go on, with "Clear the search".
- The file of one's own: a slim drop of 52 (60 on touch) under the list, dashed `line-strong`, "Or drop a PAN file of your
  own here" and "Choose a file"; on phone a secondary button "Choose a PAN file of your own" under the primary action. The
  file is read as the old Replace read it, and refused the same way.
- The foot: the chosen file's name in mono at the left, Cancel (quiet), "Use this module" (primary), which waits until a row
  other than the design's own is chosen. Used: the ring and "Reading" in the button while the API reads the file; the dialog
  closes when it is read. Refused (it should not be: the catalog was written by the same reader), a note under the list in
  the engine's words; the equipment of before stays (D32).

In code: `EquipmentPicker` (`components/studio`) with `ModulePicker` and `InverterPicker`; `lib/equipment/` holds the pure
parts: the catalog's types and its fetch, the filters, the search, the sorting, the scale of the AC power, the makers.

## Home
The boards "Home" (desktop, approved in round 1), "Home · tablet 834" and "Home · phone 390" (plan phase 10, step 11,
decision 5). Outside the shell: no top bar; the logo and the name at the top left on every size (`Logo` with
`wordmark="always"`), 72 high (56 on phone), the page's padding 64 on desktop, 24 on tablet, 16 on phone. The headline in
`type-display` ("Find your roof." and "Design it in 3D." on two lines; `type-title` on phone), the subtitle in `type-body-touch`
(`text-body-touch` on phone), text-2. The search is Find's own `Search` in its look `hero`: a well of 76 (`color-well`,
border `line-strong`, `radius-bar`, `shadow-well`; the accent line and the halo with the focus inside) with the primary
action "Find my roof" inside it at the right, 56 high (`xl`), an arrow after the label; on phone the well is 56 high and
the action stands under it, as wide as the well, 48 high. "Find my roof" is a link to `/find` while nothing is typed, so
that it leads there by itself; with words typed it searches them and the places found come under the well as in Find;
coordinates or a maps link typed, or a place taken from the list, lead to `/find?at=<lat>,<lon>` (and `&place=<label>` for
a place found by words, so that the design is named after it, D49), where Find begins as if the place had just been found
there: the map at roof zoom, "Outline the roof".

What the search reads (the board "UI fixes · Coordinates in the search", D68; Home, Find and Import a drawing alike):
decimal degrees with a minus or the letters of the compass; degrees, minutes and seconds as Google Earth copies them, with
typographic marks, the letter first or spaces for the marks; degrees and decimal minutes; the longitude first when its
letter says so; decimal commas; a maps link. As soon as the text reads as a place, one row under the field says where it
lands (the pin, "12.91409° N, 77.49199° E", the fact "Coordinates"), marked; Enter, the primary action or a press on it
goes there. What looks like coordinates (numbers, marks, letters of the compass, signs and separators only; whole numbers
with spaces alone are a postcode, and words) is never sent to the address search: on Enter it says why it cannot be read,
with the note's mark, in one note under the field: minutes or seconds past 59, a latitude past 90° or a longitude past
180°, two of a kind, one alone, a minus its letter contradicts, a part that cannot be read. An unlettered pair whose first
is past 90° offers the swapped place as a row ("Swapped"), which Enter takes. The geocoder's own error is said as "The
address search is not available right now. Paste coordinates or a maps link instead."

Beside the search (the boards "UI fixes · My location and Search on every size", D78): on Find, one place at the field's
right, on every size: before anything is typed, Use my location, the square of 48 (`surface-1`, border `line`,
`radius-card-s`, `shadow-float`; its tooltip "Use my location" on desktop); with something typed, Search, primary, 48 high,
which does what Enter does; once a place is found, nothing. On Home the well holds Use my location, a quiet icon of 44,
before Find my roof, while nothing is typed. In code: `besideTheField` in `lib/places/beside-the-field.ts`.

Under the search two rows of 76 (`surface-1`, border `line`, `radius-bar`,
an icon of 22, the title in `text-title`, a line in `type-body` text-2): "Import a drawing" ("KMZ, KML or DXF with the
roof and its obstacles") opens the dialog of the import, "Open a project" ("A saved .rtd file, from this device or a
colleague") the dialog of the project file; both are buttons.

The demo's card (`surface-1`, border `line`, `radius-card`, `shadow-card`, padding 18 by 22): "Demo project" in
`type-body`, the name in `text-title`, the roof's words in `type-body` (the name and the roof of `GET /demo`, the words
by `roofWordsOf`, as every card says a roof), then Capacity and Energy, year 1 as stat cells, and "Open the demo", a
secondary button of 44 with an arrow. The capacity and the energy are the engine's numbers of the untouched demo's run on
this device, remembered under one key of localStorage when that run lands (`lib/device/demo-run.ts`); until the demo has run
here they are absent and "Capacity and energy come with the run in the Studio" stands in their place (decision 5: nothing
is typed). Open the demo hands the demo document to the flow, which opens it without a second request, and leads to the
Studio's last step: one press from a cold start. While the demo is on its way the card holds skeletons; a demo that does not
come says the API's words in the card. On phone the card is stacked: the words, the two numbers side by side, the button as
wide as the card.

"On this device": the label in `text-section` text-3, then "Designs you save appear here. Your designs are kept on
this device." while nothing is kept, "Your designs are kept on this device." once something is, then the cards
(below). On desktop the section stands at the foot at the left and the demo's card at the right while nothing is kept;
with cards, the demo's card stands at the right over the section, which takes the width. The 3D illustration of the board
(`HomeIllustration`, the board's own markup, its colours the tokens `--color-scene-*` and `--color-module-*` that mirror the
3D palette) stands at the right on desktop behind nothing, as a strip under the subtitle fading into the ground on tablet,
and not at all on phone. Home shows the toasts of the app (a design that could not be opened, a copy that could not be
saved) in its own `Toaster`.

In code: `Home`, `DemoCard`, `OnThisDevice`, `HomeIllustration` (`components/home`); `lib/home/home-view.ts` holds the
pure parts (the demo's card from the document and the remembered run, the words of the section); `lib/routes.ts` the address
of Find with a place (`pathOfFind`, `placeOfFindAddress`).

## Design card (Home, "On this device")
The board "Home, designs on this device" (plan phase 10, steps 12 and 13, decisions 6 and 7). A card of the compact kind
(`surface-1`, border `line`, `radius-card`, `shadow-card`, padding `space-card-compact`), three in a row on desktop, two on
tablet, one on phone. Its tile is the thumbnail: the plan of the kept layout as an SVG of 320 by 180 in its own units
(`lib/device/thumbnail.ts`, drawn with the maths of the plan without WebGL: the roof on `surface-2` with the accent line,
the setback dashed, the kept-clear areas, the obstacles in text-2, the modules in `data-gain`, north up, 3 m of ground
about the roof), kept with the design and written again when a layout lands; a record kept before there were thumbnails
shows the plan of its roof alone. Under the tile the name in `text-title`, the roof's words in `type-body` text-2, the
capacity and the energy of year 1 as stat cells, or in their place what they wait for ("Waiting for a system voltage"
before one is chosen, "Not run yet" after; never a figure), and "Edited …" in `type-body` text-3 ("Edited just now",
"Edited 2 hours ago", "Edited yesterday", "Edited 24 Sep 2026"; `whenOf`, against the time the saving store last made its
list). The tile and the name are buttons that open the design: it opens from the device and runs again, in the Studio at
its last lens. A menu button of 32 (an `IconButton` "Menu", the icon `more`) stands at the top right of the tile; its list
is the switcher's: rows of 44 (52 on touch) with an icon of 18 and a fact at the right, 240 wide, its right edge in line
with the button's (a bottom sheet on phone and tablet): Open, Rename, Duplicate, Save a copy (.rtd), Delete. Rename turns
the name into the text field in place (the name's rules: trimmed, 200 at most, an empty name refused with "A name is
needed" under the field), Enter or leaving the field commits, Escape gives the name back; the committed name is the
design's on the device and, for the open design, an edit of the document. Duplicate keeps "Copy of <name>" under a new id
and opens it at once. Save a copy asks the API for the project file of that design's document as it is and saves it under
the API's name; a failure is a toast with Try again. Delete asks in a dialog with the board's question word for word
("Delete <name>?", "It is kept on this device alone."), Cancel with the focus so that Enter by mistake does no harm, Delete
the primary action; the open design deleted stays open, not kept any more, and its next edit keeps it anew.

In code: `DesignCard` and `OnThisDevice` (`components/home`); `lib/home/cards.ts` holds the pure parts (the cards, the
newest edited first; the copy's name; the question); the saving store does `rename` and `remove`, `keepAndOpen` the copy,
the downloads store `saveACopyOf`; the menu's rows and keys are `components/ui/list-look.ts` (`MENU_ROW`) and
`components/ui/menu-keys.ts`, shared with the project switcher.

## Deliverable row (Handover)
Row 64 high: format badge 44 by 28 (accent for the selected row), title, one line of facts, then a download
icon (file) or a chevron (opens a view).

## Paper preview
The design report's pages as the engine draws them, the same drawing as the PDF (plan/phase-09-plan.md, decisions 4
and 5; the boards "Handover" on three sizes). The paper: `color-paper` sheet, radius `radius-xs` (6), `shadow-panel`,
as high as the page it shows; the page's image at the paper's width with the answer's own size, so that nothing jumps
while it loads. The thumbnails are buttons, each the page scaled into a slot with its caption under it; the current one
(`aria-current`) has the accent border on `surface-2`, the others the `line` border; the name of each is "Page 2,
Layout". On desktop they stand in a column of 132 at the right of the paper, 8 apart, the slot 70 high, the caption
"2 · Layout"; on tablet in a row of 72 under the paper, 6 apart, the slot 45; on phone in a row of 56, 4 apart, the
slot 35, the number alone in mono, a row that scrolls sideways if it must. Previous and next are secondary icon buttons
of 40 (44 on touch), dim and `aria-disabled` at the ends: on tablet and desktop in the head before the primary action,
with "Page 1 of 6 · Summary" after the facts; on phone under the paper, with the words between them. Left and Right on
the focused paper or thumbnails turn the pages; on the thumbnails the focus follows.

States: while the pages come, a breathing block of the page's shape (`aspect-paper`) and six thumbnail skeletons; the
head's buttons dim until they are there. A failure: the API's words under the head with Try again, no toast, since
nothing was pressed. An edit of the document asks the pages again; the ones of before stay, dimmed
(`opacity-updating`), until the new ones come.

In code: `ReportPreview`, `PageButton` and `ReportSkeleton` (`components/handover/ReportPreview.tsx`); the page, the
words and the bounds in `lib/handover/report-view.ts`; the pages kept per edit in `lib/stores/downloads-store.ts`.

## Fact rows (Handover)
What a file holds, as rows of a name and what it is, under a section's title (the board "Handover, previews": the
layers of the DXF, what is in the KMZ and what is not, the columns of the CSV). The title in `text-section` text-3,
then a row of 28 for each fact with a line `line-subtle` under it: the name at the left in a column of its own (168,
200 or 220 wide, as the board draws each list), what it is in words in text-2. A name that is the file's own (a layer,
a placemark, a column) stands in mono 13; a name in words (the "Not in the file" rows) in Geist. A caption may follow
the rows in `type-body` text-2 ("R2010 · metres · x east, y north"). On phone the words take the next line under
the name. A description list: the names are the terms.

In code: `FactRows` (`components/handover/FactRows.tsx`); the rows of each file in `lib/handover/cad-view.ts`,
`earth-view.ts` and `csv-columns.ts`.

# Round 4

What the boards "Controls, part 2" (`mockups/Controls2.dc.html`) and "Shell states"
(`mockups/ShellStates.dc.html`) draw. Approved on 2026-09-29. Values that are not tokens yet become tokens
with the component that first uses them.

## Select
Trigger: as a secondary button, border `line`, height 40 (44 on touch): label in text-2, the value in Geist
500, a chevron of 16 in text-3. Open: the trigger looks pressed (`control-pressed`, `shadow-pressed`, border
`line-strong`) and the chevron is turned. Cannot be used: opacity 0.45, no shadow.
List: floating, `surface-1`, border `line-strong`, radius `radius-card-s`, `shadow-float`, padding 6, rows 2
apart. Row: height 40, radius 8, padding 0 10; a tick of 16 in accent before the choice that is taken, which
is in Geist 500; one fact at the right in `type-body`, text-3. The row under the pointer or the keyboard is
on `surface-2`.
On phone and tablet the list is a bottom sheet with rows of 52.
`listbox` with `option`; the arrows go through the choices, Enter takes one, Escape closes and gives the focus
back to the trigger.

In code: `Select`. What floats is `FloatingPanel`, which the project switcher uses too; the keys of a list
are in `list-keys.ts`.

- The list is in the top layer of the browser, 6 under its trigger, their left edges in line; over the
  trigger where there is no room under it. It is 320 wide.
- On phone and tablet the panel is a bottom sheet over a dimmed screen (`color-dim`): `color-chrome`, top
  radius `radius-panel`, the handle of 40 by 4. A press on the handle, or a drag of it downwards, closes it.
- Asked to stay floating on touch (`onTouch="floating"`; the Layers panel of the stage, decision D57), the panel is
  beside its control on every size, at its width (`list` 320, `menu` 340, `search` 400, `card` 240), with no sheet,
  no handle and nothing dimmed; what is in it carries the surface (`surface-1`, border `line-strong`, `radius-card-s`,
  `shadow-float`, padding 6). Its states are the floating panel's: closed (not shown); open, placed by `place-floating`
  6 from its control, on the other side where its own has no room, never off the screen; closed by Escape, a press
  beside it, a scroll of the page or a change of the window's size, the focus back on the control. For a panel that
  holds one or two controls whose effect must stay in sight while they are used; a list or a menu stays a sheet, but for
  the search's places (D68).
- As wide as its control (`width="control"`): the panel takes the width of the element it is anchored to, given by
  `useFloating` as `--width-of-control` when it opens. The search's places use it, floating on every size under the
  field, or under Home's whole well (the board "UI fixes · Coordinates in the search"): a sheet would stand under the
  keyboard of a phone.
- With the list open the focus is in it, and the choice that is taken is marked. The arrows stop at the ends
  of the list; Home and End lead to them; a letter leads to the next choice that begins with it.
- A press beside the list closes it. Scrolling the page or changing the size of the window closes it too.
- A choice is taken with Enter, the space bar or a press; taking the one that is taken already changes nothing.
- A choice may carry a status mark after its words (`mark`: a tick or a note of 16): the stringing options of
  Performance on phone. The trigger shows the mark of the choice that is taken, after its words.
- The trigger may say other words than the label of the choice that is taken (`valueShown`): the weather select
  of Performance names the CSV file that is loaded ("pune-ghi.csv"), while its choice is "CSV file".
- While what was chosen is being loaded (`busy`) the trigger says the new choice at once and a turning ring of 16
  stands where the chevron was; the list cannot be opened until it is over.
- The weather select (the board "Weather and assumptions"): a choice that could not be loaded says so in a note
  under the select, 560 wide at most, on `note-surface` with border `note-line`, radius `radius-control`, padding
  10 12: a note mark of 18, "The weather was not loaded" in Geist 500 and the API's words under it in text-2, 13.
  The choice of before stays in the trigger and in the document. The note goes with the next choice.

## File drop
Height 88, radius `radius-row`, padding 0 18, gap 14. An icon of 20, a title in Geist 500 and one line in
`type-body`; at the right a secondary button of 36.

| State | Surface and line | Content |
|---|---|---|
| Rest | no surface, 1 px dashed `line-strong` | Upload icon in text-2; "Drop the module file here"; "A PAN file of PVsyst"; "Choose a file" |
| A file is held over it | `note-surface`, 1 px dashed accent, `halo-selected` | Upload icon in accent; "Let go to load the file"; what it replaces |
| Held, to be read later | `surface-2`, border `line` | File icon in accent; the name of the file in mono; what it is and when it is read ("DXF · 48 KB · read when the roof is opened"); "Choose another" |
| Reading | `color-well`, border `line`, `shadow-well` | Ring of 20; "Reading the file"; the name of the file in mono |
| Refused | `note-surface`, border `note-line` | Note of 20; "This file was not loaded"; the reason in the words of the engine; "Choose another" |
| Read, kept in the dialog | `surface-2`, border `line` | File icon in accent; the name of the file in mono; the lines of what was read, one under the other ("8,760 hours · GHI 1,822.9 kWh/m²", "beam 1,435.4 · diffuse 822.7 kWh/m²", "25.0 to 25.0 °C"); "Choose another" |

A file that is refused leaves the equipment of before in place. A file that is read becomes the equipment
card. The button opens the file chooser, so the control works without dragging and by keyboard.

In code: `FileDrop`. It gives the file to who uses it, and is told what becomes of it: held for later (the
drawing of an import, read when the roof is opened), reading, read and kept until the dialog's primary action takes it (the
weather of a CSV, with its summary), and refused with the reason. It takes one file, the first of several. What is no file of the device (a piece of text, a
link) is not taken, and while a file is read no other is. The words of the field are a `status`, so that a
screen reader hears that a file is read or was refused.
On phone the button stands under the words and is as wide as the field, 44 high; the field is then higher
than 88.

## Dialog
Over a dimmed screen (`rgba(5,7,10,.72)`), in its middle. Panel: width 340 to 440 (wide: 760 on desktop, 680 on tablet, for
the equipment picker), `surface-1`, border
`line-strong`, radius `radius-panel`, `shadow-panel`, padding 22. Title in the display face, 22 / 28
(`type-title-touch`), a quiet icon button of 32 to close at its right; body in text-2; actions at the right
with 8 between them: quiet, secondary, primary, the primary one last.
Phone: a bottom sheet with the drag handle; the actions under each other, 48 high, the primary one on top,
the quiet one (44) last.
`dialog` with its title and its text as name and description. The focus goes into it and stays in it; Escape
and the close button close it; the focus goes back to where it was.

In code: `Dialog`. It is the dialog of the browser, opened over everything; what is behind it cannot be
used and does not scroll.

- The focus goes to the first action, the quiet one, which changes nothing: Enter by mistake does no harm.
- The actions are 40 high on desktop and 44 on tablet. On phone the primary and the secondary one are 48
  high and as wide as the sheet, the quiet one 44.
- On phone the handle of the sheet closes it, by a press or a drag downwards, and there is no button to
  close.
- A press beside the dialog leaves it open: what it asks must be answered.
- A dialog that asks for a number (the height of an obstacle) puts the focus in that field when it opens
  (`initialFocus="field"`), and its primary action waits, shown as it cannot be pressed, until the field has a
  number. The action can still be pressed: the press leaves the field, which commits what was typed, and the
  action then has it. Enter in the field commits and adds in one go.

## Tooltip
The name of a control that shows an icon or one word. Height 28, padding 0 10, `control-active`, border
`line-strong`, radius 8, text 12, shadow `0 1px 2px rgba(0,0,0,.45), 0 8px 20px rgba(0,0,0,.35)`; a key
may follow, in mono 11 in a box with radius 4. 8 from its control. It comes after 400 ms under the pointer
and at once with the keyboard focus; never on touch. It is never the only place where something is said.

In code: `Tooltip`, around its control. Radius `radius-item`, the key in `radius-key`, shadow
`shadow-tooltip`; the times and the gap in `design-numbers.ts`.

- It is over its control, its middle over the middle of the control; under it where there is no room
  over it. It never leaves the screen (`place-floating.ts`).
- It goes when the pointer leaves, when the focus leaves, when the control is pressed, and with Escape.
- The control is described by it (`aria-describedby`); its name is its own.
- **With a summary** (the help's disc, D80): two lines at most of the topic's summary, 264 wide, the words wrapping,
  padding 8 12, and under them "Click for more" in 12, `text-3`. Same colours, radius, shadow, times and place.

The value of a chart under the pointer, the finger or the keyboard focus (the board "Charts, tooltip and table"; plan
phase 8, decision 18) is a tooltip of two lines, padding 4 10: the value first, in mono 12 Geist Mono 500 in text
("68.4 MWh · 191 kWh/kWp"), then what it is of in `type-body` text-2 ("Mar"). It stands over the bar or the marker,
8 from it, at once; on touch a tap brings it, and a scroll takes it away. In code: `ValueTooltip`. It is never the
only place: the Table tab of the chart holds every value. Beside a block of the single-line diagram it stands at the
block's right, 8 from it (`side="right"`), so that no other block is hidden; the list under the diagram holds every block.

## Toast
A choice of stringing an edit took away is said in a toast with a note (D77): "The stringing you chose, 18 in series × 84
strings on 7 inverters, no longer fits this design. Option A, Recommended, is used instead: 23 in series × 67 strings on 7
inverters." with the action Choose another, which leads to the Strings step; `choiceGoneWords` in `lib/flow/choice-gone.ts`.

`surface-1`, border `line-strong`, radius `radius-row`, `shadow-float`, 48 high or more, padding 8 8 8 14,
gap 10. A status mark (tick 18 or note 20), the words, then an action in accent, Geist 500 (height 32), or a
quiet icon button of 32 to close. At the bottom of the screen in its middle, 24 from the edge; above the tab
bar on phone. `role="status"`.
A toast of something done leaves after 5 s, and stays while the pointer is over it or the focus is in it. A
toast with a note stays until it is closed.

In code: `Toast` is the look, `Toaster` the place where toasts are shown, `toast-queue.ts` their queue, a
store without React.

- One toast is shown at a time, in the order they came. The 5 s of a toast begin when it is shown.
- The action of a toast (Undo) closes it. On phone and tablet the action and the close button are 44 high.
- On phone the words of a toast with an action take its width, and the action stands under them at the right; the close
  stays beside the words.
- The place of the toasts is in the page from the start, so that a screen reader hears what comes into it.
  It is in the layer `z-toast`.

## Table
Head: height 36, padding 0 8, `text-section` in text-3, a line `line` under it. Rows: height 44, padding 0 8,
a line `line-subtle` under each. The first column in Geist 500, numbers at the right in mono 13, a status mark
of 16 after the number it belongs to. The row that is chosen is on `surface-2`. A caption under the table in
`type-body`. Real `table`, `th` with `scope`.
Phone: each row is a card on `surface-2`, radius `radius-row`, padding 14: the name in `text-title` with its
mark, then the values as a list of three columns, label in `type-body` over the value in mono 15.

In code: `Table`; a row as a card in `table-cells.ts`.

- A column is a name, a text or a number. The name is the head of its row (`th` with `scope="row"`).
- A column can be for the cards only, or for the table only: a card has room for a value more.
- The title of a card can say more than the name in the table: "Option D" for "D".
- The row that is chosen says so to a screen reader (`aria-current`). Its card has the line and the halo
  of a selected card.
- The cards are a list with the caption of the table as its name; the caption stands under them.
- A cell can hold a quieter second line under its value, in `type-body` text-3 (the inverter under its MPPT),
  or lines of its own, each with its label in `type-unit` text-3 before a value in mono 12 and words after it
  in Geist text-2 ("Imp 54.3 of 65.0 A", "Isc 57.2 A of not known"); in the table only, the card shows the value
  (the board "Inverter and sizing").
- A table at the inspector's width pads its cells 6 rather than 8 (`dense`); a card whose values are long lays
  them in two columns rather than three (`cardColumns`).
- A column of words rather than figures (`words`: the summary of Performance) is in Geist at the left; on a card its
  value stands under the title across the width, without its head, since the title says the row (the board
  "Performance" on phone).
- The row that sums the others up (`total`: the year under the months, the 25 years under six of them) stands over a
  line `line`, without a line under it, its name in Geist 600 and its figures in Geist Mono 500; as a card it is one
  more card, last. A value that is empty is left off a card: the total of the cable schedule shows its sum alone.
- A column of words wraps in its cell; every other cell stays on one line.

Sorting (the board "Handover, previews", the DC cable schedule; plan phase 9, decision 7). A column that sorts
(`sortBy`: a number, or a string compared as words) has a button for its head, across the cell, 36 high, padding 0 8,
radius `radius-xs`, the focus ring of every control: the active head in `text` with an arrow of the icon set after its
words (`arrow-up` upwards, `arrow-down` downwards, 14), the others in text-3 as a head is. States: the order given
(`aria-sort="none"` on every head that sorts); upwards after a first press (`aria-sort="ascending"`); downwards after a
second (`descending`); a third press gives the order given back. A press on another head sorts upwards by it. On phone
the cards keep the order of the table; nothing there changes it.

In code: `table-sort.ts` is pure (`sortedRows`, stable; `nextSort`; `ariaSortOf`). The table does not sort by itself:
it shows the rows as they are given and says the sort in its heads (`sort`, `onSort`); whoever gives the rows sorts them
with `sortedRows`, so that a copy of the table is of what is shown. The total row is not sorted: it is given last.

## Progress ring
| Form | Size | Use |
|---|---|---|
| Turning | 16, line 2 (12, line 1.5 for the state of saving) | Beside a value that is updated; how far is not known |
| With an arc | 20, line 2.5 | How far, from the engine; in a row with the name of the step |
| With an arc and the number | 44, line 3, the percent in mono 11 inside | On the stage, at the first run |

Track `line-strong`, arc accent with round ends, from the top, clockwise. One turn in `duration-spin`. The
ring with an arc says its percent to a screen reader. Progress is for showing: a run is over when its
result is there.
A run in a row: `surface-2`, radius `radius-row`, height 52, padding 0 14: the ring of 20, the step in the
words of the engine, the percent in mono 13, text-2.

In code: `ProgressRing` and `RunStep`; the arc in `ring-arc.ts`.

- A ring that turns shows a quarter of the way around.
- A ring is a `progressbar` with a name. Beside words that say the same it has none and is for the eye only.
- The percent is whole, and 99 at the most before the run is over.

## Skeleton
In the place of a value that was never there. Blocks on `surface-2`, radius `radius-xs`: a label 10 high, a
value 18 high (22 for the lead value), lines of text 12 high and of different lengths. It breathes: opacity
1 to `opacity-updating` and back in `duration-breathe`; it stands still under reduced motion. A value that
was there is never replaced by a skeleton: it stays, dimmed.

In code: `Skeleton`, of the kind `label`, `value`, `lead` or `text`. Who uses it gives it its width. It says
nothing to a screen reader: what is waited for is said in words beside it. On a stat tile, which is `surface-2`
itself, the block is `control-active` (`onTile`; the board "Shade map").


## Notes to review, the drawer
Desktop and tablet: from the right, 384 wide, over the inspector, `color-chrome`, a line `line` at its left,
shadow `-16px 0 40px rgba(0,0,0,.5)`, layer `z-sheet`. Phone: a bottom sheet.
Head: "Notes to review" in the display face 22 / 28, the count in mono 13, a quiet icon button to close (38,
44 on phone). Padding 20 (16 on phone); notes 10 apart.
A note: `note-surface`, border `note-line`, radius `radius-row`, padding 14: the mark of 20, a title in Geist
500, the reason in `type-body`, text-2, in the words of the engine; under them where it belongs, in
`type-body`, text-3, and a secondary button of 36 that leads there ("Open Array") or acts ("Try again").
Nothing to review: one row on `surface-1` with a tick of 20: "Nothing to review", "Every check of the design
fits."

In code: `NotesDrawer`, and `NotesPanel` for what is seen of it; the notes are made by `notesOf`
(`components/shell/notes-view.ts`).

- On tablet and desktop it stands under the top bar, which stays in sight.
- It is the dialog of the browser, opened over everything (the top layer, not `z-sheet`): the focus goes to
  the button that closes, stays inside, and goes back. Escape closes it, and a press beside it. On tablet and
  desktop the screen behind it is not dimmed; on phone it is.
- A note is there because the API gave it: the notes of the module, of the layout and of the weather, the
  chosen option when its DC/AC is not in target, a call that failed. Its reason is in the words of the API,
  with the true minus sign before a number.
- The API gives no title. The title is what the note is about: its words before its first number or its verb
  ("Voc coefficient", "Unit gap"), four at the most. A note that begins otherwise is named by where it came
  from: "Module", "Layout", "Weather".
- Where a note leads: module and layout to the Array step, weather to Performance, the option to the Strings
  lens. A call that failed has "Try again".
- An action of a note closes the drawer.
- It comes and goes in `duration-panel`, eased as a sheet is (`drawer-motion`): the panel slides in from the right on
  tablet and desktop, from the bottom on phone, and the dim fades with it; under reduced motion it cuts.

## Project switcher, open
The trigger is on `surface-2` with a border `line`, its chevron turned. Panel: 340 wide, `surface-1`, border
`line-strong`, radius `radius-card-s`, `shadow-float`, padding 6.
"This design": the name with a tick in accent, and under it the state of saving. "On this device": the designs
kept here, the newest edited first, each a row of 44 like the actions' (a file icon of 18 in text-2, the name, and
under it in `type-body`, text-3, the capacity of its last run, "357.28 kWp", or the roof's words before a
run with a chosen option, "90.0 × 40.0 m flat roof, tilted rows": under the name, not at its right, since the
names and the roof's words are long and the panel is 340); the design that is open has the tick in accent
in the place of the icon. Without any, "Designs you save appear here." Then the actions, rows of 44 with an icon
of 18 in text-2 and a fact at the right in `type-body`, text-3: New design (Find the roof), Open a project
(.rtd), Import a drawing (KMZ, KML, DXF), Save a copy (.rtd), Home. Sections are divided by a line `line`; their
labels are `text-section`.
On phone and tablet it is a bottom sheet.

In code: `ProjectSwitcher`; `ProjectTrigger` and `ProjectMenu` for what is seen of it; the rows of the device are
made by `rowsOnTheDeviceOf` (`components/shell/switcher-view.ts`) of the designs the saving store lists.

- The designs on this device and the actions are each a `menu`: the arrows go through the rows of the menu the
  key is pressed in, Home and End to its ends. Open, the focus is on the first row of the panel. A design's row
  pressed closes the switcher and opens that design from the device, which runs again as the demo does (Phase
  10, step 5); the open one says so to a screen reader (`aria-current`). A name or a fact too long for the row
  is cut with an ellipsis.
- A row whose doing is not given (the kit's) is shown and cannot be used (`aria-disabled`, opacity
  `opacity-disabled`). It takes the focus, so that it is found. Open a project opens its dialog (Phase 10, step 9).
  Import a drawing opens its dialog (Phase 5, step 13). Save a copy downloads the project file, the `.rtd` the API
  writes, named after the design (Phase 9, step 8); it needs no chosen option and no run.
- "This design" carries a quiet Rename (a pencil of 18) that turns the name into the text field; a commit edits the
  document's name, Escape gives it back (Phase 9, decision 13).
- The icons of the rows have the stroke of the navigation, 1.7; the board draws 1.8.
- The last row, **Docs** (a book), opens the Rooftop docs in a new tab, with the mark of a link that leaves the app (`external`,
  16, `text-3`) where the others give a fact (D91). Home, which has no switcher, has the same link at the right of its header:
  the book (18, light), "Docs" (`type-body`, `text-2`), the mark (14). The docs' address follows the app's: `rooftop.<x>`
  opens `<x>/docs/rooftop`, anywhere else production's (`lib/docs/docs.ts`).
- The place of the design, "18.52° N · 73.86° E", has two decimals, as the mockups have it. It is shown on
  desktop from 1360 wide.
- While no design is open, a skeleton stands in the place of the name.

## State of saving
Its mark before the design's name in the project switcher's trigger, on every size (the boards "UI fixes · The state
of saving, a mark before the name", D74): a slot of 14, whatever the state, so that the name never moves; the words
are the trigger's tooltip and description, never in the top bar. In the switcher's menu, under the name, mark and
words as below (`type-body`), Not saved a button that opens the notes.

| State | Mark | Words |
|---|---|---|
| Saved | A dot of 7 in `color-ok`, pulsing in `duration-pulse-saved` | Saved on this device |
| Saving | A turning ring of 12 | Saving |
| Not kept: the demo, and every design before Phase 10 | A hollow dot of 7, 1.5 px in text-3 | Not kept on this device |
| Could not be saved | A note of 16 (14 in the trigger's slot) | Not saved. It is a button and opens the notes |

In code: `SaveState` (the menu's), `SaveMark` (the trigger's), `SAVING_WORDS`. Before Phase 10 the shell shows "Not kept on this device" for every design. In the
project switcher the words are `type-body`.

## Top bar and navigation
V2 (D95, D99; the board "V2 · 2 · The progression").

In code: `TopBar`, `StepNav`, `StepTabBar`, `ResultChip`, `Shell` (`components/shell`), the steps' logic in
`lib/flow/steps.ts`, what the device remembers in `lib/device/progression.ts`.

- The shell is as high as the screen. The top bar and the tab bar stay; what is between them scrolls.
- The bar: the mark (to Home), the design's name with its saved mark, the five steps, the result, Docs.
- The steps are places with an address, so they are links in a `nav` ("Steps"); the one in hand says so
  (`aria-current="step"`) and is pressed (`control-active`, `shadow-segment`). Each has its mark: a tick when done (gone
  past, nothing in it waits), the note mark when something in it waits for the user (a note that leads there, no option
  that fits), else its number; a screen reader hears the state after the name. On desktop a step's tooltip says its line
  (D96). On Find, before Build, the steps after Roof are dim and are no links. On phone the steps are the tab bar, each its
  icon with the mark at its corner.
- One primary per step, named for the next (`Continue to Array`, `Continue to Strings`, `Continue to Performance`): at the
  foot of the work column, pinned; on Performance `Continue to Handover` at the head beside Present; on Handover
  `Download all` at the head beside Present. Under it `Next: <step>, <its line>` until that step has been opened once on
  this device.
- The app's own words (D96): the line under a page's title the first time the user meets it on this device
  (`FirstMeeting`, `lib/words/explain.ts`), then behind the ? and the tooltip.
- Hide panel (D99): a quiet icon button at the work column's top right, and ⌘ \ (Ctrl \), hide it on desktop; the stage
  takes the width, `Show panel` stands beside the view controls and the step's primary floats at the stage's foot. The
  column shows again on a design's first open on the device, when the step in hand needs the user, and when an object on
  the roof is selected; hidden is remembered on the device.
- Sun is a toggle of the view controls on every step (D95): pressed, the work column holds the Sun view's sections and the
  stage its shadows, its time and the sun's arc; `/studio/sun` turns it on over the step in hand. On phone it stands alone
  at the stage's top right, 3D or Plan and Layers on a line under it, clear of the time at the top left.
- Where the top bar is short of room: `guidelines.md`, "Responsive rules".

## Layers button (the stage)
The board "Stage, Layers" (`mockups/StageLayers.dc.html`). The fourth control of the view, after Fit and the north
button, 8 from it, in any step: a secondary icon button of 38 (44 on tablet and phone), `control` with the line,
`radius-control` (`radius-row` on touch), `shadow-raised`, the icon of three stacked sheets 20 (22 on touch) in text-2;
its name is "Layers". States as the icon button's: hover (`control-hover`, `line-hover`, raised by 1,
`shadow-raised-hover`, the icon in text), pressed, focus (the ring), and open (`control-pressed`, `line-strong`,
`shadow-pressed`, the icon in text, `aria-expanded`) while its panel is open; never disabled. On the phone it stands
beside 3D or Plan alone. Pressed, it opens a floating panel of 240 (the `FloatingPanel` at the width of a card's menu:
`surface-1`, border `line-strong`, `radius-card-s`, `shadow-float`, padding 6) 6 under it with their right edges in
line, on every size, not a bottom sheet: the title "Layers" in `text-section` with a close at its right (the icon
button `quiet` `xs`, the close icon of 18, "Close"; D70), and one row of 44 (48 on touch) with the
switch "Satellite imagery", off by default (D70), its hint "Off: the plain grid" in `type-body` text-3. On: the imagery
under the building with its attribution at the stage's bottom left. Off: the plain ground of the 3D palette with its
grid, and no attribution. The switch takes effect at once; Escape, the close, the button and a press beside the panel close it,
and the focus goes back to the button. What it sets is of the view (the view store), not of the design.

Built (Phase 11, pull request 3): `components/studio/ViewControls.tsx`, the `Layers` part; the open look of the button
in `iconButtonLook`; the panel the `FloatingPanel` with `onTouch="floating"` and `FLOATING_SURFACE`; the ground in
`lib/stores/view-store.ts` (`ground`, `setGround`, `groundDrawnOf`); the attribution by `attributionOf` in
`components/studio/stage-view.ts`. Without a map key or a location the ground is the plain grid whatever the switch
says, and the switch stays as it is; the ground drawn is said in the stage's text equivalent ("The ground is the
satellite imagery", "The ground is plain, with a grid"). Opened, the focus is on the switch, so that the space bar
turns it. The panel has no motion of its own, as the kit's FloatingPanel has none.
