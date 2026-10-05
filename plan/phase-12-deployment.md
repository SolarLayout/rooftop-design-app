# Phase 12: deployment, staging and production

**Status:** in progress (session 16, 2026-10-05): both environments live and smoked; what is left is under "As built".
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
- **The path from a pull request to production**: the `check` workflow stays the gate (D55); a deploy to staging or production is started by hand (the
  owner's say, 2026-10-05, for cost; `plan/phase-12-plan.md`, decision 7); production
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
- Staging and production are each reached by the owner's one action (`deploy`, the environment chosen), never on their own; production
  runs only what passed staging's smoke; each side can be rolled back by one.
- The design run's progress streams on production as it does here; a loss edit answers within the time the profile of Phase 11 set.
- Nothing of the repo holds a secret; both keys' referrers hold both addresses.
- The operator's guide written and walked once on production; the dry run done on the stand's hardware.

## As built (so far)

Built in session 16 (2026-10-05). The plan (`phase-12-plan.md`) was written first and changed with the owner as the work went: the
memory proved before asking AWS (10,240 MB allowed), two GitHub roles, and one deploy workflow by hand instead of an automatic staging
(D59). The owner made the AWS and Esri pieces, one step at a time, or let the session run them; `infra/aws/README.md` has every
command. Decisions D58 to D63; the path in `docs/deployment.md`.

### What exists

| Part | Where | Pull request |
|---|---|---|
| The API as an arm64 container image: uv's Python and lock, the Lambda Web Adapter streaming the answer, async init, `/health` naming the commit; the simulations' threads from `ROOFTOP_SIMULATION_THREADS` | `apps/api/Dockerfile`, `tests/test_dockerfile.py`, `rooftop_api/settings.py`, `main.py` (lifespan) | #90, #95 |
| A test that the design run's stream sends keep-alive comments through a silent step | `tests/api/test_design_keepalive.py` | #90 |
| The web app's API address read at build (`ROOFTOP_API_ORIGIN`; a Vercel build without it stops); git deploys off; region `bom1` | `apps/web/api-origin.ts`, `next.config.ts`, `vercel.json` | #91 |
| The smoke of a deployed site | `tools/smoke.ts`, `tools/smoke/` | #92 |
| `deploy`: by hand, Staging or Production; production runs staging's smoked image; the rollback commands in the summary | `.github/workflows/deploy.yml` | #93, #97 |
| The check skips documents alone | `.github/workflows/check.yml` | #94 |
| AWS: the ECR repository, two execution roles, two GitHub roles, two functions with alias, Function URL, reserved concurrency and 30-day logs | `infra/aws/` | made by hand |
| Vercel: `ROOFTOP_API_ORIGIN` and an Esri key per environment; GitHub: the environments, the role ARNs, Vercel's token and IDs | the hosts | made by hand |

### Acceptance, as it stands
- Both addresses serve the app; the demo opens, runs (streamed) and exports its report pages on each (the smoke, every deploy). Present
  and the other exports: by hand, the owner.
- Production is reached by the owner's one action, from staging's smoked image; each side rolled back by one command (tried on staging).
- The design run streams on production; the roof at the limit ran through Vercel in two minutes, the keep-alive holding the line.
- Nothing of the repo holds a secret; each Esri key accepts its own address.
- **Left:** the owner's AWS budget alarm; the browser journeys against staging by hand (#74); the operator's guide (#73) and the dry
  run on the stand's hardware.

### Found on the way
- **This account allows 10,240 MB**, not the 3,008 of the owner's other repository's notes: proved by a throwaway function.
- **GitHub's immutable OIDC subject**: repositories made after 2026-07-15 have the owner's and the repository's IDs in the `sub`
  claim; a trust on the plain form never matches. Found by review before any run (D62).
- **A public Function URL needs two permissions** since October 2025, or it answers 403.
- **zsh does not split `$R` into words**: a command line kept in a variable fails whole; the runbook's commands are written for
  bash arrays or braces.
- **The cold start was a fresh image read lazily**, not the imports (1.1 s in the image): 46 to 56 s for the first start on a host,
  2 to 4 s after; async init (#95) brought a fresh image's first start to 3.5 s.
- **Memory at the limit** (D61, #96): two threads 10,215 MB of 10,240; one thread 5,652 MB, not slower.
- **Reserved concurrency of 2 turned a request away** on staging (one visitor's page holds several requests at once). The owner
  set 100 for production and 50 for staging; the numbers first written were guesses.
- **A request over 6 MB never reaches the API** (#98); real project files are 0.7 to 2.5 MB.
- **ECR's scan** reports 8 high CVEs in Debian's base packages; the Python carries its own OpenSSL. Refresh the pinned base when
  Debian publishes fixes.
