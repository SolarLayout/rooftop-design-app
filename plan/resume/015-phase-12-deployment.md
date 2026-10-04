# 015: Phase 12, deployment: staging and production

Written: 2026-10-04, by session 14, at the close of Phase 11. Status: open. After 014 (Phase 11).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 12: deployment
(plan/phase-12-deployment.md): staging at rooftop.staging.solarlayout.app and production at rooftop.solarlayout.app, the two sharing
nothing; the UI on Vercel, the API most probably on AWS Lambda; the tradeshow demos from live production. The plan of the phase comes
first, as plan/phase-11-plan.md and plan/phase-10-plan.md were written (what was found, the pull requests, the steps with their tests,
the decisions with their why, the risks, what done means); show it to me, then explain it item by item in plain words as session 14 did
for Phase 11, and I will keep, drop or change each. Then build in pull requests on the fast lane (D56 holds until I say otherwise: no
browser test runs on this machine; bun check --skip=e2e is the gate).

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, plan/STATE.md (where the work stands, what waits for my say, the facts of the machine),
plan/SESSIONS.md, plan/README.md (every decision; D56 and D57 are the newest), plan/phase-12-deployment.md (what I decided, the scope as
known, the acceptance), plan/phase-11-hardening.md ("As built": bun start, the API's connection and timing behaviour, the roof's limit),
plan/reference/api-profile.md and GitHub issue #76 (the engine's time and memory: the demo's run peaks at 3.5 GB of process memory, the
roof at the limit at 19 GB; a Lambda of 10 GB does not fit the limit as the code stands; the design run streams progress inside one
request, which needs a Function URL with response streaming, not API Gateway REST), docs/checks.md (the check on GitHub; what a pull
request runs), README.md (the stack's commands and profiles), apps/web/next.config.ts (the /api rewrite read at build time; the proxy's
timeout), tools/dev.ts and tools/lib/profiles.ts (how the app is built and started here), apps/api/src/rooftop_api/main.py, settings.py,
connections.py, timing.py, and plan/sessions/014/record.md.

Start by telling me what you found, then the plan. Decide small and medium things yourself and say what you decided; ask only the major
ones, one at a time. The plan should settle, among the scope of the phase file:
  - The API's home: Lambda (a container image, a Function URL with response streaming, the memory size from the profile, the memo's home
    or its loss accepted, the cold start) against the alternative you find cheaper and simpler to run; say the trade honestly.
  - The web app on Vercel: two environments, the rewrite's destination per environment, the Esri key as an environment variable and its
    referrers, the Overture footprints archive the app reads (D48 named deployment for its deployed form).
  - The path from a pull request to staging to production, with a rollback of one step; configuration as code; secrets in the hosts' stores
    only; what the check on GitHub does and does not do on the way.
  - The account steps I must do myself (the domains, Vercel, AWS, the key's referrers): one step at a time, checking each before the next.
  - What #76 (the API lean for Lambda) must deliver before production, and what can wait.
Documents alone go to main directly (D26); code never does.
```

## Notes for the owner

- Phase 11 is closed (#78 to #86) but for D56's one run of the browser suite here and the renewed pictures, when you say; the Studio's
  pictures changed (the Layers button in the view controls, the Sun lens's framing) and are checked by reading until then.
- Your own end-to-end test of the app by hand comes first, as you said; issues #73 to #77 wait on it.
- Before Phase 12's plan, nothing of the deployment exists in the repo: no Vercel project file, no Lambda definition, no workflow that
  deploys. The plan says what to make and what you make yourself.
