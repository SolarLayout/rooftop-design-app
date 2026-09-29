# Phase 6: Studio, Sun lens

**Status:** not started. **Depends on:** phase 5.

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
