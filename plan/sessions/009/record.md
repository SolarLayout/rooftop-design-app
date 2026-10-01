# Session 9: record

2026-09-30 to 2026-10-02, with a day's pause on a billing limit. Started with the resume prompt
`plan/resume/008-phase-5-studio-roof-array.md`: Phase 5, the Studio's 3D roof and the Roof and Array lenses. The plan
was written first (`plan/phase-05-plan.md`), then six boards, then five pull requests and one more for a DXF's place.
What is built is in `plan/phase-05-studio-roof-array.md`, "As built"; the state is in `plan/STATE.md`. Neither is
repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: the documents, git, the stacks; `bun check` on `main` green | |
| 2 | The plan: what was found in the reference projects, five pull requests, twenty steps, twenty-one decisions, risks | `plan/phase-05-plan.md`, `df911c5` |
| 3 | Six boards by two agents (the Roof family, the Array family), published to the canvas (version 14) and committed; all approved | `docs/design/mockups`, `931d505` |
| 4 | Pull request 1: the scene, the building, the obstacles, the ground of imagery, the camera, the view controls, the labels | #42 |
| 5 | Pull request 2: the modules, the kept-clear areas with their counts, the sun from `/sun`, the plan without WebGL | #43 |
| 6 | Pull request 3: the Roof lens inspector, the obstacles, Import a drawing with the heights to review | #44 |
| 7 | Pull request 4: the Array lens inspector, the states of the stage | #45 |
| 8 | The DXF's place: the question, the recommendation, the board changed and approved, built | `99532e9`, #46 |
| 9 | Pull request 5: selection by raycast, undo and redo, the drag and the handles; the browser tests made to stand under the load of the whole suite | #47 |
| 10 | The frame rate by hand (56.3 fps, 1,068 modules, this machine's GPU); the close: "As built", the status, the state, this record; resume 008 used | `main` |

## How the owner steered the session

| He was asked or said | What was done |
|---|---|
| "plan approved. make liberal use of sub-agents ... we will try to complete multiple PRs in this session" | Seven agents in all: two for the boards, five for code (ground, obstacles, view controls, the Roof lens, the Array lens, the manipulation), each with a written brief; every result reviewed and run before merging |
| "I need to see the boards in the design artifact" | Published to the canvas on 2026-09-30, approved there ("all boards approved") |
| "also we were going to do the 3D renderings right?" and the question of R3F | Yes: the scene is React Three Fiber, as `reference/r3f-notes.md` and the plan say |
| After the pause: "reasses the current state and progress before continuing"; Bedrock, "tell me upfront if you have issues accessing the artifact canvas" | The state was re-read from the repo; the Artifact tool is not available on Bedrock, said upfront; the boards were approved from the previews in the repo since |
| "PRs always need to carry screenshots proving that they match approved designs" | Tables of the board beside the built picture at three sizes, added to #42 and #43 after the fact, carried by #44 to #47; the rule written into `plan/SESSIONS.md` |
| The DXF's missing place: "suggest your reco with reason ... What does the code in the original `rooftop-design` repo do?" | The desktop app used Pune silently; recommended asking the place in the import dialog; "i agree with your reco. show me the design first"; the board changed; "design approved"; built as #46 |
| The model: Fable 5.1, then Opus 5.5 for new work, then Fable 5.1 again while Opus was unavailable | Agents launched on the model the owner named at the time |

## Why things are the way they are

- **One adapter** between the engine's metres (x east, y north, z up) and three's (x east, y up, z south), so no
  component converts by hand.
- **The scene draws only what `/layout` answers**; no module is placed in the browser.
- **DOM over the canvas** for labels, callouts and handles, placed by a projector in `useFrame` that writes a stage
  store only when a pixel changes: the text is selectable, styled by tokens, and tested as DOM.
- **The drag moves the obstacle in the scene alone** and the drop commits one edit, so the layout is asked once and undo
  is one step.
- **The pictures of the tests** wait for what the text equivalent says is drawn (modules, sun, ground) and for the
  camera to stand still, because the scene arrives in parts and the orbit damps for seconds.
- **The imagery is the fixture tile for every test**, because Playwright asks the last-registered route handler first
  and the Studio's ground fetches tiles too.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| `preserveDrawingBuffer` and `readPixels` for the tests | Zeros under three browsers at once; a screenshot decoded in the page reads the screen |
| drei's `Text` for the labels | Loads its font from the network |
| A zoom by the wheel for the desktop drag picture | The browser merges wheel notches that come together; not the same twice |
| The drag picture on phone | The live label lands a pixel apart run to run; the phone picture is the handles instead |
| The agent's own `roof-type.ts` in the Roof lens branch | Lacked the 10° pitch of a roof made sloped; `main`'s kept |

## What the owner should look at

1. **`/studio/roof` on the demo**: select the stair room from the list or on the roof, drag it east, watch the
   kept-clear count and the module count change, press Cmd+Z. Turn it by its stem handle; raise it by the other.
2. **`/studio/array`**: move Tilt to 10° and release; the layout refits. Switch the roof type in the Roof lens to
   sloped: 1,068 modules pitched.
3. **Import a drawing** from the project switcher with `e2e/fixtures/roof-with-tank.dxf`: the units and the place are
   asked; with the KML fixture the heights to review.
4. The open items of Phase 5 in `plan/STATE.md`: the wheel over a handle, the callout and the turn handle on a pinched
   phone, the frame rate on a mid laptop, the canvas behind the repo by one board.
