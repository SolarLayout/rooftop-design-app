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
| `… draw it with SectionHeading and a topic` | Use `SectionHeading`, or name the heading in `WITHOUT_A_DISC` with why. |
