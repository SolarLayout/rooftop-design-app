# Phase 16: plan

What the phase is and why: `phase-16-system-voltage.md`. This file is how it is done, in order. The boards "System voltage ·
Set by the user's country" were approved by the owner on 2026-10-08 (session 22); they are the specification of every screen
here. A decision proposed here takes a number (D88 onwards) once the owner keeps it.

## How the phase works
- The owner's standing instructions hold: run solo; each pull request merged on a green fast check (`bun check --skip=e2e`),
  one after the other, no stacked branches; no browser suites run and no new UI tests (memory, session 18; session 22: "we
  can skip e2e and look at browser tests later"); each change checked by hand in the browser on the test stack at three
  sizes, its screenshots in its description (`docs/screenshots.md`); documents to `main` alone (D26).
- Test first for every piece of logic (`bun test`, pytest). The browser suites that assert the old behaviour ("no voltage,
  nothing preselected") are changed by reading, in the pull request that changes the behaviour, and say so; they are run
  when the owner says.
- The prototype on the local branch `design/system-voltage` is a picture of the screens, not code to keep: nothing is copied
  from it but what the boards show.

## What was found
- **The engine and the API need no default.** `Project.system_voltage` is `None` until set (`rooftop_core/project.py:44`); the
  API answers `system_voltage_missing` without one (`services/design.py:34`). Kept: a project sent without a voltage still
  waits. What they lack is where the value came from, which the design must keep (question 2 of the phase): a field of the
  project, written into the `.rtd` and read back (the engine writes the format, D7).
- **The country is not known anywhere today.** The web app runs on Vercel (D58), which adds `x-vercel-ip-country` to every
  request; a route handler of the web app can read it (`app/app-icons/[file]/route.tsx` is the only handler today). It is
  absent under `next dev` and on the test stacks: there the browser's time zone is the fallback, then India.
- **Time zone to country** needs a table: the tz database's `zone1970.tab`/`zone.tab` (public domain) maps every zone to its
  countries. Written once into a typed module with its source named; nothing fetched at run time.
- **A country's name** comes from the browser (`Intl.DisplayNames`, region), with "the" for the few names that take it
  (the United States, the United Kingdom, the Netherlands, the Philippines, the United Arab Emirates, …).
- **Where a new design is made**: `POST /roof/from-map` (Find), a drawing (`lib/flow/import-drawing.ts`), by hand; and a design
  is opened from the device or from a `.rtd`. Each is where the voltage is set if the design has none.
- **What the old flow leaves behind**: the decision card and the waiting list (`SystemVoltage.tsx`: `VoltageDecision`,
  `WaitingAndDone`), the `before-a-voltage` view (`lib/studio/strings-view.ts`), Home's "waiting for a voltage"
  (`lib/home/cards.ts:35`), the stage's words for `system_voltage_missing` (`stage-view.ts:33`), the kit's shell example, and
  the coverage gate's exception for the card (`tools/help/coverage.ts:11`). With a voltage always set by the web app, these
  cannot be reached from the app: they are removed (no dead code). The vitals keep showing the API's reasons in its own words
  (D37), so a project without a voltage from elsewhere is still said.
- **Tests that assert the old behaviour**: unit tests (`strings-view.test.ts`, `cards.test.ts`, `stage-view.test.ts`,
  `vitals-view.test.ts`, `results-store.test.ts`, `words.test.ts`, `sun-figures.test.ts`, `client.test.ts`) and browser suites
  (`strings-lens.e2e.ts`, `strings-states.e2e.ts`, `studio-screens.e2e.ts`, `home.e2e.ts`, `shell-vitals.e2e.ts`,
  `api-client.e2e.ts`).

## The help (in-app topics and the guide)
Every topic that speaks of the voltage is read against the new behaviour and changed where it is wrong; `bun help:gen` and the
manifest committed with them; the gate (`bun test tools/help`) green; each topic opened in the sheet at three sizes.

| Topic | Change |
|---|---|
| `studio.section.system-voltage` | Rewritten. Summary: what it is and that the app starts it from the user's country. Keeps "How it limits a string". "Nothing is chosen for you" becomes "Where it starts" (the lowest choice in the United States and Canada, the limit for homes there, NEC 690.7 and CE Code Section 64; the middle choice elsewhere; India when the country cannot be found; the words beside the heading say who set it). New: "When the equipment is rated lower" (the value is never moved; the strings are sized to the equipment's limit, and the lens says so; for a value you chose, with the exclamation mark and a button to match), "Going higher" (the app never raises it; the offer; only where the site's code allows). The callout on the cable of the bill of materials stays. Numbers with units only as on-screen words in code spans (the gate). `values` unchanged (the three ids) |
| `studio.section.modules-in-series` | "It appears once a system voltage is chosen" goes: the range shows from the first run. The rest is true |
| `studio.section.inverter` | "Change": inverters rated under the voltage set carry the exclamation mark and its reason; the strings are then sized to the inverter's limit |
| `studio.section.module` | Read; its sentence on the module's highest system voltage is true (one of the limits) |
| `studio.section.options` | Read; true as it is (no voltage wording to change) |
| `docs/help-content.md` | The rule "Never write that a system voltage is chosen for the user" becomes: say who set it (the app, from the user's country, or the user), never that the app chose it for the site; the example topic's frontmatter kept in step with the real one |

## Steps

### 1. Engine and API: who set the voltage (pull request 1)
- `Project.system_voltage_by: "app" | "user" | None` beside `system_voltage` (engine and API schema); `None` with no voltage.
  Read from and written to the `.rtd`; a file without it reads as `"user"` when it has a voltage (a voltage in a file of before
  was chosen by someone). No behaviour of the engine changes: sizing, results, exports as before.
- Tests first: the round trip of the `.rtd`, the reading of a file without the field, the API's schema; the demo numbers
  unchanged (`tests/engine/test_demo_numbers.py`).
- `bun gen:api`; `packages/api-types` committed.

### 2. The country and the default (pull request 2, logic, no screen)
- `app/country/route.ts`: GET answers `{ "country": "IN" }` from `x-vercel-ip-country` (a valid ISO 3166-1 alpha-2, else
  `null`), `Cache-Control: no-store`. Kept nowhere. (Not under `/api`, which is the Python API's.)
- `lib/country/`: the time-zone table (generated once from the tz database, its source and release named in the file), `countryOf({ header, timeZone })` → the header's, else the time zone's, else `"IN"`; `nameOf(country)` with "the" where it belongs. Pure, tested.
- `lib/studio/voltage-default.ts`: `defaultVoltageOf(country)` (600 for US, CA and the NEC's territories PR, GU, VI, AS, MP;
  1000 else); `offerUp(volts, rating)` (the next of the three above, at or under the rating, or none). Pure, tested.
- The country asked once a visit, at the shell's start; until it answers, the time zone stands in, so a design is never left
  without a voltage.
- Applied: a new design (from the map, a drawing, by hand) and a design opened without a voltage get the default, `by: app`,
  as part of the edit that makes or opens them (no edit counted, nothing to undo). A choice in the lens sets `by: user`. The
  equipment never moves the value (D88).
- Unit tests first for each; the unit tests of the old flow changed.

### 3. The Strings lens, the picker, what goes (pull request 3, screens)
- The voltage section as the boards: beside the heading `Set for <country>` or `Your choice`; the line under the choice
  (the country's words); when the equipment is rated under the value, the plain line "Strings sized to <n> V, this
  inverter's limit" if the app set it, the note with the exclamation mark and `Use <n> V` if the user chose it (D88); the line and `Use <n> V` when the inverter takes more (`offerUp`), and its words when no string
  length fits. Words from one pure module (`lib/studio/voltage-words.ts`), tested.
- The picker: an inverter rated under the voltage set carries the exclamation mark and "Up to <n> V: strings sized under the
  <n> V set" under its maker; a marked row grows to hold it, on three sizes.
- Removed: the decision card, the waiting list, the `before-a-voltage` view, Home's and the stage's words for a missing
  voltage, the kit's example, the coverage gate's exception. Their tests go with them.
- The browser suites that assert the old flow are changed by reading (not run): a design built on the map now has a voltage
  (600 or 1000 by the time zone Playwright gives, set per suite with `timezoneId`), its options and energy.
- Checked by hand on the test stack at three sizes with `x-vercel-ip-country` sent and without it; screenshots of the five
  states of the boards in the description.

### 4. The help (pull request 4)
- The topics as in the table above; `bun help:gen`; the gate green; each topic opened at three sizes, its screenshots in the
  description.

### 5. The rules and the record (documents, to `main`)
- Hard rule 3 in `CLAUDE.md`, rule 5 in `apps/web/CLAUDE.md`, the docstring of `rooftop_core/__init__.py` (with pull request 1),
  D10 marked replaced by D87, `docs/help-content.md`, `docs/design/components.md` (the voltage section and the picker's mark),
  `docs/design/README.md` (the boards approved, built), `STATE.md`, the phase's "As built".

## Decided while planning
**D88: the equipment never moves the voltage.** Found while planning: lowering the app's value to a class (as first approved)
shortens the strings: with the app's 1000 V and an inverter of 800 V, 600 V allows 11 in series (Voc 561 V) where the inverter
allows 15 (about 765 V). The owner (session 22): "go with your recommendation". So the value stays as set, by the app or by
the user; the engine keeps every string under the equipment's rating as it does today (`stringing.py:57`). Under the choice:
- set by the app, equipment rated under it: a plain line, no mark, no button: "Strings sized to 800 V, this inverter's limit."
- chosen by the user, equipment rated under it: the note with the exclamation mark and `Use <n> V`, as approved.
- equipment rated over it: the offer up, as approved, whoever set it.
The board's third state ("An inverter of 800 V: the app's value down to 600 V") is superseded: it is taken again from the
build in pull request 3 and the boards rewritten with it.

## Risks
- **The header in production**: if Vercel's header is missing behind some proxy, the time zone decides; a VPN gives a wrong
  country. The value stays the user's to change, and the line says where it came from.
- **A design opened from another country** keeps its voltage: the default applies only when there is none.
- **The browser suites** are not run in this phase; they are changed by reading and run when the owner says.
