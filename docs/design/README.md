# Design system: "Dusk"

The approved design of SolarLayout Rooftop (web). Everything built in `apps/web` follows it.
Approved by the owner on 2026-09-29 (decisions D14, D15, D32 and D35 in `plan/README.md`).

## Where the design lives

| What | Where | Use it for |
|---|---|---|
| The design canvas (live, zoomable, playable) | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy | Looking at the screens as designed. Open to anyone with the link |
| Mockup sources | `docs/design/mockups/*.dc.html` | Exact values: every size, colour, radius and shadow is an inline style. Open a file in a browser to see it |
| Previews | `docs/design/previews/*.png` | Quick reference; what each screen looks like |
| Information architecture | `information-architecture.md` | Routes, what lives where, navigation, responsive structure |
| Design tokens | `design-tokens.md` | Colours, type, spacing, radius, elevation, motion, the 3D scene palette |
| Components | `components.md` | Each control and pattern: anatomy, sizes, states, rules |
| UX and visual guidelines | `guidelines.md` | Principles, copy, numbers and units, states, accessibility, charts, 3D |

## Order of authority

1. The owner's decisions in `plan/README.md`.
2. The approved mockups (canvas and `mockups/`).
3. These documents, which describe the mockups. If a document and a mockup disagree, the mockup wins and the
   document gets fixed in the same pull request.

## Rules for anyone changing the UI

1. Build to the mockup. If a screen has no mockup yet, design it first (see `plan/phase-00-design.md`, "Still to
   draw"), show it to the owner, and build after approval.
2. Use tokens only. No raw colour, size, radius, shadow or duration in a component. A value that is missing
   becomes a new token here first.
3. Use the components in `components.md`. A new pattern is added there, with its states, before it is used twice.
4. Every screen works on phone (390), tablet (834) and desktop (1440), restructured for each, never squeezed.
5. Check your work against the preview of the screen at the same width before opening a pull request, and attach
   your own screenshot.
6. Do not reuse or refer to the look or the layout of the old desktop app.

## Screens and their status

| Screen | Mockup | Preview | Sizes drawn |
|---|---|---|---|
| Information architecture | `Map.dc.html` | `ia-map.png` | |
| Home | `Home.dc.html` | `home-desktop.png` | desktop |
| Find and outline | `Locate.dc.html`, `LocatePhone.dc.html`, `LocateTablet.dc.html` | `find-outline-desktop.png`, `find-outline-phone.png`, `find-outline-tablet.png` | desktop, phone, tablet |
| Find and outline, states and tools | `LocateStates.dc.html` | `find-outline-states.png` | |
| Obstacles on the map and their heights | `ObstaclesOnMap.dc.html` | `find-obstacles.png` | desktop, phone in parts |
| Enter dimensions by hand | `ByHand.dc.html` | `find-by-hand.png` | desktop, phone in parts |
| Studio, Roof lens | `RoofLens.dc.html` | `studio-roof-lens-desktop.png` | desktop |
| Studio, Array lens | `Main.dc.html`, `StudioTablet.dc.html`, `StudioPhone.dc.html` | `studio-desktop.png`, `studio-tablet.png`, `studio-phone.png` | desktop, tablet, phone |
| Studio, Roof lens on tablet and phone | `RoofLensTablet.dc.html`, `RoofLensPhone.dc.html` | `studio-roof-lens-tablet.png`, `studio-roof-lens-phone.png` | tablet, phone |
| Obstacle edited on the roof | `ObstacleOnRoof.dc.html` | `studio-obstacle-on-roof.png` | desktop, phone in parts |
| Roof types in 3D | `RoofTypes3D.dc.html` | `studio-roof-types-3d.png` | desktop |
| Studio, Array lens, states | `ArrayLensStates.dc.html` | `studio-array-lens-states.png` | desktop in parts |
| Import with missing heights | `ImportHeights.dc.html` | `studio-import-heights.png` | desktop, phone in parts |
| Studio, Sun lens | `SunLens.dc.html`, `SunLensTablet.dc.html`, `SunLensPhone.dc.html` | `studio-sun-lens-desktop.png`, `studio-sun-lens-tablet.png`, `studio-sun-lens-phone.png` | desktop, tablet, phone |
| Time on the stage | `SunTime.dc.html` | `studio-sun-time.png` | desktop, tablet, phone in parts |
| Sun path and shadow outlines | `SunPathShadows.dc.html` | `studio-sun-path-shadows.png` | desktop in parts |
| Shade map | `ShadeMap.dc.html` | `studio-shade-map.png` | desktop, phone in parts |
| Studio, Strings lens | `StringsLens.dc.html`, `StringsLensTablet.dc.html`, `StringsLensPhone.dc.html` | `studio-strings-lens-desktop.png`, `studio-strings-lens-tablet.png`, `studio-strings-lens-phone.png` | desktop, tablet, phone |
| Studio, Strings lens, no system voltage yet | `StringsLensNoVoltage.dc.html` | `studio-strings-lens-no-voltage.png` | desktop |
| Strings on the roof | `StringsOnRoof.dc.html` | `studio-strings-on-roof.png` | desktop, phone in parts |
| Options and your own | `StringsOptions.dc.html` | `studio-strings-options.png` | desktop, phone in parts |
| Inverter and sizing | `StringsInverterSizing.dc.html` | `studio-strings-inverter-sizing.png` | desktop, phone in parts |
| Performance | `Performance.dc.html`, `PerformanceTablet.dc.html`, `PerformancePhone.dc.html` | `performance-desktop.png`, `performance-tablet.png`, `performance-phone.png` | desktop, tablet, phone |
| Loss chain, edited | `PerformanceLossChain.dc.html` | `performance-loss-chain.png` | desktop, phone in parts |
| Charts, tooltip and table | `PerformanceCharts.dc.html` | `performance-charts.png` | desktop, phone in parts |
| Weather and assumptions | `PerformanceWeather.dc.html` | `performance-weather.png` | desktop, phone in parts |
| Performance, states | `PerformanceStates.dc.html` | `performance-states.png` | desktop, phone in parts |
| Handover | `Handover.dc.html` | `handover-desktop.png` | desktop |
| Controls, depth and motion | `Kit.dc.html` | `controls-depth-motion.png` | |
| Controls, part 2 | `Controls2.dc.html` | `controls-part-2.png` | |
| Shell states | `ShellStates.dc.html` | `shell-states.png` | desktop, tablet, phone in parts |
| Tabs | `Tabs.dc.html` | `tabs.png` | desktop, phone in parts |

Screens still to draw are listed in `plan/phase-00-design.md`.

## About the mockups

- The 3D roof in the mockups is a drawn projection of the real demo layout, not live 3D. The satellite imagery is
  an illustration. The product uses React Three Fiber and Esri World Imagery.
- All numbers are real results of the engine for the Pune demo (`plan/reference/demo-numbers.md`). The
  equipment is shown by its real names (decision D24). The strings on the
  roof in the Strings boards are the engine's (Phase 7); the board "Studio, Strings lens, no system voltage yet" draws none.
- `mockups/build_lenses.py` generated the Strings board, and once the sketch of the Sun board, from the Array board. It
  is kept so the boards can be regenerated; it is not part of the product.
- `mockups/build_phase3_boards.py` writes the two boards of round 4, "Controls, part 2" and "Shell states",
  approved on 2026-09-29 (decision D32), and the board "Tabs", approved the same day (decision D35). It is
  kept so that the boards can be written again.
- `mockups/build_phase4_boards.py` writes the two boards of Phase 4, "Find and outline" on tablet and "Find and outline,
  states and tools", drawn on 2026-09-30 by session 6 (`plan/phase-04-plan.md`, step 0).
- `mockups/build_phase4_obstacles_by_hand.py` writes the two boards of the third pull request of Phase 4, "Obstacles on the
  map and their heights" and "Enter dimensions by hand", drawn on 2026-09-30 by session 7 (`plan/phase-04-plan.md`, step 13).
- `mockups/build_phase5_roof_boards.py` writes the three boards of the Roof lens of Phase 5 (the lens on tablet and
  phone, the obstacle edited on the roof) and `mockups/build_phase5_array_boards.py` the three of the Array lens
  (its states, the roof types in 3D, the import with missing heights), drawn on 2026-09-30 by session 9
  (`plan/phase-05-plan.md`, step 0). The 3D crops are drawn from the engine's own positions, kept in
  `mockups/roof_types_positions.json`, so that the boards can be written again without the engine.
- `mockups/build_phase6_sun_boards.py` writes the three boards of the Sun lens (desktop, tablet, phone; the desktop board
  replaces the sketch) and `mockups/build_phase6_state_boards.py` the three of its parts (the time on the stage, the sun
  path and the shadow outlines, the shade map), drawn on 2026-10-02 by session 10 (`plan/phase-06-plan.md`, step 0). The
  sun, the shadows and the shade of every module are the engine's for the Pune demo, kept in `mockups/sun_lens_data.json`,
  so that the boards can be written again without the engine.
- `mockups/build_phase7_lens_boards.py` writes the three boards of the Strings lens (desktop, tablet, phone; the desktop board
  replaces the one `build_lenses.py` made, its inspector as approved) and `mockups/build_phase7_state_boards.py` the three of its
  parts (the strings on the roof, the options and your own, the inverter and the sizing), drawn on 2026-10-02 by session 11
  (`plan/phase-07-plan.md`, step 0). The strings, the inverters, the loads and the figures are the engine's for the Pune demo, kept
  in `mockups/strings_lens_data.json`, so that the boards can be written again without the engine.
- `mockups/build_phase8_performance_boards.py` writes the three boards of Performance (desktop, tablet, phone; the desktop board
  replaces the one drawn by hand, its top as approved, with the engine's labels of the chain, Chart and Table as tabs and the summary
  table) and `mockups/build_phase8_part_boards.py` the four of its parts and states (the loss chain edited, the charts with their
  tooltips and tables, the weather and the assumptions, the states), drawn on 2026-10-02 by session 12 (`plan/phase-08-plan.md`, step 0).
  Every figure is the engine's for the Pune demo, kept in `mockups/performance_data.json` (the demo, soiling 3 %, degradation 0.7,
  the rear gain off, the levels P50 · P90 · P99 with Uc 25, NASA POWER, a CSV of GHI alone, the run before a voltage, and the API's
  words for a refused download, a refused file and missing weather), so that the boards can be written again without the engine.
- `mockups/canvas.json` is the layout of the boards on the canvas: 43 boards. The canvas at claude.ai holds 27 of them,
  published on 2026-09-30, and is behind the repo by the board ImportHeights changed on 2026-10-01 and the five new boards
  of Phase 6 with the redrawn Sun lens, the five new boards of Phase 7 with the redrawn Strings lens, and the six new boards of Phase 8 with the redrawn
  Performance: sessions on Bedrock have no Artifact tool to publish them.
