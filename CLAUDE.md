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

## Working rules
- Next.js runs on Node, never on the bun runtime (never `bun --bun next`). Tools find Node through
  `tools/lib/node.ts`; run Node tools with `bun tools/with-node.ts <tool>`.
- Ports: web 4700, API 4701. The browser reaches the API only through the Next rewrite `/api/*`.
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
| `bun dev:bg` | Start both in the background and return when they answer (for agents and tests) |
| `bun stop` | Stop both |
| `bun status` | What holds the two ports |
| `bun check` | Every check, in order, stopping at the first failure |
| `bun gen:api` | Regenerate `packages/api-types` from the API |
