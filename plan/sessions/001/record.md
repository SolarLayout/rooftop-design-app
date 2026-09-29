# Session 1: record

2026-09-29. One session, started in the desktop app's repo (`rooftop-design`), which created this repo.
This file is what a later session needs to know about how things came to be as they are. The state of the
project is in `plan/STATE.md`; the decisions are in `plan/README.md`. Neither is repeated here.

## What the session did, in order

| # | What | Result |
|---|---|---|
| 1 | Analysed the desktop app; advised on moving to the browser | Keep the Python engine, build a new web front end |
| 2 | Functional inventory of the desktop app | `plan/reference/functional-inventory.md` |
| 3 | Information architecture and first mockups | Approved by the owner |
| 4 | Satellite outlining as the flagship; depth and motion on controls | Mockups round 2 |
| 5 | Map provider research | Esri plus Overture; record in `plan/reference/map-providers.md` |
| 6 | Esri account and key, step by step with the owner | Key works; imagery, search and outlining shown live |
| 7 | Sun and Strings lens mockups | Mockups round 3 |
| 8 | Phase 1: monorepo and dev tooling | PR #1 |
| 9 | Dev and test stacks on separate ports; CI without browser tests | In PR #1 |
| 10 | Design system written down | PR #2, #3 |
| 11 | State file, session protocol, resume prompts | PR #4 |
| 12 | Real equipment files as fixtures; real names in the demo | PR #5, #6 |
| 13 | Phase 2, part 1: engine and first endpoints | PR #7, #8 |
| 14 | Cable label decision; access to the reference repos | PR #9 |

## Why things are the way they are

Reasons that are not obvious from the code or the plan.

- **The mockups are drawn, not rendered.** The design canvas allows no external scripts, so the 3D roof is an
  axonometric projection written as SVG transforms, from the real demo layout. The numbers in
  `docs/design/mockups/build_lenses.py` (the matrices) are that projection. The product uses real 3D.
- **Google Maps was the owner's first wish and cannot be used.** Its terms forbid tracing building outlines
  from its satellite imagery. Mapbox and MapTiler forbid it for commercial use. That is why Esri.
- **Esri imagery comes through the Basemap styles service**, not the Static basemap tiles service, which has no
  plain imagery. The research said otherwise; testing with the real key corrected it.
- **The Esri key is limited to port 4700.** That is why the dev stack prefers 4700 and warns on any other port,
  and why the throwaway preview page in `tools/imagery-preview/` uses 4700.
- **Tests have their own stack (4710 and up)** because the session's own checks once held 4700 while the owner
  wanted to run `bun dev`.
- **Browser tests are not in the pull request check** because the first CI run hung for nine minutes installing
  the browser. The owner asked to park it. They run locally in `bun check`.
- **Node was not on the owner's PATH at first.** The tooling therefore searches for Node itself
  (`tools/lib/node.ts`). Node 26.10.0 is on PATH now.
- **The engine's calculation modules are copied unchanged on purpose.** Every expected number was confirmed by
  Prasanta, the domain expert, on the desktop app. Changing a number needs him.
- **The demo files named "Test" are real equipment under another name.** The owner chose to show the real names.
- **`plan/design-previews/` moved to `docs/design/previews/`** when the design system was written down.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| One generic resume prompt | The owner wants a specific one per resumption, written on request |
| Browser tests in the pull request check | Browser install hung in CI |
| Refusing to start when a port is taken | The owner wants the tooling to find free ports |
| Dome of radius 55 m for the sun path in the mockup | The sun marker landed on the roof; 75 m is used |

## Agents used

Large pieces were given to agents with written briefs, then reviewed by the session before merging. An agent's
report was treated as a claim. What the session checked itself is stated in each pull request.

| Work | Reviewed how |
|---|---|
| Functional inventory | Spot checks against the desktop app's screenshots and a run of the engine |
| 3D notes from solar-mms-modeller | Not verified line by line; verify each fix when it is used |
| Map provider research | The Esri part was tested with the real key; the terms of the others were not re-read |
| Phase 1 and the port change | `bun check`, start, status, stop, and the two stacks side by side |
| Phase 2, part 1 | Demo numbers recomputed, engine files compared with the source, `bun check`, live endpoints |

## Where the rest of session 1 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/001/owner-messages.md` | Read it; it is short |
| Notes the session saved about the owner's preferences | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/memory/` | Loaded by itself in every session in this repo. The rules in them are also in `CLAUDE.md` |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design/fce59b46-029f-4efc-808c-fd63e32f7dec.jsonl` | 35 MB. Never read it whole. Search it, as below |
| The design canvas | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy | Open to anyone with the link |

The log and the memory folder are on the owner's machine only. They are not in the repo and do not travel with a
clone. What matters from them is in the repo.

## Searching the full log

One JSON object per line. Useful kinds: `user`, `assistant`, `queue-operation` (messages the owner sent in the
middle of a turn). Always cut the output short.

```
LOG=~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design/fce59b46-029f-4efc-808c-fd63e32f7dec.jsonl

# What the assistant said about a subject (first 300 characters of each passage)
jq -r 'select(.type=="assistant") | .timestamp as $t | .message.content[]? | select(.type=="text")
       | select(.text | test("Overture"; "i")) | "\($t) \(.text[0:300])"' "$LOG" | head -20

# Commands that were run, with a word in them
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Bash")
       | .input.command | select(test("lsof")) | .[0:200]' "$LOG" | head -20

# What happened around a moment in time
jq -r 'select(.timestamp >= "2026-09-29T07:50" and .timestamp <= "2026-09-29T08:10")
       | select(.type=="user" or .type=="assistant") | "\(.timestamp) \(.type)"' "$LOG" | head -40
```

Reports of agents are in the log as `user` entries that begin with `<agent-message`. They are long; search them,
do not print them.
