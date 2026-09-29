# Phase 1: monorepo, tooling, one-command dev stack

**Status:** done 2026-09-29. Merged through PR #1 on SolarLayout/rooftop-design-app; CI check green (browser tests excluded from CI, decision D20). **Depends on:** nothing (can start while phase 0 is in review).

## Goal
An empty but fully wired repo: one command starts web and API, one stops them, one checks everything.

## Scope
```
rooftop-design-app/
  apps/
    web/            Next.js 16 App Router, React 19.2, Tailwind 4, TypeScript 5.x     port 4700
    api/            FastAPI + uvicorn, Python 3.12, managed by uv                      port 4701
  packages/
    api-types/      TypeScript types generated from the API's OpenAPI document
  e2e/              Playwright tests (chromium; phone, tablet, desktop projects)
  tools/            dev.ts (start/stop/status), check.ts
  plan/             this folder
  turbo.json  package.json  bunfig.toml  .nvmrc  CLAUDE.md  README.md
  (.python-version is in apps/api since phase 2: uv reads it only next to pyproject.toml)
```

- bun workspaces + turbo. Next runs on Node (never `bun --bun next`); pin Node in `.nvmrc`.
- `bun dev` starts both apps with prefixed logs, waits for both health checks, prints the URLs.
  It refuses to start if 4700 or 4701 is taken and names the process holding the port.
- `bun stop` stops both, including orphans from a crashed run (PID file in `.dev/` plus a port check).
- `bun status` shows what is running.
- `bun check` runs: typecheck, eslint, ruff, import-linter, pytest, bun test, and the Playwright smoke test.
- `GET /health` on the API; the web home page shows API reachability in development.
- Web calls the API through a Next rewrite (`/api/*` to `http://localhost:4701/*`), so there is no CORS in the browser.
- `next.config.ts` sets `reactStrictMode: false` (R3F + React 19 kills the WebGL context on the dev double mount).
- CI workflow: install with frozen lockfiles, run `bun check`.
- `CLAUDE.md` carries over the hard rules (engine never imports UI code, local roof metres, no default
  system voltage, tick or exclamation and never a red cross, tests never touch the network).

## Deliverables
- Repo skeleton committed on a branch, first PR.
- README with the three commands.

## Acceptance
- Fresh clone: `bun install && bun dev` brings up http://localhost:4700 and http://localhost:4701/health.
- `bun stop` leaves both ports free. Running `bun dev` twice gives a clear message, not a stack trace.
- `bun check` is green locally and in CI.
- Playwright smoke test opens the home page on all three viewports.

## Out of scope
Any product UI, any engine code.

## As built (2026-09-29)

Checked on the owner's machine: `bun install`, `uv sync`, `bun dev`, `bun dev:bg`, `bun status`, `bun stop`,
`bun gen:api`, `bun run build` and `bun check` (all seven steps green, Playwright on all three viewports).

Still open against the deliverables and acceptance above:
- Nothing is committed: no branch, no first PR.
- `.github/workflows/check.yml` exists but has never run, so "green in CI" is not shown yet.
- A fresh clone was not tried; the frozen installs (`bun install --frozen-lockfile`, `uv sync --frozen`)
  pass on the working tree.
- The colours of the `[web]` and `[api]` prefixes were not looked at in a real terminal (they are only
  used on a TTY); the prefixes themselves were checked.

Installed versions: next 16.2.11, react and react-dom 19.2.4, typescript 5.9.3, tailwindcss and
@tailwindcss/postcss 4.3.3, eslint 9.39.5, eslint-config-next 16.2.11, three 0.185.1,
@react-three/fiber 9.6.1, @react-three/drei 10.7.7, zustand 5.0.14 (the last four are installed, not used),
@playwright/test 1.52.0, openapi-typescript 7.13.0, turbo 2.11.5; fastapi 0.141.1, starlette 1.7.0,
uvicorn 0.54.0, pydantic 2.13.5, pytest 9.1.1, ruff 0.16.9, import-linter 2.15, httpx 0.28.1; Python 3.12.8.

Update, same day: the owner put Node 26.10.0 on PATH (`/opt/homebrew/bin/node`). `.nvmrc` now says 26.10.0
and `bun check` is green on it. The note about Node 20 below is history.

Deviations and things to know:
- Node is not on PATH on the owner's machine. The only usable one is Homebrew's keg-only
  `/opt/homebrew/opt/node@20/bin/node` (20.20.2), so `.nvmrc` says 20.20.2 (solar-mms-modeller names
  22.22.3, which is not installed). `tools/lib/node.ts` finds Node on PATH and in the usual places of
  Homebrew, nvm, fnm, volta, mise and asdf, rejects bun posing as node, and puts the real one first on PATH
  for child processes. `ROOFTOP_NODE` overrides. Node tools run through `bun tools/with-node.ts <tool>`.
- The rewrite goes to `http://127.0.0.1:4701`, not `localhost`, so it cannot land on IPv6 while uvicorn
  listens on IPv4.
- `apps/api` has a small `package.json` (name and scripts only) so that it is a workspace turbo can run.
- `rooftop_core` and `rooftop_api` live in `apps/api/src`, installed editable with hatchling.
- Playwright tests are named `*.e2e.ts`, because `bun test` would otherwise pick up `*.spec.ts`.
- `bun check` also typechecks `tools/` and `e2e/` in its first step, and takes `--only=` and `--skip=`.
- `bun dev:bg` succeeds (exit code 0) when the stack is already running and healthy; `bun dev` in that case
  refuses with exit code 1. A port held by another program is always a refusal naming pid and command.
- The port check counts sockets that are bound but not listening yet; `python3 -m http.server` sits in that
  state for several seconds and blocked uvicorn while `lsof -sTCP:LISTEN` showed nothing.
- `bun stop` decides "ours" by command and working directory: Next in `apps/web` of this repo; uvicorn
  naming `rooftop_api`, or its reload worker (a Python multiprocessing child), in `apps/api` of this repo.
- turbo 2.11 writes an `AGENTS.md` into the repo root when it sees an AI agent. Switched off with
  `"agentGuidance": false` in `turbo.json`, and the generated file removed.
- starlette 1.7 warns that httpx with its TestClient is deprecated in favour of `httpx2`. httpx was kept as
  planned; the warning shows in the pytest output. To decide in phase 2.
- The minimal tokens in `apps/web/app/globals.css` (`canvas`, `ink`) are placeholders for phase 3.

### Ports and profiles (2026-09-29)

Why: a `bun check` or `bun dev:bg` run by an agent held 4700 and 4701, so the owner's `bun dev` was refused,
and the other way round. Decision D3 was reworded for this.

- Two profiles in `tools/lib/profiles.ts`, each with its own ports, pid file, logs and Next build directory:
  `dev` (web 4700, API 4701, `.dev/dev/`, `.next`) and `test` (web 4710, API 4711, `.dev/test/`,
  `.next-test`). `--profile test` or `ROOFTOP_PROFILE=test` selects; the flag wins.
- A preferred port held by another program is no longer a refusal. The stack takes the next pair of which
  both ports are free, stepping by two inside its range of ten (dev 4700 to 4709, test 4710 to 4719), names
  the holder and the ports used instead. It refuses only when all five pairs are taken.
- Still a refusal: our own stack of the same profile holds a port but does not answer as a whole stack
  (a leftover, or one that is still starting). The message names `bun stop` for that profile. It does not
  fall back in this case, because a second `next dev` on the same build directory would meet Next's lock.
- "Ours" is still decided by command and working directory; which profile a process belongs to follows
  from the range its port is in. `bun stop` looks for leftovers in the whole range of the profile.
- `bun stop` no longer fails because another program sits inside the range; it lists it and succeeds.
  It fails only when something of ours could not be stopped.
- `apps/web/next.config.ts` reads `ROOFTOP_API_PORT` (default 4701) and `ROOFTOP_DIST_DIR` (default
  `.next`). `apps/web/tsconfig.json` lists the type paths of `.next-test` next to those of `.next`; without
  them Next rewrites and reformats `tsconfig.json` on the first start of the test profile.
- Playwright always uses the test profile. The port is read from `.dev/test/pids.json` when a test begins
  (`e2e/fixtures.ts`), because it is not known yet when the configuration is read.
- The dev profile prints a note about the Esri key whenever its web port is not 4700. The env file is not
  read for this.
- The old files `.dev/pids.json`, `.dev/web.log` and `.dev/api.log` are still understood by `bun stop` and
  removed by it.
- Checked: dev stack up, then `bun check` green on 4710/4711 with the dev stack untouched; test stack up,
  then dev on 4700/4701; 4700 held by another program, dev on 4702/4703 with the rewrite working; 4711
  held, `bun check` green on 4712/4713; whole range held, refusal naming every holder; leftovers on a
  fallback pair stopped by `bun stop`.
- Not covered: two starts of the same profile at the same moment can pick the same pair; the second one
  fails at start and says why. CLAUDE.md was not changed in this step.

### CI, same day
- First CI run hung for over nine minutes in `playwright install --with-deps chromium`; it was cancelled.
- `check.yml` now runs `bun check --skip=e2e`. `e2e.yml` runs the browser tests, started by hand only, with the
  browser cached by the version of `@playwright/test`. `e2e.yml` has not been run yet.
