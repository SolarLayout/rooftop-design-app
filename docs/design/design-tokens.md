# Design tokens

The values of the approved mockups, named. Phase 3 implements them as CSS variables in
`apps/web/app/globals.css` (mapped into Tailwind 4 with `@theme inline`) and, for the 3D scene, as a TypeScript
palette. Components use the names, never the values.

Theme: "Dusk" (dark) is the only theme filled in. Names are theme-neutral so a light theme is a second set of
values.

## Colour: surfaces and lines

| Token | Value | Use |
|---|---|---|
| `--color-ground` | `#0B0E13` | Page and 3D stage background |
| `--color-chrome` | `#0E1218` | Top bar, lens rail, inspector, bottom sheet, tab bar |
| `--color-surface-1` | `#12161D` | Cards, floating panels, list rows |
| `--color-surface-2` | `#181D26` | Tiles inside a card, selected list row |
| `--color-control` | `#151A22` | Raised secondary buttons |
| `--color-control-active` | `#232A36` | Active segment, active lens, active workspace |
| `--color-well` | `#090C10` | Recessed fields, segmented control track, slider track |
| `--color-line-subtle` | `#1C222C` | Dividers inside chrome |
| `--color-line` | `#232A36` | Card and control borders |
| `--color-line-strong` | `#2F3847` | Borders of secondary buttons and inputs, off switch |

## Colour: text

| Token | Value | Use | Contrast on surface-1 |
|---|---|---|---|
| `--color-text` | `#F2F4F7` | Primary text, values | 16.5:1 |
| `--color-text-2` | `#A9B2C0` | Labels, units, secondary text | 8.5:1 |
| `--color-text-3` | `#7C8696` | Hints, section labels, axis ticks | 4.9:1 (4.6:1 on surface-2, the lowest) |
| `--color-text-on-imagery` | `#D5DAE2` | Secondary text over the satellite ground, with a text shadow | |

## Colour: accent and status

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `#FFB020` | Primary action, selection, the sun, focus ring, active lens icon |
| `--color-accent-hover` | `#FFBE47` | Primary button, hover |
| `--color-accent-pressed` | `#E99C12` | Primary button, pressed |
| `--color-accent-ink` | `#1A1204` | Text and icons on accent (10.1:1) |
| `--color-note-surface` | `#1E1A10` | Background of a note or of a selected card |
| `--color-note-line` | `#3A3220` | Border of a note |
| `--color-ok` | `#3DD6A0` | Tick, saved dot, feasible band |

There is no error red. A result that does not fit is a note: exclamation mark in a circle, accent colour, with
the reason.

## Colour: data

| Token | Value | Use |
|---|---|---|
| `--color-data-gain` | `#3987E5` | Gains in the loss chain; single-series bars and lines |
| `--color-data-loss` | `#D95926` | Losses in the loss chain |
| `--color-data-zero` | `#7C8696` | A step of zero |
| `--color-series-1` to `--color-series-6` | `#3987E5`, `#D95926`, `#199E70`, `#C98500`, `#D55181`, `#008300` | Categories in this fixed order: MPPT 1 to 6, inverters |
| `--color-series-unused` | `#8C93A0` | Positions not used |

Text never takes a series colour. A coloured mark beside the text carries identity.

## Colour: paper (report preview)

| Token | Value |
|---|---|
| `--color-paper` | `#FBFAF7` |
| `--color-paper-ink` | `#15171A` |
| `--color-paper-muted` | `#4A4F57` |
| `--color-paper-line` | `#DDD9CF` |

## 3D scene palette (TypeScript, `apps/web/lib/scene-palette.ts`)

| Name | Value | Use |
|---|---|---|
| `roof` | `#D3D6DB` | Roof surface |
| `parapetCap` | `#ECEEF0` | Top of the parapet |
| `parapetLit` / `parapetShade` | `#B9BEC6` / `#8E95A0` | Inner faces of the parapet |
| `wallLit` / `wallShade` | `#4A5262` / `#2E3440` | Building walls |
| `obstacleTop` / `obstacleLit` / `obstacleShade` | `#F1F2F4` / `#C2C7CF` / `#868D99` | Obstacles |
| `moduleGlass` | `#16294D` | Module |
| `moduleCellLine` / `moduleFrame` | `#2A4675` / `#33558C` | Module detail |
| `moduleUnused` | `#8C93A0` | Position not used |
| `shadow` | `#0B1220` at 36 to 40 % | Overlay shadows; real cast shadows are tuned to read the same |
| `keepOutFill` / `keepOutLine` | accent at 18 % / accent, dashed | Kept-clear zones |
| `selection` | accent (white for a selected string) | Outline of the selected object |
| `gridLine` | `#1B222D` | Ground grid |
| `sun` / `sunCore` | `#FFB020` / `#FFD36B` | Sun marker and path |

## Typography

| Family | Weights | Use |
|---|---|---|
| Bricolage Grotesque | 600 | Display: page titles, lens titles, hero numbers |
| Geist | 400, 500, 600 | Everything else |
| Geist Mono | 400, 500 | Numbers, coordinates, file names, axis ticks |

Loaded with `next/font/google`. Fallbacks: `system-ui, sans-serif` and `ui-monospace, monospace`.

| Token | Family, weight | Size / line | Tracking | Use |
|---|---|---|---|---|
| `text-hero` | Bricolage 600 | 72 / 74 | -0.035em | Home headline |
| `text-number-hero` | Bricolage 600 | 76 / 80 | -0.03em | Energy on Performance |
| `text-page` | Bricolage 600 | 30 / 36 | -0.02em | Page title (44 / 48 on the IA and kit boards) |
| `text-lens` | Bricolage 600 | 26 / 32 | -0.02em | Lens title, panel title (22 / 28 on phone) |
| `text-number-tile` | Bricolage 600 | 34 / 38 | -0.02em | KPI tiles |
| `text-number-vital` | Bricolage 600 | 26 / 30 | -0.02em | Energy in the vitals bar (22 / 26 on phone) |
| `text-title` | Geist 600 | 16 / 22 | 0 | Card titles |
| `text-body` | Geist 400 | 14 / 20 | 0 | Body on desktop |
| `text-body-touch` | Geist 400 | 15 / 20 | 0 | Body on phone and tablet |
| `text-strong` | Geist 500 or 600 | as body | 0 | Emphasis, button labels |
| `text-small` | Geist 400 | 13 / 18 | 0 | Secondary lines |
| `text-caption` | Geist 400 | 12 / 16 | 0 | Hints, labels of values |
| `text-section` | Geist 500 | 12 / 16 | 0.06em, uppercase | Section labels in panels, colour text-3 |
| `text-value` | Geist Mono 500 | 15 or 16 | 0 | Values in fields and vitals |
| `text-value-small` | Geist Mono 400 or 500 | 12 or 13 | 0 | Table values, chips |
| `text-tick` | Geist Mono 400 | 11 | 0 | Axis ticks, slider ticks |

A unit follows its number in Geist 400, 12 px, colour text-2, separated by a space.

## Spacing

Base 2 px. Steps in use: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64.

| Token | Value | Use |
|---|---|---|
| `--space-inline` | 8 | Icon to label |
| `--space-field` | 8 | Between fields in a grid |
| `--space-row` | 12 | Between rows in a section |
| `--space-section` | 18 to 22 | Between sections in the inspector |
| `--space-card` | 22 to 24 | Card padding (14 for compact cards) |
| `--space-panel` | 20 | Inspector padding; inset of floating elements from the stage edge |
| `--space-page-x` | 40 desktop, 20 tablet, 16 phone | Page side padding |
| `--space-page-y` | 28 | Page top padding |
| `--space-grid` | 16 | Gap between cards |

## Layout

| Token | Value |
|---|---|
| Top bar height | 56 desktop and phone, 60 tablet |
| Lens rail width | 72 |
| Inspector width | 384 |
| Handover list width | 440 |
| Find and outline panel width | 380 |
| Vitals bar height | 78 |
| Bottom tab bar height | 72 |
| Touch target, minimum | 44 by 44 on phone and tablet |
| Breakpoints | phone under 640, tablet 640 to 1100, desktop over 1100 |
| Reference widths | 390, 834, 1440 |

## Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 6 | Inputs inside tables and the loss chain, format badges |
| `--radius-seg` | 7 | Item inside a segmented control (9 to 10 on touch) |
| `--radius-control` | 10 | Buttons, fields, segmented track |
| `--radius-row` | 12 | List rows, option cards, stat tiles |
| `--radius-card-s` | 14 | Compact cards, floating controls |
| `--radius-bar` | 16 | Vitals bar, Home action cards, timeline |
| `--radius-card` | 18 | Cards |
| `--radius-panel` | 22 | Floating panels, top corners of the bottom sheet |
| `--radius-full` | 9999 | Pills, switches, round buttons |

## Elevation

Light comes from above. Raised things carry a highlight on their top edge. Fields are cut into the surface.

| Token | Value | Use |
|---|---|---|
| `--shadow-raised` | `inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.45), 0 4px 12px rgba(0,0,0,.25)` | Secondary buttons, small cards |
| `--shadow-raised-hover` | `inset 0 1px 0 rgba(255,255,255,.09), 0 2px 4px rgba(0,0,0,.45), 0 8px 20px rgba(0,0,0,.35)` | Hover |
| `--shadow-pressed` | `inset 0 2px 4px rgba(0,0,0,.5)` | Pressed |
| `--shadow-primary` | `inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.5), 0 8px 22px rgba(255,176,32,.24)` | Primary button |
| `--shadow-primary-hover` | `inset 0 1px 0 rgba(255,255,255,.5), inset 0 -1px 0 rgba(0,0,0,.18), 0 2px 4px rgba(0,0,0,.5), 0 12px 30px rgba(255,176,32,.36)` | Primary, hover |
| `--shadow-segment` | `inset 0 1px 0 rgba(255,255,255,.10), 0 1px 3px rgba(0,0,0,.55)` | Active segment |
| `--shadow-well` | `inset 0 1px 3px rgba(0,0,0,.65), 0 1px 0 rgba(255,255,255,.04)` | Fields, segmented track |
| `--shadow-card` | `inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.35), 0 16px 40px rgba(0,0,0,.28)` | Cards |
| `--shadow-float` | `inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.45), 0 16px 40px rgba(0,0,0,.5)` | Anything over the 3D or the map |
| `--shadow-panel` | `inset 0 1px 0 rgba(255,255,255,.06), 0 2px 4px rgba(0,0,0,.4), 0 24px 64px rgba(0,0,0,.55)` | Large floating panels |
| `--shadow-knob` | `0 1px 3px rgba(0,0,0,.5)` | Switch knob |
| `--shadow-handle` | `0 2px 6px rgba(0,0,0,.6)` | Map and slider handles |
| `--ring-focus` | `2px solid` accent, offset 2 px | Keyboard focus on any control |
| `--halo-focus` | `0 0 0 3px rgba(255,176,32,.18)` | Focused field, selected card (with an accent border) |

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Default easing |
| `--duration-press` | 160 ms | Hover, press, focus |
| `--duration-panel` | 240 ms | Panels, sheets, drawers |
| `--duration-number` | 600 ms | A number rolling to a new result |
| `--duration-fill` | 900 ms | Modules filling the roof, row by row |
| `--duration-tilt` | 1200 ms | Map tilting into the 3D roof |
| `--duration-pulse` | 2000 to 2400 ms, infinite | Saved dot, the corner being edited |

Hover raises a control by 1 px and brightens it. Press lowers it by 1 px and scales it to 0.985.
Under `prefers-reduced-motion: reduce` every transition and animation is removed; state changes cut.

## Layers

| Token | Value | Use |
|---|---|---|
| `--z-stage` | 0 | 3D canvas, map |
| `--z-stage-overlay` | 1 | Titles, labels and callouts over the stage |
| `--z-float` | 10 | Floating controls, vitals |
| `--z-sheet` | 20 | Bottom sheet, drawers |
| `--z-dialog` | 30 | Dialogs |
| `--z-toast` | 40 | Toasts |

## Icons
Stroke icons, 24 by 24 view box, stroke 1.7 to 2, round caps and joins, `currentColor`. Sizes 14, 16, 18, 20, 22.
No emoji. No filled icons except the play triangle and the logo.
