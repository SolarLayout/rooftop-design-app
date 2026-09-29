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
  check.
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

## Commands
| Command | Use |
|---|---|
| `bun dev` | Start web and API in the terminal |
| `bun dev:bg --profile test` | Start the test stack in the background (agents and tests) |
| `bun stop` | Stop the dev stack (`--profile test` for the test stack, `--all` for both) |
| `bun status` | Both stacks, their real ports, and anything else in their ranges |
| `bun check` | Every check, in order, stopping at the first failure |
| `bun gen:api` | Regenerate `packages/api-types` from the API |
