# Writing the in-app help

How to add, change and wire a help topic so the gate passes the first time. The design is D80
(`plan/phase-14-in-app-help.md`); the look is in `docs/design/components.md`, "Help disc and help sheet".

## What is where

| What | Where |
|---|---|
| The topics, one MDX file each, and nothing else (the generator reads every file there as a topic) | `apps/web/content/help/<place>/<kind>/<name>.mdx` |
| The manifest (generated, committed) | `apps/web/lib/help/manifest.gen.ts`, written by `bun help:gen` |
| The types, keys, state, address | `apps/web/lib/help/` |
| The disc, the sheet, the body's kit | `apps/web/components/shell/help/` |
| The generator and the gates | `tools/help/` (`generate.ts`, `frontmatter.ts`, `checks.ts`, `options.ts`, `coverage.ts`) |

## The key

A topic's key is its path: `apps/web/content/help/studio/section/system-voltage.mdx` is
`studio.section.system-voltage`.

- **place**: `find`, `studio`, `performance`, `handover`, `home`, or `app` (used in more than one place, such
  as `app.section.roof-type`).
- **kind**: `section`, `setting`, `metric`, `deliverable`, `tool`, `concept`.
- **name**: lower case words joined by `-`, after the heading on screen (`Edges and access` is `edges-and-access`).

Renaming a file changes its key. Keep the old key working by putting it in the topic's `aliases`.

## A topic

```mdx
---
title: System voltage
summary: The highest DC voltage the system is built for. It caps how many modules can go in one string.
kind: section
values:
  "600": Strings stay at or under 600 V on the coldest morning of the site.
  "1000": Strings stay at or under 1000 V on the coldest morning of the site.
  "1500": Strings stay at or under 1500 V on the coldest morning of the site.
related:
  - studio.section.inverter
---

## How it limits a string

Plain words, in short paragraphs.

<Callout>One thing worth noticing.</Callout>
```

### The frontmatter

These fields and no others:

| Field | Rule |
|---|---|
| `title` | The heading as it reads on screen. 80 characters at most. |
| `summary` | One or two sentences, 140 characters at most. It is the tooltip on the disc and the lead of the sheet. |
| `kind` | The kind in the key. |
| `values` | Only for a section where one option is chosen. List every option the code offers, keyed by the id the code uses, with what each means (140 characters at most). The labels come from the code, never from here. |
| `related` | Keys of other topics, listed under Related at the foot of the sheet. |
| `aliases` | Old keys that still lead here. |

A summary or meaning that contains `: ` must be quoted, or YAML cannot read it. The generator names the file
when this happens.

### The body

- Use `##` headings; the sheet draws them one size down. Keep it short: two to four headings.
- Write the user's own on-screen words in code spans: `` `Modules in series` ``, `` `Build this roof` ``.
- **Never type a number with its unit** (`1.5 m`, `600 V`, `30°`). Values change in the code and the text
  would then be wrong. Say it in words ("the parapet's height"), or quote the on-screen words in a code span.
  The gate refuses a typed number.
- Use only these components: `<Callout>` for a note, and `<HelpLink k="studio.section.inverter">the
  inverter</HelpLink>` to open another topic in the sheet, with Back. A topic imports nothing.
- Every claim must be true of the code. Before writing a claim, read the engine (`apps/api/src/rooftop_core`)
  or the component it describes. Never use the word "bankable". Never write that a system voltage is chosen for
  the user.

## A section with options

When the section's options change, or a section gets options:

1. The option list must live in a small pure module that the tools can import (examples:
   `apps/web/lib/geometry/roof-types.ts`, `lib/studio/voltages.ts`, `lib/outline/shapes.ts`,
   `lib/flow/day-choices.ts`). It cannot sit in a component, because the tools typecheck has no DOM and no
   JSX. It must also respect the check groups: a base folder such as `lib/flow` cannot import a group folder
   such as `lib/studio` (`docs/checks.md`).
2. Name it in `OPTIONS_OF` in `tools/help/options.ts` under the topic's key, as `{ id, label }` in the order
   the screen shows them. The sheet lists them in that order, whatever the order in the topic.
3. Write one `values` entry per id in the topic.
4. Pass the chosen value to the disc (`value=`), so the sheet marks it "Your choice".

## Wiring a disc

Every section heading of an input panel carries its disc. Draw the heading with `SectionHeading`, never as a
bare `<h2 className={SECTION}>`:

```tsx
<SectionHeading help="studio.section.system-voltage" value={chosen}>System voltage</SectionHeading>
```

`help` is typed (`HelpKey`), so an unknown key does not compile. The provider (`HelpProvider`) is already
mounted by the shell and by Find. A heading that rightly has no disc is named in `WITHOUT_A_DISC` in
`tools/help/coverage.ts`, with the reason.

## A how-to

A tool, a gesture, anything done in steps is written as a how-to (D81; `components.md`, "How-to steps and pictures"):

```mdx
<Steps>
<Step title="Pick the roof up">
<Pointer>Click inside the roof, away from a corner and from an obstacle.</Pointer>
<Touch>Press inside the roof, away from a corner and from an obstacle.</Touch>
<Picture src="/help/find/move-the-roof/1.jpg" alt="The closed roof on the map, its corners and the lengths of its edges shown" width={1038} height={544}>
  <Mark n={1} x={22} y={38.1} ring>Inside the roof, on a clear spot</Mark>
</Picture>
</Step>
</Steps>
```

- **Steps** are numbered in their order; a step's `title` says what to do, in a few words.
- **Pointer** and **Touch** hold the words of a mouse and of touch; a step that is the same for both needs neither.
  **Key** puts a key or a gesture in the chip of the tips: `<Key>Shift</Key>`.
- **Picture:** `src` under `/help/`, taken by `bun help:pictures` (below); `alt` says what it shows, for a screen reader;
  `width` and `height` are the file's own (the gate reads them from it).
- **Mark:** at most three a picture, numbered 1, 2, 3 in order; `x` and `y` are where it points, in per cent of the picture
  from its top left; `ring` circles what to act on (one a picture, as a rule); its words are read under the picture.
  To place one, open the picture, read the pixel and divide by its width or height.

## Pictures

A how-to's pictures (D81) are taken from the app by a script, never drawn, never edited after: when a screen changes, they
are taken again and the change is seen in the pull request.

- **What each picture shows** is written in `tools/help/pictures.ts`, in `HOW_TOS`: the how-to's folder (`find/corners`),
  the window it is taken in, how it begins (`edit`: the demo roof opened by Edit; `place`: the demo's place searched with
  nothing drawn), steps of `zoomIn` for something small, what is kept (the roof with a margin, or a part of a size round the
  map's middle or round a place in metres from it), and per picture the acts of the hand after the picture before it:
  `tool` (a tool chosen), `corner` (a press on the map), `click` (inside the roof), `drag` (from a spot of the roof),
  `draw` (from one place of the map to another), `turn` (a handle, by its name, round the roof's middle), `found` (Detect
  building pressed until a footprint is proposed), `press` (a button, by its name). A spot is a fraction of the roof's
  box; a place is metres east and north of the map's middle, turned into pixels with the scale bar. A drag, a draw or a
  turn that is `held` is caught before the button is let go.
- **Take them:** `bun help:pictures` (every how-to) or `bun help:pictures -g <folder>` (one). It runs Playwright on the test
  stack (`e2e/help-pictures`, its README says what each file does) and writes `apps/web/public/help/<folder>/<n>.jpg`, the
  number being the step's.
- **The rules they keep:** the demo roof; the plain ground in place of the satellite imagery (`e2e/help-pictures/ground.jpg`:
  no imagery to license, nothing behind the roof); twice the screen's pixels; JPEG at quality 82, about 60 kB each; nothing
  leaves the machine. The callouts are never drawn into a picture: the topic places them over it.
- **Before the commit:** look at every picture; commit them with the topic that shows them; put them in the pull request.
- **A new how-to** that needs a state the acts cannot reach (an obstacle drawn, a tool chosen): add the act to `Act` in
  `tools/help/pictures.ts` with its test, and to `act()` in `e2e/help-pictures/help-pictures.ts`.

## Clips

A step whose gesture a still shows least can also play a short clip in its picture's frame (Phase 15; D82 to D84). Like the
pictures, clips are made from the app by a script, never filmed or edited: `e2e/help-clips/README.md` says what each file
does, how to make one and how to add one.

- **What each clip shows** is written beside the how-to's pictures, in `tools/help/pictures.ts`, as `clips`: named for the
  step it plays in (its picture is its poster), `before` (the pictures' acts that put the map where the step begins, done
  unseen) and `acts` (recorded at the pace of `tools/help/clips.ts`: `rest`, `click`, `drag`, `turn`).
- **Make it:** `bun help:clips` (every clip) or `bun help:clips -g <dir>/<step>`; it writes
  `apps/web/public/help/<dir>/<step>.mp4`, H.264 at 30 frames a second (D83), encoded by the pinned
  `@ffmpeg-installer/ffmpeg` that `bun install` brings.
- **The rules it keeps:** made on the test stack on the plain ground, the pointer drawn as a dot (white, the accent while it
  presses); ends as it began, as it loops; 500 kB at most, 6 MB for all (D82); every step keeps its picture.
- **Before the commit:** play it; its first and last frames match; the pointer shows at each press; the labels are sharp.
- **Put it in the topic** on its step's picture, with its length as `bun help:clips` printed it:
  `<Picture clip="/help/find/move-the-roof/4.mp4" length="0:07" src="/help/find/move-the-roof/4.jpg" …>`. The gate
  holds the clip to its file (there, an MP4, of that length) and the budget (500 kB a clip, 6 MB for all, D82).

## Keys in the sheet

The sheet is a modal `<dialog>`: its keys are its own. A new handler of keys on the page (`window.addEventListener("keydown",
…)`) asks `isKeyHeld(keyTargetOf(event))` (`apps/web/components/shell/keys-held.ts`) first and leaves a key held in a field
or an open dialog alone; otherwise Escape in the sheet, or an undo, reaches the design behind it.

## The steps, every time

1. Write or change the `.mdx`.
2. `bun help:gen`, then commit `apps/web/lib/help/manifest.gen.ts` with the topic.
3. `bun test tools/help`: the gate (links, aliases, options, typed numbers, the manifest is fresh) and the
   coverage of the headings.
4. Open the topic in the browser on the test stack (`/studio/strings?help=studio.section.system-voltage` opens
   it directly) at 1440, 834 and 390.
5. `bun check --skip=e2e` before the commit. A topic is a base input of the browser groups (`docs/checks.md`).

## What the gate says, and what to do

| Message | Do |
|---|---|
| `a link to "…", which is no topic` | Fix the key, or write the topic. |
| `values miss …, which the code offers` | Add a meaning for each option the code now has. |
| `values name …, which the code does not offer` | Remove it, or fix the id. |
| `the section offers …; say what each means in values` | Add `values`. |
| `"…" is a number typed with its unit` | Say it in words, or quote the on-screen words in a code span. |
| the manifest test fails | Run `bun help:gen` and commit the manifest. |
| `… is not in apps/web/public; take it with bun help:pictures` | Take the picture, or fix `src` |
| `… is W × H, not … as written` | Write the file's own `width` and `height` |
| `… has no alt` | Say what the picture shows |
| `… has N callouts; three at most`, `… numbered …`, `… is outside it`, `… has no words` | Fix the `Mark`s: 1 to 3 in order, `x` and `y` from 0 to 100, words in each |
| `… is not in apps/web/public; record it with bun help:clips` | Record the clip, or fix `clip` |
| `… runs 0:06, not … as written`, `… has no length` | Write the clip's own length |
| `… over 500 kB a clip`, `the clips are … in all` | Record it shorter or calmer; fewer clips (D82) |
| `… draw it with SectionHeading and a topic` | Use `SectionHeading`, or name the heading in `WITHOUT_A_DISC` with why. |
