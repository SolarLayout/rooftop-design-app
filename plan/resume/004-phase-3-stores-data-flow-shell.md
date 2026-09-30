# 004: Phase 3, the second half: stores, data flow, routes, shell

Written: 2026-09-29, by session 4, at the owner's request. Status: used by session 5; the phase is closed.

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session: the second half of the rest of
Phase 3, which are steps 10 to 16 of plan/phase-03-rest-plan.md, and the close of the phase.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md, plan/SESSIONS.md, plan/README.md
(decisions D27 to D36 are of this phase), plan/phase-03-rest-plan.md (the steps, the decisions taken, and
"What session 4 found for the steps that remain"), plan/sessions/004/record.md ("Why things are the way they
are" and "What was tried and dropped" save you hours), plan/phase-03-design-system-shell.md ("As built, so
far"). Then docs/design: README.md, information-architecture.md, design-tokens.md (with "Numbers in code"
and "In code"), guidelines.md ("Numbers and units", "States every screen must handle", "Responsive rules"),
and of components.md: "Stat tile and vitals cell", "Vitals bar", "Lens rail and lens switch", "Bottom sheet",
and in "Round 4": "Vitals: states", "Notes to review, the drawer", "Project switcher, open", "State of
saving".
Open the previews in docs/design/previews: shell-states, studio-desktop, studio-tablet, studio-phone,
studio-strings-lens-no-voltage, performance-desktop, handover-desktop; and their sources in
docs/design/mockups (ShellStates, Main, StudioTablet, StudioPhone, StringsLensNoVoltage, Performance,
Handover): the exact values are inline styles there.
Read the code that exists before you add to it:
  - apps/web/lib/api (client.ts, types.ts, errors.ts) and packages/api-types/src/index.ts for the shapes
    Project, DesignResult, Option, Energy, NoOptions, LayoutReadouts, Equipment, DesignProgress;
  - apps/web/components/ui, all of it. The shell is built of these and of nothing new: Stat and Stats,
    StatusMark, ProgressRing, RunStep, Skeleton, FloatingPanel with use-floating.ts and list-look.ts (the
    project switcher), Sheet, SheetGrip, Dialog, Toaster with toast-queue.ts, Tooltip, Segmented, Button,
    ButtonLink, IconButton, measures.ts, design-numbers.ts, number-entry.ts (`shown`, `withUnit`);
  - apps/web/components/kit (Pages.tsx has the list of the pages of the kit), e2e/kit.ts, e2e/screens.ts,
    e2e/fixtures.ts, e2e/tests/kit.e2e.ts (the same list), kit-select.e2e.ts and kit-tooltip-toast.e2e.ts
    (a popover in a test; a clock that stands still), api-client.e2e.ts (the demo with and without a
    system voltage).
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests, the
running stacks and a green `bun check`.

Build steps 10 to 16 of the plan in its order, in ONE pull request (decisions D34 and D36), from a branch
`feat/phase-3-stores-shell`. Each step is one commit, test first and seen failing; where a token is new,
the document comes first, in a commit of its own. `bun check` green before every commit. Open the pull
request as a draft after step 10, so that its check runs on every push. After each step tell me in a few
lines what is there and what you decided.

  10. Stores (Zustand, vanilla stores, tested without React): the project (the .rtd document, as the API
      hands it out), the results (layout, design, status, progress, which edit they belong to), the view
      (lens, camera preset, sun time). Narrow selectors only.
  11. Data flow: a committed edit asks for the layout at once and for the design run after a pause of
      500 ms. A run that is overtaken is given up by its AbortSignal; a late answer never replaces a newer
      one. Results of before stay and are marked as updating. The calls go through apps/web/lib/api and
      nothing else. Tested with a stand-in for the client and a clock that is given.
  12. Formats of the vitals as pure functions, on `shown` and `withUnit` of number-entry.ts.
  13. Routes with placeholders: /, /studio/[lens], /performance, /handover/[item]. An unknown lens or item
      is not found.
  14. Shell: top bar at its three sizes, workspace navigation (top on desktop and tablet, bottom tab bar on
      phone), project switcher closed and open, the state of saving, Present (shown, cannot be used
      before Phase 10) and Export (leads to Handover), the vitals in every state, the drawer of notes.
      A third page of the kit, /kit/shell, shows the states of the shell.
  15. The vitals show the numbers of the demo from the API: 617.8 MWh, 357.28 kWp, 275 kW, DC/AC 1.30,
      638 modules of 790, PR 86.6 %, 1,729 kWh/kWp. Before a system voltage: the roof and the positions
      only, and what is waited for, in the words of the API (`no_options`).
  16. Browser tests of the shell on 390, 834 and 1440: it renders and navigates; no horizontal scroll at
      360, 390, 640, 834, 1100, 1101 and 1440; baselines of the shell, compared with the previews by eye;
      an axe check without serious or critical findings.

Then close the phase: acceptance in plan/phase-03-design-system-shell.md met and written up under "As
built"; status set in plan/README.md; plan/STATE.md rewritten; plan/phase-03-rest-plan.md marked as done;
the record of the session in plan/sessions/005; the status of this file set to "used" in
plan/resume/README.md. Then tell me the state in a few lines.

Traps known at handover, beside those of resume prompt 003, which all still hold:
  - Tailwind's own theme is switched off. A class that does not exist makes no CSS and no error.
    Breakpoints are `tablet:` and `desktop:`. States are `hovered:`, `pressed:`, `focused:`, and
    `within-hovered:` for what is directly inside a control under the pointer.
  - The only inline style is `style={measures({...})}`: shares (`at`, `span`) and places in pixels (`x`,
    `y`), read by `left-at`, `w-span`, `h-span`, `placed`. The guard refuses every other style, a value in
    square brackets, and a width of a line given as a number (`border-2`). A new measure gets its utility
    in globals.css and its test in globals.test.ts.
  - A number that code needs (a time, a gap) goes into components/ui/design-numbers.ts AND into the table
    "Numbers in code" of docs/design/design-tokens.md. A test holds them equal. The pause of 500 ms before
    a design run is such a number.
  - `react-hooks/refs` takes an object that holds a ref for a ref and refuses every read of it while
    rendering. A hook gives the ref of an element back beside its state (see use-floating.ts), or finds
    the element from the event.
  - `hidden` on an element that has `flex` or `inline-flex` of its own does not hide it: same weight, the
    later one wins. Put what hides on an element of its own. `tablet:hidden` over `flex` works.
  - A popover and a dialog are hidden by the browser while closed: show them with `open:flex`, never with
    `flex`. What is not seen cannot take the focus.
  - In a browser test: bring an example into view before the pointer is placed by its box; test the size
    of what turns by its style; for times, `page.clock.install` before the page and `page.clock.pauseAt`
    after it, then `runFor`.
  - A new page of the kit is added to components/kit/Pages.tsx and to the list in e2e/tests/kit.e2e.ts.
  - The demo has a system voltage. For the vitals before a voltage, a browser test takes the answer of
    /api/demo on its way and leaves the voltage out (`page.route`, `route.fetch`): that stays on this
    machine. No store, control or fixture has a default for the voltage.
  - The words of the API for a missing voltage are: title "Choose a system voltage to size the strings",
    message "600, 1000 or 1500 V. Nothing is sized until you choose." The board "Shell states" draws
    other words ("Energy is waiting for the system voltage"). The work order asks for the words of the
    API. If the two cannot both be served, ask me before you choose.
  - Notes to review are what the API calls notes of the module, of the layout and of the weather. The
    API gives the reason of a note, not the short title that the mockups draw over it ("Voc
    coefficient"); the plan says how the title is made. `options_note` and `far_shading_note` are no
    notes to review.
  - A design run of the demo takes 12 s the first time and 0.2 s when the server kept its results. A test
    of the shell waits for the result, never for a time. Progress is for showing, never for deciding that
    a run is over.
  - The shell shows no equipment. If a part of yours does, ask me which name to show before you shorten
    anything.
  - A status is a tick or an exclamation mark. There is no cross and no red, in any component or state.
  - The check of the pull request took 3 min 33 s to 6 min 27 s in session 4. If one passes 6 min 30 s,
    do what plan/STATE.md says about it under "Open items", as a pull request of its own.
  - To look at a screen, take its picture with the browser of the tests (a script of a few lines with
    `chromium` of @playwright/test, against the ports of .dev/test/pids.json) and read the picture.
    Baselines are renewed with `bun tools/with-node.ts playwright test <name> --update-snapshots` in e2e/,
    after you looked at the new picture.
  - Do not `git stash` and do not switch branches with uncommitted new files while the test stack runs.
    A change to documents only goes to main from a worktree of its own (`git worktree add`), so that the
    branch of the work is not left.
  - The board of Tabs may not be on the design canvas yet: plan/STATE.md says whether it is. If it is
    not, do not publish it unless I tell you that the permission is there.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the
mockup, never read or commit apps/web/.env.local, use the test stack only (`bun dev:bg --profile test`),
bun and uv only. You may commit, push and merge once the check is green. A change to documents only goes
to main directly, without a pull request (decision D26). Be brief, decide small things yourself, ask me
only for major decisions, one at a time, and show me each finished part. Bring plan/STATE.md up to date on
main after steps 12 and 14. Past two thirds of your context, finish the step in hand, update the state and
hand over.

Start by telling me what you found at the start of the session, and the order you will work in.
```

## Notes for the owner

- What to expect: one pull request of seven commits of code and a few of documents. Steps 10 to 13 have
  nothing to look at; step 14 is where the shell appears, on `/kit/shell` and on the routes.
- What may need a decision: the words of the vitals before a system voltage (the API's or the board's);
  where the vitals sit on Performance and Handover, if their mockups leave it open.
- The two directories outside the repo (`rooftop-design`, `solar-mms-modeller`) are not needed for this
  slice.
- Before the session, or during it: the board of Tabs on the canvas, see `plan/STATE.md`, "Open items".
