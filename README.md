# SolarLayout Rooftop

Rooftop PV design in the browser. A Next.js front end and a stateless Python API, in one repo.

| Part | What | Port |
|---|---|---|
| `apps/web` | Next.js (App Router), React, Tailwind | 4700 |
| `apps/api` | FastAPI on uvicorn: `rooftop_api` (HTTP) and `rooftop_core` (engine) | 4701 |
| `packages/api-types` | TypeScript types generated from the API's OpenAPI document | |
| `e2e` | Playwright tests on phone, tablet and desktop | |
| `tools` | `dev.ts`, `check.ts`, `gen-api.ts` | |
| `plan` | The build plan, one file per phase | |

## Prerequisites

| Tool | Version | Note |
|---|---|---|
| [bun](https://bun.sh) | 1.3.14 | The only package manager and script runner here |
| Node.js | 26.10.0 (`.nvmrc`); 20.9 or newer works | Next.js runs on Node, never on the bun runtime |
| [uv](https://docs.astral.sh/uv/) | any recent | Manages Python and the API's packages |
| Python | 3.12 (`.python-version`) | uv installs it when it is missing |

Node does not have to be on your `PATH`. The tools look for it on `PATH` and in the usual places of
Homebrew, nvm, fnm, volta, mise and asdf, and take the one closest to `.nvmrc`. To name one yourself, set
`ROOFTOP_NODE` to the full path of a `node` binary.

## Set up

```sh
bun install
cd apps/api && uv sync
cp apps/web/.env.example apps/web/.env.local   # then fill in; .env.local is never committed
```

## The three commands

```sh
bun dev      # start web and API in this terminal; Ctrl+C stops both
bun stop     # stop both, including leftovers of a crashed run
bun check    # typecheck, eslint, ruff, import-linter, pytest, bun test, Playwright smoke test
```

`bun dev` prints two addresses when both answer:

- web: http://localhost:4700
- API: http://127.0.0.1:4701/health

The browser only talks to the web address. Next forwards `/api/*` to the API, so
`http://localhost:4700/api/health` is the same health check.

## More commands

| Command | What it does |
|---|---|
| `bun dev:bg` | Starts both in the background, waits until they answer, prints the addresses and returns. Logs go to `.dev/web.log` and `.dev/api.log`. When the stack is already running it says so and succeeds |
| `bun status` | Shows what holds ports 4700 and 4701 |
| `bun gen:api` | Writes `packages/api-types/openapi.json` and `src/index.ts` from the API, without starting a server. Run it after every change to the API's routes or models, and commit the result |
| `bun check --only=pytest,unit` | Runs some steps. Ids: `typecheck`, `eslint`, `ruff`, `imports`, `pytest`, `unit`, `e2e` |
| `bun check --skip=e2e` | Runs everything but some steps |
| `bun run build` | Production build of the web app, through turbo |

## When a port is taken

`bun dev` refuses to start when 4700 or 4701 is in use, and names the process (pid and command) that
holds it. `bun stop` only ever stops processes of this stack; another program on the port is named and
left alone.

## Tests

- Tests never touch the network. The Python tests block every connection that leaves this machine
  (`apps/api/tests/conftest.py`); the Playwright tests stop and report any request to another host.
- Unit tests in TypeScript are `*.test.ts` (run by `bun test`). Playwright tests are `*.e2e.ts`.
- The Playwright tests start the stack when it is not running, and stop it afterwards only in that case.
- Playwright is pinned to 1.52.0. Install its browser once with `cd e2e && bun x playwright install chromium`.
