# Phase 2: engine and stateless API

**Status:** not started. **Depends on:** phase 1.

## Goal
Every calculation of the desktop app is reachable over HTTP, with the same numbers, and no server state.

## Scope
- Copy `rooftop_core` and `samples/` from `../rooftop-design` (commit `bf2cb67`) into `apps/api/src/rooftop_core`.
  Each file keeps a header naming its source. No import from, or path to, the old repo.
- Copy the engine tests; they must pass unchanged.
- Engine changes needed for the web (keep them small, each with a test):
  - `read_pan`, `read_ond`, `read_kmz`, `read_dxf`, CSV weather: accept text or bytes, not only a path.
  - Weather download cache moves from `~/.rooftop_design` to an in-process cache; tests stay offline.
  - Progress callback on `Design.prepare()` and `run_options()`.
  - Export writers return bytes.
- `.rtd` format 2: embeds PAN, OND and CSV text. Format 1 opens; absolute paths in it are reported as
  "file not included, choose it again".
- Fix while here (found by the inventory, see section 7 there): saved overrides restored on open;
  cable label follows the system voltage; PDF cable schedule paginates instead of stopping at 28 strings.

## Endpoints (all POST bodies carry the whole project; nothing is remembered between calls)

| Method and path | Returns | Typical time |
|---|---|---|
| `GET /health` | version | |
| `GET /demo` | the Pune demo project | |
| `POST /equipment/module`, `/equipment/inverter` | parsed PAN / OND fields, derived coefficients, notes | ms |
| `POST /roof/import` | roof outline, obstacles, heights that were missing | ms |
| `POST /layout` | modules (footprint, row, tilt, z), keep-out polygons with the obstacle that causes each, usable area, pitch, GCR, profile angle | 50 ms |
| `POST /sun` | sun positions for a day; shadow polygons for a time | ms |
| `POST /weather` | 8,760 h weather, horizon, summary | network |
| `POST /design` (SSE) | progress events, then layout + shading summary + series range + options with full results | about 10 s |
| `POST /export/{pdf,dxf,kmz,csv,sld}` | file bytes | 1 to 3 s |

- Pydantic models mirror the dataclasses. OpenAPI is the source for `packages/api-types` (`bun gen:api`).
- Memoisation per D6: LRU keyed by a hash of the inputs each stage depends on (layout, weather, shading).
- Errors: 422 with a field path for bad input; engine messages pass through verbatim (they are user-facing).

## Deliverables
- API with tests; `packages/api-types` generated and used by a typed client in `apps/web/lib/api`.
- `reference/demo-numbers.md` values asserted in an API test.

## Acceptance
- `pytest` green, no network. import-linter: `rooftop_core` imports neither FastAPI nor any web code.
- `/design` on the demo returns option A = 29 x 22 x 1, 357.28 kWp, 617.8 MWh, PR 86.6 %.
- Without `system_voltage` the response has the layout and shading, no options, and the reason.
- Two identical requests to a freshly started server give identical results.

## Out of scope
UI. Multi-user concerns. Persistence.
