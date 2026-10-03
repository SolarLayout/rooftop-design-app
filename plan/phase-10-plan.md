# Phase 10: plan

Written 2026-10-03 by session 13, before anything of the phase is built, as the work order asks
(`plan/resume/013-phase-10-home-projects-present.md`). Scope and acceptance: `plan/phase-10-home-projects-present.md`. This file says how
the phase is built, in which order, what is decided, what was found in the code and the API, and what done means. The owner pre-approved the
phase whole (session 13, message 18): the decisions below stand as written, the boards are approved as drawn, and the pull requests merge on
the fast check and the groups they reach (D55).

## What was found at the start

- `main` is green at the close of Phase 9 (`78d19f4`); no branch stands on it; the test stack runs on 4710 and 4711.
- **Nothing is kept on the device today.** `Shell.tsx` passes `saving="not-kept"` to the top bar; a workspace without a design opens the
  demo (`flow.openDemo`: `GET /demo`, then `project.open(demo)`); `/find` never does. A reload loses a design built on the map (D44). The
  project store keeps 50 edits for undo and redo (`KEPT_EDITS`), and the keys undo on every workspace.
- **A document is the API's `Project`**: the demo with its weather embedded is about 700 KB of JSON (the `.rtd` of Phase 9 is 680 KB). The
  results are never in the document: a design opened runs again (`/layout`, `/design`, 12 s on the demo) as the desktop does.
- **The switcher** (`ProjectSwitcher.tsx`) says "On this device · Designs you save appear here." and has "Open a project (.rtd)" shown and
  not usable; "New design", "Import a drawing", "Save a copy", "Home" and "Rename" work. **The top bar's Present** is shown and not usable,
  "Comes with Home and projects". **Home** (`app/page.tsx`) is a placeholder with "Find my roof"; its approved board (`Home.dc.html`,
  desktop, round 1) draws the headline, the search as the primary action, Import a drawing, Open a project, the demo's card ("Pune demo roof
  · 90 × 40 m flat industrial roof · 357.28 kWp · 617.8 MWh · Open the demo") and "On this device · Designs you save appear here. Nothing
  leaves this browser until you export." No tablet or phone board, no cards of saved designs, no Open a project dialog, no Present board.
- **The API reads no `.rtd`.** The engine does: `Project.from_json` takes format 1 and 2 (`READABLE_FORMATS`), refuses another in words
  (`UnsupportedProjectFormat`, mapped to the API's `unsupported_project_format` by `errors.py`); a format 1 file names its PAN, OND and CSV by
  path without their text, and the engine says what is not included (`_not_included`). `/roof/import` shows the shape of a file coming in
  (`RoofFile`: name and base64) and of a refusal in words (`roof_file_unreadable`).
- **The scene can be driven from the stores alone.** The view store sets the camera preset (`3d`, `plan`, `fit`, `sun-eye`; `setCamera`),
  the sun time (`setSunTime`), play (`play.ts`: a quarter hour every 250 ms, an hour a second under reduced motion), the lens, the colouring
  of the strings (`colourStringsBy`), what is on the roof; `CameraRig` frames a preset when it is asked for, at once, never between two;
  `Modules` is instanced over `placements` with `glassColours`; `Building` and `Obstacles` draw what the document says; the canvas renders on
  demand (`frameloop="demand"`, no `preserveDrawingBuffer`). Performance's KPIs and chain are components over the chosen option.
- **The browser groups** (`tools/check/e2e-groups.ts`): Home's suites are the shell group's by name (`routes`, `shell`, `screens`); a new
  suite or folder must be placed, and an import across groups is refused. The shell group sees every folder.

## How the work goes

- **Step 0, the boards**, drawn by two agents from the engine's numbers (`mockups/home_data.json`: the demo's card facts, the cards of three
  kept designs, the API's words for a refused file) and committed to `main`; approved by this plan's standing (the owner's pre-approval).
  Then **four pull requests**:
  1. `feat/phase-10-device`: the designs kept on the device (IndexedDB, no dependency), saved on every committed edit, the state of saving in
     the top bar and the switcher, a reload that opens the kept design and runs it again, the switcher's "On this device" with the designs,
     the warning before leaving with an export on its way. Steps 1 to 7.
  2. `feat/phase-10-open-project`: `POST /project/open` in the API; Open a project in the switcher and on Home, with its dialog and its words
     for a format 1 file. Steps 8 to 10.
  3. `feat/phase-10-home`: Home as the board on three sizes; the cards of the designs on this device with Rename, Duplicate, Delete and Save a
     copy; Open the demo; Import a drawing from Home. Steps 11 to 15.
  4. `feat/phase-10-present`: Present mode. Steps 16 to 22.
- Each step one commit; a document change a commit of its own; a draft pull request after the first step, merged after the last on the fast
  check and the groups the change reaches, every picture looked at beside its board. Agents build in worktrees from written briefs; the
  session runs the browser and makes the baselines. `plan/STATE.md` after each pull request.

## Step 0: the boards

| Board | What it draws |
|---|---|
| **Home, tablet and phone** (`HomeTablet.dc.html`, `HomePhone.dc.html`) | The approved desktop board laid out for 834 and 390: the headline and the search first, the three ways under it, the demo card, "On this device"; the 3D illustration smaller on tablet and gone on phone |
| **Home, designs on this device** (`HomeDesigns.dc.html`, desktop and phone in parts) | "On this device" with three cards: a thumbnail of the plan, the name, the roof's words, the capacity, the energy, "Edited 2 hours ago"; a card's menu (Open, Rename, Duplicate, Save a copy, Delete); Delete asked in a dialog; a design renamed in place; the switcher's "On this device" with the same three; the state of saving in the top bar: Saved on this device (the dot), Saving (the ring), Not saved (the note) |
| **Open a project** (`OpenProject.dc.html`, desktop and phone in parts) | The dialog from Home and from the switcher: the file drop for an `.rtd`, a file read with its facts (the name, the format, the capacity), a format 1 file with the engine's notes on the files to choose again, a file refused in the API's words (not an `.rtd`; a format this version does not read), Open the primary action |
| **Present** (`Present.dc.html`, desktop; phone in parts) | The stage without chrome on the whole screen with the words of the moment at the bottom left ("Pune demo roof · 357.28 kWp · 617.8 MWh a year"); the stages of the tour as a strip of six frames: the satellite from above tilting into 3D; the building and the obstacles rising; the modules filling row by row; the day played with its shadows; the strings lit by colour; the energy counting up to 617.8 MWh with the chain cascading beside it; the hint "Press any key or touch the screen to return", fading after the first loop |

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 1 | The kept design | `lib/device/kept-design.ts`, pure: a `KeptDesign` (id, name, document, the facts of the card: the roof's words, kWp, MWh of the last run, `editedAt`, `openedAt`), `keptOf(document, results, now)`, `cardFactsOf`; `lib/device/designs-db.ts`: the IndexedDB adapter (database `rooftop`, store `designs` by id, `list`, `get`, `put`, `remove`), a thin layer of I/O, errors in words | `kept-design.test.ts` (the facts: "90 × 40 m flat industrial roof", "357.28 kWp", "617.8 MWh", the words of when) | The adapter through the app: a design saved is listed after a reload |
| 2 | Saving | `lib/device/saving.ts`: a store without React: hears the project store's commits, writes the kept design after `SAVE_DEBOUNCE` (a design number, 600 ms), says `saving` then `saved`, `not-saved` with the error's words; the demo is not kept until it is edited (D32), then it is a design like any other; `openedAt` kept in `localStorage` under one key, so a reload finds it (decision 2) | `saving.test.ts` with a fake adapter and clock: a commit saves once after the debounce, two commits one write, a failure says so, the demo untouched is not kept, the name follows a rename | The state in the top bar: "Not kept on this device" on the demo, "Saved on this device" after an edit |
| 3 | The state of saving | `Shell.tsx` reads the saving store (no longer `"not-kept"` hard-coded); `SaveState` as components.md; the switcher's words the same; "Not saved" opens the notes with the words | `shell` unit tests of the words | The dot, the ring (held by a slow fake? no: the words checked), the note |
| 4 | A reload keeps the design | `Shell.tsx`: a workspace without a design opens the design `openedAt` names from the device, else the demo; the flow runs it again (`/layout`, `/design`); a kept design that cannot be read opens the demo and says so in a toast | `opening.test.ts`: which design opens | Build a roof by hand, reload `/studio/roof`: the same roof and name, the energy comes again; the demo untouched reloads as the demo |
| 5 | On this device in the switcher | `ProjectSwitcher.tsx`: the designs kept, newest first, each a row with its name and facts, the open one with the tick; a row opens it | `switcher-view.test.ts` | Two designs kept, the switcher lists both, a press opens the other |
| 6 | The warning before leaving | `beforeunload` while a download is on its way (`downloads-store`'s states), nothing otherwise | `leaving.test.ts` (pure: whether to warn) | A route holding a download: `page.on("dialog")` sees the browser's question |
| 7 | Close of pull request 1 | The groups: `lib/device` is the base's (the shell saves); baselines of the switcher with designs; the state | | Pictures beside the board |
| 8 | `POST /project/open` | The API reads an `.rtd` with the engine's `Project.from_json` and answers `{project, notes}`: the notes the engine's words for a format 1 file whose files are not included (the bundled sample is used; the weather is loaded again); a format it does not read refused in the engine's words; not JSON refused | pytest: a format 2 file comes back equal; a format 1 file with paths gets the notes; format 3 refused; a text that is no JSON refused; the OpenAPI document | |
| 9 | Open a project, the dialog | `components/home/OpenProject.tsx` (`Dialog` with `FileDrop`, read by `/project/open` at once, its facts and notes shown, Open opens the document in the Studio); from the switcher's row (live now) and from Home's card | `open-project.test.ts`: the view from the answer, the refusals | An `.rtd` saved by Handover opened again: the same name and numbers; a text file refused in the API's words; a format 1 fixture with its notes |
| 10 | Close of pull request 2 | Baselines; the state | | |
| 11 | Home on three sizes | `components/home/Home.tsx` as the board: the headline, the search (the Find's `Search`, "Find my roof" opens `/find` at the result), Import a drawing (the existing dialog), Open a project (step 9), the demo's card from `/demo`'s facts, "On this device" | `home-view.test.ts` | The pictures; "Find my roof" with an address opens the map at it; Open the demo opens the Studio in one press |
| 12 | The cards | `DesignCard.tsx`: the thumbnail (the plan of the kept layout, drawn as the no-WebGL plan draws it, decision 6), the name, the facts; a press opens; a menu with Rename (in place, `TextField`), Duplicate ("Copy of …"), Save a copy (the `.rtd` through the downloads store), Delete (a dialog asks) | `cards.test.ts`: the order, the words, the copy's name | Create, rename, reopen, delete a project (the acceptance) |
| 13 | The thumbnail | `lib/device/thumbnail.ts`: the plan's SVG of the kept layout's positions at 320 by 180, kept with the design when a layout has come | `thumbnail.test.ts` | The card shows the roof |
| 14 | The `home` group | `tools/check/e2e-groups.ts`: a `home` group (`home*.e2e.ts`; own `components/home`, `lib/home`), the shell group sees it too; the proofs | `bun test tools` | |
| 15 | Close of pull request 3 | Baselines on three sizes; the state | | Pictures beside the boards |
| 16 | The tour's script | `lib/present/tour.ts`, pure: the scenes in order with their durations and what each sets (the camera preset and whether it moves, the reveal of the building, the obstacles and the modules as shares, the sun's hour, the colouring, the energy's share); `atTime(script, t)` the state at a moment; reduced motion a script of cuts | `tour.test.ts`: the states at moments, the loop, reduced motion | |
| 17 | The reveal in the scene | The view store gains `presentation: Reveal | null`; `Building`, `Obstacles`, `Modules` take a share (the height scaled, the first share of placements drawn); `CameraRig` moves between presets over a duration when the view asks (`setCamera(preset, { over })`), damped, never below the roof | `reveal.test.ts` (which placements at a share) | The Studio untouched: the share is 1 there |
| 18 | Present's page | `/present`: no top bar, no tab bar; the stage full screen with the words of the moment; the tour driven by `createTour({view, clock})` on the app's clock, looping; any key, pointer or touch returns to the Studio's last lens; the hint fades after the first loop; `Present` in the top bar live, "Present" leads to `/present` | | On desktop and tablet (the phone has no Present): the tour runs, the stages are seen in order by their words, a key returns to the Studio |
| 19 | The energy and the chain | `PresentFigures.tsx`: the energy counting to the chosen option's MWh over its scene, the chain's bars cascading, from the kept results | `counting.test.ts` (the value at a share) | The words equal the run's |
| 20 | Offline and the kept results | Present asks the API for nothing: a route aborting every `/api/*` during the tour changes nothing | | The route; the tour completes a loop |
| 21 | The frame budget | A browser test samples frame times with `requestAnimationFrame` over two loops and asserts none over 50 ms; the 30-minute soak run once by the session on this machine (`tools/present-soak.ts`, a Playwright script that reads frame times and `performance.memory` every minute) and its numbers written in "As built" | | Two loops under 50 ms |
| 22 | Close of pull request 4 and the phase | The `present` group (`components/present`, `lib/present`, the studio's folders); baselines; "As built"; the status; the state; the resume prompt for Phase 11 | | |

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | The designs are kept in IndexedDB through the browser's own API, no library (D4: a dependency is a decision); one database `rooftop`, one store `designs` keyed by an id made with `crypto.randomUUID()`; a record holds the document whole, the name, the facts of the card, the thumbnail and the times. The results are never kept (the phase file): a design opened runs again | D5; the document is 700 KB and the device has room; the adapter is thin and the logic apart |
| 2 | The design that is open is remembered by its id in `localStorage` under one key; a workspace opened without a design opens it from the device, else the demo. `/find` never opens one (D44 stands for `/find`). The id is not in the address | One design open at a time, as the desktop; addresses stay the workspaces' |
| 3 | A design is saved after every committed edit, 600 ms after the last (a design number), and says Saving then Saved; a failure says Not saved and opens the notes with the words. The demo is not kept until it is edited (D32); then it is a design named "Pune demo roof" like any other. Undo and redo are commits and are saved too | The phase file; D32 |
| 4 | Open a project reads the file through the API (`POST /project/open`), with the engine's `Project.from_json`: format 1 and 2, the notes for files not included in the engine's words, a refusal in words. The web parses no `.rtd` itself | One reader of the format (D7); the engine says what a format 1 file lacks |
| 5 | Home is built to the approved desktop board as drawn, with Open a project and the cards added where the board left "Designs you save appear here."; tablet and phone laid out by the new boards. The demo's card reads its facts from `/demo` (the name, the roof's words from its outline and type, the capacity and the energy from `demo-numbers.md` are not typed: the card shows the kept facts once the demo has run here, and until then the name and the roof alone) | The board; every number the engine's |
| 6 | The thumbnail of a card is the plan of the kept layout's positions as an SVG, drawn as the plan without WebGL draws it, 320 by 180, kept with the design when a layout has come; not a picture of the 3D canvas | Deterministic, instant, no read-back of the canvas (which renders on demand without a kept buffer), the same for a design saved from Performance or Handover where no scene is mounted; the phase file's "thumbnail of the 3D" is met by the plan of the same positions |
| 7 | Delete asks in a dialog ("Delete Pune demo roof? It is kept on this device alone."), Duplicate makes "Copy of <name>" opened at once, Rename is the `TextField` in place, Save a copy is the `.rtd` of Phase 9 | The phase file; D32: nothing lost without a word |
| 8 | Present is a page of its own, `/present`, without the shell's chrome, reached by the top bar's Present (desktop and tablet; the phone has no Present, as the top bar has none) and left by any key, pointer press or touch to the Studio's last lens. It reuses the Studio's stage (`Scene`, `CameraRig`, the stage store) and Performance's figures, driven by the stores on the app's clock; nothing is asked of the API | The phase file; one scene for the Studio and Present |
| 9 | The tour: 1 the satellite from above (plan) tilting into 3D (the camera moves over 4 s); 2 the building rising (2 s) then the obstacles (2 s); 3 the modules filling row by row (6 s); 4 the day played from sunrise to sunset with its shadows (12 s); 5 the strings lit by MPPT (4 s); 6 the energy counting to the year's MWh with the chain cascading (6 s), held 4 s; then again. Under reduced motion each scene is a cut held for its time. The words at the bottom left name the design and the scene | The phase file; the design's guidelines on motion |
| 10 | The camera moves between presets only when Present asks (`setCamera(preset, { over })`), damped in the rig; the Studio's presets stay instant | r3f-notes fix 13: the rig frames on request |
| 11 | The frame budget is held by a browser test of two loops (no frame over 50 ms) and by one 30-minute run on this machine with frame times and memory read every minute, its numbers in "As built" | The acceptance; a 30-minute test is not for the check |
| 12 | The browser groups gain `home` (own: `components/home`, `lib/home`) and `present` (own: `components/present`, `lib/present`, and the Studio's folders); `lib/device` is the base's, since the shell saves | `docs/checks.md`: a folder is placed |

## Risks

| Risk | What I do |
|---|---|
| IndexedDB in Safari and private windows refuses or forgets | The adapter's errors are words in the notes ("Not saved"); the app works without the device as today |
| A kept design of an older document shape | The API's `Project` validates on run; a refusal opens the demo with a toast |
| The camera's move or the reveal allocates per frame and hitches | The reveal changes instance counts, not geometry; the camera is damped in the rig's frame loop; the soak run measures |
| The tour's 30 minutes | The soak script, once, on this machine |
| Present on the phone | Not offered: the phone's top bar has no Present (the board) |
| Four pull requests in one session of context | The state after each; `plan/resume/013` carries the rest |

## Done means

The acceptance of `plan/phase-10-home-projects-present.md`: from a cold start to the demo in the Studio in one press (Home's card); a reload
keeps the design, the results recompute, nothing is lost (step 4's test); Present runs 30 minutes without a frame over 50 ms or a memory
climb (the soak run, its numbers in "As built"; the two-loop test in the check); Playwright: create, rename, reopen and delete a project, Home
on three sizes (steps 12 and 15). And: the `.rtd` opens again, format 1 with its notes; "As built" written; the resume prompt for Phase 11.
