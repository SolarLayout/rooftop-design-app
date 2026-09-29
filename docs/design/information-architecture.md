# Information architecture

## The idea
The 3D roof is the interface. The user changes the roof and every number follows. Inputs and results are never on
separate screens, and there is no Run button.

## Places

| Place | Route | Job |
|---|---|---|
| Home | `/` | Start or resume: search for the roof, import KMZ, KML or DXF, open a `.rtd` project, open the demo, designs on this device |
| Find and outline | `/find` | Search the map, outline the roof on satellite imagery, choose the roof type, build |
| Studio | `/studio/[lens]` | Shape the design on the 3D roof. `lens` is `roof`, `array`, `sun` or `strings` |
| Performance | `/performance` | Prove the energy: KPIs, P-values, loss chain, monthly, 25 years, weather, assumptions |
| Handover | `/handover/[item]` | Deliver: report, single-line diagram, BOM, cable schedule, DXF, KMZ, hourly CSV, project file |

Studio, Performance and Handover are the three **workspaces**. They share one project and one top bar.

## Always present (in the three workspaces)

| Element | Content | Behaviour |
|---|---|---|
| Top bar | Logo, project switcher with coordinates, workspace navigation, save state, Present, Export | Fixed. 56 px desktop, 60 px tablet, 56 px phone |
| Workspace navigation | Studio, Performance, Handover | Segmented control in the top bar on desktop and tablet; bottom tab bar on phone |
| Vitals | Energy year 1, DC capacity, AC capacity, DC/AC, modules used of positions, PR, yield, notes to review | Same values on every screen. Updates as results arrive |
| Notes to review | Count and first note; opens the list | Exclamation mark, amber. Never a red cross |

## Studio

| Region | Desktop (over 1100) | Tablet (640 to 1100) | Phone (under 640) |
|---|---|---|---|
| Lens switch | Vertical rail, left, 72 px | Horizontal, floating over the top of the 3D | Segmented control at the top of the bottom sheet |
| 3D stage | Fills the centre | Full width, top, about 508 px | Full width, top, about 252 px |
| View controls (3D, Plan, Fit, north) | Floating, top right of the stage | Floating, top right | 3D and Plan only, top right |
| Inspector | Right panel, 384 px | Two columns under the vitals | Bottom sheet with a drag handle |
| Vitals | Floating bar at the bottom of the stage | Grid of 4 by 2 under the stage | One row that scrolls sideways under the stage |
| Time control | Floating pill, bottom left of the stage (a full timeline in the Sun lens) | Floating pill | Play button with the time, top left of the stage |

### What each lens holds

| Lens | On the roof | In the inspector |
|---|---|---|
| Roof | Building, parapet, setback line, obstacles. Select, drag, resize, add | Location and outline (with Edit, back to Find and outline), roof type, parapet, setback, walkways, clearance, albedo, obstacle list and the selected obstacle's fields |
| Array | Module rows, kept-clear zones with their reason | Module (PAN), tilt, orientation, modules in tilt, clearance, row pitch, azimuth, shade-free window, design day, allow shaded positions |
| Sun | Cast shadows at a chosen time, sun path, shade-free window on the path; or the shade map | Shadows or shade map, day, sun height and bearing, shading figures over the year, overlays |
| Strings | Modules coloured by string, MPPT or inverter; unused positions; inverter markers; selected string | Inverter (OND), system voltage, modules in series, options A to E and the user's own, sizing temperatures, MPPT loading |

The ground under the building is satellite imagery when the project has a location, or a plain dark grid. The
Layers button switches between them in any lens.

## Performance
Header (option switch, weather source), KPIs, loss chain with editable losses in place, monthly energy, 25 years,
assumptions. Twelve-column grid on desktop; single column on phone.

## Handover
List of deliverables on the left, preview of the selected one on the right, project file at the bottom of the
list. On phone the list is the screen and a preview opens as a pushed screen.

## Flow for a new design
1. Home: type an address, press "Find my roof".
2. Find and outline: the map goes to the address; outline the roof by corners, by rectangle, or by accepting a
   detected footprint; choose the roof type; "Build this roof".
3. Studio opens on the Roof lens. The map tilts into 3D and the building rises on the imagery.
4. The array fills the roof at once with defaults. The user adjusts in the Array lens.
5. Strings lens: the user chooses the system voltage. Until then, energy and everything that depends on it wait
   and say so. Nothing is preselected.
6. Performance and Handover become complete.

## Where each capability of the desktop app lives
See the table in `plan/phase-00-design.md`. Every row of `plan/reference/functional-inventory.md` must have a home
in an approved screen.
