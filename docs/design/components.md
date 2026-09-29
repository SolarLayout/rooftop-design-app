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
Track 4 to 6 high, `color-well`; filled part accent; handle 18 to 22 round, white with a 3 to 4 px accent border,
`shadow-handle` (26 on touch). The value is shown above the track in `text-value`, never only on the handle.
Ticks in `text-tick`. The range slider (shade-free window) has two handles and fills between them.

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
`color-chrome`, top radius `radius-panel`, top border `line`, drag handle 40 by 4. Holds the lens switch and the
inspector as a list of rows 64 to 68 high divided by `line-subtle`. Three stops: peek, half, full.

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
