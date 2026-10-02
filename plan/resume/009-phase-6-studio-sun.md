# 009: Phase 6, the Studio's Sun lens

Written: 2026-10-02, by session 9, at the owner's request. Status: used by session 10 (2026-10-02). After 008 (Phase 5).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 6: the Studio's Sun
lens: the sun crossing the roof with real shadows, the time and the day, the sun path, the shade figures and
the shade heat map. The plan of the phase comes first, then the boards the phase lacks, then the build in
pull requests, several in one session.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md (where the work stands, the open
items, the facts of the machine), plan/SESSIONS.md (every pull request carries its screenshots beside the
approved board, at three sizes), plan/README.md (every decision), plan/phase-06-studio-sun.md (the goal, the
scope, the acceptance: the stair room's shadow at 16:00 on 21 Dec within 0.2 m of the engine's polygon;
scrubbing never rebuilds the modules), plan/phase-05-plan.md (how a phase is planned here, and its 21
decisions: the scene draws only what the API answers, the sun comes from /sun at the view's time, DOM over
the canvas placed by projection, the camera's presets by request counts), plan/phase-05-studio-roof-array.md
("As built", "Deviations", "Found on the way": the tests of the scene and what made them steady),
plan/reference/functional-inventory.md (2.4 Shading: the read-outs and the figures; 1.1 the design day),
plan/reference/demo-numbers.md (the shading of the demo), plan/reference/r3f-notes.md,
plan/sessions/009/record.md ("Why things are the way they are").
Then docs/design: README.md, guidelines.md ("3D scene"), components.md ("Callout on the stage", "Obstacles on
the roof (Studio, Roof lens)", the view controls, Slider and RangeSlider), design-tokens.md (the 3D palette,
"Numbers in code"); the preview studio-sun-lens-desktop and its source mockups/SunLens.dc.html (generated from
the Array board by build_lenses.py: it is a sketch of the lens, not its design; the time control of the
stage, the sun path, the heat map and its legend, the day picker and the phone and tablet sizes have no
board), and build_phase5_roof_boards.py, build_phase5_array_boards.py as the examples for the boards you
draw.
Read the code before you add to it:
  - apps/web/components/scene: SunLight.tsx and lib/scene/sun-light.ts (the directional light from /sun at the
    view's time, the fade below the horizon, the shadow bias and the intensities by sun height, the fitted
    shadow camera; PCF 2048), CameraRig.tsx and lib/scene/camera.ts (the Sun's eye preset, sunDirectionOf),
    Modules.tsx and lib/scene/modules.ts (the modules instanced, frame and glass: the heat map colours them
    per instance; the geometry must not be rebuilt by the time), KeepOut.tsx and lib/scene/keepout.ts (the
    kept-clear areas and the hour that shades them), Projector.tsx and lib/scene/projection.ts (DOM placed
    over the canvas), SceneCanvas.tsx (frameloop on demand: a scrub must invalidate);
  - apps/web/components/studio: Stage.tsx and stage-view.ts (the title, the read-outs line by lens, the text
    equivalent: on-the-roof-sun), ViewControls.tsx, Labels.tsx, Callout.tsx, ArrayInspector.tsx and
    inspector-look.tsx (how an inspector is laid out; the Sun lens's inspector is the third); Studio.tsx
    (the lens chooses the inspector; Sun says NotBuiltYet today);
  - apps/web/lib/stores/view-store.ts (sunTime: { day, hour }, setSunTime), results-store.ts (the sun kept by
    its key), lib/flow/design-flow.ts (askForTheSun: when /sun is asked), lib/api (computeSun, runDesign; the
    types of Sun, Shadows, the design's shade figures);
  - apps/api/src/rooftop_api/schemas/sun.py and services/sun.py (/sun: positions of one day in solar time,
    sunrise and sunset, the shadows' polygons at an hour when asked), schemas/design.py (near, electrical,
    far and keep-out shading; shade_pct per string), rooftop_core/sunpath.py, shading.py, shade_summary.py
    (what the engine computes; per-module and per-string shading if it is there, else what would give it);
  - e2e/stage.ts (sceneSettled, pixelAt, cameraSettled, zoomedInAt, the touch helpers), e2e/tests/stage.e2e.ts,
    modules.e2e.ts, screens.e2e.ts (how the Studio's pictures are made steady: wait for what moves).
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests, the
running stacks and a green `bun check`.

Then write the plan of the phase as plan/phase-06-plan.md, the way phase-05-plan.md was written: what you
found in the code and the API (in particular whether per-module shading loss and the shadow polygons are
already answered, and what /design would need to answer them); the pull requests (expect three to five: the
time and the day with the light following them and the read-out; the sun path and the shadow overlay; the
shade figures and the heat map; the states and the sizes; the boards first); the steps, each with what is
tested without a browser and what in the browser; the decisions you take unless overruled, each with its
why; the risks (the shadow of PCF against the engine's polygon; the frame rate while scrubbing with 1,068
modules; a change of the API's models means bun gen:api); what done means, against the acceptance. The
boards the phase lacks are drawn and approved before they are built: the Sun lens on desktop as a design
(not the generated sketch), tablet and phone; the time control on the stage with play; the sun path and the
marker; the heat map with its legend and a selected module; the shadow overlay. Commit the plan to main,
show the owner, wait for the yes; draw the boards, show them (from the previews in the repo; publish to the
canvas only if the session has the Artifact tool), wait for the yes; then build.

Things to know at handover:
  - The scene already takes the sun from /sun at the view's sunTime and the flow asks for it when the design
    opens or the place or the time changes; the light fades below the horizon and the Sun's eye preset
    looks along it. Phase 6 adds the control of the time, not the light.
  - The modules are instanced (frame and glass); a colour per instance is the way to a heat map without new
    geometry. The acceptance says scrubbing never rebuilds the modules: count renders in development.
  - The canvas draws on demand (frameloop="demand"); anything that moves must invalidate. The tests wait for
    what the text equivalent says is drawn and for the camera to stand still; a picture of the canvas is
    read by a screenshot decoded in the page (Phase 5, decision 7 amended).
  - Open items of Phase 5 that touch the stage's top: the callout and the turn handle can overlap on a
    pinched phone; the time control will stand there too. The wheel over a DOM handle does not zoom.
  - The frame rate with 1,068 modules is 56 fps on this machine's GPU; the browser tests run software WebGL
    on three sizes at once, 814 s for 1,345 tests inside bun check (about 15 minutes whole).
  - The design canvas at claude.ai is behind the repo by one board (ImportHeights with the DXF's place); on
    Bedrock the session has no Artifact tool. If you have it, publish the repo's boards first (STATE.md,
    "Facts", says how); if not, say so upfront and work from the previews.
  - Tokens only (rule 9); the 3D palette and the numbers in code are in design-tokens.md; a sequential single
    hue for the heat map is a new set of tokens, documented there first.
  - Never edit apps/web or apps/api while bun check runs; never git stash while the test stack runs.
    Documents go to main from a worktree of their own when a branch is open (git worktree add --detach
    under $TMPDIR). Agents build in worktrees under $TMPDIR too; a worktree has no .env.local, so its ground is
    plain: baselines are made in the main working tree.
  - Sub-agents: give each a written brief (files to read, constraints, tests first, what to report), run
    independent work in parallel, review and run what comes back before merging. Launch them on the model
    the owner names.
  - The word "bankable" is never used. System voltage is never chosen for the user.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the
mockup, never read or commit apps/web/.env.local, use the test stack only (bun dev:bg --profile test), bun and
uv only, versions pinned exactly (D4). You may commit, push and merge once the check is green; a change to
documents only goes to main directly (D26). Every pull request shows each screen it changed at three sizes
beside its approved board. Be brief, decide small things yourself, ask me only for major decisions, one at a
time, and show me each finished part. Update plan/STATE.md before you stop; write plan/sessions/010 (or the
next number). Past two thirds of your context, finish the step in hand, update the state and hand over.

Start by telling me what you found at the start of the session, then the plan.
```

## Notes for the owner

- Expect three waits for your yes: the plan with its decisions, the boards, then each merged pull request.
- The Sun lens board in the repo is a sketch generated from the Array board; the session designs the lens
  properly and asks for approval before building. If the session runs on claude.ai it can publish to the
  canvas; on Bedrock it shows the previews from the repo.
- A likely question for you: whether per-module shading loss should be added to `/design`'s answer (the
  engine computes shading per position already) or computed in the browser from the shadow polygons. The
  session recommends; you decide.
- Nothing outside this repo is needed for Phase 6.
