# SolarLayout Rooftop (web): Claude Code context

A rooftop PV design app for the browser: Next.js front end (`apps/web`), stateless Python API
(`apps/api`, packages `rooftop_api` and `rooftop_core`). The plan is in `plan/`; read `plan/README.md`
first, then the first phase that is not done. Ask the owner domain questions one at a time.

## Hard rules
1. The engine package `rooftop_core` never imports a web or API framework (fastapi, starlette, uvicorn),
   `rooftop_api`, or any UI code. import-linter enforces it (`apps/api/pyproject.toml`). Engine code must
   run headless.
2. Local roof metres: x east, y north, z up. WGS84 only at the edges.
3. System voltage has no default and is never chosen for the user. Results that need it wait and say so.
4. A result that does not fit shows a tick or an exclamation mark, never a red cross.
5. The word "bankable" is never used, anywhere in the product.
6. Tests never touch the network. Python tests are guarded by `apps/api/tests/conftest.py`; Playwright
   tests stop and report any request that leaves this machine.
7. bun only. Never npm, npx, yarn or pnpm, in scripts or in docs. Use `bun x <tool>` where a runner is needed.
8. Run `bun check` before every commit.
9. Style only through design tokens (`apps/web/app/globals.css`). No raw colour, size or shadow value in
   a component.

## Start here
Read `plan/STATE.md` first: it says where the work stands and what is next. `plan/SESSIONS.md` says how a
session starts, works and ends. Update `plan/STATE.md` before you stop. Resume prompts are in
`plan/resume/`; write a new one only when the owner asks.

## Working with the owner
- Be brief. No chatter.
- Decide small and medium things yourself and say what you decided. Ask only for major decisions, one
  question at a time.
- Build in logical parts and show each one. No long silent stretches.
- Verify your own work before showing it: run it, test it, look at it. Report what you ran and what you
  did not.
- You may commit, push and merge pull requests in this repo once the check is green. Code never goes to
  `main` directly.
- A change to documents only (`plan/`, `docs/`, `README.md`, `CLAUDE.md`) is committed and pushed to `main`
  directly, without a pull request (decision D26). Never mixed with code in one commit.
- Decisions marked closed in `plan/STATE.md` are not reopened.
- For setup the owner must do himself (accounts, keys), give him one step at a time and check each
  result before the next.

## Design
The design is approved and is the specification for every screen. Read `docs/design/README.md` before any UI
work, and `apps/web/CLAUDE.md` for the rules of the web app.
- Design canvas: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open to anyone with the link)
- In the repo: `docs/design/` holds the information architecture, the tokens, the components, the UX and
  visual guidelines, the mockup sources and their previews.
- A screen or state without a mockup is designed and approved first, then built.

## Engineering standard
This is production software, not a prototype. The owner's words: "this is not throwaway code".
- Test-driven: write the failing test first, make it pass, then tidy. No behaviour lands without a test
  that would fail without it. A bug fix starts with the test that reproduces it.
- Small units with one job, named for what they do. Pure logic apart from I/O, so it can be tested
  without a server, a browser or the network.
- Types at every boundary: Pydantic models in the API, generated types in the web app. No `any`, no
  untyped dict passed across a module boundary.
- Errors are handled where they can be acted on, and say what happened and what to do. Nothing is
  swallowed.
- No dead code, no commented-out code, no TODO without an entry in the plan.
- One change per pull request, described by what it does and how it was checked. Merge only on a green
  check. Documents alone need no pull request (decision D26).
- Browser tests run locally in `bun check`. In CI they live in the `e2e` workflow, started by hand.

## Working rules
- Next.js runs on Node, never on the bun runtime (never `bun --bun next`). Tools find Node through
  `tools/lib/node.ts`; run Node tools with `bun tools/with-node.ts <tool>`.
- Ports: dev profile web 4700, API 4701; test profile web 4710, API 4711. Each falls back to the next
  free pair in its range of ten (4700 to 4709, 4710 to 4719). The browser reaches the API only through
  the Next rewrite `/api/*`. Never hard-code a port: read `ports` from `.dev/<profile>/pids.json`.
- Agents and tests use the test profile: `bun dev:bg --profile test`, `bun stop --profile test`. Never
  start or stop the dev profile, so the owner's `bun dev` is never blocked or stopped.
- `reactStrictMode` stays `false` in `apps/web/next.config.ts` (see `plan/reference/r3f-notes.md`, fix 1).
- Versions are pinned exactly (decision D4 in `plan/README.md`). React stays below 19.3; TypeScript on 5.x.
- After a change to the API's routes or models: `bun gen:api`, and commit `packages/api-types`.
- Never read, print or commit `apps/web/.env.local`. New settings go into `apps/web/.env.example`
  without values.
- Unit tests are `*.test.ts` (bun test). Playwright tests are `*.e2e.ts` in `e2e/tests`.
- The check's steps are turbo tasks (`turbo.json`), keyed on their inputs, the lockfile and the toolchain
  (`ROOFTOP_TOOLCHAIN`, set by the check). The cache is `.turbo/`, never committed. A change to the check's own
  code (`tools/check.ts`, `tools/check/**`) runs everything. The proofs of the caching run last, in a worktree
  under the system's temporary directory, never in the working tree.
- Inside the pytest step, pytest-testmon runs only the tests whose code changed (`tools/check/pytest-selected.ts`);
  its data is `apps/api/.testmondata`, with a key beside it over what testmon does not track (the data files,
  `pyproject.toml`, `uv.lock`, the Python version, the platform). A different key deletes the data and runs the
  suite whole. The numbers of the engine (`tests/engine/test_demo_numbers.py`) run in every pytest run as a
  sentinel (`tests/always_run.py`). A comment alone changes nothing: testmon reads the syntax tree. In `apps/api`,
  `bun run test -- tests/api` runs a part with the selection, `bun run test:all` the whole suite without it.

## Commands
| Command | Use |
|---|---|
| `bun dev` | Start web and API in the terminal |
| `bun dev:bg --profile test` | Start the test stack in the background (agents and tests) |
| `bun stop` | Stop the dev stack (`--profile test` for the test stack, `--all` for both) |
| `bun status` | Both stacks, their real ports, and anything else in their ranges |
| `bun check` | Every check, in order, stopping at the first failure. A step whose inputs have not changed since it was last green is skipped, and the summary says so |
| `bun check --fresh` | Every check, ignoring the caches and rebuilding them |
| `bun gen:api` | Regenerate `packages/api-types` from the API |
