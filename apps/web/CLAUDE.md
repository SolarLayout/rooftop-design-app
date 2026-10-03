# apps/web: Claude Code context

The browser app. Read the root `CLAUDE.md` first; its rules apply here.

## The design is approved. Build to it.

| What | Where |
|---|---|
| Design canvas (the owner's approved mockups) | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy |
| Design system index, screen list, rules | `docs/design/README.md` |
| Routes, what lives where, responsive structure | `docs/design/information-architecture.md` |
| Tokens: colour, type, spacing, radius, elevation, motion, 3D palette | `docs/design/design-tokens.md` |
| Components: anatomy, sizes, states | `docs/design/components.md` |
| UX and visual guidelines, copy, numbers, states, accessibility | `docs/design/guidelines.md` |
| Mockup sources with every exact value | `docs/design/mockups/*.dc.html` |
| Previews | `docs/design/previews/*.png` |

The canvas is open to anyone with the link. The mockup sources and previews in the repo show the same
screens, and hold the exact values.

## Before you write UI code
1. Find the screen in `docs/design/README.md`. Open its preview and its mockup source.
2. If the screen or the state has no mockup, stop: design it first and get the owner's approval.
3. Read the parts of `components.md` and `guidelines.md` that apply.

## Rules
1. Tokens only. No raw colour, size, radius, shadow or duration in a component. A missing value becomes a
   token in `docs/design/design-tokens.md` and `app/globals.css` first.
2. Reuse the components in `components/ui`. A new pattern goes into `docs/design/components.md` with its
   states before it is used a second time.
3. Phone (390), tablet (834) and desktop (1440) are each laid out for themselves. Touch targets are 44 px or
   more. No horizontal page scroll.
4. No red, no cross. Tick or exclamation mark with the reason.
5. System voltage is never preselected.
6. Test first. Logic is tested with `bun test`; screens with Playwright on the three sizes, including a
   screenshot compared with the preview.
   The browser tests are in groups keyed on what they can see (`docs/checks.md`): a new suite is placed by
   its name, a part two workspaces share lives in `components/shell`, and `bun run e2e:<group>` runs one group
   before the check.
7. Attach a screenshot of each changed screen, at each size, to the pull request.
8. The 3D canvas is loaded with `next/dynamic` and `ssr: false`. Read `plan/reference/r3f-notes.md` before 3D work.
