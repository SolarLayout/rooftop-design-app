# Phase 10: Home, projects on the device, Present mode

**Status:** done (session 13, 2026-10-03, unattended: #67, #69, #71, #72; the check mended by #68 and #70). **Depends on:** phases 3 to 9.

## Goal
A first screen that gets a visitor into a design in one action, and a hands-off mode for the tradeshow stand.

## Scope: Home
- Find my roof: the search field opens the map of phase 4 at the result.
- Import a drawing: KMZ, KML or DXF by drop or picker.
- Open a project: `.rtd` by drop or picker.
- Open the demo.
- Designs on this device: cards with a thumbnail of the 3D, name, capacity, energy, last edited.
  Rename, duplicate, delete, save a copy as a file.

## Scope: projects on the device
- IndexedDB store, autosave on every committed edit, "Saved on this device" state in the top bar.
- Undo and redo across the whole project document.
- Results are not stored; they are recomputed on open (as on desktop).
- Warning before leaving with an export in progress.

## Scope: Present mode
- Full screen, chrome hidden. A scripted tour of the current design:
  satellite view tilts into 3D, the building rises, obstacles rise, modules fill row by row, the sun sweeps the design day with shadows,
  strings light up by colour, energy counts up to the year-1 number, loss chain cascades.
- Slow camera moves between set points; loops until a key or touch; any input returns control.
- Respects reduced motion (cuts instead of moves).
- Runs from cached results, so it works with the API offline once a design is loaded.

## Acceptance
- From a cold start to the demo in Studio: one click.
- Reload the browser: the design is there, results recompute, no data lost.
- Present mode runs 30 minutes without a frame hitch over 50 ms or a memory climb.
- Playwright: create, rename, reopen, delete a project; Home on three viewports.

## As built

Built in session 13 (2026-10-03), unattended at the owner's pre-approval (`plan/sessions/013/owner-messages.md`, messages 18 and 19): the plan
(`phase-10-plan.md`), five boards, four pull requests: #67 (the designs kept on this device), #69 (Open a project), #71 (Home), #72 (Present).
Between them #68 and #70 mended the check on GitHub (its ten-minute limit had cancelled every run since #66). Every part was built by an agent in
a worktree from a written brief; the session reviewed each against the boards, ran the groups it reaches, made the baselines and looked at every
picture beside its board before the pull request was opened. Three builds were sent back or reworked for the boards (the switcher's fact under
the name; the Open a project dialog reading at once with its notes in the dialog; Home's illustration, thumbnail and menu).

### What exists

| Part | Where | Pull request |
|---|---|---|
| The kept design: the document whole under an id and its name, the facts of its card (the roof's words by `roofWordsOf`, the capacity and the energy of the last run's chosen option), the thumbnail, the times; IndexedDB through the browser's own API (database `rooftop`, store `designs`, an index on the time edited), list, get, put, remove, a failure an Error that says what could not be done | `lib/device/kept-design.ts`, `designs-db.ts` | #67 |
| Saving: a store without React over the project and results stores; a committed edit writes the record `SAVE_DEBOUNCE` (600 ms) after the last, undo and redo too, the name follows a rename, a landed layout and a landed run write it again (the facts and the plan follow the run; writes within the debounce are one span of Saving); the demo is kept at its first edit under a new id (D32); the open design's id in `localStorage` (`rooftop.open-design`); Not saved with the device's words as a note, Try again | `lib/device/saving.ts`, `remembered.ts`; `components/shell/SaveState.tsx`, `notes-view.ts` | #67 |
| A workspace without a design opens the design remembered, read from the device, and the flow runs it (`/layout`, `/design`, never `/demo`); one no longer there opens the demo silently, one that cannot be read opens the demo and says so; On this device in the switcher, the newest edited first, the fact under the name, the open one with the tick; the warning before leaving while a file is on its way | `lib/device/opening.ts`, `leaving.ts`; `components/shell/use-opens-what-belongs.ts`, `ProjectSwitcher.tsx`, `switcher-view.ts`, `Shell.tsx` | #67 |
| `POST /project/open`: a project file as `ProjectFile {name, text}` (at most 10 MB) read by the engine's one reader (`Project.from_json`, formats 1 and 2), answered as `OpenedProject {project, notes}`: the project as a request carries it in the current format, one note per PAN, OND or CSV weather named by path without its text in the engine's words (`not_included`, made public); refused in words: not JSON, no object, a missing key, a shape the engine cannot read, a value a request refuses, a format this version does not read | `rooftop_api/routers/project.py`, `services/project_files.py`, `schemas/project_file.py`; `rooftop_core/project.py` | #69 |
| Open a project: a dialog from the switcher's row and from Home; an `.rtd` read as soon as it is dropped or chosen, the field showing the file's name, the project's name and that the capacity and the energy come with the run; the engine's notes as rows under the field; Open keeps the project as a new design (`keepAndOpen`) and opens it in the Studio at its last lens, no second request; a file that is no `.rtd` refused in the dialog's words without a request; the API's refusals in the field in its words; an API not reached offers Try again; the field takes no other file while one is read | `components/home/OpenProject.tsx`; `lib/home/open-project.ts`; `lib/api/client.ts` (`openProject`) | #69 |
| Home on three sizes: the logo and the name, the headline and the subtitle (`--text-lead`), Find's search in the look `hero` ("Find my roof" a link to `/find` while nothing is typed; a place or coordinates lead to `/find?at=` at the roof), Import a drawing and Open a project as rows, the demo's card from `/demo` with the roof's words and the untouched demo's numbers once it has run here (`rooftop.demo-run`), "Open the demo" without a second request, "On this device"; the board's illustration as an SVG component (whole on desktop, a strip on tablet, none on phone) with twelve colour tokens of the scene's palette | `components/home/Home.tsx`, `DemoCard.tsx`, `HomeIllustration.tsx`, `OnThisDevice.tsx`; `lib/home/home-view.ts`; `lib/device/demo-run.ts`; `components/find/Search.tsx` (`look="hero"`); `lib/routes.ts` (`pathOfFind`) | #71 |
| The cards: the tile with the plan, the name, the roof's words, the capacity and the energy of the last run or what waits ("Waiting for a system voltage", "Not run yet"), "Edited …" (`whenOf`), a menu of 32 with Open, Rename in place (`TextField`), Duplicate ("Copy of …", opened), Save a copy (the `.rtd` by the API's name), Delete (a dialog in the board's words); the saving store's `rename` and `remove`, the downloads store's `saveACopyOf` | `components/home/DesignCard.tsx`; `lib/home/cards.ts`; `components/ui/list-look.ts`, `menu-keys.ts`, `place-floating.ts` (`align: "end"`) | #71 |
| The thumbnail: the plan of the kept layout as an SVG of 320 by 180 in its own units (the roof, the setback, the kept-clear areas, the modules in the module glass, the obstacles), written with the design when a layout lands; `footprintsOf` and `fittedViewBoxOf` shared with the Studio's plan | `lib/device/thumbnail.ts`; `lib/scene/plan.ts` | #71 |
| The tour's script, pure: six scenes of 40 s a loop with their camera step, reveal, hour, colouring, figures and words; `stateAt`; the reduced-motion script as cuts (the day in twelve) | `lib/present/tour.ts` | #72 |
| The reveal in the scene: the view store's `presentation` and `setCamera(preset, { over })`; the building rising from the ground and the obstacles from the roof by their share, the modules drawn to a share of the placements by the instance count; the camera chasing a path between presets (a slerp of direction, a lerp of distance, never below the roof) in its frame loop; under a presentation no shade map, sun path, selection or shadow outlines, and the flow asks for no shadows; the Studio untouched | `lib/stores/view-store.ts`; `lib/scene/reveal.ts`, `camera-move.ts`; `components/scene/Building.tsx`, `Obstacles.tsx`, `Modules.tsx`, `CameraRig.tsx`, `Scene.tsx`; `lib/flow/design-flow.ts` | #72 |
| `/present`: the Studio's scene on the whole screen without the shell's chrome, a stage store of its own; the words at the bottom left over the fade, the hint at the right fading after the first loop; the text equivalent (the modules revealed, the ground, the time, the strings, where the tour stands); `createTour` driving the view store on the app's clock, looping, giving the view back at the stop; a key, a pointer or a touch leaves to the Studio's last lens; the browser's full screen asked for where allowed; the top bar's Present a link on desktop and tablet | `app/present/page.tsx`; `components/present/Present.tsx`; `lib/present/create-tour.ts`, `words.ts`; `components/shell/TopBar.tsx`; `lib/routes.ts` (`PRESENT`) | #72 |
| The energy and the chain in the last scene: the hero number counting to the chosen option's MWh with an ease-out, the chain's bars cascading with the same share, from the stores alone; `cascade.ts` moved to `lib/format` so Present may share it | `components/present/PresentFigures.tsx`; `lib/present/counting.ts`, `figures.ts`; `lib/format/cascade.ts` | #72 |
| Offline and the frame budget: nothing of Present asks the API (a unit test and the browser's aborted routes); frame times sampled over two loops on the real clock where the graphics are the machine's; the soak of thirty minutes (`ROOFTOP_SOAK_GPU=1 bun tools/present-soak.ts`) | `lib/present/offline.test.ts`; `e2e/tests/present.e2e.ts`; `tools/present-soak.ts`, `e2e/soak/` | #72 |
| The browser groups `home` (`home*.e2e.ts`; `components/home`, `lib/home`, and Find's) and `present` (`present*.e2e.ts`; `components/present`, `lib/present`, the soak, and the Studio's); `lib/device` in the base | `tools/check/e2e-groups.ts`, `turbo.json`, `docs/checks.md` | #69, #71, #72 |

### Acceptance

| Asked | Met by |
|---|---|
| From a cold start to the demo in the Studio: one click | Home's "Open the demo" opens the demo in the Studio at its last lens with one `/api/demo` and one `/api/design` (`home.e2e.ts`) |
| Reload the browser: the design is there, results recompute, no data lost | A design kept is opened again on a reload with its edit, the energy asked once again and the demo never (`device.e2e.ts`); a design opened from a file the same (`home-open-project.e2e.ts`) |
| Present runs 30 minutes without a frame hitch over 50 ms or a memory climb | The soak with the machine's graphics on 2026-10-03 (`ROOFTOP_SOAK_GPU=1 bun tools/present-soak.ts`, Chromium on the Mac Studio): 30 minutes, 108,000 frames at 16.7 ms mean, the longest 33.4 ms (a frame dropped in 5 of the 30 minutes), none over 50 ms. The heap read by `performance.memory` stood at 35.6 MB for the first 20 minutes and at 61.0 MB from minute 21 to 30 without further change: one step, not a climb, but the soak's own gate (a quarter) is not met, and a 30-minute run cannot tell a step of the heap's size class from a slow leak. Watch item for Phase 11 (`plan/STATE.md`). An earlier run the same day stood at 29.8 MB for 17 minutes before it was interrupted by a branch switch |
| Playwright: create, rename, reopen, delete a project; Home on three viewports | `home.e2e.ts` (a design built by hand kept at its first edit, Rename, a card reopened, Duplicate, Save a copy, Delete, three sizes), `device.e2e.ts`, `home-open-project.e2e.ts`; the pictures `home`, `home-designs` on three sizes |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Step 8: a format 1 file's missing files fall back to the bundled sample | The paths are kept and the texts empty; the note says the file must be chosen again, and the design asks for it at `/design` | The engine does not fall back when a path is set: the note's words are the engine's own |
| Step 12: the card's thumbnail is "a thumbnail of the 3D" | The plan of the kept layout (decision 6), the modules in the module glass | Deterministic, no read-back of the canvas; the boards draw the plan |
| Decision 5: the demo's card shows the kept facts once the demo has run | The untouched demo's run is remembered in one key of `localStorage`, not as a kept design | The demo is not kept until it is edited, and an edited demo's numbers are not the demo's |
| The board's "Format 2 · name" and the capacity line in Open a project | The project's name and "Capacity and energy come with the run in the Studio" | The API's answer carries the current format, not the file's, and no capacity or energy |
| The board's "flat industrial roof" | "90.0 × 40.0 m flat roof, tilted rows" | The engine says the roof's type, not its use; nothing is typed |
| Step 21: the frame budget test in the check | Not measured in software WebGL (SwiftShader draws a frame of the stage in more than 50 ms whatever the code does); the soak with the machine's graphics is the measure | The tests draw with SwiftShader (D-, `plan/STATE.md`) |
| Step 14: a group `home` made with Home | Made with Open a project (#69), since the dialog is `components/home`'s; its own inputs gained Find's with Home | The groups' tests refuse a folder no group sees |

### Found on the way

- The `check` workflow on GitHub had been cancelled at its limit of ten minutes on every run since #66 (pytest whole in one process 7 min 49 s
  on the runner for 722 tests; the whole check eleven to thirteen minutes cold): a job cancelled at its limit saves no cache, so every run after
  started cold again. The limit is fifteen minutes (#68). pytest-xdist was tried and taken out (#70): two workers on the runner's two cores took
  the same time, and beside a worker the test that times `/layout` ("well under a second") took 2.24 s.
- A floating panel closes on any scroll of the page; a menu whose first row stands below the fold scrolled the page when it took the focus, and
  closed itself at once. The focus no longer scrolls; the tests bring the card into view first, as a reader has it.
- Under a page clock held from the start (Playwright's `clock.pauseAt` right after `goto`) the Studio's stage never comes up: no canvas, no
  imagery. The clock runs until the stage is drawn, then is held; where the tour stands is read from the stage's text equivalent.
- Four Present tests at once in software WebGL starved each other past their time (25 of 30 passed): the suite's tests run one after the other
  in their worker (30 of 30, 10 minutes).
- Tailwind's `w-full` on an SVG won over the `w-260` given with it: a sized element is sized by its wrapper.
- A test's nearest-colour classification of a band of pixels read the ground's greens as a series colour: the band is compared against the
  scene before.
- The shell group's run on this machine loses the handover pictures to the wait for the report's pages under its own load (5 to 10 of 380),
  each passing alone: the known proxy drop (`plan/STATE.md`), not fought (D55).
