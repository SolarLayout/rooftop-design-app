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
| Studio, Sun lens | `SunLens.dc.html` | `studio-sun-lens-desktop.png` | desktop |
| Studio, Strings lens | `StringsLens.dc.html` | `studio-strings-lens-desktop.png` | desktop |
| Studio, Strings lens, no system voltage yet | `StringsLensNoVoltage.dc.html` | `studio-strings-lens-no-voltage.png` | desktop |
| Performance | `Performance.dc.html` | `performance-desktop.png` | desktop |
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
  equipment is shown by its real names (decision D24). The placement
  of strings on the roof in the Strings lens is illustrative.
- `mockups/build_lenses.py` generated the Sun and Strings boards from the Array board. It is kept so the boards
  can be regenerated; it is not part of the product.
- `mockups/build_phase3_boards.py` writes the two boards of round 4, "Controls, part 2" and "Shell states",
  approved on 2026-09-29 (decision D32), and the board "Tabs", approved the same day (decision D35). It is
  kept so that the boards can be written again.
- `mockups/build_phase4_boards.py` writes the two boards of Phase 4, "Find and outline" on tablet and "Find and outline,
  states and tools", drawn on 2026-09-30 by session 6 (`plan/phase-04-plan.md`, step 0).
- `mockups/build_phase4_obstacles_by_hand.py` writes the two boards of the third pull request of Phase 4, "Obstacles on the
  map and their heights" and "Enter dimensions by hand", drawn on 2026-09-30 by session 7 (`plan/phase-04-plan.md`, step 13).
- `mockups/canvas.json` is the layout of the boards on the canvas. The repo holds 19 boards; the canvas holds the first
  17 (2026-09-30). The two boards of session 7 are published to it when the owner asks.
