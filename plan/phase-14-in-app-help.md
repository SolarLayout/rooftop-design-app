# Phase 14: In-app help

**Status:** in progress, the design approved (D80, session 19, 2026-10-07): the owner changed the desktop sheet from beside
the inspector to the right edge, the whole height, and left tablet and phone to us. The boards: the canvas page
"In-App Help" (`docs/design/mockups/InAppHelp*.dc.html`, built by `build_in_app_help.py`).

## What the owner asked (session 19)

"The in-app help facility. The section headers in the input panels need some small "?" icon, like a disc with
shading/light/color etc of the CTA buttons; you will create design first. The detailed help page will slide in as sheet
(desktop); suggest suitable for mobile/tablet. First set of help triggers on the section headers of the inputs. Identify
all such other places. We will use the core design of the in-app help system from the solarlayout repo
(`packages/help`). Design language, theme, visual design, UI/UX/IA will be ours. Analyze and plan first."

## The core we take from solarlayout (`/Users/arunkpatra/codebase/solarlayout/packages/help`, read-only)

Its spec: `docs/superpowers/specs/2026-09-26-help-system-design.md` there. What carries over, unchanged in spirit:

- **One topic = one MDX file; its key is its path.** `content/studio/section/system-voltage.mdx` is
  `studio.section.system-voltage`. Two topics can never share a key. A rename keeps the old key in `aliases`.
- **Frontmatter:** `title`, `summary` (140 characters at most: the tooltip and the sheet's lead), `kind`, `values` (the
  options of a one-choice section, keyed as the code keys them), `related`, `aliases`.
- **A generated, committed, typed manifest** (`help-gen`): every key a type, so a disc or a link to a missing topic fails
  the typecheck; the metadata loads with the page, each body only when it is opened (a lazy `import()`).
- **The gate, as tests:** the frontmatter's schema; the key's grammar; links and `related` resolve; aliases unique; the
  manifest fresh; option drift (a topic's `values` keys equal the options the code offers); no number with a unit typed in
  a body (numbers that live in the code are rendered from it); a coverage report of the headings still without a topic.
- **The runtime:** a provider holding the topic open and a back stack; `?help=<key>` in the address, read on load
  (shared links open the topic), written with `history.replaceState` so nothing else in the address is touched; the sheet
  with Back, the options with the user's own marked, the body with a retry if it fails to load, related topics as rows.
- **Authoring rules:** plain words for engineers who are not software people; what it is, the options, how it behaves,
  when to change it; every sentence true of the code, its `file:line` cited in the pull request.

## What is ours (the boards)

| | solarlayout | Here |
|---|---|---|
| The anchor | a muted lucide `CircleQuestionMark`, 13 in 18 | **a disc of the primary action**: its orange (`accent`), its light and shadow (`shadow-primary`, hover and pressed as the primary button), a ? in its ink; 16 in a press of 24 on desktop, 20 in a press of 44 on touch; held in and ringed while its topic is open; 6 after the heading's words |
| Where first | every Studio inspector setting | **every section heading of the input panels** (23; about 21 topics), then the places below, in the order the owner says |
| The panel | a modal sheet at the right edge, 420, over everything, the screen dimmed, at every size | **desktop and tablet:** a sheet from the right edge, the whole height of the window over the top bar, 420 wide, the screen dimmed, the focus held (the owner: "a sheet bleeding to the top, right, bottom edges"); first drawn beside the inspector and not dimmed, which the owner turned down. **phone:** from the bottom, the whole height but 48, with the grip, as the notes and the picker. Find: the same sheet |
| Hover | the summary and "Click for details" | the same, "Click for more", in the app's tooltip look; touch has none |
| The foot | the Help ID with a copy button | none: the key is for us, not for the user; the address carries it |
| The look | shadcn roles, lucide | our tokens and components only (`docs/design/design-tokens.md`, `components.md`), our icons |
| Kinds | setting, phase, object, metric, concept | **section** (first), then setting, metric, deliverable, tool, concept; the key's first segment the place: `find`, `studio`, `performance`, `handover`, `home`, `app` |

## Where help goes (the inventory, session 19)

**First, this phase: the section headings of the input panels.**

| Where | Headings |
|---|---|
| Find, outline | Edges · Roof type · Obstacles; by hand: Place · Shape |
| Studio, Roof lens | Location · Roof type · Edges and access · Obstacles |
| Studio, Array lens | Module · Mounting · Spacing · Shade-free window |
| Studio, Sun lens | Day · Sun at the hour · On the roof · Shading over the year · Shade map |
| Studio, Strings lens | Inverter · System voltage (and its state "Waiting for your choice") · Modules in series · Options · MPPT loading |

Roof type and Obstacles mean the same on Find and in the Roof lens: one topic each, two discs.

**Then, when the owner says, in this order:** the sections that fold (Sizing temperatures; the inverter's limits and
cabling); each field (a setting: tilt, azimuth, row pitch, setback, modules in tilt, albedo, the Voc coefficient…, a ?
beside its label); the numbers that come back (the vitals; Performance's figures, each step of the loss chain, the charts,
the assumptions); Handover's deliverables; tools and modes (Find's tools, Square the corners, the picker's filters, Layers,
the strings' colours); ideas linked from topics with no disc of their own (solar time, Voc at the coldest, the MPPT window,
the shade-free window, P50 and P90).

## How it is built (after approval)

- **Where:** the topics in `apps/web/content/help/<place>/<kind>/<name>.mdx`; the registry, the gate and the generator in
  `apps/web/lib/help` (pure, `bun test`); the generator as `bun tools/help-gen.ts` (`bun help:gen`), its output
  `apps/web/lib/help/manifest.gen.ts` committed; the components in `apps/web/components/help` (the disc and the sheet are
  new kit components: written into `components.md` first, shown in the kit). One app here, so no package.
- **MDX:** `@next/mdx` with `remark-frontmatter`, the MDX imported, never routed. A spike comes first: Next 16.2.11 with
  Turbopack compiling `.mdx` imported lazily, in `next dev` and `next build`; solarlayout's spike found `remark-frontmatter`
  must be passed by absolute path under bun's isolated installs. New dependencies, pinned exactly (D4): `@next/mdx`,
  `@mdx-js/loader`, `@mdx-js/react`, `remark-frontmatter`, `yaml` (and `zod` for the frontmatter, unless a small reader of
  our own does). If the spike fails, the bodies are written in Markdown and rendered by `react-markdown` instead; nothing
  else changes.
- **Option drift here:** a section with one choice (System voltage, Roof type, Mounting…) lists its options in `values`,
  keyed as the code keys them (`600`, `1000`, `1500`; `flat_tilted`…); the gate reads the options from the code's own lists
  (`VOLTAGE_OPTIONS`, `ROOF_TYPES`…), so a changed option fails the check.
- **Numbers:** a number that lives in the code (a default, a limit) is shown from it by a component of the MDX kit
  (`<Value of="…"/>`), never typed; the gate refuses a typed number with a unit.
- **Tests:** logic first with `bun test` (the registry, the key, aliases, the back stack, the address, the gate); no new
  browser tests (the owner's standing instruction of session 18); each pull request checked by hand in the browser at three
  sizes, its screenshots attached.

## Pull requests, in order

1. The spike (MDX imported and lazy, dev and build), then the registry, the generator, the gate, the provider and the
   address: no UI. One topic to prove the pipe.
2. The disc and the sheet (kit components, `components.md` first), the tooltip; mounted in the shell and on Find.
3. The topics of the Strings and Array lenses' headings, each sentence checked against the engine.
4. The topics of the Roof and Sun lenses and of Find.

Each topic's words are checked against the code before they are written, its `file:line` in the pull request.

## Decisions to take with the owner

- The design: approved with the sheet at the edge (D80). New dependencies: approved.
- The order of the later places: the owner says when.
- **How-tos with pictures (D81):** help for Find's tools as numbered steps with pictures and callouts; the boards
  "In-App Help · How-tos with pictures", approved 2026-10-07 with the phone's single ?. Its pull requests, in order:
  1. **The pictures:** `bun help:pictures`, a Playwright run of its own on the test stack (as the soak of Present: a
     configuration of its own under `e2e/`, never run by the check), the imagery replaced by a plain ground and every
     other request leaving the machine refused; the shots of each how-to in a pure module, the crop computed from the
     roof's corners (tested with `bun test`); JPEG at twice the pixels into `apps/web/public/help/<place>/<name>/`.
  2. **Steps and pictures in the help kit:** `components.md` first ("How-to steps and pictures"), the token
     `shadow-help-ring`, the kit page; `Steps`, `Step`, `Picture` (callouts and rings over it, their words under it),
     `Key`, `Pointer` and `Touch`; the gate: each picture is there, has its words for a screen reader, at most three
     callouts numbered from 1, each inside it. The first how-to, "Move or turn the roof".
  3. **The ways in:** the ? beside Find's panel title opens the how-to of what the hand can do now (a pure function of
     the outline's state and the tool, tested; no ? while there is no how-to for it); Show me how on a tip; on phone the
     disc in place of the toolbar's "Show the tips" ?, and each how-to of Find ending with "Show the tips on the map
     again".
  4. **A picture pressed opens at the screen's width** on touch, and pinches; Back or × returns to the step.
  5. **The how-tos of outlining:** Corners, Rectangle, Detect building.
  6. **The how-tos of obstacles:** Box, Tank, Wall, Building; move, turn or delete an obstacle; undo, redo and clear.

## As built (session 19)

| Pull request | What |
|---|---|
| #123 | The registry, the keys, the state, the address; the generator (`bun help:gen`) and the gate (`tools/help`); `@next/mdx` with `remark-frontmatter` by absolute path; the first topic |
| #124 | The ? disc and the help sheet (kit components, `components.md` first), the Tooltip "with a summary"; mounted in the shell and on Find |
| #125 | The topics of the Strings and Array lenses' sections; `SectionHeading` |
| #126 | The topics of the Roof and Sun lenses and of Find (21 topics in all); the coverage gate (`tools/help/coverage.ts`); a section's options listed in the code's order |
| #127 | Keys pressed in an open dialog stay there (`components/shell/keys-held.ts`): Escape in the sheet no longer took back a corner on Find, nor Cmd+Z undid the design behind it |
| #128 | The sheet's title, headings and Related in the light of a section heading (the owner, session 19) |

**How to write a topic:** `docs/help-content.md`, linked from both `CLAUDE.md` files.

**What changed from the plan:**
- No `<Value of="…"/>`: a number that lives in the code is said in words or quoted as the screen shows it in a code span;
  the gate refuses a number typed with its unit.
- The frontmatter is read by a small reader of our own (`tools/help/frontmatter.ts`), not `zod`.
- The components are in `apps/web/components/shell/help`, a part both Find and the workspaces use.
- The option lists the gate reads moved into small pure modules (`lib/geometry/roof-types.ts`, `lib/studio/voltages.ts`,
  `lib/outline/shapes.ts`, `lib/flow/day-choices.ts`), as the tools' typecheck has no DOM and no JSX.
- Below desktop, Find's roof type is a segmented control without a heading (the boards), so it has no ? there.

**Found while writing the topics (each read in the code; not fixed, for the owner to order):**
- With a row pitch entered, the line "Shade-free would be …" shows the pitch used, not the shade-free one.
- The module card's source "Coefficients (PAN file)" holds for the Voc coefficient only.
- The verdict says "fits" beside an exclamation mark.
- A new module keeps a Voc coefficient that was entered for the one before.
- Sloped chosen on Find gives another roof than Sloped chosen in the Roof lens (the parapet and the pitch).
- Trees are lost when a roof is edited and built again (`obstaclesOfMap` leaves them out).
- `Long side faces` 0 and 180 give the same roof.
- The places in the corner table are centred again on Build.
- "Kept clear" counts area even when shaded positions are allowed.
- The functional inventory says walkway "rows" where the code counts units, and a latitude of ±90 where the inventory says ±80.
- Near shading counts sky hidden by the horizon.
- The text of the sloped roof's azimuth line.
- On phone the grip's press area lies over the sheet's ×; both close it.
