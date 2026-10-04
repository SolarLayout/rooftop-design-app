# Session 14: record

2026-10-04. Started with the work order `plan/resume/014-phase-11-hardening.md`: Phase 11, hardening for the tradeshow. The plan was
written first (`plan/phase-11-plan.md`), then scoped with the owner item by item in plain words (its section "Scoped with the owner"), then
built as pull requests by agents in worktrees from written briefs, each reviewed and checked by the session. What is built is in
`plan/phase-11-hardening.md`, "As built"; the state is in `plan/STATE.md`. Neither is repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Start: the documents, git, the stacks; `bun check` on `main` ran the browser step whole (uncached) and the shell group failed under the load: 35 drops of the rewrite counted in the stack's logs, `/layout` among them | `plan/STATE.md` |
| 2 | The plan: what was found, no boards, nine pull requests, 34 steps, 22 decisions, the risks, two questions; the production build put first on the drops' account | `plan/phase-11-plan.md`, `0d6d740` |
| 3 | The plan explained item by item in plain words; the owner kept, dropped or changed each: the stand demos from live production (Vercel, Lambda; Phase 12 filed), `bun start` not `bun stand`, no relay of our own, the audits and the guide to #73, the journeys to #74, Present's fixes to #75, the API's performance to #76, the keyboard and the browsers to #77, the roof limit made realistic (30,000 m²), the Layers button to be built | `plan/phase-11-plan.md` "Scoped with the owner", `plan/phase-12-deployment.md`, issues #73 to #77 |
| 4 | Pull request 1: `bun start`; the drops measured on the production build (the same), found at two causes and fixed at both; one log line per request; a fresh clone's check (it found the order-dependent test of the timing logger) | #78 |
| 5 | Pull request 2 by an agent: the pictures by group, the kit on two sizes, Present's frames on desktop alone; all eight groups run once, no picture changed; the times renewed | #79 |
| 6 | The first tries under load: the pages drawn once per key under asks at once; a pending save written when the page is left | #80 |
| 7 | The board "Stage, Layers" drawn by an agent, looked at by the session, approved by the owner (D57) | `f7e76cf`, `4dde643` |
| 8 | Pull request 4 by an agent: the base imports nothing of the groups' folders; the session widened decision 4 when the rule found 21 crossings (`lib/geometry`, `lib/flow/deliverables`) | #82 |
| 9 | Pull request 5a by an agent: one roof at a time, up to 30,000 m², at every route; measured at the limit (7,590 positions, 61 s); the browser test of the refusal by the session | #81 |
| 10 | The owner's rule D56: no browser test runs on this machine for the rest of the phase; the fast lane alone is the gate | `plan/README.md`, `7a…` of `main` |
| 11 | Pull request 6 by an agent: the BLAS threads pinned on GitHub (measured over three runs, no gain, taken out in #85), the pages drawn once per session (tried, no gain, taken out by the session), the engine's profile for #76 | #83, #85, `plan/reference/api-profile.md` |
| 12 | Pull request 7 by an agent: the seven items of polish | #84 |
| 13 | Pull request 3 by an agent: the Layers button to the approved board | #86 |
| 14 | The close: "As built", the state, this record | `main` |

## How the owner steered the session

| He said | What was done |
|---|---|
| "explain the plan to me in simple/functional english one at a time, i will scope/descope basis that" | Ten items, one at a time, each kept, dropped to an issue, or changed |
| The product deploys to Vercel and Lambda; `bun start` rather than `bun stand`; "push back, or suggest sequencing with reasons" | Deployment as Phase 12 after this phase; the Lambda facts recorded for it; no relay of our own |
| "in the tradeshow, the product will be demoed from live production" | The offline demo dropped; the operator's guide deferred to production; the laptop as the fallback |
| "drop if it would take hours for you to do it" | The audits dropped to #73 |
| "these appear to be absurd numbers for rooftop ... politely refuse beyond the limit with clear verbiage and reason and tell them what to do" | 30,000 m², the words with the area, the limit and what to do |
| "For task 7, file a GH issue. I will record a video" | #75 |
| "The python API will run in AWS Lambda ... API should be fast, optimized both in time and space" | The profile first (#83), the optimisation as #76 |
| "Build it" (the Layers button) | The board, approved; #86 |
| "we will not run any e2e tests locally for now. only fast lane would be run. this is in effect till the whole of Phase 11 is done" | D56; the browser runs stopped; the suites written and reviewed by reading; the pictures wait for the close |

## Why things are the way they are

- **Every API answer closes its connection**: Next's proxy, dev and production alike, frees the upstream socket of a streamed answer and tears
  it down under the request that took it. A socket never pooled cannot be torn down under anyone; the cost is a handshake on the same machine.
- **The pages are kept and drawn once per key**: three sizes asking the same pages together drew them three times, behind one another on the
  drawing lock, to 133 s under load, while the proxy gave up at 30 s.
- **The test stack stays `next dev`**: with the drops fixed, the build saved a tenth of a group's time, and a built stack left running serves
  stale code where `next dev` reloads it.
- **A baseline belongs to the group its name begins with**: a Handover change paid 11 to 16 minutes for the shell's pictures of everything.
- **`lib/geometry` and `lib/flow/deliverables` are base folders**: the rule found that the shared helpers' own imports reached the groups'
  folders too; the metres, the palette and the deliverables' names are everyone's.
- **30,000 m²**: one building at the top end of what gets built; a clean rectangle at the limit holds 4.2 MWp and runs in 61 s.
- **What did not pay came out** (decision 17): the shared drawing of the pages in the tests, the BLAS pinning on GitHub.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| The test stack on the production build | A tenth of a group's time once the drops were fixed; a built stack left running serves stale code |
| `Connection: close` on the design stream alone | The drops stayed under load: the second cause (the pages' queue and the proxy's 30 s) |
| The report's pages drawn once per pytest session | 180 s before, 179 s after |
| numpy's BLAS threads pinned to one on GitHub | 0.6 s a test with and without |
| Framing the Sun lens lower | Sunset went further off the bottom; the dome is framed instead |

## What the owner should look at

1. **`bun start`** on this machine: the app as production runs it, one command.
2. **The Layers button** in the Studio's view controls (after #86 is merged): the imagery off and on, in every lens.
3. **The Sun lens's framing** when the pictures are renewed: the whole arc framed; the marker behind the desktop timeline near sunset.
4. **`plan/reference/api-profile.md`** and #76: the engine's memory (3.5 GB for the demo's run) before Lambda is sized.

## Where the rest of session 14 is kept

The full log of the session is on the owner's machine, in `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/`, the newest
file of 2026-10-04. Never read it whole; search it as `plan/sessions/001/record.md` shows.
