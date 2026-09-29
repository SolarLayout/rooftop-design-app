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
- One accent, amber: the sun, the primary action, selection, focus, notes. Do not add a second accent.
- Depth has three levels: flat (tiles, rows), raised (buttons, cards), floating (anything over the roof or map).
  Light comes from above: raised things have a bright top edge; fields are recessed.
- Shadows are for depth only. No glow except the soft amber under the primary button and around the sun.
- No gradients as decoration. The only gradients are the vignette of the stage and the sun's glow.
- Borders are 1 px. Radius grows with size: controls 10, cards 18, panels 22.
- Display type (Bricolage Grotesque) is for titles and lead numbers only. Everything else is Geist.
- Numbers are in Geist Mono with tabular figures, so columns and changing values do not jump.

## Writing

- Sentence case everywhere. Section labels are uppercase by style, written in sentence case.
- Plain words. Say what happens: "Kept clear", "Positions not used", "Energy is waiting for the system voltage".
- Buttons say what they do: "Build this roof", "Find my roof", "Download PDF". Not "OK", not "Submit".
- A note says what is wrong and what to do: "Voc coefficient -0.164 %/°C is outside the usual -0.35 to
  -0.20 %/°C. Check the datasheet."
- The engine's user-facing sentences are kept word for word (`plan/reference/functional-inventory.md`, 2.8).
- Never use the word "bankable".
- No exclamation marks in text. No emoji.

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
| Loading or computing | Skeleton for layout; progress ring and the engine's step name for a run ("Computing hourly shading for every module") |
| Updating | Old values, dimmed slightly, ring beside the number |
| Waiting for a decision | Decision card; vitals say what is waiting |
| Note | Exclamation mark, reason, and where to fix it |
| Failure | What failed, in the engine's words, and what to do; the last good result stays |
| Offline or no map key | The flow continues without the map ("Enter dimensions by hand") |
| No WebGL | The plan view, with a line saying why |

## Responsive rules

| Width | Name | Reference | Navigation | Studio |
|---|---|---|---|---|
| under 640 | Phone | 390 by 844 | Bottom tab bar | 3D on top, vitals row, bottom sheet |
| 640 to 1100 | Tablet | 834 by 1194 | Top bar | 3D on top, vitals grid, inspector in two columns |
| over 1100 | Desktop | 1440 by 900 | Top bar | Rail, stage, inspector |

- Touch targets are at least 44 by 44 on phone and tablet.
- No horizontal page scroll at any width from 360 up. A row that must scroll sideways (vitals on phone) shows
  part of the next item so it is seen to scroll.
- The 3D keeps a useful size: never under 240 px high.
- Tables become lists of cards on phone. Charts go full width and keep their labels.
- Body text is 15 px on touch sizes, 14 on desktop.

## Accessibility

- Text contrast at least 4.5:1 (3:1 from 24 px). The text tokens meet this on every surface token.
- Colour is never the only carrier: status has an icon and words, series have a legend and labels on selection.
- Everything works by keyboard. Focus is always visible (2 px accent ring). Order follows reading order.
- The 3D has a text equivalent: the inspector lists every object, and selection works from the list.
- Charts have a table view.
- Motion stops under reduced motion. Nothing flashes.
- Form fields have labels; icon buttons have names; regions have landmarks (`nav`, `main`, `aside`).

## Charts

- Pick the form by the job: a single lead number is a number, not a chart.
- One axis per chart. Thin marks, 4 px rounded data ends, 2 px gap between neighbours, recessive grid.
- Direct labels on the extremes only (highest and lowest month). A legend when there are two or more series.
- Gain is blue, loss is orange. Categories use the series tokens in their fixed order and keep their colour
  when the selection changes.
- Hover or tap shows the value; the target is larger than the mark.
- Text in charts uses text tokens, never the series colour.

## 3D scene

- The camera never goes below the roof. Presets: 3D, Plan (top, north up), Fit, Sun's eye.
- North is always findable (the north control shows the bearing).
- Shadows are real: their direction and length come from the engine's sun position for the site and time.
- Selection is an outline in accent. Hover is a lighter outline, on pointer devices only.
- Labels on the stage are few: dimensions of the roof, the selected object's callout, the inverter marker.
- Satellite imagery carries its attribution wherever it is shown, on the map and under the 3D.
- Modules are instanced. Changing the time never rebuilds geometry.
- Colour by string, MPPT or inverter uses the series tokens. Positions not used are grey.

## Do not

- Do not add a colour, a font, a radius or a shadow that is not a token.
- Do not show a red cross, a red border or red text.
- Do not preselect the system voltage, in any state, demo included.
- Do not put results on a screen separate from the inputs that cause them.
- Do not shrink the desktop layout onto a phone.
- Do not copy the layout or the look of the old desktop app.
