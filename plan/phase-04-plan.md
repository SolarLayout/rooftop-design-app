# Phase 4: plan

Written 2026-09-30 by session 6, before anything of the phase is built, as the work order asks
(`plan/resume/005-phase-4-find-and-outline.md`). Scope and acceptance: `plan/phase-04-find-and-outline.md`.
This file says how the phase is built, in which order, what is decided unless the owner says otherwise,
what was found in the code and the API, what needs the owner, and what done means.

## What was found at the start of the session

- `main` is clean and matches `plan/STATE.md`: no branch, no open pull request, no stack running. The key
  file `apps/web/.env.local` is there (not read).
- `bun check` on `main`: everything green but eight browser tests on phone, all the same wait: the design
  result of the demo did not reach the vitals within 90 s. A spike of MapLibre in a second browser ran on the
  machine at the same time. The browser tests were run again alone; see the end of this file for the result.
- **MapLibre GL JS 6.11.2 renders in the browser of the tests** (software WebGL, `playwright.config.ts`):
  raster tiles from a local server plus a fill and a line layer, idle in 1 to 2 s on desktop and on phone,
  a drag in under 2 s. WebGL 2 is there. Its ESM build is three files: the module, a shared module and a
  worker module; Next bundles them. Licence BSD-3. So the fallback for "MapLibre does not render there" is
  not needed; what is needed is the state "No WebGL" of the guidelines, for browsers that have none.
- **Overture** buildings: release `2026-09-23.1` (the newest the STAC catalogue lists), one PMTiles archive
  of 180 GB at `https://tiles.overturemaps.org/2026-09-23.1/buildings.pmtiles`, range requests answered with
  `Access-Control-Allow-Origin: *`, tiles of zoom 0 to 14, gzip. The release of February is gone (410),
  as `map-providers.md` warned: a release is pinned, and the tiles the tests need are kept in the repo.
- `pmtiles` 4.5.0 (BSD-3) is the reader; it registers a `pmtiles://` protocol with MapLibre.
- The API has the projection (`rooftop_core/geo.py`, UTM through pyproj) and `POST /roof/import` for files,
  and nothing that takes an outline in WGS84. `Roof.source` is `coordinates`, `kmz` or `dxf`.
- The stores are made inside `Shell` (`components/shell/stores.tsx`), which is the layout of the three
  workspaces only, and `StoresProvider` opens the demo when no design is open. `/find` is outside the shell.
- `/find` has no page, and nothing links to it: "New design · Find the roof" of the project switcher is shown
  and cannot be used; Home is a placeholder with the name of the product.
- The key is scoped to the referrers `http://localhost:4700` and `http://127.0.0.1:4700`. The test stack
  runs on 4710: in the browser tests every request to Esri is answered from a fixture, so the key is never
  needed there. To look at the real imagery on the test stack the key needs `http://localhost:4710` too.

## How the work goes

- **Three pull requests**, split where nothing of the earlier depends on the later:
  1. `feat/phase-4-find`: the API's two endpoints, the stores for the whole app, the map, the search, the
     route `/find` and its frame on three sizes, the ways to it. Steps 1 to 5.
  2. `feat/phase-4-outline`: the geometry, the three ways to outline, the live measurements, typed
     lengths, snapping, undo, keyboard, touch, detect building, roof type, Build, the Roof lens card.
     Steps 6 to 12. The acceptance of the phase is met at its end.
  3. `feat/phase-4-obstacles-by-hand`: obstacles on the map with their heights, "Enter dimensions by hand".
     Steps 13 to 15, and the close.
- Every step is one commit (two when a token is new: the document first). A draft pull request after the
  first step, merged after the last, on a green check. `bun check` green before every commit.
- Test first, seen failing. Logic is a pure function or a store without React, tested with `bun test`;
  the API with pytest; what is seen with Playwright on 390, 834 and 1440.
- A screen or a state without a board is drawn first and shown to the owner: step 0 and step 13.
- `plan/STATE.md` is brought up to date on `main` after steps 2, 5, 8, 11 and 14, from a worktree.
- The owner hears after each step what is there and what was decided.

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 0 | Boards | Two boards, drawn with a builder as the boards of Phase 3 were (`mockups/build_phase4_boards.py`): **"Find and outline, tablet"** (834: the map full width, the panel a bottom sheet as on phone, the toolbar over the map), and **"Find and outline, states and tools"**: searching, nothing found, results list, the rectangle tool with its rotation handle, the footprint proposed ("From Overture Maps"), no footprint here, the loupe of the touch drag, no map key or offline, no WebGL. Previews rendered as session 5 did. Approval before step 3 | | |
| 1 | The API | `POST /roof/from-map` (`roofFromMap`): points in WGS84 (`lon`, `lat`), obstacles in WGS84 with their heights, the roof type, an optional name; answers a whole `Project`: the roof in local metres around its centroid through `geo.py`, `source: "map"`, everything else at the API's defaults. `POST /roof/on-map` (`roofOnMap`): a `Roof` in; its outline and obstacles in WGS84 out, to show a design on the map again. `map` joins `RoofSource`. `bun gen:api`; the client gets `roofFromMap` and `roofOnMap` | pytest: a 90 by 40 rectangle at Pune comes back as 90.0 by 40.0 within 0.01 m, centred, counter-clockwise; a polygon that crosses itself or has fewer than 3 points is refused with the reason; on-map of from-map gives the points back within 1 mm; obstacles keep their heights. `client.test.ts` | `api-client.e2e.ts` against the real API |
| 2 | The stores for the whole app | `StoresProvider` moves to the root layout; the flow starts there. The shell keeps "a workspace without a design opens the demo". `/find` reads and writes the project store and never opens the demo | `stores`: unchanged. `design-flow`: unchanged | The shell tests as they are |
| 3 | The map | `lib/map/provider.ts`: `MapProvider` (imagery tiles and their attribution, search, footprints, `allowsTracing`). `lib/map/esri.ts`: the provider of D13, the key from `NEXT_PUBLIC_ESRI_API_KEY`. `components/find/RoofMap.tsx`: MapLibre through `next/dynamic` with `ssr: false`, the imagery, zoom and north as the mockup draws them, the scale bar, the attribution always shown, the paint colours read from the tokens of its container. The frame of `/find` on three sizes: back, search field, steps, the panel (desktop) or the sheet (phone, tablet), "Imagery ©". The states no key and no WebGL, each with "Enter dimensions by hand instead". "New design" of the project switcher a link; the placeholder Home gets "Find my roof". `tools/imagery-preview` removed | `provider.test.ts`: the tile address with the key, the attribution words, no key is no provider; `esri.test.ts` | `find.e2e.ts`: renders on three sizes with tiles from the fixture; no request leaves the machine; attribution visible; no key; no WebGL; from the switcher and from Home to `/find`; axe; baselines |
| 4 | Search | `lib/map/place-input.ts`: what was typed is coordinates ("18.52000, 73.86000", with N/S/E/W or signs), a maps link (`@lat,lon,` or `q=lat,lon`), or words for the geocoder. The results list under the field (`FloatingPanel`, `list-keys`), the map flies to the result at roof zoom (19), the short label beside the field. "Use my location" on phone and tablet. States searching and nothing found | `place-input.test.ts`; the label of a result | geocoding from a fixture JSON; coordinates fly without a request; a link; my location from Playwright's geolocation; nothing found |
| 5 | Close of pull request 1 | Baselines looked at beside the previews; `STATE.md` | | |
| 6 | Geometry | `lib/outline/frame.ts` (a flat frame in metres around the map's centre, for what is shown while drawing), `measure.ts` (edges, area, corner count, the direction the long side faces, the centroid), `snap.ts` (90° within 3°, parallel to an edge within 3°, close on the first corner), `typed-length.ts` (an edge scaled about its midpoint; with the corners squared the rectangle stays one), `rectangle.ts` (a box from a drag, turned by its handle), `history.ts` (undo, redo, clear; a drag is one step), `nudge.ts` (0.1 m by an arrow) | All of it, with the 90 by 40 rectangle and with a hexagon | None |
| 7 | Corners | The tool of the mockup: click or tap places a corner, the first again closes; drag a corner; drag a midpoint to add one; the corner being edited pulses; handles 18 (22 on touch) with a hit area of 44; edge labels; the panel live: the four edge fields, "Square the corners", Area, Faces, Corners | Covered by 6 | The 90.0 by 40.0 rectangle by corners on three sizes: the fields say 90.0 and 40.0, the area 3,600 |
| 8 | Rectangle | Drag a box, turn it to the building by its handle; the same result | Covered by 6 | A box dragged and turned; its numbers |
| 9 | Typed lengths, snapping, undo, keys, touch | A length typed into an edge field corrects the outline and every number; snapping as scope; Undo, Redo, Clear; Enter closes, Escape takes the last corner back, arrows nudge the selected corner; on touch the loupe over the finger while a corner is dragged (board of step 0) | Covered by 6 | A typed 90.0 on an edge of 88.3; a corner within 3° snaps; undo after each; keys; the loupe on phone |
| 10 | Detect building | `lib/map/overture.ts`: the footprints of the pinned release as a vector source through `pmtiles`, faint on the map while the tool is active, the building under the click proposed as the outline to accept or adjust, "From Overture Maps · approximate"; nothing known here says so. `tools/footprints.ts`: takes the tiles that cover a box out of the release into a PMTiles file; it writes `e2e/fixtures/footprints-pune.pmtiles` and, with a wider box, a mirror | The reading of a PMTiles directory and the choice of the building under a point | A footprint accepted from the fixture; nothing found where the fixture has nothing; the fixture served by `page.route` with its ranges |
| 11 | Roof type and Build | The three roof types of the panel. "Build this roof": `roofFromMap`, the answer opened as the design (or its roof committed into the open design when the user came from the Roof lens), the Studio opened on the Roof lens. The Roof lens: the location card of its mockup (coordinates, "Outlined on satellite · 4 corners", "90.0 × 40.0 m · faces 180° S", Edit, which leads back to `/find` with the outline shown through `roofOnMap`), and the roof type as a segmented control that commits (the first committed edit of the app). The rest of the inspector is Phase 5 | `roof-card.ts`: the words of the card from a `Roof` | The acceptance: by corners, by rectangle, a footprint accepted, an edge edited, build; the outline in the layout request within 0.5 m per edge and 2 % of area; from Home to the Studio in under 60 s; Edit back to the map |
| 12 | Close of pull request 2 | Baselines, `STATE.md`, "As built" begun | | |
| 13 | Boards | **"Obstacles on the map and their heights"** (desktop, phone): the four shapes, the heights asked right after, the list in the panel. **"Enter dimensions by hand"** (desktop, phone): rectangle (length, width, faces) and the corner table, the place. Approval before 14 | | |
| 14 | Obstacles on the map | Box, circle, wall line, building polygon drawn on the map; each asks its height right after (the words of the inventory: 1.5 m box, 2 m tank, 6 m tree, 8 m building are the defaults of new items in the desktop app, and here nothing is preselected: the field is empty until typed); `roofFromMap` takes them | The shapes to obstacles of the API (a near-rectangle is a box with its rotation) | An obstacle of each kind, its height, in the request |
| 15 | By hand | "Enter dimensions by hand instead": the rectangle (length, width, long side faces) and the corner table of the desktop app, at a place typed or found; the same Build. The way out when there is no key, no WebGL, no network | The table to an outline | Without the map: a roof by hand to the Studio |
| C | Close | "As built" in the phase file, status in `README.md`, `STATE.md`, `sessions/006`, resume 005 set to used | | |

## Decisions I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | `maplibre-gl` 6.11.2 and `pmtiles` 4.5.0, pinned exactly, join the set of D4. MapLibre's own stylesheet is imported once for its canvas; its controls are not used: zoom, north, the scale bar and the attribution are ours, as the mockup draws them | The map must look as designed; MapLibre's controls have their own look |
| 2 | Local metres come from the API alone (`/roof/from-map`, the UTM of `geo.py`). While the user draws, the browser measures in a flat frame around the map's centre, for the live numbers only; after Build the panel and the Roof lens show the API's numbers. The two differ by the scale of the projection (lengths within 0.05 m over 100 m) and by the convergence of the grid: the API's y is the grid north of its UTM zone, 0.36° from true north at Pune, so a corner 45 m from the centre differs by up to 0.3 m and the direction a roof faces by under 1° | The engine's projection is the only one that makes a document; a mouse move cannot wait for a request |
| 3 | A new roof source, `map`, in the engine's `Roof` and the API's `RoofSource` | The Roof lens says "Outlined on satellite"; a `.rtd` keeps how the roof was entered |
| 4 | `/roof/from-map` answers a whole `Project` with the API's defaults. The web app has no default of its own. Building a new roof opens that document; building from the Roof lens's Edit commits its roof (geometry, source, type) into the open design and keeps everything else | Decisions, not defaults, and one place for a default (the API) |
| 5 | The stores live at the root of the app, so `/find` and the workspaces share one design; a workspace without a design opens the demo, as before; `/find` never does. Until Phase 10 keeps designs on the device, a reload of `/studio/roof` loses the new design and opens the demo: said in the state file, not in the UI | The store is the only place a design is kept until Phase 10 |
| 6 | The name of a new design is the label of the search result when the roof was found by search ("Pune, Maharashtra"), else the API's "Untitled roof". Renaming comes with the project switcher (Phase 10) | A name that says where it is; nothing invented |
| 7 | `/find` is reached from the project switcher ("New design"), from the placeholder Home by one primary link "Find my roof", and by its address. The board of Home is built in Phase 10, on all three sizes | The acceptance measures from Home; the placeholder is not the board |
| 8 | On tablet the map is as wide as the screen and the panel is a bottom sheet, as on phone, with the parts laid out with the room of 834 | The map wants the width; the Studio on tablet also puts the inspector below the stage. Drawn in step 0 |
| 9 | In the browser tests: the imagery tiles are one fixture PNG for every z/x/y (`page.route` on the imagery host); the geocoder answers with a fixture JSON of Esri's shape; the footprints are a PMTiles extract of the pinned release, served by `page.route` honouring the `Range` header; the location comes from Playwright's geolocation. No stand-in server | The fixtures of `e2e/fixtures.ts` already refuse the network; a route with a file is the simplest thing that proves the real code path |
| 10 | The acceptance test finds the roof by typing its coordinates, which puts the map at zoom 19, north up, on the point; it clicks the corners at pixel offsets from the metres per pixel at that latitude, and reads the outline the web app sends in `/layout` | No hook for tests in production code; the API's numbers prove the API's projection |
| 11 | Detect building queries the footprint layer under the click. Overture's tiles end at zoom 14, so a building cut by a tile edge is proposed as the piece under the click; the user adjusts. The UI says the footprint is approximate (quantised to about 0.6 m) and where it is from | Honest by design; a union of pieces is a library the app does not have |
| 12 | Overture release `2026-09-23.1` pinned as a constant of the provider, not a setting; the attribution "© Overture Maps Foundation, ODbL" shown with the footprints. `tools/footprints.ts` extracts the tiles of a box into a PMTiles file: the fixture now, a mirror when the app is deployed (Phase 11) | Old releases disappear; ODbL asks for the attribution |
| 13 | No WebGL, no key, offline: the map's place says why in one line and offers "Enter dimensions by hand instead" (step 15; until then the words and the way to the by-hand board). Tested with `getContext` stubbed and with the key left out of the page | "States every screen must handle" |
| 14 | MapLibre's paint colours are read from the tokens of the map's container (`getComputedStyle`), never written as values | Rule 9 holds also where a library needs a value |
| 15 | Handles: 18 px (22 on touch) as drawn, with a hit area of 44 by 44 around each; the midpoint handle 10 with the same hit area; the first corner closes within 12 px (20 on touch); snapping within 3°, as the mockup's hint says | The mockup and the touch rule |
| 16 | The direction the long side faces is the bearing of the outward normal of the longest edge, taken toward the equator ("180° S" for the demo); the outline is kept counter-clockwise as the demo is | One rule, the demo's numbers as the check |
| 17 | New tokens with their first use: the fill of the outline (accent at 9 %), the white of a handle, the width of the outline (2 px), the pulse of a corner (the duration exists). The edge label uses `radius-seg` (7) and `text-value-small` | The mockup's values, named |
| 18 | The panel's Undo, Redo, Clear and the tools are a `toolbar`; the tool that is active is `aria-pressed`; the map's canvas has an accessible name and the corners are listed in the panel, where each can be selected and nudged by keyboard | Everything works by keyboard; the map has a text equivalent |

## What was found in the code and the API, for the steps

| Step | Fact |
|---|---|
| 1 | `geo.py`: `lonlat_to_local(points, lat0, lon0)` and `local_to_lonlat(points, lat0, lon0)`, UTM by zone; y is true north within the grid convergence. `ImportedRoof` of the file import already carries outline, lat, lon, obstacles in local metres: `from-map` answers a `Project` instead, made with `Project()` of the engine and `convert.project_from_engine` (exists for `/demo`) |
| 1 | `schemas.Roof.outline` needs 3 points; `Obstacle` of kind `wall` needs 2 points, `building` 3; a near-rectangle from a file becomes a `box` with `rotation_deg` (`roof_import._assemble`, "Shape classification") |
| 2 | `StoresProvider` opens the demo in its effect when `projectOf` is null; `createDesignFlow.start()` asks for the layout and the run of a design that is open already, so a design opened on `/find` runs while the Studio appears |
| 3 | The imagery of D13 is the raster source of the style `arcgis/imagery/standard`: `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=`, 256 px, native to zoom 19 (`map-providers.md`, verified with the key). Attribution: "Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community" (`tools/imagery-preview/index.html`) |
| 3 | `next/dynamic` with `ssr: false` is how the 3D is loaded (rule 8 of `apps/web/CLAUDE.md`); the map is loaded the same way |
| 3, 7 | `measures()` is the only inline style: the handles and labels over the map are placed with `placed` (`--x`, `--y`) in pixels from `map.project()` |
| 4 | The geocoder: `https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=5&outFields=Match_addr,Type&location=lng,lat&singleLine=...&token=...`; a candidate has `address`, `attributes.Match_addr`, `location.x` (lon), `location.y` (lat), `score` |
| 4 | `FloatingPanel` with `useFloating` and the keys of `list-keys.ts` are what the project switcher and `Select` use; the results list uses the same |
| 7 | At zoom 19 and latitude 18.52 one CSS pixel is 0.283 m (156,543 m × cos(lat) / 2^19): 90 m is 318 px, 40 m is 141 px; the desktop stage of 1,440 minus the panel holds it |
| 10 | The PMTiles header: version 3, root directory at 127, tiles 0 to 14, gzip; a directory entry is (tileId, offset, length, runLength) as varints; `pmtiles` reads it, `tools/footprints.ts` writes one for the fixture |
| 11 | `Studio.tsx` holds the inspector three times, once for each size, as a placeholder; the Roof lens card is mounted once inside a component that the three places share until Phase 5 decides the mounting |
| 11 | `placeInShort` gives "18.52° N · 73.86° E"; the card of the Roof lens shows five decimals with N, S, E, W (`guidelines.md`, "Coordinates"): a `placeInFull` beside it |
| 11 | `readouts.roof_area_m2` is of the layout; the card's "90.0 × 40.0 m" is of the outline: a pure function of the `Roof`, the same that the panel uses on the API's metres |

## What needs the owner

| What | When | Blocks |
|---|---|---|
| A yes or no to each decision above | Before step 1 | Everything |
| The boards of step 0 | Before step 3 | The frame of `/find` |
| The boards of step 13 | Before step 14 | Pull request 3 |
| The key's referrers: add `http://localhost:4710` (and `http://127.0.0.1:4710`) on the Esri dashboard, so that the real imagery can be looked at on the test stack. Without it the real map is seen only on `bun dev` (4700), which is the owner's | Any time before step 3 is looked at | Nothing in the tests |
| Overture's attribution on the map when footprints are shown, "© Overture Maps Foundation, ODbL" (D18 is closed; this is the wording) | Before step 10 | Nothing |

## Risks

| Risk | What I do |
|---|---|
| The check of a pull request passes 6 min 30 s | The memo for the shading first, as a pull request of its own (`STATE.md`, "Open items") |
| The browser tests on phone wait 90 s for the demo's run under load: eight failed on `main` at the start of this session while a second browser ran | Nothing else runs on the machine during `bun check`. If it fails again alone: one run of the demo in the global setup, as `STATE.md` has it under "Watch" |
| MapLibre in the tests is slow on phone at pixel ratio 3 (a warning about the canvas size in the spike) | The tests wait for the map's `idle`, never for a time; the pixel ratio is left as it is |
| The PMTiles fixture is large | One z14 tile at Pune is 0.3 to 0.6 MB; the fixture holds the tiles of a box of 500 m: one or two tiles. Over 2 MB it is made smaller |
| The phase is three pull requests and two sessions at least | Steps in the order of value: the acceptance is met at the end of pull request 2; the state is written after every second step |
| The desktop app's rectangle and corner table (step 15) is the fallback that always works, and it comes last | It is built in pull request 3; until then the no-key state names it and leads to it |

## Done means

The acceptance of `plan/phase-04-find-and-outline.md`, point by point:

- From Home to the Studio on the Roof lens in under 60 s for a rectangular building, on desktop and on
  phone: timed in the browser test of step 11 (the 3D roof itself is Phase 5).
- A 90.0 by 40.0 m rectangle outlined: every edge within 0.5 m, the area within 2 %, read from the outline
  the web app sends to `/layout` after the API's projection.
- A typed edge length changes the polygon and every dependent number.
- Attribution always visible on the map (the 3D scene is Phase 5).
- Playwright on three viewports, tiles, search and footprints from fixtures: draw by corners, by rectangle,
  accept a detected footprint, edit an edge, build.

And beyond it: obstacles on the map with their heights, "Enter dimensions by hand", the no-key and
no-WebGL states, `tools/imagery-preview` gone, "As built" written.

## The browser tests, run again alone

Six phone tests failed again, alone, the same wait. The API log of the test stack shows fourteen design
runs asked for in one burst when the server had nothing kept, and the fourteen layouts answered only after
them; the load average reached 75 on 20 cores. This is the "Watch" item of `plan/STATE.md` ("the browser
tests of the shell run the design of the demo on the server of the tests, on three sizes at once"), and
its remedy is written there: one run of the demo in the global setup, so that the server has kept its
results before the tests begin. It is a code change, so it went as a pull request of its own before the
phase, pull request #34 (`fix/e2e-run-the-demo-first`): the global setup asks the API of the test stack for the demo's layout
and design once, and waits for the result.
