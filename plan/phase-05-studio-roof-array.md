# Phase 5: Studio, the 3D roof, Roof and Array lenses

**Status:** in progress, session 9 (2026-09-30). How it is built: `phase-05-plan.md` (five pull requests). Merged: #42 (the
scene, the building, the obstacles, the ground, the camera and the view controls), #43 (the modules, the kept-clear areas,
the sun, the plan without WebGL). In progress: the Roof lens inspector (pull request 3), the Array lens inspector (pull
request 4), selection and direct manipulation (pull request 5). **Depends on:** phases 2, 3 and 4. Read `reference/r3f-notes.md` first.
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

### Acceptance, so far

| Asked | Met by |
|---|---|
| Demo roof shows 790 positions in 6 rows | `e2e/tests/modules.e2e.ts`: the stage's text equivalent held equal to `/layout`'s answer, on three sizes |
| All three roof types render and match `/layout` counts (790, 940, 1,068) | The same test: the roof type switched in the Roof lens, the counts read from the answer |
| Playwright: canvas non-blank, screenshot baselines | `stage.e2e.ts`: a pixel of the roof read from a picture of the canvas; the baselines of the Studio on three sizes |
| Changing tilt refits within 200 ms; drag the stair room; selection by click; inspector edits round-trip; 60 fps; 20 lens switches | Pull requests 3 to 5 |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Decision 7: `preserveDrawingBuffer` on, the tests read the canvas's pixels | The buffer is not kept; a test reads a pixel from a picture of the canvas decoded in the page | `readPixels` gave zeros under three browsers at once; a picture reads what the screen shows |
| Step 7: the walkways drawn | The roof shows through the gaps of the layout | The gaps are the walkways; a strip of its own drew nothing new |
| The Array lens's line says "1,646 m² of modules" (the board) | "2,038 m² of modules": the area of all the positions | The board's number was of the chosen option's 638 modules; the Array lens is about the positions |
| The dimension labels along the edges (the board) | Chips at the middle of each edge, upright | Placed by projection as the map's labels are; a turned label needs the edge's on-screen angle, which the plan view makes moot |

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
