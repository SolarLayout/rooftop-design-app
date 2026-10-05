# Session 16: record

2026-10-05. Phase 12 (deployment) from its plan to both environments live. What exists is in `plan/phase-12-deployment.md`, "As built
(so far)"; the path in `docs/deployment.md`; the AWS side in `infra/aws/README.md`; the decisions D58 to D63 in `plan/README.md`. Not
repeated here.

## What the session did, in order

| # | What | Where |
|---|---|---|
| 1 | Vercel read: the project is `rooftop-design-app` (not the name the owner gave), git deploys on (every push to main deployed production), region iad1, staging with no deployment | — |
| 2 | The owner's other repository studied by two agents: `platform-deployment.yml`, `build-lambdas.yml`, `AWS_RESOURCES.md` | — |
| 3 | The SSE question: one stream (`POST /design`), no WebSocket; API Gateway ruled out, a Function URL in streaming mode with AWS's Lambda Web Adapter | `phase-12-plan.md` |
| 4 | The plan written, then changed with the owner as the work went (memory proved first; two GitHub roles; one workflow by hand) | `phase-12-plan.md` |
| 5 | The owner's AWS steps one at a time: ECR, the two execution roles, a throwaway function proving 10,240 MB, the two GitHub roles | `infra/aws/` |
| 6 | The API's image (#90), the web app for Vercel (#91), the smoke and the runbook (#92) | — |
| 7 | An agent's review of #92 before merge: GitHub's immutable OIDC subject (the trusts would never have matched), a public Function URL's second permission, promote able to ship an unsmoked commit, the API moved before the web built, AWS errors read as "no image". All fixed before merge; the trusts replaced by the owner | #92 |
| 8 | The owner: one workflow with the dropdown, no automatic staging (cost). `deploy-staging` disabled before it ever ran; #93 replaced both workflows | #93 |
| 9 | The owner: why does the check run for documents. `paths` on `check.yml`, but the design tokens, which three web tests read | #94 |
| 10 | First deploy to Staging: the image pushed, stopped at the web build as expected (no API address yet); the functions made from it; Vercel's variables; the Esri keys made by the owner step by step | — |
| 11 | Staging green end to end; the cold start found to be a fresh image read lazily (46 to 56 s once per host), not the imports (1.1 s); async init in the image (#95); a fresh image's first start then 3.5 s | #95 |
| 12 | Production's function made from staging's smoked image; Staging and Production deployed and smoked on `774e0a9` | — |
| 13 | The roof at the limit through Vercel: 124 s, the keep-alive holding the line; **10,215 MB of 10,240 with two threads**; 5,652 MB and 117 s with one. One thread on both functions (D61); #96 filed on the owner's word | #96 |
| 14 | A rollback on staging, each side, one command each; the web's command printed by the summary (#97) | #97 |
| 15 | Overture answers both addresses with CORS; a request over 6 MB never reaches the API (#98, low: real files 0.7 to 2.5 MB) | #98 |
| 16 | Reserved concurrency explained (a ceiling at no cost; nothing kept warm); the owner set production 100, staging 50 | — |
| 17 | The owner's look at production (imagery, search): done. #99 (the operator's guide and the dry run) and #100 (the production guards) filed; the journeys against staging not needed | #99, #100 |
| 18 | One thread moved into the image (#101); the functions' own variable removed; the owner deployed both on `666368a` | #101 |

## Why things are as they are
- **Two web builds, one image.** The rewrite's destination and the Esri key are fixed when the web app is built, so a staging build cannot
  serve production; the API's image carries nothing of its environment and is reused.
- **No secret between Vercel and the Function URL.** The API is public through the web origin anyway; a secret would protect nothing.
- **The smoked tag.** Production deploys only an image a staging smoke passed on; the tag is set by the smoke, on that very digest.
- **Concurrency.** The first numbers (2 and 10) were guesses and the owner called them so; the shape now: a ceiling at no cost, a per-IP limit
  at Vercel to come (#100), alarms to come.

## Mistakes, and what was done about them
- **The OIDC subject** in the first trusts (plain form) would have refused every deploy: caught by the review agent before any run.
- **A zsh word-splitting slip**: an AWS command line kept in `$R` failed whole; nothing was created; the runbook says how to write it.
- **A fast check that failed was followed by a commit and a pull request** (#101's first commit, a comment 3 characters too long); the
  pull request was merged only after the check was green here and on GitHub. A chain must stop at a failed check.
- **A next build with a custom directory** added two lines to `apps/web/tsconfig.json`; seen and reverted before any commit.
- **The permission system refused `aws iam create-role`** although the owner had said to run it; not worked around; the owner ran the IAM
  steps, the session the rest (memory `rooftop-aws-hands`).

## Where the log is
This conversation; the pull requests #90 to #95, #97, #101; the workflow runs of `deploy` on GitHub; the functions' CloudWatch logs.
