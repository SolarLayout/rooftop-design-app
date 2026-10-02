# Phase 6: Studio, Sun lens

**Status:** done (session 10, 2026-10-02: #48 to #52). **Depends on:** phase 5.

## Goal
The user watches the sun cross the roof and sees exactly what shade costs. This is the first part of the
tradeshow moment.

## Scope
- Directional light driven by the engine's sun position (`/sun`), real cast shadows from parapet, obstacles
  and rows. Bias scaled with sun height; light fades below 8 degrees.
- Time scrubber (15 minute steps) and day picker (design day, solstices, equinox, any date). Play and pause;
  respects reduced motion. Keyboard: `,` `.` hour, `[` `]` day.
- Sun path arc and sun marker for the chosen day; shade-free window marked on the arc and the scrubber.
- Read-out: "21 Dec, 16:00 solar time, sun 18.0 degrees high, 56.6 degrees W of south".
- Engine shadow polygons drawn as an optional overlay, to show that the rendered shadows and the calculated
  ones agree.
- Shade heat map: modules coloured by annual shading loss (sequential single hue, legend, value on select);
  per-string shade once strings exist. (`per_string_shade` was computed but never shown on desktop.)
- Figures: near shading linear, electrical beyond linear, far shading (horizon), keep-out left empty;
  horizon note ("PVGIS horizon, highest 2.7 degrees").

## Acceptance
- Shadow of the stair room at 16:00 on 21 Dec matches the engine polygon within 0.2 m at its far corner.
- Scrubbing never rebuilds module geometry (checked by a render counter in development).
- Playwright: scrub changes the rendered frame; figures match the API; three viewports.

## Out of scope
Strings, energy charts.

## As built

Built in session 10 (2026-10-02): the plan (`phase-06-plan.md`), six boards, four pull requests of the plan and one
fix the owner asked for: #48 (the time), #49 (the light held to the engine, the sun path, the shadow outlines), #50
(the shading figures and the shade map), #51 (the light held to the palette), #52 (the states).

### What exists

| Part | Where | Pull request |
|---|---|---|
| The sun of a whole day from `/sun`, a quarter hour apart, asked once per place and day; the light at the view's hour looked up in it; the view's design day the array's; a day that comes holds the hour inside its hours | `lib/flow/design-flow.ts`, `lib/stores/results-store.ts` (`SunDay`), `lib/scene/sun-day.ts`, `components/scene/use-sun.ts` | #48 |
| The time on the stage: the pill of every lens; the Sun lens's timeline (on phone at the top of the sheet); play a quarter hour every 250 ms to sunset, an hour a second under reduced motion; the keys `,` `.` `[` `]`; the slider's live `onShow`, its span fill and end ticks; the tooltip's keys; the icon Pause | `components/studio/Time.tsx`, `use-time.ts`, `use-sun-keys.ts`; `lib/studio/play.ts`, `sun-time.ts`; `components/ui/use-slide.ts`, `SliderTrack.tsx`, `Tooltip.tsx`, `Icon.tsx` | #48 |
| The Sun lens inspector: Shadows and Shade map; the Day (21 Dec, 21 Mar, 21 Jun, Any date with a day and a month); the Sun at the time; Shading over the year; On the roof | `components/studio/SunInspector.tsx`, `SunShading.tsx`; `lib/studio/sun-figures.ts` | #48, #49, #50 |
| The scene reads nothing of the time: the light, the camera and the sun path's marker do; in development the instanced sets count their matrix writes (`data-module-writes`) | `components/scene/Scene.tsx`, `SunLight.tsx`, `CameraRig.tsx`, `Modules.tsx`; `lib/scene/stage-store.ts` | #48 |
| The shadows of `/sun` take the roof alone (`ShadowRequest.roof`) | `apps/api/src/rooftop_api/schemas/sun.py`, `services/sun.py` | #49 |
| The light's bias held to the engine: what it moves a shadow on a level roof stays under 5 cm; the casters draw their back faces into the shadow map | `lib/scene/sun-light.ts`; `components/scene/Building.tsx`, `Obstacles.tsx`, `Modules.tsx` | #49 |
| The sun path: the arc on a dome of 1.3 times the roof's radius, the window thicker, the marker, the hour marks, the marker's callout | `components/scene/SunPath.tsx`, `components/studio/SunMarks.tsx`; `lib/scene/sun-path.ts`, `sun-marks.ts` | #49 |
| The engine's shadow outlines, asked when the time rests (`TIME_REST`), shown while of the time shown; the Sun lens without the kept-clear areas and, in 3D, without the edge labels | `components/scene/ShadowOutlines.tsx`; `lib/scene/shadow-outlines.ts`, `what-is-drawn.ts` | #49 |
| The shade map: the glass coloured per instance by its near shading over the year in five steps of one hue (`--color-shade-1` to `-5`), the legend on the stage, a module's loss and its string's | `components/scene/use-shade-map.ts`, `components/studio/ShadeLegend.tsx`, `Callout.tsx`; `lib/scene/shade-map.ts`, `shade-colours.ts` | #50 |
| The light held to the palette: no tone mapping; the sun and the sky come to π on a level roof at 10:30 on the design day, the sky alone two thirds; the sky's colour near neutral | `components/scene/SceneCanvas.tsx`, `lib/scene/sun-light.ts`; `lightSky` | #51 |
| The states: a sun not fetched said on the stage and in the inspector, with Try again; a day the sun stays up or down; the shade map waiting for its run; the callout of what is selected under its dot near the stage's top, and on phone none while an obstacle's handles stand | `components/studio/LayoutFailed.tsx` (`SunFailed`), `stage-view.ts`, `Callout.tsx`; `lib/scene/callout-place.ts` | #52 |

### Acceptance

| Asked | Met by |
|---|---|
| Shadow of the stair room at 16:00 on 21 Dec matches the engine polygon within 0.2 m at its far corner | `e2e/tests/shadow-outlines.e2e.ts`: the corner read from the engine's answer, the rendered shadow's edges found in the plan zoomed in. The shadow's edge minus the engine's corner, eastward and northward: desktop −0.078 and +0.006 m, tablet −0.108 and +0.002 m, phone −0.101 and −0.035 m |
| Scrubbing never rebuilds module geometry (a render counter in development) | `e2e/tests/time.e2e.ts`: a full drag of the timeline and a played hour leave `data-module-writes` as it was; `shade-map.e2e.ts`: the tab both ways too |
| Playwright: scrub changes the rendered frame; figures match the API; three viewports | `time.e2e.ts` (the picture before and after a drag); `shade-map.e2e.ts` (the figures and the map's counts read from the run's answer); every test on 390, 834 and 1440 |
| The frame rate while scrubbing with 1,068 modules (the plan's risk) | By hand on 2026-10-02 (headed Chromium, this machine's GPU, Apple M1 Ultra; the sloped roof): 60.1 frames a second while the timeline is dragged, 58.3 while the day plays |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Decision 1: the time held to "sunrise to sunset, rounded inward" | The same; so there is no "before sunrise" state: the board of the time draws the first quarter hour, the sun 2.5° high, its light faded | Told to the board's agent before it drew; a sun-down state remains for days without sunrise |
| The board: no kept-clear areas and no edge labels in the Sun lens | None in 3D; the plan keeps the edge labels | The plan is the view things are measured in, also by the tests (`inThePlan`) |
| The board: the marker's callout to the right of the marker | To its right or left by the stage's width, under it near the stage's top, over it near the bottom, only while the marker is on the canvas | The stage's camera frames the roof lower than the boards' projection: the arc's noon stands at the stage's top, and at 10:30 the marker is off the canvas on desktop |
| On tablet the pill 20 and the timeline 16 over the stage's bottom (the boards) | 28 | The imagery's attribution stands under them; the boards draw none |
| The keys' tooltip over the handle | Over the middle of the track | `Tooltip` places itself over its control, which is the track |
| Decision 9 measured with PCF 2048 and the bias bounded | As planned, no 4096 needed | The measure above |
| Not in the plan: the light held to the palette | #51 | The owner saw the roof darker than the boards; measured, the lit roof `#AAAFB5` against `#D3D6DB`, the glass `#000A25` against `#16294D`, since #42 |
| The board "Obstacle edited on the roof", phone: no callout while the handles stand | Built so in #52 | Phase 5 had the callout on phone; it overlapped the turn handle and now the time pill (Phase 5's open item, closed) |

### Found on the way

- The light's normal bias was up to eight texels times three: 0.51 m at 18° of sun on the demo, so a shadow on the level
  roof fell as on a plane that much higher, 1.6 m short; with it no shadow reached the stair room's far corner at all.
- `ShadowRequest` carried the whole document: 484 KB with the demo's weather, where the roof is 1.4 KB.
- ACES tone mapping crushed the modules' dark blue nearly to black; three's neutral tone mapping subtracts the darkest
  channel near black and took the red out of it. The scene goes without tone mapping, its light held to the palette.
- The sky's colour gives two thirds of the light a lit roof takes: at `#BCD0E8` it turned the roof blue.
- The bare roof north of the first row's shadow at 10:30 is under half a metre wide, a pixel on phone; a palette test
  reads the open roof the stair room keeps clear instead, in the Sun lens, which draws no kept-clear areas over it.
- On phone the plan zooms to 11 CSS pixels a metre at most (five times its fit): the acceptance reads the picture in the
  device's pixels, 33 a metre.
- `scrollIntoView` of a switch in the sheet scrolled a container whose overflow is hidden, sideways: a phone picture
  shifted by 16 px under the whole suite. The test puts every scroll back.
- The permission system refused an agent `bun dev:bg --profile test` ("Interfere With Workloads"); the session ran the
  browser for it.
- The palette's test read names of letters alone: `shade1` was invisible to it until its pattern took figures.
