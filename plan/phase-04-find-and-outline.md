# Phase 4: find the roof on the map and outline it (flagship)

**Status:** not started. **Depends on:** phases 2 and 3, and the Esri API key from the owner (D13).
**Mockups:** "Find and outline" desktop and phone, "Studio, Roof lens".

## Goal
A user types an address, sees their building from above, marks the roof, and is standing in a 3D model of it
a second later. No measuring elsewhere, no typing of coordinates.

## Flow
1. **Find.** Search by address or place, or paste coordinates or a maps link. "Use my location" on phones.
   The map flies to the result at roof zoom.
2. **Outline.** Three ways, one result (a polygon in local metres plus lat/lon of its centroid):
   - Corners: click or tap each corner; click the first again to close. Drag corners; drag a midpoint to add one.
   - Rectangle: drag a box, rotate it to the building.
   - Detect building: click inside the building; if a footprint is known there, it is proposed as the outline
     for the user to accept or adjust. Best effort: it depends on data coverage, and says so when nothing is found.
3. **Build.** Choose the roof type, press "Build this roof". The map tilts, the imagery stays on the ground,
   the building rises, Studio opens on the Roof lens.

## Scope
- Map component behind a provider interface (`MapProvider`: tiles, search, attribution, terms flags), so the
  provider can change without touching the flow. First provider per `reference/map-providers.md`.
- Map renderer: MapLibre GL JS with the Esri style `arcgis/imagery/standard` (raster, native to zoom 19,
  over-zoom beyond). The same tile URLs feed the ground texture of the 3D scene.
- Imagery tiles are never stored: a saved project keeps the outline and re-fetches imagery on open.
- Detect building reads Overture building footprints (pinned release, PMTiles by HTTP range request).
- Live measurements while drawing: every edge length, area, corner count, the direction the long side faces.
- Type a measured length into an edge to correct the outline (the edge scales about its midpoint; with
  "Square the corners" on, the rectangle stays a rectangle).
- Snapping: 90 degrees within 3 degrees, parallel to an existing edge, close on the first corner.
- Undo, redo, clear. Keyboard: Enter closes, Escape cancels the last point, arrows nudge a selected corner 0.1 m.
- Touch: tap to place; a magnifier loupe above the finger while dragging a corner; 44 px handles.
- Conversion WGS84 to local metres in the API (`geo.py`), so the engine's own projection is the only one.
- Obstacles can be outlined on the map too (box, circle, wall line, building polygon); heights are asked for
  right after, because imagery cannot give them.
- "Enter dimensions by hand instead": the rectangle and corner-table entry of the desktop app.
- Imagery tiles for the ground of the 3D scene, fetched for the roof's surroundings (about 300 m square).
- The Esri key is read from `NEXT_PUBLIC_ESRI_API_KEY` in `apps/web/.env.local` (never committed); it is
  restricted by referrer and scoped to basemap tiles and geocoding only.
- Offline and no-key behaviour: the flow falls back to entering dimensions by hand; the demo is unaffected.

## Limits to state in the UI (honest by design)
- Heights never come from the image: parapet, obstacle heights and roof pitch are asked for.
- Imagery is a photo from above, not a survey. Expect about half a metre per edge; tall buildings lean in the
  image. The outline is of the roof edge as seen, and typed lengths override it.
- Imagery can be a few years old.

## Acceptance
- From Home to a 3D roof in under 60 seconds for a rectangular building, on desktop and on a phone.
- Outline a known 90.0 x 40.0 m test rectangle: edges within 0.5 m, area within 2 %.
- Typed edge length changes the polygon and every dependent number.
- Attribution is always visible on the map and in the 3D scene.
- Playwright on three viewports with map tiles mocked from fixtures (tests never touch the network):
  draw by corners, by rectangle, accept a detected footprint (fixture), edit an edge, build.

## Out of scope
Automatic detection of obstacles or roof pitch from imagery. 3D city models.
