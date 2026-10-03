# 013: Phase 10, Home, projects on the device, Present mode

Written: 2026-10-03, by session 13, at the owner's instruction (pre-approved, unattended). Status: open. After 012 (Phase 9).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session takes Phase 10: Home (the first screen: Find my roof, Import a
drawing, Open a project, Open the demo, the designs on this device), the projects on the device (kept in IndexedDB on every committed edit,
"Saved on this device" in the top bar, a reload that keeps the design, results recomputed on open, a warning before leaving with an export on
its way), and Present mode (the chrome hidden, a scripted tour of the design that loops until a key or a touch, reduced motion as cuts, from
the kept results). The plan of the phase comes first, then the boards the phase lacks, then the build in pull requests.

The owner pre-approved the whole phase on 2026-10-03 (plan/sessions/013/owner-messages.md, message 18): the plan, the boards and the pull
requests are built and merged without a stop for approval; every pull request still carries its screenshots beside the boards, each looked
at by eye before it is opened (message 19). After Phase 10, write the resume prompt for Phase 11 and wait for the owner's go-ahead.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, docs/checks.md (the fast check is the gate, D55: the browser groups the change
can reach run; the whole suite never runs by itself; a new suite and a new folder are placed by name; no import across groups),
plan/STATE.md (where the work stands, the open items, the facts of the machine), plan/SESSIONS.md, plan/README.md (every decision; D5 no
database, the project in the browser and as an .rtd; D7 the .rtd format 2, format 1 still opens; D44 a reload loses a design until Phase
10; D49 the name of a new design; D54 and D55 the check), plan/phase-10-home-projects-present.md (the goal, the three scopes, the
acceptance: one click from a cold start to the demo in the Studio; a reload keeps the design and recomputes; Present runs 30 minutes
without a frame hitch over 50 ms or a memory climb; Playwright: create, rename, reopen, delete a project; Home on three viewports),
plan/phase-09-plan.md (how a phase is planned here: what was found, the boards, the pull requests, the steps with their tests, the
decisions with their why, the risks, done means), plan/phase-09-handover.md ("As built", "Deviations", "Found on the way"),
plan/reference/functional-inventory.md (1.1 how a roof is entered; 3 Exports: the .rtd; 5 the gaps: paths in format 1), and
plan/sessions/013/record.md ("Why things are the way they are").
Then docs/design: README.md ("Order of authority"; Home has a desktop board, Home.dc.html, approved in round 1: the headline, the search
as the primary action, Import a drawing, Open a project, the demo card, "On this device"), information-architecture.md ("Home", "Flow for a
new design"), guidelines.md ("States", "3D scene"), components.md ("Project switcher, open": "On this device", "Designs you save appear
here."; "State of saving": Saved, Saving, Not kept, Could not be saved; "File drop"; "Dialog"; "Toast"; "Cards"), design-tokens.md; the
boards "Shell states" (the state of saving) and the mockup builders of Phases 8 and 9 (build_phase9_handover_boards.py,
build_phase9_part_boards.py, handover_data.json) as the examples of boards drawn from the engine's numbers; the previews are rendered by
a scratch Playwright script outside the repo (docs/design/README.md, "About the mockups").
Read the code before you add to it:
  - apps/web/lib/stores/project-store.ts (open, commit, amend, undo, redo; KEPT_EDITS; openedAt) and results-store.ts (what a run gives:
    the design kept in memory, never on the device); lib/flow/design-flow.ts (openDemo: the demo from /demo, opened in the store; what
    follows a committed edit; the weather loaded into the document); components/shell/Shell.tsx (a workspace without a design opens the
    demo; `saving="not-kept"` hard-coded) and stores.tsx (the stores made once); SaveState.tsx (the four states); ProjectSwitcher.tsx
    ("Open a project" shown and not usable; "On this device" says designs will appear; Save a copy and Rename live); TopBar.tsx (Present
    shown and not usable, "Comes with Home and projects"); app/page.tsx (the placeholder Home); components/shell/ImportDrawing.tsx and
    lib/studio/import-drawing.ts (a file read as base64 and sent to /roof/import: the pattern for Open a project); lib/handover/downloads-store.ts
    (a download on its way: the warning before leaving); lib/handover/save-file.ts.
  - The scene, for Present: components/scene/SceneCanvas.tsx (the canvas, frameloop, the context lost), CameraRig.tsx and lib/scene/camera.ts
    (the presets 3d, plan, fit, sun-eye; presetPositionOf), Building.tsx, Obstacles.tsx, Modules.tsx (instanced), SunLight.tsx, SunPath.tsx,
    use-strings.ts and lib/scene/string-colours.ts (the glass by string, MPPT or inverter), lib/studio/play.ts (the day played on the
    app's clock, reduced motion an hour a second), lib/stores/view-store.ts (the camera preset, the sun time, the colouring, the lens),
    components/studio/Stage.tsx; components/performance/Kpis.tsx and LossChain.tsx (the energy and the cascade Present counts up and
    plays); plan/reference/r3f-notes.md.
  - The API: apps/api/src/rooftop_core/project.py (Project.from_json: format 1 and 2, UnsupportedProjectFormat; a format 1 file names
    paths without text: "a file that must be chosen again"), rooftop_api/convert.py (project_from_engine), schemas/project.py,
    services/roof_files.py and routers/roof.py (/roof/import takes a file as base64: the shape for a /project/open that reads an .rtd with
    the engine's own reader and answers a Project or a refusal in words), errors.py (how an engine error becomes the API's).
  - e2e: tests/handover.e2e.ts (downloads captured; the name edited; the switcher), tests/screens.e2e.ts (the pictures, the clock fixed),
    fixtures.ts; a test's browser context is new each time, so IndexedDB begins empty.
Then follow "Start of a session" in plan/SESSIONS.md.

Then write the plan of the phase as plan/phase-10-plan.md, the way phase-09-plan.md was written: what you found (what is kept where today;
how a document is opened and run; the size of a document with its weather, about 700 KB; what a thumbnail of the scene costs; what Present
can drive in the scene and in Performance from the stores alone; what the API lacks: a reader of the .rtd); how the device's store works
(IndexedDB without a dependency, one record per design keyed by an id, the document and its name, capacity, energy and last edited for the
cards, the thumbnail; written on every committed edit, debounced; the id in the address or in the store; the demo never kept until it is
edited, D32); how Home lists, renames, duplicates, deletes and saves a copy; how a reload finds the design (the id kept in the browser's
storage, the document loaded, the run recomputed); how Open a project reads an .rtd (the API reads it; format 1's missing files said in the
engine's words); how Present is scripted (a sequence of scenes driven by the view store and the stores' results, timed on the app's clock,
the camera moved between presets, the building, the obstacles and the modules revealed in turn, the day played, the strings coloured, the
energy counted, the chain cascaded; reduced motion as cuts; any key or touch returns; the chrome hidden; the Studio's stage reused, not
drawn anew); the pull requests (expect four: the device's store with saving and reload; Home with the cards and Open a project; the
switcher's "On this device" and Open a project there, the warning before leaving; Present); the steps with their tests without a browser
and in the browser; the decisions you take, each with its why; the risks (IndexedDB in Safari, the thumbnail's cost, the 30 minutes of
Present, the frame budget); what done means against the acceptance. The boards the phase lacks are drawn before they are built: Home on
tablet and phone; Home with designs on this device (the cards with a thumbnail of the 3D, the name, the capacity, the energy, last edited;
Rename, Duplicate, Delete, Save a copy); Open a project (the dialog with its file drop and its states: reading, refused for its format, a
format 1 file with files to choose again); the switcher's "On this device" with designs; the states of saving in the top bar in use; Present
(the stage without chrome, the stages of the tour, the words that say how to return). Commit the plan to main; draw the boards and commit
them to main; then build, each pull request checked the way D55 says (the fast check and the groups the change reaches, by hand), each
picture looked at beside its board, merged on green. Record progress in plan/STATE.md after each pull request.

Things to know at handover:
  - The gate is `bun check` as the fast check plus `bun run e2e:<group>` for the groups the change reaches (docs/checks.md). Never run the
    whole browser suite on your own; never start a second run because the first lost one test to a wait. A test that fails under load and
    passes alone is a watch item. Home's suites belong to the shell group by name today (`routes`, `shell`, `screens`); a new suite `home*.e2e.ts`
    needs a group in tools/check/e2e-groups.ts (a `home` group with `components/home` and `lib/device` as its own, or the shell group); a new
    folder of the web app must be placed too (the test says when one is not).
  - The web app's rewrite in `next dev` drops a request now and then (plan/STATE.md): an export is asked up to three times; a test that
    reads an answer waits for the good one.
  - Agents write code and unit tests in worktrees under $TMPDIR from a written brief (a document change in a commit of its own; no import
    across the browser groups; `bun test tools` before each commit); you run the browser for them, make the baselines in the main working
    tree and look at every picture beside its board before the pull request. Branches built on an open pull request are rebased as it
    moves; `git worktree remove` before checking a branch out here.
  - Present must run from the kept results with the API offline once a design is loaded; nothing of Present asks the API.
  - The demo is "Not kept on this device" until it is edited (D32); the state of saving is said in the top bar on desktop and in the
    switcher on tablet and phone.
  - System voltage is never chosen for the user. No red, no cross. "bankable" is never used. Tokens only. The engine's words are not
    reworded. Versions pinned (D4); a dependency is a decision: prefer the browser's own IndexedDB over a library.
  - On Bedrock the session has no Artifact tool: the boards are approved from the previews in the repo (here, by the plan's own decision,
    since the owner pre-approved the phase); the canvas at claude.ai is behind the repo.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the mockup, never read or commit
apps/web/.env.local, use the test stack only (bun dev:bg --profile test), bun and uv only, versions pinned exactly (D4). Commit, push and
merge on the fast check and the groups the change reaches; a change to documents only goes to main directly (D26). Be brief; decide; show
each finished part in the record. Update plan/STATE.md before you stop; write plan/sessions/014 (or the next number). Past two thirds of
your context, finish the step in hand, update the state and hand over. After Phase 10, write plan/resume/014-phase-11-hardening.md and stop.
```
