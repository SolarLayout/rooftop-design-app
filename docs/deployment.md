# Deployment: how a change reaches staging and production

The app runs in two environments that share nothing at run time: two Lambda functions, two Function URLs, two Vercel
environments with their own variables, two Esri keys. They share the image repository and the commit an image is built
from, on purpose: production runs the very image staging ran and smoked. Nothing deploys on its own; the owner starts every
deploy (the owner's say, 2026-10-05, for cost). The decisions behind this are D58 to D63 in `plan/README.md`; how the AWS
side was made is `infra/aws/README.md`.

| | Staging | Production |
|---|---|---|
| Address | https://rooftop.staging.solarlayout.app | https://rooftop.solarlayout.app |
| Web app | Vercel project `rooftop-design-app` (team `solarlayout`), environment `staging`, region `bom1` | same project, environment Production |
| API | Lambda `solarlayout-rooftop-api-staging`, alias `live`, behind its Function URL | Lambda `solarlayout-rooftop-api-prod`, alias `live`, behind its Function URL |
| GitHub environment | `Staging` (deploys from `main` alone) | `Production` (deploys from `main` alone) |
| Simulation threads, memory | 1, 10,240 MB | 1, 10,240 MB |
| Reserved concurrency | 50 | 100 |

The browser talks to the web origin alone: Vercel forwards `/api/*` to the environment's Function URL (`ROOFTOP_API_ORIGIN`,
read when the web app is built, `apps/web/api-origin.ts`), so there is no CORS and the URL is published nowhere else.

## Deploying

1. Merge the pull request to `main` (the `check` workflow is its gate; a change of documents alone runs no check).
2. Deploy to Staging: Actions → **deploy** → Run workflow → environment **Staging** (commit empty: the head of `main`), or
   `gh workflow run deploy -f environment=Staging`.
3. Look at staging. The run's summary has the smoke's result.
4. Deploy the same commit to Production: environment **Production**, commit empty (what staging runs), or
   `gh workflow run deploy -f environment=Production`.

What a run does (`.github/workflows/deploy.yml`):
- **Staging**: builds the API's arm64 image for the commit and pushes it to ECR under the commit's SHA (not again if ECR has
  it); builds the web app for Vercel's `staging`; only then moves the function's alias `live` to a new version of the image
  (by its digest) and deploys the web app; runs the smoke (`tools/smoke.ts`); when the smoke passes, tags the image
  `staging-smoked-<sha>`.
- **Production**: refuses a commit whose image is not tagged `staging-smoked-<sha>`; builds the web app of that commit for
  Production; then moves production's alias to the same image and deploys the web app; runs the smoke.
- A web app that does not build leaves the environment as it was: nothing is moved before the build.
- One deploy per environment at a time, queued.

The first request after a deploy starts a new instance on a host that may never have read the image: about 3.5 s to start
(the smoke pays it, not a visitor). Later cold starts take 2 to 4 s; a warm request about 0.1 s.

## Rolling back

Each run's summary prints both commands with the versions it replaced.
- **The API**: `aws lambda update-alias --function-name <function> --name live --function-version <previous> --region ap-south-1`.
  Immediate. `/api/health` names the commit it runs.
- **The web app**: `vercel alias set <previous deployment>.vercel.app <domain> --scope solarlayout`. About 3 s.
- **Both, to an earlier commit**: run `deploy` with that commit (to Production, a commit that passed staging's smoke). The
  image exists, so nothing is built.

Both one-command rollbacks were tried on staging on 2026-10-05 and moved forward again.

## Checking by hand

`bun tools/smoke.ts https://rooftop.staging.solarlayout.app --commit <sha>` runs the same smoke as the workflow: the page,
the API's health and the commit it was built from, the demo, its design run streamed to the result, the report's pages.

The smoke never calls services outside the app. Looked at by eye on a deploy that changes them:
- The satellite imagery and the place search (Esri; each environment's key accepts its own address alone).
- Detect building on the map (Overture's archive, read from `tiles.overturemaps.org`; it answers both addresses).

## Where things live

| What | Where |
|---|---|
| `ROOFTOP_API_ORIGIN`, `NEXT_PUBLIC_ESRI_API_KEY` | Vercel, per environment (encrypted) |
| `ROOFTOP_SIMULATION_THREADS` | each Lambda function's configuration |
| The image's settings (the adapter, streaming, async init) | `apps/api/Dockerfile`, held by `apps/api/tests/test_dockerfile.py` |
| `AWS_ROLE_ARN` (each environment's GitHub role) | GitHub, per environment |
| `AWS_REGION`, `AWS_ACCOUNT_ID`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; `VERCEL_TOKEN` (secret) | GitHub, the repository |
| The functions' logs | CloudWatch, `/aws/lambda/<function>`, 30 days; one line per request (`timing method=… path=… status=… ms=…`) and Lambda's `REPORT` line (time, memory) |

## Limits to know

- A request to the API is 6 MB at most (the Function URL's limit). Real project files are 0.7 to 2.5 MB; a larger one fails
  in AWS's words (#98).
- A design run at the roof limit (30,000 m²) takes about two minutes and 5.7 GB with one thread; the run streams its
  progress, and Vercel keeps the line open as long as a byte comes every 120 s (the API sends a keep-alive every 15 s). Where
  the memory goes is #96 (Phase 13).
