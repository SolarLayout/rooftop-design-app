# Information architecture

## The idea
The 3D roof is the interface. The user changes the roof and every number follows. Inputs and results are never on
separate screens, and there is no Run button.

## Places

| Place | Route | Job |
|---|---|---|
| Home | `/` | Start or resume: search for the roof, import KMZ, KML or DXF, open a `.rtd` project, open the demo, designs on this device |
| Find and outline | `/find` | The first part of the Roof step (V2 · 4): search in the column, outline the roof on satellite imagery, add what stands on it, choose the roof type, build. The Studio's work column at the right (the sheet on touch), Build pinned at its foot |
| Studio | `/studio/[step]` | Shape the design on the 3D roof, step by step. `step` is `roof`, `array` or `strings`; `/studio/sun`, the Sun lens's old address, turns the Sun view on over the step in hand (D95) |
| Performance | `/performance` | Prove the energy: KPIs, P-values, loss chain, monthly, 25 years, weather, assumptions |
| Handover | `/handover/[item]` | Deliver: report, single-line diagram, BOM, cable schedule, DXF, KMZ, hourly CSV, project file |
| Present | `/present` | Show: the design's tour on the whole screen without the shell, from the head of Performance and Handover |

V2 (D95): one **order of work**, five steps: Roof (Find is its first part), Array, Strings, Performance, Handover. Each step
has its state (done, needs you, to do) and one primary that leads to the next. Sun is a **view** of the stage on every
Studio step, no step. The steps after Find share one project and one top bar.

## What the steps share

| Element | Content | Behaviour |
|---|---|---|
| Top bar | Logo (to Home), the design's name with its saved mark, the five steps, the result, Docs | Fixed. 56 px desktop, 60 px tablet, 56 px phone. No Export, no Present: the zip is Handover's Download all; Present is at the head of Performance and Handover |
| The steps | Roof, Array, Strings, Performance, Handover, each with its mark | In the top bar on desktop and tablet; the tab bar at the foot of the phone. On Find the steps after Roof cannot be gone to |
| The result | The energy of year 1 a year, and how many notes wait | A chip at the top bar's right on desktop and phone, a row under the stage on tablet; pressed, the summary in plain names (Energy in year 1, Modules, DC capacity, AC capacity, DC/AC ratio, Performance ratio (PR), Yield) and Open Performance. The vitals bar is gone |
| Notes to review | How many; opens the list | Beside the result. Exclamation mark, amber. Never a red cross |

## Studio

| Region | Desktop (over 1100) | Tablet (640 to 1100) | Phone (under 640) |
|---|---|---|---|
| 3D stage | Fills the centre; the whole width while the work column is hidden (D99) | Full width, top, 440 px, the result row under it (the energy at the left, the modules and the kWp at the right) | Full width, top, 40 % of the height; the sheet at half meets its foot |
| View controls (3D, Plan, Fit, north, Sun, Layers; Show panel while the column is hidden) | Floating, top right of the stage | Floating, top right | 3D, Plan, Sun and Layers, top right |
| Work column | Right panel, 384 px: the step's head (its instruction, one line, the first-open status), its sections as summary rows, its primary pinned at the foot (V2 · 3); Hide panel (⌘ \) at its top right, the primary then floating at the stage's foot | Under the stage, one column, the primary at the screen's foot beside its Next line | Bottom sheet with a drag handle, the primary at its end |
| Time control | In the Sun view alone: its timeline across the stage's foot | The same | In the Sun view alone: the play button with the time, top left of the stage |

### What each step holds

| Step | On the roof | In the inspector |
|---|---|---|
| Roof | Building, parapet, setback line, obstacles. Select, drag, resize, add | Location and outline (with Edit, back to Find and outline), roof type, parapet, setback, walkways, clearance, albedo, obstacle list and the selected obstacle's fields |
| Array | Module rows, kept-clear zones with their reason | Module (PAN), tilt, orientation, modules in tilt, clearance, row pitch, azimuth, shade-free window, design day, allow shaded positions |
| Sun (a view, on every step) | Cast shadows at a chosen time, the sun's arc, its shade-free hours; or the shade map | Shadows or shade map, day, sun height and bearing, shading figures over the year, what is drawn on the roof |
| Strings | Modules coloured by string, MPPT or inverter; unused positions; inverter markers; selected string | Inverter (OND), system voltage, modules in series, options A to E and the user's own, sizing temperatures, MPPT loading |

The ground under the building is satellite imagery when the project has a location, or a plain dark grid. The
Layers button switches between them on any step.

## Performance
Header (option switch, weather source), KPIs, loss chain with editable losses in place, monthly energy, 25 years,
assumptions. Twelve-column grid on desktop; single column on phone.

## Handover
List of deliverables on the left, preview of the selected one on the right, project file at the bottom of the
list. On phone the list is the screen and a preview opens as a pushed screen.

## Flow for a new design
1. Home: type an address, press "Find my roof".
2. Find and outline: the map goes to the address; outline the roof by corners, by rectangle, or by accepting a
   detected footprint; add what stands on it; choose the roof type, a question with a default; "Build this roof · <area>",
   pinned at the column's foot from the closed outline on (V2 · 4, D98).
3. Studio opens on the Roof step and says what happened (V2 · 3, D97): `Check the roof`, the line of what the app set,
   `The array is on the roof` with its modules and kWp, then `Computing the energy`, then the energy of year 1; one
   primary, `Continue to Array`. The status is said until the user continues. The stage draws the design day's noon.
4. The array fills the roof at once with defaults; every section says who set it (`Default`, `From the weather`,
   `Set for <country>`, `Yours`). The user adjusts in the Array step.
5. Strings step: the user chooses the system voltage. Until then, energy and everything that depends on it wait
   and say so. Nothing is preselected.
6. Performance and Handover become complete.

## Where each capability of the desktop app lives
See the table in `plan/phase-00-design.md`. Every row of `plan/reference/functional-inventory.md` must have a home
in an approved screen.
