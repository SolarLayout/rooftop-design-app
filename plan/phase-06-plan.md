# Phase 6: plan

Written 2026-10-02 by session 10, before anything of the phase is built, as the work order asks
(`plan/resume/009-phase-6-studio-sun.md`). Scope and acceptance: `plan/phase-06-studio-sun.md`. This file says how
the phase is built, in which order, what is decided unless the owner says otherwise, what was found in the code
and the API, what needs the owner, and what done means.

## What was found at the start of the session

- `main` is clean at `1be755c` and matches `plan/STATE.md`: no open pull request, no stack running. Five local
  branches of Phase 5 were left, all merged (#42 to #46); they are deleted. `bun check` on `main`: green, every
  step skipped from the cache.
- **The Artifact tool is not available in this session** (Bedrock). The canvas at claude.ai cannot be read or
  published from here: the boards are shown from the previews in the repo, as since session 9's second day.
- **Per-module shading is already answered.** `DesignResult.shading` has `near_pct_by_module`, the annual near
  shading of every position by its index in the layout, with `near_pct`, `far_pct` and `keepout_area_m2`
  (`rooftop_core/shade_summary.py`). On the demo: 790 values, from 0.03 % to 3.59 %, median 0.28 %, 14 above
  1 %. The heat map needs no change of the API.
- **Electrical shading exists only for an option**, as the step "Electrical shading" of its loss chain (demo,
  option A: −0.56 %), with near linear −0.35 % and far −0.01 % beside it: the figures of the board's sketch are
  option A's. Over all 790 positions near shading is 0.37 %. Each string of an option has `shade_pct` (demo: 0 to
  4.99 %); nothing shows it yet.
- **The shadow polygons are already answered**: `POST /sun` with `shadows` gives the union of the shadows of the
  parapet and the obstacles on a level plane at one solar hour (`services/sun.py`, `casters_shadow`). But its
  `ShadowRequest` carries the whole `Project`, and the demo's document is 484 KB with its weather embedded,
  where its roof is 1.4 KB; only the roof is read. Nothing in the web app asks for shadows yet (decision 8).
- **The stair room's far corner at 16:00 on 21 December lies on bare roof**: the sun at 17.97° high, 236.64° from
  north; the corner of the stair room's top (25, 20) falls at (32.72, 25.09), a corner of the engine's polygon,
  0.32 m north of the nearest module. Near the corner the shadow's edges run east-west and north-south, so in the
  plan view, north up, they are found along a row and a column of pixels.
- **The light's bias would miss the acceptance by far.** `shadowBiasOf` gives a `normalBias` of up to eight
  texels times three: on the demo (radius 49.2 m, a texel of 5.3 cm) 0.51 m at 18° of sun. three.js moves the point
  that looks up the shadow map along its normal by that much: on a level roof the shadow behaves as if it fell on
  a plane 0.51 m higher, shorter by 0.51 × cot 18° = 1.6 m. Phase 5 tested only that shadows fall north-west
  (decision 9).
- **The sun is asked one hour at a time.** The flow asks `/sun` for the view's `sunTime` with `hours: [hour]`,
  keyed by the place and the time: a scrub of the time would be one request per step. `/sun` answers a whole day by
  `step_h` with sunrise and sunset (decision 1).
- **The approved Array boards already draw the time on the stage** of every lens: a pill with play, "21 Dec ·
  10:30", a short track and "solar time" (desktop and tablet at the bottom left, phone at the top left). Phase 5 left
  it to this phase. The Sun lens's board (`SunLens.dc.html`) is a sketch generated from the Array board: a
  timeline of 64 over the stage, the inspector with Shadows and Shade map, Day, Sun at, Shading over the year, On the
  roof. No board draws it on tablet or phone, nor the shade map, the legend, the overlay or the states.
- **"Design day" means two things.** The view's `sunTime.day` "design_day" is sent to `/sun` as the winter
  solstice of the hemisphere; the array has its own design day (`array.design_doy`, null for the solstice, or 172
  or 80 from the Array lens), which the layout is made for (decision 2).
- **The modules are two instanced meshes** (frame and glass) whose matrices are written in a layout effect keyed on
  the placements; the placements are memoised on the layout, `heightAt` and the clearance. The scene re-renders when
  the sun changes (`Scene` reads it), and `Modules` with it, though nothing is rebuilt. There is no per-instance
  colour yet (`instanceColor`).
- **The tests have what the acceptance needs**: `inThePlan` maps the demo's metres to pixels of the page from the
  four edge labels; `zoomedInAt`, `cameraSettled`, `pixelsAt` read a picture of the canvas decoded in the page.
- **The test stack runs `next dev`**: a counter of development is there in the browser tests.

## How the work goes

- **Step 0, the boards**, drawn and approved before anything is built (below). Then **four pull requests**, split
  where nothing of the earlier depends on the later; each builds its screens on three sizes and carries its
  pictures beside the boards:
  1. `feat/phase-6-time`: the day's sun in one request; the time on the stage of every lens (the pill of the
     approved boards) and the timeline of the Sun lens with play; the day; the read-out; the Sun lens inspector's
     Day and Sun at; the keys; the counter of module writes. Steps 1 to 5.
  2. `feat/phase-6-path-shadows`: the shadow request takes the roof (`bun gen:api`); the light's bias held to the
     engine; the sun path and its marker; the shadow outlines of the engine; On the roof. The acceptance's 0.2 m.
     Steps 6 to 9.
  3. `feat/phase-6-shade`: the shading figures and the horizon note; the shade map's tokens; the modules coloured
     per instance, the legend, a selected module's loss and its string's. Steps 10 to 13.
  4. `feat/phase-6-states`: the states of the lens (a run computing, a shade map of an older layout, no option, the
     sun down, a sun that failed, a day without sunrise), the stage's top on phone, the frame rate, the close.
     Steps 14 to 17.
- Every step is one commit (two when a token is new: the document first). A draft pull request after its first
  step, merged after its last, on a green check. `bun check` green before every commit.
- Test first, seen failing. Logic is a pure function or a store without React, tested with `bun test`; the API
  with pytest; what is seen with Playwright on 390, 834 and 1440, with baselines.
- Agents build in worktrees under `$TMPDIR` with written briefs, independent parts in parallel; every result is
  reviewed and run before it is merged. Baselines with the imagery are made in the main working tree.
- `plan/STATE.md` is brought up to date on `main` after each pull request, from a worktree when a branch is open.

## Step 0: the boards

Drawn with one builder, `docs/design/mockups/build_phase6_boards.py`, from the helpers of Phase 5's builders and
their projection; rendered as before; listed in `docs/design/README.md`. Approval before step 1.

| Board | What it draws |
|---|---|
| **Studio, Sun lens** (replaces the sketch of `SunLens.dc.html`) | Desktop at 16:00 on 21 December: the stage with the shadows, the sun path and its marker, the timeline, the vitals; the inspector of the sketch, its words settled (decisions 3, 13) |
| **Studio, Sun lens, tablet and phone** | Tablet: the timeline at the bottom of the stage of 508, the inspector in two columns under the vitals. Phone: the stage of 252 with the time at its top (as the Array board has it), the timeline in the sheet over the inspector |
| **Time on the stage** | The pill of every lens (as approved) and the timeline of the Sun lens: paused and playing, dragged, focused by key; the day picker with Any date open; the sun down (before sunrise, after sunset); a day without sunrise or sunset |
| **Sun path and shadow outlines** | The arc above the horizon with the shade-free window thicker, the hour marks, the marker at the time; the engine's outlines dashed over the rendered shadows, in 3D and in the plan |
| **Shade map** | The modules coloured by their loss over the year, the legend on the stage, a selected module's callout with its loss and its string's; the map waiting for a run; the inspector in the Shade map tab |

Two agents draw them in parallel (the first two boards; the last three), from a brief that names the helpers, the
tokens and the numbers of the demo. The heat map's colours follow the skill for data colours, checked for contrast
on the stage and on the inspector.

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 1 | The day's sun | The flow asks `/sun` once per place and day: `step_h` 0.25, so 97 positions with sunrise and sunset, kept in the results store by its key (decision 1). The view's "design_day" is the array's design day (decision 2). `lib/scene/sun-day.ts`: the sun at a quarter hour from the day, the hours of the day the time may take (sunrise to sunset, rounded inward to the quarter), the words of the read-out (decision 3). The scene's light reads the sun of the view's hour; no request while the time moves | `design-flow.test.ts`: one request for the demo, none when the hour changes, one when the day or the place changes, the design day of the array sent as its day; `sun-day.test.ts`: the lookup, the hours at Pune on 355 (06:33 to 17:27 shown as 06:45 to 17:15 inward), the words "21 Dec, 16:00 solar time, sun 18.0° high, 56.6° W of south", north of the zenith, the day without sunrise | The sun of the text equivalent changes when the time is moved, with no request to `/sun` (counted by a route) |
| 2 | The time on the stage | `components/studio/TimePill.tsx` on every lens (the approved boards: desktop and tablet bottom left, phone top left): play, the day and the time, a short track; `SunTimeline.tsx` in the Sun lens on desktop and tablet (the board): play 44, the time in display 22 with "solar time", the track with the window filled, the ticks at sunrise, the window's ends, noon and sunset. Both are the `Slider` of the kit with the step of a quarter hour; the view store keeps the time, as now | `view-store.test.ts`: the hour clamped to the day's hours, the step; `sun-time.test.ts`: the ticks and their words from the day and the window | Dragging the timeline changes the picture of the canvas (pixels sampled before and after differ) and the read-out; the keys of the slider; axe |
| 3 | Play | `lib/studio/play.ts`: a pure stepper of the time on the clock of the app (`lib/clock`): a quarter hour every 250 ms up to sunset, where it stops; Play at sunset begins at sunrise; reduced motion: an hour a second (decision 4). Pause, and any drag or key, stops it | `play.test.ts` on a stubbed clock: the steps, the stop at sunset, the restart, reduced motion, a drag stops it | Play, then pause: the time moved; the picture changed; with `reducedMotion: "reduce"` it moves by hours |
| 4 | The day and the keys | The Sun lens's Day: 21 Dec, 21 Mar, 21 Jun as a segmented control, and Any date, which opens a day field (a day and a month), with the line that says which of them is the design day (the board). `use-sun-keys.ts`: `,` and `.` an hour back and forward, `[` and `]` a day, in every lens of the Studio, not while a field has the focus (decision 17) | `sun-time.test.ts`: the days by hemisphere, a day of the year from a day and a month and back, the keys' new times at the ends of a day and a year | A day chosen: the request of `/sun` carries it and the timeline's ticks move; the keys in each lens; not in a field |
| 5 | The Sun lens inspector and the counter; close of pull request 1 | `SunInspector.tsx` (the third inspector, as `ArrayInspector`): Shadows and Shade map (decision 16), Day, Sun at hh:mm with Height and Bearing as tiles; the sections of steps 9 and 10 follow. In development the instanced sets count their matrix writes into the stage store, and the stage says the count as `data-module-writes` (decision 6). The text equivalent says the time and the day. Baselines of the Sun lens and of the pill on the other lenses | `stage-store.test.ts`: the count; `stage-view.test.ts`: the Sun lens's line ("21 December · winter solstice · shade-free from 09:00 to 16:00") | The acceptance's "scrubbing never rebuilds": a full drag of the timeline and a played hour leave `data-module-writes` as it was; a roof type changed raises it (the counter counts) |
| 6 | The shadow request of a roof | The API: `ShadowRequest.roof` in place of `project` (decision 8); `bun gen:api` | pytest: the demo's shadows at 16:00 from its roof alone; the request's size; `services/sun.py` unchanged in what it answers | |
| 7 | The light held to the engine | `shadowBiasOf` bounded by what it shifts: the `normalBias` keeps `normalBias × cot(height)` under 0.05 m, the depth bias and the casters' back faces (`shadowSide`) keep the acne away, the shadow camera fitted to the roof's footprint rather than its sphere if the texel must shrink, PCF 2048 kept unless the measure says 4096 (decision 9) | `sun-light.test.ts`: the shift of the bias under 0.05 m from 8° to 90°; no bias below the acne's floor | The acceptance (decision 15): in the plan, at 16:00 on 21 Dec, zoomed on the stair room, the edges of the rendered shadow found along a row and a column of pixels lie within 0.2 m of the engine's corner (32.72, 25.09), read from the answer of step 6; on three sizes. No acne: the lit roof south of the stair room is one colour within a tolerance |
| 8 | The sun path | `lib/scene/sun-path.ts`: the day's positions above the horizon on a dome about the roof's centroid (1.3 times its radius), the part inside the shade-free window apart; `components/scene/SunPath.tsx`: a line in `sun`, the window's part thicker (as a tube, since lines have one width), the marker a disc in `sun` with a core of `sunCore` at the time, never lit or shadowed (`toneMapped` off); the hour marks of the board as DOM by the Projector; off below the horizon | `sun-path.test.ts`: the demo's arc from 06:45 to 17:15, its points on the dome, the window's part from 09:00 to 16:00, the marker at 16:00 along `sunDirectionOf`, none at night | The arc is drawn (a pixel of `sun` near the projected marker), it follows a day changed; switched off, it is gone |
| 9 | The shadow outlines and On the roof; close of pull request 2 | The flow asks the shadows when Calculated shadow outlines is on and the time rests (a released drag, a key, each step of play), keyed by the roof's edit, the day and the hour, what was asked before given up (decision 7); `components/scene/ShadowOutlines.tsx`: the polygons on the roof surface as dashed lines of `keepOutLine`, no fill, lifted as the keep-out is (decision 9). The inspector's On the roof: Sun path, Shade-free window, Calculated shadow outlines (the view store; decision 16) | `design-flow.test.ts`: no request while the switch is off, one when the time rests, none per step of a drag; `shadow-outlines.test.ts`: the rings | The outlines are drawn over the rendered shadow; the request carries the roof and not the weather; the switches |
| 10 | The shading figures | The inspector's Shading over the year: Near linear, Electrical beyond linear, Far horizon, Kept clear, as tiles; the horizon note in the engine's words (decision 13); the line of what they count | `sun-figures.test.ts`: with an option, option A's 0.35, 0.56, 0.01 and 150 m², "Of the 638 modules of option A"; without, 0.37 and 0.01 over the 790 positions and the electrical waiting in the API's words; with no run, skeletons | The figures read equal to what the design run answered (read from the response in the test), on three sizes |
| 11 | The tokens of the shade map | `design-tokens.md` first: five steps of one hue for the loss (`--color-shade-1` to `-5`) and their scene twins in the palette (`shade1` to `shade5`); `globals.css`, `scene-palette.ts`, held equal by the tests (decision 11) | The tests of the tokens and the palette | |
| 12 | The shade map | `lib/scene/shade-map.ts`: the scale from 0 to the next round value over the largest loss (1, 2, 5, 10, 20 %), a step per position; `Modules.tsx` colours the glass per instance (`setColorAt`, the material white) when the Shade map tab is open and the run is of the layout shown, the matrices untouched (decision 12); `ShadeLegend.tsx` on the stage (the board) | `shade-map.test.ts`: the demo's scale 0 to 5 %, the steps of 0.03 % and 3.59 %, the map of a run of another layout refused | The Shade map tab colours the modules (a pixel of the most shaded position is of the last step, read where the projection of its centre falls); `data-module-writes` unchanged by the switch; the legend |
| 13 | The value on select; close of pull request 3 | With the shade map open, the callout of a selected module says its loss over the year and, when the chosen option uses it, its string and the string's shade ("Position 412 · row 3", "Near shading 1.39 % over the year · string S12, 4.99 %"); the text equivalent the same (decision 14) | `pick.test.ts`: the callout's words with and without an option | A module pressed in the shade map: the callout's words equal the response's figures |
| 14 | The states | While the design runs the figures are skeletons and the shade map waits with the ring; a layout newer than the run keeps the modules plain and the legend says the map follows the run; no option: the electrical figure waits; the sun down: the light faded, the timeline says "Sun down" and the marker is away; `/sun` failed: the chip of the stage with the API's words and Try again (as a failed layout); a day without sunrise or sunset: the track from 00:00 to 24:00 and the words of the API (the board) | `stage-view.test.ts`, `sun-figures.test.ts`: each state's words | Each state on three sizes, held back by a route where it needs a request on its way |
| 15 | The stage's top on phone | The time at the top of the phone's stage (approved board); the callout kept under it; the callout and the turn handle of a pinched phone looked at again (open item of Phase 5) | `projection.test.ts`: the callout's place kept inside the stage under the pill | The phone's pictures with a module selected and with the stair room selected |
| 16 | The frame rate | Played by hand with 1,068 modules on the sloped roof, the frame rate measured as in Phase 5 (`fps.mjs`) while the time plays and while it is dragged; written in "As built" | | |
| 17 | Close of pull request 4 | Baselines; "As built" with the deviations and what was found; the status; the state | | |
| C | Close | "As built" in the phase file, status in `README.md`, `STATE.md`, the record of session 10, resume 009 set to used | | |

## Decisions I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | The sun of the scene comes from `/sun` for a whole day: one request per place and day, at a step of a quarter hour (97 positions, sunrise, sunset), kept in the results store by its key. The light at the view's hour is that day's position at the hour. The time is always a quarter hour: the timeline, the keys and play step by it | A scrub without a request per step; the sun path needs the day anyway; the positions stay the engine's (Phase 5, decision 5) |
| 2 | The view's design day is the array's (`array.design_doy`, else the winter solstice of the hemisphere), so the stage first shows the day the layout is made for. The Day of the Sun lens offers 21 Dec, 21 Mar, 21 Jun and Any date, with a line that says which is the design day ("21 December is the design day: the winter solstice for this hemisphere") | One design day; the board's sketch says it so |
| 3 | Times are solar time, as the engine's and the boards'. The read-out says the day, the time, the height and the bearing from the nearer of south and north: "21 Dec, 16:00 solar time, sun 18.0° high, 56.6° W of south"; "12.3° E of north" when the sun stands north | The phase file's words; a June sun at 18.5° N stands north at noon |
| 4 | Play moves a quarter hour every 250 ms (a day in about 11 s) up to sunset and stops there; Play at sunset begins at sunrise. Under reduced motion it moves an hour a second. A drag, a key or Pause stops it. The camera never moves with the time | Played once through, as the desktop app played its window; reduced motion asks for fewer changes, and play is begun by the user |
| 5 | The time is on the stage of every lens, as the pill of the approved boards; the Sun lens has the timeline of its board instead. The time is of the view: the same in every lens, not in the document | The approved Array boards draw the pill on three sizes; `.rtd` holds no view |
| 6 | The sun's state is apart from the geometry (fix 12): `Modules` is memoised and takes no sun, its matrices are written only when its placements change. In development the instanced sets count their matrix writes into the stage store and the stage says the count as `data-module-writes`; production has neither | The acceptance asks for a counter in development; a counter of renders would count what React may redo without cost, the writes are the rebuild |
| 7 | The shadow outlines are asked only while their switch is on, when the time rests: at the release of a drag, after a key, at each step of play; what was asked before is given up. Keyed by the roof's edit, the day and the hour | A drag passes forty quarter hours; the outlines are a check, not a live layer |
| 8 | `ShadowRequest` takes the `Roof`, not the whole `Project`: the shadows read the roof alone. Nothing asks for them yet, so no client changes but the generated types | The demo's document is 484 KB with its weather, its roof 1.4 KB, asked at every rest of the time |
| 9 | The outlines are the engine's polygons on the roof surface (plane height 0), dashed in `keepOutLine` without a fill, lifted as the keep-out is, so the rendered shadow shows inside them; off at first, as the board has it. The light's bias is held to the engine: what it shifts a shadow on a level roof stays under 0.05 m at every height of the sun, and the acne is kept away by the depth bias and the casters' back faces | The overlay shows that the rendered and the calculated shadows agree; that holds only if the bias does not move them |
| 10 | The sun path is the day's positions on a dome of 1.3 times the roof's radius about its centroid: a line in `sun`, the window's part thicker, the marker a disc of `sun` with a core of `sunCore` at the view's time, unlit; hour marks as DOM placed by projection (Phase 5, decision 6). Nothing below the horizon. Shown in 3D and in the plan | The board's sketch; the labels' rule of Phase 5 |
| 11 | The shade map is one hue in five steps, new tokens documented first, light rising with the loss so that the most shaded positions stand out on the dark stage; the colour is never alone: the legend says the range and a selected module says its value | A sequential single hue (phase file); the colours of data are not the series colours, which are categories |
| 12 | The shade map colours each position by `Shading.near_pct_by_module` of the design run, through `instanceColor` of the glass, only when the run is of the layout shown (its edit not older than the layout's, the same count of positions); otherwise the modules stay plain and the legend says the map follows the run. The scale runs from 0 to the next round value over the largest loss | No new geometry, no new request; a map of another layout would colour the wrong modules |
| 13 | The shading figures are the chosen option's (its loss chain's near linear, electrical and far), with the line "Of the 638 modules of option A", as the board's sketch; without an option, near and far over all positions (`Shading`) with "Of all 790 positions", and electrical waits in the API's words (D37, rule 3). Kept clear is the layout's. The horizon note is the engine's sentence as it is ("Far shading: PVGIS horizon, highest 2.7°") | Electrical shading needs strings; the board's numbers are option A's; the words of the engine are not reworded |
| 14 | In the shade map a selected module's callout says its loss over the year and, when the chosen option wires it, its string and the string's `shade_pct`. Strings are not drawn (Phase 7) | "Value on select" and "per-string shade once strings exist" of the phase file; `shade_pct` was never shown |
| 15 | The acceptance's 0.2 m is a browser test: the plan, 21 Dec at 16:00, zoomed on the stair room, the shadow's edges found by the light stepping along a row and a column of pixels through the engine's corner, the pixels turned into metres by the frame of the edge labels (`inThePlan`), on three sizes; the corner read from the shadows' answer, not written into the test | The phase file's acceptance; the corner lies on bare roof (found above) |
| 16 | The Sun lens's own state is of the view: the tab (Shadows or Shade map), the three switches of On the roof (Sun path and Shade-free window on, Calculated shadow outlines off, as the board), playing or not. Leaving the Sun lens leaves the shade map off; the time stays | Nothing of it is the design; the other lenses show the modules plain |
| 17 | The keys of the time work in every lens of the Studio, not while a field, a slider or a menu has the focus: `,` and `.` an hour, `[` and `]` a day (the day becomes Any date), the arrows on the timeline a quarter hour as a slider's do | The phase file's keys; the time is on every lens's stage |

## What was found in the code and the API, for the steps

| Step | Fact |
|---|---|
| 1 | `SunRequest` takes `hours` or `step_h`, not both; `day` is a day of the year or "design_day". `sunrise_sunset` bisects the engine's own `sun_solar_time`, so the arc and the shadows agree. At Pune on 355: sunrise 06:33, sunset 17:27 |
| 1 | `createDesignFlow` asks the sun in `askForTheSun` on every change of the view store, deduplicated by `sunKeyOf`; the results store keeps one `SunAt` |
| 2 | `Slider` takes `scale`, `hint`, `ticks`; its value commits on release, a drag changes what is shown (components.md): the time follows what is shown, live, and play stops on a press |
| 5 | `Studio.tsx` chooses the inspector by the lens; `NotBuiltYet` stands for the Sun lens today. `inspector-look.tsx` has `SECTION`, `ROW`, `ReadOut` |
| 6 | `services/sun.shadows_at` reads `request.project.roof` and nothing else; `ShadowRequest` is in `SunRequest.shadows` and in the generated types |
| 7 | `SunLight` fits the shadow camera to `radius × 1.1` each way: 108 m over 2048 texels, 5.3 cm each; `shadowBiasOf` is `max(0.1, texel × 3 × min(8, 1 / max(0.12, sin h)))` |
| 8 | `sunDirectionOf` gives the unit vector toward the sun in three's metres; the CameraRig's Sun's eye looks along it |
| 12 | `InstancedSet` writes `setMatrixAt` in a layout effect keyed on the placements, the thickness and the material; `instanceColor` is not used; the glass's `MeshStandardMaterial` is made once |
| 13 | `calloutOfModule` (`lib/scene/pick.ts`) gives "Position n · row r"; `Option.system.strings[].modules` are indices of the layout, with `label` and `shade_pct` |
| 14 | `LayoutFailed` is the chip of a failed layout with Try again; `ResultsState.sun.failure` is kept and not shown |

## What needs the owner

| What | When | Blocks |
|---|---|---|
| A yes or no to each decision above | Before step 0 | Everything |
| The five boards of step 0 | Before step 1 | Pull request 1 |

## Risks

| Risk | What I do |
|---|---|
| The rendered shadow is not within 0.2 m of the engine's: the bias (found above), the texel of 5.3 cm, PCF's soft edge | Step 7 measures before anything is drawn on it. The bias is bounded by what it shifts; the edge is found at the middle of the light's step; if the texel is the limit, the shadow camera is fitted to the roof's footprint along the light, then 4096 is measured on software WebGL and on this machine's GPU |
| Acne on the roof when the normal bias is small | The casters draw their back faces into the shadow map; the depth bias tuned by the measure; the test of step 7 reads the lit roof as one colour |
| The frame rate while scrubbing with 1,068 modules: each step draws the shadow map again | Steps of a quarter hour, at most one per frame; nothing else changes with the time; measured by hand in step 16 against the 56 fps of the orbit |
| The browser tests are 814 s already; each new picture runs on three sizes in software WebGL | One baseline per new state, the rest of the tests read text and pixels; the sun's tests wait for what the text equivalent says, never a time |
| A change of the API's models | `ShadowRequest` alone (decision 8); `bun gen:api` and `packages/api-types` in the same commit |
| The colour of the shade map read wrongly by people who do not see the hue | Light rises with the loss (one hue, so lightness carries it), the legend, the value on select, the text equivalent's range |
| The design run takes 12 s: the shade map and the figures wait for it | Their states are drawn (step 14); the layout's modules stand plain meanwhile |
| The phase is four pull requests and step 0, more than one session | The state is written after each pull request; each session ends at a merge |

## Done means

The acceptance of `plan/phase-06-studio-sun.md`, point by point:

- The stair room's shadow at 16:00 on 21 Dec lies within 0.2 m of the engine's polygon at its far corner: the
  browser test of step 7, on three sizes, the corner read from the API's answer.
- Scrubbing never rebuilds the module geometry: the development counter of step 5, unchanged by a full drag of the
  timeline, a played hour and the shade map switched on and off, and raised by a change of the roof type.
- Playwright: a scrub changes the rendered frame (step 2), the figures match the API (step 10), three viewports
  (every step), baselines beside the boards.

And beyond it: the boards of step 0 approved and in the repo, the time on every lens's stage as the approved boards
draw it, the shadow request of a roof, the light held to the engine, the per-string shade shown, "As built"
written.
