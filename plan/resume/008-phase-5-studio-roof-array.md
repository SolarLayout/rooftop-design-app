# 008: Phase 5, the Studio's 3D roof, the Roof and Array lenses

Written: 2026-09-30, by session 7, at the owner's request. Status: open. After 007 (Phase 4.5).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 5: the Studio's 3D
roof, and the Roof and Array lenses. The plan of the phase comes first, then the boards the phase lacks, then
the build in pull requests. The phase is larger than one session; this session takes the plan, the boards and
the first pull request, and hands over at a merged pull request.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md (where the work stands, the open
items, the facts of the machine), plan/SESSIONS.md, plan/README.md (every decision; D40 to D52 are of Phase
4 and bind the Studio too), plan/phase-05-studio-roof-array.md (the goal, the scope of the scene and the two
lenses, the acceptance with its numbers: 790 positions in 6 rows on the demo; 790, 940 and 1,068 for the three
roof types), plan/reference/r3f-notes.md (the fixes already paid for in the 3D reference project; read it
whole), plan/reference/functional-inventory.md (1.1 to 1.4: every input of the Roof and Array lenses, with
its unit, default, range and field; 2.2 the read-outs), plan/reference/demo-numbers.md, plan/phase-04-plan.md
(how a phase is planned here: what was found, the steps, the decisions, the risks, what done means),
plan/phase-04-find-and-outline.md ("As built", "Found on the way": the frame of metres, the map's zoom, the
obstacles as the API takes them), plan/sessions/007/record.md ("Why things are the way they are").
Then docs/design: README.md, guidelines.md ("3D scene", "States every screen must handle"), components.md
("Map outline tools", "Number field", "Stepper", "Cards", "Callout on the stage", "Lens rail"),
design-tokens.md (the 3D palette; "Numbers in code"); the previews studio-roof-lens-desktop (the Roof lens: the
card, the roof type, edges and access, the obstacle list with its selected obstacle), studio-desktop,
studio-tablet, studio-phone (the Array lens on three sizes: the stage, the vitals, the inspector), find-obstacles
(how obstacles look on the map), and the sources in docs/design/mockups (RoofLens, Main, StudioTablet,
StudioPhone; build_phase4_boards.py and build_phase4_obstacles_by_hand.py are the examples for the boards you
draw; plan/sessions/005/record.md says how a preview is rendered).
Read the code before you add to it:
  - apps/web/components/studio (Studio.tsx: the frame, the inspector standing three times, once for each
    size; RoofInspector.tsx: the card of the roof with Edit, the roof type as a committed edit);
  - apps/web/components/shell/stores.tsx and apps/web/lib/stores (the project store, commit, open; the
    results store), apps/web/lib/flow/design-flow.ts (what follows a committed edit: the layout at once, the
    design run after DESIGN_PAUSE), apps/web/lib/api (the client, the types: Roof, Obstacle, Layout);
  - apps/web/lib/outline (obstacles.ts: the obstacles as the map draws them; measure.ts; frame.ts) and
    apps/web/components/find (OutlineLayer.tsx draws obstacles on the map; HeightDialog.tsx asks a height;
    ObstacleList.tsx lists them; the Roof lens is where every field of an obstacle is edited);
  - apps/web/lib/map/provider.ts and esri.ts (the imagery tiles the ground of the scene drapes);
  - apps/api/src/rooftop_core/geometry.py (Roof, Obstacle and their fields), placement.py (Layout, the
    positions), keepout_parts.py (the keep-out zones and their reasons), apps/api/src/rooftop_api/services/layouts.py
    and schemas (what /layout answers: the modules, the keep-outs, the read-outs);
  - e2e/tests/build.e2e.ts, shell-vitals.e2e.ts, screens.e2e.ts (how the Studio is reached and tested; the
    baselines), e2e/global-setup.ts (the demo run once before the tests).
The 3D reference project is outside this repo: /Users/arunkpatra/codebase/solar-mms-modeller (GitHub
SolarLayout/solar-mms-modeller). Ask the owner to add it with /add-dir before you read it; never change it.
The desktop app at /Users/arunkpatra/codebase/rooftop-design is the same: read-only, on /add-dir.
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests, the
running stacks and a green `bun check`.

Then write the plan of the phase as plan/phase-05-plan.md, the way phase-04-plan.md was written: what you
found in the code, the API and the reference project; the pull requests (expect four to six: the scene with
the building and the ground; the modules for the three roof types and the keep-outs; the Roof lens inspector
with the obstacles; the Array lens inspector; selection and direct manipulation; the boards first); the steps,
each with what is tested without a browser and what in the browser; the decisions you take unless overruled,
each with its why; the risks; what done means, against the acceptance. The boards the phase lacks are drawn
and approved before they are built: the Roof lens on phone and tablet, the Array lens's states (a run
computing, an edit updating, the module card, the shade-free window), the obstacle being edited on the roof
(handles, the callout), the roof types east-west and sloped in 3D, the import with missing heights. Commit the
plan to main, show the owner, wait for the yes; draw the boards, show them, wait for the yes; then build.

Things to know at handover:
  - reactStrictMode stays false (plan/reference/r3f-notes.md, fix 1). The canvas is loaded with next/dynamic
    and ssr: false, as the map is (components/find/Find.tsx). The map's MapLibre and the scene's three.js are
    two WebGL contexts on the Find and Studio screens; the browser tests run software WebGL
    (e2e/playwright.config.ts) and a scene must be tested there, on phone at pixel ratio 3 too.
  - Coordinates: the engine and the stores are x east, y north, z up, in metres; three.js is y up. One adapter,
    nothing else converts (the phase file). The roof's outline from the API is about its centroid; the map's
    frame of metres (lib/outline/frame.ts) is only for drawing on the map.
  - The inspector stands three times in Studio.tsx, once for each size; Phase 5 decides how the real one is
    mounted (plan/STATE.md, "Open items"), and the tests filter for what is visible.
  - Obstacles come to the Studio through the API's Roof.obstacles with their heights; on the map they were
    drawn light over dark, the selected one accent (D50). The Roof lens edits every field (inventory 1.2),
    adds trees, and reports the heights a DXF could not give (every DXF obstacle gets 1.0 m: STATE.md).
  - The Roof lens's card wraps to a second line when it counts obstacles; the layout of the inspector is
    yours to settle (STATE.md, "Open items").
  - A committed edit runs the layout at once and the design after DESIGN_PAUSE (design-flow.ts); the demo's
    design run takes 12 s, 4 s after a change of a loss or of the voltage. The browser tests of the shell wait
    for the vitals; the global setup runs the demo once so the server has it kept.
  - The engine's numbers are in plan/reference/demo-numbers.md and tests/engine/test_demo_numbers.py; the
    acceptance's 790, 940 and 1,068 come from /layout for the three roof types.
  - Tokens only (rule 9); the 3D palette is in design-tokens.md; a colour a library needs is read from the
    tokens of a container, as the map does (D40's way). A colour token named like a width utility makes
    Tailwind read the width as a colour (STATE.md).
  - Never edit apps/web or apps/api while bun check runs: the test stack reloads them live. Never git stash
    while the test stack runs. Documents go to main from a worktree of their own when a branch is open.
  - The design canvas: a board is published from a folder shaped project/<name> with the index; the publish
    is refused while the canvas is shared by link, and the owner makes it private for it (STATE.md, "Facts").
  - Every pull request carries its screenshots: the baselines of the screens it changed, as #36 and #38 did.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the
mockup, never read or commit apps/web/.env.local, use the test stack only (bun dev:bg --profile test), bun and
uv only, versions pinned exactly (D4: three 0.185, @react-three/fiber 9.6, drei 10.7; React stays below 19.3).
You may commit, push and merge once the check is green; a change to documents only goes to main directly
(D26). Be brief, decide small things yourself, ask me only for major decisions, one at a time, and show me
each finished part. Update plan/STATE.md before you stop; write plan/sessions/009 (or the next number). Past
two thirds of your context, finish the step in hand, update the state and hand over.

Start by telling me what you found at the start of the session, then the plan.
```

## Notes for the owner

- The session needs two folders added with `/add-dir` before it can read them: the 3D reference project
  `/Users/arunkpatra/codebase/solar-mms-modeller` and the desktop app `/Users/arunkpatra/codebase/rooftop-design`.
  It will ask.
- Expect three waits for your yes: the plan with its decisions, the boards, then each merged pull request.
- The phase is the largest of the plan; this prompt takes the plan, the boards and the first pull request.
  The next prompt is written from what the session leaves in `plan/STATE.md`.
- Phase 4.5 (prompt 007) comes first: the caches it builds change how `bun check` runs, and this session
  reads the documents 007 leaves behind.
