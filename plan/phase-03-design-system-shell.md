# Phase 3: design system and app shell

**Status:** done, 2026-09-30 (sessions 3 to 5, PRs #24 to #33). What is built, what was decided and what was
found is under "As built". How its second half was built: `phase-03-rest-plan.md`. **Depends on:** phase 0
approved, phase 1.

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

## As built

### What exists

| Part | Where | Pull request |
|---|---|---|
| Fonts | `apps/web/app/fonts` | #24 |
| Tokens, 251 of them, and Tailwind made of them | `apps/web/app/globals.css`, held equal to `docs/design/design-tokens.md` by `globals.test.ts` | #25, #31, #32, #33 |
| Numbers that code needs: times and gaps | `apps/web/components/ui/design-numbers.ts`, held equal to the same document by `design-numbers.test.ts` | #32, #33 |
| Button, ButtonLink, IconButton, Icon | `apps/web/components/ui` | #26 |
| StatusMark, Card, Stat and Stats | `apps/web/components/ui` | #27, #33 |
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
| The kit, development only: `/kit`, `/kit/part-2`, `/kit/shell` | `apps/web/app/kit`, `apps/web/components/kit` | #26 to #33 |
| Guard against raw values in components, in `.ts` and `.tsx` | `apps/web/components/tokens-only.test.ts` | #26, #30, #31 |
| Network guard for every browser test; baselines of the screens; axe | `e2e/fixtures.ts`, `e2e/screens.ts`, `e2e/baselines`, `e2e/tests/kit.e2e.ts` | #24, #26 |
| Stores without React: the project, the results, the view | `apps/web/lib/stores` | #33 |
| Data flow: what follows a committed edit; opening the demo | `apps/web/lib/flow/design-flow.ts`; the clock in `apps/web/lib/clock.ts` | #33 |
| Formats: the quantities of the vitals, the place of a design | `apps/web/lib/format` | #33 |
| Workspaces, lenses, items of Handover, and their addresses | `apps/web/lib/routes.ts` | #33 |
| Routes with placeholders: `/studio/[lens]`, `/performance`, `/handover/[item]` | `apps/web/app/(workspaces)` | #33 |
| Shell: TopBar, WorkspaceNav and TabBar, LensNav, ProjectSwitcher, SaveState, Present and Export, Vitals, NotesDrawer; Shell and Studio, which put them together | `apps/web/components/shell` | #33 |
| What the vitals show, and the notes to review, as pure functions | `apps/web/components/shell/vitals-view.ts`, `notes-view.ts` | #33 |
| The stores for React | `apps/web/components/shell/stores.tsx` | #33 |

Tests at the end of session 5: 537 pytest, 546 unit, 1,025 browser tests. `bun check` green. At the end of
session 4 they were 537, 346 and 611; at the end of session 3, 537, 208 and 214.

### Acceptance

| Asked | Met by |
|---|---|
| The shell renders and navigates on 390, 834 and 1440 | `e2e/tests/shell.e2e.ts`: the three workspaces render; workspace to workspace, lens to lens, Export, Home, the back of the browser, a note to its place |
| No horizontal scroll at any width from 360 up | The same file, at 360, 390, 640, 834, 1100, 1101 and 1440, on the three workspaces and before a system voltage; `kit.e2e.ts` for the three pages of the kit, at 360 and at the width of each size |
| Screenshots of `/kit` and the shell compared against the mockups by eye and stored as baselines | `e2e/baselines/darwin/<size>`: `kit`, `kit-part-2`, `kit-shell`, `studio`, `studio-before-a-voltage`, `studio-notes`, `studio-project-switcher`, `performance`, `handover`, `home`. Each was looked at beside its preview before it was stored |
| Vitals show the demo numbers from the API | `e2e/tests/shell-vitals.e2e.ts`, against the API of the test stack: 617.8 MWh, 357.28 kWp, 275 kW, DC/AC 1.30, 638 of 790, PR 86.6 %, 1,729 kWh/kWp; before a system voltage 3,600 m2, 790 modules, 442.40 kWp and the words of the API |
| axe: no serious or critical issues on the shell and `/kit` | `shell.e2e.ts` on the three workspaces, before a system voltage, with the notes open, with the project switcher open; `kit.e2e.ts` on the three pages of the kit |

### What has a design and is not built

Of this phase, nothing. What belongs to the stage of the Studio and is drawn on its mockups comes with the
stage: the Layers button of the rail, the view controls, the time control (Phases 5 and 6).

### Decided while building, sessions 3 to 5

The decisions that have a number are in `plan/README.md` (D27 to D39). Those of a component are written
with the component in `docs/design/components.md`, under "In code". Those that hold for all that follows:

| Decision | Why |
|---|---|
| The only inline style is `measures()`: a share or a place that follows the data | A place cannot be a class; a size, a colour or a shadow stays a token |
| A line wider than 1 px is a token; the guard refuses one given as a number | The handle of a slider was the first |
| What floats is in the top layer of the browser; the toasts are in `z-toast` | The inspector scrolls; a live region must be in the page before it speaks |
| On phone and tablet what opens is a bottom sheet, the same element laid out by the breakpoint | One component, not two |
| Numbers that code needs are in `design-numbers.ts` and in the token document | A store without React reads no stylesheet |
| The kit has pages | One page would be 20 screens high on phone |
| A store is made by a function and is read by selectors with a name, each giving one value or one object that the store holds | A test has its own store; a component renders anew only when its value changed |
| What a screen shows is made by a pure function of the results (`vitalsOf`, `notesOf`); the component draws it | The states are tested without a browser, and the kit shows them without a server |
| No rule of the engine is written a second time in the web app: a note is there because the API gave it, and what is waited for is said in the words of the API (D37) | One place for a rule |
| A place with an address is a link, also where it looks like a segmented control | The back of the browser, a link that can be shared, `aria-current` |
| What comes with a later phase is shown and cannot be used: `aria-disabled`, dimmed, it takes the focus and says why | The owner asked for it for Present; the actions of the project switcher follow |
| A clock is given to what waits (`lib/clock.ts`) | A test lets the time pass when it says so |

### Deviations from the scope as written

| Scope | As built | Why |
|---|---|---|
| Fonts through `next/font/google` | From the repo, with `next/font/local` | Tests never touch the network; a build must not depend on it (D27) |
| Tokens from `phase-00-design.md` | From `docs/design/design-tokens.md`, made exact first | It is the document of the tokens; the phase file has a summary |
| "NumberField (draft then commit, unit suffix)" | Also: what happens outside the range and with no number | It had no design; decided and written into `components.md` |
| "vitals bar in its three responsive forms", on every workspace (`information-architecture.md`) | In the Studio only | The mockups of Performance and Handover draw none (D38) |
| "results store (last API response, status, progress)" | Also: the edit a result belongs to, and what failed | A late answer must never replace a newer one |
| "schedules `/layout` at once and `/design` debounced" | Also: a design that is opened runs at once; "Try again"; opening the demo | Nobody edits what was just opened; a failure must be answerable |
| Three sizes | Two widths inside them, 820 and 1360, for the top bar alone | At 640 and 1101 the top bar of the mockups has no room for the name of the design (D39) |
| The boards "Shell states" and "Strings lens, no system voltage yet" | The words of the API in the place of theirs | Decision D37; the boards were corrected |

### Found on the way

- A type style for desktop sets a weight and comes after `font-medium`. Say the weight again for desktop.
- Do not `git stash` while the test stack runs. If the kit loses its styles, stop the stack and delete
  `apps/web/.next-test`.
- `next build` writes into `apps/web/tsconfig.json` when it is given another build directory. Undo it.
- After pages were moved, `next typegen` of the check kept the types of the old places
  (`.next-test/dev/types/validator.ts`). Stop the test stack, delete `apps/web/.next-test`, start it again.
- A `header` inside `main` is no banner, and a `dl` with `display: contents` keeps its cells in the grid of
  what is around it.
- Two utilities of the same weight: the later one in the stylesheet wins, not the later one in the class.
  A colour that must win goes on an element of its own.
- A browser reports a line of 1.5 px as 1 px. Test the token.
- `git mv` stages. A commit of documents made after it takes the moved files along: look at
  `git status` before a commit of documents.
- More of the kind: `plan/sessions/004/record.md` and `plan/sessions/005/record.md`, "What was tried and
  dropped".
