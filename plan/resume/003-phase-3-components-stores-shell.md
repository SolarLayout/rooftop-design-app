# 003: Phase 3, the rest: components of round 4, stores, data flow, shell

Written: 2026-09-29, by session 3. Status: open.

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session: the rest of Phase 3, the design
system as code and the app shell.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md, plan/SESSIONS.md, plan/README.md
(decisions D27 to D33 are of this phase), plan/sessions/003/record.md, plan/phase-03-design-system-shell.md
("As built, so far"), then docs/design: README.md, information-architecture.md, design-tokens.md,
components.md (its part "Round 4" describes the two newest boards), guidelines.md. Open the previews in
docs/design/previews of the kit board, of "Controls, part 2", of "Shell states" and of the Studio on desktop,
tablet and phone, and their sources in docs/design/mockups (Kit, Controls2, ShellStates, Main,
StudioTablet, StudioPhone, StringsLensNoVoltage): the exact values are inline styles there.
Read the code that exists before you add to it: apps/web/app/globals.css and globals.test.ts,
apps/web/components/ui (Button and button-look.ts, NumberField with use-number-entry.ts and
number-entry.ts, Segmented with choice-keys.ts), apps/web/components/kit, e2e/kit.ts, e2e/screens.ts,
e2e/tests/kit-*.e2e.ts. New components follow their pattern.
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests,
the running stacks and a green `bun check`.

Everything below has an approved design, but Tabs. Build each part as its own pull request, test first,
in this order. After each merge tell me in a few lines what is there and what you decided.

  1. The guard against raw values (apps/web/components/tokens-only.test.ts) reads *.ts as well as *.tsx,
     test files left out. button-look.ts and field-look.ts keep classes in .ts files.
  2. Slider and RangeSlider (components.md; Main.dc.html "Tilt" and "Shade-free window"; handles of 18 on
     desktop, 26 on touch). The steps, the value at a position of the pointer and the keys are pure
     functions, tested with `bun test`. `role="slider"` with its value in words; arrows, Page Up and Down,
     Home and End. The two handles of a range never pass each other. A drag changes what is shown; the
     value is committed when the drag ends or a key is released.
  3. Sheet: the bottom sheet of the phone, with its drag handle and three stops (peek, half, full).
     Where the stops are is a pure function. It can be moved by keyboard.
  4. ProgressRing and Skeleton.
  5. Tooltip and Toast. A toast of something done leaves after 5 s and stays under the pointer; one with
     a note stays until closed. The queue of toasts is a store without React, tested with `bun test`.
  6. Select, and with it the list that floats, which the project switcher uses too.
  7. Dialog: the focus goes in, stays in, and goes back. On phone it is a Sheet.
  8. FileDrop. It gives the file to who uses it; the reading and the refusal are states it is given.
  9. Table, and its cards on phone.
 10. Stores (Zustand): the project (the .rtd document), the results (last answer, status, progress), the
     view (lens, camera preset, sun time). Narrow selectors only. Tested with `bun test`, without React.
 11. Data flow: a committed edit changes the project store, which asks for the layout at once and for the
     design run after a pause; results of before stay visible and are marked as updating. The calls go
     through apps/web/lib/api and nothing else. A run that is overtaken by a newer edit is given up
     (AbortSignal); its result never replaces a newer one. Tested with a stand-in for the client.
 12. Formats of numbers for the vitals (guidelines.md, "Numbers and units"), as pure functions.
     number-entry.ts has `shown`; build on it, do not write it twice.
 13. Routes with placeholders: /, /studio/[lens], /performance, /handover/[item]. An unknown lens or item
     is not found.
 14. Shell: top bar at its three sizes, workspace navigation (top on desktop and tablet, bottom tab bar
     on phone), project switcher closed and open, the state of saving, Present (shown, cannot be used
     before Phase 10) and Export (leads to Handover), the vitals in every state of components.md
     ("Vitals bar" and "Vitals: states"), the drawer of notes to review.
 15. The vitals show the numbers of the demo from the API: 617.8 MWh, 357.28 kWp, 275 kW, DC/AC 1.30,
     638 modules, PR 86.6 %, 1,729 kWh/kWp. Before a system voltage is chosen: the roof and the positions
     only, and what is waited for, in the words of the API (`no_options`).
 16. Browser tests of the shell on 390, 834 and 1440: it renders and navigates; no horizontal scroll at
     any width from 360 up; baselines of the shell, compared with the previews by eye; an axe check
     without serious or critical findings.

Tabs has no design. The owner keeps it in the phase (D33). Draw it in the format of the mockups
(docs/design/mockups/build_phase3_boards.py writes the boards of round 4; add to it), render a preview,
put both into the repo as a proposal, show it to me, and build it after my approval. Do this early, so
that my answer does not hold the end of the phase up. Publish to the canvas only after I approved the
board.

Then close the phase: acceptance in plan/phase-03-design-system-shell.md met and written up under
"As built"; status set in plan/README.md; plan/STATE.md rewritten; the record of the session in
plan/sessions/004; the status of this file set to "used" in plan/resume/README.md. Then tell me the
state in a few lines.

Traps known at handover:
  - The token document and the stylesheet are held equal by a test. A value that is missing is added to
    docs/design/design-tokens.md and to globals.css in the same pull request as its first use, the
    document in a commit of its own. components.md names values of round 4 that are not tokens yet.
  - Tailwind's own theme is switched off. `text-sm`, `rounded-lg`, `bg-black`, `md:` make no CSS and no
    error: a control that looks unstyled has a class that does not exist. Breakpoints are `tablet:` and
    `desktop:`. Sizes are steps of 4 px with halves and quarters (`h-7.5` is 30 px).
  - A type style for desktop (`desktop:type-small`) sets a weight and wins over `font-medium`. Say the
    weight again for desktop.
  - States of a control are the variants `hovered:`, `pressed:`, `focused:`; `/kit` shows them with
    `shownAs`. Every new component is on `/kit` in every state, and the baselines of `/kit` are renewed
    in its pull request, after you looked at them.
  - Do not `git stash` and do not switch branches with uncommitted new files while the test stack runs.
    If `/kit` loses its styles: `bun stop --profile test`, delete apps/web/.next-test, start again.
  - Never undo a trial edit with `git checkout <file>` when the file holds other uncommitted work.
  - `next build` with another build directory writes into apps/web/tsconfig.json. Undo that.
  - The pull request check took 6 min 43 s at the end of session 3. If one passes 7 minutes, do what
    plan/STATE.md says about it under "Open items", as a pull request of its own.
  - The API's types come in two sets: `@rooftop/api-types` as the API hands out, with every field;
    `@rooftop/api-types/requests` as it takes. The project store holds the first.
  - A design run sends fewer progress events when its results were kept by the server. Progress is for
    showing, never for deciding that a run is over: the result is.
  - The demo has a system voltage. For the vitals before a voltage, take the demo and leave the voltage
    out; no store, control or fixture of the web app has a default for it.
  - The equipment of the demo names itself "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560" and
    "WattPower Systems Pvt.Ltd WP-330KTL-H1". The mockups show "Insolation INA-144MHC-TF-560". The shell
    shows no equipment; if a part of yours does, ask me which name to show before you shorten anything.
  - A status is a tick or an exclamation mark. There is no cross and no red, in any component or state.
  - `reactStrictMode` stays false. No 3D in this phase: the stage of the Studio is a placeholder.
  - New packages are pinned exactly (D4). Browser tests run locally in `bun check`, not in the pull
    request check (D20).
  - Every changed screen gets a screenshot at each size in its pull request: the baselines in
    e2e/baselines, linked by the commit (see pull request #29).

Rules for the whole session: production grade, test first and seen failing, one change per pull request,
tokens only, build to the mockup, never read or commit apps/web/.env.local, use the test stack only
(`bun dev:bg --profile test`), bun and uv only. You may commit, push and merge once the check is green.
A change to documents only goes to main directly, without a pull request (decision D26). Be brief,
decide small things yourself, ask me only for major decisions, one at a time, and show me each finished
part. Past two thirds of your context, finish the part in hand, update the state and hand over.

Start by telling me what you found at the start of the session, and the order you will work in.
```

## Notes for the owner

- Nothing to add with `/add-dir`: this part needs neither the desktop app nor the 3D reference project.
- Expect one question early: the drawing of Tabs, for your approval.
- The work is large: sixteen parts. Expect the session to hand over once or twice before the phase is
  closed; `plan/STATE.md` will say where it stands, and you can paste this prompt again, as the session
  reads the state first.
- Still open for you and Prasanta, not blocking this phase: the three questions in `plan/STATE.md`,
  "Open items", marked "Owner and domain expert".
