# Components

Anatomy, sizes and states of each control and pattern. Values are token names from `design-tokens.md`.
The live reference is the "Controls, depth and motion" board (`mockups/Kit.dc.html`).

Every control is a real element (`button`, `a`, `input` with a `label`), reachable by keyboard, with a visible
focus ring. An icon-only button has an `aria-label`.

## Buttons

| Kind | Height | Surface | Text | Shadow | Use |
|---|---|---|---|---|---|
| Primary | 36 to 40 in bars, 44 in toolbars, 56 for the main action of a panel | accent | accent-ink, Geist 600 | primary | One per view: Export, Find my roof, Build this roof, Download |
| Secondary | 36 to 40 (44 on touch) | control, border line-strong | text, Geist 500 | raised | Replace, Edit, Add, Present, Save a copy |
| Quiet | 40 to 44 | none | text-2 (text on hover) | none | Undo, Clear, tools beside a primary tool, "Enter dimensions by hand instead" |
| Icon | 38 to 48 square | as secondary or quiet | icon 16 to 22 | as kind | Fit, north, zoom, back, remove |
| Round | 32 to 44 | accent | icon accent-ink | primary | Play |

States: rest; hover (raised 1 px, brighter, `shadow-*-hover`); pressed (lowered 1 px, `shadow-pressed`, scale
0.985); focus (focus ring); disabled (opacity 0.45, no shadow, no pointer). Radius `radius-control`
(12 to 14 for the 56 px action).

In code (`apps/web/components/ui`): `Button`, `ButtonLink` (a link that looks like a button) and `IconButton`.

| Size | Button, height on desktop | Icon button, side on desktop | Radius | On phone and tablet |
|---|---|---|---|---|
| `xs` | | 32 | control | 44, radius row |
| `s` | 36 | 38 | control | 44, radius row |
| `m` | 40 | 40 | control | 44, radius row |
| `l` | 44 | 44 | row | the same |
| `xl` | 56, label in the size of `text-title` | | card-s | the same |

Padding at the sides: 16 primary, 14 secondary and quiet, 20 for `xl`. Icon to label: `space-inline`.
The border of a secondary button is `line-strong`; of a secondary icon button `line`.
An icon button takes its name from `label`, which it cannot be without.
The kit shows a state without a pointer or a keyboard by `shownAs`; a screen never sets it.

## Segmented control
Track: `color-well`, border `line`, `shadow-well`, padding 3, radius `radius-control`.
Items: height 30 (34 to 36 in panels, 44 on touch); active item `control-active`, `shadow-segment`, text, Geist
500; others transparent, text-2. Use for 2 to 4 exclusive choices with short labels: 3D or Plan, Portrait or
Landscape, design day, roof type, system voltage once chosen, colour by.

A choice that the user must make (system voltage before it is chosen) is not a segmented control with nothing
selected. It is the decision card below.

In code: `Segmented`. It is a group of radio buttons to a screen reader (`radiogroup`, `radio`). The keyboard
stops at it once, at the choice that is taken; the arrows go through the choices and around the ends, Home and
End to the first and the last; each takes the choice it goes to. A choice that cannot be taken is dim and is
passed over. On phone and tablet the track has radius `radius-row`, the items `radius-seg-touch` and the size
of body text. With `fill` the choices share the width in equal parts (the lens switch on phone).

## Switch
44 by 26, radius full. On: accent track, knob accent-ink. Off: line-strong track, knob text-2. Knob 20, inset 3,
`shadow-knob`. On touch the hit area is 52 by 44 around a 52 by 30 switch. Always beside a label and, where it
helps, one line of hint. `role="switch"` with `aria-checked`. The track has `shadow-track`.

In code: `Switch`. Its name is its `label`. The knob slides in `duration-press`.

## Slider and range slider
Track 4 high, `color-line`, radius full; the filled part accent. Handle 18 round (26 on touch), `color-text`
with an accent border of `border-handle` (3; `border-handle-touch`, 4, on touch), `shadow-handle`. The value
is shown above the track in `text-value-s` (`text-value` on touch) with its unit, never only on the handle;
a slider has its label at the left of the value. One line of hint may follow under the track, in
`text-caption`, text-3. Ticks in `text-tick`, text-3, each under its value. The range slider (shade-free
window) has two handles and fills between them; its two values stand at the left, a note ("solar time") at
the right.

In code: `Slider` and `RangeSlider`; their numbers in `slider-steps.ts`.

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
the loss chain). Label left in text-2, value right in `text-value`, unit after the value in text-2.
Focus: accent border and `halo-focus`. The value commits on Enter or blur, not on every key.
A stepper is a number field with minus and plus buttons of 30 (44 on touch).

In code: `NumberField` and `Stepper`; their numbers in `number-entry.ts`.

| Form | Height on desktop | On phone and tablet | Use |
|---|---|---|---|
| The label inside, at the left | 44 | 44 | A field of its own, as on the kit board |
| The label before the field | 36, radius control | 48, radius row | A row of the inspector |
| Stepper | 38: buttons of 30 in a well with padding 3 | 52: buttons of 44 | A few whole steps |

- What is typed is a draft. Enter or leaving the field commits it; Escape gives it up. The arrows up and down
  step the draft and do not commit. Plus and minus of a stepper commit at once, and cannot be pressed at the
  end of the range.
- A number outside the range is brought to the nearest limit. What is no number leaves the value as it was.
  In both cases the field says under itself what happened, in `text-caption`: "5.00 m is the highest that can
  be set.", "Enter a number, from 0.00 to 5.00 m.". The next good entry takes the words away.
- The field shows its number with the decimals of the quantity, a comma between thousands and a true minus
  sign; it reads either minus sign and the comma.
- With the focus inside: accent border and `shadow-well-focus`. The input has no ring of its own.

## Cards
`surface-1`, border `line`, radius `radius-card`, `shadow-card`, padding `space-card`.
Equipment card (module, inverter): glyph 44 by 56 to 60, name in Geist 600, one or two lines of facts in
`text-caption`, file name in Geist Mono, a secondary button (Replace).
Selected card: `note-surface`, accent border, `halo-selected`.
Compact card: radius `radius-card-s`, padding `space-card-compact`.

## Stat tile and vitals cell
Label in `text-caption`, text-2. Value in `text-value` (or a display size for the lead value) with its unit.
A status mark may follow the value. Tiles inside a card are flat: `surface-2`, radius `radius-row`, padding
10 by 14.

In code: `Stats` is the list, `Stat` one label with its value. Looks: `cell` (vitals: value 16, 17 on tablet),
`lead` (the energy: display 26, 22 on phone), `tile`.

## Vitals bar
Desktop: floating, `surface-1`, `radius-bar`, `shadow-float`, height 78, cells separated by 1 px lines. Order:
Energy year 1 (display size), DC capacity, AC capacity, DC/AC with its mark, Modules "638 of 790", PR, Yield,
then the notes cell on `note-surface`.
Tablet: grid of 4 by 2, cells 72 high. Phone: one row of cards 64 high that scrolls sideways.
Before a system voltage is chosen: Roof, Positions, "If all were used" and a wide note cell that says what energy
is waiting for.

## Status marks
Tick: `color-ok`, stroke 2.4. Note: exclamation mark in a circle, accent. Size 14 to 22. Each has a text
alternative ("Fits", "Below the DC/AC target"). There is no cross and no red.

In code: `StatusMark`, of the kind `fits` or `note`. It cannot be without its words (`label`): they stand
beside the mark, or, where there is no room (`wordsShown={false}`), the mark says them to a screen reader.

## Decision card
For a choice only the user can make. `note-surface`, accent border, 4 px accent halo, note icon, a title that
is an instruction ("Choose a system voltage"), one sentence of why, the choices as large raised buttons (52
high), one line of context. Nothing is preselected. Below it, the list of what is waiting and what is done.

## Callout on the stage
Floating chip: `surface-1`, border `note-line` (or `line-strong`), `radius-row`, `shadow-float`, padding 10 by
14. Title line in Geist 500, 13; detail in 12, text-2. Joined to its object by a 1 px line and a 9 px dot.

## Lens rail and lens switch
Rail item 56 by 56, radius 12, icon 20 over a label of 11. Active: `control-active`, accent icon and label,
`shadow-segment`. On tablet the four lenses are a floating segmented row of 44; on phone a four-column segmented
control in the sheet.

## Bottom sheet (phone)
`color-chrome`, top radius `radius-panel`, top border `line`, drag handle 40 by 4 in `line-strong`, 8 over it
and 4 under it. Holds the lens switch and the inspector as a list of rows 64 to 68 high divided by
`line-subtle`. Three stops: peek, half, full.

In code: `Sheet`; its stops in `sheet-stops.ts`. It stands at the bottom of the room it is put into.

- Peek is `size-sheet-peek` high: the handle and the lens switch. Half is half the room, full all of it.
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
"series x strings, kWp, DC/AC", energy at the right in `text-value`, then the status mark. Selected: as the
selected card. "Add your own" is a dashed quiet button.

## Series range bar
Track 8 high in `color-well`; feasible band in `color-ok` at 55 %; chosen length as a 4 px accent marker with a
halo; labels under the ends in `text-tick` ("14, MPPT minimum", "29, Voc limit"). The verdict follows with a
tick or a note and the engine's sentence.

## Loss chain
Grid of label, editable input (where the step is a user input), change in %, track, running total. Rows 29
high; totals 32 high, Geist 600, with a 2 px marker on the track. Bars 12 high, radius 3, gain and loss colours.
A legend names gain and loss and says that boxed values can be changed.

## Timeline (Sun lens)
Floating bar 64 high: round play button 44, time in display 22 with "solar time", track with the shade-free
window filled in accent, handle at the time, ticks at sunrise, 09:00, 12:00, 16:00, sunset.

## Map outline tools (Find and outline)
Corner handle 18 (22 on touch), white with accent border; the corner being edited pulses. Midpoint handle 10,
accent. Edge label: mono 13 on `color-ground`, radius 7. Outline: 2 px accent, fill accent at 9 %.
Toolbar: floating, radius 18, the active tool is a primary button.

## Deliverable row (Handover)
Row 64 high: format badge 44 by 28 (accent for the selected row), title, one line of facts, then a download
icon (file) or a chevron (opens a view).

## Paper preview
`color-paper` sheet, radius 6, `shadow-panel`, ink text. Page thumbnails at the right, 132 wide; the current one
has an accent border.

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
is in Geist 500; one fact at the right in `text-caption`, text-3. The row under the pointer or the keyboard is
on `surface-2`.
On phone and tablet the list is a bottom sheet with rows of 52.
`listbox` with `option`; the arrows go through the choices, Enter takes one, Escape closes and gives the focus
back to the trigger.

## File drop
Height 88, radius `radius-row`, padding 0 18, gap 14. An icon of 20, a title in Geist 500 and one line in
`text-caption`; at the right a secondary button of 36.

| State | Surface and line | Content |
|---|---|---|
| Rest | no surface, 1 px dashed `line-strong` | Upload icon in text-2; "Drop the module file here"; "A PAN file of PVsyst"; "Choose a file" |
| A file is held over it | `note-surface`, 1 px dashed accent, `halo-selected` | Upload icon in accent; "Let go to load the file"; what it replaces |
| Reading | `color-well`, border `line`, `shadow-well` | Ring of 20; "Reading the file"; the name of the file in mono |
| Refused | `note-surface`, border `note-line` | Note of 20; "This file was not loaded"; the reason in the words of the engine; "Choose another" |

A file that is refused leaves the equipment of before in place. A file that is read becomes the equipment
card. The button opens the file chooser, so the control works without dragging and by keyboard.

## Dialog
Over a dimmed screen (`rgba(5,7,10,.72)`), in its middle. Panel: width 340 to 440, `surface-1`, border
`line-strong`, radius `radius-panel`, `shadow-panel`, padding 22. Title in the display face, 22 / 28
(`text-lens-touch`), a quiet icon button of 32 to close at its right; body in text-2; actions at the right
with 8 between them: quiet, secondary, primary, the primary one last.
Phone: a bottom sheet with the drag handle; the actions under each other, 48 high, the primary one on top,
the quiet one (44) last.
`dialog` with its title and its text as name and description. The focus goes into it and stays in it; Escape
and the close button close it; the focus goes back to where it was.

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

## Toast
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
- The place of the toasts is in the page from the start, so that a screen reader hears what comes into it.
  It is in the layer `z-toast`.

## Table
Head: height 36, padding 0 8, `text-section` in text-3, a line `line` under it. Rows: height 44, padding 0 8,
a line `line-subtle` under each. The first column in Geist 500, numbers at the right in mono 13, a status mark
of 16 after the number it belongs to. The row that is chosen is on `surface-2`. A caption under the table in
`text-caption`. Real `table`, `th` with `scope`.
Phone: each row is a card on `surface-2`, radius `radius-row`, padding 14: the name in `text-title` with its
mark, then the values as a list of three columns, label in `text-caption` over the value in mono 15.

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
nothing to a screen reader: what is waited for is said in words beside it.

## Vitals: states
| State | What is shown |
|---|---|
| Updating | Every value at opacity 0.55. A turning ring of 16 beside the energy. The last cell, on `surface-1`, has the ring of 20 with its arc, "Updating energy" in Geist 500, 13, and the step of the engine in `text-caption` |
| First load | Skeletons in every cell. The last cell has the ring of 20, "Opening" and the name of the project, and the step of the engine |
| The run failed | The last good values, not dimmed. The last cell is a note: "Energy was not updated", "Values are of the design before · Try again". It opens the notes |
| Before a system voltage, desktop | As drawn in `StringsLensNoVoltage.dc.html` |
| Before a system voltage, tablet | Three cells in a row, 72 high: Roof, Positions, "If all were used". Under them, across the width, the note, 72 high, on `note-surface`: "Energy is waiting for the system voltage", "Choose 600, 1000 or 1500 V in the Strings lens", an arrow. It leads to the Strings lens |
| Before a system voltage, phone | The note is the first card of the row: "Energy is waiting", "Choose a system voltage". Then Roof, Positions, "If all were used" |

## Notes to review, the drawer
Desktop and tablet: from the right, 384 wide, over the inspector, `color-chrome`, a line `line` at its left,
shadow `-16px 0 40px rgba(0,0,0,.5)`, layer `z-sheet`. Phone: a bottom sheet.
Head: "Notes to review" in the display face 22 / 28, the count in mono 13, a quiet icon button to close (38,
44 on phone). Padding 20 (16 on phone); notes 10 apart.
A note: `note-surface`, border `note-line`, radius `radius-row`, padding 14: the mark of 20, a title in Geist
500, the reason in `text-small`, text-2, in the words of the engine; under them where it belongs, in
`text-caption`, text-3, and a secondary button of 36 that leads there ("Open Array") or acts ("Try again").
Nothing to review: one row on `surface-1` with a tick of 20: "Nothing to review", "Every check of the design
fits."

## Project switcher, open
The trigger is on `surface-2` with a border `line`, its chevron turned. Panel: 340 wide, `surface-1`, border
`line-strong`, radius `radius-card-s`, `shadow-float`, padding 6.
"This design": the name with a tick in accent, and under it the state of saving. "On this device": the designs
saved here, or "Designs you save appear here." Then the actions, rows of 44 with an icon of 18 in text-2 and a
fact at the right in `text-caption`, text-3: New design (Find the roof), Open a project (.rtd), Import a
drawing (KMZ, KML, DXF), Save a copy (.rtd), Home. Sections are divided by a line `line`; their labels are
`text-section`.
On phone and tablet it is a bottom sheet.

## State of saving
In the top bar on desktop, `text-small`, text-2; on tablet and phone in the project switcher only.

| State | Mark | Words |
|---|---|---|
| Saved | A dot of 7 in `color-ok`, pulsing in `duration-pulse-saved` | Saved on this device |
| Saving | A turning ring of 12 | Saving |
| Not kept: the demo, and every design before Phase 10 | A hollow dot of 7, 1.5 px in text-3 | Not kept on this device |
| Could not be saved | A note of 16 | Not saved. It is a button and opens the notes |
