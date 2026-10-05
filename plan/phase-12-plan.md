# Phase 12: plan

Written 2026-10-05 by session 16, before anything of the phase is built. Scope and acceptance: `plan/phase-12-deployment.md`. This file
says how the phase is built, in which order, what is decided, what was found, which steps are the owner's own, and what done means. The
owner keeps, drops or changes each decision; the section "Scoped with the owner" is added when that is done.

## What was found at the start

- **Vercel.** The team `solarlayout` (Pro) holds the project `rooftop-design-app` (not `solarlayout-rooftop-app`), linked to
  `SolarLayout/rooftop-design-app`, root `apps/web`, Next.js, Node 24. Its function region is `iad1`; the owner's other projects run in
  `bom1`. It has Production and one custom environment, `staging`. Both domains are verified: `rooftop.solarlayout.app` is Production and
  answers 200 with the app built from `main`; `rooftop.staging.solarlayout.app` belongs to `staging` and answers 404
  (`DEPLOYMENT_NOT_FOUND`): no deployment goes there. The git integration is on: **every push to `main` deploys production**, the plan's
  commits too, and every pull request gets a preview. No environment variable is set; `/api/*` answers 404 in production.
- **GitHub.** The repo has no secret and no variable; its environments are `Preview` and `Production`, made by Vercel's integration. The
  workflows are `check.yml` (the gate, D55) and `e2e.yml` (by hand).
- **The owner's other apps** (`../solarlayout`, `docs/AWS_RESOURCES.md`, `.github/workflows/platform-deployment.yml`,
  `build-lambdas.yml`). One AWS account, `378240665051`, region `ap-south-1`; the CLI profile `journium-dev` defaults to `us-east-1`, so
  every command names the region. Lambdas are container images for arm64, built with `provenance: false` (Lambda refuses the manifest
  list otherwise), pushed to ECR `solarlayout/<name>` with the commit as a tag and a moving `:staging` / `:prod` tag; functions are
  `solarlayout-<name>-{staging,prod}` with a role `solarlayout-<name>-{env}-execution`. The repositories, roles and functions are made by
  hand, once; CI only updates the code. GitHub reaches AWS through OIDC (no stored keys): the role `solarlayout-github-actions` trusts that
  one repo. Vercel apps are deployed by the CLI from the workflow (`vercel pull`, `vercel build`, `vercel deploy --prebuilt --target`), git
  deploys off in each `vercel.json`; the CLI pinned at 59.19.0, because 59.20.0 broke `--prebuilt` on bun's install layout. AWS changes
  there follow the "first law": the owner runs every command; prod after staging; a check after each. Nothing there checks health after a
  deploy, and its documented Lambda rollback does not work.
- **This account's Lambda memory goes to 10,240 MB** in `ap-south-1`: proved on 2026-10-05 by a throwaway function created at 10,240 MB
  that ran with it, then deleted. The owner's other repo's notes say 3,008 (a request for 5,120 refused); they are out of date. The profile
  (`plan/reference/api-profile.md`) puts the demo's run at 3,465 MB with 8 threads and 2,122 MB with one; a roof at the 30,000 m² limit at
  19,149 and 8,548 MB. **The demo fits; a roof at the limit fits at one thread, under 10,240, and not with 8.**
- **Nothing in that account is served over HTTP**: no Function URL, no API Gateway, no Route 53. This API is the first. DNS is at GoDaddy;
  the API needs no name of its own (the web origin forwards).
- **The one long connection is the design run**: `POST /design` answers `text/event-stream` (`routers/design.py`), read with `fetch` and a
  body reader (`lib/api/events.ts`). No WebSocket. The demo's run is 8 s here, a roof at the limit 61 to 85 s; on a Lambda's CPU two to
  three times that. API Gateway buffers the answer and stops at about 29 s; a Function URL in `RESPONSE_STREAM` mode streams for up to
  15 minutes. Python has no native Lambda streaming: AWS's Lambda Web Adapter, copied into the image, runs uvicorn as it is and streams.
- **Vercel's CDN** forwards an external rewrite and waits 120 s for the first byte, then as long as a byte comes every 120 s. The run's
  first event leaves at once; the longest silence is the shading (48 s here at the limit). FastAPI's `EventSourceResponse` sends `: ping`
  every 15 s when idle (`fastapi/sse.py`), not yet proved for our generator, which is fed from a thread. `proxyTimeout` in
  `next.config.ts` is Next's own server's and plays no part on Vercel.
- **The rewrite's destination is fixed at build** (`next.config.ts`: `http://127.0.0.1:<port>`), and so is the Esri key
  (`NEXT_PUBLIC_ESRI_API_KEY`). A web build belongs to one environment.
- **Sizes**: a Function URL takes a request of 6 MB at most; `/project/open` reads `.rtd` files of up to 10 MB (format 2 embeds the PAN,
  the OND and the weather). The answers (the report, the zip) stream.
- **Detect building** reads Overture's archive straight from `tiles.overturemaps.org` (`lib/map/overture.ts`), as here.
- `GET /health` exists. Docker is installed here but its daemon is not running.

## The shape

```
browser ──► rooftop[.staging].solarlayout.app   (Vercel, bom1; Next built for that environment)
               └─ /api/* ──rewrite──► Function URL of solarlayout-rooftop-api-{staging,prod}:live   (RESPONSE_STREAM)
                                        └─ Lambda Web Adapter ─► uvicorn ─► rooftop_api   (arm64 image, ECR solarlayout/rooftop-api)
```

Staging and production share nothing at run time: two functions, two roles, two URLs, two Vercel environments with their own variables,
two Esri keys. They share the image repository and the commit an image is built from, on purpose: production runs the image staging ran.

## Decisions (proposed D58 onwards when kept)

1. **The API on Lambda, as a container image** (arm64, Python 3.12 from uv's lock, the Lambda Web Adapter copied in, uvicorn the command),
   behind a **Function URL in `RESPONSE_STREAM` mode** on an alias `live`. *Why*: the stream needs it (above); arm64 is the owner's
   norm and cheaper; the alias makes a rollback one command. *Rejected*: API Gateway (buffers, 29 s); App Runner or ECS (an always-on
   bill and a second way of running things beside the owner's Lambdas).
2. **The Function URL's auth is `NONE`, with no shared secret.** *Why*: the API is public through the web origin whatever we do (no
   accounts, D5), so a secret between Vercel and the URL protects nothing that `/api/*` does not already open; Vercel's CDN cannot sign
   AWS's requests. The guard against abuse is the bill's: **reserved concurrency** per function (production 10, staging 2), a log
   retention of 30 days, and an AWS budget alarm (the owner's). The URL is not published anywhere but the Vercel variable.
3. **Memory: generous first, then fitted to what runs.** The account allows 10,240 MB (proved). Staging starts at 10,240; the size is then
   fitted from what runs: the `Max Memory Used` of Lambda's `REPORT` line per request, the demo and a roof at the limit, the size set to the
   peak with about 25 % over, and the run's time checked at that size (the memory sets the CPU share, so a smaller size is slower and not
   always cheaper: the bill is GB-seconds). Timeout 900 s. Simulation threads set for Lambda (a new setting `ROOFTOP_SIMULATION_THREADS`,
   the default unchanged here), chosen with the size: a roof at the limit with 8 threads peaks at 19 GB and does not fit, so #76 makes the
   options' simulations lean or the threads stay few. (The owner's say, 2026-10-05: try before asking AWS, then fit to the measured use.)
4. **The memo stays in the process.** A warm Lambda keeps it between requests; a cold one starts empty and a loss edit then costs a whole
   run. Measured on staging (how often a loss edit is answered from the memo); an outside home is #76's if the number says so.
5. **The web app: one Vercel project, two environments** (Production, `staging`), as the owner made it. Git deploys off
   (`apps/web/vercel.json`, `git.deploymentEnabled: false`); the workflow builds and deploys with the CLI, pinned; region `bom1`.
   `next.config.ts` reads the API's address from `ROOFTOP_API_ORIGIN` at build (an `https` URL, refused in words otherwise), and keeps
   the local port when it is unset. The Esri key per environment as a Vercel variable.
6. **One Esri key per environment**, each with its own address as referrer (the owner makes the second key). *Why*: sharing nothing; a
   key leaked from staging is not production's. The local key keeps its local referrers.
7. **The path.** The `check` workflow stays the gate (D55). When `check` is green on a push to `main` that touches code (not `plan/`,
   `docs/` or `*.md` alone), the `deploy` workflow builds the API image once (tagged with the commit), points the staging alias at it,
   builds the web app for staging, deploys it, and runs the smoke against staging. **Production is the owner's one action**: the
   `promote` workflow, started by hand with a commit (by default what staging runs), moves the same image to production and builds the
   web app of the same commit for Production. *Why built twice for the web*: the rewrite and the key are fixed at build (above), so a
   staging build cannot serve production. The image is never built twice.
8. **Rollback is one step on each side.** API: the alias `live` back to the previous version (the workflow prints the command; the
   `promote` workflow with the earlier commit does both sides). Web: `vercel rollback` or the dashboard's Instant Rollback.
9. **What is deployed is written down**: each run's summary names the commit, the image digest, the Lambda version, the Vercel deployment
   and the time; `/health` answers the commit it was built from (a build argument).
10. **The smoke**: `tools/smoke.ts <base URL>` asks `/api/health`, opens the demo, runs it through `/api/design` and waits for the result
    event, asks the report's first page, and loads `/`. It runs in the workflow after each deploy and by hand. The browser tests against
    staging (#74) are by hand, with the network guard relaxed for that run alone and said so.
11. **Configuration as code, by hand where the owner's apps do it by hand.** In the repo: the Dockerfile, `vercel.json`, the workflows,
    and `infra/aws/` with every policy, trust and function setting as JSON and the commands that apply them (`infra/aws/README.md`). No
    Terraform or CDK: the owner's apps have none. Secrets in Vercel's and AWS's stores only; GitHub holds the role's ARN and Vercel's token.
12. **GitHub reaches AWS through a role of its own**, `solarlayout-rooftop-github-actions`, trusting only this repo's `main` branch and its
    `Staging` and `Production` environments, allowed to push to the one ECR repository and to update and publish the two functions and
    their aliases. *Why*: the shared role holds rights over solarlayout's downloads and CloudFront.
13. **The owner runs every AWS command that changes something.** I write each one, with what it should answer; the owner pastes the
    answer back; I check it before the next. I may run read-only commands (`describe`, `get`, `list`) to check, unless the owner says no.
14. **Detect building keeps reading Overture's own host.** D48's mirror is made only if the deployed origin is refused or slow there.

## The owner's steps, in order

One at a time, each checked before the next. Steps 1 to 4 do not wait for code.

1. AWS: the ECR repository `solarlayout/rooftop-api`. Done 2026-10-05.
2. AWS: the account's Lambda settings read: 2,500 concurrent executions, all unreserved. Done 2026-10-05. Memory is not in Service
   Quotas; a raise would be a support case.
3. AWS: the two execution roles (logs only); a throwaway function at 10,240 MB on the staging role to prove the memory limit, then
   deleted (decision 3; done 2026-10-05, the staging role made and the limit proved); the GitHub role with its trust and policy
   (decision 12).
4. GitHub: the `Staging` environment; `Production` kept to `main`; the secret `AWS_ROLE_ARN`, the variables `AWS_REGION`,
   `AWS_ACCOUNT_ID`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; a Vercel token as `VERCEL_TOKEN`.
5. AWS, after the first image is pushed by the workflow (PR 3): the two functions from it, the alias `live`, the Function URLs in
   streaming mode, reserved concurrency, log retention; a budget alarm.
6. Vercel: `ROOFTOP_API_ORIGIN` and `NEXT_PUBLIC_ESRI_API_KEY` for each environment; `staging` with no branch of its own.
7. Esri: the production key's referrer `https://rooftop.solarlayout.app`; a second key for `https://rooftop.staging.solarlayout.app`.
8. The first promote to production, by hand; then the dry run on the stand's hardware (the acceptance).

## The pull requests

Each with its tests first, `bun check` green (with the browser groups the change can reach, D55), merged by me.

1. **The API's image.** `apps/api/Dockerfile` (arm64, uv's lock, the Web Adapter, `AWS_LWA_INVOKE_MODE=response_stream`, the
   readiness path `/health`), `.dockerignore`, the setting `ROOFTOP_SIMULATION_THREADS`, the commit in `/health`. Tests: the setting's
   reading; that the design stream sends a ping while a step is silent longer than the ping's interval (a slow step faked); the image built
   and run here (`docker run`, the adapter passes through outside Lambda), `/health` and a demo run streamed through it. Needs Docker
   Desktop running.
2. **The web app for Vercel.** `ROOFTOP_API_ORIGIN` in `next.config.ts` (its parsing a unit with tests), `apps/web/vercel.json` (git
   deploys off, `bom1`, bun to install, the build), `.env.example`. Merging it stops production's deploys on push; production keeps its
   current deployment until the first promote.
3. **The workflows and the smoke.** `deploy.yml` (after a green `check` on `main`, code only: image, staging alias, web build for staging,
   smoke, summary), `promote.yml` (by hand: image to production, web build of that commit for Production, smoke, summary),
   `tools/smoke.ts` with unit tests of its parts, `infra/aws/` (the JSONs and the commands of the owner's steps). Concurrency per
   environment, queued, never cancelled. The first runs prove it: an image in ECR, then the owner's step 5, then staging served.
4. **#76, the part production needs**: the memory size and the threads fitted from staging's measures (decision 3), a roof at the limit
   inside the size chosen; the cold start measured on staging and, if it is felt, the first visit designed for it or the function
   kept warm on the show's days.
5. **Documents** (to `main`, D26): the operator's guide (#73), `docs/deployment.md` (how a change reaches production, how to roll back),
   the state.

## Risks

- **Memory at the limit** (decision 3): fits in 10,240 at few threads; the fitted size and the threads are settled on staging, before
  production.
- **A `.rtd` over 6 MB** cannot be opened on production (the Function URL's limit). Measured on the largest real file; if real files pass
  6 MB, opening reads the file in the browser and sends only the project, or the limit is said in the dialog.
- **The ping during a long step** unproved for our generator: PR 1 tests it; staging proves it through Vercel.
- **Vercel CLI and bun**: the pinned version is the one the owner's apps use; checked on the first run.
- **The cold start** of an image of this size: several seconds, perhaps more; measured on staging.
- **Lambda's CPU**: the profile's times are an M1 Ultra's; staging gives the real ones, and the loss edit's answer time is held to the
  acceptance there.

## What done means

The acceptance of `phase-12-deployment.md`, and: `deploy` and `promote` have each run green at least once; a rollback has been done once
on staging, each side; `infra/aws/` matches what runs (each step's answer kept in the session's record); the plan's state says what runs
where.

## Not in this phase

A domain for the API; a database or accounts (D5); alarms beyond the budget's; Overture's mirror unless decision 14 calls for it;
anything of the engine's numbers.
