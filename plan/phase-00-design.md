# Phase 0: IA and visual design

**Status:** direction approved 2026-09-29 (IA and look); remaining screens still to draw. **Mockups:** https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open to anyone with the link).
The design system, mockup sources and previews are in `docs/design/`.

## Goal
Agree the information architecture and the look before any app code is written. The app is then built to the
approved mockups.

## Information architecture

| Place | Route | Job |
|---|---|---|
| Home | `/` | Start or resume: search for the roof, import KMZ/KML/DXF, open `.rtd`, open the demo, designs on this device |
| Find and outline | `/find` | Search the map, outline the roof on satellite imagery, choose the roof type, build |
| Studio | `/studio/[lens]` | Shape the design on the 3D roof. Lenses: `roof`, `array`, `sun`, `strings` |
| Performance | `/performance` | Prove the energy: KPIs, P-values, loss chain (losses edited in place), monthly, 25 years, weather, assumptions |
| Handover | `/handover/[item]` | Deliver: report, SLD, BOM, cable schedule, DXF, KMZ, hourly CSV, project file |

Always present: project switcher, workspace nav, save state, Present, Export, and the vitals bar
(energy, DC, AC, DC/AC, modules, PR, yield, notes to review).

### Where each desktop capability lives

| Capability | New home |
|---|---|
| Roof entry: outline on satellite (new), rectangle, corners, KMZ, DXF; lat/lon | Find and outline; Home for file import |
| Roof type, pitch, parapet, setback, walkways, albedo, corner table | Studio, Roof lens |
| Obstacles (box, cylinder, wall, tree, building), clearance | Studio, Roof lens: add, select, drag and edit on the roof |
| PAN file, tilt, orientation, modules in tilt, clearance, azimuth, E-W tilt and ridge gap, row pitch | Studio, Array lens |
| Shade-free window, design day, allow shaded positions | Studio, Array lens (they decide placement) |
| Shadow plan, time scrub, play, shading figures | Studio, Sun lens |
| OND file, Imax per MPPT, system voltage, sizing temperatures, cell rise, series range, options, custom option, MPPT table, AC cable length | Studio, Strings lens |
| Weather source, all losses, bifacial, uncertainty, P-levels, CO2 factor, degradation, Uc | Performance |
| Loss diagram, monthly chart and table, P-values, 25 years, summary | Performance |
| SLD, BOM, cable schedule, PDF, DXF, KMZ, CSV, SLD image, save/open `.rtd` | Handover |
| Headline totals and warnings | Vitals bar and "notes to review" |

### Responsive behaviour

| Width | Studio | Performance / Handover |
|---|---|---|
| Phone (< 640) | 3D on top, vitals as a swipe row, inspector in a bottom sheet with the lens switch, bottom tab bar | Single column; charts full width; Handover list then preview as a pushed screen |
| Tablet (640 to 1100) | 3D on top, vitals as a 4 x 2 grid, inspector in two columns below, lens switch over the 3D | Two columns where content allows |
| Desktop (> 1100) | Lens rail left, 3D centre, inspector right, vitals floating at the bottom | 12-column grid |

Touch targets are 44 px or more on phone and tablet.

## Visual language: "Dusk"

| Token | Value |
|---|---|
| Ground / surface 1 / surface 2 | `#0B0E13` / `#12161D` / `#181D26` |
| Chrome bars | `#0E1218` |
| Lines | `#1C222C`, `#232A36`, strong `#2F3847` |
| Text primary / secondary / muted | `#F2F4F7` / `#A9B2C0` / `#7C8696` |
| Accent (sun, primary action, selection) | `#FFB020`, ink on it `#1A1204` |
| Tick | `#3DD6A0` |
| Note (exclamation) | `#FFB020` on `#1E1A10`, border `#3A3220` |
| Chart gain / loss | `#3987E5` / `#D95926` (validated for colour-blind separation on dark) |
| Module glass / frame line | `#16294D` / `#33558C` |
| Display face | Bricolage Grotesque 600 |
| UI face | Geist 400/500/600 |
| Numbers | Geist Mono 500, units in Geist 400 secondary |
| Radius | 6 inputs, 10 controls, 14 to 18 cards |
| Raised (buttons, cards) | top highlight `inset 0 1px 0 rgba(255,255,255,.06)`, `0 1px 2px rgba(0,0,0,.45)`, `0 4px 12px rgba(0,0,0,.25)` |
| Primary button | adds a warm glow `0 8px 22px rgba(255,176,32,.24)` |
| Recessed (fields, segment wells) | ground `#090C10`, `inset 0 1px 3px rgba(0,0,0,.65)` |
| Floating (over the roof or map) | `0 16px 40px rgba(0,0,0,.5)` |
| Focus | 2 px amber ring, 2 px offset; fields add a 3 px amber halo |
| Motion | 160 ms hover and press, 240 ms panels, 600 ms number roll, 1.2 s map to 3D; none under reduced motion |

## Delivered in round 1
- IA map, Home (desktop), Studio Array lens (desktop, tablet, phone), Performance (desktop), Handover (desktop).

## Delivered in round 2
- Find and outline (desktop, phone), Studio Roof lens on satellite ground (desktop), Controls, depth and motion.
- Depth applied to every board: raised buttons, recessed fields, card elevation, focus ring, hover and press.
- Home headline changed; the search field is now the primary action.

## Delivered in round 3
- Studio Sun lens (shadows at 16:00 on the design day, sun path, day timeline, shading figures).
- Studio Strings lens (modules coloured by MPPT, selected string, series range, options A to E).
- Studio Strings lens before a system voltage is chosen (nothing preselected, what is waiting, what is done).
- The option captions "Fills the inverter" and "Lower clipping" are new copy: the engine only labels
  "Recommended" and the DC/AC verdicts, so these are derived in the web app from the option's numbers.

## Still to draw
- Studio: Sun lens shade map; Strings lens MPPT loading table, custom option and "no string length fits".
- Studio Roof, Sun and Strings lenses on phone and tablet.
- Roof types: flat east-west and sloped flush variants of the 3D.
- Performance and Handover on phone and tablet; Home on phone.
- States: computing, import with missing obstacle heights, errors.
- Present mode.

## Acceptance
- Owner approves A1 and A2 in `README.md`.
- Every row of `reference/functional-inventory.md` has a home in an approved screen.
