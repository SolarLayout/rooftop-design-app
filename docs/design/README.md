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
| Home | `Home.dc.html`, `HomeTablet.dc.html`, `HomePhone.dc.html` | `home-desktop.png`, `home-tablet.png`, `home-phone.png` | desktop, tablet, phone |
| Home, designs on this device | `HomeDesigns.dc.html` | `home-designs.png` | desktop, phone in parts |
| Open a project | `OpenProject.dc.html` | `home-open-project.png` | desktop, phone in parts |
| Present | `Present.dc.html` | `present.png` | desktop in parts |
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
| Stage, Layers | `StageLayers.dc.html` | `studio-stage-layers.png` | desktop; desktop, tablet, phone in parts |
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
| Handover | `Handover.dc.html`, `HandoverTablet.dc.html`, `HandoverPhone.dc.html` | `handover-desktop.png`, `handover-tablet.png`, `handover-phone.png` | desktop, tablet, phone |
| Handover, previews | `HandoverPreviews.dc.html` | `handover-previews.png` | desktop, phone in parts |
| Handover, states | `HandoverStates.dc.html` | `handover-states.png` | desktop, phone in parts |
| Controls, depth and motion | `Kit.dc.html` | `controls-depth-motion.png` | |
| Controls, part 2 | `Controls2.dc.html` | `controls-part-2.png` | |
| Shell states | `ShellStates.dc.html` | `shell-states.png` | desktop, tablet, phone in parts |
| Tabs | `Tabs.dc.html` | `tabs.png` | desktop, phone in parts |
| UI fixes · Choose a module or an inverter | `EquipmentPicker.dc.html`, `EquipmentPickerTablet.dc.html`, `EquipmentPickerPhone.dc.html` | `ui-fixes-equipment-picker-desktop.png`, `ui-fixes-equipment-picker-tablet.png`, `ui-fixes-equipment-picker-phone.png` | desktop, tablet, phone |
| UI fixes · Where the picker opens | `EquipmentEntry.dc.html`, `EquipmentEntryTablet.dc.html`, `EquipmentEntryPhone.dc.html` | `ui-fixes-equipment-entry-desktop.png`, `ui-fixes-equipment-entry-tablet.png`, `ui-fixes-equipment-entry-phone.png` | desktop, tablet, phone |
| UI fixes · Section headings, three ways | `SectionHeadings.dc.html`, `SectionHeadingsTablet.dc.html`, `SectionHeadingsPhone.dc.html` (the shots in `section_headings/`) | `ui-fixes-section-headings-desktop.png`, `ui-fixes-section-headings-tablet.png`, `ui-fixes-section-headings-phone.png` | desktop, tablet, phone |
| UI fixes · The state of saving, a mark before the name | `SaveStateMark.dc.html`, `SaveStateMarkTablet.dc.html`, `SaveStateMarkPhone.dc.html` | `ui-fixes-save-state-desktop.png`, `ui-fixes-save-state-tablet.png`, `ui-fixes-save-state-phone.png` | desktop, tablet, phone |
| UI fixes · Present, the figures of each scene | `PresentStats.dc.html`, `PresentStatsTablet.dc.html` (the scenes in `present_scenes/`) | `ui-fixes-present-stats-desktop.jpg`, `ui-fixes-present-stats-tablet.jpg` | desktop, tablet (Present has no phone) |
| UI fixes · Coordinates in the search | `SearchCoordinates.dc.html`, `SearchCoordinatesTablet.dc.html`, `SearchCoordinatesPhone.dc.html` | `ui-fixes-search-coordinates-desktop.png`, `ui-fixes-search-coordinates-tablet.png`, `ui-fixes-search-coordinates-phone.png` | desktop, tablet, phone |

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
- `mockups/build_phase9_handover_boards.py` writes the three boards of Handover (desktop, tablet, phone; the desktop board replaces
  the one drawn by hand, its list and head as approved, with Download all, the engine's page as the preview and the file name as the API
  writes it) and `mockups/build_phase9_part_boards.py` the two of its parts and states (the seven previews; the states), drawn on 2026-10-03
  by session 13 (`plan/phase-09-plan.md`, step 0). Every number and word is the engine's and the API's for the Pune demo, kept in
  `mockups/handover_data.json` (option A's system, BOM, cable schedule and MPPT loads, the equipment, the weather, the file names and sizes,
  the CSV's first rows, the KML's names, the DXF's layers, the API's words before a voltage); the report's pages are the engine's own images
  for the demo, drawn once at 150 dpi with the day 2026-10-03 into `mockups/handover_pages/`, so that the boards can be written again
  without the engine.
- `mockups/build_phase10_home_boards.py` writes the tablet and phone boards of Home (the approved desktop board's pieces in one
  column) and the board of the designs kept on this device (the cards with their menu, Delete asked, a card renamed, the project switcher
  with the designs, the state of saving in the top bar, the phone), and `mockups/build_phase10_part_boards.py` the boards Open a project
  (the dialog over Home at rest, a file read of format 2 and of format 1 with the engine's notes, a file refused, the phone's sheet) and
  Present (the stage alone, the six stages of the tour), drawn on 2026-10-03 by session 13 (`plan/phase-10-plan.md`, step 0). Every number
  and word is the engine's and the API's for the Pune demo, kept in `mockups/home_data.json` (the demo card's facts, three kept designs
  with their words and times, the engine's sentences for a file of another format and for the files a format 1 project names without their
  text), so that the boards can be written again without the engine.
- `mockups/build_phase11_layers_board.py` writes the board "Stage, Layers" (the Layers button of the view controls, its panel with the
  switch Satellite imagery, the ground as imagery or the plain grid, on desktop whole and in parts on three sizes), drawn on 2026-10-04 by
  session 14 (`plan/phase-11-plan.md`, decision 22 and step 35). The stages are the approved Studio boards' own, with the button, the panel
  and the ground changed; the imagery under the 3D is the illustration of the Find boards laid on the ground plane by the boards' projection.
- `mockups/build_ui_fixes_search_coordinates.py` writes the three boards "UI fixes · Coordinates in the search" (desktop, tablet,
  phone): coordinates as Google Earth copies them read back under the field, the forms that are read, and the words for what cannot
  be read; approved by the owner on 2026-10-06 (session 18, D68). From session 18 every board for approval comes in the three sizes,
  on the canvas page "UI fixes".
- `mockups/build_ui_fixes_present_stats.py` writes the boards "UI fixes · Present, the figures of each scene" (desktop and
  tablet; Present has no phone): each scene of the tour as the app draws it, caught midway (`mockups/present_scenes/`),
  with the panel of its figures over it and, in the day scene, the sun path; approved by the owner on 2026-10-06
  (session 18, D72). The canvas's copies show the same screenshots uploaded to it (`--canvas`). Their previews are JPEG:
  photographs of the stage at the board's size would weigh about 8 MB each as PNG.
- `mockups/build_ui_fixes_save_state.py` writes the boards "UI fixes · The state of saving, a mark before the name": the
  approved top bars (Main, StudioTablet, StudioPhone) in the four states, the words gone from the desktop's bar, the
  mark before the name; approved on 2026-10-06 (session 18, D74).
- `mockups/build_ui_fixes_equipment_picker.py` writes the boards "UI fixes · Choose a module or an inverter" (the picker over
  the library of PAN and OND files: its filters, its list and its sorting, nothing found, reading, refused) from the real rows
  of `mockups/equipment_picker_data.json`, taken from the owner's indexes of the two libraries; and
  `mockups/build_ui_fixes_equipment_entry.py` the boards "UI fixes · Where the picker opens" (the module and the inverter cards
  with Change, and after a file of the library is used, with the numbers the API read from it); approved on 2026-10-06
  (session 18, D75). The cards there still name the makers as the files do; the owner then asked for the everyday names on the
  cards too (D75), which `lib/equipment/makers.ts` gives. The code went past the boards where the owner asked, while it was
  built: the inverter's third slider, Max DC; the tag "From the app" taken off the cards; the section headings (D76).
  The boards were not drawn again for these; `components.md` holds them.
- `mockups/build_ui_fixes_section_headings.py` writes the boards "UI fixes · Section headings, three ways": the Strings lens
  caught in the browser with the headings restyled (A no line, D a dark shadow, E a glow of their orange; the first round's
  line close and as built are kept in `section_headings/`). The owner chose E, a notch subtler (D76).
- A preview is the board rendered at its `$preview` size (the tail of each `.dc.html`) by a scratch Playwright script outside the
  repo: Chromium from `e2e/node_modules/@playwright/test`, the fonts served from `apps/web/app/fonts` and `apps/web/node_modules/geist`
  in place of the Google link in the board's `helmet`, `support.js` stubbed, everything else off the machine refused.
- `mockups/canvas.json` is the layout of the boards on the canvas: 70 boards on two pages since 2026-10-06 ("Approved design", the
  first, holds every board without a `page`; "UI fixes" the boards of session 18 on); the 53 of the first page in sync with the canvas at claude.ai since
  2026-10-04 (session 15 published the 26 boards of Phases 6 to 11 and the five boards changed since 2026-09-30; the report's
  pages of `mockups/handover_pages/` travel with the Handover boards). A session on Bedrock has no Artifact tool: it adds its
  boards to `canvas.json` (frame, `order`, a row title in `notes`) and the next session with the tool publishes them.
