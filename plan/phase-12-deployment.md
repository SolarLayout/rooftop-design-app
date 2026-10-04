# Phase 12: deployment, staging and production

**Status:** not started; filed 2026-10-04 (session 14) so that it is sequenced; its plan is laid out when the phase begins.
**Depends on:** Phase 11 (hardening) and issue #76 (the API lean in time and memory for Lambda). **Before:** the tradeshow, which demos
from live production.

## Goal
The app runs at `rooftop.solarlayout.app`, with a staging twin at `rooftop.staging.solarlayout.app` for pre-production testing, the two
sharing nothing; a change reaches staging and then production by a known path, and nothing surprising happens on the way.

## What the owner has decided (2026-10-04)
- The stand demos from live production, not from a laptop. `bun start` (Phase 11) is the laptop fallback.
- The UI is hosted on Vercel. The API most probably runs on AWS as a Lambda function. The owner's other production apps use this topology.
- Production and staging share nothing: separate projects, functions, keys and data (there is no database, D5; the designs live in the browser).
- The details of the infrastructure and its mechanics are laid out in this phase's plan, when the phase begins, as `phase-10-plan.md` and
  `phase-11-plan.md` were written: what was found, the pull requests, the steps with their tests, the decisions with their why, the risks,
  what done means.

## Scope, as known today
- **The web app on Vercel**: two projects or two environments (staging, production) built from `apps/web` with bun as the package manager
  (rule 7 of `CLAUDE.md`) and Node as the runtime; the `/api/*` rewrite pointed at each environment's API; the Esri key as an environment
  variable, with both addresses among the key's referrers (the owner's step; `plan/STATE.md`, "Esri key"); the fonts and MapLibre's worker
  served from the app as now (D27, D40); the Overture footprints archive the app reads (`tools/footprints.ts` makes the extract; D48 named
  this phase for its deployed form).
- **The API on AWS Lambda**: the container-image form (the engine's packages are far over the zip limit); a Function URL with response
  streaming, so the design run's progress events reach the browser inside the one request (API Gateway REST would buffer them and stop
  at 29 s); the memory size chosen from the profile of Phase 11 (on Lambda the memory sets the CPU share); the memo's home decided (an
  in-process memo is per instance and lost between invocations; see #76); the weather downloads on (PVGIS, NASA POWER) with their
  timeouts inside the function's; CORS not needed while the browser talks to the web origin alone; the API's one log line per request
  (Phase 11) read in CloudWatch; a cold start measured and, if it is felt, kept warm or the first visit designed for it.
- **The path from a pull request to production**: the `check` workflow stays the gate (D55); a merge to `main` deploys staging; production
  is promoted from a staging build by hand (the owner's say), never built twice; what is deployed is written in the run's log (the commit,
  the build, the time); a rollback is one step.
- **Configuration as code**: everything that can be in the repo is (Vercel's project settings as `vercel.json` where they can be, the
  Lambda's definition and its image as files under `infra/` or the like, in a form the owner's other apps use); secrets in the hosts' own
  stores, never in the repo (rule: `.env.local` is never read, printed or committed).
- **The checks against staging**: the smoke, and the journeys if the owner keeps them (#74), run against the staging address by hand, with
  the test's guard against the network relaxed for that run alone and said so.
- **The operator's guide** (#73): one page once production exists: the address, the demo, Present, reset between visitors, what to do if
  production is down (the laptop fallback), who to call.
- **The dry run** on the stand's hardware against production, by the owner.

## Out of scope
A database, accounts or authentication (D5); analytics beyond the hosts' own logs; a custom domain for the API (the web origin forwards);
anything of the engine's numbers.

## Acceptance
- `rooftop.solarlayout.app` and `rooftop.staging.solarlayout.app` serve the app; the demo opens, runs and exports on each; Present runs.
- A merge to `main` reaches staging without a hand; production is promoted by the owner's one action and can be rolled back by one.
- The design run's progress streams on production as it does here; a loss edit answers within the time the profile of Phase 11 set.
- Nothing of the repo holds a secret; both keys' referrers hold both addresses.
- The operator's guide written and walked once on production; the dry run done on the stand's hardware.
