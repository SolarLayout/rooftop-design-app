# UX and visual guidelines

## Principles

1. **The roof is the interface.** Show the thing, then the number. Any input that changes geometry is visible on
   the roof as it changes.
2. **No Run button.** A committed edit recalculates. Layout follows at once; energy follows in seconds, with
   progress shown on the number that is updating. Old values stay visible, marked as updating.
3. **Decisions, not defaults.** Where only the user can know (system voltage), ask. Never preselect. Say what is
   waiting for the answer and what is already done.
4. **Explain on the object.** When the design does something the user did not ask for (keeps an area clear,
   leaves positions unused), the reason is one tap away, on the roof.
5. **Ticks and notes.** A result that fits has a tick. One that does not has an exclamation mark and the reason.
   Never a red cross, never red.
6. **An instrument, not a brochure.** Dark chrome around a lit roof. One accent. Dense where the user works,
   generous where the user decides.
7. **Proper responsive design.** Each size is laid out for itself. Nothing is scaled down to fit.

## Visual language

- Ground is near-black with a cool tone. The roof and the satellite ground are the brightest things on screen.
- One accent, amber, on 3 to 5 things a screen (D94): the primary action, the selection, the notes, the focus ring, and
  the sun on the Sun view. Section headings, help discs, tabs and secondary actions are not in it. No second accent.
- Depth has three levels: flat (tiles, rows), raised (buttons, cards), floating (anything over the roof or map).
  Light comes from above: raised things have a bright top edge; fields are recessed.
- Shadows are for depth only. Nothing glows but the primary button and the sun.
- No gradients as decoration. The only gradients are the vignette of the stage and the sun's glow.
- Borders are 1 px. Four radii (D94): controls 8, rows 12, cards 16, panels 24; inside one another the inner is the
  outer less the padding.
- Type on nine styles (D94, `design-tokens.md`): 14 the floor for reading on desktop and 15 on touch; 12 for a unit, a
  tick or a badge alone. Primary text for what the user reads (labels and values), `text-2` for what qualifies it
  (units, sources, hints), `text-3` for placeholders and chart ticks alone. A label is at its value's weight.
- Spacing on seven steps (4, 8, 12, 16, 24, 40, 64): 8 inside a group, 24 between groups, 40 between sections.
- Control heights: 32, 40 and 48 on desktop, 44, 44 and 48 on touch. One row, one height.
- Display type (Bricolage Grotesque) is for titles and lead numbers only. Everything else is Geist.
- Numbers are set with tabular figures, so columns and changing values do not jump: in Geist in text, in Geist Mono
  in tables, fields and the cable schedule alone.

## Writing

- Sentence case everywhere, and nothing in uppercase by style (D94).
- Plain words. Say what happens: "Kept clear", "Positions not used", "Energy was not updated".
- Buttons say what they do: "Build this roof", "Find the roof", "Download PDF". Not "OK", not "Submit".
- A note says what is wrong and what to do: "Voc coefficient -0.164 %/°C is outside the usual -0.35 to
  -0.20 %/°C. Check the datasheet."
- The engine's user-facing sentences are kept word for word (`plan/reference/functional-inventory.md`, 2.8).
- Never use the word "bankable".
- No exclamation marks in text. No emoji.
- Every value says who set it, in four words and no others (V2 · 3, D97): `Default`, `From the weather`,
  `Set for <country>`, `Yours`. A value of the user's says the default it took the place of, and offers `Reset`.

## Numbers and units

| Quantity | Format | Example |
|---|---|---|
| Energy | 1 decimal, MWh | 617.8 MWh |
| DC capacity | 2 decimals, kWp | 357.28 kWp |
| AC capacity | integer, kW | 275 kW |
| DC/AC | 2 decimals | 1.30 |
| PR, losses, shading | 1 decimal in tiles; 2 in the loss chain | 86.6 %, -2.22 % |
| Specific yield | integer, thousands separator | 1,729 kWh/kWp |
| Lengths | 1 decimal on the map and roof; 2 in fields | 90.0 m, 0.50 m |
| Area | integer | 3,600 m² |
| Angles | 1 decimal where computed, integer where set | 18.0°, 15° |
| Coordinates | 5 decimals with N, S, E, W | 18.52000° N |
| Time | 24-hour, solar time stated | 16:00 solar time |
| Temperature | 1 decimal | 11.9 °C |

- A space between number and unit, except the degree sign for angles. The minus sign is U+2212 in display text.
- Thousands separator is a comma.
- While a value is updating, keep the old value and show the progress ring; when it lands, roll to the new one.
- A value that cannot exist yet is absent with its reason, never "0" and never "N/A".

## States every screen must handle

| State | What the user sees |
|---|---|
| Empty | What goes here and the one action that fills it |
| Loading or computing | Skeleton for layout; progress ring and the engine's step name for a run ("Computing the hourly shading of the modules") |
| Updating | Old values, dimmed slightly, ring beside the number |
| Waiting for a decision | Decision card; vitals say what is waiting |
| Note | Exclamation mark, reason, and where to fix it |
| Failure | A `Problem` (V2 · 5, D101): the title, the cause, the remedy as a button, Details; no word of the machine in the first two lines; the last good result stays, marked "Showing the last result" |
| Offline or no map key | The flow continues without the map ("Enter dimensions by hand") |
| No WebGL | The plan view, with a line saying why |

## Responsive rules

| Width | Name | Reference | Navigation | Studio |
|---|---|---|---|---|
| under 640 | Phone | 390 by 844 | The steps as the tab bar; the result in the top bar | 3D on top, bottom sheet |
| 640 to 1100 | Tablet | 834 by 1194 | The steps in the top bar | 3D on top (440), the result row, the work column under it |
| over 1100 | Desktop | 1440 by 900 | Top bar | Rail, stage, inspector |

- Inside a size nothing is laid out anew. The top bar holds the logo, the name of the design, the steps and
  the result; Present and the exports live at the heads of Performance and Handover, never in the bar. Where
  the bar is short of room the steps close up (no separators below desktop), the result moves to a row under
  the stage on tablet, and the name of the design is cut short last.
- Touch targets are at least 44 by 44 on phone and tablet.
- No horizontal page scroll at any width from 360 up. A row that must scroll sideways (vitals on phone) shows
  part of the next item so it is seen to scroll.
- What scrolls has the theme's bar: the page's colour scheme is dark, the bar thin in `color-line-strong` on no
  track (session 18). A row that scrolls sideways shows no bar.
- The 3D keeps a useful size: never under 240 px high.
- Tables become lists of cards on phone. Charts go full width and keep their labels.
- Body text is 15 px on touch sizes, 14 on desktop.

## Accessibility

- Text contrast at least 4.5:1 (3:1 from 24 px). The text tokens meet this on every surface token.
- Colour is never the only carrier: status has an icon and words, series have a legend and labels on selection.
- Everything works by keyboard. Focus is always visible (2 px accent ring). Order follows reading order.
- The 3D has a text equivalent: the inspector lists every object, and selection works from the list.
- Charts have a table view.
- Motion stops under reduced motion. Nothing flashes. Present's tour plays its scenes as stills, each held for its
  time and changed with a fade of the ground (`unveiling`, the one fade kept under reduced motion): the camera cuts and
  never moves, the reveal stands whole, the day stands at the Studio's hour under the sun's arc, the energy at its value
  (V2-103).
- Form fields have labels; icon buttons have names; regions have landmarks (`nav`, `main`, `aside`).

## Charts

- Pick the form by the job: a single lead number is a number, not a chart.
- One axis per chart, labelled (V2 · 8, audit V2-71): its unit over it, ticks at round steps of 1, 2 or 5 times a power
  of ten, about four of them, the ends on a tick; from zero for bars, fitted to the values for a line, so that its fall is
  seen (`lib/performance/chart-axis.ts`). Thin marks, 4 px rounded data ends, 2 px gap between neighbours, recessive grid.
- Direct labels on the extremes only (the highest and lowest month, the first and last year), beside their marks in the
  text colour, never on a bar (audit V2-119). A legend when there are two or more series.
- Chart and Table are a segmented control at the chart's head, at the right of its title.
- Gain is blue, loss is orange. Categories use the series tokens in their fixed order and keep their colour
  when the selection changes.
- Hover or tap shows the value; the target is larger than the mark.
- Text in charts uses text tokens, never the series colour.

## 3D scene

- The camera never goes below the roof. Presets: 3D, Plan (top, north up), Fit, Sun's eye.
- North is always findable (the north control shows the bearing).
- Shadows are real: their direction and length come from the engine's sun position for the site and time.
- The time belongs to the Sun view (V2 · 3): outside it the stage draws the design day's noon, still.
- Selection is an outline in accent. Hover is a lighter outline, on pointer devices only.
- Labels on the stage are few: dimensions of the roof, the selected object's callout, the inverter marker.
- Satellite imagery carries its attribution wherever it is shown, on the map and under the 3D.
- Modules are instanced. Changing the time never rebuilds geometry.
- Colour by string, MPPT or inverter uses the series tokens. Positions not used are grey.
- The stage draws what the engine answered: the positions of `/layout`, its kept-clear areas, its setback. A sloped
  roof is drawn pitched about the line through its centroid; the engine's numbers are its own (the board "Roof types
  in 3D"). Plan is the same scene seen straight down, north up, and what stands in without WebGL.
- The line under the step's title counts what the layout answered: on the Roof step the roof's area, the area inside
  the setback and the obstacles; on the Array step the positions, the tables, the rows and the area of all the
  positions.
- While a layout is on its way the modules of before stay and the line under the title is dimmed with a ring; a
  layout that failed is a callout on the stage with the engine's sentence and Try again, and the last good modules
  stay (the board "Studio, Array lens, states").

## Do not

- Do not add a colour, a font, a radius or a shadow that is not a token.
- Do not show a red cross, a red border or red text.
- Do not preselect the system voltage, in any state, demo included.
- Do not put results on a screen separate from the inputs that cause them.
- Do not shrink the desktop layout onto a phone.
- Do not copy the layout or the look of the old desktop app.
