# Design tokens

The values of the approved mockups, named. They are CSS variables in `apps/web/app/globals.css`, mapped into
Tailwind 4 with `@theme inline`. Components use the names, never the values.

Theme: "Dusk" (dark) is the only theme filled in. Names are theme-neutral so a light theme is a second set of
values. Colours and shadows belong to the theme (`[data-theme="dusk"]`); everything else is the same in every
theme (`:root`).

## How this document and the code are held together

`apps/web/app/globals.test.ts` reads this document and `globals.css` and fails when they differ.

- A row whose first cell is a name in code that begins with `--` is a token. Its second cell is the value,
  exactly as it is written in the CSS.
- In the table of type styles a row is five variables: the size under the name itself, and `--line-height`,
  `--letter-spacing`, `--font-weight` and `--font-family` after it (`--text-page--line-height`).
- Every token is in the CSS with the same value. Every variable of the CSS is a token here.
- A value that is missing is added here first, then to the CSS, in the same pull request as its first use.

## Colour: surfaces and lines

| Token | Value | Use |
|---|---|---|
| `--color-ground` | `#0B0E13` | Page and 3D stage background |
| `--color-chrome` | `#0E1218` | Top bar, lens rail, inspector, bottom sheet, tab bar |
| `--color-surface-1` | `#12161D` | Cards, floating panels, list rows |
| `--color-surface-2` | `#181D26` | Tiles inside a card, selected list row |
| `--color-control` | `#151A22` | Raised secondary buttons |
| `--color-control-hover` | `#1B212B` | Secondary button, hover |
| `--color-control-pressed` | `#10141A` | Secondary and quiet button, pressed |
| `--color-control-active` | `#232A36` | Active segment, active lens, active workspace |
| `--color-well` | `#090C10` | Recessed fields, segmented control track, slider track |
| `--color-line-subtle` | `#1C222C` | Dividers inside chrome |
| `--color-line` | `#232A36` | Card and control borders |
| `--color-line-strong` | `#2F3847` | Borders of secondary buttons and inputs, off switch |
| `--color-line-hover` | `#3B4658` | Border of a secondary button, hover |

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
| `--color-series-1` | `#3987E5` | First category: MPPT 1, inverter 1 |
| `--color-series-2` | `#D95926` | Second category |
| `--color-series-3` | `#199E70` | Third category |
| `--color-series-4` | `#C98500` | Fourth category |
| `--color-series-5` | `#D55181` | Fifth category |
| `--color-series-6` | `#008300` | Sixth category |
| `--color-series-unused` | `#8C93A0` | Positions not used |

Categories take the series colours in this fixed order. Text never takes a series colour. A coloured mark
beside the text carries identity.

## Colour: paper (report preview)

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#FBFAF7` | The sheet |
| `--color-paper-ink` | `#15171A` | Text on the sheet |
| `--color-paper-muted` | `#4A4F57` | Secondary text on the sheet |
| `--color-paper-line` | `#DDD9CF` | Lines on the sheet |

## 3D scene palette (TypeScript, `apps/web/lib/scene-palette.ts`)

Not CSS: the 3D scene takes its colours from a TypeScript palette. It is written with the first 3D scene
(Phase 5).

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

### Families

The font files are in the repo or in a pinned package (`apps/web/app/fonts`); nothing is fetched from another
machine. Licence of all three: SIL Open Font License 1.1.

| Token | Value | Use |
|---|---|---|
| `--font-display` | `var(--font-bricolage-grotesque), var(--font-geist-sans), system-ui, sans-serif` | Bricolage Grotesque: page titles, lens titles, lead numbers |
| `--font-sans` | `var(--font-geist-sans), system-ui, sans-serif` | Geist: everything else |
| `--font-mono` | `var(--font-geist-mono), ui-monospace, monospace` | Geist Mono: numbers, coordinates, file names, axis ticks |

### Weights

| Token | Value | Use |
|---|---|---|
| `--font-weight-regular` | `400` | Text |
| `--font-weight-medium` | `500` | Emphasis, labels of secondary buttons, the active item |
| `--font-weight-semibold` | `600` | Titles, labels of primary buttons |

### Type styles

Each style is one utility, `type-` and its name (`type-page`, `type-value`). It sets family, weight, size, line
height and tracking together.

| Token | Family | Weight | Size | Line height | Tracking | Use |
|---|---|---|---|---|---|---|
| `--text-hero` | `--font-display` | `600` | `72px` | `74px` | `-0.035em` | Home headline |
| `--text-number-hero` | `--font-display` | `600` | `76px` | `80px` | `-0.03em` | Energy on Performance |
| `--text-page` | `--font-display` | `600` | `30px` | `36px` | `-0.02em` | Page title |
| `--text-lens` | `--font-display` | `600` | `26px` | `32px` | `-0.02em` | Lens title, panel title |
| `--text-lens-touch` | `--font-display` | `600` | `22px` | `28px` | `-0.02em` | Lens title, panel title on phone |
| `--text-number-tile` | `--font-display` | `600` | `34px` | `38px` | `-0.02em` | KPI tiles |
| `--text-number-vital` | `--font-display` | `600` | `26px` | `30px` | `-0.02em` | Energy in the vitals on desktop and tablet |
| `--text-number-vital-touch` | `--font-display` | `600` | `22px` | `26px` | `-0.02em` | Energy in the vitals on phone |
| `--text-title` | `--font-sans` | `600` | `16px` | `20px` | `0` | Card titles |
| `--text-body` | `--font-sans` | `400` | `14px` | `20px` | `0` | Body on desktop |
| `--text-body-touch` | `--font-sans` | `400` | `15px` | `20px` | `0` | Body on phone and tablet |
| `--text-small` | `--font-sans` | `400` | `13px` | `20px` | `0` | Secondary lines |
| `--text-caption` | `--font-sans` | `400` | `12px` | `20px` | `0` | Hints, labels of values, units |
| `--text-section` | `--font-sans` | `500` | `12px` | `20px` | `0.06em` | Section labels in panels, uppercase, colour text-3 |
| `--text-value-l` | `--font-mono` | `500` | `17px` | `20px` | `0` | Values in the vitals on tablet |
| `--text-value` | `--font-mono` | `500` | `16px` | `20px` | `0` | Values in the vitals on desktop and phone |
| `--text-value-s` | `--font-mono` | `500` | `15px` | `20px` | `0` | A value beside its label; the choices of a decision card |
| `--text-value-field` | `--font-mono` | `500` | `14px` | `20px` | `0` | The value inside a field on desktop (`--text-value-s` on touch) |
| `--text-value-small` | `--font-mono` | `400` | `13px` | `20px` | `0` | Table values, chips, the time of the time control |
| `--text-value-xs` | `--font-mono` | `400` | `12px` | `20px` | `0` | Coordinates, file names, facts in mono |
| `--text-tick` | `--font-mono` | `400` | `11px` | `20px` | `0` | Axis ticks, slider ticks, format badges |

The line height is 20 px wherever the mockups state none: they set it once, on the page.
Emphasis inside a style is a weight utility beside it (`type-body font-medium`).
A unit follows its number in `type-caption`, colour text-2, separated by a space.
Numbers are set with tabular figures.

## Spacing

Base 2 px. Steps in use: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64.

| Token | Value | Use |
|---|---|---|
| `--spacing` | `4px` | The unit of the spacing and size utilities: `gap-2` is 8 px, `h-10` is 40 px, a half step is 2 px |
| `--space-inline` | `8px` | Icon to label |
| `--space-field` | `8px` | Between fields in a grid |
| `--space-row` | `12px` | Between rows in a section |
| `--space-section` | `22px` | Between sections in the inspector |
| `--space-card` | `24px` | Card padding |
| `--space-card-compact` | `14px` | Padding of compact cards |
| `--space-panel` | `20px` | Inspector padding; inset of floating elements from the stage edge |
| `--space-page-x-phone` | `16px` | Page side padding on phone |
| `--space-page-x-tablet` | `20px` | Page side padding on tablet |
| `--space-page-x-desktop` | `40px` | Page side padding on desktop |
| `--space-page-y` | `28px` | Page top padding |
| `--space-grid` | `16px` | Gap between cards |

## Layout

| Token | Value | Use |
|---|---|---|
| `--breakpoint-tablet` | `640px` | Tablet from this width; phone below it |
| `--breakpoint-desktop` | `1101px` | Desktop from this width: over 1100 |
| `--size-topbar` | `56px` | Top bar height on desktop and phone |
| `--size-topbar-tablet` | `60px` | Top bar height on tablet |
| `--size-rail` | `72px` | Lens rail width |
| `--size-inspector` | `384px` | Inspector width |
| `--size-handover-list` | `440px` | Handover list width |
| `--size-find-panel` | `380px` | Find and outline panel width |
| `--size-vitals` | `78px` | Vitals bar height on desktop |
| `--size-tabbar` | `72px` | Bottom tab bar height |
| `--size-touch` | `44px` | Touch target, the least on phone and tablet, both ways |

Reference widths: 390, 834, 1440.

## Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `6px` | Inputs inside tables and the loss chain, format badges |
| `--radius-seg` | `7px` | Item inside a segmented control |
| `--radius-seg-touch` | `9px` | The same on phone and tablet |
| `--radius-control` | `10px` | Buttons, fields, segmented track |
| `--radius-row` | `12px` | List rows, option cards, stat tiles |
| `--radius-card-s` | `14px` | Compact cards, floating controls |
| `--radius-bar` | `16px` | Vitals bar, Home action cards, timeline |
| `--radius-card` | `18px` | Cards |
| `--radius-panel` | `22px` | Floating panels, top corners of the bottom sheet |
| `--radius-full` | `9999px` | Pills, switches, round buttons |

## Elevation

Light comes from above. Raised things carry a highlight on their top edge. Fields are cut into the surface.

| Token | Value | Use |
|---|---|---|
| `--shadow-raised` | `inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.45), 0 4px 12px rgba(0,0,0,.25)` | Secondary buttons, small cards |
| `--shadow-raised-hover` | `inset 0 1px 0 rgba(255,255,255,.09), 0 2px 4px rgba(0,0,0,.45), 0 8px 20px rgba(0,0,0,.35)` | Hover |
| `--shadow-pressed` | `inset 0 2px 4px rgba(0,0,0,.5)` | Pressed |
| `--shadow-primary` | `inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.5), 0 8px 22px rgba(255,176,32,.24)` | Primary button |
| `--shadow-primary-pressed` | `inset 0 2px 4px rgba(0,0,0,.3), 0 1px 1px rgba(0,0,0,.5)` | Primary, pressed |
| `--shadow-primary-hover` | `inset 0 1px 0 rgba(255,255,255,.5), inset 0 -1px 0 rgba(0,0,0,.18), 0 2px 4px rgba(0,0,0,.5), 0 12px 30px rgba(255,176,32,.36)` | Primary, hover |
| `--shadow-segment` | `inset 0 1px 0 rgba(255,255,255,.10), 0 1px 3px rgba(0,0,0,.55)` | Active segment |
| `--shadow-well` | `inset 0 1px 3px rgba(0,0,0,.65), 0 1px 0 rgba(255,255,255,.04)` | Fields, segmented track |
| `--shadow-card` | `inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.35), 0 16px 40px rgba(0,0,0,.28)` | Cards |
| `--shadow-float` | `inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.45), 0 16px 40px rgba(0,0,0,.5)` | Anything over the 3D or the map |
| `--shadow-panel` | `inset 0 1px 0 rgba(255,255,255,.06), 0 2px 4px rgba(0,0,0,.4), 0 24px 64px rgba(0,0,0,.55)` | Large floating panels |
| `--shadow-track` | `inset 0 1px 3px rgba(0,0,0,.45)` | Track of a switch |
| `--shadow-knob` | `0 1px 3px rgba(0,0,0,.5)` | Switch knob |
| `--shadow-handle` | `0 2px 6px rgba(0,0,0,.6)` | Map and slider handles |
| `--halo-focus` | `0 0 0 3px rgba(255,176,32,.18)` | Focused field (with an accent border) |
| `--halo-selected` | `0 0 0 3px rgba(255,176,32,.14)` | Selected card (with an accent border) |

## States

| Token | Value | Use |
|---|---|---|
| `--opacity-disabled` | `0.45` | A control that cannot be used. It has no shadow either |

## Focus

| Token | Value | Use |
|---|---|---|
| `--ring-focus` | `2px solid var(--color-accent)` | Outline of any control that has the keyboard focus |
| `--ring-focus-offset` | `2px` | Its distance from the control |

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Default easing |
| `--duration-press` | `160ms` | Hover, press, focus |
| `--duration-panel` | `240ms` | Panels, sheets, drawers |
| `--duration-number` | `600ms` | A number rolling to a new result |
| `--duration-fill` | `900ms` | Modules filling the roof, row by row |
| `--duration-tilt` | `1200ms` | Map tilting into the 3D roof |
| `--duration-spin` | `900ms` | One turn of the ring beside a value that is updating |
| `--duration-pulse-saved` | `2400ms` | One pulse of the saved dot |
| `--duration-pulse-corner` | `2000ms` | One pulse of the corner being edited |
| `--shift-press` | `1px` | Hover raises a control by it, press lowers it by it |
| `--scale-press` | `0.985` | Size of a control while it is pressed |

Under `prefers-reduced-motion: reduce` every transition and animation is removed; state changes cut.

## Layers

| Token | Value | Use |
|---|---|---|
| `--z-stage` | `0` | 3D canvas, map |
| `--z-stage-overlay` | `1` | Titles, labels and callouts over the stage |
| `--z-float` | `10` | Floating controls, vitals |
| `--z-sheet` | `20` | Bottom sheet, drawers |
| `--z-dialog` | `30` | Dialogs |
| `--z-toast` | `40` | Toasts |

## In code

| Tokens | Utilities | Example |
|---|---|---|
| `--color-*` | every colour utility, by the name after `--color-` | `bg-surface-1`, `text-text-2`, `border-line` |
| Type styles | `type-` and the name | `type-page`, `type-value` |
| `--font-weight-*` | `font-regular`, `font-medium`, `font-semibold` | |
| `--spacing` | every spacing and size utility, in steps | `gap-2`, `h-10`, `px-3.5` |
| `--space-*`, `--size-*` | the same utilities, by name | `gap-row`, `p-panel`, `h-topbar`, `w-inspector`, `min-h-touch` |
| `--breakpoint-*` | `tablet:`, `desktop:` | `desktop:flex` |
| `--radius-*` | `rounded-` and the name | `rounded-control` |
| `--shadow-*`, `--halo-*` | `shadow-` and the name | `shadow-raised`, `shadow-halo-focus`, `shadow-halo-selected` |
| `--ring-focus`, `--ring-focus-offset` | `focus-ring` | on every control |
| `--opacity-disabled` | `opacity-disabled` | `disabled:opacity-disabled` |
| `--ease-out`, `--duration-*` | `ease-out`, `duration-` and the name | `duration-press` |
| `--duration-press`, `--ease-out`, `--shift-press`, `--scale-press` | `press-motion`, `raised-by-hover`, `lowered-by-press` | on every control that is pressed |
| `--stroke-*` | `stroke-icon`, `stroke-icon-light`, `stroke-tick` | on the `svg` of an icon |
| `--z-*` | `z-` and the name | `z-float` |

Tailwind's own palette, sizes of type, radii and shadows do not exist in this app: a utility that is not made
of a token makes no CSS.

States have variants of their own, so that the kit can show a state without a pointer or a keyboard:
`hovered:` (under a pointer that can hover, or `data-shown-as="hover"`), `pressed:` (while pressed, or
`data-shown-as="pressed"`). `focus-ring` also answers to `data-shown-as="focus"`. None applies to a control
that is disabled.

## Icons
Stroke icons, 24 by 24 view box, round caps and joins, `currentColor`. Sizes 14, 16, 18, 20, 22, which are
steps of `--spacing`. No emoji. No filled icons except the play triangle and the logo.

| Token | Value | Use |
|---|---|---|
| `--stroke-icon` | `2` | Stroke of an icon |
| `--stroke-icon-light` | `1.7` | Stroke of the icons of the navigation, which are larger |
| `--stroke-tick` | `2.4` | Stroke of the tick |
