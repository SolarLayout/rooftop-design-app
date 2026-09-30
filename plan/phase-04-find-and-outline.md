# Phase 4: find the roof on the map and outline it (flagship)

**Status:** in progress, session 6 (2026-09-30). Steps 1 to 11 of `phase-04-plan.md` are built: pull request #35 is merged,
#36 holds the outline and Build; steps 13 to 15 (obstacles on the map, entry by hand) remain. **Depends on:** phases 2 and
3, and the Esri API key from the owner (D13).
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

## As built

### What exists

| Part | Where | Pull request |
|---|---|---|
| `POST /roof/from-map`: a roof drawn in WGS84 to a whole `Project` in local metres through `geo.py`; `POST /roof/on-map`: a roof back on the map; `map` as a roof source | `apps/api/src/rooftop_api/services/roof_map.py`, `schemas/roof_map.py`; the client's `roofFromMap`, `roofOnMap` | #35 |
| The stores at the root of the app; the shell alone opens the demo | `apps/web/app/layout.tsx`, `components/shell/stores.tsx`, `Shell.tsx` | #35 |
| The map: MapLibre GL JS 6.11.2 with Esri's imagery behind `MapProvider`; the scale bar, the attribution; north and zoom; the states without a map (no key, no WebGL, the tiles do not come) | `apps/web/lib/map` (`provider.ts`, `esri.ts`, `scale-bar.ts`, `map-state.ts`), `components/find/RoofMap.tsx`, `MapButtons.tsx`, `NoMap.tsx`; MapLibre's worker in `public/maplibre-gl` by `tools/vendor-maplibre.ts` | #35 |
| The route `/find`: the frame on three sizes, the steps, the ways to it (the project switcher, the placeholder Home) | `apps/web/app/find`, `components/find/Find.tsx`, `Steps.tsx` | #35 |
| The search: words to the geocoder, coordinates and maps links read without a request, Use my location; the list of places by keyboard and pointer; nothing found and a search that failed | `lib/map/place-input.ts`, `search-state.ts`; `components/find/Search.tsx` | #35 |
| The geometry of the outline as pure functions; its state as a reducer with every rule of drawing | `apps/web/lib/outline` | #36 |
| Corners: placing, snapping, closing (which squares four corners within 3° of a rectangle), dragging, midpoints, typed lengths, undo, redo, clear, the keys, the loupe on touch | `components/find/OutlineLayer.tsx`, `OutlinePanel.tsx`, `OutlineTools.tsx`, `use-outline-keys.ts` | #36 |
| Rectangle: a box dragged, turned by its handle | the same, `lib/outline/rectangle.ts` | #36 |
| Detect building: Overture's footprints of the pinned release, faint while the tool is in hand, a press proposes the building's outline with a callout | `lib/map/overture.ts`, `components/find/DetectedCallout.tsx`; the extract `tools/footprints.ts`; the fixture `e2e/fixtures/footprints-pune.pmtiles` | #36 |
| The roof type, Build this roof, the Roof lens's card with Edit and the roof type as a committed edit | `components/find/RoofTypeChoice.tsx`, `lib/outline/build-request.ts`, `components/studio/RoofInspector.tsx`, `lib/roof-card.ts` | #36 |

### Acceptance

| Asked | Met by |
|---|---|
| From Home to a 3D roof in under 60 seconds for a rectangular building, on desktop and on a phone | `e2e/tests/build.e2e.ts`: from Home to the Studio on the Roof lens under 60 s on phone, tablet and desktop. The 3D roof itself is Phase 5 |
| Outline a known 90.0 x 40.0 m test rectangle: edges within 0.5 m, area within 2 % | `outline.e2e.ts` on the panel's numbers, by corners and by rectangle; `build.e2e.ts` on the outline the web app sends to `/layout`, after the API's projection |
| Typed edge length changes the polygon and every dependent number | `outline.e2e.ts`, "a length typed into an edge" |
| Attribution is always visible on the map and in the 3D scene | `find.e2e.ts`; with the footprints, Overture's line too. The 3D scene is Phase 5 |
| Playwright on three viewports with map tiles mocked from fixtures: draw by corners, by rectangle, accept a detected footprint (fixture), edit an edge, build | `find.e2e.ts`, `outline.e2e.ts`, `build.e2e.ts`; the imagery a fixture tile, the geocoder a fixture, the footprints one tile of Overture's release served by ranges. No request leaves the machine |

### Decided while building

D40 to D49 in `plan/README.md`. Beside them:

| Decision | Why |
|---|---|
| The map says `aria-busy` while it moves | A press stops its flight where it is; a test must know when it has arrived |
| The panel's title and lead follow the step and the tool: "Find the roof" before a place, then the words of the boards for corners, rectangle and detect | The boards draw step 2; step 1 needs words of its own |
| A rectangle within a degree of right angles stays one for the names of its edges and for a typed length; closing squares four corners within 3° | A press is never exact; a dragged rectangle should stay named by its sides |
| Snapping puts a corner on the snapped line at the foot of the pointer, not at the pointer's distance | What the pointer meant along the line is kept, as snapping to an axis does |

### Deviations from the scope as written

| Scope | As built | Why |
|---|---|---|
| "The map tilts, the imagery stays on the ground, the building rises, Studio opens on the Roof lens" | The Studio opens on the Roof lens with the card of the roof; the tilt and the rising building are the stage of Phase 5 | The 3D stage is Phase 5 |
| Obstacles on the map; "Enter dimensions by hand instead" | Not yet: pull request 3, steps 13 to 15 | The order of the plan |
| "Imagery tiles for the ground of the 3D scene" | The provider gives the tile addresses; the ground is Phase 5 | The 3D stage is Phase 5 |

### Found on the way

- MapLibre counts its zoom on tiles of 512: its zoom 18 is the native zoom 19 of Esri's tiles of 256, about 0.3 m
  per pixel. The scale bar and the roof zoom count the same way.
- Under Next's bundler MapLibre's worker gets the page's own address and fails to load; the raster map still
  draws, the vector layers do not. The app serves the worker and its shared module itself
  (`tools/vendor-maplibre.ts`, `setWorkerUrl`), and a test holds the copies equal to the pinned package.
- MapLibre's stylesheet makes its container `relative` and, loaded later, wins over `absolute`: the container is
  sized, not placed.
- A press on the map stops its flight where it is: the first corners of a test were placed at zoom 18.4 and the
  rectangle came out at two thirds.
- A colour token named like a width utility (`--color-handle` beside `border-handle`) makes Tailwind read the width as
  a colour; the colour is `--color-handle-fill`.
- A sphere's metres per degree are 0.5 % out in latitude at Pune: 0.24 m on 40 m. The frame of the map uses the
  ellipsoid's series. The API's frame is the grid north of its UTM zone, 0.36° from true north at Pune (D41).
- Overture's releases disappear: the one of February answered 410 by September. The release is pinned and the
  tiles of the tests are in the repo.
- Esri's imagery host answers with the key from the test stack's port 4710, which is not among the key's referrers.
- The `pmtiles` reader's `FileSource` wants a file of the browser; Bun's file serves it in a test.
- A tool button with a shorter word on phone had a different name there; a button's name is set once, for the eye
  the word may change.
