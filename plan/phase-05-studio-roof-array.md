# Phase 5: Studio, the 3D roof, Roof and Array lenses

**Status:** done, session 9 (2026-09-30 to 2026-10-02). How it was built: `phase-05-plan.md` (five pull requests).
Merged: #42 (the scene, the building, the obstacles, the ground, the camera and the view controls), #43 (the modules, the
kept-clear areas, the sun, the plan without WebGL), #44 (the Roof lens inspector, the obstacles, the import of a drawing),
#45 (the Array lens inspector, the states of the stage), #46 (a DXF's place asked), #47 (selection by raycast, undo and
redo, the drag and the handles of an obstacle). **Depends on:** phases 2, 3 and 4. Read `reference/r3f-notes.md` first.
**Mockups:** "Studio, Roof lens" (desktop, tablet, phone), "Studio, Array lens" (desktop, tablet, phone), "Obstacle edited on
the roof", "Roof types in 3D", "Studio, Array lens, states", "Import with missing heights".

## Goal
The user builds a roof and fills it with modules on a real 3D model, on any screen size.

## Scope: 3D scene (`apps/web/components/scene`)
- Canvas loaded with `next/dynamic`, `ssr: false`. ACES tone mapping, PCF shadows, `dpr={[1,2]}`,
  near/far scaled to the roof, `frameloop="demand"` with `invalidate()` on change.
- Coordinates: engine is x east, y north, z up (metres). One adapter maps to three.js (x east, y up, z south).
  Nothing else converts.
- Building mass, roof surface (flat, or pitched for sloped flush), parapet, setback line, walkways.
- Obstacles: box, cylinder, wall, tree (trunk and crown), building. The automatic parapet is not selectable.
- Modules as instanced meshes (frame and glass split, see notes) for all three roof types:
  tilted rows, east-west back-to-back, flush.
- Keep-out zones as ground overlays; selecting one names the obstacle and the hours that cause it.
- Camera: orbit with damping, never below the roof plane; presets 3D, Plan (top, north up), Fit, Sun's eye.
  Touch: one finger orbit, two fingers pan and pinch.
- Selection by raycast: roof, obstacle, row, module. Hover highlight on pointer devices.
- Direct manipulation: drag an obstacle on the roof plane (snap 0.1 m), handles for size and rotation,
  height by handle or field. Add obstacle places it where the user taps.
- North marker, dimension labels, scale.
- Satellite ground: the imagery from phase 4 draped on the ground plane under the building, on by default when
  the roof has a location, switched in Layers. The map-to-3D transition lands in this scene.
- Plan view is the same scene with an orthographic top camera, so there is one source of truth.

## Scope: Roof lens inspector
All inputs of inventory sections 1.1 and 1.2: location, source (rectangle, corners, KMZ/KML, DXF with units),
corner table, roof type, pitch and slope direction, parapet, setback, walkway width and spacing, obstacle
clearance, albedo, obstacle list with per-kind fields. "Edit outline" returns to the map of phase 4 with the
outline loaded.
Import reports obstacles whose height was missing and selects them one by one.

## Scope: Array lens inspector
All inputs of inventory sections 1.3 and 1.4 (module): PAN upload and parsed fields, coefficient line,
tilt with latitude hint, orientation, modules in tilt, lower-edge clearance, azimuth with "follow the roof edge",
east-west tilt and ridge gap, row pitch with "shade-free", shade-free window, design day, allow shaded positions.
Read-outs: positions, tables, rows, pitch, GCR, limiting profile angle, areas.

## Acceptance
- Demo roof shows 790 positions in 6 rows; changing tilt to 10 degrees refits within 200 ms of release.
- All three roof types render and match `/layout` counts (790, 940, 1,068 on the demo roof).
- Drag the stair room 5 m east: keep-out and module count update; undo restores.
- Playwright on three viewports: canvas is non-blank (pixel sample), selection by click works, inspector edits
  round-trip to the store; screenshot baselines.
- 60 fps orbit on a mid laptop with 1,068 modules; no WebGL context loss after 20 lens switches.

## Out of scope
Sun animation, strings colouring, energy.

## As built

### What exists

| Part | Where | Pull request |
|---|---|---|
| The adapter of the engine's metres (x east, y north, z up) to three's (x east, y up, z south), the one place that converts; the 3D palette held equal to `design-tokens.md` by a test | `apps/web/lib/scene/adapter.ts`, `lib/scene-palette.ts` | #42 |
| The canvas drawn on demand with PCF shadows, loaded in the browser alone; the building with its parapet and its walls down to the ground, a sloped roof drawn pitched about its centroid; the obstacles of every kind; the ground: the map's imagery tiles around the roof stitched into one texture, plain with a grid without a key; the context lost heard | `components/scene/SceneCanvas.tsx`, `Building.tsx`, `Obstacles.tsx`, `Ground.tsx`; `lib/scene/building.ts`, `obstacles.ts`, `ground.ts`, `stitch.ts` | #42 |
| The camera: an orbit never below the roof, the presets 3D, Plan (orthographic, north up), Fit and Sun's eye through a request count; the north control that shows the bearing and turns north up; the view controls of each size; the dimension labels as DOM placed by projection through a stage store the scene writes only when a pixel changes | `components/scene/CameraRig.tsx`, `Projector.tsx`; `components/studio/ViewControls.tsx`, `Labels.tsx`; `lib/scene/camera.ts`, `projection.ts`, `stage-store.ts`; `measures()` gained `turn` | #42 |
| The stage of the Studio: the lens's title with its line of read-outs, the attribution under the imagery, the text equivalent of what is drawn (the roof, the obstacles, the modules, the kept-clear areas, the sun, the ground), the state without WebGL | `components/studio/Stage.tsx`, `stage-view.ts` | #42, #43 |
| The keep-out's parts count the positions each keeps clear (`Keepout.positions`); the sun of the scene from `/sun` at the view's time, asked by the flow when the design opens or the place or the time changes, kept in the results store | `apps/api/src/rooftop_core/keepout_parts.py`, `services/layouts.py`, `design.py`; `apps/web/lib/flow/design-flow.ts`, `lib/stores/results-store.ts` | #43 |
| The modules of `/layout` as tilted quads, instanced, the frame casting and the glass taking the shadow, for the three roof types; the kept-clear areas as overlays that select, with the callout of what shades them and when; the sun light with its fitted shadow camera; the plan of the design without WebGL; the selection in the view store; a roof made sloped drops its parapet and gets a pitch | `components/scene/Modules.tsx`, `KeepOut.tsx`, `SunLight.tsx`; `components/studio/Callout.tsx`, `PlanFallback.tsx`; `lib/scene/modules.ts`, `keepout.ts`, `sun-light.ts`, `plan.ts`; `lib/studio/roof-type.ts` | #43 |
| The inspector mounted once, in the container of the size (decision 9); the Roof lens: the card of four lines, the roof type, Edges and access as fields (pitch and faces when sloped); the obstacles as rows, the selected one open with every field of its kind, the points of a wall or a building as a table, the parapet read-only; the list and the scene share one selection, the scene outlines the selected (accent) and the hovered (lighter), the callout names it, Escape clears; Add opens the kinds and the new obstacle is a draft, dashed, that joins the design when its height is typed (decision 15) | `components/shell/Studio.tsx`, `components/studio/use-size.ts`, `RoofInspector.tsx`, `ObstaclePanel.tsx`, `inspector-look.tsx`, `use-escape-clears.ts`; `components/scene/Obstacles.tsx`; `lib/studio/roof-fields.ts`, `obstacle-fields.ts`, `roof-type.ts`; `lib/roof-card.ts`; the view store's `draft` | #44 |
| Import a drawing from the project switcher: KMZ, KML or DXF with its units, held until Open the roof, sent as base64; `/roof/import` answers the whole document (decision 13), opened in the Roof lens; the heights the file could not give are a list to review: the engine's note under the card, Review and Next select each, a typed height takes it off, the rows and the roof mark them | `components/shell/ImportDrawing.tsx`, `ProjectSwitcher.tsx`; `lib/studio/import-drawing.ts`, `review-heights.ts`; `apps/api/src/rooftop_api/services/roof_files.py`, `schemas/roof_import.py`; the view store's `toReview` | #44 |
| A DXF's place asked in the import dialog: the search field of Find as a form field, then Latitude and Longitude, empty until found or typed; Open the roof waits for them; nothing is guessed | `components/shell/ImportDrawing.tsx`; `components/find/Search.tsx` (`look`) | #46 |
| The Array lens: the module card from the design's equipment with the Voc note, Replace through `/equipment/module` committing `pan_text` (a refused file leaves the equipment of before, D32); mounting by roof type (tilt with the latitude's hint, orientation, modules in tilt, clearance; east-west tilt and ridge gap; sloped follows the pitch); spacing with the switches of the pitch and the azimuth (null hands the choice to the engine, decision 16); the shade-free window by the quarter hour; the design day; shaded positions; the states of the stage: the line dimmed with a ring while a layout is on its way, a chip with the API's words and Try again when it failed | `components/studio/ArrayInspector.tsx`, `ModuleCard.tsx`, `ReplaceModuleDialog.tsx`, `ArrayMounting.tsx`, `ArraySpacing.tsx`, `LayoutFailed.tsx`, `stage-view.ts`; `lib/studio/array-fields.ts`, `array-view.ts`, `module-card.ts` | #45 |
| Selection by raycast: a press selects what it hit, a module by its instance, the roof, an obstacle, a kept-clear area, the ground clears; hover is the lighter outline and the cursor says what can be taken (decision 10); undo and redo of the last fifty committed edits with Cmd or Ctrl+Z and Shift (decision 11), an undo an edit like any other; the selected obstacle dragged on the roof plane, snapped to 0.1 m and kept inside the roof, the scene moving it alone with a dashed ghost at the old place and a live label, the drop one edit (decision 12); its handles placed by projection as the labels are: four corners for the size, the turn handle on its stem snapping to the right angles within 3°, the height handle on its stem, a tank's and a tree's edge for the diameter, 44 px on touch; Add then a tap places the draft where the tap was | `components/scene/pointer.ts`, `Obstacles.tsx`, `Modules.tsx`; `components/studio/Handles.tsx`, `use-history-keys.ts`; `lib/scene/pick.ts`, `drag.ts`, `handles.ts`, `projection.ts` (the stems); `lib/stores/project-store.ts` (`past`, `future`, `undo`, `redo`), the view store's `selection`, `dragging` | #47 |

### Acceptance

| Asked | Met by |
|---|---|
| Demo roof shows 790 positions in 6 rows | `e2e/tests/modules.e2e.ts`: the stage's text equivalent held equal to `/layout`'s answer, on three sizes |
| All three roof types render and match `/layout` counts (790, 940, 1,068) | The same test: the roof type switched in the Roof lens, the counts read from the answer |
| Playwright: canvas non-blank, screenshot baselines | `stage.e2e.ts`: a pixel of the roof read from a picture of the canvas; the baselines of the Studio on three sizes |
| Changing tilt to 10° refits within 200 ms of release | `e2e/tests/array-lens.e2e.ts`: the request of `/layout` within 200 ms of the pointer's release, on three sizes |
| Inspector edits round-trip to the store | `roof-lens.e2e.ts`, `array-lens.e2e.ts`: every field read back in the request of `/layout` |
| Selection by click works | `roof-lens.e2e.ts`, `modules.e2e.ts`: an obstacle and a kept-clear area pressed, the callout and the list follow |
| Drag the stair room 5 m east: keep-out and module count update; undo restores | `e2e/tests/manipulation.e2e.ts`: the stair room dragged 5 m east reads 27.50, `/layout` carries 27.5 and its kept-clear count changes; undo restores 22.50 and the count; on three sizes, by touch on phone and tablet |
| No WebGL context loss after 20 lens switches | `e2e/tests/lens-switches.e2e.ts`: twenty switches in a row, the stage still drawing the roof |
| 60 fps orbit on a mid laptop with 1,068 modules | Looked at by hand on 2026-10-02 with `fps.mjs` (headed Chromium, the sloped roof's 1,068 modules, an orbit drag): 56.3 frames per second on this machine's GPU (Apple M1 Ultra, ANGLE Metal). Near the mark, not at it; a mid laptop has not been measured |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Decision 7: `preserveDrawingBuffer` on, the tests read the canvas's pixels | The buffer is not kept; a test reads a pixel from a picture of the canvas decoded in the page | `readPixels` gave zeros under three browsers at once; a picture reads what the screen shows |
| Step 7: the walkways drawn | The roof shows through the gaps of the layout | The gaps are the walkways; a strip of its own drew nothing new |
| The Array lens's line says "1,646 m² of modules" (the board) | "2,038 m² of modules": the area of all the positions | The board's number was of the chosen option's 638 modules; the Array lens is about the positions |
| The dimension labels along the edges (the board) | Chips at the middle of each edge, upright | Placed by projection as the map's labels are; a turned label needs the edge's on-screen angle, which the plan view makes moot |
| The board groups the four AC units into one row of the obstacle list | A row each | Each is selected and edited alone |
| The fields with the label inside are 40 high on the boards | 44, the number field's touch size | One component, one size; the touch target rule |
| The Array lens's line "1,646 m² of modules" (the board) | "2,038 m² of modules" | As above: all the positions |
| The east-west "Unit pitch" and the sloped "Row pitch" read-outs of the states board | Not built | The API gives no unit gap; the sentences are not the engine's (plan decision 16: only the fields of `spacingOf`) |
| Try again in the chip of a failed layout is 32 high on the board | 36, the quiet button's size | One component |
| The import board, as first approved, had no place for a DXF | The place is asked (the board changed and approved on 2026-10-01, `99532e9`) | A DXF holds no place; nothing is guessed |
| The callout of the selected obstacle stands to the upper right of its dot (the board) | The chip is centred over its dot | One component; centred, it never covers the obstacle it names |
| The mid-drag picture on phone (the board shows the drag) | The phone's picture is the selected box with its touch handles, pinched in; the drag's picture is taken on desktop and tablet | The live label of a drag lands a pixel apart from one run to the next on phone |
| The handles are reached by keyboard (implied by the guidelines) | The handles are for the pointer alone (`aria-hidden`) | The fields of the card do the same by number, by keyboard |

### Found on the way

- Playwright asks the route handler registered last first: the fixture's `**/*` abort must itself answer the imagery,
  or a route registered earlier never sees it. The imagery is the fixture tile for every test now, because the
  Studio's ground fetches tiles too.
- The keep-out's parts together count 40 positions where the keep-out takes 44 away: the grid of the positions
  begins at the edge of what is usable, which the keep-out moves a little. Written in `demo-numbers.md`.
- A picture of the Studio taken before the sun's light and the ground's imagery arrived differed by 14 % of its
  pixels from one taken after: the text equivalent says both, and the screen tests wait for them.
- The phone pictures of Performance and Handover flipped between the tick and the note in the top bar as the run's
  result landed: the tests wait for the note on phone now.
- `bun tools/with-node.ts node` refuses "node" as a tool; the renderers of boards and pictures run with
  `/opt/homebrew/bin/node`.
- drei's `Text` loads its font from the network; the labels of the stage are DOM.
- A test of the API changed a module-scoped fixture in place (`test_coefficients_of_the_file_say_so`); it failed another
  test only in the order testmon chose. The test works on a copy now. No other test changes a shared fixture.
- A worktree has no `apps/web/.env.local`, so its Studio draws the plain ground and its pictures differ from the
  repo's: the baselines are made in the main working tree. An agent copied the key file into its worktree once; the
  copy was deleted unread.
- Both lens agents wrote a module for the look the inspectors share; they are one now (`inspector-look.tsx`).
- `git add -A` after a rebase takes conflict markers in: a file with markers broke the browser tests' import once.
- The desktop app put every DXF at its own default place, Pune, silently (`main_window.py`, `_choose_roof_file`).
- A mouse wheel over a DOM handle does not reach the canvas: zooming with the pointer exactly on a handle does nothing
  (the roof beside it zooms). Open.
- On a phone pinched in on an obstacle the callout and the turn handle can overlap. Open.
- Under the load of the whole suite: a lens's link pressed while the Studio re-renders can be lost (the tests press
  again); the browser merges wheel notches that come together, so a zoom by the wheel is not the same twice (the
  drag's picture is taken at the fit zoom on desktop); a label projected to a fraction of a pixel is drawn differently
  in two frames (`pixelOf` rounds to whole pixels); the damping of the orbit tails off for seconds (`cameraSettled` waits
  for the labels to stand still to a hundredth of a pixel over half a second); a `test.describe.configure({ timeout })`
  did not reach one test, which sets `test.setTimeout` itself.
- `readPixels` of the scene's canvas returned zeros under three browsers at once, drawing buffer kept or not; a picture
  of the canvas decoded in the page reads what the screen shows (decision 7 amended).
