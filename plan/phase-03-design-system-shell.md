# Phase 3: design system and app shell

**Status:** in progress since 2026-09-29 (session 3). Built so far: PRs #24 to #29. What is built, what was
decided and what remains is under "As built, so far". **Depends on:** phase 0 approved, phase 1.

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
| Tokens, 223 of them, and Tailwind made of them | `apps/web/app/globals.css`, held equal to `docs/design/design-tokens.md` by `globals.test.ts` | #25 |
| Button, ButtonLink, IconButton, Icon | `apps/web/components/ui` | #26 |
| StatusMark, Card, Stat and Stats | `apps/web/components/ui` | #27 |
| Segmented, Switch | `apps/web/components/ui` | #28 |
| NumberField, Stepper | `apps/web/components/ui` | #29 |
| `/kit`, development only | `apps/web/app/kit`, `apps/web/components/kit` | #26 to #29 |
| Guard against raw values in components | `apps/web/components/tokens-only.test.ts` | #26 |
| Network guard for every browser test; baselines of the screens; axe | `e2e/fixtures.ts`, `e2e/screens.ts`, `e2e/baselines`, `e2e/tests/kit.e2e.ts` | #24, #26 |

Tests at the end of session 3: 537 pytest, 208 unit, 214 browser tests. `bun check` green.

### What has a design and is not built yet

Slider, RangeSlider, Sheet. The three stores. The data flow. The shell: top bar, workspace navigation,
project switcher (closed), save state ("Saved on this device"), Present and Export, the vitals with results
on the three sizes and before a system voltage on desktop, the cell of the notes. The routes with their
placeholders.

### What the two boards of round 4 draw, approved and not built yet

Approved by the owner on 2026-09-29 (decision D32). Their values are written down in
`docs/design/components.md`, "Round 4".

| Board | What it draws |
|---|---|
| `Controls2.dc.html` | Select (open), FileDrop, Dialog, Tooltip, Toast, Table, ProgressRing, Skeleton |
| `ShellStates.dc.html` | Vitals while updating, at the first load, after a failed run; vitals before a system voltage on tablet and phone; the drawer of notes; the project switcher, open; the states of saving |

### What has no design yet

Tabs. The owner keeps it in the phase (decision D33). It is drawn first, on a board of its own or on
"Controls, part 2", shown to the owner, and built after his approval.

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
