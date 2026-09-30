# Phase 5: plan

Written 2026-09-30 by session 9, before anything of the phase is built, as the work order asks
(`plan/resume/008-phase-5-studio-roof-array.md`). Scope and acceptance: `plan/phase-05-studio-roof-array.md`.
This file says how the phase is built, in which order, what is decided unless the owner says otherwise,
what was found in the code, the API and the reference project, what needs the owner, and what done means.

## What was found at the start of the session

- `main` is clean and matches `plan/STATE.md`: no branch, no open pull request, no stack running. `bun check`
  on `main`: green, every step skipped from the cache made at `5732eef`. Both reference projects are on the
  disk and readable.
- **three 0.185.1, @react-three/fiber 9.6.1 and @react-three/drei 10.7.7 are already pinned in
  `apps/web/package.json` and installed** (D4); nothing imports them yet. `reactStrictMode` is `false`.
- **The API's `/layout` already gives the scene everything a module needs**: each position is its plan
  footprint (four corners in the roof's metres), its `tilt`, `azimuth`, `z_low` and `z_high` above the roof
  surface, its `row`, `col` and `line` (on an east-west roof the `line` is the side, and the `azimuth` is the
  side's). Beside the positions: the roof inside the setback (`inner`), where modules may stand (`usable`),
  the obstacles with their clearance (`obstacle_zone`), and the keep-out told apart by what casts it
  (`keepout`: the parapet, or an obstacle by its index in `roof.obstacles`), each as polygons. So the
  browser places nothing: it draws what the API answered.
- **The keep-out does not say how many positions it keeps clear.** Positions inside the keep-out are not
  placed at all, so the API can only count them by placing once more with shaded positions allowed. The
  callout of the mockup says "Kept clear · 21 positions": the API gains that count (decision 4).
- **The engine treats every roof as a flat plane** for shadows and placement, the sloped roof too: its
  modules get `tilt = slope_deg` and `z_low = 0.1` above the plane. The 3D scene is the only place a
  pitch is seen (decision 3).
- **`/sun` gives the sun's position** for a place, a day (or `design_day`) and hours; the reference
  project computed its own, the notes say ours come from the API. The view store already keeps a
  `sunTime` (design day, 10:30) and a `camera` preset, unused so far.
- **The reference project's `Text` on the stage is drei's, which loads its font from the network**
  (troika). The browser tests stop every request that leaves the machine. Labels on the stage are DOM here
  (decision 6).
- **The map's obstacles reach the Studio through the document**: `roofFromMap` makes engine obstacles of
  the shapes drawn (a near-rectangle a `box` with its rotation), so the Roof lens reads `Roof.obstacles`
  of the API and nothing of the map. `MapShape` knows `tree`; the map never draws one (D50).
- **The inspector stands twice in the DOM** (`components/shell/Studio.tsx`): in the `aside` of tablet
  and desktop and in the sheet of phone, both mounted, one hidden by CSS. The tests take `.first()` or
  filter for what is visible. With fields inside, two copies mean two of every label and id
  (decision 9).
- **The project store has no history**: a committed edit replaces the document. The acceptance's "undo
  restores" needs one (decision 11).
- **Importing a drawing has no way in**: `/roof/import` answers an `ImportedRoof` (outline, place,
  obstacles, `missing_heights`), not a `Project`; the project switcher's "Import a drawing" is shown and
  cannot be used (listed under Phase 4 in `STATE.md`, not built there). The Roof lens's "reports the
  heights a DXF could not give" needs the way in (decision 13).
- **The demo's module is named "INSOLATION GREEN ENERGY PVT. LTD." and "INA-144MHC-TF-560"** in its
  PAN; the mockup's card says "INA-144MHC-TF-560" over "Insolation · 560 Wp". The module's facts come
  with a design run (`DesignResult.equipment`), or from `/equipment/module` when a PAN is replaced; the
  layout alone carries no module (decision 14).
- **The browser tests run software WebGL already** (`e2e/playwright.config.ts`: angle, swiftshader),
  on phone at pixel ratio 3, tablet at 2. MapLibre renders there in 1 to 2 s. Two WebGL contexts stand on
  the Find screen when the Studio's scene comes (the map and the scene are never on one screen; Find has
  the map alone, the Studio the scene alone).
- **The stage's frame is there**: `Studio.tsx` lays out the stage (252 high on phone, 508 on tablet, the
  rest on desktop), the title, the vitals and the inspector; the stage holds `NotBuiltYet`. The lens
  title's sub-line ("790 positions · 28 tables · 6 rows · 1,646 m² of modules") is not there.
- **The Roof lens's card wraps to two lines** once it counts obstacles; the card of the mockup has three
  lines by design (the place, how, the size), the wrap is the fourth. The inspector's layout settles it.
- **The design canvas** holds the 21 boards of the repo; a publish is refused while it is shared by link.

## How the work goes

- **Five pull requests**, split where nothing of the earlier depends on the later:
  1. `feat/phase-5-scene`: the scene with the building, the roof, the parapet, the setback line, the
     obstacles, the ground with the imagery, the camera and its presets, the view controls, the north
     marker, the dimension labels, the attribution; the stage's title line; the tests of a scene.
     Steps 1 to 5. This session's pull request.
  2. `feat/phase-5-modules`: the sun of the scene, the modules instanced for the three roof types, the
     walkways, the keep-out parts with their counts and the callout, the plan without WebGL. Steps 6 to 9.
     The counts of the acceptance are met at its end.
  3. `feat/phase-5-roof-lens`: the Roof lens inspector whole, on three sizes: edges and access, pitch,
     the obstacle list with every field, Add, the selection shared with the scene, the import with
     missing heights. Steps 10 to 13.
  4. `feat/phase-5-array-lens`: the Array lens inspector whole: the module card with Replace, mounting,
     spacing, the shade-free window, the design day, shaded positions; the states of a run and of an
     update; the read-outs. Steps 14 to 16.
  5. `feat/phase-5-manipulation`: selection by raycast of every kind, hover, drag on the roof plane,
     handles, add where tapped, undo and redo. Steps 17 to 20. The acceptance whole at its end.
- Every step is one commit (two when a token is new: the document first). A draft pull request after the
  first step, merged after the last, on a green check. `bun check` green before every commit.
- Test first, seen failing. Logic is a pure function or a store without React, tested with `bun test`;
  the API with pytest; what is seen with Playwright on 390, 834 and 1440, with baselines.
- The boards the phase lacks are drawn first (step 0), shown, and approved before step 1.
- `plan/STATE.md` is brought up to date on `main` after each pull request, from a worktree.
- The phase is more than one session: this session takes step 0 and pull request 1; each later session
  takes one pull request and ends at its merge.

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 0 | Boards | Drawn with a builder as the boards of Phase 4 were (`mockups/build_phase5_boards.py`), rendered as session 5 did, listed in `docs/design/README.md`. **"Studio, Roof lens, phone and tablet"**: the inspector in the sheet of 390 and in two columns under the vitals of 834, with the card, the roof type, edges and access, the obstacle list and its selected obstacle. **"Studio, Array lens, states"**: a run computing (the vitals' ring, the stage's modules of before), an edit updating (the old values dimmed), the module card with its coefficient line and Replace, the shade-free window and the design day, the mounting fields of east-west and of sloped. **"Obstacle edited on the roof"**: the selected obstacle with its handles (move, size, turn, height) and its callout, on desktop and phone. **"Roof types in 3D"**: east-west and sloped flush on the stage, and the plan view. **"Import with missing heights"**: Import a drawing from the project switcher, the note in the Roof lens, the obstacles that got 1.0 m selected one by one. Approval before step 1 | | |
| 1 | The scene's frame | `lib/scene/adapter.ts`: the one place that turns the engine's metres (x east, y north, z up) into three's (x east, y up, z south), points, polygons and matrices. `lib/scene-palette.ts`: the 3D palette of `design-tokens.md`, held equal by a test. `components/scene/SceneCanvas.tsx` loaded with `next/dynamic` and `ssr: false`: `frameloop="demand"`, `dpr={[1, 2]}`, ACES, PCF shadows, `preserveDrawingBuffer`, near and far scaled to the roof, the context lost heard and said. `components/studio/Stage.tsx`: the stage of the Studio holding the canvas, the title and the sub-line, the attribution under the imagery, the text equivalent of the scene (a list of what is drawn, with counts). `NotBuiltYet` leaves the stage | `adapter.test.ts`: a point, a polygon, a box's matrix, round trips; `scene-palette.test.ts` against the document | `stage.e2e.ts`: the canvas is there on three sizes, a pixel sample is not the ground colour; no request leaves the machine; the text equivalent names the roof |
| 2 | The building and the roof | `lib/scene/building.ts`: the roof polygon as a shape (with holes), the mass below it (extruded to the ground, 6 m unless the design says otherwise), the parapet as walls from `Roof.parapet_h` and the engine's thickness, the setback line inset by `setback_m`, the pitch of a sloped roof (decision 3). `components/scene/Building.tsx`, `Parapet.tsx`, `SetbackLine.tsx`; the materials of the palette | `building.test.ts`: the demo's roof gives a shape of 3,600 m², walls of 0.9 by 0.2, a setback ring 1.0 m in; a hexagon; a sloped roof's plane | The demo roof rises; a screenshot beside the preview |
| 3 | The obstacles and the ground | `lib/scene/obstacles.ts`: each kind as meshes from the API's `Obstacle` (box, cylinder, wall from its points and thickness, tree as trunk and crown, building as an extruded outline). `lib/scene/ground.ts`: the tiles of the imagery that cover about 300 m around the roof at the native zoom, their corners in the roof's metres through `lib/outline/frame.ts`, stitched into one texture tagged sRGB (decision 8). `components/scene/Obstacles.tsx`, `Ground.tsx`, the grid where there is no imagery; `NorthMarker.tsx` | `obstacles.test.ts`: the demo's six; `ground.test.ts`: which tiles, where their corners fall, 4 by 4 at Pune | The imagery from the fixture tile under the roof on three sizes; without a key the plain ground; the attribution visible |
| 4 | The camera and the view controls | `components/scene/CameraRig.tsx`: orbit with damping, never below the roof plane, distance limits from the roof's radius, touch (one finger orbit, two pan and pinch); presets 3D, Plan (orthographic, top, north up), Fit, Sun's eye, through a nonce in the view store (decision 17). `components/studio/ViewControls.tsx`: the segmented 3D and Plan, Fit, the north control that shows the bearing and turns north up, as the mockup draws them (3D and Plan alone on phone). `lib/scene/dimensions.ts`: the labels of the roof's edges, placed by projection (decision 6) | `camera.test.ts`: the presets' positions for the demo's radius; the bearing of the north control | The presets change the picture (pixel samples differ); Plan is north up; the labels say 90.0 m and 40.0 m; keyboard reaches every control; axe |
| 5 | Close of pull request 1 | Baselines of `studio` and `studio-roof` renewed and looked at beside the previews; `STATE.md`; the record of session 9 | | |
| 6 | The sun | `flow`: the sun's position from `/sun` for the roof's place and the view's time, asked when the design opens or the place or the time changes, kept in the results store (decision 5). `components/scene/SunLight.tsx` from the reference: the light along the sun, the shadow camera fitted once to the roof's sphere, the bias scaled with the sun's height, the fade at dusk | `design-flow.test.ts`: the sun asked once for the demo, again after the place changes, not after a loss changes; `sun-light.test.ts`: the bias and the fade at 10°, at 2° | Shadows fall north-west at 10:30 on the design day (a pixel sample of the roof north of the stair room is darker than one south of it) |
| 7 | The modules | `lib/scene/modules.ts`: from every position of the layout, the matrix of a tilted quad (frame and glass, split as the notes say) from its footprint, `tilt`, `azimuth`, `z_low` and `z_high`; the walkways from the gaps of the layout; instanced (`frustumCulled={false}`, `key={capacity}`). `components/scene/Modules.tsx`; the text equivalent says how many were drawn and in how many rows | `modules.test.ts`: the demo's 790 give 790 matrices, the first at the lower edge's height, the slope's top at `z_high`; an east-west unit's two sides face away from each other; a flush module lies on the pitch | On the demo: 790 in 6 rows drawn (the text equivalent), tilted rows; the roof type switched to east-west and to sloped: 940 and 1,068 drawn, as `/layout` answered; a pixel sample is module blue |
| 8 | The keep-out | The API: `Keepout.positions`, the count of positions the part keeps clear (decision 4); `bun gen:api`. `lib/scene/keepout.ts`: the overlays lifted off the roof, `depthWrite` off; the callout's words from the part and the window ("Kept clear · 21 positions", "Stair room shades this area between 09:00 and 16:00") | pytest: the demo's stair room keeps 21 clear, the parapet its own, the sum equals what allowing shaded positions adds; `keepout.test.ts`: the words | The overlays are there; a click on one shows the callout; Escape closes it |
| 9 | The plan without WebGL | `components/studio/PlanFallback.tsx` from Find's `PlanView`: the roof, the setback, the obstacles and the modules as rectangles, north up, on the grid, with the line that says why; the same when the context is lost, with Reload; close of pull request 2 | The plan's rectangles from the same layout | With `getContext` stubbed the plan stands and says why; after a context loss (`WEBGL_lose_context`) the plan stands and offers Reload |
| 10 | The inspector mounted once | `components/studio/use-size.ts`: the size after mount, from `matchMedia` on the breakpoint tokens, null before (decision 9); `Studio.tsx` mounts the inspector in the one container of the size. The tests drop `.first()` | `use-size.test.ts` on a stubbed `matchMedia` | The shell tests as they are, on three sizes |
| 11 | Edges and access | The Roof lens: Parapet, Setback, Walkway, Every (modules or rows by the roof type), Clearance, Albedo as `NumberField`s of the inventory's ranges, two to a row, committing as fields do; Pitch and Slope faces when the roof is sloped; the roof type sets the parapet to 0 when sloped is chosen (inventory 1.1) | `roof-fields.ts`: each field's range and decimals; the edit each commit makes | A parapet of 1.2 typed: the request of `/layout` carries it, the scene's parapet rises; sloped: pitch and faces appear, the parapet reads 0 |
| 12 | The obstacles | The list of the mockup: every obstacle as a row (name, kind, size and height), the selected one open as a card with its fields by kind (inventory 1.2), the name editable, Remove; "Parapet, all edges" read-only when there is one; Add with the kinds Box, Tank, Wall, Tree, Building: the new one at the centre of the roof, selected, its height empty until typed (decision 15); the selection shared with the scene through the view store (decision 10); the card's wrap settled (a fourth line, or the count on the how line, as the board of step 0 decides) | `obstacle-fields.ts`: the fields of each kind, their ranges, the new item's shape and name ("Box 7"); `view-store.test.ts`: the selection | An obstacle selected from the list is outlined on the stage; its length typed changes the request and the scene; a tree added with its heights; Remove; on phone in the sheet |
| 13 | Import with missing heights | The API: `ImportedRoof.project`, the whole document as `/roof/from-map` answers it (decision 13). "Import a drawing" of the project switcher opens a file (`FileDrop`), sends it, opens the document; `missing_heights` go into the view store's list to review; the Roof lens shows the note in the engine's words with the count, Next selects each in turn, a height typed takes it off the list. Close of pull request 3 | pytest: the project of an import; `review-heights.test.ts` | A DXF fixture without heights imported: the note, the first obstacle selected, a height typed, the next; the list empty, the note gone |
| 14 | The module card and mounting | The Array lens: the card of the module from the design's equipment (the model, the manufacturer and Wp, the size and bifaciality, the coefficient line and its note) with Replace (a PAN through `parseModule`, its text committed as `pan_text`, a refused file leaves the equipment of before, D32); Mounting: Tilt as the slider with the latitude's hint, Orientation, Modules in tilt as a stepper, Lower-edge clearance; east-west: East-west tilt and Ridge gap; sloped: orientation and modules in tilt alone (inventory 1.3) | `array-fields.ts`: the latitude's hint (clamp 5 to 15), the fields by roof type; `module-card.ts`: the words | Tilt released at 10°: the request within 200 ms of release (measured in the test), the scene refits; Replace with the fixture PAN; a refused file |
| 15 | Spacing and the window | Row pitch with the switch "shade-free" (off: a field), its line "Shade-free · GCR 0.71 · profile angle 30.5°"; Azimuth with the switch "follows the roof edge" (off: a field); the shade-free window as the range slider in solar hours with its ticks; Design day; Allow shaded positions with its line | `array-fields.ts`: pitch given or auto, azimuth given or auto; the window's words | The switch off and 7.00 typed: the request carries `row_pitch_m`; the window dragged; the design day; the switch of shaded positions |
| 16 | The states of the Array lens | While the layout is on its way the modules of before stay and the sub-line is dimmed; while the design runs the vitals do as they do; a failed layout says why on the stage and keeps the last; the read-outs of the sub-line from the layout. Close of pull request 4 | `stage-view.ts`: the words and the dimming from the stores | The layout held back by a route: the old modules stay dimmed, then the new ones land |
| 17 | Selection by raycast and hover | `components/scene/Pick.tsx`: a press on the roof, an obstacle, a keep-out part or a module selects it (the view store); hover outlines on pointer devices; the callout of the selected object placed by projection; Escape clears | `pick.test.ts`: what a hit on each object selects | A click on the stair room selects it: the list opens its card, the callout says "Stair room · selected"; hover on desktop; tap on phone |
| 18 | Undo and redo | The project store keeps the documents of the last fifty edits; `undo`, `redo`; Cmd or Ctrl+Z and Shift+Z in the Studio; a drag is one edit (decision 11) | `project-store.test.ts`: undo after a commit gives the document of before, redo the one after, a new commit drops the redo | Undo after a typed field restores the field, the request and the scene |
| 19 | Drag and handles | `lib/scene/drag.ts`: the pointer on the roof plane (a ray against the plane), the obstacle's centre moved with it, snapped to 0.1 m, kept inside the roof; handles for the size, the turn and the height of the selected obstacle, 44 px on touch; the drop commits (decision 12). Add places the new obstacle where the user taps when the stage is tapped after Add | `drag.test.ts`: the snap, the plane hit, the handles' new sizes | The acceptance: the stair room dragged 5 m east: its East reads 27.5, the keep-out moved, the module count changed, undo restores 22.5 and the count; on phone by touch |
| 20 | Close of pull request 5 | Twenty lens switches without a context loss (a test); the frame rate looked at by hand with 1,068 modules; baselines; "As built" | | |
| C | Close | "As built" in the phase file, status in `README.md`, `STATE.md`, the record of the session, resume 008 set to used | | |

## Decisions I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | One adapter, `lib/scene/adapter.ts`, turns the engine's metres (x east, y north, z up) into three's (x east, y up, z south); every module of `lib/scene` works in the engine's metres and hands the adapter its result. Nothing else converts | The phase file asks it; a second conversion is where the mirrored roof comes from |
| 2 | The scene draws what the API answered and places nothing: modules from the positions of `/layout` (the footprint, the tilt, the azimuth, the heights), the keep-out from its parts, the setback from `inner`. The browser has no placement, no shadow and no pitch of its own | One truth of the layout; the engine's numbers are the acceptance |
| 3 | A sloped roof is drawn pitched about the line through its centroid at right angles to the slope's direction, by `slope_deg`, and its modules lie on the pitch at the flush clearance; the building's walls rise to the pitched edge. The engine keeps treating the surface as flat for shadows and placement, as it does; nothing of its numbers changes | The user sees the pitch they typed. Whether the engine should project the pitch is a question for Prasanta, listed in `STATE.md` |
| 4 | `Keepout.positions` joins the API's keep-out part: how many positions the part keeps clear, counted from one more placement with shaded positions allowed (the engine's own `place`, 0.05 s), by the footprints that fall inside the part. The callout says "Kept clear · 21 positions" | The mockup counts positions; the API is the only place that can |
| 5 | The scene's sun comes from `/sun` at the view's time (the design day at 10:30 until the Sun lens moves it, Phase 6), asked by the flow when the design opens or the roof's place changes, kept in the results store as the layout is. The time pill of the stage is Phase 6 with its timeline | The notes say the positions come from the API; the guidelines say the shadows are real |
| 6 | Labels and callouts on the stage are DOM elements placed by projecting scene points, with `placed` as the map's labels are. No drei `Text` | Its font comes from the network; the tests refuse it, and rule 9 wants the tokens' type |
| 7 | `preserveDrawingBuffer` is on. The browser tests read the canvas's pixels through the page (a 2D canvas drawn from the data URL) and the counts from the stage's text equivalent, a list of what is drawn (the roof, the obstacles by name, the modules with their count and rows), which is also the accessibility of the scene. No hook for tests in production code | Rule of Phase 4 (plan decision 10) kept; the text equivalent is asked by the guidelines anyway |
| 8 | The ground is the imagery's tiles at the native zoom (19) that cover about 300 m around the roof, fetched with the key as the map does, stitched into one texture tagged sRGB, laid by the corners of each tile in the roof's metres through `lib/outline/frame.ts` (the convergence of the grid is under 0.4° at Pune, D41). Without a key, or when a tile does not come, the ground is the plain palette with the grid, and the scene never waits for it. The attribution stands under the stage as under the map | Phase 4 said the ground drapes the same tiles; the states of the guidelines |
| 9 | The inspector is mounted once, in the container of the size, chosen after mount by a hook over `matchMedia` on the breakpoint tokens (null before mount, so nothing flashes); the containers keep their CSS. The tests drop `.first()` | Two copies of a form are two of every label and id; a hydration mismatch is fix 3 of the notes |
| 10 | The selection (the roof, an obstacle by index, a keep-out part, a module) and the hover live in the view store, never in the document; the list and the scene read the same | One selection for the roof and the list; `.rtd` holds no view |
| 11 | The project store keeps a history of committed edits (fifty), with undo and redo; Cmd or Ctrl+Z and Shift+Z in the Studio; a drag's drop is one edit; opening a design starts the history afresh | The acceptance says "undo restores"; the map's history is the outline's alone |
| 12 | A drag moves the obstacle in the scene alone, snapped to 0.1 m and kept inside the roof; the drop commits, and the layout follows as any committed edit. The handles of the selected obstacle change its size, its turn and its height the same way; the fields do the same by number | No request per pointer move; one rule for what a drag is |
| 13 | `/roof/import` answers the whole `Project` too (`ImportedRoof.project`, made as `/roof/from-map` makes one, D43), and "Import a drawing" of the project switcher opens a KMZ, KML or DXF that way. The names in `missing_heights` go into a list to review in the view store; the Roof lens shows the engine's note, selects them one by one, and a typed height takes one off the list. Home's own import comes with Home (Phase 10) | The Roof lens's report has no way in otherwise; the web app has no default of its own |
| 14 | The module card shows the PAN's model on its title line and its manufacturer as the file states it, with the Wp, on the line under ("INSOLATION GREEN ENERGY PVT. LTD. · 560 Wp"); the mockup's "Insolation" is a shortening the owner may give as a name to show (`STATE.md`, open item). The facts come from the design's equipment, or from `/equipment/module` when a PAN is replaced, and the card shows a skeleton before either | Nothing invented; the open item stays the owner's |
| 15 | Add in the Roof lens asks the kind (Box, Tank, Wall, Tree, Building), puts the new obstacle at the centre of the roof with the inventory's sizes, selected, and its height empty: it is committed to the document when the height is typed (a tree: its height and where the crown starts). Until then it is a draft of the view, drawn on the roof in accent. Add where the user taps comes with pull request 5 | D51: nothing preselected, the height is asked; the API wants a height |
| 16 | Every field of the two lenses commits as the number field does (Enter or blur, the arrows step the draft, D31); every commit is a committed edit: the layout at once, the design after `DESIGN_PAUSE` (D8). Switches and segmented controls commit at once. "Shade-free" off turns the row pitch into a field with the engine's last pitch as its value; on sends null. The same for "follows the roof edge" and the azimuth | The rules of the components; the API's `None` means "let the engine decide" |
| 17 | The camera: orbit with damping, the pole clamped above the roof plane, the distance from a fifth to twelve times the roof's radius, near and far from the radius (fix 9); the presets 3D, Plan, Fit and Sun's eye through a nonce of the view store, framed only when the nonce changes (fix 13); Plan is an orthographic camera straight down, north up; Fit frames the roof from the 3D side. The north control shows the camera's bearing and turns the view north up. Touch: one finger orbits, two pan and pinch | The guidelines; the fixes already paid for |
| 18 | The 3D palette is `lib/scene-palette.ts`, held equal to `design-tokens.md` by a test as the numbers in code are. New CSS tokens with their first use: the label on the stage (background, radius), the line of a callout, the handle of the scene. Three reads its colours from the palette; the DOM over the stage from the tokens | Rule 9 where a library needs a value, D40's way |
| 19 | Shadows: PCF at 2048 (fix 8), the shadow camera fitted once to the roof's sphere, the bias scaled with the sun's height (fixes 5 to 7); `dpr` capped at 2 on phone's 3. When the context is lost the stage shows the plan (step 9) with the reason and Reload | Software WebGL in the tests and mid laptops; the notes |
| 20 | Fields, ranges and decimals of both lenses come from `plan/reference/functional-inventory.md` 1.1 to 1.3 and are written once in `lib/studio/roof-fields.ts` and `array-fields.ts`; the inspector renders them | The inventory is the contract; a field is typed once |
| 21 | The browser tests prove the counts against the API: a test reads `/layout`'s `positions` for the roof type it set and the stage's text equivalent, and asks them equal (790, 940, 1,068 on the demo) | The acceptance's numbers, without a number written into a test |

## What was found in the code and the API, for the steps

| Step | Fact |
|---|---|
| 1 | `Find.tsx` loads the map with `next/dynamic(..., { ssr: false })`; the scene is loaded the same way. `OutlineLayer.tokenOf` reads a token from `getComputedStyle(container)`: the DOM over the stage reads tokens that way where a value must be a number |
| 1 | `measures()` is the only inline style; `placed` (`--x`, `--y`) places a thing in pixels: the labels and callouts of the stage use it, from the camera's projection |
| 2 | `geometry.Roof.parapet_walls()` insets the outline by half the thickness (0.2 m) and makes a wall of each edge; the scene draws the same walls. `Roof.inner()` is the setback ring: the API's `Layout.inner` |
| 3 | `MapShape` is what the map sends; the document's `Obstacle` has `x`, `y`, `length`, `width`, `rotation_deg`, `diameter`, `height`, `thickness`, `trunk_height`, `points`, `auto`; a tree's crown is a disc of `diameter` from `trunk_height` to `height`, its trunk 0.3 m wide (`Obstacle.solids`) |
| 3 | The imagery's tiles: `esriProvider().imagery.tiles` with the key, 256 px, native to zoom 19; at Pune 0.283 m per pixel (`build.e2e.ts`); a tile is 72 m: 300 m is 4 by 4 tiles plus the edge. In the browser tests `withTheImagery` answers every tile with the fixture |
| 4 | `view-store.ts` has `camera: CameraPreset` with `"3d" | "plan" | "fit" | "sun-eye"` and `sunTime`; a nonce is added for the presets, a selection for step 12 |
| 6 | `POST /sun` takes `lat`, `lon`, `day` (a number or `design_day`) and `hours`; answers `positions` with `elevation_deg` and `azimuth_deg` clockwise from north. `computeSun` is in the client. The engine's shadows fall from `shadow_vector(elev, az)`: the scene's light points the same way |
| 7 | `PlacedModule.outline` is the plan footprint (four corners, world metres); the module's lower edge is the footprint's edge facing `azimuth`; the slope rises from `z_low` at that edge to `z_high` at the opposite one; on an east-west unit `line` 0 faces `az + 90`, `line` 1 `az − 90`. The module's frame (`modules.ts`) tilts a unit box by `tilt` about the row's axis |
| 8 | `keepout_parts.py` computes one part per cause with the engine's own `keepout`; a part's `area` is on the roof. The count of decision 4 uses `place()` with `allow_shaded=True` and counts the footprints inside each part |
| 10 | `Studio.tsx` holds `hidden tablet:flex` for the aside and `tablet:hidden` for the sheet; `Sheet` takes `stop` and `onStop` with `peek`, `half`, `full` |
| 12 | `OBSTACLE_KINDS` of the engine: box, cylinder, wall, tree, building; the API's `Obstacle` validator wants 2 points of a wall and 3 of a building. `sizeOf` in `lib/outline/obstacles.ts` gives the list's words for the map's shapes; the Roof lens needs the same of the document's obstacles |
| 13 | `roof_files.py` returns `HEIGHTS_SET` ("These obstacles have no height in the file and were set to 1.0 m.") in `notes` and the names in `missing_heights`; `ImportedRoof` has `outline`, `lat`, `lon`, `obstacles`, `source`, `file` |
| 14 | `DesignResult.equipment` has `module` (`manufacturer`, `model`, `pnom_w`, `length_m`, `width_m`, `bifaciality`, ...), `coefficients` (with `source`), `module_notes`; `/equipment/module` answers the same `module` and `coefficients` with the file's `text`. `parseModule` and `FileDrop` exist; `Project.pan_text` and `pan_path` carry the file |
| 14 | `Slider` takes `scale`, `hint`, `ticks`; `Stepper` a `range`; `RangeSlider` a `Span`, `format`, `ticks`; `Switch` `on`; `Segmented` options. The inventory's ranges: tilt 0 to 45, modules in tilt 1 to 4, clearance 0 to 3, pitch 0.5 to 30, window 5 to 12 and 12 to 19 by 0.25 |
| 17 | R3F's `onPointerDown` on a mesh gives the hit; `InstancedMesh` hits carry `instanceId`, which is the position's index in the order of the layout |
| 19 | A drag on the roof plane is a ray against the plane z = 0 of the engine (y = 0 of three); `OrbitControls` must be disabled while a handle is dragged |

## What needs the owner

| What | When | Blocks |
|---|---|---|
| A yes or no to each decision above | Before step 1 | Everything |
| The boards of step 0 | Before step 1 | Pull request 1 |
| Whether the engine should project a sloped roof's pitch, or keep the flat plane it uses today (decision 3) | Any time; for Prasanta | Nothing: the scene draws the pitch either way |
| The names to show for the demo's equipment, if shorter than the files state them (decision 14) | Before step 14 | Nothing: the file's names are shown until then |

## Risks

| Risk | What I do |
|---|---|
| Software WebGL in the tests is slow with shadows and 1,068 instances on phone at pixel ratio 3 | `dpr` capped at 2, the shadow map 2048, `frameloop="demand"`; the tests wait for the text equivalent and a pixel, never a time. If a render passes 10 s there, shadows are turned off in the tests' browser by a query the stage reads from the page's address, said in the plan |
| The ground's tiles at zoom 19 are 16 to 25 requests per design | Fetched once per place, kept with the design; the fixture answers them in the tests. If the cost shows on the Esri dashboard, zoom 18 (4 to 9 tiles) is the fallback |
| The counted keep-out (decision 4) doubles the placement time | The engine places in 0.05 s; measured in pytest, and the count is left out if a layout passes 0.5 s |
| Undo over documents of the demo (with its weather embedded) is heavy | Documents share their unchanged parts (a commit copies the roof, not the weather); fifty of them are fifty small objects |
| The phase is five pull requests and at least three sessions | The counts of the acceptance are met at the end of pull request 2; the state is written after every pull request; each session ends at a merge |
| The boards of step 0 are five and take a large part of this session | Drawn with one builder and the helpers of Phase 4; the desktop board of each lens exists, so each board draws the difference (a size, a state), not a screen anew |
| Two lenses share the stage: an edit of the Roof lens must be seen at once in the Array lens | The scene reads the stores, not the lens; the lens chooses the inspector alone |

## Done means

The acceptance of `plan/phase-05-studio-roof-array.md`, point by point:

- The demo roof shows 790 positions in 6 rows: the stage's text equivalent, held equal to `/layout` by the
  browser test of step 7. Tilt set to 10° refits within 200 ms of release: the browser test of step 14
  measures from the pointer's release to the request of the layout.
- All three roof types render and match `/layout` (790, 940, 1,068 on the demo): step 7, on three sizes.
- Drag the stair room 5 m east: keep-out and module count update; undo restores: step 19.
- Playwright on three viewports: canvas non-blank by a pixel sample (step 1), selection by click (step 17),
  inspector edits round-trip to the store (steps 11 to 15 read the request of `/layout`), screenshot
  baselines (every pull request).
- 60 fps orbit with 1,068 modules and no context loss after 20 lens switches: step 20, the switches in a
  test, the frame rate looked at by hand on this machine and written in "As built".

And beyond it: the boards of step 0 approved and in the repo and on the canvas, the inspector mounted once,
the import of a drawing with its missing heights, the plan without WebGL, "As built" written.
