# Phase 3: design system and app shell

**Status:** in progress since 2026-09-29 (sessions 3 and 4). Built so far: PRs #24 to #32. What is built, what
was decided and what remains is under "As built, so far". How the rest is built: `phase-03-rest-plan.md`. **Depends on:** phase 0 approved, phase 1.

## Goal
The approved look exists as tokens and components, and the shell (navigation, vitals, responsive frames)
works on phone, tablet and desktop with the demo project loaded.

## Scope
- Tokens from `phase-00-design.md` as CSS variables in `app/globals.css`, mapped into Tailwind 4 with
  `@theme inline`. Theme switch by `data-theme`; only "dusk" is filled in.
- Fonts: Bricolage Grotesque, Geist, Geist Mono. Not through `next/font/google`, as first written here: from
  the repo (decision D27).
- Depth and motion as tokens (see the "Controls, depth and motion" board): three elevations (flat, raised,
  floating), raised buttons with a top highlight, recessed fields, focus ring, 160 ms hover and press,
  240 ms panels, reduced-motion fallback.
- Components (`apps/web/components/ui`), each keyboard-usable and labelled:
  Button, IconButton, Segmented, Switch, Slider, RangeSlider, NumberField (draft then commit, unit suffix),
  Stepper, Select, FileDrop, Card, Sheet (bottom sheet with drag handle), Dialog, Tooltip, Toast,
  StatusMark (tick or exclamation, no cross exists), Stat, Table, Tabs, Skeleton, ProgressRing.
- Shell: top bar, workspace nav (top on desktop and tablet, bottom tab bar on phone), project switcher,
  save state, Present and Export entry points, vitals bar in its three responsive forms, notes-to-review drawer.
- State: Zustand project store (the `.rtd` document), results store (last API response, status, progress),
  view store (lens, camera preset, sun time). Narrow selectors only.
- Data flow: a committed edit updates the project store, which schedules `/layout` at once and `/design`
  debounced; stale results stay visible and are marked as updating.
- Routes exist with placeholders: `/`, `/studio/[lens]`, `/performance`, `/handover/[item]`.
- A `/kit` page (development only) showing every component and state, used for visual checks.

## Acceptance
- Playwright: shell renders and navigates on 390, 834 and 1440; no horizontal scroll at any width from 360 up;
  screenshots of `/kit` and the shell compared against the mockups by eye and stored as baselines.
- Vitals show the demo numbers from the API.
- axe check: no serious or critical issues on the shell and `/kit`.

## Out of scope
3D, real lens content.

## As built, so far

### What exists

| Part | Where | Pull request |
|---|---|---|
| Fonts | `apps/web/app/fonts` | #24 |
| Tokens, 233 of them, and Tailwind made of them | `apps/web/app/globals.css`, held equal to `docs/design/design-tokens.md` by `globals.test.ts` | #25, #31, #32 |
| Numbers that code needs: times and gaps | `apps/web/components/ui/design-numbers.ts`, held equal to the same document by `design-numbers.test.ts` | #32 |
| Button, ButtonLink, IconButton, Icon | `apps/web/components/ui` | #26 |
| StatusMark, Card, Stat and Stats | `apps/web/components/ui` | #27 |
| Segmented, Switch | `apps/web/components/ui` | #28 |
| NumberField, Stepper | `apps/web/components/ui` | #29 |
| Slider, RangeSlider | `apps/web/components/ui`; `slider-steps.ts` | #31 |
| Sheet | `apps/web/components/ui`; `sheet-stops.ts` | #32 |
| ProgressRing, RunStep, Skeleton | `apps/web/components/ui`; `ring-arc.ts` | #32 |
| Tooltip, Toast, Toaster | `apps/web/components/ui`; `toast-queue.ts`, `place-floating.ts` | #32 |
| Select, FloatingPanel | `apps/web/components/ui`; `list-keys.ts`, `use-floating.ts` | #32 |
| Dialog, SheetGrip | `apps/web/components/ui` | #32 |
| FileDrop | `apps/web/components/ui`; `dropped-file.ts` | #32 |
| Table | `apps/web/components/ui`; `table-cells.ts` | #32 |
| Tabs | `apps/web/components/ui`; `choice-keys.ts` | #32 |
| The kit, development only: `/kit` and `/kit/part-2` | `apps/web/app/kit`, `apps/web/components/kit` | #26 to #32 |
| Guard against raw values in components, in `.ts` and `.tsx` | `apps/web/components/tokens-only.test.ts` | #26, #30, #31 |
| Network guard for every browser test; baselines of the screens; axe | `e2e/fixtures.ts`, `e2e/screens.ts`, `e2e/baselines`, `e2e/tests/kit.e2e.ts` | #24, #26 |

Tests at the end of session 4: 537 pytest, 346 unit, 611 browser tests. `bun check` green. At the end of
session 3 they were 537, 208 and 214.

### What has a design and is not built yet

The three stores. The data flow. The formats of the vitals. The routes with their placeholders. The shell:
top bar, workspace navigation, project switcher closed and open, the state of saving, Present and Export,
the vitals in every state on the three sizes, the drawer of notes. They are steps 10 to 16 of
`phase-03-rest-plan.md`.

### What has no design yet

Nothing of this phase. Tabs was drawn by session 4 and approved by the owner (decision D35).

### Decided while building, sessions 3 and 4

The decisions that have a number are in `plan/README.md` (D27 to D36). Those of a component are written
with the component in `docs/design/components.md`, under "In code". Those that hold for all that follows:

| Decision | Why |
|---|---|
| The only inline style is `measures()`: a share or a place that follows the data | A place cannot be a class; a size, a colour or a shadow stays a token |
| A line wider than 1 px is a token; the guard refuses one given as a number | The handle of a slider was the first |
| What floats is in the top layer of the browser; the toasts are in `z-toast` | The inspector scrolls; a live region must be in the page before it speaks |
| On phone and tablet what opens is a bottom sheet, the same element laid out by the breakpoint | One component, not two |
| Numbers that code needs are in `design-numbers.ts` and in the token document | A store without React reads no stylesheet |
| The kit has pages | One page would be 20 screens high on phone |

### Deviations from the scope as written

| Scope | As built | Why |
|---|---|---|
| Fonts through `next/font/google` | From the repo, with `next/font/local` | Tests never touch the network; a build must not depend on it (D27) |
| Tokens from `phase-00-design.md` | From `docs/design/design-tokens.md`, made exact first | It is the document of the tokens; the phase file has a summary |
| "NumberField (draft then commit, unit suffix)" | Also: what happens outside the range and with no number | It had no design; decided and written into `components.md` |

### Found on the way

- A type style for desktop sets a weight and comes after `font-medium`. Say the weight again for desktop.
- Do not `git stash` while the test stack runs. If the kit loses its styles, stop the stack and delete
  `apps/web/.next-test`.
- `next build` writes into `apps/web/tsconfig.json` when it is given another build directory. Undo it.
- More of the kind, found by session 4: `plan/sessions/004/record.md`, "What was tried and dropped".
