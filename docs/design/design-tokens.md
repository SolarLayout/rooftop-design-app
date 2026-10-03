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
| `--color-dim` | `rgba(5,7,10,.72)` | Over the screen, under a dialog and under a bottom sheet that opens |
| `--color-handle-fill` | `#FFFFFF` | The handle of a corner on the map: white, so that it reads on any imagery, with an accent line |

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
| `--color-sun-core` | `#FFD36B` | The middle of the sun's marker over the stage: the 3D palette's `sunCore`, round the accent's disc |
| `--color-outline-fill` | `rgba(255,176,32,.09)` | The fill of the outline on the map: accent at 9 % |
| `--color-obstacle-line` | `#FFFFFF` | The line of an obstacle drawn on the map: light over dark, so that the roof stays the amber thing on the screen; the selected one is accent |
| `--color-obstacle-fill` | `rgba(11,14,19,.55)` | The fill of an obstacle drawn on the map: the ground at 55 % |
| `--color-module-glass` | `#16294D` | The glass of the module glyph on the equipment card: the module's blue of the 3D palette |
| `--color-module-frame` | `#33558C` | The frame of the module glyph, and the line between its two halves |

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
| `--color-series-ink` | `#1A1204` | Words on a series block of the single-line diagram, where accent-ink contrasts more than white (series 1 to 5) |
| `--color-series-ink-light` | `#FFFFFF` | Words on a series block where white contrasts more (series 6, the dark green) |
| `--color-shade-1` | `#3C324E` | The shade map, its first step: the least near shading over the year (0 to a fifth of the scale) |
| `--color-shade-2` | `#634E86` | The shade map, its second step |
| `--color-shade-3` | `#8D6CC2` | The shade map, its third step |
| `--color-shade-4` | `#B692F2` | The shade map, its fourth step |
| `--color-shade-5` | `#D8C7F9` | The shade map, its fifth step: the most |

Categories take the series colours in this fixed order. Text never takes a series colour. A coloured mark
beside the text carries identity.

The shade map is one hue in five steps, its lightness rising with the loss (OKLCH L 0.34 to 0.86, hue 300), so that
the most shaded positions stand out on the dark stage and the order reads without the hue. Violet stands apart from
the amber of the sun and the selection, the orange of the losses and the blue of the modules. The colour is never
alone: the legend says the range and a selected module its value (plan/phase-06-plan.md, decision 11).

## Colour: paper (report preview)

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#FBFAF7` | The sheet |
| `--color-paper-ink` | `#15171A` | Text on the sheet |
| `--color-paper-muted` | `#4A4F57` | Secondary text on the sheet |
| `--color-paper-line` | `#DDD9CF` | Lines on the sheet |

The shape of a page is a token too, so that the paper has its height before the page is there:

| Token | Value | Use |
|---|---|---|
| `--aspect-paper` | `297 / 210` | A4 landscape: the paper's skeleton while the pages come (`aspect-paper`) |

## 3D scene palette (TypeScript, `apps/web/lib/scene-palette.ts`)

Not CSS: the 3D scene takes its colours from a TypeScript palette, because three.js cannot read a stylesheet.
`apps/web/lib/scene-palette.test.ts` reads this table and the file and fails when they differ. Each value is
a colour as three.js takes it: a hex, or a hex with an alpha for what is see-through (`opacity`).

| Name | Value | Use |
|---|---|---|
| `stage` | `#0B0E13` | The background of the scene: the ground token |
| `groundPlain` | `#12161D` | The ground plane where there is no imagery |
| `gridLine` | `#1B222D` | Ground grid |
| `roof` | `#D3D6DB` | Roof surface |
| `roofEdge` | `#ECEEF0` | The line along the roof's edge and the setback line |
| `parapetCap` | `#ECEEF0` | Top of the parapet |
| `parapetLit` | `#B9BEC6` | Inner faces of the parapet toward the light |
| `parapetShade` | `#8E95A0` | Inner faces of the parapet away from it |
| `wallLit` | `#4A5262` | Building walls toward the light |
| `wallShade` | `#2E3440` | Building walls away from it |
| `obstacleTop` | `#F1F2F4` | Obstacles, their top |
| `obstacleLit` | `#C2C7CF` | Obstacles, the faces toward the light |
| `obstacleShade` | `#868D99` | Obstacles, the faces away from it |
| `treeTrunk` | `#6B5A48` | The trunk of a tree |
| `treeCrown` | `#4F7A4A` | The crown of a tree |
| `moduleGlass` | `#16294D` | Module |
| `moduleCellLine` | `#2A4675` | Module detail |
| `moduleFrame` | `#33558C` | Module frame |
| `moduleUnused` | `#8C93A0` | Position not used |
| `series1` | `#3987E5` | The glass of a position of the first category of the strings: string S1, S7, S13…, MPPT 1, INV-1; the same as `--color-series-1` |
| `series2` | `#D95926` | The second: S2, S8…, MPPT 2, INV-2 |
| `series3` | `#199E70` | The third |
| `series4` | `#C98500` | The fourth |
| `series5` | `#D55181` | The fifth |
| `series6` | `#008300` | The sixth: S6, S12, S18…, MPPT 6 |
| `stringSelected` | `#FFFFFF` | The glass of a string traced under the pointer or selected, and the line through its modules |
| `inverterMarker` | `#FFB020` | The small box of an inverter on the roof, where the engine places it: the accent |
| `shade1` | `#3C324E` | The glass of a position in the shade map's first step; the same as `--color-shade-1` |
| `shade2` | `#634E86` | Its second step |
| `shade3` | `#8D6CC2` | Its third step |
| `shade4` | `#B692F2` | Its fourth step |
| `shade5` | `#D8C7F9` | Its fifth step |
| `walkway` | `#C4C8CE` | A walkway across the array |
| `keepOutFill` | `#FFB02030` | Kept-clear zones: accent at 18 % |
| `keepOutLine` | `#FFB020` | Kept-clear zones, the dashed line |
| `selection` | `#FFB020` | Outline of the selected object |
| `hover` | `#FFD36B` | Outline of the object under the pointer |
| `sun` | `#FFB020` | Sun marker and path |
| `sunCore` | `#FFD36B` | The middle of the sun marker |
| `lightSun` | `#FFF4E0` | The colour of the sun light |
| `lightSky` | `#EEF1F5` | The sky's share of the ambient light: near neutral, since it gives two thirds of the light a lit roof takes, so that a surface renders at its colour |
| `lightGround` | `#20242C` | The ground's share of the ambient light |

Real cast shadows come from the sun light; the amber of the selection is the accent token. A selected
string is white (`stringSelected`). The strings are coloured in the Strings lens alone (plan/phase-07-plan.md,
decision 12): string S*k* takes `series` ((*k* − 1) mod 6) + 1, so that its colour follows its label and never its
rank; by MPPT the colour of its MPPT within its inverter, by inverter the inverter's; the positions the option does
not use `moduleUnused`. While a string is traced or selected, every other position takes its colour mixed
`DIM_TOWARD_STAGE` % toward `stage` (decision 13).

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
| `--text-unit-hero` | `--font-sans` | `400` | `22px` | `28px` | `0` | The unit beside the energy on Performance |
| `--text-page` | `--font-display` | `600` | `30px` | `36px` | `-0.02em` | Page title |
| `--text-lens` | `--font-display` | `600` | `26px` | `32px` | `-0.02em` | Lens title, panel title |
| `--text-lens-touch` | `--font-display` | `600` | `22px` | `28px` | `-0.02em` | Lens title, panel title on phone |
| `--text-brand` | `--font-display` | `600` | `17px` | `20px` | `-0.01em` | The name of the product in the top bar |
| `--text-number-tile` | `--font-display` | `600` | `34px` | `38px` | `-0.02em` | KPI tiles |
| `--text-number-vital` | `--font-display` | `600` | `26px` | `30px` | `-0.02em` | Energy in the vitals on desktop and tablet |
| `--text-number-vital-touch` | `--font-display` | `600` | `22px` | `26px` | `-0.02em` | Energy in the vitals on phone |
| `--text-title` | `--font-sans` | `600` | `16px` | `20px` | `0` | Card titles |
| `--text-body` | `--font-sans` | `400` | `14px` | `20px` | `0` | Body on desktop |
| `--text-body-touch` | `--font-sans` | `400` | `15px` | `20px` | `0` | Body on phone and tablet |
| `--text-small` | `--font-sans` | `400` | `13px` | `20px` | `0` | Secondary lines |
| `--text-caption` | `--font-sans` | `400` | `12px` | `20px` | `0` | Hints, labels of values, units |
| `--text-caption-s` | `--font-sans` | `400` | `11px` | `16px` | `0` | The caption of a thumbnail where 12 does not fit (the report's pages on tablet, 72 wide) |
| `--text-section` | `--font-sans` | `500` | `12px` | `20px` | `0.06em` | Section labels in panels, uppercase, colour text-3 |
| `--text-value-l` | `--font-mono` | `500` | `17px` | `20px` | `0` | Values in the vitals on tablet |
| `--text-value` | `--font-mono` | `500` | `16px` | `20px` | `0` | Values in the vitals on desktop and phone |
| `--text-value-s` | `--font-mono` | `500` | `15px` | `20px` | `0` | A value beside its label; the choices of a decision card |
| `--text-value-field` | `--font-mono` | `500` | `14px` | `20px` | `0` | The value inside a field on desktop (`--text-value-s` on touch) |
| `--text-value-small` | `--font-mono` | `400` | `13px` | `20px` | `0` | Table values, chips, the time of the time control |
| `--text-value-xs` | `--font-mono` | `400` | `12px` | `20px` | `0` | Coordinates, file names, facts in mono |
| `--text-tick` | `--font-mono` | `400` | `11px` | `20px` | `0` | Axis ticks, slider ticks, format badges |
| `--text-label-s` | `--font-sans` | `400` | `11px` | `20px` | `0` | The label under an icon of the lens rail |

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
| `--breakpoint-tablet-wide` | `820px` | Inside tablet: from this width the top bar has room for Present and for the word of Export |
| `--breakpoint-desktop-wide` | `1360px` | Inside desktop: from this width the top bar has room for the place of the design and for the state of saving |
| `--size-topbar` | `56px` | Top bar height on desktop and phone |
| `--size-topbar-tablet` | `60px` | Top bar height on tablet |
| `--size-rail` | `72px` | Lens rail width |
| `--size-inspector` | `384px` | Inspector width |
| `--size-handover-list` | `440px` | Handover list width |
| `--size-find-panel` | `380px` | Find and outline panel width |
| `--size-find-stage-inset` | `424px` | Desktop: what floats over the map of Find stays this far from the right: the panel, its margin and a gap |
| `--size-vitals` | `78px` | Vitals bar height on desktop |
| `--size-tabbar` | `72px` | Bottom tab bar height |
| `--size-touch` | `44px` | Touch target, the least on phone and tablet, both ways |
| `--size-sheet-peek` | `84px` | What is seen of the bottom sheet at its lowest stop: the handle and the lens switch |
| `--columns-vitals` | `1.25fr 1.15fr 0.85fr 0.85fr 1fr 0.8fr 1.25fr 1.55fr` | The columns of the vitals bar on desktop: seven values and the last cell |
| `--columns-vitals-waiting` | `1fr 1fr 1fr 2.4fr` | The same before there are options: three values and what is waited for |
| `--columns-p-values-phone` | `1fr 1fr 1.5fr` | The three exceedance values of the lead tile on phone: the last cell, which carries the sigma too, is wider |
| `--columns-loss-chain` | `210px 84px 64px 232px minmax(0, 1fr)` | A row of the loss chain on desktop: the label, the field where the step is the user's, the change, the track, the running total |
| `--columns-loss-chain-tablet` | `230px 96px 72px 196px minmax(0, 1fr)` | The same on tablet |
| `--columns-loss-chain-phone` | `minmax(0, 1fr) auto auto` | On phone: the field, then the change and the running total at the right; the label over them and the track under them take the width |

Reference widths: 390, 834, 1440.

## Radius

| Token | Value | Use |
|---|---|---|
| `--radius-swatch` | `3px` | The bars of the loss chain and the swatches of its legend |
| `--radius-key` | `4px` | The box around a key in a tooltip |
| `--radius-bar-end` | `4px` | The data end of a bar in a chart; its end on the baseline is square |
| `--radius-xs` | `6px` | Inputs inside tables and the loss chain, format badges |
| `--radius-seg` | `7px` | Item inside a segmented control |
| `--radius-item` | `8px` | Rows of a list that floats, tooltips, the action of a toast |
| `--radius-seg-touch` | `9px` | The same on phone and tablet |
| `--radius-chip` | `9px` | A chip of Performance's assumptions: a label with its field |
| `--radius-control` | `10px` | Buttons, fields, segmented track |
| `--radius-row` | `12px` | List rows, option cards, stat tiles |
| `--radius-card-s` | `14px` | Compact cards, floating controls |
| `--radius-bar` | `16px` | Vitals bar, Home action cards, timeline |
| `--radius-card` | `18px` | Cards |
| `--radius-panel` | `22px` | Floating panels, top corners of the bottom sheet |
| `--radius-full` | `9999px` | Pills, switches, round buttons |

## Lines

A line is 1 px wide. Those that are wider have a token.

| Token | Value | Use |
|---|---|---|
| `--border-tab` | `2px` | The line under a tab |
| `--border-dot` | `1.5px` | The line of the hollow dot of a design that is not kept |
| `--border-handle` | `3px` | The accent line around the handle of a slider, on desktop |
| `--border-handle-touch` | `4px` | The same on phone and tablet |
| `--border-outline` | `2px` | The line of the outline on the map |
| `--border-corner` | `4px` | The accent line of a corner handle on the map (5 on touch: `--border-corner-touch`) |
| `--border-corner-touch` | `5px` | The same on phone and tablet |

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
| `--shadow-well-focus` | `inset 0 1px 3px rgba(0,0,0,.65), 0 0 0 3px rgba(255,176,32,.18)` | A field that has the focus: the well and the halo (with an accent border) |
| `--shadow-card` | `inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.35), 0 16px 40px rgba(0,0,0,.28)` | Cards |
| `--shadow-row` | `inset 0 1px 0 rgba(255,255,255,.05)` | A row of the inspector that is pressed: an option card, a closed row (the board "Studio, Strings lens") |
| `--shadow-float` | `inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.45), 0 16px 40px rgba(0,0,0,.5)` | Anything over the 3D or the map |
| `--shadow-tooltip` | `0 1px 2px rgba(0,0,0,.45), 0 8px 20px rgba(0,0,0,.35)` | Tooltips |
| `--shadow-panel` | `inset 0 1px 0 rgba(255,255,255,.06), 0 2px 4px rgba(0,0,0,.4), 0 24px 64px rgba(0,0,0,.55)` | Large floating panels |
| `--shadow-drawer` | `-16px 0 40px rgba(0,0,0,.5)` | The drawer of the notes, which comes from the right |
| `--shadow-track` | `inset 0 1px 3px rgba(0,0,0,.45)` | Track of a switch |
| `--shadow-knob` | `0 1px 3px rgba(0,0,0,.5)` | Switch knob |
| `--shadow-handle` | `0 2px 6px rgba(0,0,0,.6)` | Map and slider handles |
| `--shadow-text-on-imagery` | `0 1px 3px rgba(0,0,0,.9)` | Under text that stands on the satellite imagery: the scale, the attribution |
| `--halo-focus` | `0 0 0 3px rgba(255,176,32,.18)` | Focused field (with an accent border) |
| `--halo-selected` | `0 0 0 3px rgba(255,176,32,.14)` | Selected card (with an accent border) |
| `--halo-decision` | `0 0 0 4px rgba(255,176,32,.14)` | A choice only the user can make: the decision card (with an accent border) |
| `--halo-saved` | `0 0 0 0 rgba(61,214,160,.5)` | Around the saved dot, where its pulse begins and ends |
| `--halo-saved-out` | `0 0 0 5px rgba(61,214,160,0)` | Around the saved dot, at the middle of its pulse |
| `--halo-corner` | `0 0 0 0 rgba(255,176,32,.55)` | Around the corner being edited, where its pulse begins and ends |
| `--halo-corner-out` | `0 0 0 9px rgba(255,176,32,0)` | Around the corner being edited, at the middle of its pulse |
| `--halo-sun` | `0 0 16px 4px rgba(255,176,32,.45)` | The sun's glow around its marker over the stage |

## States

| Token | Value | Use |
|---|---|---|
| `--opacity-disabled` | `0.45` | A control that cannot be used. It has no shadow either |
| `--opacity-updating` | `0.55` | A value of before while the new one is on its way; a skeleton at the low point of its breath |
| `--opacity-hint` | `0.35` | A hint on the map: the footprints that are known, while Detect building is the tool |
| `--opacity-band` | `0.55` | The band of the series lengths that fit, in `color-ok` (components.md, "Series range bar") |
| `--opacity-wash` | `0.14` | The wash under the line of a chart: the series colour at this opacity |
| `--brightness-lift` | `1.14` | A bar of a chart under the pointer or with the keyboard focus: lifted |

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
| `--duration-breathe` | `1600ms` | One breath of a skeleton |
| `--duration-pulse-saved` | `2400ms` | One pulse of the saved dot |
| `--duration-pulse-corner` | `2000ms` | One pulse of the corner being edited |
| `--shift-press` | `1px` | Hover raises a control by it, press lowers it by it |
| `--scale-press` | `0.985` | Size of a control while it is pressed |

Under `prefers-reduced-motion: reduce` every transition and animation is removed; state changes cut.

## Numbers in code (TypeScript, `apps/web/components/ui/design-numbers.ts`)

Not CSS: times that a clock waits and distances that a place is worked out with. A test holds this table
and the file equal.

| Name | Value | Use |
|---|---|---|
| `TOOLTIP_DELAY` | `400` | Milliseconds between the pointer coming over a control and its tooltip |
| `TOAST_STAYS` | `5000` | Milliseconds that a toast of something done stays |
| `TOOLTIP_GAP` | `8` | Pixels between a tooltip and its control |
| `LIST_GAP` | `6` | Pixels between a list that floats and its trigger |
| `SCREEN_MARGIN` | `8` | Pixels that stay free between what floats and the edge of the screen |
| `DESIGN_PAUSE` | `500` | Milliseconds between a committed edit and the design run that follows it: edits shortly after each other are one run |
| `ROOF_ZOOM` | `18` | The zoom of the map at a roof that was found, as MapLibre counts zoom (on tiles of 512): the native zoom 19 of the imagery's tiles of 256, about 0.3 m per pixel |
| `SCALE_BAR_MAX` | `124` | Pixels that the scale bar of the map may be wide at most; it shows the largest round length that fits |
| `SNAP_DEGREES` | `3` | Degrees within which a corner snaps to a right angle or to a parallel, and the rectangle's turn to north |
| `CLOSE_WITHIN` | `12` | Pixels within which a press on the first corner closes the outline |
| `CLOSE_WITHIN_TOUCH` | `20` | The same on phone and tablet |
| `NUDGE_MM` | `100` | Millimetres a selected corner moves by an arrow key |
| `NUDGE_SHIFT_MM` | `1000` | The same with Shift held |
| `STEM_TURN` | `44` | Pixels the turn handle of a selected obstacle stands off the middle of the north edge of its top, due north, on its stem |
| `STEM_HEIGHT` | `40` | Pixels the height handle stands over the middle of the top, on its vertical stem, on desktop |
| `STEM_HEIGHT_TOUCH` | `52` | The same on phone and tablet |
| `TIME_REST` | `150` | Milliseconds the time of the sun must stand still before the engine's shadow outlines are asked for it: a drag of the timeline passes forty quarter hours |
| `DIM_TOWARD_STAGE` | `55` | Percent that the glass of every other position is mixed toward the stage's colour while a string is traced or selected (decision 13 of plan/phase-07-plan.md) |
| `CHART_LINE_TOP` | `14` | Pixels between the top of the plot of the 25 years and the highest year, so that the marker and its ring have room |
| `CHART_LINE_BAND` | `45` | Pixels the line of the 25 years falls from the highest year to the lowest: it is fitted to the run's own extremes, not to zero |
| `MARKER_RADIUS` | `4` | Pixels: the marker of a point under the pointer is 8 across |
| `MARKER_RING` | `2` | Pixels of the ring in the surface colour around a marker, so that it stays legible on the line |

## Layers

What floats beside a control (a tooltip, a list) and a dialog are in the top layer of the browser and need no
layer of their own.


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
| `--breakpoint-*` | `tablet:`, `desktop:`; inside them `tablet-wide:`, `desktop-wide:`, for the top bar | `desktop:flex` |
| `--radius-*` | `rounded-` and the name | `rounded-control` |
| `--shadow-*`, `--halo-*` | `shadow-` and the name | `shadow-raised`, `shadow-halo-focus`, `shadow-halo-selected` |
| `--ring-focus`, `--ring-focus-offset` | `focus-ring` | on every control |
| `--opacity-disabled`, `--opacity-updating` | `opacity-disabled`, `opacity-updating` | `disabled:opacity-disabled` |
| `--opacity-wash`, `--brightness-lift` | `opacity-wash`, `lifted` | on the wash under the line of a chart; on the bar that is under the pointer |
| `--duration-spin`, `--duration-breathe` | `turning`, `breathing` | on a ring that turns, on a skeleton |
| `--duration-pulse-saved`, `--halo-saved`, `--halo-saved-out` | `pulsing` | on the saved dot |
| `--duration-pulse-corner`, `--halo-corner`, `--halo-corner-out` | `pulsing-corner` | on the corner being edited |
| `--columns-*` | `grid-cols-` and the name | `desktop:grid-cols-vitals` |
| `--ease-out`, `--duration-*` | `ease-out`, `duration-` and the name | `duration-press` |
| `--duration-press`, `--ease-out`, `--shift-press`, `--scale-press` | `press-motion`, `raised-by-hover`, `lowered-by-press` | on every control that is pressed |
| `--duration-panel`, `--ease-out` | `sheet-motion` | on a sheet that goes to its stop |
| `--stroke-*` | `stroke-icon`, `stroke-icon-light`, `stroke-tick`; `stroke-chart`, `stroke-hair`, `stroke-wire` | on the `svg` of an icon; on the line, the gridlines and the crosshair of a chart; on the DC lines of the single-line diagram |
| `--radius-xs` | `rx-xs` | the corners of a box drawn in an `svg`: the single-line diagram |
| `--z-*` | `z-` and the name | `z-float` |
| `--border-*` | `border-` and the name; `border-b-tab` for the line under a tab | `border-handle-touch desktop:border-handle`, `border-dot`, `border-corner`, `border-outline` |
| `--shadow-text-on-imagery` | `on-imagery` | on text that stands on the satellite imagery |
| `--x`, `--y`, `--turn` (numbers of the data, set with `measures()`) | `placed`, `turned` | a label of the stage where its point of the scene falls; the needle of the north control |

Tailwind's own palette, sizes of type, radii and shadows do not exist in this app: a utility that is not made
of a token makes no CSS.

A place or a width that follows the data (the handle of a slider at its value) is a share of the width
around it, from 0 to 1. The component sets it with `measures()` (`apps/web/components/ui/measures.ts`), which
is the only inline style there is, and a utility reads it: `left-at` (`--at`), `w-span` and `h-span`
(`--span`). A place on the screen that is worked out (where a tooltip or a list floats) is set the same
way, in pixels: `placed` (`--x`, `--y`); a turn that is worked out (the needle of the north control, by the
camera's bearing) the same way, in degrees clockwise: `turned` (`--turn`). A size, a colour or a shadow is
never set this way.

States have variants of their own, so that the kit can show a state without a pointer or a keyboard:
`hovered:` (under a pointer that can hover, or `data-shown-as="hover"`), `pressed:` (while pressed, or
`data-shown-as="pressed"`), `focused:` (the focus is inside, or `data-shown-as="focus"`), and `within-hovered:` for what is directly inside
a control that is under the pointer (the line under a tab). `focus-ring` also
answers to `data-shown-as="focus"`. None applies to a control
that is disabled, nor to one that is shown and cannot be used (`aria-disabled="true"`).

## Icons
Stroke icons, 24 by 24 view box, round caps and joins, `currentColor`. Sizes 14, 16, 18, 20, 22, which are
steps of `--spacing`. No emoji. No filled icons except the play triangle and the logo; Pause, its other state, is two bars of `--stroke-pause`.

| Token | Value | Use |
|---|---|---|
| `--stroke-icon` | `2` | Stroke of an icon |
| `--stroke-icon-light` | `1.7` | Stroke of the icons of the navigation, which are larger |
| `--stroke-tick` | `2.4` | Stroke of the tick |
| `--stroke-pause` | `3.4` | The two bars of Pause on the round play button: as heavy as the play triangle beside them |
| `--stroke-chart` | `2` | The line of a chart |
| `--stroke-hair` | `1` | A gridline, the baseline and the crosshair of a chart: a hairline |
| `--stroke-wire` | `1.5` | A DC line of the single-line diagram, from a block to its inverter; its AC lines take `--stroke-chart` |
