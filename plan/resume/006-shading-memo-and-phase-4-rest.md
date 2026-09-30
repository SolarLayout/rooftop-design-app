# 006: the shading memo, then the rest of Phase 4

Written: 2026-09-30, by session 6, at the owner's request. Status: used by session 7, 2026-09-30.

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session has two slices, in this order:
first the memo for the shading, as a pull request of its own; then the rest of Phase 4, find the roof on
the map and outline it: the obstacles on the map with their heights and "Enter dimensions by hand", the
third pull request of the phase, and the close of the phase.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md (where the work stands, what is
next, the open items), plan/SESSIONS.md, plan/README.md (every decision; D40 to D49 are of Phase 4),
plan/phase-04-plan.md (the plan of the phase: steps 13 to 15 and "Done means" are yours; the decisions of
the plan were approved by the owner as "go according to your plan"), plan/phase-04-find-and-outline.md
("As built": what exists, the acceptance met, "Found on the way", which holds the traps of the map),
plan/sessions/006/record.md ("Why things are the way they are", "What was tried and dropped"),
plan/reference/functional-inventory.md (1.1 and 1.2: the roof entry by rectangle and by corner table, the
obstacles and their fields and defaults).
Then docs/design: README.md, guidelines.md, components.md ("Map outline tools", with its "In code" notes,
"Decision card", "Callout on the stage", "Number field", "Dialog"), design-tokens.md ("Numbers in code").
Open the previews in docs/design/previews: find-outline-desktop, find-outline-phone, find-outline-tablet,
find-outline-states (the board of the states and the tools of Find), studio-roof-lens-desktop (the
obstacles of the Roof lens as the mockup draws them, and the obstacle list); the sources are in
docs/design/mockups (Locate, LocatePhone, LocateTablet, LocateStates, RoofLens; build_phase4_boards.py
writes the two boards of session 6 and is the example for the two boards you draw).
Read the code before you add to it:
  - apps/web/lib/outline (outline-state.ts is the reducer of everything drawn; frame.ts the flat frame;
    measure.ts; build-request.ts, what Build sends), apps/web/lib/map (overture.ts, esri.ts, provider.ts);
  - apps/web/components/find (Find.tsx, the screen; OutlineLayer.tsx, what draws on the map and reports
    presses; OutlinePanel.tsx; OutlineTools.tsx; DetectedCallout.tsx; RoofTypeChoice.tsx; NoMap.tsx, which
    holds "Enter dimensions by hand instead" shown and not yet usable);
  - apps/web/components/studio/RoofInspector.tsx and apps/web/lib/roof-card.ts;
  - apps/api/src/rooftop_api/schemas/roof_map.py and services/roof_map.py (MapShape: a box by its four
    corners, a cylinder or a tree by centre and diameter, a wall by its points, a building by its corners;
    the heights required), apps/api/tests/api/test_roof_map.py;
  - apps/api/src/rooftop_core/memo.py and apps/api/src/rooftop_api/services/design.py (MEMO, the memo of
    the process) for the first slice; apps/api/tests/conftest.py and tests/api/conftest.py for how the
    tests make their runs;
  - e2e/find.ts (the fixtures of the imagery, the geocoder, the footprints served by ranges),
    e2e/tests/outline.e2e.ts and build.e2e.ts (how a roof is drawn by presses at metres from the centre,
    and how the request to the API is checked), e2e/global-setup.ts (the demo run once before the tests).
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests,
the running stacks and a green `bun check`.

Slice 1, the memo for the shading. The check of pull request #36 took 6 min 37 s; the mark in
plan/STATE.md is 6 min 30 s, and its rule is that the memo comes next, as a pull request of its own.
pytest takes 152 s of a check; most of it is design runs of 1.5 s each, whose shading could be shared
through the memo the API already has (rooftop_core/memo.py; services/design.py holds one for the process).
Measure first: how long pytest takes, how much of it the design runs are, and what a shared memo across
the tests would save. Then do the least that makes the check clearly shorter: a memo that the tests of the
API share for a session where the inputs are the same, or whatever the measurement says. The engine's
results must not change: the tests of the numbers are the proof. Write down what you measured in
plan/STATE.md, "Open items". Merge, then the second slice.

Slice 2, Phase 4, pull request 3 (plan/phase-04-plan.md, steps 13 to 15 and C):
  13. The two boards, drawn and approved before you build: "Obstacles on the map and their heights"
      (desktop and phone: the four shapes drawn with the tools of the toolbar, the height asked right after
      in a dialog or a card, the list in the panel) and "Enter dimensions by hand" (desktop and phone: the
      rectangle by length, width and the direction the long side faces, and the corner table of the desktop
      app, at a place typed or found). Draw them with a builder as build_phase4_boards.py, render the
      previews the way plan/sessions/005/record.md describes, add them to docs/design/README.md and to
      mockups/canvas.json, commit the documents to main, show me, and wait for my yes.
  14. Obstacles on the map: box, circle, wall line, building polygon, drawn with the map's tools, each
      asking its height right after; nothing is preselected, the field is empty until typed (the desktop
      app's defaults of 1.5, 2, 6 and 8 m are for the desktop app). They go into the request of Build
      (MapShape). Tests: the reducer without a browser; in the browser an obstacle of each kind and its
      height in the request. Then the Roof lens's card counts them.
  15. "Enter dimensions by hand instead": the rectangle (length, width, long side faces) and the corner
      table of the desktop app, at a place typed or found; the same Build. It is the way on when there is
      no key, no WebGL or no network (NoMap.tsx). Tests: the table to an outline without a browser; in the
      browser a roof by hand to the Studio.
  C.  Close the phase: acceptance met and written up under "As built" in plan/phase-04-find-and-outline.md
      (add to what is there); status in plan/README.md; plan/STATE.md; the record in plan/sessions/007;
      this file set to "used" in plan/resume/README.md. Then tell me the state in a few lines.

Traps known at handover, beside those in plan/phase-04-find-and-outline.md, "Found on the way", and
plan/sessions/006/record.md, which all still hold:
  - The map says aria-busy while it moves; a press stops its flight. A test waits for aria-busy false
    after the scale bar says "20 m" before it presses (e2e/tests/outline.e2e.ts, atTheRoof).
  - MapLibre counts its zoom on tiles of 512: ROOF_ZOOM is 18, one CSS pixel is 0.283 m at Pune. A test
    presses at metres from the centre of the map with that.
  - A footprint's tile of the fixture is drawn a moment after the tool is taken: a test presses again
    until the callout says "Footprint found" (outline.e2e.ts, proposed).
  - The inspector of the Studio stands three times, once for each size: a test filters for what is
    visible (build.e2e.ts). The tools of the map have one name on every size; on phone the word shown is
    shorter, and Redo and Clear are hidden.
  - Full runs of the browser tests took 310 to 367 s on the owner's loaded machine and one kit test failed
    at a time, a different one each run; each passed alone. Run a failed test alone before you touch it;
    say in the commit what failed and what passed alone.
  - A colour token named like a width utility (--color-handle beside border-handle) makes Tailwind read the
    width as a colour. Name a colour so that no width utility shares its name.
  - tools/footprints.ts takes the tiles of a box out of Overture's release with the network; the tests
    never do. The fixture is one tile of zoom 14; a box across a tile edge gives two.
  - The dialog that asks a height is Dialog of components/ui (the browser's dialog, modal, a sheet on
    phone); a height is a NumberField (docs/design/components.md, "Number field": what is typed is a draft,
    Enter commits).
  - git mv stages: look at git status before a commit of documents. A change to documents only goes to
    main from a worktree of its own. Never git stash while the test stack runs.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the
mockup, never read or commit apps/web/.env.local, use the test stack only (`bun dev:bg --profile test`),
bun and uv only, versions pinned exactly. You may commit, push and merge once the check is green. A change
to documents only goes to main directly, without a pull request (decision D26). Every pull request carries
its screenshots: the baselines of the screens it changed, as #35 and #36 did. Be brief, decide small things
yourself, ask me only for major decisions, one at a time, and show me each finished part. Past two thirds
of your context, finish the step in hand, update the state and hand over.

Start by telling me what you found at the start of the session, then measure for the memo.
```

## Notes for the owner

- The first slice is small: a measurement and a pull request that makes the check shorter. Expect it within
  the first hour, with the numbers.
- The second slice draws two boards before it builds. Expect a message with two previews and a question;
  the session waits for your yes.
- Nothing to add with `/add-dir`. The Esri key is in `apps/web/.env.local` already; the footprints of the
  tests are in the repo.
- The machine's load: full runs of the browser tests were slow and flaky under Chrome, Cursor and the desktop
  app in session 6. A quiet machine during `bun check` helps; the session will say what it found either way.
- Decisions D40 to D49 of session 6 stand unless you overrule them in `plan/README.md` before the session
  begins; D44 says a reload of the Studio loses a roof built on the map until Phase 10 keeps designs on the
  device.
