# 002: Phase 3, design system and app shell

Written: 2026-09-29, by session 2. Status: open.

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session: Phase 3, the design system as
code and the app shell.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md, plan/SESSIONS.md, plan/README.md,
plan/sessions/002/record.md, plan/phase-03-design-system-shell.md, plan/phase-00-design.md ("Still to
draw"), then all of docs/design: README.md, information-architecture.md, design-tokens.md, components.md,
guidelines.md. Open the previews in docs/design/previews of the Kit board and of the Studio on desktop,
tablet and phone, and their mockup sources in docs/design/mockups (Kit.dc.html, Main.dc.html,
StudioTablet.dc.html, StudioPhone.dc.html): the exact values are inline styles there.
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests,
the running stacks and a green `bun check`.

Step 1. Before any code, tell me what of the scope has a design and what has not. Go through the list of
components and of the parts of the shell in plan/phase-03-design-system-shell.md, one by one, against
docs/design/components.md and the mockups. For each: designed (where), or not designed. Known at handover:
components.md has no entry for IconButton, Stepper, Select, FileDrop, Dialog, Tooltip, Toast, Table, Tabs,
Skeleton and ProgressRing; check the mockups for each before you call it missing. What is not designed is
designed first, shown to me and built after my approval (CLAUDE.md, "Design"). Propose the order: what can
be built now, what waits for a design. Then start with what can be built now.

Step 2. Build, each part as its own pull request, test first:
  - Tokens: docs/design/design-tokens.md as CSS variables in apps/web/app/globals.css, mapped into
    Tailwind 4 with `@theme inline`. Theme by `data-theme`; only "dusk" is filled in. A test holds that
    every token of the document is in the CSS with the same value, and the other way round.
  - Fonts: Bricolage Grotesque, Geist, Geist Mono. See the trap on fonts below.
  - Components in apps/web/components/ui, those that are designed: each usable by keyboard, labelled,
    with every state of components.md. Logic (NumberField: draft then commit, ranges, units; Slider
    steps) is pure and tested with `bun test`.
  - /kit (development only): every component in every state. It is what the screenshots are taken of.
  - Stores (Zustand): the project (the .rtd document), the results (last answer, status, progress), the
    view (lens, camera preset, sun time). Narrow selectors only. Tested with `bun test`, without React.
  - Data flow: a committed edit changes the project store, which asks for the layout at once and for the
    design run after a pause; results of before stay visible and are marked as updating. The calls go
    through apps/web/lib/api and nothing else. A run that is overtaken by a newer edit is given up
    (AbortSignal); its result never replaces a newer one. Tested with a stand-in for the client.
  - Shell: top bar, workspace navigation (top on desktop and tablet, bottom tab bar on phone), project
    switcher, save state, entries for Present and Export, the vitals bar in its three forms, the drawer
    of notes to review. Routes with placeholders: /, /studio/[lens], /performance, /handover/[item].
  - The vitals show the numbers of the demo from the API: 617.8 MWh, 357.28 kWp, 275 kW, DC/AC 1.30,
    638 modules, PR 86.6 %, 1,729 kWh/kWp. Before a system voltage is chosen: the roof and the positions
    only, and what is waited for, in the words of the API (`no_options`).
  - Browser tests on 390, 834 and 1440: the shell renders and navigates; no horizontal scroll at any
    width from 360 up; screenshots of /kit and of the shell stored as baselines and compared with the
    previews by eye; an axe check without serious or critical findings.

Step 3. Close the phase: acceptance in plan/phase-03-design-system-shell.md met and written up under
"As built"; status set in plan/README.md; plan/STATE.md rewritten; the record of the session in
plan/sessions/003; this file's status set to "used" in plan/resume/README.md. Then tell me the state in
a few lines.

Traps known at handover:
  - Fonts. `next/font/google` fetches the fonts from Google when the app is built or first compiled.
    Tests never touch the network, and CI builds must not depend on it. Decide how the fonts come into
    the repo (the `geist` package and font files with `next/font/local` are candidates), check the
    licence of each font, and tell me what you decided.
  - The API's types come in two sets: `@rooftop/api-types` as the API hands out, with every field;
    `@rooftop/api-types/requests` as it takes, where a field with a default may be left out. The project
    store holds the first. apps/web/lib/api/types.ts has the names.
  - A design run sends fewer progress events when its results were kept by the server. Progress is for
    showing, never for deciding that a run is over: the result is.
  - The equipment of the demo names itself "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560" and
    "WattPower Systems Pvt.Ltd WP-330KTL-H1". The mockups show "Insolation INA-144MHC-TF-560". Ask me
    which to show before you shorten anything.
  - A status is a tick or an exclamation mark. There is no cross and no red, in any component or state.
    StatusMark has two forms.
  - The system voltage has no default in any store, control or test fixture of the web app.
  - `reactStrictMode` stays false. No 3D in this phase: the stage of the Studio is a placeholder.
  - New packages are pinned exactly (D4); `@axe-core/playwright` is one. Browser tests run locally in
    `bun check`, not in the pull request check (D20).
  - The pull request check took up to 6 min 11 s at the end of Phase 2 and may take 10. If it passes
    7 minutes, do what plan/STATE.md says about it under "Open items", as a pull request of its own.
  - Every changed screen gets a screenshot at each size in its pull request (apps/web/CLAUDE.md, rule 7).

Rules for the whole session: production grade, test first, one change per pull request, tokens only,
build to the mockup, never read or commit apps/web/.env.local, use the test stack only
(`bun dev:bg --profile test`), bun and uv only. You may commit, push and merge once the check is green.
A change to documents only goes to main directly, without a pull request (decision D26). Be brief,
decide small things yourself, ask me only for major decisions, one at a time, and show me each finished
part. Past two thirds of your context, finish the part in hand, update the state and hand over.

Start by telling me what you found at the start of the session, and then the list of step 1.
```

## Notes for the owner

- Nothing to add with `/add-dir`: this phase needs neither the desktop app nor the 3D reference project.
- Expect a question early: the list of what has no design yet (step 1). Eleven components of the phase have
  no entry in `docs/design/components.md`. Those wait for a design and your approval; the rest is built.
- Expect two more: how the fonts come into the repo, and which names of the equipment to show.
- The phase is large. The session may hand over before the shell is complete; `plan/STATE.md` will say
  where it stands.
- Still open for you and Prasanta, not blocking this phase: the three questions in `plan/STATE.md`,
  "Open items", marked "Owner and domain expert".
