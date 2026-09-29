# SolarLayout Rooftop

Rooftop PV design in the browser. A Next.js front end and a stateless Python API, in one repo.

| Part | What | Port |
|---|---|---|
| `apps/web` | Next.js (App Router), React, Tailwind | 4700 (tests: 4710) |
| `apps/api` | FastAPI on uvicorn: `rooftop_api` (HTTP) and `rooftop_core` (engine) | 4701 (tests: 4711) |
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

`bun dev` prints two addresses when both answer, normally:

- web: http://localhost:4700
- API: http://127.0.0.1:4701/health

The browser only talks to the web address. Next forwards `/api/*` to the API, so
`http://localhost:4700/api/health` is the same health check.

## Ports and profiles

The stack runs in one of two profiles. They share nothing, so your `bun dev` and a test run (or an agent)
can be up at the same time.

| Profile | Used by | Preferred ports | Falls back to | Pid file and logs | Next build directory |
|---|---|---|---|---|---|
| `dev` | `bun dev`, `bun dev:bg`, `bun stop`, `bun status` | web 4700, API 4701 | 4702/4703, 4704/4705, 4706/4707, 4708/4709 | `.dev/dev/` | `apps/web/.next` |
| `test` | Playwright, and so `bun check`; agents | web 4710, API 4711 | 4712/4713, 4714/4715, 4716/4717, 4718/4719 | `.dev/test/` | `apps/web/.next-test` |

- Choose the profile with `--profile test` (`bun dev:bg --profile test`, `bun stop --profile test`) or with
  `ROOFTOP_PROFILE=test`. The flag wins. `bun stop --all` stops both. `bun status` always shows both.
- When another program holds a preferred port, the stack does not refuse: it names the program (pid and
  command), leaves it alone, and takes the next pair of which both ports are free. It refuses only when all
  five pairs of its range are taken, and then names every holder.
- The ports in use are printed at the start and written to `pids.json` of the profile (`ports.web`,
  `ports.api`). The web app learns them through `ROOFTOP_API_PORT` and `ROOFTOP_DIST_DIR`
  (`apps/web/next.config.ts`); without them it uses 4701 and `.next`.
- When the stack of the profile is already running, `bun dev:bg` says so, prints its addresses and
  succeeds; `bun dev` says so and tells how to stop it.
- The satellite map needs port 4700. The Esri key only accepts `http://localhost:4700` and
  `http://127.0.0.1:4700` as referrers. When the dev profile lands on another web port it prints a note:
  the map is refused there until 4700 is free again, or until the new address is added to the key's
  referrers in the Esri portal.

## More commands

| Command | What it does |
|---|---|
| `bun dev:bg` | Starts both in the background, waits until they answer, prints the addresses and returns. Logs go to `.dev/dev/web.log` and `.dev/dev/api.log`. When the stack is already running it says so and succeeds |
| `bun dev:bg --profile test` | The same for the test profile; logs in `.dev/test/`. This is the one for agents and scripts |
| `bun stop --profile test`, `bun stop --all` | Stops the test profile, or both |
| `bun status` | Shows both profiles: the ports in use, the processes, and other programs inside the two ranges |
| `bun gen:api` | Writes `packages/api-types/openapi.json` and `src/index.ts` from the API, without starting a server. Run it after every change to the API's routes or models, and commit the result |
| `bun check --only=pytest,unit` | Runs some steps. Ids: `typecheck`, `eslint`, `ruff`, `imports`, `pytest`, `unit`, `e2e` |
| `bun check --skip=e2e` | Runs everything but some steps |
| `bun run build` | Production build of the web app, through turbo |

## When a port is taken

See "Ports and profiles": the stack moves to the next free pair and says so. `bun stop` only ever stops
processes of this stack, anywhere in the range of the profile, including leftovers of a crashed run;
another program on a port is named and left alone.

## Tests

- Tests never touch the network. The Python tests block every connection that leaves this machine
  (`apps/api/tests/conftest.py`); the Playwright tests stop and report any request to another host.
- Unit tests in TypeScript are `*.test.ts` (run by `bun test`). Playwright tests are `*.e2e.ts`.
- The Playwright tests always run against the test profile, never against your `bun dev`. They start it
  when it is not running, and stop it afterwards only in that case.
- Playwright is pinned to 1.52.0. Install its browser once with `cd e2e && bun x playwright install chromium`.
