# Phase 3: design system and app shell

**Status:** not started. **Depends on:** phase 0 approved, phase 1.

## Goal
The approved look exists as tokens and components, and the shell (navigation, vitals, responsive frames)
works on phone, tablet and desktop with the demo project loaded.

## Scope
- Tokens from `phase-00-design.md` as CSS variables in `app/globals.css`, mapped into Tailwind 4 with
  `@theme inline`. Theme switch by `data-theme`; only "dusk" is filled in.
- Fonts through `next/font/google`: Bricolage Grotesque, Geist, Geist Mono.
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
