# Session 10: record

2026-10-02. Started with the resume prompt `plan/resume/009-phase-6-studio-sun.md`: Phase 6, the Studio's Sun lens. The
plan was written first (`plan/phase-06-plan.md`), then six boards, then the four pull requests of the plan and a fix
of the scene's light that the owner asked for. What is built is in `plan/phase-06-studio-sun.md`, "As built"; the state
is in `plan/STATE.md`. Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: the documents, git (five merged branches of Phase 5 deleted), the stacks; `bun check` on `main` green | |
| 2 | Probes of the engine: the stair room's far corner at 16:00 on bare roof; the shadow request's 484 KB; the bias's 0.51 m | scratchpad |
| 3 | The plan: what was found, four pull requests, seventeen steps, seventeen decisions, the risks; approved | `plan/phase-06-plan.md`, `ee43599` |
| 4 | The data of the boards from the engine; the shade map's colours by the data-colour skill; six boards by two agents; aligned; approved | `docs/design/mockups`, `92990fb` |
| 5 | Pull request 1: the time on the stage | #48 |
| 6 | Pull request 2: the shadow request of a roof, the bias held to the engine, the sun path (an agent), the outlines, the acceptance | #49 |
| 7 | Pull request 3: the figures and the shade map | #50 |
| 8 | The light held to the palette, the owner's finding | #51 |
| 9 | Pull request 4: the states, the callout on phone, the frame rate by hand | #52 |
| 10 | The close: "As built", the status, the state, this record; resume 009 used | `main` |

## How the owner steered the session

| He said | What was done |
|---|---|
| "approved" to the plan, then to the boards | Built in the order of the plan, the logic of the later pull requests written while the boards were drawn |
| The roof darker than the mockups, in #49's pictures and those of #50 | Measured (the roof `#AAAFB5` against `#D3D6DB`, the glass `#000A25` against `#16294D`), traced to the tone mapping and the intensities since #42, fixed as a pull request of its own with a test that holds the roof and the glass to the palette, every picture renewed (#51) |

## Why things are the way they are

- **One request of `/sun` per place and day**, a quarter hour apart: a scrub of the timeline asks nothing.
- **The scene reads nothing of the time**: the light, the camera and the marker do, so a scrub redraws them alone, and the
  development counter of matrix writes proves the modules are never rebuilt.
- **The bias is bounded by what it moves**, not by texels alone: the acceptance's 0.2 m holds because a shadow on a level
  roof moves under 5 cm.
- **The light is held to the palette**: the boards draw every surface at its colour, so the scene's sun and sky come to π
  on a level roof at the morning the boards draw, without tone mapping.
- **Every number on the Sun lens is the engine's**, read from the run's answer in the tests: the figures, the map's counts,
  a module's loss and its string's.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| The sun asked one hour at a time (Phase 5) | A request per step of a scrub |
| Three's neutral tone mapping | It subtracts the darkest channel near black: the modules' glass lost its red |
| The roof's palette test between the first two rows | The lit band north of the first row's shadow is a pixel on phone |
| The agent running the browser itself | The permission system refused it the test stack; the session ran it |

## What the owner should look at

1. **`/studio/sun`**: drag the timeline and press Play; switch on Calculated shadow outlines at 16:00; the Shade map tab,
   then press a module next to the stair room.
2. **The light**: the Studio's roof and modules beside the boards (#51's table).
3. **On phone**: the time pill at the top of the stage; a selected obstacle shows its handles without a callout.

## Where the rest of session 10 is kept

The full log of the session is on the owner's machine, in `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/`,
the newest file of 2026-10-02. Never read it whole; search it as `plan/sessions/001/record.md` shows.
