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
| Studio, Strings lens, no system voltage yet (superseded by D87: no screen shows it since Phase 16) | `StringsLensNoVoltage.dc.html` | `studio-strings-lens-no-voltage.png` | desktop |
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
| UI fixes · Move and turn the roof and its obstacles | `MoveTurn.dc.html`, `MoveTurnTablet.dc.html`, `MoveTurnPhone.dc.html` (the shots in `move_turn/`) | `ui-fixes-move-turn-desktop.jpg`, `ui-fixes-move-turn-tablet.jpg`, `ui-fixes-move-turn-phone.jpg` | desktop, tablet, phone |
| UI fixes · My location and Search on every size | `LocateSearch.dc.html`, `LocateSearchTablet.dc.html`, `LocateSearchPhone.dc.html` (the shots in `locate_search/`) | `ui-fixes-locate-search-desktop.jpg`, `ui-fixes-locate-search-tablet.jpg`, `ui-fixes-locate-search-phone.jpg` | desktop, tablet, phone |
| UI fixes · A choice of stringing that no longer fits | `ChoiceGone.dc.html`, `ChoiceGoneTablet.dc.html`, `ChoiceGonePhone.dc.html` (the shots in `choice_gone/`) | `ui-fixes-choice-gone-desktop.png`, `ui-fixes-choice-gone-tablet.png`, `ui-fixes-choice-gone-phone.png` | desktop, tablet, phone |
| UI fixes · Section headings, three ways | `SectionHeadings.dc.html`, `SectionHeadingsTablet.dc.html`, `SectionHeadingsPhone.dc.html` (the shots in `section_headings/`) | `ui-fixes-section-headings-desktop.png`, `ui-fixes-section-headings-tablet.png`, `ui-fixes-section-headings-phone.png` | desktop, tablet, phone |
| UI fixes · The state of saving, a mark before the name | `SaveStateMark.dc.html`, `SaveStateMarkTablet.dc.html`, `SaveStateMarkPhone.dc.html` | `ui-fixes-save-state-desktop.png`, `ui-fixes-save-state-tablet.png`, `ui-fixes-save-state-phone.png` | desktop, tablet, phone |
| UI fixes · Present, the figures of each scene | `PresentStats.dc.html`, `PresentStatsTablet.dc.html` (the scenes in `present_scenes/`) | `ui-fixes-present-stats-desktop.jpg`, `ui-fixes-present-stats-tablet.jpg` | desktop, tablet (Present has no phone) |
| UI fixes · Coordinates in the search | `SearchCoordinates.dc.html`, `SearchCoordinatesTablet.dc.html`, `SearchCoordinatesPhone.dc.html` | `ui-fixes-search-coordinates-desktop.png`, `ui-fixes-search-coordinates-tablet.png`, `ui-fixes-search-coordinates-phone.png` | desktop, tablet, phone |
| UI fixes · Find's first step, a panel that says what to do | `FindFirstStep.dc.html`, `FindFirstStepTablet.dc.html`, `FindFirstStepPhone.dc.html` (the shots in `find_first_step/`) | none: the boards are the shots | desktop, tablet, phone |
| UI fixes · Your own when the roof holds too few positions | `OwnTooFew.dc.html`, `OwnTooFewTablet.dc.html`, `OwnTooFewPhone.dc.html` (the shots in `own_too_few/`) | `ui-fixes-own-too-few-desktop.png`, `ui-fixes-own-too-few-tablet.png`, `ui-fixes-own-too-few-phone.png` | desktop, tablet, phone |
| UI fixes · The docs from the app (#193, D91) | `DocsLinks.dc.html`, `DocsLinksTablet.dc.html`, `DocsLinksPhone.dc.html` (the shots in `docs_links/`) | none: the boards are the shots | desktop, tablet, phone |
| UI fixes · The strings' legend with many MPPT (#114) | `StringsLegend.dc.html`, `StringsLegendTablet.dc.html`, `StringsLegendPhone.dc.html` (the shots in `strings_legend/`) | none: the boards are the shots | desktop, tablet, phone |
| UI fixes · Handover after a first run that failed (issue 179) | `HandoverFailed.dc.html`, `HandoverFailedTablet.dc.html`, `HandoverFailedPhone.dc.html` (the shots in `handover_failed/`) | none: the boards are the shots | desktop, tablet, phone |
| System voltage · Set by the user's country (Phase 16) | `SystemVoltage.dc.html`, `SystemVoltageTablet.dc.html`, `SystemVoltagePhone.dc.html` (the shots in `system_voltage/`) | `system-voltage-desktop.jpg`, `system-voltage-tablet.jpg`, `system-voltage-phone.jpg` | desktop, tablet, phone |
| V2 · 1 · Principles (approved, D94) | `V2Principles.dc.html`, `V2PrinciplesTablet.dc.html`, `V2PrinciplesPhone.dc.html` | none: the boards are the specimen | desktop, tablet, phone |
| V2 · 2 · The progression (approved, D95, D96) | `V2Progression.dc.html`, `V2ProgressionTablet.dc.html`, `V2ProgressionPhone.dc.html` | none: the boards are the drawing | desktop, tablet, phone |

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
- `mockups/build_ui_fixes_choice_gone.py` writes the boards "UI fixes · A choice of stringing that no longer fits": the note
  as the app shows it when the owner's IKEA design is opened, caught in the browser at three sizes (`choice_gone/`), with
  when it is said (D77).
- `mockups/build_ui_fixes_locate_search.py` writes the boards "UI fixes · My location and Search on every size": Find with
  nothing typed and with an address typed, and Home, caught in the browser at three sizes (`locate_search/`); approved on
  2026-10-07 (D78).
- `mockups/build_ui_fixes_move_turn.py` writes the boards "UI fixes · Move and turn the roof and its obstacles": Find's map
  with the demo roof, caught in the browser (`move_turn/`), with what is proposed drawn over it and numbered callouts
  explained beside each frame: the roof picked up and moved, turned, an obstacle moved and turned (a close-up), the cursor,
  and the tips; approved on 2026-10-07 (D79), not built yet.
- `mockups/build_ui_fixes_find_first_step.py` writes the boards "UI fixes · Find's first step, a panel that says what to do": Find
  before a place is found, today and as proposed (the ways to start, what the search understands, the three steps, the ?), an
  example pressed, and without a map, caught in the browser at three sizes (`find_first_step/`) with a prototype on the local
  branch `design/find-first-step`, never merged; approved on 2026-10-07 (D85), built (#143 to #145).
- `mockups/build_ui_fixes_own_too_few.py` writes the boards "UI fixes · Your own when the roof holds too few positions" (#171):
  the Strings lens on a 12.0 × 10.0 m roof of 16 positions, today, then Add your own under the words, its fields set to the
  string that fits, and the option added; caught in the browser at three sizes (`own_too_few/`), the build on the branch
  `fix/171-own-option-too-few`; approved on 2026-10-09.
- `mockups/build_ui_fixes_docs_links.py` writes the boards "UI fixes · The docs from the app" (#193; desktop, tablet, phone):
  Docs at the right of Home's header, a Docs row at the foot of the project menu, and In the docs under a help topic's
  Related, each opening `solarlayout.app/docs/rooftop` in a new tab, with two new icons (a book; the arrow out of a box).
  Caught in the browser at three sizes (`docs_links/`) with a prototype on the local branch `design/docs-links`, never
  merged; drawn and approved on 2026-10-10 (D91).
- `mockups/build_ui_fixes_strings_legend.py` writes the boards "UI fixes · The strings' legend with many MPPT" (#114; desktop,
  tablet, phone): the legend of the strings with the library's Solis S5-GC125K-HV (10 MPPT, three inverters on the demo roof),
  by MPPT and by string (46 strings), today and as proposed: one entry per colour of the six, each naming all it marks
  (MPPT 1 · 7; S1 · S7 · S13 … S43 past four), and the demo as approved, unchanged. Caught in the browser at three sizes
  (`strings_legend/`) with a prototype on the local branch `design/strings-legend-many`, never merged; drawn and approved
  on 2026-10-11 (D92).
- `mockups/build_ui_fixes_handover_failed.py` writes the boards "UI fixes · Handover after a first run that failed" (issue 179,
  after #205; desktop, tablet, phone): Handover with the demo's first run answered 503, today (the rows' facts breathing,
  on phone no note and no Try again) and as proposed (each waiting row and the preview's head say "Not made · the run
  failed", the download icon dim; on phone the note with Try again under the list's head). Caught in the browser at three
  sizes (`handover_failed/`) with a prototype on the local branch `design/handover-first-run-failed`, never merged; drawn
  and approved on 2026-10-11 (D93).
- `mockups/build_system_voltage.py` writes the boards "System voltage · Set by the user's country" (Phase 16, D87; desktop, tablet,
  phone; the canvas page "System voltage"): the voltage of the user's country in the Strings lens (India 1000 V, the United States
  600 V with no string length fitting the demo's inverter), the app's value following an inverter rated under it, the user's 1500 V
  kept with an inverter of 1100 V and its note, and the picker's marks. Caught in the browser at three sizes (`system_voltage/`) with a
  prototype on the local branch `design/system-voltage`, never merged; drawn and approved on 2026-10-08 (session 22). Built
  (#155); the third state taken again from the build after D88 (the voltage kept, the strings sized to the inverter).
- `mockups/build_in_app_help.py` writes the boards "In-App Help · The ? and the help sheet" (desktop, tablet, phone; the
  canvas page "In-App Help"): the ? disc beside the section headings in its states, the tooltip, the help sheet by size
  (from the right edge, the whole height, dimmed, on desktop and tablet; from the bottom on phone), a topic followed and
  Back, Find, and where help goes; approved on 2026-10-07 (D80). The app caught in the browser (`in_app_help/`) with a prototype of the disc and the drawer drawn
  by the app itself (the local branch `design/in-app-help`, never merged); the sample topics' words checked against the
  engine. Session 19 (`plan/phase-14-in-app-help.md`).
  The same script writes the boards "In-App Help · How-tos with pictures" (desktop, tablet, phone; under the first three):
  help for Find's tools as numbered steps, each with a picture of the app and callouts on it, its two ways in (a ? beside
  the panel's title, Show me how on a tip), how the pictures are made, a clip later in the same frame, the list of Find's
  how-tos; approved on 2026-10-07 (D81). Drawn by a prototype on the local branch `design/find-tools-help`, never merged.
  And the boards "In-App Help · Clips" (Phase 15; desktop, tablet, phone; under them): a clip in a step's frame, its states
  (at rest, loading, playing, paused, failed), the hand as a dot inside a clip, how a clip behaves and is made; approved
  on 2026-10-07. Drawn by a prototype on the local branch `design/help-clips`, never merged, with the spike's clip.
- V2 (`plan/v2/`): the boards on the canvas page "V2", one set per part of the audit, each drawn by a `mockups/build_v2_*.py`
  in three sizes with the numbers of `mockups/build_v2_parts.py` (the V2 tokens of the board "V2 · 1 · Principles", D94) and the
  Pune demo's real numbers; every word follows `plan/v2/voice.md`. Each board says what changed, the audit's issues it answers
  (V2-nn) and the rules of these documents it changes. The documents change with V2's first pull request, not before.
- A preview is the board rendered at its `$preview` size (the tail of each `.dc.html`) by a scratch Playwright script outside the
  repo: Chromium from `e2e/node_modules/@playwright/test`, the fonts served from `apps/web/app/fonts` and `apps/web/node_modules/geist`
  in place of the Google link in the board's `helmet`, `support.js` stubbed, everything else off the machine refused.
- `mockups/canvas.json` is the layout of the boards on the canvas: 106 boards on four pages since 2026-10-11 ("Approved design", the
  first, holds every board without a `page`; "UI fixes" the boards of session 18 on; "In-App Help" those of Phases 14 and 15; "System voltage" those of Phase 16); the 53 of the first page in sync with the canvas at claude.ai since
  2026-10-04 (session 15 published the 26 boards of Phases 6 to 11 and the five boards changed since 2026-09-30; the report's
  pages of `mockups/handover_pages/` travel with the Handover boards). A session on Bedrock has no Artifact tool: it adds its
  boards to `canvas.json` (frame, `order`, a row title in `notes`) and the next session with the tool publishes them.
