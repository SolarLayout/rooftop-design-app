# Phase 5: Studio, the 3D roof, Roof and Array lenses

**Status:** not started. **Depends on:** phases 2, 3 and 4. Read `reference/r3f-notes.md` first.

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
